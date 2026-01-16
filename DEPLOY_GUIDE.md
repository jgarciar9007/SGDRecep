# Guía de Despliegue en Windows Server

Esta guía detalla paso a paso cómo desplegar la aplicación **SGDRecep** (Sistema de Gestión Documental) en un servidor **Windows Server**.

El sistema utiliza una arquitectura **Full-Stack**:
- **Frontend**: React + Vite (Archivos estáticos).
- **Backend**: Node.js + Express (API y servicio de archivos).
- **Base de Datos**: SQLite (Archivo local `sgdrecep.db`).

---

## 1. Prerrequisitos

Debe instalar el siguiente software en el servidor Windows:

1.  **Node.js (Versión LTS)**
    *   Descargar e instalar desde: [https://nodejs.org/](https://nodejs.org/)
    *   Durante la instalación, asegúrese de marcar "Add to PATH".
2.  **Git for Windows** (Opcional, si va a clonar el repo)
    *   Descargar desde: [https://git-scm.com/download/win](https://git-scm.com/download/win)
3.  **PM2** (Para gestionar el proceso de Node.js en segundo plano)
    *   Abra PowerShell como Administrador y ejecute:
        ```powershell
        npm install -g pm2 pm2-windows-startup
        ```

---

## 2. Instalación de la Aplicación

### 2.1 Obtener el Código
Copie la carpeta del proyecto al servidor (ej. `C:\inetpub\wwwroot\sgdrecep` o `C:\Apps\sgdrecep`) o clone el repositorio:

```powershell
cd C:\Apps
git clone https://github.com/tu-usuario/sgdrecep.git
cd sgdrecep
```

### 2.2 Instalar Dependencias

Abra una terminal (PowerShell o CMD) en la carpeta del proyecto:

1.  **Instalar dependencias del Backend**:
    ```powershell
    cd server
    npm install
    cd ..
    ```

2.  **Instalar dependencias del Frontend**:
    ```powershell
    npm install
    ```

### 2.3 Construir la Aplicación (Build)
Este paso genera la carpeta `dist` con la aplicación optimizada.

```powershell
npm run build
```

---

## 3. Ejecución con PM2

Utilizaremos **PM2** para mantener el servidor activo, reiniciarlo si falla y gestionarlo como un servicio.

### 3.1 Iniciar el Servidor
Desde la carpeta raíz del proyecto (`C:\Apps\sgdrecep`):

```powershell
cd server
pm2 start index.js --name "sgdrecep-api"
```

El servidor ahora estará corriendo en `http://localhost:3000`.

### 3.2 Configurar Inicio Automático (Persistencia)
Para que la aplicación arranque automáticamente si el servidor se reinicia:

```powershell
# Instalar el paquete de soporte para Windows (si no lo hizo en el paso 1)
npm install -g pm2-windows-startup

# Instalar el servicio
pm2-startup install

# Guardar la lista de procesos actuales
pm2 save
```

---

## 4. Exponer la Aplicación (Opcional: IIS Reverse Proxy)

Si desea acceder a la aplicación mediante `http://su-dominio.com` (Puerto 80) en lugar de `http://servidor:3000`, debe configurar IIS como Proxy Inverso.

### 4.1 Requisitos de IIS
Instale los siguientes módulos mediante *Web Platform Installer* o descarga directa:
1.  **URL Rewrite Module**
2.  **Application Request Routing (ARR)**

### 4.2 Configuración del Sitio en IIS
1.  Abra el **Administrador de IIS**.
2.  Habilite el Proxy en ARR:
    *   Vaya a la raíz del servidor -> "Application Request Routing Cache".
    *   Clic en "Server Proxy Settings" (derecha).
    *   Marque "Enable proxy" y aplique.
3.  Cree un **Nuevo Sitio Web**:
    *   Nombre: `SGDRecep`
    *   Ruta física: `C:\Apps\sgdrecep` (o una carpeta vacía, el proxy hará el trabajo).
    *   Puerto: `80`
    *   Host Name: `su-dominio.com` (o déjelo en blanco para IP).

### 4.3 Configurar Reglas de Redirección (web.config)
Cree un archivo `web.config` en la raíz de su sitio IIS con este contenido:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Reinicie el sitio en IIS. Ahora IIS redirigirá todo el tráfico al backend de Node.js en el puerto 3000.

---

## 5. Verificación y Mantenimiento

*   **Ver logs**: `pm2 logs sgdrecep-api`
*   **Estado**: `pm2 status`
*   **Reiniciar**: `pm2 restart sgdrecep-api`
*   **Detener**: `pm2 stop sgdrecep-api`

### Ubicación de Archivos
*   **Base de Datos**: `server/sgdrecep.db`
*   **Archivos Adjuntos**: `server/uploads/`

**Nota de Seguridad:** Asegúrese de que el Firewall de Windows permita el tráfico en el puerto configurado (80 para IIS o 3000 si accede directo).
