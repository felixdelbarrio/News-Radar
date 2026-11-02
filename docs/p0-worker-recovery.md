# Recuperación de ingesta y ventana Radar · 3.35.1

Base: `origin/develop` 6b319e0, después de la integración de PR 107.

## Correcciones

- `ensureBackgroundWorker_` solo reutiliza un activador si conserva una fecha válida mayor que cero. Una propiedad ausente se convertía en cero: el supervisor borraba `BACKGROUND_NEXT` para recuperar el activador, pero la continuación lo consideraba vigente y no lo reemplazaba. Una fecha ligeramente retrasada se conserva hasta que el supervisor agote su margen de recuperación; las consultas no deben posponer un activador pendiente de ejecutarse.
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

## iupana · corrección expresa del propietario

La ficha existente `iupana.com|seed_1e016f315bd0c67d` se actualiza a México (MX), sin añadir un registro duplicado. Se conserva en las semillas la misma corrección indicada por el propietario. El país editorial sigue siendo un indicio débil frente al país explícito del contenido.

El ID `c0bcf9d1-14a9-4032-bf4f-f87cf951f62d`, «Buenas Fuentes: Afirme digitaliza gastos y BBVA libera capital pyme», se corrige España → México en `Noticias` fila 286 y la copia activa fila 242. El original público identifica Afirme de México y cantidades MXN: https://iupana.com/2026/08/28/buenas-fuentes-afirme-digitaliza-gastos-y-bbva-libera-capital-pyme/

La escritura verifica el contenido JSON existente, preserva los campos funcionales y no solicita reclasificación general. Evidencia y exportaciones: `output/iteration-v7/iupana-*`. La otra noticia de iupana ya registrada en México conserva su país.

## Margen del activador · 3.35.3

La recuperación diferencia la ausencia de fecha de un activador válido que Google todavía no ha ejecutado. La prueba cubre el retraso breve sin sustitución y la sustitución por el supervisor después de su margen. Validación específica conjunta: 52 pruebas correctas. No cambia el número de fuentes por lote ni el presupuesto temporal del trabajador.

## Navegación móvil y barrera de publicación · 3.35.4

El gráfico mensual de incidencias reutiliza la navegación de Adopción: flechas laterales, desplazamiento táctil, teclado y rango visible accesible. Conserva todos los meses del filtro en una fila, con columnas dimensionadas al espacio disponible. El controlador, los iconos y los estilos son compartidos; navegar no realiza RPC ni recalcula los indicadores.

La CI detectó dos expectativas antiguas: doce meses incluso para un rango de catorce, y todos los medios pendientes salvo Expansión. Se corrigen para comprobar el rango seleccionado y la ficha verificada de Iupana. La prueba de cuota contempla también una clasificación cuya pausa finaliza después del reinicio diario.

A las 23:54 del 2 de noviembre (Madrid), las dos ingestas existentes habían procesado 326/326 y 327/327 tareas, sin fallos, pero ambas figuraban en revisión de publicación. La clasificación había procesado 844 noticias y agotado tres recuperaciones de publicación; la taxonomía y las traducciones publicaron posteriormente. La solicitud de clasificación residual bloqueaba los 26 envíos, sin cuota agotada ni error de Gmail. No había envíos planificados de ese día registrados.

La recuperación no debe consumir reintentos mientras espera una ingesta, clasificación o taxonomía todavía en procesamiento. Se conserva la fecha de espera y se inicia el margen de recuperación desde el último progreso o espera, sin elevar límites ni repetir fuentes. Cuando se agotan recuperaciones reales, el supervisor informa de revisión de publicación en lugar de afirmar que no hay trabajo.

Se ha solicitado la recuperación explícita de los checkpoints y la reinstalación de los activadores previstos. El cierre operativo y los identificadores de Gmail deben verificarse antes de declarar los envíos resueltos.

La recuperación explícita también debe reinscribir los trabajos en `SNAPSHOT_JOBS`: al pasar de `Revisar` a `Publicando` se había eliminado su registro, por lo que una publicación posterior no podía marcarlos como completados. `snapshotJob_` registra ambos estados de publicación; una prueba verifica la restitución de la barrera y la finalización sin alterar el cursor.

Verificación completa previa a esta última corrección: 1.015 pruebas correctas. Validación adicional de recuperación y snapshots, incluida la barrera restaurada: 36 pruebas correctas. La CI final incluye ambas correcciones.
