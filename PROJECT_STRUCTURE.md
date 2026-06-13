# Fee Defaulter System - Project Structure & Architecture

Welcome to the **Fee Defaulter System** repository. This document describes the structure of the project, its components, database connection mechanisms, and how to run the services.

---

## 1. System Architecture Overview

The application is structured as a monorepo consisting of:
*   **`frontend/`**: Next.js client application written in TypeScript and styled with Tailwind CSS. It communicates with the backend services via REST APIs.
*   **`backend-java/`**: Spring Boot application acting as the primary enterprise backend. It exposes APIs for user authentication, student management, fee payments, and offline receipt OCR verification.
*   **`backend-python/`**: Flask application which can be used as an alternative backend, helper, or standalone Python application containing database seed utilities and automated services.
*   **`Supabase PostgreSQL Database`**: Hosted PostgreSQL instance serving as the unified persistent data layer for both Java and Python backends.

---

## 2. Directory Layout & Key Files

```
fee-defaulter-system/
├── .github/                   # GitHub action files
├── .venv/                     # Python virtual environment (ignored)
├── venv/                      # Python virtual environment (ignored)
├── backend-java/              # Spring Boot backend application
│   ├── src/main/java/         # Java source code (models, repositories, services, etc.)
│   ├── src/main/resources/    # Application configurations (application.properties)
│   └── pom.xml                # Maven project descriptor
├── backend-python/            # Flask backend application
│   ├── models/                # SQLAlchemy database models
│   ├── routes/                # Flask route blueprints
│   ├── services/              # Automated background schedulers, alerting, and Gemini OCR
│   ├── database/              # Local SQLite database fallbacks (ignored)
│   ├── config.py              # Configuration manager for environment variables
│   └── app.py                 # Python main entrypoint
├── frontend/                  # Next.js web application
│   ├── app/                   # Next.js App Router (pages and layouts)
│   ├── components/            # Reusable React components (Sidebar, etc.)
│   ├── package.json           # Node project descriptor
│   └── tailwind.config.ts     # Tailwind CSS styling configurations
├── .env                       # Environment variables (private, ignored)
├── .env.example               # Template environment configuration file
├── email_config.json          # Email service configurations (private, ignored)
├── requirements.txt           # Python backend dependencies
├── run_project.bat            # Windows startup script to launch Java and Next.js services
└── PROJECT_STRUCTURE.md       # Project structure guide (this file)
```

---

## 3. Database Configuration & Supabase Connection

Both backends utilize the same central **Supabase PostgreSQL database** using the `DATABASE_URL` parameter defined in the `.env` file:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/postgres
```

### Java Spring Boot Integration
On start-up, `FeeDefaulterApplication.java` executes a custom `.env` loader that:
1. Loads the environment variables from the parent directory (`../.env`).
2. Checks if `DATABASE_URL` is set.
3. Automatically parses the URL-encoded user credentials (e.g. decoding `@` signs) and formats the JDBC connection string:
   ```properties
   spring.datasource.url=jdbc:postgresql://<host>:<port>/postgres?sslmode=require
   ```
4. Registers these properties into Spring's active datasource configuration.

### Python Flask Integration
The Flask backend reads `DATABASE_URL` via `python-dotenv`. It cleans the connection prefix from `postgres://` or `postgresql://` to `postgresql+psycopg2://` as required by SQLAlchemy. If `DATABASE_URL` is missing, it falls back to the local SQLite database (`backend-python/database/db.sqlite3`).

---

## 4. How to Run the Services

### Automated Batch Script (Windows)
To quickly boot the Java backend and the Next.js frontend concurrently, run:
```cmd
run_project.bat
```

### Manual Steps
1.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Frontend will be available at: http://localhost:3000

2.  **Java Backend**:
    ```bash
    cd backend-java
    mvn spring-boot:run
    ```
    Java API will be available at: http://localhost:8080

3.  **Python Backend**:
    Ensure the `venv` is active and requirements are installed:
    ```bash
    venv\Scripts\activate
    pip install -r requirements.txt
    cd backend-python
    python app.py
    ```
    Python API will be available at: http://localhost:5000
