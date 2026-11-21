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

## Bloqueo de acceso y recuperación

La sesión Google del usuario está abierta en el navegador interno, pero esta ejecución no dispone de la herramienta que permite controlarlo. La búsqueda de capacidades y sesiones conectadas no proporcionó un sustituto compatible. Iniciar sesión no restableció esa capacidad. No se usa clasp ni otro navegador para el despliegue.

**Limpieza pendiente:** `ClassifierShadowProbe.gs` sigue en el editor de News Radar. Contiene únicamente una función administrativa de diagnóstico, no está conectada al supervisor ni a la navegación y no crea triggers. Debe retirarse mediante el navegador interno y comprobar después los 72 archivos de base. No se declara esa retirada realizada. Copia compilada privada de diagnóstico: `/tmp/newsradar-i54-shadow-probe`.

Al recuperar acceso: retirar la sonda y comprobar integridad; publicar la biblioteca candidata como versión inmutable tras sus checks; fijar la dependencia efectiva; congelar corpus vivo/Taxonomia/revisiones y localizar los dos IDs ausentes; shadow completo con la referencia de siete; validar preservación y métricas por bloque/idioma; preparar backup/rollback y publicación atómica mediante los jobs existentes. Solo entonces actualizar histórico, activar el adaptador y retirar el motor huérfano.

Rendimiento: el ensayo lazy/sourceCount previo se retiró por no demostrar mejora p95. Sigue pendiente el perfilado controlado en producción. No se sustituye por cambios preventivos ni se atribuyen mejoras a los tiempos locales de tests.

## Verificación de esta continuación

`npm run verify` completó 1049/1049 pruebas sin fallos, con cobertura statements 92,62 %, branches 85,60 %, functions 95,59 %, lines 98,09 %. Después se ejecutaron las ocho pruebas dirigidas del comparador, incluido el pin del manifiesto de adjudicaciones, y se repitieron check/check:dist. Esto no es una comparación del corpus de producción ni una aprobación de migración.

La propuesta de biblioteca está en functional-classifier PR #2, hacia develop, con CI verificado en verde sobre a8deef7 y sin hilos de revisión abiertos en la comprobación realizada. No se ha hecho merge ni se ha publicado una versión Apps Script de esa propuesta.
