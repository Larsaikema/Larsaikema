# Bouwtekening (stuklijst) of the buizenframe tents and opslagtenten, from one geometry (catalog round 2026-10-18, H12 + M2).
#
# Our own drawing, the same for every line: spanten every 2 m along the length (a 3 m long tent: two vakken of 1,5 m), 2 staanders per
# spant, a dakspant per side whose tube follows the width (one tube up to 4 m wide, two from 5 m with a dakvlak-koppelstuk and an extra
# ligger in between), liggers along both dakranden and the nok, eave connectors 120° on the 3 and 4 m roofs and 110° on the flatter 5-8 m
# roofs, nok 140°. Lines with grondframe (PVC 550 Premium, compleet, PVC 620 Professional, opslagtent) get the ground tubes and their
# connectors; lines with nokversteviging get a nokstuk with lip, two schoren per spant and their klemmen. Sizes and prices are
# definitions to confirm with the supplier (docs/claims-to-confirm.md); validate.py checks that the parts never undercut the tent.
import math
from kk_base import *

# name, price, code, grams, render params (renders/models tubeFittings)
CONNECTORS = [
    ('Koppelstuk 2-weg recht 20 cm', 6.95, 'K2', 300, {'parts': ['2-weg']}),
    ('Koppelstuk 2-weg recht 50 cm', 8.95, 'K2L', 650, {'parts': ['2-weg'], 'length': 0.5}),
    ('Dakrand hoekstuk 3-weg 120°', 8.95, 'D3-120', 420, {'parts': ['3-weg'], 'angle': 120}),
    ('Dakrand 4-weg 120°', 10.95, 'K4', 500, {'parts': ['4-weg']}),
    ('Dakrand hoekstuk 3-weg 110°', 8.95, 'D3-110', 420, {'parts': ['3-weg'], 'angle': 110}),
    ('Dakrand 4-weg 110°', 10.95, 'D4-110', 500, {'parts': ['4-weg'], 'angle': 110}),
    ('Nokstuk 3-weg 140°', 8.95, 'K3', 400, {'parts': ['3-weg']}),
    ('Nokstuk 4-weg 140°', 10.95, 'N4', 500, {'parts': ['4-weg'], 'angle': 140}),
    ('Nokstuk 3-weg 140° met lip', 9.95, 'N3L', 460, {'parts': ['3-weg'], 'angle': 140, 'lip': True}),
    ('Nokstuk 4-weg 140° met lip', 11.95, 'N4L', 560, {'parts': ['4-weg'], 'angle': 140, 'lip': True}),
    ('Dakvlak 3-weg vlak', 8.95, 'V3', 420, {'parts': ['3-weg'], 'angle': 180}),
    ('Dakvlak 4-weg vlak', 9.95, 'V4', 500, {'parts': ['4-weg'], 'angle': 180}),
    ('Grondframe hoekstuk 3-weg', 8.95, 'G3H', 420, {'parts': ['3-weg-grond'], 'corner': True}),
    ('Grondframe T-stuk 3-weg', 8.95, 'K3G', 400, {'parts': ['3-weg-grond']}),
    ('Grondframe 2-weg recht', 6.95, 'G2', 300, {'parts': ['2-weg'], 'ground': True}),
    ('Voetplaat met haringgat', 4.95, 'VP', 350, {'parts': ['voetplaat']}),
    ('Klem nokversteviging', 3.95, 'KN', 150, {'parts': ['klem']}),
    ('Knevelbouten M8 (10 stuks)', 4.95, 'KB10', 250, {'parts': ['knevelbout'], 'count': 10}),
]

