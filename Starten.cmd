@echo off
rem TFT Arcade lokal starten: baut die Seite und öffnet sie im Browser (Fenster offen lassen, Strg+C beendet)
cd /d "%~dp0"
start "" http://localhost:4173
node tools\serve.js
