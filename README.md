# 🎓 Fee Defaulter System

A robust, enterprise-grade **Fee Defaulter Management & Automated Alerting System** designed for educational institutions. This hybrid monorepo combines a high-performance **Java Spring Boot** backend, a **Python Flask** automation engine, and a responsive **Next.js** admin dashboard. It features intelligent offline bank receipt verification using **Gemini 2.5 Flash OCR**, secure **Razorpay** online payments, automated email alerts via **n8n + Brevo**, and real-time **Google Sheets** payment logging.

---

## 🛠️ Tech Stack & Key Technologies

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Enterprise Backend** | Java Spring Boot, Spring Data JPA, Maven |
| **Automation Backend** | Python Flask, SQLAlchemy, Flask-CORS |
| **Database** | Supabase PostgreSQL (shared central DB) |
| **Online Payments** | Razorpay (test + live mode) |
| **OCR / AI** | Google Gemini 2.5 Flash (`google-genai` SDK) |
| **Email Automation** | n8n + Brevo (Sendinblue) SMTP API |
| **Payment Logging** | Google Sheets via n8n Webhook |
| **Auth** | OTP-based email verification (Admin + Student) |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Admin([Institution Admin]) -->|Dashboard| Frontend[Next.js App Router :3000]
    Student([Student]) -->|Portal| Frontend

    Frontend -->|REST APIs| JavaBackend[Spring Boot API :8080]
    Frontend -->|REST APIs| PythonBackend[Flask Automation Engine :5000]

    JavaBackend -->|Reads/Writes| Supabase[(Supabase PostgreSQL)]
    PythonBackend -->|Reads/Writes| Supabase

    PythonBackend -->|Webhook POST| N8N[n8n Workflow Engine]
    N8N -->|Send Email| Brevo[Brevo SMTP API]
    N8N -->|Log Row| GoogleSheets[Google Sheets]
    N8N -->|Is Payment?| Condition{email_type == payment_success?}
    Condition -->|YES| GoogleSheets
    Condition -->|NO| EmailOnly[Send Email Only]

    PythonBackend -->|Scan Receipt| GeminiAPI[Gemini 2.5 Flash OCR]
    PythonBackend -->|Process Payment| Razorpay[Razorpay Gateway]
