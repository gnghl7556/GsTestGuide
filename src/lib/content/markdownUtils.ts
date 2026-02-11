export interface Section {
  heading: string;
  content: string;
}

/**
 * H2 섹션 분리: "## 체크포인트" → { heading: "체크포인트", content: "..." }
 */
export function extractSections(markdown: string): Section[] {
  const sections: Section[] = [];
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

export interface H3Block {
  heading: string;
  content: string;
}

/**
 * H3 블록 분리: "### 제목" → { heading: "제목", content: "..." }
 */
export function extractH3Blocks(markdown: string): H3Block[] {
  const blocks: H3Block[] = [];
  const lines = markdown.split('\n');
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

  return blocks;
}

/**
 * 체크박스 리스트 파싱: "- [ ] 항목" → ["항목"]
 */
export function parseCheckboxList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s*\[[ x]\]\s*(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

/**
 * 불릿 리스트 파싱: "- 항목" → ["항목"]
 */
export function parseBulletList(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
    .filter((item): item is string => !!item);
}

/**
 * 마크다운 테이블 파싱 → Record<string, string>[]
 */
export function parseTable(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);

  // lines[1]은 구분선 (|---|---|)
  return lines.slice(2).map((line) => {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cells[i] ?? '';
    });
    return record;
  });
}

/**
 * "- **키**: 값" 형태에서 값을 추출
 */
export function extractBoldValue(content: string, key: string): string {
  const match = content.match(new RegExp(`\\*\\*${key}\\*\\*:\\s*(.+)`));
  return match?.[1]?.trim() ?? '';
}

/**
 * "- key: value" 형태에서 key-value 맵 추출
 */
export function parseKeyValueList(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^-\s+(\w+):\s+(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  }
  return result;
}

/**
 * 섹션 배열에서 특정 heading의 섹션 찾기
 */
export function findSection(sections: Section[], heading: string): Section | undefined {
  return sections.find((s) => s.heading === heading);
}
