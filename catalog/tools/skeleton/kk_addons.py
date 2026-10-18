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
def r_zitkussen(p, v):
    k = vopts(p, v).get('Kleur')
    return [('zitkussen-stoel-en-barkruk', {'Kleur': {'Zwart': 'Zwart', 'Antraciet': 'Antraciet'}.get(k, 'Zandkleur')}, 1)]


def r_easy_up(p, v):
    """Merchandising review: at most four add-ons that belong to ONE tent: the zijwandenset in the same Maat and Kleur, the
    voetgewicht set for its number of poten, spanbanden en haringen (Premium only: Professional ships with them) and a tas
    (Premium: wieltas). The Professional ships with a wieltas, so a beschermhoes there only duplicated what is in the box
    (merchandising review 2026-10-18): it gets the LED-vloedlicht instead, an upsell that is useful with one tent. Regengoot and
    koppelset only help with 2+ tents, heater and zandzakken are extras: they are cart recommendations (complementary)."""
    o = vopts(p, v)
    m, k = o['Maat'], o['Kleur']
    pro = 'professional' in p['handle']
    n = legs(m)
    r = []
    if o.get('Uitvoering') == 'Heavy duty PVC':
        r.append(('zijwandenset-easy-up-heavy-duty-pvc', {'Maat': m, 'Kleur': k}, 1))
    else:
        r.append(('zijwandenset-easy-up', {'Maat': m, 'Kleur': k}, 1))   # no 2 x 2 m set: the 2 x 2 m tent gets none (walls in complementary)
    r.append(('voetgewicht-partytent-15-kg', {'Uitvoering': f'Set van {n}'}, 1))
    if not pro:
        r.append(('spanbanden-en-haringen-easy-up', {}, math.ceil(n / 4)))   # Premium ships without banden/haringen
    elif n > 4:
        # the Professional ships with 4 banden + 4 haringen: a 6- or 8-legged one needs one more set for the middle legs (its copy and
        # FAQ say so; merchandising review 3)
        r.append(('spanbanden-en-haringen-easy-up', {}, 1))
    r.append(('wieltas-easy-up', {'Maat': m}, 1) if not pro else ('led-vloedlicht-easy-up', {}, 1))
    return r


# cart recommendations (complementary) for the easy-up tents: what used to crowd the add-on block, plus the pakket
EU_COMPLEMENTARY_PREMIUM = ['starterspakket-easy-up-premium', 'zandzakken-partytent-set-van-4', 'regengoot-partytent', 'koppelset-easy-up',
                            'verbindingsstrook-easy-up', 'beschermhoes-easy-up']
EU_COMPLEMENTARY_PRO = ['compleet-pakket-easy-up-professional', 'zandzakken-partytent-set-van-4', 'regengoot-partytent', 'koppelset-easy-up',
                        'verbindingsstrook-easy-up', 'elektrische-heater-partytent', 'wieltas-easy-up']
EU_COMPLEMENTARY_2X2 = ['zijwand-easy-up-dicht', 'zijwand-easy-up-met-raam', 'zijwand-easy-up-met-deur', 'zandzakken-partytent-set-van-4',
                        'koppelset-easy-up', 'elektrische-heater-partytent', 'wieltas-easy-up']


BEDRUKTE_WAND = ['2 m', '3 m', '4 m', '4,5 m', '5 m', '6 m', '8 m']   # bedrukte-zijwand-easy-up lengths: every easy-up side


