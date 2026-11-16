/* Draws only scenery. Entities and HUD are painted after the fade. */
const ArcadePhaseBackground = (() => {
  let outgoing;
  let captured = false;

  function draw(ctx, phaseTwo, blend, paint) {
    if (blend === null) {
      captured = false;
      paint(phaseTwo);
      return;
    }

    if (!captured) {
      paint(false);
      outgoing ??= document.createElement('canvas');
      outgoing.width = ctx.canvas.width;
      outgoing.height = ctx.canvas.height;
      outgoing.getContext('2d').drawImage(ctx.canvas, 0, 0);
      captured = true;
    }

    const progress = Math.max(0, Math.min(1, blend));
    const alpha = progress * progress * (3 - 2 * progress);
    paint(true);
    ctx.save();
    ctx.globalAlpha = 1 - alpha;
    ctx.drawImage(outgoing, 0, 0);
    ctx.restore();
  }

  return {draw};
})();
