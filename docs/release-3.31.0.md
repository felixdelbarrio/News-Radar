# News Radar 3.31.0 · propuesta de publicación

Rama `codex/news-radar-3-31-0`, basada en `develop` (`ef47559`). Sin cambios de producción ni envíos de correo.

## Cambios

- Retención inicial de logs: 500 filas; validación hasta 5000. Migración única de valores persistidos <=20, sin volver a sobrescribir decisiones posteriores. Adopción queda fuera de la poda operativa.
- Se elimina el helper de recuperación anual y su ruta de preview. Se conservan consultas anuales, ventanas históricas y trabajos existentes. La compactación conserva tareas y resúmenes sin job demostrablemente conocido.
- Geografía desconocida y procedencia coherentes en ingestión y lectura. El corpus leído no contiene registros con `paisMetodo=apac_fallback`: no se propone migración geográfica histórica.
- Extractos después del mantenimiento crítico; se omiten fuentes con ventana explícitamente incompatible. Sin reclasificación implícita.
- Altas de medios por append hasta 600; ninguna reescritura del catálogo completo.
- Máximo tres recuperaciones de publicación sin progreso durante diez minutos. Fallo visible, sin completar trabajos por agotamiento; se mantiene la barrera de snapshots verificados y la generación anterior.
- Deduplicación: primera lectura de nueve columnas necesarias, frente a trece. Se leen registros completos solo para archivar las bajas verificadas.
- La capacidad principal demostrada prima sobre el instrumento auxiliar. Se conservan secundarios con evidencia independiente y los IDs del catálogo. Empleo genérico queda excluido. Lanzar un piloto no se etiqueta como disponibilidad de producto: se utiliza la señal existente `Mejora de oferta`.
- Newsletter: CSS fuente y markup mínimo para eliminar cifras duplicadas ya presentes en los KPIs y en el texto ejecutivo. Tokens, frontend, enlaces, tracking, suscripciones y feedback conservados. `dist/` se genera con build.

## Piloto funcional

Copia local leída del Sheet corporativo: 1009 noticias, catálogo de 366 entradas, 26 registros LLM. El ensayo del código real propuso y aplicó 37 cambios en siete lotes locales, con siete archivos verificados. Segunda aplicación idempotente y reversión exacta de todas las celdas; IDs, número de filas y evidencia LLM conservados. No aplicado al Sheet real.

Distribución de los cambios propuestos: 5 Tarjetas → Pagos (Bre-B financiado con tarjeta); 12 Pagos → Adquirencia; 9 Cuentas → Pagos; 10 Enablers → Home; 1 exclusión de empleo. Los datos anteriores, la propuesta y la evidencia por ID están en el informe privado local; no se publican datos del Sheet en Git.

Tras autorización y despliegue, ejecutar `previewFunctionalPilot({offset,limit:100})` por lotes. Revisar `changes`, `distribution` y `digest`; pasar el resultado revisado a `applyFunctionalPilot`. Un digest obsoleto bloquea escrituras. Cada lote conserva un archivo verificado mediante el mecanismo existente; `restoreFunctionalPilot({digest})` revierte únicamente esas celdas y rechaza cambios concurrentes. Un reintento tras escritura parcial utiliza el mismo archivo. Aplicación y reversión invalidan los derivados y solicitan snapshots; no modifican ediciones enviadas.

## Verificación

Regresiones específicas: retención y migración única, límite incremental de medios, huérfanos no demostrados, tres recuperaciones, clasificación principal, exclusión de empleo, mantenimiento antes de HTTP y piloto con crash/reintento/rollback.

Comparación de las dos newsletters con el mismo corpus, ventanas y generador real antes/después: asuntos, IDs, enlaces y texto plano iguales. Solo se normalizan, para comparar el texto HTML, las repeticiones eliminadas del resumen trimestral y del primer puesto del ranking. HTML final sin variables CSS pendientes y muy por debajo de 102400 bytes. Las capturas locales verifican la presentación; no certifican Gmail corporativo ni su inversión automática de colores.

La verificación completa de Makefile y CI se documentará en la PR al terminar. Los artefactos visuales y el ensayo histórico permanecen en `output/release-3.31.0/` y `tmp/v331-private/`, fuera de Git.

## Pendiente antes de publicar

Validación real de Gmail corporativo en escritorio/móvil y modo oscuro (el usuario ha indicado dejarla pendiente y no crear borradores); autorización de despliegue; respaldo nativo de producción; actualización de Apps Script por navegador; dry-run nuevo y aplicación de los lotes revisados sobre el Sheet actual; comprobación de snapshots, mapa, versión y telemetría comparable. Sin estas comprobaciones no se afirma aceptación de producción.

No se amplía `ARCHIVE_WORK`: falta una medición de producción que justifique el aumento dentro del presupuesto temporal. Los índices existentes de períodos, Radar e índice LLM ya están implementados; no se añade una optimización hipotética ni índices persistentes nuevos.
