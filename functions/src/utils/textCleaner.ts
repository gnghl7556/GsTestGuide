/**
 * 텍스트 정제 유틸리티
 * PDF/DOC에서 추출한 텍스트에서 불필요한 정보를 제거합니다.
 */

export interface CleaningOptions {
  /** 페이지 번호 제거 */
  removePageNumbers?: boolean;
  /** 머리글/바닥글 제거 */
  removeHeadersFooters?: boolean;
  /** 워터마크 제거 */
  removeWatermarks?: boolean;
  /** 반복 패턴 제거 */
  removeRepeatingPatterns?: boolean;
  /** 사용자 정의 패턴 제거 */
  customPatterns?: RegExp[];
  /** 최소 반복 횟수 (머리글/바닥글 감지용) */
  minRepeatCount?: number;
}

export interface CleaningResult {
  /** 정제된 텍스트 */
  cleanedText: string;
  /** 원본 텍스트 */
  originalText: string;
  /** 제거된 항목 통계 */
  stats: {
    pageNumbersRemoved: number;
    headersFootersRemoved: number;
    watermarksRemoved: number;
    customPatternsRemoved: number;
  };
}

/**
 * 텍스트 정제 메인 함수
 */
export function cleanText(
  text: string,
  options: CleaningOptions = {}
): CleaningResult {
  const defaultOptions: CleaningOptions = {
    removePageNumbers: true,
    removeHeadersFooters: true,
    removeWatermarks: true,
    removeRepeatingPatterns: true,
    customPatterns: [],
    minRepeatCount: 3,
    ...options,
  };

  const stats = {
    pageNumbersRemoved: 0,
    headersFootersRemoved: 0,
    watermarksRemoved: 0,
    customPatternsRemoved: 0,
  };

  let cleanedText = text;

  // 1. 페이지 번호 제거
  if (defaultOptions.removePageNumbers) {
    const result = removePageNumbers(cleanedText);
    cleanedText = result.text;
    stats.pageNumbersRemoved = result.count;
  }

  // 2. 워터마크 제거
  if (defaultOptions.removeWatermarks) {
    const result = removeWatermarks(cleanedText);
    cleanedText = result.text;
    stats.watermarksRemoved = result.count;
  }

  // 3. 머리글/바닥글 제거
  if (defaultOptions.removeHeadersFooters) {
    const result = removeHeadersAndFooters(
      cleanedText,
      defaultOptions.minRepeatCount || 3
    );
    cleanedText = result.text;
    stats.headersFootersRemoved = result.count;
  }

  // 4. 사용자 정의 패턴 제거
  if (defaultOptions.customPatterns && defaultOptions.customPatterns.length > 0) {
    const result = removeCustomPatterns(cleanedText, defaultOptions.customPatterns);
    cleanedText = result.text;
    stats.customPatternsRemoved = result.count;
  }

  // 5. 연속된 빈 줄 정리 (3개 이상의 연속 줄바꿈을 2개로)
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');

  // 6. 앞뒤 공백 제거
  cleanedText = cleanedText.trim();

  return {
    cleanedText,
    originalText: text,
    stats,
  };
}

/**
 * 페이지 번호 제거
 */
function removePageNumbers(text: string): { text: string; count: number } {
  let count = 0;

  // 패턴 1: 독립된 줄의 숫자 (예: "1", "2", "3")
  const pattern1 = /^\s*\d+\s*$/gm;
  
  // 패턴 2: "Page X", "페이지 X", "- X -" 형태
  const pattern2 = /^\s*(?:Page|페이지|쪽)\s*\d+\s*(?:of|\/|중)?\s*\d*\s*$/gim;
  
  // 패턴 3: "- X -" 또는 "| X |" 형태
  const pattern3 = /^\s*[-|]\s*\d+\s*[-|]\s*$/gm;

  let result = text;
  
  result = result.replace(pattern1, (match) => {
    count++;
    return '';
  });

  result = result.replace(pattern2, (match) => {
    count++;
    return '';
  });

  result = result.replace(pattern3, (match) => {
    count++;
    return '';
  });

  return { text: result, count };
}

/**
 * 워터마크 제거
 */
