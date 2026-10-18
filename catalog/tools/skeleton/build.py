#!/usr/bin/env python3
# Generates catalog/skeleton.json for Klapklaar. Run: python3 -I build.py <out.json> <assortment.json>
import json, sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kk_base import *
import fam_easyup, fam_acc, fam_big, fam_tafel, fam_rest, fam_set, fam_new, kk_addons, kk_ship, kk_site as site

OUT, ASSORT = sys.argv[1], sys.argv[2]
fam_easyup.build(); fam_acc.build(); fam_big.build(); fam_tafel.build(); fam_rest.build(); fam_set.build(); fam_new.build()

# ---------------------------------------------------------------- fixups
for h in ['statafel-inklapbaar-professional', 'statafelrok-stretch']:
    HANDLES[h]['metafields']['addons'] = [a for a in HANDLES[h]['metafields']['addons'] if a != 'beschermplaat-statafel']
    HANDLES[h].setdefault('complementary', []).append('beschermplaat-statafel')
errors = []
# the kar of every meubeltype goes along once per order line (merchandising reviews: no dead-end barkruk pages; a kar for every
# stapelstoel, klapstoel, klaptafel, ronde tafel, biertafelset and terrastafel; never on the PE-rotan barkruk, which does not stack)
for p in PRODUCTS:
    if p['handle'] in kk_addons.KAR_EENMALIG:
        p['metafields']['addon_eenmalig'] = [kk_addons.KAR_EENMALIG[p['handle']]]
# add-ons per variant (custom.addon_varianten / addon_aantallen) + product-level union, then staffels on every bundle
kk_addons.apply(errors)
# custom.stuklijst per variant of the buizenframe tents and the opslagtent (kk_bom: our own bouwtekening, H12 + M2)
import kk_bom
kk_bom.apply(errors)
kk_bom.stretch(errors)
# every zakelijk line says something on the B2B route: a staffel of its family (price band) when it has none yet
for p in PRODUCTS:
    mf = p['metafields']
    if 'zakelijk' in p['tags'] and not mf.get('staffelkorting') and not p.get('bundle'):
        top = max(v['price'] for v in p['variants']) / 100
        if any(v.get('quantity_rule') for v in p['variants']):
            st = ST_SLANG          # per meter / per m²
        elif mf.get('bedrukbaar'):
            st = ST_BEDRUKT
        elif top >= 400:
            st = ST_GROOT          # high-ticket: from 2 pieces
        elif top >= 100:
            st = ST_TENT
        else:
            st = ST_TEXTIEL
        mf['staffelkorting'] = [dict(t) for t in st]
BUNDLE_STAFFELS = kk_addons.bundle_staffels()
# add-ons that are added once per order line (not x the main quantity): must be one of the product's add-ons
for p in PRODUCTS:
    for x in p['metafields'].get('addon_eenmalig') or []:
        if x not in (p['metafields'].get('addons') or []):
            errors.append(f'{p["handle"]}: addon_eenmalig {x} is not one of its add-ons')
# accessories that also fit the inflatables. NB: never `+=` on a past_op list: the easy-up accessories share ONE list object
# (fam_acc EU), and an in-place add once put the inflatables on wieltas, beschermhoes, voetgewicht, regengoot and zandzakken.
for _h, _extra in [('watergewichtzakken-4x20-kg', ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-met-waterpoten',
                                                  'opblaasbare-zeshoektent']),
                   ('zitkussen-stoel-en-barkruk', ['barkruk-draad-stapelbaar', 'barkruk-pe-rotan', 'stapelstoel-metaal'])]:
    HANDLES[_h]['metafields']['past_op'] = list(HANDLES[_h]['metafields']['past_op']) + _extra
# cart recommendations the add-on block does not carry (catalog round 2026-10-18): stertent walls for the full colour tents and the
# stertent haringen/trekker; koppelgoot and onderdelen on the stretchtent (M4); the PE and PVC 500 tents get their own dakzeil
for _h in ['stertent-enkele-mast', 'stertent-dubbele-mast']:
    HANDLES[_h]['complementary'] = ['zijwanden-stertent', 'haringen-en-bevestigingsmateriaal-partytent', 'betonblok-ballast-tent']
