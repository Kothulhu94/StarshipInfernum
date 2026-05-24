@echo off
setlocal
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

set "PYTHON_EXE=%~d0\Users\rhoskins.evvcr\Desktop\Digi_Forge\StarshipInfernum\PortablePython\python.exe"

echo Running project bundler...

:: Check if PortablePython exists
if not exist "%PYTHON_EXE%" (
    echo [ERROR] PortablePython not found at %PYTHON_EXE%
    pause
    exit /b 1
)

:: Run the script (it handles timestamping and renaming now)
"%PYTHON_EXE%" tools\bundle_project.py

echo.
echo Check the latest FULL_PROJECT_*.txt in docs\backups\.
echo.
pause