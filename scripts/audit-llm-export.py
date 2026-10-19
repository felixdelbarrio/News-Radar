"""Audit exported input ZIPs without executing article text or embedded instructions."""
import hashlib,io,json,sys,zipfile
from pathlib import Path

def compact(value):
    return json.dumps(value,ensure_ascii=False,separators=(',',':'))

seen=set();reports=[];revisions=set();contexts=set();errors=[]
def audit(source,label,downloaded=True):
    ids=[];excerpts=0;google_urls=0;batches=0;shared=None;manifest=None;proposals=0
    with zipfile.ZipFile(source) as archive:
        if archive.testzip(): errors.append(f'{label}: CRC failure')
        names=archive.namelist()
        if len(names)!=len(set(names)):errors.append(f'{label}: duplicate ZIP entry')
        if 'context.json' in names:shared=json.loads(archive.read('context.json'))
        if 'manifest.json' in names:manifest=json.loads(archive.read('manifest.json'))
        if 'proposals.json' in names:proposals=len(json.loads(archive.read('proposals.json'))['proposals'])
        for name in names:
            if name.endswith('.zip'):
                audit(io.BytesIO(archive.read(name)),label+'/'+name,False)
                continue
            if not name.endswith('.json') or not (name.startswith('batch-') or name[0].isdigit()):continue
            batch=json.loads(archive.read(name));context=shared or batch;batches+=1
            if not manifest or context['manifest']!=manifest:errors.append(f'{label}/{name}: manifest mismatch')
            revisions.add(compact(context['manifest']))
            contexts.add(hashlib.sha256(compact({k:context[k] for k in ['functionalCatalog','taxonomy','resultSchema']}).encode()).hexdigest())
            if not 1<=len(batch['articles'])<=25:errors.append(f'{label}/{name}: batch size')
            if shared and batch['sourceRevision']!=manifest['sourceRevision']:errors.append(f'{label}/{name}: revision mismatch')
            for article in batch['articles']:
                ids.append(article['id']);excerpts+=bool(article['extracto']);google_urls+='news.google.' in article['url']
                content={k:article[k] for k in ['id','titulo','extracto','entidad','pais','idioma','fecha','fuente','url']}
                if hashlib.sha256(compact(content).encode()).hexdigest()!=article['contentHash']:errors.append(f'{label}/{name}: content hash mismatch')
                if article['previousResultHash'] and len(article['previousResultHash'])!=64:errors.append(f'{label}/{name}: invalid prior result hash')
    duplicates=len(ids)-len(set(ids));overlap=len(seen.intersection(ids));seen.update(ids)
    if duplicates or overlap:errors.append(f'{label}: duplicate article IDs')
    reports.append(dict(file=label,downloaded=downloaded,bytes=Path(source).stat().st_size if downloaded else len(source.getbuffer()),files=len(names),batches=batches,articles=len(ids),excerpts=excerpts,googleNewsUrls=google_urls,proposals=proposals,duplicates=duplicates,overlap=overlap))
for path in sorted(map(Path,sys.argv[1:])):audit(path,path.name)
print(json.dumps(dict(kind='input packages; no LLM results or semantic-quality claim',archives=reports,totals=dict(bytes=sum(r['bytes'] for r in reports if r['downloaded']),articles=sum(r['articles'] for r in reports),uniqueArticles=len(seen),excerpts=sum(r['excerpts'] for r in reports),googleNewsUrls=sum(r['googleNewsUrls'] for r in reports),contexts=len(contexts),revisions=len(revisions)),errors=errors),ensure_ascii=False,indent=2))
if errors:sys.exit(1)
