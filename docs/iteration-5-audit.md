# Iteración 5 Rendimiento y deduplicación

## Problemas corregidos

Implementación local en `develop`. El proyecto de Apps Script y la hoja de producción se han consultado sin modificar su código, sus datos ni su despliegue. La distribución actualizada queda en `dist/`.

- Se elimina `newsReadLimit` de consultas, configuración, formulario y telemetría. Exportaciones, newsletters y traducciones acceden a todo el histórico; el límite explícito de exportación conserva su finalidad independiente.
- El índice de fechas y catálogos usa la caché existente `news-records`, es reconstruible desde Noticias y funciona con filas desordenadas. Se leen y clasifican los textos del período solicitado, con rangos agrupados y lecturas de hasta 2.000 filas.
- La caché `dashboard-fragments` conserva resultados y planes de paginación de Noticias. El plan contiene posiciones y métricas, sin copiar cuerpos de artículos; una página nueva recupera y clasifica sus artículos. Radar reutiliza la selección para el total disponible cuando no hay otros filtros.
- Se conservan las invalidaciones por datos, clasificación, configuración, taxonomía e identidades traducidas. El esquema de caché cambia para impedir reutilizar respuestas de la implementación anterior. Una caché incompleta provoca reconstrucción, sin recortar resultados.
- El trabajador existente precalienta, en reposo, Radar, Novedades y Noticias predeterminados en español, una vista por turno y solo hasta 2.000 filas del período. Cede ante ingesta, clasificación, traducciones, taxonomía y newsletters; no enumera combinaciones de filtros ni reconstruye vistas tras cada inserción. Las selecciones personales y demás idiomas se calculan bajo demanda.
- Se centraliza la identidad de URL para deduplicar envoltorios equivalentes de Google News y seguimiento. Se mantienen las URLs originales y sus hashes históricos de newsletters. La identidad editorial normaliza entidad, editor y fecha; la comparación textual se limita a candidatos del mismo editor y entidad, a dos días y hasta 32 candidatos por día. Solo admite una transposición tipográfica en una palabra larga, además de las coincidencias exactas y traducciones ya guardadas.
- Se elimina el recorte automático de traducciones a 30.000 variantes que podía expulsar traducciones legítimas del histórico.

## Archivos modificados

- src/: `src/server/briefing/Delivery.gs`, `src/server/briefing/Mail.gs`, `src/server/briefing/Subscriptions.gs`, `src/server/collection/Background.gs`, `src/server/config/Config.gs`, `src/server/config/Configuration.gs`, `src/server/metrics/Metrics.gs`, `src/server/news/DashboardCache.gs`, `src/server/news/Deduplication.gs`, `src/server/news/Feeds.gs`, `src/server/news/News.gs`, `src/server/news/Selection.gs`, `src/server/news/TranslationJobs.gs`, `src/server/storage/Store.gs`.
- assets/: `assets/admin-schema.json`, `assets/configuration-defaults.json`.
- scripts/: `scripts/benchmark-news.mjs`, `scripts/preview.mjs`.
- tests/: `tests/configuration.test.mjs`, `tests/helpers/server.mjs`, `tests/news-history.test.mjs`, `tests/newsletter-cadences.test.mjs`, `tests/published-dependencies.test.mjs`, `tests/radar.test.mjs`, `tests/reading-intelligence.test.mjs`.
- dist/: `dist/Background.gs`, `dist/Client.html`, `dist/Config.gs`, `dist/Configuration.gs`, `dist/DashboardCache.gs`, `dist/Deduplication.gs`, `dist/Defaults.gs`, `dist/Delivery.gs`, `dist/Feeds.gs`, `dist/Mail.gs`, `dist/Metrics.gs`, `dist/News.gs`, `dist/Selection.gs`, `dist/Store.gs`, `dist/Subscriptions.gs`, `dist/TranslationJobs.gs`.
- docs/: `docs/iteration-5-audit.md`, `docs/iteration-5-performance.json`.

## Resultados de rendimiento medidos y límites

