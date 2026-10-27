> Estado histórico del diagnóstico inicial. La implementación posterior de reglas 3.27.0 y su decisión de publicación están documentadas en [Auditoría funcional global](functional-quality-3.27.0.md). Las métricas de este documento no se reutilizan como una validación del nuevo candidato.

# Iteración 27: diagnóstico y NO-GO

## Alcance y decisión

Se implementa la parte local y reproducible de la auditoría, desde `origin/develop` (`d70b55e`), en `codex/iteration-27-audit`. No se presenta como terminada la validación editorial ni el replay exacto de producción. El PDF y el Excel aportados se usan como especificación y datos de análisis; sus mandatos de publicación externa no son permisos adicionales del usuario.

El resultado es **NO-GO** para reclasificación y publicación. No se han cambiado las reglas, desplegado código, activado generaciones, borrado registros, modificado Sheets, enviado comunicaciones ni abierto PR. El cambio previo en `dist.txt` se conserva.

## Implementación

- `scripts/import-quality-audit.py`: lectura del XLSX con biblioteca estándar; encuentra la pestaña por relaciones OOXML, conserva los textos originales, verifica 170 IDs distintos y registra SHA-256 del archivo. No ejecuta macros ni fórmulas ni modifica el original.
- `scripts/quality-audit.mjs`: ejecuta `classification_` y `newsCountry_` de las fuentes reales en una VM sin servicios de escritura. La instrumentación AST de `digitalAssessment_` registra los operandos ejecutados de la expresión real, conservando valores y cortocircuitos. Captura capacidades, aiOnly, workforce, bilateral, explicitDigital, excluded, editorial, business, channel, shared, incident, operational y resultado digital. Un operando no ejecutado tiene valor `null`, no `false`.
- `scripts/probe-audit-sources.mjs`: cuatro solicitudes concurrentes como máximo, cuatro segundos por solicitud, 128 KiB por respuesta, sin reintentos ni seguimiento automático de redirecciones. Checkpoint atómico por entrada, URL y revisión de herramienta. Solo sondea Google News y las URLs exactas del corpus versionado importado estáticamente; un archivo de entrada no puede añadir destinos, rutas ni parámetros enviados por red. Las fuentes directas se revisan por separado. No considera una página de consentimiento evidencia editorial. La revisión 2 invalida los checkpoints anteriores para repetir el sondeo con esta restricción.
- CSV y JSON por ID: entradas, revisiones, traza, estado almacenado, salida diagnóstica, país, coincidencia diagnóstica, causa de imposibilidad de replay, consultas de red y decisión. Las lecturas externas parciales se conservan como `weak_evidence`, siempre con etiqueta `unknown`.
- Métricas: referencia `unknown` o débil fuera de los denominadores; valores sin muestra son `null`. Una abstención del clasificador sobre un positivo verificado cuenta contra recall. No se presenta coincidencia entre reglas como precisión.
- Decisión conservadora: las cinco puertas deben tener evidencia de aprobación explícita. La herramienta diagnóstica actual emite NO-GO porque no obtiene ni acredita las evidencias productivas. Este evaluador local **no es una barrera añadida a los endpoints de producción**, ni un implementador de despliegue.

La instrumentación solo existe en `scripts/`; no añade CPU, lecturas ni columnas al sistema productivo. Las nuevas pruebas se incorporan al patrón existente `tests/*.test.mjs` de CI.

## Resultados observados

Archivo de entrada SHA-256: `3c362b8d2af59a0f313c9073ea044a2fae121402fad1720a4cb465dfb85880ab`.

| Resultado | Casos |
| --- | ---: |
| IDs distintos preservados | 170 |
| Estados nuevos registrados en Excel: indeterminado / no relevante | 145 / 25 |
| Diagnóstico con defaults: relevante / indeterminado / no relevante | 17 / 131 / 22 |
| Coincidencia de estado con Excel, solo diagnóstica | 153 |
| Diferencia de estado, sin afirmar fallo de reglas | 17 |
| Replay exacto acreditado | 0 |
| Etiquetas independientes definitivas utilizables como referencia | 0 |
| Etiqueta automática conservadora unknown | 170 |
| Consultas Google News que redirigen a consentimiento | 168 |
| URLs directas fuera del sondeo Google | 2 |
| Fuentes leídas por separado con evidencia parcial | 3 |
| Noticias reclasificadas / publicadas en producción | 0 / 0 |

El Excel no contiene las fechas originales, configuración y catálogo de producción, feeds completos, medio e idioma originales, manifiesto ni propiedades. No se rellenan con datos inventados. Se usa `configurationDefaults()` solo para el diagnóstico, identificado como `repository_defaults`. Incluso al proporcionar otra configuración, se identifica como snapshot no acreditado y no se afirma replay exacto. La puerta final de `evaluate_` no es reproducible con estas entradas y se declara expresamente.

La asignación determinista de partición agrupa por URL canónica y reserva aproximadamente una quinta parte como `holdout`. Es una reserva provisional, **no** un holdout estratificado validado: no incorpora positivos persistentes ni candidatos descartados, no garantiza agrupación de todas las copias sindicadas y no se usa para afirmar mejora. Las 170 transiciones son una muestra seleccionada y no miden recall de ingesta ni calidad global.

### Lecturas externas parciales

