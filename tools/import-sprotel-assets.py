#!/usr/bin/env python3
"""Import real Sprotel animation drawings without inventing or duplicating frames.

Mecha: four native 2x2 source pages per action (16 frames), four 1024px
runtime pages. Projectiles: one native 4x4 sheet (16 frames), one 2048px atlas.
Each phase shares one mecha transform; each projectile has one shared transform.
Run --partial for an inventory/preview while generation finishes. A release
import requires every declared source and --require-complete asset verification.
Local generation sources take priority; checked-in reference sources and released
Phase 1 snapshots let a fresh checkout reproduce the import without Git history.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import statistics
import subprocess
import copy
from PIL import Image, ImageChops, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT.parent
OUT=ROOT/'art/generated/bosses/14-sprotel-bitcoin'
REF=ROOT/'art/reference/20261117-sprotel-bitcoin'
BOSS={
  1:{'idle':WORK/'sprotel-p2-final/2x2/idle','beerStick':WORK/'sprotel-p2-final/2x2/beerStick',
     'cocktailCannon':WORK/'sprotel-p2-final/2x2/cocktailCannon','snacks':WORK/'sprotel-p2-final/2x2/snacks',
     'marlin':WORK/'sprotel-p2-final/2x2/marlinLaunch','diskLaser':WORK/'sprotel-boss-2x2/p2/diskLaser',
     'soundWave':WORK/'sprotel-p2-final/2x2/soundWave'}
}
PROJECTILES={name:WORK/'sprotel-projectiles-final'/f'{name}-source.png' for name in ['speakerMissile','pretzel','nacho','popcorn']}
BOXES={'beer':[42,54],'cocktail':[38,48],'blueMarlin':[100,38],'diskLaser':[120,40],
       'speakerMissile':[96,56],'pretzel':[54,40],'nacho':[42,38],'popcorn':[40,40]}

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def frame_sha(frame):return hashlib.sha256(frame.tobytes()).hexdigest()
def union(boxes):
    x=min(b[0] for b in boxes);y=min(b[1] for b in boxes)
    return [x,y,max(b[2] for b in boxes),max(b[3] for b in boxes)]
def xywh(box):return [box[0],box[1],box[2]-box[0],box[3]-box[1]]
def key_frame(frame):
    data=list(frame.convert('RGBA').getdata())
    key=[a==0 or min(r,b)>=170 and min(r,b)-g>=95 and abs(r-b)<=70 for r,g,b,a in data]
    mask=Image.new('L',frame.size);mask.putdata([255 if k else 0 for k in key])
    adjacent=list(mask.filter(ImageFilter.MaxFilter(3)).getdata());cleaned=[]
    for i,(r,g,b,a) in enumerate(data):
        if key[i]:cleaned.append((0,0,0,0));continue
        if adjacent[i] and min(r,b)-g>18 and min(r,b)>60:
            spill=min(r,b)-g;r,b=max(g,r-spill),max(g,b-spill)
        cleaned.append((r,g,b,255))
    result=Image.new('RGBA',frame.size);result.putdata(cleaned)
    bounds=result.getchannel('A').getbbox();removed=0
    if bounds and (min(bounds[:2])<2 or bounds[2]>frame.width-2 or bounds[3]>frame.height-2):
        width,height=frame.size;data=list(result.getdata());visited=set()
        border=[y*width+x for y in range(height) for x in range(width) if x<2 or y<2 or x>=width-2 or y>=height-2]
        for start in border:
            if start in visited or not data[start][3]:continue
            stack=[start];visited.add(start);component=[]
            while stack:
                i=stack.pop();component.append(i)
                if len(component)>40:raise ValueError(f'Connected source drawing clips edge: {bounds} in {frame.size}')
                x,y=i%width,i//width
                for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                    n=ny*width+nx
                    if 0<=nx<width and 0<=ny<height and n not in visited and data[n][3]:visited.add(n);stack.append(n)
            for i in component:data[i]=(0,0,0,0)
            removed+=len(component)
        result.putdata(data);bounds=result.getchannel('A').getbbox()
    if not bounds or min(bounds[:2])<2 or bounds[2]>frame.width-2 or bounds[3]>frame.height-2:
        raise ValueError(f'Incomplete/clipped source drawing: {bounds} in {frame.size}')
    result.info['tinyDisconnectedEdgePixelsRemoved']=removed
    return result

def split(path,columns,reference):
    original=Image.open(path).convert('RGBA');frames=[];records=[]
    side=max((original.width+columns-1)//columns,(original.height+columns-1)//columns)
    for row in range(columns):
        for col in range(columns):
            box=[round(col*original.width/columns),round(row*original.height/columns),
                 round((col+1)*original.width/columns),round((row+1)*original.height/columns)]
            native=original.crop(box)
            try:clean=key_frame(native)
            except ValueError as error:raise ValueError(f'{path} row{row} col{col}: {error}') from error
            frame=Image.new('RGBA',(side,side));frame.paste(clean,(0,0))
            frames.append(frame);records.append({'source':str(reference.relative_to(ROOT)),
                'sourceSha256':sha(path),'sourceDimensions':list(original.size),'sourceGrid':[columns,columns],
                'sourceCellXYXY':box,'nativeFrameSha256':frame_sha(native),'tinyDisconnectedEdgePixelsRemoved':clean.info.get('tinyDisconnectedEdgePixelsRemoved',0)})
    return frames,records

def available_source(primary,canonical):
    """Use local generation output when present, otherwise the archived source."""
    return primary if primary.is_file() else canonical

def copy_source(source,destination):
    # A fresh checkout can read directly from the canonical destination. This
    # also covers prompt/manifest sidecars and symlinks or hard links to it.
    if destination.exists() and source.samefile(destination):return
    shutil.copy2(source,destination)

def copy_sources(paths,folder):
    folder.mkdir(parents=True,exist_ok=True)
    for source in paths:copy_source(source,folder/source.name)
    source_dirs={p.parent for p in paths}
    for source_dir in source_dirs:
        for p in source_dir.iterdir():
            if p.suffix.lower() in ['.txt','.json','.md'] and ('prompt' in p.name or p.name=='manifest.json'):
                copy_source(p,folder/p.name)

def transform(frames,source_union,center=False):
    w=source_union[2]-source_union[0];h=source_union[3]-source_union[1]
    scale=min(488/w,488/h);dw=round(w*scale);dh=round(h*scale)
    ox=(512-dw)//2;oy=(512-dh)//2 if center else 500-dh
    result=[]
    for frame in frames:
        cell=Image.new('RGBA',(512,512));cell.paste(frame.crop(source_union).resize((dw,dh),Image.Resampling.NEAREST),(ox,oy));result.append(cell)
    return result,{'sourceUnionXYXY':source_union,'destination':[ox,oy,dw,dh],'baseline':500 if not center else None,'sampling':'nearest-neighbor; one common transform across all animation frames'}

def solid_core(frames,region=None):
    """Largest rectangle whose every pixel is opaque in all sixteen native frames."""
    intersection=frames[0].getchannel('A')
    for frame in frames[1:]:intersection=ImageChops.darker(intersection,frame.getchannel('A'))
    if region:
        clipped=Image.new('L',intersection.size);clipped.paste(intersection.crop(region),(region[0],region[1]));intersection=clipped
    pixels=list(intersection.getdata());width,height=intersection.size;heights=[0]*width;best=(0,[0,0,0,0])
    for y in range(height):
        for x in range(width):heights[x]=heights[x]+1 if pixels[y*width+x]==255 else 0
        stack=[]
        for x,h in enumerate(heights+[0]):
            start=x
            while stack and stack[-1][1]>h:
                left,hh=stack.pop();area=(x-left)*hh
                if area>best[0]:best=(area,[left,y-hh+1,x-left,hh])
                start=left
            if not stack or stack[-1][1]<h:stack.append((start,h))
    if best[0]<16:raise ValueError('No stable opaque core across all 16 frames')
    return best[1]

def save_animation(frames,records,directory,columns,registration,kind):
    if len(frames)!=16 or len({r['nativeFrameSha256'] for r in records})!=16:raise ValueError('Animation needs 16 distinct native source drawings')
    directory.mkdir(parents=True,exist_ok=True)
    frame_bounds=[f.getchannel('A').getbbox() for f in frames]
    bounds=xywh(union(frame_bounds));core=solid_core(frames);pages=[];all_records=[]
    frames_per_page=columns*columns
    for page_index in range(16//frames_per_page):
        page=Image.new('RGBA',(512*columns,512*columns));start=page_index*frames_per_page
        for local in range(frames_per_page):
            i=start+local;b=frame_bounds[i]
            if min(b[:2])<2 or max(b[2:])>510:raise ValueError(f'Packed clipping in frame {i}: {b}')
            page.paste(frames[i],((local%columns)*512,(local//columns)*512))
            all_records.append({'index':i,'page':page_index,'cell':local,'bounds':xywh(b),'frameSha256':frame_sha(frames[i]),**records[i]})
        path=directory/f'page-{page_index}.png';page.save(path,compress_level=9)
        pages.append({'path':str(path.relative_to(ROOT)),'sha256':sha(path),'version':sha(path)[:16],
                      'width':512*columns,'height':512*columns,'columns':columns,'rows':columns,'ready':True,
                      'bounds':xywh(union(frame_bounds[start:start+frames_per_page]))})
    metadata={'frameCount':16,'kind':kind,'generator':'built-in image_gen','columns':columns,'rows':columns,
              'pages':pages,'bounds':bounds,'referenceBounds':registration,'core':core,'facing':'left' if kind=='projectile' else None,
              'frames':all_records,'provenance':'Sixteen distinct generated native drawings; no frame duplication, interpolation or synthetic motion'}
    (directory/'animation.json').write_text(json.dumps(metadata,indent=2)+'\n')
    return metadata

def rect_fraction(rect,base):return [(rect[0]-base[0])/base[2],(rect[1]-base[1])/base[3],rect[2]/base[2],rect[3]/base[3]]
def project(reference,pixels,box):
    rx,ry,rw,rh=reference;scale=min(box[2]/rw,box[3]/rh)
    return [box[0]+box[2]/2+round((pixels[0]-rx-rw/2)*scale),
            box[1]+box[3]/2+round(box[3]/2+(pixels[1]-ry-rh)*scale),round(pixels[2]*scale),round(pixels[3]*scale)]


def disk_center(frames):
    centers=[]
    for frame in frames:
        width,height=frame.size;pixels=list(frame.getdata());visited=set();candidates=[]
        def red(i):
            r,g,b,a=pixels[i];return a and r>=160 and r-g>=70 and r-b>=60 and g<=110 and abs(g-b)<=40
        for y in range(round(height*.42),round(height*.65)):
            for x in range(round(width*.25),round(width*.75)):
                start=y*width+x
                if start in visited or not red(start):continue
                stack=[start];visited.add(start);component=[]
                while stack:
                    i=stack.pop();component.append(i);cx,cy=i%width,i//width
                    for nx,ny in [(cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)]:
                        n=ny*width+nx
                        if 0<=nx<width and 0<=ny<height and n not in visited and red(n):visited.add(n);stack.append(n)
                xs=[i%width for i in component];ys=[i//width for i in component];w=max(xs)-min(xs)+1;h=max(ys)-min(ys)+1
                if len(component)>=30 and .6<w/h<1.7:candidates.append((len(component),[(min(xs)+max(xs))/2,(min(ys)+max(ys))/2]))
        if candidates:centers.append(max(candidates)[1])
    return [statistics.median(p[0] for p in centers),statistics.median(p[1] for p in centers)] if centers else None


def register_mecha_pages(actions,impact=None):
    """Correct camera scale uniformly per source page, retaining its four drawings."""
    anchors={}
    for name,(frames,records) in actions.items():
        anchors[name]=[]
        for page in range(4):
            group=frames[page*4:page*4+4];disk=disk_center(group)
            boxes=[f.getchannel('A').getbbox() for f in group];foot=statistics.median(b[3] for b in boxes);top=statistics.median(b[1] for b in boxes)
            feet=[]
            for frame in group:
                b=frame.getchannel('A').getbbox();band=frame.crop((0,max(0,b[3]-32),frame.width,b[3])).getchannel('A').getbbox();feet.append((band[0]+band[2])/2)
            anchors[name].append({'disk':disk,'foot':foot,'top':top,'feetX':statistics.median(feet)})
    valid=[a for a in (anchors.get('idle') or [a for group in anchors.values() for a in group]) if a['disk']]
    if not valid:raise ValueError('A phase needs a visible idle vinyl disk for registration')
    distance=statistics.median(a['foot']-a['disk'][1] for a in valid)
    disk_feet=statistics.median(a['disk'][0]-a['feetX'] for a in valid)
    fraction=statistics.median((a['disk'][1]-a['top'])/(a['foot']-a['top']) for a in valid)
    registered={}
    for name,(frames,records) in actions.items():
        output=[]
        for page,anchor in enumerate(anchors[name]):
            method='visible red vinyl hub'
            if anchor['disk'] is None:
                # During laser peak the hub turns white/cyan; use the unchanged
                # feet and body proportions measured from this phase's idle pages.
                anchor['disk']=[anchor['feetX']+disk_feet,anchor['top']+(anchor['foot']-anchor['top'])*fraction];method='idle-calibrated feet/body registration (lit vinyl hub)'
            scale=distance/(anchor['foot']-anchor['disk'][1])
            ox=512-round(anchor['disk'][0]*scale);oy=900-round(anchor['foot']*scale)
            if impact and name=='beerStick' and page==impact['page']:
                if records[page*4]['sourceSha256']!=impact['sourceSha256']:
                    raise ValueError('Beer-stick impact registration requires source re-review')
                override=impact['pageRegistration'];scale=override['scale'];ox,oy=override['offset']
                anchor['disk']=override['nativeDisk'];anchor['foot']=override['nativeFoot']
                method='hash-pinned visual body/feet registration; red-hub threshold changed in revised impact artwork'
            if not .6<=scale<=1.5:raise ValueError(f'{name} page{page}: camera registration needs manual review (scale {scale})')
            group=frames[page*4:page*4+4]
            for local,frame in enumerate(group):
                canvas=Image.new('RGBA',(1024,1024));canvas.paste(frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.NEAREST),(ox,oy));output.append(canvas)
                records[page*4+local]['pageRegistration']={'scale':scale,'offset':[ox,oy],'nativeDisk':anchor['disk'],'nativeFoot':anchor['foot'],'targetDiskX':512,'targetFoot':900,'anchorMethod':method,'method':'one uniform nearest-neighbor camera correction per source page; no pose invention'}
        registered[name]=(output,records)
    return registered,{'disk':[512,900-distance],'foot':900,'diskToFoot':distance}



PRESERVED_COMMIT='a4d85ae'
def preserved_phase_one():
    """Read the released Phase 1 unchanged; adapt metadata, never its pixels."""
    snapshot=REF/'preserved-main-a4d85ae'
    manifest_path=snapshot/'animation-manifest.json'
    if manifest_path.is_file():manifest_bytes=manifest_path.read_bytes()
    else:
        manifest_bytes=subprocess.check_output(['git','show',PRESERVED_COMMIT+':art/generated/bosses/14-sprotel-bitcoin/animation-manifest.json'],cwd=ROOT)
        snapshot.mkdir(parents=True,exist_ok=True);manifest_path.write_bytes(manifest_bytes)
    original=json.loads(manifest_bytes)
    geometry_path=snapshot/'geometry.json'
    if geometry_path.is_file():geometry=json.loads(geometry_path.read_text())
    else:
        script="const vm=require('vm'),cp=require('child_process');let c={};vm.runInNewContext(cp.execFileSync('git',['show','a4d85ae:sprite-hitboxes.js'],{encoding:'utf8'})+';globalThis.g=SPRITE_HITBOXES.stages[14][0]',c);process.stdout.write(JSON.stringify(c.g));"
        geometry=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT))
        snapshot.mkdir(parents=True,exist_ok=True);geometry_path.write_text(json.dumps(geometry,indent=2)+'\n')
    def adapt(animation,kind):
        result=copy.deepcopy(animation);result.update(kind=kind,preservedFromMain=PRESERVED_COMMIT,frames=[])
        if kind=='mecha':result['referenceBounds']=original['bodyReferenceBounds']
        else:result.setdefault('referenceBounds',result['bounds'])
        for page_index,page in enumerate(result['pages']):
            path=ROOT/page['path'];assert sha(path)==page['atlasSha256'],f'Changed released P1 atlas: {path}'
            page['sha256']=page['atlasSha256']
            sidecar=json.loads(path.with_suffix('.json').read_text())
            with Image.open(path) as image:
                for cell,record in enumerate(sidecar['frames']):
                    frame=image.convert('RGBA').crop((cell%2*512,cell//2*512,(cell%2+1)*512,(cell//2+1)*512))
                    native_path=ROOT/record['masterSource'];assert sha(native_path)==record['masterSourceSha256']
                    with Image.open(native_path) as source:native=source.convert('RGBA').crop(record['sourceCellXYXY'])
                    result['frames'].append({'index':page_index*4+cell,'page':page_index,'cell':cell,'bounds':xywh(frame.getchannel('A').getbbox()),'frameSha256':frame_sha(frame),
                        'source':record['masterSource'],'sourceSha256':record['masterSourceSha256'],'sourceCellXYXY':record['sourceCellXYXY'],'nativeFrameSha256':frame_sha(native)})
        return result
    aliases={'beer':'beerThrow','cocktail':'cocktailThrow','disk-laser':'diskLaser'}
    body={aliases.get(name,name):adapt(animation,'mecha') for name,animation in original['animations'].items()}
    projectiles={name:adapt(animation,'projectile') for name,animation in original['projectileAnimations'].items()}
    return body,projectiles,geometry

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');args=parser.parse_args()
    missing=[];invalid=[];raw_phases=[{},{}];raw_projectiles={}
    for phase,actions in BOSS.items():
        for action,folder in actions.items():
            dest=REF/'final2x2'/f'p{phase+1}'/action
            paths=[available_source(folder/f'page-{p}-source.png',dest/f'page-{p}-source.png') for p in range(4)]
            if not all(p.exists() for p in paths):missing.append(f'p{phase+1}/{action}');continue
            copy_sources(paths,dest);frames=[];records=[]
            try:
                for path in paths:
                    f,r=split(path,2,dest/path.name);frames.extend(f);records.extend(r)
            except ValueError as error:
                invalid.append(str(error));missing.append(f'p{phase+1}/{action} (invalid source)');continue
            raw_phases[phase][action]=(frames,records)
    for name,path in PROJECTILES.items():
        dest=REF/'final-projectiles'/name
        path=available_source(path,dest/f'{name}-source.png')
        if not path.exists():missing.append('projectile/'+name);continue
        copy_sources([path],dest)
        try:raw_projectiles[name]=split(path,4,dest/path.name)
        except ValueError as error:invalid.append(str(error));missing.append('projectile/'+name+' (invalid source)')
    if missing and not args.partial:raise ValueError('Missing source animations: '+', '.join(missing))
    manifest={'schemaVersion':1,'complete':not missing,'phaseCount':2,'phaseAnimations':[{},{}],'projectileAnimations':{},'missing':missing,'invalidSources':invalid}
    body,projectiles,preserved=preserved_phase_one()
    manifest['phaseAnimations'][0]=body;manifest['projectileAnimations']=projectiles
    manifest['preservedPhaseOneCommit']=PRESERVED_COMMIT
    geometry={'0':preserved}
    impact=json.loads((REF/'beer-stick-impact.json').read_text())
    for phase,actions in enumerate(raw_phases):
        if not actions:continue
        actions,phase_anchor=register_mecha_pages(actions,impact if phase==1 else None)
        source_union=union([f.getchannel('A').getbbox() for frames,records in actions.values() for f in frames]);packed={};phase_bounds=[]
        for action,(frames,records) in actions.items():
            cells,registration=transform(frames,source_union);packed[action]=(cells,records,registration)
            phase_bounds.extend(f.getchannel('A').getbbox() for f in cells)
        reference=xywh(union(phase_bounds))
        for action,(frames,records,registration) in packed.items():
            metadata=save_animation(frames,records,OUT/f'p{phase+1}'/action,2,reference,'mecha')
            metadata['registration']=registration;manifest['phaseAnimations'][phase][action]=metadata
        if 'idle' in manifest['phaseAnimations'][phase]:
            idle=manifest['phaseAnimations'][phase]['idle'];torso=idle['core'];lower=solid_core(packed['idle'][0],[85,360,427,500])
            core=xywh(union([[torso[0],torso[1],torso[0]+torso[2],torso[1]+torso[3]],[lower[0],lower[1],lower[0]+lower[2],lower[1]+lower[3]]]))
            modern_box=[830,100,440,500] if phase else [900,180,360,420]
            legacy_box=[-224.2,-560.24,448.4,548.24] if phase else [-190,-510.4,380,498.4]
            modern=project(reference,lower,modern_box);legacy=project(reference,core,legacy_box)
            native_disk=phase_anchor['disk'];reg=packed['idle'][2];u=reg['sourceUnionXYXY'];dest=reg['destination']
            disk=[dest[0]+(native_disk[0]-u[0])*dest[2]/(u[2]-u[0]),dest[1]+(native_disk[1]-u[1])*dest[3]/(u[3]-u[1])]
            geometry[str(phase)]={'provenance':{'status':'generated-native-frames-solid-core','idlePageSha256':[p['sha256'] for p in idle['pages']], 'bodyCorePixels':core,'bodyOpaqueComponents':[torso,lower],'logicalTargetCorePixels':lower,'diskCenterPixels':disk,'diskCropPixels':manifest['phaseAnimations'][phase].get('diskLaser',idle)['pages'][2 if 'diskLaser' in manifest['phaseAnimations'][phase] else 0]['bounds'],'nativeDiskCenter':native_disk,'modernBox':modern_box,'legacyDrawScale':[1.18,1.1] if phase else [1,1],'referenceBounds':reference},
                'targets':{'sprotel-core':{'rect':rect_fraction(modern,[1015,495,110,90])}},
                'boss':{'damage':{'rect':rect_fraction(legacy,[-147,-510.4,294,498.4])},'contact':{'rect':rect_fraction(legacy,[-205,-484,410,484])}},'projectiles':{}}
        if str(phase) in geometry and 'beerStick' in packed:
            frames,records,reg=packed['beerStick'];page=records[11]['pageRegistration'];scale=page['scale'];ox,oy=page['offset'];u=reg['sourceUnionXYXY'];d=reg['destination']
            native=impact['sourceRegionLTRB']
            normalized=[ox+native[0]*scale,oy+native[1]*scale,ox+native[2]*scale,oy+native[3]*scale]
            roi=[round(d[0]+(normalized[0]-u[0])*d[2]/(u[2]-u[0])),round(d[1]+(normalized[1]-u[1])*d[3]/(u[3]-u[1])),
                 round(d[0]+(normalized[2]-u[0])*d[2]/(u[2]-u[0])),round(d[1]+(normalized[3]-u[1])*d[3]/(u[3]-u[1]))]
            weapon=solid_core([frames[11]],roi)
            geometry[str(phase)]['provenance'].update(beerStickCorePixels=weapon,beerStickFrame=11,beerStickCropPixels=manifest['phaseAnimations'][phase]['beerStick']['pages'][2]['bounds'],beerStickSourceRegion=native,beerStickImpactSourceSha256=impact['sourceSha256'])
    # Phase 2 reuses the released Phase 1 ammunition; keys without variants cover its kit.
    geometry['1']['projectiles']=copy.deepcopy(preserved['projectiles'])
    for key,profile in preserved['projectiles'].items():
        geometry['1']['projectiles'][key.split('@')[0]]=copy.deepcopy(profile)
    geometry['1']['projectiles']['sprotel.cocktail-cannon']=copy.deepcopy(geometry['1']['projectiles']['cocktail'])
    for name,(frames,records) in raw_projectiles.items():
        source_union=union([f.getchannel('A').getbbox() for f in frames]);cells,registration=transform(frames,source_union,True)
        reference=xywh(union([f.getchannel('A').getbbox() for f in cells]));metadata=save_animation(cells,records,OUT/'projectiles'/name,4,reference,'projectile');metadata['registration']=registration
        manifest['projectileAnimations'][name]=metadata
        profile={'reference':reference,'crop':reference,'core':metadata['core'],'visualBox':BOXES[name],'kind':'contain','facing':'left'}
        source_keys={'beer':['beer','sprotel.beer'],'cocktail':['cocktail','sprotel.cocktail','sprotel.cocktail-cannon'],
                     'blueMarlin':['blueMarlin','sprotel.marlin'],'diskLaser':['diskLaser','laser','sprotel.disk-laser'],
                     'speakerMissile':['speakerMissile','sprotel.sound-wave'],'pretzel':['pretzel','sprotel.snacks.pretzel'],
                     'nacho':['nacho','sprotel.snacks.nacho'],'popcorn':['popcorn','sprotel.snacks.popcorn']}[name]
        for key in source_keys:geometry['1']['projectiles'][key]=profile
    # Attachment measurements are authored against immutable runtime release pages.
    # Keep them separate from collision geometry and fail if a future reimport changes those pixels.
    attachments=json.loads((REF/'projectile-attachments.json').read_text())
    if attachments.get('schemaVersion')!=1:raise ValueError('Unsupported projectile attachment schema')
    for phase,actions in attachments['phases'].items():
        for action,spec in actions.items():
            animation=manifest['phaseAnimations'][int(phase)][action]
            page=spec['page'];actual=animation['pages'][page['firstFrame']//4]
            if page['path']!=actual['path'] or page['sha256']!=actual['sha256'] or page['crop']!=actual['bounds']:
                raise ValueError(f'Attachment measurements require re-review: phase {phase}, {action}')
            if spec['renderCrop']!=(animation['bounds'] if animation.get('preservedFromMain') else actual['bounds']):
                raise ValueError(f'Attachment render crop changed: phase {phase}, {action}')
            if spec['referenceBounds']!=animation['referenceBounds']:
                raise ValueError(f'Attachment registration changed: phase {phase}, {action}')
            for port in spec['ports'].values():
                for frame,point in port['frames'].items():
                    if not 8<=int(frame)<=11 or len(point)!=2 or not all(isinstance(v,(int,float)) and 0<=v<512 for v in point):
                        raise ValueError(f'Invalid measured attachment: phase {phase}, {action}, frame {frame}')
        geometry[phase]['provenance']['projectileAttachments']=copy.deepcopy(actions)
    OUT.mkdir(parents=True,exist_ok=True);(OUT/'geometry.json').write_text(json.dumps(geometry,indent=2)+'\n');manifest['geometrySha256']=sha(OUT/'geometry.json')
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (ROOT/'sprotel-art.js').write_text('/* Generated by tools/import-sprotel-assets.py. Native generated pixels only. */\nglobalThis.ArcadeSprotelArt = '+json.dumps(manifest,separators=(',',':'))+';\n')
    hitboxes=ROOT/'sprite-hitboxes.js';text=hitboxes.read_text();begin='// BEGIN SPROTEL PAGED GEOMETRY';end='// END SPROTEL PAGED GEOMETRY'
    block=begin+'\nSPRITE_HITBOXES.stages[14] = '+json.dumps(geometry,separators=(',',':'))+';\n'+end
    if begin in text:text=text[:text.index(begin)]+block+text[text.index(end)+len(end):]
    else:text=text.replace('\nfunction spriteHitboxFinite', '\n'+block+'\n\nfunction spriteHitboxFinite')
    hitboxes.write_text(text)
    print(json.dumps({'complete':manifest['complete'],'bossAnimations':[list(x) for x in manifest['phaseAnimations']], 'projectiles':list(manifest['projectileAnimations']),'missing':missing,'invalidSources':invalid},indent=2))

if __name__=='__main__':main()
