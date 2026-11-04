#!/usr/bin/env python3
"""Package nine local gameplay-reference candidates; never generates or edits raster art."""
import argparse,base64,hashlib,html,json,struct,textwrap,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
P=argparse.ArgumentParser();P.add_argument('--source-root',type=Path,default=ROOT);P.add_argument('--expected-build');args=P.parse_args()
review=args.source_root/'art/rework/review';report=json.loads((review/'report.json').read_text())
if args.expected_build and not report['build'].startswith(args.expected_build):raise SystemExit('Capture report build differs from expected source')
if report.get('workingTree','').strip():raise SystemExit('Reference candidates require captures from a clean source build')
STAGES=['02-last-light','03-mudline','04-ranch','05-neon','06-circuit','08-crown','09-hatchery','10-verse','12-codebreak']
def tx(s,x,y,size=16,fill='#e8eded'):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}">{html.escape(str(s))}</text>'
def wrapped(s,x,y,width=85,size=16,color='#c2d0d6',line=25,maxlines=None):
 lines=textwrap.wrap(str(s),width=width) or [''];lines=lines if maxlines is None else lines[:maxlines]
 return ''.join(tx(t,x,y+i*line,size,color) for i,t in enumerate(lines))
def parse_manifest(path):return json.loads(path.read_text().split('Arcade.registerAssets(',1)[1].rsplit(');',1)[0])
def overlay(info):
 cam=info['camera'];p=info.get('pilot');s=''
 if p:
  x,y=p['x']-cam['x'],p['y']-cam['y'];h=info.get('pilotHeight',82)
  s+=f'<path d="M{x-18:.3f} {y:.3f}h36 M{x:.3f} {y-18:.3f}v36 M{x-13:.3f} {y-h:.3f}h26" stroke="#ffa9df" stroke-width="3" fill="none"/>'+tx('P',x+21,y-8,18,'#ffa9df')
 for i,t in enumerate(info['targets']):
  x,y=t['x']-cam['x'],t['y']-cam['y']
  s+=f'<rect x="{x:.3f}" y="{y:.3f}" width="{t["w"]}" height="{t["h"]}" fill="none" stroke="#85ffe0" stroke-width="3" stroke-dasharray="8 5"/>'+tx('T'+str(i+1),x+4,y+20,16,'#85ffe0')
 return s
def image(info,x,y,scale):
 return f'<g transform="translate({x},{y}) scale({scale})"><image href="{info["dataUri"]}" x="0" y="0" width="1280" height="720" preserveAspectRatio="none"/>'+overlay(info)+'</g>'
def anchor_text(info):
 p=info.get('pilot');cam=info['camera'];result=[]
 if p:result.append('P pilot feet world '+str(round(p['x'],1))+', '+str(round(p['y'],1))+'; height '+str(info['pilotHeight'])+'px')
 else:result.append('P pilot not separately captured; do not invent an anchor')
 result.append('Diagnostic camera world '+str(round(cam['x'],1))+', '+str(round(cam['y'],1))+'; overlay = world minus camera')
 if not info['targets']:result.append('No damage target in this route sample; progression is route/objective based')
 for i,t in enumerate(info['targets']):result.append('T'+str(i+1)+' '+t['id']+': world '+','.join(str(round(t[k],1)) for k in ['x','y','w','h'])+'; '+('OPEN' if t.get('open') else 'closed'))
 return result
