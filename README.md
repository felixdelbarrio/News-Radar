# BBVA Empresas · News Radar

WebApp de Google Apps Script con Google Sheets como almacén, sin dependencias de ejecución ni claves API.

## Desarrollo local

Requisitos: Node.js 24 o superior, npm y GNU Make. `.nvmrc` fija la versión usada por CI; con nvm, ejecutar `nvm install`.

```sh
make install
make run
```

Abrir `http://127.0.0.1:4173`. Se puede cambiar el puerto con `make run PORT=4180` y detener el servidor con `make kill` o Ctrl+C. Tras editar el código, ejecutar `make kill` y `make run` y recargar el navegador para regenerar la aplicación.

La vista local usa la instantánea pública de `assets/feed-snapshot.json`, del 9 de octubre de 2026. Filtros, clasificación, radar, CSV y newsletter ejecutan las mismas funciones puras del servidor. Solo hay noticias de los dos RSS oficiales; los demás países y entidades pueden no tener resultados. No se ejecutan activadores ni se escribe en Google.

Para probar Administración: `PREVIEW_ADMIN=1 make run`. Los catálogos y suscripciones del modo local viven en memoria y se restauran al recargar. El modo normal es lector; la identidad corporativa se comprueba únicamente en la instalación real. Las pruebas de persistencia y permisos usan servicios controlados.
| Comando | Resultado |
| --- | --- |
| `make build` | Genera los archivos modulares instalables en `dist/` |
| `make check-dist` | Comprueba que la distribución versionada coincide exactamente con las fuentes, sin modificarla |
| `make check` | Comprueba sintaxis, perfil y permisos OAuth |
| `make test` | Compila y ejecuta las pruebas de servidor y vista local |
| `make verify` | Ejecuta las mismas comprobaciones de integridad que CI |
| `make preview` | Genera una vista autónoma en `output/preview.html` |
| `make codeql` | Prepara copias JavaScript para análisis CodeQL |
| `make clean` | Elimina los directorios generados |

Se versiona `dist/` para comparar la distribución de cada release en GitHub. Se genera exclusivamente desde `src/` y `assets/`; no se edita directamente. No se versionan capturas, credenciales ni metadatos de la instalación personal. CI comprueba la distribución antes de regenerarla y rechaza archivos desactualizados, ausentes o sobrantes; también publica `dist/` como artefacto.

## Versión de publicación

La versión de la release vive únicamente en **`src/server/config/Config.gs`**, en `RADAR.version` (actualmente `1.22.1`). Es metadato de la distribución, no una configuración de negocio de Sheets. Actualizarla antes de publicar: `1.0.1` para correcciones, `1.1.0` para funcionalidades compatibles y `2.0.0` para cambios incompatibles. Se admite un sufijo de prerelease, por ejemplo `1.1.0-rc.1`.

Después de cambiar código o versión, ejecutar `make build check-dist verify` e incluir `dist/` junto con las fuentes en el mismo commit de la rama de trabajo. El build copia `Config.gs` sin alterar su versión y la indica en su salida. Para publicar en Apps Script, copiar el contenido de esa distribución; un tag `v1.0.0` puede identificar el mismo commit en GitHub.

## GitFlow y checks

- `master`: versiones estables. Solo recibe pull requests desde `develop` del mismo repositorio.
- `develop`: rama predeterminada de integración. Recibe cambios mediante pull request desde otra rama, sin exigir prefijos en el nombre.
- Crear una rama de trabajo desde `develop`, integrar mediante PR en `develop` y publicar mediante PR `develop → master`. Las ramas de release y hotfix también se integran primero en `develop`.

CI ejecuta comprobaciones de sintaxis, integridad de permisos, build y pruebas en pushes y pull requests hacia ambas ramas. CodeQL analiza JavaScript y los propios workflows en cada cambio y semanalmente. Los módulos `.gs` y el cliente se preparan como `.js` exclusivamente para el análisis; no se mantiene otra implementación. CodeQL publica los hallazgos en Security; un análisis exitoso no implica ausencia de alertas. Dependabot propone actualizaciones semanales de las acciones fijadas por SHA. El check GitFlow valida las ramas y repositorios de origen y destino.

La licencia inicial del repositorio se conserva en `LICENSE`. Los logotipos y las tipografías aportadas mantienen los derechos de sus respectivos titulares.

Para bloquear pushes directos, las protecciones remotas de `master` y `develop` deben exigir pull request y los checks `Integrity and tests`, `Analyze (javascript-typescript)`, `Analyze (actions)` y `Branch policy`. Estas protecciones deben aplicarse también a administradores, sin bypass, y bloquear force push y eliminación de ramas. Un workflow no impide por sí solo los pushes directos. La actualización local del validador no modifica las protecciones en GitHub. No se exige aprobación de otro usuario mientras el repositorio tenga un único mantenedor.

## Organización y dependencias

- `src/design/tokens.json`: única fuente de colores, espaciado, tipografía, dimensiones y roles del tema de Sheets. El build genera `Tokens.html` y `Design.gs` desde este fichero; nunca se editan los archivos generados.
- `src/client/core/`: utilidades DOM, formateo y transporte RPC.
- `src/client/features/`: radar, gráficos, filtros, noticias, administración, fuentes, navegación, auditoría, métricas y eventos de uso. Cada módulo importa sus dependencias y recibe los callbacks que necesita.
- `src/client/app.js`: coordina cargas, concurrencia y acciones; las funciones de cada módulo conservan su propio estado. Los filtros controlan la consulta y paginación; navegación controla la vista; eventos controla su cola; fuentes controla sus formularios.
- `src/views/`: layout, filtros por vista y vistas independientes de Radar, Noticias y Administración.
- `src/styles/`: estilos base, layout, componentes y reglas responsive, todos referenciando los tokens.
- `src/server/`: configuración, acceso, almacenamiento, noticias, fuentes, recopilación, métricas y entrada web, separados por responsabilidad.
- `src/server/news/Selection.gs`: filtros, opciones, paginación y CSV compartidos por Apps Script y la vista local.
- `src/server/metrics/Analytics.gs`: cálculos de adopción sin acceso a servicios de Google.
- `assets/app-config.json`: estructura de navegación del cliente. La selección inicial se recibe de Sheets al cargar.
- `assets/configuration-defaults.json`: valores usados únicamente al inicializar claves ausentes en Sheets.
- `assets/admin-schema.json`: campos y etiquetas del editor de catálogos; no contiene entidades, temas ni términos de negocio.
- `src/server/config/Configuration.gs`: lectura, validación, caché, inicialización y escritura de configuración.
- `src/server/briefing/Briefing.gs`: señales de novedades y renderizado HTML/texto de newsletter.
- `src/server/briefing/Mail.gs`: alias verificado, MIME, Gmail API y diagnóstico del remitente.
- `src/server/briefing/Delivery.gs`: programación, lotes y registro persistente de entregas.
- `src/server/briefing/Subscriptions.gs`: criterios personales, períodos naturales, validación y gestión administrativa.

Apps Script comparte un espacio global entre sus archivos `.gs`; las funciones internas terminan en `_` y los endpoints públicos aplican autorización. La lógica pura se mantiene separada de los módulos que acceden a Sheets y otros servicios. El servidor incorpora `Tokens.html`, `Styles.html` y `Client.html` al renderizar la página; el navegador recibe un único documento sin peticiones de fragmentos.

Los imports ES del cliente se empaquetan con esbuild, usado solo durante el desarrollo. No hay dependencias de ejecución. Exportar no vuelve a cargar el dashboard. Los formularios de fuentes se reconstruyen únicamente cuando cambia su configuración. El empaquetado elimina exports sin uso; el formateador de fechas se reutiliza en vez de crearse para cada fila. CodeQL analiza los módulos originales del cliente y copias `.js` de cada archivo de servidor.

El build conserva los módulos de servidor separados: actualmente genera 31 archivos, incluidos los cuatro HTML y el manifiesto. Las hojas operativas son Noticias, Auditoria, Ejecuciones, Recopilacion, Telemetria, Adopcion, Configuracion, Suscripciones y NewsletterEnvios.

## Configuración de negocio en Sheets

