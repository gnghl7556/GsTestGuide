import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = 'content';
const VIRTUAL_PREFIX = 'virtual:content/';

function readContentFiles(dir: string, ext = '.md'): { filePath: string; content: string }[] {
  const results: { filePath: string; content: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readContentFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push({ filePath: fullPath, content: fs.readFileSync(fullPath, 'utf-8').replace(/\r/g, '') });
    }
  }
  return results;
}

// --- Inline markdown parsing helpers (mirrors src/lib/content/markdownUtils.ts) ---

function extractSections(markdown: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const lines = markdown.split('\n');
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else if (currentHeading) {
      currentLines.push(line);
    }
  }
  if (currentHeading) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }
  return sections;
}

function findSection(sections: { heading: string; content: string }[], heading: string) {
  return sections.find((s) => s.heading === heading);
}

function parseCheckboxList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s*\[[ x]\]\s*(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

function parseBulletList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

function parseTable(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const headers = lines[0].split('|').map((h) => h.trim()).filter(Boolean);
  return lines.slice(2).map((line) => {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = cells[i] ?? ''; });
    return record;
  });
}

const PHASE_TO_CATEGORY: Record<string, string> = {
  '시험준비': 'SETUP',
  '시험수행': 'EXECUTION',
  '시험종료': 'COMPLETION',
};

function generateProcessModule(rootDir: string): string {
  const processDir = path.join(rootDir, CONTENT_DIR, 'process');
  const files = readContentFiles(processDir);

  const items: { frontmatter: Record<string, unknown>; content: string }[] = [];
  for (const file of files) {
    const { data, content } = matter(file.content);
    if (!data.id) continue;
    items.push({ frontmatter: data, content });
  }

  // Sort by phase order then item order
  const phaseOrder = ['시험준비', '시험수행', '시험종료'];
  items.sort((a, b) => {
    const aPhaseIdx = phaseOrder.indexOf(a.frontmatter.phase as string);
    const bPhaseIdx = phaseOrder.indexOf(b.frontmatter.phase as string);
    if (aPhaseIdx !== bPhaseIdx) return aPhaseIdx - bPhaseIdx;
    return ((a.frontmatter.order as number) ?? 0) - ((b.frontmatter.order as number) ?? 0);
  });

  // Parse each item into Requirement shape
  const requirements = items.map((item) => {
    const sections = extractSections(item.content);
    const phase = item.frontmatter.phase as string;
    const category = PHASE_TO_CATEGORY[phase] ?? 'SETUP';

    const requiredDocsSection = findSection(sections, '참조 문서')?.content;
    const requiredDocs = requiredDocsSection
      ? parseTable(requiredDocsSection).map((row) => ({
          label: row['문서명'] ?? '',
          kind: (row['종류'] ?? 'file'),
          description: row['설명'] ?? '',
        }))
      : [];

    const relatedInfoSection = findSection(sections, '참조 정보')?.content;
    const relatedInfo = relatedInfoSection
      ? parseTable(relatedInfoSection).map((row) => ({
          label: row['항목'] ?? '',
          value: row['내용'] ?? '',
          ...(row['링크'] ? { href: row['링크'] } : {}),
        }))
      : [];

    const contactsSection = findSection(sections, '담당자')?.content;
    const contacts = contactsSection
      ? parseTable(contactsSection).map((row) => ({
          role: row['역할'] ?? '',
          name: row['이름'] ?? '',
          ...(row['연락처'] ? { phone: row['연락처'] } : {}),
          ...(row['이메일'] ? { email: row['이메일'] } : {}),
        })).filter((c) => c.role)
      : [];

    return {
      id: item.frontmatter.id as string,
      category,
      title: item.frontmatter.title as string,
      description: findSection(sections, '설명')?.content ?? '',
      checkPoints: parseCheckboxList(findSection(sections, '체크포인트')?.content ?? ''),
      evidenceExamples: parseBulletList(findSection(sections, '증빙 예시')?.content ?? ''),
      passCriteria: findSection(sections, '합격 기준')?.content?.trim() ?? '',
      requiredDocs: requiredDocs.length > 0 ? requiredDocs : undefined,
      relatedInfo: relatedInfo.length > 0 ? relatedInfo : undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
      keywords: (item.frontmatter.keywords as string[]) ?? [],
    };
  });

  return `export const REQUIREMENTS_DB = ${JSON.stringify(requirements, null, 2)};`;
}

