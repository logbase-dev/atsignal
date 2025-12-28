#!/bin/bash

# web 앱 배포 스크립트
# GitHub 푸시 후 Firebase App Hosting에서 자동 배포

set -e

echo "🚀 web 앱 배포 시작..."

# 현재 브랜치 확인
BRANCH=$(git branch --show-current)
echo "현재 브랜치: $BRANCH"

# 변경사항 확인
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  변경사항이 없습니다."
  exit 0
fi

# 변경사항 표시
echo "📝 변경된 파일:"
git status --short

# 커밋 메시지 입력
read -p "커밋 메시지를 입력하세요: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "❌ 커밋 메시지가 필요합니다."
  exit 1
fi

# 변경사항 추가
git add .

# 커밋
git commit -m "$COMMIT_MSG"

# GitHub 푸시
echo "📤 GitHub에 푸시 중..."
git push origin "$BRANCH"

echo "✅ web 앱 배포 완료!"
echo "📦 Firebase App Hosting에서 자동 배포가 시작됩니다."
echo "🔗 배포 상태: https://console.firebase.google.com/project/atsignal/apphosting"