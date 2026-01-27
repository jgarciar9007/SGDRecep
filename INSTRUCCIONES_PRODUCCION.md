# Instrucciones de Despliegue en Producción (Linux)

Este documento detalla los pasos para actualizar y publicar la aplicación en el servidor Ubuntu.

## Datos del Servidor
- **IP:** `192.168.20.70`
- **Usuario:** `cndes`
- **Ruta de la app:** `/var/www/SGDRecep`

---

## Pasos para Publicar Cambios

### 1. Subir cambios a Git
Asegúrate de haber hecho `commit` y `push` de tus cambios locales al repositorio Git (GitHub/GitLab).

### 2. Conectarse al servidor por SSH
Abre una terminal (PowerShell o CMD en Windows) y ejecuta:
```bash
ssh cndes@192.168.20.70
```
*Cuando pida la contraseña, introduce:* `Cndes2025*`

### 3. Ejecutar el script de despliegue
Una vez dentro del servidor, navega a la carpeta y ejecuta el script:
```bash
cd /var/www/SGDRecep
# Asegúrate de que el script tenga permisos de ejecución (solo la primera vez)
chmod +x deploy.sh
# Ejecuta el despliegue
./deploy.sh
```

---

## Configuración Inicial (Si es un servidor nuevo)

Si el servidor no tiene lo básico instalado, ejecuta esto primero:

### 1. Instalar Node.js y NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar PM2 globalmente
```bash
sudo npm install -g pm2
```

### 3. Configurar Nginx (Recomendado)
Para que la app sea accesible por el puerto 80 (HTTP estándar), se recomienda usar Nginx como Proxy Inverso. Puedes usar esta configuración básica en `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80;
    server_name 192.168.20.70;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Verificación
Para ver si el servicio está corriendo correctamente:
- `pm2 status` (Ver lista de procesos)
- `pm2 logs sgdrecep` (Ver logs en tiempo real)
