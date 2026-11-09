/* Controller mapping against the games' real keyboard input. Each pad button is pushed through
 * gamepad.js's layout and then through the page's own keyboard reader (game.js readKeyboardFrame
 * for story mode, rework.js input() for Machine Trials), so the pinned layout is checked against
 * what the simulation would actually receive. Also: every gameplay action except instant retry is
 * reachable, Home is never bound, the pages load gamepad.js with a current cache hash, and the
 * on-screen controller prompts agree with the layout. Node only; the browser smoke is
 * qa/gamepad-browser.mjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pad=vm.createContext({});vm.runInContext(read('gamepad.js'),pad);
const G=pad.SprotoGamepad,{BUTTON,PROFILES}=G;
const NAMES=Object.keys(BUTTON);
const snap=names=>{const b=new Array(17).fill(false);for(const n of names)b[BUTTON[n]]=true;return{connected:true,buttons:b,stick:{x:0,y:0,magnitude:0}};};
const truthy=o=>Object.keys(o).filter(k=>o[k]===true).sort();
let cases=0;

// Story mode: game.js's own per-tick reader, fed the keys the pad holds this frame.
const game=read('game.js');
const storyReader=['const active','const tapped','const NO_INPUT','function readKeyboardFrame'].map(start=>{
 const at=game.indexOf(start);assert.ok(at>=0,'game.js still has '+start);
 const end=start.startsWith('function')?game.indexOf('\n}\n',at)+2:game.indexOf(';\n',at)+1;return game.slice(at,end);
}).join('\n');
const controls=new Set(JSON.parse(game.match(/const controls = new Set\((\[[^\]]*\])\)/)[1].replace(/'/g,'"')));
const storyScope=vm.createContext({keys:new Set(),pressed:new Set()});vm.runInContext(storyReader+';globalThis.read=readKeyboardFrame;globalThis.fields=Object.keys(NO_INPUT);',storyScope);
function storyActions(names,flying=false){
 const codes=G.gameplayCodes(snap(names),PROFILES.story,{flying});
 for(const code of codes)assert.ok(controls.has(code),`story pad code ${code} is a key game.js accepts`);
 storyScope.keys=new Set(codes);storyScope.pressed=new Set(codes);
 return truthy(vm.runInContext('read()',storyScope));
}
const storyLayout={A:['jump','jumpHeld'],B:['dash'],RT:['dash'],X:['shield'],LT:['shield'],Y:['missile'],RB:['bomb'],
 UP:['jump','jumpHeld','up'],DOWN:['down'],LEFT:['left'],RIGHT:['right'],LB:[],VIEW:[],MENU:[],L3:[],R3:[],HOME:[]};
const storyReached=new Set();
for(const name of NAMES){
 const got=storyActions([name]);assert.deepEqual(got,[...storyLayout[name]].sort(),`story ${name}`);got.forEach(a=>storyReached.add(a));cases++;
}
assert.deepEqual([...storyReached].sort(),[...storyScope.fields].sort(),'every story action has a controller button');
assert.equal(PROFILES.story.pause,'Escape');assert.ok(/e\.code==='Escape'\)\s*pause\(\)/.test(game),'game.js pauses on Escape');

// Machine Trials: rework.js's own reader, including the remappable dash key.
const rework=read('rework.js');
const trialsReader=rework.match(/const actions=\{[^;]*\};/)[0]+'\n'+rework.match(/function input\(\)\{.*?return i;\}/)[0];
const trialsScope=vm.createContext({held:new Set(),press:new Set(),dashKey:'ShiftLeft'});vm.runInContext(trialsReader+';globalThis.read=input;globalThis.actionNames=Object.keys(actions);',trialsScope);
function trialsActions(names,dashKey='ShiftLeft'){
 const codes=G.gameplayCodes(snap(names),PROFILES.trials,{dashCode:dashKey});
 trialsScope.held=new Set(codes);trialsScope.press=new Set(codes);trialsScope.dashKey=dashKey;
 return truthy(vm.runInContext('read()',trialsScope));
}
const trialsLayout={A:['jump'],B:['dash'],RT:['dash'],X:['shield'],LT:['shield'],Y:['beam'],RB:['bomb'],LB:['power'],VIEW:['replace'],
 UP:['up'],DOWN:['down'],LEFT:['left'],RIGHT:['right'],MENU:[],L3:[],R3:[],HOME:[]};
const trialsReached=new Set();
for(const name of NAMES){
 const got=trialsActions([name]);assert.deepEqual(got,[...trialsLayout[name]].sort(),`trials ${name}`);got.forEach(a=>trialsReached.add(a));cases++;
}
assert.deepEqual(trialsActions(['B'],'KeyQ'),['dash'],'a remapped dash key still dashes from the pad');
assert.deepEqual(trialsActions(['RT'],'KeyQ'),['dash']);cases+=2;
const trialsFields=['left','right','up','down','dash',...trialsScope.actionNames].filter(a=>a!=='retry').sort();
assert.deepEqual([...trialsReached].sort(),trialsFields,'every trials action but instant retry has a controller button');
assert.ok(!trialsReached.has('retry'),'instant retry (R) stays off the pad; game over offers a Retry button');
assert.ok(/e\.code==='Escape'&&!e\.repeat/.test(rework),'rework.js pauses on Escape');

// Layout hygiene from the shared convention.
for(const profile of Object.values(PROFILES)){
 assert.ok(!('HOME' in profile.buttons),'Home is never bound');
 assert.ok(!('MENU' in profile.buttons),'Menu is the pause tap only');
}

// Pages: profile, load order and cache hash; on-screen prompts match the layout.
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex').slice(0,12);
for(const [page,profile,after] of [['legacy.html','story','game.js'],['index.html','trials','rework.js']]){
 const html=read(page);
 const tag=html.match(/<script src="gamepad\.js\?v=([0-9a-f]+)" data-profile="([a-z]+)"><\/script>/);
 assert.ok(tag,`${page} loads gamepad.js with a profile`);
 assert.equal(tag[2],profile,`${page} uses the ${profile} layout`);
 assert.equal(tag[1],hash('gamepad.js'),`${page} gamepad.js cache hash is current`);
 assert.ok(html.indexOf(`src="${after}?v=`)<html.indexOf('src="gamepad.js'),`${page} loads gamepad.js after ${after}`);
 const help=html.match(/<div id="pad-help"[^>]*>(.*?)<\/div>/)[1].replace(/<[^>]+>/g,' ');
 for(const name of Object.keys(PROFILES[profile].buttons)){const label={VIEW:'View'}[name]||name;assert.ok(new RegExp(`\\b${label}\\b`).test(help),`${page} controller help names ${label}`);}
 assert.ok(/\bStart\b/.test(help),`${page} controller help names Start`);
}
for(const page of ['index.html','controlled-stage-review.html']){const m=read(page).match(/rework\.js\?v=([0-9a-f]+)/);assert.equal(m[1],hash('rework.js'),`${page} rework.js cache hash is current`);}
// Story weapons bar and Trials canvas labels swap to the button that sends that key.
const storyPad=Object.fromEntries(Object.entries(PROFILES.story.buttons).map(([b,codes])=>[codes[0],b]));
for(const [,key,label] of read('legacy.html').matchAll(/<b data-pad="([A-Z]+)">([A-Z])<\/b>/g))assert.equal(storyPad['Key'+label],key,`story prompt ${label} shows ${key}`);
const padLabel=JSON.parse(rework.match(/const PAD_LABEL=(\{[^}]*\})/)[1].replace(/(\w+):/g,'"$1":').replace(/'/g,'"'));
const trialsPad=Object.fromEntries(Object.entries(PROFILES.trials.buttons).filter(([b])=>b!=='RT'&&b!=='LT').map(([b,codes])=>[codes[0].replace(/^Key/,'').replace('$dash','dash'),b]));
for(const [key,label] of Object.entries(padLabel))assert.equal(trialsPad[key],label,`trials canvas prompt ${key} shows ${label}`);
console.log(`PASS ${cases} controller button cases through game.js and rework.js readers; every action but retry reachable; pages, cache hashes and prompts agree`);
