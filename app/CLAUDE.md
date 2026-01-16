# CLAUDE.md - Technical Notes for LLM Council

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.

## Project Overview

LLM Council is a 3-stage deliberation system where multiple LLMs collaboratively answer user questions. The key innovation is anonymized peer review in Stage 2, preventing models from playing favorites.

## Architecture

### Data Flow

```
Mobile App (Expo/React Native)
    ↓ (Clerk Auth Token)
Convex (Real-time Database)
    ↓ (SSE Streaming)
FastAPI Backend (LLM Computation Only)
    ↓
OpenRouter API
```

**Key Principle:** Convex is the single source of truth for all data. FastAPI handles only LLM computation - no data persistence.

### Backend Structure (`backend/`)

**`config.py`**

- Contains `COUNCIL_MODELS` (list of OpenRouter model identifiers)
- Contains `CHAIRMAN_MODEL` (model that synthesizes final answer)
- Uses environment variable `OPENROUTER_API_KEY` from `.env`
- Backend runs on **port 8001**

**`openrouter.py`**

- `query_model()`: Single async model query
- `query_models_parallel()`: Parallel queries using `asyncio.gather()`
- Returns dict with 'content' and optional 'reasoning_details'
- Graceful degradation: returns None on failure, continues with successful responses

**`council.py`** - The Core Logic

- `stage1_collect_responses()`: Parallel queries to all council models
- `stage2_collect_rankings()`: Anonymized peer evaluation
- `stage3_synthesize_final()`: Chairman synthesizes from all responses + rankings
- `calculate_aggregate_rankings()`: Computes average rank position

**`errors.py`** - Structured Error Handling

- `ErrorCode` enum: MISSING_API_KEY, INVALID_API_KEY, RATE_LIMIT_EXCEEDED, etc.
- `CouncilException`: Typed exceptions with error codes
- `APIError`: Pydantic model for error responses

**`main.py`**

- FastAPI app with CORS enabled
- POST `/api/conversations/{id}/message/stream` - SSE streaming endpoint
- Returns structured errors with machine-readable codes
- **No data persistence** - Convex handles all data

### Mobile Structure (`mobile/`)

**`convex/`** - Convex Backend Functions

- `council.ts`: Main action that orchestrates the 3-stage process
- `users.ts`: User management, API key storage with encryption
- `userActions.ts`: Secure actions for encrypted key operations
- `encryption.ts`: AES-256-GCM encryption for BYOK
- `rateLimits.ts`: Per-user rate limiting

**`lib/`** - Utilities

- `config.ts`: Environment validation with fail-fast behavior
- `logger.ts`: Sentry integration for crash reporting
- `api.ts`: FastAPI client (legacy, mostly replaced by Convex)
- `store.ts`: Zustand store for UI state

**`components/`** - Shared Components

- `ErrorBoundary.tsx`: Catches React errors
- `OfflineBanner.tsx`: Shows offline status
- `Banner.tsx`: Error/warning banners with retry action
- `BottomInputBar.tsx`: Keyboard-aware input with offline detection

## Security

### BYOK (Bring Your Own Key)

- API keys encrypted with AES-256-GCM before storage
- Encryption key stored in Convex environment (`BYOK_ENCRYPTION_KEY`)
- Keys never logged or returned to client
- Decryption happens only in Convex actions (server-side)

### Rate Limiting

- Per-user: 5 council requests per minute (Convex)
- Keys: `runCouncil` with 60s window

### Authentication

- Clerk OAuth (Google, Apple, GitHub)
- JWT tokens validated by Convex
- Production requires `pk_live_` keys (not `pk_test_`)

## Environment Configuration

### Required Variables

| Variable                            | Description           |
| ----------------------------------- | --------------------- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key      |
| `EXPO_PUBLIC_CONVEX_URL`            | Convex deployment URL |
| `EXPO_PUBLIC_API_URL`               | FastAPI backend URL   |

### Optional Variables

| Variable                  | Description                               |
| ------------------------- | ----------------------------------------- |
| `EXPO_PUBLIC_SENTRY_DSN`  | Sentry for crash reporting                |
| `EXPO_PUBLIC_APP_VARIANT` | `development`, `preview`, or `production` |

### Convex Environment Variables

| Variable              | Description                            |
| --------------------- | -------------------------------------- |
| `BYOK_ENCRYPTION_KEY` | 256-bit hex key for API key encryption |
| `API_BASE_URL`        | FastAPI backend URL                    |

## Build & Deploy

### EAS Build Profiles

- `development`: Dev client with hot reloading
- `preview`: Internal distribution for testing
- `production`: App store builds with auto-increment

### Commands

```bash
# Development
cd app/mobile && npx expo start

# Convex types
cd app/mobile && npx convex dev

# Preview build
npx eas build --profile preview --platform all

# Production build
npx eas build --profile production --platform all
```

## Common Gotchas

1. **Module Import Errors**: Always run backend as `python -m uvicorn backend.main:app` from project root
2. **CORS Issues**: Frontend must match allowed origins in `main.py` CORS middleware
3. **TypeScript Errors**: Run `npx convex dev` to regenerate types after Convex changes
4. **API Key Encryption**: Keys with `enc:` prefix are encrypted; legacy keys work but should be re-saved

## Data Flow Summary

```
User sends message
    ↓
Mobile calls Convex `runCouncil` action
    ↓
Convex creates user message + placeholder assistant message
    ↓
Convex action calls FastAPI /stream endpoint
    ↓
FastAPI runs 3-stage council process
    ↓
SSE events update Convex incrementally (stage1, stage2, stage3)
    ↓
Mobile app receives real-time updates via Convex subscription
```
