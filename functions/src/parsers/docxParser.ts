/**
 * DOCX 파서 모듈
 * DOCX 파일에서 텍스트를 추출합니다.
 */

import * as fs from 'fs';

type MammothMessage = { message: string };
type MammothResult = { value: string; messages?: MammothMessage[] };
type MammothLib = {
  extractRawText: (input: { path: string } | { buffer: Buffer }) => Promise<MammothResult>;
  convertToHtml: (input: { path: string } | { buffer: Buffer }) => Promise<{ value: string }>;
};

// mammoth는 동적 import로 사용
let mammoth: MammothLib | null = null;

async function getMammoth(): Promise<MammothLib> {
  if (!mammoth) {
    const loaded = await import('mammoth');
    mammoth = loaded as unknown as MammothLib;
  }
  return mammoth;
}

export interface DocxParseResult {
  /** 추출된 텍스트 */
  text: string;
  /** HTML 형식 (선택사항) */
  html?: string;
  /** 파싱 성공 여부 */
  success: boolean;
  /** 에러 메시지 (실패 시) */
  error?: string;
  /** 경고 메시지 */
  warnings?: string[];
}

/**
 * DOCX 파일에서 텍스트 추출
 * @param filePath DOCX 파일 경로
 * @param extractHtml HTML도 추출할지 여부
 * @returns 파싱 결과
 */
export async function parseDocx(
  filePath: string,
  extractHtml: boolean = false
): Promise<DocxParseResult> {
  try {
    const mammothLib = await getMammoth();

    // 텍스트 추출
    const textResult = await mammothLib.extractRawText({ path: filePath });
    
    let htmlResult = null;
    if (extractHtml) {
      htmlResult = await mammothLib.convertToHtml({ path: filePath });
    }

    return {
      text: textResult.value || '',
      html: htmlResult?.value,
      success: true,
      warnings: textResult.messages?.map((m) => m.message),
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 버퍼에서 직접 DOCX 파싱
 * @param buffer DOCX 파일 버퍼
 * @param extractHtml HTML도 추출할지 여부
 * @returns 파싱 결과
 */
export async function parseDocxFromBuffer(
  buffer: Buffer,
  extractHtml: boolean = false
): Promise<DocxParseResult> {
  try {
    const mammothLib = await getMammoth();

    // 텍스트 추출
    const textResult = await mammothLib.extractRawText({ buffer });
    
    let htmlResult = null;
    if (extractHtml) {
      htmlResult = await mammothLib.convertToHtml({ buffer });
    }

    return {
      text: textResult.value || '',
      html: htmlResult?.value,
      success: true,
      warnings: textResult.messages?.map((m) => m.message),
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * DOC/DOCX 파일 유효성 검사
 */
export function isDocxFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return lowerPath.endsWith('.docx') || lowerPath.endsWith('.doc');
}

/**
 * DOCX 파일 크기 확인 (바이트)
 */
export async function getDocxFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
}

/**
 * HTML에서 순수 텍스트 추출 (간단한 태그 제거)
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
