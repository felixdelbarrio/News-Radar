# Ámbito de aplicación y geografías · 2.5.0

Configuración de negocio → Ámbito de aplicación permite elegir los países con pestaña propia para Empresas e instituciones, Retail y Project Finance. Los países elegidos se muestran únicamente cuando tienen publicaciones para los filtros activos. «Transversal» agrupa noticias sin país identificado; «Otras geografías» conserva los demás países. Sin filtro de segmento se utiliza la unión de los tres ámbitos. Radar y la recuperación siguen cubriendo el catálogo global: desmarcar un país cambia su agrupación, no elimina sus noticias ni desactiva fuentes.

## Selección inicial

- Empresas e instituciones: España, México, Perú, Colombia, Argentina, Turquía y Uruguay.
- Retail: los anteriores, Italia y Alemania.
- Project Finance: China, Hong Kong, Japón, Singapur, India, Australia, Indonesia, Corea del Sur, Vietnam, Filipinas, Malasia y Tailandia.

Referencias oficiales: [aplicaciones BBVA](https://www.bbva.com/es/innovacion/tecnologia/aplicaciones/), [BBVA Empresas Uruguay](https://www.bbva.com.uy/empresas/servicios-empresas/app-bbva-empresas.html), [Garanti BBVA Corporate Mobile](https://www.garantibbva.com.tr/en/corporate/digital-banking/mobile-banking), [apps en Italia y Alemania](https://www.bbva.com/es/innovacion/la-app-de-bbva-ya-esta-disponible-en-chatgpt-para-italia-y-alemania/). El ámbito es editable; representa países de seguimiento, no un inventario automático de las tiendas de aplicaciones.

## Mapa y filtros

El mapa y su listado comienzan a la misma altura. La lista se ordena por publicaciones y omite países con cero noticias. Los marcadores de esos países se ocultan y sus áreas no activan filtros. Las opciones de país respetan segmento, cobertura, período y otros filtros; permiten cambiar de país sin quedar limitadas por el país activo. Se conserva un filtro activo aunque deje de tener resultados, para poder retirarlo explícitamente.

## Consultas y recursos

Las consultas usan un vocabulario central por idioma. Las capacidades digitales seleccionan un término apropiado por idioma, en lugar de depender de su posición en una lista bilingüe. Project Finance también selecciona términos por idioma. APAC utiliza las ediciones internacionales en inglés configuradas; no se promete cobertura de todas las publicaciones locales en chino o japonés. Los términos personalizados sin idioma conocido se conservan.

Se mantienen los límites de consultas y términos, sin aumentar el número de solicitudes por perfil. El índice lingüístico se construye una vez por ejecución; la agrupación usa conjuntos y mapas compartidos entre cliente, servidor y CSV. La preparación de países reutiliza la selección calculada cuando no hay filtro de país. El CSV conserva el país real de las noticias agrupadas en «Otras geografías».

## Publicación

1. Copiar el contenido generado de `dist/` al proyecto de Apps Script.
2. Ejecutar `initializeConfiguration` antes de publicar: añade el ámbito inicial y actualiza consultas pendientes, conservando ediciones y configuraciones existentes.
3. Publicar la nueva versión de la WebApp y recargarla.

La publicación en Google no se ha ejecutado desde este entorno.

## Verificación

`npm run verify`: 331 pruebas correctas; cobertura de sentencias 94,30 % y líneas 97,01 %. `npm run check:dist` confirma distribución reproducible. Chrome verifica seis geografías con los volúmenes de referencia de la captura: seis filas y marcadores, ninguna fila cero y alineación vertical exacta. Sin desbordamiento horizontal en 1440 y 390 píxeles; el editor muestra tres ámbitos y 28 países preseleccionados en total. Esta comprobación visual utiliza datos de referencia, no una recuperación nueva en producción.
