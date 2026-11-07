#!/usr/bin/env python3
"""Measure ONLY Redkev ID13 from prepared 2048px atlases; never activate artwork.

  python3 tools/measure-redkev-geometry.py --output-dir work/redkev-geometry
  # Review overlays; copy/edit choices-template.json and pin reviewed=true.
  python3 tools/measure-redkev-geometry.py --choices reviewed.json --output-dir work/redkev-geometry
  # Optional append-only ID13 publication, after review (no activation flags changed).
  python3 tools/measure-redkev-geometry.py --choices reviewed.json --output-dir work/redkev-geometry --publish

Requires Pillow. Boss profiles use exact rounded center-bottom Canvas registration.
Only projectile KEY NAMES/layout rules are inherited from Marina; every source pixel
reference/crop/core is replaced from the new ID13 atlases. Existing IDs1..12 are
compared structurally before publication and their source bytes are never replaced.
"""
import argparse, copy, hashlib, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
CELL=512
MARKER='// BEGIN GENERATED REDKEV ID13 GEOMETRY'
END='// END GENERATED REDKEV ID13 GEOMETRY'


def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def jsround(x): return math.floor(x+.5)
def rect(r):
    if not isinstance(r,list) or len(r)!=4 or any(not isinstance(v,int) or isinstance(v,bool) for v in r) or min(r[:2])<0 or min(r[2:])<=0 or r[0]+r[2]>CELL or r[1]+r[3]>CELL:
        raise ValueError(f'Invalid cell-local integer rectangle: {r}')
    return r

def project(C,K,B):
    """Same rounded bottom-anchored destination as spriteAtlasDestinationRect."""
    x,y,w,h=B;s=min(w/C[2],h/C[3]);dw=jsround(C[2]*s);dh=jsround(C[3]*s)
    if min(dw,dh)<=0: raise ValueError('Empty rounded draw destination')
    dx=x+w/2+jsround(-C[2]*s/2);dy=y+h/2+jsround(h/2-C[3]*s)
    return [dx+(K[0]-C[0])*dw/C[2],dy+(K[1]-C[1])*dh/C[3],K[2]*dw/C[2],K[3]*dh/C[3]]

def normalized(E,P): return [(E[0]-P[0])/P[2],(E[1]-P[1])/P[3],E[2]/P[2],E[3]/P[3]]
def inside(K,C):return K[0]>=C[0] and K[1]>=C[1] and K[0]+K[2]<=C[0]+C[2] and K[1]+K[3]<=C[1]+C[3]
def largest_rectangle(mask):
    width,height=mask.size;pixels=mask.tobytes();heights=[0]*width;best=None;area=0
    for y in range(height):
        for x in range(width): heights[x]=heights[x]+1 if pixels[y*width+x] else 0
        stack=[]
        for x in range(width+1):
            high=heights[x] if x<width else 0;start=x
            while stack and stack[-1][1]>high:
                left,tall=stack.pop();candidate=[left,y-tall+1,x-left,tall];size=candidate[2]*candidate[3]
                if size>area or size==area and best and tuple(candidate[:2])<tuple(best[:2]):best,area=candidate,size
                start=left
            if not stack or stack[-1][1]<high:stack.append((start,high))
    if best is None: raise ValueError('No shared fully opaque rectangle; inspect registration/art')
    return best

def common_mask(cells):
    result=Image.new('L',(CELL,CELL),255)
    for cell in cells:result=ImageChops.darker(result,cell.getchannel('A').point(lambda a:255 if a==255 else 0))
    return result

def cells(image,rows=range(4)):
    return [image.crop((c*CELL,r*CELL,(c+1)*CELL,(r+1)*CELL)) for r in rows for c in range(4)]

def coverage(image,K,rows=range(4)):
    return [sum(v>=128 for v in c.crop((K[0],K[1],K[0]+K[2],K[1]+K[3])).getchannel('A').tobytes())/(K[2]*K[3]) for c in cells(image,rows)]

