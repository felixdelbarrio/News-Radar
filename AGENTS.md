# AGENTS.md — News Radar (BBVA Empresas)

## Misión y alcance
Mantener News Radar, aplicación de inteligencia de noticias para Banca de Empresas construida sobre Google Apps Script (V8), Google Sheets y frontend HTML/CSS/JavaScript. Resolver **solo** el objetivo de la iteración; conservar funcionalidad, datos, identidad BBVA, seguridad y rendimiento. Este archivo no autoriza por sí solo cambios en producción.

## Antes de actuar: puertas obligatorias
1. Leer el objetivo y los criterios de aceptación; comprobar `git status`, rama y diferencias. Si faltan datos imprescindibles, preguntar **solo** por ellos.
2. **Primera acción de cualquier iteración que implique publicar:** abrir con el navegador integrado de Codex el editor de Apps Script `https://script.google.com/d/1PVUFcfjfmHoiupAuMW4KIqaE3dk4VaHESkrSXexkD8UmtNqaeaHsIHn9/edit?usp=drive_link` y comprobar acceso real al proyecto correcto y capacidad de edición. Si pide autenticación, detener la publicación y solicitar al usuario que inicie sesión; no intentar eludir controles ni declarar acceso sin verificarlo. No usar `clasp`.
3. Comprobar acceso y permisos al Google Sheet `https://docs.google.com/spreadsheets/d/12ej-8WFP3_E8w12hgO0lZ-WUUV29aKGQqmdYxRezTvg/edit?usp=drive_link` antes de modificar datos. Confirmar que corresponde al backend esperado; el Excel exportado es una **instantánea**, no fuente de verdad en tiempo real.
4. Antes de cualquier escritura en producción, confirmar explícitamente alcance, destino, impacto y autorización del usuario; ante falta de acceso o aprobación, continuar únicamente con cambios locales verificables.

## Mapa del repositorio: inspección dirigida
- `src/server/`: backend Apps Script por dominios (`collection`, `news`, `storage`, `briefing`, `metrics`, `config`, `access`, `web`).
- `src/client/core/` y `src/client/features/`: frontend, estado, vistas y llamadas al servidor; `src/views/`: plantillas HTML.
- `src/design/tokens.json`: fuente de tokens visuales; revisar también `scripts/design.mjs` y pruebas de identidad visual.
- `src/appsscript.json`: manifiesto V8, servicios y permisos; no ampliar scopes sin necesidad y aprobación.
- `scripts/build.mjs`, `scripts/check.mjs`, `scripts/preview.mjs`: empaquetado, comprobaciones y vista previa; `dist/` es salida generada.
- `tests/*.test.mjs`: regresiones y pruebas de dominio; `scripts/benchmark-*.mjs` y pruebas `performance*`: medición reproducible.
- `.github/workflows/ci.yml`, `gitflow.yml`, `codeql.yml`: controles de integración y seguridad.
- `README.md`: consultar secciones pertinentes, no leerlo entero por defecto.

## Reglas de implementación (obligatorias)
- No dejar código muerto, rutas obsoletas, duplicación ni compatibilidad heredada **sin consumidores reales**. Antes de eliminar contratos o migraciones, verificar referencias y persistencia existente; nunca destruir datos históricos por simplificación estética.
- Priorizar la solución más sencilla, legible y eficiente; no añadir abstracciones, dependencias, flags ni configuraciones preventivas sin necesidad demostrada.
- Centralizar reglas de negocio, cálculos, validaciones, formatos y estilos en los módulos existentes. Reutilizar tokens y componentes BBVA; prohibidos colores, espaciados o tipografías hardcodeados cuando exista token aplicable.
- Mantener contratos entre Apps Script, cliente y hojas; preservar identificadores, esquemas, estados, claves, traducciones y mecanismos de recuperación. No confundir tablas canónicas con generaciones/snapshots históricos.
- Optimizar CPU, RAM, latencia y cuotas de Apps Script: minimizar lecturas/escrituras por celda, usar operaciones por lotes, evitar recorridos repetidos y serializaciones innecesarias, limitar datos transferidos al cliente y respetar límites de ejecución.
- Respetar idempotencia, concurrencia, reintentos, checkpoints y consistencia en recopilación, clasificación, deduplicación, taxonomía, newsletters y snapshots. No generar envíos reales durante pruebas sin autorización.
- Nunca introducir secretos, datos personales o contenido íntegro de producción en logs, fixtures, commits, PR ni respuestas. Usar muestras anonimizadas y mínimas.

