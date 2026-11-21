# Iteración 54 — adjudicaciones y puerta de migración

Estado: **NO VALIDADO / NO PUBLICADO**. Continuación del trabajo integrado en PR #146. La autorización incluye modificar la biblioteca, migrar el histórico tras validar regresión y publicar; no se solicita otra autorización genérica para esas acciones.

## Referencia aprobada y alcance

El usuario aprobó siete IDs para `17.Enablers → 17.xx Otros`; fuera de ellos deben conservarse las categorías existentes. Los siete aparecen en 12 filas del Excel de revisión, con un solo hash titular/extracto por ID. La referencia, los textos y el manifiesto de adjudicaciones se conservan exclusivamente en `output/iteration-54-private/` (ignorado por Git, permisos restringidos). No se incorporan textos reales a tests ni commits.

Son decisiones explícitas sobre registros concretos, no un patrón temático único. No se amplían heurísticas generales de Enablers para reproducirlas. La nueva API propuesta recibe adjudicaciones por ID, hash SHA-256 del texto exacto y referencia; exige fijar su revisión además de las cuatro revisiones de biblioteca.

## Comprobación real ya realizada

- Biblioteca: `fcPreflight()` terminó correctamente en su proyecto real. Se verificó el `FC_STORE_ID` configurado y la existencia de las tablas operativas antes de ejecutar el preflight.
- Consumidor: sonda `i54-shadow-cf1a5a9c-c639-4795-b33c-89aa546c2326`, editor News Radar 3.40.5, dependencia inmutable versión 1.
- Se cotejaron los 72 archivos y manifiesto del editor con el paquete de base antes de añadir exclusivamente la sonda temporal compilada. El archivo añadido se comprobó tras recargar desde el servidor.
- La lectura incluyó 851 filas de la generación publicada: se localizaron cinco de los siete IDs. Los cinco hashes titular/extracto coinciden con la referencia del Excel. Los otros dos requieren localizar su estado en las tablas/generaciones históricas; no se reinsertan ni se convierten en noticias nuevas por suposición.
- En los cinco casos, tanto la asignación vigente calculada como la persistida y la biblioteca devolvieron vacío. Por tanto, la biblioteca v1 no satisface aún las cinco adjudicaciones observadas. Esto no mide calidad global contra una referencia independiente.
- Tiempo de sonda 7011 ms; clasificación de biblioteca 1316 ms para el lote de cinco. No se confunde con latencia interactiva ni con una distribución p50/p95.
- Se fijaron y volvieron a comprobar las cuatro revisiones de biblioteca y la revisión de fuente dentro de esa ejecución. Los valores completos de esas cuatro revisiones no llegaron a persistirse en el archivo de auditoría local; no se reutiliza esa sonda como manifest completo de migración.
- No se escribieron Noticias, Taxonomia, CategorizacionLLM, snapshots ni checkpoints canónicos. La API invoca su registro habitual FC_EXECUTIONS; la lectura posterior de esa fila sigue pendiente.

## Cambios preparados

### Biblioteca functional-classifier

Código candidato 5.8.5: `reviewedAssignments` y `expectedReviewRevision` en classifyBatch/classifyShadowBatch; helper público `getReviewedAssignmentsRevision`. El registro adjudicado exige ID exacto, texto con el hash aprobado y destino válido del catálogo. Un cambio de revisión, texto o destino aborta antes de registrar la ejecución. La evidencia declara adjudicación, referencia y hash; no inventa términos literales. El motor sin adjudicaciones conserva sus reglas.

Pruebas locales: ocho tests, incluida comparación diferencial de 200 entradas sintéticas contra `functional-classifier/develop` f96510b. Los contratos ejecutables de Apps Script pasan seis casos locales. No equivale a una validación sobre todo el corpus vivo. Se añade CI de sintaxis/manifest y contratos sin nuevas dependencias. La versión de código 5.8.5 no es un número de versión Apps Script ya publicado.

### News Radar

`scripts/compare-classifier-audit.mjs` compara dos bundles congelados y una referencia aprobada. Exige igual revisión de fuente, mismos IDs y hashes, versión de biblioteca y cuatro revisiones fijadas. Resuelve bloques/códigos desde Taxonomia y verifica coherencia de IDs internos. Los registros protegidos conservan bloques, IDs internos ordenados y primaria. Los aprobados exigen exactamente el destino adjudicado; un mapeo ambiguo o un ID ausente bloquea la puerta. El número declarado de aprobaciones debe coincidir con la lista completa.

Ocho regresiones sintéticas dirigidas pasan. El comparador no certifica rendimiento ni calidad semántica global y no activa la biblioteca. El motor anterior mantiene consumidores reales y no se elimina antes de una migración verificada.

