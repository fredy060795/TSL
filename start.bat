@echo off
cd /d "%~dp0"
echo Starting TSL Backend on Port 5008...
node server.js
pause
