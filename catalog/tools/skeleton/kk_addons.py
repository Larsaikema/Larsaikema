# Add-ons per variant (custom.addon_varianten / custom.addon_aantallen) and staffels on bundles.
#
# The PDP adds the add-on variant that belongs to the chosen main variant: same Maat/Kleur where the add-on has
# them, the rok size that fits the blad, one voetgewicht per poot, one stormbandenset per 2 m tentlengte, one LED-lamp
# per fitting. Quantities are per 1 unit of the main product; the theme multiplies them by the main quantity unless
# custom.addon_modus is 'per-regel' (products sold per meter or m²). Product-level custom.addons stays the ordered
# union of the add-on products (fallback for the theme and for the cart recommendations).
import math
from kk_base import *
from fam_easyup import DIMS, legs

STRIK_CONTRAST = {'Wit': 'Goud', 'Crème': 'Goud', 'Champagne': 'Bordeaux', 'Zilver': 'Zwart', 'Antraciet': 'Zilver',
                  'Zwart': 'Goud', 'Bordeaux': 'Goud', 'Marineblauw': 'Wit', 'Rood': 'Wit', 'Goud': 'Wit'}


def lenstr(x):
    return f'{x:g}'.replace('.', ',') + ' m'


def wd(maat):
    """'4 x 8 m' -> (4.0, 8.0); '10,5 x 15 m' -> (10.5, 15.0)."""
    a, b = maat.replace(' m', '').split(' x ')[:2]
    return float(a.replace(',', '.')), float(b.replace(',', '.'))


def vopts(p, v):
    return {o['name']: v[f'option{i + 1}'] for i, o in enumerate(p['options'])}


def find_one(handle, sel):
    p = HANDLES[handle]
    names = [o['name'] for o in p['options']]
    hits = [v for v in p['variants'] if all(n in names and v[f'option{names.index(n) + 1}'] == val for n, val in sel.items())]
    return hits[0] if len(hits) == 1 else None


# ------------------------------------------------------------------------------------------------ rules
def r_easy_up(p, v):
    o = vopts(p, v)
    m, k = o['Maat'], o['Kleur']
    pro = 'professional' in p['handle']
    n = legs(m)
    w, d = DIMS[m]
    long_side = max(w, d)
    sets4 = math.ceil(n / 4)
    r = []
    if o.get('Uitvoering') == 'Heavy duty PVC':
        r.append(('zijwandenset-easy-up-heavy-duty-pvc', {'Maat': m, 'Kleur': k}, 1))
    else:
        r.append(('zijwandenset-easy-up', {'Maat': m, 'Kleur': k}, 1))
    r.append(('voetgewicht-easy-up-15-kg', {'Uitvoering': f'Set van {n}'}, 1))
    if not pro:
        r.append(('spanbanden-en-haringen-easy-up', {}, sets4))       # Premium ships without banden/haringen
    r.append(('wieltas-easy-up', {'Maat': m}, 1) if not pro else ('beschermhoes-easy-up', {'Maat': m}, 1))
    r.append(('zandzakken-partytent-set-van-4', {}, sets4))
    r.append(('regengoot-partytent', {'Maat': lenstr(long_side), 'Kleur': 'Wit' if k in ('Wit', 'Zandkleur') else 'Zwart'}, 1))
    # one klem per pootpaar along the coupled (long) side; a set holds 2 klemmen
    r.append(('koppelset-easy-up', {'Uitvoering': 'Professional (50 mm)' if pro else 'Premium (40 mm)'}, 1 if long_side <= 4 else 2))
    return r


def r_easy_up_logo(p, v):
    o = vopts(p, v)
    m = o['Maat']
    pro = 'professional' in p['handle']
    n = legs(m)
    r = []
    if o.get('Kleur'):
        r.append(('zijwandenset-easy-up', {'Maat': m, 'Kleur': o['Kleur']}, 1))
    r.append(('voetgewicht-easy-up-15-kg', {'Uitvoering': f'Set van {n}'}, 1))
    if not pro:
        r.append(('spanbanden-en-haringen-easy-up', {}, math.ceil(n / 4)))
    r.append(('wieltas-easy-up', {'Maat': m}, 1) if not pro else ('beschermhoes-easy-up', {'Maat': m}, 1))
    return r


def r_buizenframe(p, v):
    o = vopts(p, v)
    w, d = wd(o['Maat'])
    staanders = 4 if d <= 3 else 2 * (math.ceil(d / 2) + 1)      # spanten om de 2 m, 2 staanders per spant
    r = []
    if p['handle'] != 'partytent-pvc-550-compleet':                 # compleet: stormbanden en tassen zitten erin
        r.append(('stormbandenset-partytent', {'Maat': f'{w:g} m breed'}, math.ceil(d / 2)))
        r.append(('opbergtassenset-partytent', {'Maat': f'{w:g} m breed'}, 1))
    r.append(('haringen-en-bevestigingsmateriaal-partytent', {'Uitvoering': 'Lange haring 75 cm'}, staanders))
    r.append(('betonblok-ballast-tent', {'Uitvoering': '140 kg'}, 1))   # quantity is the shopper's call (copy: ask us)
    return r


