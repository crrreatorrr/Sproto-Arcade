#!/usr/bin/env python3
"""Candidate measurement/publication tests in a temporary repository only."""
import copy,importlib.util,json,tempfile
from pathlib import Path
s=importlib.util.spec_from_file_location('replacement',Path(__file__).with_name('measure-boss-replacement.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
root=m.ROOT;candidate=root.parent/'ranch-transfer';data=m.load_data()
archive=root/'art/reference/archive/20261106-ranch-neon-p1'
boss_path=root/'art/generated/bosses/04-ranch-zephyr/p1.png';ammo_path=root/'art/generated/bosses/04-ranch-zephyr/p1-projectiles.png'
# Committed archive fixtures make the test independent of ignored local work.
previous=json.loads((archive/'original-04-ranch/phase0-geometry.json').read_text());source05=json.loads((archive/'original-05-neon/phase0-geometry.json').read_text())
data['geometry']['4']['0']=previous;data['geometry']['5']['0']=source05
choices={'reviewed':False,'assetHashes':{'bossSha256':m.M.sha(boss_path),'projectilesSha256':m.M.sha(ammo_path)},'expectedPreviousProfileSha256':m.hash_value(previous),'body':[245,270,205,225],'target':[250,410,150,80],'projectileCores':source05['provenance']['projectileCorePixels'],'legacyOffset':[-20,0],'legacyScale':[1.2,1],'facing':'left','preserveAuthoredRules':{}}
with tempfile.TemporaryDirectory(prefix='boss-replacement-') as folder:
 temporary=Path(folder);geometry,report=m.measure(4,boss_path,ammo_path,choices,data,temporary/'draft',temporary/'proof','test')
 assert report['legacyAnchorChecks']['steeringAim']['opaqueInAllFrames'];assert report['legacyAnchorChecks']['groundShotLine']['opaqueInAllFrames'];assert not report['legacyAnchorChecks']['weakHitLine']['opaqueInAllFrames'],'transparent weak-marker point must be reported honestly'
 assert geometry['provenance']['projectileCoreMinimumAlpha']==200;assert geometry['provenance']['reviewedAmmoSource']['stage']==5
 for group in ['projectiles','beams']:
  for key,value in geometry[group].items():
   old=data['geometry']['4']['0'][group][key]
   if 'reference' in old:assert value['visualBox']==old['visualBox'];assert value['reference']!=old['reference']
 bad=copy.deepcopy(choices);bad['assetHashes']['bossSha256']='bad'
 try:m.measure(4,boss_path,ammo_path,bad,data,temporary/'bad',temporary/'bad-proof','test');raise AssertionError('stale candidate hash accepted')
 except ValueError as e:assert 'pin current' in str(e)
 bad=copy.deepcopy(choices);bad['target']=[0,0,512,512]
 try:m.measure(4,boss_path,ammo_path,bad,data,temporary/'bad',temporary/'bad-proof','test');raise AssertionError('crop-exterior target accepted')
 except ValueError as e:assert 'actual candidate common crop' in str(e)
 manifest=copy.deepcopy(data['manifest']);reg=report['candidateManifestRegistration'];manifest['4']['phases'][0].update(path=str(boss_path),legacyOffset=reg['legacyOffset'],legacyScale=reg['legacyScale'],bounds=reg['bounds']);manifest['4']['projectiles'][0].update(path=str(ammo_path),bounds=reg['projectileBounds'],rowBounds=reg['projectileRowBounds'])
 (temporary/'boss-sheets.js').write_text('globalThis.ArcadeBossSheets='+json.dumps({'manifest':manifest})+';');prefix='const SPRITE_HITBOXES='+json.dumps({'stages':data['geometry']})+';\n';(temporary/'sprite-hitboxes.js').write_text(prefix);m.ROOT=temporary
 reviewed={**choices,'reviewed':True};result=m.publish(4,geometry,report,reviewed,data);assert result['allOtherProfilesUnchanged'];assert (temporary/'sprite-hitboxes.js').read_text().startswith(prefix)
 after=m.load_data()['geometry'];expected=copy.deepcopy(data['geometry']);expected['4']['0']=geometry;assert after==expected
print('PASS candidate4P1 actual hash/coverage/aim measurement, honest transparent weakmarker report, old4layout/new5pixels, stale/crop rejection and selected-phase-only atomic publication preserving every other profile (temporary repository)')
