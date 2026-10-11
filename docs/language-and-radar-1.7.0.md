# Idioma, traducciones y Radar · 1.7.0

## Coherencia del Radar

El Radar calcula indicadores, mapa, evolución, entidades y medios sobre la misma colección filtrada por entidad y segmento. Entidad mencionada y editor son dimensiones distintas: dos noticias sobre BBVA pueden estar publicadas una por BBVA y otra por un editor externo. Es correcto que el ranking de entidades cuente dos y el de medios una para cada editor. El gráfico de medios incluye una explicación y los rankings muestran como máximo seis entradas; su suma puede ser menor que el total de la selección.

«Explorar noticias» y el mapa trasladan la selección del Radar al listado. No aplican al destino el filtro de entidad o el mes predeterminado de Noticias. Al usar directamente el menú Noticias, esa vista conserva sus propios filtros.

## Administración

Fuentes y Ejecuciones sustituyen los nombres anteriores. Ejecuciones muestra una barra global y una por recarga, con sus contadores, incidencias y filtros del historial. Las tareas terminadas incluyen las omitidas o fallidas; una barra completa no implica que todas las fuentes hayan respondido correctamente.

Idioma tiene su propia pestaña. El selector de prueba modifica toda la aplicación en esta sesión de la pestaña del navegador, a través de `sessionStorage`. La elección permanece al recargar y termina al cerrar la pestaña. No cambia otras sesiones, fuentes ni el idioma guardado de suscripciones existentes.

## Traducción nocturna

La inicialización instala un activador diario a las 02:00 de la zona configurada, salvo que el administrador lo haya desactivado. Apps Script aproxima el minuto con un [margen de quince minutos](https://developers.google.com/apps-script/reference/script/clock-trigger-builder). Idioma muestra ese horario y permite activarlo, desactivarlo, solicitar pendientes y consultar el progreso. Desactivar la programación diaria no cancela un trabajo ya solicitado.

Las tarjetas solo leen variantes persistidas en Traducciones. Se retira la API de traducción inmediata y su controlador del navegador. Si falta una variante, la tarjeta muestra el original con su indicación. Los títulos y extractos se traducen a español, inglés y turco; se conserva el original, el medio y el enlace. Clasificación, búsquedas y deduplicación operan sobre los textos originales. Las newsletters conservan los artículos originales; este cambio afecta a las tarjetas.

El trabajador comparte el bloqueo de escritura con la recopilación, pero guarda una solicitud independiente antes de intentar adquirirlo. Si está ocupado, conserva la petición y programa una continuación. No borra ni sustituye la cola anual o diaria. Cada lote lee los identificadores y fechas del universo acotado por `newsReadLimit`, ordena de más reciente a más antiguo y lee textos únicamente del siguiente grupo de candidatos. Conserva un cursor y las traducciones por huella del texto e idioma. Una nueva ejecución diaria vuelve a empezar por lo más reciente y reutiliza las variantes ya existentes antes de avanzar por las anteriores.

Los límites se centralizan en `TRANSLATION_WORK`: cien candidatos por lote, lecturas de veinte artículos cada vez, veinte llamadas nuevas y un presupuesto de 45 segundos entre llamadas. Una llamada individual puede tardar más que ese presupuesto. El límite operativo es de 3.000 intentos por día, independiente de las [cuotas reales de Google](https://developers.google.com/apps-script/guides/services/quotas). Un error conserva lo ya guardado y programa un reintento a los quince minutos. Al alcanzar el límite diario espera al siguiente ciclo; no mantiene un activador despertando cada minuto sin poder trabajar.

Las continuaciones usan activadores de una ejecución y desaparecen al completar el trabajo. Las lecturas del progreso consultan metadatos; no vuelven a contar todos los artículos. El trabajador comprueba las claves persistidas sin leer el texto de variantes ya existentes. La revisión de traducciones forma parte de la clave de caché de las tarjetas para evitar servir una variante anterior tras guardar nuevas traducciones.

## Instalación y validación

Copiar `dist/`, ejecutar `initializeConfiguration` con la cuenta propietaria y publicar la versión 1.7.0. Se conservan noticias, suscripciones, traducciones y tareas de recuperación existentes. La vista local permite comprobar la interfaz, pero no llama a LanguageApp ni instala activadores en Google.

Las pruebas incluyen coherencia de todos los gráficos, traspaso de filtros al listado, lectura de variantes sin llamadas al traductor, caché por idioma, orden reciente, continuaciones y cursores, límites de tiempo y llamadas, recuperación tras errores, bloqueo durante la anual y controles de idioma. La validación del navegador usa respuestas controladas para representar progreso y traducciones; no mide la latencia de Google ni confirma una publicación en producción.