def overlay(image,regions,path):
    canvas=Image.new('RGBA',image.size,'#152332');canvas.alpha_composite(image);draw=ImageDraw.Draw(canvas)
    for rows,K,color,label in regions:
        for row in rows:
            for col in range(4):
                x,y,w,h=K;draw.rectangle((col*CELL+x,row*CELL+y,col*CELL+x+w-1,row*CELL+y+h-1),outline=color,width=2)
                draw.text((col*CELL+x,row*CELL+y),label,fill=color)
    canvas.resize((1280,1280),Image.Resampling.NEAREST).save(path)

def load_data(profile_path=None):
    script="""const fs=require('fs'),vm=require('vm');require('./boss-sheets.js');const c=vm.createContext({});vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);console.log(JSON.stringify({manifest:ArcadeBossSheets.manifest[13],geometry:vm.runInContext('SPRITE_HITBOXES.stages',c)}));"""
    return json.loads(subprocess.check_output(['node','-e',script,str(profile_path or ROOT/'sprite-hitboxes.js')],cwd=ROOT))

def load_atlas(asset):
    path=ROOT/asset['path'];meta_path=path.with_suffix('.json')
    if not path.exists() or not meta_path.exists():raise ValueError(f'Missing actual prepared atlas or metadata: {path}')
    image=Image.open(path).convert('RGBA');meta=json.loads(meta_path.read_text())
    if image.size!=(2048,2048):raise ValueError(f'{path}: expected a genuine 4x4 2048px atlas')
    bounds=rect(meta.get('bounds') or asset.get('bounds'))
    rows=[rect(r) for r in meta.get('rowBounds',asset.get('rowBounds',[]))]
    if len(rows)!=4:raise ValueError(f'{path}: four measured rowBounds required')
    for index,c in enumerate(cells(image)):
        b=c.getchannel('A').getbbox()
        if not b or min(b[:2])<1 or max(b[2:])>511:raise ValueError(f'{path}: empty or clipped cell {b}')
        for reference in [bounds,rows[index//4]]:
            x,y,w,h=reference
            if b[0]<x or b[1]<y or b[2]>x+w or b[3]>y+h:raise ValueError(f'{path}: metadata crops would clip actual frame{index}')
    if asset.get('bounds') and asset['bounds']!=bounds:raise ValueError(f'{path}: metadata/manifest bounds mismatch')
    if asset.get('rowBounds') and asset['rowBounds']!=rows:raise ValueError(f'{path}: metadata/manifest rowBounds mismatch')
    return image,path,meta,bounds,rows

def measure(data,choices,out):
    if not data['manifest']:raise ValueError('Pending manifest13 entry is required')
    geometry={};template={'reviewed':False,'phases':[]};reports=[]
    for phase in range(2):
        source=data['geometry']['1'][str(phase)];assets=data['manifest'];boss,bpath,bmeta,C,brows=load_atlas(assets['phases'][phase]);shots,ppath,pmeta,PC,prows=load_atlas(assets['projectiles'][phase])
        body_mask=common_mask(cells(boss));body_candidate=largest_rectangle(body_mask);projectile_candidates=[largest_rectangle(common_mask(cells(shots,[row]))) for row in range(4)]
        option=(choices or {}).get('phases',[{},{}])[phase];body=rect(option.get('body',body_candidate));targets=option.get('targets',{'marina-vent':body_candidate});cores=[rect(r) for r in option.get('projectileCores',projectile_candidates)]
        if 'marina-vent' not in targets:raise ValueError('The inherited vent target requires its own measured Redkev core')
        if len(cores)!=4:raise ValueError('Exactly four reviewed projectile cores required')
        hashes={'bossSha256':sha(bpath),'projectilesSha256':sha(ppath)}
        if choices and option.get('assetHashes')!=hashes:raise ValueError(f'Phase{phase+1}: reviewed choices must pin current source atlas hashes')
        body_coverage=coverage(boss,body)
        if not inside(body,C):raise ValueError('Reviewed body extends outside measured boss crop')
        if min(body_coverage)<.5:raise ValueError(f'Phase{phase+1}: body candidate has <50% opaque coverage in some frames')
        for row,K in enumerate(cores):
            mask=common_mask(cells(shots,[row])).crop((K[0],K[1],K[0]+K[2],K[1]+K[3]))
            if mask.getextrema()!=(255,255):raise ValueError(f'Phase{phase+1} projectile row{row}: core must be opaque in ALL four actual frames')
            crop=prows[row]
            if K[0]<crop[0] or K[1]<crop[1] or K[0]+K[2]>crop[0]+crop[2] or K[1]+K[3]>crop[1]+crop[3]:raise ValueError('Projectile core lies outside its actual row crop')
        basset=assets['phases'][phase];offset=basset.get('legacyOffset',[0,0]);scale=basset.get('legacyScale',[1,1]);legacy=[-190+380*(1-scale[0])/2+offset[0],-510.4+498.4*(1-scale[1])+offset[1],380*scale[0],498.4*scale[1]]
        E=project(C,body,legacy);profile={
          'provenance':{**hashes,'status':'source-hashed-redkev-only-reviewed' if choices and choices.get('reviewed') else 'candidate-awaiting-root-review','bodyCorePixels':body,'logicalTargetCorePixels':targets.get('marina-vent'),'projectileCorePixels':cores,'projectileCoreStatus':'four-frame-fully-opaque-core-root-reviewed' if choices and choices.get('reviewed') else 'four-frame-fully-opaque-intersection-root-review-required','legacyDrawOffset':offset,'legacyDrawScale':scale},
          'targets':{},'boss':{'damage':{'rect':normalized(E,[-147,-510.4,294,498.4])},'contact':{'rect':normalized(E,[-205,-484,410,484])}},'projectiles':{},'beams':{}}
        modern_box=basset.get('modernBox',[930,290,340,310])
        if not isinstance(modern_box,list) or len(modern_box)!=4 or any(not isinstance(v,(int,float)) or not math.isfinite(v) for v in modern_box) or min(modern_box[2:])<=0:raise ValueError('Invalid presentation-only modernBox')
        profile['provenance']['modernDrawBox']=modern_box
        target_report={}
        for name,K in targets.items():
            K=rect(K)
            if not inside(K,C):raise ValueError('Reviewed target extends outside measured boss crop')
            if min(coverage(boss,K))<.5:raise ValueError('Reviewed target must have at least50% opaque coverage in every actual boss frame')
            if name not in ['marina-vent','marina-valve']:raise ValueError('Unknown target choice; authored targets must not be invented')
            base=[1040,490,110,110] if name=='marina-vent' else [838,500,68,100]
            world=project(C,K,modern_box);aim=[base[0]+base[2]/2,base[1]+base[3]/2];aim_inside=world[0]<=aim[0]<=world[0]+world[2] and world[1]<=aim[1]<=world[1]+world[3]
            if choices and choices.get('reviewed') and not aim_inside:raise ValueError(f'P{phase+1} {name}: authored aiming center misses proposed core; review draw placement, never move aiming anchors')
            profile['targets'][name]={'rect':normalized(world,base)};target_report[name]={'core':K,'world':world,'authoredBase':base,'modernDrawBox':modern_box,'aimCenter':aim,'aimInside':aim_inside,'coverage':coverage(boss,K)}
        # Inherit no Marina pixel coordinates. Preserve only authored layout/damage semantics.
        for group in ['projectiles','beams']:
            for name,old in source.get(group,{}).items():
                if 'reference' not in old:raise ValueError(f'Unmeasured template rule {group}/{name}; review rather than copying an old core')
                row=int(name.rsplit('@',1)[1]);new={k:copy.deepcopy(v) for k,v in old.items() if k not in ['reference','crop','core','rect','facing']}
                new.update(reference=PC,crop=prows[row],core=cores[row],facing=assets['projectiles'][phase].get('facing',pmeta.get('facing','left')));profile[group][name]=new
        geometry[str(phase)]=profile
        template['phases'].append({'assetHashes':hashes,'body':body_candidate,'targets':{'marina-vent':body_candidate},'projectileCores':projectile_candidates})
        body_mask.save(out/f'p{phase+1}-common-opaque.png');overlay(boss,[(range(4),body,'#ff6b65','body')]+[(range(4),rect(K),'#60ff9e',name) for name,K in targets.items()],out/f'p{phase+1}-boss-core-overlay.png');overlay(shots,[([row],K,'#60ff9e',f'row{row}') for row,K in enumerate(cores)],out/f'p{phase+1}-projectile-core-overlay.png')
        reports.append({'phase':phase,'assets':hashes,'bodyCoverage':body_coverage,'targets':target_report,'unchangedMechanicalTargets':['marina-valve'] if phase and 'marina-valve' not in targets else [],'legacyBodyWorldRelative':E,'bodyCandidate':body_candidate,'projectileCandidates':projectile_candidates})
    (out/'choices-template.json').write_text(json.dumps(template,indent=2)+'\n');(out/'geometry13.json').write_text(json.dumps(geometry,indent=2)+'\n');(out/'report.json').write_text(json.dumps({'status':'reviewed-draft' if choices and choices.get('reviewed') else 'candidates-not-enabled','oldProfilesChanged':False,'phases':reports},indent=2)+'\n')
    return geometry

def publish(geometry,data,choices):
    if not choices or choices.get('reviewed') is not True:raise ValueError('--publish requires explicitly reviewed, hash-pinned choices')
    for phase in geometry.values():phase['provenance'].update(status='source-hashed-solid-core-reviewed-active',projectileCoreStatus='four-frame-fully-opaque-core-root-reviewed-active')
    target=ROOT/'sprite-hitboxes.js';old=target.read_text();before={str(i):data['geometry'][str(i)] for i in range(1,13)}
    if MARKER in old or END in old:raise ValueError('Generated ID13 block already exists; review/remove that block explicitly before republishing')
    block=MARKER+'\nSPRITE_HITBOXES.stages["13"] = '+json.dumps(geometry,separators=(',',':'))+';\n'+END+'\n'
    # Validate a temporary sibling before touching production; the original text is retained byte-for-byte.
    temporary=target.with_name('.redkev-geometry-check.js')
    if temporary.exists():raise ValueError('Validation temporary file already exists')
    try:
        temporary.write_text(old+'\n'+block);after=load_data(temporary)['geometry']
        if before!={str(i):after[str(i)] for i in range(1,13)}:raise ValueError('Publication unexpectedly modifies existing IDs1..12')
        if after['13']!=geometry:raise ValueError('Published ID13 differs from reviewed geometry')
        if target.read_text()!=old:raise ValueError('Concurrent profile edit detected; refusing to overwrite it')
        temporary.replace(target)
    finally:temporary.unlink(missing_ok=True)
    return {'oldSourcePrefixByteExact':target.read_text().startswith(old),'old12ProfilesStructurallyEqual':True,'newStage':13,'activationChanged':False}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--choices',type=Path);p.add_argument('--publish',action='store_true');a=p.parse_args()
    try:
        a.output_dir.mkdir(parents=True,exist_ok=True);data=load_data();choices=json.loads(a.choices.read_text()) if a.choices else None
        geometry=measure(data,choices,a.output_dir);result={'status':'review-only','stage':13,'output':str(a.output_dir)}
        if a.publish:result['publication']=publish(geometry,data,choices)
        print(json.dumps(result,indent=2))
    except (ValueError,OSError,KeyError,IndexError,subprocess.CalledProcessError) as e:p.exit(1,str(e)+'\n')
if __name__=='__main__':main()
