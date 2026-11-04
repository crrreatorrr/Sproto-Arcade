/* Story mode's hub bar: sign-in state, Tickets, the Breakwater Coin and Return to hub.
 * Repaints the Sproto locks when progress or Relics change. Classic script, after game.js. */
(function () {
  'use strict';
  const hub = window.ArcadeHub;
  const bar = document.getElementById('hub-bar');
  const status = document.getElementById('hub-status');
  const back = document.getElementById('hub-return');
  if (!hub || !bar || !status || !back) return;
  back.addEventListener('click', () => hub.exit());

  function line(state) {
    if (state.status === 'connecting') return 'Hub: signing in…';
    if (state.status === 'error') return 'Hub: offline (sign-in failed). Progress is saved on this device.';
    if (state.status !== 'online') return '';
    const parts = ['<b>Hub</b> signed in · progress saves to your account'];
    if (typeof state.tickets === 'number') parts.push(`Tickets <b>${state.tickets}</b> (+${hub.TICKETS_PER_CLEAR} per clear)`);
    parts.push(state.relics.includes(hub.RELIC) ? 'Breakwater Coin <b>owned</b>' : 'Beat Fat Head Dave for the Breakwater Coin');
    return parts.join(' · ');
  }

  hub.onChange((state) => {
    const text = line(state);
    const extra = state.message ? ` · <b>${state.message.replace(/[<&>]/g, '')}</b>` : '';
    bar.hidden = !text && !extra;
    status.innerHTML = text + extra;
    back.hidden = !hub.connected();
    if (typeof window.paintSprotoLocks === 'function') window.paintSprotoLocks();
  });
})();
