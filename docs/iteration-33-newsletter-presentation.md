# Iteración 33: presentación HTML de newsletters

Rediseño compartido para quincenal/trimestral y geografía enfocada/global, desde `develop` en `feat/newsletter-wow-presentation`. Los cambios afectan a la presentación, dos traducciones de controles y una corrección demostrada del lector histórico. No hay cambios de esquema ni migración de datos.

## Referencias y decisiones

El ZIP contiene cuatro pares Origen/Objetivo (ocho PDF); los dos PDF de cada par son idénticos. La referencia de diseño objetivo son los cuatro HTML de los ZIP interiores y los PresentAitor. Los textos y cifras de esos prototipos son ejemplos y no alimentan el código. Se inspeccionaron las 21 páginas únicas de los PDF y el footer de origen.

| Variante | Origen | Objetivo del prototipo | Implementación |
| --- | --- | --- | --- |
| Quincenal enfocada | Apertura, tarjetas locales e internacionales | Cabecera blanca, contexto compacto y superficies suaves | Una apertura; sección local y exterior según las tarjetas existentes; titular enlazado a la noticia |
| Quincenal global | Una selección internacional | Tarjetas suaves y CTA de edición | Sin sección local artificial; entidad y país siempre visibles |
| Trimestral enfocada | KPIs y rankings locales/globales, destacados | Cifras, highlight, rankings y acción | Los mismos dos paisajes y racionales; highlight azul por paisaje y rankings en tablas |
| Trimestral global | Un paisaje, rankings y destacados | Cifras globales, highlight y movimiento internacional | Una sola instancia de los módulos; cuatro KPIs existentes y hasta tres tarjetas existentes |
| Footer común | Firma bIA, gestión/baja y valoración | Conservar composición de origen y elevar valoración | Firma conservada; «¿Te ha resultado útil?» debajo, con botones Útil/Mejorable |

Las ilustraciones decorativas de los prototipos se omiten: no forman parte del catálogo existente y aumentarían el MIME. Se usan el logo BBVA existente (derivado para email a 224 × 67, paleta de 32 colores, 2.040 bytes), bIA y los logos/banderas existentes. Georgia y Arial/Helvetica son fuentes seguras; no se añaden fuentes web. Las cifras permanecen sin enlace porque el lector segmenta el corpus por geografías y no siempre representa exactamente el denominador del KPI. Los enlaces de bloque, entidad y rankings sí conservan contexto de edición. No se añade tracking.

## Capturas

Los ejemplos siguientes se generaron con el mismo corpus sintético de 18 noticias en las cuatro combinaciones. No publican noticias ni identificadores de las referencias privadas. Se verificaron 390 px de ancho, cero imágenes rotas y cero desbordamiento horizontal en cada variante. Se dispone además de una matriz local Origen → Objetivo → Implementado en `output/iteration33/review.html`; no se suben los prototipos adjuntos al repositorio público.

| Variante | Escritorio, 1280 px | Móvil, 390 px |
| --- | --- | --- |
| Quincenal enfocada | [Captura](newsletter-presentation/fortnightly-focused-post-desktop.png) | [Captura](newsletter-presentation/fortnightly-focused-mobile.png) |
| Quincenal global | [Captura](newsletter-presentation/fortnightly-global-post-desktop.png) | [Captura](newsletter-presentation/fortnightly-global-mobile.png) |
| Trimestral enfocada | [Captura](newsletter-presentation/quarterly-focused-post-desktop.png) | [Captura](newsletter-presentation/quarterly-focused-mobile.png) |
| Trimestral global | [Captura](newsletter-presentation/quarterly-global-post-desktop.png) | [Captura](newsletter-presentation/quarterly-global-mobile.png) |

## Contratos preservados

| Contrato | Evidencia |
| --- | --- |
| Identidad, preheader y texto plano | Cuatro golden fixtures conservan el contrato editorial; asunto y texto plano trimestrales solo cambian en el copy de periodo solicitado |
| IDs, orden, categorías, hechos, racional, métricas, ámbito, corpus/evidencias y traducción | Igualdad completa de `editorial`, `items`, `evidence`, `count`, `total`, `translationReady` y resto de salida no HTML |
| Selección, ranking, deduplicación, repetición, cadencias y fechas | `Digest.gs`, `History.gs`, `Delivery.gs` y `Subscriptions.gs` intactos; regresiones existentes |
| Archivo y snapshots | `Reading.gs` intacto; las pruebas abren todos los enlaces de edición de las cuatro combinaciones y repiten tras cambiar los catálogos |
| Feedback, permisos y autoría | `Feedback.gs` intacto; navegación GET solo precarga intención; persistencia mediante `saveNewsletterFeedback` existente |
| Gmail y destinatarios | `Mail.gs` intacto; regresiones de estados, autorización, destinatario individual y MIME |
| Eventos/adopción | Sin cambios de instrumentación; no se afirma medir aperturas ni clicks externos |
| Recursos inline | Por cada CID usado se comprueba un único adjunto con sus bytes y alt; sin imágenes remotas ni base64 en HTML de envío |

