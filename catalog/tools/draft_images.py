#!/usr/bin/env python3
"""Fill every missing catalog image with a clearly marked draft placeholder.

Reads catalog/export/image-jobs.json and writes, for each job whose output file does not exist yet,
a neutral studio-background WebP with the product name and "voorbeeld" label. Real renders from
renders/render.mjs overwrite these later. The drafts are kept in catalog/images/.drafts.json as
{"files": {file: sha256}}: a file counts as a draft only while its bytes still match that hash, so a real render that
overwrites a card is recognised without touching the registry. catalog/build.py never exports a draft (CSV, fixture,
collection images); missing files are not exported either, so running this tool is optional (visual stand-ins only).

Usage: python3 catalog/tools/draft_images.py [--size 1200]
"""
import hashlib
import json
import os
import sys
import textwrap

from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
JOBS = os.path.join(REPO, "catalog", "export", "image-jobs.json")
DRAFTS = os.path.join(REPO, "catalog", "images", ".drafts.json")
STUDIO = (239, 237, 232)
INK = (29, 36, 32)
MUTED = (93, 98, 92)
FONT_DIR = os.path.join(REPO, "brand", "fonts")


def font(size, weight=700):
    path = os.path.join(FONT_DIR, "Figtree-VF.ttf")
    try:
        f = ImageFont.truetype(path, size)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        return f
    except Exception:
        return ImageFont.load_default()


def title_for(job):
    for u in job.get("used_by") or []:
        if isinstance(u, dict) and u.get("title"):
            return u["title"]
    alt = job.get("alt") or ""
    if alt:
        return alt.split(",")[0]
    return os.path.splitext(job["file"])[0].replace("-", " ")


def draw(job, size):
    im = Image.new("RGB", (size, size), STUDIO)
    shadow = Image.new("L", (size, size), 0)
    sd = ImageDraw.Draw(shadow)
    w = size * 0.56
    sd.ellipse((size / 2 - w / 2, size * 0.70, size / 2 + w / 2, size * 0.78), fill=70)
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.025))
    im.paste((205, 201, 192), (0, 0), shadow)
    d = ImageDraw.Draw(im)
    label = font(int(size * 0.028), 600)
    d.text((size * 0.06, size * 0.06), "VOORBEELD · render volgt", font=label, fill=MUTED)
    name = textwrap.fill(title_for(job), width=26)
    big = font(int(size * 0.05), 800)
    bbox = d.multiline_textbbox((0, 0), name, font=big, spacing=int(size * 0.012))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.multiline_text(((size - tw) / 2, size * 0.46 - th / 2), name, font=big, fill=INK,
                     align="center", spacing=int(size * 0.012))
    return im


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_registry():
    """{file: sha256 of the draft card}. A legacy bare list is converted: an entry stays a draft only while the file is
    still the 1200 px card (real renders are 2000 px)."""
    if not os.path.exists(DRAFTS):
        return {}
    data = json.load(open(DRAFTS))
    if isinstance(data, dict):
        return dict(data.get("files", {}))
    out = {}
    for f in data:
        path = os.path.join(REPO, "catalog", "images", f)
        if os.path.exists(path):
            with Image.open(path) as im:
                if im.size == (1200, 1200):
                    out[f] = sha256(path)
    return out


def save_registry(drafts):
    json.dump({"note": "Draft placeholder cards (catalog/tools/draft_images.py). A file is a draft only while its sha256 matches; "
                       "catalog/build.py never exports drafts.", "files": dict(sorted(drafts.items()))},
              open(DRAFTS, "w"), indent=0)
    open(DRAFTS, "a").write("\n")


def main():
    size = 1200
    if "--size" in sys.argv:
        size = int(sys.argv[sys.argv.index("--size") + 1])
    only_registry = "--registry-only" in sys.argv   # just convert / prune the registry, draw nothing
    data = json.load(open(JOBS))
    jobs = data if isinstance(data, list) else data.get("jobs", [])
    drafts = load_registry()
    # forget drafts that a real render has since replaced
    for f in list(drafts):
        path = os.path.join(REPO, "catalog", "images", f)
        if not os.path.exists(path) or sha256(path) != drafts[f]:
            del drafts[f]
    made = 0
    for job in ([] if only_registry else jobs):
        out = os.path.join(REPO, job.get("out") or os.path.join("catalog", "images", job["file"]))
        if os.path.exists(out):
            continue  # a real render, or already a draft
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img = draw(job, size)
        ext = os.path.splitext(out)[1].lower()
        img.save(out, "WEBP" if ext == ".webp" else "JPEG", quality=82)
        drafts[job["file"]] = sha256(out)
        made += 1
    save_registry(drafts)
    print(f"jobs={len(jobs)} new_drafts={made} total_drafts={len(drafts)}")


if __name__ == "__main__":
    main()
