# Iteración 20 · 3.19.0

La navegación de Administración separa la operación diaria de los históricos. **Panel de control** reúne horarios, estado de procesos, avance de recopilación, clasificación, traducción, catálogo, mantenimiento y entregas. **Logs** ofrece siete vistas de actividad con filtros, indicadores, paginación de 10 filas y exportación CSV de la selección completa. Adopción muestra indicadores y gráfico; Feedback conserva un único bloque de indicadores, filtros, exportación y acceso a la edición enviada. Las suscripciones sitúan el remitente y las pruebas antes de la lista de equipos. El idioma solo se elige desde la cabecera. La URL del catálogo global se configura en Configuración.

Novedades selecciona y presenta los artículos por `fecha` de publicación descendente, con una clave estable para desempates, dentro de cada geografía. El límite se aplica después de ordenar; la vista Noticias conserva su criterio anterior. El comparador compartido en `src/shared/novelty-groups.js` se utiliza en servidor y cliente.

La recopilación de cada turno solicita clasificación y traducción en la cola de fondo, incluso si una instalación antigua había desactivado la traducción. La inicialización elimina esa preferencia obsoleta. El envío programado de newsletters mantiene su propia preparación de traducciones y espera a las etapas de recopilación/publicación que ya requería.

El diseño móvil de Radar adapta las incidencias y la cronología a columnas disponibles sin perder sus estados. Los nuevos estados operativos y los enlaces de Feedback reutilizan los tokens y estilos compartidos.

Validación local: `npm run verify`, `npm run check:dist`, pruebas específicas de ordenación, logs, cola diaria y vistas; inspección visual móvil en el servidor local de vista previa. La vista previa usa datos simulados; la comprobación de activadores y envíos reales requiere la instalación de Apps Script.

La versión 105 del despliegue web activo de Apps Script se actualizó desde el editor corporativo tras comparar los 18 módulos cambiados con `dist/` y retirar `Records.gs`. Se comprobó en la URL de producción que Novedades presenta fechas descendentes entre entidades, que Panel de control muestra los procesos reales y que Logs y Feedback cargan registros. La versión 105 también muestra la periodicidad de Feedback con la etiqueta localizada. GitFlow, CodeQL y CI de la primera revisión de la PR #70 terminaron correctamente; la revisión final requiere ejecutar de nuevo estos controles. Los envíos de correo no se dispararon durante esta validación.
