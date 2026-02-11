# Design: PDF 파싱 품질 개선

> **Feature**: PDF-파싱-품질-개선
> **Created**: 2026-02-10
> **Plan Reference**: `docs/01-plan/features/PDF-파싱-품질-개선.plan.md`

---

## 1. 아키텍처 개요

### 1.1 핵심 설계 원칙
- **기존 모듈 활용**: `parsers/`, `textCleaner.ts`를 `onAgreementUpload`에서 실제 사용
- **하위 호환**: Firestore `agreementDocs` 컬렉션 구조 유지, 새 필드 추가만
- **프론트 독립 컴포넌트**: 검증 모달을 별도 컴포넌트로 분리 (TestSetupPage 비대 방지)
- **자동 채우기 유지**: 기존 `useTestSetupState`의 자동 채우기 로직은 그대로 유지

### 1.2 변경 흐름

```
[현재]
  pdf-parse(buffer) → raw text → extractAgreementFields(text) → Firestore 저장
  → onSnapshot → 자동 채우기 → "추출 완료" 간단 모달

[개선]
  parseDocumentFromBuffer(buffer, fileName, cleaningOptions)
    → { rawText, cleanedText, metadata }
  extractAgreementFields(cleanedText)
    → { fields, confidence, extractionRate }
  → Firestore 저장 (confidence 포함)
  → onSnapshot → "추출 결과 검증" 상세 모달 → 사용자 수정 → 확인 → 자동 채우기
```

---

## 2. Backend 변경 (Cloud Function)

### 2.1 onAgreementUpload 리팩토링

**파일**: `functions/src/index.ts`

**변경 전** (라인 75-102):
```typescript
// 직접 pdfParse 호출
const buffer = await fs.promises.readFile(localPath);
const result = await pdfParse(buffer);
text = result.text || '';
```

**변경 후**:
```typescript
import { parseDocumentFromBuffer } from './parsers';

const buffer = await fs.promises.readFile(localPath);
const parseResult = await parseDocumentFromBuffer(buffer, fileName, {
  removePageNumbers: true,
  removeHeadersFooters: false,  // 합의서는 머리글이 중요할 수 있음
  removeWatermarks: true,
  removeRepeatingPatterns: false
});

if (!parseResult.success || !parseResult.cleanedText.trim()) {
  // 실패 처리 (기존과 동일)
}

const text = parseResult.cleanedText;
```

**설계 결정**: `removeHeadersFooters`와 `removeRepeatingPatterns`는 false로 설정. 합의서는 양식이 고정되어 있어 반복 패턴 제거 시 필드 라벨이 삭제될 수 있음.

---

### 2.2 extractAgreementFields 개선

**파일**: `functions/src/index.ts`

#### A. cleanName() 수정

**변경 전** (라인 291-298):
```typescript
const cleanName = (raw: string) => {
  return raw
    .replace(/\([^)]*\)/g, '')
    .replace(/\s*영문명[\s\S]*$/g, '')
    .replace(/[A-Za-z]/g, '')       // ← 영문자 전부 제거 (버그)
    .replace(/\s{2,}/g, ' ')
    .trim();
};
```

**변경 후**:
```typescript
const cleanName = (raw: string) => {
  return raw
    .replace(/\s*영문명[\s\S]*$/g, '')    // "영문명" 이후 텍스트 제거
    .replace(/\([^)]*\)/g, '')             // 괄호 내용 제거
    .replace(/\s{2,}/g, ' ')               // 연속 공백 정리
    .trim();
};
```

**설계 결정**: 영문자 제거 로직을 삭제. 제품명에 영문이 포함될 수 있음 (예: "SmartPDF Pro").

#### B. workingDays 추출 추가

```typescript
const extractWorkingDays = () => {
  // 패턴 1: "시험 소요 기간" 또는 "소요기간" 근처 숫자
  const m1 = execOnce(
    /(?:시험\s*)?소요\s*기간[\s\S]{0,100}?(\d+)\s*(?:일|영업일|근무일)/,
    normalized
  );
  if (m1?.[1]) return m1[1];

  // 패턴 2: "Working Days" 또는 "작업일수"
  const m2 = execOnce(
    /(?:Working\s*Days?|작업\s*일수|근무\s*일수)\s*[:：]?\s*(\d+)/i,
    normalized
  );
  if (m2?.[1]) return m2[1];

  return undefined;
};
```

