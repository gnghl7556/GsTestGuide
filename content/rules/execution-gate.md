---
type: execution-gate
regressionItemId: EXEC-05
securityItemId: EXEC-06
performanceItemId: EXEC-06
---

## 분기 조건

### 회귀 테스트 미완료 시
- 보안 테스트: disabled
- 성능 테스트: disabled

### 파생 결함 발견 시
- 보안 테스트: disabled
- 성능 테스트: disabled (2차 패치 이후로 연기)

### 파생 결함 없음
- 보안 테스트: enabled
- 성능 테스트: enabled

### 4차 확정(최종) 이후
- 모든 수행 단계: blockedByFinalization
