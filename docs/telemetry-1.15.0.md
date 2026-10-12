# Telemetría y continuidad de lectura · 1.15.0

Se ha analizado `news-radar-telemetria.json`, exportado el 12/10/2026 a las 12:50 UTC. El fichero declara 1.14.0, pero contiene ejecuciones de varias versiones: no se atribuyen a la versión actual las latencias o fallos históricos. No se copia información de identidad al informe.

| Evidencia | Resultado | Consecuencia |
| --- | --- | --- |
| 126 observaciones de dashboard | Mediana 4.988 ms; p95 7.159 ms | El coste de la interacción está dominado por RPC y servidor. |
| Única observación de dashboard 1.14.0 | RPC 7.139 ms; servidor 3.141 ms; noticias 1.359 ms; metadatos 1.646 ms; render 20 ms | Priorizar reutilización de datos clasificados y de configuración. Una sola muestra no demuestra una distribución de rendimiento. |
| 29 lotes de taxonomía 1.13.0 | Mediana 694 ms; p95 1.085 ms | La agregación del mapa de calor reutiliza etiquetas; no recalcula TF-IDF al abrir una pantalla. |
| 14 lotes de clasificación 1.14.0 | Mediana 254 ms; p95 380 ms | Mantener procesamiento incremental en el trabajador común. |
| 217 lotes históricos de traducción | Mediana 25.848 ms; p95 39.385 ms | No traducir en consultas, filtros o mapa. No se garantiza cancelar una llamada externa ya iniciada. |
| 340.666 exclusiones fuera del período | Conteos agregados históricos; auditoría limitada a 20.000 filas | Mantener subdivisión temporal y muestreo existentes; no volver a ampliar el corpus de una edición enviada. |
| Errores HTTP 302 históricos de fuentes de Uruguay | Se registran en ejecuciones previas | El código actual ya comprueba redirecciones por lote y dominio. La exportación no justifica relajar ese control ni prueba un fallo actual nuevo. |

## Implementación y comprobación

La aplicación comparte noticias clasificadas entre filtros y vistas mediante caché por revisión de contenido/reglas, dividida en entradas de hasta 90 KB de UTF-8. Una expulsión parcial provoca una lectura completa válida; nunca una respuesta truncada. Los pesos de ordenación se conservan fuera del contrato público. La traducción de taxonomía invalida el contenido mostrado, pero no obliga a leer y reclasificar Noticias. Los metadatos administrativos se reutilizan por revisión de configuración. Los perfiles se cachean por usuario y se invalidan al modificar suscripciones.

Cada nuevo envío guarda una edición privada con filtros, fechas, idioma, etiquetas y noticias efectivamente incluidas después de omitir duplicados. El enlace contiene un identificador opaco. La autorización comprueba al destinatario antes de devolver contenido; una caché nunca permite compartir una edición entre usuarios. Guardar la edición precede al intento de envío y una edición se vuelve legible solo tras la aceptación de Gmail. Los correos antiguos ya enviados con un enlace genérico no contienen información para identificar cuál se está abriendo: no se reconstruye ficticiamente su contenido con preferencias actuales.

El mapa devuelve conteos dispersos y deduplica cada combinación noticia/categoría; las palancas no suman dos veces una noticia con varias subpalancas. El cliente limita el DOM a 12 grupos × 8 categorías, con paginación de ambos ejes. Cambiar agrupación, nivel o medida no llama al servidor. El porcentaje usa el total de noticias de cada grupo, incluidas las no catalogadas. Una celda abre su evidencia y conserva filtros y período. Los conteos describen cobertura informativa; no cuota de mercado ni gasto real de las entidades.

Las newsletters ceden a peticiones diarias pendientes, se reprograman y revisan la prioridad entre destinatarios. Se mantiene el bloqueo compartido; los snapshots y la visualización no crean nuevos jobs de CPU ni llamadas de traducción.

La comprobación local cubre identidad, caché parcial, persistencia de preferencias, ediciones con Noticias vacía o taxonomía cambiada, aceptación y duplicados de Gmail, prioridad diaria, enlaces sin consulta inicial de actualidad y navegación entre vistas. Las reducciones de lecturas y RPC se verifican con instrumentación de pruebas. La reducción de latencia real debe medirse tras desplegar; no se presenta como resultado ya observado en producción.

Validación final: 238 pruebas superadas; cobertura de líneas 96,48 %. Distribución reproducible, sintaxis y tokens verificados. La revisión en Chrome a 1440 px y 390 px no detecta errores JavaScript ni desbordamiento horizontal del documento.

Desplegar `dist/` y ejecutar `initializeConfiguration` crea Preferencias, NewsletterEdiciones y NewsletterContenido. Los snapshots no se eliminan al depurar Noticias: permiten volver a ediciones antiguas. No se añaden permisos ni traducciones en tiempo de consulta.