HANDLES['stretchtent-compleet']['complementary'] = ['koppelgoot-stretchtent', 'onderdelen-stretchtent', 'palen-stretchtent', 'stretchdoek-los']
HANDLES['hypar-schaduwzeil-stretch']['complementary'] = ['onderdelen-stretchtent', 'palen-stretchtent', 'betonblok-ballast-tent']
HANDLES['tentvloer-kunststof']['complementary'] = ['tapijttegel-50x50', 'tape-voor-loper-en-vloer']
# catalog round 3: the loper op rol takes the same tape; the loper per meter points at the rol for 50 m
HANDLES['tape-voor-loper-en-vloer']['metafields']['past_op'] = list(HANDLES['tape-voor-loper-en-vloer']['metafields'].get('past_op') or []) + ['loper-rol-50-m']
HANDLES['loper-rol-50-m']['complementary'] = ['tape-voor-loper-en-vloer', 'afzetpaal-met-koord', 'loper-per-meter']
HANDLES['loper-per-meter']['complementary'] = list(HANDLES['loper-per-meter'].get('complementary') or []) + ['loper-rol-50-m']
HANDLES['statafel-wijnvat-houtlook']['complementary'] = ['wijnvat-set-statafel-barkrukken', 'barkruk-wijnvat']
for _h in ['statafel-design-marmerlook', 'statafel-design-zuilvoet', 'statafel-breed-stapelbaar']:
    HANDLES[_h]['complementary'] = ['barkruk-velours-stapelbaar', 'barkruk-chroom-stapelbaar', 'stretchhoes-statafel-vierkant-en-rechthoekig' if _h == 'statafel-breed-stapelbaar' else 'beschermplaat-statafel']
HANDLES['marktkraam-2-m']['complementary'] = ['dakzeil-marktkraam', 'werkblad-marktkraam', 'tentelastieken-met-bal', 'zandzakken-partytent-set-van-4']
HANDLES['tapijttegel-50x50']['complementary'] = ['tentvloer-kunststof', 'tape-voor-loper-en-vloer']
for _h in ['terrastafel-rond-inklapbaar', 'terrastafel-inklapbaar']:
    HANDLES[_h]['complementary'] = ['stapelstoel-metaal', 'kruk-laag-stapelbaar', 'transportkar-terrastafels']
# shipping per product (H11), packing data (M15) and the accessory discount with a tent (M1): kk_ship.py
kk_ship.apply(PRODUCTS)
kk_ship.verpakt(PRODUCTS)
kk_ship.addon_korting(PRODUCTS)
# every list metafield gets its own list object from here on (no shared-list side effects in later fix-ups)
for _p in PRODUCTS:
    for _k, _v in list(_p['metafields'].items()):
        if isinstance(_v, list):
            _p['metafields'][_k] = list(_v)
# custom.systeem: which tent system a product is, or fits (filter on partytent-onderdelen / zijwanden, basis of the
# easy-up-onderdelen and buizenframe-onderdelen collections)
SYSTEMEN = ['Easy-up', 'Buizenframe', 'Stretchtent', 'Stertent', 'Opblaasbare tent']
def own_system(p):
    t, f = p['product_type'], p['family']
    if t == 'Easy-up partytent':
        return 'Easy-up'
    if t == 'Partytent' or p['handle'] == 'opslagtent-pvc':
        return 'Buizenframe'
    if t == 'Stretchtent':
        return 'Stretchtent'
    if t == 'Stertent':
        return 'Stertent'
    if t == 'Opblaasbare tent':
        return 'Opblaasbare tent'
    return None
SYSTEEM_EXTRA = {  # accessories without a past_op list that fit several systems
    'haringen-en-bevestigingsmateriaal-partytent': ['Easy-up', 'Buizenframe', 'Stretchtent', 'Stertent'],
    'betonblok-ballast-tent': ['Buizenframe', 'Stretchtent', 'Stertent'],
    'reparatieset-tentdoek': ['Easy-up', 'Buizenframe'],
    'tentelastieken-met-bal': ['Easy-up', 'Buizenframe'],
    # catalog round 3: generic fixing materials (no past_op list of their own)
    'klittenband-zelfklevend': ['Easy-up', 'Buizenframe'],
    'zeilringen-12-mm': ['Easy-up', 'Buizenframe', 'Stretchtent', 'Stertent'],
    'schroevenset-tent': ['Buizenframe', 'Stretchtent', 'Stertent'],
}
for p in PRODUCTS:
    sy = set()
    if own_system(p):
        sy.add(own_system(p))
    for x in p['metafields'].get('past_op') or []:
        if x in HANDLES and own_system(HANDLES[x]):
            sy.add(own_system(HANDLES[x]))
    sy |= set(SYSTEEM_EXTRA.get(p['handle'], []))
    p['metafields']['systeem'] = [x for x in SYSTEMEN if x in sy] or None
# multi-size printed easy-ups: custom.gewicht_kg was the 2 x 2 / 3 x 3 m weight (22 / 27 kg) on sizes up to 4 x 8 m (84-90 kg). Left
# empty, so the PDP takes the chosen variant's weight (merchandising review 3); build.py (catalog) keeps it empty too.
NO_PRODUCT_WEIGHT = {'easy-up-partytent-professional-met-logo-op-de-luifel', 'easy-up-partytent-professional-full-colour-bedrukt',
                     'easy-up-partytent-premium-met-logo-op-de-luifel'}
