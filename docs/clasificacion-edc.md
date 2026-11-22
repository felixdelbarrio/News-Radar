# Contrato de clasificación funcional

News Radar utiliza `EDCCatalogClassifier.matchFunctionalEvidence` con el catálogo efectivo de la aplicación. El manifiesto fija la identidad y versión de la biblioteca. La dependencia de desarrollo fija el código que usan las pruebas locales.

| Componente | Responsabilidad | Consumidores y comprobación |
| --- | --- | --- |
| EDC | Normalización, evidencia, ranking y fallback funcional | `src/shared/taxonomy.js` y las pruebas de evidencia ejercitan la biblioteca fijada |
| `FunctionalCatalog.gs` y `CatalogoFuncional` | Resolver códigos oficiales, espejo y reglas locales | Configuración, construcción del modelo y controles de integridad |
| `Rules.gs` y `Configuracion.relevanceRules` | Admisión editorial BEI por capacidad, contexto y exclusiones | Ingesta, candidatos y Configuración de negocio |
| `Classification.gs` y `TaxonomyJobs.gs` | Persistir estado, canal y asignación, revisar checkpoints | Jobs de clasificación, taxonomía y reclasificación |
| `Taxonomia` y `TaxonomiaTraducciones` | Rutas y traducciones de las categorías publicadas | Filtros, tarjetas, Radar, estadísticas, exportaciones y newsletters |
| `Generations.gs`, `DashboardSnapshots.gs` y `DashboardCache.gs` | Preparar y publicar una revisión conjunta de las vistas | Noticias, Novedades, Radar y recuperación |
| `Background.gs`, `Progress.gs` y `ControlPanel.gs` | Programar lotes, avances y reintentos | Supervisor y Administración |
| `LlmCategorization.gs` y `Traducciones` | Resultados LLM y traducciones de noticias en flujos propios | Vistas y ediciones históricas |

`clasificacion.digital` indica que la respuesta EDC contiene al menos un ID de una función oficial del catálogo activo. Se excluyen las categorías generales, `Otros` y los IDs desconocidos. Un error del motor conserva el cursor y se reintenta. `estado` determina la relevancia BEI, y `canal` determina la etiqueta de canal. Noticias, Radar y newsletters mantienen la elegibilidad por relevancia y capacidad empresarial. La lectura de las vistas utiliza decisiones persistidas.

Los jobs de clasificación y taxonomía incorporan una revisión derivada del algoritmo, el léxico efectivo y las reglas de la aplicación. La versión de clasificación identifica la semántica de `digital`. El reproceso exclusivamente geográfico tiene su propia revisión.

## Relevancia multilingüe

En Configuración de negocio, cada criterio editable tiene una dimensión, idioma, términos y estado de activación. Las reglas generales se evalúan siempre. Una regla de idioma se añade al criterio general al identificar el idioma del artículo o de su RSS. Las dimensiones de exclusión incluyen información corporativa, consumo particular, guías editoriales y menciones incidentales. El guardado usa permisos administrativos, revisión optimista y telemetría de cambios. Estas reglas pertenecen a News Radar y se aplican en su ingesta y reclasificación.

## Reclasificación histórica

Con el despliegue y el Sheet verificados, registrar generación activa, puntero de reversión y jobs. Crear y verificar una copia recuperable antes de iniciar el trabajo. `startDigitalBackfill` prepara una copia de la generación de noticias y usa el catálogo publicado. Reutiliza el trabajador, las validaciones y la publicación conjunta de snapshots. Cada lote verifica las dos columnas procesadas antes de avanzar. Un cambio del origen o de la revisión invalida el trabajo preparado. Al publicar se conserva la generación anterior para reversión.

La comprobación posterior debe conciliar el conjunto de IDs activos, la revisión funcional, los resultados `digital=true` y `digital=false`, y los errores o pendientes. La cifra visible depende también de relevancia, periodo, filtros, deduplicación, geografía y paginación. Las cifras de una exportación no identifican por sí mismas la generación que usa la aplicación.

## Verificación local

Ejecutar `make build check-dist verify preview`. `tests/edc-digital-contract.test.mjs` cubre validez de IDs, separación de relevancia, revisión del léxico, fallos del motor, publicación y sintaxis del HTML compilado. El arranque se inyecta en el bloque de datos JSON del HTML y el cliente lo lee al inicializarse.
