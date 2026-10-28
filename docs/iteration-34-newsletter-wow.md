# Iteración 34: narrativa e identidad de newsletter

La quincenal y la trimestral muestran, para una geografía concreta, todo el análisis y las noticias locales antes de la mirada internacional. La variante global conserva una sola mirada. Los ejemplos contiguos al hallazgo principal se toman de las tarjetas ya seleccionadas, con el mismo ámbito y bloque funcional; si no hay tarjeta compatible, se omite el ejemplo. No cambian selección, corpus, métricas, clasificación, titulares ni destinatarios.

El logo BEI y las tres ilustraciones se cargan en producción desde Drive por ID configurado en la propiedad privada de Apps Script `NEWSLETTER_VISUAL_ASSETS`. La propiedad asigna `bei-logo`, `fortnightly-visual`, `quarterly-visual` y `other-banks-visual` a sus archivos. El repositorio público no contiene los PNG ni sus identificadores. Se verifica tipo PNG y un máximo de 200 kB; se cachea el contenido en fragmentos y se utiliza CID. Si falla la lectura, la cabecera conserva el logo BBVA anterior y la ilustración se omite. La ilustración internacional solo se usa en una edición enfocada con contenido internacional. Se conservan logos de entidades, banderas, nombres de medios, enlaces y firma bIA con feedback. El catálogo actual de medios no contiene un logo verificable, por lo que sigue visible el nombre textual.

## Verificación

- Cuatro variantes generadas en VM local sin invocar Gmail remoto; contratos editoriales comparados con los fixtures de iteración 33.
- Enlace de cada noticia presente una vez; ejemplos del tema y ámbito correctos; local completo antes de internacional; la global carece de sección local.
- Cada imagen visible tiene `alt` y CID con bytes MIME; no hay URLs de Drive en el HTML. Los enlaces contextuales recuperan la edición congelada.
- Recursos privados examinados visualmente en una vista local ignorada por Git. Las imágenes están etiquetadas TLP:BLACK en Drive y sus capturas no se suben al repositorio público.

## Medidas locales

Mismo corpus sintético de 18 noticias y VM de las medidas de iteración 33; 5 calentamientos y 30 muestras. Gmail y Sheets son simulados. Las imágenes son los PNG reales facilitados, solo en el entorno local. Los valores de producción pueden diferir.

| Variante | Render p50/p95 (ms) | Inline p50/p95 (ms) | HTML (bytes), iter. 33 → 34 | MIME (bytes), iter. 33 → 34 | CID (nº / bytes), iter. 34 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quincenal enfocada | 1,074 / 2,005 | 0,133 / 0,608 | 24.598 → 25.792 | 58.217 → 391.993 | 10 / 257.455 |
| Quincenal global | 0,678 / 2,099 | 0,108 / 0,750 | 23.801 → 24.518 | 57.091 → 225.532 | 9 / 137.246 |
| Trimestral enfocada | 1,466 / 6,911 | 0,312 / 2,668 | 39.775 → 40.684 | 83.487 → 467.105 | 12 / 296.645 |
| Trimestral global | 0,934 / 2,522 | 0,188 / 0,449 | 32.688 → 33.259 | 73.589 → 292.064 | 11 / 176.436 |

El tamaño MIME aumenta por las ilustraciones solicitadas; incluso la variante más grande queda bajo 0,5 MB en esta muestra. No se han enviado correos de prueba ni reales desde esta validación.

Rollback: seleccionar la versión anterior de la misma implementación de Apps Script y restaurar los módulos anteriores desde `tmp/iteration33/remote-backup`. La propiedad privada de recursos puede eliminarse sin interrumpir la generación: las imágenes tienen fallback.

## Publicación

Los módulos `Briefing.gs`, `Landscape.gs`, `Newsletter.gs`, `Locales.gs` y `Client.html` se guardaron en Apps Script mediante el navegador integrado y se compararon byte a byte con `dist/`; `Briefing.gs` se volvió a comprobar tras recargar el editor. La propiedad privada se configuró mediante una función temporal y, en una ejecución de solo lectura, los cuatro recursos devolvieron PNG válidos de 18.597, 105.680, 142.391 y 120.209 bytes. Ambas funciones temporales se retiraron del código principal. No se invocó Gmail.

La implementación existente se actualizó a la versión **129** el 28 de octubre de 2026 a las **14:26** (Madrid), conservando ID, URL, ejecución como propietario y acceso para usuarios de `bbva.com`. Captura local ignorada por Git: `output/iteration34/production-v129.png`. Rollback inmediato: volver a la versión **128** de la misma implementación; los cinco módulos previos están respaldados localmente en `tmp/iteration34/remote-backup-v128/`.

El panel de producción a las 14:28 mostraba la recopilación diaria 291/320 y mantenimiento 0/4023, esperando a esa tarea y con previsión de reintento 14:29 tras un timeout de Sheets a las 12:56. Por tanto, la reanudación automática está programada, pero todavía no se declara completado el mantenimiento.

Tras completar la recopilación 320/320, clasificación 4/4, snapshots y traducción 816/816, el panel mostró otra causa de espera: archivado de logs y mantenimiento tenían la misma prioridad, pero el selector elegía siempre archivado cuando ambos estaban listos. `Background.gs` ahora les alterna el turno cuando coinciden; las prioridades superiores y los cursores permanecen intactos. La prueba nueva reproduce ambos trabajos listos, verifica el turno alterno y el caso donde solo queda mantenimiento. Se ejecutaron `npm run build`, `npm run check`, `npm run check:dist` y 21 pruebas focalizadas sin fallos.

`Background.gs` se guardó y comparó byte a byte con `dist/` tras recargar Apps Script. La misma implementación se actualizó a la versión **130** el 28 de octubre de 2026 a las **14:54** (Madrid), con ID, URL y permisos intactos. Captura local: `output/iteration34/production-v130.png`. Rollback de esta corrección: versión **129** y copia local `tmp/iteration34/remote-backup-v129/Background.gs`. La finalización del mantenimiento debe verificarse por su propio progreso, no por el éxito del despliegue.
