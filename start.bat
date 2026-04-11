@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo Starting Habit World...
start "" http://localhost:3000
npm run dev
