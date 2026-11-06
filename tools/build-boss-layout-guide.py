#!/usr/bin/env python3
"""Build a static 4x4 layout reference for a later sprite-sheet generation.

The same approved concept is repeated in every cell. THIS IS NOT AN ANIMATION
and must never be enabled as a gameplay atlas. No poses or frames are invented.
Opaque source images use conservative edge-connected background removal; existing
RGBA transparency is preserved automatically. Foreground RGB is never repainted.

  python3 tools/build-boss-layout-guide.py concept.png guide.png --cutout cutout.png
"""

import argparse
import hashlib
import json
from pathlib import Path
import statistics
import sys

from PIL import Image, ImageChops, ImageDraw, ImageOps


CELL = 512
GRID = 4
MAX_SIZE = 290


def corner_background(image):
    """Channel medians across four 8px corner patches resist individual noisy pixels."""
    width, height = image.size
    patch = min(8, width, height)
    samples = []
    for x, y in ((0, 0), (width - patch, 0), (0, height - patch),
                 (width - patch, height - patch)):
        samples.extend(image.crop((x, y, x + patch, y + patch)).convert("RGB").getdata())
    return tuple(int(statistics.median(pixel[channel] for pixel in samples)) for channel in range(3))


def edge_cutout(image, background, tolerance):
    """Only pixels connected to an outside edge and within the RGB tolerance are keyed."""
    pixels = image.getdata()
    candidates = bytes(255 if alpha == 0 or max(abs(r - background[0]), abs(g - background[1]),
                                                abs(b - background[2])) <= tolerance else 0
                       for r, g, b, alpha in pixels)
    mask = Image.frombytes("L", image.size, candidates)
    flooded = ImageOps.expand(mask, border=1, fill=255)
    ImageDraw.floodfill(flooded, (0, 0), 128, thresh=0)
    width, height = image.size
    connected = flooded.crop((1, 1, width + 1, height + 1)).point(lambda value: 255 if value == 128 else 0)
    cutout = image.copy()
    cutout.putalpha(ImageChops.subtract(image.getchannel("A"), connected))
    return cutout, connected.histogram()[255]


def build(source, output, tolerance=8, max_size=MAX_SIZE, background_mode="auto", cutout_path=None):
    source, output = Path(source), Path(output)
    if source.resolve() == output.resolve() or cutout_path and source.resolve() == Path(cutout_path).resolve():
        raise ValueError("Output paths must differ from the source concept")
    if cutout_path and output.resolve() == Path(cutout_path).resolve():
        raise ValueError("Guide and cutout must have different output paths")
    if output.suffix.lower() != ".png" or cutout_path and Path(cutout_path).suffix.lower() != ".png":
        raise ValueError("Guide and cutout outputs must use .png extensions")
    if not 0 <= tolerance <= 8:
        raise ValueError("Background tolerance must be 0..8 to protect dark foreground artwork")
    if not 1 <= max_size <= MAX_SIZE:
        raise ValueError("Maximum subject size must be 1..290 pixels")
    if background_mode not in ("auto", "edge", "alpha"):
        raise ValueError("Background mode must be auto, edge or alpha")
    with Image.open(source) as original:
        original_mode = original.mode
        rgba = original.convert("RGBA")
    background = corner_background(rgba)
    has_transparency = rgba.getchannel("A").getextrema()[0] < 255
    mode = "alpha" if background_mode == "alpha" or background_mode == "auto" and has_transparency else "edge"
    if mode == "alpha":
        cutout, removed = rgba.copy(), 0
    else:
        cutout, removed = edge_cutout(rgba, background, tolerance)
    bounds = cutout.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("No foreground remains; check the source transparency/background")
    trimmed = cutout.crop(bounds)
    scale = min(max_size / trimmed.width, max_size / trimmed.height, 1.0)
    draw_size = (max(1, min(max_size, round(trimmed.width * scale))),
                 max(1, min(max_size, round(trimmed.height * scale))))
    reference = trimmed.resize(draw_size, Image.Resampling.NEAREST)
    offset = ((CELL - draw_size[0]) // 2, (CELL - draw_size[1]) // 2)
    guide = Image.new("RGB", (CELL * GRID, CELL * GRID), (255, 0, 255))
    for row in range(GRID):
        for column in range(GRID):
            guide.paste(reference, (column * CELL + offset[0], row * CELL + offset[1]), reference)
    output.parent.mkdir(parents=True, exist_ok=True)
    guide.save(output, compress_level=9)
    cutout_hash = None
    if cutout_path:
        cutout_path = Path(cutout_path)
        cutout_path.parent.mkdir(parents=True, exist_ok=True)
        # Original canvas retained for direct source/alpha inspection; RGB stays exact.
        cutout.save(cutout_path, compress_level=9)
        cutout_hash = hashlib.sha256(cutout_path.read_bytes()).hexdigest()
    metadata = {
        "schemaVersion": 1, "kind": "static-concept-layout-guide",
        "guideOnly": True, "animation": False, "notForGameplay": True,
        "repeatedReferenceCells": 16,
        "purpose": "Registration and empty-margin reference for later independently generated animation frames",
        "source": source.name, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "sourceDimensions": list(rgba.size), "sourceMode": original_mode,
        "background": {"mode": mode, "requestedMode": background_mode,
                       "rgb": list(background), "estimator": "median of four 8px corner patches",
                       "metric": "maximum absolute RGB-channel difference", "tolerance": tolerance,
                       "connectedEdgeOnly": mode == "edge", "pixelsKeyed": removed},
        "foregroundRgbChanged": False, "sourceAlphaBounds": list(bounds),
        "sourceTouchesEdge": bounds[0] == 0 or bounds[1] == 0 or bounds[2] == rgba.width or bounds[3] == rgba.height,
        "columns": GRID, "rows": GRID, "cellWidth": CELL, "cellHeight": CELL,
        "maximumSubjectSize": max_size, "sourceToGuideScale": scale,
        "subjectDimensions": list(draw_size), "cellOffset": list(offset), "anchor": "center-center",
        "resampling": "nearest-neighbor; one identical transform for all 16 reference cells",
        "guideSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "cutout": cutout_path.name if cutout_path else None, "cutoutSha256": cutout_hash,
    }
    metadata_path = output.with_suffix(".json")
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
    return metadata_path, metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cutout", type=Path, help="Optional original-canvas RGBA cutout for inspection")
    parser.add_argument("--tolerance", type=int, default=8)
    parser.add_argument("--max-size", type=int, default=MAX_SIZE)
    parser.add_argument("--background-mode", choices=("auto", "edge", "alpha"), default="auto")
    args = parser.parse_args()
    try:
        metadata_path, metadata = build(args.source, args.output, args.tolerance, args.max_size,
                                        args.background_mode, args.cutout)
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"guide": str(args.output), "metadata": str(metadata_path),
                      "guideOnly": True, "animation": False,
                      "subjectDimensions": metadata["subjectDimensions"],
                      "sourceAlphaBounds": metadata["sourceAlphaBounds"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
