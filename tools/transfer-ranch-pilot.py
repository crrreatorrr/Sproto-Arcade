#!/usr/bin/env python3
"""Candidate-only Halloween cockpit transfer onto genuine packed Collector P1 frames.

python3 tools/transfer-ranch-pilot.py --concept APPROVED.png --output-dir ../ranch-transfer --proof-dir ../../outputs/phase-update-proof

Only the explicit native cockpit polygon is replaced. No vehicle/weapon frames
are copied, invented, retimed, reordered, repacked or activated. Source P1 remains
unchanged. Registration is measured against the old raw cab composition and the
existing final packed cab roof/window/base; all16 packed frames share that cab.
"""
import argparse,copy,hashlib,importlib.util,json
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
EXPECTED_SOURCE_SHA256='9a5d0021dd721732c5d2b6ba3e2d732013fba54f9a8c0ec5d623a7597f792e6e'
POLYGON=[[742,445],[1298,445],[1330,477],[1330,894],[1194,894],[1075,1035],[620,1035],[637,931],[660,760],[684,552],[708,488]]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def union(boxes):
 x=min(b[0] for b in boxes);y=min(b[1] for b in boxes);return[x,y,max(b[2] for b in boxes)-x,max(b[3] for b in boxes)-y]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--concept',type=Path,required=True);p.add_argument('--source-atlas',type=Path,default=ROOT/'art/generated/bosses/05-neon-sproto102/p1.png');p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--proof-dir',type=Path,required=True);a=p.parse_args()
 source=a.source_atlas.resolve();concept=a.concept.resolve();out=a.output_dir.resolve();proof=a.proof_dir.resolve()
 if out.is_relative_to(ROOT/'art') or proof.is_relative_to(ROOT/'art'):p.error('Candidate/proof outputs must remain outside production art')
 out.mkdir(parents=True,exist_ok=True);proof.mkdir(parents=True,exist_ok=True);source_hash=sha(source);concept_hash=sha(concept)
 if source_hash!=EXPECTED_SOURCE_SHA256:raise ValueError('Expected the pinned genuine original05P1 weapon atlas; use its frozen source copy after production5 is replaced')
 frozen=out/'source-05p1-genuine.png';frozen_meta=frozen.with_suffix('.json');frozen_concept=out/'source-approved-halloween-concept.png'
 for original,copy_path in [(source,frozen),(source.with_suffix('.json'),frozen_meta),(concept,frozen_concept)]:
  if original!=copy_path:copy_path.write_bytes(original.read_bytes())
 specification={'polygon':POLYGON,'sourceHorizontalFlip':False,'placements':[{'row':r,'column':c,'scale':.15,'sourceAnchor':[1000,650],'targetAnchor':[300,334]} for r in range(4) for c in range(4)]}
 specpath=out/'cab-placements.json';specpath.write_text(json.dumps(specification,indent=2)+'\n')
 module_spec=importlib.util.spec_from_file_location('cockpit',ROOT/'tools/compose-boss-cockpit.py');composer=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(composer)
 dest=out/'p1-candidate.png';maskpath=out/'cab-replacement-mask.png';composition=composer.compose(frozen_concept,frozen,specpath,dest,maskpath)
 old=Image.open(source).convert('RGBA');image=Image.open(dest).convert('RGBA');mask=Image.open(maskpath).convert('L');difference=ImageChops.difference(old,image)
 if old.size!=(2048,2048) or image.size!=old.size:raise ValueError('Expected genuine packed4x4 2048px source and same-size candidate')
 if any(ImageChops.multiply(channel,ImageChops.invert(mask)).getbbox() for channel in difference.split()):raise ValueError('Candidate changes pixels outside explicit cab mask')
 if sha(source)!=source_hash:raise ValueError('Original P1 was modified')
 metadata=copy.deepcopy(json.loads(source.with_suffix('.json').read_text()));rows=[];checks=[]
 for r in range(4):
  boxes=[]
  for c in range(4):
   box=(c*512,r*512,(c+1)*512,(r+1)*512);frame=image.crop(box);b=frame.getchannel('A').getbbox()
   if not b or min(b[:2])<2 or max(b[2:])>510:raise ValueError(f'Clipped candidate frame{r}/{c}: {b}')
   boxes.append(list(b));metadata['frames'][r*4+c]['cellBounds']=list(b)
   change=difference.crop(box);changed=ImageChops.lighter(ImageChops.lighter(change.getchannel('R'),change.getchannel('G')),ImageChops.lighter(change.getchannel('B'),change.getchannel('A')))
   checks.append({'row':r,'column':c,'cabMaskPixels':sum(v>0 for v in mask.crop(box).tobytes()),'changedPixels':sum(v>0 for v in changed.tobytes()),'outsideCabMaskRgbaByteExact':True,'frameContentReusedFromSameOriginalCell':True})
  rows.append(union(boxes))
 metadata.update(rowBounds=rows,bounds=union([[r[0],r[1],r[0]+r[2],r[1]+r[3]] for r in rows]),source=str(frozen),sourceSha256=source_hash,outputSha256=sha(dest),script=str(Path(__file__).resolve()),scriptSha256=sha(__file__),sampling='same original packed weapon frames; native cockpit patch only, nearest source sampling, no weapon re-registration',productionEnabled=False,releaseAcceptance={'ready':False,'visualReview':'candidate-awaiting-root-review'})
 metadata['pilotTransfer']={'sourceConcept':str(concept),'sourceConceptSha256':concept_hash,'specificationSha256':sha(specpath),'replacementMaskSha256':sha(maskpath),'compositionProof':composition,'originalPackedMetadataSha256':sha(source.with_suffix('.json')),'registrationBasis':{'oldRawCabPlacementFile':'work/art-production/cockpit-compositions/05-neon-sproto102-p1-cab-placements.json','oldRawCabAnchor':[258,210],'oldPackedUnionCrop':metadata.get('unionCrop'),'oldPackedDestinationSize':metadata.get('destinationSize'),'oldPackedOffset':metadata.get('offset'),'newNativeSourceAnchor':[1000,650],'finalPackedAnchor':[300,334],'nearestScale':.15,'alignment':'Existing packed roof/window/base; all16 cab placements were static in original genuine animation.'},'allOutsideCabPixelsRgbaByteExact':True,'originalSourceUntouched':True,'newAnimationFramesGenerated':False,'frames':checks}
 dest.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
 for name,color in [('dark','#14212f'),('light','#e9edf0')]:
  board=Image.new('RGBA',image.size,color);board.alpha_composite(image);board.resize((1280,1280),Image.Resampling.NEAREST).convert('RGB').save(proof/f'ranch-transfer-atlas-{name}.png')
 cabs=Image.new('RGBA',(960,680),'#172330');draw=ImageDraw.Draw(cabs)
 for r in range(4):
  for c in range(4):
   crop=image.crop((c*512+220,r*512+285,c*512+380,r*512+415)).resize((220,178),Image.Resampling.NEAREST);cabs.alpha_composite(crop,(c*240,r*170));draw.text((c*240+4,r*170+3),f'row{r+1} frame{c+1}',fill='white')
 cabs.convert('RGB').save(proof/'ranch-transfer-cabs-all16.png')
 frames=[]
 for col in range(4):
  board=Image.new('RGBA',(1024,1024),'#14212f');d=ImageDraw.Draw(board)
  for row in range(4):
   board.alpha_composite(image.crop((col*512,row*512,(col+1)*512,(row+1)*512)),((row%2)*512,(row//2)*512));d.text(((row%2)*512+16,(row//2)*512+16),['IDLE','WEAPON A','WEAPON B','WEAPON C'][row],fill='white')
  frames.append(board.convert('RGB'))
 frames[0].save(proof/'ranch-transfer-weapons.gif',save_all=True,append_images=frames[1:],duration=180,loop=0,disposal=2)
 changed=ImageChops.lighter(ImageChops.lighter(difference.getchannel('R'),difference.getchannel('G')),ImageChops.lighter(difference.getchannel('B'),difference.getchannel('A')))
 changed.resize((1024,1024),Image.Resampling.NEAREST).save(proof/'ranch-transfer-change-mask.png');mask.resize((1024,1024),Image.Resampling.NEAREST).save(proof/'ranch-transfer-allowed-cab-mask.png')
 report={'status':'candidate-awaiting-root-review','candidate':str(dest),'candidateSha256':sha(dest),'original05P1Sha256BeforeAndAfter':source_hash,'approvedHalloweenConceptSha256':concept_hash,'outsideMaskRgbaByteExact':True,'insideMaskNearestNativeSourceExact':True,'animationFramesGenerated':False,'all16OriginalCellsPreservedOutsideCab':True,'frames':checks,'production4Or5EnabledOrOverwritten':False,'proofs':str(proof)}
 (out/'transfer-proof.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
