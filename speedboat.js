/* Shared canvas presentation for Tidebreak Marina's player boat. */
const ArcadeSpeedboat = (() => {
  'use strict';
  const route = [
    'art/ocean/sunrise.webp',
    'art/ocean/shoals.webp',
    'art/ocean/islands.webp',
    'art/ocean/fog.webp',
    'art/ocean/wrecks.webp'
  ];
  const storm = 'art/ocean/storm.webp';
  const boat = 'art/ocean/speedboat.png', effects = 'art/ocean/naval-effects.png';
  const assets = [...route, storm, boat, effects];
  const boatWidth = 224, boatHeight = 112, fxWidth = 128, fxHeight = 96;
  const hullBottom = 93, waterlineDepth = 6;
  const fireFrame = 2;
  // Cell-local muzzle flash bounds in the light and heavy attack rows.
  const muzzleFlash = {1:[180,32,36,32],2:[70,0,52,41]};
  const screenWidth = 1280, screenHeight = 720, panelDistance = 3200;
  const bossMotion = new WeakMap();
  // The two guard poses share these anchor-relative upper-body crops.
  const pilots = {
    rivet:[-36,-128,87,83],
    sproto3106:[-41,-128,83,83],
    sproto3152:[-29,-128,113,83],
    morelight:[-49,-129,104,83],
    sproto763:[-39,-128,86,83],
    sproto831:[-41,-128,96,83],
    sproto943:[-42,-128,85,83],
    sproto1477:[-35,-128,85,83],
    sproto1668:[-23,-128,76,83],
    sproto1815:[-38,-128,111,83],
    sproto2101:[-40,-128,87,83],
    sproto2177:[-37,-128,86,83],
    sproto2569:[-45,-128,84,83],
    sproto2884:[-36,-128,82,83]
  };

  function panorama(ctx, image, fraction) {
    if (!image?.naturalWidth) return false;
    const width = Math.round(image.naturalHeight * screenWidth / screenHeight);
    const x = Math.round((image.naturalWidth - width) * fraction);
    ctx.drawImage(image, x, 0, width, image.naturalHeight, 0, 0, screenWidth, screenHeight);
    return true;
  }

  function drawOcean(ctx, picture, distance, phaseTwo) {
    if (phaseTwo) return panorama(ctx, picture(storm), .5);
    const section = Math.floor(distance / panelDistance);
    const progress = distance / panelDistance - section;
    const visible = panorama(ctx, picture(route[section % route.length]), progress);
    if (progress > .8) {
      ctx.save();
      ctx.globalAlpha = (progress - .8) / .2;
      panorama(ctx, picture(route[(section + 1) % route.length]), 0);
      ctx.restore();
    }
    return visible;
  }

  function drawEffect(ctx, picture, row, column, x, y, scale = 1) {
    const image = picture(effects);
    if (!image?.naturalWidth) return false;
    ctx.drawImage(image, column * fxWidth, row * fxHeight, fxWidth, fxHeight,
      Math.round(x), Math.round(y), Math.round(fxWidth * scale), Math.round(fxHeight * scale));
    return true;
  }

  function drawShot(ctx, picture, kind, age) {
    if (kind === 'boatTorpedo') return drawEffect(ctx, picture, 0, Math.floor(age / 3) % 4, -32, -23, .48);
    if (kind === 'waterMine') return drawEffect(ctx, picture, 1, Math.floor(age / 3) % 4, -27, -20, .42);
    return false;
  }

  function drawSplash(ctx, picture, x, y, age) {
    return drawEffect(ctx, picture, 2, Math.min(3, Math.floor(age / 4)), x - 36, y - 44, .56);
  }

  function drawWake(ctx, picture, x, surface, tick, dx, dy, scale, facing, trailOffset) {
    const speed = Math.hypot(dx, dy);
    const side = speed <= .12 ? facing : Math.abs(dx) > .12 ? Math.sign(dx) : 0;
    ctx.save();
    ctx.translate(Math.round(x - side * trailOffset), Math.round(surface + 10));
    if (side < 0) ctx.scale(-1, 1);
    const frame = Math.floor(tick / (speed > 8 ? 3 : 5)) % 4;
    drawEffect(ctx, picture, 3, frame, -fxWidth * scale / 2, -fxHeight * scale / 2, scale);
    if (speed > .18) {
      const splashScale = scale * (speed > 8 ? .65 : .45);
      ctx.globalAlpha *= speed > 8 ? .86 : .62;
      drawEffect(ctx, picture, 2, frame, -fxWidth * splashScale / 2, -74 * splashScale, splashScale);
    }
    ctx.restore();
  }

  function drawBossWake(ctx, picture, boss, tick, x, surface) {
    const previous = bossMotion.get(boss);
    const motion = previous?.tick === tick ? previous : {
      x,y:surface,tick,
      dx:previous ? (x - previous.x) / Math.max(1,tick - previous.tick) : 0,
      dy:previous ? (surface - previous.y) / Math.max(1,tick - previous.tick) : 0
    };
    bossMotion.set(boss,motion);
    drawWake(ctx,picture,x,surface,tick,motion.dx,motion.dy,1.37,-1,95);
  }

  function specialFrame(age, weapon) {
    if (age < 0 || age >= weapon.frames) return -1;
    if (age < weapon.launch - 2) return 0;
    if (age < weapon.launch) return 1;
    return age < weapon.launch + 4 ? fireFrame : 3;
  }

  function hull(ctx, image, row, column, x, y, start = 0, width = boatWidth) {
    const flash = column === fireFrame && muzzleFlash[row];
    if (flash) {
      const [left, top, w, h] = flash;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, boatWidth, boatHeight);
      ctx.rect(x + left, y + top, w, h);
      ctx.clip('evenodd');
    }
    ctx.drawImage(image, column * boatWidth + start, row * boatHeight, width, boatHeight,
      x + start, y, width, boatHeight);
    if (flash) ctx.restore();
  }

  function drawMuzzleFlash(ctx, image, row, column, x, y) {
    if (column !== fireFrame) return;
    const [left, top, w, h] = muzzleFlash[row];
    ctx.drawImage(image, column * boatWidth + left, row * boatHeight + top, w, h,
      x + left, y + top, w, h);
  }

  function drawPilot(ctx, picture, id, tick, x, y) {
    const art = ART.sprites[id];
    const [path, anchorX, anchorY] = art.poses[Math.floor(tick / 23) % 2] ?? art.poses[0];
    const image = picture(path);
    if (!image?.naturalWidth) return;
    const [left, top, width, height] = pilots[id] ?? pilots.rivet;
    const scale = Math.min(59 / width, 51 / height);
    const w = Math.round(width * scale), h = Math.round(height * scale);
    ctx.drawImage(image, anchorX + left, anchorY + top, width, height,
      Math.round(x + 10 - w / 2), Math.round(y + 1 - h), w, h);
  }

  function drawBoat(ctx, picture, player, tick, lightAge, heavyAge) {
    const image = picture(boat);
    if (!image?.naturalWidth) return false;
    const light = specialFrame(lightAge, NAVAL_WEAPONS.light);
    const heavy = specialFrame(heavyAge, NAVAL_WEAPONS.heavy);
    const bob = light < 0 && heavy < 0 ? Math.round(Math.sin(tick * .12) * 2) : 0;
    const x = Math.round(player.x - boatWidth / 2), y = Math.round(player.y - 66 + bob);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if(light===fireFrame||heavy===fireFrame){
      // The hull cutout and the foreground flash must meet on the same pixel grid.
      const {a,b,c,d,e,f}=ctx.getTransform();
      ctx.setTransform(a,b,c,d,Math.round(e),Math.round(f));
    }
    const dx = player.dash ? (player.dashX ?? player.dashDir) * 23 : player.vx;
    const dy = player.dash ? player.dashY * 23 : player.vy;
    drawWake(ctx,picture,player.x,y+hullBottom-waterlineDepth,tick,dx,dy,player.dash ? 1.02 : .76,1,77);
    if(light<0&&heavy<0&&dx < -3&&Math.abs(dy)<3){
      ctx.translate(player.x,player.y);
      ctx.rotate(.045);
      ctx.translate(-player.x,-player.y);
    }
    const motion = dy < -2 ? 1 : dy > 2 ? 2 : dx > 3 || player.dash ? 3 : 0;
    ArcadeBossSheets.drawWaterline(ctx,{x:x+10,y,w:boatWidth-20,h:hullBottom},waterlineDepth,tick,(dx,dy)=>{
      const left=x+dx,top=y+dy;
      if (light >= 0 && heavy >= 0) {
        hull(ctx, image, 2, heavy, left, top, 0, boatWidth / 2);
        hull(ctx, image, 1, light, left, top, boatWidth / 2, boatWidth / 2);
      } else if (heavy >= 0) hull(ctx, image, 2, heavy, left, top);
      else if (light >= 0) hull(ctx, image, 1, light, left, top);
      else hull(ctx, image, 0, motion, left, top);
    });
    drawPilot(ctx, picture, player.id, tick, player.x, player.y + bob);
    drawMuzzleFlash(ctx, image, 2, heavy, x, y);
    drawMuzzleFlash(ctx, image, 1, light, x, y);
    ctx.restore();
    return true;
  }

  return { assets, drawOcean, drawBoat, drawBossWake, drawShot, drawSplash };
})();
