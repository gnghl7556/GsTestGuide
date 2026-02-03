# PDF/DOCX 텍스트 추출 및 정제 솔루션

## 개요

이 솔루션은 GsTestGuide 프로젝트에 통합된 PDF 및 DOCX 파일의 텍스트 추출 및 정제 기능을 제공합니다. Firebase Cloud Functions 환경에서 동작하며, 업로드된 문서에서 자동으로 텍스트를 추출하고 불필요한 정보를 제거합니다.

## 주요 기능

### 지원 파일 형식
- **PDF**: `pdf-parse` 라이브러리 사용
- **DOCX**: `mammoth` 라이브러리 사용

### 텍스트 정제 기능
1. **페이지 번호 제거**
   - 독립된 줄의 숫자 (예: "1", "2", "3")
   - "Page X", "페이지 X" 형태
   - "- X -", "| X |" 형태

2. **머리글/바닥글 제거**
   - 모든 페이지에 반복되는 텍스트 자동 감지
   - 최소 반복 횟수 설정 가능 (기본값: 3회)

3. **워터마크 제거**
   - "CONFIDENTIAL", "DRAFT", "기밀", "초안" 등
   - 사용자 정의 패턴 추가 가능

4. **이미지 제거**
   - PDF/DOCX 파서가 기본적으로 텍스트만 추출

5. **연속된 빈 줄 정리**
   - 3개 이상의 연속 줄바꿈을 2개로 정리

## 프로젝트 구조

```
functions/
├── src/
│   ├── index.ts                    # 기존 Cloud Functions
│   ├── index-enhanced.ts           # 향상된 버전 (새 파서 통합)
│   ├── parsers/
│   │   ├── index.ts                # 통합 파서 인터페이스
│   │   ├── pdfParser.ts            # PDF 파서
│   │   └── docxParser.ts           # DOCX 파서
│   ├── utils/
│   │   └── textCleaner.ts          # 텍스트 정제 유틸리티
│   ├── test-parser.ts              # 테스트 스크립트
│   ├── pdf-parse.d.ts              # pdf-parse 타입 정의
│   ├── textract.d.ts               # textract 타입 정의
│   └── mammoth.d.ts                # mammoth 타입 정의
├── package.json
└── tsconfig.json
```

## 설치 방법

### 1. 의존성 설치

```bash
cd functions
npm install
```

새로 추가된 패키지:
- `mammoth@^1.6.0`: DOCX 파일 텍스트 추출

### 2. TypeScript 컴파일

```bash
npm run build
```

## 사용 방법

### 옵션 1: 기존 함수 교체 (권장)

기존 `index.ts`를 백업하고 `index-enhanced.ts`로 교체:

```bash
# 백업
cp src/index.ts src/index-backup.ts

# 교체
cp src/index-enhanced.ts src/index.ts

# 컴파일 및 배포
npm run build
npm run deploy
```

### 옵션 2: 새로운 함수로 추가

`index.ts`에 다음 내용을 추가:

```typescript
import { parseDocumentFromBuffer, isSupportedFile } from './parsers';
import { CleaningOptions } from './utils/textCleaner';

// 기존 onAgreementUpload 함수 내부에서 사용
const cleaningOptions: CleaningOptions = {
  removePageNumbers: true,
  removeHeadersFooters: true,
  removeWatermarks: true,
  removeRepeatingPatterns: true,
  minRepeatCount: 3,
};

const parseResult = await parseDocumentFromBuffer(
  buffer,
  fileName,
  cleaningOptions
);
```

### 옵션 3: 독립 실행형 스크립트

로컬에서 파일 테스트:

```bash
# TypeScript 직접 실행 (ts-node 필요)
npx ts-node src/test-parser.ts /path/to/document.pdf

# 또는 컴파일 후 실행
npm run build
node lib/test-parser.js /path/to/document.pdf
```

## API 사용 예제

### 기본 사용법

```typescript
import { parseDocument } from './parsers';

// 파일 경로로 파싱
const result = await parseDocument('/path/to/document.pdf');

console.log(result.cleanedText); // 정제된 텍스트
console.log(result.rawText);     // 원본 텍스트
console.log(result.fileType);    // 'pdf' | 'docx' | 'unknown'
console.log(result.success);     // true | false
```

### 정제 옵션 커스터마이징

```typescript
import { parseDocument, CleaningOptions } from './parsers';

const options: CleaningOptions = {
  removePageNumbers: true,
  removeHeadersFooters: true,
  removeWatermarks: false,  // 워터마크 제거 비활성화
  removeRepeatingPatterns: true,
  minRepeatCount: 5,        // 5회 이상 반복되는 패턴만 제거
  customPatterns: [         // 사용자 정의 패턴 추가
    /회사\s*기밀/g,
    /외부\s*유출\s*금지/g,
  ],
};

const result = await parseDocument('/path/to/document.pdf', options);
```

### 버퍼에서 직접 파싱

```typescript
import { parseDocumentFromBuffer } from './parsers';
import * as fs from 'fs';

const buffer = fs.readFileSync('/path/to/document.pdf');
const result = await parseDocumentFromBuffer(buffer, 'document.pdf');
```

### 개별 파서 사용

