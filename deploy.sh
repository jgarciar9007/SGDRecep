#!/bin/bash
# ==========================================
#      SCRIPT DE DESPLIEGUE PARA LINUX (UBUNTU)
# ==========================================

# Detener el script si hay errores
set -e

echo ">>> Iniciando despliegue de SGDRecep..."

# 1. Obtener cambios del repositorio
echo ">>> [1/4] Actualizando código desde Git..."
git pull origin main

# 2. Instalar dependencias
echo ">>> [2/4] Instalando dependencias (Frontend)..."
npm install

echo ">>> Instalando dependencias (Backend)..."
cd server
npm install
cd ..

# 3. Construir el Frontend
echo ">>> [3/4] Construyendo el Frontend (Vite)..."
npm run build

# 4. Reiniciar con PM2
echo ">>> [4/4] Reiniciando la aplicación en PM2..."
# Si PM2 no está instalado globalmente, se puede usar npx pm2
if ! command -v pm2 &> /dev/null
then
    echo "PM2 no encontrado. Intentando instalar globalmente..."
    sudo npm install -g pm2
fi

pm2 startOrReload ecosystem.config.cjs --env production

echo "=========================================="
echo "    ¡DESPLIEGUE FINALIZADO CON ÉXITO!"
echo "=========================================="
pm2 status