# name, price, code, grams, render params; lengths in cm, the length the bouwtekening uses
TUBES = [
    ('Staander 192 cm (zijhoogte 200 cm)', 8.95, 'S192', 2300, {'parts': ['buis'], 'tubeLength': 1.92}),
    ('Staander 212 cm (zijhoogte 220 cm)', 11.95, 'S212', 2600, {'parts': ['buis'], 'tubeLength': 2.12}),
    ('Ligger 142 cm (vak 1,5 m)', 7.95, 'L142', 1700, {'parts': ['buis'], 'tubeLength': 1.42}),
    ('Ligger 192 cm (vak 2 m)', 8.95, 'B192', 2300, {'parts': ['buis'], 'tubeLength': 1.92}),
    ('Dakbuis 159 cm (3 m breed)', 8.49, 'B159', 1900, {'parts': ['buis'], 'tubeLength': 1.59}),
    ('Dakbuis 216 cm (4 m breed)', 11.95, 'B216', 2600, {'parts': ['buis'], 'tubeLength': 2.16}),
    ('Dakbuis 129 cm (5 m breed, 2 per zijde)', 7.95, 'D129', 1550, {'parts': ['buis'], 'tubeLength': 1.29}),
    ('Dakbuis 155 cm (6 m breed, 2 per zijde)', 8.49, 'D155', 1850, {'parts': ['buis'], 'tubeLength': 1.55}),
    ('Dakbuis 205 cm (8 m breed, 2 per zijde)', 11.49, 'D205', 2450, {'parts': ['buis'], 'tubeLength': 2.05}),
    ('Grondbuis 142 cm (kopse kant 3 m)', 7.95, 'G142', 1700, {'parts': ['buis'], 'tubeLength': 1.42}),
    ('Grondbuis 192 cm', 8.95, 'G192', 2300, {'parts': ['buis'], 'tubeLength': 1.92}),
    ('Grondbuis 242 cm (kopse kant 5 m)', 12.95, 'G242', 2900, {'parts': ['buis'], 'tubeLength': 2.42}),
    ('Schoor nokversteviging 78 cm (3 m breed)', 5.95, 'N78', 950, {'parts': ['buis'], 'tubeLength': 0.78}),
    ('Schoor nokversteviging 98 cm (4 m breed)', 5.95, 'N98', 1150, {'parts': ['buis'], 'tubeLength': 0.98}),
    ('Schoor nokversteviging 118 cm (5 m breed)', 6.95, 'N118', 1400, {'parts': ['buis'], 'tubeLength': 1.18}),
    ('Schoor nokversteviging 138 cm (6 m breed)', 7.95, 'N138', 1650, {'parts': ['buis'], 'tubeLength': 1.38}),
    ('Schoor nokversteviging 178 cm (8 m breed)', 8.95, 'N178', 2100, {'parts': ['buis'], 'tubeLength': 1.78}),
    ('Verlengbuis 50 cm', 4.95, 'B50', 600, {'parts': ['buis'], 'tubeLength': 0.5}),
    ('Buis 100 cm', 5.95, 'B100', 1200, {'parts': ['buis'], 'tubeLength': 1.0}),
    ('Buis 216 cm', 11.95, 'B216R', 2600, {'parts': ['buis'], 'tubeLength': 2.16}),
]
_ = {t[0] for t in TUBES}
TUBES = [t for t in TUBES if t[0] != 'Buis 216 cm']   # 216 cm is the 4 m dakbuis (one SKU per length)

C = {n: f'KK-FRM-BF-{c}' for n, _, c, _, _ in CONNECTORS}
T = {n: f'KK-FRM-BF-{c}' for n, _, c, _, _ in TUBES}
RAFTER = {3: ('Dakbuis 159 cm (3 m breed)', 1), 4: ('Dakbuis 216 cm (4 m breed)', 1), 5: ('Dakbuis 129 cm (5 m breed, 2 per zijde)', 2),
          6: ('Dakbuis 155 cm (6 m breed, 2 per zijde)', 2), 8: ('Dakbuis 205 cm (8 m breed, 2 per zijde)', 2)}
SCHOOR = {3: 'Schoor nokversteviging 78 cm (3 m breed)', 4: 'Schoor nokversteviging 98 cm (4 m breed)', 5: 'Schoor nokversteviging 118 cm (5 m breed)',
          6: 'Schoor nokversteviging 138 cm (6 m breed)', 8: 'Schoor nokversteviging 178 cm (8 m breed)'}
GROUND_END = {3: [('Grondbuis 142 cm (kopse kant 3 m)', 2)], 4: [('Grondbuis 192 cm', 2)], 5: [('Grondbuis 242 cm (kopse kant 5 m)', 2)],
              6: [('Grondbuis 192 cm', 3)], 8: [('Grondbuis 192 cm', 4)]}
