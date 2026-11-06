from pathlib import Path
from PIL import Image
import json,hashlib,importlib.util
b=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('pack',b.parent/'Sproto-Arcade/tools/extract-boss-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
paths=[b/'sheriff-p1-native-ABC'/f'frame-{i:02d}.png' for i in range(12)]+[b/'sheriff-p1-native-heavy'/f'frame-{i:02d}.png' for i in range(4)]
frames=[Image.open(p).convert('RGBA') for p in paths];assert all(f.size==(512,512) for f in frames);assert len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})==16,'All16 actual generated poses must differ';boxes=[f.getchannel('A').getbbox() for f in frames];assert all(q and min(q[:2])>1 and max(q[2:])<511 for q in boxes)
atlas,meta=m.pack_frames(frames,boxes,512,12,('attack-a','attack-b','attack-c','heavy'));dest=b/'processed-phase-projectiles/12-codebreak-sproto3106-p1-projectiles-final.png';atlas.save(dest,compress_level=9)
meta.update(kind='sixteen-genuine-source-projectile-poses',facing='left',facingOperation='A brass round and B red/blue capsule nativeLEFT; C star pulse non-directional; heavy orientation recorded by correction conversion.',job_id='8b9bc082-4027-4a32-95f6-207f764247d3',heavyJobId='82ce51df-1643-41c4-91a0-06181be67487',billing='Website Unlimited verified forbothsourcejobs',sourceFrames=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'job_id':'8b9bc082-4027-4a32-95f6-207f764247d3' if i<12 else '82ce51df-1643-41c4-91a0-06181be67487'} for i,p in enumerate(paths)],rejectedSource='Original heavy row genuinely cut exhaust and omittedentirely. Temporary repeated converter-validation cells NEVERused in final16.',alphaRecoveryProvenance=['12p1-ABC-grid-removal.json','sheriff-p1-projectile-core-profile.json','sheriff-p1-heavy-matte-metadata.json'],atlasSha256=hashlib.sha256(dest.read_bytes()).hexdigest(),physicalRepair=False,productionEnabled=False)
dest.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,color in [('black',(8,12,18)),('light',(230,235,240))]:
 bg=Image.new('RGB',atlas.size,color);bg.paste(atlas,mask=atlas.getchannel('A'));bg.resize((1280,1280),Image.Resampling.NEAREST).save(b/f'12p1-projectiles-final-{name}-review.png')
print(json.dumps({'bounds':meta['bounds'],'rowBounds':meta['rowBounds'],'sha256':meta['atlasSha256']}))
