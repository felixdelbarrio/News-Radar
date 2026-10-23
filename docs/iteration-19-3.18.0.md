# Iteración 19 · 3.18.2

## Alcance

La rama de PR #69 mantiene el libro primario y sus IDs. No introduce particiones ni una capa de enrutamiento entre libros. El benchmark de 858/8.580/85.800 noticias no justifica una migración de almacenamiento.

- La selección de una edición aplica su período guardado también sin `initial`. El ámbito y las geografías del editorial se copian al generar la edición, evitando referencias mutables a la configuración. Filtros, opciones y CSV reciben el mismo predicado geográfico congelado.
- Recopilación principal a las **06:00 Europe/Madrid** y adicionales a las **13:00 y 21:00 Europe/Madrid**. El horario principal sigue siendo configurable. Cada franja adicional usa su propia solicitud y marca diaria; si otra diaria está activa, espera hasta poder iniciar un nuevo ciclo. Las solicitudes se procesan en el coordinador con bloqueo y prioridades existentes. Instalación idempotente, watchdog único y eliminación conjunta al desactivar.
- Ejecuciones muestra las planificaciones instaladas y el estado del archivo; permite reintentar errores de archivo. Las llamadas a ScriptApp para este informe usan una sola lectura de activadores.
- Nuevo catálogo «Almacenamiento y archivo»: carpetas del primario/copias, logs y newsletters; diez filas/veinte días y tres envíos por suscripción. El ID primario se muestra desde `SPREADSHEET_ID`, sin copiarlo a otra configuración.
- Logs: lotes de hasta 100 filas y 30.000 caracteres; Google Sheets nativos `AAAAMMDD_Tabla_hash`, verificación de parent y SHA-256, comprobación del origen y checkpoint previo a retirar filas. Recupera respuestas perdidas al borrar. Tres fallos detienen los reintentos automáticos hasta una acción administrativa. No se purga al añadir eventos ni se lanza una revisión completa de noticias por cada log nuevo.
- Adopción conserva todas las filas. Su texto informativo distingue conservación de accesos de límites de consulta.
- Newsletters: la consulta de historial conserva tres envíos por suscripción. Las anteriores tienen libro Sheets nativo verificado y puntero desde los metadatos; el contenido voluminoso se retira de sus celdas tras publicar y verificar el puntero. Se conservan IDs, autorizaciones, offsets, metadatos mínimos y el ledger de identidades enviado para evitar reenvíos. Las ediciones históricas siguen accesibles y con sus nombres originales. No se eliminan filas internas que desplazarían los offsets de otras ediciones.
- El mantenimiento verifica cabeceras en tandas de tres tablas y los IDs del corpus antes de deduplicar. Los IDs ambiguos requieren revisión; no se eliminan automáticamente. La deduplicación conserva archivo verificado previo de lo retirado. Los candidatos, clasificaciones y taxonomías siguen sus lotes existentes.
- La cola terminada se conserva al preparar otra recopilación. Su retirada exige el archivo externo explícito ya existente, ahora situado y verificado en la carpeta configurada. La limpieza de generaciones solo se ejecuta tras ese backup, preserva referencias publicadas y trabajos pendientes y no elimina pestañas desconocidas.
- Administración: hoja de estilos única con tokens del producto, horarios en tarjetas, acciones y filtros plegables, registros en tarjetas móviles, detalles largos desplegables y máximo diez resultados por página. Las listas auxiliares tienen paginación local sin nuevas consultas; el servidor pagina los logs antes de transmitirlos. Formulario de alta junto a la lista y foco en el editor.
- Se retira la recuperación anual de los controles y API pública. Se cancelan sus solicitudes y tareas pendientes conservando el histórico y las noticias; los reintentos no reactivan ciclos cancelados.

## Evidencia local

`iteration-19-local-benchmark.json` recoge tres repeticiones por volumen y escenario contra `dda3660f`. Son tiempos V8 con Sheets en memoria, no latencia de Apps Script. En 85.800 noticias, p95: Radar 316,4 → 298,7 ms; Novedades 180,5 → 162,7 ms; Noticias 215,5 → 150,3 ms; histórico completo 2.978,1 → 2.802,6 ms. Lecturas iguales; página siguiente una lectura; caché cero. La variación temporal no demuestra por sí sola una mejora del algoritmo. El heap retenido es aproximado, posterior a GC, y puede ser negativo al liberar memoria previa.

Las regresiones de la iteración cubren ambos horarios, concurrencia y espera de franja, reintentos, permisos, parent incorrecto, corrupción, fallos antes/después de borrar, conservación de Adopción, historial remoto y autorización, generaciones activas, IDs ambiguos y formulario de almacenamiento.

## Riesgos y recuperación