def r_easy_up_logo(p, v):
    o = vopts(p, v)
    m = o['Maat']
    pro = 'professional' in p['handle']
    n = legs(m)
    r = []
    if o.get('Kleur'):
        r.append(('zijwandenset-easy-up', {'Maat': m, 'Kleur': o['Kleur']}, 1))
    if o.get('Uitvoering') == 'Dak en luifel':
        # full colour roof without walls: offer one printed back wall on the long side (4 x 8 m: the 8 m side, 2 x 2 m: 2 m)
        w, d = DIMS[m]
        side = lenstr(max(w, d)) if lenstr(max(w, d)) in BEDRUKTE_WAND else lenstr(min(w, d))
        r.append(('bedrukte-zijwand-easy-up', {'Maat': side, 'Uitvoering': 'Buitenzijde'}, 1))
    r.append(('voetgewicht-partytent-15-kg', {'Uitvoering': f'Set van {n}'}, 1))
    if not pro:
        r.append(('spanbanden-en-haringen-easy-up', {}, math.ceil(n / 4)))
    elif n > 4:
        r.append(('spanbanden-en-haringen-easy-up', {}, 1))   # extra set for the middle legs of a 6/8-legged Professional
    r.append(('wieltas-easy-up', {'Maat': m}, 1) if not pro else ('led-vloedlicht-easy-up', {}, 1))   # Professional: wieltas is in the box
    return r


def staanders(maat):
    """Buizenframe / opslagtent: spanten every 2 m, 2 staanders per spant: 4 (3 m long), 6 (4 m), 8 (6 m), 10 (8 m), 12 (10 m), 14 (12 m)."""
    w, d = wd(maat)
    return 4 if d <= 3 else 2 * (math.ceil(d / 2) + 1)


def r_buizenframe(p, v):
    """Stormbanden per 2 m length, opbergtassen, a lange haring per staander and one voetgewicht of 15 kg per staander for hard
    ground (merchandising review 2026-10-18: the fixed 1 x betonblok 140 kg on every size from 3 x 3 to 8 x 12 m meant nothing).
    Betonblokken are no checkbox any more: how much ballast a big tent needs on an open site is a calculation, so the copy sends the
    shopper to ballastadvies via the offerte page (the betonblok page says the same)."""
    o = vopts(p, v)
    w, d = wd(o['Maat'])
    n = staanders(o['Maat'])
    r = []
    if p['handle'] != 'partytent-pvc-550-compleet':                 # compleet: stormbanden en tassen zitten erin
        r.append(('stormbandenset-partytent', {'Maat': f'{w:g} m breed'}, math.ceil(d / 2)))
        r.append(('opbergtassenset-partytent', {'Maat': f'{w:g} m breed'}, 1))
    r.append(('haringen-en-bevestigingsmateriaal-partytent', {'Uitvoering': 'Lange haring 75 cm'}, n))
    r.append(('voetgewicht-partytent-15-kg', {'Uitvoering': '1 stuk'}, n))
    return r


PLAAT = {'Ø70 cm': 'Ø68 cm', 'Ø80 cm': 'Ø78 cm', 'Ø85 cm': 'Ø83 cm'}   # beschermplaat 2 cm under the blad
# one default for rok AND strikhoes when the blad colour is not a textile colour (Graniet, Berken, Lichtgrijs HDPE): zwart, the
# best-selling rok colour; a wit blad gets wit, zwart zwart, antraciet antraciet (both textiles have those three)
TEXTIEL_DEFAULT = 'Zwart'


def r_statafel_rond(p, v):
    """Rok in the colour of the blad when the rok comes in it, else zwart; the strikhoes follows the same rule, so rok and hoes
    never default to two different colours. A blad met parasolgat gets the rok WITHOUT topcover (a topcover cannot go over a
    parasolstok) and no strikhoes or beschermplaat (both cover the gat)."""
    o = vopts(p, v)
    rok = 'Ø60-70 cm' if o['Maat'] == 'Ø70 cm' else 'Ø80-85 cm'
    blad = o.get('Kleur')
    k = blad if blad in ROK_KLEUREN and blad in STRIK_KLEUREN else TEXTIEL_DEFAULT
    parasol = 'parasolgat' in (o.get('Uitvoering') or '')
    r = [('statafelrok-stretch', {'Maat': rok, 'Uitvoering': 'Zonder topcover' if parasol else 'Met topcover', 'Kleur': k}, 1)]
    if not parasol:
        r += [('statafelhoes-met-strik', {'Maat': rok, 'Kleur': k}, 1),
              ('beschermplaat-statafel', {'Maat': PLAAT[o['Maat']]}, 1)]
    if p['handle'] != 'statafel-met-kruisvoet':   # a fixed kruisvoet does not fold, so it does not go on the kar
        r.append(('transportkar-statafels', {'Uitvoering': 'Klein, voor 5 statafels'}, 1))
    return r