def r_statafel_rond(p, v):
    o = vopts(p, v)
    rok = 'Ø60-70 cm' if o['Maat'] == 'Ø70 cm' else 'Ø80-85 cm'
    k = o.get('Kleur') if o.get('Kleur') in ROK_KLEUREN else 'Zwart'
    return [('statafelrok-stretch', {'Maat': rok, 'Uitvoering': 'Met topcover', 'Kleur': k}, 1)]


def r_stretch(p, v):
    o = vopts(p, v)
    w, d = wd(o['Maat'])
    return [('zijwand-stretchtent', {'Maat': '3 m', 'Uitvoering': 'Startwand met 2 palen'}, 1),
            ('onderdelen-stretchtent', {'Uitvoering': 'Koppelgoot 6 m'}, math.ceil(d / 6)),
            ('betonblok-ballast-tent', {'Uitvoering': '500 kg'}, 1)]


def r_air_square(p, v):
    o = vopts(p, v)
    n = o['Maat'].split(' x ')[0] + ' m'
    k = o.get('Kleur')
    lk = k if k in ('Rood', 'Wit', 'Zwart', 'Blauw', 'Groen', 'Oranje') else 'Zwart'
    return [('pomp-opblaasbare-tent', {'Uitvoering': 'Elektrische pomp'}, 1),
            ('zijwand-opblaasbare-promotietent', {'Maat': n, 'Uitvoering': 'Dicht'}, 1),
            ('luifel-opblaasbare-promotietent', {'Maat': n, 'Kleur': lk}, 1),
            ('watergewichtzakken-4x20-kg', {}, 1)]


def r_air_hex(p, v):
    o = vopts(p, v)
    return [('pomp-opblaasbare-tent', {'Uitvoering': 'Elektrische pomp'}, 1),
            ('zijwand-opblaasbare-zeshoektent', {'Maat': o['Maat'], 'Uitvoering': 'Dicht', 'Kleur': 'Zwart' if o['Kleur'] == 'Zwart' else 'Wit'}, 1)]


def r_zitkussen(p, v):
    k = vopts(p, v).get('Kleur')
    return [('zitkussen-stoel-en-barkruk', {'Kleur': {'Zwart': 'Zwart', 'Antraciet': 'Antraciet'}.get(k, 'Zandkleur')}, 1)]


RULES = {
    'statafel-inklapbaar-professional': r_statafel_rond,
    'statafel-inklapbaar-hdpe-80': r_statafel_rond,
    'statafel-met-kruisvoet': r_statafel_rond,
    'statafelrok-stretch': lambda p, v: [('topcover-stretch-statafel', {'Maat': vopts(p, v)['Maat'], 'Kleur': vopts(p, v)['Kleur']}, 1)],
    'statafelhoes-met-strik': lambda p, v: [('losse-strik-statafelhoes', {'Kleur': STRIK_CONTRAST.get(vopts(p, v)['Kleur'], 'Goud')}, 1)],
    'klaptafel-hdpe-rechthoekig': lambda p, v: [('stretchhoes-klaptafel', {'Maat': vopts(p, v)['Maat'], 'Kleur': 'Zwart'}, 1)],
    'biertafelset': lambda p, v: [('hoes-biertafelset', {'Maat': vopts(p, v)['Maat'], 'Kleur': 'Wit'}, 1)],
    'stapelstoel-cross-back': r_zitkussen,
    'stapelstoel-metaal': r_zitkussen,
    'barkruk-draad-stapelbaar': r_zitkussen,
    'prikkabel-e27': lambda p, v: [('led-lamp-e27', {'Uitvoering': 'Warm wit melkglas 1 W'}, int(vopts(p, v)['Maat'].split()[0]))],  # fitting per meter
    'led-lichtslang': lambda p, v: [('onderdelen-prikkabel-en-lichtslang', {'Uitvoering': 'Aansluitsnoer lichtslang met stekker'}, 1)],
    'opslagtent-pvc': r_buizenframe,
    'carport-opslagtent-vast-frame': lambda p, v: [('betonblok-ballast-tent', {'Uitvoering': '140 kg'}, 1)],
    'stretchtent-compleet': r_stretch,
    'stertent-enkele-mast': lambda p, v: [('zijwanden-stertent', {'Maat': vopts(p, v)['Maat'], 'Uitvoering': 'Set rondom'}, 1)],
    'stertent-dubbele-mast': lambda p, v: [('zijwanden-stertent', {'Maat': vopts(p, v)['Maat'], 'Uitvoering': 'Set rondom'}, 1)],
    'opblaasbare-promotietent': r_air_square,
    'opblaasbare-promotietent-pro': r_air_square,
    'opblaasbare-partytent-3x3-waterpoten': r_air_square,
    'opblaasbare-zeshoektent': r_air_hex,
    'starterspakket-easy-up-premium': lambda p, v: [('voetgewicht-easy-up-15-kg', {'Uitvoering': f'Set van {legs(vopts(p, v)["Maat"])}'}, 1)],
    'compleet-pakket-easy-up-professional': lambda p, v: [('beschermhoes-easy-up', {'Maat': vopts(p, v)['Maat']}, 1)],
}


