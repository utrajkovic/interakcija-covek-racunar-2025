@echo off
setlocal

REM Uvek idi u folder gde je start.bat
cd /d "%~dp0"

echo ===============================
echo Pokretanje projekta
echo Root: %CD%
echo ===============================

REM --- Rasa Action Server ---
if exist "chatbot" (
  start "Rasa Actions" cmd /k "call conda activate rasabot && cd chatbot && rasa run actions --debug"
) else (
  echo [ERROR] Folder 'chatbot' ne postoji
)

REM --- Rasa Core Server ---
timeout /t 5 >nul
if exist "chatbot" (
  start "Rasa Server" cmd /k "call conda activate rasabot && cd chatbot && rasa run --enable-api --cors * --port 5005 --debug"
) else (
  echo [ERROR] Folder 'chatbot' ne postoji
)

REM --- Angular Frontend (ROOT) ---
timeout /t 5 >nul
if exist "package.json" (
  start "Angular App" cmd /k "npm start"
) else (
  echo [ERROR] package.json nije pronadjen u root-u
)

echo ===============================
echo Svi servisi pokrenuti
echo ===============================