La pestaña `Configuracion` contiene una fila por catálogo: `settings`, `entities`, `geographies`, `topics`, `segments`, `signals` y `feeds`. `valor` almacena JSON; el editor de Administración ofrece formularios, activación, altas, bajas y ordenación para evitar editar JSON manualmente. `Config.gs` conserva únicamente esquemas de almacenamiento. `Defaults.gs` sustituye a `Profile.gs` y solo participa en la inicialización: el código de consulta y clasificación lee Sheets.

Se pueden configurar entidades y alias, tipos de entidad, países e idiomas, temas y términos, segmentos, señales de lanzamiento, términos de contexto, exclusiones y fuentes RSS. Operación incluye selección inicial, ventana temporal, hora y zona de recopilación, límites y tamaño de lote. Los límites técnicos máximos de validación protegen las cuotas, el tamaño de celda y la caché. La taxonomía de tipos es editorial: no acredita una licencia bancaria ni disponibilidad de productos.

La configuración inicial incluye 34 entidades, siete países, Empresas e instituciones —pymes, autónomos, empresas e instituciones— y Retail. Añade Revolut, N26, Qonto, Wise, Nubank, Mercado Pago, Ualá, Klar, Konfío y Yape a los bancos del perfil aportado. Todas comienzan activas. Son valores iniciales editables, no promesas de cobertura exhaustiva.

Sheets es el almacenamiento permanente. La caché de Apps Script dura como máximo seis horas y puede ser desalojada por Google; su revisión se conserva en Script Properties. Guardar desde Administración o editar manualmente `Configuracion` invalida esa revisión mediante un activador de edición. Los lectores que llegan después utilizan la nueva versión; las sesiones abiertas actualizan sus datos en su siguiente consulta. La revisión evita que una sesión antigua sobrescriba cambios nuevos. Los índices y términos normalizados se construyen una vez por ejecución; no se recompilan por noticia. No se mantiene una segunda copia permanente de los catálogos.

`initializeConfiguration` crea las pestañas nuevas y rellena solo claves inexistentes; no repone filas borradas de un catálogo ni sobrescribe valores guardados. Los cambios de hora o zona se aplican a la programación tras desactivarla y reactivarla desde Fuentes.

## Radar, Noticias y Novedades

La navegación sigue el orden Novedades, Noticias, Radar y Newsletter. Radar contiene KPIs, mapa y evolución; comienza con el año en curso. Las tres vistas parten de Segmento: Empresas e instituciones y Cobertura: Canal digital; el usuario puede cambiarlos o quitarlos. Seleccionar una geografía en el mapa abre Noticias. Novedades muestra lanzamientos de producto, mejoras de oferta y alianzas de los últimos siete días por defecto, o del período de una edición de newsletter. Noticias conserva todos sus filtros y comienza con el primer y último día del mes en curso. Cada vista conserva su selección; las fechas se calculan en la zona configurada. «Ver todo» elimina los filtros editables, manteniendo los últimos 7 días en Novedades.

Las señales buscan por defecto en el titular y requieren contexto de producto cuando está definido. Las exclusiones reducen artículos educativos y genéricos. Administración puede elegir `headline` o `fullText`, cambiar los términos o desactivar señales. Una noticia puede pertenecer a varios segmentos y señales; lo desconocido no se asigna artificialmente. La clasificación se vuelve a calcular con los catálogos actuales al consultar el histórico. No hay puntuación ni verificación de productos: se muestran titular, extracto y enlace del editor. Las reglas pueden tener falsos positivos y omisiones.

La geografía es la de la fuente de seguimiento, no una geolocalización confirmada de la operación. Las noticias sin país conocido quedan fuera del mapa. La geometría mundial se genera en el build; los países activos se asignan por identificador ISO numérico desde Sheets, sin SDK ni consultas externas en el navegador. El radar calcula toda la selección leída; la evolución limita intervalos y series según la configuración, agrupa el resto y conserva los días sin noticias.

Los filtros activos de Radar, Novedades y Noticias aparecen como chips pequeños con ámbito y valor. Un único componente se mueve entre las tres vistas, que conservan su selección. Radar muestra también el selector de cobertura; Novedades muestra los filtros editables y usa por defecto los últimos 7 días o el período de una edición de newsletter. Cerrar uno vacía el campo correspondiente, restablece la primera página y actualiza recuentos, gráficas o listados según la vista. Los desplegables consultan únicamente en `change`; el texto de búsqueda conserva el debounce. Exportar selección solo está disponible en Noticias de escritorio; Novedades no ofrece descarga de newsletter.

Administración reúne configuración, fuentes, auditoría, telemetría, adopción, recopilar y abrir hoja. Se oculta al lector y sus endpoints exigen autorización en servidor. Telemetría permite descargar JSON con versión de esquema, fecha, límites, operaciones, ejecuciones, cola, auditoría, motivos de exclusión y métricas de uso; señala los conjuntos que alcanzan el límite de lectura.

## Autoservicio de newsletter

La entrada principal es **Novedades**. La fecha disponible de la próxima entrega aparece en cada suscripción. Cada usuario crea, edita, pausa o da de baja sus suscripciones, asociadas exclusivamente al correo obtenido en el servidor. Los criterios de recepción son independientes de los filtros de exploración: abrir Noticias o cambiar sus filtros no cambia una suscripción guardada. El administrador ve correos, criterios, periodicidad, estado y última entrega; puede crear altas manuales y modificar cualquier suscripción del dominio. Los endpoints administrativos deniegan lectores.

Valores iniciales: **mensual, Empresas e instituciones, Canal digital, todas las entidades y geografías**. La única selección temporal es la periodicidad: **semanal → Novedades**, **mensual → Noticias**, **anual → Radar**. Los envíos periódicos cubren la última semana completa (lunes a domingo), mes completo o año natural completo, en la zona configurada. Una suscripción nueva o editada empieza en el siguiente cierre posterior a su actualización. No se envían newsletters vacías. «Probar» envía al usuario conectado el contenido del período actual correspondiente a su periodicidad; no adelanta ni consume la entrega periódica, registra una prueba independiente y consume el presupuesto de correo.

La periodicidad inicial, los límites y la activación de entrega proceden de `Configuracion.settings`. El asunto se genera a partir de los filtros aplicados con el prefijo `[bIA]`. El contenido se filtra por entidad o tipo —incluidos fintechs y neobancos—, segmento, cobertura, geografía, tema, novedad, fuente y palabras clave. Los catálogos proceden de Sheets. «Fuente» admite tanto el medio editorial como el feed de seguimiento.

El envío usa **Gmail API**, ejecutada por el propietario, con **news-radar.group@bbva.com** como `From` y `Reply-To`. Como en Market Pulse, el grupo debe estar verificado en Gmail → Cuentas → Enviar como. Cada newsletter va exclusivamente a su destinatario; no se copia al grupo. El mensaje pertenece al buzón del propietario: un Google Group no tiene una carpeta Enviados propia. `NewsletterEnvios` registra cada período antes de enviar; el estado impide repetirlo si se vuelve a ejecutar el activador. Un envío con resultado incierto queda en «Revisar» y no se reintenta automáticamente; el administrador debe contrastarlo con los envíos reales. El límite configurable en una ventana de 24 horas (100 inicialmente) y el tamaño de lote limitan el trabajo; no son una lectura de la cuota real de Google. Los destinatarios pendientes continúan en otro lote. Un error de Gmail detiene el lote y su continuación inmediata. Gmail ID queda guardado cuando Gmail acepta el mensaje; no confirma recepción en la bandeja del destinatario. Los rechazos explícitos quedan como «No enviado» y permiten reintento; los bloqueos previos al envío quedan como «Bloqueada». Los estados inciertos también reservan presupuesto. La entrega queda **desactivada inicialmente**. La clasificación se calcula una vez por lote y las selecciones idénticas comparten resultados en memoria. El registro de entregas es persistente en Sheets. La columna `contenido` guarda las huellas de las noticias efectivamente incluidas. La deduplicación del contenido semanal se comparte por correo; usa URL canónica y texto normalizado. Los resúmenes mensual y anual analizan todo su período, incluyendo noticias ya enviadas semanalmente, para preservar los KPIs. El identificador de entrega impide enviar dos veces el mismo cierre de una suscripción. Solo se reserva lo incluido en el correo, antes de llamar a Gmail. Las pruebas quedan fuera; los rechazos confirmados liberan el contenido y los resultados inciertos lo mantienen reservado. Los envíos anteriores sin inventario no permiten reconstruir con certeza el contenido: Administración muestra esa limitación y deben contrastarse con los correos originales. No borrar ni recortar NewsletterEnvios: es la memoria permanente del control.

