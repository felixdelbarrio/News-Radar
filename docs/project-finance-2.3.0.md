# Project Finance y cobertura internacional · 2.3.0

La distribución amplía el radar de 7 a 31 países y de 38 a 86 entidades. Mantiene las vistas, navegación, estilos y funcionalidades existentes. Project Finance aparece en el selector de segmentos junto a Empresas e instituciones, Retail y Todos; al elegirlo se selecciona Generalista, también en los formularios de suscripción. El usuario puede cambiar después la cobertura a Canal digital si quiere restringirla.

## Cobertura

- Europa: España, Italia, Alemania, Francia, Portugal, Reino Unido, Suiza, Países Bajos, Bélgica y Rumanía.
- América: México, Perú, Colombia, Argentina, Uruguay, Estados Unidos, Brasil y Chile.
- Turquía.
- APAC: China, Hong Kong, Japón, Singapur, India, Australia, Indonesia, Corea del Sur, Vietnam, Filipinas, Malasia y Tailandia.

Los países de benchmarking APAC amplían el alcance de noticias; no implican que BBVA tenga banca minorista en todos ellos. El perfil BBVA se amplía a las principales geografías de actividad comercial, corporativa o representación, incluyendo su banca digital en Italia y Alemania. La referencia es la [información corporativa de BBVA](https://www.bbva.com/en/corporate-information/), el [informe de 2025](https://shareholdersandinvestors.bbva.com/wp-content/uploads/2026/02/5_2_BBVA_Group_Annual_Report_and_Management_Report_2025.pdf) y [BBVA en Asia](https://www.bbva.com/en/bbva-in-asia/).

Entre los nuevos bancos se siguen Intesa Sanpaolo, UniCredit, Deutsche Bank, Commerzbank, ING, BNP Paribas, Crédit Agricole, Société Générale, Barclays, NatWest, JPMorgan Chase, Bank of America, Citi, UBS, DBS, OCBC, UOB, MUFG, SMBC, Mizuho, Standard Chartered, ICBC, Bank of China, HDFC, ICICI, ANZ, Macquarie, Maybank y bancos locales de los mercados APAC. Se incorporan ADB y AIIB como multilaterales. Las entidades tienen países explícitos: no se consulta el producto cartesiano de todos los bancos y países.

Italia, Alemania y otros mercados europeos utilizan las ediciones locales de Google News y términos bancarios en su idioma. Las capacidades retail añaden cuentas digitales europeas. Los países cuentan con banderas PNG locales; los nuevos bancos utilizan el monograma que ya ofrece la aplicación, sin dependencias de imágenes en ejecución.

## Fuentes gratuitas

Se incorporan tres RSS de búsqueda de Google News: Project Finance APAC, Global y Medios especializados. El tercero reúne resultados indexados de The Asset, Asian Banking & Finance, Renewables Now, pv magazine y comunicaciones públicas de ADB y AIIB. No se requiere API, clave ni suscripción al agregador. El acceso al artículo completo depende del editor; no se eluden restricciones de pago.

Las consultas incluyen project finance, project financing, financiación y financiamiento de proyectos, infrastructure financing, financial close y financiación sin recurso. Los perfiles bancarios generan consultas digitales en el job diario y consultas específicas de Project Finance en su propio job. Los RSS especializados solo se consultan en Project Finance; la recuperación anual incluye ambos conjuntos. Los RSS especializados aceptan operaciones aunque el prestatario no sea un banco seguido. La ausencia de banco se conserva como Sector, y la geografía se obtiene del texto; no se atribuye un proyecto al país sede de un prestamista sin evidencia.

Los tres RSS respondieron HTTP 200 con RSS 2.0 durante la verificación del 13 de octubre de 2026: 77, 70 y 100 entradas, respectivamente. Es una comprobación puntual, no una garantía de disponibilidad o exhaustividad. Los RSS de búsqueda se integran en la recuperación por fechas y se subdividen cuando alcanzan el límite del proveedor. Los medios especializados se consultan mediante el índice gratuito de Google News, no mediante supuestos RSS propios sin verificar.

## Frecuencia y recursos

La banca digital se ejecuta una vez al día, alrededor de las 07:00 (`dailyHour`), con prioridad sobre Project Finance y la recuperación anual. `projectFinanceHour=10` y `projectFinanceIntervalHours=6` programan el job independiente de Project Finance alrededor de las 04:00, 10:00, 16:00 y 22:00, Europe/Madrid. El intervalo acepta 4, 6, 12 o 24 horas; cambiarlo no modifica el horario digital. Apps Script ejecuta sus activadores con tolerancia temporal. Traducción, clasificación y taxonomía mantienen su frecuencia diaria.

Cada job conserva su propia ventana incremental y marca de última solicitud. La primera pasada consulta la ventana configurada; las siguientes empiezan un día antes de la última solicitud de ese tipo para cubrir retrasos. Un ciclo pendiente o en cola impide crear otro del mismo tipo, incluso si cruza medianoche. La recuperación manual diaria conserva la ventana completa digital y la anual incluye ambos conjuntos de fuentes.

Ambos jobs comparten el trabajador, los bloqueos, la caché de URLs y los límites existentes: hasta tres lotes y 45 segundos por ejecución. Las peticiones digitales toman prioridad en el siguiente lote; las peticiones de red ya iniciadas terminan normalmente. Project Finance continúa después sin perder su cola. No se añade otro trabajador concurrente ni se duplican consultas entre los jobs. Desactivar la recopilación desde Fuentes elimina ambos horarios. Con la configuración inicial se planifican 331 consultas digitales una vez al día y 165 de Project Finance por pasada: 991 consultas diarias, frente a las 1.336 de la programación conjunta anterior, antes de reintentos y subdivisiones. Es una reducción del 26 % de peticiones previstas; no mide el consumo real de CPU o RAM. Hay 172 fuentes configuradas y menos de 200 perfiles/RSS, sin nuevos servicios ni llamadas LLM añadidas.

## Duplicados y métricas

La clave del titular normaliza texto, acentos, mayúsculas, puntuación y sufijo del editor. No incorpora la entidad o el país asignados por el agregador. Un mismo titular publicado dentro de dos días cuenta una vez, aunque distintas fuentes lo atribuyan a bancos o países distintos. Cifras y titulares diferentes, eventos alejados y titulares demasiado genéricos conservan su identidad.

Cuando el histórico contiene el original de Europa Press y copias, se prioriza el original. El resultado es determinista incluso si se invierte el orden de lectura. El histórico permanece íntegro; la selección deduplicada alimenta las vistas, mapa de calor, CSV y newsletter. El total disponible del Radar también cuenta publicaciones únicas. La taxonomía deduplica su corpus entre lotes, conserva identidades compactas en el checkpoint y etiqueta todas las filas históricas. Project Finance dispone de palanca y señal propias para aparecer tanto en Radar como en Novedades.

También se corrige el índice persistente de URLs: leía la columna de captura en lugar de la URL. Ahora solo lee las siete columnas necesarias y evita recapturas entre ejecuciones.

## Instalación

1. Copiar todos los archivos regenerados de `dist/` al proyecto Apps Script existente.
2. Ejecutar `initializeConfiguration` como propietario. Añade países, entidades, segmentos, señal y fuentes ausentes; amplía los países de entidades existentes y conserva sus activaciones y ajustes. Añade los ajustes independientes de Project Finance y actualiza ambos horarios cuando la recopilación está activa.
3. Publicar una nueva versión de la WebApp. Si la recopilación está desactivada, activarla desde Fuentes.

El cambio queda local y preparado para la publicación manual definida por el repositorio. No se publica automáticamente ni se modifica la hoja de producción desde este entorno.

## Validación local

`npm run verify` supera las comprobaciones de sintaxis, configuración, permisos y las 318 pruebas de la suite, incluyendo separación de fuentes, horarios, prioridad digital y continuidad de las colas. La ejecución completa se ha comprobado con Node.js 24.19.0; el Node 24.1.0 instalado en el sistema presenta un fallo de enlace ESM al instrumentar jsdom, por lo que se utilizó el runtime actualizado disponible en el entorno.

El build y `check:dist` confirman la distribución reproducible. Las nuevas pruebas cubren búsqueda APAC, RSS y recuperación por fechas, operaciones sin banco identificado, originales y copias entre entidades, deduplicación del corpus entre lotes, límites de celdas del checkpoint, programación y solapamientos, actualización de catálogos y los formularios reales de filtros y suscripciones. Una prueba sintética local de deduplicación de 10.000 filas (2.000 publicaciones únicas) obtuvo una media de 111 ms en cinco pasadas; no es una medición del rendimiento de Google Sheets ni una garantía para producción.
