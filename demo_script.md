# CivicLens AI — Hacktoberfest Hack Day Demo Script

**Project Title:** CivicLens AI — AI-Powered Civic Issue Reporting Assistant  
**Event:** Hacktoberfest Hack Day  
**Target Duration:** 3 to 5 minutes  
**Visual Theme:** Professional Dark Navy (`#0b0f19`) and Teal (`#06b6d4` / `#14b8a6`)

---

## 🎯 Demo Goal
Demonstrate how a citizen can photograph a visible community problem (such as a pothole, garbage dump, broken street light, or drainage overflow), receive an instant structured AI assessment using local Google Gemma via Ollama, and obtain an actionable, formal municipal complaint letter draft in English or Hindi without any paid API keys.

---

## 🛠️ Step 0: Pre-Flight Environment Verification (30 Seconds)

Before presenting, ensure Ollama is running on your machine:

```powershell
# Verify Ollama is installed and active
ollama list

# If Ollama is not running in the background, start it:
ollama serve
```

Confirm available models in Ollama:
- **Active Model:** `gemma3:1b`

---

## 🚀 Step 1: Launch CivicLens AI (30 Seconds)

Open two terminals:

### Terminal 1: Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```
*Expected output:*
```
[CivicLens AI] Starting backend server in development mode
[CivicLens AI] Active AI Provider: OLLAMA
[CivicLens AI] CORS Allowed Origins: ['http://localhost:5173', ...]
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Frontend (React + Vite + TypeScript)
```powershell
cd frontend
npm run dev
```
*Expected output:*
```
VITE v8.3.5 ready in ~250 ms
➜ Local: http://localhost:5173/
```

Open your browser to: **http://localhost:5173**

---

## 🖥️ Step 2: Dashboard Overview (45 Seconds)

1. **Dark Navy & Teal UI:** Highlight the clean, modern dark visual theme built for high-contrast accessibility on both laptop and mobile screens.
2. **AI Health Indicator:** Show the live probe in the header (`AI Online: OLLAMA • gemma3:1b` or installed model).
3. **Model Switcher:** Point out the configurable model selector in the header bar.
4. **Bilingual Support:** Click **हिन्दी** in the top right to demonstrate that the entire UI dynamically translates into Hindi. Toggle back to **EN** (or keep Hindi for bilingual audiences).

---

## 📸 Step 3: Image Evidence Upload & Analysis (60 Seconds)

1. **Option A: Real File Upload**
   - Click the dropzone or drag-and-drop the included sample test image: `sample_data/sample_pothole.jpg`.
   - Observe the instant image preview and metadata display (`40.06 KB • JPEG`).

2. **Option B: Quick Sample Preset**
   - Notice the clearly labeled **SAMPLE DEMO DATA** badge.
   - Click any preset (e.g., *Pothole Crater*, *Garbage Dump*, *Exposed Cable*, or *Drainage Overflow*).
   - Observe how the sample image, category, and notes are pre-populated.

3. **Provide Location Context:**
   - In the Location field, enter: `Sector 4 Main Arterial Road, near Bus Stop 12`.
   - Click the glowing gradient button: **Analyze Civic Issue**.

4. **Live Scanning Progress:**
   - Observe the step-by-step scanning indicator as local Gemma processes the evidence.

---

## 📊 Step 4: Structured AI Results Panel (60 Seconds)

Show the comprehensive structured response:
1. **Side-by-Side Original Image Display:**
   - Point out the original evidence photo displayed right beside the analysis cards.
   - Click the photo or **Zoom** to open the full-screen visual evidence preview.
2. **Prominent Severity Indicator:**
   - Note the color-coded severity badge (**Critical**, **High**, **Medium**, or **Low**) with an animated radar pulse.
   - Read the **Priority Rationale** explaining why that urgency rating was assigned.
3. **Observable Evidence Card:**
   - List the specific observable physical features detected.
4. **Potential Public Hazards Card:**
   - Highlight commuter safety risks, vehicle damage risks, or environmental vectors.
5. **Responsible Civic Department:**
   - Observe the exact municipal authority mapped (e.g., *Municipal Corporation / Nagar Nigam*, *Public Works Department (PWD)*).
6. **Citizen Next Action Steps:**
   - Practical safety advice and municipal escalation steps.
7. **Legal & Governance Notice:**
   - Reiterate that AI-generated findings are treated as preliminary suggestions, never fabricated official inspections.

---

## 📝 Step 5: Editable Complaint Letter & Export (45 Seconds)

Scroll to the **Complaint Draft Editor**:
1. **Dynamic Placeholder Replacement:**
   - Enter Citizen Name: `Aarav Sharma`
   - Enter Contact: `+91 98765 43210`
   - Enter Landmark: `Near Metro Pillar 142`
   - Notice how all bracketed placeholders `[Citizen Name]`, `[Contact Number]`, and `[Location]` update live in the draft letter body!
2. **Direct Editing:**
   - Make an in-place text edit directly inside the complaint text area.
3. **Copy to Clipboard:**
   - Click **Copy Draft**; watch the checkmark toast confirm the copy action.
4. **Download Formal Report:**
   - Click **Download Report (.txt)**.
   - Open the downloaded file to show the complete, structured grievance document ready for physical submission or municipal portal upload.
5. **Session History:**
   - Click **Save to Session Reports**.
   - Navigate to the **Report History** tab to show that all reports created during this session are saved with search, filter, and deletion capabilities.

---

## ⚡ Alternative: Rapid CLI Verification (15 Seconds)

If asked by judges or evaluators to test backend inference via command line:

```powershell
curl.exe -X POST "http://localhost:8000/api/analyze" `
  -F "category=Pothole / Road Damage" `
  -F "description=Severe crater on Main Road" `
  -F "model=gemma3:1b" `
  -F "language=en"
```

---

## 🏆 Key Takeaways to Highlight
- **100% Free & Open-Source:** Runs locally using Google Gemma through Ollama without mandatory cloud subscriptions or paid API keys.
- **Privacy First:** Citizen photos and data stay on the device or host machine.
- **Civic Governance Integrity:** Strict guardrails prevent hallucinated GPS addresses or fake official verifications.
- **Empowering Citizens:** Turns frustrating civic inconveniences into structured, actionable municipal complaints in seconds.
