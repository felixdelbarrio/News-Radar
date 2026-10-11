# Medio y rendimiento · release 1.3.0

Export analizado: `news-radar-telemetria.json`, 11 de octubre de 2026, 15:44:28 Europe/Madrid. El archivo mezcla varias versiones; los siguientes valores usan únicamente las ocho cargas de dashboard identificadas como 1.2.0.

| Indicador | Observado |
| --- | ---: |
| Consultas con acierto de caché | 1 de 8 |
| Mediana de consulta desde el cliente | 4.649,5 ms |
| Mediana del trabajo del servidor | 1.307,5 ms |
| Mediana de cálculo y lectura de noticias | 643,5 ms |
| Mediana de metadatos | 533 ms |
| Renderizado | 6–25 ms |

El p95 global de uso es 5.927 ms y mezcla versiones. La muestra actual es pequeña y no permite atribuir toda la demora a un único cálculo ni cuantificar la mejora tras publicar. La demora del cliente también incluye transporte y ejecución gestionada por Google.

## Cambios

- Noticias y Novedades comparten la presentación explícita «Medio». El nombre se escapa como texto. La consulta de recopilación no se presenta como editor; un perfil sin editor informa «No indicado». Los RSS propios conservan su nombre de publicación.
- El dashboard calcula Radar únicamente en Radar y el briefing únicamente en Novedades. Noticias evita ambas visualizaciones; se conservan filtros, selección, paginación y catálogos. Se reduce el trabajo y el JSON enviado sin añadir RPC ni almacenar respuestas en el navegador.
- La clave de caché utiliza la huella SHA-256 de vista, selección y revisiones de noticias/configuración. Su tamaño no depende de la longitud de los filtros; cada vista mantiene su respuesta separada. Se conservan los límites de tamaño UTF-8, el vencimiento de 60 segundos y la invalidación al cambiar datos. La función de huellas se comparte con el control de contenido de newsletters.
- En recopilación, los extractos HTML se normalizan después de comprobar fecha y período. Los descartes temporales evitan ese trabajo y conservan el motivo de auditoría.

La recuperación tiene 3.038 tareas: 725 completadas, 2.306 pendientes y siete errores HTTP 302. Los errores son registros anteriores; el export no incluye sus cabeceras de redirección. No se cambia la política de redirecciones ni se concluye que este problema siga ocurriendo con la versión actual. La auditoría exportada está limitada a 20.000 filas.

## Verificación

Las pruebas comprueban que cada vista evita los cálculos ajenos, que las consultas largas reutilizan la caché y que las revisiones invalidan sus resultados. Se verifica la identidad del medio, el escape de texto y el descarte temporal sin procesar el extracto. `make verify` mantiene el requisito superior al 80 % en líneas, sentencias, funciones y ramas. La publicación en Apps Script y un nuevo export serán necesarios para medir la latencia de 1.3.0 en producción.