for p in PRODUCTS:
    mf = p['metafields']
    for key in ['addons', 'past_op', 'andere_maten']:
        for x in (mf.get(key) or []):
            if x not in HANDLES:
                errors.append(f'{p["handle"]}: {key} -> unknown {x}')
    for x in p.get('complementary', []):
        if x not in HANDLES:
            errors.append(f'{p["handle"]}: complementary -> unknown {x}')
    for key in ['addons', 'past_op']:
        if mf.get(key) == []:
            mf[key] = None
    if p['handle'] in NO_PRODUCT_WEIGHT:
        mf['gewicht_kg'] = None   # weight per variant only (variants[].grams): one product weight would show the smallest size on every size
    else:
        mf['gewicht_kg'] = mf.get('gewicht_kg') or (round(p['variants'][0]['grams'] / 1000, 1) if p['variants'][0]['grams'] else None)
    p['tags'] = sorted(set(t.lower() for t in p['tags']))
    if mf['bedrukbaar'] and 'bedrukbaar' not in p['tags']:
        errors.append(f'{p["handle"]}: bedrukbaar without tag')
    if 'badge:actie' in p['tags']:
        errors.append(f'{p["handle"]}: badge:actie without compare_at')
    # Shopify takes 2048 variants per product, but Liquid's product.variants returns at most 250 and the theme builds its variant
    # JSON from it: keep every product at 250 or fewer
    if len(p['variants']) > 250:
        errors.append(f'{p["handle"]}: {len(p["variants"])} variants > 250 (Liquid product.variants limit)')
    names = [o['name'] for o in p['options']]
    for o in p['options']:
        if o['name'] not in ('Maat', 'Kleur', 'Uitvoering', 'Samenstelling', 'Bedrag'):
            errors.append(f'{p["handle"]}: option {o["name"]}')
        if o['name'] == 'Kleur':
            for v in o['values']:
                if v not in SWATCH_HEX:
                    errors.append(f'{p["handle"]}: colour {v} not in swatch list')
    # option values used by variants must be declared, and declared values must be used
    for i, o in enumerate(p['options']):
        used = {v[f'option{i + 1}'] for v in p['variants']}
        if used != set(o['values']):
            errors.append(f'{p["handle"]}: option {o["name"]} declared {o["values"]} used {sorted(used)}')
    combos = [tuple(v[f'option{i + 1}'] for i in range(3)) for v in p['variants']]
    if len(set(combos)) != len(combos):
        errors.append(f'{p["handle"]}: duplicate option combos')
    # variant image
    vmap, vby = p.get('variant_images'), p.get('variant_image_by')
    vsku = p.pop('variant_image_sku', None) or {}
    for v in p['variants']:
        if v['sku'] in vsku:
            v['image'] = vsku[v['sku']]  # e.g. the full colour variant of a product whose images follow Kleur
        elif vmap and vby in names:
            v['image'] = vmap.get(v[f'option{names.index(vby) + 1}'])
        else:
            v['image'] = None
# Shopify Standard Product Taxonomy category (CSV 'Product Category', seed script category GID), see kk_site.product_category
for p in PRODUCTS:
    pc = site.product_category(p)
    if not pc:
        errors.append(f'{p["handle"]}: no product category for type {p["product_type"]!r}')
        continue
    p['product_category'] = pc[0]
    p['product_category_id'] = 'gid://shopify/TaxonomyCategory/' + pc[1]
for p in PRODUCTS:
    files = {i['file'] for i in p['images']}
    for k, f_ in (p.get('variant_images') or {}).items():
        if f_ not in files:
            errors.append(f'{p["handle"]}: variant image {f_} not in images')
skus = collections.Counter(v['sku'] for p in PRODUCTS for v in p['variants'])
errors += [f'duplicate sku {s}' for s, n in skus.items() if n > 1]

# ---------------------------------------------------------------- collections
# only products with a print variant (custom.bedrukbaar): the zeshoek's printed roof is quoted, so it is not in here
bedrukte_tenten = [p['handle'] for p in PRODUCTS if p['family'] == 'bedrukt-tent'] + ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro',
                                                                                     'stertent-enkele-mast', 'stertent-dubbele-mast']
bedrukte_hoezen = [p['handle'] for p in PRODUCTS if p['family'] == 'bedrukt-textiel']
ONDERDEEL_TYPES = site.ONDERDELEN_TYPES + ['Tentverlichting', 'Verwarming']
easy_up_onderdelen = [p['handle'] for p in PRODUCTS if p['product_type'] in ONDERDEEL_TYPES and 'Easy-up' in (p['metafields'].get('systeem') or [])]
buizenframe_onderdelen = [p['handle'] for p in PRODUCTS if p['product_type'] in ONDERDEEL_TYPES and 'Buizenframe' in (p['metafields'].get('systeem') or [])]
# parts that fit a stretch-, ster- or opblaasbare tent (their own part types, plus haringen, betonblok, watergewicht, tent light)
SYS_REST = {'Stretchtent', 'Stertent', 'Opblaasbare tent'}
systeem_onderdelen = [p['handle'] for p in PRODUCTS if p['product_type'] in ONDERDEEL_TYPES + site.SYSTEEM_ONDERDELEN_TYPES
                      and SYS_REST & set(p['metafields'].get('systeem') or [])]