KRUK_KLEUREN = ['Zwart', 'Wit', 'Antraciet']   # barkruk-stapelbaar-metaal / stapelstoel-metaal


HOES_HOEKIG = 'stretchhoes-statafel-vierkant-en-rechthoekig'


def r_statafel_hoekig(n_by_maat, kar=None):
    """Square / rectangular statafel: the stretchhoes in the same Maat (blad colour when the hoes has it, else zwart), a beschermplaat
    cut to the same Maat, barkrukken around it (kruk in the frame colour when it exists, else zwart) and, for the stackable one, the
    plateaukar (a stacked table does not go in the kar for folding statafels; once per order line, custom.addon_eenmalig)."""
    def rule(p, v):
        o = vopts(p, v)
        k = o.get('Kleur') if o.get('Kleur') in KRUK_KLEUREN else 'Zwart'
        hk = o.get('Kleur') if find_one(HOES_HOEKIG, {'Maat': o['Maat'], 'Kleur': o.get('Kleur')}) else 'Zwart'
        r = [(HOES_HOEKIG, {'Maat': o['Maat'], 'Kleur': hk}, 1),
             ('beschermplaat-statafel', {'Maat': o['Maat']}, 1),
             ('barkruk-stapelbaar-metaal', {'Kleur': k}, n_by_maat.get(o['Maat'], 4))]
        if kar:
            r.append(('transportkar-statafels', {'Uitvoering': kar}, 1))
        return r
    return rule


KAR_STAPEL = 'Plateau, voor 5 gestapelde statafels'   # transportkar-statafels variant for statafel-vierkant-stapelbaar


def r_terrastafel(p, v):
    o = vopts(p, v)
    k = o.get('Kleur') if o.get('Kleur') in KRUK_KLEUREN else 'Zwart'
    return [('beschermplaat-statafel', {'Maat': o['Maat']}, 1),
            ('stapelstoel-metaal', {'Kleur': k}, {'60 x 60 cm': 2, '70 x 70 cm': 4, '120 x 70 cm': 6}.get(o['Maat'], 4)),
            ('transportkar-terrastafels', {}, 1)]   # once per order line (custom.addon_eenmalig)


# the kar that goes along with each piece of furniture, once per order line (custom.addon_eenmalig; build.py sets it from here).
# Merchandising review 3: no stackable chair, round table, biertafelset or terrastafel without its kar; the PE-rotan barkruk is
# not stackable (its own copy), so it gets no kar.
KAR_EENMALIG = {
    'klapstoel': 'transportkar-klaptafels-en-stoelen', 'klaptafel-hdpe-rechthoekig': 'transportkar-klaptafels-en-stoelen',
    'stapelstoel-metaal': 'transportkar-stapelstoelen', 'banquetstoel-gestoffeerd': 'transportkar-stapelstoelen',
    'stapelstoel-cross-back': 'transportkar-stapelstoelen', 'klaptafel-hdpe-rond': 'transportkar-ronde-klaptafels',
    'biertafelset': 'transportkar-biertafelsets', 'terrastafel-inklapbaar': 'transportkar-terrastafels',
    'barkruk-stapelbaar-metaal': 'transportkar-klaptafels-en-stoelen', 'barkruk-houten-zitting': 'transportkar-klaptafels-en-stoelen',
    'barkruk-velours-stapelbaar': 'transportkar-klaptafels-en-stoelen', 'barkruk-draad-stapelbaar': 'transportkar-klaptafels-en-stoelen',
    'barkruk-chroom-stapelbaar': 'transportkar-klaptafels-en-stoelen',
}


