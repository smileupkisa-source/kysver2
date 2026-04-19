#!/bin/bash

# 1. 현재 스크립트가 있는 위치를 루트 디렉토리로 자동 설정
ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 프로젝트를 시작합니다... (Location: $ROOT_DIR)"

# 2. 백엔드 실행 (FastAPI/Python)
echo "📡 백엔드 서버를 구동합니다..."
cd "$BACKEND_DIR" || exit
# 가상환경(venv)이 있다면 활성화, 없다면 바로 실행
if [ -d "venv" ]; then
    source venv/bin/activate
fi
# 백그라운드에서 실행하고 로그는 backend.log에 기록
python3 main.py > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# 3. 프런트엔드 실행 (React/Vite)
echo "💻 프런트엔드 서버를 구동합니다..."
cd "$FRONTEND_DIR" || exit
# 의존성 설치 여부 확인 후 실행
npm run dev &
FRONTEND_PID=$!

echo "----------------------------------------------------"
echo "✅ 서버가 실행되었습니다!"
echo "- 백엔드 로그 확인: tail -f backend.log"
echo "- 중단하려면: kill $BACKEND_PID $FRONTEND_PID"
echo "----------------------------------------------------"

# 프로세스 유지
wait
