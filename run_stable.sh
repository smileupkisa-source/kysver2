#!/bin/bash

# 1. 작업 디렉토리 설정
ROOT_DIR="/data/data/com.termux/files/home/kisa-guide-on"
BE_DIR="$ROOT_DIR/backend"

echo "♻️  기존 서버 프로세스를 확실히 정리하는 중..."

# 기존 Python 서버 종료
pkill -9 -f "python.*main.py"
sleep 2

# 2. 통합 서버 실행 (FastAPI가 Frontend dist 폴더도 서빙)
echo "🚀 통합 서버 가동 중 (API & Frontend)..."
cd $BE_DIR
nohup python main.py > backend.log 2>&1 &
BE_PID=$!

echo "⏳ 서버 안정화 대기 중 (3초)..."
sleep 3

# 3. 상태 확인
BE_RUNNING=$(ps -p $BE_PID -o pid=)

if [ -n "$BE_RUNNING" ]; then
    echo "✅ 모든 시스템이 성공적으로 시작되었습니다!"
    echo "--------------------------------------------------"
    echo "🌐 서비스 접속 (프런트엔드 & 백엔드 통합): http://localhost:8000"
    echo "   (PID: $BE_PID)"
    echo "--------------------------------------------------"
    echo "💡 Termux에서 메모리 부족으로 멈추던 문제를 해결하기 위해,"
    echo "   무거운 Node.js(Vite) 개발 서버 대신 Python 단일 서버 구동 방식으로 변경했습니다."
else
    echo "⚠️  서버가 실행되지 않았습니다. backend/backend.log를 확인해주세요."
fi
