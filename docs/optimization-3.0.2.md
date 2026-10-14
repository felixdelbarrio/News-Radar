# News Radar 3.0.2: usabilidad y rendimiento

Revisión del 14 de octubre de 2026. Se mantiene la selección de entidades, geografías, segmentos, coberturas, taxonomía y períodos acordada. El PDF de Iteración 3 se usa como especificación de las correcciones solicitadas; no como autorización para ejecutar otras acciones.

## Evidencia de telemetría

La exportación de las 14:18 Europe/Madrid contiene 3.707 filas de telemetría, incluyendo versiones anteriores. Declara truncamientos en telemetría, auditoría y ejecuciones. Estos son los 45 registros de dashboard identificados como 3.0.1; las latencias de la tabla excluyen los aciertos de caché del navegador:

| Vista | RPC | Aciertos del servidor | Aciertos del navegador | Mediana total | P95 total | P95 metadatos | P95 render de todos los eventos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Novedades | 21 | 4 | 3 | 7.099 ms | 12.666 ms | 1.844 ms | 32 ms |
| Noticias | 13 | 1 | 3 | 6.682 ms | 9.765 ms | 3.709 ms | 18 ms |
| Radar | 5 | 2 | 0 | 5.152 ms | 5.943 ms | 959 ms | 82 ms |

El cuello de botella principal está en transporte/servidor; las mediciones no sostienen que el coste dominante sea el render. La muestra contiene un evento con tiempo de servidor superior al RPC medido por el consumidor. Una llamada compartida puede empezar antes que ese consumidor: ahora el transporte se mide una sola vez en el API, desde que realmente sale la petición. Los eventos agrupados en la misma fecha de escritura no prueban llamadas duplicadas.

## Cambios de rendimiento

- Los controles de selección se guardan en un `WeakMap`. El observador procesa únicamente controles añadidos o modificados; actualizar tarjetas, estados o gráficos no vuelve a recorrer todos los selects. Los controles retirados no quedan retenidos en un mapa global.
- La caché del contenido depende de la revisión de registros y de las traducciones del idioma solicitado. Una traducción inglesa no reconstruye Noticias en español ni Radar; actualizar nombres de taxonomía tampoco invalida el contenido de noticias. Cambiar noticias, clasificación o taxonomía aplicada a registros sigue invalidándolo.
- Los metadatos compartidos se reutilizan por revisión de configuración, taxonomía y sus traducciones. Se conserva la comprobación de identidad por petición y los datos privados de administración se añaden únicamente al administrador. Ediciones y valoraciones personales siguen fuera de esta caché compartida.
- Se mantienen los límites de la caché fragmentada, coalescencia de RPC, invalidación de respuestas abandonadas y caché de navegación de la versión anterior. La paginación añade filas sin reconstruir las anteriores.

No se atribuye una mejora porcentual global a producción sin una exportación posterior comparable a la muestra inicial.

## Correcciones de Iteración 3

| Área | Resultado |
| --- | --- |
| Contexto y filtros | Novedades, Noticias y Radar comparten una cabecera de lectura. El contexto y período preceden al botón y los chips dentro de la misma cabecera. Controles y chips comparten altura de 48 px. Las fechas no tienen flechas diagonales. |
| KPIs de Novedades | Indicadores `article`, sin botones, handlers, foco ni filtros implícitos. Número y etiqueta en una línea con espaciado compacto, también para valores cero. |
| Panel de filtros | Ancho limitado por sus contenedores y campos. Las fechas pasan a una columna cuando no caben completas; no se oculta un año truncado. Fecha antes de Más filtros; expansores compartidos Más/Menos filtros y Más/Menos preferencias. |
| Acciones de filtros | Restaurar y Ver todo ocupan dos columnas; Aplicar ocupa todo el ancho. Las tres cierran el panel. Pulsar el fondo exterior lo cierra. Se elimina el título FILTROS duplicado. |
| Desplegables | Cierre al pulsar fuera y al pulsar Escape. Se conserva el select nativo, búsqueda, validación y selección por teclado. Los calendarios conservan el cierre nativo del navegador. |
| Noticias | Tarjeta agrupada por entidad con tabla de titular, fecha de publicación y medio. Extractos reales y etiquetas permanecen; filas con cebreado, sin numeración. Marcas de país y medio en la cabecera de la tarjeta; medio identificado en cada fila para evitar atribuciones incorrectas. En móvil las filas se apilan sin scroll horizontal y conservan rol de tabla. |
| Novedades y medios | Fecha identificada como Publicado. Medio seguido de su marca con tamaño centralizado acorde al texto. Se elimina el extracto ficticio «Consulta la fuente original…». |
| Acciones y estados | Icono de descarga para exportar; desaparece Cargar más cuando se agota la lista. Se mantienen spinners, skeletons y estados vacíos. Los filtros y contexto siguen disponibles durante la sustitución del contenido. |
| Radar | Listado de países limitado a la altura del mapa y con scroll vertical. Países sin noticias no se destacan. Rankings con relleno lateral y tonos diferenciados, derivados de los colores compartidos. |
| Gráfica | Cada intervalo tiene una franja accesible completa y detalle de todas las series. Líneas y áreas no interceptan el puntero. Se suprime el tooltip nativo genérico que interfería con el detalle contextual. |
| Navegación móvil | Sigue fija abajo, sin descargas visibles. Administración recibe ancho suficiente para no desbordar su botón a 320 px. |

