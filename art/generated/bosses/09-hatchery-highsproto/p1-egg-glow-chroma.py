"""Remove magenta backing mixed into native egg glow; never repaint machine/pilot."""
from pathlib import Path
import json,hashlib,math
import numpy as np
from PIL import Image
base=Path(__file__).resolve().parent
path=base/'candidate-boss-atlases/09-hatchery-highsproto-p1.png'
meta=json.loads(path.with_suffix('.json').read_text())
im=Image.open(path).convert('RGBA'); before=np.array(im); a=before.copy(); mask=np.zeros(a.shape[:2],dtype=np.uint8)
x0,y0,x1,y1=meta['unionCrop'];dw,dh=meta['destinationSize'];ox,oy=meta['offset']
for index in (5,6):
 row,col=divmod(index,4)
 for cy in range(512):
  sy=y0+(cy-oy+.5)*(y1-y0)/dh
  native_y=(sy-20)/.9
  if not 330<=native_y<=540:continue
  for cx in range(512):
   sx=x0+(cx-ox+.5)*(x1-x0)/dw;native_x=(sx-20)/.9
   if not 70<=native_x<=305:continue
   yy,xx=row*512+cy,col*512+cx
   r,g,b,alpha=[int(v) for v in before[yy,xx]]
   if alpha and min(r,b)>145 and abs(r-b)<65 and g<220 and min(r,b)-g>35:
    opacity=max(.02,min(1,g/240))
    # Solve observed RGB = alpha*foreground + (1-alpha)*magenta.
    a[yy,xx]=[round(max(0,min(255,(r-255*(1-opacity))/opacity))),round(min(255,g/opacity)),round(max(0,min(255,(b-255*(1-opacity))/opacity))),round(alpha*opacity)]
    mask[yy,xx]=255
if not mask.any():raise RuntimeError('Expected reviewed glow pixels absent')
# All other pixels, including payload, claw, hardware and pilot, are byte exact.
assert np.array_equal(a[mask==0],before[mask==0])
Image.fromarray(mask).save(base/'09p1-egg-glow-chroma-mask.png')
Image.fromarray(a).save(path,compress_level=9)
meta['eggGlowChromaUnmix']={'inputAtlasSha256':hashlib.sha256(im.tobytes()).hexdigest(),'maskSha256':hashlib.sha256(mask.tobytes()).hexdigest(),'pixels':int((mask>0).sum()),'nativeRoi':[70,330,305,540],'frames':[5,6],'policy':'Magenta backing unmix only within native amber egg glow. Saturated gold payload, claw, pilot and all pixels outside explicit mask byte exact. No invented pose or hardware repair.'}
meta['atlasSha256']=hashlib.sha256(path.read_bytes()).hexdigest()
path.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
bg=Image.new('RGBA',im.size,(16,22,31,255));bg.alpha_composite(Image.fromarray(a));bg.convert('RGB').resize((1536,1536)).save(path.with_name(path.stem+'-black.jpg'))
print(meta['eggGlowChromaUnmix'])
