# CareerSync — SLA-Driven Recruitment & Anti-Ghosting Platform

An enterprise-pattern portfolio project: a modular-monolith Spring Boot backend with a
deterministic application state machine, business-hours SLA engine, concurrency-safe
background scanner, Redis-cached responsiveness scoring, event-driven notifications, and
direct-to-S3 resume uploads — paired with a React + TypeScript frontend.

## Stack
- **Backend**: Java 21, Spring Boot 3.4 (modular monolith), Spring Security 6 + JJWT (RBAC),
  Spring Data JPA/Hibernate, Flyway, Spring Application Events (+ `@Async` virtual-thread
  listeners), `@Scheduled` + ShedLock + `SELECT ... FOR UPDATE SKIP LOCKED`, Redis, AWS S3 SDK
  (pre-signed URLs against MinIO locally), Actuator + Micrometer/Prometheus.
- **Frontend**: React 18 + TypeScript 5, Vite, Tailwind CSS, Axios (JWT refresh rotation),
  React Router, Lucide icons.
- **Data/infra**: PostgreSQL 16, Redis 7, MinIO (S3-compatible), Mailpit (local SMTP + webmail).
- **DevOps**: Docker Compose, GitHub Actions CI, JUnit 5 / Mockito / AssertJ.

## Quick start

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Backend health: http://localhost:8080/actuator/health
- Prometheus metrics: http://localhost:8080/actuator/prometheus
- Mailpit (view breach/nudge emails): http://localhost:8025
- MinIO console (view uploaded resumes): http://localhost:9001 (minioadmin / minioadmin)

Demo accounts (all seeded via `V3__seed_demo_data.sql`, password `Password@123`):
- `admin@careersync.dev` — ADMIN
- `recruiter@acme.dev` — RECRUITER at Acme FinTech
- `candidate@example.dev` — CANDIDATE

> First run: create the `careersync-resumes` bucket in the MinIO console (or via `mc mb`) —
> Compose does not auto-provision buckets.

## Local dev without Docker

Backend:
```bash
cd backend
# requires local Postgres + Redis + Mailpit + MinIO running (see docker-compose.yml for ports)
mvn spring-boot:run
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Architecture highlights (interview talking points)

1. **State machine as a choke point.** `ApplicationStateMachineService` is the only place
   `Application.currentStage` is ever mutated. Controllers cannot skip stages, resurrect a
   terminal application, or forget to write the audit ledger — the enum's
   `canTransitionTo()` is the single source of truth for legal transitions.

2. **SLA math is business-hours aware, not wall-clock.** `BusinessHoursCalculator` only
   counts 09:30–18:30 IST, Mon–Fri, minus company holidays — so a Friday-evening breach
   doesn't unfairly ding a recruiter over the weekend. Covered by unit tests for same-day,
   overnight-rollover, and weekend-skip cases.

3. **Concurrency-safe by two independent mechanisms.** ShedLock ensures only one pod's
   `@Scheduled` tick runs the scanner body; `SELECT ... FOR UPDATE SKIP LOCKED` ensures that
   even *within* a single tick, concurrently-running scanners never double-process the same
   row. Belt and suspenders — the kind of detail that separates a portfolio project from a
   toy CRUD app.

4. **Event-driven decoupling.** Stage transitions and SLA breaches publish Spring
   `ApplicationEvent`s; `NotificationEventListener` reacts `@Async` (on a virtual-thread
   executor) and only `AFTER_COMMIT`, so a slow email send or a rolled-back transaction never
   leaks into the request/scheduler hot path.

5. **Redis as a real cache, not a toy.** The 90-day responsiveness-score aggregation is
   expensive; `@Cacheable`/`@CacheEvict` on `ResponsivenessScoreService` means it's computed
   once per company per hour (or immediately evicted on a new breach/dispute resolution) —
   not recomputed on every public job-listing page view.

6. **Direct-to-S3 uploads.** The backend never buffers resume bytes in JVM heap — it hands
   the React client a pre-signed PUT URL and the browser uploads straight to
   S3/MinIO.

## What's intentionally out of scope
No microservices (clean modular monolith instead), no payment gateway, no WebSocket chat —
scope is deliberately narrowed to make the SLA/anti-ghosting engine the deepest, most
defensible part of the codebase.

## Project layout
```
careersync/
├── backend/            Spring Boot modular monolith
│   ├── src/main/java/com/careersync/
│   │   ├── domain/      JPA entities (user, company, job, application, notification, audit)
│   │   ├── repository/  Spring Data JPA repositories (incl. SKIP LOCKED native query)
│   │   ├── service/     State machine, SLA scanner, scoring, S3 presign, auth, notifications
│   │   ├── controller/  REST controllers
│   │   ├── security/    JWT issuing/validation, Spring Security wiring
│   │   ├── event/       Domain events (stage change, nudge, breach)
│   │   └── config/      Security, Redis/cache, S3, async, scheduling config
│   └── src/main/resources/db/migration/  Flyway V1-V3
├── frontend/            React + TypeScript + Vite + Tailwind
│   └── src/{pages,components,api,context,types}/
├── docker-compose.yml   Postgres, Redis, Mailpit, MinIO, backend, frontend
├── render.yaml          Render blueprint specification for backend deployment
└── .github/workflows/ci.yml
```

---

## 🚀 Cloud Deployment Guide (Zero-Cost Setup)

### 1. Database: Neon (Serverless PostgreSQL)
1. Go to [neon.tech](https://neon.tech) and create a free PostgreSQL project (e.g. `careersync-db`).
2. Copy the **Pooled Connection Details** (or connection string):
   - Example JDBC format: `jdbc:postgresql://<neon-host>/neondb?sslmode=require`
   - Username: `<neon-user>`
   - Password: `<neon-password>`
3. Neon automatically handles SSL and serverless autoscaling. Flyway will auto-migrate tables and seed demo data on first startup!

### 2. Backend: Render (Docker Web Service)
1. Push this repository to your GitHub account (`git push -u origin main`).
2. Log in to [render.com](https://render.com) and click **New+** -> **Web Service**.
3. Connect your `careersync` GitHub repository.
4. Render will auto-detect `render.yaml` or you can manually configure:
   - **Environment**: Docker
   - **Root Directory**: `backend`
   - **DockerfilePath**: `backend/Dockerfile`
   - **Plan**: Free
5. Add the following **Environment Variables** in Render:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<neon-host>/neondb?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `<neon-user>`
   - `SPRING_DATASOURCE_PASSWORD`: `<neon-password>`
   - `JWT_SECRET`: Generate any random 64-character secret string.
   - `CORS_ORIGIN`: `http://localhost:5173,https://<your-vercel-app>.vercel.app`
6. Click **Deploy**. Once live, your backend API will be available at: `https://<render-service-name>.onrender.com`.

### 3. Frontend: Vercel (React + Vite)
1. Log in to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Import your `careersync` repository.
3. Configure the Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click edit and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://<render-service-name>.onrender.com/api`
5. Click **Deploy**. Your frontend is now live with global edge caching and SPA routing (configured via `vercel.json`).

### 4. CI/CD: GitHub Actions
The repository includes `.github/workflows/ci.yml`:
- Runs automated Maven tests on JDK 21.
- Validates the backend JAR build and Docker image packaging.
- Installs npm dependencies and verifies TypeScript compilation and Vite production bundling.
- Every `git push` to `main` triggers automated verification!

