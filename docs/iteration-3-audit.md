# Iteración 3 · 1.11.0

Implementación local en `develop`, ampliando la iteración 2. Las correcciones expresas del usuario prevalecen sobre el PDF: cobertura de canales digitales, incluidas web, API e IA; en Novedades, selección inicial de Empresas e instituciones + Canal digital.

- 83 capacidades predeterminadas: 43 Empresas y 40 Retail, editables sin despliegue. Se conservan los catálogos existentes y sus activaciones.
- Etiquetas independientes Generalista y Canal digital, junto con varias capacidades, persistidas en una columna JSON añadida al final de Noticias. Las consultas leen las etiquetas guardadas.
- Histórico por lotes de hasta 100 filas y 10 segundos, reanudable, idempotente y sin llamadas a fuentes. Cambiar capacidades o temas solicita reclasificación; no se sobrescriben noticias.
- Filtros Todos / Generalista / Canal digital en Noticias y Novedades. Novedades mantiene su ventana de siete días, sin entidad inicial; BBVA primero, después entidades agrupadas por cantidad descendente y desempate alfabético. Dentro de cada entidad se conserva prioridad y fecha.
- Newsletters mantienen filtros y orden; Radar y CSV mantienen sus criterios y columnas públicas. La ordenación por entidad se aplica exclusivamente a Novedades.
- Se reutilizan las reglas, estilos de badges, componentes de filtros y telemetría. No se añaden servicios, dependencias ni pantallas.

Fuentes incorporadas y verificadas como RSS 2.0 HTTP 200 el 12/10/2026: [Bankinter · Blog](https://www.bankinter.com/blog/rss), 50 entradas; [Stripe · Blog](https://stripe.com/blog/feed.rss), 10 entradas. The Fintech Times se verificó, pero se dejó fuera al no aportar entidades seguidas en la muestra.

Competidores nuevos, limitando las búsquedas a España y sin inferir el país de una noticia desde la edición de Google: [Openbank](https://www.openbank.es/banca-movil-2), [bunq](https://www.bunq.com/es-es/personal), [myPOS](https://www.mypos.com/es-es/mobile-app) y [Stripe](https://stripe.com/es/terminal/tap-to-pay-on-iphone). Se incluyen los alias de producto myPOS Glass y Stripe Terminal.

Comparación reproducible: `npm run compare:digital`. Sobre 60 entradas completas de los RSS nuevos, más siete entradas Finextra congeladas, se aceptan 36 URLs únicas y se etiquetan tres como digitales. Los RSS nuevos aportan 31 noticias generales adicionales y una digital respecto a esa muestra. Se corrigió una coincidencia incidental de IA en un evento de mercados; las cifras finales sustituyen la estimación intermedia de tres digitales adicionales. No demuestra incremento único frente a todo Google News o al histórico de producción.

Plan diario: 101 → 111 consultas (+9,9 %); anual: 1.349 → 1.463 (+8,5 %), excluyendo saturaciones y reintentos. Misma carga local de 60 artículos, diez rondas: mediana de 9,52 ms sin construir etiquetas y 9,57 ms construyéndolas; es una medición local, sensible al ruido, no una estimación de latencia de Apps Script.

Validación final: 197 tests correctos; sintaxis, permisos, diseño, distribución reproducible y `git diff --check` correctos. Cobertura: 91,88 % instrucciones, 86,56 % ramas, 93,57 % funciones y 95,51 % líneas.

Pendiente para producción: desplegar `dist/` y ejecutar `initializeConfiguration()`. Esto incorpora la columna y catálogos, y programa el histórico. Durante su procesamiento, las filas aún sin etiquetas aparecen en Todos; la cobertura real y el coste por noticia digital deben medirse con telemetría de producción. Cambios locales sin commit ni publicación.
