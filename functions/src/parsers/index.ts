/**
 * 통합 문서 파서
 * PDF, DOCX 등 다양한 문서 형식을 처리하는 통합 인터페이스
 */

import { parsePdf, parsePdfFromBuffer, isPdfFile } from './pdfParser';
import { parseDocx, parseDocxFromBuffer, isDocxFile } from './docxParser';
import { cleanText, CleaningOptions, CleaningResult } from '../utils/textCleaner';

export interface DocumentParseResult {
  /** 원본 텍스트 */
  rawText: string;
  /** 정제된 텍스트 */
  cleanedText: string;
  /** 파일 타입 */
  fileType: 'pdf' | 'docx' | 'unknown';
  /** 파싱 성공 여부 */
  success: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 메타데이터 */
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
  };
  /** 정제 통계 */
  cleaningStats?: CleaningResult['stats'];
}

/**
 * 파일 경로로부터 문서 파싱 및 정제
 * @param filePath 문서 파일 경로
 * @param cleaningOptions 텍스트 정제 옵션
 * @returns 파싱 및 정제 결과
 */
export async function parseDocument(
  filePath: string,
  cleaningOptions?: CleaningOptions
): Promise<DocumentParseResult> {
  // 파일 타입 감지
  let fileType: 'pdf' | 'docx' | 'unknown' = 'unknown';
  
  if (isPdfFile(filePath)) {
    fileType = 'pdf';
  } else if (isDocxFile(filePath)) {
    fileType = 'docx';
  }

  // 파일 타입별 파싱
  let rawText = '';
  let success = false;
  let error: string | undefined;
  let metadata: DocumentParseResult['metadata'] = {};

  try {
    if (fileType === 'pdf') {
      const result = await parsePdf(filePath);
      rawText = result.text;
      success = result.success;
      error = result.error;
      metadata = {
        pageCount: result.numPages,
        title: result.metadata?.title,
        author: result.metadata?.author,
      };
    } else if (fileType === 'docx') {
      const result = await parseDocx(filePath);
      rawText = result.text;
      success = result.success;
      error = result.error;
    } else {
      return {
        rawText: '',
        cleanedText: '',
        fileType: 'unknown',
        success: false,
        error: '지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일만 지원됩니다.',
      };
    }

    // 텍스트 정제
    let cleanedText = rawText;
    let cleaningStats;

    if (success && rawText && cleaningOptions) {
      const cleaningResult = cleanText(rawText, cleaningOptions);
      cleanedText = cleaningResult.cleanedText;
      cleaningStats = cleaningResult.stats;
    }

    return {
      rawText,
      cleanedText,
      fileType,
      success,
      error,
      metadata,
      cleaningStats,
    };
  } catch (err) {
    return {
      rawText: '',
      cleanedText: '',
      fileType,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 버퍼로부터 문서 파싱 및 정제
 * @param buffer 문서 파일 버퍼
 * @param fileName 파일명 (확장자 판별용)
 * @param cleaningOptions 텍스트 정제 옵션
 * @returns 파싱 및 정제 결과
 */
export async function parseDocumentFromBuffer(
  buffer: Buffer,
  fileName: string,
  cleaningOptions?: CleaningOptions
): Promise<DocumentParseResult> {
  // 파일 타입 감지
  let fileType: 'pdf' | 'docx' | 'unknown' = 'unknown';
  
  if (isPdfFile(fileName)) {
    fileType = 'pdf';
  } else if (isDocxFile(fileName)) {
    fileType = 'docx';
  }

  // 파일 타입별 파싱
  let rawText = '';
  let success = false;
  let error: string | undefined;
  let metadata: DocumentParseResult['metadata'] = {};

  try {
    if (fileType === 'pdf') {
      const result = await parsePdfFromBuffer(buffer);
      rawText = result.text;
      success = result.success;
      error = result.error;
      metadata = {
        pageCount: result.numPages,
        title: result.metadata?.title,
        author: result.metadata?.author,
      };
    } else if (fileType === 'docx') {
      const result = await parseDocxFromBuffer(buffer);
      rawText = result.text;
      success = result.success;
      error = result.error;
    } else {
      return {
        rawText: '',
        cleanedText: '',
        fileType: 'unknown',
        success: false,
        error: '지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일만 지원됩니다.',
      };
    }

    // 텍스트 정제
    let cleanedText = rawText;
    let cleaningStats;

    if (success && rawText && cleaningOptions) {
      const cleaningResult = cleanText(rawText, cleaningOptions);
      cleanedText = cleaningResult.cleanedText;
      cleaningStats = cleaningResult.stats;
    }

    return {
      rawText,
      cleanedText,
      fileType,
      success,
      error,
      metadata,
      cleaningStats,
    };
  } catch (err) {
    return {
      rawText: '',
      cleanedText: '',
      fileType,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 지원하는 파일 형식인지 확인
 */
export function isSupportedFile(fileName: string): boolean {
  return isPdfFile(fileName) || isDocxFile(fileName);
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Re-export 개별 파서들
export { parsePdf, parsePdfFromBuffer, isPdfFile } from './pdfParser';
export { parseDocx, parseDocxFromBuffer, isDocxFile } from './docxParser';
export { cleanText, CleaningOptions } from '../utils/textCleaner';
