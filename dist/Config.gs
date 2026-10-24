const RADAR = Object.freeze({
  version:'3.20.0',
  sheets:{
    Enriquecimiento:['newsId','inputHash','version','state','attempts','nextAt','url','source','contentHash','signals','comparison','error','updated','durationMs'],
    CategorizacionLLM:['newsId','contentHash','catalogRevision','taxonomyRevision','schemaVersion','ids','primary','evidence','status','updatedAt','sources','proposals','replaces','publication'],
    Candidatos:['id','fecha','pais','entidad','titular','extracto','url','fuente','idioma','capturada','estado','motivo','procedencia','clasificacion'],
    Cobertura:['ejecucion','fecha','fuente','pais','desde','hasta','evaluadas','dentro','saturada','particiones','estado','error'],
    CatalogoFuncional:['id','bloque','nombre','descripcion'],
    DashboardSnapshots:['vista','generacion','parte','datos'],
    Configuracion:['clave','valor'],
    Suscripciones:['id','correo','nombre','filtros','periodicidad','activa','actualizada','idioma'],
    NewsletterEdiciones:['id','envio','correo','nombre','filtros','idioma','fecha','inicio','cantidad','estado','traducciones','editorial'],
    NewsletterContenido:['edicion','noticia'],
    NewsletterEnvios:['id','suscripcion','correo','desde','hasta','estado','fecha','detalle','contenido'],
    Noticias:['id','fecha','pais','medio','entidad','titular','extracto','url','capturada','fuente','idioma','clasificacion','taxonomia'],
    Auditoria:['ejecucion','fecha','fuente','url','resultado','motivo'],
    Ejecuciones:['id','inicio','fin','estado','fuentes','evaluadas','nuevas','errores'],
    Telemetria:['fecha','operacion','duracion_ms','estado','detalle'],
    NewsletterEventos:['id','edicion','correo','sesion','evento','destino','cadencia','fecha'],
    NewsletterFeedback:['id','edicion','correo','valoracion','comentario','fecha','estado'],
    Adopcion:['fecha','correo','sesion','evento','vista','duracion_ms'],
    Recargas:['id','tipo','desde','hasta','inicio','fin','estado','total','procesadas','pendientes','omitidas','fallidas','nuevas','actualizada','pausa'],
    Taxonomia:['id','palanca','subpalanca','segmentos','terminos','noticias','peso','origen','descripcion','condiciones'],
    TaxonomiaTraducciones:['clave','idioma','texto','fecha'],
    Traducciones:['clave','idioma','titular','extracto','fecha'],
    Recopilacion:['ciclo','fuente','url','estado','intentos','actualizada','evaluadas','nuevas','error','prioridad']
  }
});
const NEWSLETTER_EDITORIAL=Object.freeze({cards:3,groupEntity:'BBVA',entityThemes:2,supportItems:30,titleWords:18,factWords:18,relevanceWords:12,introWords:16,headingWords:6,commentChars:1000});
const TRANSLATION_WORK=Object.freeze({dailyCalls:3000,batchCalls:20,batchRows:100,readRows:20,maxMs:45000,retryMs:900000});

const NEWS_CACHE=Object.freeze({schema:4,chunkRows:128,recordParts:400,seconds:21600,dashboardChars:12000,dashboardParts:64});
const BACKGROUND_WORK=Object.freeze({maxBatches:3,maxMs:45000,sliceMs:10000,activeGraceMs:60000});

const COLLECTION_POLICY=Object.freeze({windowDays:28,searchTerms:10,localTerms:4,entityAliases:8,capabilityTerms:7,queryChars:1500,providerLimit:100,saturationRatio:.8,duplicateDays:14});
const CONFIGURATION_CATALOG_VERSION='3.17.1';
const CLASSIFICATION_WORK=Object.freeze({rulesVersion:'3.17.1',batchRows:100,maxMs:10000});
const RELEVANCE_ROLES=Object.freeze(['channel','service','shared','infrastructure','corporate','retail','editorial','incidental']);

const DASHBOARD_SNAPSHOTS=Object.freeze({views:['briefing','news','radar'],chars:40000,parts:64,refreshMs:300000});

const CANDIDATE_POLICY=Object.freeze({maxRows:10000,retentionDays:90,excerptChars:1500});
const INCIDENT_SIGNAL='Indisponibilidad / Incidencia operativa';