La única corrección fuera del render es `newsReadingGeography_` en `Selection.gs`: la rama internacional de una quincenal devolvía una función sin `own` ni `members`, provocando `TypeError` al generar pestañas o filtrar «Otras geografías». Ahora copia las propiedades del agrupador congelado y define `members` para su agrupación internacional. La nueva prueba de enlaces reproduce ambos fallos previos y comprueba que sobreviven a cambios del catálogo. No cambia selección ni corpus editorial.

## Medidas reproducibles

`node scripts/benchmark-newsletter-presentation.mjs <directorio>` utiliza el mismo fixture y la misma VM local para las cuatro variantes. Se descartan cinco calentamientos y se miden 30 renders por variante; `newsletterInline_` se cronometra dentro de cada render. El MIME real del transporte existente se construye y captura con Gmail simulado. Los datos crudos están en [baseline.json](newsletter-presentation/baseline.json) y [post.json](newsletter-presentation/post.json).

| Variante | Render p50/p95 ms, antes → después | Inline p50/p95 ms, antes → después | HTML bytes, antes → después | MIME bytes, antes → después | CID nº / bytes, antes → después |
| --- | --- | --- | --- | --- | --- |
| fortnightly-focused | 0.584/0.882 → 1.966/2.796 | 0.076/0.391 → 0.266/0.596 | 18375 → 24598 | 46740 → 58217 | 7 / 12969 → 8 / 15009 |
| fortnightly-global | 0.477/0.743 → 1.612/4.368 | 0.070/0.121 → 0.252/0.928 | 17962 → 23801 | 46144 → 57091 | 7 / 12969 → 8 / 15009 |
| quarterly-focused | 0.865/1.800 → 2.205/4.181 | 0.175/0.362 → 0.473/1.315 | 31548 → 39775 | 69060 → 83487 | 9 / 15448 → 10 / 17488 |
| quarterly-global | 0.528/0.760 → 1.874/3.823 | 0.111/0.169 → 0.385/0.957 | 25934 → 32688 | 61184 → 73589 | 9 / 15448 → 10 / 17488 |

La generación incluye el render e inlining y excluye transporte real. No hay lecturas adicionales del simulador de Sheets en las 30 muestras después del calentamiento. El delta de heap de proceso se publica como dato bruto, sin compararlo como memoria máxima: el GC no se ha forzado y puede producir deltas negativos. Estas mediciones locales no demuestran mejoras de rendimiento en Apps Script. El HTML crece por las tablas y estilos inline, y las imágenes aumentan 2.040 bytes por el logo de cabecera; no se oculta ese coste.

## Verificación operativa y promoción

Antes de editar se verificaron acceso de edición al proyecto y a la hoja, navegación de archivos, ejecuciones y despliegues, y permisos de escritura GitHub. La implementación activa anterior era la versión **125**, con descripción «3.31.0 Robustez en los jobs». Se copió el contenido completo de Briefing.gs, Landscape.gs, Newsletter.gs, Selection.gs, Locales.gs y Client.html mediante el editor del navegador integrado. Las seis copias coincidían byte a byte con `origin/develop` (`c5d4842`). El backup y sus SHA-256 se conservan en `tmp/iteration33/remote-backup/manifest.json`.

El paquete reproducible está en `dist/`; la presentación cambia seis módulos remotos y la recuperación del mantenimiento cambia `Maintenance.gs` y `Archives.gs`. No cambian manifiesto, versión de aplicación, configuración, permisos, activadores ni tablas. Los módulos compilados se guardaron en Apps Script y se verificaron tras recargar el editor, con igualdad exacta respecto a `dist/`. Una función temporal de diagnóstico ejecutó las cuatro variantes con datos reales en modo solo lectura; las cuatro devolvieron HTML y recursos CID, sin operaciones de escritura ni envío. La función temporal se eliminó después de verificar los resultados. No se utiliza `clasp`.

