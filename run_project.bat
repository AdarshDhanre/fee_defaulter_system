@echo off
echo Starting Fee Defaulter System...

:: Start Java Backend
echo Starting Java Spring Boot Backend...
start "Java Backend" cmd /k "cd backend-java && apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

:: Start Next.js Frontend
echo Starting Next.js Frontend...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are starting!
echo Backend API will be available at: http://localhost:8080
echo Frontend UI will be available at: http://localhost:3000
pause
