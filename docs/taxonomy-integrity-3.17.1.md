# Integridad taxonómica de 3.17.1

## Causas y correcciones

- **Fallback:** guardaba el código de operativa en `terms`, mientras el validador solo aceptaba evidencia literal o descriptiva presente en el artículo. Ahora guarda explícitamente regla, capacidades y señal, y contrasta la inferencia con las etiquetas persistidas. Las asignaciones vigentes, incluidas abstenciones válidas, se reutilizan. La reclasificación usa el texto saneado y las etiquetas recién calculadas.
- **Generaciones:** el catálogo cambiaba antes de terminar las asignaciones; el publicador de snapshots tenía prioridad sobre el etiquetado pendiente. La taxonomía prepara una pareja aislada de noticias y catálogo, comprueba la copia y cada lote escrito, y publica esa pareja junto con los tres snapshots mediante un único `DATA_GENERATION`. Si cambia el corpus de origen o las reglas, descarta la preparación y reinicia. Los consumidores conservan la pareja publicada y los snapshots anteriores durante la preparación.
- **Cola anual:** la actualización de consultas históricas podía reconstruir distintas variantes con la misma consulta principal. Ahora conserva las consultas históricas, también al subdividir un período saturado, y refuerza la idempotencia de altas. El mantenimiento consolida por ciclo y URL, conservando el estado más avanzado y archivando previamente todas las filas originales.
- **Uruguay:** la edición de Google News utiliza US y no delimitaba el país en `q`. Tanto los perfiles como los RSS configurados y las consultas pendientes exigen Uruguay.
- **Idiomas:** la selección admitía términos ingleses tras los locales. Para italiano, alemán, francés, portugués y turco solo se generan términos de la lengua configurada; consultas históricas con términos ingleses conocidos no se ejecutan.
- **Libro operativo:** el mantenimiento explícito crea una copia externa y verifica cada pestaña antes de purgar tareas repetidas, compactar historiales y retirar generaciones no referenciadas. La cola se compacta en bloque y se verifica antes de limpiar la cola sobrante; el backoff de taxonomía no provoca despertares en bucle cuando clasificación espera snapshots. Conserva las parejas activa y pendiente y los artículos congelados de newsletters.
- **Novedades:** aviso de límite en color de advertencia y botón final que abre Noticias con la misma quincena y geografía. «Otras geografías» está disponible como filtro y sigue el agrupado del ámbito configurado.

## Archivos principales

`TaxonomyJobs.gs`, `Classification.gs`, `DashboardSnapshots.gs`, `Generations.gs`, `Background.gs`, `Jobs.gs`, `Recovery.gs`, `Sources.gs`, `Maintenance.gs`, `Selection.gs`; cliente `briefing.js`, `filters.js`, `BriefingView.html`, estilos y traducciones. `dist/` se regenera desde las fuentes.

## Regresiones

`tests/taxonomy-integrity-generation.test.mjs` cubre literales, fallback, inferencias manipuladas, cambio de catálogo, reclasificación incompleta, reanudación, escrituras silenciosamente incompletas, conservación del origen, publicación de las tres vistas, ausencia de recálculo, prioridad del etiquetado, Uruguay, idiomas, archivo verificado y consultas históricas. `novelty-geographies.test.mjs` cubre el acceso final y «Otras geografías». Se actualizan las expectativas antiguas que exigían modificar en sitio una generación ya publicada o reconstruir consultas históricas.

## Auditoría inicial real (23 octubre de 2026)

- Noticias: **858**, todas con el modelo `53f5c373…`; catálogo efectivo `3be9b70c…`. **0/858** superaban la validación estricta por incompatibilidad de generación.
- Asignaciones guardadas: 535 literales, 314 fallback y 9 insuficientes.
- Taxonomía: `En curso`, fase `tag`, cursor 2, 10.000 candidatos ya observados y 2.599 documentos; la comprobación posterior detectó una revisión de reglas distinta, por lo que el motor reinició correctamente el análisis en lugar de reutilizar un checkpoint obsoleto.
- Clasificación y job LLM: completados. El diario ya no estaba en `Publicando` al inspeccionarlo.
- Anual: 849 pendientes; cola de 8.064 filas, 3.911 repeticiones por ciclo/URL y 3.147 filas idénticas.
- Los tres snapshots anteriores conservaban fragmentos y digest válidos; su última publicación conjunta era `2026-10-23T08:01:42.472Z`.

## Verificación y operación final

- Verificación final local: **726/726** pruebas, `npm run verify` correcto, sintaxis y distribución reproducible correctas. Cobertura: líneas 97,78 %, sentencias 92,39 %, funciones 94,62 % y ramas 85,65 %. Vista local generada y pruebas de preview correctas.
- Archivo íntegro previo a la primera purga: https://docs.google.com/spreadsheets/d/1uqiMBCTrGtGj_zqB5S05TiyVZjnMbl7J3znZ-hXe6b4/edit
- Archivo verificado previo a la compactación final: https://docs.google.com/spreadsheets/d/1wO0-A5jAKICF8W47hFRBjhQlf_A9jXPZGrvADEekMYM/edit
- Se consolidaron 3.911 repeticiones (116 antes de detener la purga individual y 3.795 mediante compactación en bloque). Las noticias no se modificaron en el archivado.
- Se prepararon los módulos directamente en el editor y se comprobó su contenido mediante lectura tras recarga. No se utiliza CLASP. Despliegue nuevo todavía pendiente de las validaciones finales.
- Las 858 clasificaciones de negocio están vigentes por esquema, revisión y huella; no se recalculan. La revisión de reglas de taxonomía del job antiguo era distinta y se reinició el análisis de candidatos con checkpoints. Cola final consolidada: 4.153 tareas, cero duplicados; anual con 293 pendientes y un error histórico antes de reanudar. La recuperación del etiquetado aislado está en curso.

## Límites de la comprobación

La eliminación de contaminación geográfica ya almacenada no se deduce de la URL: requiere evidencia del artículo; no se borran noticias por proceder de la edición US. La latencia P95 de producción debe medirse después de la compactación y publicación; los tiempos internos del servidor y los de extremo a extremo no son equivalentes. Una abstención válida puede conservar IDs vacíos; no se inventa una clasificación para forzar cobertura.
