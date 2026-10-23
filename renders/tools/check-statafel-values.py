#!/usr/bin/env python3
"""Value / colour check for the statafel family (stretch rok zwart + rood, strik wit, kaal birch).

Renders each hero and reads the rendered sRGB at the probe points the builders export
(meta.probes, projected to pixels by js/main.js). Each value is the median of 7x7 windows round
the probe points (eyedropper-like). Reported: Rec.709 luma (0-255), mean RGB, and for red the hue
(degrees) and saturation, so a top that drifts to salmon shows up.

Targets (art direction 18 Oct 2026):
  stretch zwart  lit faces 40-82 (round 5: sheen bands show the form; no crush: nothing below ~18), top not a
                 separate mid-grey disc (top luma <= lit skirt + 25)
  stretch rood   hue of top / funnel / skirt within 6 degrees of each other, top saturation >= 0.7
                 (not salmon), lit skirt R >= 160
  strik wit      (round 5, 22 Oct 2026: a third of a stop down, raking key) lit skirt 212-242, upper drape
                 >= 175 lit, >= 150 turned away, >= 140 facing the camera under the blad; the irregular folds keep
                 form: skirt front (a fold flank) 160-240, skirt shade 120-205
  tops (art direction 22 Oct 2026): every horizontal top is lit as the brightest or near-brightest surface
                 by the overhead box, with a soft falloff and cloth / wood texture: inside the top (polygon of
                 the probes' topRing at 0.85 R) luma std >= 2 (a flat fill fails) and fine texture (luma minus
                 a 4 px blur, std) >= 0.5; strik wit top 222-238 (below the #EFEDE8 backdrop, so the rim separates)
                 and not below the lit skirt - 8; stretch tops
                 not darker than the lit skirt / funnel - 10
  stretch        fabric variation: luma std in a 41 px window on the lit funnel >= 3 (sheen / strain
                 streaks, not flat paint)
  kaal berken    top R 205-232 (lit birch, not blown out)
  floor          under a foot at least 25 levels darker than open floor

  python3 renders/tools/check-statafel-values.py [--size 1000] [--samples 16] [--keep DIR] [--only zwart,rood]
"""
import argparse, colorsys, json, os, subprocess, sys, tempfile
from statistics import median
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER = os.path.join(os.path.dirname(HERE), 'render.mjs')

