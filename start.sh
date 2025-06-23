#!/bin/bash

echo "🚀 Starting ClipNote Application..."

# Kill any existing processes
echo "📋 Cleaning up existing processes..."
pkill -f "node server.js" || true
pkill -f vite || true

sleep 1

# Start backend server
echo "🔧 Starting backend server..."
cd server && npm start &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend server to start..."
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "❌ Backend server failed to start"
    exit 1
  fi
  sleep 1
done

# Start frontend
echo "🎨 Starting frontend..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo "✅ Application started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait