# Correcciones de revisión · PR #39

## Envíos de suscripciones consolidadas (P1)

El lector de suscripciones descartaba `filtros.aliases` y el planificador solo consultaba el ID conservado. Se mantienen los alias y se centraliza el índice del historial por identidad, cadencia y comienzo de período. Un envío confirmado prevalece sobre registros vacíos, estados inciertos o intentos fallidos de cualquiera de las identidades consolidadas. Los estados Enviando/Revisar siguen reservados; No enviado/Bloqueada pueden reintentarse. El progreso y la próxima fecha consultan el mismo historial, incluyendo cada cadencia y los alias. Se construye un único mapa por lectura del historial, sin recorrerlo completo por suscriptor y cadencia.

## Caché de navegación obsoleta (P1)

La caché conserva sus seis entradas y caduca a los 60 segundos desde su carga original. La caducidad se comprueba al navegar: una pantalla abierta permanece estable. Una respuesta con nuevas revisiones de contenido/configuración invalida las demás selecciones. Reutilizar una entrada no prolonga su vida; no se añaden temporizadores ni peticiones de sondeo en las vistas de lectura.

## Cambio administrativo de destinatario (P2)

La edición administrativa localiza la fila mediante el ID antes de aplicar el nuevo correo. Conserva el ID y los alias, normaliza la dirección y rechaza direcciones ya asignadas a otra suscripción sin escribir datos. Las ediciones personales mantienen la comprobación del propietario. El mensaje nuevo dispone de traducciones al inglés y turco.

## Validación

Nueve pruebas de regresión específicas cubren los seis estados de entrega bajo alias anidados, el predominio de envíos confirmados y ausencia de reenvío, las fechas/progreso, edición/collisiones/autorización y la caducidad e invalidación de la caché. La distribución se regenera desde las fuentes; no se envían correos reales para probar estos casos.

Batería completa: **462 pruebas pasan**, cero fallos. Cobertura: sentencias 92,82 %, ramas 87,11 %, funciones 95 % y líneas 97,83 %. Sintaxis, permisos y distribución reproducible verificados. La comparación con el código original reproduce tres ediciones pendientes tras envíos confirmados bajo alias; con la corrección son cero. Se ha incorporado la base `master` a la rama de trabajo sin cambios de contenido para actualizar la PR.
