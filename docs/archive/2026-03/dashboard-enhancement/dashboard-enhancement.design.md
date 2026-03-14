# Design: 대시보드 고도화 (dashboard-enhancement)

> 작성일: 2026-03-14
> Feature: dashboard-enhancement
> Phase: Design
> Plan 참조: `docs/01-plan/features/dashboard-enhancement.plan.md`

---

## 1. 설계 개요

프로젝트 선택 후 TestSetupPage 하단에 대시보드 위젯 영역을 추가한다. 진행률 요약(SVG 도넛), D-Day 카운트다운, 결함 현황 3개 위젯을 별도 컴포넌트로 구현하여 TestSetupPage에 최소한의 코드만 추가한다.

### 1.1 Plan 분석 결과 반영

- **FR-01 (위젯 영역)**: DashboardWidgets 컨테이너 컴포넌트
- **FR-02 (진행률 요약)**: ProgressSummaryWidget — SVG 도넛 + 상태별 카운트
- **FR-03 (D-Day 카운트다운)**: DDayWidget — 마일스톤 기반
- **FR-04 (결함 현황)**: DefectSummaryWidget — 차수별/심각도별
- **FR-05 (CTA 개선)**: 위젯 영역 헤더에 "시험 이어하기" 버튼 배치

---

## 2. 변경 파일 목록

| # | 파일 | 변경 유형 | 목적 |
|---|------|---------|------|
| 1 | `src/features/test-setup/components/DashboardWidgets.tsx` | **신규** | 위젯 컨테이너 + 3개 위젯 |
| 2 | `src/features/test-setup/components/TestSetupPage.tsx` | **수정** | 위젯 영역 import + 조건부 렌더링 |

---

## 3. 상세 설계

### 3.1 FR-01: DashboardWidgets 컴포넌트 (`DashboardWidgets.tsx`)

#### 컴포넌트 구조

```typescript
// DashboardWidgets.tsx — 단일 파일에 컨테이너 + 3개 위젯
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, Circle, Calendar, Bug, TrendingUp } from 'lucide-react';
import type { Project, Defect } from '../../../types';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface DashboardWidgetsProps {
  project: Project;
  progress: number; // 0~100, progressByTestNumber에서 전달
  onNavigateExecution: () => void;
}
```

#### 레이아웃

```tsx
export function DashboardWidgets({ project, progress, onNavigateExecution }: DashboardWidgetsProps) {
  return (
    <div className="mt-8 space-y-4">
      {/* 헤더: 프로젝트명 + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-tx-primary">
            {project.projectName || project.testNumber} 현황
          </h2>
          <p className="text-xs text-tx-muted mt-0.5">시험 진행 현황을 한눈에 확인하세요</p>
        </div>
        <button
          type="button"
          onClick={onNavigateExecution}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:opacity-90 transition"
        >
          시험 이어하기
        </button>
      </div>

      {/* 3열 위젯 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressSummaryWidget progress={progress} />
        <DDayWidget project={project} />
        <DefectSummaryWidget projectId={project.id} />
      </div>
    </div>
  );
}
```

### 3.2 FR-02: ProgressSummaryWidget (진행률 요약)

#### Props & 데이터

```typescript
function ProgressSummaryWidget({ progress }: { progress: number }) {
```

- `progress`: TestSetupPage에서 이미 계산된 `progressByTestNumber[testNumber]` 값 (0~100)
- 추가 Firestore 쿼리 없음 — 기존 데이터 재활용

#### UI 구조

```
┌─────────────────────────────┐
│ ◎ 점검 진행률                 │
│                              │
│      ┌──────┐               │
│      │ 65%  │  SVG 도넛     │
│      └──────┘               │
│                              │
│  전체 40개 항목 중 26개 완료    │
│  ██████████░░░░  65%         │
└─────────────────────────────┘
```

#### SVG 도넛 차트

```tsx
// ProgressDashboard.tsx의 기존 패턴 재활용
const radius = 40;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = circumference - (progress / 100) * circumference;

<svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
  <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--ln)" strokeWidth="6" />
  <circle
    cx="48" cy="48" r={radius} fill="none"
    stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
    strokeDasharray={circumference}
    strokeDashoffset={mounted ? strokeDashoffset : circumference}
    className="transition-all duration-700 ease-out"
  />
</svg>
```

#### 카드 스타일

```tsx
<div className="rounded-2xl border border-ln bg-surface-raised p-5 flex flex-col items-center">
```

### 3.3 FR-03: DDayWidget (D-Day 카운트다운)

#### Props & 데이터

```typescript
function DDayWidget({ project }: { project: Project }) {
```

