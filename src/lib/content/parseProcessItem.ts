import matter from 'gray-matter';
import type { Requirement, RequirementCategory, RequiredDoc } from '../../types/checklist';
import {
  extractSections,
  findSection,
  parseCheckboxList,
  parseBulletList,
  parseTable,
} from './markdownUtils';

type ProcessPhase = '시험준비' | '시험수행' | '시험종료';

const PHASE_TO_CATEGORY: Record<ProcessPhase, RequirementCategory> = {
  '시험준비': 'SETUP',
  '시험수행': 'EXECUTION',
  '시험종료': 'COMPLETION',
};

function parseRequiredDocs(section: string | undefined): RequiredDoc[] {
  if (!section) return [];
  const rows = parseTable(section);
  return rows.map((row) => ({
    label: row['문서명'] ?? '',
    kind: (row['종류'] as 'file' | 'external') ?? 'file',
    description: row['설명'] ?? '',
  }));
}

function parseRelatedInfo(section: string | undefined): Array<{ label: string; value: string; href?: string }> {
  if (!section) return [];
  const rows = parseTable(section);
  return rows.map((row) => ({
    label: row['항목'] ?? '',
    value: row['내용'] ?? '',
    ...(row['링크'] ? { href: row['링크'] } : {}),
  }));
}

function parseContacts(section: string | undefined): Array<{ role: string; name: string; phone?: string; email?: string }> {
  if (!section) return [];
  const rows = parseTable(section);
  return rows.map((row) => ({
    role: row['역할'] ?? '',
    name: row['이름'] ?? '',
    ...(row['연락처'] ? { phone: row['연락처'] } : {}),
    ...(row['이메일'] ? { email: row['이메일'] } : {}),
  }));
}

export function parseProcessItem(fileContent: string): Requirement {
  const { data, content } = matter(fileContent);
  const sections = extractSections(content);

  const phase = data.phase as ProcessPhase;
  const category = PHASE_TO_CATEGORY[phase] ?? 'SETUP';

  return {
    id: data.id as string,
    category,
    title: data.title as string,
    description: findSection(sections, '설명')?.content ?? '',
    checkPoints: parseCheckboxList(findSection(sections, '체크포인트')?.content ?? ''),
    evidenceExamples: parseBulletList(findSection(sections, '증빙 예시')?.content ?? ''),
    passCriteria: findSection(sections, '합격 기준')?.content?.trim() ?? '',
    requiredDocs: parseRequiredDocs(findSection(sections, '참조 문서')?.content),
    relatedInfo: parseRelatedInfo(findSection(sections, '참조 정보')?.content),
    contacts: parseContacts(findSection(sections, '담당자')?.content),
    keywords: data.keywords ?? [],
  };
}
