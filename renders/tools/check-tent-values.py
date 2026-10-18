#!/usr/bin/env python3
"""Tone check for easy-up canopy colours: does black render black, and can a buyer tell the
dark swatches apart?

Renders the same 3x3 Premium hero in zwart, antraciet and grijs (plus an open 3x6 zwart, whose
middle leg stands right under the valance) and reads the rendered sRGB values at the probe
points the tent builder exports (meta.probes, projected to pixels by js/main.js):

  roofLit / roofShade        roof face the hero camera sees on its left (lit) / right (turned away)
  valanceLit / valanceShade  the valance under those faces
  legOuter / legInner        axis of the leg nearest to the camera (outer / inner tube)

Each value is the median Rec.709 luma (0-255, on the sRGB values, like an eyedropper) of 5x5
windows round the probe points. Fails (exit 1) unless:
  - zwart lit roof 30-55 and zwart roof turned away 10-30 (target 35-50 / 15-25),
  - lit roof differs by >= 25 levels between zwart, antraciet and grijs (in that order),
  - zwart cloth (valance) is never lighter than the zwart frame next to it.

  python3 renders/tools/check-tent-values.py [--size 1000] [--samples 16] [--keep DIR]
"""
import argparse, json, os, subprocess, sys, tempfile
from statistics import median
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER = os.path.join(os.path.dirname(HERE), 'render.mjs')

JOBS = [
    ('zwart', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'angle': 'hero'}),
    ('antraciet', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'antraciet', 'legs': 'premium', 'angle': 'hero'}),
    ('grijs', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'grijs', 'legs': 'premium', 'angle': 'hero'}),
    ('zwart-3x6', {'model': 'easyUpTent', 'w': 6, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'angle': 'hero'}),
]


COLOURS = ['wit', 'rood', 'blauw', 'groen', 'oranje', 'geel']


def luma(px):
    r, g, b = px[:3]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def sample_rgb(img, pts, half=2):
    W, H = img.size
    acc = []
    for x, y in pts:
        xi, yi = int(round(x)), int(round(y))
        for dy in range(-half, half + 1):
            for dx in range(-half, half + 1):
                u, v = xi + dx, yi + dy
                if 0 <= u < W and 0 <= v < H:
                    acc.append(img.getpixel((u, v))[:3])
    acc.sort(key=luma)
    return acc[len(acc) // 2] if acc else (0, 0, 0)


def sat(rgb):
    mx, mn = max(rgb), min(rgb)
    return 0 if mx == 0 else (mx - mn) / mx


def sample(img, pts, half=2):
    W, H = img.size
    vals = []
    for x, y in pts:
        xi, yi = int(round(x)), int(round(y))
        for dy in range(-half, half + 1):
            for dx in range(-half, half + 1):
                u, v = xi + dx, yi + dy
                if 0 <= u < W and 0 <= v < H:
                    vals.append(luma(img.getpixel((u, v))))
    return median(vals) if vals else float('nan')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--size', type=int, default=1000)
    ap.add_argument('--samples', type=int, default=16)
    ap.add_argument('--keep', default=None, help='keep the renders in this directory')
    ap.add_argument('--only', default=None, help='comma-separated job names (zwart,antraciet,grijs,zwart-3x6 + colours)')
    ap.add_argument('--colours', action='store_true', help='also report wit/rood/blauw/groen/oranje/geel (lit vs shaded value and saturation)')
    a = ap.parse_args()
    jobs = JOBS + ([(c, {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': c, 'legs': 'premium', 'angle': 'hero'}) for c in COLOURS] if a.colours or a.only else [])
    if a.only:
        keep = a.only.split(',')
        jobs = [j for j in jobs if j[0] in keep]
    out_dir = a.keep or tempfile.mkdtemp(prefix='tentcheck-')
    os.makedirs(out_dir, exist_ok=True)
    batch = os.path.join(out_dir, 'check.jsonl')
    with open(batch, 'w') as f:
        for name, spec in jobs:
            f.write(json.dumps({**spec, 'out': f'{name}.png', 'size': a.size, 'samples': a.samples}) + '\n')
    res = subprocess.run(['node', RENDER, '--batch', batch, '--json'], capture_output=True, text=True)
    if res.returncode:
        print(res.stdout, res.stderr)
        sys.exit(2)
    infos = [json.loads(l) for l in res.stdout.splitlines() if l.startswith('{')]
    with open(os.path.join(out_dir, 'probes.json'), 'w') as f:
        json.dump({name: info['probes'] for (name, _), info in zip(jobs, infos)}, f)
    table = {}
    rgbs = {}
    for (name, _), info in zip(jobs, infos):
        img = Image.open(os.path.join(out_dir, f'{name}.png')).convert('RGB')
        table[name] = {k: round(sample(img, v), 1) for k, v in info['probes'].items()}
        table[name]['exposure'] = round(info['exposure'], 3)
        rgbs[name] = {k: sample_rgb(img, info['probes'][k]) for k in ('roofLit', 'roofShade', 'valanceLit', 'valanceShade')}
    keys = ['roofLit', 'roofShade', 'valanceLit', 'valanceShade', 'legOuter', 'legInner', 'exposure']
    print(f"{'':12}" + ''.join(f'{k:>13}' for k in keys))
    for name in table:
        print(f'{name:12}' + ''.join(f'{table[name].get(k, float("nan")):>13}' for k in keys))
    if a.colours:
        print('\ncolour depth (median sRGB, saturation) lit roof | roof turned away | valance lit | valance turned away')
        for name in rgbs:
            print(f'{name:12}' + ' | '.join(f'{str(tuple(rgbs[name][k])):>16} s{sat(rgbs[name][k]):.2f}' for k in ('roofLit', 'roofShade', 'valanceLit', 'valanceShade')))
    fails = []
    if not all(n in table for n in ('zwart', 'antraciet', 'grijs', 'zwart-3x6')):
        print('(partial run: no pass/fail)'); return
    z, an, gr = table['zwart'], table['antraciet'], table['grijs']
    if not 30 <= z['roofLit'] <= 55: fails.append(f"zwart lit roof {z['roofLit']} outside 30-55 (target 35-50)")
    if not 10 <= z['roofShade'] <= 30: fails.append(f"zwart roof turned away {z['roofShade']} outside 10-30 (target 15-25)")
    if an['roofLit'] - z['roofLit'] < 25: fails.append(f"antraciet lit roof only {an['roofLit'] - z['roofLit']:.1f} levels above zwart (need >= 25)")
    if gr['roofLit'] - an['roofLit'] < 25: fails.append(f"grijs lit roof only {gr['roofLit'] - an['roofLit']:.1f} levels above antraciet (need >= 25)")
    for nm in ('zwart', 'zwart-3x6'):
        t = table[nm]
        frame = max(t['legOuter'], t['legInner'])
        if t['valanceLit'] > frame + 1: fails.append(f"{nm}: valance {t['valanceLit']} lighter than the frame next to it ({frame})")
    print('\n' + ('PASS' if not fails else 'FAIL\n  ' + '\n  '.join(fails)))
    print(f'renders: {out_dir}')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
