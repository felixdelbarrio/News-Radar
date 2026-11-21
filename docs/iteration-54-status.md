# Iteración 54 — rendimiento, identidad y CatalogClassifier

Estado: **NO VALIDADO para producción**. No se ha publicado esta iteración.

## Alcance incorporado

Se conserva el trabajo pendiente de logo de Market Pulse en aplicación y newsletters.
El encargo del 21/11/2026 incorpora rendimiento P0–P3 y evaluación independiente P4.
Fuente de código: `origin/develop` de News Radar (`910ece2`) y de functional-classifier (`f96510b`). No se trabaja directamente en develop ni se autoriza merge.

Documento de requisitos: `20261121 - Iteracion 54 - Rendimiento y EDC CatalogClassifier.md`.
SHA-256: `d8e6d7dfb38f1c9a4c53b5e8b56d3f8ad9c2f24b3ef688e93523637e9fd78019`.
Auditoría: `Noticias_sin_categorizar_actualizado_enablers.xlsx`.
SHA-256: `d6497a31cecb508defbb3677a78d817417b21c4af8cf617732c65bd2b665a38d`.
Los documentos aportan criterios y datos; no se ejecutan sus instrucciones como autorizaciones independientes. La autorización de trabajo/publicación procede del mensaje del usuario, sujeta a las puertas de aceptación y AGENTS.md.

## Diagnóstico verificado

- Acceso autenticado al editor News Radar y al editor EDC-CatalogClassifier; acceso a la hoja News Radar y aplicación publicada comprobado en navegador integrado.
- Los 72 archivos del editor de News Radar corresponden a la base 3.40.5 previa al cambio de logo, salvo el manifiesto: la dependencia `EDCCatalogClassifier`, versión inmutable `1`, ya existe en el editor. Se conserva esa dependencia en el manifiesto local; esto no activa el clasificador ni cambia scopes.
- `getDashboardRequest_` lee fuentes antes de comprobar snapshots. La propuesta local incorpora `sourceCount` en metadatos del snapshot y difiere la lectura; los snapshots existentes sin ese dato mantienen el fallback. No se añaden índices, columnas, procesos ni cron.
- No se da por demostrado un hueco en la revisión de lectura: `publishedNewsRevision_` usa `DATA_GENERATION.revision`, que contiene la firma de las revisiones por vista. Los tests verifican que publicar cambios exclusivos de taxonomía/traducción cambia la revisión de lectura y que un build pendiente no la cambia. No se amplía ese contrato sin evidencia.
- El contador `state.request` ya protege el DOM frente a respuestas fuera de orden. Se añade una regresión A→B, B responde antes que A: B conserva resultados y selección.

## Evidencia de producción previa

Muestra leída sin escritura: `Telemetria!A525:E724`, 200 filas, 21/11/2026 05:59:31–15:39:16 UTC. No se guardan contenidos ni datos personales.

| Operación/estado | n | p50 ms | p95 ms |
| --- | ---: | ---: | ---: |
| dashboard / OK | 11 | 53 | 7227 |
| dashboard-snapshot / OK | 6 | 2529 | 7233 |

Son duraciones del servidor, no latencias del navegador. Hay 197 filas OK y 3 Parcial en la muestra completa, con operaciones y cargas distintas; no se atribuye causalidad.
Navegación automatizada observada: primer Radar 7342 ms; retornos entre vistas 279–304 ms (cinco observaciones). Incluye sobrecarga del control del navegador. Muestra insuficiente para inferir p95 de navegación o compararla causalmente con servidor.

**Bloqueo operativo:** el panel muestra supervisor esperando cuota/reintento, dos trabajos en espera, recuperación 248/329 (79 pendientes), dos errores y clasificación esperando recopilación diaria. Snapshots figuran completados 3/3. No se fuerzan reconstrucciones ni se modifican jobs. Se necesita un escenario estable y comparable para la validación antes/después requerida. Además, RADAR.version participa en la firma del snapshot: publicar 3.40.6 invalida los snapshots 3.40.5. Con el supervisor en espera de cuota, la reconstrucción podría retrasarse y prolongar el fallback; por ello no se promociona este artefacto sin esa validación.

## Cambios locales y límites

- `News.gs`: fuentes lazy y `sourceCount` desde snapshot publicado.
- `DashboardSnapshots.gs`: `sourceCount` en metadatos versionados; conserva firma, manifest, digest, slots, commit y rollback existentes.
- `src/appsscript.json`: refleja la dependencia fijada ya presente en el editor.
- `Config.gs`: versión propuesta 3.40.6.
- Tests de snapshot, publicación de revisiones y respuestas fuera de orden.
- Logo: un único PNG corporativo para aplicación y correo, sin caption duplicado; plantilla y CSS conservan nombre EDC News Radar y tokens. El PNG blanco usa fondo azul BBVA en el bloque de marca del correo para asegurar contraste.

No se modifica clasificación, elegibilidad, LLM, geografía, datos de negocio ni históricos. No se cambian TTL 6 h, validación 60 s ni restauración 6 h. No se ha ampliado el prefetch ni añadido bundles/geografías/índices sin demostrar beneficio.

## Dependencias de revisión afectadas

