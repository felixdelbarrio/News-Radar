# Cobertura de negocio y períodos · 16/10/2026

La aplicación 3.2.1 se ha publicado en la implementación 69 del proyecto existente. La URL, el propietario y el acceso de dominio se conservan. Se retiró la herramienta temporal antes de publicar.

## Selección de noticias

Se eliminó la condición empresarial obligatoria en las consultas RSS y se recuperaron los tres RSS BBVA (Empresas, Información corporativa e inglés). Los resultados se evalúan por capacidad financiera y contexto empresarial o utilidad transversal para el canal. Pagos, cobros, adquirencia, tesorería, integraciones, identidad y financiación digital pueden aportar valor aunque la noticia no use literalmente «empresas». El contenido exclusivamente de particulares, resultados corporativos, guías genéricas e incidencias individuales sigue excluido según criterios editables.

Administración → Configuración ofrece **Criterios de relevancia** y **Búsquedas por idioma**. Las listas, activaciones y roles se guardan en Configuracion; no requieren cambiar código. Las capacidades, segmentos, señales, entidades, alias, países y RSS utilizan los catálogos existentes. Cambiar criterios invalida el índice y solicita reclasificación. El vocabulario se compila una vez por configuración; los términos admiten frases y raíces terminadas en asterisco, sin expresiones regulares arbitrarias.

La cobertura se amplía mediante marcas que aparecen en titulares sin el banco matriz: Openpay y BBVA Pivot; Getnet, PagoNxt, Ebury y Cash Nexus; HSBCnet y HSBCnio; CashPro; CitiDirect y CitiBusiness. Se incorporan a los alias editables y a las consultas existentes, sin aumentar el número de perfiles por entidad y país. Se añaden términos de aceptación sin contacto, nóminas, pagos a proveedores y facturación electrónica. No se ha creado un RSS ficticio ni se atribuye Wompi a Bancolombia: el emisor identifica Grupo Cibest.

