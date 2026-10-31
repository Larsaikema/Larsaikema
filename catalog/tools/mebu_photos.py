#!/usr/bin/env python3
"""Supplier photos for the supplier assortment: catalog/photos.json entries made from catalog/mebu/assortment.json (every variant's
photo_id → the supplier's original photo), so the photos of the furniture assortment never need mapping by hand.

Keeps every other photo (the owner's own, and supplier photos of products outside the assortment file), drops photo entries of
products that no longer exist (replaced by the assortment), and rewrites the entries of the assortment products.
Run after the skeleton build: python3 catalog/tools/mebu_photos.py   (then catalog/tools/photos.py --src <folder>)
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://www-mebu-vendisto-cdn.shoxl.shop/OriginalImage?documentId={}'


def slug(s):
    s = s.lower().replace('ø', '').replace('×', 'x').replace('é', 'e').replace('è', 'e').replace('ë', 'e')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s)).strip('-')


def main():
    data = json.loads((ROOT / 'mebu' / 'assortment.json').read_text(encoding='utf-8'))
    sk = {p['handle']: p for p in json.loads((ROOT / 'skeleton.json').read_text(encoding='utf-8'))['products']}
    skeleton = set(sk)
    photos = json.loads((ROOT / 'photos.json').read_text(encoding='utf-8'))
    ours = {p['handle'] for p in data['products']}
    def still_fits(t):
        # an owner photo of a product whose handle the assortment reuses stays when the options it names still exist
        p = sk.get(t['handle'])
        if p is None:
            return False
        opts = {o['name']: o['values'] for o in p['options']}
        return all(k in opts and x in opts[k] for k, x in (t.get('match') or {}).items())
    keep = [ph for ph in photos['photos']
            if not ph.get('assortment') and (ph.get('drive_id') or not any(t['handle'] in ours for t in ph['targets']))
            and all(still_fits(t) for t in ph['targets'])]
    dropped = len(photos['photos']) - len(keep)
    made, files = [], {ph['file'] for ph in keep}
    for p in data['products']:
        by_photo = {}
        for v in p['variants']:
            if v.get('photo_id'):
                by_photo.setdefault(v['photo_id'], []).append(v)
        for pid, vs in by_photo.items():
            first = vs[0]['options']
            base = slug(p['handle'] + '-' + '-'.join(first.values())) or slug(p['handle'])
            f, n = f'{base}-foto.webp', 2
            while f in files:
                f, n = f'{base}-{n}-foto.webp', n + 1
            files.add(f)
            what = ', '.join(v.lower() for v in first.values())
            made.append({'file': f, 'url': URL.format(pid), 'assortment': True,
                         'source': f"Mebu {vs[0].get('mebu_article') or ''}: {vs[0].get('mebu_name') or ''}".strip(),
                         'alt': f"{p['title']}{', ' + what if what else ''}",
                         'targets': [{'handle': p['handle'], 'match': v['options']} if v['options'] else {'handle': p['handle']} for v in vs]})
    photos['photos'] = keep + made
    (ROOT / 'photos.json').write_text(json.dumps(photos, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    without = [(p['handle'], v['options']) for p in data['products'] for v in p['variants'] if not v.get('photo_id')]
    print(f'photos: kept {len(keep)}, dropped {dropped} of products that are gone or rebuilt, made {len(made)} for the supplier assortment; '
          f'{len(without)} variants without a supplier photo')


if __name__ == '__main__':
    main()
