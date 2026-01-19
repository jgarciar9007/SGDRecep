@echo off
echo ==========================================
echo      PUBLICANDO SGDRECEP CON PM2
echo ==========================================

echo [1/3] Instalando dependencias...
call npm install
cd server
call npm install
cd ..

echo [2/3] Construyendo el Frontend (Vite Build)...
call npm run build

echo [3/3] Reiniciando el servidor PM2...
:: Check if PM2 is installed
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 no esta instalado globalmente. Instalando PM2...
    call npm install -g pm2
)

:: Start or Reload the application
call pm2 startOrReload ecosystem.config.cjs --env production

echo ==========================================
echo      PUBLICACION COMPLETADA
echo ==========================================
call pm2 status
pause
