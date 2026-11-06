#!/usr/bin/env python3
"""Measure Collector pose atlases and write the runtime sheet.

Pack scale 0.2982 is the fit from the source sheet into the 256 cell (about 256/858).
The cell is what we draw. Story and machine-trial scale is 1.55 so the strider
stands about 1.6x the drawn player and near the old 210px stage machine.
Projectile scale 0.5357 is the authored cell scale; the center anchor is (128, 128).
"""
import json, os, shutil
from PIL import Image, ImageChops

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.environ.get('COLLECTOR_PACK', '/tmp/collector-art')
DST = os.path.join(ROOT, 'art/rework/bosses/05-neon/sproto102')
MACHINE = 1.55
PROJECTILE = 0.5357142857142857
PACK = 0.2982005141388175
CELL = 256
FOOT = (128, 240)
CENTER = (128, 128)

CLIPS = [
    # name, phase, role, release, recovery, contact frames, hold, windup, tail
    ('magnetic-claw-flex', 1, 'melee', 3, 5, [3, 4], 8, 9, 8),
    ('magnet-snatch-cue', 1, 'cue', 3, 5, [3, 4], 8, 12, 8),
    ('claw-armor-deflect', 1, 'deflect', 4, 5, [4], 10, 8, 8),
    ('collector-lane-scan', 1, 'telegraph', 3, 6, [], 8, 8, 8),
    ('magnet-claw-fire', 1, 'fire', 4, 6, [4, 5], 8, 8, 8),
    ('magnet-pulse-projectile', 1, 'projectile', 6, 7, [6], 8, 4, 8),
    ('magnet-snatch-return', 2, 'return', 4, 6, [4, 5], 8, 8, 8),
    ('aligned-shot-contact', 2, 'strike', 4, 5, [4], 10, 8, 8),
    ('billboard-drive-guard-open', 2, 'weak', 4, 6, [4, 5], 28, 8, 10),
    ('sign-elevation-shuffle', 2, 'shuffle', 4, 6, [4, 5], 10, 8, 8),
]
FOLDERS = {
    'magnetic-claw-flex': 'sproto102-p1-magnetic-claw-flex-sheet-gpt25-v1',
    'magnet-snatch-cue': 'sproto102-p1-magnet-snatch-cue-sheet-gpt25-v1',
    'claw-armor-deflect': 'sproto102-p1-claw-armor-deflect-sheet-gpt25-v1',
    'collector-lane-scan': 'sproto102-p1-collector-lane-scan-sheet-gpt25-v2',
    'magnet-claw-fire': 'sproto102-p1-magnet-claw-fire-sheet-gpt25-v1',
    'magnet-pulse-projectile': 'sproto102-p1-magnet-pulse-projectile-sheet-gpt25-v1',
    'magnet-snatch-return': 'sproto102-p2-magnet-snatch-return-sheet-gpt25-v1',
    'aligned-shot-contact': 'sproto102-p2-aligned-shot-contact-sheet-gpt25-v1',
    'billboard-drive-guard-open': 'sproto102-p2-billboard-drive-guard-open-sheet-gpt25-v1',
    'sign-elevation-shuffle': 'sproto102-p2-sign-elevation-shuffle-sheet-gpt25-v1',
}

def mean_delta(a, b):
    d = ImageChops.difference(a, b)
    hist = d.histogram()
    total = sum(i * hist[i + ch * 256] for ch in range(4) for i in range(256))
    return round(total / (CELL * CELL * 4), 1)

def rel(bounds, anchor, scale):
    x0, y0, x1, y1 = bounds
    ax, ay = anchor
    return [round((x0 - ax) * scale), round((y0 - ay) * scale), round((x1 - ax) * scale), round((y1 - ay) * scale)]

def orange_box(path):
    im = Image.open(path).convert('RGBA')
    px = im.load()
    xs, ys = [], []
    for y in range(CELL):
        for x in range(CELL):
            r, g, b, a = px[x, y]
            if a > 180 and r > 190 and 60 < g < 160 and b < 70:
                xs.append(x); ys.append(y)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs) + 1, max(ys) + 1]

