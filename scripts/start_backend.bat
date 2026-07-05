@echo off
for /f "usebackq tokens=*" %%a in (".env") do (
    echo %%a | findstr /v "^#" > nul && set %%a
)
cd backend
call gradlew.bat bootRun