Base: `5c43f28753cbfa239ac5535045a7b4bce90b755b`. Medianas de tres ejecuciones por volumen, con el mismo generador, orden y selecciones. Ejecuciones secuenciales, sin pruebas en paralelo. Los tiempos son reales del proceso local v24.1.0 con adaptadores de Sheets en memoria; no miden la latencia de Sheets, CacheService ni Apps Script, tampoco su consumo de RAM/CPU. El primer escenario carga Radar; Noticias se mide después, con caché de registros disponible. No se han creado 10.000, 25.000 o 50.000 filas de prueba en producción.

| Registros | Escenario | Antes ms | Después ms | Lecturas del adaptador antes → después | Resultados antes → después |
|---:|---|---:|---:|---:|---:|
| 10,000 | Radar con caché vacía | 595.7 | 72.0 | 1 → 2 | 767 → 767 |
| 10,000 | Primera selección de Noticias | 26.3 | 13.4 | 0 → 0 | 767 → 767 |
| 10,000 | Página siguiente de Noticias | 30.0 | 2.0 | 0 → 2 | 767 → 767 |
| 10,000 | Misma página cacheada | 0.1 | 0.1 | 0 → 0 | 767 → 767 |
| 10,000 | Período más antiguo | 20.6 | 4.8 | 0 → 1 | 55 → 55 |
| 10,000 | Selección de todo el histórico | 90.9 | 711.3 | 0 → 5 | 10,000 → 10,000 |
| 25,000 | Radar con caché vacía | 599.9 | 173.2 | 1 → 2 | 1,917 → 1,917 |
| 25,000 | Primera selección de Noticias | 33.3 | 43.4 | 0 → 0 | 1,917 → 1,917 |
| 25,000 | Página siguiente de Noticias | 36.7 | 2.7 | 0 → 2 | 1,917 → 1,917 |
| 25,000 | Misma página cacheada | 0.1 | 0.1 | 0 → 0 | 1,917 → 1,917 |
| 25,000 | Período más antiguo | 19.0 | 10.5 | 0 → 1 | 0 → 137 |
| 25,000 | Selección de todo el histórico | 89.4 | 1946.8 | 0 → 13 | 10,000 → 25,000 |
| 50,000 | Radar con caché vacía | 627.1 | 330.5 | 1 → 3 | 3,835 → 3,835 |
| 50,000 | Primera selección de Noticias | 46.2 | 79.8 | 0 → 0 | 3,835 → 3,835 |
| 50,000 | Página siguiente de Noticias | 47.0 | 2.0 | 0 → 1 | 3,835 → 3,835 |
| 50,000 | Misma página cacheada | 0.1 | 0.1 | 0 → 0 | 3,835 → 3,835 |
| 50,000 | Período más antiguo | 19.2 | 20.1 | 0 → 1 | 0 → 274 |
| 50,000 | Selección de todo el histórico | 87.8 | 3740.5 | 0 → 25 | 10,000 → 50,000 |

El tiempo de histórico completo no es una comparación de rendimiento equivalente: antes se reutilizaban 10.000 registros ya clasificados y se omitía el resto; después se prepara el período completo. La primera selección de Noticias es más lenta en los escenarios de 25.000 y 50.000 registros, mientras que la apertura de Radar y la paginación mejoran en este entorno. No se extrapolan estos resultados a Apps Script. El índice necesita una lectura de cuatro columnas del histórico al reconstruirse. Un período amplio con caché vacía sigue teniendo un coste proporcional a su volumen; las cuotas y expulsiones de CacheService pueden reducir la reutilización.

Reproducción desde este árbol de trabajo, sin cargas concurrentes:

```sh
node scripts/build.mjs
node scripts/benchmark-news.mjs --baseline > output/iteration-5-before.jsonl
node scripts/benchmark-news.mjs > output/iteration-5-after.jsonl
```

`--baseline` lee el código de `HEAD`. Para reproducir exactamente la base del informe, `HEAD` debe señalar al commit indicado. Los datos medidos completos se conservan en `docs/iteration-5-performance.json`.