def r_barkruk(p, v):
    """Every stackable barkruk: the kar for 24 barkrukken (once per order line, custom.addon_eenmalig; how many of THIS kruk fit is in
    its copy: houten zitting and chroom 18, velours 15); a zitkussen where the seat takes one. The PE-rotan kruk is not stackable:
    no kar, but the zitkussen its copy recommends."""
    r = []
    if p['handle'] in ('barkruk-houten-zitting', 'barkruk-draad-stapelbaar', 'barkruk-pe-rotan'):
        r += r_zitkussen(p, v)
    if p['handle'] != 'barkruk-pe-rotan':
        r.append(('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 24 barkrukken'}, 1))
    return r


def r_stapelstoel(p, v):
    """Stapelstoel: zitkussen where the seat takes one, and the kar for 20 stapelstoelen (once per order line)."""
    r = r_zitkussen(p, v) if p['handle'] != 'banquetstoel-gestoffeerd' else []
    r.append(('transportkar-stapelstoelen', {'Uitvoering': 'Voor 20 stapelstoelen'}, 1))
    return r


def r_rok(p, v):
    """Stretchrok: the 'Zonder topcover' variants get a topcover in the same size and colour; a rok that already has one gets
    none. Both get the beschermplaat that fits the smaller blad of the size range."""
    o = vopts(p, v)
    r = []
    if o['Uitvoering'] == 'Zonder topcover':
        r.append(('topcover-stretch-statafel', {'Maat': o['Maat'], 'Kleur': o['Kleur']}, 1))
    r.append(('beschermplaat-statafel', {'Maat': 'Ø68 cm' if o['Maat'] == 'Ø60-70 cm' else 'Ø78 cm'}, 1))
    return r


def r_pakket_plaat(n):
    def rule(p, v):
        o = vopts(p, v)
        return [('beschermplaat-statafel', {'Maat': PLAAT.get(o.get('Maat'), 'Ø78 cm')}, n)]
    return rule


def r_stertent(p, v):
    """Zijwanden rondom and a long peg per spanpunt for soft ground. No betonblok checkbox (it was 7-12 x 140 kg whatever the wind,
    the ground or the walls): ballast on hard ground is ballastadvies via offerte (merchandising review 2026-10-18)."""
    m = vopts(p, v)['Maat']
    if p['handle'] == 'stertent-enkele-mast':
        points, masts = (6 if m in ('Ø8 m', 'Ø10 m') else 8), 1
    else:
        points, masts = (8 if m in ('8 x 13 m', '10 x 16 m') else 10), 2
    return [('zijwanden-stertent', {'Maat': m, 'Uitvoering': 'Set rondom'}, 1),
            ('haringen-en-bevestigingsmateriaal-partytent', {'Uitvoering': 'Lange haring 100 cm'}, points)]


def r_stretch(p, v):
    """Startwand, two extra randpalen of 2,5 m in the tent's own paalmateriaal (one more open side) and the betonblok its copy lists
    as 'ballast voor verharding' (merchandising review 3). The koppelgoot is no add-on: it only joins TWO tents (its own copy).
    The betonblok is 1 x 500 kg as a start, not a ballast calculation: the PDP copy says the number per ankerpunt follows from
    ballastadvies via offerte, and the betonblok page says the same."""
    o = vopts(p, v)
    paal = 'Aluminium' if o.get('Uitvoering') == 'Aluminium palen' else 'Kastanjehout'
    return [('zijwand-stretchtent', {'Maat': '3 m', 'Uitvoering': 'Startwand met 2 palen'}, 1),
            ('palen-stretchtent', {'Maat': '2,5 m', 'Uitvoering': paal}, 2),
            ('betonblok-ballast-tent', {'Uitvoering': '500 kg'}, 1)]


