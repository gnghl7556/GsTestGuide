import matter from 'gray-matter';
import type { DefectReference } from '../../features/defects/data/defectReferences';
import { extractH3Blocks, extractBoldValue } from './markdownUtils';

export function parseDefectRefFile(fileContent: string): {
  category: string;
  items: DefectReference[];
} {
  const { data, content } = matter(fileContent);

  const blocks = extractH3Blocks(content);

  return {
    category: data.category as string,
    items: blocks.map((block) => ({
      summary: block.heading,
      description: extractBoldValue(block.content, '설명'),
      severity: extractBoldValue(block.content, '심각도') as 'H' | 'M' | 'L',
      frequency: extractBoldValue(block.content, '빈도') as 'A' | 'I',
    })),
  };
}