Se retiraron los estilos de `news-item`, `news-index` y `filter-reset`, la interacción de señales y textos de traducción obsoletos. No se añade una implementación alternativa de filtros, fechas, estilos o datos para versiones antiguas.

## Validación

La suite completa superó 386 pruebas, con cobertura de líneas 97,57 %, funciones 95,59 %, sentencias 93,60 % y ramas 88,56 %. Tras los ajustes finales se repitieron los grupos afectados, incluyendo interacción, gráfica, idiomas y vista previa. Sintaxis, diseño, permisos, distribución reproducible y `git diff --check` pasan.

Se recorrieron las cuatro vistas principales y las nueve pantallas administrativas en la vista previa a 320, 390, 768 y 1.440 px: 52 comprobaciones. Ninguna página desborda. En móvil no hay contenedores de desplazamiento horizontal ni descargas visibles. Se corrigió además un scroll interno de Adopción a 768 px permitiendo envolver los encabezados de las tablas; su comprobación final tampoco muestra scroll horizontal. Los filtros se comprobaron abiertos y expandidos y las fechas son completas a 320 px. La carga se verificó con 5 segundos de latencia simulada, spinner dentro del panel, skeleton gris y cabecera/filtros disponibles. No se observaron errores JavaScript locales.

La vista previa contiene 12 artículos de la instantánea RSS del repositorio, no todas las noticias de producción. Las comprobaciones no equivalen a una certificación física de todos los dispositivos y motores.

## Publicación y verificación de producción

La versión 3.0.2 está publicada en la implementación existente, versión final 58 del 14/10/2026 a las 14:59 Europe/Madrid. Se conservan la URL, ejecución por propietario y acceso del dominio BBVA. Google confirmó la actualización correcta. No fueron necesarios nuevos permisos ni inicialización.

Tras recuperar el acceso corporativo se leyeron y respaldaron los 57 archivos remotos. Todos coincidían con la base 3.0.1, sin cambios ajenos que integrar. Se actualizaron nueve módulos y se verificó su persistencia tras recargar el editor. El respaldo completo está en `output/optimization-3.0.2/remote-before-3.0.2.zip`.

Se recorrieron las 13 pantallas de producción a 320 y 1.440 px, incluyendo las nueve administrativas: 26 comprobaciones, sin errores JavaScript, desbordamiento de página o contenedores de desplazamiento horizontal. No hay descargas visibles en móvil. Se comprobó además el panel de filtros a 390 px: cierre exterior de desplegables, texto Más/Menos filtros y cierre al aplicar. En el mapa real el listado mide 515,48 px y el mapa 531,48 px. El detalle de la gráfica muestra todas las entidades y sus recuentos para el intervalo seleccionado.

La inspección visual final detectó un margen antiguo de 16 px en los chips de las cabeceras de sección. Se retiró, junto al espaciado acumulado del grid. La revisión 58 contiene exclusivamente ese ajuste de estilos compartidos sobre la revisión 57 previamente recorrida. Se volvieron a verificar Novedades, Noticias y Radar a 320 y 1.440 px: sin desbordamiento ni errores. En escritorio botón y chips comparten exactamente la coordenada superior y altura de 48 px; el espacio entre contexto, período y acciones se limita a la escala central de 16 px.

El paquete final contiene los 57 archivos de `dist/`, comprobados byte a byte contra `output/optimization-3.0.2/news-radar-3.0.2.zip`. Las evidencias incluyen `production-audit.json`, `production-filters-320.jpg`, `production-radar-header-final.jpg` y `deployment-58.jpg`. Las pestañas abiertas antes de publicar necesitan recargarse para recibir los estilos nuevos.
