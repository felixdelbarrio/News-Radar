const RADAR = Object.freeze({
  version:'1.6.0',
  sheets:{
    Configuracion:['clave','valor'],
    Suscripciones:['id','correo','nombre','filtros','periodicidad','activa','actualizada','idioma'],
    NewsletterEnvios:['id','suscripcion','correo','desde','hasta','estado','fecha','detalle','contenido'],
    Noticias:['id','fecha','pais','medio','entidad','titular','extracto','tema','url','capturada','fuente','idioma'],
    Auditoria:['ejecucion','fecha','fuente','url','resultado','motivo'],
    Ejecuciones:['id','inicio','fin','estado','fuentes','evaluadas','nuevas','errores'],
    Telemetria:['fecha','operacion','duracion_ms','estado','detalle'],
    Adopcion:['fecha','correo','sesion','evento','vista','duracion_ms'],
    Recargas:['id','tipo','desde','hasta','inicio','fin','estado','total','procesadas','pendientes','omitidas','fallidas','nuevas','actualizada','pausa'],
    Traducciones:['clave','idioma','titular','extracto','fecha'],
    Recopilacion:['ciclo','fuente','url','estado','intentos','actualizada','evaluadas','nuevas','error','prioridad']
  }
});
