#!/bin/bash

echo "Starting Regagen API Backend and Frontend..."

# Start backend on port 3001
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend on port 5000
node frontend/server.js &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