def rule_for(p):
    h = p['handle']
    if h in RULES:
        return RULES[h]
    if (h.startswith('easy-up-partytent-premium-') or h.startswith('easy-up-partytent-professional-')) and h[-1].isdigit():
        return r_easy_up
    if h in ('easy-up-partytent-professional-met-logo-op-de-luifel', 'easy-up-partytent-premium-met-logo-op-de-luifel',
             'easy-up-partytent-professional-full-colour-bedrukt'):
        return r_easy_up_logo
    if p['product_type'] == 'Partytent':
        return r_buizenframe
    return None


def apply(errors):
    for p in PRODUCTS:
        fn = rule_for(p)
        if not fn:
            continue
        union = []
        for v in p['variants']:
            skus, qtys = [], []
            for h, sel, q in fn(p, v):
                if h not in HANDLES:
                    errors.append(f'{p["handle"]}: addon {h} unknown')
                    continue
                av = find_one(h, sel)
                if av is None:
                    continue  # no matching size/colour (e.g. no 2 x 2 m zijwandenset): offer nothing rather than a wrong one
                skus.append(av['sku'])
                qtys.append(int(q))
                if h not in union:
                    union.append(h)
            if skus:
                v.setdefault('metafields', {})
                v['metafields']['addon_varianten'] = skus
                v['metafields']['addon_aantallen'] = qtys
        p['metafields']['addons'] = union or None
        missing = [v['sku'] for v in p['variants'] if not (v.get('metafields') or {}).get('addon_varianten')]
        if union and missing:
            errors.append(f'{p["handle"]}: {len(missing)} variant(s) without matched add-ons ({missing[:2]})')


# ------------------------------------------------------------------------------------------------ bundle staffels
def korting_at(staffel, qty):
    k = 0
    for t in staffel or []:
        if qty >= t['vanaf']:
            k = t['korting']
    return k


def _parts_after(cpv, n):
    """(list price, price after the components' own staffels) of one bundle variant's parts when buying n bundles."""
    list_total = after = 0
    for c in cpv['componenten']:
        cv = find_one(c['handle'], c['variant'])
        st = HANDLES[c['handle']]['metafields'].get('staffelkorting')
        line = cv['price'] * c['aantal']
        list_total += line
        after += line * (1 - korting_at(st, n * c['aantal']) / 100)
    return list_total, after


def _holds(p, tiers, n_max=200):
    """True when at every volume 1..n_max the bundle with these tiers is not dearer than its parts with theirs."""
    cps = p['bundle']['componenten_per_variant']
    for cpv in cps:
        bv = next(v for v in p['variants'] if [v.get(f'option{i + 1}') for i in range(len(cpv['variant']))] == cpv['variant'])
        for n in range(1, n_max + 1):
            _, after = _parts_after(cpv, n)
            if bv['price'] * (1 - korting_at(tiers, n) / 100) > after + 0.5:
                return False
    return True


def bundle_staffels(max_tiers=3):
    """Staffel for every bundle, derived from its parts: at each volume where a component's staffel starts, the bundle gets
    the value-weighted discount of its parts (max over the bundle variants, rounded up to a whole %). Tiers that the bundle's
    own base saving already covers are dropped (smallest first) while the guarantee holds: at any order size the bundle is
    never dearer than the loose parts with their own staffels. validate.py re-checks the guarantee."""
    out = {}
    for p in PRODUCTS:
        b = p.get('bundle')
        if not b:
            continue
        cps = b['componenten_per_variant']
        thresholds = set()
        for cpv in cps:
            for c in cpv['componenten']:
                for t in HANDLES[c['handle']]['metafields'].get('staffelkorting') or []:
                    thresholds.add(max(2, math.ceil(t['vanaf'] / c['aantal'])))
        tiers, last = [], 0
        for n in sorted(thresholds):
            best = 0
            for cpv in cps:
                list_total, after = _parts_after(cpv, n)
                best = max(best, math.ceil(round((1 - after / list_total) * 100, 6)))
            if best > last:
                tiers.append({'vanaf': n, 'korting': best})
                last = best
        assert _holds(p, tiers), p['handle']
        # fewer, rounder tiers: drop a tier (and let the next one start later) while the guarantee still holds
        changed = True
        while changed and len(tiers) > max_tiers:
            changed = False
            for i in sorted(range(len(tiers) - 1), key=lambda j: tiers[j + 1]['korting'] - tiers[j]['korting']):
                trial = tiers[:i] + tiers[i + 1:] if i else tiers[1:]
                if trial and _holds(p, trial):
                    tiers, changed = trial, True
                    break
        p['metafields']['staffelkorting'] = tiers or None
        out[p['handle']] = tiers
    return out
