# CivicLens AI — AI-Powered Civic Governance & Municipal Redressal Platform

> **Intelligent Civic Issue Detection, Multimodal Evidence Analysis, Municipal Department Routing & Formal Grievance Generation**  
> Powered by **Google Gemini** (official `google-genai` SDK) with local **Ollama (Google Gemma)** fallback, **Supabase PostgreSQL & Storage** with Row Level Security (RLS), and a safe **Government Complaint Automation Sandbox**.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React_19_+_Vite_8-61DAFB.svg)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Google_Gemini-4285F4.svg)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL_&_Storage-3ECF8E.svg)](https://supabase.com/)

---

## 🌟 Purpose

Visible community problems—such as dangerous road craters, overflowing garbage heaps, non-functioning streetlights, exposed live wires, and blocked sewer drains—often go unresolved because citizens find municipal reporting hierarchies confusing, time-consuming, or opaque.

**CivicLens AI** bridges the citizen-government gap:
1. **Multimodal Evidence Analysis**: Citizens upload photos (JPG, PNG, WebP) or describe an issue. The AI analyzes physical evidence, calculates urgency ratings (**Critical**, **High**, **Medium**, or **Low**), and evaluates safety hazards.
2. **Intelligent Department Routing**: Maps issues to the exact responsible authority (Public Works Department / PWD, Municipal Corporation / Nagar Nigam, Electricity Board, or Water / Jal Board).
3. **Formal Complaint Drafting**: Generates professional, actionable grievance letters in **English** and **Hindi (हिन्दी)** with bracketed placeholders (`[Citizen Name]`, `[Location / Landmark]`, `[Contact]`).
4. **Interactive Civic Assistant**: Answers citizens' questions on grievance escalation, RTI (Right to Information) filing procedures, and emergency contact numbers.
5. **Government Automation Demo Sandbox**: A simulated municipal environment where citizens can submit demo reports, receive instant simulated receipts with SLA targets, and observe municipal officers reviewing, updating, and replying to complaints safely without calling external government APIs.
6. **Enterprise Cloud Persistence**: Offline-first hybrid architecture utilizing local storage with optional synchronization to **Supabase PostgreSQL** protected by strict Row Level Security (RLS).

---

## 🏗️ Directory Organization

```
CivicLens-AI/
├── frontend/                               # React 19 + TypeScript + Vite Frontend
│   ├── index.html                          # Single-page application root
│   ├── package.json                        # Node dependencies & build scripts
│   ├── package-lock.json                   # Deterministic package lock
│   ├── vite.config.ts                      # Vite build configuration
│   ├── tsconfig.json                       # TypeScript compiler settings
│   ├── vercel.json                         # Vercel deployment configuration
│   ├── .env.example                        # Frontend environment template
│   ├── public/                             # Public SVG assets and favicons
│   └── src/                                # Application source code
│       ├── App.tsx                         # Main view and layout orchestrator
│       ├── components/                     # Modular civic UI components (dashboards, modals, cards)
│       ├── types/                          # TypeScript schemas and data contracts
│       └── utils/                          # API clients (FastAPI, Supabase, Demo Store)
│
├── backend/                                # FastAPI Backend Server
│   ├── main.py                             # Server entrypoint and CORS setup
│   ├── requirements.txt                    # Python dependencies
│   ├── render.yaml                         # Render deployment blueprint
│   ├── .env.example                        # Backend environment template
│   ├── app/                                # Application package
│   │   ├── main.py                         # Re-exported FastAPI app instance
│   │   ├── config.py                       # Pydantic BaseSettings configuration
│   │   ├── models/schemas.py               # Pydantic request/response models
│   │   ├── providers/                      # AI providers (GeminiProvider, OllamaProvider)
│   │   ├── routes/                         # API routers (/analyze, /chat, /health, /demo)
│   │   └── services/                       # Image validator, prompts, departments, Supabase client
│   ├── data/demo_complaints.json           # Isolated demo mode database
│   ├── sample_data/sample_pothole.jpg      # Sample inspection photo for testing
│   └── tests/                              # Pytest automated test suites
│
├── supabase/                               # Database Schema & Migrations
│   ├── schema.sql                          # Core baseline schema
│   └── migrations/                         # Production SQL migrations with RLS policies
│
├── sample_data/                            # Root test assets
├── render.yaml                             # Root Render cloud blueprint
├── demo_script.md                          # Interactive demo walkthrough script
├── LICENSE                                 # MIT Open-Source License
├── .gitignore                              # Comprehensive secret & cache exclusion rules
└── README.md                               # Project documentation
```

---

## 📋 Prerequisites

Before starting, ensure you have:
1. **Python:** Version 3.10 or higher (Python 3.12 recommended).
2. **Node.js:** Version 18.0 or higher (Node 20+ recommended).
3. **Google Gemini API Key (Recommended):** Free API key from [Google AI Studio](https://aistudio.google.com/).
4. **Ollama (Optional Local Fallback):** Installed from [ollama.com](https://ollama.com) if running local Gemma models.

---

## ⚙️ Quick Start Installation

### Step 1: Clone and Configure Backend

1. Navigate to the backend directory and set up a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   
   # On Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   
   # On macOS/Linux:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create your `backend/.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Edit `backend/.env` with your settings:
   ```ini
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_actual_gemini_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   DEMO_MODE=true
   ```

5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will be available at `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).*

---

### Step 2: Configure and Run Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Create your `frontend/.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be available at `http://localhost:5173`.*

---

## 🔧 Environment Configuration Reference

### Backend Settings (`backend/.env`)
*Never commit this file to version control.*

| Variable | Default | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `gemini` | Active AI provider (`gemini` or `ollama`) |
| `GEMINI_API_KEY` | `""` | Google GenAI API key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model identifier (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama endpoint for offline development |
| `OLLAMA_MODEL` | `gemma3:1b` | Local Gemma model name |
| `SUPABASE_URL` | `""` | Supabase project URL (`https://your-ref.supabase.co`) |
| `SUPABASE_PUBLISHABLE_KEY` | `""` | Supabase publishable key for least-privilege server checks |
| `SUPABASE_SECRET_KEY` | `""` | Reserved for administrative maintenance (never exposed to frontend) |
| `DEMO_MODE` | `true` | Enforces demo safety barrier when `true` |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin (production domain in deployment) |
| `PORT` | `8000` | Backend server port |

### Frontend Settings (`frontend/.env`)
*Safe to expose public client variables.*

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL (set to deployed Render URL in production) |
| `VITE_SUPABASE_URL` | `""` | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `""` | Public anonymous publishable key |

---

## 🧪 Testing & Verification

Run the automated test suites using the project package managers:

### Backend Tests (Pytest)
```bash
# Run core Gemini AI & Supabase integration tests
python -m pytest -o pythonpath=backend -v backend/tests/test_gemini.py backend/tests/test_supabase.py

# Run full backend test suite
python -m pytest -o pythonpath=backend -v backend/tests/
```

### Frontend Code Quality & Build Checks
```bash
# Run Oxlint linter
npm --prefix frontend run lint

# Run TypeScript check & production build
npm --prefix frontend run build
```

---

## 🏛️ Government Complaint Automation Demo Mode

CivicLens AI includes a **Simulated Government Complaint Automation System**:
- **Safety Barrier:** When `DEMO_MODE=True`, outbound government submissions, SMS, and emails are strictly prevented via `assert_external_submission_blocked()`.
- **Pre-loaded Departments:**
  - PWD / Road Maintenance Department (potholes, asphalt damage)
  - Municipal Sanitation & Solid Waste Department (garbage, illegal dumping)
  - Electricity & Streetlighting Board (dark roadways, electrical hazards)
  - Water Supply & Sewerage Board / Jal Board (drainage leaks, open sewers)
  - Public Works & Civic Assets Department (damaged footpaths, civic structures)
- **Interactive Personas:**
  - **Citizen (`citizen` / `demo123`):** Submit reports, track status, add citizen replies, view simulated receipts.
  - **Municipal Officer (`officer` / `officer123`):** Review pending complaints, log inspection findings, dispatch crews, and update statuses.
  - **Administrator (`admin` / `admin123`):** Manage civic routing, review SLA health metrics, and audit system logs.

---

## 🚀 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Import repository `https://github.com/6549adityapratapsing-cmd/CivicLens-AI-frontend` into [Vercel](https://vercel.com/).
2. In **Project Settings**, configure **Root Directory** as `frontend`.
3. Framework Preset will auto-detect as **Vite**.
4. Add Environment Variables:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://civiclens-ai-backend.onrender.com`).
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase publishable anonymous key.
5. Click **Deploy**.

### Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com/) or use the bundled [`render.yaml`](render.yaml) blueprint.
2. In **Service Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. Add Environment Variables in Render Dashboard:
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: Your Google GenAI API key.
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `FRONTEND_URL`: Your deployed Vercel domain (e.g. `https://civiclens-ai-frontend.vercel.app`).
   - `DEMO_MODE`: `true`

---

## 📄 License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
