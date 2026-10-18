#!/usr/bin/env python3
"""Fill every missing catalog image with a clearly marked draft placeholder.

Reads catalog/export/image-jobs.json and writes, for each job whose output file does not exist yet,
a neutral studio-background WebP with the product name and "voorbeeld" label. Real renders from
renders/render.mjs overwrite these later. The list of drafts is kept in catalog/images/.drafts.json
so the imagery phase (and the final check) can see what still needs a real render.

Usage: python3 catalog/tools/draft_images.py [--size 1200]
"""
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


def main():
    size = 1200
    if "--size" in sys.argv:
        size = int(sys.argv[sys.argv.index("--size") + 1])
    data = json.load(open(JOBS))
    jobs = data if isinstance(data, list) else data.get("jobs", [])
    drafts = set()
    if os.path.exists(DRAFTS):
        drafts = set(json.load(open(DRAFTS)))
    made = 0
    for job in jobs:
        out = os.path.join(REPO, job.get("out") or os.path.join("catalog", "images", job["file"]))
        if os.path.exists(out) and job["file"] not in drafts:
            continue
        if os.path.exists(out) and job["file"] in drafts:
            continue  # already a draft
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img = draw(job, size)
        ext = os.path.splitext(out)[1].lower()
        img.save(out, "WEBP" if ext == ".webp" else "JPEG", quality=82)
        drafts.add(job["file"])
        made += 1
    # forget drafts that a real render has since replaced (render.mjs writes newer files)
    json.dump(sorted(drafts), open(DRAFTS, "w"), indent=0)
    print(f"jobs={len(jobs)} new_drafts={made} total_drafts={len(drafts)}")


if __name__ == "__main__":
    main()
