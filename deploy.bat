@echo off
cd /d "C:\Users\pouria\Desktop\Tracker"
echo Installing dependencies...
call npm install
echo.
echo Building project...
call npm run build
echo.
echo Adding to git...
git add .
echo.
echo Committing changes...
git commit -m "Fix vulnerabilities and add Supabase backend integration with Auth, Charts, and Sheets"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done! Check Vercel dashboard for deployment status.
pause
