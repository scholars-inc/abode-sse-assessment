# Talent Pipeline Assessment

This is an example full-stack monorepo application for managing candidate data. This system requires performance optimization and architectural improvements to meet production scalability requirements.

* This assessment evaluates your approach to data performance, scalability, and third-party API integrations in a realistic SaaS environment.
* Focus on demonstrating your judgment, tradeoffs, and reasoning rather than completing every detail.
* Estimated time: 1-3 hours

## Structure

```
talent-pipeline-assessment/
├── apps/
│   ├── api/          # NestJS backend with Prisma
│   └── web/          # React frontend with Vite
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Backend (`apps/api`)
- **NestJS** - Node.js framework
- **Prisma v7** - ORM with PostgreSQL
- **TypeScript**

### Frontend (`apps/web`)
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Material-UI** - Component library
- **RTK Query** - Data fetching and caching

### Database
- **PostgreSQL 16** - Database (via Docker)

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- Docker and Docker Compose installed
- npm or yarn package manager

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspace=apps/api
npm install --workspace=apps/web
```

### Step 2: Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL 16 container, accessible on host port 5433 (mapped from container port 5432).

### Step 3: Configure Database Connection

Create a `.env` file in `apps/api/` with the following content:

```bash
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/talent_pipeline?schema=public"' > apps/api/.env
```

### Step 4: Run Database Migrations and Generate Prisma Client Assets

```bash
# From the root directory
npm run prisma:migrate --workspace=apps/api
npm run prisma:generate --workspace=apps/api
```

### Step 5: Seed the Database

```bash
# From the root directory
npm run prisma:seed --workspace=apps/api
```

This will populate the database with 1000 legacy candidate records for testing purposes.

### Step 6: Start the Backend API

```bash
# From the root directory
npm run dev:api
```

The API will be available at `http://localhost:3000`

### Step 7: Start the Frontend

In a new terminal:

```bash
# From the root directory
npm run dev:web
```

The frontend will be available at `http://localhost:5173`

## Business Requirements & System Audit

The goal of this assessment is to address critical performance and reliability issues in an example talent pipeline system. The codebase represents a system that has grown organically and now requires architectural improvements to meet production demands.

### Business Context

**Performance Crisis:** Recruiters report the dashboard is unusable when more than 100 candidates are in the system. Response times degrade significantly as the dataset grows, making daily operations impractical.

**Data Integrity Concerns:** The sync process is causing data duplication and is frequently interrupted by external API timeouts. Multiple sync attempts result in inconsistent state, requiring manual intervention to resolve conflicts.

**Scalability Requirements:** We need to support thousands of candidates, requiring a shift from client-side to server-side data management. The current architecture loads all data into memory, which won't scale to our projected growth.

### Your Objectives

As a Senior Software Engineer, you're expected to:

1. **System Audit** — Conduct a thorough analysis to identify performance bottlenecks, inefficient query patterns, and architectural limitations. Document your findings and propose solutions.

2. **Data Reliability** — Ensure the sync engine is idempotent and handles partial failures gracefully. Implement retry strategies that account for external API volatility.

3. **Scalability** — Implement end-to-end server-side pagination across both the API and UI layers. Design a solution that maintains responsiveness regardless of dataset size.

4. **Additional Feature** — Implement one or more, depending on time, of the following to demonstrate product mindset and front-end ownership:
   - **Candidate detail view** — Allow users to drill into a candidate (e.g. modal or dedicated view) to see applications, interview notes, and scores in context.
   - **Filtering and search** — Support finding candidates by name or email and/or filters (e.g. by status or score range)
    - **Sortable table** — Allow sorting the candidates table by column. Prefer server-side sorting so it works correctly with pagination.

### Technical Context

The system integrates with a mocked external ATS (Applicant Tracking System) that periodically provides candidate data. The sync process should be resilient to network issues and API failures. The dashboard needs to support viewing of candidate information, including interview scores and notes.

You have full autonomy to refactor code, modify database schemas, and adjust the API contract as needed. The goal is production-ready code that balances performance, maintainability, and reliability.

## Evaluation Criteria

Your solution will be evaluated on:

1. **Technical Depth** — Demonstrated understanding of performance optimization, database query patterns, and system design principles.

2. **Problem-Solving Approach** — How you diagnose issues, prioritize fixes, and justify architectural decisions.

3. **Code Quality** — Clean, maintainable code that follows best practices for NestJS, React, and TypeScript.

4. **Production Readiness** — Solutions that consider error handling, edge cases, and operational concerns.

## Submission Requirements

Please provide the following deliverables:

### 1. Code Changes

Submit all modifications as a link to a private repo or provide a link to download your submission. Include any new migrations, schema changes, or configuration updates.
- Use SUBMISSION.md for any of the below details and any other notes you would like to add.
- NOTE: making a fork of this repo on Github cannot be made private. Clone the repo and create a new private repo on your account instead.

### 2. Diagnosis Report

Provide a technical report in that includes:

- **Performance Analysis:** What bottlenecks did you identify? Include specific examples.
- **Impact Assessment:** Quantify the performance improvements where possible (e.g., query time reduction, memory usage changes).

### 3. Architectural Justification

Document your design decisions:

- **Pagination Strategy:** Why did you choose limit/offset, cursor-based, or another approach? What are the trade-offs?
- **Error Handling:** How did you balance retry logic with user experience? What failure modes did you account for?
- **Dashboard Query Optimization:** What query patterns and data loading strategies did you use for `getRecruiterDashboard`? How did you optimize data fetching and aggregations?
- **Database Optimizations:** What indexes did you add and why? Did you consider alternative schema designs?
- **Additional Feature choice:** Which option(s) did you implement (Sortable table, Candidate detail view, or Filtering and search)? What UX or technical trade-offs did you consider?

### 4. AI-Assisted Development Documentation

We recognize that modern development workflows leverage AI tools. Please document:

- **How you used AI tools** to accelerate your workflow
- **Specific areas** where AI assistance was most valuable (e.g., boilerplate generation, debugging, code review, unit tests)
- **What you learned** from the AI interactions that improved your solution

This helps us understand your workflow and how you leverage modern tooling effectively.

### 5. Testing & Verification

Include instructions for:
- How to verify the performance improvements
- How to test the sync process under failure conditions
- Any additional setup or configuration needed

## Notes
- Focus on the three main objectives, but feel free to address additional improvements if time permits
- Ensure backward compatibility where possible, but don't hesitate to make breaking changes if justified
- Consider this a production codebase. Your solutions should be maintainable and well-documented
- We're interested in your thought process as much as the final implementation

We look forward to reviewing your work.
