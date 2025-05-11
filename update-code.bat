@echo off
echo Checking remote connection...
git remote -v
if errorlevel 1 (
    echo Error: No remote repository found.
    echo Please run connect-github.bat first.
    pause
    exit /b 1
)

echo.
echo Checking current version...
for /f "tokens=*" %%a in ('type src\pages\PatchNotes.js ^| findstr /C:"version:"') do (
    set CURRENT_VERSION=%%a
)
set CURRENT_VERSION=%CURRENT_VERSION:      version: =%
set CURRENT_VERSION=%CURRENT_VERSION:,=%
set CURRENT_VERSION=%CURRENT_VERSION:'=%
set CURRENT_VERSION=%CURRENT_VERSION: =%

echo.
echo Fetching latest version info...
git fetch origin
if errorlevel 1 (
    echo Error: Failed to fetch from remote repository.
    pause
    exit /b 1
)

git show origin/develop:src/pages/PatchNotes.js > temp_patch_notes.js
for /f "tokens=*" %%a in ('type temp_patch_notes.js ^| findstr /C:"version:"') do (
    set LATEST_VERSION=%%a
)
del temp_patch_notes.js
set LATEST_VERSION=%LATEST_VERSION:      version: =%
set LATEST_VERSION=%LATEST_VERSION:,=%
set LATEST_VERSION=%LATEST_VERSION:'=%
set LATEST_VERSION=%LATEST_VERSION: =%

echo Current version: %CURRENT_VERSION%
echo Latest version: %LATEST_VERSION%

if "%CURRENT_VERSION%" == "%LATEST_VERSION%" (
    echo.
    echo Already running the latest version.
    pause
    exit /b 0
)

if "%CURRENT_VERSION%" gtr "%LATEST_VERSION%" (
    echo.
    echo Error: Current version is newer than the latest version.
    echo This might indicate a version mismatch.
    pause
    exit /b 1
)

echo.
echo New version available. Proceeding with update...

echo.
echo Updating local code to latest version...
git reset --hard HEAD
git pull origin develop --no-commit
if errorlevel 1 (
    echo Error: Failed to update local code.
    pause
    exit /b 1
)

echo.
echo Updating npm packages...
npm install
if errorlevel 1 (
    echo Error: Failed to update npm packages.
    pause
    exit /b 1
)

echo.
echo Update completed successfully.
echo Please run restart.bat to apply the changes.
echo.
pause 