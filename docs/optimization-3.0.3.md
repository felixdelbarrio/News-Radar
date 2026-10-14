# Optimización 3.0.3

## Alcance

- Jerarquía de selección: total de Noticias calculado antes de la geografía local; paginación y exportación siguen usando la selección visible. Novedades conserva el total global encima de las pestañas. Los desgloses del Radar abren Noticias conservando los filtros. Los filtros de atribución y feedback de newsletters consultan sus tablas sin recargar Adopción.
- Administración: Ejecuciones, Suscripciones, Adopción, Telemetría, Taxonomía, Idioma, Fuentes, Auditoría y Configuración de negocio. El catálogo único genera HTML y navegación de teclado. En web aparece debajo del encabezado; en móvil solo al abrir Menú. Inicio administrativo en Ejecuciones; enlaces explícitos y permisos conservados.
- Un único trabajador coordina recopilación diaria, clasificación, traducción de negocio, newsletters planificadas, taxonomía trimestral, traducción de taxonomía y trabajos pendientes. Solicitudes durables, bloqueo común, lotes acotados, cursores y pausas por cuota. La revisión trimestral se deduplica por período y se omite si corpus y reglas no cambiaron. Los envíos sin confirmación impiden avanzar a taxonomía.
- Se retiran los activadores independientes de clasificación, traducción nocturna y taxonomía diaria. `updateOperationalSchedule` reconcilia los activadores existentes conservando datos y estado de habilitación.

## Validación

Pruebas automatizadas de navegación, permisos, totales, trabajos, cuotas, solicitudes simultáneas, persistencia de cursores y deduplicación. Comprobación visual local de las nueve vistas administrativas en web y móvil, así como Novedades, Noticias, Radar y Newsletter y sus filtros a 320 px: sin desbordamiento horizontal y sin controles de descarga visibles en móvil. Menú cerrado oculta las opciones; abierto las muestra; al seleccionar una se cierra. Respaldo íntegro del editor previo a la publicación en `output/optimization-3.0.3/remote-before`, comparado con HEAD sin diferencias.

## Publicación

Versión 59 publicada el 14/10/2026 a las 16:12 (Europe/Madrid), release 3.0.3, en el enlace existente. Los 18 archivos modificados se verificaron contra la distribución local después del guardado. `updateOperationalSchedule` ejecutada correctamente a las 16:11. Validación completa: 393 pruebas, cobertura 93,65 % de instrucciones y 88,54 % de ramas; comprobaciones finales de navegación, programación e idiomas: 21 pruebas. No se realizan envíos manuales de newsletters durante la auditoría.

## Resultado en producción

Las trece vistas (cuatro de lectura y nueve administrativas) se verificaron en web. Comprobación adicional móvil a 320 y 390 px: Menú cerrado/abierto, selección de Ejecuciones, Noticias y filtros. Veinte observaciones registradas en `production-ui-audit.json`: ningún desbordamiento horizontal, ningún control de descarga visible en móvil y ningún mensaje de error de aplicación. Noticias mantiene 112 publicaciones en el encabezado mientras Colombia presenta 2 de 2 en el listado. Activadores observados: `configurationEdited_`, `backgroundTick_` y `dailyRadar_`; la instalación y habilitación de entrega de newsletters mantienen su configuración previa. La validación de prioridades y del proceso trimestral se realiza con datos simulados; no se fuerza una entrega real.
