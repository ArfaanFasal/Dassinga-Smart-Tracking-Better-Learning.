@echo off
cd /d "%~dp0"
set DB_ENGINE=django.db.backends.sqlite3
set DB_NAME=db.sqlite3
python manage.py migrate
if errorlevel 1 exit /b 1
python manage.py seed_demo_data
if errorlevel 1 exit /b 1
python manage.py runserver 0.0.0.0:5000