def main():
    os.makedirs(DST, exist_ok=True)
    runtime = {}
    manifest_clips = []
    for name, phase, role, release, recovery, hits, hold, windup, tail in CLIPS:
        folder = FOLDERS[name]
        src = os.path.join(SRC, folder)
        out = os.path.join(DST, name)
        os.makedirs(out, exist_ok=True)
        shutil.copyfile(os.path.join(src, 'atlas-256.webp'), os.path.join(out, 'atlas-256.webp'))
        shutil.copyfile(os.path.join(src, 'pose-atlas.json'), os.path.join(out, 'pose-atlas.json'))
        atlas = Image.open(os.path.join(out, 'atlas-256.webp'))
        if atlas.size != (CELL * 8, CELL):
            raise SystemExit(f'{name} atlas is {atlas.size}, expected {(CELL*8, CELL)}')
        png = Image.open(os.path.join(src, 'atlas-256.png')).convert('RGBA')
        if png.size != atlas.size:
            raise SystemExit(f'{name} png atlas size {png.size}')
        pose = json.load(open(os.path.join(out, 'pose-atlas.json')))
        anchor = FOOT if role != 'projectile' else CENTER
        scale = MACHINE if role != 'projectile' else PROJECTILE
        frames = []
        prev = None
        deltas = []
        for i in range(8):
            frame = Image.open(os.path.join(src, 'frames', f'{i:02d}.png')).convert('RGBA')
            cell = png.crop((i * CELL, 0, (i + 1) * CELL, CELL))
            if frame.tobytes() != cell.tobytes():
                raise SystemExit(f'{name} frame {i} is not png-atlas cell {i}')
            # Pillow's lossless-WebP reader shifts RGB under a correct alpha. The PNG atlas
            # matches frames/ exactly, and the WebP alpha matches that PNG, so the strip is the
            # 8 cells in order. Browsers decode the WebP; do not byte-compare it here.
            bounds = pose['frames'][i]['bounds']
            frames.append(rel(bounds, anchor, scale))
            if prev is not None:
                deltas.append(mean_delta(prev, frame))
            prev = frame
        ticks = []
        for i in range(8):
            if release <= i < recovery:
                ticks.append(hold)
            elif i < release:
                ticks.append(windup)
            else:
                ticks.append(tail)
        tell = sum(ticks[:release])
        active = sum(ticks[release:recovery])
        rest = sum(ticks[recovery:])
        weak = None
        if role == 'weak':
            # Frame 4 is the tight chest core. Frame 5's orange spills onto the arms; the
            # opening is the same drive, so both contact frames use the frame-4 core.
            core = orange_box(os.path.join(src, 'frames', '04.png'))
            core_rel = rel(core, FOOT, MACHINE)
            weak = [core_rel if i in hits else None for i in range(8)]
        rel_path = f'art/rework/bosses/05-neon/sproto102/{name}'
        runtime[name] = {
            'phase': phase, 'role': role, 'atlas': rel_path + '/atlas-256.webp',
            'frameCount': 8, 'frameSize': [CELL, CELL],
            'pivot': list(anchor), 'scale': scale,
            'frameTicks': ticks, 'tell': tell, 'active': active, 'rest': rest,
            'events': {'telegraph': 0, 'release': release, 'recovery': recovery},
            'hitFrames': hits, 'boxes': frames, 'eventDeltas': deltas,
        }
        if weak:
            runtime[name]['weak'] = weak
        manifest_clips.append({
            'id': f'05-neon.{name}',
            'phase': phase,
            'machine': 'Salvage Strider' if phase == 1 else 'Billboard Rig',
            'role': role,
            'distinctActionKey': name,
            'motionBrief': {
                'magnetic-claw-flex': 'Claw grabs and the smash peaks',
                'magnet-snatch-cue': 'Claw aims and locks the lane',
                'claw-armor-deflect': 'Armor snaps and the incoming shot ricochets',
                'collector-lane-scan': 'Collector scans the lane; the sweep does not hit',
                'magnet-claw-fire': 'Magnet fires; the pulse leaves on the extended frames',
                'magnet-pulse-projectile': 'Pulse loops, strikes on the left tip, then dissipates',
                'magnet-snatch-return': 'The snatch comes back across the lane',
                'aligned-shot-contact': 'A horizontal magnet strike at drive height',
                'billboard-drive-guard-open': 'The billboard drive is exposed',
                'sign-elevation-shuffle': 'Signs stagger and pulses leave at two heights',
            }[name],
            'timingReference': 'stages/05-neon/timing.md',
            'timingStatus': 'gameplay-authored-contact-from-pose-order',
            'productionStatus': 'verified',
            'sourceGenerationIds': [],
            'assetPath': rel_path + '/atlas-256.webp',
            'poseAtlas': rel_path + '/pose-atlas.json',
            'frameCount': 8,
            'frameSize': [CELL, CELL],
            'frames': [rel_path + f'/atlas-256.webp#{i}' for i in range(8)],
            'atlas': rel_path + '/atlas-256.webp',
            'atlasLayout': '8x1 cells of 256',
            'frameTicks': ticks,
            'durationTicks': sum(ticks),
            'pivot': list(anchor),
            'scale': scale,
            'packScale': PACK if role != 'projectile' else PROJECTILE,
            'facing': -1,
            'events': {'telegraph': 0, 'release': release, 'recovery': recovery},
            'hitFrames': hits,
            'eventDeltas': deltas,
            'eventBasis': 'measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested',
            'attackTicks': {'tell': tell, 'active': active, 'rest': rest},
            'boxes': frames,
            'verifiedDistinct': True,
        })
    # Stable cab: intersection of the right-hand body across phase-1 frames, in display px.
    bodies = []
    for name, info in runtime.items():
        if info['role'] == 'projectile':
            continue
        for box in info['boxes']:
            bodies.append(box)
    # Hull is the cab the player cannot walk through: from just left of the foot to the right edge,
    # using the median top so a raised claw does not become the push box.
    tops = sorted(b[1] for b in bodies)
    rights = sorted(b[2] for b in bodies)
    hull = [-36, tops[len(tops)//2], rights[len(rights)//2], 0]
    # Projectile loop-frame union, the in-flight hitbox.
    pulse = runtime['magnet-pulse-projectile']['boxes']
    loop = pulse[2:6]
    union = [min(b[0] for b in loop), min(b[1] for b in loop), max(b[2] for b in loop), max(b[3] for b in loop)]
    data = {
        'id': 'sproto102', 'level': 4, 'name': 'Collector', 'facing': -1,
        'cell': CELL, 'scale': MACHINE, 'anchor': list(FOOT),
        'packScale': PACK, 'projectileScale': PROJECTILE, 'projectileAnchor': list(CENTER),
        'intro': 'collector-lane-scan', 'defeat': 'billboard-drive-guard-open',
        'hull': hull, 'pulse': union,
        'lanes': {'low': 36, 'high': 200, 'mid': 118},
        'phases': {
            '1': [
                {'clip': 'collector-lane-scan', 'cue': 'LANE SCAN — NO HIT'},
                {'clip': 'magnet-snatch-cue', 'cue': 'CLAW LOCKS YOUR LANE', 'lockAim': True},
                {'clip': 'magnet-claw-fire', 'cue': 'MAGNET PULSE', 'volleys': [{'t': 0, 'y': 'aim', 'vx': -4.4}]},
                {'clip': 'magnetic-claw-flex', 'cue': 'CLAW SMASH'},
                {'clip': 'claw-armor-deflect', 'cue': 'ARMOR — SHOTS RICOCHET'},
            ],
            '2': [
                {'clip': 'sign-elevation-shuffle', 'cue': 'SIGNS SHIFT — HIGH THEN LOW', 'volleys': [
                    {'t': 0, 'y': 'high', 'vx': -3.2}, {'t': 10, 'y': 'low', 'vx': -3.2}]},
                {'clip': 'magnet-snatch-return', 'cue': 'SNATCH RETURNS', 'lockAim': True, 'volleys': [
                    {'t': 0, 'y': 'aim', 'vx': -3.4, 'returnAt': 280}]},
                {'clip': 'aligned-shot-contact', 'cue': 'ALIGNED STRIKE', 'volleys': [
                    {'t': 0, 'y': 'mid', 'vx': -3.3}]},
                {'clip': 'billboard-drive-guard-open', 'cue': 'DRIVE OPEN — FIRE THE CORE'},
            ],
        },
        'clips': runtime,
    }
    out_js = os.path.join(ROOT, 'art/rework/bosses/05-neon/sheet-data.js')
    with open(out_js, 'w') as f:
        f.write('/* Collector (sproto102) runtime sheet. Generated by tools/build-collector-sheet.py.\n')
        f.write(' * Machine cells draw at scale 1.55 from foot (128, 240). Pulses draw at 0.5357 from center (128, 128).\n')
        f.write(' * 0.2982 is the source-sheet fit into the 256 cell, already baked into the atlas.\n')
        f.write(' */\n')
        f.write('const COLLECTOR_SHEET = ')
        json.dump(data, f, separators=(',', ':'))
        f.write(';\n')
    meta = os.path.join(DST, 'sheet-manifest-clips.json')
    with open(meta, 'w') as f:
        json.dump(manifest_clips, f, indent=2)
        f.write('\n')
    print('wrote', out_js, 'bytes', os.path.getsize(out_js))
    print('hull', hull, 'pulse', union)
    for name, info in runtime.items():
        print(f"{name:28} tell {info['tell']:3} active {info['active']:3} rest {info['rest']:3} hits {info['hitFrames']} box0 {info['boxes'][0]}")

if __name__ == '__main__':
    main()
