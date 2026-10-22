# Catalog round 4 (2026-10-22, graded findings): seating depth and chair linkers, ballast extras.
#
# Prices ca. 10% under the live reference (Outmate / Statafelshop capture of 2026-10-18; numbers only, no text), owner review in
# docs/claims-to-confirm.md. Specs are product DEFINITIONS to confirm with the supplier.
from kk_base import *
from fam_acc import simple


def build():
    # ------------------------------------------------------------ stoelen
    # PP stacking chair: the cheap volume chair for verenigingen, scholen and kantines (reference PP stacking chairs € 27,50 / 29 / 29,95 /
    # 32,50 / 35). Ours € 24,95: ca. 9% under the cheapest one, same spec (PP kuip, stalen poten, stapelbaar).
    PPK = ['Wit', 'Zwart', 'Antraciet', 'Taupe', 'Groen', 'Blauw']
    vs = [variant(f'KK-MEU-STK-{COLOR_CODE[k]}', [k], 24.95, 3900, inv(60, k + 'stk', k)) for k in PPK]
    imgs, vmap = kleur_images('stapelstoel-kunststof', PPK, 'chair', lambda k: {'style': 'kunststof', 'color': render_color(k), 'legs': 'zwart'}, 'Wit',
                              [img('stapelstoel-kunststof-wit-gestapeld.webp', 'detail', 3, 'chair', {'style': 'kunststof', 'color': 'wit', 'legs': 'zwart', 'stack': 8},
                                   'hero', 'Wit', 'needs-param', alt='8 stoelen gestapeld')],
                              status='needs-param', p2=3)
    simple('stapelstoel-kunststof', 'Stapelstoel kunststof', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Kleur', PPK)], vs, imgs,
           {'kenmerk_kort': 'PP-kuip · stalen poten · stapelbaar tot 15 · binnen en buiten', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 3.9,
            'specificaties': [sp('Stoel', 'Zithoogte', '45 cm'), sp('Stoel', 'Kuip', 'Polypropyleen (PP), UV-bestendig, met afwateringsgaatje'),
                              sp('Stoel', 'Frame', 'Staal Ø 20 mm, zwart gepoedercoat, kunststof voetdoppen'), sp('Stoel', 'Belastbaar', 'tot 120 kg'),
                              sp('Stapelen', 'Aantal', 'Tot 15 stuks'), sp('Rijen', 'Koppelen', 'Met de stoelverbinder voor deze stoel (los)'),
                              sp('Gebruik', 'Binnen en buiten', 'Ja')]},
           ['tafels-stoelen.stoelen'], 'meubilair',
           'De voordelige volumestoel voor verenigingen, scholen, kantines en tuinfeesten: PP-kuip op stalen poten, stapelbaar tot 15, binnen en buiten; met verbinders in rijen.',
           ['stapelstoel kunststof', 'kunststof stoel stapelbaar', 'kantinestoel', 'stoelen voor vereniging'],
           {'outmate': 'PP-stapelstoelen €27,50 · €29 · €29,95 · €32,50 · €35 (live, 2026-10-18)', 'ours': 24.95}, vmap=vmap)
    # clear polycarbonate chair for weddings and gala dinners (reference € 129-149 for the transparent model, barkruk € 139)
    PCK = ['Transparant', 'Zwart', 'Wit']
    vs = [variant(f'KK-MEU-SPC-{COLOR_CODE[k]}', [k], 119.0, 4800, inv(12, k + 'spc', k)) for k in PCK]
    imgs, vmap = kleur_images('stapelstoel-polycarbonaat', PCK, 'chair', lambda k: {'style': 'polycarbonaat', 'color': render_color(k), 'translucent': k == 'Transparant'},
                              'Transparant', status='needs-param', p2=3)
    simple('stapelstoel-polycarbonaat', 'Stapelstoel polycarbonaat transparant', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Kleur', PCK)], vs, imgs,
           {'kenmerk_kort': 'Glashelder polycarbonaat · medaillonrug · stapelbaar tot 6 · binnen', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 4.8,
            'specificaties': [sp('Stoel', 'Zithoogte', '46 cm'), sp('Stoel', 'Materiaal', 'Polycarbonaat uit één stuk gegoten, krasbestendig'),
                              sp('Stoel', 'Rug', 'Ovale medaillonrug met armleuningen'), sp('Stoel', 'Belastbaar', 'tot 120 kg'),
                              sp('Stapelen', 'Aantal', 'Tot 6 stuks'), sp('Gebruik', 'Binnen', 'Ja; buiten alleen kort, droog en uit de volle zon')]},
           ['tafels-stoelen.stoelen'], 'meubilair',
           'Transparante stoel voor bruiloft, gala en diner: valt weg in elke aankleding, stapelbaar tot 6; schoonmaken met een zachte doek en water, geen schuurmiddel.',
           ['transparante stoel', 'ghost stoel', 'polycarbonaat stoel bruiloft', 'doorzichtige stoel'],
           {'outmate': 'transparante stapelstoel €129–€149 (live, 2026-10-18)', 'ours': 119.0}, vmap=vmap)
    # wooden bistro folding chair (reference € 72,50)
    BHK = ['Eiken', 'Vintage hout', 'Zwart']
    vs = [variant(f'KK-MEU-KLH-{COLOR_CODE[k]}', [k], 64.95, 4600, inv(15, k + 'klh', k)) for k in BHK]
    imgs, vmap = kleur_images('klapstoel-hout-bistro', BHK, 'chair', lambda k: {'style': 'bistro-klap', 'color': render_color(k)}, 'Eiken',
                              [img('klapstoel-hout-bistro-eiken-ingeklapt.webp', 'detail', 3, 'chair', {'style': 'bistro-klap', 'color': render_color('Eiken'), 'folded': True},
                                   'hero', 'Eiken', 'needs-param', alt='ingeklapt, 6 cm dik')],
                              status='needs-param', p2=3)
    simple('klapstoel-hout-bistro', 'Klapstoel hout bistro', 'Stoel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Kleur', BHK)], vs, imgs,
           {'kenmerk_kort': 'Massief beukenhout · lattenrug · klapt plat tot 6 cm', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 4.6,
            'specificaties': [sp('Stoel', 'Zithoogte', '45 cm'), sp('Stoel', 'Materiaal', 'Massief beukenhout, gelakt of zwart gebeitst'),
                              sp('Stoel', 'Rug', 'Drie gebogen latten'), sp('Stoel', 'Belastbaar', 'tot 110 kg'), sp('Ingeklapt', 'Dikte', 'ca. 6 cm'),
                              sp('Gebruik', 'Buiten', 'Kort en droog; berg hem droog op')]},
           ['tafels-stoelen.stoelen'], 'meubilair',
           'Houten bistrostoel die plat inklapt: warmer dan metaal of kunststof, voor terras, bruiloft en pop-uprestaurant; opbergen tegen een wand of in de kar.',
           ['houten klapstoel', 'bistro klapstoel', 'klapstoel hout vintage'],
           {'outmate': 'houten bistro-klapstoel vintage €72,50 (live, 2026-10-18)', 'ours': 64.95}, vmap=vmap)
    # folding bar stool with a backrest (reference folding bar stool € 69,99; metal stool with backrest € 45)
    BIK = ['Zwart', 'Wit']
    vs = [variant(f'KK-MEU-BKI-{COLOR_CODE[k]}', [k], 62.95, 6200, inv(15, k + 'bki', k)) for k in BIK]
    imgs, vmap = kleur_images('barkruk-inklapbaar', BIK, 'barStool', lambda k: {'style': 'klap', 'color': render_color(k), 'height': 0.76, 'back': True}, 'Zwart',
                              [img('barkruk-inklapbaar-zwart-ingeklapt.webp', 'detail', 3, 'barStool', {'style': 'klap', 'color': 'zwart', 'height': 0.76, 'back': True,
                                                                                                         'folded': True}, 'hero', 'Zwart', 'needs-param', alt='ingeklapt')],
                              status='needs-param', p2=3)
    simple('barkruk-inklapbaar', 'Barkruk inklapbaar met rugleuning', 'Barkruk', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Kleur', BIK)], vs, imgs,
           {'kenmerk_kort': 'Klapt plat · lage rugleuning · zithoogte 76 cm · kunstleren zitting', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 6.2,
            'specificaties': [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Frame', 'Staal, gepoedercoat, voetsteun'),
                              sp('Kruk', 'Zitting en rug', 'Zwart kunstleer op schuim, lage rugleuning'), sp('Kruk', 'Belastbaar', 'tot 110 kg'),
                              sp('Ingeklapt', 'Dikte', 'ca. 12 cm'), sp('Gebruik', 'Binnen', 'Ja; buiten kort en droog')]},
           ['tafels-stoelen.barkrukken'], 'meubilair',
           'Barkruk die plat inklapt en toch een rug heeft: voor wie weinig opslag heeft (bus, berging) en bij de statafel wil leunen; geen stapelkruk, wel plat tegen elkaar.',
           ['barkruk inklapbaar', 'klapbarkruk', 'barkruk met rugleuning'],
           {'outmate': 'inklapbare barkruk €69,99 · metalen barkruk met rugleuning €45 (live, 2026-10-18)', 'ours': 62.95}, vmap=vmap)
    # chair linkers per chair model (both references sell them per model, € 0,79-2,21 each): events in rows need them (fire safety at
    # many venues asks for linked rows; our copy says check with the venue, it states no rule)
    SV = [('Voor klapstoel', 0.79, 'KLS', 30, ['klapstoel']),
          ('Voor stapelstoel metaal', 1.95, 'STM', 60, ['stapelstoel-metaal']),
          ('Voor banquetstoel', 1.95, 'BQS', 60, ['banquetstoel-gestoffeerd']),
          ('Voor stapelstoel kunststof', 1.49, 'STK', 40, ['stapelstoel-kunststof']),
          ('Voor weddingstoel (reserve)', 1.39, 'WED', 30, ['klapstoel-wedding'])]
    simple('stoelverbinder', 'Stoelverbinder voor stoelen in rijen', 'Meubelonderdeel', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [s_[0] for s_ in SV])],
           [variant(f'KK-MEU-SVB-{c}', [n], p, g, inv(200, c + 'svb')) for n, p, c, g, _ in SV],
           [img('stoelverbinder-hero.webp', 'hero', 1, 'chairLinker', {'kinds': ['klapstoel', 'stapelstoel']}, 'hero', None, 'needs-model',
                alt='twee stoelverbinders, voor een klapstoel en een stapelstoel'),
            img('stoelverbinder-in-gebruik.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'chair', 'style': 'klapstoel', 'color': 'wit', 'count': 3, 'linked': True}]},
                'low', None, 'needs-model', alt='drie klapstoelen in een rij, aan elkaar gekoppeld')],
           {'kenmerk_kort': 'Koppelt stoelen tot een rechte rij · per stuk · per stoelmodel', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': sorted({h for *_, hs in SV for h in hs}),
            'specificaties': [sp('Verbinder', 'Materiaal', 'Verzinkt staal (metaal en banquet) of kunststof (klapstoel, kunststof en wedding)'),
                              sp('Verbinder', 'Werking', 'Klikt of haakt om de voorpoot van twee stoelen naast elkaar'),
                              sp('Verbinder', 'Aantal', '1 per stoel: de laatste stoel van een rij heeft er geen nodig'),
                              sp('Weddingstoel', 'Let op', 'Elke weddingstoel heeft er al een; deze is voor reserve')]},
           ['tafels-stoelen.stoelen-onderdelen'], 'meubilair',
           'Stoelen in rechte rijen voor ceremonie, presentatie of theater: één verbinder per stoel, per model; vraag bij de locatie na of rijen gekoppeld moeten zijn.',
           ['stoelverbinder', 'stoelkoppeling', 'stoelen koppelen rij', 'stoelverbinder klapstoel'],
           {'outmate': 'klapstoel kort €0,79 / lang €0,89 · stapelstoel €2,21 · weddingstoel €1,58 (live, 2026-10-18)',
            'statafelshop': 'klapstoel €1,20–€1,56 · stapelstoel €2,00 (live, 2026-10-18)', 'ours': {s_[0]: s_[1] for s_ in SV}})

    # ------------------------------------------------------------ ballast extras (reference: hoes 80 x 80 x 40/60/80 cm € 27,50 / 29 / 37,50,
    # houten zitje € 179, truss baseplate 6 / 10 mm € 99 / 135; live data). The betonblok with a vlaggenmastkoker is a variant of the betonblok.
    AB = [('Hoes voor 500 kg (80 x 80 x 40 cm)', 24.95, 'H40', 1400), ('Hoes voor 750 kg (80 x 80 x 60 cm)', 25.95, 'H60', 1700),
          ('Hoes voor 1000 kg (80 x 80 x 80 cm)', 33.95, 'H80', 2000), ('Houten zitblad 80 x 80 cm', 159.0, 'ZIT', 10000),
          ('Truss-voetplaat 45 x 45 cm, 6 mm', 89.0, 'TV6', 10000), ('Truss-voetplaat 45 x 45 cm, 10 mm', 119.0, 'TV10', 16000)]
    AB_IMG = {'Hoes voor 500 kg (80 x 80 x 40 cm)': 'accessoires-betonblok-hoes.webp', 'Hoes voor 750 kg (80 x 80 x 60 cm)': 'accessoires-betonblok-hoes.webp',
              'Hoes voor 1000 kg (80 x 80 x 80 cm)': 'accessoires-betonblok-hoes.webp', 'Houten zitblad 80 x 80 cm': 'accessoires-betonblok-zitblad.webp',
              'Truss-voetplaat 45 x 45 cm, 6 mm': 'accessoires-betonblok-truss-voetplaat.webp', 'Truss-voetplaat 45 x 45 cm, 10 mm': 'accessoires-betonblok-truss-voetplaat.webp'}
    simple('accessoires-betonblok', 'Hoes, zitblad en truss-voetplaat voor betonblok', 'Verzwaring', ['zakelijk', 'gebruik:evenement'],
           [opt('Uitvoering', [a[0] for a in AB])], [variant(f'KK-GEW-BETON-ACC-{c}', [n], p, g, inv(6, c + 'bacc')) for n, p, c, g in AB],
           [img('accessoires-betonblok-hoes.webp', 'hero', 1, 'concreteBlock', {'weight': 500, 'cover': {'color': 'zwart'}}, 'hero', None, 'needs-param',
                alt='zwarte hoes over een betonblok van 500 kg (blok niet inbegrepen)'),
            img('accessoires-betonblok-zitblad.webp', 'variant', 2, 'concreteBlock', {'weight': 500, 'seat': {'wood': 'hardhout'}}, 'hero', None, 'needs-param',
                alt='houten zitblad op een betonblok, als bank (blok niet inbegrepen)'),
            img('accessoires-betonblok-truss-voetplaat.webp', 'variant', 2, 'concreteBlock', {'part': 'truss-baseplate', 'size': 0.45}, 'hero', None, 'needs-param',
                alt='stalen voetplaat van 45 x 45 cm met gaten voor een trusspaal')],
           {'kenmerk_kort': 'Hoes per blokmaat · hardhouten zitblad · voetplaat voor truss', 'verzending': 'pakket', 'staffelkorting': ST_GEWICHT,
            'past_op': ['betonblok-ballast-tent'],
            'specificaties': [sp('Hoes', 'Materiaal', 'Zwart polyester, PVC-gecoat, met klittenband aan de onderrand'),
                              sp('Hoes', 'Maten', '80 x 80 x 40 cm (500 kg), 80 x 80 x 60 cm (750 kg), 80 x 80 x 80 cm (1000 kg)'),
                              sp('Zitblad', 'Materiaal', 'Geïmpregneerd hardhout, 80 x 80 x 10 cm, ca. 10 kg, ligt los op het blok'),
                              sp('Truss-voetplaat', 'Plaat', 'Staal 45 x 45 cm, 6 of 10 mm, gegalvaniseerd, 4 gaten voor M16'),
                              sp('Truss-voetplaat', 'Op het blok', 'Op het betonblok van 500 kg met M16-inserts')]},
           ['partytent-onderdelen-accessoires.betonblokken'], 'verankering',
           'Betonblokken die er netjes uitzien en meer doen: een hoes per blokmaat, een houten zitblad zodat het blok een bank wordt, en een stalen voetplaat voor een trusspaal op het truss-blok.',
           ['hoes betonblok', 'betonblok zitbank', 'truss voetplaat', 'baseplate truss'],
           {'outmate': 'hoes betonblok 80x80x40 €27,50 · 80x80x60 €29 · 80x80x80 €37,50 · houten zitje €179 · truss baseplate 6 mm €99 / 10 mm €135 (live, 2026-10-18)',
            'ours': {a[0]: a[1] for a in AB}}, vmap=AB_IMG, vby='Uitvoering')

    # the karren and the betonblok now also take the new products (new lists: never += on a shared past_op list)
    for h, extra in [('transportkar-stapelstoelen', ['stapelstoel-kunststof']),
                     ('transportkar-klaptafels-en-stoelen', ['klapstoel-hout-bistro', 'barkruk-inklapbaar'])]:
        HANDLES[h]['metafields']['past_op'] = list(HANDLES[h]['metafields'].get('past_op') or []) + extra
    # hoes, zitblad and truss-voetplaat: a cart recommendation on the betonblok (not every block size has a hoes, so no add-on list)
    HANDLES['betonblok-ballast-tent']['complementary'] = list(HANDLES['betonblok-ballast-tent'].get('complementary') or []) + ['accessoires-betonblok']
