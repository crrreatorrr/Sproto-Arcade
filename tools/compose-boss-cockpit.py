#!/usr/bin/env python3
"""Bake an approved cockpit/pilot patch into sixteen real generated vehicle frames.

No animation frames are generated or duplicated. Only the explicit hard polygon mask
is replaced; every other atlas pixel is retained exactly. Coordinates in the JSON:
  {"polygon":[[sourceX,sourceY],...], "placements":[
    {"row":0,"column":0,"scale":0.2,"translate":[cellLocalX,cellLocalY]}, ...]}
Alternatively replace translate with sourceAnchor:[rawX,rawY], targetAnchor:[cellX,cellY].
Optional sourceHorizontalFlip:true mirrors source pixels and polygon together; anchors
still refer to the original unmirrored concept. All sixteen unique zero-based cells are required. Each transform is
cellPixel = scale * rawConceptPixel + translate; no shear, rotation or smoothing.

  python3 tools/compose-boss-cockpit.py concept.png raw-atlas.png placements.json composed.png
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageDraw, ImageOps


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def compose(source, atlas, specification, output, mask_output=None):
    source, atlas, specification, output = map(Path, (source, atlas, specification, output))
    metadata_path = output.with_suffix('.json')
    inputs = {p.resolve() for p in (source, atlas, specification)}
    outputs = [output, metadata_path] + ([Path(mask_output)] if mask_output else [])
    if any(p.resolve() in inputs for p in outputs) or len({p.resolve() for p in outputs}) != len(outputs):
        raise ValueError('Outputs must be distinct and must not overwrite any input')
    if output.suffix.lower() != '.png' or mask_output and Path(mask_output).suffix.lower() != '.png':
        raise ValueError('Composed atlas and optional mask must use PNG extensions')
    spec = json.loads(specification.read_text())
    concept = Image.open(source).convert('RGBA')
    original = Image.open(atlas).convert('RGBA')
    if original.width % 4 or original.height % 4:
        raise ValueError('Raw atlas must have an exact 4x4 cell grid')
    cw, ch = original.width // 4, original.height // 4
    polygon = spec.get('polygon')
    if not isinstance(polygon, list) or len(polygon) < 3 or any(
        not isinstance(p, list) or len(p) != 2 or not all(finite(v) and v == int(v) for v in p)
        or not 0 <= p[0] < concept.width or not 0 <= p[1] < concept.height for p in polygon):
        raise ValueError('Polygon needs at least three integer raw-source coordinate pairs inside the concept')
    source_mask = Image.new('L', concept.size, 0)
    ImageDraw.Draw(source_mask).polygon([tuple(p) for p in polygon], fill=255)
    alpha = concept.getchannel('A')
    ambiguous_alpha = alpha.point(lambda a: 255 if 0 < a < 255 else 0)
    if ImageChops.multiply(source_mask, ambiguous_alpha).getbbox():
        raise ValueError('Selected source contains partial alpha; hard composition requires opaque/transparent native pixels')
    source_mask = ImageChops.multiply(source_mask, alpha)
    source_bounds = source_mask.getbbox()
    if not source_bounds:
        raise ValueError('Polygon selects no opaque concept pixels')
    source_flip = spec.get('sourceHorizontalFlip', False)
    if type(source_flip) is not bool:
        raise ValueError('sourceHorizontalFlip must be boolean')
    if source_flip:
        concept, source_mask = ImageOps.mirror(concept), ImageOps.mirror(source_mask)
        source_bounds = source_mask.getbbox()
    placements = spec.get('placements')
    if not isinstance(placements, list) or len(placements) != 16:
        raise ValueError('Exactly sixteen explicit placements are required')
    result = original.copy()
    atlas_mask = Image.new('L', original.size, 0)
    seen, records = set(), []
    for placement in placements:
        row, col = placement.get('row'), placement.get('column')
        if type(row) is not int or type(col) is not int or not 0 <= row < 4 or not 0 <= col < 4 or (row, col) in seen:
            raise ValueError('Placements must cover each zero-based cell once')
        seen.add((row, col))
        scale, translation = placement.get('scale'), placement.get('translate')
        source_anchor, target_anchor = placement.get('sourceAnchor'), placement.get('targetAnchor')
        if source_anchor is not None or target_anchor is not None:
            if translation is not None:
                raise ValueError('Use either translate or the sourceAnchor/targetAnchor pair')
            if not all(isinstance(a, list) and len(a) == 2 and all(finite(v) for v in a)
                       for a in (source_anchor, target_anchor)) or not finite(scale):
                raise ValueError('Anchor placements need two finite source/target coordinate pairs and scale')
            ax, ay = source_anchor
            if not 0 <= ax < concept.width or not 0 <= ay < concept.height:
                raise ValueError('Source anchor must lie within the original native concept')
            if source_flip:
                ax = concept.width - 1 - ax
            translation = [target_anchor[0]-scale*ax, target_anchor[1]-scale*ay]
        if not finite(scale) or scale <= 0 or not isinstance(translation, list) or len(translation) != 2 or not all(finite(v) for v in translation):
            raise ValueError('Every placement needs positive uniform scale and two finite translation values')
        tx, ty = translation
        x0, y0, x1, y1 = source_bounds
        if min(scale*x0+tx, scale*y0+ty) < 0 or scale*x1+tx > cw or scale*y1+ty > ch:
            raise ValueError(f'Cell {row},{col}: transformed patch would be clipped by the cell boundary')
        inverse = (1/scale, 0, -tx/scale, 0, 1/scale, -ty/scale)
        patch = concept.transform((cw, ch), Image.Transform.AFFINE, inverse, Image.Resampling.NEAREST)
        mask = source_mask.transform((cw, ch), Image.Transform.AFFINE, inverse, Image.Resampling.NEAREST)
        if not mask.getbbox():
            raise ValueError(f'Cell {row},{col}: scale leaves an empty patch')
        if set(mask.getdata()) - {0, 255}:
            raise ValueError('Internal error: patch mask must remain binary')
        offset = (col*cw, row*ch)
        result.paste(patch, offset, mask)
        atlas_mask.paste(mask, offset)
        composed_cell = result.crop((*offset, offset[0]+cw, offset[1]+ch))
        if any(ImageChops.multiply(channel, mask).getbbox() for channel in ImageChops.difference(composed_cell, patch).split()):
            raise ValueError('Internal error: selected native pixels changed during composition')
        records.append({'row':row, 'column':col, 'scale':scale, 'translate':translation,
                        'cellPatchBounds':list(mask.getbbox()), 'patchPixels':mask.histogram()[255],
                        'inverseAffine':list(inverse), 'sourceAnchor':source_anchor, 'targetAnchor':target_anchor})
    # Inspect all RGBA channels independently; an unchanged alpha must not hide RGB differences.
    outside = ImageChops.invert(atlas_mask)
    diff = ImageChops.difference(original, result)
    if any(ImageChops.multiply(channel, outside).getbbox() for channel in diff.split()):
        raise ValueError('Internal error: an atlas pixel outside the explicit masks changed')
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, compress_level=9)
    if mask_output:
        mask_output = Path(mask_output)
        mask_output.parent.mkdir(parents=True, exist_ok=True)
        atlas_mask.save(mask_output, compress_level=9)
    metadata = {'schemaVersion':1, 'kind':'approved-native-cockpit-composition',
                'animationFramesGenerated':False, 'vehicleAnimationSource':'existing genuine input atlas, unchanged outside explicit masks',
                'includesPilot':True, 'requiresVisualReview':True, 'productionEnabled':False,
                'source':str(source), 'sourceSha256':digest(source), 'sourceDimensions':list(concept.size),
                'atlas':str(atlas), 'atlasSha256':digest(atlas), 'atlasDimensions':list(original.size),
                'specification':str(specification), 'specificationSha256':digest(specification),
                'polygon':polygon, 'sourceHorizontalFlip':source_flip, 'sourceMaskBoundsAfterFlip':list(source_bounds),
                'maskPolicy':'hard binary polygon intersected with opaque source alpha; no feather, blending, repaint or interpolation',
                'transform':'cellLocalPixel = (horizontalFlip ? [sourceWidth-1-rawX, rawY] : rawConceptPixel) * uniformScale + translate; anchors refer to original unmirrored source',
                'resampling':'nearest-neighbor', 'columns':4, 'rows':4, 'placements':records,
                'checks':{'outsideMaskRgbaByteExact':True, 'insideMaskMatchesNearestNativeSource':True, 'all16UniqueCells':True},
                'output':str(output), 'outputSha256':digest(output),
                'maskOutput':str(mask_output) if mask_output else None,
                'maskSha256':digest(mask_output) if mask_output else None}
    metadata_path.write_text(json.dumps(metadata, indent=2)+'\n')
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in ('source', 'atlas', 'specification', 'output'):
        parser.add_argument(name, type=Path)
    parser.add_argument('--mask-output', type=Path)
    args = parser.parse_args()
    try:
        metadata = compose(args.source, args.atlas, args.specification, args.output, args.mask_output)
    except (ValueError, OSError, TypeError, KeyError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1
    print(json.dumps({'output':str(args.output), 'outputSha256':metadata['outputSha256'],
                      'checks':metadata['checks'], 'requiresVisualReview':True}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
