# Usabilidad y coordinación de trabajo — 13 octubre 2026

La iteración implementa el PDF de usabilidad y corrige la contención observada en la telemetría. La instantánea tiene 6.597 consultas pendientes, p95 de 9.218 ms y ejemplos de dashboard con 28–49 ms de renderizado frente a varios segundos de servidor/RPC. Estos valores son la línea base, no una medición del código nuevo.

## Coordinación

`WorkCoordinator.gs` sustituye a `ConfigurationPause.gs`. Configuración, suscripciones, feedback y acciones administrativas que escriben usan `withForegroundWrite_`.

Cada petición publica su propia intención con caducidad antes de esperar el bloqueo global. Al terminar elimina exclusivamente su intención y confirma las escrituras con `SpreadsheetApp.flush()` antes de liberar el bloqueo. Otra petición activa sigue manteniendo la pausa. La liberación también ocurre cuando falla el flush.

El worker cede el bloqueo entre unidades, comprueba nuevamente la prioridad al adquirirlo y conserva hasta tres lotes por turno. Clasificación, taxonomía y traducción reciben un presupuesto cooperativo de hasta diez segundos por unidad. Los checkpoints de CPU comparten una lectura por segundo; entre llamadas externas se vuelve a comprobar la prioridad. Una llamada a Google en curso no puede cancelarse ni quedar limitada estrictamente por ese presupuesto.

El watchdog reintenta trabajo diferido y limpia intenciones caducadas. Una nueva petición durante la reanudación conserva el trabajo pendiente. Las pausas de cuotas y los cursores no se eliminan. Un envío periódico que encuentra el bloqueo ocupado programa su continuación.

La recopilación mantiene un mapa de escrituras del lote seleccionado, en lugar de copiar todos los estados de la cola. El índice de noticias se reutiliza entre lotes mientras no cambie la revisión. La caché de noticias usa bloques de hasta 128 registros, subdivididos cuando exceden 90.000 bytes por entrada.

## Experiencia

- Marca arriba y navegación sticky debajo, en escritorio y móvil.
- Filtros primero en una barra compartida junto a los chips; período y última recopilación en una línea común. El volumen de recuperación queda al pie.
- Los filtros seleccionados se incluyen aunque no estén en las opciones devueltas por una consulta vacía. Las señales sin resultados están deshabilitadas.
- Selectores nativos y buscables comparten altura, tipografía, alineación y flecha a la derecha.
- Tarjetas completas enlazadas mediante un enlace accesible; sin CTA duplicado. Espaciado reducido y extractos de hasta tres líneas. Encabezados de entidad sin panel decorativo y vacíos a todo el ancho.
- Carga inicial reemplaza el contenido pendiente. La carga adicional mantiene las noticias visibles y añade únicamente el DOM nuevo, sin reconstruir tarjetas anteriores.
- Noticias y grupos del Radar se amplían hacia abajo. Cambiar selección reinicia la lista. Si cambia la revisión al paginar se vuelve a la primera página para evitar mezclar instantáneas.
- Hover y foco de países sincronizados con el mapa; puntos de la evolución con detalle visible y atenuación de otras series. Medios y entidades permiten filtrar.
- Guardar una suscripción confirma escritura antes de recargar su listado. Una respuesta anterior de suscripciones no puede sustituir una apertura más reciente.

## Validación y puesta en servicio

Las pruebas incluyen la conservación de Colombia y de la señal en consultas vacías, la identidad DOM de tarjetas previas al paginar, filtro por medio, tooltip, resaltado de mapa, escritura prioritaria de suscripciones y recuperación ante errores de flush o nuevas intenciones.

La vista previa local permite verificar filtros, navegación, tarjetas y suscripciones en memoria. Los bloqueos, cuotas y servicios de Google se prueban con dobles de Apps Script; hace falta medir la instalación real después de publicar para confirmar la mejora de latencia y consumo.

El paquete `dist/` se genera desde `src/`; no editarlo manualmente. Al actualizar la instalación se debe eliminar el archivo y cualquier activador antiguo de `ConfigurationPause.gs` / `configurationWake_`, y usar `WorkCoordinator.gs` junto al resto del paquete. No ejecutar simultáneamente ambos coordinadores. No se ha publicado ni modificado la instalación de Google desde este trabajo.

Validación final: `npm run check`, `npm run check:dist`, `npm test` y `npm run verify` completados. Las 385 pruebas pasan. Cobertura: 97.61% de líneas, 93.92% de sentencias, 96% de funciones, 89.06% de ramas. Navegación y suscripción verificadas en el navegador local; sin desbordamiento horizontal en las vistas de suscripción de escritorio y móvil.
