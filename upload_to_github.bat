@echo off
echo ===================================================
echo       TRAOF SYSTEM - AUTO UPLOAD TO GITHUB
echo ===================================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL: "

echo.
echo Initializing Git...
git init

echo.
echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "Auto-upload via script"

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Setting remote origin...
git remote remove origin
git remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo ===================================================
echo Done! Please check the output above for any errors.
echo ===================================================
pause
