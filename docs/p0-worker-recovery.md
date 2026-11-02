# Recuperación de ingesta y ventana Radar · 3.35.1

Base: `origin/develop` 6b319e0, después de la integración de PR 107.

## Correcciones

- `ensureBackgroundWorker_` solo reutiliza un activador si conserva una fecha futura válida. Una propiedad ausente se convertía en cero: el supervisor borraba `BACKGROUND_NEXT` para recuperar el activador, pero la continuación lo consideraba vigente y no lo reemplazaba.
- La primera carga de Radar utiliza 365 días aunque reciba las fechas predeterminadas de Noticias. Los rangos explícitos posteriores se conservan.

## Diagnóstico de producción

El 2 de noviembre, a las 13:46 (Madrid), la ingesta diaria existente tenía 12 tareas procesadas de 326 y 314 pendientes, sin pausa de cuota de fetch. Los 26 envíos quincenales de 16–31 de octubre seguían pendientes. La ejecución de `scheduledNewsletters_` de las 09:07 había solicitado el envío; no acreditaba entrega. No se creó otra recopilación ni se enviaron correos de prueba.

El código del trabajador se cargó mediante el editor integrado, conservando el cursor. Debe verificarse la continuación automática y el cierre de las dependencias antes de declarar resuelto el incidente.

## Corrección histórica selectiva

ID `2398fd6d-3e98-4b99-84af-bbbf10f90630`, «Ley de Economía Digital impulsará pagos más eficientes y ventas de las Pymes, dicen Visa y Mercado Pago».

Fuente original: https://expansion.mx/economia/2026/10/01/ley-de-economia-digital-impulsara-pagos-mas-eficientes-y-ventas-de-las-pymes-dicen-visa-y-mercado-pago

Tras generar la propuesta editable y validar las precondiciones, se corrigieron exclusivamente país y JSON de evidencia geográfica en las dos copias físicas: `Noticias` fila 178 (Argentina → México) y `Noticias_tax_f42ea61e-fe95-444c-9765-03d955321d98` fila 147 (España → México). La exportación posterior confirma exactamente cuatro celdas modificadas, mismos 858/835 registros, e identidad, URL, fecha, clasificación funcional y taxonomía conservadas. La invalidación no solicita reclasificación funcional completa.

Evidencias locales: `output/iteration-41/mexico-verified-diff.json`, exportaciones anterior/posterior y `output/iteration-v7/Propuesta_historico_P0.xlsx`. Estos artefactos operativos no se incorporan al repositorio.

El cierre v7 permanece subordinado a la estabilización de esta ingesta. No se ha iniciado un backfill adicional.

## Incidencias y período de Radar · 3.35.2

Los recuentos de incidencias ya utilizaban la selección común de Radar, pero su eje mensual generaba los doce meses del año final y sus textos presentaban una visión anual. Ahora el eje incluye exclusivamente los meses comprendidos entre `query.from` y `query.to`, también al cruzar de año. Los indicadores, evidencias y navegación a Noticias conservan la misma selección. La comparativa sigue utilizando el mismo intervalo del año anterior. Se reutilizan componentes y estilos existentes, sin consultas adicionales.

Validación local: 95 pruebas específicas correctas; sintaxis, diseño, permisos y distribución reproducible comprobados. La publicación y medición del nuevo cambio siguen pendientes hasta verificarlas en producción.