cols = site.build_collections(bedrukte_tenten, bedrukte_hoezen, easy_up_onderdelen, buizenframe_onderdelen, systeem_onderdelen)

def match(p, rule):
    c, rel, cond = rule['column'], rule['relation'], rule['condition']
    vals = {'type': [p['product_type']], 'title': [p['title']], 'tag': p['tags'], 'vendor': [p['vendor']]}[c]
    for v in vals:
        a, b = v.lower(), cond.lower()
        if rel == 'equals' and a == b: return True
        if rel == 'contains' and b in a: return True
        if rel == 'starts_with' and a.startswith(b): return True
    return False

membership = collections.defaultdict(list)
for c in cols:
    if c['type'] == 'smart':
        hs = [p['handle'] for p in PRODUCTS if (any if c['disjunctive'] else all)(match(p, r) for r in c['rules'])]
    else:
        hs = c['products']
        for h in hs:
            assert h in HANDLES, h
    c['_count'] = len(hs)
    for h in hs:
        membership[h].append(c['handle'])
for p in PRODUCTS:
    p['collections'] = membership[p['handle']]
    if len(p['collections']) <= 1 and p['product_type'] != 'Cadeaubon':
        errors.append(f'{p["handle"]}: only in {p["collections"]}')
for c in cols:
    if c['_count'] == 0:
        errors.append(f'collection {c["handle"]} empty')

# ---------------------------------------------------------------- coverage
A = json.load(open(ASSORT))
coverage, missing = {}, []
for cat in A['categories']:
    for s in cat['subcategories']:
        key = f'{cat["id"]}.{s["id"]}'
        hs = [p['handle'] for p in PRODUCTS if key in p['covers']]
        coverage[key] = hs
        if not hs:
            missing.append(key)
bad_cov = [f'{p["handle"]}: {k}' for p in PRODUCTS for k in p['covers'] if k not in coverage]
errors += [f'uncovered {m}' for m in missing] + [f'bad cover key {b}' for b in bad_cov]

# ---------------------------------------------------------------- copy groups
EU_SETS = ['starterspakket-easy-up-premium', 'compleet-pakket-easy-up-professional']
STF_SETS = ['pakket-statafel-met-stretchrok', 'pakket-statafel-hdpe-met-stretchrok', 'pakket-4-statafels-met-stretchrokken', 'pakket-statafels-met-transportkar',
           'pakket-5-statafels-stretchrokken-transportkar', 'pakket-10-statafels-stretchrokken-transportkar', 'pakket-15-statafels-stretchrokken-transportkar']
G4_MEUBEL = ['klaptafel-hdpe-rechthoekig', 'klaptafel-hdpe-rond', 'terrastafel-inklapbaar', 'biertafelset', 'bierbank-220', 'los-statafelblad', 'voetdoppen-set-van-4',
             'onderdelen-statafel']
BF_TENTS = [p['handle'] for p in PRODUCTS if p['product_type'] == 'Partytent']
SEATS = ['barkruk-stapelbaar-metaal', 'barkruk-houten-zitting', 'klapstoel', 'stapelstoel-cross-back', 'zitkussen-stoel-en-barkruk',
         'barkruk-velours-stapelbaar', 'barkruk-pe-rotan', 'barkruk-draad-stapelbaar', 'kruk-laag-stapelbaar', 'stapelstoel-metaal',
         'banquetstoel-gestoffeerd', 'bank-houten-frame', 'barkruk-chroom-stapelbaar']
def group_of(p):
    h, f = p['handle'], p['family']
    if f in ('easy-up-tent', 'frame', 'dakzeil', 'tassen', 'goten') or h in EU_SETS: return 'G1'
    if f in ('zijwand', 'verankering', 'schaduw') or (f == 'buizenframe' and h not in BF_TENTS): return 'G2'
    if h == 'afzetpaal-met-logo': return 'G5'
    if h in SEATS: return 'G4'
    if f in ('opslag', 'stretch', 'ster', 'opblaasbaar') or h in BF_TENTS: return 'G3'
    if f == 'statafel' or h in STF_SETS or h in G4_MEUBEL: return 'G4'
    if f in ('textiel', 'bedrukt-textiel', 'bedrukt-tent'): return 'G5'
    return 'G6'
