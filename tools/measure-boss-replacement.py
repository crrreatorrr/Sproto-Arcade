#!/usr/bin/env python3
"""Measure candidate P1 replacement for stable stage4 or5; never enable art.

--stage4: Ranch receives existing Collector weapon frames + approved Halloween cab.
--stage5: new Collector body with accepted P2 ammunition may be measured later.
Reads the NEW candidate PNGs and their prepared metadata. Publication, if explicitly
requested after review, changes only the selected numeric stage/phase; it requires
root to install matching manifest registrations/PNG hashes first. No art is copied
or activated by this tool.
"""
import argparse,copy,hashlib,importlib.util,json,subprocess
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('core_measure',Path(__file__).with_name('measure-redkev-geometry.py'));M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
SPECS={4:{'box':[3758,400,390,220],'target':'ranch.linkage','base':[3980,548,85,50]},5:{'box':[4650,260,400,340],'target':'neon.claw-drive','base':[4800,548,100,52]}}
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def hash_value(value):return hashlib.sha256(canonical(value)).hexdigest()
def load_data(profile=None):
 script="const fs=require('fs'),vm=require('vm');require('./boss-sheets.js');const c=vm.createContext({});vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);console.log(JSON.stringify({manifest:ArcadeBossSheets.manifest,geometry:vm.runInContext('SPRITE_HITBOXES.stages',c)}));"
 return json.loads(subprocess.check_output(['node','-e',script,str(profile or ROOT/'sprite-hitboxes.js')],cwd=ROOT))
def reviewed_ammo(data,sha):
 for stage,phases in data['geometry'].items():
  for phase,g in phases.items():
   p=g.get('provenance',{})
   if p.get('projectilesSha256')==sha and p.get('projectileCorePixels'):
    return {'stage':int(stage),'phase':int(phase),'cores':p['projectileCorePixels'],'sha256':sha,'status':p.get('projectileCoreStatus')}
 return None

