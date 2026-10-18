# Shipping cost per product (H11), packing data (M15) and the accessory discount with a tent (M1); catalog round 2026-10-18.
#
# custom.verzendkosten: the product's own shipping line on the PDP and in the cart estimate ("Verzendkosten op dit product: vanaf € 49,00"),
# instead of one class rate (€ 6,95 pakket / € 59 pallet) for everything from a 3 x 4,5 m easy-up to a 1.000 kg betonblok.
# custom.verzendkosten_staffel (contract extension, json): the amount per shipping weight of the chosen variant and, for heavy goods, per
# quantity: {"eenheid": "per zending" | "per stuk", "staffel": [{"vanaf": 1, "bedrag": 75.0}, ...],
#            "per_optie": {"optie": "Maat", "waarden": {"3 x 3 m": [{"vanaf": 1, "bedrag": 49.0}], ...}}}
# Every amount is an owner claim (docs/claims-to-confirm.md) and must match the shipping profile in Shopify.
from kk_base import *

# pallet classes by the shipping weight of one shipment (kg -> € incl. btw): weight-based rates, so the Shopify shipping profile carries the
# same amounts. Up to 1.000 kg one pallet; 2 and 3 pallets above that; heavier than 3.000 kg per order line is freight on request.
PALLET = [(150, 49.0), (400, 79.0), (700, 129.0), (1000, 175.0), (2000, 350.0), (3000, 525.0)]
PALLET_MAX = 3000
PARCEL = 6.95            # theme setting shipping_cost_pakket (the class rate of every parcel without its own line)
PARCEL_MAX = 31.5        # heavier than this does not go as a parcel (the 31,5 kg rule, docs/claims-to-confirm.md)
# a large parcel (statafels, terrastafels, klaptafels on a parcel route), by the weight of the shipment: up to 25 kg one large parcel,
# up to 40 kg two, above that the shipment goes on a pallet (catalog round 3: was € 19,95 flat, also for 25 statafels)
GROOT_PAKKET = [(25, 19.95), (40, 39.9)]
BULKY = GROOT_PAKKET[0][1]
BULKY_TYPES = {'Statafel', 'Terrastafel', 'Klaptafel'}
# heavy goods per piece with a quantity tier (betonblokken: the reference charges € 75-135 per block)
PER_STUK = {'betonblok-ballast-tent': {'120 kg met vorkuitsparing': 45.0, '140 kg': 45.0, '240 kg': 59.0, '500 kg': 75.0, '500 kg met M16-inserts voor truss': 75.0, '750 kg': 99.0, '1000 kg': 135.0}}
TIER_FROM = 4            # from 4 pieces on one address: - 15% per piece
MAX_PIECES = 100         # quantity tiers are listed up to this many pieces per order line (or 3.000 kg)


def pallet_cost(kg):
    for top, eur in PALLET:
        if kg <= top:
            return eur
    return PALLET[-1][1]


def groot_pakket_cost(kg):
    for top, eur in GROOT_PAKKET:
        if kg <= top:
            return eur
    return pallet_cost(kg)


def parcel_cost(kg):
    return PARCEL if kg <= PARCEL_MAX else pallet_cost(kg)


def cost_by_class(cls, kg):
    return {'pallet': pallet_cost, 'groot': groot_pakket_cost, 'pakket': parcel_cost}[cls](kg)


def tiers(cls, kg_one):
    """Shipping of n pieces of one variant (eenheid 'per zending': the amount for the whole order line at that quantity), as the change
    points [{vanaf, bedrag}] for n = 1..MAX_PIECES (and at most 3 pallets). These are weight-based rates, so the Shopify shipping profile can
    carry exactly the same amounts (docs/claims-to-confirm.md)."""
    out, last = [], None
    for n in range(1, MAX_PIECES + 1):
        if n > 1 and n * kg_one > PALLET_MAX:
            break
        c = cost_by_class(cls, n * kg_one)
        if c != last:
            out.append({'vanaf': n, 'bedrag': c})
            last = c
    return out


def fmt(eur):
    return f'{eur:.2f}'.replace('.', ',')


def option_index(p, name):
    names = [o['name'] for o in p['options']]
    return names.index(name) if name in names else None


def ship_class(p):
    """pallet | groot | pakket, or None for goods that ship at the parcel class rate without a line of their own."""
    if p['metafields'].get('verzending') == 'pallet':
        return 'pallet'
    if p['product_type'] in BULKY_TYPES:
        return 'groot'
    return None


