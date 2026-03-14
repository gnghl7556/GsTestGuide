# Plan: 대시보드 고도화 (dashboard-enhancement)

> 작성일: 2026-03-14
> Feature: dashboard-enhancement
> Phase: Plan
> 참조: `docs/BRAINSTORM_2026-03-14.md` §2.2 D-1, §2.6 B-3

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 현재 OverviewPage(대시보드)는 시험 설정/선택 UI만 존재하고, 프로젝트가 선택된 후에도 진행 현황·결함·일정을 한눈에 파악할 수 없어 시험원이 ExecutionPage에 직접 진입해야 함 |
| **솔루션** | 프로젝트 선택 후 표시되는 대시보드 위젯 영역 추가: 진행률 요약, D-Day 카운트다운, 결함 현황, 최근 활동 타임라인 |
| **기능/UX 효과** | 시험 현황을 한 화면에서 즉시 파악 가능. 별도 페이지 진입 없이 진행률, 결함 수, 일정까지 확인하여 의사결정 속도 향상 |
| **핵심 가치** | 시험원·PL 모두에게 시험 상태 가시성 제공, 업무 효율 향상, 대시보드 역할 본연의 기능 확보 |

---

## 1. 현황 분석

### 1.1 현재 OverviewPage 구조

```
OverviewPage
  └── TestSetupView
      └── TestSetupPage (920줄)
          ├── [왼쪽] 사용자 선택 → 시험 선택 (Existing/Create 모드)
          └── [오른쪽] 시험번호 입력 or ScheduleCalendar
```

**문제점:**
- 프로젝트 선택 후에도 "시험 설정" UI만 표시
- 진행률은 ExecutionPage의 `ProgressDashboard`에서만 확인 가능
- 결함 현황, D-Day, 최근 활동 등 대시보드 정보 부재
- PL이 진행 현황을 확인하려면 ExecutionPage에 직접 진입해야 함

### 1.2 재활용 가능한 기존 자산

| 자산 | 위치 | 활용 방안 |
|------|------|---------|
| `ProgressDashboard` | `src/features/checklist/components/` | 진행률 위젯의 데이터 로직 참조 |
| `ScheduleCalendar` | `src/features/test-setup/components/` | 미니 일정 위젯으로 축소 배치 |
| `useDefects` | `src/features/defects/hooks/` | 결함 현황 데이터 |
| `progressByTestNumber` | `TestSetupProvider` | 프로젝트별 진행률 |

---

## 2. 기능 요구사항

### FR-01: 대시보드 위젯 영역

프로젝트가 선택된 상태(`selectedProject` 존재)에서 시험 설정 카드 하단 또는 오른쪽 컬럼에 대시보드 위젯 영역을 추가한다.

```
┌──────────────────────────────────────────────────┐
│ OverviewPage (프로젝트 선택 후)                      │
├────────────────┬─────────────────────────────────┤
│ [기존]          │  [기존] ScheduleCalendar          │
│ 사용자/시험 선택  │                                  │
│                │                                  │
├────────────────┴─────────────────────────────────┤
│ ★ 대시보드 위젯 영역 (신규)                           │
│ ┌────────────┬─────────────┬─────────────────────┤
│ │ 진행률 요약  │ D-Day       │ 결함 현황             │
│ │ (도넛 차트) │ 카운트다운    │ (차수별 건수)          │
│ └────────────┴─────────────┴─────────────────────┤
└──────────────────────────────────────────────────┘
```

### FR-02: 진행률 요약 위젯

- 전체 체크리스트 완료율 (%) — 원형 도넛 차트 (CSS/SVG)
- 상태별 건수: 적합 / 부적합 / 보류 / 미검토
- 단계별(SETUP/EXECUTION/COMPLETION) 진행 바
- 데이터: `progressByTestNumber` + Firestore `quickReviews/{testNumber}` 조회

### FR-03: D-Day 카운트다운 위젯

- 가장 가까운 마일스톤까지 남은 일수 표시
- 마일스톤 종류: 시험시작, 1차리포트, 패치회귀, 최종리포트, 시험종료
- 데이터: `project.schedule` (이미 프로젝트 모델에 존재)
- 지난 마일스톤은 회색 처리, 다음 마일스톤은 강조

### FR-04: 결함 현황 위젯

- 차수별(1~4차) 결함 건수 표시
- 심각도별(H/M/L) 분포 (미니 바 차트)
- 총 결함 수 + 해결률
- 데이터: `useDefects(projectId)` hook 활용

### FR-05: 시험 시작 버튼 개선

- 프로젝트 선택 후 "시험 시작" 버튼을 대시보드 위젯 영역 상단에 눈에 띄게 배치
- 현재 하단에 숨겨진 형태 → 위젯 영역 헤더에 CTA(Call to Action)로 이동

---

## 3. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **렌더링 성능** | 위젯 데이터 로딩 시 Skeleton UI 표시, 불필요한 리렌더링 방지 |
| **반응형** | 위젯 그리드가 화면 크기에 따라 1~3열로 자동 조정 |
| **접근성** | 차트에 aria-label, 색상 외 텍스트 정보 병기 |
| **다크 모드** | 시맨틱 토큰 사용으로 자동 대응 |

---

## 4. 범위 제외

| 제외 항목 | 사유 |
|----------|------|
| recharts 등 외부 차트 라이브러리 | SVG/CSS로 충분, 번들 크기 증가 방지 |
| 최근 활동 타임라인 | Firestore에 활동 로그 컬렉션 없음, 인프라 추가 필요 → 별도 피처 |
| 시험 통계 대시보드 (크로스 프로젝트) | 단일 프로젝트 대시보드 우선, 통계는 장기 항목 |
| 읽기 전용 공유 링크 | 인증 체계 변경 필요, 별도 피처 |

---

## 5. 구현 전략

### Step 1: DashboardWidgets 컴포넌트 생성

`src/features/test-setup/components/DashboardWidgets.tsx` — 위젯 영역 컨테이너 + 3개 위젯 카드

### Step 2: 진행률 위젯 구현

`ProgressSummaryWidget` — SVG 도넛 차트 + 상태별 건수. ProgressDashboard의 데이터 로직 참조.

### Step 3: D-Day 위젯 구현

`DDayWidget` — 마일스톤 목록 + 카운트다운. project.schedule 데이터 사용.

### Step 4: 결함 현황 위젯 구현

`DefectSummaryWidget` — 차수별/심각도별 분포. useDefects hook 활용.

### Step 5: TestSetupPage에 위젯 통합

프로젝트 선택 상태에서 위젯 영역 표시. 기존 레이아웃 하단에 배치.

---

## 6. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| TestSetupPage 920줄 + 위젯 추가 시 파일 비대화 | 중 | 위젯을 별도 컴포넌트로 분리, TestSetupPage에는 import만 |
| 체크리스트 데이터 조회 추가 Firestore 읽기 | 낮 | 기존 progressByTestNumber 캐시 활용, 추가 쿼리 최소화 |
| 결함 데이터 실시간 동기화 | 낮 | onSnapshot 구독은 ExecutionPage 진입 시에만, 대시보드는 1회 조회 |

---

## 7. 성공 기준

| 지표 | 현재 | 목표 |
|------|------|------|
| 프로젝트 선택 후 대시보드 정보 | 없음 | 진행률+D-Day+결함 3개 위젯 표시 |
| 시험 현황 파악 소요 클릭 수 | 3+ (페이지 이동 필요) | 0 (대시보드에서 즉시 확인) |
| 기능 회귀 | - | 0건 |
| 위젯 렌더링 시 Skeleton 표시 | - | 데이터 로딩 중 표시 |
