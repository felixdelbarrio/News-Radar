# Telemetría y simplificación · 2.2.0

Fuente: `news-radar-telemetria (1).json`, exportada el 12/10/2026 a las 20:39:14 UTC. El archivo indica aplicación 2.1.0, pero incluye operaciones de versiones anteriores. Se separan las muestras por versión; no se interpreta el P95 global de 8.095 ms como el de la release actual.

## Evidencia de 2.1.0

13 muestras de dashboard, con 5 aciertos de caché de contenido:

| Fase | Mediana | Mínimo–máximo |
| --- | ---: | ---: |
| Experiencia completa | 5.337 ms | 2.949–7.192 ms |
| RPC | 5.316 ms | 2.943–7.183 ms |
| Servidor | 1.463 ms | 229–3.271 ms |
| Preparación | 167 ms | 64–1.406 ms |
| Noticias | 373 ms | 25–1.250 ms |
| Metadatos | 954 ms | 68–1.699 ms |
| Render | 10 ms | 6–22 ms |

El render no es el cuello de botella de estas muestras. La mediana de metadatos supera la del cálculo de noticias, incluso con contenido cacheado. La diferencia entre RPC y servidor es sustancial; esta exportación no permite atribuirla exclusivamente a red, arranque o cola de Apps Script. La muestra es pequeña y procede de una sola cuenta.

La clasificación 2.1.0 revisó 1.348 registros en 14 lotes y solo reescribió 11, coherente con procesamiento incremental. La recuperación diaria terminó con 118 fuentes procesadas de 119 y una fallida; la anual, con 6.443 de 6.450 y siete fallidas. No hay trabajos pendientes ni solicitudes en cola. Los motivos de exclusión por temas son históricos, anteriores a la eliminación de ese catálogo; no se reintroduce esa dependencia.

## Ajuste aplicado

Eliminar el selector personal también elimina el RPC de guardado de preferencias, su esquema y el envío del catálogo de suscripciones en cada dashboard. La lectura inicial obtiene solo la periodicidad y filtros de la primera suscripción activa, sin traducir asuntos ni construir una lista. El resultado, incluido el caso sin suscripciones, se cachea por cuenta y revisión durante 300 segundos. Altas, ediciones y bajas invalidan mediante la revisión existente.

La resolución se ejecuta exclusivamente al inicializar Novedades, Noticias o Radar, nunca al refinar filtros, paginar o leer una edición archivada. Las pruebas verifican una sola lectura de suscripciones al inicializar las tres vistas, caché separada por cuenta y ninguna lectura adicional al refinar. Se conservan las consultas de estado de jobs y la prioridad de la recuperación diaria.

La identidad de una suscripción se calcula sobre destinatario, periodicidad, idioma y filtros efectivos en orden estable, normalizando la búsqueda. Se reutilizan las filas ya cargadas para validar el guardado; no se introduce una consulta adicional ni un job. El bloqueo existente cubre validación y escritura. La misma comprobación se comparte con la vista local.

## Verificación y límites

Pruebas de altas y ediciones personales y administrativas, suscripciones pausadas, filtros vacíos y reordenados, búsquedas equivalentes, distintas selecciones válidas, caché e identidad de cuenta. Pruebas de edición archivada y etiquetas removibles, con «Más filtros» visible exclusivamente en Noticias. Validación en Chrome a 320, 390, 767 y 1.440 px.

Los tiempos anteriores son la referencia recibida, no una medición posterior al cambio. La mejora de producción debe contrastarse tras publicar 2.2.0, especialmente `preparationMs`, `metadataMs`, `serverMs` y `rpcMs`. No se afirma una reducción de latencia, RAM o CPU que esta exportación no puede demostrar.
