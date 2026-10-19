# Iteración 11 · 3.9.0

Implementación sobre `develop`, partiendo de `0ba392b12212c698e8cc273555b60a35fb84137f` (3.8.2). Se contrastó el estado real y se verificó una nueva generación de snapshots en el libro de producción. **Publicado como versión 83 el 19/10/2026 a las 10:11 Europe/Madrid**, en la implementación existente, ejecutando como el usuario que despliega y con acceso del dominio.

## Cambios

- Contrato offline v2 compartido entre exportación, instrucciones, JSON Schema e importación. El proyecto ChatGPT puede abrir el artículo público cuando falta contexto, resolver el intermediario Google News y aportar URL del editor, URL original exacta, fecha UTC y pasaje. La cita debe existir literalmente en ese pasaje; no tiene que aparecer en el titular. Apps Script no descarga artículos ni llama a LLM.
- Se comprueban noticia, hash de contenido, revisiones de catálogo/taxonomía, IDs operativos, referencias de fuentes y evidencia diferenciada para un máximo de tres asignaciones. Se rechazan intermediarios Google News como fuente final, URLs con credenciales/esquemas no web/hosts locales, fechas inválidas o futuras, citas inexistentes, duplicadas o solapadas y estructuras adicionales. Las instrucciones tratan páginas, noticias y resultados como datos no confiables.
- `classified`, `insufficient_evidence` y `out_of_scope` tienen recuentos separados. En modo LLM una abstención válida vigente deja los IDs vacíos; un resultado ausente, corrupto o desactualizado usa el determinista. En modo determinista se conserva siempre `Noticias.taxonomia`. Las citas externas se identifican como evidencia web aportada, con enlace y fecha, en la explicación existente.
- Exportación de pendientes, pendientes más abstenciones o todo el corpus para revisión. Cada artículo incluye `previousResultHash`. Una corrección exige ese hash en `replaces`; una importación idéntica es idempotente, aunque cambie el orden de las propiedades JSON. Un archivo antiguo no puede sobrescribir una corrección posterior. La revisión incluye la selección exportada y detecta cambios durante la descarga.
- Propuestas `nn.xx` separadas de los IDs publicados: bloque existente, nombre, justificación, equivalentes y evidencia. Se rechazan nombres ya presentes en catálogo/modelo y duplicados normalizados. La descarga de propuestas agrupa por bloque y denominación normalizada, conservando las noticias y fuentes. No hay un mecanismo de aprobación de propuestas en el flujo existente: quedan para revisión externa del administrador; no se modifica ni publica automáticamente catálogo/taxonomía. La normalización no acredita equivalencia semántica entre sinónimos.
- Los resultados v1 ya guardados siguen leyéndose y pueden corregirse. Las nuevas importaciones requieren v2: hay que descargar lotes e instrucciones nuevos; no se reinterpretan los ZIP de entrada antiguos como resultados. Se añaden columnas al staging de categorización, sin migrar ni sobrescribir el corpus determinista.
- Se serializa una vez el catálogo común de los lotes; el ZIP reserva el tamaño final y la conversión a bytes firmados reutiliza su array. Continúan los límites de ZIP de entrada de 6 MiB, importación de 2 MiB/250 resultados, 25 noticias por lote y escrituras/verificaciones por bloques. Fuentes: máximo tres pasajes de 6.000 caracteres; resultado: máximo 40.000 caracteres; propuestas: máximo tres por noticia y descarga acotada.

## Jobs y publicación

Se conservan los jobs reales y su barrera común; no se añade un segundo pipeline.

