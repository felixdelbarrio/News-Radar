# Iteración 29 y revisión de newsletters · 3.30.0

Geografía determinista con países múltiples, catálogo de medios y reglas de idioma separados. La evidencia del titular y contenido prima; después se consulta el dominio original, edición, medio verificado, país RSS válido y locale. Los registros históricos con país válido no se degradan a una región al faltar nuevas evidencias. El último recurso regional es APAC. Los cambios manuales se conservan. Las regiones son agrupaciones operativas y no códigos ISO de países.

Se incorporan 80 propuestas de medios pendientes e inactivas y 46 reglas de idioma. Las importaciones son idempotentes y conservan las ediciones guardadas. Los medios nuevos detectados en RSS se registran pendientes sin bloquear la ingesta. Los filtros aplican OR sobre las geografías y cuentan una noticia una sola vez en el total.

La trimestral recupera cifras, bloques funcionales y entidades destacadas. Las tarjetas se muestran una sola vez y la selección favorece bloques distintos cuando hay alternativas. Se elimina el detalle de suboperativa, el botón de fuente y el extracto sindicado que repite el titular. La valoración aparece después de la marca bIA. Los estilos se derivan de los tokens BBVA, con tablas y estilos inline para correo, reglas móviles y colores explícitos para modo oscuro. Los clientes de correo que fuerzan recoloreado pueden ignorar estas reglas; la comparación de navegador no sustituye una prueba en cada aplicación de correo.

Las pruebas administrativas usan el periodo vigente; los envíos programados mantienen el periodo cerrado. El 27 de octubre la prueba quincenal abarca del 16 al 31 de octubre. Se elimina el botón Todas las regiones. Las métricas del panel mantienen la ejecución de las 06:00 mientras avanza la de las 13:00.

## Evidencia local

Auditoría del exportado de 1.000 noticias: cero países vacíos; ocho cambios de país principal y ocho artículos con varios países tras retirar falsos positivos de las firmas editoriales. La muestra exportada contiene 731 noticias en otras geografías (APAC 289, EMEA 273, AMER 169), frente a las 534 citadas anteriormente. No son medidas de precisión frente a un conjunto etiquetado.

El render de las noticias exportadas selecciona tres bloques distintos para cada cadencia: 114 elegibles en la quincena vigente y 212 en el trimestre vigente. Las cifras dependen de la fecha del exportado. La trimestral conserva el corpus de sus métricas en la edición congelada; el historial de envíos registra solo los titulares destacados.

La migración crea y verifica una copia nativa antes de actualizar el Sheet. `reportGeographyMigration` agrega una auditoría de todo el histórico en lotes de 200 y expone los métodos y el estado del trabajo.