def measure(stage,boss_path,ammo_path,choices,data,out,proof,prefix):
 if stage not in SPECS:raise ValueError('Only stable stage4/5 P1 replacements are authorized')
 old=data['geometry'][str(stage)]['0'];boss,bp,_,C,rows=M.load_atlas({'path':str(boss_path.resolve())});ammo,ap,meta,PC,prows=M.load_atlas({'path':str(ammo_path.resolve())})
 hashes={'bossSha256':M.sha(bp),'projectilesSha256':M.sha(ap)}
 facing=choices.get('facing',meta.get('facing','left'))
 if facing not in ['left','right'] or meta.get('facing',facing)!=facing:raise ValueError('Projectile facing must match actual prepared atlas metadata')
 if choices.get('assetHashes')!=hashes:raise ValueError('Choices must pin current candidate boss/projectile hashes')
 if choices.get('expectedPreviousProfileSha256')!=hash_value(old):raise ValueError('Previous selected-phase profile changed since choices were prepared')
 body=M.rect(choices['body']);target=M.rect(choices['target']);cores=[M.rect(x) for x in choices['projectileCores']]
 if len(cores)!=4:raise ValueError('Four actual projectile-row cores are required')
 for label,K in [('body',body),('target',target)]:
  if not M.inside(K,C):raise ValueError(label+' must lie inside the actual candidate common crop')
  if min(M.coverage(boss,K))<.5:raise ValueError(label+' must have >=50% opaque coverage in every actual frame')
 offset=choices['legacyOffset'];scale=choices['legacyScale']
 if len(offset)!=2 or len(scale)!=2 or not all(M.math.isfinite(x) for x in offset+scale) or min(scale)<=0:raise ValueError('Invalid proposed legacy registration')
 B=[-190+380*(1-scale[0])/2+offset[0],-510.4+498.4*(1-scale[1])+offset[1],380*scale[0],498.4*scale[1]];E=M.project(C,body,B)
 spec=copy.deepcopy(SPECS[stage]);modern_box=choices.get('modernBox',spec['box'])
 if not isinstance(modern_box,list) or len(modern_box)!=4 or not all(M.math.isfinite(v) for v in modern_box) or min(modern_box[2:])<=0:raise ValueError('Invalid candidate modernBox')
 if stage==5 and abs(modern_box[1]+modern_box[3]-600)>1e-9:raise ValueError('Collector P1 drawing must retain the approved bottom600 baseline')
 T=M.project(C,target,modern_box);base=spec['base'];aim=[base[0]+base[2]/2,base[1]+base[3]/2]
 if not(T[0]<=aim[0]<=T[0]+T[2] and T[1]<=aim[1]<=T[1]+T[3]):raise ValueError(f'Authored aiming center{aim} misses candidate target world core{T}; review draw placement without changing aim')
 reuse=reviewed_ammo(data,hashes['projectilesSha256']);reused=bool(reuse and reuse['cores']==cores);minimum=200 if reused else 255
 for row,K in enumerate(cores):
  if not M.inside(K,prows[row]):raise ValueError('Projectile core exceeds actual new row crop')
  for cell in M.cells(ammo,[row]):
   if cell.crop((K[0],K[1],K[0]+K[2],K[1]+K[3])).getchannel('A').getextrema()[0]<minimum:raise ValueError(f'Projectile row{row} fails alpha>={minimum} in a real frame')
 g={'provenance':{**hashes,'status':'source-hashed-replacement-root-reviewed' if choices.get('reviewed') else 'candidate-awaiting-root-numeric-review','bodyCorePixels':body,'logicalTargetCorePixels':target,'legacyDrawOffset':offset,'legacyDrawScale':scale,'projectileCorePixels':cores,'projectileCoreStatus':'reused-exact-hash-reviewed-pixels' if reused else 'new-four-frame-opaque-core-measured','projectileCoreMinimumAlpha':minimum,'reviewedAmmoSource':reuse if reused else None},'targets':{spec['target']:{'rect':M.normalized(T,base)}},'boss':copy.deepcopy(old.get('boss',{})),'projectiles':{},'beams':{}}
 g['boss'].update(damage={'rect':M.normalized(E,[-147,-510.4,294,498.4])},contact={'rect':M.normalized(E,[-205,-484,410,484])})
 preserved=[]
 for group in ['projectiles','beams']:
  for key,value in old.get(group,{}).items():
   if 'reference' not in value:
    reason=choices.get('preserveAuthoredRules',{}).get(group+'/'+key)
    if not reason:raise ValueError('Non-raster rule requires explicit unchanged-authored-mechanic reason: '+group+'/'+key)
    g[group][key]=copy.deepcopy(value);preserved.append({'key':group+'/'+key,'reason':reason});continue
   row=int(key.rsplit('@',1)[1]);g[group][key]={**{k:copy.deepcopy(v) for k,v in value.items() if k not in ['reference','crop','core','rect','facing']},'reference':PC,'crop':prows[row],'core':cores[row],'facing':facing}
 checks={name:{'point':[0,y],'insideDamageBody':E[0]<=0<=E[0]+E[2] and E[1]<=y<=E[1]+E[3]} for name,y in [('steeringAim',-175),('weakHitLine',-222),('groundShotLine',-88)]}
 D=M.project(C,C,B)
 for record in checks.values():
  x,y=record['point'];point=[C[0]+(x-D[0])*C[2]/D[2],C[1]+(y-D[1])*C[3]/D[3]];px,py=[M.jsround(v) for v in point]
  alphas=[boss.getpixel((c*512+px,r*512+py))[3] if 0<=px<512 and 0<=py<512 else 0 for r in range(4) for c in range(4)]
  neighborhood=[boss.crop((c*512+px-2,r*512+py-2,c*512+px+3,r*512+py+3)).getchannel('A').getextrema()[0] if 2<=px<510 and 2<=py<510 else 0 for r in range(4) for c in range(4)]
  record.update(sourcePixelPoint=point,nearestPixelAlphaByFrame=alphas,opaqueInAllFrames=min(alphas)>=128,neighborhood5x5MinAlphaByFrame=neighborhood,all5x5OpaqueFrames=min(neighborhood)>=200)
 report={'stage':stage,'phase':0,'status':'numeric-candidate-not-published','assets':hashes,'authoredDefaultModernDrawBox':spec['box'],'candidateModernDrawBox':modern_box,'unchangedAuthoredTargetBase':base,'unchangedAimCenter':aim,'worldTargetCore':T,'worldLegacyBodyRelative':E,'legacyAnchorChecks':checks,'bodyCoverage':M.coverage(boss,body),'targetCoverage':M.coverage(boss,target),'reusedReviewedAmmoPixels':reuse if reused else None,'unchangedAuthoredRules':preserved,'oldOtherProfilesChanged':False,'candidateManifestRegistration':{'legacyOffset':offset,'legacyScale':scale,'bounds':C,'rowBounds':rows,'projectileBounds':PC,'projectileRowBounds':prows,'projectileFacing':facing}}
 MD=M.project(C,C,modern_box);modern_point=[C[0]+(aim[0]-MD[0])*C[2]/MD[2],C[1]+(aim[1]-MD[1])*C[3]/MD[3]];mx,my=[M.jsround(v) for v in modern_point]
 modern_alpha=[boss.getpixel((c*512+mx,r*512+my))[3] if 0<=mx<512 and 0<=my<512 else 0 for r in range(4) for c in range(4)]
 modern_neighborhood=[boss.crop((c*512+mx-2,r*512+my-2,c*512+mx+3,r*512+my+3)).getchannel('A').getextrema()[0] if 2<=mx<510 and 2<=my<510 else 0 for r in range(4) for c in range(4)]
 report['modernAimPixelEvidence']={'sourcePoint':modern_point,'nearestAlphaByFrame':modern_alpha,'neighborhood5x5MinAlphaByFrame':modern_neighborhood,'all5x5OpaqueFrames':min(modern_neighborhood)>=200}
 if 'modernBox' in choices:report['candidateManifestRegistration']['modernBox']=modern_box
 out.mkdir(parents=True,exist_ok=True);proof.mkdir(parents=True,exist_ok=True)
 (out/f'geometry-stage{stage}-p1.json').write_text(json.dumps(g,indent=2)+'\n');(out/f'geometry-stage{stage}-p1-report.json').write_text(json.dumps(report,indent=2)+'\n');(proof/f'{prefix}-geometry-report.json').write_text(json.dumps(report,indent=2)+'\n')
 M.overlay(boss,[(range(4),body,'#ff6d65','damage/contact'),(range(4),target,'#6dff98',spec['target'])],proof/f'{prefix}-geometry-body-target.png');M.overlay(ammo,[([r],K,'#6dff98',f'row{r} alpha>={minimum}') for r,K in enumerate(cores)],proof/f'{prefix}-geometry-projectile-cores.png')
 return g,report

