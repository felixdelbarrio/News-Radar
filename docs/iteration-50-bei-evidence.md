# Iteración 50: evidencia BEI y mercado del hecho

La relevancia digital requiere un destinatario empresarial o institucional, o un uso inequívoco, y una capacidad de banca digital. Una mención de tecnología, un nombre de entidad, la cabecera «Empresas:» o una señal de lanzamiento o alianza no sustituyen esa prueba. Un piloto puede ser una mejora si acredita el uso empresarial y la operación probada; la señal no afirma que el producto ya esté disponible. La evidencia disponible sigue siendo la del titular y el extracto.

El país del hecho usa el contenido y respeta las asignaciones manuales. Si solo se acredita una región, se conserva como región. El medio, la edición, el RSS y el idioma siguen siendo datos de procedencia. Cuando el texto no acredita mercado, el resultado es «Sin determinar». La deduplicación conserva su archivo de duplicados; un descarte editorial o una reclasificación por falta de evidencia ya no elimina una noticia única.

Para revisar un histórico antes de cualquier escritura, compilar el paquete y usar un JSON local autorizado con `id`, `titular` y, si están disponibles, `extracto`, `entidad`, `medio`, `pais`, `url`, `fuente` y `clasificacion`:

```sh
npm run build
node scripts/audit-bei-evidence.mjs /ruta/entrada.json /ruta/informe.json --baseline=ac76c0b
```

El informe se crea sin sobrescribir archivos y contiene solo los IDs cuyas decisiones cambian y la evidencia derivada. Mantenerlo fuera de Git. Compara dos versiones sobre el mismo texto con la configuración local por defecto, sin consultar artículos, Sheets ni Apps Script. Un cambio de resultado es un candidato a revisión, no una corrección aprobada. Antes de tocar el histórico, confirmar la generación activa, contrastar los casos dudosos con fuentes primarias, revisar los IDs y los valores actuales y acordar el alcance exacto. No usar un lote global para aplicar un informe de prueba.
