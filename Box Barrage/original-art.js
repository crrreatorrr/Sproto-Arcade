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
let scenery;
const PALETTE = {
    ink: '#272532', cloud: '#3b3440', cloudLight: '#65504b', rust: '#8e543e',
    amber: '#db9953', gold: '#edba69', sky: '#ba7d51', distant: '#66634d',
    grass: '#68704b', grassLight: '#92945b', grassDark: '#444f3e',
    stone: '#8b8170', stoneLight: '#b1a18a', stoneDark: '#5c5851',
    dirt: '#8e7058', dirtLight: '#b28c66', dirtDark: '#665447', wood: '#574a40',
};
function buildScenery() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const c = canvas.getContext('2d');
    const rect = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    const poly = (points, color) => { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
    // Chunky horizontal sky bands and stepped cloud shapes preserve a pixel grid.
    const sky = ['#272832', '#34313a', '#493b40', '#674b44', '#8a5b46', '#ae704b', '#cb8a50', '#e1a55e', '#e9b66a'];
    sky.forEach((color, i) => rect(0, i * 10, 320, 11, color));
    rect(0, 85, 320, 22, PALETTE.gold);
    rect(232, 70, 17, 16, '#f4cb7b');
    rect(229, 74, 23, 8, '#f4cb7b');
    poly([[0, 45], [20, 45], [20, 49], [47, 49], [47, 52], [74, 52], [74, 55], [101, 55], [101, 58], [61, 58], [61, 56], [25, 56], [25, 53], [0, 53]], '#755047');
    poly([[142, 41], [166, 41], [166, 38], [196, 38], [196, 42], [215, 42], [215, 46], [253, 46], [253, 49], [283, 49], [283, 52], [320, 52], [320, 60], [278, 60], [278, 56], [247, 56], [247, 53], [201, 53], [201, 49], [166, 49], [166, 46], [142, 46]], PALETTE.cloud);
    rect(204, 52, 39, 2, '#aa704c');
    rect(248, 57, 35, 2, '#bd7c4d');
    poly([[12, 67], [38, 67], [38, 63], [66, 63], [66, 66], [86, 66], [86, 69], [113, 69], [113, 72], [151, 72], [151, 75], [106, 75], [106, 73], [62, 73], [62, 71], [12, 71]], '#8a5d49');
    rect(0, 79, 36, 3, '#c58a55');
    rect(145, 82, 36, 2, '#cb8d52');
    rect(270, 77, 50, 3, '#aa774f');
    // Distant hills, trees and a pair of old stone silos.
    poly([[0, 100], [0, 94], [18, 94], [18, 92], [40, 92], [40, 95], [62, 95], [62, 93], [86, 93], [86, 96], [115, 96], [115, 94], [142, 94], [142, 91], [168, 91], [168, 88], [192, 88], [192, 91], [216, 91], [216, 93], [246, 93], [246, 90], [278, 90], [278, 92], [303, 92], [303, 89], [320, 89], [320, 111]], '#797b59');
    rect(164, 76, 12, 22, '#706556');
    rect(166, 72, 8, 5, '#796c59');
    rect(167, 69, 6, 4, '#8a745c');
    rect(172, 78, 4, 20, '#5f5b50');
    rect(178, 82, 13, 17, '#686154');
    rect(181, 79, 7, 4, '#766957');
    rect(195, 74, 4, 24, '#74634f');
    rect(195, 72, 4, 3, '#8b7055');
    rect(167, 81, 2, 3, '#3e4540');
    rect(182, 86, 2, 3, '#3e4540');
    for (let i = 0; i < 13; i++) {
        const x = 6 + i * 27, h = 4 + (i * 3 % 6);
        rect(x, 95 - h, 3, h, '#5e654c');
        rect(x - 2, 97 - h, 7, h - 2, '#5e654c');
    }
    poly([[0, 105], [38, 102], [77, 106], [127, 102], [169, 105], [208, 99], [261, 104], [320, 100], [320, 146], [0, 146]], PALETTE.grass);
    poly([[0, 120], [56, 111], [104, 114], [136, 108], [195, 111], [232, 106], [269, 111], [320, 107], [320, 131], [239, 121], [170, 125], [99, 120], [36, 129], [0, 127]], '#768052');
    // A farm lane curves toward the fighting yard, with stepped puddles.
    poly([[222, 101], [230, 101], [226, 108], [229, 115], [242, 123], [263, 135], [289, 145], [204, 145], [220, 133], [227, 123], [216, 115], [216, 109]], '#9e805d');
    poly([[225, 102], [228, 102], [223, 111], [225, 116], [237, 124], [249, 134], [257, 145], [237, 145], [237, 133], [230, 124], [220, 116], [220, 110]], '#b49469');
    poly([[228, 120], [232, 120], [232, 122], [239, 122], [239, 125], [232, 125], [232, 124], [226, 124], [226, 122], [228, 122]], '#5c574c');
    rect(229, 121, 4, 2, '#d4aa72');
    rect(230, 122, 7, 1, '#bc986a');
    poly([[240, 134], [248, 134], [248, 136], [255, 136], [255, 139], [241, 139], [241, 138], [237, 138], [237, 136], [240, 136]], '#655b4d');
    rect(240, 135, 8, 1, '#c4a273');
    // Main farmhouse and attached barn: different composition from the photo.
    rect(55, 86, 60, 40, PALETTE.stoneDark);
    rect(57, 86, 56, 38, PALETTE.stone);
    poly([[54, 86], [78, 66], [114, 86]], PALETTE.stoneLight);
    poly([[48, 85], [73, 65], [83, 65], [60, 85]], '#4c4140');
    poly([[60, 85], [83, 65], [125, 65], [141, 85]], '#6f453c');
    poly([[60, 85], [83, 65], [125, 65], [141, 85], [139, 88], [60, 88]], '#71483f');
    for (let y = 69; y < 85; y += 4) {
        const left = 83 - (y - 65) * 1.15, right = 125 + (y - 65) * .8;
        rect(Math.ceil(left), y, Math.floor(right - left), 1, '#a4694c');
        for (let x = Math.ceil(left) + 3; x < right; x += 9)
            rect(x, y + 1, 1, 2, '#563b37');
    }
    rect(63, 85, 76, 2, '#3f3737');
    rect(81, 62, 5, 9, '#605049');
    rect(80, 61, 7, 2, '#8a6c54');
    rect(120, 62, 4, 7, '#65534a');
    rect(114, 88, 25, 38, '#716c5e');
    // Small irregular stonework, deterministic placement rather than random noise.
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
            const x = 58 + col * 7 + (row % 2) * 3, y = 89 + row * 4;
            if (x < 112) {
                rect(x, y, 5, 2, (row + col) % 3 === 0 ? '#a2947d' : '#7c7667');
            }
        }
    for (let row = 0; row < 7; row++)
        for (let col = 0; col < 3; col++)
            rect(117 + col * 7, row * 5 + 90, 5, 2, (row + col) % 3 === 0 ? '#8b806c' : '#625f54');
    const window = (x, y, lit = false) => { rect(x - 1, y - 1, 9, 12, '#b5a085'); rect(x, y, 7, 10, '#343b36'); rect(x + 1, y + 1, 2, 7, lit ? '#cda568' : '#697465'); rect(x + 4, y + 1, 2, 7, lit ? '#b28b53' : '#46584c'); rect(x, y + 4, 7, 1, '#3e433b'); rect(x - 1, y + 10, 9, 2, '#544c43'); };
    window(65, 92);
    window(94, 92, true);
    window(66, 111, true);
    window(124, 95);
    rect(90, 108, 12, 18, '#49483d');
    rect(92, 109, 8, 17, '#59604b');
    rect(93, 110, 1, 15, '#77755a');
    rect(98, 118, 1, 1, '#d6af6b');
    rect(48, 125, 94, 3, '#4c503d');
    // Lean-to with timber door and weathered roof.
    rect(32, 105, 28, 21, '#817764');
    poly([[28, 105], [36, 94], [61, 94], [66, 106]], '#69453d');
    for (let y = 97; y < 105; y += 3)
        rect(34 - (y - 97) / 2, y, 28 + (y - 97) / 2, 1, '#9c654c');
    rect(37, 109, 14, 17, '#4d4b3d');
    for (let x = 38; x < 51; x += 3)
        rect(x, 110, 1, 15, '#68634a');
    rect(36, 117, 16, 2, '#807053');
    // Meadow detail, with flowers kept small and low contrast behind fighters.
    for (let i = 0; i < 145; i++) {
        const x = (i * 47 + 11) % 320, y = 110 + (i * 17 % 31);
        if ((x > 25 && x < 145 && y < 129) || (x > 211 && x < 280))
            continue;
        rect(x, y, 1, 2, i % 3 === 0 ? '#969657' : '#4f623f');
        if (i % 13 === 0)
            rect(x - 1, y, 2, 1, '#c6ad66');
    }
    // Dry-stone walls leave the winding lane open.
    const wall = (x, w) => {
        rect(x, 132, w, 8, '#535a48');
        for (let row = 0; row < 2; row++)
            for (let j = 0; j < Math.floor(w / 7); j++) {
                const bx = x + j * 7 + (row % 2) * 2;
                rect(bx, 132 + row * 4, 6, 3, (j + row) % 3 === 0 ? '#9e9780' : '#7d826b');
            }
        for (let j = 0; j < w; j += 6)
            rect(x + j, 130 + (j % 3), 5, 3, '#92937a');
    };
    wall(0, 163);
    wall(282, 38);
    // Posts and two rails add a strong ranch silhouette without obscuring torsos.
    for (const x of [168, 193, 282, 310]) {
        rect(x, 120, 3, 24, '#534d3e');
        rect(x, 119, 3, 2, '#a28d67');
        rect(x + 1, 122, 1, 21, '#817054');
    }
    rect(169, 126, 26, 2, '#8c7a59');
    rect(169, 136, 26, 2, '#706246');
    rect(283, 126, 30, 2, '#8c7a59');
    rect(283, 136, 30, 2, '#706246');
    // The level's flat combat lane is distinct from the receding scenic path.
    rect(0, 144, 320, 36, PALETTE.dirt);
    rect(0, 144, 320, 2, '#c1a079');
    rect(0, 146, 320, 3, '#9d7e5e');
    for (let i = 0; i < 155; i++) {
        const x = (i * 53) % 320, y = 150 + (i * 23 % 29), w = 1 + i % 4;
        rect(x, y, w, 1, i % 3 === 0 ? '#a98966' : i % 3 === 1 ? '#7d6553' : '#96795d');
    }
    // Ruts and puddles live in the foreground, below both fighters' feet.
    rect(0, 169, 94, 2, '#78614f');
    rect(19, 172, 105, 1, '#a18462');
    rect(238, 165, 82, 2, '#78614f');
    poly([[180, 164], [197, 164], [197, 165], [209, 165], [209, 168], [201, 168], [201, 169], [177, 169], [177, 167], [173, 167], [173, 165], [180, 165]], '#625a51');
    rect(180, 165, 19, 1, '#ba956b');
    rect(185, 167, 18, 1, '#988063');
    // Tufts at the extreme edges frame the action, never its center.
    for (const x of [2, 7, 13, 18, 302, 308, 315]) {
        rect(x, 141 - (x % 4), 1, 7 + (x % 4), '#4e5b3d');
        rect(x - 1, 145, 3, 2, '#667147');
    }
    // A deliberately calm dark top region keeps existing health bars legible.
    rect(0, 0, 320, 41, '#15192370');
    return canvas;
}
function drawRanch(ctx, frame) {
    scenery ?? (scenery = buildScenery());
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scenery, 0, 0, 1280, 720);
    // A few warm drifting motes provide life without requiring raster assets.
    for (let i = 0; i < 6; i++) {
        const x = (((frame >> 3) + i * 73) % 320) * 4;
        const y = (108 + ((i * 19 + (frame >> 6)) % 29)) * 4;
        ctx.fillStyle = i % 2 ? '#dfbf7438' : '#f3d18c30';
        ctx.fillRect(x, y, 4, 4);
    }
    ctx.restore();
}
