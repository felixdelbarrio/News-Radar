# Auditoría de carga, rendimiento y maquetación · 3.0.1

Fecha: 14 de octubre de 2026, Europe/Madrid.

## Evidencia y alcance

Se examinó `/Users/u517055/Downloads/news-radar-telemetria.json`, exportado a las 08:34:10 Europe/Madrid, esquema 1, versión declarada 3.0.0. Contiene 3.224 registros de telemetría; señala limitación de los conjuntos de telemetría, ejecuciones y auditoría. El análisis siguiente separa las operaciones etiquetadas `v3.0.0` del histórico anterior.

| Vista | Cargas | Mediana total cliente | p95 total cliente | Aciertos de caché |
| --- | ---: | ---: | ---: | ---: |
| Novedades | 21 | 7.985 ms | 10.187 ms | 0 |
| Noticias | 14 | 6.255 ms | 9.795 ms | 0 |
| Radar | 9 | 5.939 ms | 8.589 ms | 0 |

Las muestras recientes sitúan el render de Novedades en 18–27 ms y el de Noticias en 11–20 ms; Radar llega a 97 ms. El transporte y el servidor explican gran parte del tiempo restante. La mediana de los 124 lotes de recopilación etiquetados 3.0.0 es 3.973 ms, con p95 de 14.647 ms. Las traducciones se ejecutan en segundo plano; no se han incorporado llamadas de traducción a las pantallas.

Los eventos se exportan con la fecha de escritura del lote, por lo que dos filas con la misma fecha no demuestran dos solicitudes simultáneas. La exportación tampoco contiene el tamaño de las respuestas: los fallos de caché pueden depender del tamaño, de la revisión cambiante de noticias y de la selección. El defecto de tamaño se verificó con una respuesta reproducible superior al límite UTF-8.

Se accedió al enlace publicado con la sesión disponible, sin solicitud de segundo factor. Se recorrieron Novedades, Noticias, Radar, Newsletter y las nueve secciones administrativas: Suscripciones, Configuración de negocio, Taxonomía, Fuentes, Ejecuciones, Idioma, Auditoría, Telemetría y Adopción. No se enviaron correos, modificaron catálogos ni ejecutaron recopilaciones durante la auditoría publicada.

El pie de la aplicación publicada mostraba **2.7.0**, aunque la exportación identifica el servidor como **3.0.0**. Esa diferencia no permite asumir que el frontend observado corresponda exactamente al código del repositorio. Debe publicarse el paquete completo para evitar una combinación de archivos de distintas releases.

## Correcciones

- El transporte comparte solicitudes de lectura idénticas que siguen pendientes. Las escrituras mantienen su ejecución independiente. Las respuestas de selecciones abandonadas no se presentan en otra pantalla.
- Pulsar la pestaña activa conserva sus nodos. La navegación reutiliza como máximo seis selecciones durante 60 segundos desde la respuesta original, sin prolongar su caducidad al visitarlas. Aplicar filtros fuerza una consulta. Una revisión nueva de datos o configuración invalida las selecciones guardadas.
- Abrir una edición desde un correo resuelve primero su contexto; no solicita actualidad antes del archivo. Los nombres traducidos se restauran también al reutilizar un resultado local.
- El sondeo conserva el progreso de recopilación, pero difiere la recarga del contenido mientras se está en Newsletter o Administración. Volver a la lectura obtiene contenido vigente. Las tareas ocultas no prolongan el indicador de la pantalla activa.
- Las respuestas de dashboard se guardan en fragmentos acotados, con manifiesto publicado después de los fragmentos. La lectura exige todos los fragmentos; una expulsión parcial provoca un cálculo nuevo. Se limita el número de fragmentos y nunca se recorta la respuesta para hacerla caber. Se verificaron bytes UTF-8, caracteres suplementarios, expulsión parcial y respuestas que superan el límite total.
- La telemetría distingue la caché del navegador y registra RPC/servidor en cero cuando no hubo petición. Taxonomía se acepta como vista administrativa; antes podía provocar el rechazo del lote de eventos y su reintento continuo. Los lectores siguen sin poder registrar eventos administrativos.

## Carga y diseño

El spinner es compacto y pertenece al panel que recibe la petición. El menú, los filtros y la navegación permanecen fuera del contenido sustituido. La primera lectura muestra skeletons compartidos; las actualizaciones de paneles ya disponibles conservan su contenido con spinner. Cargar más noticias conserva las tarjetas y coloca el spinner al final. Los skeletons usan bloques grises y fondo transparente, sin el rectángulo blanco de 40 vh. Son decorativos; el estado accesible comunica la carga y `aria-busy` se limita al panel activo. La animación del spinner respeta la preferencia de movimiento reducido.

