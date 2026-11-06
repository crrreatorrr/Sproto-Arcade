"""Pack native Sheriff P2 poses, excluding only reviewed projectile flight."""
from pathlib import Path
import hashlib
import importlib.util
import json
from PIL import Image, ImageFilter
import numpy as np

base = Path(__file__).resolve().parent
root = base.parents[1]
source = base/'raw-atlases/12-codebreak-sproto3106-p2-animation.mp4'
spec = importlib.util.spec_from_file_location('clip',root/'work/Sproto-Arcade/tools/extract-boss-clip.py')
clip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(clip)
times = [.4,1.1,1.8,2.5,3.4,4.5,5.,5.8,6.1,7.,7.5,8.5,9.1,9.5,10.,11.5]
frames,boxes,records = [],[],[]
for i,t in enumerate(times):
    raw = clip.extract(source,t)
    pixels = np.array(raw)
    yy,xx = np.indices(pixels.shape[:2])
    exclude = np.zeros(pixels.shape[:2],dtype=bool)
    rule = None
    if i == 6:
        # At this exact recoil pose the complete brass muzzle starts atx107.
        # x<105 is flight only. Keep its small native muzzle-side ignition arc.
        exclude = (xx<105)&((xx-92)**2+(yy-620)**2>40**2)
        rule = 'Free brass shot x<105 separated; complete recoiling metal barrel beginsx107. Retain native40px muzzle-side ignition arc at[92,620].'
    if i == 10:
        # All physical badge/cockpit hardware starts atx220 in this source ROI.
        roi = (xx<220)&(yy>=280)&(yy<510)
        exclude = roi & ((xx-250)**2+(yy-390)**2>75**2)
        rule = 'Separate left-traveling badge beam in reviewed empty x<220,y280..509. Preserve both physical badges and native75px local star ignition around[250,390].'
    if i == 14:
        # Reviewed open space between both solid gray claw prongs. No physical
        # claw pixels occur in x<230,y155..239; the local jet is retained.
        roi = (xx<275)&(yy>=155)&(yy<240)
        exclude = roi & ((xx-280)**2+(yy-195)**2>50**2)
        rule = 'Separate long cyan claw-beam flight through the reviewed open gap between intact prongs; retain native50px ignition at[280,195] and full side-arm local jet.'
    if rule:
        pixels[exclude] = [255,0,255,255]
        Image.fromarray(exclude.astype('uint8')*255).save(base/f'12p2-flight-exclusion-{i}.png')
    clean,box,_ = clip.matte(Image.fromarray(pixels),t,.2)
    alpha_pixels = np.array(clean)
    r,g,b = [pixels[:,:,n].astype(int) for n in range(3)]
    # This phase has red/cream/gold/blue/green hardware and no hotmagenta
    # pigment. The raised claw encloses real backdrop between its arm/prongs.
    enclosed = (np.minimum(r,b)>=225)&(g<=35)&(abs(r-b)<=45)
    enclosed_visible = (alpha_pixels[:,:,3]>0)&enclosed
    enclosed_count = int(enclosed_visible.sum())
    fringe = np.array(Image.fromarray(enclosed_visible.astype('uint8')*255).filter(ImageFilter.MaxFilter(7)))>0
    unmix = fringe&~enclosed&(alpha_pixels[:,:,3]>0)&(np.minimum(r,b)>60)&(np.minimum(r,b)-g>45)&(abs(r-b)<=65)
    # Recover only mixed field along the newly opened claw-hole boundary.
    # Gray/blue steel, asymmetric red paint and the pilot fail this predicate.
    alpha = np.clip(np.maximum(g,255-np.minimum(r,b))/255.,.001,1)
    foreground = np.clip((pixels[:,:,:3].astype(float)-(1-alpha[:,:,None])*np.array([255.,0.,255.]))/alpha[:,:,None],0,255).round().astype('uint8')
    alpha_pixels[:,:,:3][unmix] = foreground[unmix]
    alpha_pixels[:,:,3][unmix] = np.round(alpha[unmix]*alpha_pixels[:,:,3][unmix]).astype('uint8')
    alpha_pixels[enclosed,3] = 0
    clean = Image.fromarray(alpha_pixels)
    box = clean.getchannel('A').getbbox()
    frames.append(clean)
    boxes.append(box)
    records.append({'index':i,'row':i//4,'column':i%4,'timestamp':t,
                    'sourceBounds':list(box),'effectSeparation':rule,
                    'enclosedExactFieldPixels':enclosed_count,
                    'enclosedFieldFringeUnmixPixels':int(unmix.sum()),
                    'physicalVehicleComplete':True})
atlas,geo = clip.pack_frames(frames,boxes,512,12)
dest = base/'processed-phase-atlases/12-codebreak-sproto3106-p2-candidate.png'
atlas.save(dest)
dest.with_suffix('.json').write_text(json.dumps({
    'schemaVersion':1,'kind':'native-video-poses-with-explicit-flight-fx-separation',
    'generationJob':'f177f802-0787-467d-9723-45fb9f7070c1',
    'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'atlasSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
    'includesPilot':True,'facing':'left','samples':records,
    'model':'Higgsfield Seedance2.5 website Unlimited720p',
    'weaponMechanisms':['rotary brass cannon','twin shoulder sheriff-badge pulse launchers','overhead claw stun-lance emitter with auxiliary side-arm ion port'],
    'physicalPolicy':'All selected complete hardware and native pilot unchanged outside explicit empty-space flight exclusions. No body repair or RGB painting.',
    **geo},indent=2)+'\n')
review = Image.new('RGB',atlas.size,(18,23,30))
review.paste(atlas,mask=atlas.getchannel('A'))
review.thumbnail((1536,1536),Image.Resampling.NEAREST)
review.save(base/'12p2-boss-candidate-review.png')
print(json.dumps({'output':str(dest),'bounds':geo['bounds']}))
