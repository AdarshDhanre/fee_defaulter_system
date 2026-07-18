@echo off
echo Starting Fee Defaulter System...

:: Start Java Backend
echo Starting Java Spring Boot Backend...
start "Java Backend" cmd /k "cd backend-java && apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

:: Start Python Backend
echo Starting Python Flask Backend...
start "Python Backend" cmd /k "cd backend-python && python app.py"

:: Start Next.js Frontend
echo Starting Next.js Frontend...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo All services are starting!
echo Java Backend API will be available at: http://localhost:8080
echo Python Backend API will be available at: http://localhost:5000
echo Frontend UI will be available at: http://localhost:3000
pause
