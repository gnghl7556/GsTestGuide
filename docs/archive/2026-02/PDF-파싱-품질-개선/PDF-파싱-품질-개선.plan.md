# Plan: PDF 파싱 품질 개선

> **Feature**: PDF-파싱-품질-개선
> **Created**: 2026-02-10
> **Status**: Reviewed (검토 완료)

---

## 1. 문제 정의

### 현재 상태

#### A. 아키텍처 문제
- `functions/src/parsers/` (pdfParser, docxParser, textCleaner)가 **모듈화되어 있지만 실제로 사용되지 않음**
- `onAgreementUpload`에서 `pdfParse`를 직접 호출하고 `cleanText()`를 호출하지 않음
- 텍스트 정제 없이 raw text에서 바로 정규식 추출 수행

#### B. 필드 추출 정확도 문제
- **정규식 의존**: PDF 텍스트 레이아웃 변경에 취약 (pdf-parse가 테이블/칸을 어떻게 풀어쓰는지에 따라 결과 달라짐)
- **`cleanName()`이 영문자 전부 제거**: `[A-Za-z]` → 영문명이 포함된 제품명/업체명 파손
- **`workingDays` 미추출**: `AgreementParsed` 타입에 정의되어 있지만 추출 로직 없음
- **체크 표시 `(V)` 패턴 의존**: 계약유형/인증유형에서 `(V)` 체크 표시를 찾지만, PDF 변환 시 이 패턴이 사라질 수 있음
- **담당자 정보 추출 범위 과도**: `[\s\S]{0,1500}?` 등 넓은 범위 매칭 → 잘못된 영역에서 값 추출 가능

#### C. 사용자 경험 문제
- **파싱 결과 검증/수정 UI 없음**: 추출된 정보를 사용자가 확인하거나 수정할 방법 없음
- 자동 채우기만 되고, 어떤 값이 추출되었는지 명시적으로 보여주지 않음
- 파싱 실패 시 구체적인 원인 표시 없음 (어떤 필드가 추출 안 되었는지)
- **신뢰도 표시 없음**: 추출 결과의 정확도를 사용자가 판단할 근거 없음

#### D. 누락 기능
- 추출할 수 있지만 하지 않는 필드 (시험 일정, 운영환경 등)
- 합의서 재업로드 시 기존 파싱 결과 덮어쓰기 전 확인 없음

### 해결 방향
1. **기존 모듈 활용**: parsers/index.ts, textCleaner.ts를 실제로 사용
2. **정규식 개선**: 더 견고한 패턴 + 텍스트 정제 후 추출
3. **파싱 결과 검증 UI**: 추출된 필드를 보여주고 수정 가능하게
4. **추가 필드 추출**: workingDays 등 누락 필드
5. **신뢰도 표시**: 각 필드별 추출 확신도

---

## 2. 검토 결과 (사용자 답변)

### Q1. 시험 합의서 양식
- **TTA 표준 단일 양식** 사용 (버전 차이 없음)
- 정규식 최적화 시 단일 양식만 고려하면 됨

### Q2. 파싱 결과 검증 UI
- **상세 모달 방식** 채택
- 파싱 완료 시 모달에서 추출 필드를 보여주고 수정 가능하게

---

## 3. 기능 범위

### 3.1 MVP (이번 구현 대상)

#### A. Cloud Function 리팩토링
- `onAgreementUpload`에서 기존 모듈(`parseDocumentFromBuffer`, `cleanText`) 활용
- 텍스트 정제 후 필드 추출로 변경
- `extractAgreementFields` 정규식 개선
  - `cleanName()`의 영문자 전체 제거 로직 수정
  - `workingDays` 추출 로직 추가
  - 더 견고한 패턴 (공백/줄바꿈 변형 대응)
- 각 필드별 추출 confidence 점수 추가

#### B. 파싱 결과 검증/수정 UI
- 파싱 완료 시 결과 확인 모달 (현재 "추출 완료" 모달 확장)
- 각 필드를 보여주고 인라인 수정 가능
- 수정된 값을 Firestore에 저장
- 미추출 필드 하이라이트 표시

#### C. 파싱 상태 개선
- 필드별 추출 성공/실패 상태 저장
- 추출률(%) 표시 (10개 필드 중 N개 추출됨)
- 파싱 로그/디버그 정보 저장 (개발자용)

### 3.2 비 변경 사항
- PDF 업로드 흐름 (Storage 업로드 → Cloud Function 트리거) 유지
- 기존 Firestore 컬렉션 구조 유지 (`agreementDocs`)
- 자동 채우기 로직 유지 (검증 UI에서 확인 후 적용으로 변경 가능)

