# Lectura, taxonomía y evidencia de Radar · 2.0.0

El archivo `news-radar-telemetria.json`, exportado el 12 de octubre de 2026 a las 19:13 UTC, identifica la aplicación como 1.22.0. Sus capturas no permiten confirmar que la corrección de orden de 1.22.1 estuviera publicada. La distribución 2.0.0 incorpora también esa corrección: BBVA primero, otras entidades por nombre y fechas descendentes dentro de cada entidad.

## Información y presentación

El total de Novedades se toma de la selección completa; cambiar la pestaña geográfica modifica las tarjetas y los KPI de esa geografía, pero conserva el total de la cabecera. El patrón de artículo compartido empieza por titular y logo, continúa con extracto y muestra etiquetas, fecha y medio antes de Consultar. Los filtros activos dejan de repetirse como etiquetas. Los originales solo se despliegan si su contenido es diferente; se eliminan los avisos rutinarios de traducción.

Las etiquetas separan Palanca y Subpalanca. Combos, chips, mapa de calor, suscripciones, newsletters y exportaciones muestran el nombre de la subpalanca sin prefijarlo con la palanca. Las claves internas de las categorías conservan su identidad para poder filtrar y abrir ediciones guardadas. Una subpalanca compartida ofrece todas sus palancas asociadas y el filtro de noticias compara el nombre de subpalanca, además de la palanca si se ha seleccionado.

El filtrado dependiente se comparte entre Noticias, Novedades, Radar y los formularios de newsletters. La presentación del artículo es única y los estilos se centralizan. Los logos de medios se empaquetan localmente; no se consultan servicios externos al abrir una tarjeta. Se incluyen El Economista, Infobae, Pulzo, El Tiempo y BBVA. El resto conserva su nombre textual.

## Alcance anual y recuperación disponible

Radar aplica el año en curso al iniciar y cuando se consultan filtros sin fechas. Los períodos explícitos y el contexto de ediciones guardadas se respetan. Los recuentos de medios se calculan sobre todas las noticias únicas de la selección, antes de la paginación, y no se limitan a seis noticias: se representan los seis medios principales.

La recuperación anual exportada registra 6.443 tareas procesadas de 6.450, siete fallidas y 102 noticias nuevas. La diaria registra 118 de 119 y 297 nuevas. La auditoría está limitada y sus motivos agregan ejecuciones históricas; no permite recomponer el inventario anual completo ni verificar por sí sola el número exacto del medio mostrado en la captura. Los gráficos explicitan el período, volumen recuperado y volumen de la selección. Estos recuentos no representan toda la producción anual de un editor.

La retención de 90 días se aplica a Adopción y Telemetría, no elimina Noticias. Se comprobó el mantenimiento; no se modifica esa retención ni se atribuye a ella la baja cobertura anual. No se ha ejecutado una nueva recuperación de producción.

## Rendimiento

Hay 27 solicitudes de dashboard etiquetadas con 1.22.0, con dos aciertos de caché. Medianas: RPC 6.313 ms, servidor 1.967 ms, noticias 750 ms, metadatos 1.084 ms y renderizado 11 ms. Los máximos respectivos son 9.107, 4.908, 2.038, 1.903 y 32 ms. La muestra mezcla selecciones; no permite atribuir toda la latencia a una única etapa o afirmar una mejora porcentual.

La caché del contenido pasa de 60 a 300 segundos. Sigue separada de metadatos y progreso, y sus claves dependen de versión, configuración, revisión de noticias, traducciones y selección. Las ediciones se autorizan antes de consultar su contenido. Esto permite reutilizar selecciones repetidas sin volver a clasificarlas y agruparlas mientras no cambian sus revisiones. La latencia real deberá medirse con nueva telemetría tras publicar.

## Retirada del catálogo de temas

Tema no interviene en TF-IDF, reglas de palancas ni observación del corpus; sí imponía una coincidencia adicional al incorporar noticias. Se retira del clasificador, almacenamiento actual, configuración, filtros, etiquetas, asuntos y exportación. Canal digital conserva sus criterios de capacidades y contexto. La inicialización elimina la columna física y el catálogo, normaliza ajustes y suscripciones sin alterar noticias ni etiquetas existentes. Las ediciones enviadas conservan su corpus y sus fechas; se leen únicamente los filtros vigentes.

## Validación de 2.0.0

297 pruebas superadas; cobertura de líneas 96,89 %. Incluye migración e idempotencia, conservación de URLs, idiomas y taxonomía, eliminación en la interfaz real, ausencia de dependencia temática en la taxonomía y conservación de contexto de newsletters. Sintaxis, diseño, permisos y build reproducible verificados. Chrome verifica Radar entre 320 y 1440 px y las tres newsletters entre 320 y 800 px sin desbordamiento, con imágenes integradas. Son datos de demostración; no se ha publicado ni enviado correo real.