- [Comunicado de DBS](https://www.dbs.com/newsroom/dbs_posb_commits_sgd_10_million_to_help_singaporeans_manage_cost_pressures_and_fortify_business_resilience): corrobora apoyo a adopción empresarial de IA y campaña de consumo; no basta para acreditar una función nueva del canal bancario empresarial.
- [Nota externa publicada en Finextra](https://www.finextra.com/pressarticle/111261/bbva-joins-meta-backed-personal-agent-protocol-initiative): describe participación de BBVA en un protocolo y aplicaciones futuras. No acredita por sí sola disponibilidad operativa empresarial.
- [Artículo de Stripe](https://stripe.com/blog/what-stripe-data-shows-about-fraud-at-ai-startups): aporta contexto de prevención de fraude y funciones de Radar. La lectura no completa por sí sola la rúbrica editorial bancaria.

Estas inferencias conservadoras se registran en `tests/fixtures/iteration-27-source-reviews.json`, con URL, fecha, ubicación y fragmento breve. No sustituyen una comprobación sistemática independiente del conjunto.

## Consumidores y conservación

`newsLabels_` separa relevante, indeterminado y no relevante. `businessNews_` exige digital y capacidad Empresas. `businessNewsIndex_` limita los lectores actuales a esa membresía; `annotateNews_` puede excluir además por evidencia editorial LLM válida; `briefingAllowed` limita Novedades a señales admitidas. Por ello, una capacidad aislada no implica visibilidad. Los filtros temporales, taxonomía, duplicados y archivos históricos añaden otras condiciones. Las newsletters archivadas tienen sus propios snapshots.

`newsClassificationBatch_` escribe celdas en la hoja de noticias activa. Que el repositorio disponga de generaciones para otros flujos no hace que ese endpoint sea una publicación candidata condicionada por G0–G4. La auditoría no lo llama ni lo presenta como seguro para ejecutar masivamente.

La geografía se evalúa separadamente. El motor actual todavía usa dominio/editor y origen como fallback. Los países diagnósticos no se consideran evidencia del mercado afectado y no se persisten. No se cambia esa política a partir de etiquetas pendientes.

## Puertas

| Puerta | Resultado | Evidencia pendiente |
| --- | --- | --- |
| G0 Seguridad | NO-GO | Snapshot inmutable completo, exclusión de escritores, recuperación y rollback productivo ensayados |
| G1 Evidencia | NO-GO | Replay exacto o causa documentada por caso; verificación independiente y muestra adicional estratificada |
| G2 Calidad | NO-GO | Baseline/candidato con referencia suficiente, holdout independiente y defecto causal demostrado |
| G3 Integridad | NO-GO | Reconciliación del corpus productivo, candidatos, referencias históricas y generaciones |
| G4 Operación | NO-GO | Piloto real y mediciones equivalentes antes/después en Apps Script y WebApp |

Drive devolvió 404 con la conexión disponible. El navegador pudo abrir la Sheet, pero esa inspección no acredita backup, contenido exportado, manifiesto activo o exclusión de escritores. Una orden de descarga sin archivo local verificado no se cuenta como snapshot. No se afirma que el acceso a producción sea imposible ni que la generación activa haya sido identificada.

## Reproducir

Validación realizada: `npm ci` y `make check-dist verify` terminaron correctamente; 814 pruebas generales, cero fallos. Tras los ajustes finales de evidencia se ejecutaron las nueve pruebas específicas, también sin fallos. Cobertura general: 92,58 % de sentencias, 85,50 % de ramas, 95,18 % de funciones y 98,03 % de líneas. `git diff --check` pasa. La cobertura de ese comando corresponde a `src/`, no mide la cobertura de las herramientas nuevas de `scripts/`.

Los logs locales se conservan en `output/iteration-27/verify.log` y `output/iteration-27/npm-ci.log`. No se han ejecutado checks remotos ni mediciones de rendimiento productivo. Los percentiles de `report.json` corresponden únicamente a esta ejecución diagnóstica local instrumentada, sin comparación baseline/candidato.

```sh
python3 scripts/import-quality-audit.py '/ruta/20261025 - Iteración 27 Auditoría.xlsx' tmp/iteration-27/input.json
node scripts/probe-audit-sources.mjs tests/fixtures/iteration-27-audit.json output/iteration-27/source-probes.json
node scripts/quality-audit.mjs tests/fixtures/iteration-27-audit.json output/iteration-27 - output/iteration-27/source-probes.json tests/fixtures/iteration-27-source-reviews.json
node --test tests/quality-audit.test.mjs
make check-dist verify
```

`-` selecciona defaults diagnósticos; puede sustituirse por un JSON de configuración ya resuelta con catálogo funcional. El resultado contiene `audit.csv`, `audit.json` y `report.json` bajo `output/iteration-27/`. Los artefactos voluminosos y las consultas de red permanecen locales en el directorio ignorado por Git; el fixture de entrada y las pruebas quedan preparados para versionar. Las pruebas no consultan red ni requieren servicios Google.

No se modifican las pestañas del Excel original: el registro completado se entrega como CSV y JSON separados. No se han completado las fases de evaluación productiva, verificación de todas las fuentes originales o reclasificación masiva. NO-GO conserva la producción y permite retomar esas fases sin atribuir una mejora no demostrada.
