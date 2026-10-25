# Iteración 23 · 3.22.0

## Alcance y diagnóstico

Implementación local a partir del documento de requisitos facilitado el 25 de octubre de 2026. Sus cifras sobre Telemetria, Recargas, Auditoria, Noticias y Candidatos se consideran evidencia aportada: los CSV no estaban adjuntos y no se presentan como mediciones reproducidas. Las instrucciones del documento sobre publicación productiva y Git se distinguen del análisis y la implementación solicitados en el chat.

## Cambios

- APAC, EMEA y AMER comparten una correspondencia canónica con los 34 países actuales. La selección regional excluye los países con pestaña propia en el ámbito vigente. Se reutiliza en filtros del servidor, pestañas, CSV, snapshots y newsletters. El esquema del ámbito sigue siendo `name` y `countries`, sin representación duplicada por región.
- Novedades y Noticias ofrecen las tres regiones al entrar en Otras geografías. La preferencia del navegador selecciona EMEA para España y AMER para México o Estados Unidos; si no se reconoce el país, se elige la primera región con contenido. Los registros sin país se conservan en la agrupación general y no reciben una región inventada.
- El editor de ámbito presenta tres bloques regionales y conserva las casillas de países con pestaña propia. Emplea los componentes y tokens existentes.
- Los snapshots comparten artículos y traducciones entre páginas nacionales, generales y regionales. Cada página almacena `positions` y su total; no duplica los artículos.
- El panel deja de escribir Telemetria durante consultas. El recuento de activadores se cachea 90 segundos y se invalida al modificar horarios; los estados operativos se siguen consultando en vivo.
- Bankinter usa una consulta RSS de Google News restringida al blog y empresas. Se comprobó una respuesta HTTP 200 con XML RSS durante el desarrollo; esto no garantiza accesibilidad desde las IP de Apps Script. La inicialización del catálogo actualiza también la fuente persistida. Se amplía Accept y se envía Accept-Language, retirando el User-Agent fijo. Los errores permanentes siguen visibles y no se convierten en éxitos ficticios; el planificador existente no reintenta 403/404 como errores temporales.
- Las consultas de capacidades y segmentos internacionales excluyen términos sin idioma registrado y explicaciones entre paréntesis. Las consultas generales mantienen términos personalizados. Se amplía el vocabulario empresarial multilingüe y se incorporan las exclusiones de plantilla, marketing, consumo infantil y financiación bilateral sin canal digital.
- La evidencia de clasificación descuenta cabeceras editoriales y el editor conocido. Los patrones por editor se compilan una vez en el índice de configuración; el índice principal de clasificación ya se reutilizaba entre artículos. Se añaden exclusiones concretas en las siete funciones ambiguas citadas por el documento.
- Al reiniciar taxonomía se elimina la pareja preparada anterior, conservando las hojas publicadas. Se mantiene la comprobación de corpus y revisión de reglas antes de reanudar un trabajo.
- Se actualizan release, catálogo, reglas de clasificación y caché. La distribución se genera desde `src` y los catálogos de `assets`.

## Verificación y límites

Las pruebas de Iteración 23 cubren selección regional, exclusión de países propios, CSV, snapshots sin duplicación, pestañas y SVG, preferencia española, panel sin escrituras, ejemplos negativos de clasificación, consultas en inglés, limpieza de parejas y newsletters regionales. Se ejecutan además los validadores y la batería completa del repositorio.

La auditoría local con Chrome comprueba las diez vistas administrativas a 320, 360, 375, 390, 768, 1280 y 1440 píxeles mediante `scrollWidth <= clientWidth`. La inspección visual del ámbito regional complementa esta comprobación: no basta con ocultar el desbordamiento si las etiquetas quedan ilegibles.

No se ha publicado en Apps Script, inicializado la hoja remota, modificado una implementación productiva, enviado correo, creado una PR ni medido latencias reales de Google. El objetivo de 300 ms necesita verificación posterior en el entorno publicado. La prueba local usa el adaptador autónomo del proyecto, no credenciales ni datos productivos.

## Resultado local final

- `npm test`: 766 pruebas aprobadas, cero fallos.
- `npm run check`: sintaxis, diseño, configuración y permisos verificados.
- `npm run check:dist`: distribución reproducible y actualizada.
- Chrome: 70 combinaciones administrativas de vista y ancho, sin desbordamiento horizontal ni errores de JavaScript.
- Cambio de región en Novedades: sincronización del selector nativo, su control visible y los filtros aplicados sin RPC y conservando las demás opciones.
- `git diff --check`: sin errores. Se conserva la eliminación previa de `dist.txt`.

## Publicación y corrección 3.22.1

La versión 3.22.0 se publicó por el navegador de Codex como implementación 109, en la URL productiva existente, y la inicialización terminó correctamente. La medición en Apps Script dio 44, 30, 28 y 30 ms para el panel, sin nuevas filas `control-panel`; Bankinter devolvió HTTP 200. La primera medición de Noticias aún encontró un snapshot previo a la regeneración y no se considera validación del rendimiento final.

La corrección 3.22.1 evita consumir snapshots de un esquema incompatible antes de acceder a sus variantes cacheadas. Mantiene todo el contexto de países al cambiar entre regiones en Noticias, sincroniza selector y pestañas y renueva la caché de navegación del cliente. Los SVG regionales tienen dimensiones explícitas y heredan el contraste de las pestañas BBVA. Los contadores de Novedades usan los totales regionales del servidor. Las pruebas específicas cubren el cambio EMEA/APAC/AMER y el rechazo temprano del snapshot incompatible.
