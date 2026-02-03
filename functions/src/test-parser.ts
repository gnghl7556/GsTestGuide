/**
 * 파서 테스트 스크립트
 * 로컬에서 PDF/DOCX 파일을 테스트할 수 있습니다.
 */

import { parseDocument } from './parsers';
import { CleaningOptions } from './utils/textCleaner';
import * as fs from 'fs';

async function testParser() {
  // 테스트할 파일 경로 (예시)
  const testFilePath = process.argv[2];

  if (!testFilePath) {
    console.error('사용법: ts-node test-parser.ts <파일경로>');
    process.exit(1);
  }

  if (!fs.existsSync(testFilePath)) {
    console.error(`파일을 찾을 수 없습니다: ${testFilePath}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('문서 파싱 테스트');
  console.log('='.repeat(60));
  console.log(`파일: ${testFilePath}`);
  console.log('');

  // 정제 옵션 설정
  const cleaningOptions: CleaningOptions = {
    removePageNumbers: true,
    removeHeadersFooters: true,
    removeWatermarks: true,
    removeRepeatingPatterns: true,
    minRepeatCount: 3,
  };

  try {
    // 파싱 실행
    const startTime = Date.now();
    const result = await parseDocument(testFilePath, cleaningOptions);
    const endTime = Date.now();

    console.log('파싱 결과:');
    console.log('-'.repeat(60));
    console.log(`파일 타입: ${result.fileType}`);
    console.log(`성공 여부: ${result.success ? '성공' : '실패'}`);
    
    if (result.error) {
      console.log(`에러: ${result.error}`);
    }

    if (result.metadata) {
      console.log('\n메타데이터:');
      console.log(`  페이지 수: ${result.metadata.pageCount || 'N/A'}`);
      console.log(`  제목: ${result.metadata.title || 'N/A'}`);
      console.log(`  저자: ${result.metadata.author || 'N/A'}`);
    }

    if (result.cleaningStats) {
      console.log('\n정제 통계:');
      console.log(`  페이지 번호 제거: ${result.cleaningStats.pageNumbersRemoved}개`);
      console.log(`  머리글/바닥글 제거: ${result.cleaningStats.headersFootersRemoved}개`);
      console.log(`  워터마크 제거: ${result.cleaningStats.watermarksRemoved}개`);
      console.log(`  사용자 패턴 제거: ${result.cleaningStats.customPatternsRemoved}개`);
    }

    console.log(`\n처리 시간: ${endTime - startTime}ms`);

    // 원본 텍스트 미리보기
    console.log('\n' + '='.repeat(60));
    console.log('원본 텍스트 미리보기 (처음 500자):');
    console.log('-'.repeat(60));
    console.log(result.rawText.substring(0, 500));
    console.log('...');

    // 정제된 텍스트 미리보기
    console.log('\n' + '='.repeat(60));
    console.log('정제된 텍스트 미리보기 (처음 500자):');
    console.log('-'.repeat(60));
    console.log(result.cleanedText.substring(0, 500));
    console.log('...');

    // 결과를 파일로 저장
    const outputDir = './test-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = testFilePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'output';
    const rawOutputPath = `${outputDir}/${baseName}_raw.txt`;
    const cleanedOutputPath = `${outputDir}/${baseName}_cleaned.txt`;

    fs.writeFileSync(rawOutputPath, result.rawText, 'utf-8');
    fs.writeFileSync(cleanedOutputPath, result.cleanedText, 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('결과 파일 저장 완료:');
    console.log(`  원본: ${rawOutputPath}`);
    console.log(`  정제: ${cleanedOutputPath}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('테스트 중 에러 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
testParser().catch(console.error);
