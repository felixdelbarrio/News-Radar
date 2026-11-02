# Iteración 41 — evidencia y límites de validación

Base: `973de4bd97a31c7e619a146805dfa32492edbcc2` (`origin/develop`, actualizado el 02/11/2026).
Rama: `codex/iteration-41-performance-periods`.

## Contratos implementados

- Novedades: [hoy − 14 días, hoy], ambos inclusive.
- Noticias: [hoy − 3 meses calendario, hoy], ambos inclusive. El día inicial se limita al último día del mes de destino: 31/05/2024 → 29/02/2024; 31/05/2025 → 28/02/2025. Es una ventana móvil, no una partición de informes consecutivos.
- Radar: [hoy − 364 días, hoy], ambos inclusive; los años históricos elegidos explícitamente siguen siendo naturales. Los rangos explícitos se conservan.
- API, snapshots y simulador local no retroceden por falta de noticias. Se rechazan snapshots cuyo periodo difiere del solicitado o que anuncian fallback. La versión 3.35.0 separa las cachés del cliente de las anteriores.
- Newsletters conservan quincenas/trimestres naturales y su calendario de entrega. La prueba administrativa usa el periodo cerrado pendiente hasta que existe un intento planificado real; después usa el siguiente. Las pruebas del administrador y los bloqueos previos al intento no adelantan el periodo.
- Expansión México es un feed independiente (`expansion-mx`, `https://expansion.mx/rss`, México). El icono local procede del favicon oficial. El catálogo mantiene `expansion.com` y `expansion.mx` separados. Un host conocido nunca cae al país de una marca homónima. En RSS directos, la procedencia editorial utiliza el dominio configurado si el elemento no trae source URL; esto no sustituye el país del contenido.
- Persistencia: se añaden tiempos por fase (candidatos, cobertura, noticias, medios, auditoría, tareas hijas, estados, invalidación, ejecuciones, snapshots, flush y estado), runId y contadores agregados. No se cambian el orden de escritura, los flush, el tamaño de lote ni los límites del supervisor.

## Línea base real

Lectura directa del editor, aplicación publicada y export XLSX del Sheet indicado. El respaldo local completo está en `output/iteration-41/production-before.xlsx`, ignorado por Git; contiene configuración y hojas afectadas. No se adjunta al PR ni se publican datos personales o noticias del respaldo.

Implementación activa observada: **versión 143**, aplicación **3.34.1**, descripción `3.34.1 · PR105 9d37f40 · Medios, iconos, geografía y CodeQL · Histórico 835 verificado`. Se conserva para rollback.

| Medida | Antes (producción) | Después (producción) |
| --- | ---: | --- |
| Muestra de lotes con desglose existente | 230 | Pendiente |
| Duración de lote p50 | 8.424 ms | Pendiente |
| Duración de lote p95 (rango empírico inferior) | 15.032 ms | Pendiente |
| Mediana de escritura / tiempo activo | 82,5 % | Pendiente |
| Lote configurado | 3 | 3 (sin cambio propuesto) |
| Progreso diario del 02/11 al consultar | 9/326; 317 pendientes | Pendiente |

Las muestras son observacionales y de volúmenes diversos; no son un experimento 3 frente a 5. El tiempo de los lotes es tiempo activo y no duración extremo a extremo. No se atribuye una mejora a estos cambios. No se ha medido RAM, ni el total de llamadas internas a Sheets; el desglose temporal permitirá decidir qué operaciones comparar antes de alterar garantías de persistencia.

El supervisor está instalado cada 5 minutos, sus ejecuciones observadas completan correctamente y existe un backgroundTick pendiente. El panel publicado informa **«Esperando disponibilidad de cuota o reintento»**. No se ha reproducido un defecto de reanudación; se conserva la recuperación existente y no se fuerza otra ingesta ni se eliminan pausas.

## Comprobación de Expansión México

- RSS: respuesta HTTPS 200 y RSS 2.0 con 43 elementos al verificar el 02/11/2026.
- Icono: `https://expansion.mx/favicon-32x32.png`, enlazado por la página principal y descargado con respuesta 200; PNG de 867 bytes.
- Fuente editorial: [aviso legal](https://expansion.mx/aviso-legal-y-de-privacidad) y [canales RSS](https://expansion.mx/expansion/2017/07/05/canales-rss).
- El respaldo vivo contiene `expansion.com` verificado y `amp.expansion.com` observado; no contiene `expansion.mx`. No se modifican noticias históricas.

## Promoción y medición pendientes

No se ha modificado Apps Script ni el Sheet de producción. La cola diaria sigue pendiente y está esperando disponibilidad; no se ha intervenido en ella para obtener un benchmark. Antes de promocionar se requiere completar validación local y una prueba controlada que no interfiera con esa cola ni envíe newsletters. Quedan pendientes comparación equivalente 3/5, llamadas/flush, p50/p95 nuevos y duración extremo a extremo. Sin esos datos no se propone eliminar flush ni aumentar lotes.

Cambios mínimos previstos en el Sheet, tras revalidar el respaldo y la disponibilidad: añadir el feed mexicano al JSON de la fila `feeds` de Configuracion y una fila independiente a CatalogoMedios con país México y el favicon verificado. Preservar todas las demás claves/filas. No sustituir el libro completo.

Rollback: antes de promover, conservar versión 143 y fuente previa completa del editor. Si se llega a publicar, volver la misma implementación a 143; restaurar exclusivamente la celda feeds y eliminar/revertir la fila mexicana añadida según el registro exacto de diferencias. Las modificaciones locales se revierten por commit, sin migración de datos ni cambios en newsletters históricas.
