#!/usr/bin/env python3
"""Tone check for easy-up canopy colours: does black render black, and can a buyer tell the
dark swatches apart?

Renders the same 3x3 Premium hero in zwart, antraciet and grijs (plus an open 3x6 zwart, whose
middle leg stands right under the valance) and reads the rendered sRGB values at the probe
points the tent builder exports (meta.probes, projected to pixels by js/main.js):

  roofLit / roofShade        roof face the hero camera sees on its left (lit) / right (turned away)
  valanceLit / valanceShade  the valance under those faces
  legOuter / legInner        the leg nearest to the camera (outer / inner tube), mean value ACROSS
                             the tube (its light, mid and dark hex facets), not just its axis
  wallLit / wallShade        closed side-wall cloth low between the legs, on the wall the hero sees
                             on its left (lit) / right (turned away)            (walled tents only)
  doorway                    the door on a side the hero sees: closed (hero) = the door leaf;
                             rolled up (detail) = what shows through the opening, i.e. the inside
  windowPane                 PVC window panes on the sides the hero sees (foil + what shows through)

Plus the walled 3x6 zwart sample (back: window + door, left: window, the two sides the camera
cannot see closed): its hero (door closed) and its detail (door rolled up, looking inside).

Each value is the median Rec.709 luma (0-255, on the sRGB values, like an eyedropper) of 5x5
windows round the probe points. Black is lit like photographed black product (art direction,
18 Oct 2026): lit faces ~60-85 with their PVC sheen, faces turned away ~25-35, so roof planes and
walls separate instead of merging into one dark mass. Fails (exit 1) unless:
  - zwart lit roof 45-80 and zwart roof turned away 18-40 (target 55-75 / 25-35),
  - lit roof differs by >= 25 levels between zwart, antraciet and grijs (in that order),
  - zwart cloth (valance) is never lighter than the zwart frame next to it (open tents),
  - walled hero: lit wall 55-90 (target 60-85; at ~40 the walls, valance and hem shadow merged
    into one black shed), closed door leaf >= 50, wall turned away 22-40 (target 25-35) and at
    least 20 levels below the lit wall (the two planes separate), lit roof 50-85, window panes
    10-70 (clear foil over the dark inside: no black hole, no white studio card through a far-side
    window),
  - walled detail: the inside seen through the rolled-up door 12-60 (target 15-35: no black void).

  python3 renders/tools/check-tent-values.py [--size 1000] [--samples 16] [--keep DIR]
"""
import argparse, json, os, subprocess, sys, tempfile
from statistics import median
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER = os.path.join(os.path.dirname(HERE), 'render.mjs')

WALLS = {'back': ['window', 'door'], 'left': 'window', 'front': 'closed', 'right': 'closed'}

JOBS = [
    ('zwart', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'angle': 'hero'}),
    ('antraciet', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'antraciet', 'legs': 'premium', 'angle': 'hero'}),
    ('grijs', {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'grijs', 'legs': 'premium', 'angle': 'hero'}),
    ('zwart-3x6', {'model': 'easyUpTent', 'w': 6, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'angle': 'hero'}),
    ('zwart-wanden', {'model': 'easyUpTent', 'w': 6, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'walls': WALLS, 'angle': 'hero'}),
    ('zwart-deur', {'model': 'easyUpTent', 'w': 6, 'd': 3, 'color': 'zwart', 'legs': 'premium', 'walls': WALLS, 'angle': 'detail'}),
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