## Duplicados detectados corregidos y pendientes

Se leyó la pestaña Noticias de la hoja facilitada mediante la sesión autenticada del navegador. El conector de Drive devolvió 403. La lectura contenía 8.556 registros entre 2025-10-16 y 2026-10-13. El diagnóstico de titulares normalizados encontró 90 grupos repetidos; 57 contenían filas a dos días o menos y reunían 124 filas. Es un diagnóstico de candidatos, no una autorización ni un recuento definitivo de filas que deban borrarse.

Las pruebas reproducen Blue Diamond con puntuación distinta y dos días de diferencia, la tarjeta UEFA con reedición a catorce días, fondos turcos con ordinales diferentes y símbolos bursátiles CBA.AX y CBAPJ.AX. Los titulares ibero-francés e ibero-galo permanecen separados: una paráfrasis incierta requiere revisión editorial. No se ha generalizado la similitud a noticias relacionadas.

Corregido en el código: prevención de nuevas copias por identidad editorial y URL equivalente; idempotencia entre fuentes y reintentos; consolidación lógica común en vistas, exportaciones y newsletters. Se dispone de `previewNewsDeduplication()` para revisar grupos, representantes y registros originales, incluso si dos filas repiten UUID. No utiliza LLM ni escribe datos.

Pendiente: publicar estos cambios en la aplicación y, si se desea, efectuar una limpieza física del histórico tras revisión. No se han borrado filas de la hoja real.

### Procedimiento seguro de consolidación

1. Trabajar primero en una copia íntegra del libro y conservar el original. Obtener como administrador el resultado completo de `previewNewsDeduplication()`; guardar su revisión, los representantes y todos los originales del informe. No registrar únicamente los recuentos ni confiar en logs truncados.
2. Revisar los grupos, especialmente cambios de cifras, productos, editor, fechas y traducciones. Una coincidencia aproximada no sustituye esa revisión. El diagnóstico general de 57 grupos no determina automáticamente la decisión de cada grupo.
3. Aplicar la consolidación lógica ya incluida: conservar filas originales en Noticias y usar la identidad común para seleccionar un representante. Así se preservan los filtros por fuente y las trazas, y no se añade otra fuente persistente de verdad.
4. Conservar sin cambios NewsletterEdiciones, NewsletterContenido, NewsletterEnvios, NewsletterEventos y NewsletterFeedback. NewsletterContenido guarda instantáneas completas: sus IDs, URLs y relaciones históricas no deben reescribirse para adaptarlos al representante actual. Conservar también Traducciones.
5. Verificar totales y ejemplos en Radar, Novedades, Noticias, CSV y una edición histórica; repetir con caché vacía. El informe es de solo lectura y puede repetirse sin alterar datos.
6. No ejecutar una eliminación física automática a partir del informe. Antes de una limpieza física hace falta preservar una relación durable entre cada alias original y su representante, conservar la consulta por fuentes y asegurar las claves de contenido enviado que impiden reenvíos. Esa migración no se ha introducido en esta iteración; mientras no exista, la consolidación lógica es la opción implementada que conserva todas las referencias.

## Tests ejecutados

- `npm run verify`: 424 pruebas correctas y comprobación de sintaxis, diseño, perfil y permisos. Cobertura global: 97,99 % de líneas, 93,82 % de sentencias, 96,10 % de funciones y 88,91 % de ramas.
- Tras retirar el campo interno de posición de las lecturas para newsletters: 68 pruebas de consumidores y regresión correctas, incluidas configuración, períodos, cadencias, correo e histórico.
- Diez pruebas nuevas cubren 50.000 registros, acceso antiguo, paginación, orden por entidad, filtros, caché parcial, invalidaciones, traducciones, precalentamiento, deduplicación conservadora, casos de la hoja real, idempotencia y preservación de originales y ediciones.
- Benchmark local: tres muestras de 10.000, 25.000 y 50.000 registros antes y después. No es una prueba de carga real de Apps Script.