Los newsletters incluyen titulares, extractos, entidades, segmentos, señales y enlaces originales, tanto en HTML como en texto UTF-8. El asunto comienza siempre por `[bIA] News Radar : `. El pie incluye la marca bIA con una imagen PNG inline, «Ir a Newsradar» y enlaces separados para gestionar y dar de baja la suscripción. La URL publicada se obtiene de `newsletterAppUrl` o del despliegue activo de Apps Script. El enlace de baja abre Newsletter y requiere confirmar con la cuenta propietaria de la suscripción; una apertura GET no elimina registros. Los estilos de correo se generan desde los mismos tokens y se incrustan en cada elemento. El límite de novedades es configurable y se indica si se supera. La cobertura depende del histórico capturado; no se inventan productos o condiciones.

En escritorio, navegación superior fija y filtros verticales. En móvil, navegación inferior fija y un único formulario de filtros trasladado a una modal nativa, con cierre por Escape y conservación de valores al cambiar de tamaño. No se duplican formularios ni consultas al cambiar entre Radar y Noticias.

## Recuperación manual de noticias

Solo Administración → Ejecuciones ofrece **Recuperar noticias**, con **Diaria** seleccionada por defecto y **Anual** como alternativa. La diaria utiliza la misma ventana reciente que el proceso programado. Los límites se calculan con la zona horaria guardada en Sheets; el año comprende los doce meses anteriores hasta hoy. Las búsquedas de perfil se dividen por semanas, con límites de fecha explícitos; las respuestas de 100 entradas o más se consideran posiblemente saturadas y se dividen en dos períodos menores hasta llegar a un día. Las tareas derivadas se conservan en Sheets, incluidos sus reintentos; los RSS propios se consultan una vez y se filtran por el período solicitado. No se garantiza un archivo exhaustivo: cada proveedor decide qué histórico publica y cuántos resultados devuelve.

Cada ciclo conserva su período y progreso en Recargas. Las solicitudes se registran en Script Properties antes de solicitar el bloqueo. Una recuperación activa impide lanzar otra del mismo tipo; la diaria y la anual pueden estar en cola simultáneamente. Desactivar una fuente sigue impidiendo nuevas consultas. Se comprueban URLs contra toda la columna de enlaces del histórico para no duplicar noticias antiguas. Solo se escriben las filas de estado que han cambiado; al finalizar se ordena el histórico por fecha una única vez, manteniendo las noticias recientes en la ventana de consulta. La programación diaria utiliza la misma división de consultas dentro de su ventana operativa configurable.

En local, la acción muestra cuántas noticias de la instantánea corresponden al período. No consulta fuentes remotas ni simula noticias nuevas. No requiere permisos nuevos.

## Taxonomía dinámica de canales digitales

Administración > Taxonomía muestra palancas, subpalancas, segmentos, términos, origen y noticias que sustentan cada categoría, con búsqueda y paginación. El administrador puede actualizarla manualmente y consultar una sola barra de progreso. Ejecutar `initializeConfiguration` tras desplegar 1.13.0 crea las hojas Taxonomia y TaxonomiaTrabajo, añade la columna taxonomia a Noticias y programa el job diario en la hora de recuperación configurada, cerca del minuto 45. No requiere permisos nuevos.

El trabajador compartido mantiene el bloqueo de script y da prioridad absoluta a los lotes de recuperación diaria disponibles. Los demás procesos se alternan; la taxonomía también cede cuando hay lotes anuales de recuperación listos. Trabaja en lotes de hasta 100 noticias y 10 segundos dentro del presupuesto común. La petición diaria persiste aunque el trabajador esté ocupado; los errores conservan el cursor y aplican la espera de reintento configurada. Un cambio del contenido o las reglas durante el job reinicia su análisis para evitar mezclar corpus y posiciones de filas.

El análisis recorre todas las noticias almacenadas, sin limitarse a la ventana del dashboard. Las capacidades habilitadas de Empresas y Retail y las reglas de API, IA, banca online y experiencia móvil definen las categorías iniciales. Se excluyen noticias corporativas negativas y contenido editorial según las reglas digitales existentes. Las expresiones de dos palabras con vocabulario digital generan subpalancas al aparecer en al menos dos noticias; se omiten palabras vacías y nombres de entidades. Se conservan hasta tres subpalancas emergentes por palanca, con un vocabulario acotado que prioriza las expresiones de las noticias más recientes y estadísticas dispersas en Sheets, sin guardar una matriz de documentos en RAM.

La puntuación utiliza TF sublineal `1 + log(frecuencia)` e IDF suavizado `log((1 + documentos)/(1 + documentos_con_término)) + 1`, conforme a la [definición de TF-IDF documentada por scikit-learn](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting). No instala scikit-learn ni utiliza APIs externas. La ordenación de candidatos usa el TF-IDF medio del corpus; las reglas agrupan las palancas. Es una clasificación por evidencia textual: las expresiones emergentes reproducen el contenido de las noticias y no cuentan con revisión editorial manual.

Los identificadores dependen de la palanca y subpalanca, no de sus frecuencias o pesos. El job compara el modelo semántico y la huella del texto; solo escribe etiquetas diferentes. Una ejecución idéntica no reescribe noticias ni el catálogo. Las noticias nuevas reciben etiquetas de la taxonomía vigente al incorporarse. Noticias, Novedades, exportación CSV y newsletters comparten los filtros de Palanca y Subpalanca y los nombres de las etiquetas. Una subpalanca que desaparece deja de ofrecerse como filtro; las suscripciones existentes no amplían su alcance automáticamente.

El área de progreso de recuperación muestra una sola línea por tipología, con el ciclo activo o más reciente. La tabla de Ejecuciones conserva el histórico completo.

Al finalizar el análisis y etiquetado se encola la traducción de los nombres a español, inglés y turco. Administración > Idiomas muestra su progreso y permite traducir pendientes o reanudar un proceso en pausa. Cada nombre se guarda por contenido e idioma: los nombres compartidos se traducen una sola vez, las traducciones vigentes se reutilizan y se retiran las que ya no pertenecen al catálogo. Los nombres del catálogo estático aprovechan el diccionario incluido; los nombres dinámicos utilizan LanguageApp con detección automática del idioma de origen. Las pantallas y newsletters leen únicamente traducciones guardadas y mantienen los valores canónicos de los filtros y los IDs de las etiquetas.

La traducción de taxonomía utiliza el mismo trabajador y bloqueo que los otros jobs, con lotes de hasta 20 llamadas y 10 segundos. Cede a cualquier recuperación preparada y se detiene entre llamadas si llega una petición diaria. Comparte el presupuesto de 3.000 llamadas diarias con la traducción de noticias y reanuda tras errores sin repetir resultados guardados. Tras desplegar **1.14.0**, ejecutar `initializeConfiguration` para crear **TaxonomiaTraducciones**; no añade permisos ni un cron independiente.

## Fuentes y recopilación automática

Administración > Fuentes organiza el catálogo en las pestañas Todas, Google News RSS y RSS del editor. Comparten búsqueda, filtros y paginación; las activaciones se conservan entre pestañas y se guardan para todo el catálogo. La edición y alta de feeds está en RSS del editor y conserva los cambios al cambiar de pestaña. La agrupación se calcula al cargar la configuración, sin consultas adicionales al navegar.

La configuración inicial genera 50 fuentes: dos RSS oficiales de BBVA y 48 búsquedas de Google News por entidad y país. Los alias se combinan en una consulta para evitar feeds redundantes. El número cambia al editar catálogos. Todas las URLs RSS son configurables; las búsquedas utilizan nombres, alias, países, idioma y términos de sector guardados en Sheets. No requieren claves API.

