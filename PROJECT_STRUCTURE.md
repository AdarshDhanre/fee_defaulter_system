# Fee Defaulter System — Detailed Project Structure & Architecture

This document provides an in-depth guide to the repository layout, component responsibilities, database layer, and service integrations.

---

## 1. System Architecture Overview

The application is a **hybrid monorepo** consisting of:

| Component | Technology | Port | Role |
|---|---|---|---|
| `frontend/` | Next.js 14, TypeScript, Tailwind CSS | 3000 | Admin Dashboard + Student Portal UI |
| `backend-java/` | Spring Boot, Spring Data JPA, Maven | 8080 | Enterprise REST API (primary backend) |
| `backend-python/` | Flask, SQLAlchemy, Flask-CORS | 5000 | Automation Engine (OCR, Payments, Alerts) |
| `Supabase` | PostgreSQL | cloud | Shared persistent database |
| `n8n` | Workflow automation | cloud/5678 | Email delivery + Google Sheets logging |

---

## 2. Full Directory Layout

```
fee-defaulter-system/
│
├── .env                             # Private env vars (gitignored)
├── .env.example                     # Template for env setup
├── email_config.json                # SMTP fallback credentials (gitignored)
├── requirements.txt                 # Python pip dependencies
├── run_project.bat                  # Windows: starts Java + Next.js concurrently
├── n8n_workflow_fixed.json          # Ready-to-import n8n automation workflow
├── README.md                        # Main project readme
├── PROJECT_STRUCTURE.md             # This file
│
├── backend-java/                    # Spring Boot Enterprise Backend
│   ├── Dockerfile
│   ├── pom.xml                      # Maven build + dependency descriptor
│   └── src/main/java/com/feedefaulter/
│       ├── FeeDefaulterApplication.java   # Entrypoint; loads .env, starts Spring
│       ├── config/                        # Security & CORS configuration
│       ├── controllers/                   # HTTP REST controllers
│       │   └── HomeController.java
│       ├── models/                        # JPA Entity classes (Student, Fee, Payment...)
│       ├── repositories/                  # Spring Data JPA repository interfaces
│       ├── services/                      # Business logic + service layer
│       └── utils/                         # Utility helpers
│
├── backend-python/                  # Flask Automation & OCR Backend
│   ├── app.py                       # Entrypoint: creates Flask app, registers blueprints, CORS
│   ├── config.py                    # DB URI config: PostgreSQL or SQLite fallback
│   ├── extensions.py                # Shared SQLAlchemy `db` instance
│   ├── seed.py                      # Seeds demo students + admin accounts
│   ├── seed_fees.py                 # Seeds fee structure records
│   ├── migrate_db.py                # DB migration helper
│   ├── fix_admin.py                 # Admin account repair utility
│   ├── run_prod.py                  # Production server runner (Gunicorn/Waitress)
│   │
│   ├── models/                      # SQLAlchemy ORM models (shared with Java via PostgreSQL)
│   │   ├── student_model.py         # Student: name, roll_no, email, course, branch, year, category
│   │   ├── fee_model.py             # Fee: total_fee, paid_amount, due_amount, late_fine, deadline, status
│   │   ├── payment_model.py         # Payment + OfflineReceipt (challan) models
│   │   ├── admin_model.py           # Admin: username, email, OTP fields
│   │   └── fee_structure_model.py   # FeeStructure: course/branch/year fee templates
│   │
│   ├── routes/                      # Flask Blueprint route handlers
│   │   ├── auth_routes.py           # Admin: login, OTP verify, password reset
│   │   ├── student_routes.py        # Admin CRUD: add/edit/delete students
│   │   ├── fee_routes.py            # Admin: assign fees, update due amounts
│   │   ├── payment_routes.py        # Manual payment + sends email + logs to Google Sheets
│   │   ├── student_portal_routes.py # Student: Razorpay checkout, verify payment, AI chat,
│   │   │                            #          upload offline challan receipt (Gemini OCR)
│   │   ├── dashboard_routes.py      # Admin dashboard: live analytics & stats
│   │   ├── defaulter_routes.py      # Defaulter list + send overdue alerts
│   │   ├── report_routes.py         # Generate payment reports
│   │   └── api_routes.py            # Secure JSON API for n8n → backend callbacks
│   │                                #   POST /api/verify_receipt (approve/reject challan)
│   │
│   ├── services/                    # Background service layer
│   │   ├── alert_service.py         # Core notification engine:
│   │   │                            #   - send_email(): n8n webhook → Brevo → SMTP fallback
│   │   │                            #   - log_payment_to_sheets(): dedicated Google Sheets webhook
│   │   │                            #   - alert_student(), alert_all_defaulters()
│   │   │                            #   - send_payment_success_email()
│   │   │                            #   - send_receipt_status_email()
│   │   ├── ocr_service.py           # Gemini 2.5 Flash: scans receipt image → JSON
│   │   ├── cron_service.py          # APScheduler: auto-alerts for overdue fees
│   │   └── report_service.py        # PDF/report generation
│   │
│   ├── templates/                   # Jinja2 HTML templates (Flask admin UI)
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── students.html
│   │   ├── payment.html
│   │   ├── payments_list.html
│   │   └── student_portal/          # Student portal templates
│   │       ├── dashboard.html
│   │       └── receipt.html
│   │
│   └── static/                      # Static assets
│       └── uploads/receipts/        # Uploaded challan images (gitignored)
│
└── frontend/                        # Next.js Admin + Student Dashboard
    ├── next.config.js
    ├── package.json
    ├── tailwind.config.ts
    │
    ├── app/                         # Next.js App Router pages
    │   ├── layout.tsx               # Root layout with font + metadata
    │   ├── globals.css              # Global Tailwind + custom CSS
    │   ├── page.tsx                 # Main admin dashboard (charts, analytics, stats)
    │   │
    │   ├── login/                   # Admin login page
    │   ├── register/                # Admin register + OTP email verify
    │   ├── forgot-password/         # Admin forgot password
    │   ├── verify/                  # OTP verification page
    │   │
    │   ├── students/                # Student list, search, management
    │   ├── fees/                    # Fee records list
    │   ├── fee/                     # Individual fee detail + edit
    │   ├── payments/                # Full payment transaction history
    │   ├── defaulters/              # Defaulters list + send email alerts
    │   ├── reports/                 # Report generation + download
    │   ├── dashboard/               # Admin overview dashboard
    │   │
    │   ├── student-login/           # Student OTP login page
    │   └── student-dashboard/       # Student portal
    │                                #   - Fee status overview
    │                                #   - Razorpay payment button
    │                                #   - Offline challan upload
    │                                #   - Payment receipt view
    │                                #   - AI Chat (EduAI powered by Gemini)
    │
    ├── components/
    │   └── Sidebar.tsx              # Collapsible admin navigation sidebar
    │
    └── utils/
        └── api.ts                   # Centralized API fetch utility (base URL config)
```