| Cambio | Flujo existente comprobado |
| --- | --- |
| Ingesta | `collectionBatch_` escribe el lote, invalida noticias y `collectionSnapshots_` mantiene el ciclo en Publicando hasta disponer de snapshots. |
| Reclasificación | `newsClassificationBatch_` prepara `Noticias_class_*`; `snapshotJob_` y `validateSnapshotJob_` preceden la publicación. |
| Taxonomía | `taxonomyBatch_` prepara catálogo/modelo y corpus independientes; se validan antes de activar conjuntamente las vistas. |
| Catálogo funcional | `refreshFunctionalCatalog_` solicita reclasificación y snapshots al cambiar el espejo; las revisiones invalidan los resultados LLM que ya no correspondan. |
| Importación/modo LLM | Una hoja de categorización por importación; `llmSnapshotBatch_` construye las tres vistas y solo `DATA_GENERATION` activa el resultado. |
| Mantenimiento | `maintenanceBatch_` prepara su corpus; la misma barrera impide completar antes de publicar. |

Un fallo de verificación mantiene la generación anterior y el job Publicando. Se corrigió un defecto demostrado: si fallaba la programación del trabajador después de persistir `LLM_JOB`, el importador eliminaba la hoja que el job referenciaba. Ahora conserva ese staging y el error; repetir la importación idéntica vuelve a solicitar el trabajador sin duplicar resultados. Los jobs de reclasificación, taxonomía y mantenimiento conservan la categorización LLM independiente y reconstruyen vistas coherentes con la revisión vigente; si cambian sus revisiones se usa fallback.

## Validación y medidas

`npm run verify`: **586 pruebas correctas**, incluidas 30 del flujo LLM. Cobertura de líneas 97,54 %, sentencias 91,95 %, funciones 94,29 % y ramas 86,77 %. Se comprobaron sintaxis, diseño, permisos y distribución generada. La publicación remota se verifica aparte.

El benchmark reproducible `node scripts/benchmark-llm-quality.mjs 8863` compara el servidor versionado 3.8.2 con la implementación local, con 8.863 titulares sintéticos, 250 resultados clasificados, un emulador Sheets y una observación por etapa. Incluye exportación, importación, selección efectiva, reconstrucción y lecturas con/sin caché de Noticias, Novedades y Radar. El informe conserva SHA de referencia, tamaños y lecturas. No mide calidad semántica, latencia de Google ni cuotas; el delta de heap incluye recolección de basura y no representa memoria máxima de Apps Script.

## Bloqueos y límites

- El usuario aportó después `news-radar-results-2.zip`. Contiene 21 archivos ZIP_STORED, 525 resultados únicos v1: **2 clasificados (0,381 %) y 523 abstenciones (99,619 %)**; sin duplicados, asignaciones múltiples ni propuestas. El [informe de reconciliación](iteration-11-real-results.json) registra su SHA-256 y la muestra revisada.
- Se descargó el libro real desde Google Sheets. Apps Script confirmó 8.897 noticias activas en `Noticias_tax_f67f8602-6c15-438e-97ac-aa6f8ddf49b8`, las mismas revisiones de catálogo/modelo del ZIP y modo Determinista. Sus 525 noticias se localizaron sin discrepancias de contenido; ambos IDs operativos existen y las dos citas son literales. Las dos asignaciones coinciden con el determinista. Este asigna otras dos incidencias de sesión que el LLM deja sin categoría; sus titulares no acreditan contexto empresarial. La coincidencia de resultados no es precisión contra un gold standard.
- La muestra incluye ambos positivos, ambas abstenciones con asignación determinista y cuatro abstenciones sin ella; no existe estrato de asignación múltiple en la salida. La integración Banorte/CONTPAQi encaja con el alias publicado de API Channel, pero el titular no explicita la interfaz API: requiere más evidencia para confirmar esa precisión. Qonto describe pagos desde ChatGPT, ya representados por una categoría agéntica publicada. Se mantienen los resultados originales; el análisis no importa masivamente abstenciones ni inventa propuestas.
- `clasp` no tiene sesión y el conector Sheets devolvió 403. El usuario autorizó acceso directo: se utilizó la sesión corporativa existente en el navegador integrado, sin solicitar credenciales. Se respaldaron los siete archivos afectados y el libro, se comprobó la base remota 3.8.2 y se utilizó la pausa recuperable de trabajos. La base remota de `LlmCategorization.gs` aún no incluía la corrección de explicación de la PR #53, que sí contiene esta distribución.
- La validación externa comprueba procedencia declarada y consistencia cita/pasaje. Sin volver a descargar el cuerpo en Apps Script, no demuestra por sí sola que el editor publicase ese pasaje, que la URL sea realmente canónica o que la categoría sea semánticamente correcta. Se conserva todo lo necesario para revisión manual; no se llama «verificada» a esa autenticidad externa.