Se consultaron las referencias de tipografía, color, iconos, grid y radios del ZIP BBVA Experience. El paquete aporta fundamentos; no contiene una ficha específica de Spinner/Skeleton. Benton Sans, Tiempos para titulares, los colores semánticos, radios 16/8 px y las alturas de línea proceden del fichero central de tokens. Los campos móviles usan el tamaño de 16 px de la referencia tipográfica para evitar el zoom automático al enfocarlos.

La navegación móvil permanece fija abajo, incluyendo Administración para usuarios autorizados, con reserva de espacio y safe area. CSV y JSON comparten la marca `data-download` y se ocultan en móvil. Las pestañas geográficas y de fuentes se ajustan en varias líneas. Las tablas móviles muestran etiquetas y valores sin scroll horizontal y conservan la semántica de tabla y sus encabezados. Se añadió `line-clamp` junto a la propiedad prefijada que motivaba el aviso de la captura.

## Períodos compartidos con newsletters

`dashboardPeriod_` utiliza `newsletterWindow`, sin mantener cálculos alternativos de semana o mes:

| Vista | Cadencia | Rango inicial a 14/10/2026 |
| --- | --- | --- |
| Novedades | Quincenal | 01/10/2026–15/10/2026 |
| Noticias | Trimestral | 01/10/2026–31/12/2026 |
| Radar | Anual | 01/01/2026–31/12/2026 |

Se utilizan los períodos naturales en curso. La entrega programada sigue utilizando el último período cerrado según su calendario, y una edición abierta desde el correo conserva el período archivado. Las fechas explícitas del usuario se respetan. La exportación de una edición hereda sus fechas históricas cuando el enlace no las repite; no aplica el trimestre actual sobre una newsletter anual archivada.

## Validación y publicación

La verificación local recorre las cuatro vistas de lectura/Newsletter y las nueve pantallas administrativas a 320, 390, 768 y 1.440 px. No se observó desbordamiento de página. A 320 y 390 px tampoco hubo contenedores con desplazamiento horizontal. En tablet una tabla de Adopción puede conservar desplazamiento interno; la página no desborda. Se verificaron spinner y skeletons con 5 segundos de latencia simulada, navegación durante peticiones, estados vacíos y conservación de filtros. No hubo errores JavaScript en el navegador local.

La vista previa utiliza la instantánea RSS del repositorio, no una copia de todas las noticias de producción. Las comprobaciones de dimensiones no sustituyen una prueba física en todos los dispositivos y motores de navegador. No se afirma una reducción porcentual de latencia de producción hasta publicar y comparar nuevas mediciones.

Ejecutar `npm run verify` comprueba sintaxis, permisos y pruebas con cobertura; `npm run check:dist` verifica que la distribución coincide con las fuentes. Las capturas y el paquete se guardan en `output/optimization/`. Para reproducir la carga lenta local: `PREVIEW_ADMIN=1 PREVIEW_LATENCY_MS=5000 npm run preview`. El retardo solo pertenece a la vista previa y no se incluye en Apps Script.

Publicar los 57 archivos de `dist/` como nueva versión de la instalación existente. No se requieren nuevos permisos, hojas ni inicialización. Los 57 archivos del proyecto remoto se respaldaron en `output/optimization/remote-before-3.0.1.zip`. Once archivos tenían cambios funcionales; las otras diferencias eran espacios o saltos de línea. Se actualizaron los once y se verificó su contenido después de recargar el editor. La versión 55 se publicó a las 09:24 Europe/Madrid en la implementación existente, conservando URL y permisos. Google confirmó la publicación correcta.

La revisión del código remoto confirmó la causa del desfase de versión: `Config.gs` indicaba 3.0.0 y `Index.html` conservaba una etiqueta 2.7.0. La etiqueta quedó corregida a 3.0.1.

La revisión final se publicó como versión 56 a las 09:51 Europe/Madrid. Incluye la cabecera con los tokens centrales de fondo azul principal y texto blanco, con contraste 13,98:1, y las marcas en blanco mediante un selector compartido. Los documentos de fundamentos suministrados no especifican que toda cabecera deba ser azul; esta combinación aplica la identidad solicitada sin introducir colores aislados.

Configuración solicita sus datos y el estado operativo en paralelo. Volver a seleccionar la pestaña administrativa activa no repite peticiones ni renderizados. La validación final completó 380 pruebas sin fallos y las comprobaciones de distribución y diferencias. En producción se confirmó la cabecera azul a 390 y 1.440 px, sin desbordamiento de página; en móvil la navegación sigue fija abajo y las descargas permanecen ocultas. Configuración de negocio cargó correctamente y no se registraron errores JavaScript. Las evidencias finales son `production-mobile-blue-header.jpg`, `production-desktop-blue-header.jpg` y `deployment-56.jpg` en `output/optimization/`.
