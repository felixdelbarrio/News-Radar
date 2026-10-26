# Iteración 28 · 3.29.0

## Cambios

La selección geográfica conserva un país por noticia: nombre explícito en titular, dominio territorial de la noticia o del medio, contexto nacional verificable y medios configurados, RSS consultado y sede de la entidad. El contexto nacional solo completa dominios genéricos: nunca desplaza un país explícito o un ccTLD. Las sedes y regiones son datos editables del catálogo; Stripe usa Estados Unidos. Se incorporan 16 países encontrados en la revisión del corpus, aliases internacionales y los medios colombianos HSB Noticias y Semana. El migrador copia la hoja completa y verifica Configuración y Noticias antes de cambiarla.

Otras geografías abre la región del navegador cuando tiene resultados y ofrece Todas las regiones explícitamente. Los filtros y las newsletters calculan regiones desde el catálogo. En móvil los encabezados y contadores se apilan, las cohortes de Adopción son accesibles y las tablas muestran sus etiquetas sin scroll horizontal. El mapa de calor funcional excluye incidencias y conserva esa exclusión al abrir sus noticias.

Adopción calcula gráfico, KPI y tabla con los mismos eventos filtrados. DAU es la cohorte inicial; WAU, MAU, recurrentes y total son seleccionables. El total incluye usuarios antiguos dentro de la retención disponible. Los eventos futuros o con fecha inválida no cuentan.

Las newsletters validan elegibilidad, identificador, fecha, URL, ámbito y deduplicación antes de priorizar. Seleccionan hasta tres evidencias distintas. La quincenal de un país requiere una noticia local elegible; ambas cadencias excluyen contenido enviado al destinatario y se suprimen ante historial incompleto. El contexto estadístico trimestral usa todo el corpus elegible y distingue ese denominador de los destacados nuevos. Las prioridades exteriores derivan de las pestañas propias y las regiones configuradas; la calidad y diversidad prevalecen sobre el volumen. BBVA requiere evidencia única o una excepción oficial de relevancia superior. No se usa LLM ni se interpreta adopción, éxito comercial o cuota a partir de publicaciones.

El asunto mantiene `[bIA] Canal BBVA BEI`, ámbito y período natural, o fechas exactas si es irregular. El correo usa tablas y estilos inline, identidades CID con alternativa textual y un preheader único. Se conservan seguimiento, historial, bajas y enlaces archivados. Las pruebas no consumen el historial real.

La primera carga incorpora el dashboard en el HTML cuando corresponde. La navegación reutiliza hasta 12 selecciones durante la sesión, separadas por versión; una comprobación ligera en segundo plano detecta cambios de noticias, configuración o día y refresca el contenido. No repite una consulta completa por caducidad de un minuto.

El reinicio de taxonomía conserva la obligación de reclasificar. El rollback reconstruye y verifica las tablas del backup en una generación nueva antes de publicar sus punteros.

## Auditoría reproducida en local

Exportación de la hoja activa: 998 noticias. Resultado con el catálogo propuesto: 0 sin país y 42 cambios (39 en noticias elegibles). Motivos: 179 por titular, 113 por dominio, 20 por contexto nacional, 1 por medio, 675 por RSS y 10 por sede. HSB Noticias y Semana sobre Bre-B pasan de España a Colombia. La ejecución completa del cálculo local tarda aproximadamente 73 ms; no representa latencia de Google Apps Script ni una medida de RAM.

Reproducción de las mismas 24 ediciones archivadas y su historial de destinatario:

| Medida | Antes | Después |
| --- | ---: | ---: |
| Destacados seleccionados | 54 | 66 |
| Destacados de competidores | 45 | 65 |
| Palabras medias | 203,46 | 136,67 |
| HTML medio, bytes | 24.674 | 17.537 |
| Máximo por edición | — | 3 |
| Repeticiones ya enviadas | — | 0 |
| Alteraciones del corpus de entrada | — | 0 |

Se suprimen dos quincenales (Uruguay y Venezuela) sin noticia local elegible. El resto del corpus internacional no se presenta como evidencia local. El HTML medio baja un 28,9 %. Las ediciones históricas permanecen inmutables; la comparación se genera en archivos locales privados y no envía correos.

Pruebas específicas cubren prioridades dinámicas, países y dominios contradictorios, historial incompleto, cambio de URL con igual ID, supresión, excepción oficial BBVA, calidad frente a volumen, filtros funcionales, períodos naturales e irregulares, tablas inline, cohortes, incidencias y recuperación de generaciones. Se conserva la validación completa del repositorio y su umbral de cobertura superior al 80 %.

La inspección visual local a 375 px confirma ausencia de desbordamiento en el correo y encabezado de Novedades. La compatibilidad de correo se comprueba estructuralmente y en navegador; no equivale a una prueba nativa de Gmail y Outlook.

## Puerta de publicación

GO únicamente con checks verdes, comentarios bloqueantes resueltos, migración completada y validación en la publicación. La medición previa de 3.28.0 registró RPC de 5–11 s aunque el render era de 27–48 ms; debe compararse con navegación calentada de 3.29.0, distinguiendo render, transporte y carga completa. El acta de publicación añade las medidas observadas, sin inferir consumo de RAM desde tiempos de render.
