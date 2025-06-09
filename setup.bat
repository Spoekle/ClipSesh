@echo off
echo ====================================
echo ClipSesh Setup
echo ====================================

echo.
echo This script will set up the ClipSesh application.

:MENU
echo.
echo Choose an option:
echo 1. Install dependencies only
echo 2. Install dependencies and set up database
echo 3. Run the application
echo 4. Exit
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" goto :DEPENDENCIES
if "%choice%"=="3" goto :RUN
if "%choice%"=="4" goto :END

echo Invalid choice. Please try again.
goto :MENU

:DEPENDENCIES
echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Dependencies installed successfully!
goto :MENU

:RUN
echo.
echo Starting the application...
echo.
echo Press Ctrl+C to stop the servers when done.
echo.
start cmd /k "cd backend && npm run dev"
timeout /t 5
start cmd /k "cd frontend && npm run dev -- --host 192.168.1.38"
echo.
echo Both servers are now running!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
goto :MENU

:END
echo.
