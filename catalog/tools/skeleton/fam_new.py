import math
# Catalog round 2026-10-18: new lines against the live reference (H4 ronde terrastafel, H5 bankettafels, conferentie- en examentafels,
# H10 koelkasten en vriezers, M7 Premium full colour, M9 weddingstoel en stoelhoes, M12 koordsysteem, M13 tentvloer en kapstok, M18
# dwarsbuis halve zijwand, M19 tafel-onderdelen, M20 pakketten) plus the add-ons and links they need. Prices ca. 5-15% under the lower
# reference (kk_base.under); every price, spec and capacity is a definition for the owner and the supplier (docs/claims-to-confirm.md).
from kk_base import *
from fam_acc import simple, eu_all, EU_PRINT
from fam_easyup import PREM, tent_params, x9
from fam_tafel import STF_TOPS, STF_UITV, STF_BUITEN, STF_TOP_EXTRA, stf_combos, stf_extra, stf_sku_suffix, top_param, frame_of
from fam_set import bundle


def build():
    # ------------------------------------------------------------ terrastafel rond (H4)
    # the round line on the Professional onderstel at 75 cm: the same bladdecors and onderstel colours as the statafel, so a terras and a
    # sta-plek match; parasolgat binnen and buiten
    TR = {'Ø70 cm': (79.95, 11), 'Ø80 cm': (84.95, 12), 'Ø85 cm': (89.95, 13)}
    TRU = ['Binnen, zwart onderstel', 'Binnen, wit onderstel', 'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel',
           'Buiten (compact HPL), zwart onderstel, met parasolgat']
    TRK = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Berken', 'Leisteen', 'Eiken']
    vs = [variant(f'KK-MEU-TERR-{code(m)}-{COLOR_CODE[k]}' + stf_sku_suffix(u), [m, k, u], p + stf_extra(k, u), kg * 1000 + (1500 if u.startswith('Buiten') else 0),
                  inv(12, m + k + u))
          for m, (p, kg) in TR.items() for k, u in stf_combos(TRK, TRU)]
    imgs, vmap = kleur_images('terrastafel-rond-inklapbaar', TRK, 'statafel', lambda k: {'diameter': 0.8, 'height': 0.75, 'top': top_param(k), 'frame': 'zwart', 'base': 'klap'},
                              'Wit', [img('terrastafel-rond-inklapbaar-wit-wit-onderstel.webp', 'variant', 2, 'statafel',
                                          {'diameter': 0.8, 'height': 0.75, 'top': 'wit', 'frame': 'wit', 'base': 'klap'}, 'hero', 'Wit', 'needs-param',
                                          alt='wit blad op een wit onderstel'),
                                      img('terrastafel-rond-inklapbaar-ingeklapt.webp', 'detail', 3, 'statafel',
                                          {'diameter': 0.8, 'height': 0.75, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'folded': True}, 'hero', 'Wit', 'needs-param',
                                          alt='ingeklapt')], status='needs-param', p2=2)
    simple('terrastafel-rond-inklapbaar', 'Terrastafel rond inklapbaar', 'Terrastafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Maat', list(TR)), opt('Kleur', TRK), opt('Uitvoering', TRU)], vs, imgs,
           {'kenmerk_kort': '75 cm hoog · Ø70, Ø80 of Ø85 cm · zelfde bladen als de statafel', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket',
            'vergelijk_groep': 'terrastafel', 'garantie': '2 jaar', 'addon_eenmalig': ['transportkar-terrastafels'],
            'specificaties': [sp('Blad', 'Diameter', 'Ø70, Ø80 of Ø85 cm'), sp('Blad', 'Binnen', 'HPL-toplaag op 18 mm plaat, kantenband rondom'),
                              sp('Blad', 'Buiten', 'Massief compact HPL 12 mm, weer- en UV-bestendig'),
                              sp('Onderstel', 'Materiaal', 'Staal, zwart of wit epoxy-gepoedercoat, kolom Ø 32 mm, 4 inklapbare poten'),
                              sp('Afmetingen', 'Hoogte', '75 cm'), sp('Afmetingen', 'Ingeklapt', 'ca. 105 x 80 x 15 cm (Ø80)'), sp('Gewicht', 'Totaal', '11–14,5 kg')],
            'gewicht_kg': 12, 'verpakt': '107 x 82 x 16 cm (Ø80)'},
           ['tafels-stoelen.terrastafels'], 'meubilair',
           'De ronde terrastafel op het onderstel van de statafel Professional: 75 cm hoog, klapt in één beweging in, zelfde bladdecors en onderstelkleuren als de statafel, buiten in compact HPL; hoeveel stoelen per maat.',
           ['terrastafel rond', 'ronde terrastafel inklapbaar', 'bistrotafel rond 80 cm'],
           {'statafelshop': 'Terrastafel Rio Negro vanaf €81,01 · Yukon vanaf €90,69 · Minnesota vanaf €79,80 · Mississippi vanaf €151,25', 'ours': {m: v[0] for m, v in TR.items()}},
           vmap=vmap, extra={'variant_image_sku': {f'KK-MEU-TERR-{code(m)}-WIT{stf_sku_suffix(u)}': 'terrastafel-rond-inklapbaar-wit-wit-onderstel.webp'
                                                    for m in TR for u in TRU if 'wit onderstel' in u}})

    # ------------------------------------------------------------ bankettafels, conferentie- en examentafels (H5)
    WOOD = 'Multiplex blad 18 mm met een slijtvaste melamine toplaag'
    BR = {'122 x 76 cm': (79.95, 15, 6), '153 x 76 cm': (99.0, 18, 6), '183 x 76 cm': (109.0, 22, 8), '220 x 76 cm': (139.0, 26, 10)}
    simple('bankettafel-hout-rechthoekig', 'Bankettafel met houten blad rechthoekig', 'Klaptafel', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', list(BR))], [variant(f'KK-MEU-BKT-{code(m)}', [m], p, kg * 1000, inv(20, m + 'bkt')) for m, (p, kg, n) in BR.items()],
           [img('bankettafel-hout-rechthoekig-hero.webp', 'hero', 1, 'klaptafel', {'length': 1.83, 'width': 0.76, 'height': 0.74, 'top': 'hout'}, 'hero', None, 'needs-param'),
            img('bankettafel-hout-rechthoekig-ingeklapt.webp', 'detail', 3, 'klaptafel', {'length': 1.83, 'width': 0.76, 'folded': True, 'top': 'hout'}, 'hero', None, 'needs-param',
                alt='poten ingeklapt')],
           {'kenmerk_kort': 'Houten blad · 74 cm hoog · 122 tot 220 cm · poten klappen in', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet',
            'specificaties': [sp('Blad', 'Materiaal', WOOD), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, 2 inklapbare pootframes met vergrendeling'),
                              sp('Afmetingen', 'Hoogte', '74 cm')]},
           ['tafels-stoelen.klaptafels'], 'meubilair',
           'De klassieke bankettafel voor diner, vergadering en buffet: houten blad, poten klappen onder het blad; 4 lengtes met aantal personen; met rok of hoes tot de grond.',
           ['bankettafel', 'bankettafel hout', 'inklapbare tafel 183 cm', 'buffettafel hout'],
           {'outmate': 'houten blad 122x76 €89 · 153x76 €115 · 183x76 €119 · 220x76 €159', 'statafelshop': 'bankettafel 122x76 €126,99 · 183x76 €145,14',
            'ours': {m: v[0] for m, v in BR.items()}})
    BRD = {'Ø122 cm': (109.0, 20), 'Ø153 cm': (129.0, 27), 'Ø165 cm': (179.0, 31), 'Ø183 cm': (219.0, 36)}
    simple('bankettafel-hout-rond', 'Bankettafel met houten blad rond', 'Klaptafel', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', list(BRD))], [variant(f'KK-MEU-BKR-{code(m)}', [m], p, kg * 1000, inv(10, m + 'bkr')) for m, (p, kg) in BRD.items()],
           [img('bankettafel-hout-rond-hero.webp', 'hero', 1, 'klaptafel', {'shape': 'rond', 'diameter': 1.53, 'height': 0.74, 'top': 'hout'}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Rond houten blad Ø 122 tot 183 cm · 6 tot 12 personen', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet',
            'specificaties': [sp('Blad', 'Materiaal', WOOD), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, inklapbaar'), sp('Afmetingen', 'Hoogte', '74 cm')]},
           ['tafels-stoelen.klaptafels'], 'meubilair',
           'Ronde bankettafel voor diner en bruiloft: 6 (Ø122) tot 12 (Ø183) personen, houten blad, poten klappen in; kleed tot de grond per maat.',
           ['ronde bankettafel', 'ronde tafel 8 personen', 'ronde klaptafel hout'],
           {'outmate': 'inklapbare tafel rond Ø122 €119 · Ø153 €149 · houten blad Ø183 €249', 'statafelshop': 'Ø122 €143,93 · Ø153 €211,15 · Ø165 €278,24 · Ø183 €332,69',
            'ours': {m: v[0] for m, v in BRD.items()}})
    # catalog round 4: halfrond Ø140, kwartrond 170/80 and the set of 4 kwartronde tafels that close a circle of Ø 305 cm (reference € 102,50 /
    # € 189 / € 555,90 = 4 x its 152/76 kwartrond at € 139); the 152/76 kwartrond to € 129 (was 14% under the reference), the set 5% under 4 los
    KV = [('Halfrond', 'Ø122 cm', 94.95, 9), ('Halfrond', 'Ø140 cm', 96.95, 10.5), ('Halfrond', 'Ø153 cm', 99.0, 12), ('Kwartrond', '122 x 76 cm', 109.0, 11),
          ('Kwartrond', '152 x 76 cm', 129.0, 13), ('Kwartrond', '170 x 80 cm', 169.0, 15), ('Kwartrond', '183 x 91 cm', 179.0, 17),
          ('Kwartrond, set van 4', 'Ø305 cm', 489.0, 52), ('Ovaal', '243 x 122 cm', 149.0, 30), ('Vierkant', '140 x 140 cm', 139.0, 24)]
    KVM = ['Ø122 cm', 'Ø140 cm', 'Ø153 cm', 'Ø305 cm', '122 x 76 cm', '152 x 76 cm', '170 x 80 cm', '183 x 91 cm', '243 x 122 cm', '140 x 140 cm']
    KV_IMG = {'Halfrond': 'klaptafel-hout-halfrond.webp', 'Kwartrond': 'klaptafel-hout-kwartrond.webp', 'Kwartrond, set van 4': 'klaptafel-hout-kwartrond-set-van-4.webp',
              'Ovaal': 'klaptafel-hout-ovaal.webp', 'Vierkant': 'klaptafel-hout-vierkant.webp'}
    simple('klaptafel-hout-vormen', 'Klaptafel met houten blad: halfrond, kwartrond, ovaal of vierkant', 'Klaptafel', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', KVM), opt('Uitvoering', ['Halfrond', 'Kwartrond', 'Kwartrond, set van 4', 'Ovaal', 'Vierkant'])],
           [variant(f'KK-MEU-KLV-{u[:3].upper()}-{code(m)}', [m, u], p, kg * 1000, inv(8, m + u)) for u, m, p, kg in KV],
           [img(KV_IMG['Halfrond'], 'hero', 1, 'klaptafel', {'shape': 'halfrond', 'diameter': 1.53, 'top': 'hout'}, 'hero', None, 'needs-param')] +
           [img(KV_IMG[u], 'variant', 2, 'klaptafel', {'shape': u.lower(), 'top': 'hout'}, 'hero', None, 'needs-param') for u in ['Kwartrond', 'Ovaal', 'Vierkant']] +
           [img(KV_IMG['Kwartrond, set van 4'], 'variant', 2, 'klaptafel', {'shape': 'kwartrond', 'count': 4, 'arrangement': 'cirkel', 'diameter': 3.05, 'top': 'hout'},
                'top', None, 'needs-param', alt='4 kwartronde tafels als cirkel van Ø 305 cm, van boven')],
           {'kenmerk_kort': 'Houten blad · 74 cm · om tafels aan te sluiten tot een U, cirkel of slang', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet',
            'specificaties': [sp('Blad', 'Materiaal', WOOD), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, inklapbaar'), sp('Afmetingen', 'Hoogte', '74 cm'),
                              sp('Aansluiten', 'Op', 'Bankettafels 76 cm diep (halfrond Ø153 op 153 en 183 cm lang, kwartrond als hoek of slang)')]},
           ['tafels-stoelen.klaptafels'], 'meubilair',
           'Vormen om bankettafels aan te sluiten: halfrond als kop, kwartrond voor bochten en cirkels (4 = Ø 305 cm), ovaal en vierkant 140 voor een grote groep; opstellingen.',
           ['halfronde tafel', 'kwartronde klaptafel', 'ovale klaptafel', 'vierkante klaptafel 140'],
           {'outmate': 'halfrond Ø122 €109 · Ø140 €102,50 · Ø153 €115 · kwartrond 122/76 €129 · 152/76 €139 · 170/80 €189 · 183/91 €199 · set van 4 kwartrond Ø305 €555,90 · ovaal 243x122 €169 · vierkant 140 €159 (live, 2026-10-18)',
            'ours': {f'{u} {m}': p for u, m, p, kg in KV}}, vmap=KV_IMG, vby='Uitvoering')
    # catalog round 3: the T-onderstel is the dearer frame at both references (Statafelshop U €169,40-217,80, T zwart €199,65-248,05,
    # T chroom €254,10-307,34; Outmate T €214,50, U €188,50); ours had T under U and no chroom. Ca. 10% under Statafelshop per frame and
    # length; the blad colour does not change the price (as there).
    CF = {'120 x 80 cm': {'U-onderstel zwart': 149.0, 'T-onderstel zwart': 179.0, 'T-onderstel chroom': 229.0},
          '140 x 80 cm': {'U-onderstel zwart': 159.0, 'T-onderstel zwart': 189.0, 'T-onderstel chroom': 239.0},
          '160 x 80 cm': {'U-onderstel zwart': 179.0, 'T-onderstel zwart': 209.0, 'T-onderstel chroom': 259.0},
          '180 x 80 cm': {'U-onderstel zwart': 199.0, 'T-onderstel zwart': 219.0, 'T-onderstel chroom': 279.0}}
    CFU = ['T-onderstel zwart', 'T-onderstel chroom', 'U-onderstel zwart']
    CFC = {'T-onderstel zwart': 'TZ', 'T-onderstel chroom': 'TC', 'U-onderstel zwart': 'U'}
    CFK = ['Wit', 'Lichtgrijs', 'Berken']
    vs = [variant(f'KK-MEU-CONF-{code(m)}-{CFC[u]}-{COLOR_CODE[k]}', [m, u, k], p[u],
                  (22 + int(m[:3]) // 20) * 1000, inv(8, m + u + k)) for m, p in CF.items() for u in CFU for k in CFK]
    imgs, vmap = kleur_images('conferentietafel-inklapbaar', CFK, 'klaptafel', lambda k: {'length': 1.6, 'width': 0.8, 'height': 0.74, 'top': render_color(k), 'frame': 't'},
                              'Wit', [img('conferentietafel-inklapbaar-wit-t-chroom.webp', 'detail', 3, 'klaptafel',
                                          {'length': 1.6, 'width': 0.8, 'height': 0.74, 'top': 'wit', 'frame': 't', 'frameColor': 'chroom'}, 'hero', 'Wit', 'needs-param',
                                          alt='met verchroomd T-onderstel'),
                                      img('conferentietafel-inklapbaar-wit-u-onderstel.webp', 'detail', 3, 'klaptafel',
                                          {'length': 1.6, 'width': 0.8, 'height': 0.74, 'top': 'wit', 'frame': 'u', 'frameColor': 'zwart'}, 'hero', 'Wit', 'needs-param',
                                          alt='met zwart U-onderstel')], status='needs-param', p2=3)
    simple('conferentietafel-inklapbaar', 'Conferentietafel inklapbaar', 'Klaptafel', ['zakelijk'], [opt('Maat', list(CF)), opt('Uitvoering', CFU), opt('Kleur', CFK)], vs, imgs,
           {'kenmerk_kort': '80 cm diep · T- of U-onderstel · koppelbaar · 120 tot 180 cm', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet',
            'specificaties': [sp('Blad', 'Materiaal', 'Spaanplaat 25 mm met melamine toplaag en ABS-kantband'),
                              sp('Onderstel', 'T-onderstel', 'Staal, 2 klapbare T-poten met voetbalk: beenruimte over de hele lengte; zwart gepoedercoat of verchroomd'),
                              sp('Onderstel', 'U-onderstel', 'Staal, 2 klapbare U-frames, zwart gepoedercoat: eenvoudig en stevig'), sp('Afmetingen', 'Hoogte', '74 cm'),
                              sp('Koppelen', 'Klemmen', '2 tafelkoppelingen per tafel')]},
           ['tafels-stoelen.klaptafels'], 'meubilair',
           'Vergader- en trainingstafel die je inklapt en stapelt: 80 cm diep (2 personen tegenover elkaar), T-onderstel voor beenruimte of U voor stabiliteit; koppelen tot een carré of U-opstelling.',
           ['conferentietafel inklapbaar', 'vergadertafel klapbaar', 'trainingstafel'], {'statafelshop': 'U €169,40–217,80 · T zwart €199,65–248,05 · T chroom €254,10–307,34', 'outmate': 'T €214,50 · U €188,50 · kar 15 stuks €582,50', 'ours': CF},
           vmap=vmap)
    EX = {'1 stuk': (71.95, 1), 'Set van 10': (649.0, 10)}
    simple('examentafel-inklapbaar', 'Examentafel inklapbaar 90 x 60 cm', 'Klaptafel', ['zakelijk'], [opt('Maat', ['90 x 60 cm']), opt('Uitvoering', list(EX))],
           [variant(f'KK-MEU-EXA-90X60' + ('' if n == 1 else f'-S{n}'), ['90 x 60 cm', u], p, 9000 * n, inv(30, u + 'exa')) for u, (p, n) in EX.items()],
           [img('examentafel-inklapbaar-hero.webp', 'hero', 1, 'klaptafel', {'length': 0.9, 'width': 0.6, 'height': 0.74, 'top': 'berken'}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': '90 x 60 cm · 1 persoon · klapt plat in · per 10', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet',
            'specificaties': [sp('Blad', 'Materiaal', 'Spaanplaat 18 mm met melamine toplaag, berkenlook'), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, poten klappen plat'),
                              sp('Afmetingen', 'Hoogte', '74 cm'), sp('Gewicht', 'Per tafel', 'ca. 9 kg')]},
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Eenpersoons tafel voor examens, toetsen en trainingen in de sporthal of aula: plat ingeklapt, 30 op een kar; per 10 voordeliger.',
           ['examentafel', 'examentafels kopen', 'eenpersoonstafel inklapbaar'], {'outmate': 'Examentafel 90 x 60 cm €79,50 · kar 30 stuks €378,50', 'ours': {u: v[0] for u, v in EX.items()}})
    TKK = HANDLES['transportkar-klaptafels-en-stoelen']
    TKK['metafields']['past_op'] = list(TKK['metafields']['past_op']) + ['bankettafel-hout-rechthoekig', 'conferentietafel-inklapbaar', 'examentafel-inklapbaar', 'klapstoel-wedding']
    # the accessories the new tables are offered with fit them (validate.check_addon_fit: an add-on lists the product in past_op)
    for acc, table in (('beschermplaat-statafel', 'terrastafel-rond-inklapbaar'), ('statafelkleed-rond-tot-de-grond', 'bankettafel-hout-rond'),
                       ('stretchhoes-klaptafel', 'bankettafel-hout-rechthoekig')):
        mfa = HANDLES[acc]['metafields']
        mfa['past_op'] = list(mfa.get('past_op') or []) + [table]
    TKR = HANDLES['transportkar-ronde-klaptafels']
    TKR['metafields']['past_op'] = list(TKR['metafields']['past_op']) + ['bankettafel-hout-rond']

    # ------------------------------------------------------------ koelkasten en vriezers (H10)
    KTAGS = ['zakelijk', 'gebruik:horeca', 'gebruik:evenement']
    BK = {'128 liter': (539.0, 38, '50 x 52 x 85 cm'), '198 liter': (569.0, 46, '60 x 56 x 110 cm'), '320 liter': (829.0, 68, '60 x 60 x 173 cm')}
    # catalog round 4 (option noise): one colour only, so no one-value Kleur option (the colour is in the specs)
    simple('barkoelkast-glazen-deur', 'Barkoelkast met glazen deur', 'Koeling', KTAGS + ['pallet'], [opt('Uitvoering', list(BK))],
           [variant(f'KK-KOEL-BAR-{u.split()[0]}', [u], p, kg * 1000, inv(4, u + 'bar')) for u, (p, kg, d) in BK.items()],
           [img('barkoelkast-glazen-deur-hero.webp', 'hero', 1, 'fridge', {'kind': 'bar', 'door': 'glas', 'litres': 198, 'color': 'zwart', 'light': True}, 'hero', 'Zwart', 'needs-model',
                alt='zwart, met glazen deur en LED-verlichting, gevuld met flessen (flessen niet inbegrepen)')],
           {'kenmerk_kort': 'Glazen deur · LED-binnenlicht · 2–10 °C · 128, 198 of 320 liter', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Uitvoering', 'Kleur', 'Zwart'), sp('Koeling', 'Temperatuur', '2 tot 10 °C, digitaal instelbaar'), sp('Koeling', 'Klimaatklasse', 'N (16–32 °C omgeving)'),
                              sp('Uitvoering', 'Deur', 'Dubbel glas, slot, deur links of rechts te hangen'), sp('Uitvoering', 'Verlichting', 'LED binnenin'),
                              sp('Afmetingen', '128 / 198 / 320 liter', ' · '.join(d for _, _, d in BK.values()))]},
           ['inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Drankkoelkast voor bar, kantine en evenement: welke inhoud bij hoeveel flessen, opstellen met ventilatieruimte, koelen voor het event begint; geen claims over energielabel zonder datasheet.',
           ['barkoelkast glazen deur', 'drankkoelkast', 'koelkast glazen deur 320 liter'], {'outmate': 'Cooldura barkoelkast 128 l €599 · 198 l €639 · 320 l €925', 'ours': {u: v[0] for u, v in BK.items()}})
    KS = {'Wit': 639.0, 'Zwart': 689.0}
    simple('koelkast-staand-horeca', 'Koelkast staand voor horeca en evenement', 'Koeling', KTAGS + ['pallet'], [opt('Kleur', list(KS))],
           [variant(f'KK-KOEL-STA-{COLOR_CODE[k]}', [k], p, 62000, inv(3, k + 'sta')) for k, p in KS.items()],
           *(lambda imgs: (imgs,))([img('koelkast-staand-horeca-wit-hero.webp', 'hero', 1, 'fridge', {'kind': 'staand', 'door': 'dicht', 'color': 'wit'}, 'hero', 'Wit', 'needs-model'),
                                    img('koelkast-staand-horeca-zwart-hero.webp', 'variant', 2, 'fridge', {'kind': 'staand', 'door': 'dicht', 'color': 'zwart'}, 'hero', 'Zwart', 'needs-model')]),
           {'kenmerk_kort': 'Staand · dichte deur · 0–8 °C · verstelbare roosters', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Koeling', 'Temperatuur', '0 tot 8 °C'), sp('Koeling', 'Inhoud', 'ca. 350 liter'), sp('Uitvoering', 'Binnen', '5 verstelbare roosters'),
                              sp('Afmetingen', 'B x D x H', 'ca. 60 x 65 x 185 cm')]},
           ['inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Staande koelkast voor keuken, catering en backstage: wit of zwart, dichte deur, veel inhoud; verschil met de RVS-horecakoelkast.',
           ['koelkast staand', 'koelkast horeca', 'koelkast zwart staand'], {'outmate': 'Koelkast staand wit/zwart €719 · zwart €769 (actie, was €799)', 'ours': KS},
           vmap={'Wit': 'koelkast-staand-horeca-wit-hero.webp', 'Zwart': 'koelkast-staand-horeca-zwart-hero.webp'})
    KR = {'Dichte deur': (1949.0, 'DI'), 'Glazen deur': (1989.0, 'GL')}
    simple('koelkast-rvs-horeca', 'Koelkast RVS staand, digitaal', 'Koeling', KTAGS + ['pallet'], [opt('Uitvoering', list(KR))],
           [variant(f'KK-KOEL-RVS-{c}', [u], p, 95000, inv(2, u + 'rvs')) for u, (p, c) in KR.items()],
           [img('koelkast-rvs-horeca-hero.webp', 'hero', 1, 'fridge', {'kind': 'rvs', 'door': 'dicht', 'color': 'rvs', 'litres': 600}, 'hero', None, 'needs-model'),
            img('koelkast-rvs-horeca-glazen-deur.webp', 'variant', 2, 'fridge', {'kind': 'rvs', 'door': 'glas', 'color': 'rvs', 'litres': 600}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'RVS · 600 liter · digitale regeling · GN 2/1 · dichte of glazen deur', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Koeling', 'Temperatuur', '-2 tot +8 °C, digitaal'), sp('Koeling', 'Inhoud', 'ca. 600 liter, geschikt voor GN 2/1'),
                              sp('Uitvoering', 'Behuizing', 'RVS binnen en buiten, op zwenkwielen of stelpoten'), sp('Afmetingen', 'B x D x H', 'ca. 70 x 82 x 200 cm')]},
           ['inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Professionele horecakoelkast in RVS: GN 2/1, digitaal, dicht of glas; voor keuken en catering; wat je nodig hebt aan stroom en ruimte.',
           ['koelkast rvs horeca', 'horeca koelkast glazen deur', 'gn koelkast'], {'outmate': 'Koelkast RVS staand digitaal €2.169 · glasdeur €2.215', 'ours': {u: v[0] for u, v in KR.items()}},
           vmap={'Dichte deur': 'koelkast-rvs-horeca-hero.webp', 'Glazen deur': 'koelkast-rvs-horeca-glazen-deur.webp'}, vby='Uitvoering')
    simple('koel-vrieskist-liggend', 'Koel- en vrieskist liggend', 'Koeling', KTAGS + ['pallet'], [],
           [variant('KK-KOEL-KIST-WIT', [], 609.0, 52000, 3)],
           [img('koel-vrieskist-liggend-hero.webp', 'hero', 1, 'fridge', {'kind': 'kist', 'color': 'wit', 'lid': 'open'}, 'hero', 'Wit', 'needs-model', alt='met deksel open')],
           {'kenmerk_kort': 'Liggend · koelen of vriezen met één schakelaar · ca. 300 liter', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Uitvoering', 'Kleur', 'Wit'), sp('Koeling', 'Stand koelen', '+2 tot +8 °C'), sp('Koeling', 'Stand vriezen', '-18 tot -24 °C'), sp('Koeling', 'Inhoud', 'ca. 300 liter'),
                              sp('Uitvoering', 'Deksel', 'Met slot, 2 manden'), sp('Afmetingen', 'B x D x H', 'ca. 110 x 70 x 85 cm')]},
           ['inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Kist die koelt of vriest: ijs, ijsjes en voorraad op het evenement; schakelaar koelen/vriezen; op een trolley rijden.',
           ['vrieskist', 'koelkist liggend', 'vrieskist evenement'], {'outmate': 'Koelkist liggend wit €679 · trolley €375', 'ours': 609.0})
    simple('flessenkoeler-verrijdbaar-1000-liter', 'Flessenkoeler verrijdbaar 1000 liter', 'Koeling', KTAGS + ['pallet'], [],
           [variant('KK-KOEL-FLES-1000', [], 1599.0, 160000, 2)],
           [img('flessenkoeler-verrijdbaar-1000-liter-hero.webp', 'hero', 1, 'fridge', {'kind': 'flessenkoeler', 'litres': 1000, 'wheels': True, 'color': 'zwart'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Ca. 1.000 liter · schuifdeksels · op wielen · voor festival en sporthal', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Koeling', 'Temperatuur', '+2 tot +10 °C'), sp('Koeling', 'Inhoud', 'ca. 1.000 liter (ca. 1.400 flesjes of 30 kratten)'),
                              sp('Uitvoering', 'Deksel', '3 glazen schuifdeksels, slot'), sp('Uitvoering', 'Rijden', '4 zwenkwielen, 2 met rem'),
                              sp('Afmetingen', 'B x D x H', 'ca. 200 x 75 x 90 cm')]},
           ['inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Grote verrijdbare flessenkoeler voor tap en bar op festivals, sportclubs en grote feesten: inhoud in kratten, rijden door een dubbele deur, stroom.',
           ['flessenkoeler 1000 liter', 'verrijdbare koelkast', 'drankkoeler evenement'], {'outmate': 'Verrijdbare flessenkoelkast 1000 l €1.779', 'ours': 1599.0})
    KT = [('Voor staande koelkast', 289.0, 'STA', 22), ('Voor liggende koelkist', 339.0, 'KIST', 28)]
    simple('transportkar-koelkasten', 'Transportkar voor koelkasten en koelkisten', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Uitvoering', [t_[0] for t_ in KT])],
           [variant(f'KK-MEU-TKKL-{c}', [n], p, kg * 1000, inv(3, c + 'tkkl')) for n, p, c, kg in KT],
           [img('transportkar-koelkasten-hero.webp', 'hero', 1, 'trolley', {'kind': 'koelkast', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Plateau met spanbanden · 4 zwenkwielen · voor staande koelkast of koelkist', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['koelkast-staand-horeca', 'koelkast-rvs-horeca', 'barkoelkast-glazen-deur', 'koel-vrieskist-liggend'],
            'specificaties': [sp('Kar', 'Staande koelkast', 'Plateau ca. 75 x 75 cm, tot 150 kg, 2 spanbanden'), sp('Kar', 'Liggende koelkist', 'Plateau ca. 120 x 80 cm, tot 200 kg')]},
           ['tafels-stoelen.trolleys', 'inrichting-evenement.koelkasten-en-vriezers'], 'koeling',
           'Koelkast of koelkist rijden in plaats van tillen: plateau met spanbanden; welke kar bij welke koeling.',
           ['transportkar koelkast', 'trolley koelkist'], {'outmate': 'trolley staande koelkasten €325 · liggende koelkist €375', 'ours': {t_[0]: t_[1] for t_ in KT}})
    # catalog round 4: the kar carries ONE koelkast or koelkist, so it follows the quantity (3 koelkasten, 3 karren) and is no
    # addon_eenmalig (it was: 3 fridges got 1 kar)

    # ------------------------------------------------------------ Premium full colour (M7)
    h = 'easy-up-partytent-premium-full-colour-bedrukt'
    # catalog round 4: ca. 10% under the reference's Premium full colour (3x3 € 625, 3x4,5 € 859, 3x6 € 999; live data); 3x3 sat 4% above it
    PFC = {'3 x 3 m': (559, 809), '3 x 4,5 m': (769, 1059), '3 x 6 m': (899, 1219)}
    UV = ['Dak en luifel', 'Dak, luifel en 3 zijwanden']
    vs = [variant(f'KK-BDR-EUPRM-FC-{code(m)}-{"DL" if i == 0 else "DLW"}', [m, u], PFC[m][i], (PREM[m][1] + (4 if i else 0)) * 1000, None, tracked=False)
          for m in PFC for i, u in enumerate(UV)]
    fcp = tent_params('3 x 3 m', 'premium', 'Wit', roofPrint={'artwork': 'brand/img/voorbeeld-fullcolour.png', 'note': 'voorbeeldontwerp'})
    add({'handle': h, 'title': 'Easy-up partytent Premium full colour bedrukt', 'product_type': 'Easy-up partytent',
         'tags': ['bedrukbaar', 'zakelijk', 'gebruik:markt', 'gebruik:evenement', 'pallet'],
         'options': [opt('Maat', list(PFC)), opt('Uitvoering', UV)], 'variants': vs,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'canopyRoof', dict(fcp, withFrame=True), 'hero', None, 'needs-param', alt='met voorbeeldontwerp in full colour op dak en luifel'),
                    img(f'{h}-zijwanden-hero.webp', 'variant', 2, 'easyUpTent', dict(fcp, walls={'back': 'closed', 'left': 'closed', 'right': 'closed'}, wallPrint=True), 'hero', None,
                        'needs-param', alt='met voorbeeldontwerp op dak, luifel en 3 zijwanden')],
         'variant_image_by': 'Uitvoering', 'variant_images': {'Dak en luifel': f'{h}-hero.webp', 'Dak, luifel en 3 zijwanden': f'{h}-zijwanden-hero.webp'},
         'metafields': {'kenmerk_kort': '40 mm staal · full colour sublimatie · drukproef vooraf', 'bedrukbaar': True,
                        'drukopties': {'posities': ['Dak', 'Luifel', 'Zijwanden'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'verzending': 'pallet', 'garantie': '1 jaar op het frame'},
         # catalog round 3: add-ons come from kk_addons.r_easy_up_logo (voetgewicht, spanbanden, wieltas, bedrukte achterwand bij 'Dak en luifel')
         'complementary': ['bedrukte-zijwand-easy-up', 'zandzakken-partytent-set-van-4', 'regengoot-partytent', 'koppelset-easy-up', 'afzetpaal-met-logo'],
         'covers': ['easy-up-partytenten.easy-up-premium'], 'family': 'bedrukt-tent', 'weight': 2,
         'copy_brief': 'De stalen Premium helemaal in je huisstijl: dak en luifel (en 3 wanden) in full colour, drukproef vooraf; voor vereniging, school en markt; eerlijk naast de Professional full colour.',
         'seo_keywords': ['bedrukte partytent goedkoop', 'easy up full colour premium', 'partytent bedrukken vereniging'],
         'price_ref': {'outmate': 'Premium full colour bedrukking: 3x3 €625 · 3x4,5 €859 · 3x6 €999 (live, 2026-10-18)', 'rule': 'ca. 10% onder de referentie',
                       'ours': {m: v[0] for m, v in PFC.items()}}})

    # ------------------------------------------------------------ dwarsbuis halve zijwand (M18)
    HDB = {'3 m': 16.95, '4 m': 19.95, '4,5 m': 21.95, '5 m': 22.95, '6 m': 26.95, '8 m': 32.95}
    EU = eu_all()
    simple('dwarsbuis-halve-zijwand-easy-up', 'Dwarsbuis voor halve zijwand easy-up', 'Frame-onderdeel', ['zakelijk', 'gebruik:markt'], [opt('Maat', list(HDB))],
           [variant(f'KK-FRM-HDB-{code(m)}', [m], p, 600 + 250 * i, inv(10, m + 'hdb')) for i, (m, p) in enumerate(HDB.items())],
           [img('dwarsbuis-halve-zijwand-easy-up-hero.webp', 'hero', 1, 'easyUpParts', {'parts': ['dwarsbuis'], 'length': 3}, 'hero', None, 'needs-param',
                alt='aluminium dwarsbuis met twee klemmen')],
           {'kenmerk_kort': 'Aluminium buis met 2 poot-klemmen · houdt de halve wand strak', 'verzending': 'pakket', 'past_op': EU + EU_PRINT + ['halve-zijwand-easy-up'], 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Buis', 'Materiaal', 'Aluminium 25 mm, 2 klemmen voor zeskantpoten 40 en 50 mm'), sp('Buis', 'Hoogte', 'Klemt op ca. 100 cm, de bovenrand van de halve wand')]},
           ['easy-up-accessoires.easy-up-frames-onderdelen'], 'frame',
           'Horizontale buis tussen twee poten waaraan de halve zijwand met klittenband hangt: strak bij wind, ook zonder spanning in het koord; lengte = zijde van de tent.',
           ['dwarsbuis halve zijwand', 'halve zijwand bevestiging'], {'outmate': 'horizontaal buisprofiel met koppelstukken bij halve wand (per URL)', 'ours': HDB})

    # ------------------------------------------------------------ zitten (M9)
    WK = ['Wit', 'Zwart']
    simple('klapstoel-wedding', 'Weddingstoel klapbaar', 'Stoel', ['zakelijk', 'gebruik:evenement'], [opt('Kleur', WK)],
           [variant(f'KK-MEU-WED-{COLOR_CODE[k]}', [k], 29.95, 4200, inv(60, k + 'wed', k)) for k in WK],
           *(lambda ims: (ims,))([img(f'klapstoel-wedding-{slug(k)}-hero.webp', 'hero' if k == 'Wit' else 'variant', 1 if k == 'Wit' else 2, 'chair', {'style': 'wedding', 'color': render_color(k)},
                                      'hero', k, 'needs-param') for k in WK]),
           {'kenmerk_kort': 'Kunststof (resin) · gevoerde zitting · klapt plat · koppelbaar in rijen', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 4.2,
            'addon_eenmalig': ['transportkar-klaptafels-en-stoelen'],
            'specificaties': [sp('Stoel', 'Materiaal', 'Resin (polypropyleen) frame, staal verstevigd'), sp('Stoel', 'Zitting', 'Gevoerd, afneembaar, wit of zwart'),
                              sp('Stoel', 'Zithoogte', '45 cm'), sp('Stoel', 'Belastbaar', 'tot 120 kg'), sp('Rijen', 'Koppelen', 'Met stoelverbinders (inbegrepen: 1 per stoel)')]},
           ['tafels-stoelen.stoelen'], 'meubilair',
           'De klapstoel voor ceremonie en diner: wit of zwart resin, gevoerde zitting, in rijen te koppelen, 26 op een kar; staffel vanaf 10.',
           ['weddingstoel', 'wedding chair', 'klapstoel bruiloft wit'], {'outmate': 'Wedding chair wit €31,10 (actie, was €39) · zwart €39 · 26 + trolley vanaf €1.079', 'ours': 29.95},
           vmap={k: f'klapstoel-wedding-{slug(k)}-hero.webp' for k in WK})
    SHK = ['Wit', 'Zwart', 'Crème', 'Champagne', 'Zilver', 'Antraciet', 'Bordeaux', 'Marineblauw']
    SHU = ['Voor klapstoel', 'Voor stapel- of banquetstoel']
    vs = [variant(f'KK-TEX-STH-{"K" if u == SHU[0] else "S"}-{COLOR_CODE[k]}', [u, k], 5.95 if u == SHU[0] else 6.95, 250, inv(80, u + k + 'sth', k)) for u in SHU for k in SHK]
    imgs, vmap = kleur_images('stoelhoes-stretch', SHK, 'chair', lambda k: {'style': 'klapstoel', 'cover': 'stretch', 'coverColor': render_color(k)}, 'Wit', status='needs-param', p2=3)
    simple('stoelhoes-stretch', 'Stoelhoes stretch', 'Stoelhoes', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', SHU), opt('Kleur', SHK)], vs, imgs,
           {'kenmerk_kort': 'Stretch over de hele stoel · klapstoel of stapelstoel · 8 kleuren', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': ['klapstoel', 'klapstoel-wedding', 'stapelstoel-metaal', 'banquetstoel-gestoffeerd'],
            'specificaties': [sp('Stof', 'Materiaal', 'Polyester-elastaan, ca. 200 g/m², kreukvrij'), sp('Stof', 'Wassen', 'Op 30 °C, niet in de droger'),
                              sp('Pasvorm', 'Voor klapstoel', 'Klapstoelen met een rechte rug tot ca. 82 cm hoog'),
                              sp('Pasvorm', 'Voor stapel- of banquetstoel', 'Stapelstoelen en banquetstoelen tot ca. 92 cm hoog')]},
           ['statafelrokken-hoezen.buffettafel-hoezen', 'tafels-stoelen.stoelen-onderdelen'], 'textiel',
           'Stoel aangekleed voor bruiloft en gala: stretchhoes over de hele stoel, met een strik of sjerp te combineren; pasvorm per stoeltype; staffel.',
           ['stoelhoes stretch', 'stoelhoezen bruiloft', 'stoelhoes klapstoel'], {'note': 'geen Outmate/Statafelshop-prijs; markt stretch stoelhoes €4–€8', 'ours': {SHU[0]: 5.95, SHU[1]: 6.95}}, vmap=vmap)
    HANDLES['klapstoel']['metafields']['addons'] = None   # filled by the add-on rules (kar + hoes)

    # ------------------------------------------------------------ afzetten (M12)
    AK = [('Chroom', 44.95, 'CHR'), ('Messinglook', 44.95, 'MES'), ('Zwart', 44.95, 'ZWA'), ('Wit', 44.95, 'WIT')]
    simple('afzetpaal-met-koord', 'Afzetpaal voor koord met ovale kop', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [a[0] for a in AK])],
           [variant(f'KK-INR-AZK-{c}', [n], p, 7000, inv(30, c + 'azk')) for n, p, c in AK],
           [img('afzetpaal-met-koord-hero.webp', 'hero', 1, 'stanchion', {'finish': 'chroom', 'rope': 'bordeaux', 'pair': True, 'head': 'ovaal'}, 'hero', None, 'needs-param',
                alt='twee palen met een bordeaux koord (koord niet inbegrepen)')],
           {'kenmerk_kort': 'Ovale kop met 4 ogen · verzwaarde voet · voor velours of touw', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket',
            'specificaties': [sp('Paal', 'Hoogte', '100 cm'), sp('Paal', 'Voet', 'Ø 32 cm, verzwaard, ca. 7 kg, rubberen onderkant'),
                              sp('Paal', 'Kop', 'Ovaal met 4 ogen: koorden in elke richting')]},
           ['inrichting-evenement.afzetpalen'], 'inrichting',
           'De klassieke entree met koord (rode loper, première, gala): paal met ovale kop voor koorden, 4 afwerkingen; koord en wandhaak apart.',
           ['afzetpaal koord', 'afzetpaal rode loper', 'paal met koord'], {'outmate': 'afzetpaal ovale kop voor koord €45–€51', 'ours': 44.95})
    KK = ['Bordeaux', 'Rood', 'Zwart', 'Blauw', 'Groen', 'Goud', 'Wit', 'Grijs']
    KO = [('150 cm', 25.95), ('200 cm', 31.95)]
    vs = [variant(f'KK-INR-KRD-{m[:3]}-{COLOR_CODE[k]}', [u, k], p, 900, inv(20, m + k + 'krd', k)) for m, p in KO for u in [f'Koord {m}'] for k in KK]
    imgs, vmap = kleur_images('afzetkoord-velours', KK, 'stanchion', lambda k: {'rope': render_color(k), 'only': 'rope'}, 'Bordeaux', status='needs-param', p2=3)
    simple('afzetkoord-velours', 'Afzetkoord velours met haken', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', ['Koord 150 cm', 'Koord 200 cm']), opt('Kleur', KK)], vs, imgs,
           {'kenmerk_kort': 'Velours koord Ø 32 mm · verchroomde haken · 150 of 200 cm · 8 kleuren', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket',
            'past_op': ['afzetpaal-met-koord'],
            'specificaties': [sp('Koord', 'Materiaal', 'Velours om een touwkern, Ø 32 mm'), sp('Koord', 'Haken', 'Verchroomd, aan beide uiteinden'),
                              sp('Koord', 'Lengte', '150 cm (ca. 1,2 m tussen de palen) of 200 cm (ca. 1,7 m)')]},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Velours koord tussen twee palen voor de koord-afzetting: lengte per afstand tussen de palen, 8 kleuren.',
           ['afzetkoord', 'velours koord afzetpaal', 'rood koord afzetpaal'], {'outmate': 'koord voor afzetpaal 150 cm €29 (10 kleuren), scheepstouw €32', 'ours': dict(KO)}, vmap=vmap)
    AW = [('Wandhaak voor koord, chroom', 9.95, 'WHC', 300), ('Wandhaak voor koord, messinglook', 9.95, 'WHM', 300), ('Wandhaak voor koord, zwart', 9.95, 'WHZ', 300),
          ('Wandunit met trekband 2 m, zwart', 25.95, 'WU2', 900), ('Wandunit met trekband 3 m, zwart', 32.95, 'WU3', 1100),
          ('Bordhouder A4 liggend, zwart', 27.95, 'BA4L', 800), ('Bordhouder A4 staand, zwart', 27.95, 'BA4S', 800), ('Bordhouder A4 liggend, RVS', 32.95, 'BA4R', 800),
          ('Bordhouder A3 liggend, zwart', 34.95, 'BA3L', 1100)]
    AW_IMG = {n: f'onderdelen-afzetsysteem-{slug(n.split(",")[0])}.webp' for n, _, _, _ in AW}
    simple('onderdelen-afzetsysteem', 'Wandhaken, wandunits en bordhouders voor afzetpalen', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [a[0] for a in AW])],
           [variant(f'KK-INR-AZO-{c}', [n], p, g, inv(20, c + 'azo')) for n, p, c, g in AW],
           [img('onderdelen-afzetsysteem-hero.webp', 'hero', 1, 'stanchion', {'parts': ['wandhaak', 'wandunit', 'bordhouder']}, 'hero', None, 'needs-param',
                alt='wandhaak, wandunit en bordhouder')] +
           [img(f, 'variant', 2, 'stanchion', {'parts': [f.split('-')[-1].split('.')[0]]}, 'hero', None, 'needs-param') for f in dict.fromkeys(AW_IMG.values())],
           {'kenmerk_kort': 'Koord of band aan de muur · A4- en A3-bordhouder op de paal', 'verzending': 'pakket',
            'past_op': ['afzetpaal-met-trekband', 'afzetpaal-met-koord', 'afzetpaal-met-logo'],
            'specificaties': [sp('Wandhaak', 'Voor', 'Koordhaak, met 2 schroeven en pluggen'), sp('Wandunit', 'Band', 'Oprolbaar 2 of 3 m, haakt in een paal of een tweede wandunit'),
                              sp('Bordhouder', 'Montage', 'Op de kop van de paal geschroefd, kantelbaar')]},
           ['inrichting-evenement.afzetpalen'], 'inrichting',
           'Het afzetsysteem afmaken: koord of band aan de muur vastzetten, en een bord op de paal (A4 of A3) voor de bewegwijzering.',
           ['wandunit trekband', 'bordhouder afzetpaal', 'wandhaak koord'], {'outmate': 'wandhaak €11 · A4 houder €27,50–€36', 'ours': {a[0]: a[1] for a in AW}},
           vmap=AW_IMG, vby='Uitvoering')
    # catalog round 5 (low): 18-30% under the reference trolleys (16 Premium € 922,50, 14 Professional € 1.010,50); now 16 ca. 6% under the 16-place
    # one and 12 priced per place of the 14-place one (€ 72) less ca. 10%
    TA = [('Voor 12 afzetpalen', 779.0, '12', 45), ('Voor 16 afzetpalen', 869.0, '16', 55)]
    simple('transportkar-afzetpalen', 'Transportkar voor afzetpalen', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Uitvoering', [t_[0] for t_ in TA])],
           [variant(f'KK-MEU-TKAZ-{c}', [n], p, kg * 1000, inv(2, c + 'tkaz')) for n, p, c, kg in TA],
           [img('transportkar-afzetpalen-hero.webp', 'hero', 1, 'trolley', {'kind': 'afzetpaal', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Palen rechtop in vakken · voeten beschermd · zwenkwielen met rem', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['afzetpaal-met-trekband', 'afzetpaal-met-koord', 'afzetpaal-met-logo'],
            'specificaties': [sp('Kar', 'Capaciteit', '12 of 16 afzetpalen met voet Ø 32–36 cm'), sp('Kar', 'Afmetingen', 'ca. 150 x 75 x 110 cm (16)')]},
           ['tafels-stoelen.trolleys', 'inrichting-evenement.afzetpalen'], 'inrichting', 'Afzetpalen rijden en opslaan zonder krassen: elk in een eigen vak.',
           ['transportkar afzetpalen', 'trolley afzetpalen'], {'outmate': 'trolley afzetpalen 14 Professional €1.010,50 · 16 Premium €922,50', 'ours': {t_[0]: t_[1] for t_ in TA}})

    # ------------------------------------------------------------ vloer en garderobe (M13)
    TVK = ['Grijs', 'Zwart']
    vs = [variant(f'KK-INR-TVL-{COLOR_CODE[k]}', [k], 26.95, 3800, None, tracked=False, qrule={'min': 3, 'max': 100, 'increment': 1}) for k in TVK]
    imgs, vmap = kleur_images('tentvloer-kunststof', TVK, 'tentFloor', lambda k: {'color': render_color(k), 'rolled': 'half'}, 'Grijs', status='needs-model', p2=3)
    simple('tentvloer-kunststof', 'Tentvloer kunststof, oprolbaar (per meter)', 'Tentvloer', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Kleur', TVK)], vs, imgs,
           {'kenmerk_kort': 'Oprolbare kunststof vloer · 1 m breed · per meter · op gras', 'verzending': 'pakket', 'addon_modus': 'per-regel', 'staffelkorting': ST_SLANG,
            'specificaties': [sp('Vloer', 'Materiaal', 'Polypropyleen, open structuur zodat gras ademt en water wegloopt'), sp('Vloer', 'Breedte', '100 cm, per meter van de rol'),
                              sp('Vloer', 'Dikte', 'ca. 12 mm'), sp('Vloer', 'Belasting', 'Begaanbaar, niet voor auto\'s')]},
           ['inrichting-evenement.vloeren'], 'inrichting',
           'Droge voeten in de tent op gras: oprolbare vloer per meter (aantal = meters, min. 3), banen naast elkaar; met tapijttegels erop voor een nette afwerking.',
           ['tentvloer', 'partytent vloer', 'kunststof vloer gras'], {'outmate': 'kunststof tentvloer oprolbaar grijs €29', 'ours': 26.95}, vmap=vmap)
    TTK = ['Zwart', 'Grijs', 'Rood', 'Blauw', 'Groen']
    vs = [variant(f'KK-INR-TTG-{COLOR_CODE[k]}', [k], 4.49, 600, inv(200, k + 'ttg', k), qrule={'min': 4, 'max': None, 'increment': 4}) for k in TTK]
    imgs, vmap = kleur_images('tapijttegel-50x50', TTK, 'tentFloor', lambda k: {'tiles': True, 'color': render_color(k)}, 'Zwart', status='needs-model', p2=3)
    simple('tapijttegel-50x50', 'Tapijttegel 50 x 50 cm', 'Tentvloer', ['zakelijk', 'gebruik:evenement'], [opt('Kleur', TTK)], vs, imgs,
           {'kenmerk_kort': 'Losliggend 50 x 50 cm · per 4 stuks (1 m²) · 5 kleuren', 'verzending': 'pakket', 'staffelkorting': ST_SLANG,
            'specificaties': [sp('Tegel', 'Formaat', '50 x 50 cm, 4 tegels = 1 m²'), sp('Tegel', 'Toplaag', 'Naaldvilt'), sp('Tegel', 'Rug', 'Bitumen, losliggend, antislip')]},
           ['inrichting-evenement.vloeren'], 'inrichting', 'Tapijttegels op de tentvloer of in de zaal: losliggend, per 4 (1 m²), te mengen tot paden of vakken.',
           ['tapijttegels', 'tapijttegel 50x50', 'tapijttegels evenement'], {'outmate': 'tapijttegel zwart 50x50 €5', 'ours': 4.49}, vmap=vmap)
    simple('kapstok-verrijdbaar', 'Kapstok verrijdbaar 2 m met 104 haken', 'Kapstok', ['zakelijk', 'gebruik:evenement', 'pallet'], [],
           [variant('KK-INR-KAP-2M', [], 359.0, 38000, 4)],
           [img('kapstok-verrijdbaar-hero.webp', 'hero', 1, 'coatRack', {'length': 2, 'hooks': 104, 'wheels': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': '2 m lang · 104 genummerde haken · hoedenplank · op wielen', 'verzending': 'pallet', 'staffelkorting': ST_KAR, 'addon_eenmalig': ['transportkar-kapstokken'],
            'specificaties': [sp('Kapstok', 'Afmetingen', 'ca. 200 x 60 x 180 cm'), sp('Kapstok', 'Haken', '104, genummerd, 2 zijden'), sp('Kapstok', 'Wielen', '4 zwenkwielen, 2 met rem'),
                              sp('Kapstok', 'Opslag', 'Klapt in tot ca. 200 x 60 x 30 cm')]},
           ['inrichting-evenement.garderoberekken'], 'inrichting', 'Garderobe op een evenement of in de zaal: 104 genummerde haken, rijdend en inklapbaar; hoeveel jassen per rek.',
           ['kapstok verrijdbaar', 'garderoberek evenement', 'jassenrek met wielen'], {'outmate': 'kapstok met wielen 2 m 104 haakjes €399', 'ours': 359.0})
    TKP = [('Voor 2 kapstokken', 329.0, '2', 30), ('Voor 10 kapstokken', 679.0, '10', 70)]
    simple('transportkar-kapstokken', 'Transportkar voor kapstokken', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Uitvoering', [t_[0] for t_ in TKP])],
           [variant(f'KK-MEU-TKKP-{c}', [n], p, kg * 1000, inv(2, c + 'tkkp')) for n, p, c, kg in TKP],
           [img('transportkar-kapstokken-hero.webp', 'hero', 1, 'trolley', {'kind': 'kapstok', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Ingeklapte kapstokken rechtop · 2 of 10 stuks · zwenkwielen', 'verzending': 'pallet', 'staffelkorting': ST_KAR, 'past_op': ['kapstok-verrijdbaar'],
            'specificaties': [sp('Kar', 'Capaciteit', '2 of 10 ingeklapte kapstokken van 2 m')]},
           ['tafels-stoelen.trolleys', 'inrichting-evenement.garderoberekken'], 'inrichting', 'Ingeklapte kapstokken rijden en opslaan.',
           ['transportkar kapstokken', 'trolley kapstok'], {'outmate': 'trolley kapstokken compact 2 stuks €362,50 · 10 stuks €750', 'ours': {t_[0]: t_[1] for t_ in TKP}})
    simple('tape-voor-loper-en-vloer', 'Tape voor loper en vloer', 'Loper', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', ['Dubbelzijdige tapijttape 50 mm x 25 m', 'Gaffertape 50 mm x 25 m, zwart'])],
           [variant('KK-INR-TAPE-DZ', ['Dubbelzijdige tapijttape 50 mm x 25 m'], 16.95, 500, inv(40, 'tapedz')),
            variant('KK-INR-TAPE-GAF', ['Gaffertape 50 mm x 25 m, zwart'], 10.95, 450, inv(40, 'tapegaf'))],
           [img('tape-voor-loper-en-vloer-hero.webp', 'hero', 1, 'tapeRoll', {'kinds': ['dubbelzijdig', 'gaffer']}, 'hero', None, 'needs-model', alt='rol tapijttape en rol gaffertape')],
           {'kenmerk_kort': 'Loper en kabels vastzetten · laat bijna geen resten achter', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': ['loper-per-meter', 'tentvloer-kunststof', 'tapijttegel-50x50'],
            'specificaties': [sp('Tapijttape', 'Lijm', 'Dubbelzijdig, verwijderbaar van de meeste harde vloeren'), sp('Gaffertape', 'Gebruik', 'Randen en kabels afplakken, met de hand af te scheuren')]},
           ['inrichting-evenement.lopers'], 'inrichting', 'Loper en vloer die blijven liggen: dubbelzijdige tape eronder, gaffertape over randen en kabels; hoeveel meter per loper.',
           ['tapijttape loper', 'gaffertape', 'tape rode loper'], {'outmate': 'expotape dubbelzijdig 25 m €19 · gaffertape 50 mm €11,95–€19,99', 'ours': {'dubbelzijdig': 16.95, 'gaffer': 10.95}})

    # ------------------------------------------------------------ tafel-onderdelen (M19)
    TO = [('Onderstelset biertafel (2 poten)', 49.95, 'OBT', 9000), ('Onderstelset biertafel extra breed 60–80 cm', 57.95, 'OBTB', 10500),
          ('Onderstelset bierbank (2 poten)', 29.95, 'OBB', 4500), ('Klikslot biertafel', 5.95, 'KS', 150), ('Bouten en moeren biertafel (set van 5)', 1.69, 'BM5', 120),
          ('Vloerbeschermers biertafel en bank (set van 8)', 8.95, 'VB8', 200), ('Onderstelset bankettafel', 52.95, 'OBK', 7500),
          ('Onderstelset conferentietafel', 79.95, 'OCF', 11000), ('Stelpoot met schroefdop (set van 4)', 12.95, 'SP4', 400)]
    TO_IMG = {n: f'onderdelen-biertafel-en-klaptafel-{c.lower()}.webp' for n, _, c, _ in TO}
    simple('onderdelen-biertafel-en-klaptafel', 'Onderdelen biertafel, bankettafel en klaptafel', 'Meubelonderdeel', ['zakelijk'], [opt('Uitvoering', [t_[0] for t_ in TO])],
           [variant(f'KK-MEU-OTB-{c}', [n], p, g, inv(20, c + 'otb')) for n, p, c, g in TO],
           [img('onderdelen-biertafel-en-klaptafel-hero.webp', 'hero', 1, 'biertafelset', {'only': 'onderstel'}, 'hero', None, 'needs-param', alt='onderstelset biertafel, klikslot en vloerbeschermers')] +
           [img(TO_IMG[n], 'variant', 2, 'biertafelset', {'only': 'onderstel', 'part': c.lower()}, 'hero', None, 'needs-param') for n, _, c, _ in TO],
           {'kenmerk_kort': 'Onderstellen, klikslot, bouten, vloerbeschermers en stelpoten', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': ['biertafelset', 'bierbank', 'bankettafel-hout-rechthoekig', 'conferentietafel-inklapbaar', 'klaptafel-hdpe-rechthoekig'],
            'specificaties': [sp('Onderstel', 'Biertafel', 'Verzinkt staal, voor bladen van 50 cm (extra breed: 60–80 cm), met bouten'),
                              sp('Onderstel', 'Zelf bouwen', 'Schroef het onderstel onder je eigen blad van 25–35 mm'),
                              sp('Vloerbeschermers', 'Set', '8 kunststof doppen voor de voeten van tafel en banken')]},
           ['tafels-stoelen.klaptafel-onderdelen', 'tafels-stoelen.meubel-onderdelen'], 'meubilair',
           'Vervangen of zelf bouwen: onderstel voor een eigen biertafel of bank, klikslot, bouten, vloerbeschermers; onderstel voor bankettafel en conferentietafel; stelpoten.',
           ['onderstel biertafel', 'biertafel zelf maken', 'klikslot biertafel', 'vloerbeschermer biertafel'],
           {'outmate': 'onderstel set biertafel €55–€57,50 · extra breed €32,50 per poot · onderstel bierbank €16,25 · klikslot €6,99 · bouten 5 st €1,89 · vloerbeschermers €9,99 · onderstel bankettafel €59–€69 · conference €89',
            'ours': {t_[0]: t_[1] for t_ in TO}}, vmap=TO_IMG, vby='Uitvoering')

    # ------------------------------------------------------------ verlichting (M6)
    LKK = ['Warm wit', 'Rood', 'Oranje', 'Geel', 'Groen', 'Blauw', 'Roze', 'Paars']
    vs = [variant(f'KK-LCHT-LEDK-{COLOR_CODE[k]}', [k], 1.69 if k == 'Warm wit' else 1.79, 40, inv(300, k + 'ledk', k)) for k in LKK]
    imgs, vmap = kleur_images('led-lamp-e27-gekleurd', LKK, 'ledBulb', lambda k: {'type': 'gekleurd', 'color': render_color(k), 'on': True}, 'Rood', status='needs-param', p2=3)
    simple('led-lamp-e27-gekleurd', 'LED-lamp E27 gekleurd of extra warm 2000 K', 'LED-lamp', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Kleur', LKK)], vs, imgs,
           {'kenmerk_kort': 'Onbreekbaar · 1 W · gekleurd licht · per stuk', 'staffelkorting': ST_LAMP, 'past_op': ['prikkabel-e27', 'prikkabel-op-maat'], 'verzending': 'pakket',
            'specificaties': [sp('Lamp', 'Vermogen', '1 W LED'), sp('Lamp', 'Kap', 'Polycarbonaat, onbreekbaar, gekleurd'), sp('Lamp', 'Warm wit', '2000 K, extra warm (kaarslicht)'),
                              sp('Lamp', 'Fitting', 'E27, IP44 in een IP44-fitting')]},
           ['verlichting.ledlampen'], 'verlichting', 'Losse gekleurde lampen per stuk (zelf mengen) of extra warm 2000 K; onbreekbaar; staffel vanaf 50.',
           ['gekleurde led lamp e27', 'led lamp 2000k', 'gekleurde lampen prikkabel'], {'outmate': 'gekleurde LED-lampen per stuk (8 kleuren + 2000 K)', 'ours': {'Warm wit': 1.69, 'kleur': 1.79}},
           vmap=vmap)
    # catalog round 4: ca. 8% under the reference (2 W dimbaar € 2,49 · 3 W dimbaar € 2,69 · 1 W IP65 € 1,99; live data); they were 40-47% over it
    LD = [('2 W dimbaar, IP65', 2.29, '2W'), ('3 W dimbaar, IP65', 2.49, '3W')]
    simple('led-lamp-e27-dimbaar-ip65', 'LED-lamp E27 dimbaar IP65', 'LED-lamp', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'], [opt('Uitvoering', [l[0] for l in LD])],
           [variant(f'KK-LCHT-LEDD-{c}', [n], p, 45, inv(300, c + 'ledd')) for n, p, c in LD],
           [img('led-lamp-e27-dimbaar-ip65-hero.webp', 'hero', 1, 'ledBulb', {'type': 'filament', 'on': True, 'sealed': True}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Dimbaar · IP65 waterdicht · 2 of 3 W · 2200 K', 'staffelkorting': ST_LAMP, 'past_op': ['prikkabel-e27', 'prikkabel-op-maat', 'dimmer-voor-prikkabel'],
            'verzending': 'pakket',
            'specificaties': [sp('Lamp', 'Vermogen', '2 of 3 W LED, ca. 180 / 250 lumen'), sp('Lamp', 'Licht', '2200 K'), sp('Lamp', 'Dimbaar', 'Ja, met een fase-afsnijdingsdimmer'),
                              sp('Lamp', 'Beschermingsklasse', 'IP65, ook in een open fitting in de regen')]},
           ['verlichting.ledlampen'], 'verlichting', 'Voor prikkabels die het hele seizoen buiten hangen of gedimd worden: IP65, dimbaar, 2 of 3 W.',
           ['led lamp dimbaar ip65', 'waterdichte led lamp e27', 'dimbare prikkabel lamp'], {'outmate': 'LED 2 W dimbaar met lens €2,49 · 3 W spiraal dimbaar €2,69 · 1 W IP65 €1,99 (live, 2026-10-18)', 'ours': {l[0]: l[1] for l in LD}})

    # ------------------------------------------------------------ pakketten (M20, M9)
    def setp(los):
        """BRIEF: a pakket is 10–12% under its parts. x9 rounding can drop a small pakket below 88% of los (239 → 209); then ,95."""
        p = float(x9(0.9 * los))
        return p if p >= 0.88 * los - 1e-9 else math.floor(0.9 * los) - 0.05
    bundle('pakket-klaptafels-met-transportkar', 'Klaptafels 183 cm met transportkar (pakket)', [opt('Uitvoering', ['10 klaptafels + 1 kar', '20 klaptafels + 2 karren', '30 klaptafels + 3 karren'])],
           [('10 klaptafels + 1 kar',), ('20 klaptafels + 2 karren',), ('30 klaptafels + 3 karren',)],
           lambda los, u: setp(los),
           lambda u: [('klaptafel-hdpe-rechthoekig', {'Maat': '183 x 76 cm', 'Uitvoering': 'Vast blad'}, int(u.split()[0])),
                      ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 10 klaptafels 183 cm'}, int(u.split()[0]) // 10)],
           [img('pakket-klaptafels-met-transportkar-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'trolley', 'kind': 'klaptafel', 'loaded': 10, 'position': [0, 0, 0]}]},
                'hero', None, 'needs-param', alt='transportkar met 10 klaptafels van 183 cm')], None, None,
           '10, 20 of 30 klaptafels 183 x 76 cm + 1 kar per 10', 'Catering, verhuur en zaal: klaptafels per 10 met hun kar; los vs pakket; geen kleur te kiezen (lichtgrijs blad).',
           ['klaptafels met trolley', 'klaptafels 10 stuks', 'klaptafels 30 stuks'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'outmate': 'Supercombi klaptafels + trolley vanaf €1.325'}, sku='KLTKAR', verz='pallet')
    bundle('pakket-30-klapstoelen-met-transportkar', '30 klapstoelen met transportkar (pakket)', [opt('Kleur', ['Wit', 'Zwart'])], [('Wit',), ('Zwart',)],
           lambda los, k: setp(los),
           lambda k: [('klapstoel', {'Kleur': k}, 30), ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 30 klapstoelen'}, 1)],
           [img(f'pakket-30-klapstoelen-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Wit' else 'variant', 1 if k == 'Wit' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'klapstoel', 'loaded': 30, 'chairColor': render_color(k)}]}, 'hero', k, 'needs-param') for k in ['Wit', 'Zwart']],
           {k: f'pakket-30-klapstoelen-met-transportkar-{slug(k)}-hero.webp' for k in ['Wit', 'Zwart']}, 'Kleur',
           '30 klapstoelen + transportkar · wit of zwart', 'Ceremonie, school, vereniging: 30 klapstoelen op hun kar; los vs pakket.',
           ['klapstoelen met trolley', 'klapstoelen 30 stuks'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'outmate': 'Supercombi klapstoel Milo + trolley vanaf €585'}, sku='30KLS', verz='pallet')
    BKK = ['Zwart', 'Wit', 'Antraciet']
    BKU = ['15 barkrukken + kar', '30 barkrukken + kar']
    bundle('pakket-15-of-30-barkrukken-met-transportkar', '15 of 30 barkrukken met transportkar (pakket)', [opt('Uitvoering', BKU), opt('Kleur', BKK)], [(u, k) for u in BKU for k in BKK],
           lambda los, u, k: setp(los),
           lambda u, k: [('barkruk-stapelbaar-metaal', {'Kleur': k}, int(u.split()[0])),
                         ('transportkar-klaptafels-en-stoelen', {'Uitvoering': f'Voor {u.split()[0]} barkrukken'}, 1)],
           [img(f'pakket-24-barkrukken-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'barkruk', 'loaded': 24, 'stoolColor': render_color(k), 'position': [-0.5, 0, 0]},
                           {'model': 'barStool', 'style': 'metaal', 'color': render_color(k), 'position': [0.8, 0, 0.2]}]}, 'hero', k, 'existing',
                extra={'shared_with': 'pakket-24-barkrukken-met-transportkar'}) for k in BKK],
           {k: f'pakket-24-barkrukken-met-transportkar-{slug(k)}-hero.webp' for k in BKK}, 'Kleur',
           '15 of 30 stapelbare barkrukken + transportkar', 'Naast het pakket met 24: een kleinere en een grotere kar vol krukken; los vs pakket.',
           ['barkrukken 30 stuks met kar', 'barkrukken 15 stuks'], ['tafels-stoelen.bundels', 'tafels-stoelen.barkrukken'], ['zakelijk', 'pallet', 'gebruik:horeca', 'gebruik:evenement'],
           {'outmate': 'barkrukkentrolley 15 €354,50 · 30 €506,50', 'statafelshop': 'transportkar incl. barkruk Aras 15 €1.331 · 30 €2.418,79'}, sku='BKRKAR', verz='pallet')
    bundle('pakket-26-weddingstoelen-met-transportkar', '26 weddingstoelen met transportkar (pakket)', [opt('Kleur', WK)], [(k,) for k in WK],
           lambda los, k: setp(los),
           lambda k: [('klapstoel-wedding', {'Kleur': k}, 26), ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 26 weddingstoelen'}, 1)],
           [img(f'pakket-26-weddingstoelen-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Wit' else 'variant', 1 if k == 'Wit' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'klapstoel', 'loaded': 26, 'chairStyle': 'wedding', 'chairColor': render_color(k)}]}, 'hero', k, 'needs-param') for k in WK],
           {k: f'pakket-26-weddingstoelen-met-transportkar-{slug(k)}-hero.webp' for k in WK}, 'Kleur',
           '26 weddingstoelen + transportkar · wit of zwart', 'Bruiloft en ceremonie: 26 weddingstoelen (2 rijen van 13 of een halve zaal) op hun kar; los vs pakket.',
           ['weddingstoelen met trolley', 'wedding chairs 26 stuks', 'trouwstoelen kopen'], ['tafels-stoelen.bundels', 'tafels-stoelen.stoelen'], ['zakelijk', 'pallet', 'gebruik:evenement'],
           {'outmate': 'Supercombi 26x wedding chair + trolley vanaf €1.079'}, sku='26WED', verz='pallet')
    bundle('pakket-klapstoelen-met-stoelhoezen', '10 klapstoelen met stretch stoelhoezen (pakket)', [opt('Kleur', SHK)], [(k,) for k in SHK],
           lambda los, k: setp(los),
           lambda k: [('klapstoel', {'Kleur': 'Wit' if k in ('Wit', 'Crème', 'Champagne', 'Zilver') else 'Zwart'}, 10), ('stoelhoes-stretch', {'Uitvoering': 'Voor klapstoel', 'Kleur': k}, 10)],
           [img(f'stoelhoes-stretch-{slug(k)}-hero.webp', 'hero' if k == 'Wit' else 'variant', 1 if k == 'Wit' else 3, 'chair',
                {'style': 'klapstoel', 'cover': 'stretch', 'coverColor': render_color(k)}, 'hero', k, 'needs-param', extra={'shared_with': 'stoelhoes-stretch'}) for k in SHK],
           {k: f'stoelhoes-stretch-{slug(k)}-hero.webp' for k in SHK}, 'Kleur',
           '10 klapstoelen + 10 stretchhoezen in één kleur', 'Bruiloft, gala, ceremonie: tien stoelen meteen aangekleed; stoel wit onder lichte hoezen, zwart onder donkere; los vs pakket.',
           ['klapstoelen met stoelhoes', 'stoelhoezen pakket'], ['tafels-stoelen.bundels', 'statafelrokken-hoezen.actiepakketten'], ['zakelijk', 'gebruik:evenement'], sku='10KLSH')
