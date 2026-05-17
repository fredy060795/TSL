@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden. Bitte Node.js installieren und erneut versuchen.
  goto :end
)

if not exist "node_modules\express\package.json" (
  echo Fehlende Abhaengigkeiten erkannt. Fuehre npm install aus...
  call npm install
  if errorlevel 1 (
    echo npm install ist fehlgeschlagen. Der Server konnte nicht gestartet werden.
    goto :end
  )
)

echo Starting TSL Backend on Port 5008...
call npm start

if errorlevel 1 (
  echo.
  echo Der Server wurde beendet oder konnte nicht gestartet werden.
)

:end
pause