Desactivar una entidad, un país o una fuente evita consultas futuras sin eliminar el histórico. Las noticias de Google News mantienen el enlace agregado y el medio que declara el feed; no se atribuyen URLs canónicas ficticias. Las opciones de entidad y país incluyen el catálogo activo aunque todavía no haya noticias. Búsqueda sin acentos, fechas inclusivas, invalidación de respuestas antiguas y paginación se comparten con la vista local.

Las publicaciones se incorporan directamente a Noticias con fecha, medio, entidad, geografía, tema y enlace, sin intervención manual. Los enlaces de Google News se mantienen como enlaces agregados, no se presentan como URLs canónicas de editores. La clasificación temática, el límite temporal y la deduplicación por URL se aplican al recibir el RSS. El cuadro de mando incluye las noticias disponibles sin intervención manual. El filtrado de entidad, geografía, medio y fechas precede a la clasificación temática. Los resultados del dashboard se reutilizan durante 60 segundos si caben en 90 KB UTF-8, con claves por selección, configuración y revisión de noticias; una captura o edición manual invalida la revisión. Los datos administrativos se consultan fuera de esa caché. Las operaciones `dashboard` registran RPC, servidor, noticias, render y acierto de caché mediante el envío periódico de eventos existente.

La captura diaria usa la hora y zona configuradas (inicialmente 07:00 Europe/Madrid). Consulta el tamaño de lote configurado (inicialmente tres fuentes por minuto) mediante una cola persistente. HTTP 429/503 se reintenta hasta tres veces con el intervalo configurado (inicialmente diez minutos); si fallan varias fuentes, se aplica la pausa configurada (inicialmente cinco minutos). Las fuentes desactivadas durante un ciclo se omiten. Un ciclo en curso se conserva al iniciar otro; su estado y sus errores son visibles al administrador. La disponibilidad y cobertura de Google News pueden variar.

Las consultas RSS del lote se envían con `UrlFetchApp.fetchAll`. Las redirecciones están limitadas a tres saltos HTTPS dentro del dominio configurado; esto permite las redirecciones de edición de Google News sin desactivar el seguimiento de Uruguay. El lote reconstruye solo sus consultas, y los paneles de estado leen contadores sin cargar las URLs completas de la cola.

Las escrituras de noticias, auditoría y estados se agrupan por lote. Los descartes conservan hasta tres ejemplos por motivo y fuente, con totales completos en el resumen de fuente y en el JSON de Telemetría; no se eliminan registros históricos. Los estados se guardan después de las noticias para que un fallo no marque como recopiladas publicaciones que no llegaron a almacenarse. Consultas y exportación leen el máximo configurado, con un techo técnico de 10.000 noticias; el histórico completo permanece en Sheets. No se mantienen colas de candidatos ni hojas de búsquedas.

## Instalación y actualización manual

El trabajo queda local: el Makefile no publica ni sube cambios a Google o GitHub.

1. Ejecutar `make build` y copiar los **31 archivos** de `dist/` al editor de Apps Script. Eliminar `Profile.gs`, que ha sido sustituido por `Defaults.gs`; eliminar también `Core.gs` si procede de una instalación antigua. No conservar módulos duplicados.
2. En una instalación existente, ejecutar **`initializeConfiguration`** como propietario antes de publicar la nueva versión. Crea Configuracion, Suscripciones, NewsletterEnvios y el activador de invalidación sin modificar noticias, auditoría, adopción ni la cola. No hace falta ejecutar `setupRadar` otra vez. Para una instalación nueva, `setupRadar` inicializa todo.
3. Revisar Administración: fuentes y ajustes antiguos guardados en las propiedades `FEEDS` y `DISABLED_SOURCES` **no se importan**. Copiar los RSS personalizados y la selección de activación que se quieran conservar desde la instalación anterior, y retirar esas propiedades obsoletas tras comprobar la actualización. Los catálogos nuevos comienzan con los valores de inicialización.
4. Publicar manualmente una versión y recopilar las fuentes. Si hay una cola de la versión anterior en curso, terminarla antes de actualizar o esperar al siguiente ciclo: el nuevo catálogo cambia las URLs de búsqueda.

Si ya existe una pestaña `Suscripciones` de la versión con selecciones por días, antes de inicializar cambia la cabecera de la columna E de `dias` a `periodicidad` y sus valores a `monthly`, `weekly` o `daily` (mensual por defecto). Se conservan IDs, correos, nombres, filtros, estado y fechas. El código no mantiene una segunda estructura ni lectura retrocompatible. `initializeConfiguration` incorpora los nuevos ajustes y retira ajustes operativos obsoletos, conservando los valores vigentes.

Para activar el envío después de tu despliegue manual:

1. En Gmail de **felix.delbarrio@bbva.com**, añadir **news-radar.group@bbva.com** en **Cuentas → Enviar como** y completar la verificación recibida en el grupo. El propietario debe poder recibir esa verificación y estar autorizado por Workspace para usar la dirección. Crear el grupo por sí solo no crea el alias de envío.
2. Habilitar **Gmail API** en el proyecto de Google Cloud asociado a Apps Script si no está habilitada. No se necesitan claves API ni cuentas de servicio.
3. Ejecutar `initializeConfiguration` desde el editor para crear únicamente los ajustes ausentes, conservando los valores configurados. El remitente, nombre visible, límite en 24 horas y URL publicada se guardan en **Configuracion → settings** y se editan desde Administración → Configuración de negocio.
4. Ejecutar `getNewsletterDeliveryStatus` desde el editor y autorizar los nuevos scopes con la cuenta propietaria. Comprobar `available: true`. En la aplicación, Administración → Suscripciones ofrece **Comprobar remitente**, **Enviar prueba a mi correo** (solo al administrador, con los criterios iniciales y la ventana reciente configurada) y **Programar entrega diaria**. El resultado se muestra en el propio panel, con destinatario, período, cantidad de novedades y Gmail ID. También se muestra el último intento y los tres requisitos: remitente verificado, entrega activada y programación instalada. **Procesar pendientes** ejecuta las entregas que ya han vencido; no adelanta la primera entrega de una suscripción nueva. Las pruebas aceptadas o inciertas se registran en `NewsletterEnvios` y consumen presupuesto.
5. Instalar la programación y activar **Activar entrega de newsletters** en Configuración de negocio → Operación y selección inicial → Newsletter. La entrega permanece desactivada inicialmente. Mantener la WebApp **ejecutada como propietario** y con acceso **dominio bbva.com**, según el manifiesto; los lectores no autorizan acceso a sus buzones.

Se sustituye `script.send_mail` por **`gmail.send`** (envío) y **`gmail.settings.basic`** (comprobación del alias). Son seis scopes en total; no se solicitan lectura de mensajes, modificación del buzón, acceso completo a Gmail ni administración del dominio. El código consulta únicamente el alias configurado y no crea ni modifica ajustes de Gmail. [Envío Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending) · [Comprobación de alias y permisos](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/get).

La vista local identifica el remitente configurado, pero no simula que esté verificado ni envía correos. No se ha enviado ningún correo ni modificado producción durante el desarrollo local.

Implementar como **Yo (felix.delbarrio@bbva.com)** y permitir **usuarios de bbva.com**. Las seis autorizaciones del propietario son Sheets, peticiones externas, activadores, identidad de correo, envío Gmail y ajustes básicos Gmail para verificar el alias. No se añaden lectura de mensajes, Drive ni Directory. La hoja y el proyecto permanecen privados. Si Google Workspace oculta el correo activo, el servidor deniega acceso; no lo sustituye por el del propietario.

El administrador es exclusivamente `OWNER_EMAIL`. Auditoría, fuentes, hoja y métricas requieren autorización en el servidor además de ocultarse en la interfaz.

## Telemetría y adopción

Adopción almacena correo obtenido en el servidor, fecha, sesión, tipo de evento, vista y duración. No almacena términos de búsqueda ni contenido de formularios. Solo el administrador ve correos y agregaciones. Conservación máxima 90 días y 20.000 eventos, con limpieza diaria y tope por escritura. DAU/WAU/MAU son ventanas móviles 24 horas / 7 / 30 días; incluye al administrador. No se calcula porcentaje del dominio porque no se solicita acceso a Directory.

