/* Shared roster and original-campaign arena assignments for the shooter unlocks. */
const SPECIAL_BOSSES = [
  {id:'special-morelight', name:'Morelight', regularSprite:'vela', sprite:'morelight', arena:1, color:'#87dbff'},
  {id:'special-artchick', name:'Artchick', regularSprite:'sproto943', sprite:'sproto943', arena:3, color:'#ff94bf'},
  {id:'special-nick', name:'Nick', regularSprite:'nick', sprite:'nick', arena:0, color:'#ffcb7a'},
  {id:'special-vmu', name:'VMU', regularSprite:'vaudream', sprite:'vaudream', arena:5, color:'#8cf5bc'}
];

function specialBossUnlocked(id) {
  try { return localStorage.getItem('arcade-boss-unlock:'+id)==='1'; }
  catch { return false; }
}

function unlockSpecialBoss(id) {
  try { localStorage.setItem('arcade-boss-unlock:'+id,'1'); }
  catch { /* The victory handoff still opens the fight when storage is unavailable. */ }
}
