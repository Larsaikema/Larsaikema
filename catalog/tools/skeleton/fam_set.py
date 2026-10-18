# Actiepakketten: prijzen berekend uit de losse onderdelen (componenten).
from kk_base import *
from fam_easyup import x9, tent_params, legs, h_pro, PRO_KLEUREN

def find(handle, sel):
    p = HANDLES[handle]
    names = [o['name'] for o in p['options']]
    for v in p['variants']:
        vals = dict(zip(names, [v['option1'], v['option2'], v['option3']]))
        if all(vals.get(k) == val for k, val in sel.items()):
            return v
    raise KeyError((handle, sel))

def comps_sum(comps):
    tot, grams = 0, 0
    for h, sel, q in comps:
        v = find(h, sel)
        tot += v['price'] * q
        grams += v['grams'] * q
    return tot / 100, grams

def bundle(h, title, options, combos, price_fn, comps_fn, imgs, vmap, vby, kenmerk, brief, kw, covers, tags, ref=None, sku=None, verz='pakket'):
    variants, bdata = [], []
    for combo in combos:
        comps = comps_fn(*combo)
        los, grams = comps_sum(comps)
        price = price_fn(los, *combo)
        s = f'KK-SET-{sku}-' + '-'.join(code(c) if not c in COLOR_CODE else COLOR_CODE[c] for c in combo) if combo else f'KK-SET-{sku}'
        s = s.replace(' ', '')
        variants.append(variant(s, list(combo), price, grams, None, tracked=False))
        bdata.append({'variant': list(combo), 'componenten': [{'handle': c[0], 'variant': c[1], 'aantal': c[2]} for c in comps],
                      'los_totaal': round(los, 2), 'pakketprijs': price, 'besparing': round(los - price, 2)})
    p = {'handle': h, 'title': title, 'product_type': 'Actiepakket', 'tags': ['set'] + tags, 'options': options, 'variants': variants,
         'images': imgs, 'metafields': {'kenmerk_kort': kenmerk, 'verzending': verz}, 'bundle': {'componenten_per_variant': bdata,
         'note': 'Prijs ligt onder de som van de losse prijzen; compare_at blijft leeg (geen "van"-prijs zonder echte eerdere prijs). Tekst mag "Los € X, in het pakket € Y" noemen.'},
         'covers': covers, 'family': 'set', 'weight': 1.5, 'copy_brief': brief, 'seo_keywords': kw, 'price_ref': ref or {}}
    if vmap:
        p['variant_images'] = vmap
        p['variant_image_by'] = vby
    return add(p)