#### C. confidence 점수 계산

```typescript
type FieldExtraction = {
  value: string;
  confidence: number;  // 0~100
};

const computeConfidence = (value: string | undefined, pattern: string): number => {
  if (!value || !value.trim()) return 0;
  // 기본 점수: 값이 존재하면 70
  let score = 70;
  // 길이가 합리적이면 +15
  if (value.length >= 2 && value.length <= 100) score += 15;
  // 특수문자만으로 구성되지 않으면 +15
  if (/[가-힣a-zA-Z0-9]/.test(value)) score += 15;
  return Math.min(score, 100);
};
```

#### D. 반환 타입 변경

**변경 전**:
```typescript
return {
  applicationNumber,
  contractType,
  // ... 필드들 (string)
};
```

**변경 후**:
```typescript
const fields = {
  applicationNumber, contractType, certificationType,
  managerName, managerMobile, managerEmail,
  managerDepartment, managerJobTitle,
  companyName, productNameKo, workingDays
};

// 추출된 필드 수 계산
const totalFields = Object.keys(fields).length;
const extractedCount = Object.values(fields).filter((v) => v && v.trim() && v !== '확인 필요').length;
const extractionRate = Math.round((extractedCount / totalFields) * 100);

// 필드별 confidence
const fieldConfidence: Record<string, number> = {};
for (const [key, value] of Object.entries(fields)) {
  fieldConfidence[key] = computeConfidence(value, key);
}

return { ...fields, extractionRate, fieldConfidence };
```

---

### 2.3 Firestore 저장 포맷 변경

**변경 전**:
```typescript
await db.collection('agreementDocs').doc(testNumber).set({
  parseStatus: 'parsed',
  parsed: cleanParsed,       // { applicationNumber, ... }
  parsedAt, parseProgress: 100
}, { merge: true });
```

**변경 후**:
```typescript
const { extractionRate, fieldConfidence, ...fieldValues } = parsed;

await db.collection('agreementDocs').doc(testNumber).set({
  parseStatus: 'parsed',
  parsed: removeUndefined(fieldValues),
  extractionRate,            // 신규: 추출률 (0~100)
  fieldConfidence,           // 신규: 필드별 신뢰도
  userVerified: false,       // 신규: 사용자 검증 완료 여부
  parsedAt: FieldValue.serverTimestamp(),
  parseProgress: 100
}, { merge: true });
```

---

## 3. Frontend 변경

### 3.1 AgreementParsed 타입 확장

**파일**: `src/types/testSetup.ts`

```typescript
export type AgreementParsed = {
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseProgress?: number;
  extractionRate?: number;                        // 신규
  fieldConfidence?: Record<string, number>;       // 신규
  userVerified?: boolean;                         // 신규
  applicationNumber?: string;
  contractType?: string;
  certificationType?: string;
  productNameKo?: string;
  companyName?: string;
  managerName?: string;
  managerMobile?: string;
  managerEmail?: string;
  managerDepartment?: string;
  managerJobTitle?: string;
  workingDays?: string;
};
```

---

### 3.2 AgreementVerifyModal 컴포넌트 (신규)

**파일**: `src/features/test-setup/components/AgreementVerifyModal.tsx`

**Props**:
```typescript
type AgreementVerifyModalProps = {
  open: boolean;
  onClose: () => void;
  parsed: AgreementParsed;
  onSave: (corrected: Record<string, string>) => void;
};
```

