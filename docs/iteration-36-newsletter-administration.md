# Iteración 36 · Newsletters y suscripciones · 3.32.1

## Cambios implementados

El asunto de ambas cadencias usa `[bIA] 🚀 BBVA BEI`. Los enlaces conservan los códigos canónicos para filtrar; las etiquetas visibles de los bloques eliminan los índices. Los trending topics distinguen ámbito nacional e internacional y mantienen su número de posición.

Cada entidad trimestral tiene un contenedor y un título propio. Sus bloques forman una lista seguida con **viñetas circulares**, conforme a la corrección expresa del usuario, y el ejemplo aparece después de toda la lista. Las noticias comparten chips para señales, segmento, canal, tipo de entidad y taxonomía. El mensaje de resumen usa el azul `color-primary-bg-action-pressed`, distinto al de los botones. El texto identifica el país del ámbito nacional y explicita «dentro de la mirada internacional» en el resto, conforme a la segunda corrección del usuario. La cabecera incluye siempre el logotipo oficial de Banca de Empresas e Instituciones como adjunto CID del paquete; se retira la alternativa de BBVA genérico y la dependencia de Drive para ese logo. La etiqueta de bloques termina en dos puntos. Los estilos del correo se generan también inline para clientes de email.

Administración presenta suscripciones en una tabla con correo, geografía, idioma, estado, último envío y acciones. Se conservan el alta manual, la edición, la baja, los filtros y la paginación. El alta manual ya incluía idioma; se añade al formulario de prueba y se conserva la elección tras actualizar el estado. El botón de filtros comparte dimensiones e icono sin estirarse a todo el ancho.

El histórico personal diferencia las publicaciones del corpus y los ejemplos incluidos, muestra cadencia e idioma, resume cada ámbito y añade la entidad del ejemplo. Lee exclusivamente el editorial archivado, al desplegar el resumen, sin recalcular la selección actual. La respuesta contiene solo los campos necesarios para ese resumen.

## Validación

Las cuatro variantes mantienen el corpus y sus enlaces contextuales. Las pruebas específicas verifican asunto, etiquetas, círculos, jerarquía, orden de bloques y ejemplo, idiomas de alta/prueba, filtros y carga diferida del histórico. Se ha revisado visualmente la tabla de escritorio y la newsletter en un viewport móvil de 390 px; la lista se ha verificado además mediante el DOM (`UL`, `list-style-type: disc`). No se acredita una prueba en clientes reales de correo.

Las mediciones reproducibles están en [iteration-36-measurements.json](iteration-36-measurements.json). Usan 18 noticias sintéticas, cinco calentamientos y treinta muestras por variante, sin transporte Gmail ni latencia de Google. Las ejecuciones compartieron CPU con pruebas: sus diferencias no demuestran una optimización ni una regresión de producción. Los cuatro HTML quedan por debajo de 102.400 bytes. La variación de heap no mide un pico de RAM.

## Comprobación en producción

La versión 139 publica 3.32.0 desde el navegador interno el 29/10/2026 a las 11:31 Europe/Madrid. Se cotejaron los diez módulos modificados con `dist/` mediante el editor. Se conserva la implementación existente, su URL, ejecución como propietario y acceso del dominio. Se confirmó `application-version=3.32.0` tras recargar la WebApp y se comprobaron la tabla real (diez filas por página) y los tres idiomas de prueba.

Medición en Apps Script con el corpus real, tres muestras por variante y sin envío de correo:

| Variante | Render, muestras en ms | HTML bytes | MIME bytes |
|---|---:|---:|---:|
| Quincenal España | 5988 / 1067 / 1137 | 57332 | 464166 |
| Quincenal global | 1035 / 1115 / 934 | 35713 | 264452 |
| Trimestral España | 2016 / 1075 / 1121 | 73340 | 538481 |
| Trimestral global | 1286 / 976 / 1112 | 44877 | 133497 |

Los resultados se conservan en [iteration-36-production.json](iteration-36-production.json). Los corpus de 129 y 226 noticias tienen las mismas huellas que la medición final de Iteración 35. No se atribuye una mejora de latencia: las muestras no controlan el estado inicial de cachés y la primera tarda 5988 ms. El logo BEI del paquete ocupa 18597 bytes y tiene un presupuesto separado de las identidades de artículos. El MIME incluye también las ilustraciones privadas configuradas. Los últimos 500 registros de Telemetria no contienen eventos `newsletter-selection`; no hay muestra histórica de esa operación para inferir percentiles de producción.

El diagnóstico temporal se retiró y se volvió a cotejar `Briefing.gs` con la distribución. No se enviaron correos ni se modificaron suscripciones o ediciones históricas durante la comprobación. Para revertir, seleccionar la versión 138 de la misma implementación.

## Validación de integración

PR #96 hacia `develop`, rama `codex/iteration-36`. El commit de código `0a53d17` supera CI, CodeQL y GitFlow y no tiene hilos de revisión pendientes. La suite estable previa obtuvo 909/910: el único fallo era el presupuesto anterior de imagen, corregido y verificado después. La ejecución completa de CI confirma la corrección. La documentación posterior no modifica el paquete desplegado.

## Ampliación de la entrega · 3.32.1

Adopción sustituye la cuadrícula que saltaba de línea por una cronología horizontal. Los laterales permiten recorrer los días ya cargados y el botón «Últimos días» vuelve al final. También admite desplazamiento táctil, flechas, Page Up/Down e Inicio/Fin, y respeta la preferencia de movimiento reducido. La ventana muestra su rango, ajusta el ancho a columnas completas y conserva la posición al redimensionar. El componente compartido tiene un único observador y no vuelve a consultar el servidor al navegar. Tamaños y estilos se centralizan en los tokens `activity-column-width`, `activity-control-size` y `activity-chart-height`, y en `dashboard.css`; se retira la regla móvil que creaba varias filas.

La búsqueda de Noticias coteja el original y las traducciones guardadas en los tres idiomas, normalizando mayúsculas y acentos. La coincidencia en titular o extracto no evita los filtros por país, entidad, fecha, canal, señal, tipo o funcionalidad. Pantalla y CSV comparten el mismo selector. Se prefiltran los candidatos y se consultan solo las claves existentes, en lotes de hasta 128. No se invoca LanguageApp durante una lectura; una traducción pendiente no puede aportar palabras que todavía no están guardadas. La huella de contenido evita recuperar una traducción obsoleta y las revisiones de traducción invalidan el plan cacheado.

Las pruebas de regresión cubren navegación, tacto, teclado, límites, redimensionamiento, período vacío, coincidencias en titular/extracto, acentos, filtros, CSV, invalidación de caché y lecturas agrupadas. La revisión visual con 61 días confirma una sola fila y ausencia de desbordamiento de página en 390 y 1280 px. La ampliación mantiene la misma implementación y deja la versión 139 como reversión.
