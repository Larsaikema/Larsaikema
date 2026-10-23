#!/usr/bin/env python3
"""Batch for the tents-other render group, generated from catalog/export/image-jobs.json.

Every job whose spec.model (or every item model) is one of the group's builders goes in, with
the translations that make the catalogue spec renderable / correct:
  - frameTent: `series` from the product line when the job does not pass it (500 Comfort,
    550 Compleet: storm straps, 550 Premium: ground frame, 620 Professional: 2,2 m sides,
    PE Basis), so the four PVC products no longer share one picture;
  - the verbindingstunnel spec ({items: [tent, tent], tunnel: {...}}): the tunnel becomes an
    opblaasbareTunnel item and both tents get a doorway wall on the facing side (and no guy
    ropes across the tunnel);
  - the stretchtent-vs-stertent article banner: the tents further apart so their guy lines no
    longer cross.

  python3 renders/tools/batch_tents_other.py            # final: renders/batches/tents-other.jsonl (2000 px)
  python3 renders/tools/batch_tents_other.py --preview  # renders/batches/tents-other-preview.jsonl (1200 px, few samples)
"""
import copy, json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
MINE = {'opblaasbareTent', 'opblaasbareTunnel', 'frameTent', 'stretchtent', 'stertent', 'canopyRoof', 'marketStall',
        'gardenPavilion', 'carportTent', 'shadeSail', 'tarp'}
SERIES = [('partytent-pe-basis-buizenframe', 'basis'), ('partytent-pvc-500-comfort', '500'),
          ('partytent-pvc-550-compleet', '550-compleet'), ('partytent-pvc-550-premium', '550-premium'),
          ('partytent-pvc-620-professional', '620')]
BG = '#ECE4D6'


def models(spec):
    if spec.get('items'):
        return [it.get('model') for it in spec['items']]
    return [spec.get('model')]


def preview_samples(job, spec):
    """Low sample counts for the preview run; more where stochastic glazing / soft shadows need it."""
    # (round 5: lower again; on a shared 4-core machine a 1200 px frame costs ~4-5 s per sample, the
    # floor bake and shader set-up ~1 min per job, and the preview only has to be judged, not shipped)
    m = models(spec)[0]
    p = spec.get('params') or {}
    if m == 'stertent' and p.get('walls'):
        return 28          # panorama windows: stochastic glazing over the floor
    if m == 'frameTent' and (p.get('walls') or 'windows') not in ('none',) and p.get('frame', True) is not False:
        return 18
    if m == 'gardenPavilion':
        return 18          # twin-wall polycarbonate roof
    if m == 'tarp' and p.get('color') == 'transparant':
        return 20
    if spec.get('items'):
        return 14
    return 12


def walled(spec):
    """Tents with hanging side walls (floor visible through windows / doors)."""
    m = models(spec)[0]
    p = spec.get('params') or {}
    if m == 'stertent' and p.get('walls'):
        return True
    if m == 'frameTent' and p.get('frame', True) is not False:
        return str(p.get('variant', '')).startswith('opslag') or (p.get('walls') or 'none') != 'none'
    if m == 'opblaasbareTent' and p.get('walls'):
        return True
    return False


def translate(job):
    spec = copy.deepcopy(job['spec'])
    f = job['file']
    if spec.get('model') == 'frameTent':
        p = spec.setdefault('params', {})
        # the eindwand product: the end wall with its doorway at the gable, not the long side
        if f.startswith('eindwand-en-tussenwand-partytent'):
            p.setdefault('gableDoor', 'left')
        if 'series' not in p:
            for prefix, ser in SERIES:
                if f.startswith(prefix):
                    p['series'] = ser
                    break
    if spec.get('items') and spec.get('tunnel'):
        t = spec.pop('tunnel')
        a, b = sorted(spec['items'], key=lambda it: it.get('position', [0])[0])
        tw = a.get('w', 3)
        a.update({'skipGuys': 'right', 'walls': {'right': 'tunnel'}})
        b.update({'skipGuys': 'left', 'walls': {'left': 'tunnel'}})
        gap = t.get('length', 1.4)
        a['position'] = [-(tw / 2 + gap / 2), 0, 0]
        b['position'] = [tw / 2 + gap / 2, 0, 0]
        spec['items'] = [a, b, {'model': 'opblaasbareTunnel', 'length': gap, 'color': t.get('color', a.get('color', 'wit')), 'tentW': tw}]
        # round 6: from 28 deg the open right tent showed the inside of its doorway wall as a
        # stray slab and the joins did not resolve; from 10 deg the vault runs between the two
        # tents with an arch rib at each join
        spec['camera'] = {'elevation': 24, 'azimuth': 10}
    if f == 'advies-stretchtent-of-stertent.webp':
        for it in spec['items']:
            x = it.get('position', [0, 0, 0])[0]
            it['position'] = [(-5.6 if x < 0 else 5.6), 0, 0]
        # round 6: the scene took the zand stretch tent's auto exposure (0.49), so the white star
        # tent read mid grey (165-206); one exposure with the white-cloth tone curve keeps the star
        # white (as its own hero) and the zand sail at its hero value
        spec.setdefault('rig', {}).update({'exposure': 0.78, 'toneMapping': 'neutral', 'shoulder': 0.88})
    return spec


def main():
    preview = '--preview' in sys.argv
    jobs = json.loads((REPO / 'catalog/export/image-jobs.json').read_text())['jobs']
    out = []
    for j in jobs:
        spec = j.get('spec')
        if not spec or not all(m in MINE for m in models(spec)):
            continue
        s = translate(j)
        if preview:
            if 'imageWidth' not in s:
                s['size'] = 1200
            s['samples'] = preview_samples(j, s)
            # half the floor-bake passes (one-level merge into the builder's groundAO); round 6:
            # NOT for tents with hanging walls: the floor seen through windows / doors came out
            # blotchy with 32 directions, so those get a denser, softer bake
            gao = {'samples': 32, 'keySamples': 32}
            if walled(s):
                gao = {'samples': 144, 'keySamples': 96, 'blur': 3.0}
            s.setdefault('rig', {}).setdefault('groundAO', {}).update(gao)
        s['bg'] = BG
        s['out'] = f'../../{j["out"]}'
        out.append(s)
    name = 'tents-other-preview.jsonl' if preview else 'tents-other.jsonl'
    dst = REPO / 'renders/batches' / name
    dst.write_text(''.join(json.dumps(s, ensure_ascii=False) + '\n' for s in out))
    print(f'{dst.relative_to(REPO)}: {len(out)} jobs')


if __name__ == '__main__':
    main()