JOBS = [
    ('zwart', {'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'angle': 'hero'}),
    ('rood', {'model': 'statafelCover', 'type': 'stretch', 'color': 'rood', 'diameter': 0.8, 'angle': 'hero'}),
    ('strik', {'model': 'statafelCover', 'type': 'strik', 'color': 'wit', 'diameter': 0.8, 'angle': 'hero'}),
    ('kaal', {'model': 'statafel', 'diameter': 0.8, 'top': 'berken', 'frame': 'zwart', 'angle': 'hero'}),
]


def luma(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def sample(img, pts, half):
    vals = []
    for (x, y) in pts:
        xs = []
        for dy in range(-half, half + 1):
            for dx in range(-half, half + 1):
                px = img.getpixel((min(img.width - 1, max(0, int(x) + dx)), min(img.height - 1, max(0, int(y) + dy))))
                xs.append(px[:3])
        vals.append(tuple(median(p[i] for p in xs) for i in range(3)))
    return tuple(sum(v[i] for v in vals) / len(vals) for i in range(3))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--size', type=int, default=1000)
    ap.add_argument('--samples', type=int, default=16)
    ap.add_argument('--keep', default=None)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    only = set(a.only.split(',')) if a.only else None
    tmp = a.keep or tempfile.mkdtemp(prefix='sfcheck-')
    os.makedirs(tmp, exist_ok=True)
    jobs = [(k, j) for k, j in JOBS if not only or k in only]
    batch = os.path.join(tmp, 'jobs.jsonl')
    with open(batch, 'w') as f:
        for k, j in jobs:
            f.write(json.dumps({**j, 'out': f'{k}.png', 'size': a.size}) + '\n')
    out = subprocess.run(['node', RENDER, '--batch', batch, '--samples', str(a.samples), '--json'], capture_output=True, text=True)
    infos = [json.loads(l) for l in out.stdout.splitlines() if l.startswith('{"ms"')]
    if len(infos) != len(jobs):
        print(out.stdout[-3000:], out.stderr[-3000:])
        sys.exit(2)
    half = max(2, round(3 * a.size / 1000))
    ok = True
    res = {}
    std = {}
    tops = {}
    for (k, _), info in zip(jobs, infos):
        img = Image.open(os.path.join(tmp, f'{k}.png')).convert('RGB')
        vals = {}
        for name, pts in info['probes'].items():
            vals[name] = sample(img, pts, half)
        res[k] = vals
        if 'funnelLit' in info['probes']:
            import numpy as np
            g = np.asarray(img.convert('L')).astype(float)
            w = round(20 * a.size / 1000)
            stds = [g[int(y) - w:int(y) + w + 1, int(x) - w:int(x) + w + 1].std() for x, y in info['probes']['funnelLit']]
            std[k] = sum(stds) / len(stds)
        if 'topRing' in info['probes']:
            import numpy as np
            mask = Image.new('L', img.size, 0)
            ImageDraw.Draw(mask).polygon([tuple(p) for p in info['probes']['topRing']], fill=255)
            m = np.asarray(mask) > 0
            g = np.asarray(img.convert('L')).astype(float)
            hp = g - np.asarray(img.convert('L').filter(ImageFilter.GaussianBlur(4 * a.size / 1000))).astype(float)
            tops[k] = (g[m].std(), hp[m].std(), g[m].mean())
        print(f'== {k} (exposure {info.get("exposure"):.3f})')
        for name, c in vals.items():
            h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in c))
            hsv = colorsys.rgb_to_hsv(*(v / 255 for v in c))
            print(f'   {name:12s} luma {luma(c):6.1f}   rgb ({c[0]:5.1f},{c[1]:5.1f},{c[2]:5.1f})   hue {h * 360:5.1f}  sat {hsv[1]:.2f}')
    def check(cond, msg):
        nonlocal ok
        print(('  ok   ' if cond else '  FAIL ') + msg)
        ok = ok and cond
    print('== checks')
    if 'zwart' in res:
        v = res['zwart']
        # round 5: black jersey shows its form in broad sheen bands (the lit panel carries one): up to 82
        check(40 <= luma(v['skirtLit']) <= 82, f"zwart lit skirt luma {luma(v['skirtLit']):.0f} in 40-82")
        check(40 <= luma(v['funnelLit']) <= 66, f"zwart lit funnel luma {luma(v['funnelLit']):.0f} in 40-66")
        check(luma(v['skirtShade']) >= 18, f"zwart skirt turned away {luma(v['skirtShade']):.0f} >= 18")
        check(luma(v['top']) <= luma(v['skirtLit']) + 25, f"zwart top {luma(v['top']):.0f} <= lit skirt + 25")
    if 'rood' in res:
        v = res['rood']
        hues = {n: colorsys.rgb_to_hsv(*(x / 255 for x in v[n]))[0] * 360 for n in ('top', 'funnelLit', 'skirtLit', 'skirtFront')}
        hues = {n: (h if h < 180 else h - 360) for n, h in hues.items()}
        spread = max(hues.values()) - min(hues.values())
        check(spread <= 6, f"rood hue spread {spread:.1f} deg <= 6 ({', '.join(f'{n} {h:.1f}' for n, h in hues.items())})")
        sat = colorsys.rgb_to_hsv(*(x / 255 for x in v['top']))[1]
        check(sat >= 0.7, f"rood top saturation {sat:.2f} >= 0.70")
        check(v['skirtLit'][0] >= 160, f"rood lit skirt R {v['skirtLit'][0]:.0f} >= 160")
    if 'strik' in res:
        v = res['strik']
        check(212 <= luma(v['skirtLit']) <= 242, f"strik skirtLit {luma(v['skirtLit']):.0f} in 212-242")
        # the front probes sit on fold flanks / under the blad: midtones, but never grey-dark
        check(160 <= luma(v['skirtFront']) <= 240, f"strik skirtFront {luma(v['skirtFront']):.0f} in 160-240 (fold flank)")
        check(luma(v['upperLit']) >= 175, f"strik upperLit {luma(v['upperLit']):.0f} >= 175 (raking key: folds keep shading)")
        check(luma(v['upperFront']) >= 140, f"strik upperFront {luma(v['upperFront']):.0f} >= 140 (under the blad)")
        check(luma(v['upperShade']) >= 150, f"strik upperShade {luma(v['upperShade']):.0f} >= 150")
        check(120 <= luma(v['skirtShade']) <= 205, f"strik skirtShade {luma(v['skirtShade']):.0f} in 120-205 (folds keep form)")
        check(222 <= luma(v['top']) <= 238, f"strik top {luma(v['top']):.0f} in 222-238 (below the backdrop)")
        check(luma(v['top']) >= luma(v['skirtLit']) - 8, f"strik top {luma(v['top']):.0f} not below lit skirt {luma(v['skirtLit']):.0f} - 8")
    for k in ('zwart', 'rood'):
        if k in std:
            check(std[k] >= 3, f"{k} funnel texture: luma std {std[k]:.1f} >= 3")
        if k in res:
            v = res[k]
            ref = max(luma(v['skirtLit']), luma(v['funnelLit']))
            check(luma(v['top']) >= ref - 10, f"{k} top {luma(v['top']):.0f} >= brightest lit body {ref:.0f} - 10")
    for k, (sd, hp, mean) in tops.items():
        check(sd >= 2, f"{k} top spread: luma std {sd:.2f} >= 2 (mean {mean:.0f})")
        check(hp >= 0.5, f"{k} top fine texture: high-pass std {hp:.2f} >= 0.5")
    if 'kaal' in res:
        v = res['kaal']
        check(205 <= v['top'][0] <= 232, f"kaal birch top R {v['top'][0]:.0f} in 205-232")
    for k, v in res.items():
        if 'floorFoot' in v and 'floorOpen' in v:
            check(luma(v['floorOpen']) - luma(v['floorFoot']) >= 25, f"{k} floor under foot {luma(v['floorFoot']):.0f} vs open {luma(v['floorOpen']):.0f} (>= 25 darker)")
    print('images in', tmp)
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