def r_air_square(p, v):
    o = vopts(p, v)
    n = o['Maat'].split(' x ')[0] + ' m'
    k = o.get('Kleur')
    # the luifel only in the tent's own colour (an Antraciet tent was offered a Zwart luifel); the luifel now comes in Antraciet too
    return [('pomp-opblaasbare-tent', {'Uitvoering': 'Elektrische pomp'}, 1),
            ('zijwand-opblaasbare-promotietent', {'Maat': n, 'Uitvoering': 'Dicht'}, 1),
            ('luifel-opblaasbare-promotietent', {'Maat': n, 'Kleur': k}, 1),
            ('watergewichtzakken-4x20-kg', {}, 1),
            ('led-verlichting-opblaasbare-tent', {}, 1),
            ('opbergtas-opblaasbare-tent', {'Maat': o['Maat']}, 1)]


# zeshoektent ballast: the copy advises at least 50 / 75 / 100 kg per poot (8 x 8 / 10 x 10 / 12 x 12 m) on its 6 luchtpoten; in
# watergewichtzakken of 20 kg that is 3 / 4 / 5 zakken per poot = 18 / 24 / 30 zakken = 5 / 6 / 8 sets of 4 (the 6 ballastzakken in
# the box come on top). Basis stated on the PDP.
HEX_WATER_SETS = {'8 x 8 m': 5, '10 x 10 m': 6, '12 x 12 m': 8}


def r_air_hex(p, v):
    """Pomp, a dichte wand in the tent's own colour (the wall now comes in all 4 tent colours) and watergewicht per its ballast advice."""
    o = vopts(p, v)
    return [('pomp-opblaasbare-tent', {'Uitvoering': 'Elektrische pomp'}, 1),
            ('zijwand-opblaasbare-zeshoektent', {'Maat': o['Maat'], 'Uitvoering': 'Dicht', 'Kleur': o['Kleur']}, 1),
            ('watergewichtzakken-4x20-kg', {}, HEX_WATER_SETS[o['Maat']])]




