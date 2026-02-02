import type {
  Requirement,
  QuickAnswer,
  QuickDecision,
  QuickQuestionId,
  QuestionImportance,
  QuickQuestion,
  ExpertDetails,
  QuickModeItem
} from '../types';

const MUST_HINTS = [
  '차단',
  '강제',
  '필수',
  '우회',
  '검증',
  '로그',
  '서명'
];

const SHOULD_HINTS = ['권장', '가능', '절차', '정의', '훈련', '정기', '점검', '정책'];

const CATEGORY_TAGS: Record<Requirement['category'], string[]> = {
  BEFORE: [
    '사전 준비',
    '안내 메일',
    '자료 확인',
    '일정 확인',
    '시험 자리',
    '시험 장비',
    '설치',
    '네트워크'
  ],
  DURING: [
    '기능 테스트',
    '성능 테스트',
    '회귀 테스트',
    '결함 리포트',
    'RawData'
  ],
  AFTER: ['최종 산출물', '반입/반출', '정리', '종료']
};

const TAG_PATTERNS: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /웹|브라우저|UI|화면/i, tag: '웹 UI' },
  { pattern: /API|REST|엔드포인트/i, tag: 'API' },
  { pattern: /관리자|콘솔|운영자/i, tag: '관리자 콘솔' },
  { pattern: /유지보수|원격|모니터링/i, tag: '유지보수 포트' },
  { pattern: /LAN|네트워크|포트|방화벽/i, tag: '방화벽/포트' },
  { pattern: /Wi-?Fi|무선/i, tag: 'Wi-Fi' },
  { pattern: /USB|매체|외부매체/i, tag: 'USB' },
  { pattern: /로컬|콘솔/i, tag: '로컬 콘솔' },
  { pattern: /계정|사용자/i, tag: '계정' },
  { pattern: /세션|토큰|쿠키/i, tag: '세션/토큰' },
  { pattern: /업데이트|패치/i, tag: '업데이트' },
  { pattern: /백업|복구|DR|RTO|RPO/i, tag: '백업/복구' }
];

const normalizeLabel = (text: string) => text.replace(/\([^)]*\)/g, '').trim();

const toQuestion = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.endsWith('?')) return trimmed;
  return `${trimmed.replace(/\.$/, '')} 확인됐는가?`;
};

const toSummary = (text: string) => {
  const trimmed = text.trim();
  const parts = trimmed.split(/[.?!]/).filter(Boolean);
  const sentence = (parts[0] || trimmed).trim();
  return sentence.length > 60 ? `${sentence.slice(0, 60)}…` : sentence;
};

const inferImportance = (text: string): QuestionImportance => {
  if (MUST_HINTS.some((hint) => text.includes(hint))) return 'MUST';
  if (SHOULD_HINTS.some((hint) => text.includes(hint))) return 'SHOULD';
  return 'MUST';
};

const buildQuestions = (source: string[], description: string): QuickQuestion[] => {
  const pool = source.filter(Boolean).map(toQuestion);
  const must = pool.filter((text) => inferImportance(text) === 'MUST');
  const should = pool.filter((text) => inferImportance(text) === 'SHOULD');
  const picked: string[] = [];
  for (const text of must) {
    if (picked.length < 3) picked.push(text);
  }
  for (const text of should) {
    if (picked.length < 3) picked.push(text);
  }

  if (picked.length < 3) {
    const descParts = description.split(/[.?!]/).map((part) => part.trim()).filter(Boolean);
    for (const part of descParts) {
      if (picked.length >= 3) break;
      picked.push(toQuestion(part));
    }
  }

  while (picked.length < 3) {
    picked.push(toQuestion(description));
  }

  return picked.slice(0, 3).map((text, index) => ({
    id: (`Q${index + 1}` as QuickQuestionId),
    text,
    importance: inferImportance(text)
  }));
};

const buildTargetTags = (req: Requirement): string[] => {
  const combined = [req.title, req.description, ...(req.checkPoints || []), ...(req.testSuggestions || [])].join(' ');
  const tags = TAG_PATTERNS.filter(({ pattern }) => pattern.test(combined)).map(({ tag }) => tag);
  const unique = Array.from(new Set(tags));
  const fallback = CATEGORY_TAGS[req.category] || [];
  const merged = Array.from(new Set([...unique, ...fallback]));
  return merged.slice(0, 10).length < 4
    ? merged.concat(fallback).slice(0, 4)
    : merged.slice(0, 10);
};

const buildEvidenceChips = (examples?: string[], suggestions?: string[]) => {
  const labels = [...(examples || []), ...(suggestions || [])].map(normalizeLabel).filter(Boolean);
  const unique = Array.from(new Set(labels));
  return unique.slice(0, 6).length < 3
    ? unique.concat(unique).slice(0, 3)
    : unique.slice(0, 6);
};

export const toQuickModeItem = (req: Requirement): QuickModeItem => {
  return {
    requirementId: req.id,
    category: req.category,
    title: req.title,
    summary: toSummary(req.description),
    targetTags: buildTargetTags(req),
    quickQuestions: buildQuestions(req.checkPoints || [], req.description),
    evidenceChips: buildEvidenceChips(req.evidenceExamples, req.testSuggestions),
    expertDetails: {
      description: req.description,
      checkPoints: req.checkPoints || [],
      evidenceExamples: req.evidenceExamples || [],
      testSuggestions: req.testSuggestions || [],
      passCriteria: req.passCriteria || ''
    }
  };
};

export const getRecommendation = (
  questions: QuickQuestion[],
  answers: Record<QuickQuestionId, QuickAnswer>
): QuickDecision => {
  const mustQuestions = questions.filter((q) => q.importance === 'MUST');
  const shouldQuestions = questions.filter((q) => q.importance === 'SHOULD');

  if (mustQuestions.some((q) => answers[q.id] === 'NO')) return 'FAIL';
  if (mustQuestions.some((q) => answers[q.id] === 'NA')) return 'HOLD';

  const mustAllYes = mustQuestions.every((q) => answers[q.id] === 'YES');
  if (!mustAllYes) return 'HOLD';

  if (shouldQuestions.some((q) => answers[q.id] === 'NO')) return 'HOLD';

  return 'PASS';
};
