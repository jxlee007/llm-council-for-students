#!/bin/bash

echo "🚀 Starting LLM Council Mobile Dev Environment"
echo ""

# Root directory (adjust if needed)
ROOT_DIR="$(pwd)"

# -----------------------------
# Backend
# -----------------------------
gnome-terminal \
  --title="LLM Council - Backend" \
  -- bash -c "
    echo 'Starting Backend (FastAPI)...';
    cd \"$ROOT_DIR\";
    uv run python -m backend.main;
    exec bash
  "

sleep 2

# -----------------------------
# ngrok
# -----------------------------
gnome-terminal \
  --title="LLM Council - ngrok" \
  -- bash -c "
    echo 'Starting ngrok tunnel for backend...';
    ngrok http 8001;
    exec bash
  "

sleep 2

# -----------------------------
# Expo (Mobile App)
# -----------------------------
gnome-terminal \
  --title="LLM Council - Expo" \
  -- bash -c "
    echo 'Starting Expo (Mobile App)...';
    cd \"$ROOT_DIR/mobile\";
    npx expo start;
    exec bash
  "

echo ""
echo "✅ Dev environment started:"
echo "   • Backend  → http://localhost:8001"
echo "   • ngrok    → check ngrok terminal for HTTPS URL"
echo "   • Expo     → scan QR or run emulator"
echo ""
echo "ℹ️  Close individual terminals to stop services"