```typescript
// PDF만 파싱
import { parsePdf } from './parsers/pdfParser';
const pdfResult = await parsePdf('/path/to/document.pdf');

// DOCX만 파싱
import { parseDocx } from './parsers/docxParser';
const docxResult = await parseDocx('/path/to/document.docx');

// 텍스트만 정제
import { cleanText } from './utils/textCleaner';
const cleaningResult = cleanText(rawText, options);
```

## 정제 옵션 상세

### CleaningOptions 인터페이스

```typescript
interface CleaningOptions {
  /** 페이지 번호 제거 (기본값: true) */
  removePageNumbers?: boolean;
  
  /** 머리글/바닥글 제거 (기본값: true) */
  removeHeadersFooters?: boolean;
  
  /** 워터마크 제거 (기본값: true) */
  removeWatermarks?: boolean;
  
  /** 반복 패턴 제거 (기본값: true) */
  removeRepeatingPatterns?: boolean;
  
  /** 사용자 정의 패턴 (기본값: []) */
  customPatterns?: RegExp[];
  
  /** 최소 반복 횟수 (기본값: 3) */
  minRepeatCount?: number;
}
```

### 반환 결과

```typescript
interface DocumentParseResult {
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
  cleaningStats?: {
    pageNumbersRemoved: number;
    headersFootersRemoved: number;
    watermarksRemoved: number;
    customPatternsRemoved: number;
  };
}
```

## Firebase Functions 통합

### Firestore 데이터 구조

`agreementDocs` 컬렉션에 다음 필드가 추가됩니다:

```typescript
{
  testNumber: string;
  storagePath: string;
  fileName: string;
  uploadedAt: Timestamp;
  parseStatus: 'pending' | 'parsed' | 'failed';
  parseProgress: number;
  
  // 기존 필드
  parsed: { ... };
  
  // 새로 추가된 필드
  rawText: string;           // 원본 텍스트
  cleanedText: string;       // 정제된 텍스트
  fileType: string;          // 'pdf' | 'docx'
  metadata: {
    pageCount?: number;
    title?: string;
    author?: string;
  };
  cleaningStats: {
    pageNumbersRemoved: number;
    headersFootersRemoved: number;
    watermarksRemoved: number;
    customPatternsRemoved: number;
  };
}
```

### Cloud Function 트리거

파일이 `agreements/{testNumber}/{fileName}` 경로에 업로드되면 자동으로 실행됩니다:

1. 파일 다운로드
2. 파일 타입 확인 (PDF/DOCX)
3. 텍스트 추출
4. 텍스트 정제
5. 필드 추출 (기존 로직)
6. Firestore에 저장

## 성능 고려사항

### Firebase Functions 제한
- **타임아웃**: 최대 540초 (9분)
- **메모리**: 기본 256MB, 최대 8GB
- **파일 크기**: 10MB 이상은 청크 처리 권장

### 최적화 팁
1. **대용량 파일**: 10MB 이상은 별도 처리 로직 구현
2. **메모리 설정**: `firebase.json`에서 메모리 증가
   ```json
   {
     "functions": {
       "memory": "512MB"
     }
   }
   ```
3. **타임아웃 설정**: 복잡한 문서는 타임아웃 증가
   ```typescript
   export const onAgreementUploadEnhanced = onObjectFinalized({
     region: REGION,
     timeoutSeconds: 300,  // 5분
     memory: "512MiB"
   }, async (event) => { ... });
   ```

## 보안 고려사항

1. **파일 검증**: MIME 타입 확인
2. **크기 제한**: Storage Rules에서 최대 크기 설정
3. **권한 관리**: Firestore Rules로 접근 제어

## 트러블슈팅

### 문제: DOCX 파일이 파싱되지 않음
**해결**: mammoth 패키지가 설치되었는지 확인
```bash
npm list mammoth
```

### 문제: 머리글/바닥글이 제거되지 않음
**해결**: `minRepeatCount` 값을 낮춤
```typescript
const options = { minRepeatCount: 2 };
```

### 문제: 타임아웃 에러
**해결**: Functions 타임아웃 및 메모리 증가
```typescript
export const onAgreementUploadEnhanced = onObjectFinalized({
  timeoutSeconds: 540,
  memory: "1GiB"
}, ...);
```

### 문제: 특정 워터마크가 제거되지 않음
**해결**: 사용자 정의 패턴 추가
```typescript
const options = {
  customPatterns: [/귀사\s*전용/g]
};
```

## 테스트

### 단위 테스트 (예정)

```bash
npm test
```

### 로컬 테스트

```bash
# PDF 파일 테스트
npx ts-node src/test-parser.ts sample.pdf

# DOCX 파일 테스트
npx ts-node src/test-parser.ts sample.docx
```

### Firebase Emulator 테스트

```bash
npm run serve
```

## 향후 개선 사항

1. **OCR 지원**: 이미지 기반 PDF 텍스트 추출
2. **다국어 지원**: 영어, 중국어 등 다양한 언어
3. **레이아웃 보존**: 표, 목록 구조 유지
4. **병렬 처리**: 대용량 파일 청크 병렬 처리
5. **캐싱**: 동일 파일 재파싱 방지

## 라이선스

이 솔루션은 GsTestGuide 프로젝트의 일부입니다.

## 문의

프로젝트 관련 문의는 GitHub Issues를 통해 제출해주세요.