## Protocolo por iteración (economía de tokens)
1. Identificar archivos y flujos afectados mediante búsqueda selectiva (`rg`, nombres de símbolos, pruebas relacionadas). No volcar repositorio, hojas completas, logs masivos ni repetir lecturas sin motivo.
2. Definir internamente hipótesis, cambio mínimo y criterio verificable. Explicar un plan corto **solo** si la tarea es compleja, destructiva o requiere decisión.
3. Crear rama desde `develop` actualizada según política de GitFlow; usar nombre descriptivo compatible con `scripts/gitflow-check.mjs`. No trabajar directamente en `develop`.
4. Implementar el menor diff coherente; eliminar sustituciones obsoletas **solo tras comprobar que no tienen consumidores**. No reformatear archivos ajenos al objetivo.
5. Ejecutar primero pruebas específicas; luego `npm run check`, `npm run check:dist` y, antes del PR, `npm run verify` y los controles exigidos por CI. Node según `.nvmrc` (proyecto requiere >=24). Verificar que el build corresponde al código fuente.
6. Comparar rendimiento antes/después en el mismo escenario: tiempos, número de llamadas a Sheets/servicios, filas leídas/escritas, tamaño de payload, memoria/CPU cuando medibles, cuotas y errores. Utilizar benchmarks existentes; no declarar mejoras sin medidas.
7. Preparar PR hacia `develop`, describir objetivo, archivos, tests, riesgos, mediciones y despliegue. Revisar checks y comentarios; corregir y volver a comprobar. **No afirmar PR creado, checks verdes o comentarios resueltos sin evidencia de GitHub.** No hacer merge salvo instrucción expresa.
8. Si la iteración incluye publicación y está autorizada, usar **solo** el navegador integrado de Codex para promocionar el artefacto compilado al proyecto Apps Script verificado. Confirmar integridad de todos los archivos y manifiesto, versión/despliegue correcto y resultado; no usar `clasp` ni publicar desde fuentes parciales. Si el navegador no puede realizar el flujo de manera fiable, detenerse y explicar el bloqueo.
9. Actualizar el Google Sheet **solo en las pestañas/rangos imprescindibles** y con copia/registro de cambios, precondiciones, validación de esquema y lectura posterior. No reemplazar toda la hoja, ni editar manualmente tablas derivadas o de generaciones salvo que el diseño lo exija. Evitar sobrescribir datos que cambiaron desde la lectura.
10. Medir el comportamiento **en la publicación real** después del despliegue, con casos seguros y comparables; contrastar con la línea base de `Telemetria` y las métricas del flujo afectado. Si hay regresión, parar, documentar y proponer reversión; no ocultar resultados negativos.

## Evidencia y telemetría
El Excel de producción revisado contiene `Telemetria` (`fecha`, `operacion`, `duracion_ms`, `estado`, `detalle`) y pestañas como `Noticias`, `Candidatos`, `Cobertura`, `Recopilacion`, `Ejecuciones`, `Adopcion`, `Auditoria`, `Configuracion`, `Taxonomia`, `CategorizacionLLM`, `DashboardSnapshots` y newsletters. Hay además pestañas con sufijos de generación; **no tratarlas automáticamente como duplicados eliminables**. Analizar únicamente el rango temporal y operaciones vinculados al cambio. Comparar mediana, p95, errores, volumen procesado y tiempo por unidad cuando exista muestra suficiente; distinguir red, procesamiento y persistencia si el detalle lo permite. No atribuir causalidad a comparaciones con cargas distintas.

## Condiciones de cierre
Entregar una síntesis breve: `objetivo | cambios | tests/checks | rendimiento antes/después | Sheet | Apps Script | rama/PR | bloqueos`. Marcar cada operación externa como `verificada`, `pendiente` o `bloqueada`, con evidencia concreta. Nunca declarar despliegue, escritura en Sheets, acceso, PR ni métricas reales si no se han comprobado. Si una instrucción choca con seguridad, permisos, integridad de datos o una orden explícita posterior del usuario, detener la acción afectada y solicitar decisión.
