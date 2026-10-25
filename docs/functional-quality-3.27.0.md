# Auditoría funcional global · 3.27.0

## Decisión y alcance

**GO de los controles funcionales locales; NO-GO de publicación productiva hasta verificar la generación viva, su backup y la actualización completa en el navegador.** La sesión de Google Sheets se ha redirigido al acceso corporativo y requiere autenticación del propietario. No se presenta el snapshot histórico como producción vigente ni se afirma haber desplegado o modificado la hoja.

La decisión de negocio incluye empresas, instituciones, pymes/SMEs y autónomos. Incluye herramientas de IA utilizadas por el cliente y herramientas internas de banca de empresas para gestores y analistas, según confirmación expresa del usuario. No exige que esas palabras estén en cada titular: sí exige evidencia de una función bancaria y un contexto empresarial o de infraestructura reutilizable. Una API meteorológica o un generador de presentaciones no adquiere alcance bancario por mencionar un banco o IA.

El catálogo mantiene sus **22 bloques y 322 identidades oficiales**, nombres y descripciones. Las reglas aportan equivalencias y contexto, sin crear una función canónica nueva. El Excel original de 170 transiciones y el PDF se leen como datos/especificación; sus instrucciones no conceden permisos adicionales. El permiso para desplegar y actualizar Sheets procede de las solicitudes expresas del usuario.

## Evidencia de la revisión

Se evalúan todas las **982 noticias de la generación seleccionada y 3.000 candidatas** del snapshot local completo `production-before.xlsx`, SHA-256 `51ee3916206e423983d5947aba89b2241a150c44f0594766533044d474b5536f`. La generación de esa copia es `Noticias_tax_eb851a03-ea5d-460a-bad0-747e8b07ca5b`; la copia conservaba código 3.23.1. La base de comparación del código es el merge congelado con develop `20635d058e20f460ed93aecf86bd7458f6d40f2b`, que incorpora 3.26.1 y sus cambios geográficos.

El replay compara ese código base y el candidato sobre las mismas entradas y configuración histórica. Los 3.982 registros han pasado por ambos motores. Esto constituye una comparación completa de reglas sobre la copia, **no una lectura editorial independiente de 3.982 artículos ni una medida poblacional de precisión/recall**. Los datos completos y el CSV por ID permanecen en `output/global-functional-audit/private/`, fuera de Git.

Los controles de negocio cubren APIs/MCP bancarios, APIs ajenas a banca, agentes para clientes, agentes internos de crédito, IA de marketing, consumo particular, tarjetas, adquirencia, transferencias, cuentas/liquidez, nóminas, impuestos, facturas, cobros, financiación, comercio exterior, custodia y seguridad. La muestra de ingesta anterior conserva 9 TP, 13 TN, 0 FP y 0 FN sobre 22 textos evaluables, con el mismo error de segmentación preexistente (1/16). No se extrapola esa muestra al histórico.

La revisión estructural también detecta funciones sin alias adicionales, etiquetas oficiales idénticas en varios bloques y nombres genéricos que necesitan contexto. La ausencia de un alias no elimina el nombre o la descripción del clasificador. No se fuerzan esos nombres a una subfunción arbitraria ni se interpreta un ensayo de nombres canónicos como exactitud editorial. Sigue siendo necesario revisar evidencia insuficiente y ambigüedades del histórico; este cambio no acredita que nunca harán falta nuevos ajustes.

## Cambios de negocio

| Evidencia operativa | Tratamiento |
| --- | --- |
| Compra/pago con tarjeta corporativa | Bloque 09; subfunción solo cuando hay evidencia específica |
| Pago de la deuda de la tarjeta | 09.09, separado de una transferencia genérica |
| Bloqueo, límites, PIN, reposición y otras operaciones de tarjeta | Alias específicos del catálogo, en español e inglés |
| SoftPOS/TPV, aceptación de tarjetas y tarifa de aceptación comercial | Bloque 11, sin confundir al comercio con el titular de la tarjeta |
| Transferencia desde cupo de tarjeta | Bloque 03; el instrumento de financiación no sustituye la operación |
| MCP/API para saldos, movimientos, tesorería y pagos | 17.16 API Channel; exige contexto bancario |
| Agente que consulta cuentas o ayuda al cliente empresarial | Canal/función bancaria que realmente utiliza; no se inventa una función de IA |
| Agente que prepara expedientes de crédito para corporate bankers | 18.xx cuando no hay subfunción más específica en el catálogo |
| Servicio genérico conocido, sin detalle funcional | `.xx Otros` del bloque; nunca una landing, dashboard o login inventados |