Referencias oficiales de la cobertura: [Openpay](https://www.bbva.mx/empresas/productos/medios-de-cobro/pago-electronico-Openpay.html), [Santander Payment Solutions](https://www.santander.com/es/sobre-nosotros/nuestro-modelo/payment-solutions), [Cash Nexus](https://www.santander.com/es/stories/santander-cash-nexus-tesoreria-global-en-un-solo-lugar), [HSBCnio](https://www.business.hsbc.com/en-gb/products/hsbc-nio), [CashPro](https://developer.bankofamerica.com/), [CitiDirect](https://commercialbanking.citidirect.com/commercial/eppublic/home/).

## Períodos comunes

| Vista | Newsletter | Ventana natural |
|---|---|---|
| Novedades | Quincenal | Días 1–15 o 16–último día |
| Noticias | Trimestral | Enero–marzo, abril–junio, julio–septiembre, octubre–diciembre |
| Radar | Anual | Enero–diciembre |

Una función compartida calcula los períodos, cierres y disponibilidad de entrega en la zona configurada. Las entregas se preparan tras el cierre: lunes para quincenal, miércoles para trimestral y viernes para anual. Novedades y Noticias, al abrir sin fechas explícitas, muestran el período anterior si el actual no tiene publicaciones y lo indican en pantalla. Las fechas manuales y las ediciones archivadas conservan su período. Se elimina la cadencia mensual del contrato activo; no se reescriben envíos históricos.

## Recuperación e integridad

Se analizaron las 9.160 noticias válidas del respaldo (9.163 filas físicas, tres vacías). Se restauraron 29 identificadores originales en dos pasadas: 28 en 3.1.1 y uno adicional en 3.2.0 (pagos sin contacto de BBVA México). La verificación de las 10:43 contiene 8.667 noticias válidas; 338 registros cumplen la política y 328 documentos únicos alimentan la taxonomía de 31 categorías. Se conservaron los registros históricos ajenos al ámbito. Cero identificadores duplicados y cero noticias del respaldo pendientes de recuperar según la política vigente. Los hashes de respaldos y de NewsletterEdiciones/NewsletterContenido permanecen iguales. Clasificación y taxonomía completadas; trabajador reanudado.

## Verificación

453 pruebas pasan; cobertura de sentencias 92,76 %, ramas 86,98 %, funciones 94,85 % y líneas 97,82 %. Incluyen configuración editable, invalidación, exclusiones, consultas por idioma sin multiplicación de perfiles, cambios de trimestre/año, quincenas, disponibilidad de envío, retroceso por período vacío y conservación de ediciones. Comprobaciones de sintaxis/permisos y distribución reproducible correctas. Los 15 archivos modificados de Apps Script se compararon con el paquete local guardado en Drive.

## Rendimiento

La telemetría aportada es histórica (3.0.5, 5.468 registros) y combina usuarios y versiones: Radar mediana 5.808 ms/P95 46.743 ms; Noticias 6.068/13.600 ms; Novedades 7.062/15.378 ms. No representa el P95 de la nueva publicación.

Prueba local V8 con adaptador de Sheets y corpus real, tres muestras por versión: Radar pasa de 169 a 321 publicaciones, de siete a seis lecturas y mediana de CPU de 86,78 a 97,29 ms. La consulta repetida usa cero lecturas y menos de 1,2 ms. Se amplía el contenido con un incremento pequeño de CPU; esta medida no incluye red ni latencia de Apps Script. No existe una medida de RAM de Apps Script disponible en estas pruebas: se verifican índices acotados, patrones reutilizados y lecturas agrupadas.

La medición en producción de 3.2.0 detectó un arranque de Novedades de 16.074 ms al preparar primero una quincena sin filas y después la anterior. En 3.2.1 se consulta el índice de fechas antes de preparar contenido y se evita esa primera preparación; la misma cuenta de filas se reutiliza en el calentamiento existente. newsMs incluye ya todo el tiempo de resolución y retroceso, en lugar de medir solo la última consulta. Una prueba verifica que el período sin filas prepara el contenido una sola vez.

### Observaciones de la publicación final

Mediciones guardadas por el navegador en Telemetría, versión 3.2.1; no incluyen el tiempo dedicado por el agente a inspeccionar la pantalla:

| Carga | Total navegador | Servidor | Render | Estado |
|---|---:|---:|---:|---|
| Novedades con retroceso, 10:58 | 11.077 ms | 8.028 ms | 30 ms | Caché de contenido miss |
| Noticias trimestral, 10:57 | 9.128 ms | 5.804 ms | 19 ms | Caché de contenido miss |
| Radar anual, 10:57 | 10.353 ms | 5.626 ms | 66 ms | Caché de contenido miss |
| Volver a Novedades | 59 ms | 0 ms | 59 ms | Caché cliente, cero RPC |
| Volver a Radar | 61 ms | 0 ms | 61 ms | Caché cliente, cero RPC |

El arranque anterior de Novedades (3.2.0) registró 16.074 ms/11.842 ms de servidor. El arranque observado después del ajuste registró 11.077/8.028 ms y conserva las 21 publicaciones de la quincena anterior. Son observaciones individuales con actividad de recopilación y cachés de índices/metadatos que pueden variar; no demuestran un porcentaje estable de mejora ni un P95 nuevo. Radar conserva 317 publicaciones, 45 entidades, 187 medios y 23 geografías, todas sus noticias con taxonomía, frente a las 105 publicaciones observadas antes de recuperar y reclasificar. Noticias conserva 22 publicaciones BBVA en el trimestre inicial.

Se comprobaron también Mi Newsletter (sin filtros de lectura y texto trimestral), Ejecuciones, Taxonomía, Idioma, Suscripciones, Adopción, Fuentes, Auditoría y Configuración de negocio. El panel Fuentes muestra 173 fuentes activas y sus URLs reales incluyen los nuevos alias. La programación de correo permanece desactivada tal como estaba: no se enviaron newsletters de prueba. El proceso de recopilación histórica conserva pendientes y reintentos; recuperar los registros perdidos del respaldo no equivale a completar todas las consultas externas del año.

La latencia restante se concentra en lecturas/escrituras de Sheets y en la comunicación con Apps Script; el render medido permanece entre 19 y 72 ms en cargas con servidor. Las cachés evitan releer y recalcular al volver a una selección. No se puede garantizar cobertura total del proveedor RSS ni latencia óptima absoluta a partir de estas muestras.