## Fuentes de la revisión manual

La lectura del [artículo de El Cronista](https://elcronista-el-cronista-prod.web.arc-cdn.net/mexico/finanzas-economia/banorte-y-contpaqi-se-alian-para-que-las-pymes-integren-banca-y-contabilidad-en-tiempo-real/) confirma integración contable y conciliación automatizada; no se ha convertido esa información en una asignación API inventada. La [documentación oficial de Qonto MCP](https://support-fr.qonto.com/hc/en-us/articles/47588576515089-How-do-I-connect-and-use-the-Qonto-MCP-server) aporta contexto de operación empresarial desde asistentes. Son comprobaciones acotadas, no una recategorización completa ni evidencia de precisión estadística.

## Comprobación sobre el libro de producción

La reconstrucción 3.9.0 terminó el 19/10/2026 a las 10:06:35 Europe/Madrid, con los tres snapshots verificados y una única revisión `83d4886e3d53b03ed80a7dbf5900284ac0649c030dcc11302e4c32dafe4dbe4e`. Se conservaron corpus, modo y resultados LLM previos; los digests de contenido coinciden con los anteriores, pues no se recategorizó el corpus durante la validación.

| Lectura en Apps Script, una observación por vista | 3.8.2 | 3.9.0 | Total de contexto |
| --- | ---: | ---: | ---: |
| Novedades | 4.118 ms | 1.997 ms | 18 |
| Noticias | 1.442 ms | 582 ms | 186 |
| Radar | 721 ms | 554 ms | 513 |

Las seis lecturas usaron snapshots; no son medidas de extremo a extremo ni acreditan una mejora general. La exportación v2 de pendientes más abstenciones produjo 525 noticias en la primera descarga, unos 5,98 MB, en 7.817 ms, sin cambiar su progreso. La validación en el servidor de los 525 resultados v1 devolvió 525 válidos y cero errores. No se midió importación masiva en producción ni se convirtieron abstenciones en clasificaciones. [Mediciones y límites](iteration-11-production-validation.json).

El 19/10/2026 a las 10:09:11 Europe/Madrid se confirmó `paused:false` y trabajador pendiente tras reanudar. El archivo temporal se restauró vacío antes de crear la versión de despliegue; no se publica ninguna operación temporal. La reclasificación y el mantenimiento que ya estaban en curso conservan sus cursores.

## Publicación

Apps Script confirmó «La implementación se ha actualizado correctamente», versión **83**, a las **10:11 Europe/Madrid**. Se conservaron ID, URL, ejecución por el mismo usuario y acceso de Bbva.com. Los siete módulos afectados se cotejaron contra la distribución generada; se restauró vacío el archivo operativo reutilizado antes de crear la versión.

La aplicación publicada se abrió en una sesión nueva. Hubo un `NetworkError HTTP 0` inicial en el navegador integrado; una recarga recuperó Novedades y Noticias con contenido real. Se registra como error transitorio observado, no se acredita disponibilidad continua ni se oculta el reintento.

Para el siguiente procesamiento manual, descargar lotes e instrucciones v2 desde Categorización LLM. El ZIP v1 aportado se conserva como evidencia: además del cambio de contrato, sus 21 archivos y 525 resultados exceden los límites de una importación única (20 archivos/250 resultados). El análisis y la validación no lo importaron ni alteraron el modo Determinista.

También se verificaron Radar con 513 publicaciones y el mapa de calor, y Categorización LLM con los nuevos controles de exportación/revisión y el progreso real (1 resultado previo válido, 8.896 pendientes; modo Determinista). El panel de recuperación muestra dos errores de fuentes con última actividad a las 06:43, anteriores a esta validación; no se presentan como errores nuevos del contrato LLM ni se declaran resueltos.
