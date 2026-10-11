# Recarga progresiva y Radar · 1.5.0

Export analizado: `news-radar-telemetria (1).json`, 11 de octubre de 2026, 20:15:34 Europe/Madrid. El informe identifica la aplicación como 1.3.0, aunque mezcla operaciones de varias versiones. No mide todavía esta implementación.

La recuperación del 11/10/2025 al 11/10/2026 contiene 3.566 tareas: 1.526 completadas, 2.033 pendientes y siete errores HTTP 302. Se han incorporado 63 noticias entre las 11:35 y las 20:14. Los errores son de las 11:37–11:58; no demuestran que el manejo actual de redirecciones siga fallando. La auditoría está limitada a 20.000 registros.

El 11 de octubre hay 528 operaciones de recopilación: mediana 4.391 ms y máximo 121.393 ms. Las cinco últimas consultan tres fuentes por ejecución. El límite de tres consultas por minuto supone aproximadamente 11,3 horas adicionales para 2.033 pendientes, sin contar subdivisiones ni reintentos. La cola original empezaba por octubre de 2025; el usuario veía las novedades de los últimos siete días mientras se recopilaban semanas antiguas.

Las tres cargas de dashboard etiquetadas 1.3.0 tienen mediana de RPC de 4.836 ms, de servidor de 1.480 ms y de metadatos de 454 ms. Las tres son fallos de caché y el render tarda 6–24 ms. La muestra es demasiado pequeña para medir una mejora de producción o atribuir toda la latencia al servidor.

## Cambios

- Evolución y publicaciones por medio se apilan en la columna izquierda, con paneles de altura natural. Las entidades permanecen a la derecha. Los seis medios principales se agregan sobre toda la selección, sin contar nombres vacíos como editores.
- Ejecuciones tiene una pestaña propia y un endpoint administrativo con búsqueda, estado, fechas y paginación. Se consulta al abrir o filtrar la pestaña, en vez de incluir diez ejecuciones en cada dashboard. El indicador global solo necesita la última ejecución.
- Las ventanas de siete días se generan desde hoy hacia atrás, sin huecos. Una prioridad persistente por fecha también ordena las tareas pendientes de la cola existente y las consultas derivadas por saturación. El trabajador lee estados, contadores y prioridades; carga las URLs únicamente del lote seleccionado.
- En recuperaciones de más de siete días se procesan cuatro veces las fuentes del lote configurado, con máximo absoluto de veinte. Con el valor actual de tres son doce consultas por ejecución. El trabajo reciente conserva el lote configurado. Esta reducción del tiempo de espera por cadencia no garantiza una duración concreta: depende del proveedor y las cuotas.
- Cada lote guarda noticias, auditoría y estado, y confirma las escrituras antes de devolver su resultado. Mantiene la deduplicación por URL y los reintentos. Una consulta con cien resultados, todos fuera del período, conserva el aviso de cobertura parcial y deja de multiplicar consultas hijas inútiles.
- El navegador consulta el progreso cada treinta segundos únicamente mientras haya tareas pendientes y la pestaña sea visible. Si cambia la revisión de noticias, recarga la selección; los filtros se conservan. Muestra noticias incorporadas, pendientes, errores, última actividad y pausas. Los errores de conexión espacian el siguiente intento a sesenta segundos.
- «Continuar recuperación» vuelve a activar el trabajador y procesa otro lote sin borrar tareas ni sustituir el período que ya estaba en curso. Los nuevos literales están en el catálogo compartido español/inglés/turco.

## Instalación y verificación

Después de copiar `dist/` a Apps Script, ejecutar **initializeConfiguration** antes de publicar la nueva WebApp. Añade la columna `prioridad` de Recopilacion y completa sus fechas sin modificar estados, intentos, contadores, noticias ni el período en curso. No hace falta reiniciar la recuperación. Si su activador se ha detenido, pulsar «Continuar recuperación».

Las pruebas verifican continuidad y orden temporal, prioridad sobre la cola existente, lecturas acotadas de URLs, subdivisiones útiles, persistencia, autorización y paginación de ejecuciones, y refresco del navegador con pausas, revisiones y errores. La acción requerida de CI conserva el umbral estricto superior al 80 % en líneas, sentencias, funciones y ramas.

La siguiente exportación permitirá comparar tareas por minuto, duración por lote, metadatos y aciertos de caché. No se puede garantizar un histórico anual completo: Google News y los RSS limitan los resultados disponibles. El diseño respeta los [límites de Apps Script](https://developers.google.com/apps-script/guides/services/quotas) y usa solicitudes agrupadas de [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app).