def sample_across(img, pts, thresh=150):
    """Mean luma ACROSS a thin tube (a leg): on the probe's row and the rows next to it, every
    pixel within +-1 % of the image width that is darker than `thresh` (the tube, not the floor or
    backdrop behind it). A hex leg shows light, mid and dark facets side by side; its axis can sit
    on the darkest facet, so a single-point reading would call a satin black leg 'pitch black'."""
    W, H = img.size
    R = max(6, round(W / 100))
    vals = []
    for x, y in pts:
        xi, yi = int(round(x)), int(round(y))
        for dy in (-2, 0, 2):
            for dx in range(-R, R + 1):
                u, v = xi + dx, yi + dy
                if 0 <= u < W and 0 <= v < H:
                    l = luma(img.getpixel((u, v)))
                    if l < thresh: vals.append(l)
    return sum(vals) / len(vals) if vals else float('nan')


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
    ap.add_argument('--only', default=None, help='comma-separated job names (zwart,antraciet,grijs,zwart-3x6,zwart-wanden,zwart-deur + colours)')
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
        table[name] = {k: round(sample_across(img, v) if k.startswith('leg') else sample(img, v), 1) for k, v in info['probes'].items() if v}
        table[name]['exposure'] = round(info['exposure'], 3)
        rgbs[name] = {k: sample_rgb(img, info['probes'][k]) for k in ('roofLit', 'roofShade', 'valanceLit', 'valanceShade') if info['probes'].get(k)}
    keys = ['roofLit', 'roofShade', 'valanceLit', 'valanceShade', 'legOuter', 'legInner', 'wallLit', 'wallShade', 'doorway', 'windowPane', 'exposure']
    print(f"{'':13}" + ''.join(f'{k:>13}' for k in keys))
    for name in table:
        print(f'{name:13}' + ''.join(f'{table[name].get(k, float("nan")):>13}' for k in keys))
    if a.colours:
        print('\ncolour depth (median sRGB, saturation) lit roof | roof turned away | valance lit | valance turned away')
        for name in rgbs:
            if len(rgbs[name]) < 4: continue
            print(f'{name:12}' + ' | '.join(f'{str(tuple(rgbs[name][k])):>16} s{sat(rgbs[name][k]):.2f}' for k in ('roofLit', 'roofShade', 'valanceLit', 'valanceShade')))
    fails = []
    nan = float('nan')
    if all(n in table for n in ('zwart', 'antraciet', 'grijs')):
        z, an, gr = table['zwart'], table['antraciet'], table['grijs']
        if not 45 <= z['roofLit'] <= 80: fails.append(f"zwart lit roof {z['roofLit']} outside 45-80 (target 55-75)")
        if not 18 <= z['roofShade'] <= 40: fails.append(f"zwart roof turned away {z['roofShade']} outside 18-40 (target 25-35)")
        if an['roofLit'] - z['roofLit'] < 25: fails.append(f"antraciet lit roof only {an['roofLit'] - z['roofLit']:.1f} levels above zwart (need >= 25)")
        if gr['roofLit'] - an['roofLit'] < 25: fails.append(f"grijs lit roof only {gr['roofLit'] - an['roofLit']:.1f} levels above antraciet (need >= 25)")
    for nm in ('zwart', 'zwart-3x6'):
        if nm not in table: continue
        t = table[nm]
        frame = max(t['legOuter'], t['legInner'])
        if t['valanceLit'] > frame + 1: fails.append(f"{nm}: valance {t['valanceLit']} lighter than the frame next to it ({frame})")
    if 'zwart-wanden' in table:
        t = table['zwart-wanden']
        wl, ws, dw = t.get('wallLit', nan), t.get('wallShade', nan), t.get('doorway', nan)
        if not 55 <= wl <= 90: fails.append(f"walled hero: lit wall {wl} outside 55-90 (target 60-85)")
        if not dw >= 50: fails.append(f"walled hero: closed door leaf {dw} below 50")
        if not 22 <= ws <= 40: fails.append(f"walled hero: wall turned away {ws} outside 22-40 (target 25-35)")
        if not wl - ws >= 20: fails.append(f"walled hero: lit wall only {wl - ws:.1f} levels above the wall turned away (need >= 20)")
        if not 50 <= t['roofLit'] <= 85: fails.append(f"walled hero: lit roof {t['roofLit']} outside 50-85")
        wp = t.get('windowPane', nan)
        if not 10 <= wp <= 70: fails.append(f"walled hero: PVC window pane {wp} outside 10-70 (dark smoky foil: no black void, no white card seen through it)")
    if 'zwart-deur' in table:
        dw = table['zwart-deur'].get('doorway', nan)
        if not 12 <= dw <= 60: fails.append(f"walled detail: inside through the door {dw} outside 12-60 (target 15-35)")
    if not fails and not any(n in table for n in ('zwart', 'zwart-wanden', 'zwart-deur')):
        print('(no checked jobs in this run: no pass/fail)'); return
    print('\n' + ('PASS' if not fails else 'FAIL\n  ' + '\n  '.join(fails)))
    print(f'renders: {out_dir}')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
