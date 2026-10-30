#!/usr/bin/env python3
"""Shopify shipping profiles from the catalog: catalog/export/shipping-profiles.json, applied by `node scripts/seed/seed.mjs shipping`.

The product pages and the cart show each product's shipping from custom.verzendkosten_staffel, made by
catalog/tools/skeleton/kk_ship.py from the variant weight, the quantity and the product's class. Shopify charges weight-based rates
per shipping profile, so the store gets one profile per class with the same tiers:

  General profile (default)   pakket: up to 31,5 kg € 6,95, heavier on a pallet           everything not in another profile
  Groot pakket                up to 25 kg € 19,95, up to 40 kg € 39,90, heavier on a pallet  statafels, terrastafels, klaptafels
  Pallet                      € 49 / 79 / 129 / 175 up to 150 / 400 / 700 / 1.000 kg, 2 and 3 pallets up to 3.000 kg
  Betonblok <weight>          per block, -15 % per block from 4 (one profile per block weight, so the weight counts the blocks)

Above 3.000 kg per profile there is no rate: checkout then asks the shopper to contact the shop (freight on request, as the
product pages say). Shopify adds up the rates of different profiles in one order; the cart says 'indicatie' when lines ship
on more than one rate (theme/snippets/cart-shipping.liquid).

The check below compares, per variant and for 1-40 pieces, what the product page shows with what checkout will charge, and fails
when checkout would charge more for 1-3 pieces (it may show more on the page: kk_ship merges tiers per option value upwards).
Usage: python3 catalog/tools/shipping_profiles.py   (run after catalog/build.py)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'tools' / 'skeleton'))
import kk_ship  # noqa: E402
from validate import _tiers_at  # noqa: E402

COUNTRIES = ['NL', 'BE']
PER_STUK_MAX_PIECES = 12
GRAM = 0.001             # Shopify adds up variant weights in grams: each rate starts 1 g above the one before, so no order weight
                         # matches two rates (checkout would offer both, e.g. '1 st.' and '2 st.' for exactly one betonblok)


def pallet_rates(start=0.0):
    out, lo = [], start
    for top, eur in kk_ship.PALLET:
        name = 'Pallet' if top <= 1000 else f'{top // 1000} pallets'
        out.append({'name': name, 'min_kg': lo, 'max_kg': float(top), 'amount': eur})
        lo = float(top)
    return out


PROFILES = {
    'pakket': [{'name': 'Pakket', 'min_kg': 0.0, 'max_kg': kk_ship.PARCEL_MAX, 'amount': kk_ship.PARCEL}] + pallet_rates(kk_ship.PARCEL_MAX),
    'groot': [{'name': 'Groot pakket', 'min_kg': 0.0, 'max_kg': 25.0, 'amount': 19.95},
              {'name': '2 grote pakketten', 'min_kg': 25.0, 'max_kg': 40.0, 'amount': 39.9}] + pallet_rates(40.0),
    'pallet': pallet_rates(0.0),
}


def separate(rates):
    out = [dict(r) for r in rates]
    for prev, r in zip(out, out[1:]):
        r['min_kg'] = round(prev['max_kg'] + GRAM, 3)
    return out


def rate_at(rates, kg):
    for r in rates:
        if r['min_kg'] <= kg <= r['max_kg'] + 1e-9:
            return r['amount']
    return None


def product_class(p):
    st = p['metafields'].get('verzendkosten_staffel') or {}
    firsts = {t[0]['bedrag'] for t in [st.get('staffel') or []] + list(((st.get('per_optie') or {}).get('waarden') or {}).values()) if t}
    if st.get('eenheid') == 'per stuk':
        return 'per stuk'
    if p['metafields'].get('verzending') == 'pallet' or 'pallet' in p.get('tags', []):
        return 'pallet'
    if firsts & {19.95, 39.9} or p.get('product_type') in kk_ship.BULKY_TYPES:
        return 'groot'
    return 'pakket'


def main():
    cat = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
    products = [p for p in cat['products'] if not p.get('gift_card') and p['variants'][0].get('requires_shipping', True)]
    skus = {'groot': [], 'pallet': []}
    per_stuk = {}
    problems, checks, higher = [], 0, 0
    for p in products:
        cls = product_class(p)
        st = p['metafields'].get('verzendkosten_staffel')
        if cls == 'per stuk':
            names = [o['name'] for o in p['options']]
            po = st['per_optie']
            i = names.index(po['optie'])
            for v in p['variants']:
                t = po['waarden'][v[f'option{i + 1}']]
                kg = v['grams'] / 1000
                key = (kg, json.dumps(t))
                per_stuk.setdefault(key, {'kg': kg, 'tiers': t, 'skus': []})['skus'].append(v['sku'])
            continue
        if cls in skus:
            skus[cls] += [v['sku'] for v in p['variants']]
        for v in p['variants']:
            kg = v['grams'] / 1000
            for n in range(1, 41):
                shown = _tiers_at(st, p, v, n) if st else kk_ship.PARCEL
                if shown is None:
                    continue
                charged = rate_at(PROFILES[cls], kg * n)
                checks += 1
                if charged is None:
                    continue
                if charged > shown + 0.005 and n <= 3:
                    problems.append(f'{p["handle"]} {v["sku"]} x{n}: page {shown:.2f}, checkout {charged:.2f}')
                elif charged < shown - 0.005:
                    higher += 1
    profiles = [{'name': None, 'default': True, 'rates': separate(PROFILES['pakket']), 'skus': None},
                {'name': 'Groot pakket', 'rates': separate(PROFILES['groot']), 'skus': skus['groot']},
                {'name': 'Pallet', 'rates': separate(PROFILES['pallet']), 'skus': skus['pallet']}]
    for (kg, _), g in sorted(per_stuk.items()):
        rates, lo = [], 0.0
        for n in range(1, PER_STUK_MAX_PIECES + 1):
            each = [r for r in g['tiers'] if r['vanaf'] <= n][-1]['bedrag']
            rates.append({'name': f'Betonblok op pallet ({n} st.)', 'min_kg': lo, 'max_kg': round(n * kg, 3), 'amount': round(each * n, 2)})
            lo = round(n * kg, 3)
        profiles.append({'name': f'Betonblok {kg:g} kg', 'rates': separate(rates), 'skus': g['skus']})
    out = {'_comment': 'Made by catalog/tools/shipping_profiles.py from catalog.json; applied by `node scripts/seed/seed.mjs shipping`.',
           'currency': 'EUR', 'countries': COUNTRIES, 'profiles': profiles}
    (ROOT / 'export' / 'shipping-profiles.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'profiles: {len(profiles)} ({", ".join(p["name"] or "General" for p in profiles)})')
    print(f'variants: groot pakket {len(skus["groot"])}, pallet {len(skus["pallet"])}, betonblok {sum(len(g["skus"]) for g in per_stuk.values())}')
    print(f'checked {checks} variant x quantity pairs: page above checkout {higher}, checkout above page for 1-3 pieces {len(problems)}')
    for x in problems[:20]:
        print('  ', x)
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
