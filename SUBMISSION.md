# Submission

## Summary of changes

- **Server-side pagination end-to-end** (API + UI) so the dashboard stays responsive with thousands of candidates.
- **Dashboard query optimization**: removed N+1 query pattern and replaced with DB-side aggregation for interview metrics.
- **Idempotent + resilient ATS sync**: uniqueness enforced at the DB layer, sync uses upserts in a transaction, retries transient failures, and prevents concurrent syncs via a Postgres advisory lock.

## Code changes (high-signal)

- **Backend**
  - `apps/api/src/candidates/candidates.controller.ts`: accepts `limit`/`offset` query params for `GET /candidates`
  - `apps/api/src/candidates/candidates.service.ts`: paginated dashboard query, DB-side aggregates, and hardened sync
  - `apps/api/prisma/schema.prisma`: `externalId` uniqueness + supporting indexes
  - `apps/api/prisma/migrations/20260115000000_add_indexes_and_externalid_unique/migration.sql`: unique/index migration

- **Frontend**
  - `apps/web/src/store/api/candidatesApi.ts`: typed paginated query with defaults
  - `apps/web/src/components/Dashboard.tsx`: server-side pagination UI via `TablePagination`

## Diagnosis report

### Performance analysis (root causes)

- **Full-table load on dashboard**: `GET /candidates` fetched *all* candidates, regardless of UI needs.
- **N+1 query pattern** (worse: nested N+1):
  - For each candidate, the API queried applications.
  - For each application, the API queried interview notes.
  - This produces **O(C + A)** DB round-trips per request, which explodes as data grows and becomes unusable around ~100+ candidates.
- **Heavy payloads**: the API returned candidates *plus* applications *plus* notes for every row even though the UI table only needed summary fields.

### Data reliability issues (root causes)

- **Sync was not idempotent**: it called `create()` for each external candidate and had **no uniqueness constraint**, so retries produced duplicates.
- **Sync was not failure-safe**:
  - External ATS has a built-in failure rate; failures could interrupt the sync.
  - Partial writes meant subsequent runs compounded inconsistent state.

### Impact assessment (expected improvements)

- **DB round-trips per dashboard request**:
  - Before: ~\(1 + C + A\) queries (often thousands of queries at 1k candidates).
  - After: **3 queries** per request (page, total count, note aggregates) independent of total dataset size.
- **Payload size**: candidates now return **summary-only** fields used by the table, instead of deeply nested applications/notes.
- **Sync integrity**: duplicates are prevented at the DB layer and sync is safe to retry.

## Architectural justification

### Pagination strategy

- **Chosen**: **limit/offset** pagination with a **stable sort** (`createdAt desc`, then `id desc`).
- **Why**: simplest contract to implement quickly end-to-end; good enough for “thousands” of rows with supporting indexes.
- **Trade-offs**:
  - Offset pagination can degrade for very deep pages (large offsets).
  - If we needed “tens/hundreds of thousands” and deep paging, I’d switch to **cursor-based pagination** (`createdAt+id` cursor) to keep performance consistent.

### Dashboard query optimization strategy

- **Chosen**: page candidates + **aggregate interview stats in the DB** via `groupBy` over `InterviewNote`.
- **Why**: UI needs *summary rows* (avg score + note count), not full relational graphs.
- **How averages were computed**: the previous in-memory implementation averaged all 4 score dimensions per note. This is equivalent to:
  - \((avg(technical) + avg(communication) + avg(problemSolving) + avg(culturalFit)) / 4\)
  - which we compute efficiently via Prisma `groupBy(... _avg ...)`.

### Error handling and sync reliability

- **Idempotency**:
  - `Candidate.externalId` is **unique**.
  - Sync uses `upsert` keyed on `externalId` to create-or-update deterministically.
- **Partial failure handling**:
  - All upserts are executed in a **single DB transaction**, preventing half-applied syncs.
- **External volatility**:
  - Sync wraps ATS calls with **retry + exponential backoff + jitter**.
- **Operational safety**:
  - Sync uses **Postgres advisory locks** to prevent concurrent sync runs from different API instances.

### Database optimizations

- **Unique index**
  - `Candidate.externalId` to prevent duplication and enable `upsert` efficiently.
- **Supporting indexes**
  - `(createdAt, id)` indexes for stable, fast pagination ordering.
  - Foreign key field indexes (`candidateId`, `applicationId`) to speed up joins/aggregations.

## AI-assisted development notes

- **How I used AI**
  - Rapidly scanned the existing flow to pinpoint the exact N+1 query pattern and duplication source.
  - Drafted the refactor plan (pagination + aggregation + upsert sync) and applied focused code changes.
- **Most valuable areas**
  - Boilerplate reduction for pagination plumbing (API ↔ UI), and correctness review of aggregate math equivalence.
- **What I learned**
  - The biggest “speed win” here isn’t micro-optimizing React renders; it’s eliminating N+1 queries + payload bloat by returning purpose-built “summary rows.”

## Testing & verification

### Setup

Follow `README.md`, then run:

- `npm run prisma:migrate --workspace=apps/api`
- `npm run prisma:generate --workspace=apps/api`
- `npm run prisma:seed --workspace=apps/api`
- `npm run dev:api`
- `npm run dev:web`

### Verify performance improvements

- **Dashboard load time**:
  - Open the dashboard at `http://localhost:5173`.
  - Confirm it loads quickly with 1000+ seeded records and remains responsive when paging.
- **Network payload**:
  - In browser devtools → Network, inspect the `GET /candidates` response.
  - Confirm it returns only a page of candidates and includes `total`, `limit`, and `offset`.

### Verify sync reliability / failure modes

- **Idempotency**:
  - Click “Sync from ATS” multiple times.
  - Confirm no duplicate ATS candidates are created (enforced by `externalId` uniqueness + upsert).
- **Concurrent sync protection**:
  - Trigger sync twice quickly (or from two browser tabs).
  - One request should return **409** (“Sync already in progress...”).
- **External failures**:
  - The mocked ATS randomly fails; run sync until a failure occurs.
  - Confirm the API returns **503** after retries, and the DB remains consistent (transaction prevents partial writes).