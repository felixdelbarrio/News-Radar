# 3.10.0 · Descarga única y progreso LLM

Una sola acción descarga `news-radar-llm.zip`. Contiene `manifest.json`, `instructions.md`, `proposals.json` y paquetes autónomos `1_N.zip`, `2_N.zip`… Cada paquete lleva su manifiesto, catálogo funcional y taxonomía en `context.json`, instrucciones y lotes `1_M.json`, `2_M.json`… de hasta 25 noticias. N es el total de paquetes y M el total de lotes del paquete correspondiente. Se pueden procesar paquetes y lotes en cualquier orden; todos conservan la revisión de origen. Los resultados siguen sujetos a sus límites de importación y control de revisión por noticia.

El catálogo se incluye una vez **por paquete**, evitando repetirlo en cada lote. `proposals.json` reúne las propuestas previas para revisión y nunca publica categorías. Se eliminan el botón y endpoint separados de propuestas, el botón de copiar instrucciones y sus traducciones sin uso. Las instrucciones permanecen plegadas.

## Progreso y publicación

La descarga muestra el porcentaje de filas recorridas, también cuando el filtro excluye noticias. Llega al 100 % después de preparar el ZIP completo; un error o cambio de revisión impide descargar archivos parciales.

La importación muestra el archivo actual y el porcentaje global. Pondera lectura, preparación del resultado y publicación. La fase de publicación procede de los snapshots efectivamente terminados (0/33/67 %); solo se completa tras verificar y publicar Novedades, Noticias y Radar. Un fallo conserva el porcentaje alcanzado y muestra el proceso interrumpido. El monitor evita sondeos duplicados durante la transferencia.

La barrera de publicación sigue conservando la generación anterior mientras construye y verifica las tres vistas. El resultado existente v1 se convirtió una sola vez mediante importación atómica y publicación verificada. Se conserva una abstención válida y 8.896 pendientes. El código desplegado lee e importa exclusivamente v2, sin lector ni validador de compatibilidad v1. Los diagnósticos y la conversión temporal se retiran del editor antes de publicar.

## Auditoría de datos reales

[ZIP originales](iteration-12-original-zip-audit.json): los 16 adjuntos contienen 8.371 noticias; el primer tramo, `news-radar-llm-2.zip`, también estaba en Descargas. Los 17 archivos suman 8.896 noticias únicas y 100.233.339 bytes. Todos comparten catálogo y revisión; CRC, hashes de contenido y referencias previas son correctos. Son entradas para procesar, no resultados de clasificación. Hay 79 extractos y 8.855 URLs de Google News; las instrucciones requieren consultar el editor cuando falte evidencia o abstenerse.

[Paquete nuevo](iteration-12-bundle-audit.json): nueve ZIP autónomos, 356 lotes, 8.896 noticias únicas y **8.881.625 bytes**, un **91,14 % menos**. La auditoría recorre ambos niveles y comprueba CRC, hashes, tamaños de lote y coherencia de catálogo/revisión. El archivo auditado se reconstruyó localmente con las entradas originales, las cantidades y revisión medidas en Apps Script y el escritor usado por el cliente; su tamaño coincide exactamente con el calculado por el servidor real. No se presenta como un archivo recuperado del navegador integrado, cuya captura de descargas Blob no devolvió un fichero.

## Rendimiento y verificación

El escritor ZIP trabaja con partes UTF-8 y CRC incremental, conservando los mismos buffers al anidar paquetes. No aplana archivos ni codifica el ZIP final en base64 en Apps Script. Las peticiones recorren como máximo 1.000 filas y tienen un presupuesto de 6 MiB; las lecturas de noticias son de 250 filas. Sin propuestas guardadas se evita recorrer de nuevo el corpus para generarlas.

La exportación completa se ejecutó con el código real en Apps Script: **39.136 ms**, incluyendo preparación del ZIP y comprobación de los tres snapshots; produjo cantidades `[1000,1000,1000,1000,1000,1000,1000,1000,896]`. Es una observación, sin transporte del navegador, no un SLA. La telemetría anterior de los 16 adjuntos registra 92.841 ms de trabajo de exportación para 8.371 noticias; ese subconjunto no constituye una comparación completa equivalente.

[Comparación local](iteration-12-local-benchmark.json): exportación completa de 8.896 noticias sintéticas contra el commit anterior `ecaffa82d209f35ceded172e88be2e918f4ad620`. Las peticiones bajan de 17 a 9; las descargas de 17 a 1 y las lecturas del emulador de 49 a 36. Se incluyen CPU, tiempo y heap observado. Las medidas locales no estiman cuotas, RAM máxima ni latencia de producción; el heap observado depende del recolector.

`npm run verify` verifica sintaxis, diseño, permisos, distribución y la suite con cobertura. Las pruebas cubren ZIP anidados y CRC, catálogos autónomos, numeración, orden inverso, descarga única, ausencia de descarga parcial tras errores, porcentajes de descarga/importación/publicación y la barrera de los tres snapshots.

La evidencia de publicación y navegación real se registra en [validación de producción](iteration-12-production-validation.json).
