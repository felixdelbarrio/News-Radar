# Catálogo global de funcionalidades · 3.4.0

El [inventario completo de códigos y equivalencias](functional-catalogue-3.4.0-inventory.md) cubre las 322 funcionalidades oficiales. Esta revisión afina el catálogo 3.3.0 y sustituye su comportamiento de clasificación múltiple y revisión opcional de Drive.

## Comportamiento

- Los nombres corporativos permanecen originales en español, incluidos Home, Security Experience & Onboarding, Enablers, Core y Quantum. Solo inglés y turco solicitan traducciones. El proceso elimina las traducciones antiguas fuera de los idiomas o nombres activos al completar su trabajo.
- Cada asignación contiene una sola funcionalidad y su bloque. La coincidencia combina IDF de las palabras del catálogo, frecuencia suavizada, correspondencia con el nombre funcional, evidencia del titular (peso cuatro y prioridad a su parte inicial) y contexto del bloque. Los pesos se compilan una sola vez por modelo. El desempate es estable. Una coincidencia específica prevalece sobre la equivalencia general de la categoría. No se crean bloques ni se utiliza un bloque sin funcionalidad como etiqueta final.
- Las etiquetas contienen únicamente código y nombre. Los filtros conservan los valores canónicos, muestran nombres sin código, se ordenan por el idioma visible y se restringen mutuamente.
- Noticias utiliza la tipografía y color compartidos de los titulares de Novedades. Medio y Origen RSS quedan separados.
- La sección se denomina Catálogo global de funcionalidades en la navegación, configuración, idiomas y Radar. La URL admite vaciarse; con un valor, toda actualización intenta consultar ambas pestañas de Drive. No existe un interruptor de revisión adicional.
- Drive valida el catálogo antes de escribir, conserva equivalencias de negocio y referencias históricas y solicita reclasificación cuando encuentra cambios. Si falla, conserva las reglas guardadas y registra el fallo. No cambia los permisos ni escribe en el catálogo de referencia.

La fuente tiene una variación de mayúsculas en Herramientas empleados/Empleados. Se agrupa como un solo bloque, conservando la primera etiqueta de la fuente; no se traduce ni se divide esa identidad.

## Búsqueda que acompaña al catálogo

Los RSS y las búsquedas generales se mantienen. Cada consulta complementaria combina la entidad, términos funcionales y contexto empresarial. Su presupuesto sigue siendo seis términos y no introduce un producto cartesiano de entidades por funcionalidades.

Tres posiciones exploran el catálogo y tres las capacidades actuales, con rotación diaria y diversificación por entidad y geografía. Cada uno de los 322 IDs participa. Una nueva función de Drive entra en este plan automáticamente, sin desplegar código. VOSTRO dispone de equivalencias bilingües; Quantum se busca dentro del contexto empresarial de la entidad.

Las reglas admiten conceptos concretos de depósitos tokenizados, pagos con stablecoins, pagos F24/I24, automatización documental de trade finance y agentes de IA. Solo se publican los que superan los umbrales; no se asigna un código corporativo inventado.

Una posición del presupuesto funcional prioriza conceptos emergentes ya publicados con evidencia TF-IDF; el resto mantiene la exploración. El índice se reconstruye solo cuando cambia la configuración o la revisión del modelo. Así, la evidencia observada retroalimenta las consultas sin desplazar los RSS ni las búsquedas amplias.

Las propuestas `.xx` necesitan una regla semántica admitida en negocio, al menos tres documentos y dos medios, ausencia de equivalencias corporativas y evidencia no redundante; máximo tres por bloque. Una coincidencia incidental o un adjetivo frecuente no crea una funcionalidad. Por decisión del usuario tras revisar el histórico real, las noticias sin evidencia suficiente se conservan visibles y se marcan «Sin clasificación funcional justificable». La marca no es una funcionalidad nueva ni un bloque. Los casos justificables reciben una única pareja; no se fuerza una asociación para aparentar cobertura del 100 %.

## Validación

La muestra congelada contiene 368 entradas. Conserva las ocho admitidas por la revisión anterior, sin bajas, y admite una adicional; las nueve encuentran una funcionalidad en el modelo resultante. La muestra permite validar conservación y clasificación, no demostrar un aumento del volumen real de las próximas recuperaciones.

