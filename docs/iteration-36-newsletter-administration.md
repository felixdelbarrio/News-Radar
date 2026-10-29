# Iteración 36 · Newsletters y suscripciones · 3.32.0

## Cambios implementados

El asunto de ambas cadencias usa `[bIA] 🚀 BBVA BEI`. Los enlaces conservan los códigos canónicos para filtrar; las etiquetas visibles de los bloques eliminan los índices. Los trending topics distinguen ámbito nacional e internacional y mantienen su número de posición.

Cada entidad trimestral tiene un contenedor y un título propio. Sus bloques forman una lista seguida con **viñetas circulares**, conforme a la corrección expresa del usuario, y el ejemplo aparece después de toda la lista. Las noticias comparten chips para señales, segmento, canal, tipo de entidad y taxonomía. El mensaje de resumen usa el azul `color-primary-bg-action-pressed`, distinto al de los botones. El texto identifica el país del ámbito nacional y explicita «dentro de la mirada internacional» en el resto, conforme a la segunda corrección del usuario. La cabecera incluye siempre el logotipo oficial de Banca de Empresas e Instituciones como adjunto CID del paquete; se retira la alternativa de BBVA genérico y la dependencia de Drive para ese logo. La etiqueta de bloques termina en dos puntos. Los estilos del correo se generan también inline para clientes de email.

Administración presenta suscripciones en una tabla con correo, geografía, idioma, estado, último envío y acciones. Se conservan el alta manual, la edición, la baja, los filtros y la paginación. El alta manual ya incluía idioma; se añade al formulario de prueba y se conserva la elección tras actualizar el estado. El botón de filtros comparte dimensiones e icono sin estirarse a todo el ancho.

El histórico personal diferencia las publicaciones del corpus y los ejemplos incluidos, muestra cadencia e idioma, resume cada ámbito y añade la entidad del ejemplo. Lee exclusivamente el editorial archivado, al desplegar el resumen, sin recalcular la selección actual. La respuesta contiene solo los campos necesarios para ese resumen.

## Validación

Las cuatro variantes mantienen el corpus y sus enlaces contextuales. Las pruebas específicas verifican asunto, etiquetas, círculos, jerarquía, orden de bloques y ejemplo, idiomas de alta/prueba, filtros y carga diferida del histórico. Se ha revisado visualmente la tabla de escritorio y la newsletter en un viewport móvil de 390 px; la lista se ha verificado además mediante el DOM (`UL`, `list-style-type: disc`). No se acredita una prueba en clientes reales de correo.

Las mediciones reproducibles están en [iteration-36-measurements.json](iteration-36-measurements.json). Usan 18 noticias sintéticas, cinco calentamientos y treinta muestras por variante, sin transporte Gmail ni latencia de Google. Las ejecuciones compartieron CPU con pruebas: sus diferencias no demuestran una optimización ni una regresión de producción. Los cuatro HTML quedan por debajo de 102.400 bytes. La variación de heap no mide un pico de RAM.

## Publicación

Se ha regenerado `dist/` desde las fuentes con la versión 3.32.0. No se han enviado correos ni modificado ediciones históricas. La publicación y medición en Apps Script siguen pendientes: `clasp deployments` devuelve `No credentials found`. La integración se propone por PR a `develop`; la publicación en Google requiere una sesión autenticada. La rama de trabajo local es `codex/iteration-36`.
