# The statafel- and furniture assortment from the supplier (Mebu), owner's decision 2026-10-31: one Klapklaar product per supplier
# model, offered in the combinations and at the prices the market sells them (incl. btw), with the supplier's photos only
# (catalog/photos.json, made by catalog/tools/mebu_photos.py). Data: catalog/mebu/assortment.json. This module replaces the
# products listed under "replaces" (and "remove"): they leave the skeleton, references to them are re-pointed to their successor,
# bundles built on them go (they come back built on the new products), and every old URL gets a redirect.
import json
import os
from kk_base import *

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'mebu', 'assortment.json')

# product types of the collection rules (kk_site): the supplier data's words mapped onto ours
TYPE = {'Stapelstoel': 'Stoel', 'Klapstoel': 'Stoel', 'Stoel': 'Stoel', 'Barkruk': 'Barkruk', 'Kruk': 'Kruk', 'Bank': 'Bank',
        'Statafel': 'Statafel', 'Terrastafel': 'Terrastafel', 'Tafel': 'Klaptafel', 'Klaptafel': 'Klaptafel', 'Bankettafel': 'Klaptafel',
        'Conferentietafel': 'Klaptafel', 'Examentafel': 'Klaptafel', 'Biertafel': 'Biertafelset', 'Biertafelset': 'Biertafelset',
        'Bierbank': 'Bierbank', 'Statafelrok': 'Statafelrok', 'Topcover': 'Topcover', 'Statafelhoes': 'Statafelhoes met strik',
        'Strikrok': 'Statafelhoes met strik', 'Statafelhoes met strik': 'Statafelhoes met strik', 'Beschermplaat': 'Beschermplaat',
        'Tafelhoes': 'Tafelhoes', 'Statafelkleed': 'Statafelkleed', 'Stoelhoes': 'Stoelhoes', 'Afzetpaal': 'Afzetpaal',
        'Transportkar': 'Transportkar', 'Onderdeel': 'Meubelonderdeel', 'Meubelonderdeel': 'Meubelonderdeel', 'Tafelblad': 'Meubelonderdeel'}
FAMILY = {'Statafel': 'statafel', 'Statafelrok': 'textiel', 'Topcover': 'textiel', 'Statafelhoes met strik': 'textiel',
          'Beschermplaat': 'textiel', 'Tafelhoes': 'textiel', 'Statafelkleed': 'textiel', 'Stoelhoes': 'textiel', 'Afzetpaal': 'inrichting'}
TAGS = {'Statafel': ['gebruik:evenement', 'gebruik:horeca', 'zakelijk'], 'Terrastafel': ['gebruik:horeca', 'gebruik:tuinfeest', 'zakelijk'],
        'Barkruk': ['gebruik:evenement', 'gebruik:horeca', 'zakelijk'], 'Kruk': ['gebruik:horeca', 'zakelijk'],
        'Stoel': ['gebruik:evenement', 'gebruik:horeca', 'zakelijk'], 'Bank': ['gebruik:horeca', 'zakelijk'],
        'Klaptafel': ['gebruik:evenement', 'gebruik:horeca', 'zakelijk'], 'Biertafelset': ['gebruik:evenement', 'gebruik:tuinfeest', 'zakelijk'],
        'Bierbank': ['gebruik:evenement', 'gebruik:tuinfeest', 'zakelijk'], 'Statafelrok': ['gebruik:evenement', 'gebruik:bruiloft', 'zakelijk'],
        'Topcover': ['gebruik:evenement', 'zakelijk'], 'Statafelhoes met strik': ['gebruik:bruiloft', 'gebruik:evenement', 'zakelijk'],
        'Beschermplaat': ['gebruik:evenement', 'zakelijk'], 'Tafelhoes': ['gebruik:evenement', 'zakelijk'], 'Statafelkleed': ['gebruik:bruiloft'],
        'Stoelhoes': ['gebruik:bruiloft', 'zakelijk'], 'Afzetpaal': ['gebruik:evenement', 'zakelijk'], 'Transportkar': ['zakelijk'],
        'Meubelonderdeel': ['zakelijk']}
# weight per piece when the data gives none (kg, ex packaging); shipping classes follow from it (kk_ship). Owner claim.
KG = {'Statafel': 13.0, 'Terrastafel': 11.0, 'Barkruk': 5.5, 'Kruk': 3.5, 'Stoel': 4.5, 'Bank': 9.0, 'Klaptafel': 15.0,
      'Biertafelset': 32.0, 'Bierbank': 8.0, 'Statafelrok': 0.6, 'Topcover': 0.2, 'Statafelhoes met strik': 0.9, 'Beschermplaat': 1.0,
      'Tafelhoes': 0.9, 'Statafelkleed': 0.8, 'Stoelhoes': 0.3, 'Afzetpaal': 7.0, 'Transportkar': 45.0, 'Meubelonderdeel': 0.5}
STAFFEL = {'Statafel': ST_MEUBEL, 'Terrastafel': ST_MEUBEL, 'Barkruk': ST_MEUBEL, 'Kruk': ST_MEUBEL, 'Stoel': ST_MEUBEL, 'Bank': ST_MEUBEL,
           'Klaptafel': ST_KLAPTAFEL, 'Biertafelset': ST_KLAPTAFEL, 'Bierbank': ST_KLAPTAFEL, 'Statafelrok': ST_TEXTIEL, 'Topcover': ST_TEXTIEL,
           'Statafelhoes met strik': ST_TEXTIEL, 'Beschermplaat': ST_TEXTIEL, 'Tafelhoes': ST_TEXTIEL, 'Statafelkleed': ST_TEXTIEL,
           'Stoelhoes': ST_TEXTIEL, 'Afzetpaal': ST_GROOT, 'Transportkar': ST_GROOT, 'Meubelonderdeel': None}
