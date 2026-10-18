# Verankering, tassen, goten, buizenframe-tenten + onderdelen, opslagtenten.
from kk_base import *
from fam_easyup import DIMS, x9

def eu_all():
    return [h for h in HANDLES if h.startswith('easy-up-partytent-premium-') and h[-1].isdigit() or
            h.startswith('easy-up-partytent-professional-') and h[-1].isdigit()]

def simple(h, title, ptype, tags, options, variants, images, mf, covers, family, brief, kw, ref=None, weight=1, vmap=None, vby=None, extra=None):
    p = {'handle': h, 'title': title, 'product_type': ptype, 'tags': tags, 'options': options, 'variants': variants,
         'images': images, 'metafields': mf, 'covers': covers, 'family': family, 'weight': weight,
         'copy_brief': brief, 'seo_keywords': kw, 'price_ref': ref or {}}
    if vmap:
        p['variant_images'] = vmap
        p['variant_image_by'] = vby or 'Kleur'
    if extra:
        p.update(extra)
    return add(p)

EU_PRINT = ['easy-up-partytent-premium-met-logo-op-de-luifel', 'easy-up-partytent-professional-met-logo-op-de-luifel',
            'easy-up-partytent-professional-full-colour-bedrukt',
            # catalog round 3: the Premium full colour (fam_new) gets the same anchoring, tas and printed wall as its siblings
            'easy-up-partytent-premium-full-colour-bedrukt']


