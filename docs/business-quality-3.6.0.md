# Calidad funcional y problemas de servicio · 3.6.0

## Criterio de negocio

News Radar sigue la evolución de los canales digitales de Empresas e Instituciones, incluidas pymes y autónomos. Una señal editorial —lanzamiento, mejora, alianza o problema— y una clasificación funcional responden a preguntas diferentes. Una noticia puede merecer seguimiento sin describir con precisión una operativa del catálogo. Se conserva visible con la marca «Sin clasificación funcional justificable».

El objetivo es identificar operativas con evidencia y mantener el histórico, sin rellenar categorías para aparentar cobertura. Se mantiene una única pareja bloque/funcionalidad por noticia. Los nombres oficiales proceden del maestro; las equivalencias, condiciones operativas y conceptos emergentes se mantienen en las reglas de negocio del libro de News Radar.

## Auditoría del histórico real

Se leyó la pestaña `Noticias`, gid **288490066**, del libro `12ej-8WFP3_E8w12hgO0lZ-WUUV29aKGQqmdYxRezTvg`, el **18/10/2026 a las 00:54 CEST**. La exportación contiene **8.820 registros**, con idéntica revisión al comienzo y al final. Antes del cambio, 482 estaban marcados dentro del ámbito empresarial y 240 tenían una clasificación funcional reconocida por el modelo.

La revisión detectó, entre otras, estas asociaciones:

| Titular / asunto | Clasificación anterior | Tratamiento corregido |
|---|---|---|
| Pagos cashless del estadio Banorte | Impuestos SIPARE | Sin evidencia suficiente para esa operativa |
| Restricción del crédito de Santander en Argentina | CVV Dinámico | Sin evidencia suficiente para esa operativa |
| Llegada de Samsung Wallet a Perú | Impresión de cheques | Sin evidencia suficiente para esa operativa |
| Getnet unifica cobros en Europa | Cobros CIE / recibos no domiciliados | No se presupone ese mecanismo de cobro |
| Pagos desde ChatGPT de Qonto | Pago del saldo de tarjeta de crédito | Pagos agénticos, si el modelo admite el concepto con evidencia recurrente |
| Custodia institucional de criptoactivos de Standard Chartered | Pagos con stablecoins | Custodio de valores |
| Pagos internacionales de Swift mediante móvil/email | Mis tareas | Transferencias individuales internacionales |
| Cobro facial de Revolut | Login biométrico | Cobros biométricos en comercios, tras evidencia recurrente |
| Pago de impuestos provinciales con Mercado Pago | Estatales | Se conserva con equivalencias explícitas y justificadas |

En la simulación con las reglas y el catálogo exportados del libro real, **467 de 477 noticias empresariales carecían de extracto**. Esta falta de contexto limita la clasificación de titulares genéricos. Se retiran etiquetas infundadas y se añaden equivalencias operativas comprobables; una disminución de etiquetas asignadas no es una pérdida de registros. No se presenta el porcentaje de asignación como una medida de precisión.

## Cambios del producto

- **Problemas de servicio** tiene su propia sección en Novedades. Distingue indisponibilidad e incidencias operativas, con fechas y enlace al medio. No es un monitor de disponibilidad actual.
- Los contadores de señales llevan a Noticias con señal, período y geografía. Los contadores vacíos quedan deshabilitados.
- La selección reserva espacio a las incidencias para evitar que los lanzamientos agoten el límite de tarjetas. Una noticia con dos señales de problema ocupa una sola tarjeta.
- «Por qué está clasificada aquí» muestra hasta tres evidencias guardadas y distingue coincidencia literal de contexto descriptivo. La lectura no ejecuta nuevamente el motor funcional.
- La selección semántica exige términos específicos, contexto y evidencia en el titular. Se rechazan las coincidencias descriptivas ambiguas. El ruido genérico de banco, empresa, plataforma, pago, cuenta o tarjeta no basta.
- Las equivalencias de operaciones admiten contexto requerido y exclusiones, editables en las reglas de negocio. Un checkout no implica financiación y una biometría de cobro no implica login.
- La exclusión de nombres de entidades compara el nombre completo. Palabras aisladas como «de», «en» o «depósitos» ya no bloquean conceptos funcionales válidos.
- TF-IDF conserva bloques cerrados y exige tres noticias y dos medios para tendencias. La excepción de una fuente oficial se restringe a productos concretos expresamente configurados. No se amplía a cualquier producto de una misma familia.
- Las búsquedas rotan catálogo y capacidades y reservan un término a problemas, dentro del mismo número de consultas y del límite de 1.500 caracteres. La fuente del catálogo permanece parametrizada y se consulta antes de reconstruir el modelo.

## Publicación de snapshots

La invalidación de Noticias y Configuración comparte un único punto de entrada. La finalización de un job solicita publicación prioritaria y conserva la petición aunque otra invalidación llegue inmediatamente después. Se generan Novedades, Noticias y Radar y se publica cada manifiesto al final, tras comprobar su contenido.

Durante una recuperación anual continua, la petición pendiente empieza una espera de cinco minutos que las invalidaciones sucesivas no reinician. Al vencer, las vistas se regeneran antes de continuar el backfill. La recuperación diaria y la clasificación mantienen su prioridad. No se sirven snapshots de una revisión antigua para aparentar velocidad.

## Verificación local

**523 pruebas pasan**, además de `npm run check`, `npm run check:dist` y `git diff --check`. Los casos nuevos cubren errores reales de asignación, incidencias empresariales frente a bolsa/Retail/ayuda, conceptos emergentes, conservación de evidencia, enlaces de contadores, límites de consultas y regeneración de las tres vistas.

Benchmark local V8 con **50.000 registros**, cuatro muestras alternadas por versión y base fija `7dd473d8bbecc82c383f5ee6a338515bf34e3cba`. Las lecturas de Sheets y los resultados son iguales en todos los escenarios. Se eliminó del payload la metadata funcional vacía que aumentaba innecesariamente la memoria.

| Escenario | Mediana 3.5.1 | Mediana 3.6.0 | Lecturas de Sheets |
|---|---:|---:|---:|
| Radar, cálculo inicial | 203,95 ms | 207,30 ms | 3 |
| Novedades, cálculo inicial | 92,10 ms | 92,55 ms | 0 |
| Noticias, cálculo inicial | 88,70 ms | 89,95 ms | 0 |
| Noticias, siguiente página | 1,40 ms | 1,65 ms | 1 |
| Noticias, caché | 0,20 ms | 0,20 ms | 0 |
| Período antiguo | 13,40 ms | 12,75 ms | 1 |
| Histórico completo | 2.051,00 ms | 2.034,10 ms | 25 |

El heap retenido adicional al consultar el histórico completo fue aproximadamente **37,7 MiB** en ambas versiones. Esta medición usa GC explícito y un adaptador en memoria; no mide la RAM del servicio de Apps Script ni permite atribuir estas diferencias pequeñas a una mejora causal. El benchmark acepta una base explícita y se reproduce con:

```sh
node --expose-gc scripts/benchmark-news-paired.mjs --baseline=7dd473d8bbecc82c383f5ee6a338515bf34e3cba
```

La auditoría, exportación, cambios por noticia y mediciones locales se conservan en `output/business-quality/`, excluido de Git.

## Verificación en Apps Script

En curso: actualización de reglas, reclasificación, reconstrucción del modelo, traducciones, snapshots, promoción de implementación y medición real. Este apartado se completa con los resultados verificados de la publicación.
