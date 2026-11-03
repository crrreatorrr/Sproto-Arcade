/** Small original Canvas pixel motifs for individual powers; no external assets. */
function drawPower(c, shape, age, color) {
    c.save();
    c.imageSmoothingEnabled = false;
    c.fillStyle = color;
    c.strokeStyle = color;
    c.lineWidth = 3;
    const box = (x, y, w, h, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, h); };
    if (shape === 'pumpkin') {
        box(-13, -10, 26, 20, '#eb842c');
        box(-8, -13, 16, 26, '#ffad42');
        box(-2, -18, 5, 7, '#527f3b');
        box(-7, -5, 4, 4, '#34213d');
        box(5, -5, 4, 4, '#34213d');
        box(-5, 4, 12, 3, '#34213d');
    }
    else if (shape === 'heart' || shape === 'brokenHeart') {
        const fill = shape === 'heart' ? '#f29aa8' : '#ac88c5';
        box(-12, -9, 10, 10, fill);
        box(2, -9, 10, 10, fill);
        box(-12, 0, 24, 5, fill);
        box(-8, 5, 16, 5, fill);
        box(-3, 10, 6, 4, fill);
        if (shape === 'brokenHeart') {
            box(0, -8, 4, 7, '#251b38');
            box(-3, -1, 4, 7, '#251b38');
            box(0, 6, 3, 7, '#251b38');
        }
    }
    else if (shape === 'gift') {
        box(-12, -12, 24, 24, '#de4f5d');
        box(-3, -12, 6, 24, '#ffdc70');
        box(-12, -3, 24, 6, '#ffdc70');
        box(-8, -17, 6, 5, '#ffdc70');
        box(2, -17, 6, 5, '#ffdc70');
    }
    else if (shape === 'coin' || shape === 'ring' || shape === 'chain') {
        c.strokeStyle = shape === 'coin' ? '#ffd84f' : color;
        c.lineWidth = shape === 'coin' ? 6 : 4;
        c.beginPath();
        c.ellipse(0, 0, shape === 'chain' ? 15 : 11, 10, 0, 0, Math.PI * 2);
        c.stroke();
        if (shape === 'coin')
            box(-2, -6, 4, 12, '#fff2a4');
        if (shape === 'chain') {
            c.beginPath();
            c.ellipse(-20, 0, 12, 8, 0, 0, Math.PI * 2);
            c.stroke();
        }
    }
    else if (shape === 'seven') {
        box(-12, -12, 25, 5, '#ffe282');
        box(7, -7, 6, 6, '#ffe282');
        box(2, -1, 6, 7, '#ffe282');
        box(-3, 6, 6, 7, '#ffe282');
    }
    else if (shape === 'rock' || shape === 'boulder' || shape === 'scrap') {
        box(-13, -9, 26, 18, shape === 'scrap' ? '#a7b7b4' : '#8d91a5');
        box(-8, -13, 16, 26, shape === 'scrap' ? '#7b9898' : '#b8b8c5');
        box(-9, -9, 7, 5, '#e0d9c6');
        box(4, 3, 9, 6, '#535869');
    }
    else if (shape === 'paw') {
        box(-8, 0, 16, 12, '#ffe479');
        for (const x of [-12, -4, 4, 12])
            box(x - 3, -10 + Math.abs(x) / 3, 6, 7, '#ffe479');
    }
    else if (shape === 'pixel') {
        for (let j = 0; j < 5; j++)
            box(j * 6 - 17, (j % 2 ? 1 : -1) * (3 + age % 4), 5, 5, color);
        box(8, -8, 14, 16, '#e1fffa');
    }
    else if (shape === 'serpent') {
        for (let j = 0; j < 7; j++)
            box(13 - j * 7, Math.round(Math.sin((age + j) * .4) * 7) - 3, 8, 7, j === 0 ? '#f3d870' : color);
        box(15, -3, 3, 3, '#141727');
    }
    else if (shape === 'prism' || shape === 'needle' || shape === 'arrow') {
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(22, 0);
        c.lineTo(-14, -8);
        c.lineTo(-7, 0);
        c.lineTo(-14, 8);
        c.closePath();
        c.fill();
        box(-4, -2, 17, 4, '#e8fffb');
    }
    else if (shape === 'orb') {
        c.beginPath();
        c.arc(0, 0, 13, 0, Math.PI * 2);
        c.stroke();
        box(-4, -4, 8, 8, '#ded2ff');
    }
    else {
        box(-9, -9, 22, 18, shape === 'acid' ? '#b7ec68' : color);
        box(11, -5, 7, 10, shape === 'acid' ? '#8abb37' : color);
        box(-4, -6, 9, 4, '#efffc2');
        for (let j = 1; j <= 3; j++)
            box(-10 - j * 9, Math.round(Math.sin(age * .3 + j) * 5), 6 - j, 6 - j, color);
    }
    c.restore();
}
/** Original ranch pixel art, drawn at 320×180 then nearest-neighbor scaled.
 * Reference motifs: amber dusk, stone farmhouse, grassy fields, muddy lane,
 * dry-stone boundary and distant weathered farm buildings. No reference pixels,
 * people, text overlays or logos are reused. Purely visual; never changes combat.
 */