def build():
    EU = eu_all()
    # the printed easy-ups are the same frames: everything they offer as an add-on lists them in past_op too (new list, never +=)
    EUX = EU + EU_PRINT
    # ------------------------------------------------------------ verzwaring & verankering
    # one voetgewicht per poot: set of 4 (2x2, 3x3, 4x4), 6 (3x4,5, 3x6, 4x6, 4x8), 8 (5x5)
    VG = [('Set van 4', 159.0, 60000, 'S4'), ('Set van 6', 235.0, 90000, 'S6'), ('Set van 8', 309.0, 120000, 'S8'), ('1 stuk', 42.95, 15000, '1')]
    # one title for every tent system (merchandising review 2026-10-18): the same plate goes round an easy-up poot and a 38 mm
    # buizenframe staander; past_op is filled at the end of build() once the buizenframe tents and the opslagtent exist
    simple('voetgewicht-partytent-15-kg', 'Voetgewicht partytent 15 kg', 'Verzwaring', ['gebruik:evenement', 'gebruik:markt', 'zakelijk'],
           [opt('Uitvoering', [v[0] for v in VG])], [variant(f'KK-GEW-VG15-{c}', [n], p, g, inv(12 if c == '1' else 6, c + 'vg')) for n, p, g, c in VG],
           [img('voetgewicht-easy-up-15-kg-hero.webp', 'hero', 1, 'gewichten', {'count': 2, 'stacks': 4}, 'hero', None, 'existing', alt='set van 4 (2 platen van 7,5 kg per poot)'),
            img('voetgewicht-easy-up-15-kg-op-poot.webp', 'in-gebruik', 2, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit', 'weights': 2}, 'detail', 'Wit', 'existing',
                alt='twee platen om de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': '2 platen van 7,5 kg per poot · poten tot 50 mm', 'staffelkorting': ST_GEWICHT, 'past_op': EUX, 'verzending': 'pakket',
            'specificaties': [sp('Gewicht', 'Per poot', '15 kg (2 stapelbare platen van 7,5 kg)'), sp('Materiaal', 'Plaat', 'Gietijzer, zwart gecoat'),
                              sp('Pasvorm', 'Poten', 'Zeskant 40 en 50 mm (easy-up), rond 38 mm (buizenframe)'), sp('Afmetingen', 'Plaat', 'Ø 25 cm, 3,4 cm dik')],
            'gewicht_kg': 15, 'verpakt': '27 x 27 x 8 cm per paar platen', 'garantie': None},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering',
           'Gewicht voor op verharde grond waar haringen niet kunnen: hoeveel per poot, stapelen, set van 4 voor 4 poten, set van 6 voor 3 × 4,5 / 3 × 6 / 4 × 6 / 4 × 8 en set van 8 voor 5 × 5; per stuk één per staander van een buizenframe- of opslagtent (4 tot 14).',
           ['voetgewicht partytent 15 kg', 'tentgewicht easy up', 'gewicht partytent buizenframe'], {'outmate': '€49,95 per stuk', 'band': 'stalen voetplaat €50–€55 per stuk', 'ours': {v[0]: v[1] for v in VG}})
    simple('zandzakken-partytent-set-van-4', 'Zandzakken voor partytent (set van 4)', 'Verzwaring', ['gebruik:tuinfeest', 'gebruik:markt'], [],
           [variant('KK-GEW-ZAND-4', [], 17.95, 1200, 40)],
           [img('zandzakken-partytent-set-van-4-hero.webp', 'hero', 1, 'sandbag', {'count': 4, 'color': 'zwart', 'filled': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': '4 vulbare zakken · tot ca. 10 kg zand per zak · klittenband', 'past_op': EU + ['marktkraam-2-m'], 'verzending': 'pakket', 'gewicht_kg': 1.2,
            'specificaties': [sp('Zak', 'Vulling', 'Zand of grind, ca. 10 kg per zak (niet inbegrepen)'), sp('Zak', 'Bevestiging', 'Klittenband rond de poot')]},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering', 'Lichte, goedkope verzwaring die je ter plekke vult; eerlijk: zand zit er niet in.',
           ['zandzakken partytent', 'gewichten partytent goedkoop'], {'outmate': '€19,99', 'band': '€21–€25', 'ours': 17.95})
    simple('watergewichtzakken-4x20-kg', 'Watergewichtzakken 4 × 20 kg', 'Verzwaring', ['gebruik:evenement', 'gebruik:markt', 'zakelijk'], [],
           [variant('KK-GEW-WATER-4X20', [], 89.0, 3600, 20)],
           [img('watergewichtzakken-4x20-kg-hero.webp', 'hero', 1, 'waterBag', {'count': 4, 'color': 'zwart', 'filled': True}, 'hero', None, 'needs-model',
                alt='vier gevulde watergewichtzakken')],
           {'kenmerk_kort': '4 zakken van 20 kg · vullen met water · klittenband om de poot', 'past_op': EU, 'verzending': 'pakket', 'gewicht_kg': 3.6,
            'staffelkorting': ST_GEWICHT,
            'specificaties': [sp('Zak', 'Vulling', 'Water, ca. 20 liter = 20 kg per zak (niet inbegrepen)'), sp('Zak', 'Materiaal', 'PVC 650 g/m², gelaste naden'),
                              sp('Zak', 'Bevestiging', 'Klittenband en gesp rond de poot of het luchtframe'), sp('Gewicht', 'Leeg', '0,9 kg per zak')]},
           ['easy-up-accessoires.easy-up-bevestiging', 'opblaasbare-tenten.air-accessoires'], 'verankering',
           'Zware verzwaring die je pas ter plekke vult: 20 kg water per zak, leeg licht te vervoeren; voor opblaasbare tenten en easy-ups op verharding.',
           ['watergewicht partytent', 'waterzak tent', 'watergewichten opblaasbare tent'], {'outmate': 'watergewichtzakken 4x20 kg €99', 'ours': 89.0})
    simple('spanbanden-en-haringen-easy-up','Spanbanden en haringen voor easy-up (set)', 'Verankering', ['gebruik:tuinfeest', 'gebruik:markt'], [],
           [variant('KK-VER-SPH-44', [], 17.95, 1400, 50)],
           [img('spanbanden-en-haringen-easy-up-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'spanbanden', 'color': 'zwart', 'position': [-0.32, 0, -0.06]},
                                                                                          {'model': 'haringen', 'count': 4, 'length': 0.3, 'position': [0.26, 0, 0.16]}]}, 'hero', None, 'existing',
                alt='4 spanbanden en 4 haringen van 30 cm')],
           {'kenmerk_kort': '4 spanbanden ca. 3 m + 4 haringen 30 cm + opbergzak', 'past_op': EUX, 'verzending': 'pakket', 'gewicht_kg': 1.4},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering', 'Basisverankering op gras: banden van dakhoek naar haring; altijd gebruiken, ook als het rustig lijkt.',
           ['haringen easy up', 'spanbanden partytent'], {'outmate': '€19,99', 'ours': 17.95})
    SB = {'3 m breed': 25.95, '4 m breed': 29.95, '5 m breed': 33.95, '6 m breed': 37.95, '8 m breed': 45.95}   # L3: was 35% under the reference
    simple('stormbandenset-partytent', 'Stormbandenset partytent', 'Verankering', ['zakelijk', 'gebruik:evenement'], [opt('Maat', list(SB))],
           [variant(f'KK-VER-STB-{code(m.split()[0] + " m")}', [m], p, 1800 + 200 * i, inv(10, m + 'stb')) for i, (m, p) in enumerate(SB.items())],
           [img('stormbandenset-partytent-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'spanbanden', 'color': 'oranje', 'length': 12, 'position': [-0.15, 0, 0]},
                                                                                    {'model': 'haringen', 'count': 2, 'length': 0.75, 'position': [0.25, 0, 0]}]}, 'hero', None, 'existing')],
           {'kenmerk_kort': '1 band over het dak + 2 lange haringen per set', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL},
           ['partytent-onderdelen-accessoires.stormbandensets'], 'buizenframe', 'Per tentbreedte één set over het dak; hoeveel sets per lengte (elke 2 m). Voor buizenframe- en opslagtenten.',
           ['stormband partytent', 'stormbanden set'], {'outmate': '1 set €16–€24', 'ours': SB},
           extra={'past_op_note': 'buizenframe- en opslagtenten (ingevuld in build)'})
    # Merchandising review 3: the tentelastieken were one Uitvoering behind the haringen image; they are their own product now. Each
    # haring has its own image (the draaiharing from renders/models/miscParts.js).
    BV = [('Lange haring 50 cm', 5.95, 'H50', 600, ('haringen', {'count': 1, 'length': 0.5})), ('Lange haring 75 cm', 10.95, 'H75', 900, ('haringen', {'count': 1, 'length': 0.75})),
          ('Lange haring 100 cm', 13.95, 'H100', 1200, ('haringen', {'count': 1, 'length': 1.0})),
          ('Draaiharingen 30 cm (4 stuks)', 6.95, 'DH4', 500, ('miscParts', {'parts': ['draaiharing'], 'count': 4})),
          ('Haringen 18 cm voor wanden (10 stuks)', 5.95, 'H18', 400, ('haringen', {'count': 10, 'length': 0.18, 'type': 'wand'})),
          # L7 (catalog round 2026-10-18): the stertent haring (rond 25 mm with an oog for the spanband) and the hefboom-haringtrekker
          ('Stertent-haring 60 cm met oog', 7.95, 'HST60', 1100, ('haringen', {'count': 1, 'length': 0.6, 'type': 'oog'})),
          ('Haringtrekker met hefboom', 39.95, 'HTRK', 3500, ('miscParts', {'parts': ['haringtrekker']}))]
    BV_IMG = {n: f'haringen-en-bevestigingsmateriaal-partytent-{slug(n.split(" (")[0])}.webp' for n, _, _, _, prm in BV}
    simple('haringen-en-bevestigingsmateriaal-partytent', 'Haringen en bevestigingsmateriaal partytent', 'Verankering', ['gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Uitvoering', [b[0] for b in BV])], [variant(f'KK-VER-BEV-{c}', [n], p, g, inv(30, c)) for n, p, c, g, _ in BV],
           [img('haringen-en-bevestigingsmateriaal-partytent-hero.webp', 'hero', 1, 'haringen', {'count': 3, 'length': 0.75}, 'hero', None, 'existing', alt='lange haringen van verzinkt hoekijzer')] +
           [img(BV_IMG[n], 'variant', 2, prm[0], prm[1], 'hero', None, 'needs-param' if c in ('HST60', 'HTRK') else 'existing') for n, _, c, _, prm in BV],
           {'kenmerk_kort': 'Hoekijzer 50–100 cm, draai- en wandharingen, stertent-haring, trekker', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Haring', 'Materiaal', 'Thermisch verzinkt hoekijzer 30 x 30 mm')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering', 'Welke haring in welke grond (lang in zacht, draaiharing in los zand); wandharingen.',
           ['lange haringen partytent', 'draaiharing', 'haringen partytent', 'haring stertent', 'haringtrekker'], {'outmate': '50 cm €6,95 · 75 cm €12,50 · 100 cm €15 · draaiharing 4 st €7,50 · stertent-haring €8,50 · haringtrekker stertent €45', 'ours': {b[0]: b[1] for b in BV}},
           vmap=BV_IMG, vby='Uitvoering')
    # catalog round 3: kort and lang, wit and zwart (the reference sells all four at € 10,25-13,75 per 25); the zwart kort keeps its SKU
    ELU = {'Kort (lus ca. 18 cm)': {'Zwart': (11.45, 'KK-VER-BEV-EL25'), 'Wit': (9.25, 'KK-VER-BEV-EL25-WIT')},
           'Lang (lus ca. 30 cm)': {'Zwart': (12.25, 'KK-VER-BEV-EL25L'), 'Wit': (9.95, 'KK-VER-BEV-EL25L-WIT')}}
    simple('tentelastieken-met-bal', 'Tentelastieken met bal (25 stuks)', 'Verankering', ['gebruik:evenement', 'gebruik:tuinfeest', 'gebruik:markt'],
           [opt('Uitvoering', list(ELU)), opt('Kleur', ['Zwart', 'Wit'])],
           [variant(s_, [u, k], p, 300 if u.startswith('Kort') else 420, inv(30, s_)) for u, ks in ELU.items() for k, (p, s_) in ks.items()],
           [img('tentelastieken-met-bal-hero.webp', 'hero', 1, 'tentElastics', {'count': 6}, 'hero', 'Zwart', 'existing', alt='een greep zwarte elastieken met bal'),
            img('tentelastieken-met-bal-wit-hero.webp', 'variant', 2, 'tentElastics', {'count': 6, 'color': 'wit', 'ball': 'wit'}, 'hero', 'Wit', 'needs-param',
                alt='een greep witte elastieken met witte bal')],
           {'kenmerk_kort': 'Elastisch koord met kunststof bal · kort of lang · wit of zwart · 25 stuks', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Elastiek', 'Koord', 'Rond elastiek ca. 6 mm met geweven mantel'), sp('Elastiek', 'Lus', 'Kort ca. 18 cm, lang ca. 30 cm (ongerekt)'),
                              sp('Elastiek', 'Bal', 'Kunststof, Ø ca. 25 mm, in de kleur van het koord'), sp('Verpakking', 'Aantal', '25 stuks')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Elastiek met bal: zijwand, zeil of doek om een buis of door een oog vastzetten; geeft mee bij wind; 25 stuks.',
           ['tentelastieken', 'elastiek met bal', 'spanelastiek tent', 'partytent elastieken wit'],
           {'outmate': 'kort wit €10,25 · kort zwart €12,99 · lang wit €11,25 · lang zwart €13,75 (25 stuks)', 'ours': {u: {k: v[0] for k, v in ks.items()} for u, ks in ELU.items()}},
           vmap={'Zwart': 'tentelastieken-met-bal-hero.webp', 'Wit': 'tentelastieken-met-bal-wit-hero.webp'}, vby='Kleur')
    # 120 tot 1000 kg like the reference range, plus a 500 kg block with M16 inserts for a truss-voetplaat
    # catalog round 3: 120 and 240 kg were 21-27% under the reference (€ 135 / € 189), the truss block 20% (€ 299). The 120 kg block is the one
    # with a vorkuitsparing underneath (a palletwagen moves it without a kraan), as at the reference, so it sits above the plain 140 kg block.
    BB = [('120 kg met vorkuitsparing', 119.0, 120000, '120'), ('140 kg', 109.0, 140000, '140'), ('240 kg', 169.0, 240000, '240'), ('500 kg', 219.0, 500000, '500'),
          ('750 kg', 259.0, 750000, '750'), ('1000 kg', 299.0, 1000000, '1000'), ('500 kg met M16-inserts voor truss', 269.0, 500000, '500T')]
    simple('betonblok-ballast-tent', 'Betonblok ballast voor tenten', 'Verzwaring', ['zakelijk', 'pallet', 'gebruik:evenement'],
           [opt('Uitvoering', [b[0] for b in BB])], [variant(f'KK-GEW-BETON-{c}', [n], p, g, None, tracked=False) for n, p, g, c in BB],
           [img('betonblok-ballast-tent-hero.webp', 'hero', 1, 'concreteBlock', {'weight': 500, 'lifting': 'lepelgat'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Ballast met lepelgat · 120 tot 1000 kg · ook voor truss · op pallet', 'verzending': 'pallet', 'levertijd': 'Levertijd 5–8 werkdagen (vracht)'},
           ['partytent-onderdelen-accessoires.betonblokken'], 'verankering', 'Ballast voor evenementen op verharding (stretch-, ster- en grote tenten); levering met vracht, afladen met heftruck of kraan.',
           ['betonblok tent', 'ballast evenement'], {'outmate': '120 kg met lepelgat en uitsparing €135 · 140 kg €117 · 240 kg €189 · 500 kg €235 · 750 kg €275 · 1000 kg €319 · truss 500 kg €299', 'ours': {b[0]: b[1] for b in BB}})

    # ------------------------------------------------------------ tassen & wielen
    SIZES8 = ['2 x 2 m', '3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m', '5 x 5 m']
    BH = [15.95, 17.95, 19.95, 21.95, 19.95, 23.95, 25.95, 25.95]
    WT = [34.95, 39.95, 44.95, 49.95, 44.95, 54.95, 64.95, 59.95]
    simple('beschermhoes-easy-up', 'Beschermhoes easy-up partytent', 'Tas & wielset', ['gebruik:tuinfeest'], [opt('Maat', SIZES8)],
           [variant(f'KK-TAS-BH-{code(m)}', [m], p, 900 + 100 * i, inv(8, m + 'bh')) for i, (m, p) in enumerate(zip(SIZES8, BH))],
           [img('beschermhoes-easy-up-hero.webp', 'hero', 1, 'draagtas', {'height': 1.55, 'color': 'zwart'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Schuift over frame en dak · 2 handvatten · gesp', 'past_op': EUX, 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Stofhoes voor opslag in schuur of bus; maat = tentmaat; past op Premium en Professional.',
           ['beschermhoes easy up', 'hoes vouwtent'], {'outmate': '€19,99–€27,50', 'ours': dict(zip(SIZES8, BH))})
    simple('wieltas-easy-up', 'Wieltas easy-up partytent', 'Tas & wielset', ['zakelijk', 'gebruik:evenement'], [opt('Maat', SIZES8)],
           [variant(f'KK-TAS-WT-{code(m)}', [m], p, 3000 + 300 * i, inv(5, m + 'wt')) for i, (m, p) in enumerate(zip(SIZES8, WT))],
           [img('wieltas-easy-up-hero.webp', 'hero', 1, 'draagtas', {'height': 1.7, 'color': 'zwart', 'wheels': True, 'logo': True}, 'hero', None, 'needs-param'),
            img('wieltas-easy-up-detail.webp', 'detail', 3, 'draagtas', {'height': 1.7, 'color': 'zwart', 'wheels': True}, 'detail', None, 'needs-param', alt='wielen en handgreep')],
           {'kenmerk_kort': '600D polyester · 2 wielen · rits over de volle lengte', 'past_op': EUX, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Rijden in plaats van tillen: voor wie de tent vaak verplaatst; bij Professional al inbegrepen (zeg dat), extra of vervanging.',
           ['wieltas partytent', 'tas met wielen easy up'], {'ours': dict(zip(SIZES8, WT)), 'note': 'geen referentieprijs gevonden'})
    simple('wielset-easy-up', 'Wielset easy-up (4 zwenkwielen)', 'Tas & wielset', ['zakelijk'], [],
           [variant('KK-TAS-WIEL-4', [], 32.95, 2400, 20)],
           [img('wielset-easy-up-hero.webp', 'hero', 1, 'wielset', {}, 'hero', None, 'existing')],
           {'kenmerk_kort': '4 zwenkwielen met rem · 10 cm rubber · poten 40–50 mm', 'past_op': EU, 'verzending': 'pakket',
            'specificaties': [sp('Wiel', 'Diameter', '10 cm, rubber'), sp('Wiel', 'Rem', 'Ja, op alle 4'), sp('Pasvorm', 'Poten', 'Zeskant 40 en 50 mm, met vleugelbout')]},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Wielen onder de poten om de opgezette tent te verplaatsen (bv. op een beurs); altijd remmen vast en verzwaren.',
           ['wielen easy up', 'wielset partytent'], {'outmate': '€35', 'ours': 32.95})
    OT = {'3 m breed': 54.95, '4 m breed': 59.95, '5 m breed': 69.95, '6 m breed': 79.95, '8 m breed': 94.95}
    simple('opbergtassenset-partytent', 'Opbergtassenset partytent buizenframe', 'Tas & wielset', ['zakelijk', 'gebruik:evenement'], [opt('Maat', list(OT))],
           [variant(f'KK-TAS-OTS-{code(m.split()[0] + " m")}', [m], p, 2500 + 400 * i, inv(6, m + 'ots')) for i, (m, p) in enumerate(OT.items())],
           [img('opbergtassenset-partytent-hero.webp', 'hero', 1, 'tubeBag', {'count': 3, 'color': 'zwart'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Tassen voor buizen, koppelstukken en doek', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL},
           ['partytent-onderdelen-accessoires.opbergtassen'], 'buizenframe', 'Ordelijk opbergen van een buizenframe-tent: tas voor buizen, voor koppelstukken en voor het doek.',
           ['opbergtas partytent', 'tas partytent buizen'], {'outmate': '3 m breed €65 · 4 m breed €69', 'ours': OT})

    # ------------------------------------------------------------ goten & koppelingen
    # 2 m (easy-up 2 x 2), 5 m (5 x 5) and 10 m (buizenframe 5 x 10 / 6 x 10) so every tent side has a gutter
    RG = {'2 m': 19.95, '3 m': 24.95, '4 m': 29.95, '4,5 m': 32.95, '5 m': 36.95, '6 m': 42.95, '8 m': 59.95, '10 m': 74.95}
    RGK = ['Wit', 'Zwart']
    vs = [variant(f'KK-GOOT-RG-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 500 + 120 * i, inv(8, m + k)) for i, (m, p) in enumerate(RG.items()) for k in RGK]
    imgs, vmap = kleur_images('regengoot-partytent', RGK, 'rainGutter', lambda k: {'length': 3, 'color': render_color(k)}, 'Wit',
                              [img('regengoot-partytent-tussen-twee-tenten.webp', 'in-gebruik', 3, 'items', {'items': [
                                  {'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit', 'position': [-1.55, 0, 0]},
                                  {'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit', 'position': [1.55, 0, 0]},
                                  {'model': 'rainGutter', 'length': 3, 'color': 'wit', 'mounted': True}]}, 'hero', 'Wit', 'needs-model',
                                  alt='tussen twee easy-ups (tenten niet inbegrepen)')], status='needs-model', p2=3)
    simple('regengoot-partytent', 'Regengoot partytent', 'Regengoot & koppeling', ['gebruik:evenement', 'gebruik:markt'],
           [opt('Maat', list(RG)), opt('Kleur', RGK)], vs, imgs,
           {'kenmerk_kort': 'PVC-goot tussen twee tenten · klittenband', 'past_op': EU, 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL},
           ['easy-up-accessoires.easy-up-goten', 'partytent-onderdelen-accessoires.regengoten-partytent'], 'goten',
           'Water tussen twee tenten afvoeren; lengte = zijde waarop je koppelt; voor easy-ups én buizenframe-tenten.',
           ['regengoot partytent', 'regengoot easy up'], {'outmate': '3 m €29 · 4,5 m €37,50 · 6 m €49 · 8 m €84 (lengtes 3–10 m)', 'ours': RG}, vmap=vmap)
    simple('koppelset-easy-up', 'Koppelset easy-up voor 2 tenten', 'Regengoot & koppeling', ['gebruik:evenement'],
           [opt('Uitvoering', ['Professional (50 mm)', 'Premium (40 mm)'])],
           [variant('KK-GOOT-KOP-PRO', ['Professional (50 mm)'], 11.95, 400, 25), variant('KK-GOOT-KOP-PRM', ['Premium (40 mm)'], 9.95, 300, 25)],
           [img('koppelset-easy-up-hero.webp', 'hero', 1, 'tentCoupler', {'line': 'professional'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Klemt twee poten aan elkaar · 40 of 50 mm', 'past_op': EU, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-goten'], 'goten', 'Twee tenten strak naast elkaar: per gedeelde poot één klem; combineer met regengoot of verbindingsstrook.',
           ['koppelstuk easy up', 'twee partytenten koppelen'], {'outmate': '€12,50', 'ours': {'Professional': 11.95, 'Premium': 9.95}})
    VS = {'3 m': 16.95, '4 m': 19.95, '4,5 m': 21.95, '6 m': 26.95}
    vs = [variant(f'KK-GOOT-VBS-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 300 + 80 * i, inv(8, m + k + 'v')) for i, (m, p) in enumerate(VS.items()) for k in RGK]
    imgs, vmap = kleur_images('verbindingsstrook-easy-up', RGK, 'connectionStrip', lambda k: {'length': 3, 'color': render_color(k)}, 'Wit', status='needs-model', p2=3)
    simple('verbindingsstrook-easy-up', 'Verbindingsstrook easy-up', 'Regengoot & koppeling', ['gebruik:evenement'],
           [opt('Maat', list(VS)), opt('Kleur', RGK)], vs, imgs, {'kenmerk_kort': 'Dicht de kier tussen twee daken · klittenband', 'past_op': EU, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-goten'], 'goten', 'Strook die de kier tussen twee daken afdekt, voor één doorlopende overkapping.',
           ['verbindingsstrook partytent'], {'outmate': '€19 per stuk', 'ours': VS}, vmap=vmap)

    # ------------------------------------------------------------ buizenframe tents
    # Catalog round 2026-10-18 (H1, H2): every line in Kleur (our own names for the two-tone cloths: 'Grijs-wit' = banen in grijs en wit,
    # dak en wanden alike) and the size range of the reference per line. Prices ca. 5-15% under the lower reference, rising with the floor
    # area; the compleet line stays above the Premium tent of the same size (it is that tent plus stormbanden and tassen).
    LINES = [
        ('partytent-pe-basis-buizenframe', 'Partytent PE Basis met buizenframe', 'pe-basic', 'PE', 'PE 180–200 g/m², waterafstotend', 2.6,
         {'3 x 4 m': (249, 279), '3 x 6 m': (309, 349), '4 x 4 m': (299, 335), '4 x 6 m': (349, 389), '4 x 8 m': (399, 439), '5 x 10 m': (479, 525)},
         'Instap voor een paar keer per jaar: PE-doek, zijwanden met ramen; niet voor lang laten staan.', ['gebruik:tuinfeest']),
        ('partytent-pvc-500-comfort', 'Partytent PVC 500 Comfort', 'pvc-classic', 'C5', 'PVC 500 g/m², gelaste naden', 3.5,
         {'3 x 3 m': (349, 395), '3 x 4 m': (379, 399), '3 x 6 m': (459, 529), '3 x 8 m': (599, 659), '4 x 4 m': (429, 479), '4 x 6 m': (479, 559),
          '4 x 8 m': (609, 669), '4 x 10 m': (699, 779), '5 x 4 m': (449, 499), '5 x 6 m': (489, 529), '5 x 8 m': (649, 729), '5 x 10 m': (719, 839),
          '5 x 12 m': (739, 779), '6 x 6 m': (649, 729), '6 x 8 m': (669, 725), '6 x 10 m': (849, 899), '6 x 12 m': (1049, 1199)},
         'PVC voor regelmatig gebruik: stevig doek; kortere evenementen.', ['gebruik:tuinfeest', 'gebruik:evenement']),
        # price rises with the floor area: a size is never cheaper than a size it contains (the reference dips at 5 x 6 m and 6 x 10 m; we
    # stay 5-15% under it and keep our own ladder: PVC 500 3 x 6 / 4 x 6 / 4 x 8 / 5 x 6 and PVC 550 5 x 6 / 5 x 10 / 6 x 10 adjusted)
        ('partytent-pvc-550-premium', 'Partytent PVC 550 Premium', 'pvc-premium', 'P55', 'PVC 550 g/m², gelaste naden, treksterkte 860 N', 3.8,
         # catalog round 3: 4 x 4 / 4 x 6 / 4 x 8 / 5 x 10 m lowered so the compleet (ref = the anthracite line, below this premium line there)
         # can sit 5-6% under its reference and still above this tent without stormbanden and tassen
         {'3 x 3 m': (399, 439), '3 x 4 m': (459, 499), '3 x 6 m': (549, 589), '3 x 8 m': (719, 789), '4 x 4 m': (495, 579), '4 x 6 m': (615, 719),
          '4 x 8 m': (745, 869), '4 x 10 m': (899, 999), '5 x 4 m': (609, 689), '5 x 6 m': (679, 729), '5 x 8 m': (849, 949), '5 x 10 m': (959, 1125),
          '5 x 12 m': (1049, 1125), '6 x 6 m': (819, 875), '6 x 8 m': (899, 949), '6 x 10 m': (999, 1075), '6 x 12 m': (1379, 1499), '8 x 12 m': (1699, 1850)},
         'Het werkpaard: 550 g/m² PVC met grondframe en nokversteviging, ook voor weken laten staan.', ['zakelijk', 'gebruik:evenement']),
        ('partytent-pvc-550-compleet', 'Partytent PVC 550 compleet met toebehoren', 'pvc-ultimate', 'P55C', 'PVC 550 g/m², gelaste naden', 3.9,
         {'3 x 4 m': (479, 486), '3 x 6 m': (589, 643), '4 x 4 m': (509, 539), '4 x 6 m': (624, 657), '4 x 8 m': (765, 809), '5 x 10 m': (965, 1017)},
         'Premium-tent met stormbandenset en opbergtassen erbij: alles in één bestelling.', ['zakelijk', 'gebruik:evenement']),
        ('partytent-pvc-620-professional', 'Partytent PVC 620 Professional', 'pvc-professional', 'P62', 'PVC 620 g/m², gelaste naden, treksterkte 930 N', 4.3,
         {'3 x 4 m': (509, 569), '3 x 6 m': (619, 695), '4 x 6 m': (699, 775), '4 x 8 m': (979, 1049), '5 x 10 m': (1199, 1275), '6 x 12 m': (1599, 1725)},
         'Zwaarste PVC met 220 cm zijhoogte voor verhuur en langdurig gebruik.', ['zakelijk', 'gebruik:evenement']),
    ]
    TWO = ['Grijs-wit', 'Antraciet-wit', 'Blauw-wit', 'Groen-wit', 'Rood-wit', 'Zandkleur-wit']
    BF_KLEUR = {'pe-basic': ['Wit', 'Groen-wit', 'Blauw-wit'],
                'pvc-classic': ['Wit'] + TWO,
                'pvc-premium': ['Wit', 'Grijs-wit', 'Blauw-wit', 'Groen-wit', 'Rood-wit', 'Zandkleur-wit', 'Grijs', 'Groen'],
                'pvc-ultimate': ['Wit', 'Grijs-wit', 'Antraciet-wit'],
                'pvc-professional': ['Wit', 'Grijs-wit']}
    def bf_sort(ms):
        return sorted(ms, key=lambda m: [float(x.replace(',', '.')) for x in m.replace(' m', '').split(' x ')])
    bf_handles = [l[0] for l in LINES]
    BF_LINE = {}
    for h, title, sub, c, doek, f, sizes, brief, tags in LINES:
        BF_LINE[h] = {'sub': sub, 'code': c, 'sizes': sizes}
        kl = BF_KLEUR[sub]
        vs = []
        for m, (p, om) in sizes.items():
            w, d = [float(x.replace(',', '.')) for x in m.replace(' m', '').split(' x ')]
            kg = round(w * d * f + 10)
            for k in kl:
                vs.append(variant(f'KK-TENT-BF-{c}-{code(m)}-{COLOR_CODE[k]}', [m, k], p, kg * 1000, inv(3, h + m + k)))
        line = 'pe' if sub == 'pe-basic' else 'pvc'
        # renders/models/frameTent.js `series`: storm straps (550 compleet), ground frame (550 premium), 2,2 m side height (620)
        ser = {'pe-basic': 'basis', 'pvc-classic': '500', 'pvc-premium': '550-premium', 'pvc-ultimate': '550-compleet', 'pvc-professional': '620'}[sub]
        imgs = [img(f'{h}-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': line, 'series': ser, 'color': 'wit', 'walls': 'windows'}, 'hero', 'Wit', 'needs-model'),
                img(f'{h}-front.webp', 'front', 3, 'frameTent', {'w': 4, 'd': 8, 'line': line, 'series': ser, 'color': 'wit', 'walls': 'windows', 'door': 'open'}, 'front', 'Wit', 'needs-model')]
        imgs += [img(f'{h}-{slug(k)}-hero.webp', 'variant', 3, 'frameTent', {'w': 4, 'd': 8, 'line': line, 'series': ser, 'color': render_color(k), **render_stripes(k), 'walls': 'windows'},
                     'hero', k, 'needs-param') for k in kl if k != 'Wit']
        incl = 'Buizenframe, dak, zijwanden met ramen, deur met rits, haringen' + (', stormbandenset en opbergtassenset' if sub == 'pvc-ultimate' else '')
        simple(h, title, 'Partytent', tags + ['pallet'], [opt('Maat', list(sizes)), opt('Kleur', kl)], vs, imgs,
               {'kenmerk_kort': f'38 mm verzinkt staal · {doek.split(",")[0]}' + (' · zijhoogte 220 cm' if sub == 'pvc-professional' else ''),
                'specificaties': [sp('Frame', 'Buizen', '38 mm, verzinkt staal, wand 1,2 mm'), sp('Doek', 'Materiaal', doek),
                                  sp('Levering', 'Inbegrepen', incl), sp('Levering', 'Vervoer', 'Vracht op pallet')],
                'vergelijk_groep': 'partytent-buizenframe', 'verzending': 'pallet', 'staffelkorting': ST_GROOT if 'zakelijk' in tags else ST_TENT,
                'garantie': '1 jaar op frame en doek'},
               [f'partytenten-buizenframe.{sub}'], 'buizenframe', brief, [f'partytent {list(sizes)[0].replace(" m", "").replace(" ", "")}', 'partytent buizenframe', 'partytent pvc',
                                                                         'partytent grijs wit'],
               {'outmate': {m: v[1] for m, v in sizes.items()}, 'ours': {m: v[0] for m, v in sizes.items()}}, weight=1,
               vmap={'Wit': f'{h}-hero.webp', **{k: f'{h}-{slug(k)}-hero.webp' for k in kl if k != 'Wit'}})

    # ------------------------------------------------------------ opslagtenten (moved up: the dakzeilen and wanden cover their sizes and colours)
    # Priced in ONE direction against the buizenframe partytent with the same doek and maat (merchandising review 3): the opslagtent is ca.
    # 5-8 % under the partytent (walls dicht without ramen, a roldeur), and under the opslagtent reference. 16 sizes per doek like the reference
    # (H2: we had 6), PVC 620 in its 6 sizes; Kleur Wit, Grijs, Groen and Zwart (PVC 620: Wit, Grijs), the colours storage tents sell in.
    OSU = ['PVC 500 Comfort', 'PVC 550 Premium', 'PVC 620 Professional']   # the names of the buizenframe tent lines (naming review)
    OS_REF = {
        'PVC 500 Comfort': {'3 x 4 m': 399, '3 x 6 m': 529, '3 x 8 m': 659, '4 x 4 m': 479, '4 x 6 m': 559, '4 x 8 m': 669, '4 x 10 m': 779, '5 x 4 m': 499,
                            '5 x 6 m': 529, '5 x 8 m': 729, '5 x 10 m': 839, '5 x 12 m': 749, '6 x 6 m': 729, '6 x 8 m': 789, '6 x 10 m': 899, '6 x 12 m': 1199},
        'PVC 550 Premium': {'3 x 4 m': 499, '3 x 6 m': 589, '3 x 8 m': 639, '4 x 4 m': 579, '4 x 6 m': 719, '4 x 8 m': 869, '4 x 10 m': 999, '5 x 4 m': 689,
                            '5 x 6 m': 729, '5 x 8 m': 949, '5 x 10 m': 1125, '5 x 12 m': 999, '6 x 6 m': 875, '6 x 8 m': 949, '6 x 10 m': 1075, '6 x 12 m': 1499},
        'PVC 620 Professional': {'3 x 4 m': 569, '3 x 6 m': 695, '4 x 6 m': 775, '4 x 8 m': 919, '5 x 10 m': 1175, '6 x 12 m': 1699},
    }
    OS_TENT = {'PVC 500 Comfort': 'partytent-pvc-500-comfort', 'PVC 550 Premium': 'partytent-pvc-550-premium', 'PVC 620 Professional': 'partytent-pvc-620-professional'}
    OS_KLEUR = {'PVC 500 Comfort': ['Wit', 'Grijs', 'Groen', 'Zwart'], 'PVC 550 Premium': ['Wit', 'Grijs', 'Groen', 'Zwart'], 'PVC 620 Professional': ['Wit', 'Grijs']}
    OSK = ['Wit', 'Grijs', 'Groen', 'Zwart']
    OS = {}
    for u in OSU:
        tent = BF_LINE[OS_TENT[u]]['sizes']
        for m, ref in OS_REF[u].items():
            pt = tent.get(m, (None,))[0]
            want = min(pt * 0.94, ref * 0.92) if pt else ref * 0.92
            floor = min(ref * 0.85, pt * 0.95) if pt else ref * 0.85     # never more than 15% under the reference, never above the tent
            OS.setdefault(m, {})[u] = float(x9(max(want, floor)))
    # within one doek and one breedte the price rises with the length (the reference has dips, e.g. 5 x 12 m under 5 x 10 m)
    for u in OSU:
        for wdt in {m.split(' x ')[0] for m in OS}:
            last = 0
            for m in bf_sort([m for m in OS if u in OS[m] and m.split(' x ')[0] == wdt]):
                if OS[m][u] <= last:
                    OS[m][u] = float(x9(last + 29))
                last = OS[m][u]
    OS_SIZES = bf_sort(OS)
    vs = []
    for m in OS_SIZES:
        w, d = [float(x) for x in m.replace(' m', '').split(' x ')]
        for u in OSU:
            if u not in OS[m]:
                continue
            for k in OS_KLEUR[u]:
                vs.append(variant(f'KK-TENT-OS-{["C5", "P55", "P62"][OSU.index(u)]}-{code(m)}-{COLOR_CODE[k]}', [m, u, k], OS[m][u],
                                  (w * d * (3.6 + OSU.index(u) * 0.4) + 12) * 1000, inv(2, m + u + k)))
    os_imgs = [img('opslagtent-pvc-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 6, 'line': 'pvc', 'color': 'wit', 'variant': 'opslag', 'door': 'rolled'}, 'hero', 'Wit', 'needs-model'),
               img('opslagtent-pvc-front.webp', 'front', 3, 'frameTent', {'w': 4, 'd': 6, 'line': 'pvc', 'color': 'wit', 'variant': 'opslag', 'door': 'open'}, 'front', 'Wit', 'needs-model')]
    os_imgs += [img(f'opslagtent-pvc-{slug(k)}-hero.webp', 'variant', 3, 'frameTent', {'w': 4, 'd': 6, 'line': 'pvc', 'color': render_color(k), 'variant': 'opslag', 'door': 'rolled'},
                    'hero', k, 'needs-param') for k in OSK if k != 'Wit']
    simple('opslagtent-pvc', 'Opslagtent PVC met buizenframe', 'Opslagtent', ['zakelijk', 'pallet'], [opt('Maat', OS_SIZES), opt('Uitvoering', OSU), opt('Kleur', OSK)], vs, os_imgs,
           {'kenmerk_kort': '38 mm verzinkt staal · PVC 500, 550 of 620 g/m² · roldeur', 'verzending': 'pallet', 'garantie': '1 jaar op frame en doek',
            'staffelkorting': ST_GROOT,
            'specificaties': [sp('Doek', 'PVC 500 Comfort', 'Kort gebruik (seizoen, evenement)'), sp('Doek', 'PVC 550 Premium', 'Langer gebruik, bv. tijdens een verbouwing'),
                              sp('Doek', 'PVC 620 Professional', 'Langdurig, zwaarste doek')]},
           ['opslagtenten.opslag-lines', 'opslagtenten.opslag-pvc-classic', 'opslagtenten.opslag-pvc-premium', 'opslagtenten.opslag-pvc-professional'], 'opslag',
           'Tijdelijke opslag (verbouwing, oogst, voorraad): drie doekdiktes met eerlijk advies welke voor hoe lang; geen vergunningsadvies geven, wel noemen dat het kan gelden.',
           ['opslagtent', 'opslagtent 4x6', 'tijdelijke opslag tent', 'opslagtent groen'], {'outmate': OS_REF, 'ours': OS},
           vmap={'Wit': 'opslagtent-pvc-hero.webp', **{k: f'opslagtent-pvc-{slug(k)}-hero.webp' for k in OSK if k != 'Wit'}})
    # carport: 3,3 x 7,2 and 3,3 x 9,6 m added (H2); priced under the reference (4,8 m: € 599 actie, 7,2 m: € 979, 9,6 m: € 1.099, actie € 750)
    CP = {'3,3 x 4,8 m': (569.0, 95000), '3,3 x 7,2 m': (879.0, 135000), '3,3 x 9,6 m': (989.0, 172000)}
    simple('carport-opslagtent-vast-frame', 'Carport en opslagtent met vast frame', 'Opslagtent', ['pallet'], [opt('Maat', list(CP))],
           [variant(f'KK-TENT-CP-{code(m)}', [m], p, g, 2) for m, (p, g) in CP.items()],
           [img('carport-opslagtent-vast-frame-hero.webp', 'hero', 1, 'carportTent', {'w': 3.3, 'd': 4.8, 'color': 'wit'}, 'hero', 'Wit', 'needs-model'),
            img('carport-opslagtent-vast-frame-7-2-hero.webp', 'variant', 3, 'carportTent', {'w': 3.3, 'd': 7.2, 'color': 'wit'}, 'hero', 'Wit', 'needs-model', alt='3,3 × 7,2 m'),
            img('carport-opslagtent-vast-frame-9-6-hero.webp', 'variant', 3, 'carportTent', {'w': 3.3, 'd': 9.6, 'color': 'wit'}, 'hero', 'Wit', 'needs-model', alt='3,3 × 9,6 m')],
           {'kenmerk_kort': 'Vast stalen frame · PVC dak en wanden · 4,8 tot 9,6 m lang', 'verzending': 'pallet'},
           ['opslagtenten.opslag-carport-pvc-professional'], 'opslag', 'Carport die ook opslag is: vast frame, PVC rondom; voor- en achterkant afneembaar; 3 lengtes.',
           ['carport tent', 'opslagtent carport', 'carport 3x7'], {'outmate': '3,3x4,8 €599 (actie, was €859) · 3,3x7,2 €979 · 3,3x9,6 €750 (actie, was €1.099)', 'ours': {m: v[0] for m, v in CP.items()}},
           vmap={'3,3 x 4,8 m': 'carport-opslagtent-vast-frame-hero.webp', '3,3 x 7,2 m': 'carport-opslagtent-vast-frame-7-2-hero.webp',
                 '3,3 x 9,6 m': 'carport-opslagtent-vast-frame-9-6-hero.webp'}, vby='Maat')

    # buizenframe parts
    # Dakzeil: a roof for every size, cloth and colour we sell, tents and opslagtenten alike. Two products since the colour range (H1): one
    # product per cloth group would pass the 250 variants Liquid lists. PE and PVC 550 are the standard roofs (levertijd 1-2 weken); PVC 500 and
    # PVC 620 are made on request (3-4 weken), and the Uitvoering says so, because the contract has no per-variant levertijd. Prices: PVC 550
    # rises with the roof area, PVC 500 ~8 % under, PVC 620 ~12 % over, PE ~half; the same price in every colour. Owner review.
    P550 = {'3 x 3 m': 149, '3 x 4 m': 169, '3 x 6 m': 199, '3 x 8 m': 249, '4 x 4 m': 189, '4 x 6 m': 239, '4 x 8 m': 289, '4 x 10 m': 319, '5 x 4 m': 209,
            '5 x 6 m': 279, '5 x 8 m': 339, '5 x 10 m': 429, '5 x 12 m': 479, '6 x 6 m': 319, '6 x 8 m': 389, '6 x 10 m': 479, '6 x 12 m': 549, '8 x 12 m': 649}
    PPE = {'3 x 4 m': 89, '3 x 6 m': 109, '4 x 4 m': 99, '4 x 6 m': 129, '4 x 8 m': 149, '5 x 10 m': 199}
    def cloth_sizes_colours(tent_hs, os_u):
        ms, ks = set(), []
        for tent_h in ([tent_hs] if isinstance(tent_hs, str) else tent_hs):
            ms |= set(BF_LINE[tent_h]['sizes'])
            ks += [k for k in BF_KLEUR[BF_LINE[tent_h]['sub']] if k not in ks]
        if os_u:
            ms |= {m for m in OS if os_u in OS[m]}
            ks += [k for k in OS_KLEUR[os_u] if k not in ks]
        return bf_sort(ms), ks
    def dakzeil(h, title, groups, kenmerk, brief, kw, ref):
        vs_, ref_, ms_all, ks_all = [], {}, [], []
        for u, c, tent_h, os_u, gsm, pf in groups:
            ms, ks = cloth_sizes_colours(tent_h, os_u)
            for m in ms:
                w, d = [float(x.replace(',', '.')) for x in m.replace(' m', '').split(' x ')]
                pr = pf(m)
                for k in ks:
                    vs_.append(variant(f'KK-DAK-BF-{c}-{code(m)}-{COLOR_CODE[k]}', [m, u, k], pr, round(w * d * 1.15 * gsm + 500), None, tracked=False))
                ref_[f'{m} {u}'] = pr
            ms_all += [m for m in ms if m not in ms_all]
            ks_all += [k for k in ks if k not in ks_all]
        ms_all = bf_sort(ms_all)
        ks_all = [k for k in ['Wit'] + TWO + ['Grijs', 'Groen', 'Zwart'] if k in ks_all]
        imgs = [img('dakzeil-partytent-buizenframe-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': 'pvc', 'color': 'wit', 'walls': 'none', 'frame': False}, 'hero', 'Wit',
                    'needs-model', extra={'shared_with': 'dakzeil-partytent-buizenframe'} if h != 'dakzeil-partytent-buizenframe' else None)]
        imgs += [img(f'dakzeil-partytent-buizenframe-{slug(k)}-hero.webp', 'variant', 3, 'frameTent',
                     {'w': 4, 'd': 8, 'line': 'pvc', 'color': render_color(k), **render_stripes(k), 'walls': 'none', 'frame': False}, 'hero', k, 'needs-param',
                     extra={'shared_with': 'dakzeil-partytent-buizenframe'} if h != 'dakzeil-partytent-buizenframe' else None) for k in ks_all if k != 'Wit']
        simple(h, title, 'Dakzeil', ['zakelijk'], [opt('Maat', ms_all), opt('Uitvoering', [g[0] for g in groups]), opt('Kleur', ks_all)], vs_, imgs,
               {'kenmerk_kort': kenmerk, 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
                'levertijd': 'Levertijd 1–2 weken' + ((' (' + ' en '.join(g[0].split(' (')[0] for g in groups if 'aanvraag' in g[0]) + ' op aanvraag: 3–4 weken)')
                                                       if any('aanvraag' in g[0] for g in groups) else '')},
               ['partytent-onderdelen-accessoires.dakzeilen'], 'buizenframe', brief, kw, {'outmate': ref, 'ours': ref_},
               vmap={'Wit': 'dakzeil-partytent-buizenframe-hero.webp', **{k: f'dakzeil-partytent-buizenframe-{slug(k)}-hero.webp' for k in ks_all if k != 'Wit'}})
    dakzeil('dakzeil-partytent-buizenframe', 'Dakzeil partytent buizenframe PVC 550 en PVC 620',
            [('PVC 550', 'PVC', ['partytent-pvc-550-premium', 'partytent-pvc-550-compleet'], 'PVC 550 Premium', 550, lambda m: P550[m]),
             ('PVC 620 (op aanvraag)', 'P62', 'partytent-pvc-620-professional', 'PVC 620 Professional', 620, lambda m: x9(P550[m] * 1.12))],
            'Vervangend dak · PVC 550 of 620 g/m² · 3 × 3 tot 8 × 12 m · in de tentkleur',
            'Vervangend dak voor de PVC 550 Premium, PVC 550 compleet, PVC 620 Professional en de opslagtenten in die doeken: zelfde maat, doek en kleur.',
            ['dakzeil partytent 4x8', 'vervangend dak partytent', 'dakzeil partytent 6x12 pvc', 'dakzeil grijs wit'],
            '3x4 PVC €189 · 4x10 €319 · 5x10 €399–€469 · 5x12 €429 · 6x10 €415 · 6x12 €599 · 8x12 €559')
    dakzeil('dakzeil-partytent-buizenframe-pe-en-pvc-500', 'Dakzeil partytent buizenframe PE en PVC 500',
            [('PE', 'PE', 'partytent-pe-basis-buizenframe', None, 190, lambda m: PPE[m]),
             ('PVC 500 (op aanvraag)', 'C5', 'partytent-pvc-500-comfort', 'PVC 500 Comfort', 500, lambda m: x9(P550[m] * 0.92))],
            'Vervangend dak · PE of PVC 500 g/m² · 3 × 3 tot 6 × 12 m · in de tentkleur',
            'Vervangend dak voor de PE Basis, de PVC 500 Comfort en de opslagtent PVC 500: zelfde maat, doek en kleur.',
            ['dakzeil partytent pe', 'dakzeil partytent 3x6', 'dakzeil pvc 500'], 'PE 4x8 €169 · 5x6 PVC €209')
    BF_DAK = {'partytent-pe-basis-buizenframe': ('dakzeil-partytent-buizenframe-pe-en-pvc-500', 'PE'),
              'partytent-pvc-500-comfort': ('dakzeil-partytent-buizenframe-pe-en-pvc-500', 'PVC 500 (op aanvraag)'),
              'partytent-pvc-550-premium': ('dakzeil-partytent-buizenframe', 'PVC 550'), 'partytent-pvc-550-compleet': ('dakzeil-partytent-buizenframe', 'PVC 550'),
              'partytent-pvc-620-professional': ('dakzeil-partytent-buizenframe', 'PVC 620 (op aanvraag)')}
    OS_DAK = {'PVC 500 Comfort': ('dakzeil-partytent-buizenframe-pe-en-pvc-500', 'PVC 500 (op aanvraag)'), 'PVC 550 Premium': ('dakzeil-partytent-buizenframe', 'PVC 550'),
              'PVC 620 Professional': ('dakzeil-partytent-buizenframe', 'PVC 620 (op aanvraag)')}
    # compleet sizes the PVC 550 roof must cover too
    for m in BF_LINE['partytent-pvc-550-compleet']['sizes']:
        assert m in P550, m
    # Wanden in the tent colours (H1) and a 1,5 m panel for the 3 m long tents (M8: two vakken of 1,5 m). Maat = breedte x hoogte.
    WALL_K = ['Wit'] + TWO + ['Grijs', 'Groen', 'Zwart']
    PE_K = BF_KLEUR['pe-basic']
    P620_K = ['Wit', 'Grijs-wit', 'Grijs']
    ZW2 = [('2 x 2 m', 'PVC met raam', 24.95, 'RA', 1800, WALL_K), ('2 x 2 m', 'PVC dicht', 24.95, 'DI', 1800, WALL_K), ('2 x 2 m', 'PVC met raam en ritsen', 39.95, 'RR', 2000, WALL_K),
           ('2 x 2 m', 'PE met raam', 14.95, 'PE-RA', 900, PE_K), ('2 x 2 m', 'PE dicht', 13.95, 'PE-DI', 900, PE_K),
           ('1,5 x 2 m', 'PVC met raam', 21.95, 'RA-15', 1400, WALL_K), ('1,5 x 2 m', 'PVC dicht', 21.95, 'DI-15', 1400, WALL_K),
           ('1,5 x 2 m', 'PVC met raam en ritsen', 34.95, 'RR-15', 1600, WALL_K), ('1,5 x 2 m', 'PE met raam', 12.95, 'PE-RA-15', 700, PE_K),
           ('1,5 x 2 m', 'PE dicht', 11.95, 'PE-DI-15', 700, PE_K),
           ('2 x 2,2 m', 'PVC met raam', 28.95, 'RA-220', 2300, P620_K), ('2 x 2,2 m', 'PVC dicht', 28.95, 'DI-220', 2300, P620_K),
           ('2 x 2,2 m', 'PVC met raam en ritsen', 44.95, 'RR-220', 2500, P620_K)]
    ZW2U = ['PVC met raam', 'PVC dicht', 'PVC met raam en ritsen', 'PE met raam', 'PE dicht']
    wall_imgs = [img('partytent-pvc-550-premium-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': 'pvc', 'series': '550-premium', 'color': 'wit', 'walls': 'windows'}, 'hero', 'Wit', 'existing',
                     extra={'shared_with': 'partytent-pvc-550-premium'})]
    wall_imgs += [img(f'zijwand-partytent-2-m-pvc-{slug(k)}-hero.webp', 'variant', 3, 'sideWall', {'length': 2, 'height': 2, 'type': 'panorama', 'color': render_color(k), **render_stripes(k),
                                                                                                  'material': 'pvc'}, 'hero', k, 'needs-param') for k in WALL_K if k != 'Wit']
    simple('zijwand-partytent-2-m-pvc', 'Zijwand partytent buizenframe 1,5 of 2 m (PVC of PE)', 'Zijwand', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', ['1,5 x 2 m', '2 x 2 m', '2 x 2,2 m']), opt('Uitvoering', ZW2U), opt('Kleur', WALL_K)],
           [variant(f'KK-ZW-BF-2M-{c}-{COLOR_CODE[k]}', [m, n, k], p, g, inv(20, c + 'zw2' + k)) for m, n, p, c, g, ks in ZW2 for k in ks],
           wall_imgs,
           {'kenmerk_kort': 'Paneel 1,5 of 2 m · 200 of 220 cm hoog · PVC of PE · tentkleuren', 'verzending': 'pakket', 'past_op': bf_handles + ['opslagtent-pvc'],
            'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Wand', 'Breedte', '2 m (één vak tussen twee staanders) of 1,5 m (de vakken van een 3 m lange tent)'),
                              sp('Wand', 'Hoogte', '200 cm (2 x 2 m, 1,5 x 2 m) of 220 cm (2 x 2,2 m, PVC 620 Professional)'),
                              sp('Wand', 'PVC', 'PVC 500 g/m² (200 cm) of 620 g/m² (220 cm), gelaste naden'), sp('Wand', 'PE', 'PE 180 g/m², voor de PE Basis')]},
           ['partytent-onderdelen-accessoires.zijwanden'], 'buizenframe', 'Los paneel om een buizenframe-tent aan te vullen of te vervangen: 200 cm hoog in PVC of PE, 220 cm hoog voor de PVC 620 Professional; 1,5 m voor 3 m lange tenten; in de kleur van je tent.',
           ['zijwand partytent 2 meter', 'zijwand pvc raam', 'zijwand partytent 220 cm', 'zijwand partytent grijs wit'],
           {'outmate': '2 m raam €24–€29 · ritsen €45–€49 · Professional 2,2 m hoog €29 / met ritsen €49 · zonder raam €27–€39', 'ours': {f'{m} {n}': p for m, n, p, c, g, ks in ZW2}},
           vmap={'Wit': 'partytent-pvc-550-premium-hero.webp', **{k: f'zijwand-partytent-2-m-pvc-{slug(k)}-hero.webp' for k in WALL_K if k != 'Wit'}})
    # long side walls in one piece (M8): PE 4-10 m (PE Basis), PVC 620 at 220 cm 3-10 m (Professional), with ramen
    ZWL = [('4 m', 'PE met ramen', 39.95), ('6 m', 'PE met ramen', 54.95), ('8 m', 'PE met ramen', 69.95), ('10 m', 'PE met ramen', 84.95),
           ('3 m', 'PVC 620 met ramen, 220 cm', 79.95), ('4 m', 'PVC 620 met ramen, 220 cm', 99.0), ('6 m', 'PVC 620 met ramen, 220 cm', 139.0),
           ('8 m', 'PVC 620 met ramen, 220 cm', 179.0), ('10 m', 'PVC 620 met ramen, 220 cm', 219.0)]
    ZWLU = ['PE met ramen', 'PVC 620 met ramen, 220 cm']
    vs = [variant(f'KK-ZW-BF-LANG-{"PE" if u.startswith("PE") else "P62"}-{code(m)}-{COLOR_CODE[k]}', [m, u, k], p,
                  int(float(m.split()[0]) * (450 if u.startswith('PE') else 1400)), inv(6, m + u + k))
          for m, u, p in ZWL for k in (PE_K if u.startswith('PE') else ['Wit', 'Grijs-wit'])]
    ZWLK = [k for k in PE_K + ['Grijs-wit'] if k in PE_K or k == 'Grijs-wit']
    simple('zijwand-partytent-buizenframe-lang', 'Zijwand partytent buizenframe uit één stuk (3 tot 10 m)', 'Zijwand', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', ['3 m', '4 m', '6 m', '8 m', '10 m']), opt('Uitvoering', ZWLU), opt('Kleur', ZWLK)], vs,
           [img('zijwand-partytent-buizenframe-lang-hero.webp', 'hero', 1, 'sideWall', {'length': 6, 'height': 2, 'type': 'windows', 'windows': 3, 'color': 'wit', 'material': 'pe'},
                'hero', 'Wit', 'needs-param', alt='lange zijwand met ramen, uitgerold')],
           {'kenmerk_kort': 'Hele lange zijde in één wand · PE of PVC 620 (220 cm) · met ramen', 'verzending': 'pakket',
            'past_op': ['partytent-pe-basis-buizenframe', 'partytent-pvc-620-professional'], 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Wand', 'PE', 'PE 180 g/m², 200 cm hoog, ramen elke 2 m'), sp('Wand', 'PVC 620', 'PVC 620 g/m², 220 cm hoog, ramen elke 2 m, gelaste naden'),
                              sp('Bevestiging', 'Aan de tent', 'Elastieken met bol rond dakrand en staanders')]},
           ['partytent-onderdelen-accessoires.zijwanden'], 'buizenframe',
           'Een hele lange zijde in één doek in plaats van losse panelen: PE (4–10 m) voor de PE Basis, PVC 620 van 220 cm hoog (3–10 m) voor de Professional; minder naden, sneller opgehangen.',
           ['zijwand partytent 6 meter', 'zijwand partytent lang', 'zijwand pe partytent'], {'outmate': 'zijwanden PE 4–10 m en PVC Professional 220 cm 3–10 m (per URL)', 'ours': {f'{m} {u}': p for m, u, p in ZWL}})
    ET = {'3 m': 44.95, '4 m': 54.95, '5 m': 64.95, '6 m': 74.95, '8 m': 94.95}
    ETU = ['Eindwand', 'Tussenwand', 'Eindwand, zijhoogte 220 cm', 'Tussenwand, zijhoogte 220 cm', 'Eindwand PE']
    ET220 = ['3 m', '4 m', '5 m', '6 m']   # the widths of the PVC 620 Professional (220 cm side height, higher gable)
    ETPE = {'3 m': 26.95, '4 m': 34.95, '5 m': 44.95}   # M8: PE end walls for the PE Basis (Outmate PE eindwand 3/4/5 m € 29 / 39 / 49)
    def et_kleuren(u):
        if u == 'Eindwand PE':
            return PE_K
        if '220' in u:
            return P620_K
        return WALL_K
    ets = []
    for i, (m, p) in enumerate(ET.items()):
        for u in ETU:
            if ('220' in u and m not in ET220) or (u == 'Eindwand PE' and m not in ETPE):
                continue
            for k in et_kleuren(u):
                pr = ETPE[m] if u == 'Eindwand PE' else p + (0 if u.startswith('Eindwand') else 5) + (10 if '220' in u else 0)
                sk = f'KK-ZW-BF-{"EW" if u.startswith("Eindwand") else "TW"}-{code(m)}' + ('-220' if '220' in u else '') + ('-PE' if u == 'Eindwand PE' else '') + f'-{COLOR_CODE[k]}'
                ets.append(variant(sk, [m, u, k], pr, (900 + 250 * i) if u == 'Eindwand PE' else 2500 + 600 * i + (300 if '220' in u else 0), inv(4, m + u + k)))
    et_imgs = [img('partytent-pvc-550-premium-front.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': 'pvc', 'series': '550-premium', 'color': 'wit', 'walls': 'windows', 'door': 'open'}, 'front', 'Wit', 'existing',
                   extra={'shared_with': 'partytent-pvc-550-premium'})]
    et_imgs += [img(f'eindwand-en-tussenwand-partytent-{slug(k)}-hero.webp', 'variant', 3, 'frameTent', {'w': 4, 'd': 8, 'line': 'pvc', 'color': render_color(k), **render_stripes(k),
                                                                                                         'walls': 'windows', 'door': 'open'}, 'front', k, 'needs-param') for k in WALL_K if k != 'Wit']
    simple('eindwand-en-tussenwand-partytent', 'Eindwand en tussenwand partytent met ritsen', 'Zijwand', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', list(ET)), opt('Uitvoering', ETU), opt('Kleur', WALL_K)], ets, et_imgs,
           {'kenmerk_kort': 'Kopse wand met ritsen · tot de nok · PVC of PE · tentkleuren', 'verzending': 'pakket', 'past_op': bf_handles + ['opslagtent-pvc'], 'staffelkorting': ST_TEXTIEL},
           ['partytent-onderdelen-accessoires.eindwanden', 'partytent-onderdelen-accessoires.tussenwanden'], 'buizenframe',
           'Eindwand (kopse kant tot in de nok) of tussenwand om de tent in twee ruimtes te delen; maat = tentbreedte; PVC in de tentkleuren, PE voor de PE Basis.',
           ['eindwand partytent', 'tussenwand partytent', 'eindwand pe'], {'outmate': 'eindwand 3 m vanaf €49 · PVC 5 m €65–€79 · Professional 220 cm 4/5 m €95 · 6 m €119 · PE 3/4/5 m €29/€39/€49', 'ours': ET,
                                                                           'zijhoogte_220': '+ € 10 (3, 4, 5 en 6 m)', 'pe': ETPE},
           vmap={'Wit': 'partytent-pvc-550-premium-front.webp', **{k: f'eindwand-en-tussenwand-partytent-{slug(k)}-hero.webp' for k in WALL_K if k != 'Wit'}})
    # Frame parts from our own bouwtekeningen (H12, catalog round 2026-10-18): kk_bom.py derives the parts of every tent size from the same
    # geometry (spanten every 2 m, 1,5 m vakken on 3 m long tents, dakspant per breedte, grondframe and nokversteviging per lijn) and writes
    # the stuklijst per variant; these two products sell every part on it.
    import kk_bom
    KB = kk_bom.CONNECTORS
    KB_IMG = {n: (f'koppelstukken-en-buizen-38-mm-{c.lower()}.webp' if c in ('K2', 'K3', 'K4', 'K3G') else f'koppelstukken-buizenframe-38-mm-{c.lower()}.webp') for n, _, c, _, _ in KB}
    simple('koppelstukken-en-buizen-38-mm', 'Koppelstukken buizenframe 38 mm', 'Frame-onderdeel', ['zakelijk'], [opt('Uitvoering', [k[0] for k in KB])],
           [variant(f'KK-FRM-BF-{c}', [n], p, g, inv(25, c)) for n, p, c, g, _ in KB],
           [img('koppelstukken-en-buizen-38-mm-hero.webp', 'hero', 1, 'tubeFittings', {'parts': ['2-weg', '3-weg', '4-weg', 'buis']}, 'hero', None, 'needs-model')] +
           [img(KB_IMG[n], 'variant', 2, 'tubeFittings', prm, 'hero', None, 'existing' if c in ('K2', 'K3', 'K4', 'K3G') else 'needs-param') for n, _, c, _, prm in KB],
           {'kenmerk_kort': '38 mm verzinkt staal · 17 soorten · per stuk', 'verzending': 'pakket', 'past_op': bf_handles + ['opslagtent-pvc'], 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Koppelstuk', 'Maten', 'Buiten 42 mm, binnen 38 mm, wand 1,4 mm'), sp('Koppelstuk', 'Materiaal', 'Verzinkt staal, met gelaste moer en knevelbout')]},
           ['partytent-onderdelen-accessoires.koppelstukken'], 'buizenframe',
           'Elk koppelstuk van onze buizenframes los: dakrand 110° en 120°, nok 140° (ook met lip voor de nokversteviging), dakvlak, grondframe, rechte verbinders, voetplaat, klem; hoe je het juiste onderdeel herkent.',
           ['koppelstuk partytent 38 mm', 'nokstuk partytent', 'koppelstuk grondframe'],
           {'outmate': '2-weg 20 cm €7,50 · 2-weg 50 cm €9,99 · 3-weg/4-weg 140° met lip €9,99 · vlak €9,99 · grondframe €9,99', 'ours': {k[0]: k[1] for k in KB}},
           vmap=KB_IMG, vby='Uitvoering')
    BU = kk_bom.TUBES
    BU_IMG = {n: (f'koppelstukken-en-buizen-38-mm-{c.lower()}.webp' if c in ('B159', 'B192', 'S212', 'B216') else f'buizen-buizenframe-38-mm-{c.lower()}.webp') for n, _, c, _, _ in BU}
    simple('buizen-buizenframe-38-mm', 'Buizen buizenframe 38 mm', 'Frame-onderdeel', ['zakelijk'], [opt('Uitvoering', [b[0] for b in BU])],
           [variant(f'KK-FRM-BF-{c}', [n], p, g, inv(25, c)) for n, p, c, g, _ in BU],
           [img('buizen-buizenframe-38-mm-hero.webp', 'hero', 1, 'tubeFittings', {'parts': ['buis'], 'tubeLength': 1.92, 'count': 5}, 'hero', None, 'needs-param',
                alt='bundel buizen van 38 mm')] +
           [img(BU_IMG[n], 'variant', 2, 'tubeFittings', prm, 'hero', None, 'existing',
                extra={'shared_with': 'koppelstukken-en-buizen-38-mm'} if c in ('B159', 'B192', 'S212', 'B216') else None) for n, _, c, _, prm in BU],
           {'kenmerk_kort': '38 mm verzinkt staal, wand 1,2 mm · staanders, dakbuizen, liggers', 'verzending': 'pakket', 'past_op': bf_handles + ['opslagtent-pvc'],
            'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Buis', 'Materiaal', 'Verzinkt staal 38 mm, wand 1,2 mm'), sp('Buis', 'Lengte', 'Gemeten over de hele buis, zonder koppelstuk')]},
           ['partytent-onderdelen-accessoires.buizen'], 'buizenframe',
           'Elke buis van onze buizenframes los: staanders 200 en 220 cm, dakbuizen per tentbreedte, liggers en grondframe 1,5 en 2 m, nokversteviging; welke lengte bij welke maat.',
           ['buis partytent', 'staander partytent', 'dakbuis partytent 4 meter'], {'outmate': 'buis 192 cm €9 · staander 212 cm €12,50', 'ours': {b[0]: b[1] for b in BU}},
           vmap=BU_IMG, vby='Uitvoering')
    kk_bom.register(BF_LINE, OS, OSU, BF_DAK, OS_DAK)
    simple('reparatieset-tentdoek', 'Reparatieset tentdoek PVC en polyester', 'Frame-onderdeel', [], [opt('Uitvoering', ['PVC (lijm en lappen)', 'Polyester (plakband en lappen)'])],
           [variant('KK-FRM-REP-PVC', ['PVC (lijm en lappen)'], 12.95, 300, 30), variant('KK-FRM-REP-POL', ['Polyester (plakband en lappen)'], 9.95, 200, 30)],
           [img('reparatieset-tentdoek-hero.webp', 'hero', 1, 'repairKit', {'kind': 'pvc'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Scheurtjes en gaatjes zelf dichten', 'verzending': 'pakket'},
           ['partytent-onderdelen-accessoires.grondframes-reparatie'], 'buizenframe', 'Kleine reparaties aan dak en wanden; stap voor stap, wanneer wel en wanneer een nieuw dak beter is.',
           ['reparatieset partytent', 'pvc tentdoek repareren'], {'note': 'geen referentieprijs gevonden'})
    # M21: a buizenframe gutter of its own (the easy-up gutter hangs on klittenband; this one on klemmen round the 38 mm dakrand)
    RGB = {'3 m': 49.95, '4 m': 59.95, '5 m': 69.95, '6 m': 84.95, '8 m': 109.0, '10 m': 139.0, '12 m': 159.0}
    vs = [variant(f'KK-GOOT-RGB-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 900 + 250 * i, inv(6, m + k + 'rgb')) for i, (m, p) in enumerate(RGB.items()) for k in ['Wit', 'Grijs']]
    imgs, vmap = kleur_images('regengoot-partytent-buizenframe', ['Wit', 'Grijs'], 'rainGutter', lambda k: {'length': 4, 'color': render_color(k), 'clamps': 38}, 'Wit',
                              status='needs-param', p2=3)
    simple('regengoot-partytent-buizenframe', 'Regengoot partytent buizenframe', 'Regengoot & koppeling', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', list(RGB)), opt('Kleur', ['Wit', 'Grijs'])], vs, imgs,
           {'kenmerk_kort': 'PVC-goot met klemmen om de 38 mm dakrand · 3 tot 12 m', 'past_op': bf_handles + ['opslagtent-pvc'], 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Goot', 'Materiaal', 'PVC 650 g/m², ca. 35 cm breed'), sp('Bevestiging', 'Aan de tent', 'Kunststof klemmen om de dakrandbuis van 38 mm, elke 50 cm')]},
           ['partytent-onderdelen-accessoires.regengoten-partytent'], 'buizenframe',
           'Goot tussen twee buizenframe-tenten: klemt om de dakrandbuizen in plaats van klittenband; lengte = zijde waarop je koppelt.',
           ['regengoot partytent buizenframe', 'regengoot tussen twee partytenten'], {'outmate': 'regengoot buizenframe-partytent ca. 2x easy-up-goot (per URL)', 'ours': RGB}, vmap=vmap)

    # fill stormband past_op
    HANDLES['stormbandenset-partytent']['metafields']['past_op'] = bf_handles + ['opslagtent-pvc']
    HANDLES['opbergtassenset-partytent']['metafields']['past_op'] = bf_handles + ['opslagtent-pvc']
    HANDLES['stormbandenset-partytent'].pop('past_op_note', None)
    HANDLES['regengoot-partytent']['metafields']['past_op'] = list(EU)   # M21: the buizenframe tents have their own gutter now
    # the dakzeil fits every buizenframe tent and the opslagtent (same sizes and cloths); the voetgewicht goes on a buizenframe staander
    # too: the buizenframe tents and the opslagtent offer it per staander (kk_addons.r_buizenframe), so systeem gets Buizenframe
    HANDLES['dakzeil-partytent-buizenframe']['metafields']['past_op'] = ['partytent-pvc-550-premium', 'partytent-pvc-550-compleet', 'partytent-pvc-620-professional', 'opslagtent-pvc']
    HANDLES['dakzeil-partytent-buizenframe-pe-en-pvc-500']['metafields']['past_op'] = ['partytent-pe-basis-buizenframe', 'partytent-pvc-500-comfort', 'opslagtent-pvc']
    HANDLES['voetgewicht-partytent-15-kg']['metafields']['past_op'] = EUX + bf_handles + ['opslagtent-pvc']
    # cart recommendations of the buizenframe tents and the opslagtent: extra wanden, regengoot and the matching (reserve) dak; the
    # betonblok is no recommendation (ballast is advice via offerte, see kk_addons.r_buizenframe)
    for _h in bf_handles + ['opslagtent-pvc']:
        HANDLES[_h]['complementary'] = ['zijwand-partytent-2-m-pvc', 'eindwand-en-tussenwand-partytent', 'regengoot-partytent-buizenframe',
                                        BF_DAK.get(_h, ('dakzeil-partytent-buizenframe',))[0], 'koppelstukken-en-buizen-38-mm', 'buizen-buizenframe-38-mm']
        if _h in ('partytent-pe-basis-buizenframe', 'partytent-pvc-620-professional'):
            HANDLES[_h]['complementary'].insert(1, 'zijwand-partytent-buizenframe-lang')

    # ------------------------------------------------------------ bevestigingsmateriaal (catalog round 3, M: the reference's largest category,
    # 53 SKUs; we had ca. 9). The reorder parts of the buizenframe lines and the opslagtent: losse spanbanden, oogbouten en schroefogen, dakhaken,
    # spanschroeven, schroeven; klittenband and zeilringen for every tent. Ca. 10% under the reference (Outmate prices in price_ref).
    BFX = bf_handles + ['opslagtent-pvc']
    SPB = {'9 m': (13.95, 1100), '13 m': (18.95, 1400), '15 m': (21.45, 1600), '20 m': (25.95, 1900)}
    simple('spanband-met-ratel', 'Spanband met ratel, 50 mm', 'Verankering', ['zakelijk', 'gebruik:evenement'], [opt('Maat', list(SPB))],
           [variant(f'KK-VER-SPR-{code(m)}', [m], p, g, inv(20, m + 'spr')) for m, (p, g) in SPB.items()],
           [img('spanband-met-ratel-hero.webp', 'hero', 1, 'spanbanden', {'color': 'zwart', 'length': 9, 'width': 0.05, 'ratchet': True}, 'hero', None, 'needs-param',
                alt='zwarte spanband van 50 mm met ratel en twee haken, opgerold')],
           {'kenmerk_kort': 'Zwart band 50 mm · ratel met 2 haken · 9 tot 20 m', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': BFX + ['carport-opslagtent-vast-frame'],
            'specificaties': [sp('Band', 'Breedte', '50 mm, polyester, zwart'), sp('Band', 'Lengtes', '9, 13, 15 of 20 m'),
                              sp('Ratel', 'Uitvoering', 'Verzinkte ratel met lange hendel en 2 J-haken'), sp('Band', 'Breeksterkte', 'ca. 5.000 daN (LC 2.500 daN)')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen', 'partytent-onderdelen-accessoires.stormbandensets'], 'verankering',
           'Losse spanband met ratel om een tent over het dak of langs de staanders vast te zetten aan haring, betonblok of ankerpunt; lengte kiezen naar tentbreedte (band over het dak = breedte + 2 x zijhoogte + marge).',
           ['spanband met ratel', 'spanband 9 meter', 'spanband 20 meter', 'spanband partytent'],
           {'outmate': '9 m €16 · 13 m €21 · 15 m €24 · 20 m €29 (5 cm, zwart)', 'ours': {m: v[0] for m, v in SPB.items()}})
    OOG = [('Oogbouten M6 met vleugelmoer (10 stuks)', 4.49, 'OB10', 250, 'oogbout-vleugelmoer'), ('Oogbouten M6 (25 stuks)', 5.45, 'OB25', 400, 'oogbout'),
           ('Schroefogen (25 stuks)', 8.95, 'SO25', 300, 'schroefoog'), ('Schroefogen met elastiek, zwart (10 stuks)', 8.95, 'SOE10', 250, 'schroefoog-elastiek'),
           ('Schroefogen met elastiek, zwart (25 stuks)', 22.45, 'SOE25', 600, 'schroefoog-elastiek')]
    OOG_IMG = {n: f'oogbouten-en-schroefogen-{slug(n.split(" (")[0])}.webp' for n, *_ in OOG}
    simple('oogbouten-en-schroefogen', 'Oogbouten en schroefogen', 'Verankering', ['zakelijk', 'gebruik:evenement', 'gebruik:markt'], [opt('Uitvoering', [o_[0] for o_ in OOG])],
           [variant(f'KK-VER-OOG-{c}', [n], p, g, inv(30, c)) for n, p, c, g, _ in OOG],
           [img('oogbouten-en-schroefogen-hero.webp', 'hero', 1, 'fixings', {'parts': ['oogbout', 'vleugelmoer', 'schroefoog']}, 'hero', None, 'needs-model',
                alt='verzinkte oogbouten met vleugelmoer en schroefogen naast elkaar')] +
           [img(f, 'variant', 2, 'fixings', {'parts': [part]}, 'hero', None, 'needs-model') for f, part in dict((OOG_IMG[n], part) for n, _, _, _, part in OOG).items()],
           {'kenmerk_kort': 'Verzinkt staal · M6 oogbout of schroefoog · voor wand, zeil en kabel', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': BFX,
            'specificaties': [sp('Oogbout', 'Maat', 'M6, oog Ø ca. 20 mm, steel 40 mm'), sp('Schroefoog', 'Maat', 'ca. 5 x 40 mm, voor hout'),
                              sp('Elastiek', 'Bij schroefoog met elastiek', 'Zwart tentelastiek met bal, lus ca. 18 cm'), sp('Materiaal', 'Staal', 'Elektrolytisch verzinkt')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Vaste ogen om een zijwand, zeil, prikkabel of spanband aan te hangen: oogbout door een gat in buis of plaat, schroefoog in hout (paal, vlonder, schutting); met elastiek klaar voor een zijwand.',
           ['oogbout m6', 'schroefogen', 'schroefoog met elastiek', 'oogbout vleugelmoer'],
           {'outmate': 'oogbout M6 + vleugelmoer 10 st €4,99 · oogbout M6 25 st €5,99 · schroefogen 25 st €9,95 · schroefogen + elastiek 10 st €9,99 / 25 st €25',
            'ours': {o_[0]: o_[1] for o_ in OOG}}, vmap=OOG_IMG, vby='Uitvoering')
    KLB = {'1 m': 2.25, '5 m': 9.95, '25 m': 42.95}   # 25 m = a whole rol
    simple('klittenband-zelfklevend', 'Klittenband zelfklevend, 50 mm', 'Verankering', ['gebruik:tuinfeest', 'gebruik:markt'], [opt('Maat', list(KLB)), opt('Kleur', ['Wit', 'Zwart'])],
           [variant(f'KK-VER-KLB-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 30 * int(m.split()[0]) + 20, inv(30, m + k + 'klb', k)) for m, p in KLB.items() for k in ['Wit', 'Zwart']],
           [img('klittenband-zelfklevend-wit-hero.webp', 'hero', 1, 'fixings', {'parts': ['klittenband'], 'color': 'wit'}, 'hero', 'Wit', 'needs-model',
                alt='rol wit klittenband van 50 mm, haak- en lusband los van elkaar'),
            img('klittenband-zelfklevend-zwart-hero.webp', 'variant', 2, 'fixings', {'parts': ['klittenband'], 'color': 'zwart'}, 'hero', 'Zwart', 'needs-model',
                alt='rol zwart klittenband van 50 mm, haak- en lusband los van elkaar')],
           {'kenmerk_kort': 'Haak- en lusband 50 mm · zelfklevend · wit of zwart · per meter of rol', 'verzending': 'pakket', 'staffelkorting': ST_SLANG,
            'specificaties': [sp('Band', 'Breedte', '50 mm'), sp('Band', 'Uitvoering', 'Haakband en lusband, allebei met kleeflaag'),
                              sp('Kleeflaag', 'Ondergrond', 'Schoon, droog en vetvrij: PVC, polyester met coating, kunststof, gelakt metaal'),
                              sp('Kleeflaag', 'Uitharden', '24 uur voor je er kracht op zet')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Reserve-klittenband voor de zijwanden en daken van easy-ups en voor eigen zeilen; zelfklevend op PVC en gecoat polyester; wanneer naaien beter is.',
           ['klittenband zelfklevend', 'klittenband 5 cm', 'klittenband partytent', 'klittenband wit'],
           {'outmate': 'zelfklevend klittenband 5 cm wit of zwart €2,50', 'ours': KLB}, vmap={'Wit': 'klittenband-zelfklevend-wit-hero.webp', 'Zwart': 'klittenband-zelfklevend-zwart-hero.webp'})
    ZR = [('25 zeilringen 12 mm', 4.49, 'ZR25', 120), ('Set met slaggereedschap en 25 zeilringen', 11.25, 'ZRSET', 450)]
    simple('zeilringen-12-mm', 'Zeilringen 12 mm met slaggereedschap', 'Verankering', ['gebruik:tuinfeest', 'gebruik:markt'], [opt('Uitvoering', [z[0] for z in ZR])],
           [variant(f'KK-VER-{c}', [n], p, g, inv(30, c)) for n, p, c, g in ZR],
           [img('zeilringen-12-mm-hero.webp', 'hero', 1, 'fixings', {'parts': ['zeilring', 'ponsijzer', 'slagstempel']}, 'hero', None, 'needs-model',
                alt='messing zeilringen met ponsijzer en slagstempel op een houten plankje')],
           {'kenmerk_kort': 'Messing ringen 12 mm · met pons en stempel · voor zeil, wand en dak', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Ring', 'Maat', 'Binnenmaat 12 mm, buitenmaat ca. 30 mm'), sp('Ring', 'Materiaal', 'Messing, roestvrij'),
                              sp('Gereedschap', 'In de set', 'Ponsijzer 12 mm, slagstempel en snijplaat (hamer niet inbegrepen)'),
                              sp('Doek', 'Geschikt voor', 'PVC en polyester tot ca. 650 g/m², ook dubbelgevouwen zoom')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen', 'partytent-onderdelen-accessoires.grondframes-reparatie'], 'verankering',
           'Een uitgescheurd oog of een extra bevestigingspunt zelf zetten: gat ponsen, ring en tegenring erin, met de stempel dichtslaan; set met gereedschap of navulling van 25.',
           ['zeilringen', 'oogringen partytent', 'zeilringen set met gereedschap', 'ringen slaan zeil'],
           {'outmate': 'oogringen 25 st 12 mm €5 · set + gereedschap 25 ringen €12,50', 'ours': {z[0]: z[1] for z in ZR}})
    DH = [('4 stuks', 3.15, 'DH4', 80), ('20 stuks', 12.95, 'DH20', 400)]
    simple('dakhaken-partytent', 'Dakhaken voor partytent', 'Verankering', ['gebruik:evenement'], [opt('Uitvoering', [d[0] for d in DH])],
           [variant(f'KK-VER-{c}', [n], p, g, inv(30, c)) for n, p, c, g in DH],
           [img('dakhaken-partytent-hero.webp', 'hero', 1, 'fixings', {'parts': ['dakhaak'], 'count': 4}, 'hero', None, 'needs-model',
                alt='vier verzinkte dakhaken met een open haak voor een buis van 38 mm')],
           {'kenmerk_kort': 'Verzinkt staal · haak om een buis van 38 mm · per 4 of 20', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': BFX,
            'specificaties': [sp('Haak', 'Materiaal', 'Verzinkt staaldraad Ø 4 mm'), sp('Haak', 'Past om', 'Buis tot Ø 40 mm (buizenframe 38 mm)'),
                              sp('Haak', 'Gebruik', 'Dakzeil- of wandrand met elastiek of koord aan de dakbuis haken')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Kleine haken om het dakzeil of een wand met elastiek aan de dakbuis van een buizenframe-tent te zetten; reserve voor wat kwijtraakt bij afbouwen.',
           ['dakhaken partytent', 'haakjes dakzeil', 'dakhaak buizenframe'], {'outmate': 'dakhaakjes 4 st €3,50', 'ours': {d[0]: d[1] for d in DH}})
    SS = [('M6, 5 stuks', 8.95, 'SS6', 300), ('M8, 5 stuks', 11.95, 'SS8', 500)]
    simple('spanschroeven-set-van-5', 'Spanschroeven (set van 5)', 'Verankering', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [x[0] for x in SS])],
           [variant(f'KK-VER-{c}', [n], p, g, inv(20, c)) for n, p, c, g in SS],
           [img('spanschroeven-set-van-5-hero.webp', 'hero', 1, 'fixings', {'parts': ['spanschroef'], 'count': 5}, 'hero', None, 'needs-model',
                alt='vijf verzinkte spanschroeven met haak en oog')],
           {'kenmerk_kort': 'Verzinkt · haak en oog · M6 of M8 · om een kabel of band op spanning te zetten', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': BFX,
            'specificaties': [sp('Spanschroef', 'Uitvoering', 'Haak en oog, open body'), sp('Spanschroef', 'M6', 'Werklast ca. 50 kg, verstelweg ca. 50 mm'),
                              sp('Spanschroef', 'M8', 'Werklast ca. 90 kg, verstelweg ca. 70 mm'), sp('Materiaal', 'Staal', 'Elektrolytisch verzinkt')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Een staalkabel, windverband of prikkabel strak trekken tussen twee punten: haak en oog, draai de body; welke maat voor welke last; niet voor hijsen.',
           ['spanschroef', 'spanschroef m6', 'spanner kabel tent'], {'outmate': 'spanschroef 5 stuks €9,99', 'ours': {x[0]: x[1] for x in SS}})
    SCH = [('4,5 x 45 mm (10 stuks)', 3.55, 'S45', 100), ('6 x 80 mm met ring (10 stuks)', 5.95, 'S680', 250)]
    simple('schroevenset-tent', 'Schroevenset voor tent en vlonder', 'Verankering', ['gebruik:evenement'], [opt('Uitvoering', [x[0] for x in SCH])],
           [variant(f'KK-VER-SCH-{c}', [n], p, g, inv(30, c)) for n, p, c, g in SCH],
           [img('schroevenset-tent-hero.webp', 'hero', 1, 'fixings', {'parts': ['schroef'], 'count': 10}, 'hero', None, 'needs-model',
                alt='tien verzinkte schroeven met torx-kop naast elkaar')],
           {'kenmerk_kort': 'Verzinkt · torx · 4,5 x 45 of 6 x 80 mm met ring · per 10', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'specificaties': [sp('Schroef', '4,5 x 45 mm', 'Spaanplaatschroef, torx T20, voor schroefogen, latten en wandklemmen'),
                              sp('Schroef', '6 x 80 mm', 'Constructieschroef met ring, torx T30, voor voetplaten op een houten vloer of vlonder'),
                              sp('Materiaal', 'Staal', 'Verzinkt, buiten te gebruiken')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering',
           'Reserveschroeven voor het vastzetten van voetplaten, schroefogen en latten op een houten vloer of vlonder; welke schroef waarvoor.',
           ['schroeven tent', 'schroeven voetplaat tent', 'schroevenset'], {'outmate': 'schroeven 4,5 x 45 mm set 10 st €3,95', 'ours': {x[0]: x[1] for x in SCH}})
