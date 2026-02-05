# 📝 GsTestGuide Development Roadmap

## Phase 1: Foundation (기반 및 데이터 설계)
- [ ] **데이터 모델 확장 (운영환경 추가)**
    - [ ] `src/types/models.ts`: `Project` 인터페이스에 `operatingEnvironment` (string) 필드 추가.
    - [ ] `src/features/test-setup`: 시험 정보 수정 페이지에 '운영환경' 입력 란(Textarea) 추가 및 저장 로직 구현.
- [ ] **디렉토리 및 UI 정리**
    - [ ] `src/components`의 모달들을 `src/features`로 이동.
    - [ ] 공통 UI(`Button`, `Input`) 스타일 통일.

## Phase 2: Core Process Implementation (프로세스 구현)
- [x] **시험 식별 (SETUP):** 합의서 파싱 완료.
- [ ] **설계 (DESIGN)**
    - [ ] 기능 리스트 및 TC 작성 기능 고도화.
- [ ] **수행 (EXECUTION) - 초기**
    - [ ] 테스트 실행 화면에서 `Pass/Fail` 처리 및 **즉시 결함 보고** 연동.
- [ ] **수행 (EXECUTION) - 회귀 및 패치 (조건부 로직)**
    - [ ] **기능 회귀 모드:** 1차 패치 후 기능 테스트 항목에 대한 회귀 테스트 UI 구현.
    - [ ] **조건부 활성화(Locking):** 기능 회귀 테스트가 `All Pass` 상태일 때만 보안/성능 테스트 버튼이 활성화되도록 로직 구현.
    - [ ] **파생 결함 마킹:** 새롭게 발견된 결함을 `3차` 및 `파생`으로 자동 마킹.

## Phase 3: Automation & Backend (완벽한 리포트 생성)
- [ ] **Cloud Functions (Report)**
    - [ ] **템플릿 관리:** `functions/assets/templates/defect_report_template_fix.xlsx` 업로드.
    - [ ] **헤더 치환 로직:** A2, D2 셀 등의 `{Placeholder}` 텍스트 치환 기능 구현.
    - [ ] **동적 행 추가:** 템플릿 행의 스타일을 상속받아 결함 데이터 행을 추가하고, 템플릿 행은 삭제.
    - [ ] **Data Validation:** 결함정도/발생빈도 컬럼에 드롭다운 메뉴 적용.

## Phase 4: Polish (완성도)
- [ ] **유효성 검사**
    - [ ] 4차 리포트 이후에는 결함 수정 상태 변경을 막는 로직(Lock) 추가.
    