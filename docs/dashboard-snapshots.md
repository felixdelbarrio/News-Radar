# Snapshots de lectura · 3.2.3

Las cargas predeterminadas de Novedades, Noticias y Radar leen una vista materializada compartida. Las ventanas siguen el calendario central de newsletters: quincena, trimestre y año; cada vista retrocede exactamente un período si no hay publicaciones elegibles. Radar incorpora ahora también este retroceso. Los filtros personalizados y las ediciones archivadas conservan su cálculo independiente.

El trabajador genera snapshots después de finalizar recopilación, clasificación, traducción, taxonomía, traducción de taxonomía, newsletters y mantenimiento. Las peticiones se agrupan cuando los datos no han cambiado. Diaria y clasificación conservan prioridad; las pausas de clasificación no provocan reintentos de snapshots. El supervisor existente recupera peticiones y detecta el cambio de período, sin añadir activadores periódicos.

La revisión incluye versión de aplicación y caché, configuración, noticias, taxonomía, traducciones y período. Los datos obsoletos se rechazan. Si todavía no existe una generación válida, la consulta normal responde y solicita su preparación. Noticias tiene variantes por pestaña geográfica y los tres idiomas de lectura; Radar comparte sus métricas entre idiomas. Las selecciones predeterminadas con fechas explícitas también pueden reutilizar el snapshot.

`DashboardSnapshots` guarda únicamente las vistas, comprimidas con gzip y base64 y fragmentadas en celdas de hasta 40.000 caracteres. Hay dos espacios fijos por vista, de hasta 64 fragmentos cada uno: el almacenamiento no crece con cada ejecución. El trabajador escribe el espacio inactivo, hace flush y publica el manifiesto al final. La lectura valida generación, orden y SHA-256; los fragmentos ausentes o corruptos fuerzan regeneración. La caché rápida es una capa opcional: perderla no exige recalcular el histórico. No se materializan metadatos personales, permisos ni suscripciones.

El cálculo de noticias, agrupación, taxonomía y traducciones usa las funciones existentes. Se elimina el precalentamiento anterior de cinco minutos y su límite de 2.000 noticias. El consumo se acota a una vista por paso del trabajador, evitando recalcular las tres por cada fragmento de traducción o ingesta. La telemetría distingue `snapshot hit/miss`, caché de servidor y caché de navegador, y registra el tiempo y tamaño comprimido de cada generación.

## Validación

Las regresiones comprueban igualdad con el cálculo normal en las tres vistas, persistencia sin caché, pestaña de país, idioma, retroceso de período, fechas explícitas por defecto, aislamiento de filtros, invalidación por revisiones, fragmentos corruptos y generación completa desde el trabajador.

La verificación en Apps Script compara el mismo contenido antes y después de materializarlo, y mide servidor y preparación de noticias. La comprobación del navegador utiliza la URL de producción existente y su telemetría; los tiempos de red de Apps Script se separan del cálculo. Las cifras finales se incorporan tras publicar y medir.