| Riesgo | Protección / recuperación |
| --- | --- |
| Drive o Sheets sin permiso | Fallo antes de retirar datos; reintentos acotados; reanudación administrativa. Scope de Drive autorizado; se retira el scope de Documentos. |
| Respuesta perdida | Checkpoint con ID/digest y primera fila posterior; verificación del estado antes de continuar. |
| Newsletter archivada ilegible | Verificación previa a vaciar contenido; digest y destinatario al leer; restaurar las celdas desde `rows[0].items` de la pestaña Contenido del archivo. |
| Offset histórico | No se eliminan filas internas de NewsletterContenido; las demás ediciones mantienen sus posiciones. |
| Datos ambiguos | Se conservan y se informa del error; sin corrección destructiva automática. |
| Regresión de publicación | Revertir a la versión 100 para el mismo formato Sheets; para la 98, restaurar configuración y metadatos/contenido de newsletters antes de activar el lector antiguo. Conservar los libros de archivo y el ID primario. |
| Desviación horaria de Apps Script | Activadores diarios con zona IANA y `nearMinute(0)`; Apps Script puede ejecutar dentro de su ventana aproximada, no garantiza el segundo exacto. |

## Inventario y publicación

Promoción mediante el navegador integrado de Apps Script: **versión 101, 3.18.2, 23/10/2026 20:29 Europe/Madrid**, manteniendo la URL y el acceso corporativo existentes. Los 69 módulos coinciden con `dist/`; los diagnósticos temporales se retiran del editor y no forman parte de la versión publicada.

- 750 pruebas correctas; cobertura de líneas 97,87 %, ramas 85,61 %, funciones 94,74 % y sentencias 92,31 %. Distribución reproducible y `git diff --check` correctos.
- Recopilación a las 06:00, 13:00 y 21:00 Europe/Madrid; newsletters a las 06:00 y supervisor cada cinco minutos. Un activador por trabajo; sin duplicados. Las ejecuciones dependen de la ventana aproximada de Apps Script.
- Recuperación anual cancelada, conservando noticias e histórico. Los reintentos solo alcanzan ciclos diarios.
- Libro primario conservado: 924 noticias, 924 IDs únicos y columnas de identidad/contenido iguales a la copia externa; generación publicada sin cambios durante las mediciones. Adopción conserva más de 5.000 accesos.
- Copia externa completa verificada en la carpeta primaria: `15i4CN82hiN9pTeLXYnLX9lGCl7x2SfsyeFCUc3RGDfU`. No se eliminaron generaciones ni noticias.
- El único Doc creado durante la preparación (57 registros de Auditoría) se convirtió y verificó en el Sheets `14oQWMcPQhKBVXs5eUgu8vOVxpWfHkfgm1aMFisJ2nxs`; el original quedó recuperable en la papelera. No había ediciones con punteros a Docs. Los nuevos archivos utilizan Google Sheets; el manifiesto ya no pide Documentos.
- Las once pestañas administrativas se revisaron en la publicación real a 390 px; Ejecuciones también a 360 px. Sin desbordamiento horizontal de paneles/controles. Los registros y listas auxiliares muestran como máximo diez filas por página, con acceso al resto mediante paginación. Los detalles largos se despliegan a demanda.

Las mediciones de producción se conservan en `iteration-19-production-validation.json`. Son tiempos del navegador sobre la URL publicada, incluyendo red, RPC, servidor y render; no deben confundirse con los benchmarks locales ni con el p95 de 30 días que mezcla versiones. Una muestra pequeña comprueba ausencia de regresión observada, no garantiza una latencia futura ni mide la RAM del servicio de Google.

Para revertir el ajuste final puede utilizarse la versión 100, que ya lee archivos Sheets. Volver a la 98 exige restaurar configuración y metadatos/contenido de newsletters desde la copia completa antes de reactivar trabajos; conservar los archivos externos y el ID primario.

### Tiempos observados en la versión 101

En la muestra reciente de la versión anterior (9 cargas), p95 global **7.420 ms**; en la publicada (12 cargas), **6.588 ms**. Todas las cargas medidas terminaron correctamente y utilizaron snapshots.

| Vista | p95 histórico v3.17.1 (n) | p95 publicado v3.18.2 (n) |
| --- | --- | --- |
| Novedades | 8.088 ms (21) | 5.580 ms (4) |
| Noticias | 9.884 ms (16) | 5.890 ms (4) |
| Radar | 7.364 ms (12) | 6.588 ms (4) |

La referencia reciente de solo tres cargas de Radar tenía un máximo de 6.025 ms; la muestra nueva alcanza 6.588 ms. Se conserva esa variación en el JSON en lugar de ocultarla. El p95 global y la referencia histórica por versión mejoran; las muestras pequeñas y la variabilidad de RPC no permiten atribuir todos los cambios de tiempo al código.

Se comprobó también un archivado real de newsletter: archivo Sheets `165nevuplfleTvSFmDBRiFrCiPE4OfB6aVbqzf09vkwM`, digest y lectura verificados, puntero persistido y contenido voluminoso compactado. El resto del archivado continúa de forma incremental.