---

## 3. Database Schema (Supabase PostgreSQL)

Both Java and Python backends share the same database via `DATABASE_URL`.

| Table | Key Columns |
|---|---|
| `student` | id, name, roll_no, email, course, branch, year, category |
| `fee` | id, student_id (FK), total_fee, paid_amount, due_amount, late_fine, deadline, status |
| `payment` | id, student_id (FK), amount, method, transaction_id, date |
| `offline_receipt` | id, student_id (FK), file_path, extracted_utr, extracted_amount, extracted_date, ai_confidence, status, upload_date |
| `admin` | id, username, email, password_hash, otp, otp_expiry |
| `fee_structure` | id, course, branch, year, amount |

---

## 4. n8n Webhook Integration

### Webhook URL: `POST /webhook/fee-otp`

**Payload fields from Python backend:**

| Field | Description |
|---|---|
| `email_type` | `otp_verify`, `otp_reset`, `payment_success`, `overdue`, `partial`, `challan_status` |
| `student_email` | Recipient email |
| `student_name` | Recipient name |
| `otp_code` | 6-digit OTP (for OTP emails) |
| `html_message` | Full HTML email body (for non-OTP emails) |
| `student_id` | Student database ID |
| `student_roll` | Roll number |
| `student_course`, `student_branch`, `student_year` | Academic info |
| `amount_paid` | Payment amount (for payment_success) |
| `payment_id` | Receipt ID |
| `transaction_id` | Razorpay payment ID or manual transaction ID |
| `payment_method` | `"Razorpay"` or `"Manual"` |
| `payment_date` | ISO datetime string |
| `payment_status` | `"Success"` |
| `fee_total`, `fee_paid`, `fee_due` | Fee breakdown |

### Google Sheets Webhook: `POST /webhook/payment-sheets`
Set via `N8N_SHEETS_WEBHOOK_URL` env var. Triggered separately by `log_payment_to_sheets()`.

---

## 5. How to Run the Services

### Windows (One-Click)
```cmd
run_project.bat
```
Starts Java (8080) + Next.js (3000) concurrently.

### Manual Setup

```bash
# Frontend
cd frontend && npm install && npm run dev

# Java Backend
cd backend-java && mvn spring-boot:run

# Python Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend-python && python app.py
```

### Service URLs
| Service | URL |
|---|---|
| Next.js Frontend | http://localhost:3000 |
| Java API | http://localhost:8080 |
| Python Flask | http://localhost:5000 |
