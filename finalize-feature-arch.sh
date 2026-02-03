#!/usr/bin/env bash
set -euo pipefail

# ===== 설정 =====
TAG_NAME="v2.0.0-feature-arch"
TAG_MESSAGE="migrate to feature-based architecture"
FEATURE_BRANCH="refactor/feature-based-arch"
COMMIT_MESSAGE="chore(refactor): migrate project structure to feature-based architecture"
# ==============

# 1) 루트 잡동사니 정리 (docs/.github 이동)
mkdir -p docs .github

# 컨벤션 관련 파일 이동
if [ -f "./COMMIT_CONVENTION.md" ]; then
  mv "./COMMIT_CONVENTION.md" "./docs/COMMIT_CONVENTION.md"
fi

if [ -f "./gitmessage" ]; then
  mv "./gitmessage" "./.github/gitmessage"
fi

if [ -f "./📝 커밋 메시지 컨벤션 (Commit Message Convention).md" ]; then
  mv "./📝 커밋 메시지 컨벤션 (Commit Message Convention).md" "./docs/Commit-Message-Convention.md"
fi

# 기타 문서 이동 (README.md는 루트 유지)
for f in ./*.md ./*.txt; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  case "$base" in
    "README.md") ;;
    *) mv "$f" "./docs/$base" ;;
  esac
done

# 2) 변경 사항 커밋
git add -A
git commit -m "$COMMIT_MESSAGE"

# 3) main 브랜치로 전환 및 병합
git checkout main
git merge "$FEATURE_BRANCH"

# 4) 태그 생성 및 Push
git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"
git push
git push --tags

# 5) 작업 브랜치 삭제
git branch -d "$FEATURE_BRANCH" || git branch -D "$FEATURE_BRANCH"
git push origin --delete "$FEATURE_BRANCH" || true

echo "✅ 리팩토링 마무리 완료"