- 데이터: `project.scheduleStartDate`, `scheduleDefect1`, `scheduleDefect2`, `schedulePatchDate`, `scheduleEndDate`
- 모두 `string` (ISO date 형식, 예: `"2026-03-20"`)
- 추가 Firestore 쿼리 없음

#### 마일스톤 목록

```typescript
const milestones = useMemo(() => {
  const items: Array<{ label: string; date: string; key: string }> = [];
  if (project.scheduleStartDate) items.push({ label: '시험 시작', date: project.scheduleStartDate, key: 'start' });
  if (project.scheduleDefect1) items.push({ label: '1차 리포트', date: project.scheduleDefect1, key: 'defect1' });
  if (project.schedulePatchDate) items.push({ label: '패치/회귀', date: project.schedulePatchDate, key: 'patch' });
  if (project.scheduleDefect2) items.push({ label: '2차 리포트', date: project.scheduleDefect2, key: 'defect2' });
  if (project.scheduleEndDate) items.push({ label: '시험 종료', date: project.scheduleEndDate, key: 'end' });
  return items;
}, [project]);
```

#### D-Day 계산

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

// 다음 마일스톤: 오늘 이후 가장 가까운 것
const nextMilestone = milestones.find(m => new Date(m.date) >= today);
const dDay = nextMilestone
  ? Math.ceil((new Date(nextMilestone.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  : null;
```

#### UI 구조

```
┌─────────────────────────────┐
│ 📅 D-Day                    │
│                              │
│     D-12                     │
│   1차 리포트까지               │
│                              │
│ ● 시험 시작    03/05  (지남)   │
│ ◉ 1차 리포트   03/26  D-12   │
│ ○ 패치/회귀   04/02          │
│ ○ 시험 종료   04/15          │
└─────────────────────────────┘
```

#### 마일스톤 상태 표시

- **지남** (date < today): 회색 텍스트 + 체크 아이콘, `text-tx-muted line-through`
- **다음** (nextMilestone): 강조 색상 + 큰 D-Day 숫자, `text-accent font-bold`
- **미래**: 기본 텍스트, `text-tx-secondary`
- 마일스톤 없음: "일정이 설정되지 않았습니다" 안내 표시

### 3.4 FR-04: DefectSummaryWidget (결함 현황)

#### Props & 데이터

```typescript
function DefectSummaryWidget({ projectId }: { projectId: string }) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !projectId) { setLoading(false); return; }
    const q = query(collection(db, 'projects', projectId, 'defects'));
    getDocs(q).then(snap => {
      setDefects(snap.docs.map(d => ({ ...d.data(), defectId: d.id } as Defect)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);
```

> **설계 결정**: `useDefects` hook은 `onSnapshot` (실시간 구독)을 사용하지만, 대시보드에서는 `getDocs` (1회 조회)로 충분. 대시보드는 현황 파악용이므로 실시간 갱신 불필요. 불필요한 구독 방지.

#### 통계 계산

```typescript
const stats = useMemo(() => {
  const byVersion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const bySeverity: Record<string, number> = { H: 0, M: 0, L: 0 };
  for (const d of defects) {
    byVersion[d.reportVersion] = (byVersion[d.reportVersion] || 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
  }
  return { total: defects.length, byVersion, bySeverity, derived: defects.filter(d => d.isDerived).length };
}, [defects]);
```

#### UI 구조

```
┌─────────────────────────────┐
│ 🐛 결함 현황                  │
│                              │
│     총 8건                    │
│   (파생 2건)                  │
│                              │
│ 차수별:                       │
│ 1차 ████  3건                 │
│ 2차 ███   2건                 │
│ 3차 ██    2건  (파생 2)        │
│ 4차 █     1건                 │
│                              │
│ 심각도:  H 2  M 4  L 2       │
└─────────────────────────────┘
```

#### 차수별 미니 바 차트

```tsx
{[1, 2, 3, 4].map(v => {
  const count = stats.byVersion[v] || 0;
  const maxCount = Math.max(...Object.values(stats.byVersion), 1);
  return (
    <div key={v} className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-tx-muted w-6">{v}차</span>
      <div className="flex-1 h-2 rounded-full bg-surface-sunken overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${(count / maxCount) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-tx-secondary w-6 text-right">{count}</span>
    </div>
  );
})}
```

#### 로딩/빈 상태

- **로딩**: `animate-pulse` 스켈레톤 (3줄)
- **결함 0건**: "등록된 결함이 없습니다" + Bug 아이콘

### 3.5 FR-05: TestSetupPage 수정

#### 변경 위치

`TestSetupPage.tsx`의 하단 액션 버튼 영역 위 (`{/* 모달들 */}` 직전)에 위젯 삽입.

#### Before

```tsx
        </div>  {/* grid grid-cols-2 닫음 */}
      </div>

      {/* 모달들 */}
      <AccessDeniedModal ...
```

#### After

```tsx
        </div>  {/* grid grid-cols-2 닫음 */}

        {/* 대시보드 위젯 — 프로젝트 선택 시에만 표시 */}
        {flowMode === 'existing' && selectedProject && (
          <DashboardWidgets
            project={selectedProject}
            progress={progressByTestNumber[selectedProject.testNumber] ?? 0}
            onNavigateExecution={() => {
              if (canProceed) onStartProject();
            }}
          />
        )}
      </div>

      {/* 모달들 */}
      <AccessDeniedModal ...
```

#### Import 추가

```typescript
import { DashboardWidgets } from './DashboardWidgets';
```

---

## 4. 예상 결과

### 4.1 사용자 시나리오

1. 사용자가 OverviewPage 진입
2. 사용자/시험을 선택 (기존 Existing 모드)
3. **프로젝트 선택 즉시** 하단에 대시보드 위젯 영역 표시
4. 진행률 도넛, D-Day 카운트다운, 결함 현황을 한눈에 확인
5. "시험 이어하기" 버튼으로 ExecutionPage 진입

### 4.2 성공 기준 달성 예측

| 지표 | 현재 | 목표 | 예측 |
|------|------|------|------|
| 대시보드 정보 | 없음 | 3개 위젯 | 3개 위젯 ✅ |
| 현황 파악 클릭 수 | 3+ | 0 | 0 ✅ |
| 기능 회귀 | - | 0건 | 0건 ✅ |

---

## 5. 테스트 계획

| # | 테스트 항목 | 검증 방법 | 합격 기준 |
|---|-----------|---------|---------:|
| T-01 | 빌드 성공 | `npm run build` | 에러 0건 |
| T-02 | 위젯 미표시 (프로젝트 미선택) | 시험 선택 전 UI 확인 | 위젯 영역 없음 |
| T-03 | 위젯 표시 (프로젝트 선택) | 시험 선택 후 UI 확인 | 3개 위젯 표시 |
| T-04 | 진행률 도넛 정확성 | progressByTestNumber 값 비교 | 숫자 일치 |
| T-05 | D-Day 계산 정확성 | 수동 계산 비교 | 일수 정확 |
| T-06 | 결함 건수 정확성 | Firestore 데이터 비교 | 건수 일치 |
| T-07 | 마일스톤 없는 프로젝트 | 일정 미설정 프로젝트 선택 | 안내 메시지 표시 |
| T-08 | 결함 없는 프로젝트 | 결함 0건 프로젝트 선택 | "결함 없음" 표시 |
| T-09 | 다크 모드 | 다크 모드 전환 | 시맨틱 토큰 정상 |
| T-10 | 시험 이어하기 CTA | 버튼 클릭 | ExecutionPage 진입 |

---

## 6. 구현 순서

| # | 체크포인트 | 파일 | 커밋 단위 |
|---|-----------|------|---------:|
| 1 | DashboardWidgets.tsx 생성 (컨테이너 + 3개 위젯) | `DashboardWidgets.tsx` | 1커밋 |
| 2 | TestSetupPage에 위젯 import + 조건부 렌더링 | `TestSetupPage.tsx` | ↑ 동일 |
| 3 | 빌드 검증 | - | ↑ 동일 |

> **단일 커밋**: 신규 파일 1개 + 수정 1개이므로 1커밋으로 진행.

---

## 7. 아키텍처 결정

### AD-01: 단일 파일에 3개 위젯 배치

**결정**: DashboardWidgets.tsx에 컨테이너 + ProgressSummaryWidget + DDayWidget + DefectSummaryWidget을 모두 배치
**근거**: 각 위젯이 100줄 미만의 소형 컴포넌트. 파일 분리 시 4개 파일 생성되어 과분리. 추후 위젯이 복잡해지면 분리.
**대안 고려**: 위젯별 별도 파일 → 현재 규모에서 불필요한 복잡성으로 기각

### AD-02: 결함 데이터 1회 조회 (getDocs)

**결정**: useDefects의 onSnapshot 대신 getDocs로 1회 조회
**근거**: 대시보드는 현황 파악용. 실시간 갱신은 ExecutionPage에서만 필요. 불필요한 Firestore 구독 방지.
**대안 고려**: useDefects 재사용 → 컴포넌트 마운트/언마운트 시 구독 관리 부담, 대시보드에 과잉

### AD-03: 외부 차트 라이브러리 미사용

**결정**: SVG + CSS로 도넛 차트, 바 차트 직접 구현
**근거**: ProgressDashboard에 이미 SVG 도넛 패턴 존재. recharts 추가 시 ~45KB 번들 증가. 방금 번들 최적화를 완료한 상황에서 역행.
**대안 고려**: recharts → 번들 크기 증가로 기각
