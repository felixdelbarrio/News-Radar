# Iteración 22 · 3.21.0

La navegación conserva respuestas por selección canónica y revisión de noticias/configuración, en memoria y sessionStorage. Al volver a una selección, entrega el resultado guardado y revalida en segundo plano a partir de 60 segundos. El precalentamiento de las otras vistas comienza en idle y comparte las peticiones en vuelo con la navegación. Las ediciones históricas conservan su autorización y no entran en esta caché.

Los snapshots incluyen metadatos, catálogos y años. Un lote construye las vistas pendientes mientras dispone del presupuesto de dos slices, reutiliza registros de períodos idénticos y precalienta las variantes antes de comprimir. El manifiesto sigue publicándose únicamente después de verificar las tres vistas. Las pruebas simulan agotamiento del presupuesto, fallos de escritura, fragmentos corruptos y pérdida de respuesta después de publicar.

El panel usa una caché de 15 segundos ligada al estado operativo. La consulta de newsletter usa un resumen persistido, actualizado por entregas y cambios de suscripciones. La consulta de programación comparte su inventario de triggers. La telemetría del panel se escribe cuando cambia el estado o la lectura supera un segundo. El sondeo se pausa con la página oculta y usa intervalos de 30 segundos con trabajo pendiente y 120 segundos en reposo.

Las propiedades se memoizan dentro de los puntos de entrada de dashboard, panel y worker, con escrituras coherentes. Los límites entre lotes y las comprobaciones cooperativas de pausa refrescan el estado para detectar escritores concurrentes. Se mantiene el presupuesto del worker de 45 segundos, más conservador que el máximo solicitado de 240 segundos.

Se retiran el subsistema de enriquecimiento, su distribución y pruebas exclusivas, las ramas especiales de recuperación anual y la migración puntual de vocabulario. Los términos pasan a los valores predeterminados. El catálogo funcional del servidor se genera en un único módulo; la fuente compartida sigue disponible para el cliente y las herramientas de construcción. Logos y diccionarios ya estaban incluidos en el cliente inicial y no se enviaban en cada RPC.

La inicialización retira la hoja y las propiedades del subsistema desactivado. La purga de generaciones no exige backup previo y protege la generación publicada y las fuentes/destinos de trabajos activos. Se ejecuta tras publicar y durante mantenimiento. Recopilacion conserva el último ciclo diario terminado y los ciclos activos; Recargas y Ejecuciones conservan los agregados. Candidatos conserva hasta 3.000 filas y 30 días, con un índice de IDs en caché por revisión y cardinalidad.

append_ descarta filas vacías y realiza reserva/escritura bajo bloqueo, conservando un bloqueo externo ya adquirido. La clasificación ya guardaba contentHash; ahora el campo forma parte explícita del contrato de newsLabels_. Los dos bloques 13 conservan identidades distintas por nombre completo e IDs funcionales únicos.

El panel incorpora recopilación manual en cada una de las tres franjas, generación de snapshots, mantenimiento manual y un monitor independiente de archivado con estado, progreso, última ejecución, acción y espera. El archivado reintenta automáticamente con backoff acotado a seis horas y conserva la verificación del archivo antes de retirar datos. Logs sitúa la exportación junto a los filtros aplicados y reutiliza los iconos y estilos de lectura. Se refuerzan las reglas de ancho y ajuste de cadenas en administración y newsletter.

La eliminación de datos productivos requiere confirmación específica al ejecutar la limpieza. Los tiempos locales y los dobles de Apps Script verifican comportamiento e I/O, no permiten afirmar los objetivos de latencia productiva. Las mediciones sobre la publicación se registrarán al completar la sincronización y la promoción.

Validación local: 757 pruebas aprobadas; cobertura de líneas 98,06 %, sentencias 92,48 %, funciones 95 % y ramas 85,24 %. Comprobación de sintaxis, diseño y permisos completada. Las diez vistas administrativas se comprobaron en navegador a 320, 390, 768 y 1.280 píxeles sin desbordamiento global.

Línea base observada en la publicación 107 (3.20.0): nueve consultas de panel de 1.928–4.176 ms de servidor (mediana 3.250 ms). Una navegación de Novedades registró 6.029 ms de RPC, 2.289 ms de servidor, 220 ms de noticias y 49 ms de render. Es una muestra de sesión, no un ensayo controlado ni una promesa sobre la latencia de la siguiente publicación.
