# 미리보기 이미지 규칙

이 폴더는 체크리스트 "필수 참조 자료" 미리보기 전용 이미지 보관소입니다.

## 파일명 규칙
- 형식: `doc-<slug>-preview.<ext>`
- 예시:
  - `doc-agreement-preview.png` (시험 합의서)
  - `doc-seat-plan-preview.png` (자리 배정표)
  - `doc-manual-preview.png` (제품 설명서)

## 권장 스펙
- 해상도: 1600x900 이상
- 비율: 16:9 권장
- 확장자: png/jpg

## 연결 방법
- `src/data/requirements.ts`의 `requiredDocs[].previewImageUrl`에 경로를 입력합니다.
  - 예: `previewImageUrl: '/src/assets/previews/doc-agreement-preview.png'`

## Firebase Storage 경로 (권장)
- 업로드 경로: `previews/`
- 예시:
  - `previews/doc-agreement-preview.png`
  - `previews/doc-seat-plan-preview.png`
