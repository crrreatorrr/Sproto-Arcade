#!/usr/bin/env python3
"""Extract a generated 12-second magenta-background clip into a 4x4 RGBA atlas.

Requires Pillow, ffmpeg and ffprobe. No image generation or motion interpolation is
performed: every cell is a real video frame. Row order is idle, attack-a, attack-b,
attack-c. One union crop and transform preserves registration throughout the sheet.

  python3 tools/extract-boss-clip.py input.mp4 art/generated/bosses/boss/p1.png
  python3 tools/extract-boss-clip.py input.mp4 projectiles.png --cell-size 128 --kind projectiles
"""

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


STATES = ("idle", "attack-a", "attack-b", "attack-c")
PROJECTILE_STATES = ("attack-a", "attack-b", "attack-c", "heavy")
SAMPLE_OFFSETS = (0.4, 1.1, 1.8, 2.5)


def run(command):
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise ValueError(result.stderr.decode("utf-8", errors="replace").strip())
    return result.stdout


def probe(source):
    data = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                           "-show_streams", "-show_format", "-of", "json", str(source)]))
    if not data.get("streams"):
        raise ValueError("Source has no video stream")
    stream = data["streams"][0]
    duration = float(stream.get("duration") or data.get("format", {}).get("duration", 0))
    return stream, duration


def extract(source, timestamp):
    raw = run(["ffmpeg", "-v", "error", "-ss", format(timestamp, ".6f"), "-i", str(source),
               "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"])
    if not raw:
        raise ValueError(f"No video frame at {timestamp:g}s")
    return Image.open(io.BytesIO(raw)).convert("RGBA")


def matte(frame, timestamp, min_background, chroma_key="magenta"):
    """Remove only edge-connected chroma, then clean its one-pixel spill fringe.

    Red, gold, cyan, white and skin tones fail the two-channel magenta test. Interior
    purple/magenta costume details remain opaque unless connected to the key field.
    Do not erase isolated matching pixels inside the subject.
    """
    if chroma_key not in ("magenta", "green"):
        raise ValueError("Chroma key must be magenta or green")
    width, height = frame.size
    rgb = frame.convert("RGB")
    pixels = list(rgb.getdata())
    candidates = bytes(255 if (g >= 180 and g - max(r, b) >= 95 if chroma_key == "green" else
                       min(r, b) >= 180 and min(r, b) - g >= 95 and abs(r - b) <= 65)
                       else 0 for r, g, b in pixels)
    mask = Image.frombytes("L", frame.size, candidates)
    # Padding joins every edge component into one flood-fill starting point.
    flooded = ImageOps.expand(mask, border=1, fill=255)
    ImageDraw.floodfill(flooded, (0, 0), 128, thresh=0)
    flooded = flooded.crop((1, 1, width + 1, height + 1))
    background = flooded.point(lambda value: 255 if value == 128 else 0)
    removed = background.histogram()[255]
    if removed / (width * height) < min_background:
        raise ValueError(f"{timestamp:g}s: only {removed/(width*height):.1%} edge-connected "
                         f"{chroma_key} background; check source backdrop/camera")
    # A chroma-corrupted antialias/compression pixel must touch the removed field.
    fringe = ImageChops.subtract(background.filter(ImageFilter.MaxFilter(3)), background)
    fringe_values = fringe.tobytes()
    removed_values = background.tobytes()
    keyed = []
    for index, (r, g, b, alpha) in enumerate(frame.getdata()):
        if removed_values[index]:
            keyed.append((0, 0, 0, 0))
            continue
        if chroma_key == "green" and fringe_values[index] and g - max(r, b) > 18 and g > 60:
            g = max(r, b)
        elif chroma_key == "magenta" and fringe_values[index] and min(r, b) - g > 18 and min(r, b) > 60:
            # Only a narrow boundary is affected. Despill caps both key channels;
            # it does not darken internal purple lights or repaint the artwork.
            spill = min(r, b) - g
            r, b = max(g, r - spill), max(g, b - spill)
        keyed.append((r, g, b, alpha))
    result = Image.new("RGBA", frame.size)
    result.putdata(keyed)
    bounds = result.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{timestamp:g}s: empty frame after chroma removal")
    foreground_count = width * height - removed
    if foreground_count < max(16, width * height * 0.0002):
        raise ValueError(f"{timestamp:g}s: foreground too small ({foreground_count} pixels)")
    x0, y0, x1, y1 = bounds
    if x0 <= 1 or y0 <= 1 or x1 >= width - 1 or y1 >= height - 1:
        raise ValueError(f"{timestamp:g}s: subject touches source frame edge ({bounds}); "
                         "regenerate with full subject and wider empty margins")
    return result, bounds, removed


