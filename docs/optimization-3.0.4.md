# Optimización 3.0.4

## Comportamiento

La entrada normal abre Novedades tanto para lectores como para administradores, con una única consulta inicial. Un enlace de una edición de newsletter conserva su vista, período y filtros. Administración abre Ejecuciones; su orden sigue siendo Ejecuciones, Suscripciones, Adopción, Telemetría, Taxonomía, Idioma, Fuentes, Auditoría y Configuración de negocio. En móvil las opciones aparecen únicamente al pulsar Menú.

La clasificación tiene su barra y acción manual en Ejecuciones, debajo de las recargas. Los envíos planificados tienen su barra en Suscripciones. Todos los procesos comparten la presentación de estado, última ejecución, motivo de pausa, previsión de reinicio y nombre del trabajo prioritario que impide continuar. La previsión indica cuándo vuelve a estar disponible el proceso; las cuotas del proveedor y los trabajos prioritarios pueden retrasar su inicio real. Las consultas periódicas se detienen al abandonar la sección.

La recopilación diaria precede a clasificación, traducción de negocio y newsletters planificadas. El análisis trimestral de taxonomía espera a terminar las entregas trimestrales; después se traduce la taxonomía. El supervisor periódico recupera activadores perdidos y solicitudes pendientes, respetando bloqueos, cursores y cuotas. Seleccionar Anual permite continuar la recarga existente sin crear otra ni borrar progreso. Los lotes de correo respetan su presupuesto de tiempo entre destinatarios y mantienen el control de entregas aceptadas o inciertas para evitar reenvíos.

## Procedencia y duplicados

La geografía configurada del RSS tiene prioridad sobre la ausencia de una mención de país en el titular. Para Google News se puede resolver también su edición geográfica o un país inequívoco en el nombre configurado de la fuente. Las búsquedas de perfil siguen rechazando noticias que mencionan exclusivamente otra geografía. Una fuente global sin evidencia local conserva Transversal.

El histórico se presenta con el país de su fuente y la clasificación lo persiste por lotes, escribiendo únicamente las columnas que cambian. No se eliminan noticias ni se alteran sus URLs u orígenes. Las tarjetas muestran Origen RSS usando el componente de identidad existente, con el texto escapado y nombres de fuente conservados.

La deduplicación combina URL canónica, titular original y titulares de traducciones ya guardadas. Mantiene la ventana temporal conservadora y el umbral mínimo de titular; cifras distintas, fechas alejadas y titulares genéricos no se fusionan. Las equivalencias transitivas se resuelven en el mismo índice. Los filtros de fuente siguen permitiendo consultar su evidencia. Se conserva el registro físico para auditoría; los recuentos y listados representan publicaciones únicas. La recuperación consulta esas identidades para evitar incorporar una copia publicada en otro idioma. No se llama al traductor durante la lectura de pantallas. Los índices y lecturas de variantes se reutilizan por lote; las nuevas traducciones invalidan los fragmentos cuyos recuentos pueden cambiar.

## Validación

Antes de la ampliación de procedencia: 405 pruebas correctas, cobertura de instrucciones 93,59 %, ramas 88,52 %. La ampliación añadió ocho pruebas de fuente, histórico, equivalencia multilingüe, transitividad, invalidación de recuentos y presentación segura del origen. Validación focalizada inicial: 44 pruebas correctas. Validación final del conjunto: 413 pruebas correctas; instrucciones 93,62 % y ramas 88,61 %.

Validación visual local a 320 px: anchura del documento y del diálogo de filtros de 320 px, sin desbordamiento. Administración oculta las opciones hasta abrir Menú. Barras de clasificación y entrega presentes en sus secciones y navegación inicial en Novedades. Se conservan indicadores de carga y controles accesibles.

Las evidencias, respaldo remoto completo y paquete de publicación se guardan en `output/optimization-3.0.4/`. Las pruebas de envío usan datos simulados; la auditoría no realiza envíos manuales de correo.

## Publicación

Implementación 60 publicada el 14/10/2026 a las 21:43 (Europe/Madrid), release 3.0.4, en el enlace existente. Los 21 archivos modificados se contrastaron después del guardado con el paquete verificado. `updateOperationalSchedule` completó su ejecución a las 21:42:09. Se conserva la ejecución con la cuenta propietaria y el acceso restringido al dominio BBVA.

## Auditoría de producción

Las cuatro vistas de lectura y las nueve secciones administrativas se verificaron en escritorio. Comprobación adicional a 320 y 390 px: navegación inferior, filtros, Menú cerrado y abierto, Ejecuciones y Suscripciones. Las 22 observaciones registradas no muestran desbordamiento horizontal, errores de aplicación ni descargas visibles en móvil. Noticias presenta el origen RSS junto al medio y las banderas siguen la geografía de la fuente. La entrada normal abre Novedades.

El supervisor figura instalado y ha ejecutado sin errores. La continuación anual respondió «Continuación en cola» y conservó su período y progreso. La clasificación manual del histórico comenzó y avanza por lotes; la traducción identifica explícitamente que espera a esa clasificación. Estos trabajos asíncronos siguen pendientes de finalizar; la publicación no fuerza cuotas ni altera sus prioridades. La entrega de newsletters permanece desactivada, con su barra visible y sin envíos manuales durante la auditoría.
