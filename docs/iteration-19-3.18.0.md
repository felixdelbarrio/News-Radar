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
| Regresión de publicación | Mantener la versión 98 disponible; restaurar módulos desde `output/iteration-19/apps-script-before` y el manifiesto anterior. Restaurar metadatos y contenido de newsletters antes de volver a un lector sin soporte de archivos Sheets. Conservar los libros de archivo. |
| Desviación horaria de Apps Script | Activadores diarios con zona IANA y `nearMinute(0)`; Apps Script puede ejecutar dentro de su ventana aproximada, no garantiza el segundo exacto. |

## Inventario y publicación

No se crean pestañas para el nuevo catálogo ni para logs archivados. Se conservan las tablas canónicas, las generaciones publicadas/pendientes, Adopción y los metadatos mínimos de newsletters. La enumeración real, las mediciones de producción, la copia externa y el resultado del despliegue se completan en la validación operativa. Este documento no certifica todavía una promoción.
