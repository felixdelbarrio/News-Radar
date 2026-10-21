# Iteración 14 · validación en producción

Aplicada directamente en Google Sheets y Apps Script, sin CLASP. WebApp actualizada a la **versión 93**, release **3.14.0**, el 21 de octubre de 2026 a las 17:25 (Europe/Madrid).

[WebApp](https://script.google.com/a/macros/bbva.com/s/AKfycbxpg3fwOGwS3Q5oQcjB1xTWd2J1F1-wfW0R5zM0rkR37Qvq589-8PtRcu2FP-HDEQKG/exec) · [PR #60](https://github.com/felixdelbarrio/News-Radar/pull/60) · [Mediciones detalladas](iteration-14-production-validation.json)

## Cambios y comentarios de revisión

- Geografía centralizada: país explícito del titular, dominio/medio, origen y país almacenado. Entidades y logos resuelven alias canónicos.
- Santander excluye contexto municipal/departamental y menciones sin evidencia bancaria. Las incidencias reales del canal se clasifican aunque no mencionen empresas.
- Deduplicación de 14 días entre medios y países, preservando cifras y negaciones. Los titulares puente unen todos sus componentes en una pasada; RSS mantiene la salida anticipada.
- Clasificación y mantenimiento escriben únicamente celdas modificadas en las hojas canónicas. La ingesta no ordena todo el histórico ni reinicia la clasificación.
- El comentario P1 de taxonomía queda corregido mediante presupuesto temporal, cursor exacto y checkpoint durable verificado en el área reservada de `DashboardSnapshots`. Los huecos se reutilizan y se limpian al terminar. No se crean hojas de staging.
- El comentario P1 de LLM queda corregido mediante versiones dispersas en `CategorizacionLLM.publication`: las lecturas conservan la revisión activa y el constructor de snapshots ve la pendiente. Los tres snapshots y la revisión LLM se publican juntos. El siguiente lote compacta únicamente los cambios publicados.
- Feedback tiene pestaña propia después de Adopción, KPIs globales/filtrados, filtros, paginación, atención de valoraciones y CSV autorizado. Logos ampliados y etiquetas de indisponibilidad verificadas en la publicación.

## Estado comprobado a las 17:21

De 9.034 noticias iniciales quedaron **8.148**, tras eliminar físicamente **886 duplicados** y conservar las referencias de las 38 ediciones históricas. La comprobación final encontró **0 duplicados**, **0 entidades sin normalizar**, **0 discrepancias de país**, **0 asignaciones taxonómicas inválidas**, **0 campos `canonicalId`** y **0 noticias relevantes con ruido geográfico de Santander**. Hay **30 incidencias operativas relevantes**.

Clasificación, taxonomía y mantenimiento quedaron completados y los tres snapshots publicados. Se renombraron las cinco tablas activas y se retiraron las cuatro hojas auxiliares/obsoletas. No quedan hojas de staging ni código de diagnóstico temporal. La pausa manual se retiró.

| Tabla | Filas antes | Filas tras compactación |
| --- | ---: | ---: |
| Auditoria | 145.993 | 5.000 |
| Telemetria | 16.000 | 3.000 |
| Ejecuciones | 3.017 | 1.500 |
| Cobertura | 2.057 | 2.000 |
| Adopcion | 5.373 | 5.000 |
| Traducciones | 6.433 | 6.058 |

`Recopilacion` conserva 7.762 tareas: 2.620 pendientes, 23 errores y las tareas terminadas de esos mismos ciclos. Todos los ciclos retenidos tienen pendientes o errores; borrarlos completos perdería trabajo. Sus dimensiones quedaron ajustadas a los datos. La recuperación histórica preexistente continúa automáticamente y ya incorporó tres noticias más después de esta comprobación.

Tras confirmación expresa del usuario, `newsletterEnabled` y `dailyScheduleStatus_()` son `true`, y existen `scheduledNewsletters_` y `dailyRadar_` para los 23 suscriptores activos.

## Rendimiento real de la publicación

Mediciones de navegación en la WebApp v93, contrastadas con las filas de `Telemetria`. Son cargas con snapshot disponible y sin caché de navegación del cliente; no son un benchmark de arranque en frío.

| Operación | Servidor | RPC | Total navegador |
| --- | ---: | ---: | ---: |
| `getDashboard` · Novedades | 2.745 ms | 7.210 ms | 7.293 ms |
| `getDashboard` · Noticias | 1.396 ms | 6.353 ms | 6.399 ms |
| `getDashboard` · Radar | 4.176 ms | 7.176 ms | 7.325 ms |
| `getAdminFeedback` | 947 ms | — | — |
| `exportNewsletterFeedback` | 776 / 736 / 733 ms | — | — |

Los tres últimos lotes de clasificación registraron 950, 518 y 1.314 ms para 100, 100 y 49 filas, con **0 celdas modificadas**, confirmando que las filas vigentes se saltan. Los lotes de escaneo con checkpoint duraron 6,5–7,6 s incluyendo orquestación y persistencia; se verificó que avanzan desde Noticias hasta Candidatos entre ejecuciones. La estimación de menos de tres segundos para todo el corpus no se alcanza en este entorno.

Un lote RSS controlado consultó una fuente y evaluó 38 noticias, sin errores: 13.202 ms en telemetría y 14.713 ms en la llamada completa. Dos lotes normales de la publicación consultaron 12 fuentes en 16.962 y 17.152 ms; evaluaron 477 y 790 noticias, también sin errores.

El botón CSV de la publicación ejecutó correctamente el endpoint y generó una fila, según `Telemetria`. El navegador integrado no expuso el evento ni el archivo de descarga Blob, por lo que la entrega del archivo nativo no pudo confirmarse desde este navegador. El contenido CSV, BOM UTF-8, filtros y protección de fórmulas sí se verificaron mediante tests.

## Verificación local

**648/648 tests** pasan, incluidos cursores y escrituras interrumpidas, aislamiento LLM durante fallos de publicación, puente léxico y referencias históricas. `npm run check` y `git diff --check` pasan. Los dos comentarios abiertos de la PR #60 quedaron resueltos; no se ha fusionado la PR.
