<p align="center">
  <strong>🎓 UniGo</strong>
</p>

<p align="center">
  <em>Find Your University Match — A smart platform that helps Pakistani students discover universities matching their academic profile, eligibility, and preferences.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📖 About

**UniGo** is an Advanced Database Management Systems (ADBMS) course project that provides an end-to-end platform for Pakistani students navigating university admissions. It ingests real university data, applies eligibility criteria, and matches students to programs they qualify for — all through a modern, minimal web interface.

### Key Features

- **🏛 University Explorer** — Browse 200+ Pakistani universities with filters for province, ranking, fees, HEC recognition, and programs offered
- **👤 Student Profiles** — Create academic profiles with matric/inter percentages, interests, and standardised test scores (MDCAT, ECAT, HAT, NTS, etc.)
- **✅ Eligibility Engine** — Rule-based matching engine that evaluates a student's academic record against program-level admission criteria
- **📚 Study Plans** *(planned)* — AI-generated study plans tailored to target university requirements
- **🔐 Secure Authentication** — HMAC-signed session cookies, bcrypt password hashing, and middleware-based route protection

---

## 🏗 Architecture

```
UniGo/
├── data/                          # Raw CSV datasets
│   └── pakistan_universities.csv   # 200+ universities with metadata
├── docs/                          # Project documentation & specs
├── docker-compose.yml             # PostgreSQL 16 container
└── web/                           # Next.js 16 application
    ├── prisma/
    │   ├── schema.prisma          # 8 models: University, Program, User, etc.
    │   ├── seed.ts                # CSV → University + Program import
    │   └── seed-criteria.ts       # Auto-generate eligibility criteria
    └── src/
        ├── app/
        │   ├── (auth)/            # Sign-in & sign-up pages
        │   ├── (app)/             # Protected app routes (dashboard)
        │   └── api/               # REST API endpoints
        ├── components/
        │   ├── layout/            # AppLayout (sidebar), SplitLayout (auth)
        │   └── ui/                # Button, Input, Card, Checkbox, Typography
        └── lib/
            ├── auth/              # Session management & password hashing
            ├── eligibility.ts     # Core matching engine
            └── prisma.ts          # Database client singleton
```

---

## 🗄 Database Schema

The PostgreSQL database is managed via Prisma ORM and contains the following models:

| Model | Description |
|---|---|
| `University` | 20+ fields: name, location, province, fees, ranking, HEC status, etc. |
| `Program` | Academic programs offered by each university |
| `EligibilityCriterion` | Admission requirements per program (min percentages, accepted tests) |
| `User` | Authentication credentials (email, bcrypt password hash) |
| `StudentProfile` | Academic profile linked to a user account |
| `TestScore` | Standardised test results (MDCAT, ECAT, HAT, NTS, etc.) |
| `EligibilityMatchResult` | Computed match results between students and programs |
| `StudyPlan` | AI-generated study plans stored as JSON |

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/sign-up` | Create account + student profile |
| `POST` | `/api/auth/sign-in` | Authenticate & set session cookie |
| `GET` | `/api/auth/session` | Get current authenticated user |
| `POST` | `/api/auth/logout` | Clear session cookie |

### Universities

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/universities?province=&limit=` | List universities with optional filters |

### Students

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students?limit=` | List student profiles |
| `POST` | `/api/students` | Create a new student profile |
| `POST` | `/api/students/[id]/test-scores` | Add a test score |
| `GET` | `/api/students/[id]/matches` | Get eligibility match results |

### Eligibility

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/eligibility/evaluate` | Run eligibility engine for a student |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Docker** (for PostgreSQL) or a local PostgreSQL 16 instance
- **npm** (comes with Node.js)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/UniGo.git
cd UniGo
```

### 2. Start the database

```bash
docker compose up -d
```

This spins up PostgreSQL 16 on `localhost:5433` with credentials `unigo/unigo123`.

### 3. Install dependencies

```bash
cd web
npm install
```

### 4. Configure environment

Create a `.env` file in the `web/` directory (or use the existing one):

```env
DATABASE_URL="postgresql://unigo:unigo123@localhost:5433/unigo?schema=public"
AUTH_SECRET="your-secret-key-here"
OPENAI_API_KEY="your-openai-key-here"   # Optional, for study plans
```

### 5. Run database migrations & seed

```bash
npm run db:migrate
npm run db:seed
npm run db:seed:criteria
```

This will:
1. Create all database tables
2. Import ~200 universities and their programs from the CSV dataset
3. Auto-generate eligibility criteria for each program

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the sign-up page.

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start development server |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `eslint` | Run ESLint |
| `npm run db:migrate` | `prisma migrate dev` | Run Prisma migrations |
| `npm run db:seed` | `prisma db seed` | Import universities from CSV |
| `npm run db:seed:criteria` | `tsx prisma/seed-criteria.ts` | Generate eligibility criteria |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4 |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7 (with `@prisma/adapter-pg`) |
| **Auth** | Custom HMAC session cookies + bcrypt |
| **Validation** | Zod 4 |
| **Containerization** | Docker Compose |

---

## 📂 Data Sources

The university dataset (`data/pakistan_universities.csv`) contains 200+ Pakistani universities with:

- Name, location, province, established year
- Programs offered (semicolon-delimited)
- Acceptance rate, annual fees (PKR), ranking
- HEC recognition status
- Entry test requirements (MDCAT, ECAT, HAT, NTS, etc.)
- Hostel & scholarship availability
- Official website URL

---

## 🗺 Roadmap

- [x] PostgreSQL database with Prisma schema
- [x] University & program data import from CSV
- [x] Eligibility criteria generation
- [x] Student profile management API
- [x] Eligibility matching engine
- [x] Authentication system (sign-up, sign-in, sessions)
- [x] UI component library
- [ ] Middleware route protection
- [ ] Universities dashboard page
- [ ] Student profile page
- [ ] Eligibility checker UI
- [ ] Study plans with AI generation
- [ ] Reports & analytics dashboard
- [ ] Settings page

---

## 👥 Team

ADBMS Course Project — Spring 2026

---

## 📄 License

This project is developed for academic purposes as part of the ADBMS course curriculum.
