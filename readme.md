# 🧠 LLM Council — Multi-Model AI Chat App

> Ask a question. Watch 4+ AI models debate, rank each other, and synthesize the best answer — on mobile.

[![Android](https://img.shields.io/badge/Platform-Android-green?logo=android)](https://github.com/jxlee007/llm-council-for-students)
[![iOS](https://img.shields.io/badge/Platform-iOS-blue?logo=apple)](https://github.com/jxlee007/llm-council-for-students)
[![React Native](https://img.shields.io/badge/React_Native-Expo-purple?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal?logo=fastapi)](https://fastapi.tiangolo.com/)

- Deployment: [On Render](https://render.com/)


---

## 📱 What is LLM Council?

LLM Council is a **cross-platform mobile app** that lets you consult multiple AI models simultaneously. Instead of trusting one model, you assemble a "council" of LLMs that independently answer, critique each other, and produce a final synthesized response.

Inspired by [Andrej Karpathy's idea](https://x.com/karpathy/status/1990577951671509438) of reading books with multiple LLMs side by side.

---

## ✨ Key Features

### 3-Stage Council Flow
The app processes every query through a unique 3-stage pipeline:

| Stage | What Happens | Color |
|-------|-------------|-------|
| **Stage 1** — Individual Responses | Each selected LLM answers independently | 🟡 Amber |
| **Stage 2** — Peer Rankings | Models review and rank each other's responses | 🟣 Purple |
| **Stage 3** — Final Synthesis | A "chairman" model synthesizes the best answer | 🔵 Cyan |

### Other Features
- 🔑 **Bring Your Own Key** — connect your OpenRouter API key for access to 50+ free models
- 🗂️ **Chat History** — full conversation persistence via Convex
- ⚙️ **Configure Council** — pick which models form your council
- 🎨 **Micro-interaction Animations** — smooth transitions and loading states throughout
- 🌓 **Dark Theme** — ink-black UI with cyan accents

---

## 🛠️ Tech Stack

### Mobile (React Native / Expo)
| Tech | Usage |
|------|-------|
| **React Native + Expo** | Cross-platform iOS & Android |
| **TypeScript** | Type-safe codebase |
| **NativeWind (Tailwind)** | Utility-first styling |
| **Expo Router** | File-based navigation |
| **Convex** | Real-time backend + auth + DB |

### Backend (Python)
| Tech | Usage |
|------|-------|
| **FastAPI** | REST API server |
| **OpenRouter API** | Multi-model LLM routing |
| **Python async/await** | Streaming SSE responses |

---

## 🏗️ Architecture

```
            User Query
                │
                ▼
┌──────────────────────────────────────┐
│         React Native (Expo)          │
│  Auth → Home → Chat → History        │
│  Convex for real-time sync           │
└───────────────┬──────────────────────┘
            REST API
                │ 
                ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│  /council → 3-Stage Pipeline        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          OpenRouter API             │
│      Available Free AI models       │
└─────────────────────────────────────┘
```

---

## 📲 Try It

### Download APK (Android)
👉 [Download latest APK](https://github.com/jxlee007/llm-council-for-students/raw/refs/heads/main/application-76e9ba9a-5e5c-422d-bb9e-1ffee90769a9.apk)

**Install steps:**
1. Download APK
2. Open file from Downloads
3. Enable "Install unknown apps" in Settings → Security if prompted
4. Install and launch

### Run Locally (Expo Go)
```bash
git clone https://github.com/jxlee007/llm-council-for-students.git
cd llm-council-for-students/mobile
npm install
npx expo start
```
Scan QR with Expo Go app on your phone.

### Run Backend Locally
```bash
cd app/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🔑 Setup

1. Create a free account at [openrouter.ai](https://openrouter.ai)
2. Generate an API key
3. Open app → Settings → Enter your OpenRouter API key
4. Select models for your council in Configure tab
5. Start chatting!

---

## 📁 Project Structure

```
├── mobile/          # React Native (Expo) app
│   ├── app/         # Expo Router file-based pages
│   │   ├── (auth)/  # Login, signup, API key setup
│   │   ├── (tabs)/  # Home, Configure, History, Settings
│   │   └── chat/    # Chat screen [id].tsx
│   └── assets/      # Icons, images
├── backend/     # FastAPI Python server
│       ├── council.py    # 3-stage pipeline logic
│       ├── openrouter.py # OpenRouter API client
```

---

## 💡 What I Built & Learned

- **Multi-stage LLM orchestration** — coordinating parallel API calls across 4+ models and streaming results progressively to the UI
- **Cross-platform development** — Using React Native (Expo) 
- **Real-time sync** — Convex for live chat updates without manual polling
- **Streaming SSE** — FastAPI streaming server-sent events consumed in mobile client
- **Authentication flows** — Sign up, sign in, OAuth (Google/Apple)


*Built with curiosity and a lot of LLM debates* 🧠

