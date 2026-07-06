@echo off
title Find PostgreSQL Installation
color 0B

echo.
echo ========================================
echo    FINDING POSTGRESQL INSTALLATION
echo ========================================
echo.

echo Searching for PostgreSQL...
echo.

echo [1] Checking if PostgreSQL is currently running...
echo ----------------------------------------
tasklist | find /I "postgres.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL IS RUNNING!
    echo.
    tasklist /FI "IMAGENAME eq postgres.exe" /FO LIST
) else (
    echo ❌ PostgreSQL is NOT running
)
echo.
echo.

echo [2] Searching for PostgreSQL executable...
echo ----------------------------------------
where pg_ctl 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found pg_ctl in PATH
) else (
    echo ❌ pg_ctl not found in PATH
)
echo.

where postgres 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found postgres in PATH
) else (
    echo ❌ postgres not found in PATH
)
echo.
echo.

echo [3] Checking common installation paths...
echo ----------------------------------------

if exist "C:\Program Files\PostgreSQL\" (
    echo ✅ Found: C:\Program Files\PostgreSQL\
    dir /B "C:\Program Files\PostgreSQL\"
    echo.
) else (
    echo ❌ Not found: C:\Program Files\PostgreSQL\
)

if exist "C:\PostgreSQL\" (
    echo ✅ Found: C:\PostgreSQL\
    dir /B "C:\PostgreSQL\"
    echo.
) else (
    echo ❌ Not found: C:\PostgreSQL\
)

if exist "C:\xampp\postgresql\" (
    echo ✅ Found: C:\xampp\postgresql\
    dir /B "C:\xampp\postgresql\"
    echo.
) else (
    echo ❌ Not found: C:\xampp\postgresql\
)

echo.
echo.

echo [4] Checking Windows Services...
echo ----------------------------------------
sc query | find /I "postgres" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found PostgreSQL service:
    sc query | find /I "postgres"
) else (
    echo ❌ No PostgreSQL service found
)
echo.
echo.

echo [5] Checking Registry for installation info...
echo ----------------------------------------
reg query "HKLM\SOFTWARE\PostgreSQL" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found PostgreSQL registry entries
) else (
    echo ❌ No PostgreSQL registry entries
)
echo.
echo.

echo ========================================
echo    SEARCH COMPLETE
echo ========================================
echo.
echo If PostgreSQL was found above, note the path!
echo You can provide this path to update the startup script.
echo.
echo If PostgreSQL was NOT found:
echo   - It may not be installed
echo   - Download from: https://www.postgresql.org/download/windows/
echo.
pause
