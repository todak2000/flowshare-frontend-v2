# FlowShare Frontend

**Live Production:** [https://flowshare-197665497260.europe-west1.run.app/](https://flowshare-197665497260.europe-west1.run.app/)

A modern, enterprise-grade Next.js frontend application for FlowShare - an AI-powered hydrocarbon allocation and reconciliation platform for joint venture (JV) partners in the oil and gas industry.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [Contributing](#contributing)

---

## Overview

FlowShare transforms traditional hydrocarbon management from a manual, time-consuming process into an automated, AI-driven platform. The frontend provides an intuitive interface for multiple stakeholders to interact with the system, visualize data, and manage the entire reconciliation workflow.

### Key Objectives

- **Transparency**: Real-time visibility into production data and allocation results
- **Automation**: AI-powered validation, calculation, and reporting
- **Accuracy**: Industry-standard calculations (API MPMS) with data integrity verification
- **Efficiency**: Reduce reconciliation time from days to minutes
- **Auditability**: Complete audit trail with cryptographic verification

---

## Features

### Core Features

- **Role-Based Authentication**: Secure login with Firebase Authentication for 4 user roles
- **Real-time Data Entry**: Intuitive forms for field operators to input production data
- **Interactive Dashboards**: Customized views for each stakeholder role
- **AI Agent Command Center**: Real-time monitoring of autonomous AI agents
- **Advanced Analytics**: Charts and visualizations using Recharts
- **Reconciliation Management**: End-to-end workflow from data entry to final reports
- **Terminal Receipt Management**: Upload and process terminal measurements
- **Smart Notifications**: AI-generated alerts and summaries
- **Demo Mode**: Sandbox environment with pre-populated data
- **Data Integrity**: SHA-256 hashing for tamper-proof records

### Advanced Features

- **AI-Powered Validation**: Automatic anomaly detection via Auditor Agent
- **Automated Reconciliation**: Complex calculations via Accountant Agent
- **Intelligent Reporting**: Natural language summaries via Communicator Agent
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Optimistic UI Updates**: TanStack Query for efficient data fetching
- **Server-Side Rendering**: Next.js 15 with Turbopack for optimal performance

---

## Technology Stack

### Core Framework

- **[Next.js 15.4.2](https://nextjs.org/)** - React framework with App Router
- **[React 19.1.0](https://react.dev/)** - UI library with latest concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Turbopack](https://turbo.build/pack)** - Ultra-fast bundler for development

### Styling & UI

- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[PostCSS](https://postcss.org/)** - CSS processing
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Recharts 3](https://recharts.org/)** - Composable charting library

### Backend Integration

- **[Firebase 12.0.0](https://firebase.google.com/)** - Authentication & Firestore database
- **[Firebase Admin 13.4.0](https://firebase.google.com/docs/admin/setup)** - Server-side operations
- **[@google/genai 1.24.0](https://ai.google.dev/)** - Google Generative AI (Gemini)
- **[TanStack Query 5.83.0](https://tanstack.com/query/latest)** - Server state management

### Development Tools

- **[ESLint 9](https://eslint.org/)** - Code linting
- **[Winston 3.17.0](https://github.com/winstonjs/winston)** - Structured logging
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering

### Deployment

- **[Docker](https://www.docker.com/)** - Containerization
- **[Google Cloud Run](https://cloud.google.com/run)** - Serverless deployment platform

---

## Architecture

### High-Level System Architecture
<p align="center">
  <img src="public/architecture.jpg" alt="High-Level System Architecture" width="500">
</p>

### Agent Architecture Deep Dive 
<p align="center">
  <img src="public/agent.jpg" alt="Agent Architecture Deep Dive" width="500">
</p>

### End-to-End Data Workflow
<p align="center">
  <img src="public/worflow.jpg" alt="End-to-End Data Workflow" width="500">
</p>

### CI/CD Deployment Pipeline
<p align="center">
  <img src="public/cicd.jpg" alt="CI/CD Deployment Pipeline" width="500">
</p>

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or later ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or later (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Docker**: (Optional) For containerized deployment ([Download](https://www.docker.com/))
- **Google Cloud SDK**: (Optional) For Cloud Run deployment ([Install](https://cloud.google.com/sdk/docs/install))

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space for dependencies
- **OS**: macOS, Linux, or Windows 10/11 with WSL2

---

## Installation

### 1. Clone the Repository

```bash
git clone --branch hackathon https://github.com/todak2000/hydrochain.git
cd hydrochain
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies defined in `package.json`.

### 3. Verify Installation

```bash
npm run dev --version
```

---

## Configuration

### 1. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing project
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database** (in production mode)
   - **Cloud Storage** (for file uploads)

#### Get Firebase Configuration

1. In Project Settings, find your web app configuration
2. Copy the configuration values

#### Set up Service Account

1. Go to Project Settings > Service Accounts
2. Generate a new private key (JSON)
3. Save the credentials securely

### 2. AI Agents Backend Setup

Ensure the backend services are running and accessible. See the backend  [README](https://github.com/todak2000/flowshare-agents-backend/blob/main/README.md) for setup instructions.

---

## Environment Variables

Create a `.env.local` file in the frontend root directory:

```bash
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side - KEEP SECRET)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_ID=your_client_id

# Google Generative AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Application Settings
NODE_ENV=development
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000

# Backend Agent URLs (Development)
NEXT_PUBLIC_AUDITOR_AGENT_URL=http://localhost:8081
NEXT_PUBLIC_ACCOUNTANT_AGENT_URL=http://localhost:8082
NEXT_PUBLIC_COMMUNICATOR_AGENT_URL=http://localhost:8083

# Backend Agent URLs (Production)
# NEXT_PUBLIC_AUDITOR_AGENT_URL=https://auditor-agent-g5zmzlktoa-ew.a.run.app
# NEXT_PUBLIC_ACCOUNTANT_AGENT_URL=https://accountant-agent-g5zmzlktoa-ew.a.run.app
# NEXT_PUBLIC_COMMUNICATOR_AGENT_URL=https://communicator-agent-g5zmzlktoa-ew.a.run.app

# Cloud Run Deployment URL
CLOUDRUN_URL=https://your-app-url.run.app/
```

### Environment Variable Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser
- Keep `FIREBASE_PRIVATE_KEY` and service account credentials secure
- Never commit `.env.local` to version control
- Generate strong random strings for `NEXTAUTH_SECRET`

---

## Running the Application

### Development Mode

Start the development server with Turbopack:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Features in Development Mode:**
- Hot Module Replacement (HMR)
- Fast Refresh for instant updates
- TanStack Query DevTools
- Source maps for debugging
- API documentation at `/docs` (if backend is running)

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

### Start Production Server

After building, start the production server:

```bash
npm start
```

The production server runs on port 3000 by default.

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

---

## Project Structure

```
frontend/
├── public/                          # Static assets
│   ├── images/
│   └── favicon.ico
│
├── src/
│   ├── app/                         # Next.js App Router (Pages & Layouts)
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing page
│   │   ├── globals.css             # Global styles
│   │   ├── providers.tsx           # React Query & context providers
│   │   │
│   │   ├── onboarding/             # Authentication
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── dashboard/              # Role-based dashboards
│   │   │   ├── page.tsx           # Dashboard routing
│   │   │   ├── field-operator/
│   │   │   ├── jv-coordinator/
│   │   │   ├── jv-partner/
│   │   │   └── auditor/
│   │   │
│   │   ├── production/             # Production data management
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │
│   │   ├── reconciliation/         # Reconciliation workflows
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │
│   │   ├── terminal/               # Terminal receipt management
│   │   │   └── page.tsx
│   │   │
│   │   ├── agents/                 # AI Agent Command Center
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │
│   │   ├── insights/               # Analytics & insights
│   │   │   └── page.tsx
│   │   │
│   │   ├── demo/                   # Demo mode
│   │   │   └── page.tsx
│   │   │
│   │   └── test-allocation/        # Testing utilities
│   │       └── page.tsx
│   │
│   ├── component/                   # Reusable React components
│   │   ├── ui/                     # Base UI components
│   │   ├── forms/                  # Form components
│   │   ├── charts/                 # Chart components
│   │   └── layouts/                # Layout components
│   │
│   ├── lib/                         # Core business logic
│   │   ├── allocation-engine.ts    # Allocation calculation engine
│   │   ├── firebase-service.ts     # Firebase client service
│   │   ├── agent-client.ts         # AI agent API client
│   │   └── auth.ts                 # Authentication logic
│   │
│   ├── hook/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProduction.ts
│   │   └── useReconciliation.ts
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── production.ts
│   │   ├── reconciliation.ts
│   │   └── agent.ts
│   │
│   ├── constants/                   # Global constants
│   │   ├── roles.ts
│   │   └── api.ts
│   │
│   └── utils/                       # Utility functions
│       ├── formatting.ts
│       ├── validation.ts
│       └── crypto.ts
│
├── .env.local                       # Environment variables (not in repo)
├── .dockerignore                    # Docker build exclusions
├── .eslintrc.json                   # ESLint configuration
├── .gitignore                       # Git ignore rules
├── Dockerfile                       # Container definition
├── next.config.ts                   # Next.js configuration
├── package.json                     # Dependencies & scripts
├── postcss.config.mjs              # PostCSS configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

---

## Core Modules

### 1. Allocation Engine (`lib/allocation-engine.ts`)

The heart of FlowShare's calculation logic.

**Responsibilities:**
- Calculate net volume from gross production
- Apply correction factors (BS&W, temperature, API gravity)
- Compute shrinkage between field and terminal measurements
- Allocate terminal volume proportionally to partners
- Generate cryptographic hashes for data integrity

**Key Functions:**
```typescript
calculateNetVolume(grossVolume, bsw, temperature, apiGravity)
calculateShrinkage(totalFieldNet, terminalGross)
allocateVolume(partners, totalVolume)
generateHash(data)
```

### 2. Firebase Service (`lib/firebase-service.ts`)

Manages all Firebase interactions.

**Responsibilities:**
- Initialize Firebase client and admin SDK
- Authentication state management
- Firestore CRUD operations
- Real-time data subscriptions
- File uploads to Cloud Storage

**Key Functions:**
```typescript
initializeFirebase()
signIn(email, password)
createUser(userData)
getDocuments(collection)
subscribeToCollection(collection, callback)
```

### 3. Agent Client (`lib/agent-client.ts`)

Communicates with backend AI agent services.

**Responsibilities:**
- HTTP client for agent APIs
- Request/response handling
- Error handling and retry logic
- Type-safe API calls

**Agent Endpoints:**
- Auditor Agent: Data validation and anomaly detection
- Accountant Agent: Reconciliation calculations
- Communicator Agent: Notifications and reports

---

## User Roles

FlowShare supports 4 distinct user roles:

### 1. Field Operator

**Permissions:**
- Create and edit production entries
- View own production data
- View dashboard with field-level insights

**Use Cases:**
- Daily production data entry from well sites
- Update production measurements
- Monitor field performance

### 2. JV Coordinator

**Permissions:**
- All Field Operator permissions
- Create terminal receipts
- Initiate reconciliation runs
- View all production data
- Manage partner relationships

**Use Cases:**
- Oversee entire reconciliation process
- Upload terminal measurements
- Trigger AI agent workflows
- Review and approve reconciliation results

### 3. JV Partner

**Permissions:**
- View allocated volumes for their partnership
- View reconciliation reports
- Access historical data
- Receive notifications

**Use Cases:**
- Monitor allocated hydrocarbon volumes
- Review reconciliation results
- Audit allocation calculations
- Download reports

### 4. Auditor

**Permissions:**
- Read-only access to all data
- View audit trails
- Access complete reconciliation history
- Export compliance reports

**Use Cases:**
- Compliance verification
- Data integrity audits
- Regulatory reporting
- Historical analysis

---

## Deployment

### Docker Deployment

#### Build Docker Image

```bash
docker build -t flowshare-frontend:latest .
```

#### Run Container Locally

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  flowshare-frontend:latest
```

### Google Cloud Run Deployment

#### Prerequisites

1. Install Google Cloud SDK
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project <project-id>`

#### Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/<project-id>/flowshare-frontend

# Deploy to Cloud Run
gcloud run deploy flowshare \
  --image gcr.io/<project-id>/flowshare-frontend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env.production)"
```

#### Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: |
          gcloud builds submit --tag gcr.io/<project-id>/flowshare-frontend
          gcloud run deploy flowshare \
            --image gcr.io/<project-id>/flowshare-frontend \
            --platform managed \
            --region europe-west1
```

---

## API Integration

### Backend Agent Services

The frontend communicates with three backend agent services:

#### 1. Auditor Agent (Port 8081)

```typescript
// Validate production entry
POST /api/validate
{
  "entry_id": "string",
  "partner_id": "string",
  "volume": number,
  "timestamp": "ISO8601"
}
```

#### 2. Accountant Agent (Port 8082)

```typescript
// Run reconciliation
POST /api/reconcile
{
  "terminal_receipt_id": "string",
  "period_start": "ISO8601",
  "period_end": "ISO8601"
}
```

#### 3. Communicator Agent (Port 8083)

```typescript
// Generate report summary
POST /api/notify
{
  "reconciliation_id": "string",
  "recipient_ids": ["string"]
}
```

### Example API Call

```typescript
import { agentClient } from '@/lib/agent-client';

async function runReconciliation(receiptId: string) {
  try {
    const result = await agentClient.accountant.reconcile({
      terminal_receipt_id: receiptId,
      period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      period_end: new Date()
    });

    console.log('Reconciliation completed:', result);
    return result;
  } catch (error) {
    console.error('Reconciliation failed:', error);
    throw error;
  }
}
```

---

## Contributing

### Development Workflow

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow TypeScript and ESLint rules
3. **Test locally**: `npm run dev` and verify functionality
4. **Lint code**: `npm run lint`
5. **Commit changes**: `git commit -m "feat: your feature description"`
6. **Push branch**: `git push origin feature/your-feature`
7. **Create Pull Request**: On GitHub

### Code Standards

- **TypeScript**: All new code must be TypeScript
- **Component Structure**: Functional components with hooks
- **Naming Conventions**:
  - Components: PascalCase (e.g., `DashboardCard`)
  - Files: kebab-case (e.g., `dashboard-card.tsx`)
  - Functions: camelCase (e.g., `calculateNetVolume`)
- **Styling**: Use Tailwind CSS utility classes
- **Comments**: Document complex logic with JSDoc

### Git Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### Firebase Authentication Errors

- Verify `.env.local` has correct Firebase credentials
- Check Firebase Console for authentication provider status
- Ensure domain is whitelisted in Firebase Auth settings

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Regenerate TypeScript types
npm run build
```

---

## Performance Optimization

### Best Practices Implemented

1. **Image Optimization**: Next.js Image component with lazy loading
2. **Code Splitting**: Dynamic imports for heavy components
3. **Server Components**: Use React Server Components where possible
4. **Caching**: TanStack Query with smart cache invalidation
5. **Bundle Analysis**: Regularly check bundle size

### Performance Monitoring

```bash
# Analyze bundle size
npm run build -- --analyze
```

---

## Security

### Security Measures

1. **Environment Variables**: Secrets stored securely, never committed
2. **CORS Protection**: Configured in backend services
3. **Firebase Security Rules**: Firestore rules enforce access control
4. **HTTPS Only**: All production traffic encrypted
5. **CSP Headers**: Content Security Policy configured
6. **Input Validation**: All user inputs validated and sanitized

### Reporting Security Issues

If you discover a security vulnerability, please email: todak2000@gmail.com

---

## License

Proprietary - All rights reserved

---

## Support

For questions, issues, or support:

- **Documentation**: See this README
- **Issues**: Open an issue on GitHub
- **Email**: support@flowshare.app

---

## Acknowledgments

- Built for the Google Cloud Run Hackathon 2025
- Powered by Next.js, React, and Firebase
- AI capabilities by Google Gemini

---

**Built with excellence by the FlowShare Engineering Team**
