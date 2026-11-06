"""Pack real Crown P2 poses; separate flight effects from complete hardware."""
from pathlib import Path
import hashlib
import importlib.util
import json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

base = Path(__file__).resolve().parent
root = base.parents[1]
source = base/'raw-atlases/08-crown-alpha777-p2-animation.mp4'
spec = importlib.util.spec_from_file_location('clip',root/'work/Sproto-Arcade/tools/extract-boss-clip.py')
clip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clip)
times = [.4,1.1,1.8,2.5,3.4,3.8,4.041667,4.5,6.1,6.5,7.,7.5,9.2,9.7,10.25,11.5]
frames, boxes, records = [], [], []
# This reference supplies only a hardware protection alpha mask, never RGB.
prefire, _, _ = clip.matte(clip.extract(source,6.9),6.9,.2)
protection = prefire.getchannel('A').filter(ImageFilter.MaxFilter(7))
protection.save(base/'08p2-crown-prefire-hardware-protection.png')
for i,t in enumerate(times):
    original = clip.extract(source,t)
    rgba = np.array(original)
    mask = np.zeros(rgba.shape[:2],dtype=bool)
    description = None
    if i == 6:
        # Gold flight burst has cleared the complete lance tip at x162; the
        # entire x0..149 region is empty hardware space at this release pose.
        mask[:,:150] = True
        description = 'Separate detached traveling lance shot in x<150; complete recoiling physical cannon starts at x162. Game projectile atlas supplies flight.'
    if i == 10:
        yy,xx = np.indices(mask.shape)
        roi = (xx>=380)&(xx<710)&(yy<150)
        local_burst = (xx-550)**2+(yy-70)**2 <= 55**2
        mask = roi & ~local_burst & (np.array(protection)==0)
        description = 'Separate outer crown-mortar firing rays beyond local55px muzzle radius; protect full prefire physical hardware alpha expanded3px. No source RGB copied or hardware reconstructed.'
    if description:
        rgba[mask] = [255,0,255,255]
        Image.fromarray(mask.astype('uint8')*255).save(base/f'08p2-flight-separation-{i}.png')
    frame, _, _ = clip.matte(Image.fromarray(rgba),t,.2)
    arr = np.array(frame)
    r,g,b = [rgba[:,:,n].astype(int) for n in range(3)]
    # Independent palette review: this olive/brass/red/blue phase has no
    # magenta pigment. Remove matching field trapped inside the raised coil.
    enclosed = (np.minimum(r,b)>=180)&(np.minimum(r,b)-g>=95)&(abs(r-b)<=65)
    arr[enclosed,3] = 0
    frame = Image.fromarray(arr)
    box = frame.getchannel('A').getbbox()
    assert box and min(box[:2])>1 and max(box[2:])<959, (i,t,box)
    frames.append(frame)
    boxes.append(box)
    records.append({'index':i,'row':i//4,'column':i%4,'timestamp':t,
                    'sourceBounds':list(box),'effectSeparation':description,
                    'exclusionPixels':int(mask.sum()),'physicalVehicleComplete':True})
atlas, geo = clip.pack_frames(frames,boxes,512,12)
dest = base/'processed-phase-atlases/08-crown-alpha777-p2-candidate.png'
atlas.save(dest)
meta = {'schemaVersion':1,'kind':'native-video-poses-with-explicit-flight-fx-separation',
        'generationJob':'34943f31-8fa8-4694-b719-23b073ede1ad',
        'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'atlasSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
        'includesPilot':True,'samples':records,'facing':'left',
        'enclosedKeyPolicy':'Palette reviewed: no native magenta; field-only alpha removal inside coil gaps.',
        'releaseRetiming':'A4.041667s is genuine cannon recoil/shot-release; detached shot separated. B7s and C10.25s retain native local firing bursts.',**geo}
dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
review = Image.new('RGB',atlas.size,(18,23,30))
review.paste(atlas,mask=atlas.getchannel('A'))
review.thumbnail((1536,1536),Image.Resampling.NEAREST)
review.save(base/'08p2-boss-candidate-review.png')
print(json.dumps({'output':str(dest),'bounds':geo['bounds']}))
