# I54 — motor funcional compartido y soporte multilingüe

La migración extrae el ranking, contexto funcional, normalización, fallback y validación de evidencias de News Radar hacia EDCCatalogClassifier. News Radar conserva admisión empresarial, entidad/geografía, deduplicación, precedencia LLM, identificadores, estadísticas y generaciones. No queda un segundo motor local de asignación; los adaptadores invocan la versión fija de biblioteca. Los checkpoints incluyen la versión del algoritmo compartido sin cambiar el modelo que protege los resultados LLM existentes.

El paquete real de la biblioteca, fijado a `90f07dba3d03016a785617eea8f1e5242e3276c2`, se usa también en pruebas, auditorías y vista previa; no se reemplaza por un mock ni por una copia del motor. La biblioteca queda prevista en versión Apps Script **4**, algoritmo **5.9.0-multilingual-runtime**; News Radar **3.40.7**. La publicación real y sus mediciones se registrarán tras la verificación en el editor.

## Validación de categorías y rendimiento

La reproducción local compara los mismos 851 registros, modelos y etiquetas de producción: cero cambios en IDs, orden, motivos o evidencias. Siete repeticiones con modelos calientes dieron p50 CPU de 362 ms antes y 345 ms después, p95 de 373/357 ms. Es una medida local, sin red ni cuotas de Google; no acredita p95 productivo. El runtime puro no añade lecturas de Sheets ni peticiones de red por noticia.

No se ejecuta un backfill de los 858 canónicos ni se sustituyen sus 849 asignaciones históricas. Las 350 diferencias del shadow anterior de la candidata 2 siguen siendo una cuestión de otra política/modelo, no una autorización para reescribir historia. Las siete decisiones humanas y sus hashes UTF-8 se conservan en la evidencia privada; esta migración no afirma haberlas escrito en producción.

## Idiomas y decisiones terminológicas

La matriz integral pasa por evaluate_ y la asignación funcional para 19 locales: es, en, tr, de, fr, it, ro, nl, pt-PT, pt-BR, zh-Hans, zh-Hant, ja, ko, id, ms, vi, th e hi. Incluye controles minoristas, corporativos e incidentales y respeta capacidades/señales desactivadas. Son casos sintéticos editoriales, no tasas de error estimadas sobre todas las noticias de esos países. La configuración geográfica de alcance se preserva; esto no declara traducidas todas las operativas ni todos los idiomas oficiales de cada país.

Por delegación expresa del usuario se aprobaron las 25 expresiones como **evidencia contextual de su rol**, no como 25 errores de admisión ni como permiso para aceptar noticias por una palabra aislada:

| Idioma | Expresiones revisadas | Uso |
| --- | --- | --- |
| tr | likidite yönetimi; lansman | Tesorería; lanzamiento |
| de | Firmenkundengeschäft; Liquiditätsmanagement; Zahlungsverkehr; Einführung; Partnerschaft | Audiencia; tesorería; pagos; lanzamiento; alianza |
| fr | banque en ligne; gestion de trésorerie; gestion de liquidité; paiements; lancement; partenariat | Canal; tesorería; pagos; lanzamiento; alianza |
| it | gestione della liquidità; lancio | Tesorería; lanzamiento |
| ro | servicii bancare pentru companii; gestionarea lichidității; plăți; lansare; parteneriat | Audiencia; tesorería; pagos; lanzamiento; alianza |
| nl | cashmanagement; liquiditeitsbeheer; betalingen; lancering; samenwerking | Tesorería; pagos; lanzamiento; alianza |

Las 25 tienen pruebas con servicio empresarial completo y controles donde la expresión aislada se rechaza. Se corrigen ß/ss, caracteres y marcas no latinas y frases insertadas en escrituras sin espacios; el texto original y los hashes de revisión no se traducen ni modifican. Las expresiones explícitas de transferencias internacionales se reconocen en 03.13 con exclusiones. La deduplicación permite coincidencias exactas de titulares nativos suficientemente largos, conserva las marcas vocálicas y mantiene el umbral latino anterior.

El adaptador real de Market Pulse se probó localmente con catálogo/reglas/traducciones congelados, respuestas vacías/múltiples, revisión cambiada y nueve locales APAC. Su suite sin cambios pasa 207 pruebas. No se activa ni migra su histórico en esta publicación.

## Downdetector: alcance y acceso

La web pública devuelve HTTP 403 con desafío de Cloudflare. El usuario confirmó no disponer de acceso Enterprise/API. Se incorpora **Incidencias · referencias a Downdetector**, cobertura de prensa vía Google News RSS, claramente diferenciada de una conexión directa al proveedor. La descarga comprobada devuelve HTTP 200 y RSS válido; sus 29 resultados no equivalen a 29 incidencias aceptadas.

La fuente usa los controles existentes de entidades seguidas, servicio digital, Empresas/Instituciones, PYMES y autónomos, fecha y duplicación. Exige una referencia a Downdetector y evidencia independiente de incidencia, eliminando esa palabra antes de evaluar la señal. Rechaza estados normales, menciones genéricas, novedades y banca minorista; las entradas aceptadas llevan solo **Indisponibilidad / Incidencia operativa** y se excluyen de Novedades. Se puede desactivar desde Fuentes. Añade una consulta RSS por ciclo, con los límites/reintentos existentes; no solicita la web protegida ni genera envíos de prueba.

## Referencias lingüísticas y técnicas

Los conceptos se contrastaron con documentación pública de [MUFG para empresas](https://www.bk.mufg.jp/houjin/kokusai_gaitame/soukin/index.html), [KB empresarial](https://obizapi.kbstar.com/quics?cc=b066450%3Ab066457&page=C065542), [KBank](https://www.kasikornbank.com/th/business/sme/international-trade/global-money-transfer/pages/kbiz-international-transfer.aspx), [DBS Indonesia](https://www.dbs.id/id/sme-id/day-to-day/ways-to-bank/online-banking-ideal/comprehensive-services), [CIMB Malasia](https://www.cimb.com.my/bm/business/digital-services/bizchannel-cimb.html), [Vietcombank](https://www.vietcombank.com.vn/To-chuc/SMEs/Danh-sach-tin-noi-bat-KHSMEs/Articles/2026/11/09/Huong-dan-cc-hs-tao-yc-tren-vcbdigibiz), [SBI](https://sbi.bank.in/hi/web/faq-s/faq-internet-banking), [Caixa Portugal](https://www.cgd.pt/Empresas/Gestao_corrente/Servicos/Pages/Canal-Multibancario.aspx) e [Itaú Empresas](https://www.itau.com.br/empresas/pagamentos-recebimentos/gestao-financeira). La [API oficial de Downdetector](https://downdetectorapi.com/v2/docs/) requiere acceso Enterprise.

## Promoción y reversión

Promover únicamente el paquete completo verificado de biblioteca y después el de News Radar, mediante navegador integrado y conservando URL, permisos y ejecutor. No ejecutar setup, sincronización de catálogo, importación, backfill ni envío de newsletters. Antes de activar: comprobar igualdad real, pins/modelos y medidas comparables sin escrituras canónicas. Retirar la sonda temporal y verificar todos los archivos antes de crear la versión web. La reversión de la aplicación conserva la versión 171/dependencia 1; la fuente operativa de biblioteca y su activador se preservan. Estado de promoción: **PENDIENTE** hasta registrar evidencia real.
