# Iteración 1 · 11 de octubre de 2026

## Distribución y Gmail

El fallo del PDF procede del control de reproducibilidad: `dist/Configuration.gs` y `dist/appsscript.json` contenían cambios que no existían en las fuentes. Se trasladan `testGmailAuthorization` y el servicio avanzado Gmail v1 a `src/`, conservando los seis scopes existentes. El control del manifiesto también exige ahora el servicio avanzado. `make build` vuelve a generar ambos archivos sin perder estos ajustes.

## Recopilación

Se identificaron dos causas que podían reducir la captura:

- Los intervalos mensuales concentraban las búsquedas de todo un mes en una única respuesta RSS. Ahora se usan semanas y se subdividen las respuestas posiblemente saturadas (100 entradas o más) hasta llegar a consultas diarias. La misma lógica se aplica a la ventana de la recopilación automática.
- El extracto agregado se vaciaba antes de clasificar si empezaba con el titular. Esto descartaba publicaciones cuando el tema estaba presente únicamente en ese extracto. Ahora se clasifica primero y se elimina la repetición solo del texto mostrado.

La cola de consultas subdivididas es persistente. Conserva fechas explícitas, activación de fuentes, deduplicación global y reintentos. Las escrituras siguen agrupadas por lote; las selecciones de newsletter iguales comparten clasificación y filtrado en memoria aunque los enlaces de baja sean individuales.

Los resúmenes de auditoría distinguen evaluadas, nuevas, excluidas y duplicadas. Las consultas que alcanzan el umbral incluyen una advertencia de cobertura. La descarga JSON reúne la cola, las ejecuciones, la auditoría, las exclusiones y las métricas, con límites explícitos.

## Límites de la auditoría

La revisión se realiza sobre el código y las pruebas locales, sin acceso a la hoja de producción, su cola, sus activadores o sus registros. No confirma cuántas noticias omitió la ejecución citada en el PDF. Para determinarlo, descargar el JSON de Telemetría después de actualizar Apps Script.

Google News y los RSS de editores no garantizan un histórico exhaustivo. El umbral de 100 es una señal de posible saturación, no una garantía de exhaustividad por debajo del umbral. Permanecen los filtros configurados de entidad, país y términos de búsqueda, la clasificación temática y el rechazo de fechas futuras o inválidas. Un artículo sin coincidencia temática sigue excluido y su motivo queda registrado. Las noticias sin señales comerciales aparecen en Noticias, pero no en Novedades ni en la newsletter. La vista y las newsletters leen hasta el límite configurado de noticias (techo de 10.000); la captura conserva el histórico completo en Sheets.

## Actualización

El paquete generado está en `dist/`. Actualizar sus archivos en el proyecto existente de Apps Script y crear una nueva versión del despliegue web. Los permisos y remitente deben estar autorizados en la instalación real. Validar Gmail con `testGmailAuthorization` o el panel administrativo y probar una suscripción con el usuario conectado. No hace falta reinicializar las hojas para estos cambios.
