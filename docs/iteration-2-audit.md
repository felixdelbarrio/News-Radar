# Iteración 2 - capacidades digitales

Implementación local en `develop`, versión 1.10.0. Requisitos: PDF del 12/10/2026 y exportación de telemetría 1.9.4 proporcionados por el usuario.

## Cambios y contratos

- `assets/configuration-defaults.json` y `assets/admin-schema.json`: 35 capacidades de Empresas y 35 de Retail; única definición canónica de valores predeterminados y dos RSS adicionales.
- `Configuration.gs`, `configuration.js`, `ConfigurationView.html`, `locales.js`: mismo editor y persistencia en Sheets; altas, edición, bajas, activación y restauración independiente. Validación: 60 capacidades por segmento, 12 términos de 80 caracteres por capacidad, 40.000 caracteres por celda y límites existentes de caché.
- `Sources.gs`, `Recovery.gs`: fecha al principio, OR agrupados, geografía validada localmente, máximo 10 términos generales y 6 de capacidades, 1.500 caracteres por consulta y dos consultas por perfil/período. Ventanas de 28 días; subdivisión únicamente con al menos 80 resultados dentro de fecha sobre 100 del proveedor. Uruguay utiliza la edición US/es-419 observada en su redirección legítima.
- `Rules.gs`, `Briefing.gs`: coincidencias deterministas de varias capacidades, señales positivas y negativas, contexto de canal y prioridad por utilidad en novedades/newsletter. Las capacidades inactivas no aportan consultas ni puntuación. Los medios sectoriales requieren una entidad publicada en el titular; no se asignan funciones por el catálogo.
- `Feeds.gs`, `Collection.gs`, `Background.gs`: URL exacta más titular normalizado largo, misma entidad y proximidad de dos días; mercados explícitamente diferentes permanecen separados. Índice compartido entre lotes del mismo trabajador, sin nueva caché persistente. Auditoría de duplicados acotada y contadores completos en resúmenes; fallos de transporte aislados sin bloquear otras fuentes.
- `scripts/preview.mjs`, `dist/`, tests y muestras congeladas: consumidores actualizados. Noticias conserva sus 12 columnas; no se añaden pantallas ni estados editoriales.

## Fuentes

HTTP 200, RSS 2.0, enlaces y fechas verificados el 12/10/2026:

- Finextra Mobile & online: `https://www.finextra.com/rss/channel.aspx?channel=mobile` (42 entradas).
- Finextra Payments: `https://www.finextra.com/rss/channel.aspx?channel=payments` (47 entradas).

Aportación incremental en la ventana común 02/10-12/10: una noticia por RSS, N26 y Wise. Finextra publica sus direcciones en https://www.finextra.com/featurearticle/2406/our-rss-feeds.

Bankinter y Sabadell respondieron con RSS, pero sus muestras no aportaron novedades digitales útiles adicionales. Los candidatos consultados de Santander, CaixaBank, Revolut, N26, Qonto, Wise, Nubank, The Paypers y FinTech Futures no proporcionaron RSS verificable útil en esta comprobación (errores, HTML o ausencia de feed). No se añadieron direcciones supuestas.

## Evidencia reproducible

`npm run compare:collection` compara consultas antiguas y nuevas congeladas y dos RSS. No realiza llamadas externas.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Resultados de búsquedas recuperados, tres entidades | 218 | 78 |
| Resultados fuera de la ventana 02/10-12/10 | 214 | 13 |
| Noticias digitales útiles únicas en esa ventana | 0 | 4 (2 búsquedas + 2 RSS) |
| Precisión en siete entradas RSS etiquetadas, septiembre-octubre | 3/5 (60%) | 3/3 (100%) |
| Recall de esa pequeña muestra RSS | 3/3 | 3/3 |
| Consultas del plan anual inicial canónico | 2.547 | 1.349 (-47%) |
| Consultas del plan diario inicial canónico | 99 | 101 (+2 RSS) |

Las consultas de la muestra no fueron simultáneas y se evaluaron dos consultas nuevas por perfil frente a una antigua; esta comparación no mide el coste de un ciclo diario completo. Los planes excluyen subdivisiones y reintentos. Las muestras pequeñas no estiman rendimiento ni precisión de producción. La telemetría aportada, además limitada a 20.000 registros de auditoría, contiene 357.522 exclusiones por período y una recuperación anual de 6.450 tareas; esa carga real no equivale al plan inicial.

## Activación y límites pendientes

Publicar `dist/` y ejecutar `initializeConfiguration` una vez en Apps Script. La inicialización añade capacidades y fuentes, conserva personalizaciones/activaciones existentes y actualiza únicamente las URLs de consultas históricas pendientes. No se ha desplegado ni escrito en la hoja real.

Google News sigue pudiendo devolver fechas ajenas al período y omitir noticias. Los RSS no son archivos históricos completos; Finextra puede responder con 403 intermitente. La atribución territorial sin evidencia permanece sin determinar. Hay que medir tiempos, cuotas y contribución incremental en producción; no se promete una mejora de latencia o coste diario (el plan suma dos RSS).

Validación final: build, check de sintaxis/diseño/permisos, check de distribución y cobertura ejecutados; 190 tests aprobados, cero fallos. Cobertura: líneas 95,38%, sentencias 91,89%, funciones 93,70% y ramas 86,25%. `git diff --check` sin incidencias. Incluye formularios reales, persistencia/migración, activación/términos, fechas/saturación, redirecciones/aislamiento, deduplicación/idempotencia y consumidores de API, newsletter y reporting.