GROUPS = {
    'G1': ('Easy-up partytenten en toebehoren', 'Premium en Professional per maat, losse frames en onderdelen, daken, tassen, regengoten en koppelingen, tentpakketten. Schrijf ook collecties easy-up-partytenten, easy-up-premium, easy-up-professional, tassen-en-wielsets. Eén basistekst per lijn, per maat variëren (capaciteit, gewicht, poten, verpakking); vergelijk Premium en Professional eerlijk.'),
    'G2': ('Zijwanden, verankering, buizenframe-onderdelen en overkappingen', 'Easy-up-wanden en -sets, verankering en ballast, onderdelen voor buizenframe-tenten, schaduwdoeken, overkappingen en tuinpaviljoen. Schrijf ook collecties zijwanden, gewichten-en-verankering, partytent-onderdelen, overkappingen-en-schaduwdoeken. Veiligheidstoon: specs, kg per poot, geen "klap" bij wind.'),
    'G3': ('Buizenframe-, opslag-, stretch-, ster- en opblaasbare tenten', 'Grote en bijzondere tenten met levertijden, maatwerk (stretch op maat) en vracht. Schrijf ook collecties partytenten, partytenten-buizenframe, opslagtenten, stretchtenten, stertenten, opblaasbare-tenten. Maatwerk: niet retour [claim].'),
    'G4': ('Statafels, tafels, zitmeubilair en statafelpakketten', 'Statafels, klaptafels, terrastafel, biertafelset/bank, barkrukken, stoelen, zitkussen, statafel-onderdelen en de statafelpakketten (los vs pakketprijs). Schrijf ook collecties statafels, meubilair, actiepakketten. Rekenregel personen per Ø; 110 cm hoogte.'),
    'G5': ('Statafeltextiel en alles met jouw logo', 'Stretchrokken, strik, kleden, topcovers, tafelhoezen, beschermplaten, plus alle bedrukte producten (tenten, wanden, daken, hoezen). Schrijf ook collecties statafelrokken (+kinderen), bedrukte-partytenten, bedrukte-statafelhoezen en de pagina bedrukken. Ook de afzetpaal met logo. Drukproef-flow en aanleverregels identiek houden.'),
    'G6': ('Transportkarren, verlichting, verwarming, evenement en overige pakketten', 'Transportkarren, prikkabels en lampen, heaters, afzetpaal, marktkraam, loper, de overige pakketten (terras, buffet, biertafels, prikkabelset, wijnvat) en de cadeaubon. Schrijf ook collecties verlichting, accessoires, zakelijk, all.'),
}
groups = {g: [] for g in GROUPS}
for p in PRODUCTS:
    g = group_of(p)
    p['copy_group'] = g
    groups[g].append(p)

# ---------------------------------------------------------------- menu validation
col_handles = {c['handle'] for c in cols}
page_handles = {h for h, *_ in site.PAGES}
art_handles = {'advies/' + h for h, *_ in site.ARTICLES}
def walk(items, depth=1):
    for it in items:
        if depth > 3: errors.append('menu deeper than 3: ' + it['title'])
        tp, h = it['type'], it.get('handle')
        ok = {'collection': lambda: h in col_handles, 'product': lambda: h in HANDLES, 'page': lambda: h in page_handles,
              'article': lambda: h in art_handles, 'blog': lambda: h == 'advies', 'policy': lambda: True, 'http': lambda: True}[tp]()
        if not ok: errors.append(f'menu link {it["title"]} -> {tp}:{h}')
        if tp == 'http' and 'filter.p.product_type=' in it['url']:
            from urllib.parse import urlsplit, parse_qs
            u = urlsplit(it['url'])
            ch = u.path.split('/collections/')[1]
            for pt in parse_qs(u.query).get('filter.p.product_type', []):  # repeated param = OR (Shopify filtering)
                if not any(pt == HANDLES[x]['product_type'] for x in membership if ch in membership[x]):
                    errors.append(f'menu filter {it["url"]}: {pt} matches nothing in {ch}')
            # every product the menu lists under this filter link must be on the filtered landing page
            for child in it.get('items', []):
                if child['type'] == 'product' and HANDLES[child['handle']]['product_type'] not in parse_qs(u.query).get('filter.p.product_type', []):
                    errors.append(f'menu {it["title"]}: child {child["handle"]} ({HANDLES[child["handle"]]["product_type"]}) not in its filter')
        walk(it.get('items', []), depth + 1)
MENUS = site.build_menus()
for m in MENUS: walk(m['items'])

# ---------------------------------------------------------------- render plan summary
renders = {}
for p in PRODUCTS:
    for i in p['images']:
        renders.setdefault(i['file'], i)
by_status = collections.Counter(i['model_status'] for i in renders.values())
by_prio = collections.Counter(i['priority'] for i in renders.values())
models = collections.Counter(i['render']['model'] for i in renders.values())

# ---------------------------------------------------------------- price summary
def price_range(p):
    ps = [v['price'] for v in p['variants']]
    return min(ps) / 100, max(ps) / 100