```

---

## 🌟 Key Features

### 1. 👨‍🏫 Admin Dashboard (Next.js + Java Backend)
- Live analytics: total fee collected, outstanding dues, active defaulters count
- Student management: add, view, edit, delete students
- Fee assignment and due date management
- Approve / Reject offline challan receipts (with AI-extracted data preview)
- Trigger individual or bulk email alerts to defaulters / partial payers
- View full payment history

### 2. 🎓 Student Portal (Flask Backend)
- Secure OTP-based email login
- View personal fee status (total, paid, remaining, fine)
- **Online Payment via Razorpay** — seamless UPI/Card/Net Banking checkout
- **Offline Challan Upload** — upload bank receipt image → Gemini OCR extracts UTR, amount, date → Admin verifies
- Download official payment receipt PDF
- AI-powered chat assistant (EduAI) powered by Gemini 2.5 Flash

### 3. 🧠 Gemini 2.5 Flash OCR Receipt Verification
- Students upload photo/scan of bank deposit slip
- Gemini extracts: `transaction_id` (UTR), `amount`, `date`, `confidence`
- Admin reviews and approves/rejects → fee record auto-updated

### 4. 📊 Google Sheets Automated Payment Logging (NEW)
- Every successful payment (Razorpay or Manual) triggers a dedicated n8n webhook
- Student data + payment info auto-appended to Google Sheets in real time
- Columns logged: Student ID, Name, Email, Roll No, Course, Branch, Year, Receipt ID, Amount Paid, Transaction ID, Payment Method, Payment Date, Status, Total Fee, Fee Paid, Remaining Due

### 5. 📧 Automated Email Notification Engine
Rich HTML email templates sent automatically via **n8n + Brevo**:

| Email Type | Trigger |
|---|---|
| 🔐 OTP Verify | Student/Admin registration |
| 🔑 OTP Reset | Admin password reset |
| 🚨 Fee Overdue Alert | Cron job / admin manual trigger |
| 🔔 Partial Payment Reminder | Admin manual trigger |
| ✅ Payment Success Receipt | After every successful payment |
| ✅/❌ Challan Status | After admin approves/rejects challan |

---

## 📂 Project Directory Structure

```
fee-defaulter-system/
│
├── 📄 .env                          # Environment variables (private, gitignored)
├── 📄 .env.example                  # Template for environment setup
├── 📄 email_config.json             # SMTP fallback config (private, gitignored)
├── 📄 requirements.txt              # Python dependencies
├── 📄 run_project.bat               # Windows one-click startup script
├── 📄 n8n_workflow_fixed.json       # ✅ Importable n8n workflow (email + Google Sheets)
├── 📄 README.md                     # This file
├── 📄 PROJECT_STRUCTURE.md          # Detailed architecture guide
│
├── 📁 backend-java/                 # Spring Boot Enterprise API (Port 8080)
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/feedefaulter/
│       ├── FeeDefaulterApplication.java    # App entrypoint + .env loader
│       ├── config/                         # Security, CORS, DB config
│       ├── controllers/                    # REST API controllers
│       │   └── HomeController.java
│       ├── models/                         # JPA entity models
│       ├── repositories/                   # Spring Data JPA repositories
│       ├── services/                       # Business logic services
│       └── utils/                          # Helper utilities
│
├── 📁 backend-python/               # Flask Automation Engine (Port 5000)
│   ├── app.py                       # Flask app entrypoint + CORS + Blueprint registration
│   ├── config.py                    # DB config (PostgreSQL / SQLite fallback)
│   ├── extensions.py                # SQLAlchemy db instance
│   ├── requirements.txt
│   │
│   ├── models/                      # SQLAlchemy ORM models
│   │   ├── student_model.py         # Student (name, roll_no, course, branch, year, email)
│   │   ├── fee_model.py             # Fee (total_fee, paid_amount, due_amount, late_fine, status)
│   │   ├── payment_model.py         # Payment + OfflineReceipt models
│   │   ├── admin_model.py           # Admin user model
│   │   └── fee_structure_model.py   # Fee structure templates
│   │
│   ├── routes/                      # Flask Blueprint route handlers
│   │   ├── auth_routes.py           # Admin login, OTP verify, password reset
│   │   ├── student_routes.py        # CRUD for students (admin panel)
│   │   ├── fee_routes.py            # Fee assignment and management
│   │   ├── payment_routes.py        # Manual payment + Google Sheets logging
│   │   ├── student_portal_routes.py # Student portal: Razorpay, receipt upload, AI chat
│   │   ├── dashboard_routes.py      # Admin dashboard analytics
│   │   ├── defaulter_routes.py      # Defaulter list and alert triggers
│   │   ├── report_routes.py         # Report generation
│   │   └── api_routes.py            # Secure API endpoints (n8n challan verify webhook)
│   │
│   ├── services/                    # Background services
│   │   ├── alert_service.py         # Email alerts + n8n webhook + Google Sheets logger
│   │   ├── ocr_service.py           # Gemini 2.5 Flash OCR for receipt scanning
│   │   ├── cron_service.py          # Scheduled auto-alert cron jobs
│   │   └── report_service.py        # PDF/report generation service
│   │
│   ├── templates/                   # Jinja2 HTML templates (admin panel Flask UI)
│   ├── static/                      # Static assets + uploaded receipts
│   ├── seed.py                      # DB seeder (sample students + fees)
│   └── seed_fees.py                 # Fee structure seeder
│
└── 📁 frontend/                     # Next.js Admin Dashboard (Port 3000)
    ├── next.config.js
    ├── package.json
    ├── tailwind.config.ts
    │
    ├── app/                         # Next.js App Router
    │   ├── layout.tsx               # Root layout
    │   ├── page.tsx                 # Main admin dashboard (charts, analytics)
    │   ├── globals.css              # Global styles
    │   ├── login/                   # Admin login page
    │   ├── register/                # Admin registration + OTP verify
    │   ├── forgot-password/         # Password reset flow
    │   ├── verify/                  # OTP verification page
    │   ├── students/                # Student list + management
    │   ├── fees/                    # Fee management
    │   ├── fee/                     # Fee detail view
    │   ├── payments/                # Payment history
    │   ├── defaulters/              # Defaulter list + send alerts
    │   ├── reports/                 # Reports view
    │   ├── dashboard/               # Admin dashboard overview
    │   └── student-dashboard/       # Student portal dashboard
    │       student-login/           # Student OTP login
    │
    ├── components/                  # Reusable React components
    │   └── Sidebar.tsx              # Navigation sidebar
    └── utils/
        └── api.ts                   # Centralized API utility functions
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
# ─── Gemini AI (OCR Receipt Scanning) ───────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ─── n8n Webhooks (Email + Google Sheets Automation) ─────────────
# Primary webhook for all emails (OTP, alerts, receipts)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/fee-otp
# Fallback webhook (optional)
N8N_RENDER_WEBHOOK_URL=https://your-n8n-instance.com/webhook/fee-otp
# Dedicated webhook for Google Sheets payment logging (NEW)
N8N_SHEETS_WEBHOOK_URL=https://your-n8n-instance.com/webhook/payment-sheets

