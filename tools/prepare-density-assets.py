#!/usr/bin/env python3
"""Prepare genuine Higgsfield 2048x2048 missile/pickup grids without repainting.

Examples:
  python3 tools/prepare-density-assets.py --missiles /native/a.png --start-stage 1 --review-dir /proof
  python3 tools/prepare-density-assets.py --pickups /native/pickups.png --review-dir /proof

Outputs remain pending visual review. This never edits activation or geometry modules.
Requires Pillow. Missile RGB stays exact. Pickups additionally receive documented
2px boundary alpha-unmix with an explicit changed-pixel mask; native cores stay exact.
"""
import argparse
from collections import Counter, deque
import hashlib
import json
import math
from pathlib import Path
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

VERSION = 'density-grid-key-v1'
CELL = 512
SIZE = 2048
FIELD_TOLERANCE = 28
REVIEWED_07_SOURCE_SHA = '7e114e4020691c8e00e77db7e23394961066ff772aafda2aab64d047ea4ea558'
BODY_FRACTION = .65  # canonical missiles point left; trailing flame is on the right


def sha(data):
    return hashlib.sha256(data).hexdigest()


def magenta(rgb):
    r, g, b = rgb
    return r >= 190 and b >= 190 and g <= 85 and min(r, b)-g >= 110


