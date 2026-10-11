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


## Segunda exportación y correcciones · release 1.1.1

Fuente: `news-radar-telemetria new.json`, exportado a las 12:00:57 Europe/Madrid. Contiene 319 registros de telemetría y mezcla ejecuciones anteriores con las posteriores al cambio. Los primeros registros con la instrumentación nueva aparecen a las 11:59; se comparan por separado. El p95 global de 5.890 ms incluye el histórico y no demuestra una mejora ni una regresión de esta versión.

| Vista | Total cliente | RPC | Servidor | Noticias | Render | Caché |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Radar | 4.249 ms | 4.230 ms | 1.367 ms | 747 ms | 19 ms | miss |
| Novedades | 3.106 ms | 3.103 ms | 1.546 ms | 987 ms | 3 ms | miss |
| Noticias | 4.148 ms | 4.143 ms | 1.450 ms | 98 ms | 5 ms | hit |

La caché de noticias se utiliza, pero esa carga sigue dedicando 1.352 ms del servidor a otras fases. La diferencia RPC menos servidor oscila entre 1.557 y 2.863 ms: no se atribuye a render, cuyo coste observado es de 3–19 ms, ni se puede desglosar entre arranque de Apps Script, transporte y serialización con este JSON.

Los dos lotes instrumentados duran 5.453 y 5.079 ms: red 795 y 1.408 ms; proceso/escritura 2.727 y 2.691 ms. Quedan 1.931 y 980 ms de preparación. Ambos terminan sin errores. Santander · Uruguay se consulta correctamente a las 12:00, con 64 entradas evaluadas. Los siete estados Error HTTP 302 pertenecen a ejecuciones anteriores; no se han borrado ni reintentado mediante esta modificación local. El botón existente de Administración permite reintentarlos después de publicar.

La cola crece de 2.554 a 2.594 por la división de consultas saturadas; las tareas completadas pasan de 8 a 56, con 2.531 pendientes y 7 errores. Los últimos lotes añaden cero noticias: predominan fechas ajenas al intervalo consultado. Que una consulta HTTP termine correctamente no demuestra cobertura histórica completa. Se mantiene la validación de fechas y la advertencia de cobertura parcial; no se aceptan noticias fuera de rango para mejorar artificialmente el contador. La exportación de auditoría sigue limitada a 20.000 filas.

Correcciones implementadas:

- El recolector lee estados y contadores de toda la cola, pero carga ciclo, fuente y URL únicamente de las tareas elegidas. Agrupa filas contiguas, respeta reintentos aún no vencidos y conserva los índices originales para escribir. Evita transferir y duplicar en memoria miles de URLs largas en cada ejecución. La exportación mantiene todas las tareas completas.
- Las últimas diez ejecuciones tienen caché de 15 segundos compartida entre selecciones. Una nueva ejecución o una edición manual en Ejecuciones la invalida. La autorización se comprueba en cada petición; un lector solo recibe la fecha de la última ejecución. La activación diaria y el resto de datos administrativos conservan su lectura habitual.
- Dashboard separa preparación, cálculo de noticias y metadatos. La recopilación separa preparación, red, procesamiento y escritura. Estas duraciones no incluyen la escritura del propio registro de Telemetría.
- Cada nuevo registro identifica la release y la exportación incluye `applicationVersion`. Se conserva el formato de cinco columnas y no hacen falta nuevos permisos ni inicialización de Sheets.

Verificación: pruebas de cola anual de 2.594 tareas, selección de filas contiguas y dispersas, reintentos vencidos y pendientes, cola sin trabajo elegible, invalidación de caché y ausencia de datos administrativos para lectores. La reducción de latencia real queda pendiente de medir tras publicar `dist/` de la release 1.1.1; la evidencia actual no permite prometer un porcentaje.