Con autorización expresa del usuario se actualizó la **misma implementación de producción** a la versión **126** el 28 de octubre de 2026 a las 8:54 (Madrid), descrita «3.31.0 · Iteración 33 · Presentación de newsletters». El ID `AKfycbxpg3fwOGwS3Q5oQcjB1xTWd2J1F1-wfW0R5zM0rkR37Qvq589-8PtRcu2FP-HDEQKG` y su URL permanecen iguales. Se conservaron «Ejecutar como: Yo» y «Quién tiene acceso: Cualquier usuario de Bbva.com». Apps Script mostró «La implementación se ha actualizado correctamente. Versión 126». La captura de evidencia local está en `output/iteration33/production-deployment.png`. El usuario indicó **publicar sin enviar correos**; no se hicieron envíos de prueba ni se generaron votos de producción.

Rollback preparado:

1. Devolver la misma implementación a la versión 125 desde «Gestionar implementaciones», conservando el ID y la URL.
2. Restaurar las seis fuentes desde el backup local para los activadores que ejecutan Principal y releerlas tras guardar.
3. No reescribir ediciones ya enviadas ni borrar filas ajenas.

La validación visual se ha hecho en el navegador integrado. No se declara comprobación de render real en Gmail web/móvil ni Outlook, latencia remota, tiempo de envío ni lecturas reales de Sheets. El HTML incluye tablas de presentación, estilos inline, un contenedor condicional MSO de 640 px, preheader oculto, fuentes de sistema y texto alternativo. Los botones conservan área de clic completa incluso sin bordes redondeados.

## Validación local final

- `make install check-dist verify preview codeql`: finalizado correctamente. Incluye instalación con lockfile, distribución reproducible, sintaxis/permisos/diseño, batería completa con cobertura, preview y preparación de fuentes para CodeQL.
- **876 pruebas correctas, 0 fallos**. Cobertura: líneas **97,91 %**, sentencias **92,07 %**, funciones **94,88 %**, ramas **85,15 %**.
- 11 pruebas nuevas de presentación: paridad editorial salvo los dos copies solicitados, CID/MIME, enlaces no vacíos con sus filtros, histórico tras cambios de catálogo, fallbacks/aliases, URLs inseguras, escapes, idiomas, textos extensos y cero noticias.
- Comprobaciones locales de GitFlow y `git diff --check` correctas.
- La suite existente de feedback y eventos comprueba persistencia autenticada y permisos; no se han enviado correos ni creado votos de producción.

La eliminación previa de `dist.txt` en el directorio de trabajo no forma parte de esta entrega y se ha mantenido fuera del commit.

## Ajustes posteriores y mantenimiento

Por indicación del usuario se retiró «Leer noticia» de las cuatro variantes; el titular conserva su enlace directo. La quincenal usa el nuevo copy de canales digitales de Banca de Empresas e Instituciones. El periodo trimestral añade el mismo contexto a cada trimestre y año; cambia el asunto y el texto plano en esa frase, sin alterar el resto del contrato. Las ocho capturas y las medidas `post.json` se actualizaron.

El mantenimiento real quedó en `Revisar`, fase `newsletters`, con `0/4023`, tres timeouts de Hojas de cálculo y sin activador pendiente. La causa del bloqueo persistente era que el tercer timeout se trataba como fallo definitivo. `Maintenance.gs` ahora reconoce ese timeout en español o inglés, preserva fase/cursor, aplica espera exponencial acotada a 30 minutos y permite recuperación automática desde `Revisar`. Otros errores siguen requiriendo revisión. `startMaintenance` reanuda un timeout conservando el progreso. `Archives.gs` recorre las ediciones en lotes de ocho con un cursor persistente, en vez de cargar todas las ediciones en cada intento. Cuatro pruebas cubren la recuperación y el avance por lotes.

La misma implementación se actualizó a la versión **127** el 28 de octubre de 2026 a las 9:13 (Madrid), conservando ID, URL y permisos. Se ejecutó `startMaintenance` desde el editor; el panel pasó de `Revisar` a `Pendiente` sin reiniciar el trabajo. La captura está en `output/iteration33/production-deployment-v127.png`. No se enviaron correos.

Un nuevo timeout durante la fase de newsletters confirmó la necesidad de acotar la lectura de ediciones. La implementación se actualizó a la versión **128** a las 9:21, en la misma URL y con los mismos permisos. `Archives.gs` remoto coincide exactamente con el paquete compilado tras recargar el editor. La evidencia local está en `output/iteration33/production-deployment-v128.png`.
