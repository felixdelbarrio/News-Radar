# Recargas y traducciones · 1.6.0

La solicitud diaria se guarda antes de intentar adquirir el bloqueo del trabajador. Si la anual está ejecutándose, la diaria queda pendiente y se incorpora en el siguiente lote. Cada ciclo conserva su identificador, intervalo, tareas, contadores, errores y pausa. Un mismo día no crea dos ciclos diarios y una nueva petición anual reutiliza la anual que sigue pendiente.

Con la configuración predeterminada, cada lote reserva hasta tres consultas recientes y ejecuta hasta doce anuales. El total está limitado a veinte consultas cuando aumenta el tamaño configurado. Dentro de cada grupo se priorizan las fechas recientes. Una pausa por errores de la anual no pausa la diaria. La exclusión mutua protege las escrituras y la deduplicación común impide guardar dos veces la misma noticia. Un activador diferido cubre las solicitudes que coincidan con el cierre del activador recurrente; las solicitudes pendientes sobreviven a errores temporales del trabajador. Los contadores se reconstruyen desde las tareas si se interrumpe su última escritura.

Administración → Ejecuciones muestra una línea de progreso por recarga, período, pendientes, nuevas noticias, errores y última actividad. El progreso cuenta tareas terminadas, incluidas las omitidas o fallidas; no expresa un porcentaje de artículos recuperados por el proveedor. Las actualizaciones se consultan cada treinta segundos mientras la vista está activa. El historial admite filtros por identificador y estado. «Recuperar noticias» solicita el período elegido y «Continuar recuperación» reanuda las pendientes.

Noticias y Novedades traducen titulares y extractos al idioma activo: español, inglés o turco. LanguageApp detecta el idioma del texto; el idioma de una edición de Google News no se considera prueba del idioma de cada artículo. El título y el extracto viajan juntos en una llamada. La vista muestra resultados progresivamente, con un máximo de cinco traducciones nuevas por petición, y permite consultar el original. Las traducciones se guardan por idioma y huella del contenido, con caché temporal y límite de filas. Para recuperar artículos solo se leen sus identificadores y las filas seleccionadas, sin descargar todos los extractos del almacén.

El contenido original, el medio, el enlace, los filtros y la identidad usada para deduplicar permanecen almacenados. Esta función traduce las tarjetas de Noticias y Novedades; no modifica el contenido de los artículos en las newsletters. Si el servicio devuelve un error o agota su cuota, se muestra el original con su indicación y se espacian los nuevos intentos. Las traducciones ya guardadas siguen disponibles. La vista local carece de LanguageApp y muestra esa alternativa explícitamente.

LanguageApp es un servicio integrado de Apps Script y no necesita claves adicionales. Sus límites son los establecidos en las [cuotas oficiales](https://developers.google.com/apps-script/guides/services/quotas); la traducción utiliza la [API oficial con detección automática y contenido HTML](https://developers.google.com/apps-script/reference/language/language-app).

## Actualización

1. Copiar la distribución regenerada de `dist/` al proyecto de Apps Script.
2. Ejecutar `initializeConfiguration`. Crea Recargas y Traducciones, conserva las tareas y noticias existentes y migra la cola activa al seguimiento por ciclo. La migración elimina las propiedades globales de intervalo y pausa que sustituye.
3. Publicar una nueva versión de la WebApp y recargarla. La recuperación anual en curso se conserva.

Las pruebas verifican solicitudes durante un bloqueo, reparto de capacidad, pausas independientes, reintentos, deduplicación entre ciclos, preparación idempotente, recuperación tras interrupciones, filtros y barras de progreso. También verifican traducción, selección de filas, caché persistente, límites por lote, datos originales, respuestas inválidas, cuotas y cambios de vista. La cobertura exige superar el 80 % en líneas, sentencias, funciones y ramas. Estas comprobaciones no miden la latencia del servicio real de Google ni sustituyen publicar la actualización.
