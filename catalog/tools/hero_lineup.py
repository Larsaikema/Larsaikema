#!/usr/bin/env python3
"""Homepage hero: a line-up of real product photos (catalog/images/*-foto.webp) at true scale on white, with a soft contact
shadow under each piece, so the hero shows the assortment without a render.

Each item: (photo, real height in cm, centre x, baseline y, row 0 = back / 1 = front, a front piece is drawn 4 % larger).
The bottom left stays free for the product card the hero lays over the image (desktop), and the line-up stays inside the
middle 84 % of the height, which is what the 18:11 crop (tablet, phone) keeps.
Usage: python3 catalog/tools/hero_lineup.py [out.webp] [px per cm]   (default catalog/images/hero-statafels-en-meubilair-foto.webp)
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from pathlib import Path
IMG = str(Path(__file__).resolve().parents[1] / 'images') + '/'
W, H = 2000, 1460
PX_CM = float(sys.argv[2]) if len(sys.argv) > 2 else 7.4

def cutout(f):
    im = Image.open(IMG + f).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    mn = a.min(axis=2)
    alpha = np.clip((248.0 - mn) * 255.0 / 28.0, 0, 255).astype(np.uint8)
    rgba = np.dstack([a.astype(np.uint8), alpha])
    out = Image.fromarray(rgba, 'RGBA')
    bbox = Image.fromarray((alpha > 40).astype(np.uint8) * 255).getbbox()
    return out.crop(bbox)

# (file, real height cm, centre x, baseline y, z)
ITEMS = [
    ('statafel-stapelbaar-industrieel-70-x-70-cm-eiken-foto.webp', 106, 720, 1075, 0),
    ('statafelrok-stretch-met-topcover-60-70-cm-zwart-foto.webp', 110, 1320, 1075, 0),
    ('barkruk-metaal-stapelbaar-zwart-foto.webp', 76, 410, 1165, 1),
    ('barkruk-metaal-stapelbaar-oranje-foto.webp', 76, 970, 1193, 1),
    ('stapelstoel-velours-okergeel-foto.webp', 84, 1670, 1165, 1),
]

def main(out):
    canvas = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    shadow = Image.new('L', (W, H), 0)
    placed = []
    for f, cm, cx, base, z in ITEMS:
        im = cutout(f)
        h = round(cm * PX_CM * (1.04 if z else 1.0))
        w = round(im.width * h / im.height)
        im = im.resize((w, h), Image.LANCZOS)
        x, y = cx - w // 2, base - h
        placed.append((z, base, im, x, y))
        # contact shadow: a soft ellipse under the footprint
        d = ImageDraw.Draw(shadow)
        sw, sh = int(w * 0.86), 34
        d.ellipse([cx - sw // 2, base - sh // 2 - 6, cx + sw // 2, base + sh // 2 - 6], fill=70)
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    grey = Image.new('RGBA', (W, H), (40, 36, 30, 255))
    canvas = Image.composite(grey, canvas, shadow.point(lambda v: int(v * 0.55)))
    for z, base, im, x, y in sorted(placed, key=lambda t: (t[0], t[1])):
        canvas.alpha_composite(im, (x, y))
    canvas.convert('RGB').save(out, 'WEBP', quality=88, method=6)
    print(out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else IMG + 'hero-statafels-en-meubilair-foto.webp')
