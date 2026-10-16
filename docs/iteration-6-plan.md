# Iteración 6 · implementación y verificación

Estado final de cobertura, recuperación, períodos y publicación: [informe de negocio y rendimiento](iteration-6-business-policy.md). La lista inferior conserva el plan original.

Fuente: PDF de 10 páginas y telemetría exportada 2026-10-15T12:57:09.688Z. Rama `codex/iteration-6`, base `2b463ae` (PR36 ya corregido; despliegue65).

## Requisitos y estado

- [ ] Cabecera sin nombre de vista; navegación Mi Newsletter. Héroes homogéneos con título y contador (Radar sin última publicación/Explorar noticias).
- [ ] Ámbito único digital de Empresas e instituciones: sin controles Retail/generalista, ingesta/capacidades/traducciones/taxonomía limitadas; conservar noticias históricas y ediciones.
- [ ] Venezuela (también ámbito Empresas), Brasil, Canadá, EAU y entidades empresariales pertinentes. Añadir sin sobrescribir personalizaciones.
- [ ] No refrescar automáticamente contenido de lectura; solo filtros diferentes. Mantener progreso administrativo.
- [ ] TF-IDF: medir solapamiento de documentos y consolidar categorías redundantes, sin matriz de textos ni categorías emergentes redundantes.
- [ ] Todos los jobs de noticias ordenan por fecha descendente, no por orden físico de filas; diaria siempre prioritaria.
- [ ] Mantenimiento incremental mediante maintenance_ y worker existente: lotes/checkpoint, correcciones deterministas, alias confirmados preservando IDs y snapshots, retención/compactación segura con agregados, métricas e idempotencia; no noticias por antigüedad.
- [ ] País inicial de pestañas Noticias/Novedades y formulario de suscripción: inferencia aproximada idioma/zona horaria, sin permisos ni servicios IP; respetar selección explícita.
- [ ] Tarjetas: metadatos espaciados sin país redundante; todas las etiquetas aplicables visibles.
- [ ] Auditar contador de medios de Radar con datos reales; no confundir medio/editor con entidad ni prometer cobertura completa del proveedor.
- [ ] Una suscripción por usuario, país opcional del ámbito Empresas; todas las entregas quincenal/trimestral/anual automáticas, sin filtros personalizados ni efectos en defaults; alta/pausa/baja.
- [ ] Historial propio y administrativo con resumen muy compacto bajo details, acceso autorizado y contenido enviado inmutable.
- [ ] Administración siempre abre Ejecuciones; orden Ejecuciones, Taxonomía, Idioma, Suscripciones, Adopción, Telemetría, Fuentes, Auditoría, Configuración.
- [ ] Quitar controles de programación/pendientes/comprobar remitente y código UI obsoleto. Prueba administrativa por destinatario, cadencia y geografía; no enviar correos de prueba sin una petición concreta de envío.
- [ ] Migración idempotente del libro real, pruebas afectadas, distribución reproducible, publicación y medición real frente a telemetría.

## Decisiones

- Ubicación física no se puede deducir con certeza sin permisos: idioma con región y zona IANA sirven de preferencia inicial. No enviar IP a terceros.
- Se conservarán las noticias antiguas fuera del nuevo ámbito y los snapshots de newsletters; se excluyen de procesamiento y vistas actuales. Nunca borrar por antigüedad.
- Consolidación histórica de noticias mediante alias persistentes dentro de los registros existentes; preservar filas/IDs y referencias de fuentes, exports y newsletters.
- La telemetría histórica combina versiones; separar cargas reales de caché y no atribuir P95 de 30 días al nuevo despliegue.

## Diagnóstico previo

5.468 registros de telemetría, 1.849 ejecuciones y 20.000 auditorías visibles. Radar: 159 muestras, mediana 5.808 ms, P95 46.743 ms. Noticias: 312, mediana6.068 ms, P95 13.600 ms. Novedades:296, mediana7.062 ms, P95 15.378 ms. Las últimas cargas frías de Radar están entre14 y23s y render~20ms; el coste principal es servidor.

maintenance_ actualmente solo llama pruneEvents_ (Adopcion, Telemetria, NewsletterEventos, NewsletterFeedback), una vez al día mediante RETENTION_DATE. trim_ también borra por tamaño en varios puntos: revisar antes de añadir compactación y centralizar, no duplicar mantenimiento.

Fuentes de catálogo verificadas: [Mercantil Empresas](https://empresas.bancomercantil.com/BMELE/control/BoleExternal.mercantil), [RBC empresarial](https://www.rbcroyalbank.com/business/ways-to-bank-for-business/online-business-banking.html), [Emirates NBD businessONLINE](https://www.emiratesnbd.com/en/business-online), [Itaú Empresas](https://www.itau.com.br/canais-itau/itau-empresas-internet), [BBVA Provincial Empresas](https://www.bbva.com/es/bbva-provincial-ofrece-mas-comodidad-banca-digital-las-empresas/).