function removeWatermarks(text: string): { text: string; count: number } {
  let count = 0;

  // 일반적인 워터마크 키워드
  const watermarkPatterns = [
    /^\s*CONFIDENTIAL\s*$/gim,
    /^\s*DRAFT\s*$/gim,
    /^\s*기밀\s*$/gm,
    /^\s*초안\s*$/gm,
    /^\s*사본\s*$/gm,
    /^\s*COPY\s*$/gim,
    /^\s*SAMPLE\s*$/gim,
    /^\s*견본\s*$/gm,
    /^\s*FOR\s+INTERNAL\s+USE\s+ONLY\s*$/gim,
    /^\s*내부\s*용\s*$/gm,
  ];

  let result = text;

  watermarkPatterns.forEach((pattern) => {
    result = result.replace(pattern, (match) => {
      count++;
      return '';
    });
  });

  return { text: result, count };
}

/**
 * 머리글/바닥글 제거 (반복 패턴 감지)
 */
function removeHeadersAndFooters(
  text: string,
  minRepeatCount: number = 3
): { text: string; count: number } {
  const lines = text.split('\n');
  
  if (lines.length < minRepeatCount * 2) {
    return { text, count: 0 };
  }

  // 페이지 구분자 찾기 (폼피드 문자 또는 특정 패턴)
  const pages = splitIntoPages(text);
  
  if (pages.length < minRepeatCount) {
    return { text, count: 0 };
  }

  // 각 페이지의 첫 N줄과 마지막 N줄 추출
  const headerCandidates: string[][] = [];
  const footerCandidates: string[][] = [];
  const checkLines = 3; // 각 페이지의 상/하단 3줄 검사

  pages.forEach((page) => {
    const pageLines = page.split('\n').filter((line) => line.trim().length > 0);
    
    if (pageLines.length > checkLines * 2) {
      headerCandidates.push(pageLines.slice(0, checkLines));
      footerCandidates.push(pageLines.slice(-checkLines));
    }
  });

  // 반복되는 머리글/바닥글 찾기
  const repeatingHeaders = findRepeatingPatterns(headerCandidates, minRepeatCount);
  const repeatingFooters = findRepeatingPatterns(footerCandidates, minRepeatCount);

  let count = 0;
  let result = text;

  // 반복 패턴 제거
  [...repeatingHeaders, ...repeatingFooters].forEach((pattern) => {
    const escapedPattern = escapeRegExp(pattern);
    const regex = new RegExp(`^\\s*${escapedPattern}\\s*$`, 'gm');
    result = result.replace(regex, (match) => {
      count++;
      return '';
    });
  });

  return { text: result, count };
}

/**
 * 텍스트를 페이지로 분할
 */
function splitIntoPages(text: string): string[] {
  // 폼피드 문자로 분할
  if (text.includes('\f')) {
    return text.split('\f');
  }

  // 페이지 구분자 패턴으로 분할
  const pageBreakPattern = /\n\s*[-=]{3,}\s*\n/g;
  if (pageBreakPattern.test(text)) {
    return text.split(pageBreakPattern);
  }

  // 페이지 번호 패턴으로 분할 시도
  const pageNumberPattern = /\n\s*(?:Page|페이지)\s*\d+\s*\n/gi;
  if (pageNumberPattern.test(text)) {
    return text.split(pageNumberPattern);
  }

  // 분할 불가능한 경우 전체를 하나의 페이지로
  return [text];
}

/**
 * 반복되는 패턴 찾기
 */
function findRepeatingPatterns(
  candidates: string[][],
  minRepeatCount: number
): string[] {
  if (candidates.length < minRepeatCount) {
    return [];
  }

  const patterns: string[] = [];
  const maxLines = Math.max(...candidates.map((c) => c.length));

  for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
    const lineValues = candidates
      .map((c) => c[lineIndex])
      .filter((line) => line !== undefined && line.trim().length > 0);

    if (lineValues.length < minRepeatCount) {
      continue;
    }

    // 가장 많이 반복되는 라인 찾기
    const frequency = new Map<string, number>();
    lineValues.forEach((line) => {
      const normalized = line.trim();
      frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
    });

    frequency.forEach((count, line) => {
      if (count >= minRepeatCount && !patterns.includes(line)) {
        patterns.push(line);
      }
    });
  }

  return patterns;
}

/**
 * 사용자 정의 패턴 제거
 */
function removeCustomPatterns(
  text: string,
  patterns: RegExp[]
): { text: string; count: number } {
  let count = 0;
  let result = text;

  patterns.forEach((pattern) => {
    result = result.replace(pattern, (match) => {
      count++;
      return '';
    });
  });

  return { text: result, count };
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 텍스트 통계 정보 추출
 */
export function getTextStats(text: string) {
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  return {
    totalLines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    words: words.length,
    characters,
    charactersNoSpaces,
  };
}
