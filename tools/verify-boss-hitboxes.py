#!/usr/bin/env python3
"""Check hash-pinned numeric boss geometry against the actual ready sprite assets.

This is read-only. --require-complete requires all configured boss and projectile phases
to have measured geometry; the runtime activation flag is never changed.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from PIL import Image
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--require-complete',action='store_true');args=parser.parse_args();root=Path(__file__).resolve().parents[1]
data=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');require('./boss-sheets.js');const c=vm.createContext({});vm.runInContext(fs.readFileSync('sprite-hitboxes.js','utf8'),c);console.log(JSON.stringify({manifest:ArcadeBossSheets.manifest,geometry:vm.runInContext('SPRITE_HITBOXES',c)}))"],cwd=root));errors=[];pending=[];records=[]
for stage,entry in data['manifest'].items():
 for phase in range(entry.get('phaseCount',2)):
  geometry=data['geometry']['stages'].get(stage,{}).get(str(phase),{});provenance=geometry.get('provenance',{});label=f'{entry["folder"]} P{phase+1}'
  for group,hashkey in [('phases','bossSha256'),('projectiles','projectilesSha256')]:
   asset=entry[group][phase];path=root/asset['path'];kind='boss' if group=='phases' else 'projectiles';name=f'{label} {kind}';claimed=provenance.get(hashkey)
   if not asset.get('ready') or not claimed:
    pending.append(name)
    continue
   if not path.exists():errors.append(f'{name}: missing asset');continue
   actual=hashlib.sha256(path.read_bytes()).hexdigest()
   if actual!=claimed:errors.append(f'{name}: hash differs from measured geometry')
   if group=='phases':
    if provenance.get('legacyDrawOffset',[0,0])!=asset.get('legacyOffset',[0,0]):errors.append(f'{name}: legacy draw registration differs from measured geometry')
    if provenance.get('legacyDrawScale',[1,1])!=asset.get('legacyScale',[1,1]):errors.append(f'{name}: legacy draw scale differs from measured geometry')
    if not geometry.get('boss') and not geometry.get('visualBody'):errors.append(f'{name}: no body profiles or documented visual-only exception')
   else:
    profiles={**geometry.get('projectiles',{}),**geometry.get('beams',{})};raster=0
    for key,profile in profiles.items():
     if 'reference' not in profile:continue
     raster+=1
     if entry.get('phaseCount')==1:
      family=key.rsplit('@',1)[0]
      aliases={'sprotel.beer':'beer','sprotel.cocktail':'cocktail','sprotel.marlin':'blueMarlin','sprotel.disk-laser':'diskLaser','laser':'diskLaser'}
      animation=entry.get('projectileAnimations',{}).get(aliases.get(family,family))
      if not animation:errors.append(f'{name} {key}: missing native animation family');continue
      if profile.get('reference')!=animation['bounds'] or profile.get('crop')!=animation['bounds']:errors.append(f'{name} {key}: stale paged reference')
      if profile.get('core')!=animation.get('core'):errors.append(f'{name} {key}: stale sixteen-frame core')
      if profile.get('facing')!='left' or profile.get('kind')!='contain':errors.append(f'{name} {key}: paged transform differs from renderer')
      core=profile.get('core',[])
      if len(core)!=4 or min(core[2:])<=0 or min(core[:2])<0 or core[0]+core[2]>512 or core[1]+core[3]>512:errors.append(f'{name} {key}: invalid native pixel core');continue
      x,y,w,h=core
      if len(animation.get('pages',[]))!=4:errors.append(f'{name} {key}: expected four 2x2 pages');continue
      for page in animation['pages']:
       with Image.open(root/page['path']) as image:
        if image.size!=(1024,1024) or image.mode!='RGBA':errors.append(f'{name} {key}: invalid 2x2 page');continue
        if hashlib.sha256((root/page['path']).read_bytes()).hexdigest()[:16]!=page['version']:errors.append(f'{name} {key}: stale page pin')
        for cell in range(4):
         cx,cy=cell%2*512,cell//2*512
         if image.getchannel('A').crop((cx+x,cy+y,cx+x+w,cy+y+h)).getextrema()!=(255,255):errors.append(f'{name} {key}: core leaves solid pixels in page {page["path"]} cell {cell}')
      continue
     if profile['reference']!=asset['bounds']:errors.append(f'{name} {key}: stale common reference')
     try:row=int(key.rsplit('@',1)[1])
     except (ValueError,IndexError):errors.append(f'{name} {key}: missing immutable row key');continue
     if row not in range(4):errors.append(f'{name} {key}: invalid row');continue
     if profile['crop']!=asset['rowBounds'][row]:errors.append(f'{name} {key}: stale row crop')
     if profile.get('facing')!=asset.get('facing',entry.get('projectileFacing','left')):errors.append(f'{name} {key}: stale facing')
     core=profile.get('core',[])
     if len(core)!=4 or min(core[2:])<=0 or min(core[:2])<0 or core[0]+core[2]>512 or core[1]+core[3]>512:errors.append(f'{name} {key}: invalid native pixel core')
    if not raster:errors.append(f'{name}: no raster projectile profiles')
   records.append({'phase':phase+1,'stage':int(stage),'kind':kind,'sha256':actual})
if args.require_complete and pending:errors.extend('Pending geometry: '+x for x in pending)
print(json.dumps({'enabled':data['geometry']['enabled'],'verifiedAssetGeometryPairs':len(records),'expectedPairs':sum(e.get('phaseCount',2)*2 for e in data['manifest'].values()),'pending':pending,'errors':errors,'assets':records},indent=2));raise SystemExit(1 if errors else 0)
