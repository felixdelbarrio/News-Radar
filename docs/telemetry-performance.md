# Optimización basada en telemetría · 11 de octubre de 2026

## Evidencia recibida

Fuente: `news-radar-telemetria.json`, exportado a las 11:38 Europe/Madrid.

| Indicador | Valor observado |
| --- | ---: |
| Latencia p95 de las cargas, medida por el cliente | 5.890 ms |
| Operaciones de recopilación | 269 |
| Mediana de recopilación | 4.384 ms |
| Máximo de recopilación | 74.935 ms |
| Tareas del ciclo activo | 2.554 |
| Pendientes del ciclo activo | 2.545 |
| Filas de auditoría exportadas | 20.000 |
| Descartes dentro de esas filas | 18.960 (94,8 %) |
| Descartes fuera del período de recuperación | 16.151 |
| Descartes fuera de la ventana reciente | 2.254 |
| Errores HTTP 302 en el tramo de auditoría | 50 |
| Tamaño del JSON adjunto | 16.232.934 bytes |

La auditoría exportada está limitada: estas cifras no representan todos los registros históricos. Las métricas de uso proceden de un solo usuario y 24 sesiones. El JSON contiene datos anteriores a varias iteraciones del código; las operaciones `busqueda` pertenecen a un flujo retirado y no se usan como medida del recolector actual.

Una comprobación HTTP de la consulta fallida de BBVA · Uruguay devuelve 302 hacia `news.google.com/rss/search`, cambiando la edición a `US:es-419` y conservando el país en la búsqueda y el intervalo temporal. El recolector anterior rechazaba ese 302 porque tenía desactivado el seguimiento automático. Es una causa verificada de consultas fallidas, no una inferencia basada solo en latencia.

## Cambios implementados

- Chips de Radar y Novedades reutilizan el componente de Noticias. Cerrar un chip sincroniza el formulario, reinicia la página y actualiza la vista. Solo se muestran filtros editables; las fechas fijas de Novedades permanecen como regla de esa vista.
- `fetchAll` agrupa las consultas del lote. Solo se vuelven a consultar las fuentes redirigidas, con un máximo de tres saltos y validación HTTPS y dominio en cada salto. HTTP 429, 5xx y fallos de transporte conservan reintentos acotados.
- Cada ejecución reconstruye únicamente los perfiles de sus tareas pendientes, en lugar de generar otra vez todas las consultas del año. La cola persistente no se reinicia ni se cambia de período.
- Los paneles de estado leen columnas de estado y contadores, omitiendo las URLs largas. El lote calcula su estado a partir del snapshot que ya leyó, actualizado tras las escrituras.
- La selección aplica entidad, geografía, fuente y fechas antes de clasificar temas, segmentos y señales. Los cálculos se comparten con CSV y newsletters y conservan el resultado funcional.
- Los resultados de dashboard tienen caché de 60 segundos por selección, configuración y revisión de noticias. La caché se invalida al capturar noticias, ordenar el histórico o editar Noticias en Sheets. Los datos administrativos quedan fuera de ella. Las claves y el contenido se comprueban contra límites de tamaño; los resultados demasiado grandes se devuelven completos sin guardarlos en caché.
- Los desplegables dejan de disparar una solicitud en `input` y otra en `change`. La búsqueda textual conserva el debounce.
- La auditoría nueva conserva hasta tres ejemplos de descarte por motivo y fuente, más los totales exactos por motivo. El JSON reconstruye esos totales sin sumar otra vez los ejemplos. Se conservan las filas de inclusión, duplicación y error; los registros históricos existentes no se borran.
- La telemetría añade tiempos RPC, servidor, Noticias y render, junto al acierto de caché. Se envían con el lote periódico de eventos existente. La recopilación distingue tiempo de red de procesamiento/escritura.

## Verificación y límites

Las pruebas comprueban chips en las tres vistas, selecciones independientes, respuestas antiguas, solicitudes duplicadas, caché e invalidación, tamaños UTF-8, lectura reducida de la cola, redirecciones y reintentos. También verifican que el muestreo de descartes conserva los totales y que el filtrado previo no cambia el resultado.

La comprobación en Chrome cubre escritorio y móvil, sin errores JavaScript ni desbordamiento horizontal. Cerrar los chips actualiza el filtro correspondiente; el componente existe una sola vez en el DOM.

En una medición local de CPU con 30 iteraciones y un lote de tres consultas, reconstruir las 2.546 URLs generadas por el catálogo de desarrollo costó 18,43 ms por iteración; reconstruir solo las consultas del lote costó 0,06 ms. El catálogo del entorno local difiere ligeramente de la cola de producción. Esta medición no incluye Google, Sheets ni red, y no predice la reducción de la latencia de producción.

El JSON anterior no separaba tiempos de red, Sheets y CPU. Los picos de 74,9 s no se pueden atribuir íntegramente a una fase a partir de esos datos. No se afirma una mejora porcentual de la aplicación real hasta comparar una exportación posterior al despliegue. Las exclusiones fuera de rango no se solucionan aceptando noticias ajenas al período: la validación de fechas permanece activa.

## Actualización y comparación

Publicar los archivos regenerados de `dist/` en la instalación existente de Apps Script. No hay nuevos scopes ni columnas de Sheets y no hace falta reinicializar. Los cambios se aplican a la cola pendiente existente; las fuentes con error pueden reintentarse desde Administración.

Tras usar Radar, Novedades y Noticias, incluidas visitas repetidas con los mismos filtros, descargar otra exportación de Telemetría. Comparar cargas con caché `hit` y `miss`, tiempos RPC/servidor/render, duración de los lotes y errores de Uruguay. Comprobar los totales de descartes en `exclusionReasons` y la información de muestreo en `auditSampling`.

Referencias de implementación: [operaciones de UrlFetchApp y fetchAll](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app), [prácticas recomendadas de Apps Script](https://developers.google.com/apps-script/guides/support/best-practices).
