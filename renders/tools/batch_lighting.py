#!/usr/bin/env python3
"""Batch for the lighting render group, generated from catalog/export/image-jobs.json.

Every job whose spec.model (or every item model) is one of the group's builders (prikkabel,
ropeLight, stringLights, ledBulb, floodLight, heater, heaterCover) goes in, with the catalogue
spec unchanged; only size / samples / background are set here. Output paths point at
catalog/images/ (relative to the batch file).

  python3 renders/tools/batch_lighting.py            # final: renders/batches/lighting-final.jsonl (2000 px, 40 samples)
  python3 renders/tools/batch_lighting.py --preview  # renders/batches/lighting.jsonl (1200 px, 14 samples)
  node renders/render.mjs --batch renders/batches/lighting.jsonl
"""
import copy, json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
MINE = {'prikkabel', 'ropeLight', 'stringLights', 'ledBulb', 'floodLight', 'heater', 'heaterCover'}
BG = '#ECE4D6'  # brand token `backdrop` (Linnen), as every catalogue image


def models(spec):
    if spec.get('items'):
        return [it.get('model') for it in spec['items']]
    return [spec.get('model')]


def main():
    preview = '--preview' in sys.argv
    jobs = json.loads((REPO / 'catalog/export/image-jobs.json').read_text())['jobs']
    out = []
    for job in jobs:
        spec = job.get('spec') or {}
        ms = models(spec)
        if not ms or not all(m in MINE for m in ms):
            continue
        s = copy.deepcopy(spec)
        w, h = s.pop('imageWidth', None), s.pop('imageHeight', None)
        s.pop('size', None)
        if w and h:
            k = 1200 / max(w, h) if preview else 1
            s['imageWidth'], s['imageHeight'] = round(w * k), round(h * k)
        else:
            s['size'] = 1200 if preview else 2000
        s['samples'] = 14 if preview else 40
        s['bg'] = BG
        s['out'] = '../../' + job['out']
        out.append(s)
    dst = REPO / 'renders/batches' / ('lighting.jsonl' if preview else 'lighting-final.jsonl')
    dst.write_text(''.join(json.dumps(s, ensure_ascii=False) + '\n' for s in out))
    print(f'{len(out)} jobs -> {dst.relative_to(REPO)}')


if __name__ == '__main__':
    main()
