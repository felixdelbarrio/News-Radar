# Iteración 35: publicaciones en prensa y mantenimiento

Las cuatro variantes comparten cabecera, métricas y componentes. La quincenal destaca hasta tres temas por ámbito; la trimestral presenta hasta tres entidades por ámbito con sus temas y un ejemplo. Las ediciones enfocadas conservan la mirada internacional aunque no haya novedades locales. El corpus congelado incluye todas las publicaciones del período; los enlaces de entidad, tema y edición conservan ese contexto. Se suprime el botón redundante de lectura. Los iconos de valoración se reutilizan también en el formulario web.

La explicación «Por qué está clasificada aquí» se elimina del componente compartido de artículos y sus traducciones. La clasificación, la evidencia interna y los filtros se conservan.

## Recuperación del mantenimiento

La preparación de compactación escanea ocho ediciones por checkpoint, evitando una lectura completa antes de persistir progreso. Archivar y compactar tienen cursores independientes; añadir entregas no reinicia el barrido. Cada avance válido limpia el error transitorio anterior. La compactación procesa hasta ocho lotes dentro del presupuesto de ocho segundos y cede a tareas prioritarias. El plan de creación de hojas se persiste antes de llamar a Sheets: una interrupción reutiliza los mismos identificadores y no crea otra pareja de hojas. Se mantienen las verificaciones de integridad antes de sustituir datos y los archivos recuperables.

## Medidas y comprobaciones

Medición local con imágenes privadas, cinco calentamientos y treinta muestras, sin transporte Gmail:

| Variante | Render p50/p95 ms | HTML bytes | MIME bytes |
|---|---:|---:|---:|
| Quincenal enfocada | 1,88 / 2,61 | 33090 | 424303 |
| Quincenal global | 1,21 / 1,63 | 29033 | 253872 |
| Trimestral enfocada | 1,90 / 3,61 | 46151 | 493505 |
| Trimestral global | 1,80 / 2,74 | 30871 | 111431 |

Medición de solo lectura en Apps Script antes de la última memoización: quincenal enfocada 1308–2672 ms; global 1144–1191 ms; trimestral enfocada 1354–1682 ms; global 1028–1434 ms (tres muestras). Se verificó el mismo corpus de 126 y 223 noticias antes y después. No son comparaciones equivalentes de coste por tarjeta: las enfocadas pasan de tres a seis ejemplos. La muestra de los últimos 500 registros de telemetría no contenía eventos newsletter-selection; no se infieren percentiles históricos de producción. La memoización final evita repetir consultas de propiedades y PNG dentro de una misma ejecución.

Medición final en Apps Script (tres muestras, corpus actualizado de 129/226 publicaciones): quincenal enfocada 1548/721/733 ms, global 702/657/685 ms; trimestral enfocada 1172/757/718 ms, global 1041/762/797 ms. MIME real: 450121, 256485, 512305 y 118289 bytes respectivamente. No se presenta una reducción porcentual frente al corpus anterior, que tenía tres noticias menos.

59 pruebas focalizadas y 38 de archivo/recuperación superadas: presentación, MIME sin transporte, iconos, caché parcialmente expulsada, recuperación de mantenimiento, conservación de evidencia y ausencia del desplegable. Las vistas privadas se revisaron a 390 y 640 px sin desbordamientos ni imágenes rotas. CI del commit 5450382: 898 pruebas correctas, cero fallos; cobertura de sentencias 92,19 %, ramas 85,26 %, funciones 95,03 % y líneas 97,98 %. Integridad, política de ramas y CodeQL correctos; sin hilos de revisión pendientes. No se han enviado correos.

## Publicación y reversión

Los trece módulos de Apps Script se cotejaron byte a byte con dist. Se conserva el despliegue existente, su URL, ejecución como propietario y acceso corporativo. Los recursos visuales privados se resuelven mediante NEWSLETTER_VISUAL_ASSETS; no se incluyen imágenes, identificadores privados ni capturas en el repositorio público. La versión 132 permite revertir la publicación desde Gestionar implementaciones sin cambiar URL. Las nuevas reglas de selección se aplican a nuevas ediciones, sin reescribir las ya enviadas.

Publicada la versión 133 el 29/10/2026 a las 00:21 (Europe/Madrid). Se verificaron las tarjetas de Noticias y Novedades sin desplegable y el formulario con iconos oficiales, cerrado sin enviar. El mantenimiento pasó del bloqueo de preparación a compactar 11/109 ediciones en tres lotes consecutivos, sin error; el proceso completo sigue pendiente en segundo plano. Se retiraron las funciones temporales de diagnóstico y medida del código remoto.
