"""Pack unchanged local model-render pixels, preserving alpha and registration."""
import sys, os, json, hashlib, shutil
from PIL import Image

ROOT=sys.argv[sys.argv.index('--')+1]
character=sys.argv[sys.argv.index('--character')+1] if '--character' in sys.argv else 'bouncy'
view=int(sys.argv[sys.argv.index('--view')+1]) if '--view' in sys.argv else 0
source=os.path.join(ROOT,'source-art/arcade/sound-racer-3d/recovery',character,'view-'+str(view),'frames')
record=json.load(open(os.path.join(source,'registration.json')))
recipe=os.path.join(ROOT,'artwork/games/sound-racer/render_driver_recovery.py')
retained=os.path.join(os.path.dirname(source),'render-driver-source-recipe-v1.py')
if hashlib.sha256(open(recipe,'rb').read()).hexdigest()==record['recipeSha256']:shutil.copy2(recipe,retained)
if not os.path.exists(retained) or hashlib.sha256(open(retained,'rb').read()).hexdigest()!=record['recipeSha256']:raise ValueError('Exact render source recipe was not retained')
record['sourceRecipe']=os.path.relpath(retained,ROOT)
sheet=Image.new('RGBA',(1024,1536))
for frame in record['frames']:
    image=Image.open(os.path.join(source,frame['source'])).convert('RGBA')
    if image.size!=(256,256):raise ValueError('Unregistered source dimensions')
    row=record['states'].index(frame['state']);column=record['phases'].index(frame['phase'])
    sheet.paste(image,(column*256,row*256))
    frame['cell']=[column*256,row*256,256,256]
    alpha=image.getchannel('A');frame['opaqueBounds']=alpha.getbbox()
    if frame['opaqueBounds'] is None:raise ValueError('Empty actor frame')
png=os.path.join(os.path.dirname(source),'view-'+str(view)+'-sheet-v1.png')
sheet.save(png)
out=os.path.join(ROOT,'public/game-assets/sound-racer/recovery',character)
os.makedirs(out,exist_ok=True)
runtime=os.path.join(out,'view-'+str(view)+'-v1.webp')
sheet.save(runtime,'WEBP',quality=88,method=6,exact=True)
decoded=Image.open(runtime).convert('RGBA')
if decoded.getchannel('A').getextrema()!=(0,255):raise ValueError('True alpha lost')
record.update({'sourceSheet':os.path.relpath(png,ROOT),'sourceSheetSha256':hashlib.sha256(open(png,'rb').read()).hexdigest(),
 'runtime':'/'+os.path.relpath(runtime,os.path.join(ROOT,'public')),'runtimeBytes':os.path.getsize(runtime),
 'runtimeSha256':hashlib.sha256(open(runtime,'rb').read()).hexdigest(),'decodedBytes':1024*1536*4,
 'packingRecipe':'artwork/games/sound-racer/pack_driver_recovery.py','packingRecipeSha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest(),
 'status':'One complete original model-derived directional sheet; direct pixel/runtime failure review pending'})
manifest=os.path.join(os.path.dirname(source),'view-'+str(view)+'-sheet-v1.json')
open(manifest,'w').write(json.dumps(record,indent=2)+'\n')
print(json.dumps({key:record[key] for key in ['runtime','runtimeBytes','runtimeSha256','decodedBytes','modelSha256','sourceSheet']}))

# Runtime metadata contains only registered original-art frame geometry and hashes.
public_record={key:record[key] for key in ['world','character','view','azimuth','cell','viewSheet','phases','states','frames','runtime','runtimeSha256','runtimeBytes','modelSha256','decodedBytes']}
public_record['kind']='driver';public_record['pixelsPerUnit']=record.get('pixelsPerUnit',256/3.28)
open(os.path.join(out,'view-'+str(view)+'-v1.json'),'w').write(json.dumps(public_record,indent=2)+'\n')