Telemetría registra duración y resultado de recopilación y p95 de cargas observado por el navegador. p95 incluye red y servidor. Los errores de cliente son eventos recibidos, no una medida de todos los fallos posibles.

Los cambios de perfiles, estilos y cálculo se hacen en su fuente única y se distribuyen con el build. La recopilación usa persistencia entre lotes y bloqueos de concurrencia; el HTML incrusta únicamente las fuentes tipográficas necesarias y los dos logos con transparencia.

## Interfaz 1.1.0

Todas las vistas comparten la rejilla de 8 px, gutters de 24 px (16 px en móvil), Benton Sans para lectura y controles y Tiempos para titulares. Los colores, dimensiones, tipografía y transiciones proceden de `src/design/tokens.json`. Los seis iconos SVG utilizados provienen del paquete BBVA Experience aportado por el usuario. La versión del pie se genera desde `RADAR.version` en Config.gs.

La navegación principal permanece arriba en escritorio y abajo en móvil; los filtros por vista están en la columna lateral o en un diálogo móvil. Administración tiene navegación interna, catálogos desplegables, ajustes agrupados y búsqueda/paginación de fuentes que conserva cambios pendientes. El renderizado de suscripciones y la tabla de fuentes tienen módulos propios; los gráficos utilizan las agregaciones existentes.

`PREVIEW_ADMIN=1 make run` permite revisar todas las secciones en local. Adopción y latencia usan los eventos reales de la sesión local, conservados en memoria hasta recargar; no muestran estadísticas de producción. Las pruebas de correo en local muestran un mensaje explícito y no envían emails. Los errores de Gmail y los estados de entrega se prueban con respuestas simuladas; la recepción real debe comprobarse tras publicar en Apps Script.


Los filtros administrativos comparten componente, normalización, validación de fechas y paginación. Auditoría filtra antes de paginar el histórico disponible (hasta `eventLimit`); Adopción recalcula indicadores, usuarios y actividad diaria con los mismos filtros. Fechas y agrupación diaria utilizan la zona horaria de negocio. Suscripciones, catálogo de Fuentes, últimas ejecuciones, historial de newsletters y Telemetría disponen de búsqueda y filtros específicos. Los filtros locales no añaden llamadas al servidor; las listas remotas devuelven solo la página solicitada y explicitan los límites del histórico visible. Las consultas de historial y suscripciones omiten la columna de huellas para reducir transferencia y memoria.

## Cobertura obligatoria

`make coverage` ejecuta todas las pruebas e instrumenta todos los archivos JavaScript y Apps Script de `src/`, incluidos los no ejecutados. Se exige **más del 80 %** global en líneas, sentencias, funciones y ramas; un 80 % exacto falla. La instrumentación solo se carga al medir cobertura y no forma parte de `dist/` ni del servidor local. El informe HTML, LCOV y resumen JSON se generan en `output/coverage/`.

`make verify` incluye este umbral. El check existente **Integrity and tests** falla si falla cualquier prueba o categoría de cobertura; GitHub conserva el informe como artefacto también cuando el umbral falla. Las protecciones de rama deben mantener este check como obligatorio.

El servidor se valida con un analizador de sintaxis limitado a ES2020, tanto al compilar como en `make check`. Esto impide introducir operadores como `||=`, `&&=` y `??=` en los archivos `.gs`, aunque Node.js los acepte. El cliente se ejecuta en el navegador y conserva su propia validación.

Noticias y Novedades identifican el editor con «Medio» en los metadatos de cada tarjeta. Una consulta RSS de perfil no sustituye el nombre del editor; si no se informa, se muestra «No indicado». La release 1.3.0 calcula únicamente la visualización de la vista solicitada y utiliza claves de caché de tamaño fijo, con invalidación por cambios en noticias o configuración. El análisis de aquel export está en [docs/telemetry-1.3.0.md](docs/telemetry-1.3.0.md).


### Idiomas (1.4.0)

La interfaz soporta español, inglés y turco. Lee `navigator.languages` (o `navigator.language`), escoge la primera preferencia compatible y usa español si no hay ninguna. No solicita permisos ni consulta el sistema operativo ni servicios externos. El catálogo único de traducciones y formatos está en `src/shared/locales.js`; los valores de filtros, catálogos y registros mantienen sus identificadores. Titulares, extractos, nombres de newsletters, correos y URLs se conservan en su forma original.

Administración permite probar otro idioma mediante **Administración → Idioma → Idioma de prueba**. La elección se guarda únicamente en `sessionStorage`, se aplica inmediatamente sin recargar y termina al cerrar la pestaña. No cambia la configuración de Sheets ni otras sesiones. La opción **Idioma del navegador** restaura la detección.

Cada suscripción almacena `idioma` (`es`, `en`, `tr`). Las altas personales parten del idioma activo y las administrativas de español; el formulario permite elegirlo. Las ediciones conservan el idioma guardado. La newsletter real y la prueba de una suscripción usan ese idioma en HTML y texto; la prueba general del administrador usa español. Los artículos mantienen su idioma original. Las fuentes conservan su edición lingüística, con términos de búsqueda y clasificación en los tres idiomas, sin triplicar consultas por cambiar la interfaz.

Al actualizar una instalación existente, ejecutar **initializeConfiguration** una vez desde el editor con la cuenta administradora: prepara las columnas de idioma y asigna español a suscripciones sin idioma. Ejecutar también **initializeLanguages** para añadir el RSS oficial inglés y ampliar los términos de búsqueda y detección, conservando entradas propias y fuentes desactivadas. Después publicar la nueva distribución `dist/`. Las noticias y el inventario de entregas permanecen intactos.

`make kill` usa un socket Unix privado (`output/preview-server.sock`, permisos `0600`). No lee credenciales o destinos de un archivo, no realiza peticiones HTTP y no envía señales a PID externos. `make run` sigue sirviendo la aplicación por HTTP local.

### Recarga progresiva y gráficos (1.5.0)

Radar apila evolución y publicaciones por medio; las ejecuciones tienen una pestaña administrativa con filtros y paginación. La recuperación anual prioriza semanas recientes y amplía el lote configurado cuatro veces, hasta veinte consultas; con el valor predeterminado son doce. Cada lote persiste sus resultados. El navegador consulta el progreso mientras haya trabajo y la pestaña sea visible, y refresca las noticias solo cuando cambia su revisión. «Continuar recuperación» conserva el período y las tareas del ciclo activo.

Al instalar, ejecutar `initializeConfiguration` antes de publicar: añade y rellena la prioridad de la cola existente sin reiniciarla. El diagnóstico de la telemetría y los límites de la mejora están en [docs/telemetry-1.5.0.md](docs/telemetry-1.5.0.md).

## Recargas y traducciones · 1.6.0

La diaria y la anual conservan sus propias solicitudes, progreso y pausas. El trabajador ejecuta un lote de un solo ciclo, con prioridad para la diaria. Administración → Ejecuciones muestra una barra por ciclo y permite filtrar su historial. «Recuperar noticias» inicia el período seleccionado; «Continuar recuperación» reanuda el trabajo pendiente.

Noticias y Novedades traducen titulares y extractos al idioma activo (español, inglés o turco), conservan el original y reutilizan traducciones persistidas. La vista local muestra el original porque no dispone de LanguageApp.

Para actualizar una instalación, copiar `dist/`, ejecutar `initializeConfiguration` y publicar la nueva versión de la WebApp. La inicialización conserva la cola anual existente y crea las hojas Recargas y Traducciones. Véase [funcionamiento y validación](docs/collections-and-translations-1.6.0.md).

## Traducción nocturna y coherencia del Radar · 1.7.0

Administración separa Fuentes, Ejecuciones e Idioma. Esta última sección permite probar un idioma para toda la aplicación durante la sesión de la pestaña, consultar el progreso de traducción, activar o desactivar su programación y solicitar las pendientes. La inicialización instala el horario de las 02:00 en la zona configurada; Apps Script puede ejecutarlo con un margen de quince minutos.

