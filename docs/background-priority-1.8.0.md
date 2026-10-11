# Ejecuciones y prioridad diaria · 1.8.0

Fuentes contiene Abrir hoja y la edición de fuentes. Ejecuciones reúne los comandos de recuperación, la programación diaria y el progreso. Idioma conserva la programación nocturna y el progreso de traducción.

La disponibilidad de cada recuperación se calcula en `src/shared/recovery-state.js`, a partir de solicitudes pendientes y ciclos activos. El servidor rechaza nuevos lanzamientos del mismo tipo y la interfaz deshabilita su selección y lanzamiento. Una recuperación terminada permite una nueva solicitud, incluso en el mismo día, conservando el historial previo.

## Trabajador y programación

`dailyRadar_` y el lanzamiento manual Diaria registran solicitudes a través de `requestDailyCollection_`, usando la ventana reciente configurada. `nightlyTranslations_` y Traducir pendientes usan `requestTranslations_`. Ambos procesos y el histórico se ejecutan exclusivamente mediante `backgroundTick_`.

Cada turno adquiere ScriptLock y procesa un lote de un solo ciclo. Primero selecciona una diaria con tareas listas. Si no existe, alterna anual y traducción. Una diaria en pausa conserva sus tareas y reintentos; durante la espera pueden avanzar los otros procesos. Las llamadas externas ya iniciadas terminan antes de ceder; las traducciones comprueban nuevas solicitudes diarias entre llamadas y conservan las variantes guardadas y el cursor parcial.

Las solicitudes se persisten antes de intentar adquirir el bloqueo, de modo que la coincidencia con otra ejecución no pierde el día. Los errores de escritura reprograman el trabajador; la siguiente ejecución reconstruye los contadores desde las tareas sin volver a descargar las completadas.

El trabajador usa un activador de una sola ejecución y programa el siguiente turno al vencer la pausa o el reintento. Una solicitud nueva adelanta ese despertar. No se conserva un activador periódico ocioso. La inicialización elimina los handlers de continuación retirados y recompone un único trabajador pendiente.

`dailyRadar_` se programa a la hora de negocio y `nightlyTranslations_` a las 02:00, con `nearMinute(0)` y la zona horaria configurada. Guardar la configuración actualiza ambos horarios y respeta las programaciones desactivadas. Google Apps Script ejecuta estos horarios aproximadamente, con un margen de quince minutos.

## Validación

- `npm run verify`: 167 pruebas, sin fallos. Cobertura: líneas 95,05 %, sentencias 91,36 %, funciones 93,22 % y ramas 85,09 %. CI exige superar el 80 % en las cuatro métricas.
- Pruebas de integración: bloqueo ocupado, solicitudes simultáneas, rechazo de duplicados, nueva diaria tras finalizar, prioridad diaria, alternancia de procesos secundarios, traducción parcial, pausas y actualización de horarios conservando tareas.
- Navegador Chrome local: español, inglés y turco, a 1600 y 390 px. Ubicación exclusiva de comandos y hoja, bloqueo de lanzamientos activos, barras de progreso, traducciones persistidas y aislamiento del idioma por pestaña. Sin errores de JavaScript ni desbordamiento de página.

La programación real de Google no se ejecuta en la vista local. Para activar la actualización en la instalación existente, copiar el paquete generado `dist/`, ejecutar `initializeConfiguration` y publicar una nueva versión de la WebApp. La inicialización conserva la cola anual y sus resultados.