### 3.3 향후 확장 (이번 범위 아님)
- OCR 지원 (이미지 스캔 PDF)
- AI 기반 필드 추출 (LLM)
- 다양한 양식 템플릿 지원
- 합의서 외 다른 문서 파싱 (시험계획서 등)

---

## 4. 기술 전략

### 4.1 Cloud Function 변경

```
현재:
  pdf-parse(buffer) → raw text → extractAgreementFields(text) → parsed

개선:
  parseDocumentFromBuffer(buffer, fileName, cleaningOptions)
    → { rawText, cleanedText, metadata }
  extractAgreementFields(cleanedText)
    → { fields, confidence }
  → parsed (with confidence scores)
```

### 4.2 AgreementParsed 타입 확장

```typescript
// 기존
type AgreementParsed = {
  parseStatus?: 'pending' | 'parsed' | 'failed';
  // ... 필드들
};

// 개선
type AgreementParsed = {
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseProgress?: number;
  extractionRate?: number;            // 추출률 (0~100)
  // ... 기존 필드들
  workingDays?: string;               // 추출 로직 추가
  fieldConfidence?: Record<string, number>;  // 필드별 신뢰도
  userVerified?: boolean;             // 사용자 검증 완료 여부
};
```

### 4.3 검증 UI 위치

```
파싱 완료 시:
  현재: 작은 "추출 완료" 모달 → 자동 채우기

  개선: 상세 결과 모달 → 필드별 표시/수정 → 확인 → 자동 채우기
```

---

## 5. 기존 코드 영향도

### 변경 필요한 파일

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| `functions/src/index.ts` | onAgreementUpload 리팩토링, extractAgreementFields 개선 | High |
| `src/types/testSetup.ts` | AgreementParsed 타입 확장 | Medium |
| `src/features/test-setup/components/TestSetupPage.tsx` | 파싱 결과 검증 모달 추가 | Medium |
| `src/features/test-setup/hooks/useTestSetupState.ts` | 자동 채우기 로직 수정 | Low |

### 변경하지 않는 파일
- `functions/src/parsers/pdfParser.ts` - 그대로 활용
- `functions/src/parsers/index.ts` - 그대로 활용
- `functions/src/utils/textCleaner.ts` - 그대로 활용
- Firebase Storage 구조 - 변경 없음
- Firestore 보안 규칙 - 변경 없음

---

## 6. 구현 순서

### Phase 1: Cloud Function 리팩토링
1. `onAgreementUpload`에서 `parseDocumentFromBuffer` + `cleanText` 활용
2. `cleanName()` 영문자 제거 로직 수정
3. `workingDays` 추출 로직 추가
4. 필드별 confidence 점수 계산

### Phase 2: 타입 & 데이터 확장
1. `AgreementParsed` 타입 확장 (extractionRate, fieldConfidence, userVerified)
2. Firestore 저장 포맷 업데이트

### Phase 3: 파싱 결과 검증 UI
1. 파싱 결과 상세 모달 컴포넌트
2. 필드별 인라인 수정 기능
3. 수정값 Firestore 반영
4. 자동 채우기 연동

### Phase 4: 검증
1. 실제 시험 합의서 PDF로 파싱 테스트
2. Cloud Function 배포 + 테스트
3. `tsc --noEmit` 통과 (클라이언트)
4. Functions 빌드 통과

---

## 7. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 정규식 변경으로 기존 정상 추출 케이스가 깨짐 | High | 실제 PDF로 변경 전/후 비교 테스트 |
| Cloud Function 배포 실패 | Medium | 로컬에서 Functions 빌드 확인 후 배포 |
| 시험 합의서 양식 버전 차이 | Medium | 여러 버전 PDF 샘플 확보 후 테스트 |
| cleanText가 합의서 내용까지 삭제 | Low | 텍스트 정제 옵션 보수적 설정 |

---

## 8. 성공 기준

- [ ] `onAgreementUpload`에서 `parseDocumentFromBuffer` + `cleanText` 사용
- [ ] `cleanName()`이 영문 제품명을 보존
- [ ] `workingDays` 필드 추출 동작
- [ ] 파싱 결과 검증 모달에서 추출된 필드 확인 가능
- [ ] 사용자가 추출 결과를 수정하고 저장 가능
- [ ] 추출률(%) 표시
- [ ] 기존 자동 채우기 정상 동작
- [ ] Functions 빌드 + 클라이언트 빌드 통과
