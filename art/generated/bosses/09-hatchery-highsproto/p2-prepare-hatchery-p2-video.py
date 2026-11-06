"""Extract complete native Hatchery P2 poses and separate the free spore shot."""
from pathlib import Path
import hashlib
import importlib.util
import json
from PIL import Image, ImageDraw
import numpy as np

base = Path(__file__).resolve().parent
root = base.parents[1]
source = base/'raw-atlases/09-hatchery-highsproto-p2-animation.mp4'
spec = importlib.util.spec_from_file_location('clip',root/'work/Sproto-Arcade/tools/extract-boss-clip.py')
clip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clip)
# Skip the overextended anticipation at6.5s: the physical barrel clips there.
# The selected anticipation6.1/charge6.3 and release7.125 are complete hardware.
times = [.4,1.1,1.8,2.5,3.4,4.1,4.5,5.5,6.1,6.3,7.125,8.5,9.3,10.,10.5,11.5]
frames, boxes, records = [], [], []
for i,t in enumerate(times):
    original = clip.extract(source,t)
    frame = original.copy()
    effect = None
    if i == 10:
        # Reviewed at4× native resolution: the complete dark muzzle outline
        # starts at sourcex81; the bright green free-flight puff is to its left.
        ImageDraw.Draw(frame).rectangle((0,0,80,frame.height-1),fill=(255,0,255,255))
        mask = Image.new('L',frame.size)
        ImageDraw.Draw(mask).rectangle((0,0,80,frame.height-1),fill=255)
        mask.save(base/'09p2-spore-flight-exclusion.png')
        effect = 'Alpha-separate free spore flight x<81; physical dark muzzle outline beginsx81 and is preserved. Source-coordinate review saved09p2-flight-hardware-boundary.png.'
    clean,box,_ = clip.matte(frame,t,.2)
    pixels = np.array(clean)
    rgb = np.array(frame)[:,:,:3].astype(int)
    r,g,b = [rgb[:,:,n] for n in range(3)]
    # Exact saturated field trapped between canopy/roof components. The real
    # lavender muzzle flash has a substantially higher green channel (>100).
    field = (np.minimum(r,b)>=225)&(g<=35)&(abs(r-b)<=45)
    enclosed_count = int(((pixels[:,:,3]>0)&field).sum())
    pixels[field,3] = 0
    clean = Image.fromarray(pixels)
    box = clean.getchannel('A').getbbox()
    frames.append(clean)
    boxes.append(box)
    records.append({'index':i,'row':i//4,'column':i%4,'timestamp':t,
                    'sourceBounds':list(box),'physicalVehicleComplete':True,
                    'enclosedExactFieldPixels':enclosed_count,
                    'effectSeparation':effect})
atlas,geo = clip.pack_frames(frames,boxes,512,12)
dest = base/'processed-phase-atlases/09-hatchery-highsproto-p2-candidate.png'
atlas.save(dest)
dest.with_suffix('.json').write_text(json.dumps({
    'schemaVersion':1,'kind':'native-video-poses-with-explicit-flight-fx-separation',
    'generationJob':'b4bdbace-3684-4c73-9a6d-f93562f632b7',
    'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'atlasSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
    'includesPilot':True,'facing':'left','samples':records,
    'selectionPolicy':'All selected physical hardware complete; discarded overextended6.5s barrel pose. Three distinct physical weapon releases; separate game projectiles supply travel.',
    'chromaPolicy':'Edge-connected key plus saturated enclosed field min(R,B)>=225,G<=35,abs(R-B)<=45; native lavender/pink flash G>100 is preserved.',
    **geo},indent=2)+'\n')
review = Image.new('RGB',atlas.size,(18,23,30))
review.paste(atlas,mask=atlas.getchannel('A'))
review.thumbnail((1536,1536),Image.Resampling.NEAREST)
review.save(base/'09p2-boss-candidate-review.png')
print(json.dumps({'output':str(dest),'bounds':geo['bounds']}))