Se mantienen los filtros contra noticias de consumo personal, corporativas sin funcionalidad y referencias incidentales. Se amplían expresiones inglesas de préstamo personal/consumo para impedir que open banking de crédito particular entre como banca de empresas. El contexto compartido sigue ligado al titular: una mención incidental a cash management en el extracto no convierte una app de recetas en noticia bancaria.

## Fuentes primarias de contraste

- [Qonto MCP](https://qonto.com/en/ai/mcp): conexión con información y operaciones de la cuenta empresarial; permisos y aprobación de acciones siguen siendo relevantes.
- [HSBC MCP](https://interact.hsbc.com/developer/mcp/): acceso a funciones de tesorería corporativa mediante interfaces bancarias.
- [DBS Joy](https://www.dbs.com.sg/sme/dbsjoy): asistente para clientes empresariales.
- [DBS: agentes internos de corporate banking](https://www.dbs.com/newsroom/DBS_scales_agentic_AI_to_transform_way_of_working_for_corporate_bankers_freeing_up_time_for_more_strategic_client_engagements): preparación de evaluaciones de crédito y trabajo de gestores.
- [Westpac: costes de aceptación](https://www.westpac.com.au/business-banking/merchants-and-payments/manage/agreement-fees-and-charges/cost-of-acceptance/): la tarifa plana de transacción corresponde a aceptación comercial; se controla en Adquirencia.

Las pruebas derivadas de esas fuentes son paráfrasis funcionales y se identifican como tales, sin afirmar nuevos lanzamientos a partir de títulos sintéticos.

## Aplicación y recuperación

`applyFunctionalRuleUpgrade` requiere administrador y exclusión de escritores. Bloquea la migración si existe clasificación, taxonomía o publicación LLM pendiente. Antes de escribir crea una copia nativa completa del spreadsheet, verifica dimensiones y hash de cada tabla y guarda el manifiesto anterior y propiedades de recuperación.

Escribe únicamente las entradas `taxonomy`, `capabilities` y `relevanceRules` de Configuracion. Conserva activaciones, alias personalizados, ajustes administrativos, catálogo oficial y geografía. Verifica la configuración escrita y crea una generación candidata de taxonomía con reclasificación; no llama al reclasificador que modifica Noticias activa en el sitio. El lote verifica tanto clasificación como taxonomía persistidas. La generación activa solo cambia al finalizar la publicación de snapshots existente. Titulares, extractos, IDs, fechas, países, entidades, URLs y newsletters archivadas se conservan.

`reportFunctionalRuleUpgrade` permite leer en el registro de ejecución la revisión, cambios pendientes, backup y estado del trabajo. `rollbackFunctionalRuleUpgrade` restaura la configuración del backup verificado y el manifiesto anterior. Hay pruebas del bloqueo ante backup incompleto, idempotencia, preservación del catálogo y trabajo aislado hasta publicación; no equivalen a un rollback ensayado en producción.

La serialización elimina únicamente alias redundantes con el nombre canónico: ese nombre siempre se incorpora al modelo. Una prueba comprueba equivalencia exacta de todos los términos efectivos y evita exceder el límite de caché con configuraciones válidas extensas.

## Puertas pendientes de producción

1. Recuperar la sesión corporativa y comprobar generación, catálogo y configuración vivos; repetir la comparación si difieren materialmente de la copia.
2. Confirmar todos los checks de la revisión exacta de la PR y revisar nuevos comentarios.
3. Crear/verificar el backup nativo y conservar la versión desplegada anterior.
4. Publicar los archivos de `dist/` desde el editor de Apps Script del navegador de Codex, con lectura posterior de cada archivo; no usar clasp.
5. Ejecutar la migración administrativa y seguir la generación hasta su publicación, comprobando configuración, conteos, identidades y ejemplos en Sheets y en el canal.

Ninguna de estas comprobaciones pendientes se reemplaza por un resultado de pruebas locales.
