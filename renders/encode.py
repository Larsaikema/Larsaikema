#!/usr/bin/env python3
"""Encode a rendered PNG to the requested output format.

usage: encode.py <in.png> <out.(webp|jpg|jpeg|png)> [--size N] [--quality Q]

- optional Lanczos downsample to N px on the long edge (used for supersampled renders)
- WebP: lossy, quality Q (default 88), method 6, sRGB, no alpha
- JPEG: quality Q (default 90), progressive, optimised, 4:4:4 above q90
- PNG : optimised
Deterministic: same input pixels -> same bytes.
"""
import sys
from PIL import Image


def main(argv):
    src, dst = argv[0], argv[1]
    size, quality = None, None
    i = 2
    while i < len(argv):
        if argv[i] == '--size':
            size = int(argv[i + 1]); i += 2
        elif argv[i] == '--quality':
            quality = int(argv[i + 1]); i += 2
        else:
            i += 1
    im = Image.open(src).convert('RGB')
    if size and max(im.size) != size:
        scale = size / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    ext = dst.lower().rsplit('.', 1)[-1]
    if ext == 'webp':
        im.save(dst, 'WEBP', quality=quality or 88, method=6)
    elif ext in ('jpg', 'jpeg'):
        q = quality or 90
        im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 90 else 2)
    elif ext == 'png':
        im.save(dst, 'PNG', optimize=True)
    else:
        raise SystemExit(f'unsupported output format: {ext}')


if __name__ == '__main__':
    main(sys.argv[1:])
