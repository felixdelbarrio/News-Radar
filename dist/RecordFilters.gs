function recordText(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();}
function recordQuery(input={},fields=[]){
  const query={};
  for(const key of ['search','from','to',...fields]){const value=String(input[key]??'').trim();if(value.length>160)throw Error('Filtro demasiado largo.');if(value)query[key]=value;}
  for(const key of ['from','to'])if(query[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(query[key])||!Number.isFinite(Date.parse(query[key]))||new Date(query[key]).toISOString().slice(0,10)!==query[key]))throw Error('Fecha no válida.');
  if(query.from&&query.to&&query.from>query.to)throw Error('La fecha desde debe ser anterior o igual a la fecha hasta.');
  query.page=Math.max(0,Math.floor(Number(input.page)||0));return query;
}
let recordDateFormatter;
function filterRecords(rows,input,fields,searchFields,dateKey='fecha',timezone='UTC'){
  const query=recordQuery(input,fields),term=recordText(query.search);

  return rows.filter(row=>{
    if(fields.some(key=>query[key]&&String(row[key])!==query[key]))return false;
    if(term&&!recordText(searchFields.map(key=>row[key]??'').join(' ')).includes(term))return false;
    if(!query.from&&!query.to)return true;
    const date=new Date(row[dateKey]);if(!Number.isFinite(date.getTime()))return false;
    const day=recordDay(date,timezone);
    return (!query.from||day>=query.from)&&(!query.to||day<=query.to);
  });
}
function recordOptions(rows,fields){return Object.fromEntries(fields.map(key=>[key,[...new Set(rows.map(row=>String(row[key]??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))]));}
function recordPage(rows,input={},pageSize=30){const page=Math.min(Math.max(0,Math.floor(Number(input.page)||0)),Math.max(0,Math.ceil(rows.length/pageSize)-1));return {items:rows.slice(page*pageSize,(page+1)*pageSize),total:rows.length,page,pageSize};}

function recordDay(value,timezone='UTC'){
  if(recordDateFormatter?.timezone!==timezone)recordDateFormatter={timezone,formatter:new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'})};
  const parts=Object.fromEntries(recordDateFormatter.formatter.formatToParts(new Date(value)).map(part=>[part.type,part.value]));return parts.year+'-'+parts.month+'-'+parts.day;
}