**UI 구조**:
```
┌──────────────────────────────────────────────────────┐
│ 합의서 추출 결과                    추출률: 82% (9/11) │
├──────────────────────────────────────────────────────┤
│                                                      │
│  신청번호        [GS-A-25-0226          ] ● 100%     │
│  계약유형        [최초계약               ] ● 100%     │
│  인증유형        [신규인증               ] ● 100%     │
│  ─────────────────────────────────────────           │
│  제품명(국문)    [스마트PDF 프로          ] ● 85%      │
│  업체명          [(주)테스트소프트        ] ● 85%      │
│  ─────────────────────────────────────────           │
│  담당자 성명     [홍길동                 ] ● 70%      │
│  담당자 연락처   [010-1234-5678          ] ● 100%     │
│  담당자 이메일   [hong@test.co.kr        ] ● 100%     │
│  담당자 부서     [품질관리팀             ] ● 70%      │
│  담당자 직급     [과장                   ] ● 70%      │
│  ─────────────────────────────────────────           │
│  시험 소요기간   [                       ] ○ 미추출   │
│                                                      │
│  ⚠ 미추출 필드가 있습니다. 직접 입력해주세요.          │
│                                                      │
│                           [건너뛰기]  [확인 및 적용]   │
└──────────────────────────────────────────────────────┘
```

**동작**:
1. `parseStatus === 'parsed'`일 때 기존 "추출 완료" 모달 대신 이 모달 표시
2. 각 필드는 `<input>` 으로 편집 가능
3. confidence가 0인 필드(미추출)는 빈 입력 + "○ 미추출" 배지
4. confidence > 0인 필드는 추출된 값 표시 + "● {n}%" 배지
5. "확인 및 적용" 클릭 → `onSave` 호출 → Firestore에 수정값 저장 + `userVerified: true`
6. "건너뛰기" 클릭 → 기존처럼 자동 채우기 그대로 진행
7. `parseStatus === 'failed'`일 때는 기존 실패 모달 그대로 유지

**필드 표시 순서 & 그룹**:
```typescript
const FIELD_GROUPS = [
  {
    label: '기본 정보',
    fields: [
      { key: 'applicationNumber', label: '신청번호' },
      { key: 'contractType', label: '계약유형' },
      { key: 'certificationType', label: '인증유형' },
    ]
  },
  {
    label: '제품/업체',
    fields: [
      { key: 'productNameKo', label: '제품명 (국문)' },
      { key: 'companyName', label: '업체명' },
    ]
  },
  {
    label: '업무 담당자',
    fields: [
      { key: 'managerName', label: '담당자 성명' },
      { key: 'managerMobile', label: '담당자 연락처' },
      { key: 'managerEmail', label: '담당자 이메일' },
      { key: 'managerDepartment', label: '담당자 부서' },
      { key: 'managerJobTitle', label: '담당자 직급' },
    ]
  },
  {
    label: '시험 정보',
    fields: [
      { key: 'workingDays', label: '시험 소요기간 (일)' },
    ]
  }
];
```

**스타일링**:
- 기존 TestSetupPage의 모달 스타일 (rounded-2xl, border-slate-200, bg-white)
- confidence 배지: 80+% → green, 50~79% → amber, 0% → slate(미추출)
- 미추출 필드 입력란: border-dashed, bg-amber-50/30

---

### 3.3 TestSetupPage 변경

**파일**: `src/features/test-setup/components/TestSetupPage.tsx`

#### A. 기존 추출 완료 모달 → AgreementVerifyModal로 교체

**변경 전** (라인 1065-1098):
```tsx
{agreementModalOpen && agreementModalStatus && (
  <div className="absolute inset-0 z-20 ...">
    {/* "추출 완료/실패" 간단 모달 */}
  </div>
)}
```

**변경 후**:
```tsx
{agreementModalOpen && agreementModalStatus === 'parsed' && agreementParsed && (
  <AgreementVerifyModal
    open={true}
    onClose={() => setAgreementModalOpen(false)}
    parsed={agreementParsed}
    onSave={handleVerifiedSave}
  />
)}

{agreementModalOpen && agreementModalStatus === 'failed' && (
  // 실패 모달은 기존 그대로 유지
  <div className="absolute inset-0 z-20 ...">
    <div>합의서 추출 실패</div>
  </div>
)}
```

#### B. handleVerifiedSave 핸들러 추가

```typescript
const handleVerifiedSave = async (corrected: Record<string, string>) => {
  // 1. Firestore에 수정된 값 저장
  if (db && testNumber) {
    await setDoc(doc(db, 'agreementDocs', testNumber), {
      parsed: corrected,
      userVerified: true
    }, { merge: true });
  }
  // 2. 모달 닫기
  setAgreementModalOpen(false);
};
```

