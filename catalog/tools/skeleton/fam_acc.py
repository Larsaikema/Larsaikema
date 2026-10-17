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

def build():
    EU = eu_all()
    # ------------------------------------------------------------ verzwaring & verankering
    VG = [('Set van 4', 159.0, 60000, 'S4'), ('Set van 6', 235.0, 90000, 'S6'), ('1 stuk', 42.95, 15000, '1')]
    simple('voetgewicht-easy-up-15-kg', 'Voetgewicht easy-up 15 kg', 'Verzwaring', ['gebruik:evenement', 'gebruik:markt', 'zakelijk'],
           [opt('Uitvoering', [v[0] for v in VG])], [variant(f'KK-GEW-VG15-{c}', [n], p, g, inv(12 if c == '1' else 6, c + 'vg')) for n, p, g, c in VG],
           [img('voetgewicht-easy-up-15-kg-hero.webp', 'hero', 1, 'gewichten', {'count': 2, 'stacks': 4}, 'hero', None, 'existing', alt='set van 4 (2 platen van 7,5 kg per poot)'),
            img('voetgewicht-easy-up-15-kg-op-poot.webp', 'in-gebruik', 2, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit', 'weights': 2}, 'detail', 'Wit', 'existing',
                alt='twee platen om de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': '2 platen van 7,5 kg per poot · poten tot 50 mm', 'staffelkorting': ST_GEWICHT, 'past_op': EU, 'verzending': 'pakket',
            'specificaties': [sp('Gewicht', 'Per poot', '15 kg (2 stapelbare platen van 7,5 kg)'), sp('Materiaal', 'Plaat', 'Gietijzer, zwart gecoat'),
                              sp('Pasvorm', 'Poten', 'Zeskant 40 en 50 mm'), sp('Afmetingen', 'Plaat', 'Ø 25 cm, 3,4 cm dik')],
            'gewicht_kg': 15, 'verpakt': '27 x 27 x 8 cm per paar platen', 'garantie': None},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering',
           'Gewicht voor op verharde grond waar haringen niet kunnen: hoeveel per poot, stapelen, set van 4 voor 4 poten en set van 6 voor 3 × 4,5 / 3 × 6 / 4 × 6 / 4 × 8.',
           ['voetgewicht partytent 15 kg', 'tentgewicht easy up'], {'outmate': '€49,95 per stuk', 'band': 'stalen voetplaat €50–€55 per stuk', 'ours': {v[0]: v[1] for v in VG}})
    simple('zandzakken-partytent-set-van-4', 'Zandzakken voor partytent (set van 4)', 'Verzwaring', ['gebruik:tuinfeest', 'gebruik:markt'], [],
           [variant('KK-GEW-ZAND-4', [], 17.95, 1200, 40)],
           [img('zandzakken-partytent-set-van-4-hero.webp', 'hero', 1, 'sandbag', {'count': 4, 'color': 'zwart', 'filled': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': '4 vulbare zakken · tot ca. 10 kg zand per zak · klittenband', 'past_op': EU, 'verzending': 'pakket', 'gewicht_kg': 1.2,
            'specificaties': [sp('Zak', 'Vulling', 'Zand of grind, ca. 10 kg per zak (niet inbegrepen)'), sp('Zak', 'Bevestiging', 'Klittenband rond de poot')]},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering', 'Lichte, goedkope verzwaring die je ter plekke vult; eerlijk: zand zit er niet in.',
           ['zandzakken partytent', 'gewichten partytent goedkoop'], {'outmate': '€19,99', 'band': '€21–€25', 'ours': 17.95})
    simple('spanbanden-en-haringen-easy-up', 'Spanbanden en haringen voor easy-up (set)', 'Verankering', ['gebruik:tuinfeest', 'gebruik:markt'], [],
           [variant('KK-VER-SPH-44', [], 17.95, 1400, 50)],
           [img('spanbanden-en-haringen-easy-up-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'spanbanden', 'color': 'zwart', 'position': [-0.15, 0, 0]},
                                                                                          {'model': 'haringen', 'count': 4, 'length': 0.3, 'position': [0.2, 0, 0]}]}, 'hero', None, 'existing')],
           {'kenmerk_kort': '4 spanbanden ca. 3 m + 4 haringen 30 cm + opbergzak', 'past_op': EU, 'verzending': 'pakket', 'gewicht_kg': 1.4},
           ['easy-up-accessoires.easy-up-bevestiging'], 'verankering', 'Basisverankering op gras: banden van dakhoek naar haring; altijd gebruiken, ook als het rustig lijkt.',
           ['haringen easy up', 'spanbanden partytent'], {'outmate': '€19,99', 'ours': 17.95})
    SB = {'3 m breed': 18.95, '4 m breed': 21.95, '5 m breed': 24.95, '6 m breed': 27.95}
    simple('stormbandenset-partytent', 'Stormbandenset partytent', 'Verankering', ['gebruik:evenement'], [opt('Maat', list(SB))],
           [variant(f'KK-VER-STB-{code(m.split()[0] + " m")}', [m], p, 1800 + 200 * i, inv(10, m + 'stb')) for i, (m, p) in enumerate(SB.items())],
           [img('stormbandenset-partytent-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'spanbanden', 'color': 'oranje', 'length': 12, 'position': [-0.15, 0, 0]},
                                                                                    {'model': 'haringen', 'count': 2, 'length': 0.75, 'position': [0.25, 0, 0]}]}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': '1 band over het dak + 2 lange haringen per set', 'verzending': 'pakket'},
           ['partytent-onderdelen-accessoires.stormbandensets'], 'buizenframe', 'Per tentbreedte één set over het dak; hoeveel sets per lengte (elke 2 m). Voor buizenframe- en opslagtenten.',
           ['stormband partytent', 'stormbanden set'], {'outmate': '1 set €16–€24', 'ours': SB},
           extra={'past_op_note': 'buizenframe- en opslagtenten (ingevuld in build)'})
    BV = [('Lange haring 50 cm', 5.95, 'H50', 600), ('Lange haring 75 cm', 10.95, 'H75', 900), ('Lange haring 100 cm', 13.95, 'H100', 1200),
          ('Draaiharingen 30 cm (4 stuks)', 6.95, 'DH4', 500), ('Haringen 18 cm voor wanden (10 stuks)', 5.95, 'H18', 400),
          ('Tentelastieken met bal (25 stuks)', 9.95, 'EL25', 300)]
    simple('haringen-en-bevestigingsmateriaal-partytent', 'Haringen en bevestigingsmateriaal partytent', 'Verankering', ['gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Uitvoering', [b[0] for b in BV])], [variant(f'KK-VER-BEV-{c}', [n], p, g, inv(30, c)) for n, p, c, g in BV],
           [img('haringen-en-bevestigingsmateriaal-partytent-hero.webp', 'hero', 1, 'haringen', {'count': 3, 'length': 0.75}, 'hero', None, 'existing', alt='lange haringen van verzinkt hoekijzer')],
           {'kenmerk_kort': 'Verzinkt hoekijzer 30 x 30 mm · 50, 75 en 100 cm', 'verzending': 'pakket',
            'specificaties': [sp('Haring', 'Materiaal', 'Thermisch verzinkt hoekijzer 30 x 30 mm')]},
           ['partytent-onderdelen-accessoires.bevestigingsmaterialen'], 'verankering', 'Welke haring in welke grond (lang in zacht, draaiharing in los zand), elastieken voor wanden.',
           ['lange haringen partytent', 'tentelastieken'], {'outmate': '50 cm €6,95 · 75 cm €12,50 · 100 cm €15 · draaiharing 4 st €7,50', 'ours': {b[0]: b[1] for b in BV}})
    BB = [('140 kg', 109.0, 140000, '140'), ('500 kg', 219.0, 500000, '500'), ('1000 kg', 299.0, 1000000, '1000')]
    simple('betonblok-ballast-tent', 'Betonblok ballast voor tenten', 'Verzwaring', ['zakelijk', 'pallet', 'gebruik:evenement'],
           [opt('Uitvoering', [b[0] for b in BB])], [variant(f'KK-GEW-BETON-{c}', [n], p, g, None, tracked=False) for n, p, g, c in BB],
           [img('betonblok-ballast-tent-hero.webp', 'hero', 1, 'concreteBlock', {'weight': 500, 'lifting': 'lepelgat'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Ballast met lepelgat · 140, 500 of 1000 kg · levering op pallet', 'verzending': 'pallet', 'levertijd': 'Levertijd 5–8 werkdagen (vracht)'},
           ['partytent-onderdelen-accessoires.betonblokken'], 'verankering', 'Ballast voor evenementen op verharding (stretch-, ster- en grote tenten); levering met vracht, afladen met heftruck of kraan.',
           ['betonblok tent', 'ballast evenement'], {'outmate': '140 kg €117 · 500 kg €235 · 1000 kg €319', 'ours': {b[0]: b[1] for b in BB}})

    # ------------------------------------------------------------ tassen & wielen
    SIZES8 = ['2 x 2 m', '3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m', '5 x 5 m']
    BH = [15.95, 17.95, 19.95, 21.95, 19.95, 23.95, 25.95, 25.95]
    WT = [34.95, 39.95, 44.95, 49.95, 44.95, 54.95, 64.95, 59.95]
    simple('beschermhoes-easy-up', 'Beschermhoes easy-up partytent', 'Tas & wielset', ['gebruik:tuinfeest'], [opt('Maat', SIZES8)],
           [variant(f'KK-TAS-BH-{code(m)}', [m], p, 900 + 100 * i, inv(8, m + 'bh')) for i, (m, p) in enumerate(zip(SIZES8, BH))],
           [img('beschermhoes-easy-up-hero.webp', 'hero', 1, 'draagtas', {'height': 1.55, 'color': 'zwart'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Schuift over frame en dak · 2 handvatten · gesp', 'past_op': EU, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Stofhoes voor opslag in schuur of bus; maat = tentmaat; past op Premium en Professional.',
           ['beschermhoes easy up', 'hoes vouwtent'], {'outmate': '€19,99–€27,50', 'ours': dict(zip(SIZES8, BH))})
    simple('wieltas-easy-up', 'Wieltas easy-up partytent', 'Tas & wielset', ['zakelijk', 'gebruik:evenement', 'badge:nieuw'], [opt('Maat', SIZES8)],
           [variant(f'KK-TAS-WT-{code(m)}', [m], p, 3000 + 300 * i, inv(5, m + 'wt')) for i, (m, p) in enumerate(zip(SIZES8, WT))],
           [img('wieltas-easy-up-hero.webp', 'hero', 1, 'draagtas', {'height': 1.7, 'color': 'zwart', 'wheels': True, 'logo': True}, 'hero', None, 'needs-param'),
            img('wieltas-easy-up-detail.webp', 'detail', 3, 'draagtas', {'height': 1.7, 'color': 'zwart', 'wheels': True}, 'detail', None, 'needs-param', alt='wielen en handgreep')],
           {'kenmerk_kort': '600D polyester · 2 wielen · rits over de volle lengte', 'past_op': EU, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Rijden in plaats van tillen: voor wie de tent vaak verplaatst; bij Professional al inbegrepen (zeg dat), extra of vervanging.',
           ['wieltas partytent', 'tas met wielen easy up'], {'ours': dict(zip(SIZES8, WT)), 'note': 'geen referentieprijs gevonden'})
    simple('wielset-easy-up', 'Wielset easy-up (4 zwenkwielen)', 'Tas & wielset', ['zakelijk'], [],
           [variant('KK-TAS-WIEL-4', [], 32.95, 2400, 20)],
           [img('wielset-easy-up-hero.webp', 'hero', 1, 'wielset', {}, 'hero', None, 'existing')],
           {'kenmerk_kort': '4 zwenkwielen met rem · 10 cm rubber · poten 40–50 mm', 'past_op': EU, 'verzending': 'pakket',
            'specificaties': [sp('Wiel', 'Diameter', '10 cm, rubber'), sp('Wiel', 'Rem', 'Ja, op alle 4'), sp('Pasvorm', 'Poten', 'Zeskant 40 en 50 mm, met vleugelbout')]},
           ['easy-up-accessoires.easy-up-transport'], 'tassen', 'Wielen onder de poten om de opgezette tent te verplaatsen (bv. op een beurs); altijd remmen vast en verzwaren.',
           ['wielen easy up', 'wielset partytent'], {'outmate': '€35', 'ours': 32.95})
    OT = {'3 m breed': 54.95, '4 m breed': 59.95, '5 m breed': 69.95, '6 m breed': 79.95}
    simple('opbergtassenset-partytent', 'Opbergtassenset partytent buizenframe', 'Tas & wielset', ['gebruik:evenement'], [opt('Maat', list(OT))],
           [variant(f'KK-TAS-OTS-{code(m.split()[0] + " m")}', [m], p, 2500 + 400 * i, inv(6, m + 'ots')) for i, (m, p) in enumerate(OT.items())],
           [img('opbergtassenset-partytent-hero.webp', 'hero', 1, 'tubeBag', {'count': 3, 'color': 'zwart'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Tassen voor buizen, koppelstukken en doek', 'verzending': 'pakket'},
           ['partytent-onderdelen-accessoires.opbergtassen'], 'buizenframe', 'Ordelijk opbergen van een buizenframe-tent: tas voor buizen, voor koppelstukken en voor het doek.',
           ['opbergtas partytent', 'tas partytent buizen'], {'outmate': '3 m breed €65 · 4 m breed €69', 'ours': OT})

    # ------------------------------------------------------------ goten & koppelingen
    RG = {'3 m': 24.95, '4 m': 29.95, '4,5 m': 32.95, '6 m': 42.95, '8 m': 59.95}
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
           {'kenmerk_kort': 'PVC-goot tussen twee tenten · klittenband', 'past_op': EU, 'verzending': 'pakket'},
           ['easy-up-accessoires.easy-up-goten', 'partytent-onderdelen-accessoires.regengoten-partytent'], 'goten',
           'Water tussen twee tenten afvoeren; lengte = zijde waarop je koppelt; voor easy-ups én buizenframe-tenten.',
           ['regengoot partytent', 'regengoot easy up'], {'outmate': '3 m €29 · 4,5 m €37,50 · 6 m €49 · 8 m €84', 'ours': RG}, vmap=vmap)
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
    LINES = [
        ('partytent-pe-basis-buizenframe', 'Partytent PE Basis met buizenframe', 'pe-basic', 'PE', 'PE 180–200 g/m², waterafstotend', 2.6,
         {'3 x 4 m': (249, 279), '3 x 6 m': (309, 349), '4 x 4 m': (299, 335), '4 x 6 m': (349, 389), '4 x 8 m': (399, 439), '5 x 10 m': (479, 525)},
         'Instap voor een paar keer per jaar: PE-doek, zijwanden met ramen; niet voor lang laten staan.', ['gebruik:tuinfeest']),
        ('partytent-pvc-500-comfort', 'Partytent PVC 500 Comfort', 'pvc-classic', 'C5', 'PVC 500 g/m², brandvertragend, gelaste naden', 3.5,
         {'3 x 6 m': (479, 529), '4 x 6 m': (509, 559), '4 x 8 m': (589, None), '5 x 8 m': (649, 729), '6 x 6 m': (619, 729), '6 x 8 m': (699, 725), '6 x 12 m': (1049, None)},
         'PVC voor regelmatig gebruik: stevig doek, brandvertragend; kortere evenementen.', ['gebruik:tuinfeest', 'gebruik:evenement']),
        ('partytent-pvc-550-premium', 'Partytent PVC 550 Premium brandvertragend', 'pvc-premium', 'P55', 'PVC 550 g/m², brandvertragend, gelaste naden, treksterkte 860 N', 3.8,
         {'3 x 3 m': (399, 439), '3 x 6 m': (549, 589), '3 x 8 m': (719, 789), '4 x 4 m': (529, 579), '4 x 6 m': (669, 719), '4 x 8 m': (799, 869),
          '5 x 8 m': (879, 949), '6 x 6 m': (799, 875), '6 x 8 m': (879, 949), '6 x 12 m': (1379, 1499), '8 x 12 m': (1699, 1850)},
         'Het werkpaard: 550 g/m² PVC met grondframe en nokversteviging, ook voor weken laten staan.', ['zakelijk', 'gebruik:evenement']),
        ('partytent-pvc-550-compleet', 'Partytent PVC 550 compleet met toebehoren', 'pvc-ultimate', 'P55C', 'PVC 550 g/m², brandvertragend', 3.9,
         {'4 x 4 m': (579, 599), '4 x 6 m': (719, 729), '4 x 8 m': (849, 915), '5 x 10 m': (1099, 1129)},
         'Premium-tent met stormbandenset en opbergtassen erbij: alles in één bestelling.', ['zakelijk', 'gebruik:evenement']),
        ('partytent-pvc-620-professional', 'Partytent PVC 620 Professional', 'pvc-professional', 'P62', 'PVC 620 g/m², brandvertragend, gelaste naden, treksterkte 930 N', 4.3,
         {'4 x 6 m': (869, None), '4 x 8 m': (979, 1049), '5 x 10 m': (1199, 1275), '6 x 12 m': (1599, 1725)},
         'Zwaarste PVC met 220 cm zijhoogte voor verhuur en langdurig gebruik.', ['zakelijk', 'gebruik:evenement']),
    ]
    bf_handles = [l[0] for l in LINES]
    for h, title, sub, c, doek, f, sizes, brief, tags in LINES:
        vs = []
        for m, (p, om) in sizes.items():
            w, d = [float(x.replace(',', '.')) for x in m.replace(' m', '').split(' x ')]
            kg = round(w * d * f + 10)
            vs.append(variant(f'KK-TENT-BF-{c}-{code(m)}', [m], p, kg * 1000, inv(3, h + m)))
        incl = 'Buizenframe, dak, zijwanden met ramen, deur met rits, haringen' + (', stormbandenset en opbergtassenset' if sub == 'pvc-ultimate' else '')
        simple(h, title, 'Partytent', tags + ['pallet'], [opt('Maat', list(sizes))], vs,
               [img(f'{h}-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': 'pe' if sub == 'pe-basic' else 'pvc', 'color': 'wit', 'walls': 'windows'}, 'hero', 'Wit', 'needs-model'),
                img(f'{h}-front.webp', 'front', 3, 'frameTent', {'w': 4, 'd': 8, 'line': 'pe' if sub == 'pe-basic' else 'pvc', 'color': 'wit', 'walls': 'windows', 'door': 'open'}, 'front', 'Wit', 'needs-model')],
               {'kenmerk_kort': f'38 mm verzinkt staal · {doek.split(",")[0]}' + (' · zijhoogte 220 cm' if sub == 'pvc-professional' else ''),
                'specificaties': [sp('Frame', 'Buizen', '38 mm, verzinkt staal, wand 1,2 mm'), sp('Doek', 'Materiaal', doek),
                                  sp('Levering', 'Inbegrepen', incl), sp('Levering', 'Vervoer', 'Vracht op pallet')],
                'vergelijk_groep': 'partytent-buizenframe', 'verzending': 'pallet', 'staffelkorting': None, 'garantie': '1 jaar op frame en doek'},
               [f'partytenten-buizenframe.{sub}'], 'buizenframe', brief, [f'partytent {list(sizes)[0].replace(" m", "").replace(" ", "")}', 'partytent buizenframe', 'partytent pvc'],
               {'outmate': {m: v[1] for m, v in sizes.items()}, 'ours': {m: v[0] for m, v in sizes.items()}}, weight=1)

    # buizenframe parts
    BFD = [('3 x 4 m', 'PVC 550', 169), ('4 x 6 m', 'PVC 550', 239), ('4 x 8 m', 'PVC 550', 289), ('5 x 10 m', 'PVC 550', 429), ('6 x 12 m', 'PVC 550', 549),
           ('8 x 12 m', 'PVC 550', 649), ('4 x 8 m', 'PE', 149), ('5 x 10 m', 'PE', 199)]
    simple('dakzeil-partytent-buizenframe', 'Dakzeil partytent buizenframe', 'Dakzeil', [], [opt('Maat', list(dict.fromkeys(b[0] for b in BFD))), opt('Uitvoering', ['PVC 550', 'PE'])],
           [variant(f'KK-DAK-BF-{"PVC" if u != "PE" else "PE"}-{code(m)}', [m, u], p, 9000 + 1500 * i, None, tracked=False) for i, (m, u, p) in enumerate(BFD)],
           [img('dakzeil-partytent-buizenframe-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 8, 'line': 'pvc', 'color': 'wit', 'walls': 'none', 'frame': False}, 'hero', 'Wit', 'needs-model')],
           {'kenmerk_kort': 'Vervangend dak · PVC 550 g/m² of PE', 'verzending': 'pakket', 'levertijd': 'Levertijd 1–2 weken', 'past_op': bf_handles},
           ['partytent-onderdelen-accessoires.dakzeilen'], 'buizenframe', 'Vervangend dak voor onze buizenframe-tenten; past gegarandeerd op Klapklaar-frames, op andere merken alleen bij gelijke maatvoering.',
           ['dakzeil partytent 4x8', 'vervangend dak partytent'], {'outmate': '3x4 PVC €189 · 5x10 €469 · 6x12 €599 · 8x12 €559 · PE 4x8 €169', 'ours': {f'{m} {u}': p for m, u, p in BFD}})
    ZW2 = [('Met raam', 24.95, 'RA'), ('Dicht', 24.95, 'DI'), ('Met raam en ritsen', 39.95, 'RR')]
    simple('zijwand-partytent-2-m-pvc', 'Zijwand partytent 2 m PVC', 'Zijwand', ['gebruik:evenement'], [opt('Uitvoering', [z[0] for z in ZW2])],
           [variant(f'KK-ZW-BF-2M-{c}', [n], p, 1800, inv(20, c + 'zw2')) for n, p, c in ZW2],
           [img('zijwand-partytent-2-m-pvc-hero.webp', 'hero', 1, 'sideWall', {'length': 2, 'height': 2.0, 'type': 'windows', 'color': 'wit', 'material': 'pvc'}, 'hero', 'Wit', 'needs-model')],
           {'kenmerk_kort': 'Paneel 2 m · PVC 500 g/m² · 200 cm hoog', 'verzending': 'pakket', 'past_op': bf_handles},
           ['partytent-onderdelen-accessoires.zijwanden'], 'buizenframe', 'Los paneel om een buizenframe-tent aan te vullen of te vervangen; ook bruikbaar voor een veranda.',
           ['zijwand partytent 2 meter', 'zijwand pvc raam'], {'outmate': '2 m raam €24–€29 · ritsen €45–€49', 'ours': {z[0]: z[1] for z in ZW2}})
    ET = {'3 m': 44.95, '4 m': 54.95, '5 m': 64.95, '6 m': 74.95, '8 m': 94.95}
    simple('eindwand-en-tussenwand-partytent', 'Eindwand en tussenwand partytent met ritsen', 'Zijwand', ['gebruik:evenement'],
           [opt('Maat', list(ET)), opt('Uitvoering', ['Eindwand', 'Tussenwand'])],
           [variant(f'KK-ZW-BF-{"EW" if u == "Eindwand" else "TW"}-{code(m)}', [m, u], p + (0 if u == 'Eindwand' else 5), 2500 + 600 * i, inv(4, m + u))
            for i, (m, p) in enumerate(ET.items()) for u in ['Eindwand', 'Tussenwand']],
           [img('eindwand-en-tussenwand-partytent-hero.webp', 'hero', 1, 'sideWall', {'length': 4, 'height': 2.0, 'gable': True, 'type': 'door', 'color': 'wit', 'material': 'pvc'}, 'hero', 'Wit', 'needs-model')],
           {'kenmerk_kort': 'Kopse wand met ritsen · tot de nok · PVC', 'verzending': 'pakket', 'past_op': bf_handles},
           ['partytent-onderdelen-accessoires.eindwanden', 'partytent-onderdelen-accessoires.tussenwanden'], 'buizenframe',
           'Eindwand (kopse kant tot in de nok) of tussenwand om de tent in twee ruimtes te delen; maat = tentbreedte.',
           ['eindwand partytent', 'tussenwand partytent'], {'outmate': 'eindwand 3 m vanaf €49', 'ours': ET})
    KB = [('Koppelstuk 2-weg (20 cm)', 6.95, 'K2', 300), ('Koppelstuk 3-weg 140°', 8.95, 'K3', 400), ('Koppelstuk 4-weg 120°', 10.95, 'K4', 500),
          ('Koppelstuk 3-weg grondframe', 8.95, 'K3G', 400), ('Buis 159 cm', 8.49, 'B159', 1900), ('Buis 192 cm', 8.95, 'B192', 2300),
          ('Staander 212 cm', 11.95, 'S212', 2600), ('Buis 216 cm', 11.95, 'B216', 2600)]
    simple('koppelstukken-en-buizen-38-mm', 'Koppelstukken en buizen 38 mm', 'Frame-onderdeel', ['zakelijk'], [opt('Uitvoering', [k[0] for k in KB])],
           [variant(f'KK-FRM-BF-{c}', [n], p, g, inv(25, c)) for n, p, c, g in KB],
           [img('koppelstukken-en-buizen-38-mm-hero.webp', 'hero', 1, 'tubeFittings', {'parts': ['2-weg', '3-weg', '4-weg', 'buis']}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': '38 mm verzinkt staal · gelaste moeren', 'verzending': 'pakket', 'past_op': bf_handles,
            'specificaties': [sp('Koppelstuk', 'Maten', 'Buiten 42 mm, binnen 38 mm, wand 1,4 mm'), sp('Buis', 'Materiaal', 'Verzinkt staal 38 mm, wand 1,2 mm')]},
           ['partytent-onderdelen-accessoires.koppelstukken', 'partytent-onderdelen-accessoires.buizen'], 'buizenframe',
           'Losse koppelstukken en buizen voor 38 mm buizenframes; hoe je het juiste onderdeel herkent (hoek, aantal aansluitingen, lengte).',
           ['koppelstuk partytent 38 mm', 'buis partytent'], {'outmate': '2-weg €7,50 · 3-weg €9,99 · buis 192 cm €9 · staander 212 €12,50', 'ours': {k[0]: k[1] for k in KB}})
    simple('reparatieset-tentdoek', 'Reparatieset tentdoek PVC en polyester', 'Frame-onderdeel', [], [opt('Uitvoering', ['PVC (lijm en lappen)', 'Polyester (plakband en lappen)'])],
           [variant('KK-FRM-REP-PVC', ['PVC (lijm en lappen)'], 12.95, 300, 30), variant('KK-FRM-REP-POL', ['Polyester (plakband en lappen)'], 9.95, 200, 30)],
           [img('reparatieset-tentdoek-hero.webp', 'hero', 1, 'repairKit', {'kind': 'pvc'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Scheurtjes en gaatjes zelf dichten', 'verzending': 'pakket'},
           ['partytent-onderdelen-accessoires.grondframes-reparatie'], 'buizenframe', 'Kleine reparaties aan dak en wanden; stap voor stap, wanneer wel en wanneer een nieuw dak beter is.',
           ['reparatieset partytent', 'pvc tentdoek repareren'], {'note': 'geen referentieprijs gevonden'})

    # ------------------------------------------------------------ opslagtenten
    OS = {'3 x 4 m': (369, 459, 529), '4 x 6 m': (519, 669, 719), '4 x 8 m': (619, 799, None), '5 x 10 m': (779, 1039, 1099), '6 x 12 m': (1099, 1299, 1569)}
    OSU = ['PVC 500', 'PVC 550', 'PVC 620 Professional']
    vs = []
    for m, prs in OS.items():
        w, d = [float(x) for x in m.replace(' m', '').split(' x ')]
        for u, p in zip(OSU, prs):
            if p:
                vs.append(variant(f'KK-TENT-OS-{["C5", "P55", "P62"][OSU.index(u)]}-{code(m)}', [m, u], p, (w * d * (3.6 + OSU.index(u) * 0.4) + 12) * 1000, inv(2, m + u)))
    simple('opslagtent-pvc', 'Opslagtent PVC met buizenframe', 'Opslagtent', ['zakelijk', 'pallet'], [opt('Maat', list(OS)), opt('Uitvoering', OSU)], vs,
           [img('opslagtent-pvc-hero.webp', 'hero', 1, 'frameTent', {'w': 4, 'd': 6, 'line': 'pvc', 'color': 'wit', 'variant': 'opslag', 'door': 'rolled'}, 'hero', 'Wit', 'needs-model'),
            img('opslagtent-pvc-front.webp', 'front', 3, 'frameTent', {'w': 4, 'd': 6, 'line': 'pvc', 'color': 'wit', 'variant': 'opslag', 'door': 'open'}, 'front', 'Wit', 'needs-model')],
           {'kenmerk_kort': '38 mm verzinkt staal · PVC 500, 550 of 620 g/m² · roldeur', 'verzending': 'pallet', 'garantie': '1 jaar op frame en doek',
            'specificaties': [sp('Doek', 'PVC 500', 'Kort gebruik (seizoen, evenement)'), sp('Doek', 'PVC 550', 'Langer gebruik, bv. tijdens een verbouwing'),
                              sp('Doek', 'PVC 620 Professional', 'Langdurig, zwaarste doek')]},
           ['opslagtenten.opslag-lines', 'opslagtenten.opslag-pvc-classic', 'opslagtenten.opslag-pvc-premium', 'opslagtenten.opslag-pvc-professional'], 'opslag',
           'Tijdelijke opslag (verbouwing, oogst, voorraad): drie doekdiktes met eerlijk advies welke voor hoe lang; geen vergunningsadvies geven, wel noemen dat het kan gelden.',
           ['opslagtent', 'opslagtent 4x6', 'tijdelijke opslag tent'], {'outmate': {'PVC Classic': '399/559/669/839/1199', 'PVC Premium': '499/719/869/1125/1399', 'PVC Professional': '569/775/–/1175/1699'},
                                                                         'ours': {m: dict(zip(OSU, p)) for m, p in OS.items()}})
    simple('carport-opslagtent-vast-frame', 'Carport en opslagtent 3,3 x 4,8 m vast frame', 'Opslagtent', ['pallet'], [opt('Maat', ['3,3 x 4,8 m'])],
           [variant('KK-TENT-CP-33X48', ['3,3 x 4,8 m'], 629.0, 95000, 2)],
           [img('carport-opslagtent-vast-frame-hero.webp', 'hero', 1, 'carportTent', {'w': 3.3, 'd': 4.8, 'color': 'wit'}, 'hero', 'Wit', 'needs-model')],
           {'kenmerk_kort': 'Vast stalen frame · PVC dak en wanden · voor- en achterpaneel afneembaar', 'verzending': 'pallet'},
           ['opslagtenten.opslag-carport-pvc-professional'], 'opslag', 'Carport die ook opslag is: vast frame, PVC rondom; voor- en achterkant afneembaar.',
           ['carport tent', 'opslagtent carport'], {'outmate': '€599 (actie, was €859)', 'ours': 629})
    # fill stormband past_op
    HANDLES['stormbandenset-partytent']['metafields']['past_op'] = bf_handles + ['opslagtent-pvc']
    HANDLES['opbergtassenset-partytent']['metafields']['past_op'] = bf_handles + ['opslagtent-pvc']
    HANDLES['stormbandenset-partytent'].pop('past_op_note', None)
