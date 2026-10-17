# Catálogo funcional · 3.3.0

El catálogo del Excel aportado sustituye las agrupaciones heurísticas de la taxonomía. Las pestañas Soluciones Funcionales y Capacidades canal (core y VD) aportan **322 funcionalidades y 22 bloques**. Los códigos, nombres y equivalencias quedan en `Configuracion`, clave `taxonomy`; el código generado de Defaults solo inicializa esa configuración. Noticias, filtros, Radar, newsletters, administración, idiomas y CSV presentan Bloque funcional y Funcionalidad / Sub Operativa.

El [inventario completo](functional-taxonomy-3.3.0-catalog.md) revisa las 322 filas y sus equivalencias. La [auditoría reproducible](functional-taxonomy-3.3.0-audit.json) contiene recuentos por bloque y medidas locales. `node scripts/audit-functional-taxonomy.mjs` compara la revisión actual con HEAD sobre las muestras de fuentes guardadas.

## Decisiones del catálogo

- El prefijo 13 reúne dos bloques distintos: Sostenibilidad y Salud financiera. Se conservan ambos nombres y los códigos 13.01–13.04; no se inventa otra numeración corporativa.
- Se unifica la capitalización de Herramientas Empleados. Las referencias 19.XX y 20.XX de Soluciones Funcionales se resuelven mediante las 32 filas concretas de Capacidades canal; no se cuentan como funcionalidades.
- Se conservan las identidades oficiales aunque sus nombres coincidan: 07.13/07.14 (Convenio CEE), 16.02/19.20 (Login con coexistencia) y 17.03/21.01 (Espacios comerciales). La coincidencia de noticias no demuestra que dos funcionalidades corporativas sean intercambiables. Venta Digital añade sus propias capacidades 20.xx.
- Hay equivalencias adicionales en 107 funcionalidades. El resto mantiene su nombre oficial como evidencia precisa. Si la noticia solo permite identificar un bloque, se registra sin inventar una funcionalidad ni asignarla a una landing genérica.

## TF-IDF y conservación de noticias

TF-IDF no crea bloques ni transforma bigramas frecuentes en categorías. Las reglas de cada bloque contienen conceptos emergentes admitidos, un nombre canónico y sus expresiones equivalentes. El editor permite incorporar y retirar estos conceptos sin cambiar código. La frecuencia documental, el TF-IDF suavizado y la evidencia de al menos tres documentos de dos medios distintos determinan su publicación. Hay un máximo de tres propuestas por bloque; se excluyen equivalencias ya presentes en el catálogo y propuestas con evidencia redundante.

La regla inicial de stablecoins reconoce expresiones en español e inglés y publica `03.xx Pagos con stablecoins` únicamente cuando cumple esos umbrales. No asigna números corporativos. Una tendencia sin regla semántica admitida sigue siendo recuperable y clasificable por su bloque; requiere revisar las reglas antes de convertirla en una funcionalidad. Esta restricción evita atribuir entidad propia a un adjetivo, un verbo o una repetición publicitaria.

La clasificación no elimina noticias. Los códigos de almacenamiento y de los filtros mantienen una única implementación; no hay una capa de traducción entre dos esquemas de datos. Las etiquetas visibles y los encabezados del CSV utilizan la nueva terminología.

## Recuperación

Se conservan las consultas generales y los RSS existentes. Se amplían las capacidades de recuperación de 43 a 51 con nóminas, impuestos/servicios, adquirencia/terminales, inversión/depósitos, sostenibilidad/salud financiera, seguros empresariales, venta digital y pagos con activos digitales. El vocabulario de español e inglés se incorpora también a instalaciones existentes, conservando las ediciones del administrador.

Las consultas complementarias mantienen seis términos y los límites de longitud y peticiones; la selección rota por día natural en la zona configurada. Esto evita que una misma combinación de entidad y geografía explore siempre las mismas capacidades. Los trabajos ya guardados conservan sus URLs y cursores.