# per line: zijhoogte, grondframe, nokversteviging
LINE_FRAME = {'pe-basic': (200, False, False), 'pvc-classic': (200, False, False), 'pvc-premium': (200, True, True), 'pvc-ultimate': (200, True, True),
              'pvc-professional': (220, True, True), 'opslag': (200, True, True)}


def vakken(d):
    """Lengths of the vakken along the tent: 1,5 + 1,5 m for 3 m long, else vakken of 2 m."""
    if abs(d - 3) < 0.01:
        return [1.5, 1.5]
    return [2.0] * int(round(d / 2))


def staanders(maat):
    w, d = [float(x.replace(',', '.')) for x in maat.replace(' m', '').split(' x ')]
    return 2 * (len(vakken(d)) + 1)


def frame(maat, sub, zijhoogte=None):
    """{part name: aantal} for the frame of one tent (no doek)."""
    w, d = [float(x.replace(',', '.')) for x in maat.replace(' m', '').split(' x ')]
    wi = int(round(w))
    h, grond, nok = LINE_FRAME[sub]
    h = zijhoogte or h
    vs = vakken(d)
    n_sp = len(vs) + 1
    mid = n_sp - 2
    out = {}
    def add(k, n):
        if n:
            out[k] = out.get(k, 0) + n
    st = 'Staander 192 cm (zijhoogte 200 cm)' if h == 200 else 'Staander 212 cm (zijhoogte 220 cm)'
    add(st, 2 * n_sp)
    add('Voetplaat met haringgat', 2 * n_sp)
    rf, per_side = RAFTER[wi]
    add(rf, 2 * per_side * n_sp)
    ligger = {1.5: 'Ligger 142 cm (vak 1,5 m)', 2.0: 'Ligger 192 cm (vak 2 m)'}
    lines = 3 + (2 if per_side == 2 else 0)      # 2 dakranden + nok (+ 2 dakvlak-liggers when the spant is in two parts)
    for v in vs:
        add(ligger[v], lines)
    ang = '120°' if wi <= 4 else '110°'
    add(f'Dakrand hoekstuk 3-weg {ang}', 4)
    add(f'Dakrand 4-weg {ang}', 2 * mid)
    lip = ' met lip' if nok else ''
    add(f'Nokstuk 3-weg 140°{lip}', 2)
    add(f'Nokstuk 4-weg 140°{lip}', mid)
    if per_side == 2:
        add('Dakvlak 3-weg vlak', 4)
        add('Dakvlak 4-weg vlak', 2 * mid)
    if nok:
        add(SCHOOR[wi], 2 * n_sp)
        add('Klem nokversteviging', 2 * n_sp)
    if grond:
        for v in vs:
            add('Grondbuis 192 cm' if v == 2.0 else 'Grondbuis 142 cm (kopse kant 3 m)', 2)
        for tube, n in GROUND_END[wi]:
            add(tube, 2 * n)
            add('Grondframe 2-weg recht', 2 * (n - 1))
        add('Grondframe hoekstuk 3-weg', 4)
        add('Grondframe T-stuk 3-weg', 2 * mid)
    n_conn = sum(v for k, v in out.items() if k in C and k not in ('Voetplaat met haringgat', 'Klem nokversteviging'))
    add('Knevelbouten M8 (10 stuks)', math.ceil(n_conn * 3 / 10))
    return out


_REG = {}


def register(bf_line, os_prices, osu, bf_dak, os_dak):
    _REG.update(bf_line=bf_line, os=os_prices, osu=osu, bf_dak=bf_dak, os_dak=os_dak)