def pack_frames(frames, boxes, cell_size, padding, states=STATES):
    """One transform for every source frame; rowBounds are optional renderer crops."""
    if len(frames) != 16 or len(boxes) != 16:
        raise ValueError("Exactly sixteen source frames and bounds are required")
    if cell_size < 16 or padding < 2 or padding * 2 >= cell_size:
        raise ValueError("Cell size must be >=16 and padding >=2 and less than half the cell")
    union = (min(b[0] for b in boxes), min(b[1] for b in boxes),
             max(b[2] for b in boxes), max(b[3] for b in boxes))
    crop_width, crop_height = union[2] - union[0], union[3] - union[1]
    available = cell_size - padding * 2
    scale = min(available / crop_width, available / crop_height)
    draw_width = max(1, min(available, round(crop_width * scale)))
    draw_height = max(1, min(available, round(crop_height * scale)))
    offset = ((cell_size - draw_width) // 2, cell_size - padding - draw_height)
    atlas = Image.new("RGBA", (cell_size * 4, cell_size * 4))
    cells = []
    for index, frame in enumerate(frames):
        cell = frame.crop(union).resize((draw_width, draw_height), Image.Resampling.NEAREST)
        column, row = index % 4, index // 4
        atlas.paste(cell, (column * cell_size + offset[0], row * cell_size + offset[1]))
        bounds = cell.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"Frame {index + 1} becomes empty at output scale; increase --cell-size")
        cells.append({"index": index, "row": row, "column": column, "state": states[row],
                      "sourceBounds": list(boxes[index]),
                      "cellBounds": [bounds[0] + offset[0], bounds[1] + offset[1],
                                     bounds[2] + offset[0], bounds[3] + offset[1]]})
    # Projectile renderers may crop a whole row to its common alpha union before
    # fitting it into narrow/long existing hazard boxes. Keep the source cell
    # coordinates; never crop each frame separately or change boss registration.
    row_bounds = []
    for row in range(4):
        bounds = [cell["cellBounds"] for cell in cells[row * 4:(row + 1) * 4]]
        left, top = min(b[0] for b in bounds), min(b[1] for b in bounds)
        right, bottom = max(b[2] for b in bounds), max(b[3] for b in bounds)
        row_bounds.append([left, top, right - left, bottom - top])
    # Nearest-neighbor reduction can drop an extremal source pixel. Describe
    # actual output opacity, while destinationSize retains the allocated crop.
    left = min(cell['cellBounds'][0] for cell in cells)
    top = min(cell['cellBounds'][1] for cell in cells)
    right = max(cell['cellBounds'][2] for cell in cells)
    bottom = max(cell['cellBounds'][3] for cell in cells)
    return atlas, {"columns": 4, "rows": 4, "frameWidth": cell_size, "frameHeight": cell_size,
                   "states": list(states), "rowBounds": row_bounds,
                   "bounds": [left, top, right - left, bottom - top],
                   "unionCrop": list(union), "destinationSize": [draw_width, draw_height],
                   "offset": list(offset), "baseline": cell_size - padding, "padding": padding,
                   "frames": cells}


def build(source, output, cell_size=256, padding=12, interval=3.0, timestamps=None,
          min_background=0.2, chroma_key="magenta", kind="boss"):
    if kind not in ("boss", "projectiles"):
        raise ValueError("Kind must be boss or projectiles")
    if not source.is_file():
        raise ValueError(f"Missing video: {source}")
    if output.suffix.lower() != ".png":
        raise ValueError("Output must have .png extension")
    if cell_size < 16 or padding < 2 or padding * 2 >= cell_size:
        raise ValueError("Cell size must be >=16 and padding >=2 and less than half the cell")
    if not math.isfinite(interval) or interval <= 0:
        raise ValueError("Interval must be a positive finite number")
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            raise ValueError(f"{executable} is required on PATH")
    stream, duration = probe(source)
    times = timestamps or [round(row * interval + offset * interval / 3, 6)
                           for row in range(4) for offset in SAMPLE_OFFSETS]
    if len(times) != 16 or any(not math.isfinite(t) or t < 0 for t in times):
        raise ValueError("Exactly sixteen nonnegative finite timestamps are required")
    if times != sorted(times) or len(set(times)) != 16:
        raise ValueError("Timestamps must be unique and increasing in row-major order")
    if duration and max(times) >= duration:
        raise ValueError(f"Clip duration {duration:g}s does not cover last sample {max(times):g}s")
    frames, boxes, background_counts = [], [], []
    for timestamp in times:
        frame, bounds, removed = matte(extract(source, timestamp), timestamp, min_background, chroma_key)
        if frames and frame.size != frames[0].size:
            raise ValueError("Video frame dimensions changed")
        frames.append(frame)
        boxes.append(bounds)
        background_counts.append(removed)
    atlas, geometry = pack_frames(frames, boxes, cell_size, padding, STATES if kind == "boss" else PROJECTILE_STATES)
    for index, cell in enumerate(geometry["frames"]):
        cell.update(timestampSeconds=times[index], backgroundPixelsRemoved=background_counts[index])
    metadata = {
        "schemaVersion": 1, "kind": "video-frame-sprite-atlas", "assetKind": kind, "source": source.name,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "sourceDimensions": list(frames[0].size), "sourceDurationSeconds": duration,
        "sourceFrameRate": stream.get("avg_frame_rate"),
        **geometry, "timestampsSeconds": times,
        "sampling": "source video frames; no interpolation; nearest-neighbor scale",
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
    parser.add_argument("--cell-size", type=int, default=256)
    parser.add_argument("--padding", type=int, default=12)
    parser.add_argument("--interval", type=float, default=3.0,
                        help="Seconds per row/action (default: 3, for a 12-second clip)")
    parser.add_argument("--timestamps", help="Override with 16 increasing comma-separated sample seconds")
    parser.add_argument("--min-background", type=float, default=0.2,
                        help="Minimum edge-connected magenta fraction in every frame (default: 0.2)")
    parser.add_argument("--kind", choices=("boss", "projectiles"), default="boss")
    parser.add_argument("--chroma-key", choices=("magenta", "green"), default="magenta")
    args = parser.parse_args()
    try:
        if not 0 < args.min_background < 1:
            raise ValueError("Minimum background fraction must be between 0 and 1")
        timestamps = [float(value) for value in args.timestamps.split(",")] if args.timestamps else None
        metadata_path, metadata = build(args.source, args.output, args.cell_size, args.padding,
                                        args.interval, timestamps, args.min_background, args.chroma_key, args.kind)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"atlas": str(args.output), "metadata": str(metadata_path),
                      "frames": 16, "dimensions": [args.cell_size * 4] * 2,
                      "sourceSha256": metadata["sourceSha256"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
