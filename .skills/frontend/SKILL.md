# Frontend Dashboard Skill

## Propósito
Esta skill define cómo debe trabajar un agente dentro de este proyecto frontend de monitoreo IoT para mantener consistencia visual, arquitectónica y de consumo de APIs.

## Alcance real del repositorio
- El código actual implementa un dashboard frontend, no un backend.
- La aplicación visible vive principalmente en [src/App.tsx](/home/chirpstack/front_fx/src/App.tsx).
- No existen aún carpetas separadas como `components/`, `pages/`, `layouts/`, `hooks/` o `services/`.

## Cómo trabajar en este proyecto
- Revisar primero `src/App.tsx`, `src/App.css`, `src/index.css`, `src/main.tsx` y `package.json`.
- Respetar la estructura actual mientras el cambio sea pequeño.
- Si el cambio crece, extraer piezas de forma incremental y coherente, sin romper la organización existente.
- No introducir abstracciones grandes si el cambio puede resolverse dentro del patrón actual.

## Patrones detectados

### Llamadas a API
- Se usan `fetch` nativos, no Axios ni clientes personalizados.
- Las funciones de acceso a datos viven en el mismo archivo `App.tsx`.
- Toda llamada valida `response.ok` y lanza errores con mensajes legibles en español.
- El estado remoto se maneja con `@tanstack/react-query`.
- Los datos actuales usan estas convenciones:
  - última lectura: endpoint `/api/v1/devices/AF-EX01/uplinks/latest`
  - histórico: endpoint `/api/v1/devices/AF-EX01/uplinks?...`
  - reporte Excel: endpoint `/api/v1/devices/report?...&resolution=daily`
- Si se agregan nuevas llamadas:
  - preferir `fetch`
  - mantener manejo de error consistente
  - usar React Query para datos remotos persistentes o cacheables
  - usar `blob()` solo para descargas de archivos

### Manejo de formularios y controles
- El proyecto usa controles HTML nativos.
- Los selects y checkboxes se resuelven con estado local y `onChange`.
- No existe una librería de formularios.
- Si se agregan nuevos controles:
  - usar `useState` local si el estado es de pantalla
  - mantener etiquetas visibles (`label > span + control`)
  - deshabilitar botones/selects durante procesos asíncronos cuando aplique

### Organización de componentes
- Hoy solo existe un subcomponente local: `SensorGauge`.
- Las constantes de dominio (`ranges`, `sensorConfig`, colores, meses, años) viven en la parte superior del archivo.
- Las funciones utilitarias (`formatAdjustedTimestamp`, `formatChartTimestamp`, `extractFilename`) también viven en `App.tsx`.
- Si se necesitan más componentes:
  - extraer primero componentes visuales reutilizables
  - mantener la lógica de negocio cerca de donde se usa si solo afecta a una vista
  - no crear una jerarquía compleja sin necesidad real

## Reglas de UI/UX
- Mantener idioma español en labels, títulos y mensajes de error.
- Conservar la identidad visual existente:
  - sidebar azul oscuro
  - acentos azul claro
  - botón de reporte verde Excel
  - tipografía `Space Mono`
- No reemplazar controles nativos por librerías de UI si no hay una razón clara.
- Mantener el layout responsive actual:
  - sidebar oculto en móvil
  - acciones del header apiladas en pantallas pequeñas
- Cuando se añadan estados de carga:
  - deshabilitar la interacción conflictiva
  - reutilizar patrones ya presentes, como spinner con `RefreshCw` y cambio de texto

## Reglas de visualización de sensores
- Cada sensor debe conservar su índice de color.
- El color fuerte del sensor pertenece al histórico.
- El color claro correspondiente pertenece al fondo del ícono del gauge.
- No reutilizar la paleta institucional para las series del gráfico histórico.
- La leyenda del histórico también actúa como control de visibilidad de series.

## Restricciones funcionales detectadas
- El dashboard está acoplado a `AF-EX01`.
- La descarga del reporte debe seguir enviando `resolution=daily`.
- La zona horaria usada por el dashboard es `America/Bogota`.
- El histórico se basa en rangos predefinidos (`1h`, `6h`, `12h`, `24h`, `2d`).

## Cuándo refactorizar
- Si `App.tsx` sigue creciendo, la primera extracción recomendada es:
  - `components/SensorGauge.tsx`
  - `components/HistoryLegend.tsx`
  - `services/deviceApi.ts`
  - `constants/sensors.ts`
- Hacerlo solo si el cambio lo justifica y sin alterar contratos ni UI.

## Qué no hacer
- No asumir rutas con `react-router-dom` mientras no exista wiring real en `src/main.tsx`.
- No introducir librerías innecesarias para formularios, HTTP o estado.
- No cambiar el estilo visual base sin que la tarea lo pida.
- No mover consumo de API a otra convención distinta sin actualizar todo el patrón de pantalla.
- No documentar ni implementar backend dentro de este repositorio si el código no lo respalda.

## Checklist para futuros cambios
- ¿El cambio mantiene textos en español?
- ¿Respeta la paleta actual y la identidad visual del dashboard?
- ¿Sigue usando `fetch` y React Query de forma consistente?
- ¿Mantiene responsive el header y el panel histórico?
- ¿Conserva el comportamiento fijo del reporte diario?
- ¿Evita introducir estructuras o dependencias que el proyecto todavía no usa?
