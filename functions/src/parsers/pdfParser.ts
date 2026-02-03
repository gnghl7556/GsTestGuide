/**
 * PDF 파서 모듈
 * PDF 파일에서 텍스트를 추출합니다.
 */

import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';

export interface PdfParseResult {
  /** 추출된 텍스트 */
  text: string;
  /** 총 페이지 수 */
  numPages: number;
  /** 메타데이터 */
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  /** 파싱 성공 여부 */
  success: boolean;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * PDF 파일에서 텍스트 추출
 * @param filePath PDF 파일 경로
 * @returns 파싱 결과
 */
export async function parsePdf(filePath: string): Promise<PdfParseResult> {
  try {
    // 파일 읽기
    const dataBuffer = await fs.promises.readFile(filePath);

    // PDF 파싱
    const data = await pdfParse(dataBuffer);

    // 메타데이터 추출
    const metadata = extractMetadata(data.info);

    return {
      text: data.text || '',
      numPages: data.numpages || 0,
      metadata,
      success: true,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      text: '',
      numPages: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 버퍼에서 직접 PDF 파싱
 * @param buffer PDF 파일 버퍼
 * @returns 파싱 결과
 */
export async function parsePdfFromBuffer(buffer: Buffer): Promise<PdfParseResult> {
  try {
    const data = await pdfParse(buffer);

    const metadata = extractMetadata(data.info);

    return {
      text: data.text || '',
      numPages: data.numpages || 0,
      metadata,
      success: true,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      text: '',
      numPages: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * PDF 메타데이터 추출
 */
function extractMetadata(info: any): PdfParseResult['metadata'] {
  if (!info) return undefined;

  return {
    title: info.Title,
    author: info.Author,
    subject: info.Subject,
    creator: info.Creator,
    producer: info.Producer,
    creationDate: info.CreationDate ? parseDate(info.CreationDate) : undefined,
    modificationDate: info.ModDate ? parseDate(info.ModDate) : undefined,
  };
}

/**
 * PDF 날짜 형식 파싱 (D:YYYYMMDDHHmmSS)
 */
function parseDate(dateString: string): Date | undefined {
  try {
    // PDF 날짜 형식: D:YYYYMMDDHHmmSS+HH'mm'
    const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
    }
  } catch (error) {
    console.warn('Failed to parse PDF date:', dateString);
  }
  return undefined;
}

/**
 * PDF 파일 유효성 검사
 */
export function isPdfFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.pdf');
}

/**
 * PDF 파일 크기 확인 (바이트)
 */
export async function getPdfFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
}
