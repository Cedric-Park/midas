@echo off
echo Initializing Git repository...
git init
if errorlevel 1 (
    echo Error: Failed to initialize Git repository.
    pause
    exit /b 1
)

echo.
echo Checking Git remote connection...
git remote -v
echo.
echo Adding GitHub remote repository...
git remote add origin https://github.com/Cedric-Park/midas.git
echo.
echo Verifying connection...
git remote -v
echo.
echo If you see the GitHub URL above, connection is successful.
echo You can now use update-code.bat to update your code.
echo.
pause 