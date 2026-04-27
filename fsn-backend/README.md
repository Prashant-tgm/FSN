# Frugal Solutions Network (FSN)

> A purpose-driven platform connecting BOP communities and NGOs with student innovators — enabling structured problem documentation, co-created solutions, and validated real-world impact.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository Structure](#4-repository-structure)
5. [Quick Start (Local Dev)](#5-quick-start-local-dev)
6. [Environment Variables](#6-environment-variables)
7. [API Reference](#7-api-reference)
8. [Impact Score Algorithm](#8-impact-score-algorithm)
9. [Background Jobs](#9-background-jobs)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Contributing](#12-contributing)

---

## 1. Project Overview

FSN is built around three user roles:

| Role | Description |
|------|-------------|
| **BOP Community Member** | Posts problems, provides feedback on deployed solutions |
| **NGO / Organisation**   | Posts curated problems, facilitates co-creation, validates solutions |
| **Innovator / Student**  | Browses problems, submits solutions, co-creates, writes blogs |

### Core Features
- **Problem Listing** — Structured, media-rich problem documentation with location pinning
- **Solution Submission** — Versioned solutions with cost estimates and implementation timelines
- **Co-Creation Hub** — Shared workspace (notes, tasks, files) + direct messaging
- **Feedback Loop** — Scheduled prompts at 1-week / 1-month / 3-month / 6-month checkpoints
- **Impact Score** — Algorithmic composite score (0-100) driving Wall of Fame tier assignment
- **Wall of Fame** — Bronze / Silver / Gold recognition for proven-impact solutions
- **Blog Platform** — Medium-inspired publishing with claps, comments, and category filters
- **Search** — Elasticsearch full-text with fuzzy matching and geo-proximity

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite)          Admin Dashboard            │
│  Web App + React Native (Phase 2)                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS / WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│  NGINX  (TLS termination · rate limiting · reverse proxy)       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│  NestJS API (Modular Monolith → Microservices in Year 2)        │
│  14 bounded modules · RS256 JWT · RBAC guards                   │
│  Socket.io server  (/messaging · /notifications · /cocreation)  │
└─────┬──────────┬──────────┬───────────┬─────────────────────────┘
      │          │          │           │
   Postgres   MongoDB    Redis       Elasticsearch
   (primary)  (blogs)  (sessions    (full-text
              Mongoose  OTP cache    search)
              7)        BullMQ)
                              │
                        AWS S3 + CloudFront (media)
                        AWS SES (email)
                        MSG91 (SMS/OTP)
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Web | React 18 + Vite + JavaScript |
| UI Library | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Backend | Node.js 20 + NestJS 10 |
| ORM | Prisma 5 (PostgreSQL) |
| Document Store | Mongoose 8 (MongoDB 7) |
| Queue | BullMQ (Redis-backed) |
| Search | Elasticsearch 8 |
| Real-time | Socket.io 4 |
| Auth | Passport.js · JWT RS256 · Google OAuth 2.0 |
| Email | AWS SES |
| SMS / OTP | MSG91 |
| Storage | AWS S3 + CloudFront |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes (EKS) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana + Sentry |
| IaC | Terraform |

---

## 4. Repository Structure

```
fsn/
├── fsn-backend/                    NestJS API
│   ├── prisma/schema.prisma        Full PostgreSQL schema (15 tables)
│   ├── Dockerfile                  Multi-stage build (dev / prod)
│   ├── docker-compose.yml          Local dev stack
│   └── src/
│       ├── main.ts                 Entry point (Swagger, CORS, pipes)
│       ├── app.module.ts           Root module
│       ├── config/                 Typed config per service
│       ├── database/               Prisma global module + Mongoose blog schema
│       ├── common/                 Guards, decorators, filters, pipes, enums
│       ├── impact/                 Impact Score Engine (TDP §10)
│       ├── jobs/                   BullMQ processors + cron scheduler
│       └── modules/
│           ├── auth/               JWT RS256, Google OAuth, phone OTP
│           ├── users/              Profiles, GDPR soft-delete
│           ├── problems/           Feed, GeoJSON, upvote
│           ├── solutions/          Versioning, status machine
│           ├── feedback/           Checkpoint enforcement
│           ├── cocreation/         Workspace, tasks, NGO facilitation
│           ├── blog/               MongoDB CRUD, slug, clap
│           ├── comments/           Threaded, entity-agnostic
│           ├── messaging/          REST + Socket.io gateway
│           ├── notifications/      In-app, email, SMS
│           ├── search/             ES multi-index, fuzzy, autocomplete
│           ├── media/              S3 pre-signed POST URLs
│           ├── wall-of-fame/       Tier display + admin management
│           └── admin/              Dashboard stats, moderation, user mgmt
│
├── fsn-frontend/                   React app
│   └── src/
│       ├── lib/
│       │   ├── api-client.ts       Axios + token refresh interceptor
│       │   ├── services/           One service file per backend module
│       │   ├── store/              Zustand auth store (persisted)
│       │   └── hooks/              useProblems, useSearch, ...
│       └── ...                     Pages, components (see FSN_Platform.jsx)
│
└── README.md
```

---

## 5. Quick Start (Local Dev)

### Prerequisites
- Docker Desktop 4.x
- Node.js 20+
- npm 10+

### 1. Clone and install

```bash
git clone https://github.com/your-org/fsn.git
cd fsn/fsn-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in JWT keys, Google OAuth, AWS, MSG91 credentials
```

Generate RS256 key pair for JWT:
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy contents (with newlines as \n) into .env
```

### 3. Start infrastructure

```bash
docker compose up -d postgres mongodb redis elasticsearch
```

Wait ~20 seconds for Elasticsearch to become healthy:
```bash
docker compose ps          # all services should show "healthy"
```

### 4. Database setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the API

```bash
npm run start:dev
```

- API:     http://localhost:3000/v1
- Swagger: http://localhost:3000/docs

### 6. Start the frontend

```bash
cd ../fsn-frontend
npm install
cp .env.example .env       # set VITE_API_URL=http://localhost:3000/v1
npm run dev
```

Frontend: http://localhost:5173

---

## 6. Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `MONGODB_URI` | MongoDB Atlas / local URI |
| `REDIS_URL` | Redis connection string |
| `ELASTICSEARCH_URL` | ES node URL |
| `JWT_PRIVATE_KEY` | RS256 private key (PEM, newlines as `\n`) |
| `JWT_PUBLIC_KEY` | RS256 public key (PEM) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_CLOUDFRONT_URL` | CDN base URL |
| `MSG91_API_KEY` | SMS OTP service |

---

## 7. API Reference

Full Swagger documentation at `/docs` (development only).

Base URL: `https://api.fsnplatform.org/v1`

### Key endpoint groups

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/otp/send` · `GET /auth/google` |
| Problems | `GET /problems` · `POST /problems` · `GET /problems/:id` · `GET /problems/map` |
| Solutions | `POST /solutions` · `GET /solutions/:id` · `PATCH /solutions/:id/status` |
| Feedback | `POST /feedback` · `GET /feedback?solutionId=` |
| Co-Creation | `POST /cocreations` · `GET /cocreations/:id/workspace` · `POST /cocreations/:id/tasks` |
| Blog | `GET /blogs` · `POST /blogs` · `GET /blogs/:slug` · `POST /blogs/:id/clap` |
| Search | `GET /search?q=&type=` · `GET /search/suggestions?q=` |
| Wall of Fame | `GET /wall-of-fame` · `GET /wall-of-fame/:id` |
| Notifications | `GET /notifications` · `PATCH /notifications/read-all` |

### Authentication

All protected endpoints require `Authorization: Bearer <access_token>`.

Tokens expire in **15 minutes**. Use `POST /auth/refresh` with the refresh token (30-day TTL, stored in Redis for revocation).

---

## 8. Impact Score Algorithm

Implemented in `src/impact/impact-score.engine.ts`.

```
Score = (W_rating × avg_rating/5 × 40)
      + (W_adoption × adoption_rate × 30)
      + (W_endorsements × min(endorsements,10)/10 × 20)
      + (W_recency × recency_factor × 10)
```

| Component | Max Points | Calculation |
|-----------|-----------|-------------|
| Feedback Rating | 40 | Average of all 1-5 star ratings, normalised to 0-1 |
| Adoption Rate | 30 | `implemented_count / accepted_count` for this problem |
| Community Endorsements | 20 | Upvotes from verified BOP/NGO users, capped at 10 |
| Recency Factor | 10 | Linear decay: 1.0 (< 30 days) → 0.5 (> 180 days) |

### Wall of Fame Thresholds

| Tier | Score | Additional Requirements |
|------|-------|------------------------|
| Bronze | 40–59 | ≥1 feedback, problem poster endorsed |
| Silver | 60–79 | ≥2 checkpoints, status = under_trial/implemented |
| Gold | 80–100 | All 4 checkpoints, status = implemented, admin verified |

---

## 9. Background Jobs

All async work runs through BullMQ (Redis-backed), idempotent with exponential backoff (max 3 retries).

| Queue | Job | Trigger |
|-------|-----|---------|
| `email-queue` | `sendVerification` | User registration |
| `email-queue` | `sendFeedbackPrompt` | Nightly cron scheduler |
| `search-queue` | `indexProblem/Solution/Blog` | Create / update events |
| `impact-queue` | `computeScore` | Feedback submission |
| `wof-queue` | `evaluateTier` | Feedback submission |
| `reputation-queue` | `updateScore` | Votes, solutions, feedback |

### Feedback Prompt Cron

`FeedbackSchedulerService` runs at midnight daily. It finds solutions that transitioned to `under_trial`/`implemented` exactly 7, 30, 90, or 180 days ago and dispatches email prompts via the email queue.

---

## 10. Testing

```bash
# Unit tests (no DB required — all services fully mocked)
npm run test

# Test coverage report
npm run test:cov

# E2E tests (requires running Docker stack)
npm run test:e2e

# Performance tests (k6 — requires k6 CLI)
k6 run test/k6/load.js
```

### Test coverage targets (TDP §9.1)

| Level | Tool | Target |
|-------|------|--------|
| Unit | Jest | > 80% line coverage |
| Integration | Jest + Supertest | > 70% endpoint coverage |
| E2E | Playwright | 20 critical user journeys |
| Performance | k6 | p95 < 800ms at 500 VUs |
| Security | OWASP ZAP | Zero critical findings |

### Written test suites

- `src/impact/impact-score.engine.spec.ts` — 9 tests covering all formula components
- `src/modules/auth/auth.service.spec.ts` — register, login, OTP, logout
- `src/modules/problems/problems.service.spec.ts` — CRUD, upvote toggle, RBAC

---

## 11. Deployment

### Staging (auto on merge to `main`)

GitHub Actions workflow:
1. Lint + type-check + unit tests
2. Docker build + push to ECR
3. `kubectl rollout` to EKS staging namespace
4. Playwright smoke tests

### Production (manual approval gate)

```bash
# Via GitHub Actions — requires approval from Tech Lead
gh workflow run deploy-production.yml
```

Rolling update: `maxUnavailable: 0`, `maxSurge: 1`. Auto-rollback if health check fails within 2 minutes.

### AWS Services used

EKS · RDS PostgreSQL Multi-AZ · ElastiCache Redis · MongoDB Atlas · S3 + CloudFront · SES · ECR · Route 53 · WAF · Secrets Manager

---

## 12. Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Follow the module pattern: each feature has its own `service / controller / module / dto` directory
3. Add unit tests for any new service method
4. Run `npm run lint` and `npm run test` before opening a PR
5. PRs require review from the Tech Lead
6. Update this README when adding new environment variables or major features

---

*FSN — Frugal Solutions Network | Engineering Confidential | April 2026*