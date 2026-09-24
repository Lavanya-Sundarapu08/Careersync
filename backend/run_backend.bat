@echo off
title CareerSync Backend Service (Port 8080)
cd /d "%~dp0"
echo ==============================================================
echo   Starting CareerSync Enterprise Backend on http://localhost:8080
echo ==============================================================
"C:\Program Files\Java\jdk-25.0.2\bin\java.exe" -XX:TieredStopAtLevel=1 -Xms256m -Xmx512m -jar target\app.jar
pause