# ─── Secure API Token (for n8n → Backend callbacks) ──────────────
API_TOKEN=your_secure_random_token_here

# ─── Database (Supabase PostgreSQL) ──────────────────────────────
DATABASE_URL=postgresql://username:password@host:port/postgres

# ─── Frontend URL (for email login links) ────────────────────────
FRONTEND_URL=http://localhost:3000
```

For SMTP email fallback, create `email_config.json` in root:
```json
{
  "email": "your_gmail@gmail.com",
  "password": "your_gmail_app_password"
}
```

---

## 🔁 n8n Workflow Setup

The file [`n8n_workflow_fixed.json`](./n8n_workflow_fixed.json) contains a ready-to-import n8n workflow.

### Import Steps:
1. Open n8n → **"Import from File"** → select `n8n_workflow_fixed.json`
2. Open the **3 HTTP Request nodes** → replace `YOUR_BREVO_API_KEY_HERE` with your actual Brevo API key
3. Open **"Google Sheets (Log Payment)"** node → click **Refresh** (🔄) to re-fetch column names from your sheet
4. **Activate** the workflow

### Workflow Flow:
```
Webhook (POST /fee-otp)
    ├── Switch ──── otp_verify → OTP Verify Email (Brevo) → Respond OK
    │           ├── otp_reset → OTP Reset Email (Brevo) → Respond OK
    │           └── other     → Send Backend Email (Brevo) → Respond OK
    │
    └── Is Payment Success? (email_type == "payment_success")
            ├── TRUE  → Google Sheets (Append Row) → Respond OK
            └── FALSE → Respond Not Payment
```

### Google Sheets Columns (must match exactly):
`Student ID` | `Student Name` | `Email` | `Roll No` | `Course` | `Branch` | `Year` | `Receipt ID` | `Amount Paid` | `Transaction ID` | `Payment Method` | `Payment Date` | `Status` | `Total Fee` | `Fee Paid` | `Remaining Due`

---

## 🚀 How to Run

### Option 1: Windows One-Click (Java + Next.js)
```bash
run_project.bat
```

### Option 2: Manual Startup

#### Next.js Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

#### Java Spring Boot Backend (Port 8080)
```bash
cd backend-java
mvn spring-boot:run
```

#### Python Flask Backend (Port 5000)
```bash
# From root directory
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend-python
python app.py
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---|---|---|
| Next.js Frontend | http://localhost:3000 | Admin dashboard + Student portal |
| Java Backend API | http://localhost:8080 | Enterprise REST API |
| Python Backend | http://localhost:5000 | Automation, OCR, Payments |
| Python Admin UI | http://localhost:5000/dashboard | Flask-based admin panel |

---

## 📧 Email Templates Preview

| Email | Description |
|---|---|
| 🔐 OTP Verify | Purple gradient, 6-digit OTP code |
| 🔑 OTP Reset | Red gradient, admin password reset |
| 🚨 Fee Overdue | Red badge, total outstanding + late fine |
| 🔔 Partial Reminder | Amber badge, paid vs remaining |
| ✅ Payment Success | Green header, receipt ID + transaction details |
| ✅/❌ Challan Status | Green/Red, OCR-extracted UTR + amount |

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to open a Pull Request.

*Developed with ❤️ for educational administration efficiency.*