La batería completa supera 499 pruebas, incluida la marca de noticias no catalogables. La comprobación de sintaxis, diseño, permisos y distribución reproducible también pasa. En el benchmark alternado de cuatro muestras por versión con 50.000 registros, Radar pasa de una mediana de 343,1 a 346,8 ms; Noticias de 141,55 a 141,7 ms; una repetición mantiene 0,2 ms y cero lecturas. El histórico completo pasa de 3.359,2 a 3.391,45 ms. Las diferencias son próximas al 1 %; se conservan los resultados y las lecturas de Sheets (tres en Radar). Los benchmarks locales utilizan V8 y un adaptador de Sheets en memoria; no equivalen a latencia o memoria de Apps Script.

La admisión consulta el catálogo adicional solo si las capacidades habituales no bastan. Los cambios en conceptos emergentes no fuerzan otra reclasificación de admisión; sí actualizan el modelo funcional.

## Auditoría del histórico real

El 17 de octubre se conservan las 8.770 filas de Noticias. La admisión empresarial identifica 435 noticias. La auditoría independiente del modelo y de la columna persistida confirma 348 con una pareja funcional, 87 sin evidencia suficiente, cero asignaciones múltiples y cero discrepancias. El modelo incorpora las 322 funcionalidades oficiales y un único concepto emergente admitido: `03.xx Pagos con stablecoins`. Los demás conceptos propuestos no superan los umbrales y no se publican.

## Publicación

Promovida a la versión 73 de la implementación existente el 17 de octubre de 2026 a las 11:18 (Madrid), con acceso de dominio y ejecución por el propietario. El paquete publicado no incluye las herramientas temporales de auditoría.

## Medición de la publicación

Las mediciones se obtienen del registro `Telemetria`, exportado después de navegar por la implementación 73 con los trabajos de fondo pausados durante la prueba. Se excluyen las respuestas de 3.3.0 durante la propagación de Apps Script. Las primeras muestras confirmadas de 3.4.0 son:

| Vista | Carga con RPC, red incluida | Servidor | Reutilización en navegador |
| --- | ---: | ---: | ---: |
| Novedades | 8.366 ms | 3.912 ms | No medida con versión confirmada |
| Noticias | 4.993–5.468 ms | 2.172–2.598 ms | 48–67 ms, cero RPC |
| Radar | 5.987 ms | 2.331 ms | 62 ms, cero RPC |

Son muestras directas, no una estimación de P95 ni una garantía de latencia. En la referencia anterior se observaron 12.061 ms en Novedades, 6.394 ms en Noticias y 6.456 ms en Radar; las condiciones de caché y RPC compartida difieren, por lo que no se atribuye un porcentaje causal de mejora. La comparación local alternada mantiene resultados y lecturas con una variación próxima al 1 %. No hay instrumentación de RAM de Google Apps Script; no se presenta el tiempo de red como consumo de CPU.

La inspección de la interfaz publicada confirma la misma familia, tamaño (20 px), peso (700), interlineado (32 px) y color de los titulares en Novedades y Noticias; separación de 8 px entre Medio y Origen; filtros sin códigos, alfabéticos, y restricción de las 21 funcionalidades de Cuentas al elegir su bloque. Las seis noticias sin evidencia funcional de la página de España muestran su marca. La configuración conserva la URL corporativa y no tiene checkbox de revisión.

En una sesión posterior con caché fría se registran 17.702 ms en Novedades (13.021 ms de servidor), 13.771 ms en Noticias (9.375 ms de servidor) y 11.993 ms en Radar (7.310 ms de servidor). Estos resultados se conservan junto a los anteriores: la mayor parte de la variación proviene de lectura de noticias y transporte. Durante esa sesión se observa un `NetworkError HTTP 0` en la interfaz, que se recupera al recargar. No se afirma ausencia total de errores ni una latencia uniforme de 5–8 segundos. Las muestras correctas y el fallo observado quedan diferenciados.

El planificador se reanuda explícitamente y el editor remoto se vuelve a cargar para confirmar que `Config.gs` coincide con la distribución limpia. No quedan las funciones temporales de preparación, avance ni auditoría en el proyecto.
