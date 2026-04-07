@echo off
cd /d "%~dp0Front-End"
npm.cmd run dev -- --host 0.0.0.0 --port 5173
