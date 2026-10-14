# CompostMonitor

CompostMonitor es un dashboard web para monitorear las condiciones ambientales de un dispositivo IoT. La aplicación muestra las lecturas de seis sensores de temperatura, permite consultar su histórico y descargar reportes mensuales en Excel.

## Funcionalidades

- Visualización de la lectura actual de seis sensores de temperatura.
- Gauges individuales para cada sensor.
- Gráfico histórico con rangos de 1 hora, 6 horas, 12 horas, 24 horas, 2 días, 7 días y 30 días.
- Activación o desactivación de sensores en el gráfico.
- Sincronización manual de la lectura actual.
- Actualización automática de los datos cada cinco minutos.
- Descarga de reportes mensuales en formato Excel.
- Configuración visual de alertas por correo electrónico o Telegram.

## Tecnologías

- React 19
- TypeScript
- Vite
- TanStack React Query
- Recharts
- React D3 Speedometer
- Lucide React
- Nginx para producción

## Dispositivo y API

El dashboard está configurado actualmente para el dispositivo `AF-EX01`.

Endpoints utilizados:

- `GET /api/v1/devices/AF-EX01/uplinks/latest`: obtiene la última lectura.
- `GET /api/v1/devices/AF-EX01/uplinks`: obtiene las lecturas históricas.
- `GET /api/v1/devices/report`: genera un reporte mensual en Excel.

El reporte se solicita con resolución diaria mediante `resolution=daily`.

## Requisitos

- Node.js 22 o superior.
- npm.
- Un backend disponible para los endpoints `/api/`.

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

El proyecto quedará disponible en la URL que indique Vite, normalmente `http://localhost:5173`.

## Scripts disponibles

```bash
npm run dev      # inicia el servidor de desarrollo
npm run build    # comprueba tipos y genera la compilación de producción
npm run lint     # ejecuta ESLint
npm run preview  # sirve localmente la compilación generada
```

## Despliegue con Docker

Construir y ejecutar la aplicación:

```bash
docker compose up --build -d
```

La aplicación se publica en el puerto `5173` del host. Nginx sirve los archivos estáticos y reenvía las peticiones `/api/` al backend configurado en `nginx.conf`.

## Estructura principal

- `src/main.tsx`: punto de entrada de React y configuración de React Query.
- `src/App.tsx`: dashboard, consultas de datos, reportes y configuración de alertas.
- `src/App.css`: estilos del dashboard y comportamiento responsive.
- `src/index.css`: estilos globales.
- `Dockerfile`: construcción de la imagen de producción.
- `nginx.conf`: servidor web y proxy para la API.
