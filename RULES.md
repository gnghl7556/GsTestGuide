# 📅 Project: GS Certification Test Guide (GsTestGuide)

## 1. Project Overview
* **Goal:** GS 인증 시험의 전 과정(준비, 설계, 수행, 패치, 회귀, 종료)을 체계적으로 관리하고 산출물을 자동화한다.
* **Target User:** GS 인증 시험원(Tester), PL(Project Leader).
* **Key Value:** 복잡한 결함 리포트 차수 관리(1차~4차), 회귀 테스트 추적, 산출물 자동 생성.

## 2. Tech Stack
* **Framework:** React (Vite) + TypeScript
* **Styling:** Tailwind CSS (Custom Color Palette)
* **Icons:** Lucide React
* **State Management:** React Context API (`TestSetupProvider`) + Local State
* **Backend & DB:** Firebase (Firestore, Storage, Authentication)
* **Serverless:** Firebase Cloud Functions (`pdf-parse`, `mammoth`, `xlsx`)

## 3. Coding Rules

### 3.1. General Principles
* **Feature-First:** `src/features/*` 폴더 구조를 엄수한다.
* **SoC:** UI(`components`)와 로직(`hooks`)을 분리한다.
* **Types:** `src/types`에 정의된 `Project`, `Defect`, `TestCase` 인터페이스를 사용한다.

### 3.2. File Structure
* `src/features/test-setup`: 시험 식별, 합의서, 환경 구성
* `src/features/design`: 기능 명세, TC 설계
* `src/features/execution`: 테스트 수행, 결함 보고(차수별 관리), 회귀 테스트
* `src/features/report`: 최종 산출물 및 통계
* `src/components/ui`: 공통 UI (Button, Input, Modal)

---

## 4. GS Certification Process (Workflow)

이 프로젝트는 시간의 흐름과 결함 조치 단계에 따라 다음과 같이 진행된다.

### **Phase 1: SETUP (준비)**
* 시험 환경 구성, 자리 배정, 시험 합의서 분석 및 제품 설치 확인.

### **Phase 2: DESIGN (설계)**
* 기능 리스트 작성 (`DUR-PLAN`) 및 테스트 케이스(TC) 설계 (`DUR-DESIGN`).

### **Phase 3: EXECUTION (수행 및 결함 관리)**
가장 핵심적인 단계로, 패치 차수 및 파생 결함 여부에 따라 분기된다.

1.  **Initial Test (초기 수행):**
    * 제품 설치 직후 초기 캡처 수행.
    * 기능/비기능(보안, 성능 등) 전수 테스트.
    * **Output:** `[1차/2차 결함 리포트]` 생성 및 전달.

2.  **1st Patch & Regression (1차 패치 및 회귀):**
    * 업체 1차 패치 후 **기능 회귀 테스트** 우선 수행.
    * **Condition (조건부 실행):**
        * **Case A (기능 파생 결함 발견):** 보안/성능 테스트를 **생략**하고 즉시 리포트 발행.
        * **Case B (기능 파생 결함 없음):** **보안/성능 테스트**를 수행하여 비기능 파생 결함 확인.
    * **Output:** 파생 결함 발견 시 `[3차 결함 리포트]` 생성 및 2차 패치 요청.

3.  **2nd Patch & Final Test (2차 패치 및 최종):**
    * 업체 2차 패치 후 최종 캡처.
    * 최종 기능 회귀 및 보안/성능 테스트 수행.
    * **Output:** `[4차 결함 리포트]` (최종 결과).
    * *Note:* 이 단계 이후 발견된 결함은 수정 불가 (심사 상정).

### **Phase 4: COMPLETION (종료)**
* 최종 산출물 정리, 테스트 데이터 삭제 및 장비 반납.

## 5. Data Constraints & Formatting

### 5.1. Excel Template Strategy
* **Placeholder Syntax:** 엑셀 템플릿 내 동적 데이터는 중괄호 `{Key}` 형식을 사용한다. (예: `{TestNumber}`, `{Date}`)
* **Header Logic:** 코드 내에서 하드코딩하지 않고, 템플릿 셀의 문자열을 읽어 `replace('{Key}', value)` 방식으로 처리한다.
* **Row Logic:** 리스트 데이터는 템플릿의 '샘플 행' 스타일을 복제(Copy Style)하여 추가하고, 처리가 끝나면 샘플 행을 삭제한다.

### 5.2. Column Value Constraints (Enum)
* **결함 정도 (Severity):** `H` (High), `M` (Medium), `L` (Low)
* **발생 빈도 (Frequency):** `A` (Always), `I` (Intermittent)
* **유효성 검사:** 엑셀 생성 시 해당 컬럼에 `Data Validation` (List Type)을 적용한다.