#!/usr/bin/env python3
"""Slice Ken-approved boss and projectile sheets into runtime webp frames.

Grid comes from the JSON sidecar (prompt "N-column by M-row", else 4x2 when the
pixel size divides evenly, which is the sheet contract). Magenta backdrops are
keyed out. Frames in a clip share one crop and one scale so the pivot does not
crawl. Event markers are the measured inter-frame change, not hand-waved poses.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "bosses"

SOURCES = {
    "bront": ROOT / "art/rework/bosses/01-marina/bront",
    "crapto": ROOT / "art/rework/bosses/03-mudline/crapto",
    "zephyr": ROOT / "art/rework/bosses/04-ranch/zephyr",
}

# Gameplay draw height in the 1280x720 arena. Projectiles use a height cap and a width cap.
DRAW = {
    "boss": 300,
    "projectile": 96,
}
MAX_W = {"boss": 460, "projectile": 220}


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def grid_of(meta: dict, size: tuple[int, int]) -> tuple[int, int]:
    prompt = meta.get("prompt") or ""
    match = re.search(r"(\d+)\s*-?\s*column\s+by\s+(\d+)\s*-?\s*row", prompt, re.I)
    if not match:
        check = meta.get("self_check")
        grid = check.get("grid", "") if isinstance(check, dict) else ""
        match = re.search(r"(\d+)\s*x\s*(\d+)", str(grid))
    if match:
        cols, rows = int(match.group(1)), int(match.group(2))
    else:
        cols, rows = 4, 2
    w, h = size
    if w % cols or h % rows:
        raise SystemExit(f"grid {cols}x{rows} does not divide {w}x{h}")
    return cols, rows


def generation_id(meta: dict) -> str:
    for key in ("job_id", "asset_id"):
        value = meta.get(key)
        if isinstance(value, str) and value:
            # Keep the uuid when a note was appended.
            found = re.search(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", value, re.I)
            return found.group(0) if found else value.strip()
    return ""


def key_frame(cell: Image.Image) -> Image.Image:
    """Drop the magenta backdrop. Sheets are not always exact #FF00FF."""
    rgba = np.asarray(cell.convert("RGBA")).copy()
    r, g, b = rgba[:, :, 0].astype(np.int16), rgba[:, :, 1].astype(np.int16), rgba[:, :, 2].astype(np.int16)
    magenta = (g < 110) & (r > 150) & (b > 150) & (np.abs(r - b) < 70) & ((r + b) / 2 - g > 80)
    rgba[magenta, 3] = 0
    # One-pixel fringe: a near-magenta pixel with mostly transparent neighbors.
    alpha = rgba[:, :, 3]
    near = (r > 140) & (b > 140) & (g < 130) & (alpha > 0)
    clear = np.pad(alpha == 0, 1, constant_values=True)
    neighbors = np.zeros_like(alpha, dtype=np.uint8)
    for dy in range(3):
        for dx in range(3):
            if dx == 1 and dy == 1:
                continue
            neighbors += clear[dy:dy + alpha.shape[0], dx:dx + alpha.shape[1]]
    rgba[(near & (neighbors >= 5)), 3] = 0
    return Image.fromarray(rgba, "RGBA")


def bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = im.getchannel("A")
    return alpha.getbbox()


def frame_delta(a: Image.Image, b: Image.Image) -> float:
    """Mean change between two frames. The peak is the release pose."""
    aa = list(a.resize((48, 48)).convert("RGBA").getdata())
    bb = list(b.resize((48, 48)).convert("RGBA").getdata())
    total = 0
    for (r1, g1, b1, a1), (r2, g2, b2, a2) in zip(aa, bb):
        total += abs(a1 - a2) + abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2)
    return total / len(aa)


def markers(frames: list[Image.Image]) -> dict:
    if len(frames) < 2:
        return {"telegraph": 0, "release": 0, "recovery": 0, "deltas": []}
    deltas = [round(frame_delta(frames[i], frames[i + 1]), 1) for i in range(len(frames) - 1)]
    # The release frame is the one that arrives with the largest visual change.
    release = max(range(len(deltas)), key=lambda i: deltas[i]) + 1
    if release <= 0:
        release = 1 if len(frames) > 1 else 0
    # Recovery starts at the next peak after the release, or halfway through what remains.
    tail = deltas[release:] if release < len(deltas) else []
    if tail:
        recovery = release + max(range(len(tail)), key=lambda i: tail[i]) + 1
        if recovery <= release:
            recovery = min(len(frames) - 1, release + 1)
    else:
        recovery = min(len(frames) - 1, release)
    if recovery < release:
        recovery = release
    return {"telegraph": 0, "release": release, "recovery": recovery, "deltas": deltas}


def clip_id(path: Path) -> str:
    name = path.name
    name = re.sub(r"-sheet-gpt25-v\d+\.png$", "", name)
    name = re.sub(r"^(bront|crapto|zephyr)-", "", name)
    return name


def kind_of(path: Path) -> str:
    return "projectile" if "projectile" in path.name or path.parent.name == "projectiles" else "boss"


def scale_to(size: tuple[int, int], kind: str) -> float:
    w, h = size
    if h <= 0 or w <= 0:
        return 1
    if kind == "projectile" and h / w > 1.8:
        # Full-height curtains stay tall enough to read after the runtime scales them.
        return min(520 / h, 160 / w)
    if kind == "projectile" and h / w < 0.45:
        return min(80 / h, 300 / w)
    return min(DRAW[kind] / h, MAX_W[kind] / w)