Formato de bundles: `{schema:1,sourceRevision,taxonomy:[{id,palanca,subpalanca}],records:[{id,contentHash,language,blocks,internalIds,primary}]}`. El candidato añade `library:{version,pins,reviewedAssignmentsRevision}`; la revisión de adjudicaciones se recalcula desde la referencia y debe coincidir con la fijada en el resultado. puede incluir `catalogueIds`, que se comprueban contra la taxonomía. `contentHash` aquí es SHA-256 del texto UTF-8 exacto remitido a la biblioteca, no el fingerprint JSON titular/extracto de la sonda previa. Referencia: `{approved,reviewedAssignments:[{recordId,contentHash,ids,reference}]}`.

Ejecutar: `node scripts/compare-classifier-audit.mjs baseline.json candidate.json approved.json`. Un rechazo devuelve código 1; una entrada incoherente aborta. No contiene código que escriba datos ni publique Apps Script.

## Auditoría completa y publicación visual — 21 de noviembre

El controlador oficial del navegador interno se recuperó y se comprobó la sesión autenticada. Se retiró la primera sonda y se verificaron los 72 archivos originales. Después se ejecutó una segunda sonda temporal de solo lectura sobre el corpus completo, y también se retiró antes de publicar.

La ejecución real `i54-full-shadow-5e5dedbf-395d-4bca-b87f-590714756509` congeló `llmExportSignature_()` y las cuatro revisiones durante la comparación de 851 noticias. La referencia fue la asignación efectiva del consumidor, incluida la precedencia LLM. La biblioteca inmutable versión 1 produjo 147 noticias clasificadas frente a 647 de referencia; cambió los bloques de 552 noticias y las suboperativas de 555. Dejó vacías 516 noticias previamente clasificadas. El lote de biblioteca tardó 1755 ms y la auditoría completa 6116 ms. Es una ejecución, no una distribución de latencia ni una certificación de calidad.

La puerta de activación queda rechazada. No se actualizan categorías canónicas ni se retira el motor que aún tiene consumidores. Los agregados, revisión de fuente y cuatro pins completos están en el registro privado de auditoría. Las ejecuciones pueden añadir su metadato habitual a FC_EXECUTIONS; no se confunde con una escritura de categorías.

Las exportaciones privadas confirmaron los siete IDs en Noticias canónica (858 filas); cinco están también en la generación publicada observada (851 filas), mientras dos quedan fuera de ella. Su ausencia no autoriza a reinsertarlos en la vista publicada. La taxonomía del consumidor incluye Core y Venta Digital; el snapshot de biblioteca observado no cubre todas esas funcionalidades. Hay que reconciliar catálogo y reglas antes de una nueva comparación, sin sustituir etiquetas por predicciones inferiores. Los jobs normales siguieron avanzando: cualquier migración posterior debe congelar de nuevo la fuente y descartar estas instantáneas si cambió.

Se identificó además que el digest de string sin charset conserva un contrato histórico distinto de UTF-8 para caracteres no ASCII. Los pins heredados no se cambian. La adjudicación nueva usa UTF-8 explícito tanto para texto como para manifiesto, con regresión ES/TR; la corrección está en functional-classifier PR #3, nueve tests y CI verificado en verde sobre efcc34b. La PR #2 fue integrada externamente en develop; no se ha publicado esa biblioteca candidata ni cambiado la dependencia productiva versión 1.

La publicación visual ya se realizó por el navegador interno: News Radar 3.40.6, Apps Script versión 171, mismo ID/URL y permisos del despliegue productivo anterior. Los 72 archivos, incluido appsscript.json, se verificaron por SHA-256 contra dist después de guardar. El PNG servido en la aplicación coincide con Market Pulse: `6d68c0fb8f18f9dc6702bde10163e5273bdc05b6a175d918e03bccaa2c35a6f3`. Las plantillas de newsletter están incluidas en el mismo artefacto; no se enviaron newsletters de prueba.

La comprobación posterior mostró supervisor sin trabajos pendientes, clasificación 851/851 y snapshots 3/3 completados. Son estados observados de los jobs existentes, no una migración a EDC-CatalogClassifier. Una muestra posterior de Telemetria para dashboard fue OK, 49 ms; no demuestra mejora p50/p95. La cabecera se conserva como evidencia visual privada.

Rendimiento: el ensayo lazy/sourceCount previo se retiró por no demostrar mejora p95. Sigue pendiente el perfilado controlado en producción. No se sustituye por cambios preventivos ni se atribuyen mejoras a los tiempos locales de tests.

## Verificación de esta continuación

`npm run verify` completó 1049/1049 pruebas sin fallos, con cobertura statements 92,62 %, branches 85,60 %, functions 95,59 %, lines 98,09 %. Después se ejecutaron las ocho pruebas dirigidas del comparador, incluido el pin del manifiesto de adjudicaciones, y se repitieron check/check:dist. Esto no es una comparación del corpus de producción ni una aprobación de migración.

La propuesta de biblioteca está en functional-classifier PR #2, hacia develop, con CI verificado en verde sobre a8deef7 y sin hilos de revisión abiertos en la comprobación realizada. No se ha hecho merge ni se ha publicado una versión Apps Script de esa propuesta.