Las tarjetas de Noticias y Novedades solo consultan traducciones persistidas. El trabajador nocturno barre desde las noticias más recientes, guarda su cursor y continúa por lotes, con pausas ante errores y un presupuesto diario. La recuperación anual y la diaria conservan sus colas. Si falta una traducción, se presenta el original con su indicación.

Todos los gráficos del Radar parten de la misma selección por entidad y segmento. El ranking de entidades cuenta noticias sobre cada entidad; el de medios cuenta publicaciones de cada editor. «Explorar noticias» y el mapa llevan al listado conservando esa selección, sin imponer el período inicial de otra vista.

Para actualizar: copiar `dist/`, ejecutar `initializeConfiguration` y publicar la WebApp. No se elimina la recuperación anual que siga pendiente. Véase [detalle técnico y validación](docs/language-and-radar-1.7.0.md).

## Ejecuciones y prioridad diaria · 1.8.0

«Abrir hoja» pertenece a Fuentes. Ejecuciones reúne recuperar noticias, continuar, reintentar fallos y activar la recopilación diaria. La selección Diaria/Anual y el lanzamiento se deshabilitan por tipo mientras haya solicitudes o recuperaciones activas; el servidor comprueba la misma disponibilidad sin depender de la pantalla.

Los lanzamientos manuales y programados utilizan las mismas solicitudes y un único trabajador `backgroundTick_`, protegido por ScriptLock. Cada turno procesa un solo ciclo: diaria primero; si no tiene tareas listas, histórico y traducciones alternan. La diaria usa siempre la ventana reciente configurada. Las traducciones ceden entre llamadas cuando llega una solicitud diaria; una petición externa ya iniciada termina antes del siguiente turno. Los reintentos despiertan al vencer su espera, sin consultas periódicas durante la pausa ni activadores permanentes ociosos.

La programación registra `dailyRadar_` a la hora configurada y `nightlyTranslations_` a las 02:00, ambos en la zona horaria de negocio. Cambiar la configuración actualiza los horarios y respeta las programaciones desactivadas. Estos activadores registran solicitudes para el trabajador compartido.

Para actualizar la instalación: copiar `dist/`, ejecutar `initializeConfiguration` y publicar la nueva versión de la WebApp. La inicialización retira los activadores de continuación antiguos, conserva la cola y sus resultados y recompone los horarios habilitados. Véase [validación y funcionamiento](docs/background-priority-1.8.0.md).

## Rendimiento de consultas y recuperación · 1.9.0

Las tarjetas consultan la caché de traducciones con una sola lectura por página y agrupan las filas persistidas contiguas. Las traducciones ausentes se recuerdan durante la ejecución para evitar consultar de nuevo las mismas noticias en Noticias y Novedades. Cada entrada respeta el límite de tamaño de caché; la pantalla conserva el original si la traducción sigue pendiente.

El trabajador compartido procesa hasta tres lotes por despertar, con un presupuesto de 45 segundos para iniciar trabajo nuevo. Cada lote persiste resultados; entre lotes se revisan las nuevas solicitudes y se mantiene la prioridad diaria. Las traducciones reciben el tiempo restante del turno. Una llamada externa iniciada puede terminar después de ese presupuesto. La espera de reintentos y la programación sin trabajadores ociosos se mantienen.

Copiar `dist/` y publicar la nueva versión aplica estas mejoras conservando tareas y progreso. Véase [análisis de la telemetría y validación](docs/telemetry-1.9.0.md).

## Colores de la newsletter · 1.9.1

La plantilla declara `color-scheme: light only` en la cabecera HTML para impedir la inversión automática de Gmail en cuentas Google Workspace. El hero conserva su azul corporativo mediante el token de diseño existente y un fondo de gradiente uniforme; `newsletter.css` mantiene todos los estilos. No se añaden imágenes, solicitudes, JavaScript ni envoltorios de mezcla de colores.

