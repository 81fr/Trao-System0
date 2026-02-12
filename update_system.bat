@echo off
echo ===================================================
echo       TRAOF SYSTEM - ONE-CLICK UPDATE
echo ===================================================
echo.
echo Adding all new changes...
git add .

echo.
echo Committing...
git commit -m "Update: %date% %time%"

echo.
echo Pushing changes to GitHub...
git push origin main

echo.
echo ===================================================
echo Done! Your system is now updated on GitHub.
echo ===================================================
pause
