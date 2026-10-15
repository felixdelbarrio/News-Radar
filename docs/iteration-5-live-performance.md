# Rendimiento real y cobertura de secciones · 15/10/2026

Despliegue existente actualizado a la versión 65 tras las correcciones del PR #36 (la medición detallada se realizó sobre la versión 64), aplicación 3.0.5. URL y permisos conservados. No se han enviado newsletters de prueba ni borrado noticias para medir. Los ayudantes temporales de diagnóstico se retiraron antes de publicar; se verificó el contenido guardado en Drive.

## Cambios adicionales derivados de producción

- Noticias de períodos con filas intercaladas: agrupación adaptativa en bloques de hasta 2.000 filas; se materializan solo las posiciones solicitadas.
- Traducciones de páginas: recuperación agrupada en lugar de muchos rangos mínimos; se devuelven solo claves solicitadas.
- Radar y deduplicación de otras vistas: índice ligero de titulares traducidos, sin extractos, en la caché fragmentada existente. Reutilizable entre incorporaciones de noticias e invalidado al guardar traducciones. No se traduce al abrir pantallas.

## Comparación controlada en Apps Script

Novedades: mismo período, 5.165 filas relevantes intercaladas en 7.711 posiciones de hoja, mismo total final de 116 resultados. Una ejecución antes y otra después con cachés relevantes vaciadas; no son medianas.

| Medida | Antes | Después de agrupar lecturas |
|---|---:|---:|
| Rangos de noticias | 58 | 4 |
| Servidor getDashboard | 22.011 ms | 8.425 ms |
| Contenido de noticias | 20.008 ms | 6.143 ms |
| Lectura de filas | 7.359 ms | 1.907 ms |
| Preparación de identidades | 9.416 ms | 1.602 ms |

La construcción inicial del índice se hizo antes de getDashboard en este diagnóstico: su tiempo figura en el JSON, pero no está incluido en serverMs. Esta pareja precede al índice ligero de titulares.

## Radar: cuello de botella confirmado

Telemetría del navegador con selección anual personal: versión 62, 73.476 ms totales (70.092 ms servidor); versión 63, 20.737 ms totales (15.902 ms servidor). La ingesta seguía activa; son observaciones, no una prueba controlada sobre un corpus inmóvil.

Perfil adicional antes/después del índice ligero: 23.322 → 15.216 ms servidor; identidades 9.280 → 6.607 ms; total final 278 en ambos casos. El corpus pasó de 8.527 a 8.529 filas. Los gráficos y el mapa de calor consumen 1–4 ms de servidor; el render de Radar observado fue 24–38 ms. La latencia principal corresponde a lectura, recuperación de identidades y RPC. Las huellas SHA-256 aún consumen unos 3,8–5,3 segundos en el perfil anual: permanece margen de mejora, sin justificar una reimplementación criptográfica apresurada ni un recorte del histórico.

## Cobertura global del servidor

Se ejecutaron 17 consultas de lectura, sin errores. La tabla recoge dos perfiles: anterior y posterior al índice de titulares. Cada perfil comparte memoria de una sola ejecución; las secciones posteriores se benefician de ese contexto. Son tiempos del servidor y no deben confundirse con latencia de usuario ni arranques independientes.

| Sección o servicio | Antes (ms) | Después (ms) |
|---|---:|---:|
| Radar | 23322 | 15216 |
| Noticias | 5108 | 5284 |
| Novedades | 4113 | 6881 |
| Newsletter: catálogos | 428 | 1811 |
| Newsletter: mis suscripciones | 585 | 793 |
| Administración: Ejecuciones | 767 | 792 |
| Administración: Suscripciones | 456 | 459 |
| Newsletter: estado de entrega | 792 | 793 |
| Administración: Adopción | 992 | 626 |
| Newsletter: estadísticas | 581 | 725 |
| Administración: Telemetría | 1171 | 1230 |
| Administración: Taxonomía | 482 | 432 |
| Administración: Idioma | 310 | 240 |
| Idioma: traducción de taxonomía | 440 | 392 |
| Administración: Auditoría | 1954 | 2154 |
| Administración: Configuración | 53 | 47 |
| Newsletter: histórico | 257 | 529 |

Fuentes se sirve desde los metadatos de administración de getDashboard y se verificó su tabla de 169 fuentes y paginación. Se abrieron las nueve pestañas administrativas y Newsletter personal; se comprobaron listas, estados y formularios sin guardar configuraciones ni ejecutar entregas. Taxonomía pasó de página 1 a 2; Auditoría pasó de página 1 a 2 con 20.000 registros disponibles. Ejecuciones mostró el histórico paginado.

## Verificación y límites

- `npm run verify`: 429/429 pruebas; cobertura de líneas 98 %.
- `npm run check:dist` y `git diff --check`: correctos.
- Pruebas específicas: historial de 50.000 registros, invalidación y cachés parciales, paginación, traducciones, deduplicación y preservación de ediciones.
- No se hizo una prueba de concurrencia multiusuario, cuotas máximas ni 50.000 registros reales en producción.
- La recopilación y recuperación continuaron activas durante las mediciones. Los estados de errores previos de fuentes no se confunden con fallos de navegación de esta prueba.
- La caché de Google puede expirar o desalojarse antes del TTL; los flujos deben reconstruirse correctamente. La primera carga anual sigue siendo más lenta.

No se afirma que la aplicación esté «100 % optimizada». Se han cubierto todas las secciones de navegación y sus principales consultas de lectura, corregido los costes medidos y preservado el histórico. Próximos candidatos: medir reutilización incremental de huellas sin perder invalidación por cambios de texto, y separar metadatos administrativos estables de las respuestas de selección. Requieren comparación controlada y pruebas de permisos y frescura antes de desplegar.

Datos detallados: `iteration-5-live-performance.json`. Evidencias locales: `output/iteration-5-live/`.

## Verificación en navegador de la versión 64

Novedades: 11.816 ms totales, 8.335 ms servidor. Radar anual personal: 18.897 ms totales, 14.834 ms servidor; respuesta con caché de servidor: 5.574 ms totales, 1.963 ms servidor, 247 ms de contenido. Radar anual sin filtros de segmento/cobertura: 17.402 ms totales, 12.893 ms servidor. Noticias desde Radar con selección anual amplia: 20.553 ms totales, 15.392 ms servidor. Se verificó cargar más: de 30 a 60 sobre 170 publicaciones de la geografía visible. La fila específica de esa segunda carga no apareció en la página de telemetría consultada, por lo que no se le atribuye un tiempo.

Los tiempos observados varían por período, caché e ingesta concurrente; no garantizan una latencia máxima. El P95 de 30 días incluye versiones anteriores y no demuestra el P95 del nuevo despliegue.