doc = collections.OrderedDict()
doc['meta'] = {
    'schema': 'klapklaar-catalog-skeleton/1', 'generated': '2026-10-17', 'brand': 'Klapklaar', 'vendor': 'Klapklaar',
    'generator': 'catalog/tools/skeleton/build.py (+ kk_base.py, fam_*.py, kk_site.py): python3 -I catalog/tools/skeleton/build.py catalog/skeleton.json reference/assortment.json; edit prices there and rerun so sets, staffels and refs stay consistent',
    'conventions': {
        'money': 'cents, incl. 21% btw (shop.taxes_included = true)', 'weights': 'variants[].grams', 'compare_at_price': 'null everywhere at launch: no real earlier price exists (Omnibus/ACM). badge:actie therefore unused.',
        'metafields': 'native JSON here (lists/objects); the build converts to Admin-API strings. product references are handles.',
        'images': 'catalog/images/<file>; render spec = renders/render.mjs spec (model + params + angle). model_status: existing | needs-param | needs-patch (brand/tools/renders-svgprint.patch) | needs-model.',
        'quantity_rule': 'used for per-meter/per-m² and min-10 products; Shopify enforces variant quantity rules only in B2B catalogs, so the theme must also respect it (quantity-input min/step) and the copy must state the minimum.',
        'specs': 'specificaties, gewicht_kg, verpakt and "wat zit erin" are product DEFINITIONS (proposals) to confirm with the supplier before launch.',
        'inventory': 'no real stock count yet: every shipped variant is tracked with 0 on hand and policy continue (shows the levertijd / backorder text, never an invented "Op voorraad" or "Nog x op voorraad"); the owner enters real counts before launch. Gift card: untracked.',
        'product_category': 'Shopify Standard Product Taxonomy ' + site.TAXONOMY_VERSION + ': product_category = full path (CSV), product_category_id = category GID (seed script).',
    },
    'counts': {'products': len(PRODUCTS), 'variants': sum(len(p['variants']) for p in PRODUCTS), 'collections': len(cols),
               'renders_unique': len(renders), 'renders_by_priority': dict(sorted(by_prio.items())), 'renders_by_model_status': dict(by_status)},
}
doc['contract_extensions'] = [
    {'what': 'product metafield custom.andere_maten (list.product_reference)', 'why': 'Easy-up tents are one product per size (SEO + example title "Easy-up partytent Professional 3 x 6 m"); the PDP needs a size switcher to sibling products. Filled on all 11 easy-up tents.', 'theme': 'render size pills linking to these products (current one selected).'},
    {'what': 'collections partytenten-buizenframe, opslagtenten, overkappingen-en-schaduwdoeken, stretch-statafelrokken', 'why': 'Assortment categories without a contract handle; needed for menus and coverage. Generic collection template, no theme work.'},
    {'what': 'collections onderdelen-stretch-ster-en-opblaasbare-tenten', 'why': 'Merchandising review 2026-10-18: Accessoires had columns for easy-up and buizenframe only, so the parts of stretch-, ster- and opblaasbare tenten had no landing page and the Past op values Stretchtent, Stertent and Opblaasbare tent were nearly empty. Manual (types incl. Stretchtent onderdeel / zijwand, Stertent zijwand, Opblaasbare tent accessoire, from custom.systeem), child of partytent-onderdelen. Also in CONTRACT.md.'},
    {'what': 'collections easy-up-onderdelen, buizenframe-onderdelen, verwarming, evenement', 'why': 'Merchandising review: partytent-onderdelen and zijwanden mixed easy-up and buizenframe parts; verwarming was a filter URL on accessoires; the marktkraam (€479–€729) sat between € 5 parts. Manual (onderdelen, from custom.systeem) or smart (type). Also in CONTRACT.md.'},
    {'what': 'product metafield custom.systeem (list.single_line_text_field)', 'why': 'Tent system a product is or fits: Easy-up, Buizenframe, Stretchtent, Stertent, Opblaasbare tent (from past_op). Storefront filter (Search & Discovery) on partytent-onderdelen / zijwanden. Also in CONTRACT.md.'},
    {'what': 'collections barkrukken, stoelen-en-banken, tafels, transportkarren, prikkabels, lampen-en-lichtslangen, topcovers-en-beschermplaten, tafelhoezen, statafel-onderdelen',
     'why': 'Merchandising review: the main-menu links Barkrukken, Stoelen/krukken/banken, Tafels, Transportkarren, Prikkabels, Lampen en slangen, Tafelhoezen and Statafel-onderdelen were filter URLs on meubilair / verlichting / statafelrokken (page title of the parent, no own intro, no indexable landing page). Smart on product type (statafel-onderdelen: manual), each with intro, seo_tekst and kenmerken. Generic collection template, no theme work. Also in CONTRACT.md.'},
    {'what': 'product field product_category / product_category_id (Shopify Standard Product Taxonomy)',
     'why': 'Google Shopping category and the Kleur → shopify.color-pattern link. CSV column Product Category = full path; the seed script sets productCreate category = GID. Mapping in kk_site.py, checked against the taxonomy file.'},
    {'what': 'product metafield custom.addon_eenmalig (list.product_reference)', 'why': 'Add-ons added once per order line instead of x the main quantity (transportkar on a statafel: 10 statafels + 1 kar). Theme: data-addon-follow=false on that add-on. Also in CONTRACT.md.'},
    {'what': 'Uitvoering values beyond the contract examples', 'why': 'Dakdoek (Polyester / Heavy duty PVC), pack sizes (Set van 4 / 6 / 8 / 1 stuk), part names, print scope (Effen doek / Full colour bedrukt, Effen kap / Bedrukte kap), Zonder / Met parasolgat. Spelling fixed in this file.'},
    {'what': 'Maat values beyond the contract list', 'why': '2 x 2 m, 5 x 5 m, buizenframe/stretch sizes (3 x 4 m, 10,5 x 15 m), lengths (3 m, 10 m), Ø8 m, 70 x 70 cm, 183 x 76 cm, Ø300 cm, "3 m breed". Same format rules.'},
    {'what': 'option name Bedrag on the gift card only', 'why': 'Gift-card denominations; not a product option the theme swatches.'},
    {'what': 'product.line_item_properties (catalog-only hint)', 'why': 'Kept on stretchdoek-op-maat as a fallback list; overkappingzeil and prikkabel op maat take their dimensions through custom.configurator instead.'},
]
doc['theme_requirements'] = [
    'swatch_colors default: must list "Warm wit: #F4E3BC"; tents/walls use Kleur "Rood" (stock red, #B5161E), the brand colour name Klaproos is no option value (brand.md §4.5).',
    'Kleur values used (all must stay in swatch_colors): ' + ', '.join(sorted({v for p in PRODUCTS for o in p['options'] if o['name'] == 'Kleur' for v in o['values']})),
    'Addons: render the selected variant\'s custom.addon_varianten (+ addon_aantallen) and re-render on variant change; product custom.addons is only the fallback. Cart quantity = aantal × main quantity unless custom.addon_modus = per-regel.',
    'Products with a single-value Maat (easy-up per size) should show the value as a label plus the andere_maten switcher, not a one-pill picker.',
    'Bundles (product_type Actiepakket, tag set) carry bundle.componenten_per_variant; show "Los € X · in het pakket € Y" from it (no strikethrough).',
]
doc['pricing_policy'] = {
    'basis': 'incl. 21% btw; references from reference/assortment.json (Outmate, Statafelshop, market_price_bands); all prices are suggestions listed for owner review in docs/claims-to-confirm.md.',
    'rules': ['Same or better spec than the reference item, priced 5–15% below it, never below the observed market floor for that quality segment.',
              'Sets and bundles are always cheaper than their parts (10–12%), computed from component prices.',
              'Staffels where business buyers order volume (tents, statafels, textiles, furniture, lamps, printed goods); textiles get staffels Statafelshop lacks.',
              'No compare_at at launch.'],
}
doc['collections'] = [{k: v for k, v in c.items() if not k.startswith('_')} | {'product_count': c['_count']} for c in cols]
doc['menus'] = site.build_menus()
doc['pages'] = [{'handle': h, 'title': t, 'template_suffix': s, 'published': h != 'showroom-en-afhalen', 'brief': b} for h, t, s, b in site.PAGES]
doc['blog'] = {'handle': 'advies', 'title': 'Advies & inspiratie', 'comments': 'disabled',
               'articles': [{'handle': h, 'title': t, 'brief': b, 'required_by_contract': i < 6} for i, (h, t, b) in enumerate(site.ARTICLES)]}
