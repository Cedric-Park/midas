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
echo Backing up database...
if exist midas.db (
    copy midas.db midas.db.backup
    if errorlevel 1 (
        echo Error: Failed to backup database.
        pause
        exit /b 1
    )
)

echo.
echo Fetching latest code...
git fetch origin
if errorlevel 1 (
    echo Error: Failed to fetch from remote repository.
    pause
    exit /b 1
)

echo.
echo Updating local code to latest version...
git rm --cached midas.db
git rm --cached midas.db-shm
git rm --cached midas.db-wal
git clean -f -d
git checkout -f origin/main
if errorlevel 1 (
    echo Error: Failed to update local code.
    pause
    exit /b 1
)

echo.
echo Restoring database...
if exist midas.db.backup (
    copy midas.db.backup midas.db
    if errorlevel 1 (
        echo Error: Failed to restore database.
        pause
        exit /b 1
    )
    del midas.db.backup
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
echo Please restart your server.
echo.
pause 