def build():
    D = ['Ø70 cm', 'Ø80 cm', 'Ø85 cm']
    rokmaat = lambda d: 'Ø60-70 cm' if d == 'Ø70 cm' else 'Ø80-85 cm'
    # blad colour of the statafel in every statafel bundle (Statafelshop's Colorado / Sacramento packs offer the top colour too).
    # Merchandising review 3: every pakket with a stretchrok offers all 24 rok colours, like statafelrok-stretch (Statafelshop lets you
    # pick any rok colour in a pakket). Under the stretchrok with topcover the blad is not visible, so those pakketten offer the blad in
    # wit, zwart or antraciet without the Berken surcharge: 3 maten x 3 bladen x 24 rokken = 216 variants, under the 250 that Liquid's
    # product.variants returns (the theme builds its variant picker from it). Berken stays on the statafel itself and in the pakket
    # without a rok (pakket-statafels-met-transportkar).
    BLAD = ['Wit', 'Zwart', 'Antraciet', 'Berken']
    BLADU = [f'{b} blad' for b in BLAD]
    BLADR = [f'{b} blad' for b in BLAD if b != 'Berken']
    blad_of = lambda u: u.split(' ')[0]
    ROK = ['Zwart'] + [k for k in ROK_KLEUREN if k != 'Zwart']
    STF = lambda d, u: ('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': blad_of(u), 'Uitvoering': 'Binnen'})
    rok_vmap = {k: f'statafelrok-stretch-{slug(k)}-hero.webp' for k in ROK_KLEUREN}
    def rok_imgs(h, kleuren=ROK_KLEUREN):
        return [img(f'statafelrok-stretch-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 2, 'statafelCover',
                    {'type': 'stretch', 'color': render_color(k), 'diameter': 0.8, 'topcover': render_color(k)}, 'hero', k, 'existing', extra={'shared_with': 'statafelrok-stretch'})
                for k in ['Zwart'] + [x for x in kleuren if x != 'Zwart']]
    bundle('pakket-statafel-met-stretchrok', 'Statafel met stretchrok (pakket)', [opt('Maat', D), opt('Uitvoering', BLADR), opt('Kleur', ROK)],
           [(d, u, k) for d in D for u in BLADR for k in ROK],
           lambda los, d, u, k: {'Ø70 cm': 99.95, 'Ø80 cm': 104.95, 'Ø85 cm': 109.95}[d],
           lambda d, u, k: [(*STF(d, u), 1), ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, 1)],
           rok_imgs('pakket-statafel-met-stretchrok', ROK), {k: rok_vmap[k] for k in ROK}, 'Kleur',
           'Statafel Professional + stretchrok met topcover · rok in 24 kleuren',
           'Instappakket: één statafel aangekleed; noem los- en pakketprijs; kies de bladkleur (wit, zwart of antraciet: onder de topcover zie je het blad niet) en de kleur van rok en topcover (alle 24).',
           ['statafel met rok', 'statafel inclusief statafelrok'],
           ['statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest', 'gebruik:evenement'], {'statafelshop': 'Savannah Ø80 + stretchrok €120,94 · Colorado/Sacramento-pakketten met bladkleur'}, sku='STFROK')
    # entry pack (merchandising review 2026-10-18: our packs started at € 99,95, Statafelshop's at about € 70): the HDPE statafel Ø80 +
    # stretchrok Ø80-85 met topcover, los € 74,90, pakket € 69,95. Blad wit or lichtgrijs, rok in the 8 pack colours.
    HDPE_B = ['Wit blad', 'Lichtgrijs blad']
    bundle('pakket-statafel-hdpe-met-stretchrok', 'Statafel HDPE met stretchrok (pakket)', [opt('Maat', ['Ø80 cm']), opt('Uitvoering', HDPE_B), opt('Kleur', ROK)],
           [('Ø80 cm', u, k) for u in HDPE_B for k in ROK],
           lambda los, d, u, k: 69.95,
           lambda d, u, k: [('statafel-inklapbaar-hdpe-80', {'Kleur': blad_of(u)}, 1), ('statafelrok-stretch', {'Maat': 'Ø80-85 cm', 'Uitvoering': 'Met topcover', 'Kleur': k}, 1)],
           rok_imgs('pakket-statafel-hdpe-met-stretchrok', ROK), {k: rok_vmap[k] for k in ROK}, 'Kleur',
           'Statafel HDPE Ø80 cm + stretchrok met topcover · rok in 24 kleuren',
           'Instappakket onder de € 70: de lichte HDPE-statafel Ø80 met een stretchrok en topcover; los € 74,90, in het pakket € 69,95; eerlijk vergelijken met het pakket met de Professional.',
           ['statafel met rok goedkoop', 'statafel met statafelrok pakket', 'statafel hdpe met rok'],
           ['statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest', 'gebruik:evenement'],
           {'statafelshop': 'goedkoopste statafelpakketten ca. € 70 (merchandising review)'}, sku='HDPEROK')
    bundle('pakket-4-statafels-met-stretchrokken', '4 statafels met stretchrokken (pakket)', [opt('Maat', D), opt('Uitvoering', BLADR), opt('Kleur', ROK)],
           [(d, u, k) for d in D for u in BLADR for k in ROK],
           lambda los, d, u, k: {'Ø70 cm': 389.0, 'Ø80 cm': 409.0, 'Ø85 cm': 429.0}[d],
           lambda d, u, k: [(*STF(d, u), 4), ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, 4)],
           [img('pakket-4-statafels-met-stretchrokken-zwart-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart', 'position': [x, 0, z]}
                                                                                                    for x, z in [(-0.6, -0.5), (0.6, -0.5), (-0.6, 0.6), (0.6, 0.6)]]}, 'hero', 'Zwart', 'existing')] +
           [i for i in rok_imgs('x', ROK) if i['kleur'] != 'Zwart'], {**{k: rok_vmap[k] for k in ROK}, 'Zwart': 'pakket-4-statafels-met-stretchrokken-zwart-hero.webp'}, 'Kleur',
           '4 statafels + 4 stretchrokken met topcover · rok in 24 kleuren', 'Voor het tuinfeest of de kantine: vier complete statafels; Statafelshop heeft geen 4-pakket.',
           ['4 statafels met rok', 'statafels set'], ['statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest', 'gebruik:evenement'], sku='4STF')
    KAR = ['5 statafels + kleine kar', '10 statafels + grote kar', '15 statafels + grote kar']
    karn = {KAR[0]: (5, 'Klein, voor 5 statafels'), KAR[1]: (10, 'Groot, voor 15 statafels'), KAR[2]: (15, 'Groot, voor 15 statafels')}
    bundle('pakket-statafels-met-transportkar', 'Statafels met transportkar (pakket)', [opt('Uitvoering', KAR), opt('Maat', D), opt('Kleur', BLAD)],
           [(u, d, b) for u in KAR for d in D for b in BLAD], lambda los, u, d, b: float(x9(0.9 * los)),
           lambda u, d, b: [('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': b, 'Uitvoering': 'Binnen'}, karn[u][0]), ('transportkar-statafels', {'Uitvoering': karn[u][1]}, 1)],
           [img('pakket-statafels-met-transportkar-hero.webp', 'hero', 1, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 10, 'tableTop': 'wit'}, 'hero', None, 'existing')], None, None,
           'Inklapbare statafels Professional op een transportkar · bladkleur naar keuze', 'Voor verhuur, horeca en verenigingen: opslaan en rijden; besparing t.o.v. los noemen.',
           ['statafels met trolley', 'statafel transportkar pakket'], ['statafelrokken-hoezen.actiepakketten', 'tafels-stoelen.bundels'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'statafelshop': 'kar + 5 Savannah €780,45 · groot + 15 Colorado €1.692,79', 'outmate': '10x + trolley €2.299–€2.335'}, sku='KAR', verz='pallet')
    # Statafels + stretchrokken + kar, split per aantal (merchandising review): one product each for 5 (kleine kar), 10 and 15 (grote kar), so
    # Maat (Ø70, Ø80, Ø85), blad (Uitvoering) and rokkleur (the same 8 colours as the other statafelpakketten) each get their own option
    # (3 x 4 x 8 = 96 variants). The kleine kar takes 5 ingeklapte statafels of every size, the grote 15.
    KARP = {5: ('Klein, voor 5 statafels', 'klein', 4), 10: ('Groot, voor 15 statafels', 'groot', 10), 15: ('Groot, voor 15 statafels', 'groot', 15)}
    for n, (kar, ksize, loaded) in KARP.items():
        hn = f'pakket-{n}-statafels-stretchrokken-transportkar'
        # Zwart: the kar with the folded statafels plus one statafel aangekleed; other rok colours: the rok render in that colour
        hero = f'pakket-{n}-statafels-stretchrokken-transportkar-zwart-hero.webp' if n == 5 else 'pakket-statafels-stretchrokken-transportkar-zwart-hero.webp'
        hero_spec = {'items': [{'model': 'trolley', 'kind': 'statafel', 'size': ksize, 'loaded': 4 if n == 5 else 10, 'position': [-0.9 if n > 5 else -0.75, 0, 0]},
                               {'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart', 'position': [0.7, 0, 0]}]}
        imgs = [img(hero, 'hero', 1, 'items', hero_spec, 'hero', 'Zwart', 'existing')] + [i for i in rok_imgs('x', ROK) if i['kleur'] != 'Zwart']
        vmap = {**{k: rok_vmap[k] for k in ROK}, 'Zwart': hero}
        bundle(hn, f'{n} statafels met stretchrokken en transportkar (pakket)', [opt('Maat', D), opt('Uitvoering', BLADR), opt('Kleur', ROK)],
               [(d, u, k) for d in D for u in BLADR for k in ROK], lambda los, d, u, k: float(x9(0.89 * los)),
               lambda d, u, k, n=n, kar=kar: [(*STF(d, u), n), ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, n),
                                              ('transportkar-statafels', {'Uitvoering': kar}, 1)],
               imgs, vmap, 'Kleur',
               f'{n} statafels + {n} stretchrokken met topcover + {"kleine" if n == 5 else "grote"} transportkar',
               f'Verhuur- en evenementpakket van {n} statafels Professional, {n} stretchrokken met topcover en de {"kleine" if n == 5 else "grote"} kar; Maat, blad (3) en rokkleur (24) apart te kiezen; besparing t.o.v. los.',
               [f'{n} statafels met rokken en trolley', 'statafel verhuurpakket', 'statafels met transportkar en rokken'], ['statafelrokken-hoezen.actiepakketten'],
               ['zakelijk', 'pallet', 'gebruik:evenement'], {'statafelshop': 'kar klein + Colorado + rokken €1.148,29 · groot €1.996,50'}, sku=f'KARROK{n}', verz='pallet')
    bundle('terraspakket-statafel-barkrukken', 'Terraspakket: statafel, stretchrok en 4 barkrukken', [opt('Kleur', ROK), opt('Uitvoering', BLADR)],
           [(k, u) for k in ROK for u in BLADR],
           lambda los, k, u: 229.0,
           lambda k, u: [(*STF('Ø80 cm', u), 1), ('statafelrok-stretch', {'Maat': 'Ø80-85 cm', 'Uitvoering': 'Met topcover', 'Kleur': k}, 1),
                         ('barkruk-stapelbaar-metaal', {'Kleur': 'Zwart'}, 4)],
           [img('terraspakket-statafel-barkrukken-zwart-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart'}] +
                                                                                      [{'model': 'barStool', 'style': 'metaal', 'color': 'zwart', 'position': p} for p in [[0.7, 0, 0], [-0.7, 0, 0], [0, 0, 0.7], [0, 0, -0.7]]]},
                'hero', 'Zwart', 'existing')] + [i for i in rok_imgs('x', ROK) if i['kleur'] != 'Zwart'],
           {**{k: rok_vmap[k] for k in ROK}, 'Zwart': 'terraspakket-statafel-barkrukken-zwart-hero.webp'}, 'Kleur',
           'Statafel Ø80 + stretchrok met topcover + 4 zwarte barkrukken · rok in 24 kleuren', 'Complete sta-plek voor terras of kantine; kleur = rok (24, zoals de andere statafelpakketten), blad wit, zwart of antraciet.',
           ['statafel met barkrukken', 'statafel set barkrukken'], ['statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           {'statafelshop': 'Colorado + rok + 4 Angara €411,40'}, sku='TERRAS')
    BK = ['Wit', 'Zwart', 'Antraciet']
    bundle('buffetpakket-klaptafels-stretchhoezen', 'Buffetpakket: 10 klaptafels met stretchhoezen en transportkar', [opt('Kleur', BK)], [(k,) for k in BK],
           lambda los, k: float(x9(0.89 * los)),
           lambda k: [('klaptafel-hdpe-rechthoekig', {'Maat': '183 x 76 cm', 'Uitvoering': 'Vast blad'}, 10), ('stretchhoes-klaptafel', {'Maat': '183 x 76 cm', 'Kleur': k}, 10),
                      ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 10 klaptafels 183 cm'}, 1)],
           [img('buffetpakket-klaptafels-stretchhoezen-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'buffetCover', 'length': 1.83, 'width': 0.76, 'color': 'zwart', 'position': [-1.15, 0, 0.1]},
                                                                                                  {'model': 'trolley', 'kind': 'klaptafel', 'loaded': 9, 'position': [1.15, 0, -0.25]}]}, 'hero', 'Zwart', 'existing')] +
           [img(f'stretchhoes-klaptafel-{slug(k)}-hero.webp', 'variant', 3, 'buffetCover', {'length': 1.83, 'width': 0.76, 'color': render_color(k), 'kind': 'klaptafel'}, 'hero', k, 'existing',
                extra={'shared_with': 'stretchhoes-klaptafel'}) for k in ['Wit', 'Antraciet']],
           {'Zwart': 'buffetpakket-klaptafels-stretchhoezen-hero.webp', 'Wit': 'stretchhoes-klaptafel-wit-hero.webp', 'Antraciet': 'stretchhoes-klaptafel-antraciet-hero.webp'}, 'Kleur',
           '10 klaptafels 183 x 76 cm + 10 stretchhoezen + transportkar', 'Catering en evenementen: buffet- of vergaderopstelling in één keer.',
           ['buffettafels set', 'klaptafels met hoezen'], ['statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'statafelshop': '25 buffettafels + rokken + platen + kar €5.196,95'}, sku='BUFFET', verz='pallet')
    # Kwaliteit (Standaard / Brouwerijkwaliteit, like Statafelshop's 10-pakketten) and the transportkar as an option (merchandising
    # review 3): a vereniging buying ten sets also needs to move and store them
    BTQ = ['Standaard', 'Brouwerijkwaliteit']
    BTU = ['Zonder kar', 'Met transportkar']
    bundle('biertafelsets-10-stuks', 'Biertafelsets 10 stuks (pakket)', [opt('Maat', ['220 x 50 cm', '220 x 70 cm']), opt('Kwaliteit', BTQ), opt('Uitvoering', BTU)],
           [(m, q, u) for m in ['220 x 50 cm', '220 x 70 cm'] for q in BTQ for u in BTU],
           lambda los, m, q, u: float(x9(0.89 * los)),
           lambda m, q, u: [('biertafelset', {'Maat': m, 'Uitvoering': 'Set: tafel en 2 banken', 'Kwaliteit': q}, 10)] +
                           ([('transportkar-biertafelsets', {}, 1)] if u == 'Met transportkar' else []),
           [img('biertafelsets-10-stuks-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'biertafelset', 'length': 2.2, 'tableWidth': 0.5, 'position': [0, 0, z]} for z in [-1.2, 0, 1.2]]}, 'hero', None, 'existing'),
            img('transportkar-biertafelsets-gevuld.webp', 'variant', 2, 'trolley', {'kind': 'biertafel', 'loaded': 10, 'tableWidth': 0.5}, 'hero', None, 'existing',
                alt='10 biertafelsets op de transportkar', extra={'shared_with': 'transportkar-biertafelsets'})],
           {'Zonder kar': 'biertafelsets-10-stuks-hero.webp', 'Met transportkar': 'transportkar-biertafelsets-gevuld.webp'}, 'Uitvoering',
           '10 sets: tafel + 2 banken · standaard of brouwerij · met of zonder kar',
           'Voor verenigingen en buurtfeesten: tien sets in standaard- of brouwerijkwaliteit, desgewenst met de transportkar; besparing t.o.v. los.',
           ['biertafelsets 10 stuks', 'feestsets vereniging', 'biertafels brouwerijkwaliteit 10 stuks'], ['tafels-stoelen.biertafels', 'statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'pallet', 'gebruik:tuinfeest'],
           {'statafelshop': '10 biertafels standaard vanaf €1.017,55 / brouwerij vanaf €1.376,92 (alleen tafels)'}, sku='BTS10', verz='pallet')
    # pakketten with a kar (merchandising review 3), the pattern of pakket-24-barkrukken-met-transportkar: furniture + its kar, ca. 10% under los
    bundle('pakket-10-ronde-klaptafels-met-transportkar', '10 ronde klaptafels met transportkar (pakket)', [opt('Maat', ['Ø150 cm', 'Ø180 cm'])], [('Ø150 cm',), ('Ø180 cm',)],
           lambda los, m: float(x9(0.9 * los)),
           lambda m: [('klaptafel-hdpe-rond', {'Maat': m}, 10), ('transportkar-ronde-klaptafels', {}, 1)],
           [img('pakket-10-ronde-klaptafels-met-transportkar-hero.webp', 'hero', 1, 'items',
                {'items': [{'model': 'trolley', 'kind': 'rond', 'loaded': 9, 'diameter': 1.8, 'position': [-0.9, 0, 0]},
                           {'model': 'klaptafel', 'shape': 'rond', 'diameter': 1.8, 'position': [1.0, 0, 0.35]}]}, 'hero', None, 'existing')],
           None, None, '10 ronde klaptafels Ø150 of Ø180 cm + transportkar',
           'Banket, bruiloft, gala: tien ronde tafels (8 of 10 personen per tafel) en de kar waarop ze staan; besparing t.o.v. los.',
           ['ronde klaptafels met trolley', 'banket tafels 10 stuks', 'ronde tafels verhuur'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:evenement'], {'outmate': 'klaptafel rond 180 €254,50 + trolley vanaf €482,50 (10% korting op de trolley met de tafels)'},
           sku='10KLR', verz='pallet')
    SK = ['Zwart', 'Wit', 'Antraciet']
    bundle('pakket-40-stapelstoelen-met-transportkar', '40 stapelstoelen met transportkar (pakket)', [opt('Kleur', SK)], [(k,) for k in SK],
           lambda los, k: float(x9(0.9 * los)),
           lambda k: [('stapelstoel-metaal', {'Kleur': k}, 40), ('transportkar-stapelstoelen', {'Uitvoering': 'Voor 40 stapelstoelen'}, 1)],
           [img(f'pakket-40-stapelstoelen-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'stapelstoel', 'chairs': 40, 'loaded': 39, 'chairStyle': 'metaal', 'chairColor': render_color(k), 'position': [-0.45, 0, 0]},
                           {'model': 'chair', 'style': 'metaal', 'color': render_color(k), 'position': [0.75, 0, 0.45], 'rotationY': -30}]}, 'hero', k, 'existing') for k in SK],
           {k: f'pakket-40-stapelstoelen-met-transportkar-{slug(k)}-hero.webp' for k in SK}, 'Kleur',
           '40 metalen stapelstoelen + transportkar · één kleur',
           'Kantine, terras en verhuur: 40 stapelstoelen in 4 stapels van 10 op één kar, rijden en opslaan; besparing t.o.v. los.',
           ['stapelstoelen met trolley', 'stapelstoelen 40 stuks', 'stoelen met transportkar'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:horeca', 'gebruik:evenement'], {'statafelshop': 'transportkar voor stapelstoel Waal 20/40 st (gevuld, prijs niet gevonden)'},
           sku='40STM', verz='pallet')
    # one starter pack per Premium size; 6-legged tents get 2 sets of spanbanden (one band per poot)
    PRM = {'3 x 3 m': ('easy-up-partytent-premium-3x3', 1, 449.0), '3 x 4,5 m': ('easy-up-partytent-premium-3x4-5', 2, 549.0),
           '3 x 6 m': ('easy-up-partytent-premium-3x6', 2, 669.0)}
    bundle('starterspakket-easy-up-premium', 'Starterspakket easy-up Premium', [opt('Maat', list(PRM)), opt('Kleur', TENT_KLEUREN)],
           [(m, k) for m in PRM for k in TENT_KLEUREN],
           lambda los, m, k: PRM[m][2],
           lambda m, k: [(PRM[m][0], {'Kleur': k}, 1), ('zijwandenset-easy-up', {'Maat': m, 'Kleur': k}, 1), ('spanbanden-en-haringen-easy-up', {}, PRM[m][1])],
           *(lambda: (lambda imgs: (imgs, {i['kleur']: i['file'] for i in imgs}))(
               [img(f'starterspakket-easy-up-premium-{slug(k)}-hero.webp', 'hero' if k == 'Rood' else 'variant', 1 if k == 'Rood' else 3, 'easyUpTent',
                    tent_params('3 x 3 m', 'premium', k, walls={'back': 'window', 'left': 'closed', 'right': 'door'}), 'hero', k, 'existing') for k in TENT_KLEUREN]))(),
           'Kleur', 'Easy-up Premium + zijwandenset + spanbanden en haringen · 3 maten', 'Alles voor je eerste tuinfeest in 3 × 3, 3 × 4,5 of 3 × 6 m; los vs pakketprijs.',
           ['partytent 3x3 met zijwanden', 'partytent 3x6 met zijwanden', 'easy up set'], ['easy-up-partytenten.easy-up-premium', 'statafelrokken-hoezen.actiepakketten'],
           ['gebruik:tuinfeest'], sku='EUPRM')
    # every Professional size (merchandising review 3 added 2 x 2 and 5 x 5 m: polyester only, in the colours of those tents). The
    # 2 x 2 m has no zijwandenset: its four loose 2 m walls in the set's layout (1 dicht, 1 met deur, 2 met raam) instead.
    CM = ['2 x 2 m', '3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m', '5 x 5 m']
    CU = ['Polyester', 'Heavy duty PVC']
    wset = lambda u: 'zijwandenset-easy-up' if u == 'Polyester' else 'zijwandenset-easy-up-heavy-duty-pvc'
    def cp_walls(m, u, k):
        if m == '2 x 2 m':
            return [('zijwand-easy-up-dicht', {'Maat': '2 m', 'Kleur': k}, 1), ('zijwand-easy-up-met-deur', {'Maat': '2 m', 'Kleur': k}, 1),
                    ('zijwand-easy-up-met-raam', {'Maat': '2 m', 'Kleur': k}, 2)]
        return [(wset(u), {'Maat': m, 'Kleur': k}, 1)]
    def cp_combos():
        for m in CM:
            for u in CU:
                if m in PRO_KLEUREN and u != 'Polyester':
                    continue
                for k in (PRO_KLEUREN.get(m) or (TENT_KLEUREN if u == 'Polyester' else HD_KLEUREN)):
                    yield (m, u, k)
    bundle('compleet-pakket-easy-up-professional', 'Compleet pakket easy-up Professional', [opt('Maat', CM), opt('Uitvoering', CU), opt('Kleur', TENT_KLEUREN)],
           list(cp_combos()),
           lambda los, m, u, k: float(x9(0.9 * los)),
           lambda m, u, k: [(h_pro(m), {'Uitvoering': u, 'Kleur': k}, 1)] + cp_walls(m, u, k) +
                           [('voetgewicht-partytent-15-kg', {'Uitvoering': f'Set van {legs(m)}'}, 1)],
           *(lambda: (lambda imgs: (imgs, {i['kleur']: i['file'] for i in imgs}))(
               [img(f'compleet-pakket-easy-up-professional-{slug(k)}-hero.webp', 'hero' if k == 'Rood' else 'variant', 1 if k == 'Rood' else 3, 'easyUpTent',
                    tent_params('3 x 3 m', 'professional', k, walls={'back': 'window', 'left': 'closed', 'right': 'door'}, weights=2), 'hero', k, 'existing') for k in TENT_KLEUREN]))(),
           'Kleur', 'Professional-tent + zijwanden + voetgewichten · 8 maten · polyester of PVC',
           'Zakelijk startklaar: tent, wanden en verzwaring in één keer, in 2 x 2 tot 5 x 5 m; met polyester dak (7 kleuren; 2 x 2 en 5 x 5 m in de kleuren van die tenten) of heavy duty PVC dak en PVC-wanden (wit of zwart, 3 x 3 tot 4 x 8 m); besparing noemen.',
           ['easy up professional set', 'partytent compleet pakket'], ['easy-up-partytenten.easy-up-professional', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:markt'], sku='EUPRO', verz='pallet')
    BKK = ['Zwart', 'Wit', 'Antraciet']
    bundle('pakket-24-barkrukken-met-transportkar', '24 barkrukken met transportkar (pakket)', [opt('Kleur', BKK)], [(k,) for k in BKK],
           lambda los, k: float(x9(0.9 * los)),
           lambda k: [('barkruk-stapelbaar-metaal', {'Kleur': k}, 24), ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 24 barkrukken'}, 1)],
           [img(f'pakket-24-barkrukken-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'barkruk', 'loaded': 24, 'stoolColor': render_color(k), 'position': [-0.5, 0, 0]},
                           {'model': 'barStool', 'style': 'metaal', 'color': render_color(k), 'position': [0.8, 0, 0.2]}]}, 'hero', k, 'existing') for k in BKK],
           {k: f'pakket-24-barkrukken-met-transportkar-{slug(k)}-hero.webp' for k in BKK}, 'Kleur',
           '24 stapelbare barkrukken + transportkar · één kleur', 'Voor horeca en verhuur: 24 krukken op één kar, rijden en opslaan; besparing t.o.v. los noemen.',
           ['barkrukken met trolley', 'barkrukken set 24', 'barkrukken verhuur'], ['tafels-stoelen.bundels', 'tafels-stoelen.barkrukken', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:horeca', 'gebruik:evenement'], {'outmate': "'Supercombi 24x barkruk Hamburg + trolley' (prijs niet gevonden)"}, sku='24BKR', verz='pallet')
    PK = ['10 m', '20 m']
    bundle('prikkabelset-led', 'Prikkabelset met LED-lampen', [opt('Maat', PK), opt('Kleur', ['Zwart', 'Wit'])], [(m, k) for m in PK for k in ['Zwart', 'Wit']],
           lambda los, m, k: {'10 m': 47.95, '20 m': 85.95}[m],
           lambda m, k: [('prikkabel-e27', {'Maat': m, 'Kleur': k}, 1), ('led-lamp-e27', {'Uitvoering': 'Warm wit melkglas 1 W'}, int(m.split()[0]))],
           [img('prikkabel-e27-zwart-hero.webp', 'hero', 1, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': 'zwart'}, 'hero', 'Zwart', 'existing', extra={'shared_with': 'prikkabel-e27'}),
            img('prikkabel-e27-wit-hero.webp', 'variant', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': 'wit'}, 'hero', 'Wit', 'existing', extra={'shared_with': 'prikkabel-e27'})],
           {'Zwart': 'prikkabel-e27-zwart-hero.webp', 'Wit': 'prikkabel-e27-wit-hero.webp'}, 'Kleur', 'Prikkabel + 1 LED-lamp per fitting · direct aan',
           'Kabel en lampen in één: ca. 10% voordeliger dan los (zoals de "lampen-korting bij kabel" in de markt).', ['prikkabel met lampen', 'prikkabel set'],
           ['verlichting.prikkabels', 'statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest'], sku='PKSET')
    bundle('wijnvat-set-statafel-barkrukken', 'Wijnvat-set: statafel met 4 barkrukken', [], [()], lambda los: 489.0,
           lambda: [('statafel-wijnvat-houtlook', {}, 1), ('barkruk-houten-zitting', {'Kleur': 'Zwart'}, 4)],
           [img('wijnvat-set-statafel-barkrukken-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'barrelTable'}] + [{'model': 'barStool', 'style': 'hout', 'color': 'zwart', 'position': p}
                                                                                                                       for p in [[0.75, 0, 0], [-0.75, 0, 0], [0, 0, 0.75], [0, 0, -0.75]]]}, 'hero', None, 'existing')],
           None, None, 'Wijnvat-statafel + 4 barkrukken met houten zitting', 'Sfeerset voor terras en feestzaal; besparing t.o.v. los.',
           ['wijnvat set', 'barrel set statafel'], ['tafels-stoelen.barrels-sets', 'statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'gebruik:horeca', 'pallet'],
           {'outmate': 'Barrel-set 1 + 4 €775 (was €895)'}, sku='VAT', verz='pallet')
