# Reparación operativa de 3.11.0 · 20/10/2026

La taxonomía canónica estaba sin publicar: 2.800 de 8.898 noticias etiquetadas, sin `CANONICAL_TAXONOMY_VERSION`. La generación visible conservaba siete categorías emergentes antiguas y 22 registros internos de bloque sin suboperativa. El corpus había crecido desde el inicio de esos trabajos.

## Cambios

- El catálogo de Administración muestra funcionalidades y `nn.xx Otros`; oculta los registros internos de bloque y distingue el origen local del maestro de Drive.
- La publicación confirma la versión canónica y poda las generaciones huérfanas, preservando tablas canónicas, generación activa, rollback con snapshots verificados y referencias de trabajos pendientes. Reiniciar un job retira sus destinos abandonados sin borrar referencias de otros trabajos.
- Las nuevas clasificaciones escriben secuencialmente en su destino temporal, conservando la lectura por fecha del origen y su cursor. Los trabajos anteriores siguen siendo reanudables con su distribución original. Las demás escrituras dispersas se agrupan en rangos acotados, conservando las filas intermedias. Cada lote de generación hace un solo `flush`, seguido de verificación.
- Los checkpoints de taxonomía limpian los fragmentos sobrantes. Una creación de hoja interrumpida repara su cabecera al reintentarse. La compactación física conserva el ancho del esquema y todas las celdas ocupadas.
- Traducciones actualiza la clave existente, compacta duplicados y contenido ajeno al corpus activo o su rollback, y traduce solamente el titular cuando el extracto está vacío. La cuota diaria persiste una pausa hasta el siguiente reinicio local.
- La caché revisada dura seis horas, normaliza la selección y precalienta todos los idiomas y geografías de los snapshots. El índice de traducciones se comparte por revisión y cantidad de filas. Los fallos de escritura en caché no abortan consultas.
- El guardado crea un único trigger de reanudación. El worker reutiliza su inventario de propiedades y conserva una comprobación de pausa tras cada operación para detectar escritores concurrentes. Los RPC secundarios esperan al dashboard inicial.
- La telemetría no oculta el error original si Sheets también falla al registrar el diagnóstico. Los monogramas omiten signos iniciales.

## Comprobación local

`make build`, `make check`, `make check-dist`, `npm test` y `make verify`: 609 pruebas correctas. Cobertura global: 92,44 % de sentencias, 86,68 % de ramas, 94,78 % de funciones y 97,97 % de líneas. Incluyen regresiones de checkpoints, traducción sin extracto, claves duplicadas, cuota diaria, compacción, caché prescindible, conservación de generaciones y precalentamiento multilingüe.

## Comprobación en Google

Se modificaron y releyeron los archivos desde el editor de Apps Script, sin clasp. La distribución local se contrastó con el código remoto antes y después de cada cambio.

La compactación inicial redujo la asignación de **5.899.218 a 1.494.684 celdas** (74,66 %). Esta medida describe espacio de la cuadrícula; no es una estimación de latencia. Tras compactar se completó el etiquetado canónico de 8.984 noticias. Hubo un timeout adicional al crear la siguiente generación al final de una ejecución larga; se reanudó desde una nueva ejecución.

La comprobación final conserva exactamente las **8.984 noticias**: se comparó un SHA-256 de IDs, fechas, titulares, extractos y URLs, ordenados por ID. También se validaron el esquema, versión, revisión y huella de contenido de cada clasificación, y el modelo y la evidencia de cada asignación taxonómica. Ambos jobs están `Completada`; hay 620 noticias con etiqueta digital.

El modelo activo contiene 322 funcionalidades del maestro, **22 `nn.xx Otros`** y 22 registros internos de bloque que no se muestran como funcionalidades en Administración. No contiene las siete categorías emergentes antiguas. `CANONICAL_TAXONOMY_VERSION` es `3.11.0`.

La limpieza deja 6.089 traducciones de noticias (857 entradas duplicadas u obsoletas menos), 688 traducciones de nombres (14 antiguas menos) y solamente la cabecera de `TaxonomiaTrabajo`. Se conservan las 30 ediciones y los 2.032 registros de contenido de newsletter. Las 25 pestañas restantes corresponden a tablas vigentes, generación activa y rollback verificado; el espacio final es **1.489.722 celdas**, un **74,75 % menos** que al inicio.

Las nueve combinaciones de Noticias, Novedades y Radar con español, inglés y turco respondieron con `snapshotHit=true`. La traducción real de un titular sin extracto devolvió un titular traducido y `extracto: ''`. Se reanudó la programación con un único trigger de background y se eliminaron el archivo y las propiedades temporales de reparación.

El checkpoint de 7.800 noticias se verificó y trasladó al destino secuencial antes de continuar, conservando el cursor. Los primeros lotes posteriores observados tardaron 4–6 segundos por 100 noticias; no es un benchmark pareado ni un SLA.

[Informe y hashes de lectura del código remoto](repair-3.11.0-live.json).

La **versión 88** se publicó el 20/10/2026 a las 10:53 Europe/Madrid sobre la implementación existente, manteniendo su URL y acceso del dominio. El instrumento temporal de reparación quedó fuera de la versión publicada.

La comprobación visual sobre la versión publicada confirma las 22 filas `nn.xx Otros`, su origen «Clasificación local» y el progreso `Completada 8984/8984`. Se sincronizaron las marcas de última ejecución con los timestamps reales de los jobs y se reconciliaron los contadores del catálogo: 1.662 asignaciones, 47 filas con noticias, sin alterar el identificador funcional del modelo ni las asignaciones. Se reconstruyeron los tres snapshots tras esa conciliación.
