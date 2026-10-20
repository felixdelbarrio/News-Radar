# Iteración 13 — implementación directa y verificación

Fecha: 20 de octubre de 2026. Release: 3.12.0. Implementación Google Apps Script: versión 90.

Se modificaron 17 archivos directamente en el editor web, sin utilizar clasp. Antes de escribir se contrastaron los módulos con la versión local y se respaldó su contenido en `output/iteration13-live-backup/`. El archivo temporal de diagnóstico se retiró antes de publicar.

## Cambios

- Los identificadores funcionales se conservan en datos, filtros y enlaces; se ocultan al presentar nombres, excepto en Administración > Catálogo global de funcionalidades.
- Novedades conserva las fechas como chips no editables y carece del botón de filtros. Noticias conserva sus filtros y el contexto histórico de las newsletters. Las selecciones no se propagan automáticamente entre vistas.
- Radar admite geografía y año y normaliza siempre el período al año completo. Por defecto usa todas las geografías y el año actual; retrocede al anterior si no hay noticias. Verificado con 599 noticias, del 01/01/2026 al 31/12/2026.
- Se retira la newsletter anual de las cadencias, opciones, planificación y generación. La recuperación de noticias por año y el análisis anual del Radar continúan existiendo.
- La quincenal agrupa por bloque funcional, ordena por presencia en la selección y relevancia, evita repeticiones de bloques internacionales cuando hay alternativas y omite el texto de noticia única.
- La trimestral integra un ejemplo por mirada en el informe, prioriza un artículo no enviado, elimina los contadores mensuales y muestra noticias BBVA. La mirada internacional excluye la geografía seleccionada. Sin geografía hay solo mirada global. Se sustituye «corpus» por lenguaje de negocio.
- Los enlaces de valoración se sitúan bajo la gestión de la suscripción y abren una modal con valoración y observaciones.
- El historial personal muestra tres envíos inicialmente y amplía de tres en tres. Las síntesis incluyen bloque funcional, mirada y enlaces al contexto de noticias.
- La entrega automática deja de depender de toda la cola general de traducción: comprueba y prepara solo los artículos destacados antes de enviar. Sus llamadas respetan el presupuesto diario compartido sin modificar el cursor del trabajo de traducción general.

## Google Sheets e inicialización

`initializeConfiguration` se ejecutó correctamente. Ahora resuelve los nombres físicos de las generaciones activas y no recrea hojas canónicas vacías que ya han sido sustituidas. La limpieza preserva datos publicados, recuperación verificada y fuentes/destinos de trabajos incompletos; registra en Telemetria los nombres eliminados.

La inspección final encontró 26 pestañas, todas referenciadas. No se eliminó ninguna pestaña de datos en esta ejecución. `DashboardSnapshotBackup` y `Noticias_tax_…` pertenecen a la recuperación verificada; `Noticias_maintenance_…` es destino de un trabajo pendiente. Sus sufijos no las convierten en obsoletas.

Los tres snapshots se regeneraron y publicaron juntos. La comprobación terminó con `pending:false`; los trabajos quedaron reanudados.

## Verificación y límites

- `npm run check`: sintaxis, diseño y permisos correctos.
- `git diff --check`: correcto.
- 50 pruebas focalizadas pasan: iteración 13, snapshots, generaciones y traducciones. Incluyen una entrega simulada que confirma envío y reserva de contenido aunque la traducción general siga pendiente.
- La última ejecución de la batería histórica completa, anterior al ajuste final de los chips, pasó 528 de 614 pruebas y falló en 86. No se presenta como batería validada. Incluye expectativas retiradas (newsletter anual, filtros de Radar, chips editables), referencias a hojas canónicas sustituidas y dobles de servicio sin `LanguageApp`, ahora necesario para preparar la traducción del contenido seleccionado.
- Verificado en la web publicada: 599 publicaciones en Radar, filtros de geografía/año, nombres sin códigos y tres newsletters iniciales con síntesis e hipervínculos.
- No se enviaron correos de prueba a destinatarios reales ni se guardaron valoraciones ficticias.

## Rendimiento medido

Una comprobación dentro de una misma ejecución de servidor dio 2.795 ms en la primera lectura de Novedades y 307–378 ms en las siguientes lecturas de las tres vistas, todas con snapshot. Estas cifras aprovechan la memoria de esa ejecución y no representan por sí solas la carga completa del navegador.

La telemetría visible de la publicación registró 6.400 ms para Novedades y 6.314 ms para Radar, incluyendo RPC/red y renderizado, con `snapshot hit`. El p95 histórico de 30 días era 15.455 ms y había 13 errores de cliente históricos; no se atribuyen esos agregados a esta versión ni se comparan como si fueran una prueba controlada. La exportación JSON se intentó desde la interfaz pero no se obtuvo un archivo verificable; se conservó la telemetría visible en `output/iteration13-live-backup/telemetry-visible.txt`.

Los recibos de publicación, verificación de archivos y mediciones están en `output/iteration13-live-backup/`.

## Ajuste posterior: años disponibles en Radar

El selector de año utiliza una lista enviada por el servidor a partir de las fechas de las noticias empresariales publicadas. No genera años artificiales desde 2000 ni añade un año sin noticias para conservar una selección anterior. La lista es independiente del año consultado, está ordenada de forma descendente y se actualiza con el índice de noticias. Verificación: 18 pruebas (iteración 13 y snapshots) correctas, además de `npm run check`.

## Corrección de CI de la PR 58

El job `118759027849` de la ejecución `39460680156` falló en `check:dist`: el commit contenía el paquete generado de la iteración 13, pero sus fuentes seguían sin incluirse. Se incorporan las fuentes correspondientes, las pruebas de regresión y esta documentación para que una instalación limpia pueda reconstruir el mismo paquete.

La validación completa también detectó y corrigió la exportación de ediciones históricas, textos nuevos sin traducción y la repetición de un bloque en la quincenal cuando faltaban bloques alternativos. El envío reutiliza el contenido ya traducido. La vista previa local ofrece los mismos años disponibles que los datos de su instantánea.

Las pruebas históricas comprueban ahora dos cadencias, ámbitos local e internacional disjuntos, quincena fija en Novedades, año completo y geografía en Radar, fechas editables en Noticias y contexto de edición restringido a Noticias. Los dobles de Apps Script incluyen el proveedor de traducción y usan las hojas de generación activas. Se conservan los controles de cobertura y reproducibilidad.