def walls(maat, sub, kleur, find_one, zijhoogte=200):
    """Doek parts: zijwand panels on both long sides (one per vak), an eindwand on both kopse kanten (the deur is in the eindwand)."""
    w, d = [float(x.replace(',', '.')) for x in maat.replace(' m', '').split(' x ')]
    u_side = 'PE met raam' if sub == 'pe-basic' else ('PVC dicht' if sub == 'opslag' else 'PVC met raam')
    u_end = 'Eindwand PE' if sub == 'pe-basic' else ('Eindwand, zijhoogte 220 cm' if zijhoogte == 220 else 'Eindwand')
    out = []
    for v in sorted(set(vakken(d))):
        m = '2 x 2,2 m' if zijhoogte == 220 else ('1,5 x 2 m' if v == 1.5 else '2 x 2 m')
        hit = find_one('zijwand-partytent-2-m-pvc', {'Maat': m, 'Uitvoering': u_side, 'Kleur': kleur})
        n = 2 * sum(1 for x in vakken(d) if x == v)
        out.append(('Zijwand', 'zijwand-partytent-2-m-pvc', hit, n, f'{m} {u_side} {kleur}'))
    em = (f'{w:g} m').replace('.', ',')
    hit = find_one('eindwand-en-tussenwand-partytent', {'Maat': em, 'Uitvoering': u_end, 'Kleur': kleur})
    out.append(('Eindwand', 'eindwand-en-tussenwand-partytent', hit, 2, f'{em} {u_end} {kleur}'))
    return out


def apply(errors):
    """custom.stuklijst on every variant of the buizenframe tents and the opslagtent: frame parts by SKU, dakzeil and wanden in the same
    maat, doek and kleur (contract extension, variant metafield json)."""
    from kk_addons import find_one, vopts
    sku_of = {**C, **T}
    for h, info in _REG['bf_line'].items():
        p = HANDLES[h]
        dak_h, dak_u = _REG['bf_dak'][h]
        for v in p['variants']:
            o = vopts(p, v)
            _emit(p, v, info['sub'], o['Maat'], o['Kleur'], dak_h, dak_u, sku_of, find_one, errors)
    p = HANDLES['opslagtent-pvc']
    for v in p['variants']:
        o = vopts(p, v)
        dak_h, dak_u = _REG['os_dak'][o['Uitvoering']]
        _emit(p, v, 'opslag', o['Maat'], o['Kleur'], dak_h, dak_u, sku_of, find_one, errors,
              zijhoogte=220 if o['Uitvoering'] == 'PVC 620 Professional' else 200)


def _emit(p, v, sub, maat, kleur, dak_h, dak_u, sku_of, find_one, errors, zijhoogte=None):
    zh = zijhoogte or LINE_FRAME[sub][0]
    rows = []
    for name, n in frame(maat, sub, zh).items():
        handle = 'koppelstukken-en-buizen-38-mm' if name in C else 'buizen-buizenframe-38-mm'
        rows.append({'groep': 'Frame', 'onderdeel': name, 'handle': handle, 'sku': sku_of[name], 'aantal': n})
    dak = find_one(dak_h, {'Maat': maat, 'Uitvoering': dak_u, 'Kleur': kleur})
    if dak is None:
        errors.append(f'{p["handle"]} {maat} {kleur}: no dakzeil {dak_u} in that maat/kleur')
    else:
        rows.append({'groep': 'Doek', 'onderdeel': 'Dakzeil', 'handle': dak_h, 'sku': dak['sku'], 'aantal': 1})
    for name, wh, hit, n, what in walls(maat, sub, kleur, find_one, zh):
        if hit is None:
            errors.append(f'{p["handle"]} {maat} {kleur}: no {name.lower()} {what}')
            continue
        rows.append({'groep': 'Doek', 'onderdeel': name, 'handle': wh, 'sku': hit['sku'], 'aantal': n})
    v.setdefault('metafields', {})['stuklijst'] = rows


# ------------------------------------------------------------------------------------------------------------------ stretchtent
# Standing item d (catalog round 2026-10-18): the stretchtent compleet has its own stuklijst, so the loose doek + palenset + afspanning
# never cost less than the tent. Palenset per maat: middenpalen 4 m, randpalen 3 m and 2,5 m; one ankerpunt (spanband met ratel + lange
# haring 75 cm) per lus, every 75 cm of the edge (as the PDP says: 'voor elke lus'); the zware afspanning adds a touwenset 3-punts and a ronde haring 100 cm at
# every paal (hoek- en middenpunten). Counts are our definition, to confirm with the supplier (docs/claims-to-confirm.md).
STRETCH_PALEN = {'4,5 x 6 m': (1, 2, 2), '4,5 x 7,5 m': (1, 2, 2), '6 x 6 m': (1, 2, 4), '6 x 10,5 m': (2, 2, 4), '7,5 x 10,5 m': (2, 2, 6),
                 '9 x 10,5 m': (2, 4, 6), '10,5 x 10,5 m': (2, 4, 8), '10,5 x 12 m': (3, 4, 8), '10,5 x 15 m': (3, 4, 8), '10,5 x 19,5 m': (4, 6, 10)}