for sid in STAGES:
 rows=sorted([r for r in report['rows'] if r['id']==sid],key=lambda r:r['phase']);assert len(rows)==2
 infos=[]
 for row in rows:
  sample=row['samples'][-1];pngname=row.get('reviewKeyframe',sid+'-p'+str(row['phase'])+'.png');raw=(review/pngname).read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n'
  w,h=struct.unpack('>II',raw[16:24]);cam=row.get('diagnosticBossFrame',{}).get('camera',sample['camera'])
  infos.append({'phase':row['phase'],'tick':sample['tick'],'machine':sample['machine'],'signature':sample['signature'],'pilot':sample.get('pilot'),'pilotHeight':sample.get('pilotHeight',82),'targets':sample.get('targets',[]),'camera':cam,'critical':row.get('review',{}).get('criticalPoseRecommendation','Review authored cue / release / recovery in stage timing before approval'),'cue':sample.get('cue',''),'source':'../../review/'+pngname,'sourcePixels':[w,h],'sha256':hashlib.sha256(raw).hexdigest(),'dataUri':'data:image/png;base64,'+base64.b64encode(raw).decode()})
 folder=ROOT/'art/rework/bosses'/sid;m=parse_manifest(folder/'manifest.js')
 header='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="{height}" viewBox="0 0 1280 {height}"><rect width="1280" height="{height}" fill="#102432"/><g font-family="system-ui,sans-serif">'
 common=tx('GAMEPLAY REFERENCE CANDIDATE',32,42,27,'#8af2d5')+tx('LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING',32,77,23,'#edcd90')+tx(rows[0]['title']+' / '+rows[0]['operator'],32,115,24)+tx('Clean source '+report['build'][:12]+' · actual production clips 0 · no generation or credit spend',32,147,15,'#b1c3cd')
 # Side-by-side contact sheet; full native viewport guide is provided separately.
 s=header.format(height=1420)+common
 for i,info in enumerate(infos):
  x=32+i*624
  s+=tx('PHASE '+str(i+1)+' / '+info['machine'],x,193,22)+image(info,x,214,.4625)
  s+=tx('CRITICAL POSE CANDIDATE',x,578,16,'#edcd90')+wrapped(info['critical'],x,607,width=62,size=16,line=24,maxlines=9)
  y=840;s+=tx('ANCHORS / SAMPLED STATE',x,y,16,'#8af2d5')
  for line in anchor_text(info):s+=wrapped(line,x,y+29,width=64,size=14,line=22,maxlines=2);y+=52
  s+=wrapped('Source '+info['source']+'; last neutral sample tick '+str(info['tick']),x,1275,width=66,size=14,line=22)
 s+=tx('These are captured placeholder frames with review overlays, not final concept art or approved animation.',32,1365,17,'#edcd90')+tx('Look development still needs both machine silhouettes, operator articulation, transformation and terminal poses.',32,1394,15,'#b1c3cd')+'</g></svg>'
 ET.fromstring(s);(folder/'reference.svg').write_text(s)
 # Two full 1280x720 viewport images, with notes outside the image bounds.
 s=header.format(height=2320)+common
 for i,info in enumerate(infos):
  titley=190+i*1060;iy=titley+28
  s+=tx('PHASE '+str(i+1)+' / '+info['machine']+' / sample tick '+str(info['tick']),32,titley,25)+image(info,0,iy,1)
  y=iy+748;s+=tx('P = pilot feet/top guide · T = sampled target rectangle · mint target overlays do not imply an earned opening',32,y,17,'#8af2d5')
  s+=wrapped('Critical poses: '+info['critical'],32,y+31,width=135,size=16,line=24,maxlines=4)
  anchors=anchor_text(info)
  s+=wrapped(' | '.join(anchors),32,y+135,width=141,size=14,line=21,maxlines=4)
  s+=tx('Source '+info['source']+' · camera-framed diagnostic, not a normal-route or earned-clear claim',32,y+240,14,'#b1c3cd')
 s+=tx('Human timing, cue readability, silhouette and terminal-animation signoff remain pending. Actual production clips: 0.',32,2285,17,'#edcd90')+'</g></svg>'
 ET.fromstring(s);(folder/'gameplay-scale.svg').write_text(s)
 m['reference']={'path':str((folder/'reference.svg').relative_to(ROOT)),'width':1280,'height':1420,'pivot':[0,0]}
 m['gameplayReview']={'path':str((folder/'gameplay-scale.svg').relative_to(ROOT)),'width':1280,'height':2320,'viewport':[1280,720]}
 m['referenceStatus']='gameplay-reference-candidate-lookdev-pending'
 m['sourceKind']='planned-motion-inventory-with-embedded-gameplay-reference'
 m['captureEvidence']={'report':'art/rework/review/report.json','build':report['build'],'sourceWorkingTreeClean':True,'sampling':report['sampling'],'rasterOperation':'original PNG bytes embedded unchanged; no image editing or generation','phases':[{k:v for k,v in info.items() if k not in ['dataUri','critical']} for info in infos],'humanSignoff':False}
 m['referenceAnchors']={str(info['phase']):{'space':'world','pilot':info['pilot'],'pilotHeight':info['pilotHeight'],'targets':info['targets'],'projectionCamera':info['camera'],'sampleTick':info['tick'],'diagnosticOnly':True} for info in infos}
 (folder/'manifest.js').write_text('/* Gameplay references and inventory remain unapproved candidates. */\nArcade.registerAssets('+json.dumps(m,indent=2)+');\n')
 p=folder/'source-record.md';old=p.read_text();marker='\n## Captured gameplay reference guide';old=old.split(marker)[0]
 old+=marker+'\n\n`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.\n\n'
 old+='Source report: `art/rework/review/report.json`, clean build `'+report['build']+'`. Original source images: '+', '.join('`'+i['source']+'`' for i in infos)+'. The last neutral sample is paired with the report\'s diagnostic boss-framing camera. Overlay pilot feet/top and target bounds use world coordinates minus that diagnostic camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.\n\n'
 old+='The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report\'s source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.\n\n'
 old+='Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.\n'
 old=old.replace('Reference artwork and gameplay-scale pose boards have not yet been created for this pack. Its inventory does not imply visual, timing or pose approval.','Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.')
 old=old.replace('reference boards for the other nine remain pending.','the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending.')
 p.write_text(old)
print('Nine packs / 18 phase guides created from clean '+report['build']+'; embedded original PNG bytes, actual production clips 0')