def _write(p, per_variant):
    """per_variant: sku -> tiers. Writes custom.verzendkosten + custom.verzendkosten_staffel (per_optie on the option that decides)."""
    mf = p['metafields']
    first = sorted({t[0]['bedrag'] for t in per_variant.values()})
    keys = {json_key(t) for t in per_variant.values()}
    st = {'eenheid': 'per zending'}
    if len(keys) == 1:
        st['staffel'] = next(iter(per_variant.values()))
    else:
        per = None
        for o in p['options']:
            i = option_index(p, o['name'])
            by_val, ok = {}, True
            for v in p['variants']:
                val = v[f'option{i + 1}']
                if json_key(by_val.setdefault(val, per_variant[v['sku']])) != json_key(per_variant[v['sku']]):
                    ok = False
                    break
            if ok:
                per = (o['name'], by_val)
                break
        if per is None:
            # no single option decides (the weight varies with two options, e.g. Maat and the number of statafels): per option value the
            # element-wise maximum over its variants (the PDP never shows less than checkout charges), on the option that overcharges least
            def at(t, n):
                return [r for r in t if r['vanaf'] <= n][-1]['bedrag']
            top = max(r['vanaf'] for t in per_variant.values() for r in t)
            best = None
            for o in p['options']:
                i = option_index(p, o['name'])
                groups = {}
                for v in p['variants']:
                    groups.setdefault(v[f'option{i + 1}'], []).append(per_variant[v['sku']])
                merged, over = {}, 0.0
                for val, ts in groups.items():
                    row, last = [], None
                    for n in range(1, top + 1):
                        c = max(at(t, n) for t in ts)
                        over += sum(c - at(t, n) for t in ts)
                        if c != last:
                            row.append({'vanaf': n, 'bedrag': c})
                            last = c
                    merged[val] = row
                if best is None or over < best[0]:
                    best = (over, o['name'], merged)
            per = (best[1], best[2])
        st['staffel'] = min(per[1].values(), key=lambda t: t[0]['bedrag'])
        st['per_optie'] = {'optie': per[0], 'waarden': per[1]}
    many = len(first) > 1 or any(len(t) > 1 for t in per_variant.values())
    mf['verzendkosten'] = f'Verzendkosten op dit product: {"vanaf " if many else ""}€ {fmt(first[0])}'
    mf['verzendkosten_staffel'] = st


def json_key(t):
    return tuple((x['vanaf'], x['bedrag']) for x in t)


def apply(products):
    for p in products:
        mf = p['metafields']
        if p.get('gift_card') or mf.get('verzendkosten') or p.get('bundle'):
            continue
        h = p['handle']
        if h in PER_STUK:
            i = option_index(p, 'Uitvoering')
            waarden = {}
            for v in p['variants']:
                val = v[f'option{i + 1}']
                b = PER_STUK[h].get(val)
                if b is None:
                    continue
                waarden[val] = [{'vanaf': 1, 'bedrag': b}, {'vanaf': TIER_FROM, 'bedrag': round(b * 0.85, 2)}]
            low = min(t[0]['bedrag'] for t in waarden.values())
            mf['verzendkosten'] = f'Verzendkosten op dit product: vanaf € {fmt(low)} per stuk'
            mf['verzendkosten_staffel'] = {'eenheid': 'per stuk', 'staffel': waarden[next(iter(waarden))], 'per_optie': {'optie': 'Uitvoering', 'waarden': waarden}}
            continue
        cls = ship_class(p)
        if not cls:
            continue
        _write(p, {v['sku']: tiers(cls, v['grams'] / 1000) for v in p['variants']})
    bundles(products)


def _component_cost(handle, sel, aantal):
    """Shipping of `aantal` pieces of one component variant, as the component's own PDP and the shipping profile would charge it."""
    c = HANDLES[handle]
    names = [o['name'] for o in c['options']]
    v = next(x for x in c['variants'] if all(n in names and x[f'option{names.index(n) + 1}'] == val for n, val in sel.items()))
    st = c['metafields'].get('verzendkosten_staffel')
    if st and st['eenheid'] == 'per stuk':
        t = st['staffel']
        if st.get('per_optie'):
            t = st['per_optie']['waarden'][v[f'option{names.index(st["per_optie"]["optie"]) + 1}']]
        b = [x for x in t if x['vanaf'] <= aantal][-1]['bedrag']
        return round(b * aantal, 2), 'pallet'
    cls = ship_class(c) or 'pakket'
    return cost_by_class(cls, aantal * v['grams'] / 1000), cls


RANK = {'pakket': 0, 'groot': 1, 'pallet': 2}


