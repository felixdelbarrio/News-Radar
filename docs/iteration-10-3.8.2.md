# Iteración 10 · 3.8.2

Publicado en Apps Script como **versión 82**, el **19/10/2026 a las 05:03 Europe/Madrid**, conservando la implementación, URL, ejecución por el propietario y acceso del dominio.

Administración incorpora Categorización LLM: URL persistente, instrucciones copiables, ZIPs autónomos de pendientes, importación estricta JSON/ZIP_STORED y selector Determinista / LLM con fallback. Sin llamadas a LLM ni automatización de ChatGPT. Los resultados se guardan en generaciones separadas; se conservan `Noticias.taxonomia`, el clasificador determinista y el catálogo maestro.

Cambios principales:

- `LlmCategorization.gs` y `llm-offline.js`: contrato, límites, evidencia literal individual, hashes/revisiones, idempotencia y selección efectiva compartida.
- `DashboardSnapshots.gs`, `SnapshotJobs.gs`, `DashboardCache.gs`, `News.gs`, `Rules.gs`: publicación conjunta y cachés por revisión. El job LLM mantiene prioridad aunque otra publicación retire la señal global.
- `LlmCategorizationView.html`, cliente, navegación y traducciones: pestaña administrativa, progreso y selector sincronizado. Guardar se bloquea durante Publicando.
- `Config.gs`, pruebas y distribución regenerada. Se verificó la coincidencia del código remoto afectado con la base antes de editar; las copias están en `tmp/iteration10-remote-backup/`. El código operativo temporal se retiró antes de versionar.

`npm run verify`: **572 pruebas correctas**. Cobertura: líneas 97,51 %, sentencias 91,96 %, funciones 94,34 %, ramas 86,56 %. `check:dist` confirma distribución reproducible.

Validación real: exportación completa de **8.886 pendientes**, sin marcarlas procesadas. Una importación manual controlada sin evidencia funcional suficiente (IDs vacíos) terminó Completada tras verificar los tres snapshots; repetirla importó cero resultados y reconoció un duplicado. Se ejecutó mediante las APIs administrativas desde el editor: el selector de archivos del navegador automatizado no entregó su evento. No fue una clasificación masiva mediante GPT.

Se comprobaron ambos modos. Estado final observado: **Determinista**, etiqueta y valor coincidentes, job **Completada**, **1 válida / 8.888 pendientes / 8.889 noticias**. La recopilación añadió tres noticias durante las pruebas. Noticias, Novedades y Radar cargan en la aplicación publicada. Se verificó también la etiqueta de versión 3.8.2 en una sesión nueva.

| Snapshots, una observación por vista | Referencia 3.7.2 | Final 3.8.2 |
| --- | ---: | ---: |
| Novedades | 4.905 ms | 4.959 ms |
| Noticias | 9.183 ms | 6.848 ms |
| Radar | 6.164 ms | 3.902 ms |

Telemetría confirmó los tres snapshots finales a las 05:04–05:05. Son muestras únicas con corpus y actividad concurrente distintos; no acreditan una mejora general. Dieciséis llamadas de exportación medidas consumieron 2.703–4.657 ms de servidor por ZIP (mediana 3.699,5 ms).

El benchmark reproducible (`scripts/benchmark-llm.mjs`, `docs/iteration-10-local-benchmark.json`) usa 8.863 filas sintéticas y un emulador Sheets. Sus cifras de RAM y lecturas/escrituras son aproximaciones locales; no representan memoria ni cuotas reales de Apps Script.

## Revisión de la PR #53

Correcciones posteriores a la publicación descrita arriba:

- El benchmark fija la referencia `b915ebc5bb4cafd449017ccbbfbece74f5e0a1a9` (3.7.2), comprueba su versión y registra SHA y versión en el informe. Se puede indicar otra referencia 3.7.2 como tercer argumento; una referencia de otra versión falla explícitamente.
- El resolver LLM expone la cita principal mediante `terms`, `method` y `location`, compatibles con la explicación visible de Novedades. Conserva todas las asignaciones y localiza cada cita en titular o texto; los resultados sin evidencia no generan explicación.
- Las regresiones comprueban el benchmark ejecutable y la explicación renderizada, incluida evidencia en extractos y resultados vacíos. Una ejecución adicional con 8.863 noticias sintéticas completa las 14 mediciones y termina con 250 resultados válidos y 8.613 pendientes.

`npm run verify`: 575 pruebas correctas; cobertura de líneas 97,51 %, sentencias 91,97 %, funciones 94,40 % y ramas 86,63 %. `npm run check:dist` y `git diff --check` correctos.

Estos cambios de revisión se entregan en la PR; no constituyen otra publicación en Apps Script.
