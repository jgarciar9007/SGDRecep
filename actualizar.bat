@echo off
echo ==========================================
echo      ACTUALIZANDO SGDRECEP DESDE SERVIDOR
echo ==========================================

echo [1/5] Obteniendo cambios desde el servidor (Git Pull)...
call git pull origin main

echo [2/5] Instalando dependencias del cliente...
call npm install

echo [3/5] Instalando dependencias del servidor...
cd server
call npm install
cd ..

echo [4/5] Construyendo el Frontend (Vite Build)...
call npm run build

echo [5/5] Reiniciando la aplicacion en PM2...
call pm2 startOrReload ecosystem.config.cjs --env production

echo ==========================================
echo      ACTUALIZACION COMPLETADA
echo ==========================================
call pm2 status
pause
