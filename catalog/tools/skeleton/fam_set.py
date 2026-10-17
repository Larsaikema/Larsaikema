# Actiepakketten: prijzen berekend uit de losse onderdelen (componenten).
from kk_base import *
from fam_easyup import x9, tent_params

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
    rok_vmap = {k: f'statafelrok-stretch-{slug(k)}-hero.webp' for k in ROK_KLEUREN}
    def rok_imgs(h):
        return [img(f'statafelrok-stretch-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 2, 'statafelCover',
                    {'type': 'stretch', 'color': render_color(k), 'diameter': 0.8, 'topcover': render_color(k)}, 'hero', k, 'existing', extra={'shared_with': 'statafelrok-stretch'})
                for k in ['Zwart'] + [x for x in ROK_KLEUREN if x != 'Zwart']]
    bundle('pakket-statafel-met-stretchrok', 'Statafel met stretchrok (pakket)', [opt('Maat', D), opt('Kleur', ROK_KLEUREN)],
           [(d, k) for d in D for k in ROK_KLEUREN], lambda los, d, k: {'Ø70 cm': 99.95, 'Ø80 cm': 104.95, 'Ø85 cm': 109.95}[d],
           lambda d, k: [('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': 'Wit', 'Uitvoering': 'Zonder parasolgat'}, 1), ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, 1)],
           rok_imgs('pakket-statafel-met-stretchrok'), rok_vmap, 'Kleur', 'Statafel Professional (wit blad) + stretchrok met topcover in jouw kleur',
           'Instappakket: één statafel aangekleed; noem los- en pakketprijs; kleur = kleur van rok en topcover.', ['statafel met rok', 'statafel inclusief statafelrok'],
           ['statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest', 'gebruik:evenement'], {'statafelshop': 'Savannah Ø80 + stretchrok €120,94'}, sku='STFROK')
    bundle('pakket-4-statafels-met-stretchrokken', '4 statafels met stretchrokken (pakket)', [opt('Maat', D), opt('Kleur', ROK_KLEUREN)],
           [(d, k) for d in D for k in ROK_KLEUREN], lambda los, d, k: {'Ø70 cm': 389.0, 'Ø80 cm': 409.0, 'Ø85 cm': 429.0}[d],
           lambda d, k: [('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': 'Wit', 'Uitvoering': 'Zonder parasolgat'}, 4), ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, 4)],
           [img('pakket-4-statafels-met-stretchrokken-zwart-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart', 'position': [x, 0, z]}
                                                                                                    for x, z in [(-0.6, -0.5), (0.6, -0.5), (-0.6, 0.6), (0.6, 0.6)]]}, 'hero', 'Zwart', 'existing')] +
           [i for i in rok_imgs('x') if i['kleur'] != 'Zwart'], {**rok_vmap, 'Zwart': 'pakket-4-statafels-met-stretchrokken-zwart-hero.webp'}, 'Kleur',
           '4 statafels + 4 stretchrokken met topcover · één kleur', 'Voor het tuinfeest of de kantine: vier complete statafels; Statafelshop heeft geen 4-pakket.',
           ['4 statafels met rok', 'statafels set'], ['statafelrokken-hoezen.actiepakketten'], ['gebruik:tuinfeest', 'gebruik:evenement', 'badge:nieuw'], sku='4STF')
    KAR = ['5 statafels + kleine kar', '10 statafels + grote kar', '15 statafels + grote kar']
    karn = {KAR[0]: (5, 'Klein, voor 5 statafels'), KAR[1]: (10, 'Groot, voor 15 statafels'), KAR[2]: (15, 'Groot, voor 15 statafels')}
    bundle('pakket-statafels-met-transportkar', 'Statafels met transportkar (pakket)', [opt('Uitvoering', KAR), opt('Maat', D)],
           [(u, d) for u in KAR for d in D], lambda los, u, d: float(x9(0.9 * los)),
           lambda u, d: [('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': 'Wit', 'Uitvoering': 'Zonder parasolgat'}, karn[u][0]), ('transportkar-statafels', {'Uitvoering': karn[u][1]}, 1)],
           [img('pakket-statafels-met-transportkar-hero.webp', 'hero', 1, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 10, 'tableTop': 'wit'}, 'hero', None, 'needs-model')], None, None,
           'Inklapbare statafels Professional (wit blad) op een transportkar', 'Voor verhuur, horeca en verenigingen: opslaan en rijden; besparing t.o.v. los noemen.',
           ['statafels met trolley', 'statafel transportkar pakket'], ['statafelrokken-hoezen.actiepakketten', 'tafels-stoelen.bundels'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'statafelshop': 'kar + 5 Savannah €780,45 · groot + 15 Colorado €1.692,79', 'outmate': '10x + trolley €2.299–€2.335'}, sku='KAR', verz='pallet')
    K6 = ['Wit', 'Zwart', 'Antraciet', 'Marineblauw', 'Crème', 'Bordeaux']
    bundle('pakket-statafels-stretchrokken-transportkar', 'Statafels met stretchrokken en transportkar (pakket)', [opt('Uitvoering', KAR), opt('Maat', D), opt('Kleur', K6)],
           [(u, d, k) for u in KAR for d in D for k in K6], lambda los, u, d, k: float(x9(0.89 * los)),
           lambda u, d, k: [('statafel-inklapbaar-professional', {'Maat': d, 'Kleur': 'Wit', 'Uitvoering': 'Zonder parasolgat'}, karn[u][0]),
                            ('statafelrok-stretch', {'Maat': rokmaat(d), 'Uitvoering': 'Met topcover', 'Kleur': k}, karn[u][0]),
                            ('transportkar-statafels', {'Uitvoering': karn[u][1]}, 1)],
           [img(f'pakket-statafels-stretchrokken-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'statafel', 'size': 'groot', 'loaded': 10, 'position': [-0.9, 0, 0]},
                           {'model': 'statafelCover', 'type': 'stretch', 'color': render_color(k), 'diameter': 0.8, 'topcover': render_color(k), 'position': [0.7, 0, 0]}]}, 'hero', k, 'needs-model')
            for k in ['Zwart'] + [x for x in K6 if x != 'Zwart']],
           {k: f'pakket-statafels-stretchrokken-transportkar-{slug(k)}-hero.webp' for k in K6}, 'Kleur',
           'Statafels, stretchrokken met topcover en transportkar · 6 zakelijke kleuren', 'Compleet verhuurpakket; kleur = rokken; besparing t.o.v. los.',
           ['statafels met rokken en trolley', 'statafel verhuurpakket'], ['statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'statafelshop': 'kar klein + Colorado + rokken €1.148,29 · groot €1.996,50'}, sku='KARROK', verz='pallet')
    bundle('terraspakket-statafel-barkrukken', 'Terraspakket: statafel, stretchrok en 4 barkrukken', [opt('Kleur', ROK_KLEUREN)], [(k,) for k in ROK_KLEUREN],
           lambda los, k: 229.0,
           lambda k: [('statafel-inklapbaar-professional', {'Maat': 'Ø80 cm', 'Kleur': 'Wit', 'Uitvoering': 'Zonder parasolgat'}, 1), ('statafelrok-stretch', {'Maat': 'Ø80-85 cm', 'Uitvoering': 'Met topcover', 'Kleur': k}, 1),
                      ('barkruk-stapelbaar-metaal', {'Kleur': 'Zwart'}, 4)],
           [img('terraspakket-statafel-barkrukken-zwart-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'statafelCover', 'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart'}] +
                                                                                      [{'model': 'barStool', 'style': 'metaal', 'color': 'zwart', 'position': p} for p in [[0.7, 0, 0], [-0.7, 0, 0], [0, 0, 0.7], [0, 0, -0.7]]]},
                'hero', 'Zwart', 'needs-model')] + [i for i in rok_imgs('x') if i['kleur'] != 'Zwart'],
           {**rok_vmap, 'Zwart': 'terraspakket-statafel-barkrukken-zwart-hero.webp'}, 'Kleur',
           'Statafel Ø80 + stretchrok met topcover + 4 zwarte barkrukken', 'Complete sta-plek voor terras of kantine; kleur = rok.',
           ['statafel met barkrukken', 'statafel set barkrukken'], ['statafelrokken-hoezen.actiepakketten'], ['gebruik:horeca', 'gebruik:tuinfeest'],
           {'statafelshop': 'Colorado + rok + 4 Angara €411,40'}, sku='TERRAS')
    BK = ['Wit', 'Zwart', 'Antraciet']
    bundle('buffetpakket-klaptafels-stretchhoezen', 'Buffetpakket: 10 klaptafels met stretchhoezen en transportkar', [opt('Kleur', BK)], [(k,) for k in BK],
           lambda los, k: float(x9(0.89 * los)),
           lambda k: [('klaptafel-hdpe-rechthoekig', {'Maat': '183 x 76 cm', 'Uitvoering': 'Vast blad'}, 10), ('stretchhoes-klaptafel', {'Maat': '183 x 76 cm', 'Kleur': k}, 10),
                      ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 10 klaptafels 183 cm'}, 1)],
           [img('buffetpakket-klaptafels-stretchhoezen-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'buffetCover', 'length': 1.83, 'width': 0.76, 'color': 'zwart', 'position': [0, 0, 0]},
                                                                                                  {'model': 'trolley', 'kind': 'klaptafel', 'loaded': 9, 'position': [1.6, 0, -0.4]}]}, 'hero', 'Zwart', 'needs-model')] +
           [img(f'stretchhoes-klaptafel-{slug(k)}-hero.webp', 'variant', 3, 'buffetCover', {'length': 1.83, 'width': 0.76, 'color': render_color(k), 'kind': 'klaptafel'}, 'hero', k, 'needs-model',
                extra={'shared_with': 'stretchhoes-klaptafel'}) for k in ['Wit', 'Antraciet']],
           {'Zwart': 'buffetpakket-klaptafels-stretchhoezen-hero.webp', 'Wit': 'stretchhoes-klaptafel-wit-hero.webp', 'Antraciet': 'stretchhoes-klaptafel-antraciet-hero.webp'}, 'Kleur',
           '10 klaptafels 183 x 76 cm + 10 stretchhoezen + transportkar', 'Catering en evenementen: buffet- of vergaderopstelling in één keer.',
           ['buffettafels set', 'klaptafels met hoezen'], ['statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'statafelshop': '25 buffettafels + rokken + platen + kar €5.196,95'}, sku='BUFFET', verz='pallet')
    bundle('biertafelsets-10-stuks', 'Biertafelsets 10 stuks (pakket)', [opt('Maat', ['220 x 50 cm', '220 x 70 cm'])], [('220 x 50 cm',), ('220 x 70 cm',)],
           lambda los, m: float(x9(0.88 * los)),
           lambda m: [('biertafelset', {'Maat': m, 'Uitvoering': 'Set: tafel en 2 banken'}, 10)],
           [img('biertafelsets-10-stuks-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'biertafelset', 'length': 2.2, 'tableWidth': 0.5, 'position': [0, 0, z]} for z in [-1.2, 0, 1.2]]}, 'hero', None, 'existing')],
           None, None, '10 sets: tafel + 2 banken · vurenhout', 'Voor verenigingen en buurtfeesten: tien sets, besparing t.o.v. los.',
           ['biertafelsets 10 stuks', 'feestsets vereniging'], ['tafels-stoelen.biertafels', 'statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'pallet', 'gebruik:tuinfeest'],
           {'statafelshop': '10 biertafels standaard vanaf €1.017,55 (alleen tafels)'}, sku='BTS10', verz='pallet')
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
    CM = ['3 x 3 m', '3 x 6 m', '4 x 4 m']
    th = {'3 x 3 m': 'easy-up-partytent-professional-3x3', '3 x 6 m': 'easy-up-partytent-professional-3x6', '4 x 4 m': 'easy-up-partytent-professional-4x4'}
    bundle('compleet-pakket-easy-up-professional', 'Compleet pakket easy-up Professional', [opt('Maat', CM), opt('Kleur', TENT_KLEUREN)], [(m, k) for m in CM for k in TENT_KLEUREN],
           lambda los, m, k: float(x9(0.9 * los)),
           lambda m, k: [(th[m], {'Uitvoering': 'Polyester', 'Kleur': k}, 1), ('zijwandenset-easy-up', {'Maat': m, 'Kleur': k}, 1),
                         ('voetgewicht-easy-up-15-kg', {'Uitvoering': 'Set van 6' if m == '3 x 6 m' else 'Set van 4'}, 1)],
           *(lambda: (lambda imgs: (imgs, {i['kleur']: i['file'] for i in imgs}))(
               [img(f'compleet-pakket-easy-up-professional-{slug(k)}-hero.webp', 'hero' if k == 'Rood' else 'variant', 1 if k == 'Rood' else 3, 'easyUpTent',
                    tent_params('3 x 3 m', 'professional', k, walls={'back': 'window', 'left': 'closed', 'right': 'door'}, weights=2), 'hero', k, 'existing') for k in TENT_KLEUREN]))(),
           'Kleur', 'Professional-tent + zijwandenset + voetgewichten (15 kg per poot)', 'Zakelijk startklaar: tent, wanden en verzwaring in één keer; besparing noemen.',
           ['easy up professional set', 'partytent compleet pakket'], ['easy-up-partytenten.easy-up-professional', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:markt'], sku='EUPRO', verz='pallet')
    BKK = ['Zwart', 'Wit', 'Antraciet']
    bundle('pakket-24-barkrukken-met-transportkar', '24 barkrukken met transportkar (pakket)', [opt('Kleur', BKK)], [(k,) for k in BKK],
           lambda los, k: float(x9(0.9 * los)),
           lambda k: [('barkruk-stapelbaar-metaal', {'Kleur': k}, 24), ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 24 barkrukken'}, 1)],
           [img(f'pakket-24-barkrukken-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'barkruk', 'loaded': 24, 'stoolColor': render_color(k), 'position': [-0.5, 0, 0]},
                           {'model': 'barStool', 'style': 'metaal', 'color': render_color(k), 'position': [0.8, 0, 0.2]}]}, 'hero', k, 'needs-model') for k in BKK],
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
                                                                                                                       for p in [[0.75, 0, 0], [-0.75, 0, 0], [0, 0, 0.75], [0, 0, -0.75]]]}, 'hero', None, 'needs-model')],
           None, None, 'Wijnvat-statafel + 4 barkrukken met houten zitting', 'Sfeerset voor terras en feestzaal; besparing t.o.v. los.',
           ['wijnvat set', 'barrel set statafel'], ['tafels-stoelen.barrels-sets', 'statafelrokken-hoezen.actiepakketten'], ['gebruik:horeca', 'pallet'],
           {'outmate': 'Barrel-set 1 + 4 €775 (was €895)'}, sku='VAT', verz='pallet')
