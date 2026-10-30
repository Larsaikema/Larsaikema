#!/usr/bin/env python3
"""Real product photos into catalog/images: square, on white, at most 1600 px, webp (catalog/photos.json says which photo is
which file and which products and options it shows; catalog/build.py puts them before the renders).

The sources are the owner's product photos (Drive: '04_Foto & Video / Catalogus productfotos PNG 29-10-2026'), downloaded
as <drive_id>.png / .jpg into one folder, and the supplier's photos (Mebu, www.mebu.info: "url" in photos.json), which this
script downloads into the same folder. Each photo is trimmed to its content (near-white margins off), centred on a white
square with an even margin, so a tent, a statafelrok and a stoel sit the same way in the grid.

Usage: python3 catalog/tools/photos.py --src <folder with the downloads> [--force] [--only file1,file2]
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SIZE = 1600
MARGIN = 0.07           # free space around the product, per side, as a share of the square
WHITE_TOL = 12          # a pixel within this of white counts as background when trimming


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def to_rgb_on_white(im):
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        return Image.alpha_composite(bg, im).convert('RGB')
    return im.convert('RGB')


def trim(im):
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert('L').point(lambda x: 255 if x > WHITE_TOL else 0)
    box = diff.getbbox()
    return im.crop(box) if box else im


def corner_colour(im):
    w, h = im.size
    px = [im.getpixel(xy) for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    return tuple(sorted(c[i] for c in px)[1] for i in range(3))


def square(im, bg=(255, 255, 255)):
    w, h = im.size
    inner = round(SIZE * (1 - 2 * MARGIN))
    scale = inner / max(w, h)
    im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    out = Image.new('RGB', (SIZE, SIZE), bg)
    out.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    return out


def main():
    src = Path(arg('--src') or '')
    if not src.is_dir():
        sys.exit('--src <folder with the downloaded photos> is required')
    only = set(filter(None, (arg('--only') or '').split(',')))
    photos = json.loads((ROOT / 'photos.json').read_text(encoding='utf-8'))['photos']
    done = skipped = 0
    missing = []
    for ph in photos:
        out = ROOT / 'images' / ph['file']
        if only and ph['file'] not in only:
            continue
        if out.exists() and '--force' not in sys.argv:
            skipped += 1
            continue
        if ph.get('url'):
            path = src / ('url-' + hashlib.sha1(ph['url'].encode()).hexdigest()[:16] + '.img')
            if not path.exists():
                r = subprocess.run(['curl', '-sSL', '--max-time', '60', '-o', str(path), ph['url']])
                if r.returncode != 0:
                    path.unlink(missing_ok=True)
            path = path if path.exists() else None
        else:
            cand = [src / f"{ph['drive_id']}.{e}" for e in ('png', 'jpg', 'jpeg', 'webp')]
            path = next((c for c in cand if c.exists()), None)
        if path is None:
            missing.append(f"{ph['file']} ({ph['source']})")
            continue
        im = to_rgb_on_white(Image.open(path))
        bg = corner_colour(im)
        dark = sum(bg) < 3 * 60          # shot on black (the prikkabels): keep it black, no trim
        im = square(im if dark else trim(im), (0, 0, 0) if dark else (255, 255, 255))
        im.save(out, 'WEBP', quality=86, method=6)
        done += 1
    print(f'photos: {done} made, {skipped} already there, {len(missing)} without a source')
    for m in missing:
        print('  missing:', m)
    sys.exit(1 if missing else 0)


if __name__ == '__main__':
    main()
