@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden. Bitte Node.js installieren und erneut versuchen.
  goto :end
)

call npm ls --depth=0 >nul 2>nul
if errorlevel 1 (
  echo Fehlende Pakete erkannt. Starte npm install...
  call npm install
  if errorlevel 1 (
    echo npm install ist fehlgeschlagen. Der Server konnte nicht gestartet werden.
    goto :end
  )
)

echo Starte TSL Backend auf Port 5008...
call npm start

if errorlevel 1 (
  echo.
  echo Der Server wurde beendet oder konnte nicht gestartet werden.
)

:end
pause