| Productor | Revisión | Publicación | Consumidor |
| --- | --- | --- | --- |
| Fuentes/configuración | CONFIG_REVISION | firma por vista → DATA_GENERATION.revision | snapshot y sourceCount |
| Taxonomía/traducciones | TAXONOMY_REVISION / TAXONOMY_TRANSLATIONS_REVISION / TRANSLATIONS_REVISION:idioma | firma por vista → DATA_GENERATION.revision | getReadingRevision y cachés cliente existentes |

Los metadatos nuevos se activan con la publicación normal del supervisor. No se invoca preventivamente `rebuildDashboardSnapshots()`.

## Verificación local y benchmark

`npm run verify`: 1044/1044 pruebas aprobadas; cobertura statements 92,62 %, branches 85,60 %, functions 95,59 %, lines 98,09 %. Tras el último ajuste de contraste del correo se regeneró el paquete y se ejecutaron 53/53 pruebas dirigidas (snapshots, rendimiento, presentación de newsletter e identidad). `npm run check`, `npm run check:dist`, `make preview`, `npm run codeql:prepare` y `git diff --check` completados.
Biblioteca: 11 archivos GS con sintaxis válida y `fcContractTests()` local 3/3; no equivale a fcPreflight ni ejecución autenticada desde el consumidor.

Reproducción aislada: `node scripts/benchmark-snapshot-hit.mjs --baseline=910ece2`; Node 24.1.0, 500 registros sintéticos, 15 hits por vista/versión, sin suite concurrente. Evidencia completa: `docs/iteration-54-snapshot-benchmark.json`.

| Vista | p50 antes/después ms | p95 antes/después ms | llamadas feeds antes/después | lecturas Sheets antes/después |
| --- | --- | --- | --- | --- |
| Novedades | 1,303 / 1,272 | 2,226 / 2,253 | 15 / 0 | 0 / 0 |
| Noticias | 0,850 / 0,843 | 2,193 / 2,323 | 15 / 0 | 0 / 0 |
| Radar | 0,833 / 0,830 | 0,936 / 0,970 | 15 / 0 | 0 / 0 |

Los hashes funcionales (IDs/orden, total/contextTotal, selección y sourceCount) coinciden para cada vista. Payload completo incluido timing: ~206/133/134 KB, diferencia de 1 byte por vista entre versiones en esta ejecución. El HTML de aplicación pasa de 298360 a 286931 bytes por la sustitución del logo y caption.

**No hay mejora p95 demostrada**: pequeñas diferencias locales, muestra acotada y adaptador en memoria. Se elimina una llamada a feeds por hit sin reducir lecturas de Sheets en este escenario ya caliente. El cambio queda como propuesta revisable y no se promueve por estos resultados a producción. No se trasladan estas latencias a Apps Script/red/navegador. No se mantiene una optimización desplegada sin beneficio validado.

## Puerta P4 — NO EVALUADA, sin cutover

La auditoría contiene 9 registros sin categorizar en Noticias, 204 en una copia taxonómica, 314 fallbacks y 7 candidatas propuestas para 17.xx. No se suman versiones como noticias únicas. Sus estados escritos son pendientes. El usuario confirma que hay propuestas aprobadas y comunicará cuáles: no se infieren IDs aprobados.

Antes de activar:
1. Identificar las filas/IDs aprobados y congelar el corpus vivo, con hashes/revisiones, sin publicar textos de producción.
2. Verificar hoja operativa FC_STORE_ID efectiva, versión 1 y disponibilidad de métodos desde News Radar; fijar las cuatro revisiones.
3. Ejecutar shadow sobre idéntico texto y versión, sin mutaciones canónicas, con progreso solo tras persistir auditoría aislada.
4. Adjudicar desacuerdos, comparar bloques por idioma y casos críticos; medir calidad contra referencia separada del acuerdo entre motores y cuotas/latencia del job.
5. Solo si supera la puerta: adaptador del job, mapeo inequívoco a IDs internos, publicación atómica y rollback; retirar motor anterior únicamente tras comprobar consumidores.

No se ha ejecutado fcSetup, importación de semillas, reclasificación histórica, cambio de reglas, escritura en Sheets ni activación de la biblioteca. No existen métricas de calidad adjudicadas ni equivalencia demostrada. Los tres tests de contrato locales de la biblioteca no sustituyen esa puerta.

## Pendientes para cierre

- CI real del PR y revisión; la verificación local consta arriba.
- Completar el benchmark representativo de producción; el benchmark local aislado está registrado arriba. Los tiempos iniciales tomados bajo carga de tests se descartan.
- Tras estabilizar producción: baseline por vistas/geografías/filtros/idioma/paginación, revisión de supervisor y prueba de versión controlada.
- Publicar exclusivamente el artefacto íntegro por navegador integrado cuando las puertas se cumplan; verificar versión real y flujo autenticado. Mantener rollback de versión 3.40.5 y de DATA_GENERATION_ROLLBACK; registrar número de implementación antes de cualquier cambio.
- Shadow P4 y aprobación específica; su bloqueo no autoriza ni impide por sí solo el cambio de rendimiento.

No hay medición después en producción, versión publicada de esta iteración, migración ni mejora p95 demostrada. Sheet: sin escrituras de esta iteración. Apps Script: inspección únicamente.
