# Recuperación de Novedades · 1.15.1

Exportación analizada: 12/10/2026, 13:49:54 UTC, versión 1.15.0. El archivo contiene datos de versiones anteriores; las siguientes cifras corresponden exclusivamente a 1.15.0. No se incluyen identidades.

- Siete consultas de dashboard, todas `OK`, con mediana de 6.939 ms. Las tres consultas de Novedades registran 8.459, 8.149 y 6.939 ms; no consta una excepción en esas respuestas.
- Doce lotes de clasificación: 1.200 noticias revisadas, 163 etiquetadas como digitales. El filtro digital excluye gran parte del corpus, pero estas cifras no determinan cuántas novedades empresariales hay dentro de la última semana.
- La recuperación diaria registró 297 noticias nuevas; queda una fuente fallida y ninguna tarea pendiente. La exportación no contiene las selecciones personales ni los conteos de las respuestas: no demuestra por sí sola qué filtro dejó vacía la pantalla.

La inspección del código identifica dos restricciones de la consulta inicial: Novedades imponía cobertura digital y podía aplicar implícitamente la última suscripción activa. Las newsletters nuevas además heredaban entidad, país y tema de los valores generales de Noticias. Esas restricciones no corresponden al criterio solicitado.

La corrección centraliza el segmento predeterminado para Novedades y Newsletter: **Empresas e instituciones**, con la ventana común de **últimos siete días incluido hoy**, calculada en la zona horaria de negocio. No se imponen cobertura, entidad, país ni tema. Las suscripciones existentes mantienen sus filtros; la aplicación solo personaliza la apertura si hay una elección explícita guardada. Si la selección se elimina o pausa, vuelve al ámbito predeterminado. Las ediciones enviadas conservan su periodo y contenido.

No se añaden lecturas, jobs ni llamadas de traducción. Se mantienen las cachés por revisión, el procesamiento incremental y la prioridad de recuperación diaria. Los tiempos observados incluyen latencia RPC; esta corrección evita consultas restrictivas, pero no se atribuye una mejora de latencia de producción sin medir el nuevo despliegue.

La regresión reproduce una cuenta con una suscripción restrictiva y configuración de Noticias limitada por entidad, país y tema: Novedades y la prueba real de newsletter incluyen tanto novedades generalistas como digitales de otras entidades de la semana, excluyen noticias antiguas y retail, y permiten aplicar digital expresamente. Se mantienen las pruebas de preferencias explícitas y ediciones históricas.

Validación: 239 pruebas superadas, cobertura de líneas 96,48 %, sintaxis y distribución reproducible verificadas. Chrome confirma Novedades con noticias visibles, segmento empresarial, siete días y cobertura/entidad sin restringir; el formulario de Newsletter utiliza el mismo segmento sin país ni tema impuestos y no registra errores JavaScript.

Publicar `dist/` actualiza la WebApp. No requiere cambios de esquema ni nuevos activadores.
