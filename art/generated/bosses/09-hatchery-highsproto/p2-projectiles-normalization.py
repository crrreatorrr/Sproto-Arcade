from pathlib import Path
from PIL import Image,ImageOps
import json,hashlib
b=Path(__file__).resolve().parent;src=b/'processed-phase-projectiles/09-hatchery-highsproto-p2-projectiles-clean.png';im=Image.open(src).convert('RGBA');out=Image.new('RGBA',im.size);meta=json.loads(src.with_suffix('.json').read_text());boxes=[];rows=[]
for i in range(16):
 row,col=divmod(i,4);f=im.crop((col*512,row*512,(col+1)*512,(row+1)*512));f=ImageOps.mirror(f) if row in(1,3) else f;out.paste(f,(col*512,row*512));box=f.getchannel('A').getbbox();assert box and min(box[:2])>=10 and max(box[2:])<=502;boxes.append(box);meta['frames'][i]['cellBounds']=list(box)
for r in range(4):
 q=boxes[r*4:r*4+4];x=min(z[0] for z in q);y=min(z[1] for z in q);rows.append([x,y,max(z[2] for z in q)-x,max(z[3] for z in q)-y])
x=min(z[0] for z in boxes);y=min(z[1] for z in boxes);bounds=[x,y,max(z[2] for z in boxes)-x,max(z[3] for z in boxes)-y];dest=b/'processed-phase-projectiles/09-hatchery-highsproto-p2-projectiles-final.png';out.save(dest,compress_level=9);meta.update(sourceBeforeFacing=str(src),sourceBeforeFacingSha256=hashlib.sha256(src.read_bytes()).hexdigest(),facing='left',facingOperation='Seed dartB and heavy openingamberbroodcapsuleD originallyfrontRIGHT are mirroredLEFT. TumbledeggA is nondirectional; convexshellC alreadyLEFT. No RGB repaint/pose synthesis',bounds=bounds,rowBounds=rows,atlasSha256=hashlib.sha256(dest.read_bytes()).hexdigest(),outputSha256=hashlib.sha256(dest.read_bytes()).hexdigest(),job_id='b5d82610-268d-4599-bc5b-5deaa1dcc8fb',billing='Higgsfield Unlimited verified2K1:1',productionEnabled=False);dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',out.size,color);bg.paste(out,mask=out.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'09p2-projectiles-final-{name}-review.png')
print(json.dumps({'bounds':bounds,'rowBounds':rows,'facing':'left','sha256':meta['atlasSha256']}))
