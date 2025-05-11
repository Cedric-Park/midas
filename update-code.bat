@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo Checking remote connection...
git remote -v
if errorlevel 1 (
    echo Error: No remote repository found.
    pause
    exit /b 1
)

echo Checking current version...
if not exist "src\pages\PatchNotes.js" (
    echo Error: PatchNotes.js file not found.
    pause
    exit /b 1
)

set "current_version="
for /f "tokens=*" %%a in ('type "src\pages\PatchNotes.js" ^| findstr /C:"version:"') do (
    set "line=%%a"
    set "line=!line:version:=!"
    set "line=!line: =!"
    set "line=!line:'=!"
    set "line=!line:,=!"
    set "current_version=!line!"
)

if not defined current_version (
    echo Error: Could not find current version.
    pause
    exit /b 1
)

echo Current version: !current_version!

echo Fetching latest code...
git fetch origin develop
if errorlevel 1 (
    echo Error: Failed to fetch from remote repository.
    pause
    exit /b 1
)

echo Checking latest version...
set "latest_version="
for /f "tokens=*" %%a in ('git show origin/develop:src/pages/PatchNotes.js ^| findstr /C:"version:"') do (
    set "line=%%a"
    set "line=!line:version:=!"
    set "line=!line: =!"
    set "line=!line:'=!"
    set "line=!line:,=!"
    set "latest_version=!line!"
)

if not defined latest_version (
    echo Error: Could not find latest version.
    pause
    exit /b 1
)

echo Latest version: !latest_version!

if "!current_version!"=="!latest_version!" (
    echo Already running the latest version. No update needed.
    pause
    exit /b 0
)

echo Starting update...

echo Updating local code...
git reset --hard origin/develop
if errorlevel 1 (
    echo Error: Failed to update local code.
    pause
    exit /b 1
)

echo Updating npm packages...
call npm install
if errorlevel 1 (
    echo Error: Failed to update npm packages.
    pause
    exit /b 1
)

echo Update completed successfully.
echo Please run the following commands to complete the update:
echo 1. node migrate-timestamps.js
echo 2. restart.bat
pause 