doc['filters'] = site.FILTERS
# renamed product handles (merchandising review 3): catalog/build.py writes export/redirects.csv (Shopify URL redirect import)
doc['redirects'] = [r for r in site.REDIRECTS]
for _r in doc['redirects']:
    if _r['to'].split('/')[-1] not in HANDLES or _r['from'].split('/')[-1] in HANDLES:
        errors.append(f'redirect {_r}: target missing or source still live')
doc['copy_groups'] = [{'id': g, 'name': GROUPS[g][0], 'notes': GROUPS[g][1], 'handles': [p['handle'] for p in groups[g]],
                       'product_count': len(groups[g]), 'effort': round(sum(p['weight'] for p in groups[g]), 2)} for g in GROUPS]
doc['coverage'] = coverage
EXISTING_MODELS = ['easyUpTent', 'statafel', 'statafelCover', 'klaptafel', 'biertafelset', 'gewichten', 'haringen', 'spanbanden', 'wielset', 'draagtas',
                   'carpetRunner', 'seatCushion', 'sideWall',  # catalog fixes 2026-10-18
                   # parts / lighting groups (renders/models/index.js registry, 2026-10-18)
                   'easyUpParts', 'connectionStrip', 'rainGutter', 'tentCoupler', 'tubeFittings', 'tentPoles', 'footCaps', 'sandbag', 'waterBag', 'concreteBlock',
                   'protectionDisc', 'repairKit', 'airPump', 'tubeBag', 'stretchParts', 'lightParts', 'ropeLight', 'stringLights', 'ledBulb', 'heaterCover',
                   'prikkabel', 'stretchtent', 'stertent', 'opblaasbareTent',
                   # renders/models/index.js registry since the furniture / tents-other / catalogue-review work
                   'barStool', 'chair', 'patioTable', 'bench', 'barrelTable', 'tableTop', 'trolley', 'stanchion', 'opblaasbareTunnel', 'frameTent',
                   'canopyRoof', 'marketStall', 'gardenPavilion', 'carportTent', 'shadeSail', 'tarp', 'buffetCover', 'heater', 'heaterElement',
                   'floodLight', 'tentLight', 'easyUpFrame']
