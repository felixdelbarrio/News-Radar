# Recuperación y noticias de Project Finance · 2.4.0

## Recuperación independiente

Ejecuciones añade «Recuperar Project Finance». Consulta la ventana reciente configurada, con su propia cola, bloqueo y barra de progreso. Una petición en cola impide repetirla; una recuperación digital pendiente no bloquea este botón y viceversa. La barra permanece visible antes de la primera recuperación y muestra su estado, consultas atendidas, noticias, pendientes y errores. El progreso aprovecha el sondeo de 30 segundos existente, sin crear un segundo temporizador. Los horarios y la prioridad digital se mantienen. La recuperación anual sigue incluyendo ambos alcances.

## Información y países

Project Finance se clasifica como segmento exclusivo para que noticias de promotores, infraestructura o energía no se mezclen con Empresas e instituciones o Retail. La ampliación incluye refinanciación de proyectos, contratos de compraventa de energía y offtake, concesiones, subastas renovables, licitaciones de infraestructura, deuda de proyectos y contratos EPC. Se utilizan términos específicos; no se incluye cualquier noticia energética por su sector. Los RSS especializados aceptan noticias sin banco identificado, conservando la atribución Sector.

Las pestañas de países existentes muestran Project Finance al seleccionar el segmento. Cuando el titular identifica el país del proyecto se utiliza esa evidencia antes del extracto, que puede mencionar la sede del prestamista. Las búsquedas de bancos admiten proyectos transfronterizos. Sin una ubicación identificable o con varias ubicaciones se conserva Transversal; el país de seguimiento del banco no determina la ubicación del proyecto.

## Imágenes

Se incorporan logotipos PNG locales de The Asset, Asian Banking & Finance, ADB y AIIB obtenidos de sus recursos oficiales. Las variantes conocidas de nombre y mayúsculas comparten identidad. Son imágenes pequeñas, integradas en el build y reutilizadas en noticias y newsletters; no añaden descargas ni consultas por artículo. Los recursos de Renewables Now bloquearon la descarga y pv magazine devolvió un favicon vacío: no se incluye una identidad inventada.

## Telemetría y rendimiento

Se analizó el archivo proporcionado news-radar-telemetria.json, exportado el 13 de octubre de 2026. La muestra con detalle v2.3.0 contiene nueve cargas del dashboard: mediana de 7.032 ms y p95 de 8.738 ms. La última carga de Ejecuciones declara 3.432 ms de servidor, de los cuales 1.901 ms se dedicaron a noticias y 1.416 ms a metadatos. La muestra es pequeña y mezcla cachés y vistas: no acredita una mejora posterior en producción.

Las acciones en Administración solicitan solo metadatos y dejan de leer y clasificar Noticias. La lectura previa se conserva; al volver se recarga únicamente si cambió la revisión de noticias o configuración. El seguimiento de ambos jobs comparte un único sondeo y un trabajador limitado; no hay descarga de imágenes por noticia ni nuevos servicios. La recopilación v2.3.0 de la muestra tiene doce lotes: mediana de 4.363 ms y p95 de 12.587 ms. En el último lote, la escritura ocupó 2.570 ms; este cambio conserva las escrituras agrupadas y no aumenta su frecuencia.

## Publicación

Copiar todos los archivos de dist al proyecto Apps Script, ejecutar initializeConfiguration y publicar una nueva versión de la WebApp. El inicializador amplía los términos de Project Finance y actualiza las consultas de sus RSS gestionados; las fuentes personalizadas guardadas desde el editor conservan su configuración. Las consultas pendientes se reconstruyen cuando cambia el catálogo.

La validación supera las 325 pruebas de la suite completa y check:dist confirma una distribución reproducible. Incluye pruebas del botón y bloqueo independientes, progreso, noticias sin banco, exclusión de Empresas y Retail, países transfronterizos, logotipos y ausencia de lectura del corpus en Administración. No se ha publicado desde este entorno.
