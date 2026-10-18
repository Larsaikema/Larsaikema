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
    m = models(spec)[0]
    p = spec.get('params') or {}
    if m == 'stertent' and p.get('walls'):
        return 40          # panorama windows: stochastic glazing over the floor
    if m == 'frameTent' and (p.get('walls') or 'windows') not in ('none',) and p.get('frame', True) is not False:
        return 22
    if m == 'gardenPavilion':
        return 24          # twin-wall polycarbonate roof
    if m == 'tarp' and p.get('color') == 'transparant':
        return 28
    if spec.get('items'):
        return 18
    return 16


def translate(job):
    spec = copy.deepcopy(job['spec'])
    f = job['file']
    if spec.get('model') == 'frameTent':
        p = spec.setdefault('params', {})
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
        spec.setdefault('camera', {'elevation': 22, 'azimuth': 28})
    if f == 'advies-stretchtent-of-stertent.webp':
        for it in spec['items']:
            x = it.get('position', [0, 0, 0])[0]
            it['position'] = [(-5.6 if x < 0 else 5.6), 0, 0]
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
        s['bg'] = BG
        s['out'] = f'../../{j["out"]}'
        out.append(s)
    name = 'tents-other-preview.jsonl' if preview else 'tents-other.jsonl'
    dst = REPO / 'renders/batches' / name
    dst.write_text(''.join(json.dumps(s, ensure_ascii=False) + '\n' for s in out))
    print(f'{dst.relative_to(REPO)}: {len(out)} jobs')


if __name__ == '__main__':
    main()
