#!/usr/bin/env python3
"""Actual released Redkev pixels must support unchanged aiming/ground-fire anchors."""
import importlib.util,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('redkev_geometry',root/'tools/measure-redkev-geometry.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=m.load_data();profiles=data['geometry']['13'];boxes=json.loads(subprocess.check_output(['node','-e',"require('./boss-sheets.js');console.log(JSON.stringify([0,1].map(phaseIndex=>ArcadeBossSheets.machineBox({stage:{id:'13-redkev'},phaseIndex,data:{}}))));"],cwd=root,text=True))
checked=0
for phase in [0,1]:
    asset=data['manifest']['phases'][phase];assert asset['ready']
    image,path,metadata,C,_=m.load_atlas(asset);p=profiles[str(phase)];assert p['provenance']['bossSha256']==m.sha(path)
    assert p['provenance']['legacyDrawOffset']==asset['legacyOffset'];assert p['provenance']['legacyDrawScale']==asset['legacyScale'];assert p['provenance']['modernDrawBox']==asset['modernBox']
    modern=asset['modernBox'];assert boxes[phase]==dict(zip(['x','y','w','h'],modern));assert modern[1]+modern[3]==600
    ox,oy=asset['legacyOffset'];sx,sy=asset['legacyScale'];legacy=[-190+380*(1-sx)/2+ox,-510.4+498.4*(1-sy)+oy,380*sx,498.4*sy]
    def supported(box,world):
        full=m.project(C,C,box);x=int(C[0]+(world[0]-full[0])*C[2]/full[2]);y=int(C[1]+(world[1]-full[1])*C[3]/full[3])
        for cell in m.cells(image):assert cell.crop((x-2,y-2,x+3,y+3)).getchannel('A').getextrema()==(255,255),'all16 actual frames must paint a full5x5 neighborhood around fixed gameplay anchor'
    for y in [-222,-175,-88]:supported(legacy,[0,y]);checked+=16
    supported(modern,[1095,545]);checked+=16
    body=m.project(C,p['provenance']['bodyCorePixels'],legacy)
    for kind,base in [('damage',[-147,-510.4,294,498.4]),('contact',[-205,-484,410,484])]:
        r=p['boss'][kind]['rect'];actual=[base[0]+r[0]*base[2],base[1]+r[1]*base[3],base[2]*r[2],base[3]*r[3]]
        assert all(abs(x-y)<1e-9 for x,y in zip(body,actual)),'numeric body uses the exact configured Canvas source projection'
    K=p['provenance']['logicalTargetCorePixels'];vent=m.project(C,K,modern);r=p['targets']['marina-vent']['rect'];actual=[1040+r[0]*110,490+r[1]*110,r[2]*110,r[3]*110]
    assert all(abs(x-y)<1e-9 for x,y in zip(vent,actual));assert vent[0]<=1095<=vent[0]+vent[2] and vent[1]<=545<=vent[1]+vent[3]
    ammo=data['manifest']['projectiles'][phase];assert ammo['ready'];projectiles,path,_,_,_=m.load_atlas(ammo);assert p['provenance']['projectilesSha256']==m.sha(path)
    assert ammo['facing']==('right' if phase==0 else 'left')
    for row,K in enumerate(p['provenance']['projectileCorePixels']):
        assert p['projectiles'][f'orb@{row}']['facing']==ammo['facing']
        assert all(cell.crop((K[0],K[1],K[0]+K[2],K[1]+K[3])).getchannel('A').getextrema()==(255,255) for cell in m.cells(projectiles,[row]))
print(f'PASS {checked} actual Redkev5x5 fixed-anchor neighborhoods; source hashes, configured Canvas/body/contact/vent agreement, fixed600baseline, all8 projectile cores and nativeRIGHT/LEFT phases')