def publish(stage,geometry,report,choices,data):
 if choices.get('reviewed') is not True:raise ValueError('Explicit reviewed:true choices are required for publication')
 current=load_data();entry=current['manifest'][str(stage)];reg=report['candidateManifestRegistration'];boss=entry['phases'][0];ammo=entry['projectiles'][0]
 if M.sha(ROOT/boss['path'])!=report['assets']['bossSha256'] or M.sha(ROOT/ammo['path'])!=report['assets']['projectilesSha256']:raise ValueError('Root must first install the exact candidate PNGs named by manifest')
 if boss.get('legacyOffset',[0,0])!=reg['legacyOffset'] or boss.get('legacyScale',[1,1])!=reg['legacyScale'] or boss.get('bounds')!=reg['bounds'] or ammo.get('bounds')!=reg['projectileBounds'] or ammo.get('rowBounds')!=reg['projectileRowBounds'] or ammo.get('facing',entry.get('projectileFacing','left'))!=reg['projectileFacing']:raise ValueError('Candidate registrations must exactly match the installed manifest before numeric publication')
 if 'modernBox' in reg and boss.get('modernBox',SPECS[stage]['box'])!=reg['modernBox']:raise ValueError('Installed manifest modernBox differs from exact measured candidate registration')
 if hash_value(current['geometry'][str(stage)]['0'])!=choices['expectedPreviousProfileSha256']:raise ValueError('Stale selected phase numeric profile')
 geometry['provenance']['status']='source-hashed-solid-core-reviewed-active'
 geometry['provenance']['projectileCoreStatus']='reused-exact-hash-reviewed-pixels-active' if report['reusedReviewedAmmoPixels'] else 'four-frame-fully-opaque-core-root-reviewed-active'
 target=ROOT/'sprite-hitboxes.js';text=target.read_text();marker=f'// BEGIN GENERATED BOSS REPLACEMENT {stage} P1 GEOMETRY';end=f'// END GENERATED BOSS REPLACEMENT {stage} P1 GEOMETRY'
 if marker in text:raise ValueError('Replacement block already exists; explicit review/removal required')
 block=marker+'\nSPRITE_HITBOXES.stages['+json.dumps(str(stage))+']["0"]='+json.dumps(geometry,separators=(',',':'))+';\n'+end+'\n';temporary=target.with_name('.boss-replacement-check.js')
 if temporary.exists():raise ValueError('Validation temporary file already exists')
 try:
  temporary.write_text(text+'\n'+block);after=load_data(temporary)['geometry'];before=copy.deepcopy(current['geometry']);expected=copy.deepcopy(before);expected[str(stage)]['0']=geometry
  if after!=expected:raise ValueError('Publication changes another stage/phase')
  if target.read_text()!=text:raise ValueError('Concurrent profile edit; refusing overwrite')
  temporary.replace(target)
 finally:temporary.unlink(missing_ok=True)
 return{'onlyChangedStage':stage,'onlyChangedPhase':0,'allOtherProfilesUnchanged':True,'oldSourcePrefixByteExact':True,'activationChanged':False}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--stage',type=int,choices=[4,5],required=True);p.add_argument('--phase',type=int,choices=[0],default=0);p.add_argument('--boss',type=Path,required=True);p.add_argument('--projectiles',type=Path,required=True);p.add_argument('--choices',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--proof-dir',type=Path,required=True);p.add_argument('--proof-prefix',default='boss-replacement');p.add_argument('--publish',action='store_true');a=p.parse_args()
 try:
  data=load_data();choices=json.loads(a.choices.read_text());geometry,report=measure(a.stage,a.boss,a.projectiles,choices,data,a.output_dir,a.proof_dir,a.proof_prefix);result={'status':'numeric-candidate-not-published','report':report}
  if a.publish:result['publication']=publish(a.stage,geometry,report,choices,data)
  print(json.dumps(result,indent=2))
 except (ValueError,OSError,KeyError,subprocess.CalledProcessError) as e:p.exit(1,str(e)+'\n')
if __name__=='__main__':main()
