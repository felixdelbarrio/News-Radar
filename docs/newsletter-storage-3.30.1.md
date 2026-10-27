# Newsletter storage fix · 3.30.1

La prueba trimestral fallaba al escribir 53.414 caracteres en la celda `NewsletterEdiciones.editorial`; Google Sheets admite 50.000. El campo incluía todas las equivalencias del catálogo geográfico, los IDs de todo el corpus y un registro por cada noticia descartada. La maqueta y la selección local se habían probado sin reproducir el límite real de almacenamiento.

El snapshot histórico conserva las tarjetas, los recuentos, el contexto, los países y regiones necesarios para filtros y exportación. Omite los IDs redundantes del corpus y las reglas de búsqueda del catálogo; agrega descartes por motivo. El mismo caso real pasa a 11.468 caracteres (−78,5 %). El corpus íntegro continúa guardado como una fila por noticia.

Antes de escribir cualquier fila se validan todas las celdas de contenido y metadatos. Una entrada que exceda el límite produce un diagnóstico controlado sin añadir contenido parcial. Las pruebas emulan el rechazo de Sheets y cubren una trimestral de 1.000 noticias, recuperación histórica, inmutabilidad del objeto original y rechazo previo a escritura.

El formulario de pruebas usa el espaciado central de formularios y separa el botón del selector de geografía en móvil.
