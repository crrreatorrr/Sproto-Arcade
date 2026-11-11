/* Story-mode audio: synthesised effects and music. Browser only and presentation only: the
 * simulation calls sound(freq, end, length, volume) and never reads anything back, and the server
 * build replaces sound() with a stub. No audio files; everything is Web Audio oscillators and
 * filtered noise. Volume and mute are saved in localStorage (sproto-arcade-audio-v1). */
(function(root){
  'use strict';
  const STORAGE_KEY='sproto-arcade-audio-v1';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const settings={volume:.8,muted:false};
  try{
    const saved=JSON.parse(root.localStorage?.getItem(STORAGE_KEY)??'null');
    if(saved&&typeof saved==='object'){
      if(Number.isFinite(saved.volume))settings.volume=clamp(saved.volume,0,1);
      settings.muted=saved.muted===true;
    }
  }catch{/* storage refused: defaults for this visit */}
  const listeners=new Set();
  let ctx=null,master=null,sfxBus=null,musicBus=null,noiseBuffer=null;
  const level=()=>settings.muted?0:settings.volume;
  function save(){
    try{root.localStorage?.setItem(STORAGE_KEY,JSON.stringify(settings));}catch{/* storage refused */}
    if(master)master.gain.setTargetAtTime(level(),ctx.currentTime,.02);
    for(const fn of listeners)fn({...settings});
  }
  // Called with the page's AudioContext, which exists only after the first click on Start.
  function attach(audio){
    if(!audio||ctx===audio)return Boolean(ctx);
    ctx=audio;
    master=ctx.createGain();master.gain.value=level();
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-10;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.15;
    master.connect(limiter).connect(ctx.destination);
    sfxBus=ctx.createGain();sfxBus.gain.value=1.5;sfxBus.connect(master);
    musicBus=ctx.createGain();musicBus.gain.value=MUSIC_LEVEL;musicBus.connect(master);
    noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const data=noiseBuffer.getChannelData(0);
    // A fixed generator, so the noise is the same on every load. Never shared with the game.
    let s=0x2f6e2b1;
    for(let i=0;i<data.length;i++){s^=s<<13;s^=s>>>17;s^=s<<5;data[i]=((s>>>0)/2147483648)-1;}
    return true;
  }
  function tone(bus,{type='triangle',from,to=from,length,volume,at=0,attack=.004,cutoff=0}){
    const start=ctx.currentTime+at,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,from),start);
    if(to!==from)osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+length);
    gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(volume,start+attack);
    gain.gain.exponentialRampToValueAtTime(.0005,start+length);
    let node=osc;
    if(cutoff){const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cutoff;node=osc.connect(filter);}
    node.connect(gain).connect(bus);osc.start(start);osc.stop(start+length+.02);
  }
  function noise(bus,{length,volume,from=3000,to=from,type='lowpass',q=.8,at=0}){
    const start=ctx.currentTime+at,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=noiseBuffer;source.loop=true;
    filter.type=type;filter.Q.value=q;filter.frequency.setValueAtTime(from,start);
    if(to!==from)filter.frequency.exponentialRampToValueAtTime(Math.max(30,to),start+length);
    gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.0005,start+length);
    source.connect(filter).connect(gain).connect(bus);source.start(start,(start*7919)%1);source.stop(start+length+.02);
  }
  // ---- Effects, keyed by the (freq, end) pair each call site in game.js and codebreak.js passes.
  // `l` is the call's length in seconds and `v` its volume, so the mix between call sites is kept.
  const zap=(l,v,from,to)=>{tone(sfxBus,{type:'sawtooth',from,to,length:l,volume:v*.7,cutoff:3200});tone(sfxBus,{type:'square',from:from*1.5,to:to*1.5,length:l*.6,volume:v*.25,cutoff:2600});};
  const thud=(l,v,from,to)=>{tone(sfxBus,{type:'sine',from,to,length:l*1.2,volume:v*1.1});noise(sfxBus,{length:l*.9,volume:v*.8,from:900,to:90});};
  const launch=(l,v,from,to)=>{tone(sfxBus,{type:'sawtooth',from,to,length:l,volume:v*.6,cutoff:1800});noise(sfxBus,{length:l,volume:v*.7,from:700,to:2600,type:'bandpass',q:1.2});};
  const VOICES={
    // Player
    '500:250':(l,v)=>tone(sfxBus,{type:'square',from:640,to:300,length:l,volume:v*.8,cutoff:2400}),
    '195:400':(l,v)=>tone(sfxBus,{type:'sine',from:210,to:470,length:l,volume:v*1.1}),
    '470:155':(l,v)=>{noise(sfxBus,{length:l,volume:v*1.3,from:2600,to:500,type:'bandpass',q:1.4});tone(sfxBus,{type:'sine',from:470,to:155,length:l,volume:v*.5});},
    '480:850':(l,v)=>{tone(sfxBus,{type:'sine',from:480,to:850,length:l*1.6,volume:v});tone(sfxBus,{type:'sine',from:720,to:1275,length:l*1.6,volume:v*.55,at:.02});tone(sfxBus,{type:'triangle',from:960,to:1700,length:l,volume:v*.3,at:.04});},
    '590:860':(l,v)=>launch(l*1.5,v*1.2,300,900),
    '260:430':(l,v)=>tone(sfxBus,{type:'sine',from:240,to:460,length:l*1.2,volume:v*1.3}),
    '260:630':(l,v)=>{tone(sfxBus,{type:'sine',from:230,to:650,length:l*1.2,volume:v*1.2});tone(sfxBus,{type:'triangle',from:460,to:1300,length:l*.7,volume:v*.3});},
    '215:560':(l,v)=>zap(l*1.2,v*1.2,215,620),
    '750:970':(l,v)=>{tone(sfxBus,{type:'square',from:990,length:l*.6,volume:v*.8,cutoff:4200});tone(sfxBus,{type:'square',from:1320,length:l*1.1,volume:v*.8,at:l*.5,cutoff:4200});},
    '135:47':(l,v)=>{tone(sfxBus,{type:'square',from:190,to:48,length:l*1.3,volume:v*.8,cutoff:900});noise(sfxBus,{length:l,volume:v,from:1400,to:120});},
    // Boss attacks
    '102:42':(l,v)=>thud(l,v,110,40),
    '97:38':(l,v)=>thud(l*1.2,v,100,36),
    '170:72':(l,v)=>thud(l,v,170,70),
    '380:65':(l,v)=>{zap(l,v,380,65);noise(sfxBus,{length:l*.7,volume:v*.5,from:2000,to:300});},
    '138:65':(l,v)=>thud(l,v,138,60),
    '190:68':(l,v)=>launch(l,v*1.2,190,70),
    '340:110':(l,v)=>zap(l,v,340,110),
    '570:130':(l,v)=>{zap(l,v,570,130);noise(sfxBus,{length:l*1.4,volume:v*.6,from:5000,to:600,type:'bandpass',q:.6});},
    '940:150':(l,v)=>zap(l,v,940,150),
    '890:185':(l,v)=>{zap(l,v,890,185);tone(sfxBus,{type:'sine',from:1780,to:370,length:l*.5,volume:v*.35});},
    '320:730':(l,v)=>{tone(sfxBus,{type:'sine',from:320,to:730,length:l,volume:v});tone(sfxBus,{type:'triangle',from:640,to:1460,length:l,volume:v*.4});},
    // Mandatory mechanics and set pieces
    '300:62':(l,v)=>{tone(sfxBus,{type:'sawtooth',from:300,to:62,length:l*1.3,volume:v*.7,cutoff:1500});noise(sfxBus,{length:l*1.5,volume:v*.7,from:3000,to:200,type:'bandpass',q:.7});},
    '230:44':(l,v)=>{tone(sfxBus,{type:'sawtooth',from:230,to:44,length:l,volume:v*.7,cutoff:1200});noise(sfxBus,{length:l*1.2,volume:v*.9,from:2400,to:70});tone(sfxBus,{type:'sine',from:90,to:36,length:l*1.3,volume:v});},
    '235:900':(l,v)=>{tone(sfxBus,{type:'sawtooth',from:235,to:900,length:l,volume:v*.5,cutoff:2600});tone(sfxBus,{type:'sine',from:470,to:1800,length:l,volume:v*.4});noise(sfxBus,{length:l,volume:v*.4,from:400,to:5000,type:'bandpass'});},
    '310:70':(l,v)=>{tone(sfxBus,{type:'sawtooth',from:310,to:70,length:l,volume:v*.6,cutoff:1400});noise(sfxBus,{length:l,volume:v*.6,from:1800,to:100});},
    '165:38':(l,v)=>{tone(sfxBus,{type:'sine',from:165,to:38,length:l,volume:v});noise(sfxBus,{length:l,volume:v,from:2600,to:60});noise(sfxBus,{length:l*.4,volume:v*.6,from:6000,to:900,type:'highpass',at:.03});}
  };
  /** The body of game.js's sound(). Returns false when the caller should use its own oscillator. */
  function sfx(audio,freq,end,length,volume){
    if(!attach(audio)||ctx.state!=='running')return false;
    const voice=VOICES[freq+':'+end];
    if(voice)voice(length,volume);
    // Unlisted pairs (the arena hazards' level-dependent pitch) keep the original sweep, on the bus.
    else tone(sfxBus,{type:'triangle',from:freq,to:end,length,volume,attack:.001});
    return true;
  }

  // ---- Music: a 16-step sequencer, four tracks, each with a phase-two form.
  const MUSIC_LEVEL=.5,DUCKED=.16;
  const SCALES={dorian:[0,2,3,5,7,9,10],minor:[0,2,3,5,7,8,10],phrygian:[0,1,3,5,7,8,10],mixolydian:[0,2,4,5,7,9,10]};
  // root: MIDI note of the bass. chords: scale degrees, one per bar. bass and lead: scale steps
  // above the bar's chord per 16th note ('.' rests). drums: k kick, s snare, h hat.
  const TRACKS=[
    {name:'harbour',root:38,scale:'dorian',bpm:108,chords:[0,3,5,4],
      bass:'0...0..7....0.7.',lead:'..4.....2...4.5.',drums:'k.h.s.h.k.hks.h.'},
    {name:'neon',root:40,scale:'minor',bpm:118,chords:[0,5,3,6],
      bass:'0.0.7.0.0.0.7.5.',lead:'4...7...4...2...',drums:'k.h.s.hhk.h.s.hh'},
    {name:'flight',root:36,scale:'mixolydian',bpm:124,chords:[0,4,3,4],
      bass:'0..0..0.7..7..5.',lead:'..7.4.2...7.4.9.',drums:'k.hhs.h.kkh.s.h.'},
    {name:'vault',root:35,scale:'phrygian',bpm:112,chords:[0,1,0,5],
      bass:'0.....0.1.....0.',lead:'7...8...7...4.2.',drums:'k..hs..hk.k.s.hh'}
  ];
  // Level id -> track. The chase and the climb use the faster phase-two forms from the start.
  const LEVEL_TRACKS={1:0,13:0,2:3,3:2,4:0,5:1,6:1,7:2,8:3,9:3,10:1,11:2,12:1};
  const music={timer:0,track:null,phase:1,step:0,next:0,ducked:false};
  const hz=note=>440*Math.pow(2,(note-69)/12);
  function degree(track,chord,step){
    const scale=SCALES[track.scale],index=chord+step;
    return track.root+scale[((index%7)+7)%7]+12*Math.floor(index/7);
  }
  function scheduleStep(track,phase,step,at){
    const bar=Math.floor(step/16)%track.chords.length,i=step%16,chord=track.chords[bar],lift=phase===2?3:0;
    const sixteenth=60/(track.bpm*(phase===2?1.1:1))/4;
    const bass=track.bass[i],lead=track.lead[(i+(phase===2?8:0))%16],drum=track.drums[i];
    if(bass!=='.')tone(musicBus,{type:'triangle',from:hz(degree(track,chord,Number(bass))+lift),length:sixteenth*1.8,volume:.3,at,cutoff:900});
    if(lead!=='.'){
      tone(musicBus,{type:'square',from:hz(degree(track,chord,Number(lead))+24+lift),length:sixteenth*(phase===2?1.4:2.4),volume:.07,at,cutoff:phase===2?2600:1700});
      // Phase two answers each lead note an octave up on the off-beat.
      if(phase===2)tone(musicBus,{type:'square',from:hz(degree(track,chord,Number(lead)+2)+24+lift),length:sixteenth,volume:.04,at:at+sixteenth,cutoff:3000});
    }
    if(i===0)for(const third of [0,2,4])tone(musicBus,{type:'sawtooth',from:hz(degree(track,chord,third)+12+lift),length:sixteenth*15,volume:.035,at,attack:.08,cutoff:1100});
    if(drum==='k'){tone(musicBus,{type:'sine',from:130,to:42,length:.16,volume:.5,at});}
    else if(drum==='s'){noise(musicBus,{length:.13,volume:.22,from:1800,type:'bandpass',q:.7,at});tone(musicBus,{type:'triangle',from:190,to:120,length:.08,volume:.12,at});}
    else if(drum==='h')noise(musicBus,{length:.04,volume:.09,from:7000,type:'highpass',at});
    if(phase===2&&i%4===2&&drum==='.')noise(musicBus,{length:.03,volume:.05,from:8000,type:'highpass',at});
    return sixteenth;
  }
  function pump(){
    if(!ctx||!music.track||ctx.state!=='running')return;
    // After a stall (a hidden tab throttles timers) resume from now instead of catching up.
    if(music.next<ctx.currentTime-.05)music.next=ctx.currentTime+.05;
    while(music.next<ctx.currentTime+.18){
      music.next+=scheduleStep(music.track,music.phase,music.step++,Math.max(0,music.next-ctx.currentTime));
    }
  }
  function startMusic(audio,levelId,phase=1){
    if(!attach(audio))return false;
    const track=TRACKS[LEVEL_TRACKS[levelId]??0];
    music.track=track;music.phase=levelId===11||levelId===12?2:phase===2?2:1;music.step=0;music.next=ctx.currentTime+.08;
    duck(false);
    if(!music.timer)music.timer=root.setInterval(pump,40);
    pump();return true;
  }
  // The next bar picks up the phase-two form.
  function musicPhase(phase){if(music.track&&phase===2&&music.phase!==2){music.phase=2;music.step=Math.ceil(music.step/16)*16;}}
  function duck(on){
    music.ducked=Boolean(on);
    if(musicBus)musicBus.gain.setTargetAtTime(on?DUCKED:MUSIC_LEVEL,ctx.currentTime,.08);
  }
  function stopMusic(){
    if(music.timer){root.clearInterval(music.timer);music.timer=0;}
    music.track=null;
  }

  root.ArcadeAudio={
    sfx,voices:Object.keys(VOICES),tracks:TRACKS.map(track=>track.name),levelTracks:{...LEVEL_TRACKS},
    music:{start:startMusic,phase:musicPhase,duck,stop:stopMusic,get playing(){return music.track?.name??null;},get form(){return music.phase;},get ducked(){return music.ducked;}},
    get volume(){return settings.volume;},
    get muted(){return settings.muted;},
    setVolume(value){settings.volume=clamp(Math.round(Number(value)*20)/20||0,0,1);save();},
    setMuted(value){settings.muted=Boolean(value);save();},
    onChange(fn){listeners.add(fn);fn({...settings});return()=>listeners.delete(fn);}
  };
})(typeof window!=='undefined'?window:globalThis);
