# Iteración 9 · 3.7.2

Trabajo realizado sobre `develop`. Se conserva la interfaz y el contrato de etiquetas.

- La lectura rechaza IDs inexistentes, duplicados y datos malformados en vez de descartarlos silenciosamente. Las asignaciones conservan su modelo, evidencia individual y un único ID principal.
- Antes de construir snapshots se valida todo el histórico preparado en lotes de 1.000 filas, con checkpoint. Se comprueban catálogo, versión de reglas, huella del texto, evidencia y categoría principal. Los tres snapshots y las hojas de noticias/catálogo se activan mediante un único manifiesto; un fallo conserva la generación anterior.
- Los cambios de origen o reglas reinician el job. Un cierre solo completa el target que acaba de publicar. La cola de cierres pendientes mantiene activo el refresco automático.
- Las secundarias necesitan un discriminante propio; expresiones solapadas de una capacidad y frases genéricas no justifican otra funcionalidad. La evidencia contextual conserva las palabras que realmente aparecen en el texto.
- La mención aislada de CONTPAQi deja de acreditar API Channel. Se conserva la integración explícita entre banca y contabilidad. Las equivalencias de negocio se actualizan una vez, preservando el resto de la configuración.
- «Ver esta edición» mantiene el periodo archivado y selecciona la pestaña geográfica, dejando vacío el filtro de país. Los enlaces ya enviados con solo país también abren esa pestaña. La prueba comprueba tanto los resultados de España como la disponibilidad de las otras pestañas.

## Validación real

El recuento inicial del 18/10/2026 no reproduce las cifras del PDF: 8.863 noticias, 351 entradas de catálogo, 0 noticias/IDs huérfanos y 0 modelos mezclados. Hay 276 noticias asignadas y 8 multietiqueta; todas sus asignaciones tienen evidencia guardada. La muestra de 18 textos reales está en `tests/fixtures/iteration9-real.json`; no constituye etiquetado independiente para estimar precisión/recall.

Antes de actualizar se verificó igualdad exacta de los 15 archivos remotos afectados con `HEAD:dist/`. Se creó una copia completa del libro y se verificó el contenido del histórico activo, incluidas sus 8.863 identidades. El reproceso incluye además 387 candidatos recuperables, que participan en el descubrimiento sin convertirse automáticamente en noticias.

El job terminó el 18/10/2026 a las 21:11:27 Europe/Madrid: 18.113 revisiones de trabajo (8.863 observaciones + 387 candidatos + 8.863 asignaciones) y 8.863 validaciones finales. Se conservan todas las identidades y campos ajenos a taxonomía, sin altas ni bajas. Resultado: 0 huérfanos, 0 modelos mezclados, 0 errores de evidencia; 274 noticias asignadas y 8 multietiqueta. Las únicas dos asociaciones retiradas eran menciones de CONTPAQi sin integración explícita. La noticia que sí describe integrar banca y contabilidad conserva API Channel. Hay 8.589 noticias sin asignación; no se ha forzado ninguna categoría.

La URL de newsletters estaba vacía y una ejecución desde el editor generaba un enlace `/dev`. Se configuró la implementación `/exec` observada y se verificó por lectura el enlace de una edición real. Esta actualización de configuración reconstruyó sus tres snapshots, sin reiniciar la taxonomía.

## Comprobaciones y tiempos

`npm run verify`: 555 pruebas correctas y cobertura global superior al 80 % en las cuatro métricas. Se verificó también la igualdad de los 15 archivos subidos con la distribución y la disponibilidad de los tres snapshots. Las pruebas cubren IDs inexistentes/malformados, modelo mixto, fallo y reintento, checkpoint incremental, idempotencia, evidencia propia y solapada, conservación de identidades y enlaces nuevos/anteriores.

El reproceso consumió 546,7 s en tres ejecuciones operativas; la telemetría de sus 183 lotes suma 367,2 s dentro de los tramos instrumentados. El tiempo de calendario incluye las pausas entre ejecuciones. No se dispone de una medida histórica homogénea del job completo para atribuir una mejora de velocidad.

| Refresco de snapshots (ms, una observación por vista) | 3.7.1 | 3.7.2 al cerrar el job |
| --- | ---: | ---: |
| Novedades | 4.835 | 3.597 |
| Noticias | 8.493 | 5.008 |
| Radar | 4.552 | 3.355 |

El primer muestreo directo del servidor (dos llamadas por vista) fue: Noticias 782/143 → 2.920/712 ms; Novedades 130/204 → 570/595 ms; Radar 206/146 → 588/576 ms. Son muestras pequeñas, todas con snapshot y caché; el aumento observado no permite certificar ausencia de regresión de latencia ni atribuirla al código. No se recalcula clasificación ni snapshots al leer una vista. CPU, memoria y cuota consumida no están expuestas por esta telemetría y no se han estimado.

La telemetría del navegador publicado registra, antes → después (ms, primera lectura de cada vista, n=1): Novedades 8.128 → 7.855; Noticias 6.979 → 6.702; Radar 4.710 → 4.552. Hay otra lectura posterior de Novedades de 4.339 ms. Se conservan las observaciones directas más lentas indicadas arriba; no es un ensayo controlado ni una certificación de rendimiento.

## Publicación

Promoción verificada en Apps Script: versión **79**, del **18/10/2026, 21:19 Europe/Madrid**, release **3.7.2**, en la implementación y URL existentes, con ejecución por el propietario y acceso del dominio. Se retiró el código de operación temporal antes de versionar. Novedades, Noticias y Radar cargan en producción. La edición real conserva el 01/10/2026–15/10/2026, España seleccionada y las otras pestañas, sin chip de filtro de país. También se comprobó un enlace anterior con `country=España`.

Archivos principales: `src/shared/taxonomy.js` y `locales.js`; `src/server/news/{TaxonomyJobs,SnapshotJobs,DashboardSnapshots,Rules,News,Classification}.gs`; `src/server/briefing/Briefing.gs`; `src/server/metrics/Maintenance.gs`; `src/server/config/{Config,Configuration}.gs`; `assets/{configuration-defaults,vocabulary-update}.json`; `scripts/preview.mjs`; pruebas y muestra real de Iteración 9; documentación y distribución `dist/` regenerada.