def bundles(products):
    """Catalog round 3: a pakket ships for at least what its heaviest component costs on its own, in at least that component's class (the
    starterspakket with a 3 x 6 m tent was € 6,95 next to € 49 for the tent alone). Per pakket variant and quantity n:
    max(each component at n x its aantal, the whole pakket weight in the highest component class); above 31,5 kg nothing goes as a parcel."""
    for p in products:
        b = p.get('bundle')
        if not b or p['metafields'].get('verzendkosten_override'):
            continue
        comp_classes = {ship_class(HANDLES[c['handle']]) or 'pakket' for cpv in b['componenten_per_variant'] for c in cpv['componenten']}
        if comp_classes == {'pakket'} and max(v['grams'] for v in p['variants']) <= PARCEL_MAX * 1000 and not any(
                (HANDLES[c['handle']]['metafields'].get('verzendkosten_staffel') or {}).get('eenheid') == 'per stuk'
                for cpv in b['componenten_per_variant'] for c in cpv['componenten']):
            continue   # a parcel of parcels (prikkabelset): the class rate, like each of its components
        per_variant, classes = {}, set()
        for cpv in b['componenten_per_variant']:
            v = next(x for x in p['variants'] if [x.get(f'option{i + 1}') for i in range(len(cpv['variant']))] == cpv['variant'])
            kg_one = v['grams'] / 1000
            out, last = [], None
            for n in range(1, MAX_PIECES + 1):
                if n > 1 and n * kg_one > PALLET_MAX:
                    break
                costs, cls_top = [], 'pakket'
                for c in cpv['componenten']:
                    eur, cls = _component_cost(c['handle'], c['variant'], c['aantal'] * n)
                    costs.append(eur)
                    if RANK[cls] > RANK[cls_top]:
                        cls_top = cls
                eur = max(costs + [cost_by_class(cls_top, n * kg_one)])
                if n == 1:
                    classes.add('pallet' if (cls_top == 'pallet' or eur >= PALLET[0][1]) else cls_top)
                if eur != last:
                    out.append({'vanaf': n, 'bedrag': eur})
                    last = eur
            per_variant[v['sku']] = out
        _write(p, per_variant)
        mf = p['metafields']
        if 'pallet' in classes:
            mf['verzending'] = 'pallet'
            if 'pallet' not in p['tags']:
                p['tags'] = p['tags'] + ['pallet']
        elif mf.get('verzending') == 'pallet':
            mf['verzending'] = 'pakket'
            p['tags'] = [t for t in p['tags'] if t != 'pallet']


def kg(x):
    """Decimal comma, no trailing zeros: 4,2 · 15 · 0,04 (2 decimals below 1 kg, 1 above)."""
    t = f'{x:.2f}' if x < 1 else f'{x:.1f}'
    return t.rstrip('0').rstrip('.').replace('.', ',')


def verpakt(products):
    """M15: packing data (colli, parcel or freight, weight) on every shipped product that has none; box sizes stay with the product
    definitions that have them (to confirm with the supplier)."""
    for p in products:
        mf = p['metafields']
        if mf.get('verpakt') or p.get('gift_card') or not p['variants'][0].get('requires_shipping', True):
            continue
        kgs = sorted({round(v['grams'] / 1000, 2) for v in p['variants'] if v.get('grams')})
        if not kgs:
            continue
        lo, hi = kgs[0], kgs[-1]
        w = f'ca. {kg(lo)} kg' if lo == hi else f'ca. {kg(lo)}–{kg(hi)} kg'
        if mf.get('verzending') == 'pallet':
            # colli are not guessed from the weight: a bundle ships every part in its own packaging, a single product as one load
            n = ' · elk onderdeel in eigen verpakking' if p.get('bundle') else ''
            mf['verpakt'] = f'Vracht op pallet (120 x 80 cm){n} · {w}'
        else:
            mf['verpakt'] = f'Pakket · 1 doos · {w}' if hi <= 31.5 else f'Pakket · 2 dozen · {w}'


# M1: 10% on walls, storage bags and storm straps bought with the tent (the reference does it on ca. 70 PDPs). Shown on the PDP next to
# those add-ons; the discount itself is a Shopify automatic discount (docs/claims-to-confirm.md, docs/theme-setup.md).
KORTING_OP = {'Zijwand', 'Zijwandenset', 'Stertent zijwand', 'Stretchtent zijwand', 'Tas & wielset'}
KORTING_HANDLES = {'stormbandenset-partytent', 'spanbanden-en-haringen-easy-up', 'zijwand-opblaasbare-promotietent', 'zijwand-opblaasbare-promotietent-pro',
                   'zijwand-opblaasbare-zeshoektent', 'opbergtas-opblaasbare-tent'}
TENT_TYPES = {'Easy-up partytent', 'Partytent', 'Opslagtent', 'Stretchtent', 'Stertent', 'Opblaasbare tent'}


def addon_korting(products):
    for p in products:
        if p['product_type'] not in TENT_TYPES or p.get('bundle'):
            continue
        op = [h for h in (p['metafields'].get('addons') or []) if HANDLES[h]['product_type'] in KORTING_OP or h in KORTING_HANDLES]
        if op:
            p['metafields']['addon_korting'] = {'procent': 10, 'op': op}
