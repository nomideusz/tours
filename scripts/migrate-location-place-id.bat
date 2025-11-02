@echo off
REM Migration script for adding location_place_id column (Windows)
REM This is a standalone migration that only adds the Places API field

echo 🔧 Running migration: Add location_place_id to tours table
echo.

REM Check if .env exists and load it
if exist .env (
    echo ✅ Loading environment from .env
    for /f "tokens=*" %%a in ('type .env ^| findstr /v "^#"') do set %%a
) else (
    echo ⚠️  Warning: .env file not found
)

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ❌ Error: DATABASE_URL not found in environment
    echo Please set DATABASE_URL in your .env file
    pause
    exit /b 1
)

echo ✅ Database connection found
echo.

echo 📝 Executing SQL migration...
psql "%DATABASE_URL%" -f drizzle/migrations/0034_add_location_place_id.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo Next steps:
    echo 1. Restart your dev server: npm run dev
    echo 2. Test by creating a new tour with a Places API location
    echo 3. Verify location_place_id is saved in the database
) else (
    echo.
    echo ❌ Migration failed. Please check the error above.
    pause
    exit /b 1
)

pause

