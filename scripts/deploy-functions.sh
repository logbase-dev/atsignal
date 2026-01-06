#!/bin/bash

# Firebase Functions 배포 스크립트

set -e

echo "🚀 Firebase Functions 배포 시작..."

# functions 디렉토리로 이동
cd "$(dirname "$0")/../functions"

# 빌드 확인
echo "🔨 Functions 빌드 중..."
npm run build

# Firebase 로그인 확인
if ! firebase projects:list &>/dev/null; then
  echo "⚠️  Firebase에 로그인되어 있지 않습니다."
  echo "🔐 Firebase 로그인 중..."
  firebase login
fi

# 배포
echo "📤 Firebase Functions 배포 중..."
firebase deploy --only functions

echo "✅ Functions 배포 완료!"