La solución utiliza el [soporte de Gmail incorporado en 2026](https://emailmarkup.org/en/blog/2026/gmail-app-dark-mode-update). La validación local comprueba el HTML generado y la apariencia en modos claro y oscuro, pero no sustituye una apertura real en Gmail para iPhone. Copiar `dist/` y publicar la WebApp aplica la corrección a los próximos envíos; los correos enviados conservan su HTML original.

## Cambio de idioma sin recarga · 1.9.2

El selector de Administración → Idioma actualiza la interfaz dentro del documento abierto. Se elimina `window.location.reload()`, que podía vaciar el documento embebido de Apps Script. Se conservan la sección activa, los filtros y los borradores sin guardar; la preferencia sigue limitada a `sessionStorage` de la pestaña.

La localización conserva los literales originales con referencias débiles a sus nodos, permite cambios consecutivos entre español, inglés y turco y solo modifica valores que han cambiado. Los diccionarios y sus patrones se reutilizan por idioma. Al cambiar de idioma se actualizan las consultas del contenido y el formato de fechas, sin reconstruir los formularios administrativos.

Validación: pruebas del cambio repetido con documentos y borradores conservados, y navegador en iframe con recarga reproducida como página en blanco y cambios de idioma posteriores sin navegación. Para actualizar, copiar `dist/` y publicar la WebApp; no requiere inicializar Sheets ni alterar trabajos pendientes.

## Literales completos en inglés y turco · 1.9.3

Se completan las frases del Radar y se traducen mensajes con cifras mediante plantillas del diccionario compartido. Las plantillas permiten cambiar el orden gramatical sin modificar nombres, correos, URLs ni valores de configuración. Los patrones se compilan una vez por idioma y se reutilizan. El nombre «News Radar» se conserva durante los cambios de idioma, y las fechas del gráfico utilizan el idioma actual.

Las pruebas exigen entradas completas para los textos estáticos, las frases del cliente y servidor y las etiquetas administrativas; una traducción parcial ya no cumple ese control. También comprueban mensajes interpolados y cambios desde español a inglés y turco con contenido en las pantallas. Copiar `dist/` y publicar la WebApp aplica la corrección.

## Navegación inicial · 1.9.4

El orden es Novedades, Noticias, Radar, Newsletter y Administración. Novedades se abre por defecto y la consulta inicial solicita únicamente esa vista. Administración permanece visible solo para administradores. El orden y la vista inicial del cliente se obtienen del catálogo de navegación compartido.

## Lectura coherente e inteligencia de taxonomía · 1.15.0

Los nuevos correos enlazan su edición privada: Novedades y Noticias mantienen exactamente las noticias enviadas, las etiquetas y el período, aunque luego cambien las preferencias, la taxonomía o el inventario de Noticias. Los filtros refinan esa edición; Volver a la actualidad, limpiar filtros o quitar el período abandona su contexto. El botón no modifica las suscripciones. La misma agrupación BBVA primero y resto por cantidad de novedades se aplica al correo y a Novedades.

Mi selección permite elegir una suscripción activa o el ámbito predeterminado. La elección se guarda por usuario en un único RPC que también devuelve el dashboard. La entrada directa comienza por la primera suscripción activa, en orden de creación. Sin suscripciones activas se conservan los valores predeterminados. Cambiar temporalmente los filtros no cambia preferencias ni los correos recibidos.

Radar muestra un mapa de calor interactivo por entidad o geografía, palanca o subpalanca, con números absolutos o porcentaje de noticias del grupo. Cada celda abre Noticias con la selección y fechas conservadas; el mapa informa también de las noticias sin catalogar. Agrupación, medida y paginación se resuelven en el cliente, sin nuevas consultas. La escala usa los tokens comunes y el DOM se mantiene acotado.

Tras desplegar, ejecutar `initializeConfiguration` para crear **Preferencias**, **NewsletterEdiciones** y **NewsletterContenido**. Los enlaces genéricos de correos enviados antes de esta versión no identifican una edición; la continuidad archivada se aplica a los nuevos envíos. Véase [el análisis de telemetría y validación](docs/telemetry-1.15.0.md).

## Novedades y newsletter por defecto · 1.15.1

Novedades abre con **Empresas e instituciones** y **últimos 7 días**, incluido el día actual, sin limitar entidad, geografía, tema ni cobertura. Canal digital permanece como filtro opcional. Las nuevas newsletters y la prueba del administrador utilizan el mismo segmento y ventana temporal. Las preferencias guardadas explícitamente, las suscripciones editadas y las ediciones históricas conservan su selección.

Se elimina la elección implícita de la última suscripción activa, que podía restringir Novedades sin intervención del usuario. Esta corrección no cambia las preferencias de recepción ya guardadas. Publicar `dist/` aplica el cambio; no requiere nuevas hojas ni activadores. El diagnóstico de la exportación del 12/10/2026 a las 13:49 UTC está en [el informe de telemetría](docs/telemetry-1.15.1.md).

## Entrada directa por primera newsletter · 1.15.2

Al abrir la aplicación directamente, Novedades utiliza los filtros de la primera newsletter activa del usuario, según el orden de alta, y los últimos siete días. Editar una newsletter no modifica ese orden. Sin newsletters activas se aplican Empresas e instituciones y los últimos siete días. La elección manual de otra newsletter se conserva durante la navegación de la sesión; una nueva entrada directa comienza de nuevo por la primera. Abrir desde un correo conserva la edición enviada y su periodo histórico.

La resolución reutiliza la caché privada de suscripciones y evita ordenar por fecha de edición o leer preferencias guardadas en la entrada directa. Publicar `dist/` aplica el cambio, sin nuevas hojas ni activadores.

## Segmento empresarial sin tema duplicado · 1.15.3

La selección empresarial de una newsletter utiliza Segmento: Empresas e instituciones sin añadir Tema: Empresas y pymes. La regla se comparte al leer y guardar suscripciones, por lo que Novedades deja de heredar ese tema redundante al abrir con la primera newsletter. Se conserva la última semana y los demás criterios configurados. No se eliminan otros temas específicos ni se modifica el contenido o los filtros de ediciones ya enviadas.

La normalización no reescribe las suscripciones existentes ni reclasifica noticias; no añade consultas ni jobs. Publicar `dist/` aplica la corrección sin cambios de esquema.

## Noticias únicas en vistas y mapa de calor · 1.15.4

Noticias, Novedades, Radar, mapa de calor, CSV y nuevas newsletters cuentan una sola vez las noticias repetidas. La selección deduplica antes de paginar y agregar, por URL canónica o titular largo normalizado de la misma entidad y país en una ventana de dos días. Se unifican alias de entidad, espacios, acentos y puntuación, y se retira el sufijo del editor si está identificado en el registro. No se utilizan comparaciones difusas ni traducciones para decidir equivalencia. Se conservan cifras distintas, otros países y repeticiones distantes.

La misma identidad se utiliza al recuperar noticias, con un índice por día de coste acotado. Si existen varias copias se conserva un representante determinista, priorizando extracto completo y enlace directo. El filtro de fuente se aplica antes de deduplicar, de modo que se puede consultar cada medio. Los registros originales y los envíos archivados no se borran; las vistas dejan de sumar copias ya guardadas tras publicar `dist/`. No se añade ningún job ni se requiere limpiar Sheets.

Validación de 1.15.4: 244 pruebas superadas y cobertura de líneas 96,52 %. La regresión con ocho copias del titular de Santander verifica una noticia y una contribución por categoría en el mapa, además de CSV, newsletter y consulta de fuentes individuales.

## Períodos por vista y newsletter · 1.16.0

Novedades comienza en los últimos siete días; la primera newsletter activa puede elegir ese período, el mes o el año en curso. Noticias comienza en el mes en curso y Radar en el año en curso, también con una selección personalizada. Los filtros editados y las ediciones históricas conservan sus fechas. Los rangos se calculan en la zona de negocio y se comparten entre consultas y envíos.

El asunto se genera exclusivamente con los filtros aplicados y el prefijo `[bIA]`, en el idioma de la newsletter. El formulario permite configurar período, idioma, periodicidad y filtros, sin campo de nombre o asunto. Se elimina la configuración obsoleta de nombre inicial. «Mi selección» se integra en el panel lateral de filtros y aparece con más de una newsletter activa; el contexto de una edición enviada mantiene el período y la opción de volver a la actualidad. En móvil viaja con los filtros al diálogo existente.

Los envíos preparan una única vez el corpus del intervalo necesario para las suscripciones pendientes, reutilizan las selecciones iguales y mantienen la prioridad de recuperación diaria y el control de duplicados.

Validación de 1.16.0: 251 pruebas superadas, cobertura de líneas del 96,55 %, comprobaciones de sintaxis y distribución reproducible. Chrome verifica rangos por vista, asuntos derivados de filtros, selector lateral y diálogo móvil sin desbordamiento.

## Novedades por geografía y newsletter editorial · 1.17.0

Novedades presenta una pestaña por geografía con resultados y conserva la selección mientras siga disponible. Las pestañas cambian tarjetas, recuentos y señales en memoria, sin RPC. Los filtros efectivos se aplican antes de agrupar y deduplicar. El límite del briefing se aplica por geografía en esta vista para que un mercado mayoritario no oculte otros; los indicadores muestran la población completa de la geografía y avisan cuando las tarjetas están limitadas. Seleccionar una señal aplica también la geografía activa. Las pestañas admiten flechas, Inicio y Fin y anuncian el panel seleccionado.

La newsletter mantiene su límite total y muestra KPIs calculados exclusivamente sobre las noticias incluidas en el correo. Su maquetación incorpora cabecera con período, tarjetas de indicadores, resumen de geografías y capítulos por geografía, entidad y combinación de segmentos. Cada noticia aparece una vez, incluso con varios segmentos. BBVA encabeza cada geografía y las demás entidades se ordenan por volumen y nombre. Las palancas y subpalancas se muestran en las noticias. El correo conserva los enlaces a su edición, gestión y baja, y dispone de texto plano con la misma estructura.

Los cálculos y agrupaciones se comparten entre Apps Script y cliente. El CSS utiliza los tokens existentes; tarjetas, tablas, etiquetas y jerarquías llevan estilos inline para correo. No se añaden jobs ni consultas al cambiar de pestaña.

Validación de 1.17.0: 257 pruebas superadas, cobertura de líneas del 96,48 %, sintaxis y distribución reproducible verificadas. Chrome valida pestañas y teclado, indicadores por mercado y maquetación de newsletter en escritorio y móvil sin desbordamiento. Vista previa local en `output/newsletter-preview.html` y `output/newsletter-preview.png`, con contenido de la instantánea RSS.


## Newsletter por periodicidad y Noticias por geografía · 1.18.0

Se elimina Período del contenido. Periodicidad determina conjuntamente el ámbito y las fechas: semanal presenta Novedades, mensual presenta Noticias y anual presenta Radar. El asunto `[bIA]` continúa generándose con los filtros y fechas de la selección, sin campo editable. Los cierres reales usan períodos completos; las pruebas usan el período actual.

Las newsletters semanal y mensual muestran una noticia por geografía, elegida de la palanca con más noticias en ese país y período. Cada noticia cuenta una vez por palanca, sumando entidades y subpalancas. Los empates de palanca se resuelven alfabéticamente y el destacado es el más reciente; a igual fecha se prioriza BBVA, después el nombre de entidad y el ID. Si no hay taxonomía se muestra Sin clasificar. Los KPI y la edición guardada conservan toda la evidencia; el registro de entrega identifica los destacados comunicados. «Ver más · N noticias» abre la selección de ese país en Novedades o Noticias, según la periodicidad, conservando edición y período y sin restringirla a la entidad destacada.

La anual presenta cobertura, entidad con mayor presencia, evolución trimestral y hasta cinco categorías dominantes por entidad/geografía, con enlaces a Radar que conservan la entidad, geografía y edición. HTML y texto plano se generan en español, inglés y turco a partir del mismo modelo. Los resúmenes analíticos incluyen noticias de sus períodos ya enviadas semanalmente, para evitar sesgos en sus KPIs.

Noticias incorpora pestañas solo para geografías con resultados, contadores y paginación independiente. La consulta mantiene los filtros comunes y envía solo una página; exportar descarga la geografía activa. Comparte el componente accesible de pestañas con Novedades, incluyendo teclado y foco.

Para actualizar, copiar `dist/`, ejecutar `initializeConfiguration` y publicar la WebApp. La inicialización elimina claves ajenas a los filtros de suscripciones y normaliza periodicidades fuera del catálogo a semanal; mantiene fechas de actualización y ediciones archivadas. La recuperación diaria continúa siendo prioritaria antes de preparar el corpus y entre destinatarios.

Los enlaces al contenido de la newsletter incluyen su edición y ámbito: semanal abre Novedades, mensual abre Noticias y anual abre Radar. Los enlaces por entidad/geografía conservan ese ámbito y añaden sus filtros al período archivado. Navegar entre vistas mantiene la edición; «Ver actualidad» abandona el archivo y recupera las fechas actuales de la vista.

Validación de 1.18.0: 268 pruebas superadas; cobertura de líneas 96,81 %. Verificadas sintaxis, diseño y distribución reproducible. Chrome comprueba las tres plantillas en escritorio y móvil sin desbordamiento, pestañas y teclado, y el destino de los enlaces. Las vistas previas de `output/newsletter-monthly.html` y `output/newsletter-yearly.html` utilizan datos de demostración.

## 1.19.0 — Cobertura inicial y geografías

Novedades, Noticias, Radar y las nuevas newsletters comparten los valores iniciales Empresas e instituciones y Canal digital. Cobertura se puede cambiar a Generalista o Todos; guardar, editar y consultar una newsletter conserva esa elección explícita. El asunto generado incluye la cobertura aplicada.

Las pestañas de Novedades y Noticias se ordenan alfabéticamente y muestran Transversal al final. El correo utiliza el mismo orden y nombre. La clave de datos «Sin determinar» se conserva en las selecciones y enlaces para mantener el contexto de las ediciones enviadas.

Tras copiar `dist/`, ejecutar `initializeConfiguration` y publicar la WebApp. La inicialización incorpora Canal digital a las suscripciones sin cobertura definida y conserva las selecciones explícitas, sin modificar ediciones archivadas.

Validación: 273 pruebas superadas; cobertura de líneas 96,82 %. Sintaxis y distribución reproducible verificadas. Chrome comprueba los valores iniciales de las tres vistas, la cobertura editable en Radar, la persistencia de Todos en newsletters y la maquetación móvil sin desbordamiento.

## 1.20.0 — Identidad visual y Radar móvil

Las tarjetas de Noticias y Novedades muestran un logo de entidad y una bandera discretos en la esquina superior derecha. Pestañas geográficas, ranking y mapa de calor, suscripciones y fuentes comparten la misma identidad. Las newsletters utilizan los mismos recursos en tarjetas y encabezados geográficos y de entidad. Transversal conserva su nombre y no recibe una bandera; una entidad añadida sin logo utiliza un monograma accesible.

Los 38 logos y las 7 banderas actuales están en `assets/identity/`, con procedencia en `manifest.json`. El catálogo completo pesa 62.754 bytes en PNG. El build incorpora recursos y dimensiones al cliente y a Apps Script; no hay consultas externas para mostrarlos. Un único renderizador y los tokens de identidad fijan tamaños y proporciones. Las imágenes del cliente usan carga diferida; cada correo integra una sola copia de cada recurso utilizado mediante CID, además de bIA.

Radar utiliza columnas que pueden reducirse al ancho disponible. En móvil, el mapa de calor presenta grupos y categorías verticalmente, conservando recuentos, porcentajes, paginación y enlaces a la evidencia. Los nombres largos se ajustan dentro de sus tarjetas y rankings. Las cabeceras geográficas y los trimestres del correo también caben en pantallas estrechas.

Para publicar, copiar todos los archivos de `dist/` a Apps Script, incluidos `IdentityAssets.gs` y `VisualIdentity.gs`, y actualizar el despliegue de la WebApp. No requiere permisos, activadores ni cambios de datos adicionales.

Validación de 1.20.0: 276 pruebas superadas; cobertura de líneas 96,83 %. Sintaxis, diseño y distribución reproducible verificados. Chrome comprueba Radar entre 320 y 1.440 píxeles con diez categorías y nombres largos, el mapa de calor vertical, tarjetas móviles y las tres newsletters entre 320 y 800 píxeles, sin desbordamiento. El contenido y las capturas de `output/identity-newsletter-*.html` y `output/radar-identity-mobile.png` son datos de demostración. Las pruebas de MIME verifican que todos los CID tienen exactamente un adjunto, sin envíos de correo reales.

## 1.21.0 — Noticias por entidad y prioridad visual del Radar

Noticias mantiene las pestañas por país y presenta las entidades en bloques identificados por su nombre y logo. BBVA aparece primero; el resto se ordena por número de noticias de la selección y, en caso de empate, alfabéticamente. Dentro de cada entidad las fechas van de más reciente a más antigua. El orden se calcula antes de paginar, compartiendo el criterio con Novedades. Transversal conserva la última posición.

El mapa de calor de canales digitales ocupa la primera sección después de los KPI, antes de Presencia geográfica. Se evita construir tarjetas de Noticias ocultas en otras vistas y se reutiliza el estado de programación diaria con invalidación inmediata desde los controles de administración. El trabajador compartido conserva sus consultas directas y la prioridad de recuperación diaria.

El [análisis de telemetría](docs/telemetry-1.21.0.md) documenta la línea base, los cambios y los límites de la muestra. La mejora de latencia real deberá contrastarse con nueva telemetría tras publicar.

Validación de 1.21.0: 282 pruebas superadas; cobertura de líneas 96,86 %. Chrome verifica el orden visual del Radar y ausencia de desplazamiento horizontal entre 320 y 1.440 píxeles. Distribución reproducible y controles de sintaxis y diseño verificados. Versión preparada para publicación.


## 1.22.0 — Newsletters de lectura breve

Novedades y Noticias incluyen como máximo una tarjeta por país, representativa de la palanca más frecuente en la selección. El diseño elimina el índice repetido y los bloques por entidad; muestra la palanca, el titular, identidad visual, extracto de hasta 240 caracteres y un botón «Ver más» con el volumen restante. Las geografías con un único artículo no generan un enlace sobrante. Los KPI siguen midiendo toda la evidencia, que se guarda para mantener el contexto de lectura de la edición.

El ranking se calcula una vez y la selección y el recorte del extracto están centralizados para HTML y texto plano. Las categorías acumulan contadores y un único representante en lugar de listas repetidas de artículos. La newsletter anual conserva el resumen de Radar.

Validación de 1.22.0: 285 pruebas superadas; cobertura de líneas 96,87 %. Chrome verifica una tarjeta por geografía en las dos newsletters, el diseño de las tres periodicidades entre 320 y 800 píxeles y ausencia de desplazamiento horizontal en Radar entre 320 y 1.440 píxeles. Vista de demostración en `output/identity-newsletter-news.html` y captura del bloque en `output/newsletter-compact-country.png`. Sin envíos reales ni publicación del despliegue.


## 1.22.1 — Bloques de entidad en Noticias

Noticias presenta cada entidad en una sección identificada por su nombre y logo. Dentro del país activo, BBVA aparece primero y el resto de entidades sigue el orden alfabético, sin usar el número de noticias como prioridad. Cada grupo conserva las fechas descendentes y la paginación se aplica después del agrupado. Novedades mantiene su criterio de volumen previamente configurado; los dos comparadores comparten la prioridad de BBVA y el desempate alfabético.

La telemetría `news-radar-telemetria (2).json`, exportada el 12 de octubre, corresponde a 1.22.0 e incluye siete cargas de esa versión. La mediana de RPC es de 6.325 ms, servidor 2.078 ms y renderizado 13 ms. Ninguno de esos dashboards reutiliza la caché de contenido. Los tiempos no permiten deducir el orden de los titulares ni atribuir un error de presentación al transporte. El cambio corrige el criterio por volumen que seguía vigente y hace explícitos los bloques en el DOM. La nueva versión renueva las claves de caché existentes.

Validación de 1.22.1: 286 pruebas superadas y cobertura de líneas del 96,87 %. Se comprueban entidades con volúmenes diferentes, fechas mezcladas, continuidad de paginación y bloques visibles. Chrome verifica BBVA → Qonto → Santander con más noticias de Santander, el agrupado móvil y ausencia de desbordamiento horizontal. Sintaxis, diseño y distribución reproducible comprobados.
