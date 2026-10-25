# Iteraciones 25 y 26 · 3.26.0

## Hechos y alcance

Trabajo local en `codex/iteration-25-26`, creada desde el `develop` disponible con los cambios locales de I25. La distribución se genera desde `src/` y `assets/`. No se utiliza `dist.txt` como fuente de verdad ni se modifica deliberadamente su estado previo. Las cifras de producción del documento I26 son evidencia aportada, no mediciones realizadas en esta ejecución. No se ha accedido ni modificado producción, Drive o GitHub.

## Matriz de incidencias

| Prioridad | Incidencia y evidencia en código | Cambio | Verificación |
| --- | --- | --- | --- |
| P0 | El checkpoint de archivo conservaba un digest pero el reintento recalculaba el tamaño del lote sobre el origen actualizado | `Archives.gs`: recuperar el prefijo congelado, verificar archivo existente o completar escritura parcial; distinguir retirada confirmada y conflicto | Inyección antes/después de escritura, verificación, retirada y limpieza de checkpoint; nuevas filas entre intentos; conflicto conserva datos |
| P0 | Un conflicto de archivo detenía el recorrido de todas las tablas | `Maintenance.gs`: continuar tablas independientes y conservar diagnóstico del conflicto | Tabla Telemetria bloqueada con Cobertura y NewsletterEventos procesables |
| P0 | Publicación sin caducidad de progreso | `SnapshotJobs.gs`, `Background.gs`, `DashboardSnapshots.gs`: reintento tras diez minutos, conservar cursores/tablas y último manifiesto; normalizar pausas inválidas | Recuperación vencida, progreso reciente y supervisor sin lecturas de Sheets cuando está inactivo |
| P0 | La purga no protegía un manifiesto previo ni staging de compactación | `Generations.gs`: conservar referencias de rollback y trabajo de newsletters | Conservación de generación publicada, anterior y pendientes |
| P1 | Huecos de contenido histórico con offsets físicos | `Archives.gs`: preparar pareja contenido/ediciones, comprobar archivos históricos y escrituras, publicar offsets mediante un único manifiesto | Orden idéntico de artículos activos, archivo histórico recuperable, doble ejecución, corte en staging y después de conmutar |
| P1 | Descripción RSS formada únicamente por titular y medio | `Rules.gs`: limpieza determinista, preferencia de descripción útil y fallback a content:encoded, límite de 1500 caracteres | No fabricar extractos; fallback y truncamiento |
| P1 | Vacíos históricos sin recuperación acotada | `Maintenance.gs`: recuperación opcional desde RSS, dos solicitudes por lote, hasta cincuenta registros, cursor durable, procedencia y telemetría; no sobrescribir extractos ni clasificaciones; excluir asignaciones LLM verificadas | Prueba con vacíos, extracto existente y LLM protegido |
| P1 | El catálogo era solo fallback de capacidades | `Rules.gs`, `TaxonomyJobs.gs`: usar el ranking compartido con evidencia literal específica y contexto/segmento/novedad; conservar exclusiones; reutilizar etiquetas de ingesta | Regresiones empresariales, retail, laborales, evidencia funcional y muestra golden |
| P1 | Mercado sustituto de Google tomado como país de noticia | `Rules.gs`: comparar mercado real de la consulta con país objetivo, invalidar fallback de búsqueda sustituta; conservar evidencia explícita y fuentes nacionales | Uruguay sin evidencia queda sin determinar; Uruguay explícito se conserva; caso genérico México/US |
| P1 | Deduplicación editorial podía ignorar países explícitos | `Deduplication.gs`: identidad editorial incorpora países presentes en el titular; limpieza común del sufijo del medio | Anuncios distintos en España/México y regresiones de sindicación |
| P1 | El recorte de Cobertura descartaba datos sin archivo | `Candidates.gs`: eliminar tope destructivo de 20000, usar retención y archivo comunes | 20001 registros conservados hasta archivo verificado |
| P1 | Reinicio de archivo por cada registro sobre el mínimo configurado | `Store.gs`, `Archives.gs`: activar por lote completo sobre el objetivo; antigüedad puede archivar lotes menores | Una fila posterior no reactiva ni crea archivo; se conserva configuración administrativa |
| P2 | Adopción sin archivo por edad/cantidad | `Store.gs`, `Archives.gs`: política propia eventLimit/retentionDays, archivo verificado; no aplicar logRows a analítica | Serie reciente permanece; eventos antiguos recuperables desde archivo |
| P2 | Vocabulario turco transversal | Defaults y `Configuration.gs`: retirar solo términos preservados en perfil turco y ausentes de otros idiomas durante actualización de catálogo, con telemetría | Defaults conservan perfil localizado; configuración no cambia retención administrativa |
| P2 | Banco RSS de Google identificado como editor directo | `Feeds.gs`: procedencia de Google para perfiles y feeds RSS alojados en Google; conservar publisher de source | Regresiones de ingesta/procedencia |
| P2 | Dimensiones visuales dispersas y bloques móviles repetidos | Tokens y estilos: trasladar dimensiones existentes a tokens; consolidar responsive.css; envolver controles/textos | Chrome, cinco vistas, filtros, 320/375/768/1440, sin overflow de documento |

Las identidades de titular y editorial utilizan WeakMap con invalidación al cambiar titular, editor, fecha, entidad o configuración. El índice geográfico se compila una vez y se evalúa únicamente ante candidatos a duplicado, evitando el escaneo por cada artículo.

La división temporal de consultas saturadas, las lecturas por rangos y el cache de registros anotados ya existían. No se duplican. Cobertura distingue ahora éxito parcial de éxito completo.

## Conservación y operación

