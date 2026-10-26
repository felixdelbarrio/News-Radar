# Radar móvil · 3.27.1

El bloque de continuidad operativa mantenía dos columnas en pantallas estrechas porque `@media(max-width:760)` carecía de unidad y el navegador lo ignoraba. A 375 px, ambas columnas medían 142,5 px; el texto de Revolut solo disponía de 35,5 px y se cortaba dentro de la palabra.

La corrección incorpora el bloque al breakpoint móvil central de 767 px en responsive.css, elimina la regla inválida y reúne allí sus estilos móviles. La cronología conserva los doce meses, con seis columnas y dos filas en móvil. En escritorio mantiene dos columnas con mínimos explícitos de cero. Se integra además una declaración duplicada de espaciado. No se añaden scripts, listeners, cálculos, consultas, compatibilidad alternativa ni dependencias.

La comprobación geométrica en navegador abarca 320, 375, 390, 430, 767, 768, 1024 y 1440 px: una columna hasta 767 px y dos desde 768 px, doce meses y cero desbordamiento horizontal en las ocho anchuras. A 375 px, cada sección ocupa 309 px y Revolut dispone de 202 px. Se revisan también los nombres de entidades, los botones geográficos y los titulares largos de las evidencias.

El JavaScript del cliente permanece idéntico byte a byte; el bloque conserva sus 225 nodos y Styles.html se reduce 133 bytes. Son controles estructurales de coste, no mediciones de bytes de heap ni de CPU del dispositivo del usuario.

La medición productiva compara navegación y renderizado con la misma selección del Radar. Se conservan por separado el tiempo observado desde pulsar Radar hasta que el contenido es visible, y las duraciones de render y RPC que el propio cliente registra en Telemetria. La caché de cliente se identifica para evitar atribuir a CSS una mejora de red o de servidor. La muestra previa de tres navegaciones con caché registra 302, 293 y 275 ms observados; la telemetría asociada permite contrastar el render. Las muestras posteriores, capturas, anchuras y resultado del despliegue se adjuntan en la PR y en output/mobile-radar/.

Una prueba recorre todos los estilos para impedir dimensiones no nulas sin unidad en condiciones de anchura y altura. La comprobación visual en navegador cubre el comportamiento real que ese control estático por sí solo no acredita. La publicación usa el editor de Apps Script del navegador de Codex, con copia y lectura posterior de Styles.html, Index.html y Config.gs, manteniendo URL y permisos de la implementación anterior.