| Bloques | Revisión de recuperación y clasificación |
| --- | --- |
| 01 Home; 02 Cuentas | Posición global, movimientos, extractos, cash pooling, agregación y conciliación. No se atribuye una apertura inicial a la funcionalidad de segunda cuenta. |
| 03–07 Pagos y Cobros | Se distinguen transferencias, nóminas, impuestos, servicios y recaudación. Se añaden request-to-pay, transferencias masivas, SWIFT GPI y pagos programados. |
| 08 Financiación | Se separan productos y operativas; confirming, factoring, leasing y renting conservan equivalencias. Se reconocen financiación y financiamiento. |
| 09 Tarjetas; 10 Comercio Exterior; 11 Adquirencia | CVV dinámico, bloqueo, divisas, cartas de crédito, TPV y Commerce 360. Se amplía vocabulario de adquirencia y terminales. |
| 12 Inversión; 13 Sostenibilidad y Salud financiera; 14 Seguros | Depósitos, fondos, custodia, huella de carbono, salud financiera y ciberseguros. El contexto empresarial/digital sigue evitando ruido de consumo particular. |
| 15 Otros; 16 Security Experience & Onboarding | Documentación, beneficiarios, multiempresa, identidad, biometría, firmas y onboarding; sin adjudicar procesos empresariales diferentes a una misma función por compartir palabras. |
| 17 Enablers; 18 Herramientas Empleados; 19 Core | APIs, H2H, integración, permisos, helpdesk, accesibilidad y navegación. Se conservan las diferencias entre capacidades técnicas y funciones del cliente. |
| 20 Venta Digital; 21 Funcionalidad transversal | Quantum, tagging, deeplinks, atribución, retargeting, personalización y feedback. Quantum conserva su nombre corporativo; su coincidencia textual puede requerir revisión editorial por la ambigüedad con computación cuántica. |

## Fuente de Drive

Administración → Taxonomía permite cambiar la URL y activar la revisión al iniciar cada proceso. El valor inicial es el documento proporcionado por el usuario. La revisión queda desactivada inicialmente por su indicación de utilizar de momento el Excel.

Con la revisión activada, Apps Script lee únicamente las seis primeras columnas de las dos pestañas de catálogo, valida códigos y tamaño antes de escribir e incorpora novedades conservando equivalencias y referencias históricas. Una ausencia en el documento requiere una baja explícita en las reglas; un cambio de nombre no deja un bloque vacío obsoleto. Una revisión trimestral consulta Drive aunque no haya noticias nuevas. Si falla el acceso, la ejecución informa del fallo, registra telemetría y utiliza el catálogo guardado. No modifica el documento de referencia ni amplía permisos OAuth.

## Rendimiento y pruebas

Se reutilizan definiciones e índices por ejecución, se mantienen estadísticas dispersas y no se retienen cuerpos de artículos. Los checkpoints solo contienen categorías observadas; las 322 funcionalidades, incluidas las de cero noticias, se incorporan al publicar el modelo. En la muestra de ocho documentos útiles, esto reduce el estado de candidatos de unos 75 KB a unos 2,2 KB. El catálogo JSON ocupa unos 29 KB y la configuración unos 67 KB, dentro de sus límites de celda y caché.

La comparación sobre 368 entradas guardadas conserva las ocho noticias útiles de la revisión base, sin pérdidas ni aumento observado en esa muestra. No acredita más volumen real: eso depende de las próximas recuperaciones. La clasificación local pasa aproximadamente de 12,9 a 14,7 ms para toda la muestra al ampliar el vocabulario.

En tres muestras locales con 50.000 registros, Radar conserva tres lecturas y sus 3.835 resultados de la ventana: mediana de 191,7 a 189,1 ms. Noticias pasa de 85,8 a 84,9 ms; la consulta repetida mantiene 0,1 ms y cero lecturas. Las diferencias pequeñas son compatibles con variación de medida. Son CPU local con adaptador en memoria, no latencia de Apps Script ni medidas de RAM del servidor de Google.

La telemetría histórica disponible contiene 6.837 registros, hasta el 16 de octubre a las 09:23 de Madrid. En 3.1.0 hay 15 cargas de dashboard, con medianas de RPC 9.934 ms, servidor 5.628 ms y render 25 ms; 174 lotes de taxonomía tienen mediana 1.301 ms. Estas observaciones identifican el peso de Sheets/transporte y no demuestran por sí solas el rendimiento de 3.3.0.

La validación completa supera **489 pruebas**, además de sintaxis, diseño, permisos y distribución reproducible. Incluye lectura de ambas estructuras del catálogo, códigos duplicados, recuperación ante falta de permisos, incorporación idempotente de novedades, recurrencia y medios independientes, conservación de categorías oficiales y reanudación entre lotes sin perder estadísticas.

## Publicación

Los 18 archivos modificados se verificaron tras recargar el editor de Apps Script, contra los archivos generados locales. Se inicializaron las reglas: 22 bloques, 322 funcionalidades, 51 capacidades y 8.725 noticias conservadas. El proyecto se publicó en la implementación existente como **versión 72**, release **3.3.0**, el 16 de octubre de 2026 a las 22:27 de Madrid. La versión publicada no contiene las funciones temporales de coordinación utilizadas durante la promoción.

Las medidas posteriores de publicación y la finalización del histórico se registran al terminar la comprobación operativa.