- El archivo de logs nunca borra el checkpoint ante un conflicto ni crea un segundo archivo para sustituirlo. Un archivo previamente verificado que diverge no se sobrescribe; solo puede completarse una escritura parcial que concuerde con el prefijo esperado. Los checkpoints antiguos incompletos sin tamaño recuperable permanecen bloqueados si no se puede demostrar su prefijo. El mensaje identifica tabla y archivo para revisión administrativa.
- Cada edición archivada se lee y verifica con su digest antes de compactarla. Las hojas fuente permanecen disponibles; la pareja de staging solo se hace visible tras terminar todas las ediciones. El manifiesto previo se conserva en `DATA_GENERATION_ROLLBACK`.
- La limpieza física de noticias conserva todos los IDs referenciados por resultados LLM, incluidos los insuficientes. Los snapshots históricos de newsletters permanecen intactos.
- `getCorpusQualityAudit()` es una lectura administrativa: inventario de corpus publicado y candidato, estados, vacíos, duplicados, fechas, referencias LLM ausentes, digest de IDs/URLs y muestra determinista por país, entidad, fuente, mes, idioma y estado. No sustituye la revisión humana de esa muestra.
- `startExcerptRecovery()` solicita explícitamente la recuperación RSS dentro del mantenimiento. No se activa al desplegar. RSS antiguos pueden no contener ya artículos históricos: se registra el motivo, sin scraping ni texto inventado. La lectura del catálogo y el mantenimiento pueden seguir operando independientemente.
- `logRows` mantiene su valor administrativo. La activación por volumen admite un margen inferior a un lote de cien registros sobre ese objetivo; la antigüedad sigue utilizando logDays. Adopción utiliza exclusivamente su horizonte analítico configurado. No se impone 500 sin datos que lo justifiquen.

## Validación y métricas

Comparación local contra `2d306c59c816eff14178737186c9cf4920c6c561`, con 50000 registros, cuatro muestras por versión y orden alternado. Medianas de milisegundos; el número de lecturas es el observado en el adaptador de Sheets.

| Escenario | Antes (ms) | Después (ms) | Lecturas antes/después |
| --- | ---: | ---: | ---: |
| Radar frío | 170,75 | 147,00 | 3 / 3 |
| Novedades fría | 88,00 | 65,15 | 0 / 0 |
| Noticias fría | 86,40 | 62,20 | 0 / 0 |
| Página siguiente | 0,90 | 0,90 | 1 / 1 |
| Acierto de caché | 0,20 | 0,20 | 0 / 0 |
| Período antiguo | 12,85 | 11,10 | 1 / 1 |
| Histórico completo | 1616,05 | 1328,90 | 25 / 25 |

La memoria retenida del histórico completo es 7138672 frente a 7265424 bytes: aumenta aproximadamente 127 KB en esta muestra; no se afirma una reducción de RAM. Los escenarios llamados fríos por el script comparten la preparación de registros de la secuencia; no son invocaciones independientes con todo CacheService vacío. Cuatro muestras no permiten concluir significación estadística ni cumplen el muestreo productivo de veinte invocaciones. Son mediciones de V8 con adaptador en memoria, no latencias de Apps Script ni p95 de UX real.

| Calidad en fixture | Antes | Después |
| --- | ---: | ---: |
| Casos evaluables de relevancia | 22 | 22 |
| Verdaderos positivos / negativos | 9 / 13 | 9 / 13 |
| Falsos positivos / negativos | 0 / 0 | 0 / 0 |
| Precisión / sensibilidad | 100 % / 100 % | 100 % / 100 % |
| Errores de segmento | 1 / 16 | 1 / 16 |
| Funcionalidad correcta | 2 / 2 | 2 / 2 |
| Abstenciones en los 26 textos | 5 | 5 |

Esta muestra pequeña y existente no equivale a revisión manual estratificada de producción. Los casos adversariales adicionales se verifican como regresiones, no se incorporan artificialmente al denominador de precisión.

`make build check-dist verify` pasa con 804 pruebas, cero fallos y cobertura de 92,58 % de sentencias, 85,50 % de ramas, 95,18 % de funciones y 98,03 % de líneas. La distribución contiene 68 archivos y supera la comprobación de sintaxis ES2020 y de reproducibilidad. `npm test` también pasa de forma independiente: 804 pruebas y cero fallos. `git diff --check` no detecta errores de formato.

Chrome local: 52 estados (cinco vistas, filtros disponibles y selectores abiertos con etiquetas largas) entre 320×812, 375×812, 768×1024 y 1440×900, con cero desbordamientos horizontales de documento y cero errores de cliente detectados durante el recorrido. Los valores agregados se guardan en `output/iteration-26/validation.json`.

## Pendientes externos y límites

No se ha suministrado el XLSX citado por I26 ni una exportación nueva del manifiesto, propiedades y telemetría. Por tanto quedan pendientes: auditoría humana estratificada de los dos corpus reales, tasa real de recuperación sobre los 405/858 vacíos, comparativa de veinte invocaciones por ruta/tipo de caché en Apps Script y verificación de las 45 ediciones reales.

El inventario SHA-256 del paquete local se guarda en `output/iteration-26/dist-manifest.json`. No hay copia de producción ni migración ejecutada que inventariar; no se han creado archivos de Drive. No se ha desplegado, publicado una PR, enviado comentarios ni resuelto hilos. Esas acciones requieren un encargo explícito para operar los servicios externos y, para mantenimiento productivo, completar primero copia verificable y plan de reversión. No se afirma que los problemas productivos estén resueltos por pasar pruebas locales.

El almacenamiento mantiene el formato existente de archivo por lote. Se reduce su reactivación y se recuperan checkpoints, pero no se implanta un contenedor diario compartido: requiere verificar concurrencia e idempotencia sobre el volumen real antes de ampliar ese contrato.
