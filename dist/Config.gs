const RADAR = Object.freeze({
  version:'2.3.0',
  sheets:{
    Configuracion:['clave','valor'],
    Suscripciones:['id','correo','nombre','filtros','periodicidad','activa','actualizada','idioma'],
    NewsletterEdiciones:['id','envio','correo','nombre','filtros','idioma','fecha','inicio','cantidad','estado','traducciones'],
    NewsletterContenido:['edicion','noticia'],
    NewsletterEnvios:['id','suscripcion','correo','desde','hasta','estado','fecha','detalle','contenido'],
    Noticias:['id','fecha','pais','medio','entidad','titular','extracto','url','capturada','fuente','idioma','clasificacion','taxonomia'],
    Auditoria:['ejecucion','fecha','fuente','url','resultado','motivo'],
    Ejecuciones:['id','inicio','fin','estado','fuentes','evaluadas','nuevas','errores'],
    Telemetria:['fecha','operacion','duracion_ms','estado','detalle'],
    Adopcion:['fecha','correo','sesion','evento','vista','duracion_ms'],
    Recargas:['id','tipo','desde','hasta','inicio','fin','estado','total','procesadas','pendientes','omitidas','fallidas','nuevas','actualizada','pausa'],
    Taxonomia:['id','palanca','subpalanca','segmentos','terminos','noticias','peso','origen'],
    TaxonomiaTrabajo:['estado'],
    TaxonomiaTraducciones:['clave','idioma','texto','fecha'],
    Traducciones:['clave','idioma','titular','extracto','fecha'],
    Recopilacion:['ciclo','fuente','url','estado','intentos','actualizada','evaluadas','nuevas','error','prioridad']
  }
});
const TRANSLATION_WORK=Object.freeze({hour:2,dailyCalls:3000,batchCalls:20,batchRows:100,readRows:20,maxMs:45000,retryMs:900000});

const BACKGROUND_WORK=Object.freeze({maxBatches:3,maxMs:45000});

const COLLECTION_LANGUAGE_TERMS=Object.freeze({it:['banca digitale','conto corrente'],de:['digitales banking','girokonto'],fr:['banque en ligne','paiements'],pt:['banca digital','conta digital'],nl:['digitaal bankieren','betaalrekening'],ro:['banca digitala','cont online']});
const COLLECTION_POLICY=Object.freeze({windowDays:28,searchTerms:10,entityAliases:8,capabilityTerms:6,queryChars:1500,providerLimit:100,saturationRatio:.8,duplicateDays:2});
const CONFIGURATION_CATALOG_VERSION='1.13.0';
const CLASSIFICATION_WORK=Object.freeze({batchRows:100,maxMs:10000,dailyMinute:30});
const DIGITAL_RULES=Object.freeze({
  negative:['resultados financieros','resultados trimestrales','beneficio neto','cotizacion','dividendo','recompra de acciones','nombramiento','patrocinio','earnings','net profit','share price','stock price','dividend','buyback','appoints','sponsorship'],
  editorial:['que es','que son','como funciona','guia de','what is','what are','how to','guide to','webinar','opinion','premio','award'],
  changes:['lanza','lanzamiento','estrena','presenta','incorpora','integra','automatiza','renueva','mejora','amplia','launch','introduc','unveil','rolls out','enable','upgrade','enhance','expand','yeni','sunar','baslat','lancia','avvia','startet','erweitert','lance','lancement','lanca'],
  channel:['digital','online','movil','mobile','app','web','api','wallet','plataforma','platform','autoservicio','self-service','banking','banca','canal','channel','financier','financial','payment','pago','tesoreria','liquidez','onboarding','kyc','erp','fund','investment','account']
});