RULES = {
    'statafel-inklapbaar-professional': r_statafel_rond,
    'statafel-inklapbaar-hdpe-80': r_statafel_rond,
    'statafel-met-kruisvoet': r_statafel_rond,
    'statafelrok-stretch': r_rok,
    'statafelhoes-met-strik': lambda p, v: [('losse-strik-statafelhoes', {'Kleur': STRIK_CONTRAST.get(vopts(p, v)['Kleur'], 'Goud')}, 1)],
    # the klaptafelkar takes the 183 x 76 cm tables (vast blad, and the koffermodel unfolded): only those sizes get it
    'klaptafel-hdpe-rechthoekig': lambda p, v: [('stretchhoes-klaptafel', {'Maat': vopts(p, v)['Maat'], 'Kleur': 'Zwart'}, 1)] +
                                               ([('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 10 klaptafels 183 cm'}, 1)] if vopts(p, v)['Maat'] == '183 x 76 cm' else []),
    # the hoes that covers what you buy: set → tafel + 2 banken, 'Alleen tafel' → tafelhoes, a loose bank → bankhoes (one hoes fits
    # both Kwaliteiten); and the kar for 10 sets, once per order line
    'biertafelset': lambda p, v: [('hoes-biertafelset', {'Maat': vopts(p, v)['Maat'], 'Kleur': 'Wit',
                                                          'Uitvoering': 'Alleen tafel' if vopts(p, v)['Uitvoering'] == 'Alleen tafel' else 'Set: tafel en 2 banken'}, 1),
                                  ('transportkar-biertafelsets', {}, 1)],
    'biertafelsets-10-stuks': lambda p, v: [('hoes-biertafelset', {'Maat': vopts(p, v)['Maat'], 'Kleur': 'Wit', 'Uitvoering': 'Set: tafel en 2 banken'}, 10)],
    'pakket-10-ronde-klaptafels-met-transportkar': lambda p, v: [('statafelkleed-rond-tot-de-grond', {'Maat': 'Ø300 cm' if vopts(p, v)['Maat'] == 'Ø150 cm' else 'Ø330 cm', 'Kleur': 'Wit'}, 10)],
    'pakket-40-stapelstoelen-met-transportkar': lambda p, v: [('zitkussen-stoel-en-barkruk', {'Kleur': {'Zwart': 'Zwart', 'Antraciet': 'Antraciet'}.get(vopts(p, v)['Kleur'], 'Zandkleur')}, 40)],
    'bierbank-220': lambda p, v: [('hoes-biertafelset', {'Maat': '220 x 25 cm', 'Uitvoering': 'Alleen bank', 'Kleur': 'Wit'}, 1)],
    # wijnvat: 4 barkrukken in its style (as in the wijnvat-set) and a beschermplaat 2 cm under the Ø80 blad
    'statafel-wijnvat-houtlook': lambda p, v: [('barkruk-houten-zitting', {'Kleur': 'Zwart'}, 4), ('beschermplaat-statafel', {'Maat': 'Ø78 cm'}, 1)],
    # marktkraam: its copy says zandzakken go round the 4 poten; 'Gewichten of zandzakken' was excluded without an add-on
    'marktkraam-2-m': lambda p, v: [('zandzakken-partytent-set-van-4', {}, 1)],
    'stapelstoel-cross-back': r_stapelstoel,
    'stapelstoel-metaal': r_stapelstoel,
    'banquetstoel-gestoffeerd': r_stapelstoel,
    'klapstoel': lambda p, v: [('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 30 klapstoelen'}, 1)],
    'barkruk-stapelbaar-metaal': r_barkruk,
    'barkruk-houten-zitting': r_barkruk,
    'barkruk-velours-stapelbaar': r_barkruk,
    'barkruk-pe-rotan': r_barkruk,
    'barkruk-draad-stapelbaar': r_barkruk,
    'barkruk-chroom-stapelbaar': r_barkruk,
    'statafel-vierkant-stapelbaar': r_statafel_hoekig({'60 x 60 cm': 4, '70 x 70 cm': 4, '80 x 80 cm': 4}, kar=KAR_STAPEL),
    'statafel-rechthoekig-inklapbaar': r_statafel_hoekig({'120 x 60 cm': 6, '120 x 70 cm': 6, '160 x 60 cm': 8}),
    'terrastafel-inklapbaar': r_terrastafel,
    'prikkabel-e27': lambda p, v: [('led-lamp-e27', {'Uitvoering': 'Warm wit melkglas 1 W'}, int(vopts(p, v)['Maat'].split()[0]))],  # fitting per meter
    'led-lichtslang': lambda p, v: [('onderdelen-prikkabel-en-lichtslang', {'Uitvoering': 'Aansluitsnoer lichtslang met stekker'}, 1)],
    'opslagtent-pvc': r_buizenframe,
    'stretchtent-compleet': r_stretch,
    'stertent-enkele-mast': r_stertent,
    'stertent-dubbele-mast': r_stertent,
    'tuinpaviljoen-aluminium': lambda p, v: [('zijwanden-tuinpaviljoen', {'Maat': vopts(p, v)['Maat'], 'Uitvoering': 'Dicht'}, 1)],
    'terrasheater-gas-13-kw': lambda p, v: [('beschermhoes-terrasheater', {}, 1)],
    'flameheater-gas-9-kw': lambda p, v: [('beschermhoes-terrasheater', {}, 1)],
    'elektrische-heater-partytent': lambda p, v: [('infraroodbrander-elektrische-heater',
                                                   {'Uitvoering': 'Voor 2100 W heater' if '2100' in vopts(p, v)['Uitvoering'] else 'Voor 1500 W heater'}, 1)],
    'klaptafel-hdpe-rond': lambda p, v: [('statafelkleed-rond-tot-de-grond', {'Maat': 'Ø300 cm' if vopts(p, v)['Maat'] == 'Ø150 cm' else 'Ø330 cm', 'Kleur': 'Wit'}, 1),
                                         ('transportkar-ronde-klaptafels', {}, 1)],
    'pakket-statafel-met-stretchrok': r_pakket_plaat(1),
    'pakket-statafel-hdpe-met-stretchrok': r_pakket_plaat(1),
    'pakket-4-statafels-met-stretchrokken': r_pakket_plaat(4),
    'terraspakket-statafel-barkrukken': r_pakket_plaat(1),
    'pakket-5-statafels-stretchrokken-transportkar': r_pakket_plaat(5),
    'pakket-10-statafels-stretchrokken-transportkar': r_pakket_plaat(10),
    'pakket-15-statafels-stretchrokken-transportkar': r_pakket_plaat(15),
    'opblaasbare-promotietent': r_air_square,
    'opblaasbare-promotietent-pro': r_air_square,
    'opblaasbare-partytent-met-waterpoten': r_air_square,
    'opblaasbare-zeshoektent': r_air_hex,
    'starterspakket-easy-up-premium': lambda p, v: [('voetgewicht-partytent-15-kg', {'Uitvoering': f'Set van {legs(vopts(p, v)["Maat"])}'}, 1)],
    # the Professional in the pakket ships with a wieltas: LED-vloedlicht instead of a beschermhoes (merchandising review); a 6- or
    # 8-legged one also the extra set spanbanden en haringen for its middle legs (merchandising review 3)
    'compleet-pakket-easy-up-professional': lambda p, v: [('led-vloedlicht-easy-up', {}, 1)] +
                                                         ([('spanbanden-en-haringen-easy-up', {}, 1)] if legs(vopts(p, v)['Maat']) > 4 else []),
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
        if fn is r_easy_up:
            # what left the add-on block goes to the cart recommendations
            p['complementary'] = list(EU_COMPLEMENTARY_2X2 if p['handle'].endswith('-2x2') else
                                      EU_COMPLEMENTARY_PRO if 'professional' in p['handle'] else EU_COMPLEMENTARY_PREMIUM)


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


