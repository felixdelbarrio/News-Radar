# Iteración 24 · 3.23.0

Los requisitos funcionales y las capturas del documento adjunto se incorporan al trabajo autorizado en el chat. Las instrucciones operativas del PDF se distinguen de esa autorización: la promoción por navegador y la actualización de PR74 ya habían sido solicitadas expresamente por el usuario.

## Cambios

- Las últimas evidencias de incidencias en Radar usan los títulos guardados en Traducciones para el idioma de la aplicación. Se reutiliza el índice y caché existentes, sin traducción síncrona ni llamadas al proveedor durante una consulta. El payload comparte las métricas de Radar y solo añade las variantes de hasta cuatro títulos; no replica el panel por idioma ni conserva cuerpos auxiliares.
- El gráfico presenta doce meses de un único año, con nombres localizados y año accesible. El período anual de Radar sigue siendo el actual por defecto y respeta el selector histórico existente. Las barras usan el azul del token de acción BBVA; se elimina el medidor vertical nativo que dibujaba la cápsula verde y solapaba rótulos. En móvil se distribuyen en tres filas de cuatro meses.
- Las evidencias tienen identidad, titular y fecha en bloques separados. El encabezado y la bandera ya no invaden la primera línea del enlace; los textos largos ajustan su ancho.
- Se elimina la opción duplicada del catálogo: Geografías reúne los campos de país, su estado y la selección de pestaña propia que antes se editaban por separado. El esquema persistido mantiene catálogo y selección con sus responsabilidades vigentes; se guardan juntos desde un único formulario. Los países personalizados sin región permanecen en Otras geografías y se conservan al guardar.
- APAC, EMEA y AMER aparecen en una fila inferior a los países, mediante el componente compartido de Novedades y Noticias. Se conserva el teclado y el estado seleccionado.
- Se retiran reglas y el token del editor anterior que ya no se utilizan. Los tamaños, espacios y colores proceden de tokens existentes.

## Verificación

Las regresiones específicas cubren recuperación de traducciones guardadas sin cuerpos duplicados, meses sin mezcla de años, nombres por idioma, render del titular traducido y edición conjunta de campos geográficos y pestañas propias, incluyendo países personalizados. Se mantiene la batería de selección, snapshots, newsletters y filtros administrativos de Iteración 23.

Las mediciones de 3.22.1 y la promoción previa constan en el informe de Iteración 23. La publicación y las medidas finales de 3.23.0 se completan tras las comprobaciones de esta iteración.
