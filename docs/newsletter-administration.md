# Newsletter y filtros administrativos · 1.2.0

## Control de contenido

La identidad del suscriptor es el correo normalizado, no el identificador de una suscripción. Todas las suscripciones y periodicidades de ese correo comparten un único control de noticias ya reportadas. Otro correo puede recibir el mismo contenido.

Cada noticia incluida genera dos huellas SHA-256: URL canónica y titular/extracto normalizados. Coincidir con cualquiera de ellas excluye la noticia. Se deduplican también copias dentro de la propia selección; cambiar el nombre, filtros o periodicidad de una suscripción, o borrarla y crear otra, no elimina la memoria del correo.

`NewsletterEnvios.contenido` contiene exclusivamente las huellas de las noticias realmente incluidas en el mensaje, después de aplicar `briefingLimit`. Las que quedan fuera del límite no se reservan y pueden aparecer en otra selección. Las pruebas no participan en este control. Los registros «Enviada», «Enviando» y «Revisar» reservan contenido; «No enviado», «Bloqueada» y «Sin novedades» no lo reservan. Un registro mal formado impide continuar con un control incompleto.

El bloqueo de script cubre la selección, el registro y el envío. La reserva se escribe y se aplica con `SpreadsheetApp.flush()` antes de Gmail. Un rechazo confirmado permite reintentar; un resultado incierto mantiene la reserva para todas las suscripciones del correo. El contenido usa siempre los últimos 7 días, incluido hoy, en la zona de negocio; los cierres de cada periodicidad solo determinan cuándo enviar. El límite se aplica también a las pruebas. Si al retirar repeticiones no quedan novedades, se registra «Sin novedades» y no se envía un correo vacío. El detalle muestra el número de noticias incluidas y repetidas omitidas, junto al Gmail ID o la causa del error.

Los envíos de versiones anteriores no guardaban un inventario de noticias. Su período y Gmail ID no permiten reconstruir con certeza el contenido ni aplicar una garantía retrospectiva. La aplicación muestra el número de entregas anteriores sin inventario y el historial indica «Sin detalle». Para comprobar ese contenido hacen falta los mensajes originales. No se generan huellas históricas a partir de filtros actuales ni se borran los registros existentes. El control exacto se aplica al contenido registrado con esta versión. No borrar ni recortar NewsletterEnvios: es la memoria permanente del control.

## Filtros

| Función | Filtros |
| --- | --- |
| Auditoría | Texto, fuente, resultado, ejecución, desde y hasta |
| Suscripciones personales | Texto de nombre/selección, activa/pausada, periodicidad |
| Suscripciones del equipo | Los anteriores y suscriptor |
| Catálogo de fuentes | Texto, entidad, geografía, tipo, activa/inactiva |
| Últimas ejecuciones | Texto de estado/error, estado y fechas |
| Historial de newsletters | Texto de Gmail ID/motivo/correo, suscriptor, estado, suscripción y fechas |
| Adopción | Texto, usuario, vista, evento y fechas |
| Telemetría | Texto de operación/detalle, operación, estado y fechas |

Todos comparten normalización, validación, controles y paginación. Cambiar un filtro vuelve a la primera página y limpiar restaura la selección completa. Los cambios de activación de fuentes se mantienen aunque sus filas queden ocultas. Las fechas y agrupaciones diarias se calculan en la zona horaria de negocio.

Auditoría, historial de newsletters y Telemetría filtran antes de paginar las últimas `eventLimit` filas disponibles y señalan si el histórico visible está limitado. El control del contenido enviado usa el historial completo. Las últimas ejecuciones conservan el límite de diez filas del dashboard. En Adopción, indicadores, tabla de usuarios y actividad diaria proceden de los mismos eventos filtrados dentro de los últimos 30 días. Los indicadores globales de Telemetría se etiquetan explícitamente como tales; sus filtros afectan a las operaciones de la tabla.

Las listas locales de fuentes y suscripciones no hacen nuevas llamadas RPC para filtrar. Las listas remotas devuelven una página, no miles de filas. La búsqueda textual espera 250 ms y las respuestas antiguas no sustituyen una petición más reciente. El código compartido de filtrado se utiliza tanto en el navegador como en Apps Script. Se centraliza también la conversión de fechas con el calendario existente.

El lote de newsletters clasifica una vez las noticias de los últimos 7 días y reutiliza las selecciones idénticas. Las huellas de cada objeto se calculan una vez; la deduplicación de una selección no copia el historial del destinatario. Las consultas de suscripciones e historial omiten la columna de huellas para ahorrar transferencia y memoria.

## Actualización y verificación

Publicar los 31 archivos regenerados de `dist/` como release 1.2.0. Ejecutar `initializeConfiguration` con la cuenta propietaria para añadir la cabecera `contenido` a NewsletterEnvios; la entrega real también asegura esa cabecera. Se conservan las filas y no se añaden permisos OAuth.

Las pruebas cubren destinatarios distintos, suscripciones solapadas, cambios de periodicidad, URL normalizada, copias del texto, pruebas, resultados inciertos, rechazos, límites de contenido, persistencia previa a Gmail y bloqueo concurrente. Los filtros se verifican con incidencias anteriores a las últimas 100 filas, fechas locales, paginación, métricas coherentes y activación de fuentes ocultas. Chrome cubre las vistas administrativas en escritorio y móvil; la vista local no envía correos reales.

Referencias: [Utilities.computeDigest](https://developers.google.com/apps-script/reference/utilities/utilities#computedigestalgorithm,-value,-charset), [SpreadsheetApp.flush](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#flush()).

La protección de contenido vacío se aplica también antes de contactar Gmail. Solo el flujo explícito de prueba permite enviar sin novedades. `make run` inicia la vista local y `make kill` la cierra mediante el registro y token de este proyecto. `make verify` exige más del 80 % en las cuatro métricas de cobertura.
