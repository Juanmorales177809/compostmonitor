# AGENTS.md

## Contexto del proyecto
- Este repositorio contiene un frontend en `React + TypeScript + Vite`.
- El punto de entrada es [src/main.tsx](/home/chirpstack/front_fx/src/main.tsx), donde la aplicación se monta dentro de `StrictMode` y se envuelve con `QueryClientProvider` de `@tanstack/react-query`.
- La UI principal vive actualmente en un único componente, [src/App.tsx](/home/chirpstack/front_fx/src/App.tsx), acompañado por estilos en [src/App.css](/home/chirpstack/front_fx/src/App.css) y [src/index.css](/home/chirpstack/front_fx/src/index.css).

## Estructura actual
- `src/main.tsx`: bootstrap de React y configuración global de React Query.
- `src/App.tsx`: contiene la lógica de datos, estado local, rendering del dashboard, controles del reporte y gráfico histórico.
- `src/App.css`: layout principal, sidebar, topbar, tarjetas de gauges, gráfico, leyenda, botones y responsive.
- `src/index.css`: estilos globales mínimos, tipografía base y foco accesible.
- `src/assets/`: recursos estáticos, aunque el componente principal actual no depende de ellos para la UI principal.

## Organización de componentes
- No existe todavía una carpeta `components/`, `pages/`, `layouts/` o `services/`.
- La organización actual es plana:
  - `App` funciona como página principal y layout.
  - `SensorGauge` es el único subcomponente extraído dentro del mismo archivo `App.tsx`.
- La configuración visual y de dominio se define como constantes dentro de `App.tsx`:
  - rangos de histórico (`ranges`)
  - configuración de sensores (`sensorConfig`)
  - colores de serie y colores claros de ícono
  - nombre del dispositivo del reporte (`AF-EX01`)
  - zona horaria (`America/Bogota`)
  - meses/años disponibles para reporte

## Navegación y rutas
- No hay enrutamiento activo en el código actual.
- Aunque `react-router-dom` está declarado en `package.json`, no se usa en `src/`.
- La navegación visible es interna por anclas del mismo documento:
  - `#overview`
  - `#devices`
  - `#gateways`
  - `#alerts`
  - `#settings`
- En la implementación actual solo existen secciones renderizadas para:
  - `#overview`
  - `#gateways`

## Flujo de UI
- El dashboard tiene dos zonas principales:
  - `sidebar` fija en escritorio
  - `main-panel` con header superior, estado de errores, gauges actuales y gráfico histórico
- En móviles:
  - el sidebar se oculta con media queries
  - aparece un botón de menú visual (`menu-button`), pero actualmente no abre un drawer ni cambia estado
  - los selectores del reporte quedan arriba y los botones se apilan

## Consumo de APIs
- El frontend consume APIs con `fetch` directamente dentro de `App.tsx`.
- No existe un cliente HTTP centralizado ni capa `services/`.
- Endpoints detectados:
  - `GET /api/v1/devices/AF-EX01/uplinks/latest`
    - usado por `fetchLatestUplink()`
    - devuelve la última lectura del dispositivo
  - `GET /api/v1/devices/AF-EX01/uplinks?start=...&stop=now()&limit=...`
    - usado por `fetchHistoricalUplinks(range)`
    - devuelve lecturas históricas para el gráfico
  - `GET /api/v1/devices/report?device_name=AF-EX01&year=YYYY&month=MM&resolution=daily`
    - usado por `handleDownloadReport()`
    - devuelve un archivo Excel descargable como `blob`
- Las llamadas fallidas validan `response.ok` y lanzan `Error` con mensajes en español.
- El nombre de archivo del reporte se intenta tomar de `content-disposition`; si no existe, se genera el fallback `reporte_AF-EX01_YYYY_MM.xlsx`.

## Manejo de estado
- Estado remoto:
  - se usa `@tanstack/react-query`
  - hay un `QueryClient` global en `main.tsx`
  - el dashboard usa dos queries:
    - `['latest-uplink', 'AF-EX01']`
    - `['historical-uplinks', 'AF-EX01', range]`
  - ambas tienen `refetchInterval` de 5 minutos
- Estado local en `App.tsx`:
  - `range`: rango del histórico
  - `reportMonth`: mes del reporte
  - `reportYear`: año del reporte
  - `isDownloadingReport`: estado de descarga del Excel
  - `visibleSensors`: sensores visibles en el gráfico histórico
- Estado derivado:
  - `liveFields`
  - `sensors`
  - `history`
  - `visibleSensorSet`
  - `updatedAt`

## Formularios y controles
- No hay formularios HTML completos con `submit`.
- Los controles existentes usan componentes nativos:
  - `select` para rango, mes y año
  - `button` para sincronización y descarga
  - `checkbox` para visibilidad de series del gráfico
- Los eventos se manejan inline con `onChange` y `onClick`.
- Las conversiones de tipo se hacen directamente desde el evento:
  - `Number(event.target.value)`
  - `event.target.value as RangeKey`

## Decisiones de UI/UX observadas
- Idioma de la interfaz: español.
- Tipografía global: `Space Mono` importada desde Google Fonts en `src/index.css`.
- Estilo visual:
  - fondo general blanco
  - sidebar azul oscuro `#102D69`
  - acentos en azul claro `#56ACDE`
  - marca secundaria magenta `#C14894`
- El botón de descarga del reporte tiene identidad visual separada:
  - color verde tipo Excel
  - ícono `FileSpreadsheet`
  - durante carga muestra spinner con `RefreshCw`
- El botón `Sincronizar` usa estilo secundario blanco con hover azul oscuro.
- Los sensores tienen dos paletas emparejadas por índice:
  - color fuerte para series del histórico
  - color claro para el fondo del ícono del gauge
- La leyenda del gráfico también funciona como control de visibilidad usando `checkbox`.

## Reglas implícitas del frontend
- El dispositivo del dashboard está acoplado actualmente a `AF-EX01`.
- El reporte descargado desde este dashboard debe solicitarse siempre con `resolution=daily`.
- El histórico muestra todas las series por defecto, pero el usuario puede ocultarlas desde la leyenda.
- La hora mostrada se formatea en `America/Bogota`, sin depender de la zona horaria local del navegador.
- Cuando no hay datos de sensores, el dashboard usa `emptyFields` con ceros.

## Herramientas y configuración
- Scripts disponibles en `package.json`:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`
- Lint:
  - `eslint.config.js`
  - configuración para `typescript-eslint`, `react-hooks` y `react-refresh`
- No se detectó test runner configurado en `package.json`.

## Limitaciones observables desde el código
- La app no está separada todavía en capas (`components`, `hooks`, `services`, `pages`).
- No hay validación runtime explícita del payload JSON.
- No hay rutas reales, solo navegación por anclas.
- El proyecto declara dependencias no visibles en uso dentro del código actual de `src/`, por ejemplo `react-router-dom`, `zustand`, `clsx` y `date-fns`.

## Guía para futuros agentes
- Antes de refactorizar, asumir que el comportamiento actual del dashboard está centralizado en `App.tsx`.
- Si se extraen módulos, conservar:
  - textos en español
  - identidad visual actual
  - contrato de endpoints
  - reporte fijo con `resolution=daily`
  - colores por sensor definidos por índice
- No asumir existencia de backend en este repositorio: el código presente corresponde al frontend.
