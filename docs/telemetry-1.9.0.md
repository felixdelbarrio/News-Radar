# Telemetría y rendimiento · 1.9.0

Exportación analizada: `news-radar-telemetria.json`, 11 de octubre de 2026, 23:16 (Europe/Madrid). Contiene 1.035 operaciones, 959 lotes de recuperación y las últimas 20.000 filas de auditoría. La auditoría está limitada; sus cifras de exclusión no representan necesariamente todo el histórico anual.

## Evidencia

La exportación mezcla versiones. Solo tres dashboards y tres recuperaciones corresponden a 1.8.0, por lo que no se utiliza el promedio de versiones anteriores para afirmar una mejora o regresión de la versión actual.

| Vista, 1.8.0 | RPC | Servidor | Contenido | Render |
| --- | ---: | ---: | ---: | ---: |
| Radar | 3.975 ms | 1.582 ms | 466 ms | 27 ms |
| Novedades | 4.662 ms | 2.064 ms | 1.382 ms | 6 ms |
| Noticias | 8.311 ms | 5.237 ms | 4.001 ms | 7 ms |

El cliente renderiza rápidamente. La inspección del servidor muestra que cada noticia no nativa consultaba por separado la caché de traducciones, incluso si todavía no había traducción guardada. Novedades podía consultar otra vez las mismas noticias durante la misma ejecución.

Los tres lotes de recuperación 1.8.0 duran entre 6.351 y 8.235 ms; su mediana es 7.068 ms. La mediana por fase es 542 ms de preparación, 1.750 ms de red, 2.949 ms de proceso y 2.179 ms de escritura. Las fases no se suman como medianas de una misma operación. El trabajador solo procesaba un lote antes de programar otro despertar, separado por un mínimo de un minuto: gran parte del tiempo transcurrido era espera entre lotes.

La anual conserva 3.176 consultas completadas de 4.570, 1.387 pendientes, siete fallidas y 83 noticias incorporadas. En la ventana de auditoría hay 208.724 exclusiones por quedar fuera del período solicitado. El código ya evita subdividir respuestas que no contienen ninguna noticia del período: no se retira esta protección ni se eliminan tareas para aparentar una recuperación completa.

Los siete errores son HTTP 302 registrados entre las 11:37 y las 11:58, anteriores a las muestras actuales. El manejador vigente ya sigue redirecciones seguras dentro del dominio permitido. La exportación no demuestra que esos errores sigan ocurriendo; pueden reintentarse desde Ejecuciones con el código actualizado.

## Cambios

- Traducciones: una lectura agrupada de caché por conjunto de noticias; lectura de filas contiguas para variantes persistidas; escritura agrupada de caché. Las ausencias se recuerdan durante la ejecución sin almacenarlas permanentemente. Guardar una traducción reemplaza esa ausencia inmediatamente.
- Se centraliza la comprobación del tamaño de entradas de caché, aplicada tanto a escrituras individuales como agrupadas. Solo se recuperan las variantes solicitadas; no se cargan todos los textos traducidos.
- Recuperación: hasta tres lotes por despertar, con un presupuesto de 45 segundos para iniciar trabajo nuevo. Cada lote persiste sus resultados. Entre lotes se atienden solicitudes nuevas y se vuelve a elegir el proceso con prioridad diaria. Las traducciones reciben el tiempo restante.
- Se conserva ScriptLock durante el turno completo, así como los reintentos diferidos y la alternancia de histórico y traducciones. Una llamada externa ya iniciada puede superar el presupuesto; el trabajador no inicia otro lote después.
- La limpieza de variantes invalida su índice de filas para que otros lotes del mismo turno no reutilicen posiciones desplazadas.

## Validación y límites

`npm run verify`: 171 pruebas sin fallos. Cobertura: líneas 95,03 %, sentencias 91,48 %, funciones 93,17 % y ramas 85,22 %. El umbral requerido de CI sigue siendo estrictamente superior al 80 %.

Las nuevas pruebas comprueban lecturas agrupadas, reutilización de pendientes y de caché, persistencia de tres lotes, llegada de una diaria durante una anual y finalización del turno tras una llamada lenta. La comprobación de navegador pasa en español, inglés y turco, en escritorio y móvil. El paquete `dist/` es reproducible; CodeQL se ha preparado localmente, sin ejecutar su análisis.

Estas comprobaciones demuestran la reducción de llamadas y esperas estructurales. No son una medición posterior en Google Apps Script: la próxima exportación permitirá comparar tiempos reales por vista y consultas completadas por minuto. No se garantiza un histórico exhaustivo si el proveedor devuelve noticias fuera del período solicitado.

Para aplicar: copiar `dist/` y publicar la versión 1.9.0 de la WebApp. No cambia el esquema ni requiere vaciar o reiniciar la cola anual. El trabajador programado utiliza automáticamente los nuevos límites al ejecutar la nueva fuente.
