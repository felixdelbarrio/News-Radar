# Iteración 37 — 3.32.2

Implementada desde `origin/develop` (`34b0910`) en `codex/iteration-37-hardening`.

## Evidencia y cambios

| Problema | Evidencia | Cambio | Prueba | Antes / después |
| --- | --- | --- | --- | --- |
| Historial invertido | `recentNewsletterDeliveries_` ya ordenaba descendente y Reading lo invertía | Conservar orden antes de paginar; desempatar por ID sin mutar entrada | Envíos con periodos distintos, empates, estados, destinatarios, suscripciones y páginas | Primera fila sintética: delivery-139 → delivery-153 |
| Idioma del periodo | Identity fijaba `Intl` y textos en español | Meses y plantillas es/en/tr; asunto de prueba y preheader usan idioma de envío | Primera/segunda quincena, cuatro trimestres, asunto, cuerpo | Periodo español → idioma solicitado |
| Presentación | La separación flex no se conserva en correo; ilustración global sin noticias locales | Margen inline mediante token existente; ilustración condicionada al paisaje local, conservando noticias globales | Newsletter con/sin evidencia local, CID y margen inline | Ilustración redundante → solo cuando hay evidencia local |
| Disclaimer | Lenguaje de oferta/disponibilidad en newsletter y Novedades | Mensaje informativo traducido y compartido en el diccionario | Comprobación del texto en es/en/tr | Mensaje comercial → finalidad informativa |
| Edición y filtros | País archivado heredado y parámetros de entrada persistentes | País inicial del navegador; fechas archivadas solo al entrar; salir limpia URL mediante history del contenedor | URL profunda, país, reset, cambio de vista, periodo archivado | Filtros archivados reinyectados → estado inicial separado de selección |
| Adopción | Mes repetido por columna | Días compactos, rótulo mensual sticky, alternancia con token semántico existente | Cambio de mes/año, resize, teclado, re-render, vacío y navegador a 390 px | Mes/día repetido → día y grupo mensual |
| Banco Nación | Cuatro noticias de deuda con digital=true y canal indeterminado | Exigir evidencia digital explícita para propuestas de pago/reestructuraciones | Cuatro UUID de la exportación, negativos cercanos y cinco controles positivos | 4 falsos positivos → 0 en los cuatro casos; 5/5 controles positivos |
| Code Scanning #11 | SARIF autenticado: categoría del DOM fluye a `data-config-section` | Escapar atributos e impedir categorías ajenas al esquema | Nombres con HTML malicioso y categoría no admitida | Flujo sin escapar → atributo escapado |
| Code Scanning #9 y #10 | La rama de regex vacía sustituía cadena vacía por sí misma | Condicional fuera de `replace`, conservando normalización | Batería de taxonomía | Operación redundante → sin sustitución vacía |
| Política de seguridad PR #98 | Versiones ficticias y placeholders | Soporte conservador y canal privado `ews-radar.group@bbva.com` | Revisión del fichero y ambos hilos | Plantilla → política accionable; hilos resueltos |
| Favicon | ICO original descargado de la carpeta indicada | Asset único incorporado como data URI por build y asignado por `HtmlOutput.setFaviconUrl` | Igualdad de bytes en distribución y contrato de doGet | Sin favicon propio → recurso original embebido |

## Línea base de datos y mediciones

La exportación de lectura del 29/10/2026 coincide con el anexo: Noticias 858,
Adopcion 8.602, NewsletterContenido 11.812, NewsletterEdiciones 121,
NewsletterEnvios 154 (147 Enviada, 7 Bloqueada), Telemetria 529 y Candidatos 3.000.
Huella SHA-256 del XLSX exportado:
`28ff8bfedf029dbe28e92888c2ef366b900ae44b9193042a3927d3df59d0acfa`.
La instantánea y datos personales permanecen fuera de los artefactos versionados.
Los fixtures contienen únicamente UUID y titulares/extractos de noticias públicas.

Telemetría histórica: dashboard n=148, mediana 5.452,5 ms, p95 9.434 ms, máximo
35.817 ms; dashboard-snapshot n=24, mediana 7.881,5 ms, p95 15.156 ms, máximo
23.017 ms. P95 usa el índice `floor(.95*(n-1))`. No es una medición del despliegue
nuevo ni una atribución causal de latencia.

[Resultados locales antes/después y línea base](iteration-37-validation.json).
Se ejecutan 30 muestras por caso con Node 24.1.0. Sheets/Gmail están simulados:
CPU y heap locales no representan tiempos de red, Apps Script ni experiencia
real. El ruido de GC y la ejecución concurrente impiden atribuir los cambios de
milisegundos a una mejora del producto. No se declara mejora porcentual.

## Lecturas y límites de rendimiento

- Historial: O(envíos + ediciones), hasta eventLimit envíos y todas las ediciones;
  con 154/121 registros, dos rangos y 2.442 celdas simuladas por consulta, antes y
  después. No se introduce índice, caché o llamadas por elemento sin demostrar
  que este volumen sea material. La paginación conserva autorización y orden.
- Contenido de edición: lee el rango `inicio/cantidad` de esa edición y verifica
  su ID en cada fila; no carga las 11.812 filas para abrir una edición.
- Adopción: O(eventos) para métricas y usuarios únicos por día, limitado por
  eventLimit. La simulación usa 8.602 eventos. La cronología renderiza días
  agregados; no realiza RPC por día y conserva un único observer/controlador.
- Noticias: índice de fechas y rangos por periodo, caché fragmentada e invalidación
  por revisiones existentes. No se cambia la estrategia de almacenamiento.

## Validación y publicación

Línea base previa: `npm ci` y `npm run verify` con Node 24.1.0; 918 pruebas,
0 fallos; cobertura global 92,34 % de sentencias, 85,36 % de ramas.
Las regresiones dirigidas de esta iteración cubren contratos de servidor y cliente.
La revisión visual a 390 px confirma document/body de 390 px en la cronología.

Los resultados finales de CI/CodeQL, revisión y publicación se registrarán después
de su comprobación. Las alertas de develop no se cierran manualmente: GitHub debe
reanalizar el cambio incorporado. No se ha modificado ningún dato histórico,
reclasificado producción en bloque ni ejecutado backfill. La corrección de reglas
no cambia por sí sola las etiquetas históricas guardadas; cualquier reparación
acotada requiere una evaluación y autorización explícita por separado.
