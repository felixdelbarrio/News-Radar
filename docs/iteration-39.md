# Iteración 39 — 3.34.0

Base: `origin/develop` / `389c89786ef9052b23cbfd2337f7d4fbea2fd8e4`. Rama: `codex/iteration-39-source-quality`. Los conflictos locales correspondían a volver a aplicar la versión 3.32.3 sobre 3.33.0: la corrección funcional de borrado de fechas ya estaba incorporada en #101. Se conservan clasificación editorial, mantenimiento selectivo reversible, logos junto a Medio y regresiones internacionales de newsletter. No se cambia la taxonomía ni se crean newsletters.

## Evidencia previa y alcance

Acceso de edición verificado en el navegador integrado con la cuenta corporativa el 1 de noviembre de 2026, después de renovar la sesión. No clasp. Snapshot previo local: `output/iteration39/sheet-before.xlsx`, SHA-256 `188c5013b58efc5cf1bfc1ca2b126c5e81fb8733b48ad5767637aa36001846e9`. El Excel de auditoría es una lista de candidatos y controles, no una configuración importable. El código remoto consultado todavía identifica la aplicación como 3.32.2; no se declara publicada 3.33.0.

Baseline `make verify`: 967/967 pruebas, cobertura de sentencias 92.38%, ramas 85.48%, líneas 98.05%; Node 24.1.0. Registro privado: `output/iteration39/baseline-verify.log`.

## Fuentes y configuración

La configuración persistida contiene 50 geografías habilitadas y 166 perfiles activos. Carecen de perfil: NG, PA, BO, PY, BD, PK, CY, SA, PL, IE, AD, LU, FJ, NZ, HU y AZ. Solo para ellas se genera una búsqueda BEI geográfica, con país, segmento empresarial y capacidades digitales en tres grupos obligatorios. Se reutilizan términos ya configurados, sus idiomas y los filtros de relevancia. No se añaden 50 búsquedas ni una segunda variante de capacidades al fallback. Los perfiles existentes y los presupuestos de lote, UrlFetch y tiempo se conservan. La desactivación explícita de fuentes también desactiva estos fallbacks; no reaparecen fuentes activas al guardar una selección vacía.

PA, BO y PY tienen `en` persistido y pasan a `es-419`; AD tiene `en` y pasa a `es`, como idioma de búsqueda, sin afirmar que sea el idioma oficial. Se modifican únicamente esos cuatro campos; `searchLanguages` conserva códigos de dos letras. La regla existente `zh-TW`, cuyo país TW no forma parte de las 50 geografías, se corrige individualmente a ámbito regional APAC. No se verifica masivamente CatalogoMedios ni se atribuye país de noticia por país del editor. No se ejecuta initializeConfiguration para migrar.

Validación técnica desde Apps Script: los siete RSS existentes y los tres canales candidatos Finextra wholesale/transaction/security responden HTTP 200 y pasan `parseFeed_` RSS 2.0, con tamaños de 911–71,922 bytes. El catálogo [oficial de Finextra](https://www.finextra.com/featurearticle/2406/our-rss-feeds) ofrece los tres endpoints para lectura RSS; esto no se interpreta como licencia para reproducir artículos completos. Wholesale y Security incluyen fechas futuras y ejemplos corporativos ajenos al canal; Transaction también requiere separar financiación y consumo de capacidad BEI. La comprobación técnica no es verificación editorial. No se activan estos tres candidatos por estar en el Excel o devolver HTTP 200. Se mantienen las siete fuentes existentes, con sus filtros y sin copiar artículos completos. Los feeds regulatorios y macroeconómicos candidatos no se activan. No se amplía el parser a Atom.

## Geografía y Noticias

La edición técnica US de una búsqueda propia de Uruguay no contradice el país Uruguay del RSS cuando su consulta contiene Uruguay. Titular y contenido conservan precedencia. Una mención explícita de destino Asia o Taiwán se representa como APAC cuando no hay país asiático configurado que pueda asignarse; no se inventa un país. Los controles incluyen ES/MX/AR/PE/CO, Santander Uruguay, HSBC México con destino Asia y Taiwán.

Noticias oculta el selector adicional country y no muestra su chip. Las entradas antiguas con country se normalizan a newsGeography; el servidor y el cliente comparten esta conversión. Los filtros temáticos operan sobre el conjunto global y las pestañas conservan recuentos de otras geografías y macroáreas. Se mantienen enlaces desde Radar, Novedades y ediciones, sus fechas y el abandono de edición al borrar un límite. La preferencia del navegador reutiliza browserCountry y una tabla central de zonas horarias; no es geolocalización física.

## Calidad de fuentes

Una única pestaña administrativa, con componentes, permisos, navegación, filtros, tablas y tokens existentes. Ventanas 7/30/90 días, fuentes, búsqueda y paginación compartidas. No añade hojas, jobs, triggers periódicos ni materializaciones.

Se leen como máximo 5,000 filas por tabla (o el límite operativo si es menor) de Auditoria, Recopilacion, Cobertura y Ejecuciones, más tres rangos compactos de las noticias retenidas. Caché de hasta 120 segundos. Se deduplican los resúmenes de fuente idénticos. Disponibilidad = tareas completadas / intentos registrados de las tareas actualizadas en la ventana; errores = intentos sin completar. Los reintentos acumulan intentos de esa tarea y no permiten reconstruir la hora de cada petición ni sus redirecciones. Recuperadas, relevantes, descartadas y motivos proceden de los resúmenes RSS retenidos; no se mezclan ejemplos de exclusión con sus totales. Saturación usa las consultas con cobertura registrada como denominador. Diversidad cuenta medios de las noticias retenidas; local confirmado exige coincidencia con el país de la fuente y evidencia alta/media. Desconocido usa ausencia de país/evidencia desconocida. Ausencia de denominador se muestra como —, no 0%. Retención y truncamiento se explican en la vista.

Benchmark local con las filas exportadas: cinco ejecuciones, 7 rangos por consulta fría, 7,278 filas examinadas; mediana 28.9 ms en frío y 0.43 ms en caché, que no lee rangos adicionales. Son tiempos CPU con Sheets simuladas, no latencias de producción. Las variaciones de heap entre aproximadamente −10 y +21 MB están afectadas por GC y no miden memoria máxima. No justifican un agregador ni se presentan como mejora estadística. La publicación debe incluir una medición real posterior; CPU/RAM del servicio no están instrumentadas.

## Publicación y reversión

Pendiente de CI, CodeQL y revisión del commit final. La excepción autorizada para el check IA HTTP 402 por cuota no se extiende a hallazgos reales ni al resto de checks. Se publicará desde el navegador, verificando lectura de archivos guardados, versión de implementación y aplicación servida. Configuración: parche selectivo comparado contra snapshot, inversa de las celdas modificadas y lectura posterior; no reescritura de las demás claves. Las correcciones editoriales pendientes siguen usando la revisión por ID de #101 y su archivo verificado, sin restaurar casos ausentes ni tocar ediciones congeladas.

Rollback: restaurar la versión anterior de implementación y, si es necesario, únicamente los valores originales de las celdas de configuración o las clasificaciones revisadas, con comparación de su valor actual. No restaurar un workbook completo sobre actividad posterior. La versión remota inicial es 3.32.2; se debe registrar el número real de implementación al publicar.