REF_KEYS = ('addons', 'past_op', 'andere_maten', 'addon_eenmalig')


def _kg(p, ptype):
    for s in p.get('specs') or []:
        if 'gewicht' in s['label'].lower():
            m = re.search(r'(\d+(?:[.,]\d+)?)\s*kg', s['waarde'])
            if m:
                return float(m.group(1).replace(',', '.'))
    return KG[ptype]


def _sku(article, used):
    base = 'KK-M-' + re.sub(r'[^A-Z0-9]', '', (article or 'X').upper()).lstrip('0')
    sku, n = base, 2
    while sku in used:
        sku, n = f'{base}-{n}', n + 1
    used.add(sku)
    return sku


def apply(errors, redirects):
    if not os.path.exists(DATA):
        return set(), {}
    data = json.load(open(DATA, encoding='utf-8'))
    new = data['products']
    successor = {}
    for np in new:
        for old in np.get('replaces') or []:
            successor.setdefault(old, np['handle'])
    removed = set(successor) | set(data.get('remove') or [])
    # bundles built on a removed product go too (they return built on the new products)
    changed = True
    while changed:
        changed = False
        for p in PRODUCTS:
            if p['handle'] in removed or not p.get('bundle'):
                continue
            comps = {c['handle'] for b in p['bundle']['componenten_per_variant'] for c in b['componenten']}
            if comps & removed:
                removed.add(p['handle'])
                changed = True
    removed_skus = {v['sku'] for p in PRODUCTS if p['handle'] in removed for v in p['variants']}
    removed_type = {p['handle']: ('Pakket' if p.get('bundle') else p['product_type']) for p in PRODUCTS if p['handle'] in removed}
    PRODUCTS[:] = [p for p in PRODUCTS if p['handle'] not in removed]
    for h in removed:
        HANDLES.pop(h, None)
    # references of the remaining products: to the successor, or out
    def remap(lst):
        if lst is None:
            return None
        out = []
        for h in lst:
            h2 = successor.get(h, h) if h in removed else h
            if h2 not in removed and h2 not in out:
                out.append(h2)
        return out
    for p in PRODUCTS:
        mf = p['metafields']
        for k in REF_KEYS:
            if isinstance(mf.get(k), list):
                mf[k] = remap(mf[k])
        if p.get('complementary'):
            p['complementary'] = remap(p['complementary'])
        for v in p['variants']:
            vm = v.get('metafields') or {}
            if vm.get('addon_varianten'):
                keep = [i for i, s in enumerate(vm['addon_varianten']) if s not in removed_skus]
                vm['addon_varianten'] = [vm['addon_varianten'][i] for i in keep]
                if vm.get('addon_aantallen'):
                    vm['addon_aantallen'] = [vm['addon_aantallen'][i] for i in keep]
    # the new products
    used = {v['sku'] for p in PRODUCTS for v in p['variants']}
    for np in new:
        ptype = TYPE.get(np['product_type'])
        if ptype is None:
            errors.append(f"mebu {np['handle']}: unknown product_type {np['product_type']!r}")
            continue
        names = [o['name'] for o in np.get('options') or []]
        kg = _kg(np, ptype)
        variants = []
        for v in np['variants']:
            vk = v.get('kg') or kg
            vv = variant(_sku(v.get('mebu_article'), used), [v['options'][n] for n in names], v['price'], round(vk * 1000), inv(1, v.get('mebu_article')))
            vv['metafields'] = {}
            vv['supplier_article'] = v.get('mebu_article')
            variants.append(vv)
        specs = [sp(ptype, s['label'], s['waarde']) for s in np.get('specs') or []]
        add({'handle': np['handle'], 'title': np['title'], 'product_type': ptype, 'tags': list(TAGS.get(ptype, ['zakelijk'])),
             'options': [opt(o['name'], o['values']) for o in np.get('options') or []], 'variants': variants, 'images': [],
             'metafields': {'specificaties': specs, 'staffelkorting': [dict(t) for t in STAFFEL[ptype]] if STAFFEL.get(ptype) else None,
                            'gewicht_kg': kg, 'garantie': None},
             'covers': [], 'family': FAMILY.get(ptype, 'meubilair'), 'weight': 2, 'supplier': 'mebu',
             'copy_brief': np.get('brief') or f"{np['title']}: supplier model, options and specs as in catalog/mebu/assortment.json.",
             'seo_keywords': np.get('seo_keywords') or [np['title'].lower()], 'price_ref': {'market': 'gelijk aan de markt (owner 2026-10-31)'}})
    # every old URL goes to its successor, or to the collection of its kind
    kinds = {'Statafel': 'statafels', 'Terrastafel': 'terrastafels', 'Barkruk': 'barkrukken', 'Stoel': 'stoelen-en-banken',
             'Kruk': 'stoelen-en-banken', 'Bank': 'stoelen-en-banken', 'Klaptafel': 'tafels', 'Transportkar': 'transportkarren',
             'Pakket': 'actiepakketten'}
    for h in sorted(removed):
        if h in HANDLES:
            continue  # handle reused by its successor: the URL stays
        to = f'/products/{successor[h]}' if h in successor else f"/collections/{kinds.get(removed_type.get(h), 'meubilair')}"
        redirects.append({'from': f'/products/{h}', 'to': to})
    return removed, successor