PAAL_PRIJS = {('2,5 m', 'Kastanjehout'): 59.95, ('3 m', 'Kastanjehout'): 69.95, ('4 m', 'Kastanjehout'): 89.95, ('5 m', 'Kastanjehout'): 109.0,
              ('2,5 m', 'Aluminium'): 79.95, ('3 m', 'Aluminium'): 94.95, ('4 m', 'Aluminium'): 119.0, ('5 m', 'Aluminium'): 149.0}
ANKER = ('Spanband met ratel', 6.95, 'Lange haring 75 cm', 10.95)
ZWAAR_PUNT = ('Touwenset 3-punts met RVS karabijnen', 49.95, 'Ronde haring 100 cm', 20.95)


def stretch_ankers(maat):
    a, b = [float(x.replace(',', '.')) for x in maat.replace(' m', '').split(' x ')]
    return round(2 * (a + b) / 0.75)


def stretch_palen(maat, materiaal):
    n4, n3, n25 = STRETCH_PALEN[maat]
    return [('4 m', n4), ('3 m', n3), ('2,5 m', n25)], sum(PAAL_PRIJS[(m, materiaal)] * n for m, n in (('4 m', n4), ('3 m', n3), ('2,5 m', n25)))


def stretch_kit_prijs(maat, materiaal, zwaar=False):
    """What the loose parts of one stretchtent cost: palen + afspanning (+ zware afspanning), without the doek."""
    _, palen = stretch_palen(maat, materiaal)
    kit = palen + stretch_ankers(maat) * (ANKER[1] + ANKER[3])
    if zwaar:
        kit += sum(STRETCH_PALEN[maat]) * (ZWAAR_PUNT[1] + ZWAAR_PUNT[3])
    return kit


def stretch(errors):
    from kk_addons import find_one, vopts
    p = HANDLES['stretchtent-compleet']
    for v in p['variants']:
        o = vopts(p, v)
        maat, u, kleur = o['Maat'], o['Uitvoering'], o['Kleur']
        mat = 'Aluminium' if u.startswith('Aluminium') else 'Kastanjehout'
        rows = []
        doek = find_one('stretchdoek-los', {'Maat': maat, 'Kleur': kleur})
        if doek is None:
            errors.append(f'stretchtent-compleet {maat} {kleur}: no stretchdoek-los in that maat/kleur')
            continue
        rows.append({'groep': 'Doek', 'onderdeel': 'Stretchdoek', 'handle': 'stretchdoek-los', 'sku': doek['sku'], 'aantal': 1})
        for lengte, n in stretch_palen(maat, mat)[0]:
            hit = find_one('palen-stretchtent', {'Maat': lengte, 'Uitvoering': mat})
            if hit is None:
                errors.append(f'stretchtent-compleet: no paal {lengte} {mat}')
                continue
            rows.append({'groep': 'Palen', 'onderdeel': f'Paal {lengte} {mat.lower()}', 'handle': 'palen-stretchtent', 'sku': hit['sku'], 'aantal': n})
        parts = [('onderdelen-stretchtent', ANKER[0], stretch_ankers(maat)), ('haringen-en-bevestigingsmateriaal-partytent', ANKER[2], stretch_ankers(maat))]
        if 'zware' in u:
            parts += [('onderdelen-stretchtent', ZWAAR_PUNT[0], sum(STRETCH_PALEN[maat])), ('onderdelen-stretchtent', ZWAAR_PUNT[2], sum(STRETCH_PALEN[maat]))]
        for h, name, n in parts:
            hit = find_one(h, {'Uitvoering': name})
            if hit is None:
                errors.append(f'stretchtent-compleet: no {name} in {h}')
                continue
            rows.append({'groep': 'Afspanning', 'onderdeel': name, 'handle': h, 'sku': hit['sku'], 'aantal': n})
        v.setdefault('metafields', {})['stuklijst'] = rows

