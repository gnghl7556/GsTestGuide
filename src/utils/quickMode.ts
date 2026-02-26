import type {
  Requirement,
  QuickAnswer,
  QuickDecision,
  QuestionImportance,
  QuickQuestion,
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

const SHOULD_HINTS = ['권장', '가능', '절차', '정의', '훈련', '정기', '점검', '정책', '조건부'];

const CATEGORY_TAGS: Record<Requirement['category'], string[]> = {
  SETUP: [
    '사전 준비',
    '안내 메일',
    '자료 확인',
    '일정 확인',
    '시험 자리',
    '시험 장비',
    '설치',
    '네트워크'
  ],
  EXECUTION: [
    '기능 목록',
    '기능 테스트',
    '성능 테스트',
    '회귀 테스트',
    '결함 리포트',
    'RawData',
    '테스트 케이스'
  ],
  COMPLETION: ['최종 산출물', '반입/반출', '정리', '종료']
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

const normalizeLabel = (text: string) => text.trim();

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

export const inferImportance = (text: string): QuestionImportance => {
  if (MUST_HINTS.some((hint) => text.includes(hint))) return 'MUST';
  if (SHOULD_HINTS.some((hint) => text.includes(hint))) return 'SHOULD';
  return 'MUST';
};

const REF_PATTERN = /\s*\[ref:\s*(.+?)\]\s*$/;

const parseRefs = (text: string): { clean: string; refs?: string[] } => {
  const match = text.match(REF_PATTERN);
  if (!match) return { clean: text };
  const refs = match[1].split(',').map((r) => r.trim()).filter(Boolean);
  return { clean: text.replace(REF_PATTERN, '').trim(), refs };
};

const buildQuestions = (
  source: string[],
  description: string,
  importanceOverrides?: Record<number, QuestionImportance>,
): QuickQuestion[] => {
  const pool = source.filter(Boolean).map((raw) => {
    const { clean, refs } = parseRefs(raw);
    return { text: toQuestion(clean), refs };
  });

  if (pool.length === 0) {
    const descParts = description.split(/[.?!]/).map((part) => part.trim()).filter(Boolean);
    const fallback = descParts.length > 0 ? descParts.map(toQuestion) : [toQuestion(description)];
    return fallback.map((text, index) => ({
      id: `Q${index + 1}`,
      text,
      importance: importanceOverrides?.[index] ?? inferImportance(text)
    }));
  }

  return pool.map(({ text, refs }, index) => ({
    id: `Q${index + 1}`,
    text,
    importance: importanceOverrides?.[index] ?? inferImportance(text),
    ...(refs ? { refs } : {})
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

const buildEvidenceChips = (examples?: string[]) => {
  const labels = (examples || []).map(normalizeLabel).filter(Boolean);
  return Array.from(new Set(labels));
};

export const toQuickModeItem = (req: Requirement): QuickModeItem => {
  return {
    requirementId: req.id,
    category: req.category,
    title: req.title,
    summary: toSummary(req.description),
    targetTags: buildTargetTags(req),
    quickQuestions: buildQuestions(req.checkPoints || [], req.description, req.checkpointImportances),
    evidenceChips: buildEvidenceChips(req.evidenceExamples),
    expertDetails: {
      description: req.description,
      checkPoints: req.checkPoints || [],
      evidenceExamples: req.evidenceExamples || [],
      testSuggestions: req.testSuggestions || [],
      passCriteria: req.passCriteria || ''
    },
    ...(req.branchingRules && { branchingRules: req.branchingRules }),
  };
};

export const getRecommendation = (
  questions: QuickQuestion[],
  answers: Record<string, QuickAnswer>,
  skippedIndices?: Set<number>
): QuickDecision => {
  const activeQuestions = skippedIndices
    ? questions.filter((_, idx) => !skippedIndices.has(idx))
    : questions;

  const allAnswered = activeQuestions.every((q) => {
    const a = answers[q.id];
    return a === 'YES' || a === 'NO' || a === 'NA';
  });
  if (!allAnswered) return 'HOLD';

  // MUST 질문(importance=MUST 또는 첫 번째 활성 질문)에 NO → FAIL
  for (let i = 0; i < activeQuestions.length; i++) {
    const q = activeQuestions[i];
    if (answers[q.id] === 'NO' && (q.importance === 'MUST' || i === 0)) {
      return 'FAIL';
    }
  }

  // NO 비율 50% 초과 → FAIL
  const answered = activeQuestions.filter((q) => answers[q.id] === 'YES' || answers[q.id] === 'NO');
  if (answered.length > 0) {
    const noCount = answered.filter((q) => answers[q.id] === 'NO').length;
    if (noCount / answered.length > 0.5) return 'FAIL';
  }

  // NO가 하나라도 있으면 HOLD
  if (activeQuestions.some((q) => answers[q.id] === 'NO')) return 'HOLD';

  return 'PASS';
};
