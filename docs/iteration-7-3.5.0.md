# Iteración 7 · 3.5.0

Implementación de las especificaciones «20261017- Iteracion 7.pdf» y la aclaración del usuario: un producto concreto descrito por una fuente oficial puede justificar una funcionalidad `.xx` con una sola noticia. Las tendencias genéricas mantienen tres documentos y dos medios independientes.

## Maestro y reglas

El documento corporativo de Drive es de solo lectura. La configuración permite cambiar su URL; cada creación del modelo intenta actualizar las dos pestañas antes de clasificar. La lectura identifica las columnas por encabezado e incorpora Descripción, situada en F en Soluciones Funcionales y D en Capacidades canal. News Radar mantiene un espejo técnico en CatalogoFuncional, con revisión y última sincronización, para no depender de Drive durante cada lectura de Noticias. Si Drive falla, registra el error y conserva el último espejo. El snapshot inicial contiene 22 bloques y 322 funcionalidades.

Las reglas de negocio almacenan equivalencias por ID y conceptos emergentes; los nombres y descripciones oficiales se derivan exclusivamente del maestro. La interfaz no permite modificarlos. Una nueva funcionalidad del maestro entra automáticamente en la clasificación y las consultas rotatorias ya existentes. El texto descriptivo utiliza un índice TF-IDF disperso compilado una vez por modelo; no se vuelven a recorrer las descripciones completas por cada noticia. Las Landing requieren evidencia de una vista agregadora y dejan de absorber noticias sobre operaciones concretas.

Cada noticia justificable recibe una pareja funcional. Las noticias sin evidencia suficiente conservan la marca y visibilidad acordadas. Las nuevas funcionalidades no crean bloques, conservan el prefijo del bloque y usan `.xx`. La excepción de fuente oficial requiere además una regla explícita de producto, una URL de dominio oficial y coincidencia del nombre en el titular. El nombre del medio por sí solo no basta. Cobro al Toque se incorpora al bloque 11.Adquirencia / TPVs, coherente con el maestro; el 08 sugerido en el PDF corresponde a Financiación.

## Newsletter y navegación

La revisión trimestral completa el catálogo, TF-IDF y reclasificación antes de habilitar el envío trimestral. La solicitud persiste al pausar o reanudar. Los envíos administrativos llevan [PRUEBA], se excluyen del historial de noticias enviadas y no envían correos vacíos. Trimestrales y anuales prefieren ejemplos no enviados; permiten repetir cuando faltan alternativas.

La quincenal conserva su diseño e incorpora los literales solicitados. Sin geografía personalizada presenta tres funcionalidades en Mirada internacional. Ver esta edición y los accesos a noticias adicionales abren Noticias con las fechas y evidencias congeladas. Una temática internacional con varios países se agrupa en Otras geografías con el mismo conjunto en pantalla y exportación CSV.

Los procesos que modifican clasificación, catálogo, traducciones o mantenimiento solicitan la reconstrucción de Novedades, Noticias y Radar. Los snapshots se publican con manifiesto al final y lectura comprimida; su vigencia incluye las revisiones de datos y configuración.

## Validación reproducible

`npm run verify`: 507 pruebas correctas. Cobertura global: 92,29 % de sentencias, 86,71 % de ramas, 94,53 % de funciones, 97,60 % de líneas. `npm run check:dist` y `git diff --check` correctos.

La auditoría congelada de 368 entradas frente a edf94036c9282deb9fcc1dade8b3b9c5b1ea4010 conserva ocho de las nueve noticias admitidas por 3.4.0. La baja corresponde a la tarjeta de repostaje Moeve gow de Bankinter, sin contexto empresarial en el titular o extracto; no se borra del histórico. Esta muestra no permite prometer más noticias futuras ni una cobertura funcional completa.

Las previsualizaciones de correo se generan sin enviar mensajes. Las pruebas cubren aislamiento de envíos administrativos, excepción oficial, filtro de Landing, descripciones, revisión previa al envío y enlaces de edición con múltiples geografías.


Benchmark alternado de cuatro muestras por versión, 50.000 registros, V8 local y Sheets en memoria (sin red de Google):

| Escenario | 3.4.0 mediana ms | 3.5.0 mediana ms |
| --- | ---: | ---: |
| radar cold | 353.95 | 353.50 |
| news cold | 144.90 | 144.20 |
| news next page | 1.50 | 1.60 |
| news cache hit | 0.20 | 0.20 |
| old period | 17.70 | 17.55 |
| full history | 3424.80 | 3379.70 |

No cambia el número de lecturas de Sheets ni los totales devueltos. Estas muestras no miden RAM ni CPU del servicio de Google.

## Publicación

Promovida a la implementación existente, versión 74, el 17 de octubre de 2026 a las 16:02 (Madrid). Se conservan la URL, ejecución por el propietario y acceso de dominio. El paquete publicado no incorpora las funciones temporales de auditoría y procesamiento.

## Auditoría del histórico y medición directa

Al finalizar la aplicación sobre el histórico real se conservan las 8.780 noticias y el mismo SHA-256 de su secuencia de identificadores. Hay 442 noticias admitidas en el ámbito empresarial: 220 con una pareja funcional y 222 visibles sin clasificación justificable; cero asignaciones múltiples. Se corrigen 231 etiquetas. La retirada de equivalencias genéricas de las Landing reduce asignaciones antes demasiado amplias; no se presenta esta reducción como mejora de cobertura. Tres registros dejan de cumplir la admisión digital, pero permanecen en la hoja Noticias.

El modelo contiene 22 bloques, 322 funcionalidades oficiales y dos emergentes: 03.xx Pagos con stablecoins (103 evidencias) y 11.xx Cobro al Toque (una evidencia oficial). El espejo procede de Drive y las reglas persistidas contienen equivalencias, sin nombres funcionales duplicados. Las traducciones completan 692 nombres, con solo dos llamadas nuevas. Los tres manifiestos se comprueban vigentes tras terminar los trabajos.

Las lecturas de la implementación 74 se registran en Telemetria. Con trabajos de fondo pausados y snapshots ya reconstruidos se observan:

| Vista | Carga con RPC y red | Servidor | Snapshot |
| --- | ---: | ---: | --- |
| Novedades | 5.274 ms; primera lectura 9.590 ms | 1.653 ms; primera 6.112 ms | hit |
| Noticias | 6.394 ms | 2.392 ms | hit |
| Radar | 6.816 ms | 1.919 ms | hit |

La referencia 3.4.0 de la misma sesión fue 14.913 / 11.832 / 11.152 ms, con 11.196 / 7.707 / 6.997 ms de servidor y snapshot miss. Mientras se reconstruía el histórico, 3.5.0 también registró cargas de Novedades de 13.883–17.068 ms con snapshot miss. Se conservan estas muestras para distinguir la mejora del camino de lectura de la variabilidad de Google; no son percentiles ni una comparación controlada de infraestructura. No hay medición de RAM de Apps Script.

## Correcciones de revisión · PR 46 · 3.5.1

Una revisión trimestral pendiente conserva su identidad cuando guardar reglas o refrescar el modelo sustituye su trabajo. La cola restaura solicitudes desplazadas y solo desbloquea el envío cuando termina la revisión del trimestre. La migración copia primero el último catálogo completo guardado al espejo técnico, con la misma función de escritura usada por Drive; después reduce las reglas a equivalencias. Así conserva funciones incorporadas al maestro aunque la primera lectura de Drive falle, también en instalaciones sin noticias. La migración no sobrescribe un espejo ya existente.
