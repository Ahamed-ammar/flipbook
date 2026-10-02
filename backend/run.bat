@echo off
setlocal EnableDelayedExpansion

REM Load .env file
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "line=%%A"
    REM Skip comment and empty lines
    if not "!line!"=="" (
        echo !line! | findstr /r "^#" >nul 2>&1
        if errorlevel 1 (
            set "%%A=%%B"
        )
    )
) 

echo Starting Folio backend...
echo DB: !DATABASE_URL!

mvn spring-boot:run ^
  -Dspring-boot.run.jvmArguments="-Xms256m -Xmx512m -DDATABASE_URL=!DATABASE_URL! -DDATABASE_USERNAME=!DATABASE_USERNAME! -DDATABASE_PASSWORD=!DATABASE_PASSWORD! -DJWT_SECRET=!JWT_SECRET! -DSTORAGE_PATH=!STORAGE_PATH! -DCORS_ORIGINS=!CORS_ORIGINS!"

endlocal
