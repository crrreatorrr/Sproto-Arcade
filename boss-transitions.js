/* Browser presentation for the approved five-second Phase 1 to Phase 2 clips. */
globalThis.ArcadeBossTransitions = (() => {
  const layouts = {
    // [cell width, source scale, P1 source origin, P2 source origin, atlas cache pin]
    1:[400,0.580078125,[13,-25],[21,-38],"dfdfec5aad00"],
    2:[400,0.55,[30,-28],[30,23],"d917801b0c9f"],
    3:[400,0.57,[23,-38],[3,24],"0ee9d775b78e"],
    4:[400,0.61,[26,-56],[1,-57],"e37a7363155d"],
    5:[400,0.52,[39,-7],[25,-6],"507fed97a2c5"],
    6:[384,0.53515625,[31,-21],[52,-18],"95f3172eaa15"],
    7:[384,0.53515625,[87,-21],[116,-21],"38581830c494"],
    8:[384,0.53515625,[31,-21],[40,-20],"92aea2bd516b"],
    9:[384,0.490234375,[74,2],[80,2],"960e6a38faed"],
    10:[400,0.515,[64,-29],[65,-16],"94ad018ecf02"],
    11:[400,0.55,[68,-25],[61,-24],"5e37402e14e8"],
    12:[400,0.465,[70,22],[75,22],"2192640ea897"],
    13:[400,0.55,[54,-29],[55,-35],"a66eca8b182b"],
  };
  const cellHeight=288, columns=10, count=100;
  const duration=300; // 60 presentation steps per second, three steps per authored frame.
  const assets=Object.fromEntries(Object.entries(layouts).map(([id,[width,scale,first,last,version]])=>[
    id,{path:globalThis.ArcadeBossSheets.entry(id).folder, width,scale,origins:[first,last],version}
  ]));
  for (const asset of Object.values(assets)) asset.path='art/generated/bosses/'+asset.path+'/phase-transition.png';

  const cache=new Map();
  const idOf=id=>Number.parseInt(id,10);
  const progress=elapsed=>elapsed/(duration-1);
  const assetPaths=()=>Object.values(assets).map(asset=>asset.path);
  function settled(id) {
    id=idOf(id);
    return !assets[id]||cache.get(id)?.done===true;
  }
  function getImage(id) { return cache.get(idOf(id))?.image??null; }
  function preload(id) {
    id=idOf(id);
    const asset=assets[id];
    if (!asset) return Promise.resolve();
    const existing=cache.get(id);
    if (existing?.pending||existing?.image) {
      cache.delete(id);
      cache.set(id,existing);
      return existing.pending??Promise.resolve();
    }
    // Keep the selected encounter plus one recent atlas decoded. A full atlas can
    // use over 40 MB of memory even though its PNG is much smaller.
    const entry={done:false,pending:null,image:null};
    cache.delete(id);
    cache.set(id,entry);
    if (cache.size>2) cache.delete(cache.keys().next().value);
    const image=new Image();
    image.src=asset.path+'?v='+asset.version;
    entry.pending=image.decode().then(()=>{
      if (image.naturalWidth===asset.width*columns&&image.naturalHeight===cellHeight*columns) entry.image=image;
    }).catch(()=>{}).finally(()=>{entry.done=true;entry.pending=null;});
    return entry.pending;
  }

  function createClock() {
    let owner=null,elapsed=0,simulationSteps=0;
    function reset() {owner=null;elapsed=0;simulationSteps=0;}
    return {
      reset,
      step(active,id,steps) {
        if (!steps) {reset();return true;}
        if (owner!==active) {
          if (!getImage(id)) return true;
          owner=active;
          elapsed=0;
          simulationSteps=steps;
        }
        // Preserve the exact count and order of the game's verified transition
        // ticks. The extra beats only advance this browser presentation clock.
        const before=Math.floor(elapsed*simulationSteps/duration);
        elapsed++;
        return Math.floor(elapsed*simulationSteps/duration)>before;
      },
      position(active) { return owner===active?Math.min(elapsed,duration-1):null; }
    };
  }

  function placement(clip,id,phase,box) {
    const bounds=globalThis.ArcadeBossSheets.entry(id).phases[phase].bounds;
    const d=spriteAtlasDestinationRect(bounds,bounds,box,box.anchor==='center');
    const [ox,oy]=clip.origins[phase],flip=box.flip?-1:1;
    const sx=d.w/bounds[2], sy=d.h/bounds[3];
    return {
      x:box.x+box.w/2+flip*(d.x+((clip.width/2-ox)/clip.scale-bounds[0])*sx),
      y:box.y+box.h/2+d.y+((cellHeight/2-oy)/clip.scale-bounds[1])*sy,
      sx:sx/clip.scale,sy:sy/clip.scale,flip
    };
  }
  function mix(a,b,t){return a+(b-a)*t;}
  function draw(ctx,id,elapsed,from,to) {
    if (elapsed===null||!from||!to) return false;
    const img=getImage(id),clip=assets[idOf(id)];
    if (!img) return false;
    const frame=Math.min(count-1,Math.floor(elapsed/3));
    const t=progress(elapsed),p=t*t*(3-2*t);
    const a=placement(clip,id,0,from),b=placement(clip,id,1,to);
    const turn=a.flip===b.flip?1:Math.max(.26,Math.min(1,Math.abs(t-.5)*15));
    const flip=t<.5?a.flip:b.flip;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(mix(a.x,b.x,p)),Math.round(mix(a.y,b.y,p)));
    ctx.scale(flip*turn,1);
    const w=clip.width*mix(a.sx,b.sx,p),h=cellHeight*mix(a.sy,b.sy,p);
    ctx.drawImage(img,(frame%columns)*clip.width,Math.floor(frame/columns)*cellHeight,clip.width,cellHeight,
      -Math.round(w/2),-Math.round(h/2),Math.round(w),Math.round(h));
    ctx.restore();
    return true;
  }

  const trials=new WeakMap();
  function setTrial(world,elapsed,incoming) {
    if (elapsed===null) {trials.delete(world);return;}
    trials.set(world,{elapsed,incoming});
  }
  function drawTrial(ctx,w,box) {
    if (w.state!=='transition') return false;
    const trial=trials.get(w);
    if (!trial) return false;
    const next=trial.incoming, target=globalThis.ArcadeBossSheets.machineBox(next);
    if (!target) return false;
    const fit=(position,size,camera,view)=>camera+Math.min(view-size*.75,Math.max(-size*.25,position-camera));
    const from={...box,x:fit(box.x,box.w,w.camera.x,1280),y:fit(box.y,box.h,w.camera.y,720)};
    const rebased={...target,x:target.x-next.camera.x+w.camera.x,y:target.y-next.camera.y+w.camera.y};
    // Some routes spawn far from the Phase 2 boss. Let it finish transforming
    // at the current encounter rather than flying offscreen to a future room.
    const to={
      ...rebased,x:rebased.x>=w.camera.x+1280||rebased.x+rebased.w<=w.camera.x?from.x:fit(rebased.x,rebased.w,w.camera.x,1280),
      y:rebased.y>=w.camera.y+720||rebased.y+rebased.h<=w.camera.y?from.y:fit(rebased.y,rebased.h,w.camera.y,720)
    };
    return draw(ctx,w.stage.id,trial.elapsed,from,to);
  }
  return {assetPaths,createClock,draw,drawTrial,preload,progress,setTrial,settled};
})();
