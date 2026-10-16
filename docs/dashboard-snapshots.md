# Snapshots de lectura · 3.2.3

Las cargas predeterminadas de Novedades, Noticias y Radar leen una vista materializada compartida. Las ventanas siguen el calendario central de newsletters: quincena, trimestre y año; cada vista retrocede exactamente un período si no hay publicaciones elegibles. Radar incorpora ahora también este retroceso. Los filtros personalizados y las ediciones archivadas conservan su cálculo independiente.

El trabajador genera snapshots después de finalizar recopilación, clasificación, traducción, taxonomía, traducción de taxonomía, newsletters y mantenimiento. Las peticiones se agrupan cuando los datos no han cambiado. Diaria y clasificación conservan prioridad; las pausas de clasificación no provocan reintentos de snapshots. El supervisor existente recupera peticiones y detecta el cambio de período, sin añadir activadores periódicos.

La revisión incluye versión de aplicación y caché, configuración, noticias, taxonomía, traducciones y período. Los datos obsoletos se rechazan. Si todavía no existe una generación válida, la consulta normal responde y solicita su preparación. Noticias tiene variantes por pestaña geográfica y los tres idiomas de lectura; Radar comparte sus métricas entre idiomas. Las selecciones predeterminadas con fechas explícitas también pueden reutilizar el snapshot.

`DashboardSnapshots` guarda únicamente las vistas, comprimidas con gzip y base64 y fragmentadas en celdas de hasta 40.000 caracteres. Hay dos espacios fijos por vista, de hasta 64 fragmentos cada uno: el almacenamiento no crece con cada ejecución. El trabajador escribe el espacio inactivo, hace flush y publica el manifiesto al final. La lectura valida generación, orden y SHA-256; los fragmentos ausentes o corruptos fuerzan regeneración. La caché rápida es una capa opcional: perderla no exige recalcular el histórico. No se materializan metadatos personales, permisos ni suscripciones.

El cálculo de noticias, agrupación, taxonomía y traducciones usa las funciones existentes. Se elimina el precalentamiento anterior de cinco minutos y su límite de 2.000 noticias. El consumo se acota a una vista por paso del trabajador, evitando recalcular las tres por cada fragmento de traducción o ingesta. La telemetría distingue `snapshot hit/miss`, caché de servidor y caché de navegador, y registra el tiempo y tamaño comprimido de cada generación.

## Validación

Las regresiones comprueban igualdad con el cálculo normal en las tres vistas, persistencia sin caché, pestaña de país, idioma, retroceso de período, fechas explícitas por defecto, aislamiento de filtros, invalidación por revisiones, fragmentos corruptos y generación completa desde el trabajador.

La verificación en Apps Script compara el mismo contenido antes y después de materializarlo, y mide servidor y preparación de noticias. La comprobación del navegador utiliza la URL de producción existente y su telemetría; los tiempos de red de Apps Script se separan del cálculo. Las cifras finales se incorporan tras publicar y medir.

## Resultado real en Apps Script

Publicación existente actualizada a la versión 71, aplicación 3.2.3. Se retiró `RecoveryReview.gs` antes de crear la versión. Se conserva URL, ejecución por propietario y acceso del dominio.

| Vista | Servidor sin snapshot | Primera lectura persistente | Reducción | Siguientes lecturas |
| --- | ---: | ---: | ---: | ---: |
| Novedades | 6.783 ms | 536 ms | 92,1 % | 106–109 ms |
| Noticias | 2.868 ms | 867 ms | 69,8 % | 95–101 ms |
| Radar | 2.686 ms | 403 ms | 85,0 % | 99–106 ms |

Nueve comprobaciones de igualdad correctas, con tres lecturas por vista y sin variar el corpus: 163 noticias elegibles en el período de Novedades (24 señales), 168 en Noticias y 366 en Radar. Estos tiempos pertenecen al servidor; el transporte RPC de Google y el renderizado se verifican por separado en el navegador. No equivalen a una medición aislada de CPU o RAM de Apps Script.

Validación local: 482 pruebas correctas, cero fallos; distribución reproducible y comprobaciones de sintaxis, diseño y permisos. El simulador de blobs exige MIME, igual que el descompresor de Apps Script.

La telemetría histórica disponible incluye 6.837 registros de distintas versiones. Entre cargas de lectura sin acierto de caché del navegador, las medianas históricas son 7.408 ms en Novedades (295 muestras), 6.255 ms en Noticias (311) y 5.987 ms en Radar (161); sus p95 son 15.556, 13.813 y 46.420 ms. Sirve como contexto, no como comparación controlada: mezcla versiones, filtros y tamaños de contenido. La comparación de la tabla sí usa idéntico contenido y versión.