# a model that exists in the renderer registry is 'existing' for every image that asks for it (family files set the status when written)
for _p in PRODUCTS:
    for _i in _p['images']:
        if _i.get('model_status') == 'needs-model' and _i['render'].get('model') in EXISTING_MODELS:
            _i['model_status'] = 'existing'
_st = collections.Counter(i['model_status'] for p in PRODUCTS for i in {x['file']: x for x in p['images']}.values())
doc['meta']['counts']['renders_by_model_status'] = dict(_st)
doc['render_models'] = {
    'existing': EXISTING_MODELS,
    'multi_item': '"model": "items" = spec with an items[] list (renders/README.md); each item names its own model.',
    'params_needed_on_existing': {
        'easyUpTent': [],  # done: walls "half", valancePrint {svg}, wallPrint {svg, side, both}; los frame = easyUpFrame; full colour roof = canopyRoof {withFrame:true}
        'statafelCover': ['print {...} via renders-svgprint.patch'],
        'klaptafel': ['shape "rond" + diameter', 'folded'], 'biertafelset': ['only "bank"'], 'draagtas': ['wheels:true'],
        'stretchtent': ['shape "hypar"'], 'stertent': ['masts:2 + length', 'walls'], 'opblaasbareTent': ['shape "hexagon"', 'legs "water"', 'walls', 'canopyPrint'],
        'spanbanden': ['length'], 'prikkabel': ['cable colour'],
    },
    'new_models': sorted(set(models) - set(EXISTING_MODELS) - {'items'}),
    'unique_renders_per_model': dict(models.most_common()),
}
claims = []
for p in PRODUCTS:
    mf = p['metafields']
    for k in ('levertijd', 'garantie'):
        if mf.get(k):
            claims.append({'handle': p['handle'], 'field': k, 'value': mf[k]})
    if mf.get('drukopties'):
        claims.append({'handle': p['handle'], 'field': 'drukopties.levertijd', 'value': mf['drukopties']['levertijd']})
doc['claims_to_confirm'] = {
    'per_product': claims,
    'general': ['Every price and staffel (owner review).', 'What is in the box: Premium = frame, dak, beschermhoes; Professional = frame, dak, wieltas, 4 spanbanden + 4 haringen.',
                'Kleur Rood on tents, walls, roofs, inflatables and marktkraam = the supplier\'s stock red (brand.md §4.5: no own Klaproos dye lot); check the swatch against the real cloth.',
                'Add-on defaults: buizenframe and opslagtent = 1 voetgewicht 15 kg + 1 lange haring per staander (spanten om de 2 m: 4 to 14); zeshoektent = watergewicht for 3/4/5 zakken of 20 kg per poot (its 50/75/100 kg advice); the stretchtent offers 1 betonblok of 500 kg as a start (its copy says the number per ankerpunt follows from ballastadvies via offerte); no other tent has a betonblok add-on and the shop makes no ballast calculation.',
                'Bundle staffels are derived from the component staffels (value-weighted, rounded up), so a bundle never loses to its parts at the same volume.',
                'Specs (materials, g/m², weights, packed sizes, heights, capacity) are definitions to confirm with the supplier.',
                'Brandvertragend / brandklasse statements need a supplier certificate on file; until then no fire class anywhere in the shop (stretch M2 removed 2026-10-18).', 'Maatwerk and printed goods excluded from herroepingsrecht (check terms).',
                'Pallet vs pakket split (31,5 kg rule) and shipping rates.'],
}
doc['products'] = []
for p in PRODUCTS:
    lo, hi = price_range(p)
    q = collections.OrderedDict()
    for k in ['handle', 'title', 'product_type', 'product_category', 'product_category_id', 'vendor', 'status', 'tags', 'collections', 'copy_group', 'family', 'covers', 'gift_card', 'template_suffix',
              'options', 'variants', 'images', 'variant_image_by', 'variant_images', 'metafields', 'complementary', 'line_item_properties', 'bundle',
              'price_ref', 'copy_brief', 'seo_keywords', 'body_html', 'seo']:
        if k in p:
            q[k] = p[k]
    q['price_range_eur'] = [lo, hi]
    doc['products'].append(q)

with open(OUT, 'w') as fh:
    json.dump(doc, fh, ensure_ascii=False, indent=1)

print('products', len(PRODUCTS), 'variants', doc['meta']['counts']['variants'], 'collections', len(cols), 'renders', len(renders), dict(by_prio), dict(by_status))
for g in doc['copy_groups']:
    print(g['id'], g['product_count'], g['effort'], g['name'])
for c in cols:
    print(f"  {c['handle']:34} {c['type']:6} {c['_count']}")
print('ERRORS', len(errors))
for e in errors:
    print(' ', e)
