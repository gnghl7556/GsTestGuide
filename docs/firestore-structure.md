# Firestore 데이터 구조 요약

이 문서는 **현재 코드 기준**으로 Firestore에 저장/조회되는 구조를 정리한 것입니다.

## 1) 컬렉션 트리(ERD 스타일)

```
projects/{projectId}
  ├─ features/{featureId}
  ├─ testCases/{testCaseId}
  └─ defects/{defectId}

testDocuments/{testNumber}
agreementDocs/{testNumber}
quickReviews/{testNumber}
users/{userId}
plContacts/{plId}
```

## 2) 컬렉션별 필드 정리

### projects/{projectId}
- 저장 위치: `src/hooks/useTestSetupState.ts`
- 필드
  - 식별/메타: `projectId`, `projectYear?`, `projectNumber?`, `createdBy`, `updatedAt`
  - 상태/일정: `status`, `startDate`, `endDate`, `scheduleWorkingDays`, `scheduleStartDate`, `scheduleDefect1`, `scheduleDefect2`, `schedulePatchDate`, `scheduleEndDate`
  - 업체/담당자: `companyName`, `companyContactName`, `companyContactPhone`, `companyContactEmail`
  - PL/시험원: `plId`, `plName`, `plPhone`, `plEmail`, `testerId`, `testerName`, `testerPhone`, `testerEmail`
  - 합의서 요약: `contractType`

### testDocuments/{testNumber}
- 저장 위치: `src/hooks/useTestSetupState.ts`
- 필드
  - `testNumber`
  - `docs`: 배열
    - 항목 구조: `{ docType, fileName?, url?, source? }`
  - `updatedAt`

### agreementDocs/{testNumber}
- 저장 위치: `src/hooks/useTestSetupState.ts`, `functions/src/index.ts`
- 필드
  - 업로드 메타: `testNumber`, `storagePath`, `fileName`, `uploadedAt`
  - 파싱 상태: `parseStatus`, `parseProgress`, `parseError?`, `parsedAt?`
  - `parsed`: 합의서 추출 결과 객체
    - 예: `applicationNumber`, `contractType`, `certificationType`, `담당자`, `연락처`, `이메일`

### quickReviews/{testNumber}
- 저장 위치: `src/pages/AppShell.tsx`
- 필드
  - `testNumber`
  - `items`: `{ [requirementId]: { requirementId, answers, inputValues, updatedAt } }`

### users/{userId}
- 저장 위치: `src/hooks/useDirectoryActions.ts`
- 필드
  - `userId`, `name`, `rank`, `email`, `phone`, `createdAt`, `updatedAt`

### plContacts/{plId}
- 저장 위치: `src/hooks/useDirectoryActions.ts`
- 필드
  - 입력값 + `createdAt`

### projects/{projectId}/features/{featureId}
- 저장 위치: `src/components/FeatureListModal.tsx`
- 필드
  - `featureId`, `category1..4`, `description`, `version`, `changeType`

### projects/{projectId}/testCases/{testCaseId}
- 저장 위치: `src/components/TestCaseModal.tsx`
- 필드
  - `testCaseId`, `featureId`, `scenario`, `preCondition`, `steps`, `expectedResult`, `status`, `version`

### projects/{projectId}/defects/{defectId}
- 저장 위치: `src/components/DefectReportModal.tsx`
- 필드
  - `defectId`, `linkedTestCaseId`, `summary`, `testEnvironment`, `severity`, `frequency`,
    `qualityCharacteristic`, `accessPath`, `stepsToReproduce`, `description`, `ttaComment`,
    `status`, `evidenceFiles`, `reportedAt`

## 3) 중복/정리 포인트 (제안)

- `projects` 문서 내 `projectId`와 문서 ID가 동일. 필요 시 `projectId` 필드는 제거 가능.
- `testNumber`는 `projects` 문서 ID와 동일. `projects` 외부 문서(`testDocuments`, `agreementDocs`, `quickReviews`)는
  문서 ID 자체가 testNumber 역할. 별도 필드 유지 여부는 정책화 필요.
- `testerName/Phone/Email`은 `users` 컬렉션 정보와 중복. 스냅샷 용도면 유지 가능.
- `companyName/projectName` 등은 합의서 파싱 값과 수동 입력이 섞일 수 있어, 단일 진실 소스 정책 필요.

## 4) 합의서 추출 관련 변경

- **업체명/제품명 자동 추출은 제거** (필드는 유지, 수동 입력만 사용)
- `agreementDocs.parsed`에는 업체명/제품명 필드를 저장하지 않음

