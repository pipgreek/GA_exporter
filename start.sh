#!/bin/sh
# Runs the backend (internal, localhost) and the Next.js frontend (public, $PORT).
# If either process exits the container stops, so the host restarts it.
PUBLIC_PORT="${PORT:-10000}"

(cd backend && NODE_OPTIONS="--max-old-space-size=${BACKEND_HEAP_MB:-160}" PORT="${BACKEND_PORT:-3001}" CORS_ORIGINS="${CORS_ORIGINS:-http://localhost}" node dist/main.js) &
BACKEND_PID=$!
(cd frontend && NODE_OPTIONS="--max-old-space-size=${FRONTEND_HEAP_MB:-96}" PORT="$PUBLIC_PORT" HOSTNAME=0.0.0.0 node server.js) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' TERM INT
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do sleep 2; done
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit 1
