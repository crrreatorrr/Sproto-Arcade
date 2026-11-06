/* Independent inventory validation; does not approve semantic motion quality. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..'),base=path.join(root,'art/rework/bosses');
const expected=['01-marina','02-last-light','03-mudline','04-ranch','05-neon','06-circuit','07-moonkeep','08-crown','09-hatchery','10-verse','11-rooftop','12-codebreak'];
const packs=[],globalIds=new Set(),hashes=new Set();
const ctx=vm.createContext({Arcade:{registerAssets:p=>packs.push(p)}});
for(const stage of expected)vm.runInContext(fs.readFileSync(path.join(base,stage,'manifest.js'),'utf8'),ctx,{filename:stage+'/manifest.js'});
let planned=0,actual=0;const rows=[];
for(const pack of packs){
 assert.equal(pack.minimumDistinctClips,30,pack.stage+' minimum requirement');
 assert.equal(pack.productionApproved,false,pack.stage+' production gate must remain closed');
 assert.ok(pack.plannedClips.length>=30);assert.equal(pack.plannedClipCount,pack.plannedClips.length);
 const localActions=new Set(),localBriefs=new Set();
 for(const c of pack.plannedClips){
  assert.ok(!globalIds.has(c.id),'duplicate ID '+c.id);globalIds.add(c.id);
  assert.ok(!localActions.has(c.distinctActionKey),'duplicate motion key '+c.id);localActions.add(c.distinctActionKey);
  assert.ok(!localBriefs.has(c.motionBrief),'duplicate motion brief '+c.id);localBriefs.add(c.motionBrief);
  assert.ok([1,2,'transition','defeat'].includes(c.phase));assert.ok(c.role&&c.motionBrief&&c.timingReference);
  assert.equal(c.productionStatus,'planned');assert.equal(c.verifiedDistinct,false);
  assert.equal(c.assetPath,null);assert.equal(c.sourceGenerationIds.length,0);
 }
 for(const phase of [1,2]){const n=pack.plannedClips.filter(c=>c.phase===phase).length;assert.ok(n>=8,pack.stage+' both phases need meaningful coverage');assert.equal(pack.phaseCoverage[phase].planned,n);assert.equal(pack.phaseCoverage[phase].actualVerified,0);assert.equal(pack.phaseCoverage[phase].criticalPoseReview,'pending');}
 assert.ok(pack.plannedClips.some(c=>c.phase==='transition'));assert.ok(pack.plannedClips.some(c=>c.phase==='defeat'));
 for(const clip of pack.clips){
  assert.equal(clip.verifiedDistinct,true,'actual clip must be reviewed');assert.ok(clip.assetPath);
  const file=path.resolve(root,clip.assetPath);assert.ok(file.startsWith(root+path.sep));assert.ok(fs.existsSync(file));
  const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.ok(!hashes.has(sha),'duplicate production asset bytes');hashes.add(sha);
 }
 assert.ok(['escape','machine-defeat'].includes(pack.terminalOutcome));
 assert.ok(pack.plannedClips.some(c=>c.id===pack.terminalClipId&&c.phase==='defeat'),'missing unique terminal clip');
 assert.equal(pack.terminalOutcome,pack.stage==='11-rooftop'?'escape':'machine-defeat');
 assert.equal(pack.terminalClipStatus,'planned-not-produced');assert.equal(pack.terminalAcceptance.verifiedProductionClipRequired,true);assert.equal(pack.terminalAcceptance.actualTerminalClipVerified,false);
 assert.equal(pack.terminalAcceptance.operatorDeathImplied,false);
 assert.equal(pack.actualVerifiedClipCount,pack.clips.length);assert.equal(pack.clips.length,0,'current pre-signoff inventory must contain zero production clips');
 planned+=pack.plannedClips.length;actual+=pack.clips.length;
 rows.push({stage:pack.stage,phase1:pack.phaseCoverage[1].planned,phase2:pack.phaseCoverage[2].planned,planned:pack.plannedClips.length,actualVerified:pack.clips.length,referenceStatus:pack.referenceStatus});
}
assert.equal(packs.length,12);assert.equal(planned,388);assert.equal(actual,0);
const code=packs.find(p=>p.stage==='12-codebreak');assert.equal(code.plannedClips.length,36);
console.table(rows);console.log(JSON.stringify({bosses:12,plannedDistinctClips:planned,actualVerifiedProductionClips:actual,fourBriefSchedulingBatches:97,allBossesBothPhasesCovered:true,humanTimingPoseSignoff:'pending',semanticMotionDistinctness:'requires human review',generationOrSpend:false,bossSpecificTerminalClipsPlanned:12,actualTerminalClipsVerified:0},null,2));