def key_background(source, pickup_holes=False, strip_grid=False, preserve_enclosed_chroma=False):
    """Flood only near the actual border-field color; key pure-magenta holes.

    Near-magenta interior ornament is preserved unless connected to a cell's
    outside field. Exact #ff00ff holes are unambiguously the requested key.
    """
    rgba = source.convert('RGBA')
    w, h = rgba.size
    raw = rgba.tobytes()
    seeds = set()
    # Every frame has its own outside. Internal grid lines are seed locations too.
    for n in range(4):
        lo, hi = n*CELL, (n+1)*CELL-1
        for d in range(12 if strip_grid else 2):
            for p in range(SIZE):
                seeds.update(((lo+d)*w+p, (hi-d)*w+p, p*w+lo+d, p*w+hi-d))
    colors = Counter(tuple(raw[i*4:i*4+3]) for i in seeds if magenta(raw[i*4:i*4+3]))
    if not colors:
        raise ValueError('No magenta background field found on frame borders; refusing to guess a key')
    field = min(colors, key=lambda rgb: (-colors[rgb], rgb))
    tolerance = 76 if pickup_holes else FIELD_TOLERANCE
    chroma_min = 160 if pickup_holes else 190
    red, green, blue, alpha = rgba.split()
    def threshold(channel, predicate):
        return channel.point([255 if predicate(v) else 0 for v in range(256)])
    def intersect(channels):
        result = channels[0]
        for channel in channels[1:]: result = ImageChops.multiply(result, channel)
        return result
    near = intersect([threshold(channel, lambda v, target=target: abs(v-target) <= tolerance)
                      for channel, target in zip((red, green, blue), field)])
    chroma = intersect([threshold(red, lambda v: v >= chroma_min), threshold(blue, lambda v: v >= chroma_min),
        threshold(green, lambda v: v <= 85), threshold(ImageChops.subtract(red, green), lambda v: v >= 110),
        threshold(ImageChops.subtract(blue, green), lambda v: v >= 110)])
    grid_mask = Image.new('L', (w, h))
    grid_rectangles = []
    if strip_grid:
        grid_draw = ImageDraw.Draw(grid_mask)
        for axis in ['x', 'y']:
            for boundary in range(0, SIZE+1, CELL):
                selected = []
                for coordinate in range(max(0, boundary-8), min(SIZE, boundary+8)):
                    indices = (p*w+coordinate for p in range(h)) if axis == 'x' else (coordinate*w+p for p in range(w))
                    if all(max(raw[i*4:i*4+3]) <= 32 for i in indices): selected.append(coordinate)
                if selected:
                    if max(selected)-min(selected)+1 > 10 or len(selected) != max(selected)-min(selected)+1:
                        raise ValueError(f'Grid separator is not a contiguous <=10px black band at {axis}={boundary}')
                    box = [min(selected), 0, max(selected)+1, h] if axis == 'x' else [0, min(selected), w, max(selected)+1]
                    grid_draw.rectangle((box[0], box[1], box[2]-1, box[3]-1), fill=255)
                    grid_rectangles.append(box)
    grid_fringe_pixels = 0
    if strip_grid and grid_rectangles:
        # All matte separator remnants inside the authorized ten-pixel
        # boundary are eligible, including isolated antialias pockets.
        fringe = Image.new('L',(w,h),255)
        fringe_bytes = fringe.tobytes();grid_bytes=bytearray(grid_mask.tobytes())
        for i, edge in enumerate(fringe_bytes):
            if not edge: continue
            x,y=i%w,i//w
            # Only the documented ten-pixel frame boundary region is eligible.
            if min(x%CELL,CELL-1-x%CELL,y%CELL,CELL-1-y%CELL)>=10: continue
            r,g,b=raw[i*4:i*4+3]
            if max(r,g,b)<=40 or (g<=85 and abs(r-b)<=55 and min(r,b)-g>=18):
                grid_bytes[i]=255;grid_fringe_pixels+=1
        grid_mask=Image.frombytes('L',(w,h),bytes(grid_bytes))
    candidates = ImageChops.lighter(ImageChops.lighter(ImageChops.multiply(near, chroma), grid_mask), threshold(alpha, lambda v: v == 0)).tobytes()
    hollow_seeds = []
    if pickup_holes:
        for row in [2, 3]:
            for col in range(4):
                x, y = col*CELL+CELL//2, row*CELL+CELL//2
                if not candidates[y*w+x]: raise ValueError(f'Expected near-field hollow shield center at {x},{y}; refusing to erase artwork')
                seeds.add(y*w+x);hollow_seeds.append([x,y])
    mask = bytearray(w*h)
    todo = deque()
    for i in sorted(seeds):
        if candidates[i] and not mask[i]:
            mask[i] = 255
            todo.append(i)
    while todo:
        i = todo.popleft()
        x, y = i % w, i // w
        neighbors = []
        if x: neighbors.append(i-1)
        if x+1 < w: neighbors.append(i+1)
        if y: neighbors.append(i-w)
        if y+1 < h: neighbors.append(i+w)
        for j in neighbors:
            if candidates[j] and not mask[j]:
                mask[j] = 255
                todo.append(j)
    enclosed_components=[]
    if pickup_holes:
        # Approved pickup palette has no magenta. Include every enclosed
        # actual-field component, recording one deterministic seed per pocket.
        for seed in range(w*h):
            if not candidates[seed] or mask[seed]: continue
            mask[seed]=255;todo.append(seed);count=0
            while todo:
                i=todo.popleft();count+=1;x,y=i%w,i//w
                for j in ([i-1] if x else [])+([i+1] if x+1<w else [])+([i-w] if y else [])+([i+w] if y+1<h else []):
                    if candidates[j] and not mask[j]:mask[j]=255;todo.append(j)
            enclosed_components.append({'seed':[seed%w,seed//w],'pixels':count})
    flood_mask = Image.frombytes('L', (w, h), bytes(mask))
    exact = Image.new('L',(w,h)) if preserve_enclosed_chroma else intersect([threshold(red, lambda v: v == 255), threshold(green, lambda v: v == 0), threshold(blue, lambda v: v == 255)])
    key_mask = ImageChops.lighter(flood_mask, exact)
    exact_holes = ImageChops.subtract(exact, flood_mask).histogram()[255]
    keyed = rgba.copy()
    keyed.putalpha(ImageChops.subtract(alpha, key_mask))
    # Channel operations cannot repaint RGB; verify that invariant in C too.
    assert ImageChops.difference(keyed.convert('RGB'), rgba.convert('RGB')).getbbox() is None
    unmasked_alpha_change = ImageChops.multiply(ImageChops.difference(keyed.getchannel('A'), alpha), ImageChops.invert(key_mask))
    assert unmasked_alpha_change.getbbox() is None
    changed = w*h-ImageChops.difference(keyed.getchannel('A'), alpha).histogram()[0]
    return keyed, key_mask, {'fieldRGB': list(field), 'nearFieldChannelTolerance': tolerance, 'minimumChromaChannel': chroma_min,
        'hollowShieldSeeds': hollow_seeds, 'enclosedPickupFieldComponents': enclosed_components,
        'pickupOnlyAllNearFieldComponents':pickup_holes,'preserveEnclosedChroma':preserve_enclosed_chroma, 'gridSeparatorRectangles': grid_rectangles,
        'gridFringePixels':grid_fringe_pixels,'gridFringeRadiusPixels':10 if strip_grid else 0,'gridFringeMaxFrameBoundaryDistance':10 if strip_grid else 0,
        'floodConnectivity': 4, 'floodedPixels': flood_mask.histogram()[255], 'enclosedPureMagentaPixels': exact_holes,
        'changedAlphaPixels': changed, 'allRGBPreservedByteExact': True, 'unmaskedRGBAPreservedByteExact': True}


def unmix_pickup_edges(image, key_mask, field, minimum_channel=0, minimum_excess=19):
    """Remove actual chroma contamination only within 2px of keyed field.

    Interior art, native red/gold/cyan, and all pixels outside this mask remain
    byte-identical. This is foreground/background alpha unmix, not recoloring.
    """
    boundary = ImageChops.subtract(key_mask.filter(ImageFilter.MaxFilter(5)), key_mask).tobytes()
    raw = image.tobytes();out = bytearray(raw);changed = bytearray(image.width*image.height)
    for i, adjacent in enumerate(boundary):
        if not adjacent: continue
        p=i*4;r,g,b,old_alpha=raw[p:p+4]
        if not old_alpha or min(r,b)<minimum_channel or min(r,b)-g<minimum_excess: continue
        red = r>=140 and r-b>=65 and r-g>=50
        gold = r>=140 and g>=80 and b<=g*.9
        cyan = g>=100 and b>=140 and r<=g*.8
        if red or gold or cyan: continue
        alpha=max(g/255,1-r/max(1,field[0]),1-b/max(1,field[2]))
        alpha=max(0,min(1,alpha))
        a=min(old_alpha,round(alpha*255))
        if a == 0: rgb=[r,g,b]
        else: rgb=[max(0,min(255,round((c-(1-alpha)*bg)/alpha))) for c,bg in zip((r,g,b),field)]
        value=bytes(rgb+[a])
        if value != raw[p:p+4]:out[p:p+4]=value;changed[i]=255
    result=Image.frombytes('RGBA',image.size,bytes(out));mask=Image.frombytes('L',image.size,bytes(changed))
    # Verify ALL RGBA channels outside the separately recorded edge-change mask.
    difference=ImageChops.difference(image,result)
    inverse=ImageChops.invert(mask)
    assert all(ImageChops.multiply(c,inverse).getbbox() is None for c in difference.split())
    return result,mask,{'method':'actual-field alpha-unmix within2px of keyed outside/hollow field',
        'actualFieldRGB':field,'boundaryRadiusPixels':2,'minimumChromaExcess':minimum_excess,'minimumRedBlueChannel':minimum_channel,
        'alphaFormula':'max(G/255, 1-R/bgR, 1-B/bgB), clamped0..1',
        'foregroundFormula':'(sourceRGB-(1-alpha)*actualFieldRGB)/alpha',
        'protectedNativeColors':['obvious red','gold','cyan'],'changedPixels':mask.histogram()[255],
        'allRGBAOutsideEdgeMaskByteExact':True}


def remove_isolated_background(image, reviewed_boxes=()):
    """Remove only tiny magenta matte components well away from the body."""
    alpha=image.getchannel('A').tobytes();raw=image.tobytes();w,h=image.size
    visited=bytearray(w*h);components=[]
    for seed,a in enumerate(alpha):
        if not a or visited[seed]:continue
        visited[seed]=1;todo=[seed];pixels=[]
        while todo:
            i=todo.pop();pixels.append(i);x,y=i%w,i//w
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    if not(dx or dy) or not(0<=x+dx<w and 0<=y+dy<h):continue
                    j=(y+dy)*w+x+dx
                    if alpha[j] and not visited[j]:visited[j]=1;todo.append(j)
        xs=[i%w for i in pixels];ys=[i//w for i in pixels]
        components.append((pixels,[min(xs),min(ys),max(xs)+1,max(ys)+1]))
    if not components:raise ValueError('Empty frame during isolated-background cleanup')
    main=max(components,key=lambda c:len(c[0]))[1];mask=bytearray(w*h);removed=[]
    for pixels,box in components:
        distance=max(main[0]-box[2],box[0]-main[2],main[1]-box[3],box[1]-main[3],0)
        reviewed=box in reviewed_boxes and len(pixels)==27
        if distance<=24 or (not reviewed and len(pixels)>16):continue
        if not reviewed and not all(min(raw[i*4],raw[i*4+2])>=150 and min(raw[i*4],raw[i*4+2])-raw[i*4+1]>=110 for i in pixels):continue
        for i in pixels:mask[i]=255
        removed.append({'seed':[pixels[0]%w,pixels[0]//w],'pixels':len(pixels),'bounds':box,'distanceFromDominantBodyBounds':distance,'explicitRootReviewedException':reviewed})
    result=image.copy();changed=Image.frombytes('L',image.size,bytes(mask));result.putalpha(ImageChops.subtract(image.getchannel('A'),changed))
    return result,changed,removed


def union(boxes):
    left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
    return [left, top, max(b[2] for b in boxes)-left, max(b[3] for b in boxes)-top]


def validate_cells(image):
    cells, boxes = [], []
    for row in range(4):
        row_cells, row_boxes = [], []
        for col in range(4):
            cell = image.crop((col*CELL, row*CELL, (col+1)*CELL, (row+1)*CELL))
            box = cell.getchannel('A').getbbox()
            if box is None:
                raise ValueError(f'Empty frame at row {row+1}, column {col+1}')
            if min(box[:2]) < 2 or max(box[2:]) > CELL-2:
                raise ValueError(f'Partial/cutoff frame at row {row+1}, column {col+1}: {box}; require 2px transparent margin')
            row_cells.append(cell)
            row_boxes.append(list(box))
        cells.append(row_cells)
        boxes.append(row_boxes)
    return cells, boxes


def largest_rectangle(mask, width, height):
    """Largest all-true rectangle, deterministic ties prefer left/top."""
    heights = [0]*width
    best, area = None, 0
    for y in range(height):
        for x in range(width):
            heights[x] = heights[x]+1 if mask[y*width+x] else 0
        stack = []
        for x in range(width+1):
            current = heights[x] if x < width else 0
            start = x
            while stack and stack[-1][1] > current:
                left, high = stack.pop()
                candidate = [left, y-high+1, x-left, high]
                candidate_area = candidate[2]*candidate[3]
                if candidate_area > area or (candidate_area == area and best is not None and (candidate[0], candidate[1]) < (best[0], best[1])):
                    best, area = candidate, candidate_area
                start = left
            if not stack or stack[-1][1] < current:
                stack.append((start, current))
    return best


def oriented_bounds(cells,bounds,rotation):
    """Exact union of transformed actual alpha-pixel corners, crop-center local."""
    c,s=(-math.sqrt(.5),-math.sqrt(.5)) if abs(rotation+3*math.pi/4)<1e-12 else (math.cos(rotation),math.sin(rotation))
    x0,y0=bounds[0]+bounds[2]/2,bounds[1]+bounds[3]/2
    x_offsets=[0,c,-s,c-s];y_offsets=[0,s,c,s+c]
    xmin=ymin=float('inf');xmax=ymax=float('-inf')
    for image in cells:
        for i,a in enumerate(image.getchannel('A').tobytes()):
            if not a:continue
            x,y=i%CELL-x0,i//CELL-y0;rx,ry=x*c-y*s,x*s+y*c
            xmin=min(xmin,rx+min(x_offsets));xmax=max(xmax,rx+max(x_offsets))
            ymin=min(ymin,ry+min(y_offsets));ymax=max(ymax,ry+max(y_offsets))
    if not all(math.isfinite(v) for v in [xmin,ymin,xmax,ymax]):raise ValueError('Empty oriented alpha bounds')
    return[xmin,ymin,xmax-xmin,ymax-ymin]


def common_body_core(cells, bounds, rotation=0, oriented=None):
    alpha = [c.getchannel('A').tobytes() for c in cells]
    common = bytearray(all(a[i] == 255 for a in alpha) for i in range(CELL*CELL))
    x, y, w, h = bounds
    # Exclude trailing flame and outer tips/wings from the candidate body area.
    roi = [x, y+int(h*.15), max(1, int(w*BODY_FRACTION)), max(1, int(h*.70))]
    rx, ry, rw, rh = roi
    body = bytearray(common[i] if rx <= i % CELL < rx+rw and ry <= i // CELL < ry+rh else 0 for i in range(CELL*CELL))
    if rotation:
        c,s=(-math.sqrt(.5),-math.sqrt(.5)) if abs(rotation+3*math.pi/4)<1e-12 else (math.cos(rotation),math.sin(rotation))
        ox,oy,ow,oh=oriented;roi=[ox,oy+oh*.15,ow*BODY_FRACTION,oh*.70];rx,ry,rw,rh=roi
        body=bytearray(CELL*CELL)
        for i,value in enumerate(common):
            if not value:continue
            dx,dy=i%CELL+.5-x-w/2,i//CELL+.5-y-h/2;px,py=dx*c-dy*s,dx*s+dy*c
            if rx<=px<rx+rw and ry<=py<ry+rh:body[i]=1
    core = largest_rectangle(body, CELL, CELL)
    if core is None or core[2] < 6 or core[3] < 6:
        raise ValueError(f'No useful fully opaque common solid-body core: {core}; frames may drift or art may be glow-only')
    cx, cy, cw, ch = core
    assert all(a[py*CELL+px] == 255 for a in alpha for py in range(cy, cy+ch) for px in range(cx, cx+cw))
    return core, Image.frombytes('L', (CELL, CELL), bytes(v*255 for v in common)), {
        'method': 'largest-inscribed-rectangle-in-four-frame-fully-opaque-intersection',
        'solidBodySearchROI': roi, 'solidBodySearchROICoordinates':'oriented-crop-center-local' if rotation else 'native-cell', 'canonicalDirection': 'left',
        'trailingFlameExcluded': 'rightmost35percent-of-common-union-crop',
        'outerTipsExcluded': 'top-and-bottom15percent-of-common-union-crop',
        'commonOpaquePixels': sum(common), 'coreAreaPixels': cw*ch,
        'requiresVisualBodyReview': True}


def png_bytes(image):
    import io
    stream = io.BytesIO()
    image.save(stream, format='PNG', optimize=False, compress_level=9)
    return stream.getvalue()


def review_sheet(image, destination, title, core=None):
    preview_w = 1024 if image.height == CELL else 768
    preview_h = image.height*preview_w//image.width
    sheet = Image.new('RGB', (preview_w, (preview_h+28)*3+32), '#18202b')
    draw = ImageDraw.Draw(sheet)
    draw.text((10, 8), title, fill='white')
    for panel, name in enumerate(['Alpha / checkerboard', 'Dark background', 'Light background']):
        top = 32+panel*(preview_h+28)
        bg = Image.new('RGBA', image.size, '#111827' if panel == 1 else '#f1f5f9')
        if panel == 0:
            tiles = ImageDraw.Draw(bg)
            for y in range(0, image.height, 32):
                for x in range(0, image.width, 32):
                    tiles.rectangle((x, y, x+31, y+31), fill='#9ca3af' if (x//32+y//32)%2 else '#d1d5db')
        bg.alpha_composite(image)
        preview = bg.convert('RGB').resize((preview_w, preview_h), Image.Resampling.NEAREST)
        sheet.paste(preview, (0, top+24))
        draw.text((8, top+6), name+(' · green box = proposed common solid core' if core and panel == 0 else ''), fill='white')
        if core and panel == 0:
            ratio = preview_w/image.width
            for col in range(4):
                x, y, w, h = core
                draw.rectangle(((col*CELL+x)*ratio, top+24+y*ratio, (col*CELL+x+w)*ratio, top+24+(y+h)*ratio), outline='#00ff80', width=1)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)


def prepare(source_path, start_stage=None, output_root=None, review_dir=None, rows=None, strip_grid=False, protected_sources=(), rotation_degrees=None):
    source_path = Path(source_path).resolve()
    protected_paths = {source_path, *(Path(p).resolve() for p in protected_sources)}
    source_bytes = source_path.read_bytes()
    with Image.open(source_path) as original:
        if original.size != (SIZE, SIZE):
            raise ValueError(f'Native source must be 2048x2048, got {original.size}')
        source_mode = original.mode
        source_rgba = original.convert('RGBA')
        keyed, mask, key_info = key_background(original, pickup_holes=start_stage is None, strip_grid=strip_grid)
    edge_mask, edge_info = None, None
    if start_stage is None: keyed, edge_mask, edge_info = unmix_pickup_edges(keyed, mask, key_info['fieldRGB'])
    row_edges={};row_isolated={}
    if start_stage is not None:
        for row in range(4):
            stage=start_stage+row
            if rows and row+1 not in rows:continue
            if stage==5:continue  # preserve the complete intentional neon palette
            strip=keyed.crop((0,row*CELL,SIZE,(row+1)*CELL));row_mask=mask.crop((0,row*CELL,SIZE,(row+1)*CELL))
            isolated_mask=Image.new('L',strip.size);isolated=[]
            for col in range(4):
                cell=strip.crop((col*CELL,0,(col+1)*CELL,CELL));reviewed=[[106,33,111,41]] if stage==7 and col==2 and sha(source_bytes)==REVIEWED_07_SOURCE_SHA else []
                clean,changed,components=remove_isolated_background(cell,reviewed)
                strip.paste(clean,(col*CELL,0));isolated_mask.paste(changed,(col*CELL,0));isolated.extend({'column':col,'sourceBounds':[c['bounds'][0]+col*CELL,c['bounds'][1]+row*CELL,c['bounds'][2]+col*CELL,c['bounds'][3]+row*CELL],**c} for c in components)
            row_mask=ImageChops.lighter(row_mask,isolated_mask)
            strip,changed,edge_details=unmix_pickup_edges(strip,row_mask,key_info['fieldRGB'],minimum_channel=180,minimum_excess=110)
            keyed.paste(strip,(0,row*CELL));row_edges[stage]=(changed,edge_details);row_isolated[stage]=(isolated_mask,isolated)
    cells, boxes = validate_cells(keyed)
    root = Path(output_root or Path(__file__).resolve().parents[1]/'art/generated')
    pending = []
    if start_stage is not None:
        for row in range(4):
            if rows and row+1 not in rows: continue
            number = start_stage+row
            output = root/'missiles'/f'{number:02d}'/'missile.png'
            strip = keyed.crop((0, row*CELL, SIZE, (row+1)*CELL))
            row_mask = mask.crop((0, row*CELL, SIZE, (row+1)*CELL))
            bounds = union(boxes[row])
            rotation=math.radians(rotation_degrees) if rotation_degrees is not None else 0
            if rotation and (number not in [11,12] or abs(rotation+3*math.pi/4)>1e-12):raise ValueError('Source-angle correction is approved only at-135degrees for stages11/12')
            oriented=oriented_bounds(cells[row],bounds,rotation) if rotation else None
            core, intersection, core_info = common_body_core(cells[row], bounds, rotation, oriented)
            cx,cy,cw,ch=core
            for col in range(4):
                native_core=source_rgba.crop((col*CELL+cx,row*CELL+cy,col*CELL+cx+cw,row*CELL+cy+ch))
                output_core=strip.crop((col*CELL+cx,cy,col*CELL+cx+cw,cy+ch))
                assert native_core.tobytes()==output_core.tobytes(),'Proposed solid core pixels must retain native RGBA byte exact'
            core_info['allFourSourceCoreRGBAPreservedByteExact']=True
            pending.append((output, strip, row_mask, {'stage': number, 'bounds': bounds, 'core': core,
                'coreAnalysis': core_info, 'frameBounds': boxes[row],
                **({'rotation':rotation,'rotationMatrix':[-math.sqrt(.5),-math.sqrt(.5)],'orientedBounds':oriented,'orientation':{'method':'rotated-actual-positive-alpha-pixel-corners-about-native-common-crop-center','sourcePixelsRotated':False,'targetFacing':'left','sourceRotationDegrees':rotation_degrees}} if rotation else {})}, intersection))
    else:
        output = root/'pickups'/'items.png'
        pending.append((output, keyed, mask, {'rowBounds': [union(row) for row in boxes], 'frameBounds': boxes}, None))
    # Never overwrite a native input, including through symlinks or sidecar paths.
    for output, image, key_mask, detail, intersection in pending:
        destinations = [output, output.with_suffix('.json'), output.with_suffix('.key-mask.png')]
        if intersection is not None: destinations.append(output.with_suffix('.common-opaque.png'))
        local_edge=row_edges.get(detail.get('stage'),(edge_mask,edge_info))[0]
        if local_edge is not None: destinations.append(output.with_suffix('.edge-unmix-mask.png'))
        if detail.get('stage') in row_isolated:destinations.append(output.with_suffix('.isolated-background-mask.png'))
        if review_dir:
            name = f'missile-{detail["stage"]:02d}' if 'stage' in detail else 'pickups'
            destinations.append(Path(review_dir)/(name+'-alpha-dark-light.png'))
        if any(path.resolve() in protected_paths for path in destinations):
            raise ValueError('Input/native path collides with an output or provenance path; source preservation requires a distinct destination')
    records = []
    # Validate every row first, then write review-only artifacts. No partial accepted set.
    for output, image, key_mask, detail, intersection in pending:
        image_bytes, mask_bytes = png_bytes(image), png_bytes(key_mask)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(image_bytes)
        mask_path = output.with_suffix('.key-mask.png')
        mask_path.write_bytes(mask_bytes)
        record = {'algorithm': VERSION, 'status': 'pending-root-visual-review', 'sourceFile': str(source_path),
            'sourceSha256': sha(source_bytes), 'sourceMode': source_mode, 'sourceSize': [SIZE, SIZE],
            'outputSha256': sha(image_bytes), 'outputSize': list(image.size), 'keyMaskSha256': sha(mask_bytes),
            'maskMeaning': '255=background alpha keyed, 0=source RGBA preserved byte exact', 'keying': key_info, **detail}
        local_edge,local_edge_info=row_edges.get(detail.get('stage'),(edge_mask,edge_info))
        if detail.get('stage') in row_isolated:
            isolated_mask,components=row_isolated[detail['stage']];isolated_bytes=png_bytes(isolated_mask);output.with_suffix('.isolated-background-mask.png').write_bytes(isolated_bytes)
            record['isolatedBackgroundRemoval']={'components':components,'maximumAutomaticComponentPixels':16,'minimumBodyDistancePixels':24,'matteChromaRule':'min(R,B)>=150 and min(R,B)-G>=110','maskSha256':sha(isolated_bytes)}
        if local_edge is not None:
            edge_bytes=png_bytes(local_edge);output.with_suffix('.edge-unmix-mask.png').write_bytes(edge_bytes)
            record['edgeUnmix']={**local_edge_info,'maskSha256':sha(edge_bytes)}
            record['finalPreservation']='Source RGBA byte exact outside keyed background, isolated-background and recorded edge-unmix masks'
        if intersection is not None:
            intersection_bytes = png_bytes(intersection)
            output.with_suffix('.common-opaque.png').write_bytes(intersection_bytes)
            record['commonOpaqueMaskSha256'] = sha(intersection_bytes)
        output.with_suffix('.json').write_text(json.dumps(record, indent=2)+'\n')
        if review_dir:
            name = f'missile-{detail["stage"]:02d}' if 'stage' in detail else 'pickups'
            review_sheet(image, Path(review_dir)/(name+'-alpha-dark-light.png'), name, detail.get('core'))
        records.append({'path': str(output), **record})
    return records


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--missiles', type=Path)
    parser.add_argument('--start-stage', type=int, choices=[1, 5, 9])
    parser.add_argument('--pickups', type=Path)
    parser.add_argument('--single-stage',type=int,choices=[13],help='Extract only Redkev13 from one phase projectile row')
    parser.add_argument('--single-row',type=int,choices=[1,2,3,4],default=4)
    parser.add_argument('--source-rotation-degrees',type=float,choices=[-135.0],help='Approved native source-angle transform (stages11/12 only; no bitmap rotation)')
    parser.add_argument('--rows', type=int, nargs='+', choices=[1,2,3,4], help='Optional one-based missile rows; omitted rows are not written')
    parser.add_argument('--strip-grid-separators', action='store_true', help='Explicitly remove documented fully black <=10px boundary bands')
    parser.add_argument('--output-root', type=Path, help='Default: repository art/generated')
    parser.add_argument('--review-dir', type=Path, help='Optional alpha/dark/light proof contact sheets')
    args = parser.parse_args(argv)
    if not args.missiles and not args.pickups: parser.error('Provide --missiles and/or --pickups')
    if args.single_stage:
        if not args.missiles or args.start_stage:parser.error('--single-stage requires --missiles without --start-stage')
        args.start_stage=args.single_stage-args.single_row+1;args.rows=[args.single_row]
    if bool(args.missiles) != bool(args.start_stage): parser.error('--missiles requires --start-stage 1, 5, 9 or --single-stage13')
    try:
        records = []
        natives=[p for p in [args.missiles,args.pickups] if p is not None]
        if args.missiles: records += prepare(args.missiles, args.start_stage, args.output_root, args.review_dir, args.rows, args.strip_grid_separators, natives, args.source_rotation_degrees)
        if args.pickups: records += prepare(args.pickups, None, args.output_root, args.review_dir, protected_sources=natives)
        print(json.dumps({'status': 'pending-root-visual-review', 'assets': records}, indent=2))
    except (OSError, ValueError) as error:
        print(json.dumps({'error': str(error)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