---

### 3.4 useTestSetupState 변경

**파일**: `src/features/test-setup/hooks/useTestSetupState.ts`

#### onSnapshot 리스너에서 새 필드 수신

**변경**: `data` 타입에 새 필드 추가 (라인 113-131)

```typescript
const data = snap.data() as {
  parseStatus?: 'pending' | 'parsed' | 'failed';
  parseProgress?: number;
  extractionRate?: number;           // 신규
  fieldConfidence?: Record<string, number>;  // 신규
  userVerified?: boolean;            // 신규
  parsed?: {
    // ... 기존 필드들
    workingDays?: string;            // 신규
  };
};
```

`nextAgreementParsed` 구성에 새 필드 포함:

```typescript
const nextAgreementParsed = {
  parseStatus: data.parseStatus,
  parseProgress: data.parseProgress,
  extractionRate: data.extractionRate,
  fieldConfidence: data.fieldConfidence,
  userVerified: data.userVerified,
  ...normalizedParsed
};
```

---

## 4. 파일 목록 & 구현 순서

### Phase 1: Cloud Function 리팩토링

| 순서 | 파일 | 작업 |
|:----:|------|------|
| 1-1 | `functions/src/index.ts` | `onAgreementUpload`에서 `parseDocumentFromBuffer` + `cleanText` 사용 |
| 1-2 | `functions/src/index.ts` | `cleanName()` 영문자 제거 로직 제거 |
| 1-3 | `functions/src/index.ts` | `workingDays` 추출 로직 추가 |
| 1-4 | `functions/src/index.ts` | confidence 점수 + extractionRate 계산 |
| 1-5 | `functions/src/index.ts` | Firestore 저장 포맷 업데이트 |

### Phase 2: 타입 확장

| 순서 | 파일 | 작업 |
|:----:|------|------|
| 2-1 | `src/types/testSetup.ts` | `AgreementParsed` 타입 확장 |
| 2-2 | `src/features/test-setup/hooks/useTestSetupState.ts` | onSnapshot 리스너 새 필드 수신 |

### Phase 3: 파싱 결과 검증 모달

| 순서 | 파일 | 작업 |
|:----:|------|------|
| 3-1 | `src/features/test-setup/components/AgreementVerifyModal.tsx` | 신규 생성 |
| 3-2 | `src/features/test-setup/components/TestSetupPage.tsx` | 기존 모달 → AgreementVerifyModal 교체 |

### Phase 4: 검증

| 순서 | 작업 |
|:----:|------|
| 4-1 | `tsc --noEmit` 통과 (클라이언트) |
| 4-2 | `vite build` 통과 (클라이언트) |
| 4-3 | Functions 빌드 통과 (`cd functions && npm run build`) |

---

## 5. 스타일링 규칙

### 검증 모달
- 기존 TestSetupPage 모달과 동일한 스타일 (bg-white, rounded-2xl, shadow-xl)
- 단, z-index는 z-20 (기존 모달과 동일)
- 필드 입력: slate 테마의 기존 input 스타일
- confidence 배지:
  - 80~100%: `bg-green-100 text-green-700`
  - 50~79%: `bg-amber-100 text-amber-700`
  - 0% (미추출): `bg-slate-100 text-slate-500` + border-dashed

### 반응형
- 모달 최대 너비: `max-w-2xl`
- 필드 그리드: 1열 (모바일), 2열 (md 이상)

---

## 6. 기존 코드 재사용 매핑

| 필요 기능 | 기존 코드 | 재사용 방법 |
|----------|----------|------------|
| PDF 텍스트 추출 | `parsers/pdfParser.ts` | `parseDocumentFromBuffer()` 통해 호출 |
| 텍스트 정제 | `utils/textCleaner.ts` | `cleaningOptions` 전달 |
| 자동 채우기 | `useTestSetupState.ts` 라인 139-172 | 그대로 유지 |
| Firestore 저장 | `setDoc(doc(db, 'agreementDocs', ...))` | 기존 패턴 유지 |
| 모달 스타일 | TestSetupPage 기존 모달들 | 동일 클래스 |