def main() -> None:
    if OUT.exists():
        for old in OUT.rglob("*"):
            if old.is_file() and old.suffix == ".webp":
                old.unlink()
    catalog = {"bosses": {}}
    for boss, folder in SOURCES.items():
        sheets = sorted(folder.rglob("*.png"))
        sheets = [p for p in sheets if "sheet" in p.name]
        clips = {}
        for sheet in sheets:
            meta_path = sheet.with_suffix(".json")
            meta = load_json(meta_path) if meta_path.exists() else {}
            image = Image.open(sheet)
            cols, rows = grid_of(meta, image.size)
            cell_w, cell_h = image.size[0] // cols, image.size[1] // rows
            keyed = []
            bounds = []
            for index in range(cols * rows):
                col, row = index % cols, index // cols
                cell = image.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
                frame = key_frame(cell)
                keyed.append(frame)
                box = bbox(frame)
                if box:
                    bounds.append(box)
            if not bounds:
                raise SystemExit(f"no opaque pixels in {sheet}")
            kind = kind_of(sheet)
            pad = 2
            if kind == "boss":
                union = (
                    max(0, min(b[0] for b in bounds) - pad),
                    max(0, min(b[1] for b in bounds) - pad),
                    min(cell_w, max(b[2] for b in bounds) + pad),
                    min(cell_h, max(b[3] for b in bounds) + pad),
                )
                crop_w, crop_h = union[2] - union[0], union[3] - union[1]
                pieces = [frame.crop(union) for frame in keyed]
            else:
                # Projectiles sit in different parts of the cell. Size the canvas to the
                # largest effect, then center each frame, so one stray pixel cannot shrink it.
                widths = [b[2] - b[0] for b in bounds]
                heights = [b[3] - b[1] for b in bounds]
                crop_w = min(cell_w, max(widths) + pad * 2)
                crop_h = min(cell_h, max(heights) + pad * 2)
                pieces = []
                boxes = []
                for frame in keyed:
                    box = bbox(frame)
                    if not box:
                        pieces.append(Image.new("RGBA", (crop_w, crop_h), (0, 0, 0, 0)))
                        boxes.append(None)
                        continue
                    trimmed = frame.crop(box)
                    canvas = Image.new("RGBA", (crop_w, crop_h), (0, 0, 0, 0))
                    canvas.paste(trimmed, ((crop_w - trimmed.width) // 2, (crop_h - trimmed.height) // 2), trimmed)
                    pieces.append(canvas)
                    boxes.append(box)
                union = [0, 0, crop_w, crop_h]
            scale = scale_to((crop_w, crop_h), kind)
            out_w, out_h = max(1, round(crop_w * scale)), max(1, round(crop_h * scale))
            ident = clip_id(sheet)
            dest = OUT / boss / ("projectiles" if kind == "projectile" else "") / ident
            dest.mkdir(parents=True, exist_ok=True)
            saved = []
            scaled_frames = []
            for index, frame in enumerate(pieces):
                cropped = frame.resize((out_w, out_h), Image.Resampling.BOX)
                scaled_frames.append(cropped)
                file = dest / f"{index:02d}.webp"
                cropped.save(file, "WEBP", quality=72, method=6)
                saved.append(str(file.relative_to(ROOT)))
            mark = markers(scaled_frames)
            opaque = bbox(scaled_frames[mark["release"]] or scaled_frames[0])
            # Feet for bosses (bottom center of the shared canvas). Center for projectiles.
            if kind == "boss":
                pivot = [round(out_w / 2), out_h]
            else:
                pivot = [round(out_w / 2), round(out_h / 2)]
            # Bow / muzzle: leftmost opaque column of the release frame, facing left.
            release_box = opaque or (0, 0, out_w, out_h)
            muzzle = [int(release_box[0]), int((release_box[1] + release_box[3]) / 2)]
            weak = [int((release_box[0] + release_box[2]) / 2), int(release_box[1])]
            clips[ident] = {
                "kind": kind,
                "sourceSheet": str(sheet.relative_to(ROOT)),
                "grid": [cols, rows],
                "cell": [cell_w, cell_h],
                "crop": list(union),
                "frames": saved,
                "frameCount": len(saved),
                "frameSize": [out_w, out_h],
                "pivot": pivot,
                "muzzle": muzzle,
                "weakPoint": weak,
                "events": {"telegraph": mark["telegraph"], "release": mark["release"], "recovery": mark["recovery"]},
                "eventDeltas": mark["deltas"],
                "generationId": generation_id(meta),
                "bytes": sum((ROOT / rel).stat().st_size for rel in saved),
            }
            print(f"{boss:7} {ident:42} {cols}x{rows} {out_w}x{out_h} release={mark['release']} recovery={mark['recovery']} {clips[ident]['bytes']//1024}KB")
        catalog["bosses"][boss] = {"clips": clips}
    (OUT / "catalog.json").write_text(json.dumps(catalog, indent=1) + "\n")
    total = sum(c["bytes"] for b in catalog["bosses"].values() for c in b["clips"].values())
    print(f"TOTAL {total/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