function generateDefectsModule(rootDir: string): string {
  const defectsDir = path.join(rootDir, CONTENT_DIR, 'defect-references');
  const files = readContentFiles(defectsDir);

  const categories: Record<string, unknown[]> = {};
  for (const file of files) {
    const { data, content } = matter(file.content);
    const category = data.category as string;
    if (!category) continue;

    // Parse H3 blocks inline
    const blocks: { heading: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentHeading = '';
    let currentLines: string[] = [];

    for (const line of lines) {
      const h3Match = line.match(/^### (.+)$/);
      if (h3Match) {
        if (currentHeading) {
          blocks.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
        }
        currentHeading = h3Match[1].trim();
        currentLines = [];
      } else if (currentHeading) {
        currentLines.push(line);
      }
    }
    if (currentHeading) {
      blocks.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
    }

    categories[category] = blocks.map((block) => {
      const severityMatch = block.content.match(/\*\*심각도\*\*:\s*(\w+)/);
      const frequencyMatch = block.content.match(/\*\*빈도\*\*:\s*(\w+)/);
      const descMatch = block.content.match(/\*\*설명\*\*:\s*(.+)/);
      return {
        summary: block.heading,
        severity: severityMatch?.[1] ?? 'M',
        frequency: frequencyMatch?.[1] ?? 'A',
        description: descMatch?.[1]?.trim() ?? '',
      };
    });
  }

  return `export const DEFECT_REFERENCES = ${JSON.stringify(categories, null, 2)};`;
}

function generateCategoriesModule(rootDir: string): string {
  const filePath = path.join(rootDir, CONTENT_DIR, 'theme', 'categories.md');
  if (!fs.existsSync(filePath)) {
    return `export const CATEGORIES = []; export const CATEGORY_THEMES = {};`;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\r/g, '');
  const { content } = matter(fileContent);

  const phaseIds: Record<string, string> = {
    '시험준비': 'SETUP',
    '시험수행': 'EXECUTION',
    '시험종료': 'COMPLETION',
  };

  // Parse H2 sections
  const sections: { heading: string; content: string }[] = [];
  const lines = content.split('\n');
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else if (currentHeading) {
      currentLines.push(line);
    }
  }
  if (currentHeading) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }

  const categories: { id: string; name: string }[] = [];
  const themes: Record<string, Record<string, string>> = {};

  for (const section of sections) {
    const id = phaseIds[section.heading] ?? section.heading;
    categories.push({ id, name: section.heading });

    const kv: Record<string, string> = {};
    for (const line of section.content.split('\n')) {
      const match = line.match(/^-\s+(\w+):\s+(.+)$/);
      if (match) {
        kv[match[1].trim()] = match[2].trim();
      }
    }
    themes[id] = kv;
  }

  return `export const CATEGORIES = ${JSON.stringify(categories, null, 2)};
export const CATEGORY_THEMES = ${JSON.stringify(themes, null, 2)};`;
}

function generateRulesModule(rootDir: string): string {
  const filePath = path.join(rootDir, CONTENT_DIR, 'rules', 'execution-gate.md');
  if (!fs.existsSync(filePath)) {
    return `export const EXECUTION_GATE_CONFIG = { regressionItemId: 'EXEC-05', securityItemId: 'EXEC-06', performanceItemId: 'EXEC-06' };`;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\r/g, '');
  const { data } = matter(fileContent);

  const config = {
    regressionItemId: data.regressionItemId ?? 'EXEC-05',
    securityItemId: data.securityItemId ?? 'EXEC-06',
    performanceItemId: data.performanceItemId ?? 'EXEC-06',
  };

  return `export const EXECUTION_GATE_CONFIG = ${JSON.stringify(config, null, 2)};`;
}

function generateReferencesModule(rootDir: string): string {
  const refsDir = path.join(rootDir, CONTENT_DIR, 'references');
  const files = readContentFiles(refsDir);

  const items = files.map((file) => {
    const { data, content } = matter(file.content);
    if (!data.id) return null;

    const sections = extractSections(content);
    return {
      id: data.id as string,
      title: data.title as string,
      description: findSection(sections, '설명')?.content ?? '',
      checkPoints: parseCheckboxList(findSection(sections, '체크포인트')?.content ?? ''),
      tip: findSection(sections, 'TIP')?.content?.trim() ?? '',
    };
  }).filter(Boolean);

  return `export const REFERENCES = ${JSON.stringify(items, null, 2)};`;
}

export function contentPlugin(): Plugin {
  const rootDir = process.cwd();

  return {
    name: 'vite-plugin-content',
    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return '\0' + id;
      }
    },
    load(id) {
      if (id === '\0virtual:content/process') {
        return generateProcessModule(rootDir);
      }
      if (id === '\0virtual:content/defects') {
        return generateDefectsModule(rootDir);
      }
      if (id === '\0virtual:content/categories') {
        return generateCategoriesModule(rootDir);
      }
      if (id === '\0virtual:content/rules') {
        return generateRulesModule(rootDir);
      }
      if (id === '\0virtual:content/references') {
        return generateReferencesModule(rootDir);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(path.sep + CONTENT_DIR + path.sep) || file.includes('/' + CONTENT_DIR + '/')) {
        const moduleIds = [
          '\0virtual:content/process',
          '\0virtual:content/defects',
          '\0virtual:content/categories',
          '\0virtual:content/rules',
          '\0virtual:content/references',
        ];
        const modules = moduleIds
          .map((id) => server.moduleGraph.getModuleById(id))
          .filter(Boolean) as any[];

        if (modules.length > 0) {
          modules.forEach((mod) => server.moduleGraph.invalidateModule(mod));
          return modules;
        }
      }
    },
  };
}
