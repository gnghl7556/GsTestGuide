import matter from 'gray-matter';
import { extractSections, parseKeyValueList } from './markdownUtils';

export interface CategoryDefinition {
  id: string;
  name: string;
}

export interface CategoryTheme {
  bg: string;
  lightBg: string;
  text: string;
  border: string;
  activeBorder: string;
  ring: string;
  badgeBg: string;
  badgeText: string;
}

const PHASE_IDS: Record<string, string> = {
  '시험준비': 'SETUP',
  '시험수행': 'EXECUTION',
  '시험종료': 'COMPLETION',
};

export function parseCategories(fileContent: string): {
  categories: CategoryDefinition[];
  themes: Record<string, CategoryTheme>;
} {
  const { content } = matter(fileContent);
  const sections = extractSections(content);

  const categories: CategoryDefinition[] = [];
  const themes: Record<string, CategoryTheme> = {};

  for (const section of sections) {
    const id = PHASE_IDS[section.heading] ?? section.heading;
    categories.push({ id, name: section.heading });

    const kv = parseKeyValueList(section.content);
    themes[id] = {
      bg: kv['bg'] ?? '',
      lightBg: kv['lightBg'] ?? '',
      text: kv['text'] ?? '',
      border: kv['border'] ?? '',
      activeBorder: kv['activeBorder'] ?? '',
      ring: kv['ring'] ?? '',
      badgeBg: kv['badgeBg'] ?? '',
      badgeText: kv['badgeText'] ?? '',
    };
  }

  return { categories, themes };
}
