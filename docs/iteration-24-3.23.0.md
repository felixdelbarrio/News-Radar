# Iteración 24 · 3.23.1

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

Las mediciones de 3.22.1 y la promoción previa constan en el informe de Iteración 23. La publicación y las medidas finales se documentan a continuación.

## Revisión final de negocio y navegación

Se añaden exclusiones configurables para caídas y pérdidas bursátiles, sangría bursátil y expresiones equivalentes en inglés y turco. La regresión usa el titular concreto de Bankinter y contrasta caídas reales de su aplicación y banca online, que continúan siendo incidencias admitidas. La actualización de catálogo preserva las selecciones de países ya editadas.

La selección explícita de un país restablece su pestaña desde una región. Al entrar en Otras geografías solo se elige una región preferida si tiene contenido; pulsar de nuevo el agregado desde una región permite consultar también noticias sin región o de países personalizados. Se verifican ambos casos y la conservación de la navegación anterior.

La batería completa de 3.23.0 terminó con 773 pruebas aprobadas. Los siete casos de Iteración 24 y las regresiones de ámbito/navegación pasan tras los ajustes de 3.23.1. La verificación final de CI se realiza sobre el último commit, sin modificar la distribución durante las pruebas.

## Resultado productivo final

3.23.1 promovida desde el navegador de Codex. La inicialización y la reclasificación terminaron sobre 979 noticias; el catálogo examinó además 3000 candidatos. Clasificación y taxonomía completadas, sin snapshots pendientes. El registro bursátil de Bankinter se encontró en la hoja con `digital=false` y sin señales; dejó de aparecer en las últimas evidencias de Radar, mientras se mantuvieron incidentes reales traducidos.

Medidas reales del 25/10/2026 a las 10:30–10:31 Europe/Madrid, con snapshots válidos:

| Operación | Primera muestra | Segunda muestra |
| --- | ---: | ---: |
| Novedades, servidor | 456 ms | 411 ms |
| Noticias EMEA, servidor | 495 ms | 116 ms |
| Radar, servidor | 158 ms | 134 ms |
| Panel, consultas posteriores a la inicial | 81–103 ms | 67–83 ms |

La primera consulta de panel midió 549/682 ms. En ambos diagnósticos las consultas del panel añadieron cero filas de telemetría. El coste de Novedades se concentró en refrescar el estado operativo; las muestras no acreditan un objetivo de 300 ms para todas las cargas ni equivalen a p95 o a latencia de RPC. Bankinter RSS respondió 503 en una consulta y 200 en la siguiente: se conserva esa intermitencia del proveedor como límite observado. Los diagnósticos temporales se retiraron del editor.

En la publicación real, las evidencias traducidas ajustan a móvil de 375 px sin desbordamiento, con identidad y titular en bloques distintos. Los doce meses usan ene–dic de 2026 y los indicadores reutilizan las barras y tokens BBVA. Se verificó la fila regional por debajo de la fila de países y el editor único, con sus filtros móviles.

CI aprobó 776 pruebas; cobertura global de líneas 98,08 %, ramas 85,77 %, funciones 95,23 % y sentencias 92,76 %. CodeQL y GitFlow correctos. Revisión automática completada sin hallazgos sobre 9b98d81, con los cinco hilos anteriores resueltos. El cambio visual final sustituye los medidores nativos restantes por el patrón compartido `ranking-track`.
