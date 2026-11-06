#!/usr/bin/env python3
"""Clean a generated 4x4 magenta sprite grid into a registered transparent atlas.

Every output cell comes from its corresponding source cell. No frames are invented,
duplicated, interpolated or reordered. One crop/scale/anchor is shared across all
sixteen cells, preserving relative projectile sizes and animation registration.

  python3 tools/prepare-boss-atlas.py source.png boss/p1.png
  python3 tools/prepare-boss-atlas.py source.png boss/projectiles.png --kind projectiles
"""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

from PIL import Image, ImageDraw


spec = importlib.util.spec_from_file_location("boss_clip", Path(__file__).with_name("extract-boss-clip.py"))
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


def strip_grid(image, radius, chroma_key="magenta"):
    """Remove only verified, edge-spanning black divider runs near grid boundaries.

    Colored pixels make a candidate fail. A short black shape at an edge cannot
    qualify: every one of the four cell-edge segments must be >=98% near-black,
    and the divider must have mostly magenta surroundings on at least one side.
    """
    if not radius:
        return image, []
    width, height = image.size
    cell = width // 4
    if radius < 1 or radius > min(32, cell // 8):
        raise ValueError("--strip-grid must be 1..32 and no greater than one eighth of a source cell")
    source = image.load()
    def black(pixel):
        r, g, b, a = pixel
        return a >= 250 and max(r, g, b) <= 45
    def magenta(pixel):
        r, g, b, a = pixel
        return a == 0 or (g >= 180 and g-max(r,b) >= 95 if chroma_key == "green" else
                          min(r, b) >= 180 and min(r, b) - g >= 95 and abs(r - b) <= 65)
    def fringe(pixel):
        r, g, b, a = pixel
        if chroma_key == "green":
            return a >= 250 and 35 <= g <= 210 and max(r,b) <= 95 and abs(r-b) <= 15 and g-max(r,b) >= 20
        return (a >= 250 and 35 <= min(r, b) and max(r, b) <= 190
                and abs(r - b) <= 30 and g <= 75 and min(r, b) - g >= 20)
    def line(axis, coordinate):
        return [source[coordinate, other] if axis == "x" else source[other, coordinate]
                for other in range(height if axis == "x" else width)]
    bands = []
    for axis, extent in (("x", width), ("y", height)):
        for boundary in range(0, extent + 1, cell):
            candidates = []
            for coordinate in range(max(0, boundary - radius), min(extent, boundary + radius)):
                pixels = line(axis, coordinate)
                if all(sum(black(p) for p in pixels[start:start + cell]) >= cell * .98
                       for start in range(0, len(pixels), cell)) and all(black(p) or magenta(p) for p in pixels):
                    candidates.append(coordinate)
            if not candidates:
                continue
            groups = []
            for coordinate in candidates:
                if groups and coordinate == groups[-1][-1] + 1:
                    groups[-1].append(coordinate)
                else:
                    groups.append([coordinate])
            for group in groups:
                start, end = group[0], group[-1] + 1
                if not (start <= boundary < end or start <= boundary - 1 < end):
                    continue
                core = [start, end]
                # Compression can spread a verified divider over several pixels.
                # Extend only within the requested radius across edge-spanning fringe;
                # a colored muzzle flash or subject pixel prevents extension.
                for direction in (-1, 1):
                    for unused in range(radius):
                        coordinate = start - 1 if direction < 0 else end
                        if not (max(0, boundary - radius) <= coordinate < min(extent, boundary + radius)):
                            break
                        pixels = line(axis, coordinate)
                        if not all(black(p) or fringe(p) or magenta(p) for p in pixels):
                            break
                        if direction < 0:
                            start -= 1
                        else:
                            end += 1
                neighbors = [n for n in (start - 1, end) if 0 <= n < extent]
                if not any(sum(magenta(p) for p in line(axis, n)) / extent >= .8 for n in neighbors):
                    continue
                bands.append({"axis": axis, "boundary": boundary, "start": start, "end": end,
                              "nearBlackCore": core,
                              "rectangle": [start, 0, end - start, height] if axis == "x"
                              else [0, start, width, end - start]})
    cleaned = image.copy()
    draw = ImageDraw.Draw(cleaned)
    for band in bands:
        x, y, w, h = band["rectangle"]
        draw.rectangle((x, y, x + w - 1, y + h - 1), fill=(0, 255, 0, 255) if chroma_key == "green" else (255, 0, 255, 255))
    return cleaned, bands


def build(source, output, cell_size=512, padding=12, min_background=0.2, kind="boss", strip_grid_pixels=0, chroma_key="magenta"):
    if chroma_key not in ("magenta", "green"):
        raise ValueError("Chroma key must be magenta or green")
    if output.suffix.lower() != ".png":
        raise ValueError("Output must have .png extension")
    if not 0 < min_background < 1:
        raise ValueError("Minimum background fraction must be between 0 and 1")
    if kind not in ("boss", "projectiles"):
        raise ValueError("Kind must be boss or projectiles")
    with Image.open(source) as original:
        image = original.convert("RGBA")
    width, height = image.size
    if width != height or width % 4 or width < 64:
        raise ValueError(f"Source must be a square 4x4 grid with equal cells; received {width}x{height}")
    image, removed_bands = strip_grid(image, strip_grid_pixels, chroma_key)
    source_cell = width // 4
    frames, boxes, removed_counts = [], [], []
    for index in range(16):
        column, row = index % 4, index // 4
        frame = image.crop((column * source_cell, row * source_cell,
                            (column + 1) * source_cell, (row + 1) * source_cell))
        try:
            frame, bounds, removed = shared.matte(frame, 0, min_background, chroma_key)
        except ValueError as error:
            raise ValueError(f"Source row {row + 1}, column {column + 1}: {error}") from error
        # Removed dividers are still real source boundaries. Art abutting a
        # divider was clipped by the generator; deleting the divider cannot fix it.
        usable = [0, 0, source_cell, source_cell]
        for band in removed_bands:
            axis = 0 if band["axis"] == "x" else 1
            cell_start = (column if axis == 0 else row) * source_cell
            cell_end = cell_start + source_cell
            if band["start"] <= cell_start < band["end"]:
                usable[axis] = max(usable[axis], band["end"] - cell_start)
            if band["start"] < cell_end <= band["end"]:
                usable[axis + 2] = min(usable[axis + 2], band["start"] - cell_start)
        if (bounds[0] <= usable[0] + 1 or bounds[1] <= usable[1] + 1
                or bounds[2] >= usable[2] - 1 or bounds[3] >= usable[3] - 1):
            raise ValueError(f"Source row {row + 1}, column {column + 1}: artwork touches a source cell/grid "
                             f"boundary after divider removal (art bounds {bounds}, usable {usable}); "
                             "regenerate with wider magenta margins")
        frames.append(frame)
        boxes.append(bounds)
        removed_counts.append(removed)
    states = shared.STATES if kind == "boss" else shared.PROJECTILE_STATES
    atlas, geometry = shared.pack_frames(frames, boxes, cell_size, padding, states)
    for index, frame in enumerate(geometry["frames"]):
        frame["sourceCell"] = [index % 4 * source_cell, index // 4 * source_cell, source_cell, source_cell]
        frame["backgroundPixelsRemoved"] = removed_counts[index]
    metadata = {
        "schemaVersion": 1, "kind": "prepared-image-sprite-atlas", "assetKind": kind,
        "source": source.name, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "sourceDimensions": [width, height], "sourceFrameDimensions": [source_cell] * 2,
        "gridRemoval": {"maximumBoundaryDistance": strip_grid_pixels, "nearBlackMaximumChannel": 45,
                        "maximumInterpolationFringe": strip_grid_pixels, "bands": removed_bands},
        **geometry,
        "sampling": "one-to-one source cells; no interpolation or frame duplication; nearest-neighbor scale",
        "chroma": {"key": chroma_key, "method": "edge-connected conservative chroma with boundary despill",
                   "minimumBackgroundFraction": min_background},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=False, compress_level=9)
    metadata["atlasSha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
    metadata_path = output.with_suffix(".json")
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
    return metadata_path, metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cell-size", type=int, default=512)
    parser.add_argument("--padding", type=int, default=12)
    parser.add_argument("--kind", choices=("boss", "projectiles"), default="boss")
    parser.add_argument("--min-background", type=float, default=0.2)
    parser.add_argument("--strip-grid", type=int, default=0, metavar="N",
                        help="Optionally remove verified uniform black dividers within N pixels of cell edges")
    parser.add_argument("--chroma-key", choices=("magenta", "green"), default="magenta")
    args = parser.parse_args()
    try:
        metadata_path, metadata = build(args.source, args.output, args.cell_size, args.padding,
                                        args.min_background, args.kind, args.strip_grid, args.chroma_key)
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"atlas": str(args.output), "metadata": str(metadata_path),
                      "frames": 16, "dimensions": [args.cell_size * 4] * 2,
                      "sourceSha256": metadata["sourceSha256"], "rowBounds": metadata["rowBounds"],
                      "bounds": metadata["bounds"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
