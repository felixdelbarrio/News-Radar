# Telemetría y orden editorial · 1.21.0

Análisis del archivo `news-radar-telemetria (1).json`, exportado el 12 de octubre de 2026. Contiene 1.881 registros de telemetría, 1.335 ejecuciones y una auditoría limitada a 20.000 registros. La muestra incluye versiones anteriores; los tiempos de interfaz siguientes corresponden exclusivamente a las siete solicitudes de dashboard etiquetadas como 1.20.0. No se extrapolan percentiles con una muestra tan pequeña.

| Etapa | Mediana | Máximo |
| --- | ---: | ---: |
| RPC | 5.608 ms | 8.287 ms |
| Servidor | 2.672 ms | 3.905 ms |
| Preparación | 132 ms | 996 ms |
| Noticias | 562 ms | 1.925 ms |
| Metadatos | 1.360 ms | 1.852 ms |
| Renderizado | 12 ms | 21 ms |

Dos solicitudes reutilizan el contenido cacheado y cinco recalculan. Las dos lecturas con caché dedican 66 y 73 ms a Noticias. El tiempo de RPC también incluye transporte y ejecución de la plataforma, por lo que optimizar JavaScript de presentación no puede eliminar todo ese tiempo. Los metadatos merecen atención; esta medición no permite atribuir su coste a una única llamada.

## Cambios implementados

- Consulta de activadores diarios cacheada durante cinco minutos: los sucesivos dashboards no llaman a `ScriptApp.getProjectTriggers` para mostrar el mismo estado. Activar, desactivar o reconstruir horarios invalida inmediatamente la caché. Si se modifican activadores desde fuera de la aplicación, el estado converge al vencer esos cinco minutos. La lectura de activadores del trabajador compartido sigue siendo directa para preservar su planificación.
- Novedades y Radar dejan de construir el listado oculto de Noticias. Se mantienen únicamente las tarjetas de la página necesaria, sin añadir precargas.
- Noticias agrupa dentro del país activo por BBVA, volumen descendente y nombre ascendente. Las fechas permanecen descendentes dentro de la entidad. Se cuentan todas las noticias filtradas antes de paginar. El algoritmo recorre los registros una vez, ordena las entidades y extrae únicamente los tramos de la página; no copia una lista completa adicional mediante `flat`.
- El comparador de entidades es compartido con Novedades y su agrupado editorial para evitar criterios divergentes.
- El mapa de calor se sitúa debajo de los KPI y delante de Presencia geográfica. Conserva su diseño móvil vertical y paginación.

## Trabajos de fondo y límites de la evidencia

Los lotes actuales de clasificación que ya tienen sus etiquetas recorren 100 registros en aproximadamente 174–180 ms, sin escrituras. No hay evidencia para aumentar su paralelismo. La recuperación diaria exportada tiene 118 de 119 tareas procesadas, una fallida y ninguna pendiente; la anual presenta siete fallos. La telemetría histórica incluye un error del servicio de Sheets en traducción. No se adjudica ese fallo a RAM o CPU sin diagnóstico adicional ni se altera la prioridad de recuperación diaria.

La auditoría está truncada y los motivos de exclusión agregan versiones históricas. Sus totales no prueban que un filtro actual esté descartando incorrectamente noticias. Se conservan la deduplicación y las selecciones explícitas del usuario.

Las pruebas verifican la reducción de consultas repetidas de activadores y la invalidación, el orden completo antes de paginar y la continuidad entre páginas. Los tiempos anteriores constituyen la línea base; la mejora de latencia en producción requiere nueva telemetría después de publicar esta versión.

Validación final: 282 pruebas superadas y cobertura de líneas del 96,86 %. Sintaxis, tokens de diseño, permisos y distribución reproducible comprobados. Chrome verifica encabezados de Noticias, el orden de las secciones de Radar y ausencia de desbordamiento horizontal de 320 a 1.440 píxeles; las tres newsletters conservan su diseño entre 320 y 800 píxeles. Las comprobaciones de navegador utilizan datos de demostración, sin envíos reales ni publicación del despliegue.