# Bundle staffel = the round scheme of the family the bundle belongs to (B2B review: no 2/3/4 % or 5/9/13 % leftovers).
# Single-unit statafel packs follow the statafel scheme, the easy-up packs the tent scheme, the prikkabelset the prikkabel
# scheme, and the multi-unit packs (4 statafels, karren, 10 biertafelsets, 24 barkrukken, wijnvat-set) the high-ticket
# scheme from 2 pieces. The guarantee stays: at any volume 1..200 the bundle is never dearer than its parts with their own
# staffels (checked here and again in validate.py); a scheme that breaks it raises.
BUNDLE_FAMILY = {
    'pakket-statafel-met-stretchrok': ST_MEUBEL, 'pakket-statafel-hdpe-met-stretchrok': ST_MEUBEL, 'terraspakket-statafel-barkrukken': ST_MEUBEL,
    'starterspakket-easy-up-premium': ST_TENT, 'compleet-pakket-easy-up-professional': ST_TENT,
    'prikkabelset-led': ST_PRIK,
    'pakket-4-statafels-met-stretchrokken': ST_GROOT, 'pakket-statafels-met-transportkar': ST_GROOT,
    'pakket-5-statafels-stretchrokken-transportkar': ST_GROOT, 'pakket-10-statafels-stretchrokken-transportkar': ST_GROOT,
    'pakket-15-statafels-stretchrokken-transportkar': ST_GROOT, 'buffetpakket-klaptafels-stretchhoezen': ST_GROOT,
    'biertafelsets-10-stuks': ST_GROOT, 'pakket-24-barkrukken-met-transportkar': ST_GROOT, 'wijnvat-set-statafel-barkrukken': ST_GROOT,
    'pakket-10-ronde-klaptafels-met-transportkar': ST_GROOT, 'pakket-40-stapelstoelen-met-transportkar': ST_GROOT,
}


def bundle_staffels(max_tiers=3):
    out = {}
    for p in PRODUCTS:
        if not p.get('bundle'):
            continue
        tiers = [dict(t) for t in BUNDLE_FAMILY[p['handle']]]
        assert _holds(p, tiers), f'{p["handle"]}: family staffel makes the bundle dearer than its parts'
        p['metafields']['staffelkorting'] = tiers
        out[p['handle']] = tiers
    return out


def bundle_staffels_derived(max_tiers=3):
    """Former rule (kept for reference): tiers derived from the parts' value-weighted discount."""
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
