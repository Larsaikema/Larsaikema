"""Write brand/tokens.json (v7) and the WCAG tables (brand/tools/_contrast.json).

    python3 tokens.py <brand-dir>      (needs tools/_repro.json and tools/logo-meta.json)

v7 palette: eleven colours, one meaning each.
  * Lampion (orange) is the brand and the purchase: the tent in the logo, the luifelbalk and campaign bands, and in
    the shop only the koopknop (In mijn winkelwagen, Afrekenen) and the cart counter. Never text, never a state.
    It replaces Klaproos: an orange is clearly apart from the red stock tents (CIEDE2000 > 20, hue 53 vs 35 deg)
    and has >= 3:1 against both Zand and Inkt, so the logo tent no longer fades on the dark footer.
  * Inkt is text, the hoofdknop for everything that is not buying (and the Zakelijk primary), links, focus and the
    footer surface. Chips, toggles and badges are no longer solid Inkt.
  * Polder = klaar, Zon = voordeel, Oker = wachten, Bordeaux = fout. Zand page, Wit what you touch, Linnen image plane.
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contrast import cr
from color3 import lab65, de2000, lab_hue

OUT = sys.argv[1]
REPRO = json.load(open(os.path.join(OUT, 'tools', '_repro.json')))
META = json.load(open(os.path.join(OUT, 'tools', 'logo-meta.json')))

COL = {
  # merk
  'lampion':  ('#E66414', 'merk en kopen', 'Het merk en de aankoop. Merk: de tent in het logo, de luifelbalk bovenaan elke pagina, campagnebanden (altijd met Inkt-tekst), de vlaggenlijn en de luifelstreep onder een kopwoord. Winkel: alleen de koopknop (‘In mijn winkelwagen’, ‘Afrekenen’) en de teller op de winkelwagen. Nooit tekst, nooit een status, nooit een badge, nooit een vlak op Linnen.'),
  'inkt':     ('#1D2420', 'merk', 'Tekst en koppen; de hoofdknop voor alles wat geen kopen is (‘Bekijk partytenten’, ‘Offerte aanvragen’); omlijnde knoppen; links; focusring op licht; de footer en donkere banden.'),
  'zand':     ('#FBF6EC', 'merk', 'Paginaachtergrond. Tekst, knoplabel en focusring op Inkt.'),
  # neutraal
  'wit':      ('#FFFFFF', 'neutraal', 'Alles wat je aanraakt: kaarten, invoervelden, optiechips, drawers, meldingen; label op de Inkt-knop.'),
  'linnen':   ('#ECE4D6', 'neutraal', 'Het beeldvlak (achtergrond van elke render en foto), de heroband, staffel- en spectabellen, de gekozen optie, de badge Met jouw logo en de Zakelijk-blokken.'),
  'lijn':     ('#DDD2BF', 'neutraal', 'Scheidingslijnen, de 1 px rand om kaarten en meldingen, de rand van een niet-leverbare optie. Decoratief: draagt nooit alleen informatie.'),
  'kiezel':   ('#5D625C', 'neutraal', 'Secundaire tekst (specregel, btw-regel, doorgestreepte van-prijs, niet-leverbaar label), randen van invoervelden en optiechips.'),
  # betekenis
  'zon':      ('#FFC23A', 'voordeel', 'Alleen voordeel: Actie-badge, actieprijs-label, menu-item Actie. Altijd met Inkt-tekst. Nooit hover, nooit logo, nooit tekst op licht.'),
  'polder':   ('#154F3E', 'klaar', 'Alleen ‘klaar’: Op voorraad (volle stip + tekst), de knopstand Toegevoegd, succesmelding. Geen vlakken, geen badges, geen knoppen in rust.'),
  'oker':     ('#865800', 'wachten', 'Alleen wachten: ‘Leverbaar over 2–3 weken’ (halve stip + tekst) en de let-op-melding (drukproef wacht op akkoord).'),
  'bordeaux': ('#8A1538', 'fout', 'Alleen fout: kop, icoon en 4 px linkerrand van een foutmelding, tekst en rand van een veld met fout. Nooit een gevuld vlak.'),
}
H = {k: v[0] for k, v in COL.items()}

def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % tuple(round(x + (y - x) * t) for x, y in zip(a, b))

# hover rules (computed, not palette colours)
D = {
  'inkt-hover':      (mix(H['inkt'], H['zand'], 0.16), 'color-mix(in srgb, var(--c-inkt) 84%, var(--c-zand))', 'hover van de Inkt-knop'),
  'zand-hover':      (mix(H['zand'], H['inkt'], 0.10), 'color-mix(in srgb, var(--c-zand) 90%, var(--c-inkt))', 'hover van de Zand-knop op Inkt'),
  'tint-zand':       (mix(H['zand'], H['inkt'], 0.08), 'color-mix(in srgb, var(--c-zand) 92%, var(--c-inkt))', 'hover van de omlijnde knop en de optiechip op Zand'),
  'tint-wit':        (mix(H['wit'], H['inkt'], 0.06), 'color-mix(in srgb, var(--c-wit) 94%, var(--c-inkt))', 'hover van de omlijnde knop en de optiechip op Wit'),
  'tint-linnen':     (mix(H['linnen'], H['inkt'], 0.08), 'color-mix(in srgb, var(--c-linnen) 92%, var(--c-inkt))', 'hover van de omlijnde knop op Linnen'),
  'tintd-inkt':      (mix(H['inkt'], H['zand'], 0.12), 'color-mix(in srgb, var(--c-inkt) 88%, var(--c-zand))', 'hover van de omlijnde knop op Inkt'),
  'tint-lampion':    (mix(H['lampion'], H['zand'], 0.20), 'color-mix(in srgb, var(--c-lampion) 80%, var(--c-zand))', 'hover van een link of omlijnde knop op een Lampion-band'),
}
for k, v in D.items(): H[k] = v[0]

PAIRS = [
  # text 4.5:1
  ('inkt', 'zand', 'Lopende tekst, koppen, prijzen op de pagina', 'text'), ('inkt', 'wit', 'Tekst op kaarten, velden, meldingen, chips', 'text'),
  ('inkt', 'linnen', 'Tekst op het beeldvlak, de heroband, de gekozen optie, Met jouw logo, Zakelijk', 'text'),
  ('inkt', 'zon', 'Actie-badge en actieprijs-label', 'text'),
  ('inkt', 'lampion', 'Label van de koopknop, tekst op de luifelbalk en campagneband, cijfer in de winkelwagenteller', 'text'),
  ('inkt', 'tint-lampion', 'Link of omlijnde knop op een Lampion-band, hover', 'text'),
  ('kiezel', 'zand', 'Specregel en btw-regel op de pagina', 'text'), ('kiezel', 'wit', 'Specregel, van-prijs en niet-leverbaar label op de kaart', 'text'),
  ('kiezel', 'linnen', 'Bijschrift op het beeldvlak, specs in Zakelijk', 'text'),
  ('polder', 'zand', 'Op voorraad op de pagina', 'text'), ('polder', 'wit', 'Op voorraad op de kaart, kop van de succesmelding', 'text'),
  ('polder', 'linnen', 'Op voorraad in Zakelijk', 'text'),
  ('oker', 'zand', 'Leverbaar over 2–3 weken op de pagina', 'text'), ('oker', 'wit', 'Levertijd op de kaart, kop van de let-op-melding', 'text'),
  ('oker', 'linnen', 'Levertijd in Zakelijk', 'text'),
  ('bordeaux', 'wit', 'Kop van de foutmelding, veldfout onder een veld', 'text'), ('bordeaux', 'zand', 'Veldfout op de pagina', 'text'),
  ('bordeaux', 'linnen', 'Veldfout in een Zakelijk-formulier', 'text'),
  ('wit', 'inkt', 'Label van de Inkt-knop', 'text'), ('wit', 'inkt-hover', 'Label van de Inkt-knop bij hover', 'text'),
  ('wit', 'polder', 'Knopstand Toegevoegd', 'text'),
  ('zand', 'inkt', 'Tekst in footer en donkere band', 'text'),
  ('inkt', 'zand-hover', 'Label van de Zand-knop op Inkt bij hover', 'text'),
  ('inkt', 'tint-zand', 'Omlijnde knop en optiechip, hover op de pagina', 'text'), ('inkt', 'tint-wit', 'Omlijnde knop en optiechip, hover op de kaart', 'text'),
  ('inkt', 'tint-linnen', 'Omlijnde knop, hover op Linnen', 'text'), ('zand', 'tintd-inkt', 'Omlijnde knop, hover op Inkt', 'text'),
  # UI 3:1
  ('lampion', 'zand', 'Koopknop tegen de pagina; logo-tent op Zand', 'ui'), ('lampion', 'wit', 'Koopknop tegen de kaart en de drawer; teller', 'ui'),
  ('lampion', 'inkt', 'Logo-tent op Inkt (logo-inverse.svg, footer); beeldmerk; teller op een donkere header', 'ui'),
  ('inkt', 'lampion', 'Hover-rand van de koopknop, focusring en Inkt-knop op een Lampion-band', 'ui'),
  ('inkt', 'zand', 'Inkt-knop, omlijnde knop en focusring tegen de pagina', 'ui'), ('inkt', 'wit', 'Inkt-knop, gekozen optierand en focusring op Wit', 'ui'),
  ('inkt', 'linnen', 'Inkt-knop en focusring op Linnen', 'ui'),
  ('inkt-hover', 'zand', 'Inkt-knop bij hover tegen de pagina', 'ui'), ('inkt-hover', 'wit', 'Inkt-knop bij hover tegen de kaart', 'ui'),
  ('kiezel', 'wit', 'Rand van invoerveld en optiechip', 'ui'), ('kiezel', 'zand', 'Rand van invoerveld op de pagina', 'ui'),
  ('kiezel', 'linnen', 'Rand van invoerveld in Zakelijk', 'ui'),
  ('zand', 'inkt', 'Zand-knop, focusring en randen op Inkt', 'ui'), ('zand-hover', 'inkt', 'Zand-knop bij hover op Inkt', 'ui'),
  ('polder', 'wit', 'Voorraadstip, knopstand Toegevoegd tegen de kaart', 'ui'), ('polder', 'zand', 'Voorraadstip en Toegevoegd tegen de pagina', 'ui'),
  ('oker', 'wit', 'Halve stip levertijd, icoon en linkerrand let-op', 'ui'), ('oker', 'zand', 'Halve stip levertijd op de pagina', 'ui'),
  ('bordeaux', 'wit', 'Icoon en linkerrand foutmelding, rand van een veld met fout', 'ui'), ('bordeaux', 'zand', 'Rand van een veld met fout op de pagina', 'ui'),
  ('zon', 'inkt', 'Actie-badge op een donker vlak', 'ui'),
  ('zand', 'lampion', 'Hover-rand van de Inkt-knop op een Lampion-band', 'ui'),
]
FORBIDDEN = [('lampion', 'zand', 'Lampion als tekstkleur, ook in koppen (daar een luifelstreep)'), ('lampion', 'wit', 'Lampion-tekst op Wit'),
             ('zand', 'lampion', 'Zand- of witte tekst op Lampion (daar altijd Inkt)'), ('wit', 'lampion', 'Witte tekst op Lampion'),
             ('lampion', 'linnen', 'Lampion-vlak of koopknop op Linnen (vorm valt weg)'),
             ('zon', 'zand', 'Zon als tekst, rand of icoon op licht'), ('zon', 'lampion', 'Zon naast of op Lampion als onderscheid'),
             ('kiezel', 'inkt', 'Kiezel op donker'), ('polder', 'inkt', 'Polder op Inkt'), ('oker', 'inkt', 'Oker op donker'),
             ('lijn', 'wit', 'Lijn als enige grens van iets klikbaars'), ('bordeaux', 'inkt', 'Bordeaux op donker')]

NEED = {'text': 4.5, 'large': 3.0, 'ui': 3.0}
rows = []
for fg, bg, use, kind in PAIRS:
    r = cr(H[fg], H[bg])
    rows.append({'fg': fg, 'bg': bg, 'fg_hex': H[fg], 'bg_hex': H[bg], 'use': use, 'kind': kind, 'ratio': round(r, 2),
                 'need': NEED[kind], 'pass': r >= NEED[kind], 'aaa': r >= (7 if kind == 'text' else 4.5)})
bad = [x for x in rows if not x['pass']]
forb = [{'fg': a, 'bg': b, 'use': u, 'ratio': round(cr(H[a], H[b]), 2)} for a, b, u in FORBIDDEN]

def sep(a, b): return round(de2000(lab65(H[a]), lab65(H[b])), 1)
STOCK = {'rood (catalogus)': '#B5161E', 'rood (render, gemeten)': '#C30F1A', 'oranje stretchrok (catalogus)': '#E2681B'}
separation = {
  'lampion_vs_stock': {k: {'de2000': round(de2000(lab65(H['lampion']), lab65(v)), 1), 'hue': round(lab_hue(lab65(v)), 1)} for k, v in STOCK.items()},
  'lampion_hue': round(lab_hue(lab65(H['lampion'])), 1), 'klaproos_v6_hue': round(lab_hue(lab65('#C83812')), 1),
  'lampion_vs_zon': {'de2000': sep('lampion', 'zon')}, 'lampion_vs_bordeaux': {'de2000': sep('lampion', 'bordeaux')},
  'lampion_vs_oker': {'de2000': sep('lampion', 'oker')}, 'inkt_vs_inkt_hover': {'de2000': sep('inkt', 'inkt-hover'), 'contrast': round(cr(H['inkt'], H['inkt-hover']), 2)},
  'polder_vs_inkt': {'de2000': sep('polder', 'inkt'), 'contrast': round(cr(H['polder'], H['inkt']), 2)},
}
SURF = ['zand', 'wit', 'linnen']
surfaces = {f'{a}–{b}': {'de2000': sep(a, b), 'contrast': round(cr(H[a], H[b]), 2)} for i, a in enumerate(SURF) for b in SURF[i + 1:]}

# ------------------------------------------------------------------ colour schemes, every button state
def btn(bg, label, border=None, inset=False):
    b = {'bg': bg, 'label': label, 'border': border or bg}
    if inset: b['inset'] = 'inset 0 2px 0 rgba(0,0,0,.28)'
    return b
BUY = {'buy': btn('lampion', 'inkt'), 'buy_hover': btn('lampion', 'inkt', 'inkt'), 'buy_active': btn('lampion', 'inkt', 'inkt', inset=True)}
def light(bgname, buy=True):
    s = {'primary': btn('inkt', 'wit'), 'primary_hover': btn('inkt-hover', 'wit'), 'primary_active': btn('inkt', 'wit', inset=True),
         'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn(f'tint-{bgname}', 'inkt', 'inkt')}
    if buy: s.update(BUY)
    return s
SCHEMES = {
  'scheme-1': {'naam': 'Pagina', 'background': 'zand', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', 'border': 'kiezel', 'logo_tent': 'lampion', **light('zand')},
  'scheme-2': {'naam': 'Kaart en drawer', 'background': 'wit', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', 'border': 'kiezel', 'logo_tent': 'lampion', **light('wit')},
  'scheme-3': {'naam': 'Linnen (beeldvlak, heroband)', 'background': 'linnen', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', 'border': 'kiezel', 'logo_tent': 'lampion', **light('linnen', buy=False)},
  'scheme-4': {'naam': 'Zakelijk (Linnen, logo één kleur, geen Lampion)', 'background': 'linnen', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', 'border': 'kiezel', 'logo_tent': 'inkt', **light('linnen', buy=False)},
  'scheme-5': {'naam': 'Lampion (luifelbalk, campagneband)', 'background': 'lampion', 'text': 'inkt', 'muted': 'inkt', 'focus': 'inkt', 'border': 'inkt', 'logo_tent': 'inkt',
               'primary': btn('inkt', 'wit'), 'primary_hover': btn('inkt', 'wit', 'zand'), 'primary_active': btn('inkt', 'wit', 'zand', inset=True),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('tint-lampion', 'inkt', 'inkt')},
  'scheme-6': {'naam': 'Inkt (footer, donkere band)', 'background': 'inkt', 'text': 'zand', 'muted': 'zand', 'focus': 'zand', 'border': 'zand', 'logo_tent': 'lampion',
               'primary': btn('zand', 'inkt'), 'primary_hover': btn('zand-hover', 'inkt'), 'primary_active': btn('zand', 'inkt', inset=True),
               'secondary': btn('transparent', 'zand', 'zand'), 'secondary_hover': btn('tintd-inkt', 'zand', 'zand')},
}
def hx(n, bgname): return H[bgname] if n == 'transparent' else H[n]
scheme_checks = []
STATES = ('buy', 'buy_hover', 'buy_active', 'primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover')
for sid, s_ in SCHEMES.items():
    bgn = s_['background']
    for state in STATES:
        if state not in s_: continue
        b = s_[state]
        fill = hx(b['bg'], bgn); edge = hx(b['border'], bgn)
        lab = cr(H[b['label']], fill)
        shape = max(cr(fill, H[bgn]), cr(edge, H[bgn]))
        scheme_checks.append({'scheme': sid, 'state': state, 'label_ratio': round(lab, 2), 'shape_ratio': round(shape, 2), 'pass': lab >= 4.5 and shape >= 3.0})
    look = lambda b: (hx(b['bg'], bgn), hx(b['border'], bgn), b['label'])
    keys = [k for k in ('buy', 'primary', 'primary_hover', 'secondary', 'secondary_hover') if k in s_]
    s_['all_states_distinct'] = len({look(s_[k]) for k in keys}) == len(keys)
    s_['text_ratio'] = round(cr(H[s_['text']], H[bgn]), 2)
bad_s = [c for c in scheme_checks if not c['pass']] + [{'scheme': k, 'state': 'distinct'} for k, v in SCHEMES.items() if not v['all_states_distinct']]

R = REPRO['colors']
def ref(k):
    e = R[k]
    return {'srgb': e['hex'], 'lab_d50': e['lab_d50'], 'cmyk_coated_fogra39': e['cmyk_fogra39'], 'cmyk_uncoated_fogra29': e['cmyk_fogra29'],
            'pantone_c': e['pantone_c'][0]['name'], 'pantone_c_de2000': e['pantone_c'][0]['de'],
            'pantone_u': e['pantone_u'][0]['name'], 'pantone_u_de2000': e['pantone_u'][0]['de'],
            'pantone_tcx': e['pantone_tcx'][0]['name'], 'pantone_tcx_de2000': e['pantone_tcx'][0]['de'],
            'ral_classic': [e['ral_b'][0]['name'].split(' (')[0], e['ral_a'][0]['name']], 'ral_de2000': [e['ral_b'][0]['de'], e['ral_a'][0]['de']],
            'oracal_651': e['oracal651'][0]['name'], 'oracal_de2000': e['oracal651'][0]['de'],
            'thread': {'madeira_polyneon': [e['madeira'][0]['name'], e['madeira'][0]['de']], 'isacord': [e['isacord'][0]['name'], e['isacord'][0]['de']],
                       'gunold_poly': [e['gunold'][0]['name'], e['gunold'][0]['de']]},
            'status': 'digitale benadering, niet fysiek afgetekend'}

wm, mk = META['wordmark'], META['mark']
HEADER = {'desktop_px': 200, 'mobile_px': 132}
caph = lambda w, v: f'{w * 700 / wm[v]["width_units"]:.1f}'.replace('.', ',')
tokens = {
  '$schema_note': 'Klapklaar design tokens v7 (2026-10-17). Elf kleuren met één betekenis, zes kleurschema’s met koopknop/hoofdknop/omlijnd in rust, hover, ingedrukt en focus, reproductiereferenties (Pantone C/U/TCX, RAL, Oracal, borduurgaren), Shopify font_picker-handles + fallbacks, typeschaal, radii, spacing, randen, schaduwen, motion, componentstaten, logo- en faviconregels. Uitleg: brand.md; maten en bronnen: technisch.md.',
  'color': {k: {'value': v[0], 'family': v[1], 'role': v[2]} for k, v in COL.items()},
  'color_derived': {k: {'value': v[0], 'css': v[1], 'role': v[2]} for k, v in D.items()},
  'color_migration_v6_to_v7': {
    'klaproos #C83812': 'vervalt → lampion #E66414 (merk + koopknop)', 'tintd-klaproos #AD3514': 'vervalt → tint-lampion',
    'primaire knop (kopen)': 'Inkt → Lampion met Inkt-label (koopknop); Inkt blijft de hoofdknop voor alles wat geen kopen is',
    'luifelbalk': 'Klaproos met Zand-tekst → Lampion met Inkt-tekst', 'winkelwagenteller': 'Inkt → Lampion met Inkt-cijfer',
    'gekozen optiechip': 'Inkt vlak → Linnen vlak met 2 px Inkt-rand en vinkje', 'btw-schakelaar': 'Inkt vlak → Wit segment met Inkt-rand op Linnen',
    'badge Met jouw logo': 'Inkt → Linnen met Inkt-tekst en upload-icoon', 'niet leverbaar': 'stippelrand → Lijn-rand, doorgestreept label',
    'stippelrand': 'alleen nog de uploadzone', 'campagneletter': 'Barlow Condensed → Figtree Black (lock-up-teksten zijn getekend)'},
  'color_semantic': {
    'background': 'zand', 'surface': 'wit', 'media': 'linnen', 'surface-band': 'linnen', 'surface-zakelijk': 'linnen', 'surface-dark': 'inkt', 'brand-band': 'lampion',
    'text': 'inkt', 'text-muted': 'kiezel', 'text-on-dark': 'zand', 'text-on-brand': 'inkt', 'link': 'inkt (onderstreept 1 px, hover 2 px)',
    'button-buy': ['lampion', 'inkt'], 'button-buy-hover': 'lampion + 2 px Inkt-rand (inset)', 'button-primary': ['inkt', 'wit'], 'button-primary-hover': 'inkt-hover',
    'button-done': ['polder', 'wit'], 'price': 'inkt', 'price-compare': 'kiezel (doorgestreept)', 'price-sale-bg': 'zon', 'price-sale-text': 'inkt',
    'badge-actie': ['zon', 'inkt'], 'badge-nieuw': ['wit', 'inkt', 'rand 1,5 px inkt'], 'badge-logo': ['linnen', 'inkt', 'icoon upload'], 'badge-staffel': ['wit', 'inkt', 'rand 1,5 px kiezel', 'icoon stapel'],
    'stock-in': 'polder (volle stip + tekst)', 'stock-later': 'oker (halve stip + tekst)', 'stock-out': 'kiezel (open ring + tekst)',
    'error': 'bordeaux', 'notice': 'oker', 'success': 'polder', 'alert-surface': 'wit', 'alert-border': 'lijn',
    'card': 'wit', 'card-border': 'lijn', 'focus-on-light': 'inkt', 'focus-on-dark': 'zand', 'focus-on-brand': 'inkt', 'border-input': 'kiezel', 'divider': 'lijn',
    'header-utility-bg': 'lampion', 'header-utility-text': 'inkt', 'footer-bg': 'inkt', 'footer-text': 'zand', 'cart-count': ['lampion', 'inkt'],
    'favicon-cart-dot': ['zand', 'ring inkt'], 'accent-underline': 'luifelstreep: 0,14 em Lampion onder één woord van een kop vanaf 32 px',
    'dashed': 'alleen de uploadzone (sleep hier je logo); niets anders is gestippeld',
  },
  'color_separation': separation,
  'surface_separation': surfaces,
  'color_schemes': SCHEMES,
  'color_scheme_checks': {'rows': scheme_checks, 'fails': len(bad_s),
      'rule': 'Elke knopstand: label ≥ 4,5:1 op zijn vulling, vorm (vulling of rand) ≥ 3:1 tegen de schemaachtergrond. Koopknop, hoofdknop (rust en hover) en omlijnde knop (rust en hover) zijn per schema allemaal verschillend. De koopknop bestaat alleen op Zand en Wit.'},
  'shopify_color_schemes': {sid: {
      'background': H[s['background']], 'background_gradient': '', 'foreground': H[s['text']], 'muted': H[s['muted']],
      'primary_button': H[s['primary']['bg']], 'primary_button_label': H[s['primary']['label']],
      'primary_button_hover': H[s['primary_hover']['bg']], 'primary_button_hover_label': H[s['primary_hover']['label']],
      'primary_button_hover_border': H[s['primary_hover']['border']], 'primary_button_active': H[s['primary_active']['bg']],
      'secondary_button_label': H[s['secondary']['label']], 'secondary_button_hover': H[s['secondary_hover']['bg']],
      'buy_button': H[s['buy']['bg']] if 'buy' in s else None, 'buy_button_label': H[s['buy']['label']] if 'buy' in s else None,
      'buy_button_hover_border': H[s['buy_hover']['border']] if 'buy' in s else None,
      'border': H[s['border']], 'focus': H[s['focus']], 'logo_tent': H[s['logo_tent']]} for sid, s in SCHEMES.items()},
  'shopify_color_settings': {f'color_{k}': v[0] for k, v in COL.items()},
  'shopify_scheme_use': {'luifelbalk (utility-balk)': 'scheme-5', 'header': 'scheme-1', 'footer': 'scheme-6', 'Zakelijk-pagina’s, offerte, drukproef': 'scheme-4',
                         'heroband, staffeltabellen': 'scheme-3', 'productkaarten, drawers, productinfo': 'scheme-2', 'campagneband': 'scheme-5'},
  'print': {
    'note': 'Reproductiereferenties voor drukwerk, folie, lak en garen. Digitale dichtstbijzijnde stockkleur (CIEDE2000) uit open datasets; CMYK via Adobe Coated FOGRA39 / Uncoated FOGRA29. Vóór productie fysiek aftekenen (technisch.md §4). Doek is geen merkkleur: tenten en rokken komen in de stockkleuren van de leverancier.',
    'tolerance_de2000': {'drukwerk_gestreken': 2.0, 'textiel_folie_garen': 3.0},
    'one_colour_rule': 'Op doek, folie, borduursel en karton is het logo één kleur: Zand of wit op donker en rood doek, Inkt of zwart op wit doek, Inkt op kraft. Twee kleuren alleen in volledige druk (digitaal, offset, sublimatie, wrap).',
    'vinyl_rule': 'Geplotte folie (Oracal 651): Lampion 651-036, Inkt 651-070, Zand 651-010. Merkkleuren op de bus in geprinte wrap-folie met drukproef (ΔE00 ≤ 3).',
    'flex_flock': 'Geen open kleurdata voor Siser EasyWeed, Poli-Flex of StripFlock gevonden: kies op de fysieke kleurkaart van de leverancier tegen de afgetekende Pantone-referentie en noteer het nummer in technisch.md §4.',
    'colors': {k: ref(k) for k in ('lampion', 'inkt', 'zand', 'polder', 'zon')},
    'sources': REPRO['sources'],
  },
  'font': {
    'families': 'Figtree voor alle tekst. Het logo en de lock-up-teksten (ZAKELIJK, PARTYTENTEN · STATAFELS) zijn getekend en geen font.',
    'heading': {'family': 'Figtree', 'shopify_handle': 'figtree_n8', 'shopify_handle_h3': 'figtree_n7', 'shopify_handle_campaign': 'figtree_n9', 'setting': 'type_header_font',
                'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'},
    'body': {'family': 'Figtree', 'shopify_handle': 'figtree_n4', 'variants': {'label/nav': 'figtree_n6', 'knop/prijs': 'figtree_n7'}, 'setting': 'type_body_font',
             'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'},
    'campaign': {'family': 'Figtree', 'weight': 900, 'how': 'font_modify: "weight", "900" op type_header_font; geen extra font_picker',
                 'use': 'campagnekoppen in zinsopbouw (geen kapitalen), banners, social, actie. Kapitalen zijn voorbehouden aan het getekende logo.'},
    'evidence': {
      'shopify_font_list_copy': 'https://github.com/itsmylife44/shopify-theme-builder/blob/0d6d758a5a1ea120e6f1d8caf40c06a29fa48f0f/skills/shopify-theme-builder/studio/server/shopify-fonts.json (kopie van de tabel “Available fonts” op shopify.dev, retrieved 2026-09-22; bevat figtree_n3–n9)',
      'figtree_cdn': 'https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json (fonts.shopifycdn.com/figtree/…)',
      'status': 'waarschijnlijk (secundaire kopie, shopify.dev zelf was niet bereikbaar). Controle in 1 minuut: kies Figtree in de theme-editor.'},
    'self_host_fallback': 'brand/fonts/Figtree-VF.ttf (SIL OFL 1.1) als theme-asset, alleen als de handle in de theme-editor ontbreekt',
    'numeric': {'font-variant-numeric': 'tabular-nums', 'apply_to': ['prijzen', 'maten', 'aantallen', 'staffeltabellen', 'ordernummers', 'levertijden']},
    'logo_rule': 'Het woordmerk is getekend, geen font. Tekst tegen het logo (descriptor, ZAKELIJK) is met dezelfde constructie getekend (tools/kkgeo.py).',
  },
  'type_scale': {
    'campagne': {'font': 'heading', 'weight': 900, 'size_desktop': 80, 'size_mobile': 48, 'line_height': 0.95, 'tracking': '-0.035em', 'transform': 'none'},
    'display': {'font': 'heading', 'weight': 800, 'size_desktop': 64, 'size_mobile': 40, 'line_height': 1.0, 'tracking': '-0.025em'},
    'h1': {'font': 'heading', 'weight': 800, 'size_desktop': 48, 'size_mobile': 34, 'line_height': 1.05, 'tracking': '-0.02em'},
    'h2': {'font': 'heading', 'weight': 800, 'size_desktop': 36, 'size_mobile': 28, 'line_height': 1.1, 'tracking': '-0.015em'},
    'h3': {'font': 'heading', 'weight': 700, 'size_desktop': 22, 'size_mobile': 20, 'line_height': 1.2},
    'h4': {'font': 'heading', 'weight': 700, 'size_desktop': 18, 'size_mobile': 17, 'line_height': 1.3},
    'body-lg': {'font': 'body', 'weight': 400, 'size_desktop': 19, 'size_mobile': 17, 'line_height': 1.55},
    'body': {'font': 'body', 'weight': 400, 'size_desktop': 17, 'size_mobile': 16, 'line_height': 1.55},
    'small': {'font': 'body', 'weight': 400, 'size_desktop': 14, 'size_mobile': 14, 'line_height': 1.45},
    'label': {'font': 'body', 'weight': 600, 'size_desktop': 15, 'size_mobile': 15, 'line_height': 1.3},
    'eyebrow': {'font': 'body', 'weight': 700, 'size_desktop': 13, 'size_mobile': 12, 'line_height': 1.2, 'tracking': '0.08em', 'transform': 'uppercase'},
    'price': {'font': 'body', 'weight': 700, 'size_desktop': 20, 'size_mobile': 19, 'line_height': 1.2, 'numeric': 'tabular-nums'},
    'button': {'font': 'body', 'weight': 700, 'size_desktop': 16, 'size_mobile': 16, 'line_height': 1.0},
  },
  'price_notation': {
    'shop': 'In winkel, kaart, productpagina, winkelwagen, checkout, offerte en factuur altijd met centen: € 319,00 · € 1.145,00.',
    'marketing': 'In hero-prijschip, banner, social, advertentie en e-mailkop mag ‘vanaf € 319’ zonder centen, alleen als de centen ,00 zijn. Nooit afronden (€ 318,95 blijft € 318,95), nooit ‘,-’.',
    'format': '€ + spatie, punt voor duizendtallen, komma voor centen; maten 3 × 3 m (maalteken), Ø 80 cm, 320 g/m², 2–3 weken (en-dash); ‘incl. btw’ en ‘excl. btw’ klein.'},
  'radius': {'none': 0, 'badge': 4, 'chip': 8, 'input': 8, 'button': 8, 'card': 12, 'media': 12, 'panel': 16, 'pill': 999},
  'spacing': {'unit': 4, 'scale': {'0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64, '20': 80, '24': 96, '32': 128},
              'page_gutter': {'mobile': 16, 'tablet': 24, 'desktop': 40}, 'container_max': 1360, 'section_gap': {'mobile': 48, 'desktop': 96},
              'grid_gap': {'mobile': 12, 'desktop': 24}, 'touch_target_min': 44, 'grid_columns': {'mobile': 4, 'tablet': 8, 'desktop': 12}},
  'breakpoints': {'sm': 390, 'md': 750, 'lg': 990, 'xl': 1440},
  'border': {'hairline': f'1px solid {H["lijn"]}', 'card': f'1px solid {H["lijn"]}', 'input': f'1.5px solid {H["kiezel"]}', 'input-focus': f'2px solid {H["inkt"]}',
             'chip': f'1.5px solid {H["kiezel"]}', 'chip-selected': f'2px solid {H["inkt"]} + vlak linnen + vinkje', 'chip-unavailable': f'1.5px solid {H["lijn"]} + label kiezel doorgestreept',
             'error': f'2px solid {H["bordeaux"]}', 'button-outline': '2px solid currentColor', 'buy-hover': f'inset 0 0 0 2px {H["inkt"]}',
             'alert': f'1px solid {H["lijn"]} + 4px linkerrand in de statuskleur', 'dropzone': f'1.5px dashed {H["kiezel"]} (de enige stippelrand)', 'disabled': f'1.5px solid {H["lijn"]}'},
  'shadow': {'none': 'none', 'card-hover': '0 1px 2px rgba(29,36,32,.06), 0 10px 24px -14px rgba(29,36,32,.22)', 'sticky': '0 1px 0 rgba(29,36,32,.08), 0 6px 16px -10px rgba(29,36,32,.20)',
             'drawer': '0 24px 64px -24px rgba(29,36,32,.38)', 'toast': '0 12px 32px -12px rgba(29,36,32,.35)', 'button-pressed': 'inset 0 2px 0 rgba(0,0,0,.28)'},
  'focus': {'outline': '3px solid var(--focus)', 'offset': '2px', 'on_light': H['inkt'], 'on_dark': H['zand'], 'on_brand': H['inkt']},
  'components': {
    'button-buy': {'what': 'de ene koopknop per scherm: ‘In mijn winkelwagen’ (productpagina), ‘Naar winkelwagen’ (toast), ‘Afrekenen’ (winkelwagen, drawer)',
                   'rest': 'Lampion vlak, Inkt label (figtree_n7, 16 px), winkelwagen-icoon links, hoogte 52 px', 'hover': 'zelfde vlak + 2 px Inkt-rand (inset)',
                   'active': 'inzet-schaduw + 1 px omlaag', 'focus-visible': '3 px Inkt-ring, 2 px afstand', 'busy': '‘Toevoegen…’',
                   'done': 'Polder met Wit label en vinkje ‘Toegevoegd’, 1,5 s', 'disabled': 'Wit, 1,5 px Lijn-rand, label Kiezel ‘Uitverkocht’, aria-disabled',
                   'never': 'nooit op Linnen, Inkt of een Lampion-band; nooit twee koopknoppen op één scherm; in het productraster omlijnd'},
    'button-primary': {'rest': 'Inkt met Wit label', 'hover': 'inkt-hover (Inkt 84% + Zand)', 'active': 'Inkt + shadow.button-pressed + translateY(1px)',
                       'use': 'hoofdactie die geen kopen is: ‘Bekijk partytenten’, ‘Offerte aanvragen’, ‘Aanmelden’, ‘Ontwerp je hoes’'},
    'button-secondary': {'rest': 'transparant, 2px rand en label Inkt', 'hover': 'tint + dezelfde rand', 'active': 'tint + shadow.button-pressed'},
    'add-to-cart': {'label': 'In mijn winkelwagen · {regeltotaal}', 'label_variant_missing': 'Kies je maat', 'label_soldout': 'Uitverkocht',
                    'quantity': 'stepper − / + (44 px, omlijnd), totaal live in het label, tabular-nums',
                    'helper': 'Twijfel je over de maat? De maatgids rekent het voor je uit.', 'b2b_nudge': 'Zakelijk? Vanaf 10 stuks maken we een offerte op maat, op factuur. [claim]',
                    'toast': {'title': 'Staat in je winkelwagen.', 'body': '{producttitel}, {variant} · {aantal} ×', 'actions': ['Naar winkelwagen (koopknop)', 'Verder winkelen (omlijnd)']}},
    'option-chip': {'height': 44, 'radius': 8, 'rest': {'bg': 'wit', 'border': '1.5px kiezel', 'label': 'inkt (figtree_n6)'}, 'hover': {'bg': 'tint-wit', 'border': '1.5px inkt'},
                    'selected': {'bg': 'linnen', 'border': '2px inkt', 'label': 'inkt (figtree_n7)', 'icon': 'vinkje 14 px links van het label', 'aria': 'aria-checked'},
                    'unavailable': {'bg': 'wit', 'border': '1.5px lijn', 'label': 'kiezel, doorgestreept (line-through 1.5px)', 'sr': 'niet leverbaar'},
                    'selected_unavailable': {'bg': 'linnen', 'border': '2px inkt', 'label': 'inkt doorgestreept', 'below': 'Uitverkocht – mail me als dit weer op voorraad is'}},
    'btw-toggle': {'shape': 'segmented control, 36 px, radius pill', 'track': 'linnen', 'selected': 'Wit segment, 1.5 px Inkt-rand, label Inkt figtree_n7', 'unselected': 'label Kiezel figtree_n6', 'aria': 'radiogroup'},
    'swatch': {'size': 32, 'ring_selected': '2px inkt met 2px tussenruimte', 'unavailable': 'diagonale streep Kiezel door de swatch', 'label': 'kleurnaam zichtbaar naast de groep: ‘Kleur: Rood’'},
    'product-card': {'card': 'Wit, border.card, radius.card', 'media': 'Linnen, het product vult 80%', 'title': 'h4', 'spec_line': 'Kiezel, 1 regel (bv. ‘Aluminium frame · 320 g/m² dakdoek’)',
                     'price': 'Inkt, tabular, met centen', 'quick_add': 'omlijnde Inkt-knop ‘In winkelwagen’ of ‘Kies je maat’ (geen koopknop in het raster)'},
    'custom-print-card': {'badge': 'Met jouw logo (Linnen, Inkt-tekst, upload-icoon)', 'card': 'Wit kaart met Linnen voet; geen stippelrand', 'price': 'vanaf € 39,95 per stuk',
                          'cta': 'Ontwerp je hoes / Ontwerp je tent (Inkt hoofdknop)', 'note': 'Upload je logo, je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs. [claim]'},
    'upload': {'zone': 'Wit, 1.5 px gestippelde Kiezel-rand, upload-icoon, ‘Sleep je logo hierheen of kies een bestand’', 'filled': 'bestandsnaam + ‘Vervangen’, rand wordt doorgetrokken Kiezel'},
    'price-sale': {'shape': 'Zon-label, Inkt-tekst, tabular', 'compare': 'Kiezel, doorgestreept'},
    'stock': {'in': {'text': 'Op voorraad', 'color': 'polder', 'marker': 'volle stip'}, 'later': {'text': 'Leverbaar over 2–3 weken', 'color': 'oker', 'marker': 'halve stip'},
              'out': {'text': 'Tijdelijk uitverkocht', 'color': 'kiezel', 'marker': 'open ring'}},
    'alert': {'surface': 'wit', 'border': '1px lijn', 'accent': '4px linkerrand', 'error': 'bordeaux', 'notice': 'oker', 'success': 'polder', 'parts': 'icoon + vetgedrukte kop in de statuskleur, uitleg in Inkt'},
    'accent-underline': {'what': 'luifelstreep onder één woord in een kop vanaf 32 px', 'css': 'text-decoration: underline; text-decoration-color: var(--c-lampion); text-decoration-thickness: .14em; text-underline-offset: .12em; text-decoration-skip-ink: none'},
    'bunting': {'light': 'svg/vlaggenlijn.svg (Lampion)', 'on_inkt': 'svg/vlaggenlijn-inkt.svg (Lampion en Zand)', 'never': ['in Zakelijk, offerte, checkout of bij een fout']},
  },
  'motion': {
    'duration': {'instant': 80, 'fast': 140, 'base': 220, 'slow': 320},
    'easing': {'standard': 'cubic-bezier(.2,0,0,1)', 'uitklap (enter)': 'cubic-bezier(.16,1,.3,1)', 'inklap (exit)': 'cubic-bezier(.4,0,1,1)'},
    'patterns': {'drawer/accordion': 'uitklappen: height/transform 220 ms, geen bounce', 'add-to-cart': 'label → ‘Toevoegen…’ → Polder + vinkje ‘Toegevoegd’ (140 ms), na 1,5 s terug; toast 220 ms',
                 'hover kaart': 'shadow.card-hover 140 ms; beeld schaal max 1,02', 'hover knop': 'vulling/rand 140 ms; ingedrukt: inzet-schaduw + 1 px omlaag'},
    'reduced_motion': 'prefers-reduced-motion: geen transform-animaties, alleen opacity ≤ 140 ms'},
  'icon': {'grid': 24, 'stroke': 2, 'stroke_small': 1.75, 'linecap': 'round', 'linejoin': 'round', 'color': 'currentColor', 'rule': 'lijniconen, één kleur, altijd met label of aria-label'},
  'logo': {
    'construction_units': {'cap_height': 700, **META['strokes_units']},
    'angles_deg': META['angles_deg'],
    'tent': META['tent'],
    'files': {'primary': 'logo.svg', 'inverse': 'logo-inverse.svg', 'inline_theme': 'svg/logo-inline.svg', 'klein': 'svg/logo-klein.svg', 'klein_inverse': 'svg/logo-klein-inverse.svg',
              'klein_inline_theme': 'svg/logo-klein-inline.svg', 'on_lampion': 'svg/logo-on-lampion.svg', 'mono': 'svg/logo-mono.svg', 'luifel': 'svg/logo-luifel.svg',
              'zakelijk': 'svg/logo-zakelijk.svg', 'mark': 'mark.svg', 'mark_klein': 'svg/mark-klein.svg', 'mark_variants': ['svg/mark-lampion.svg', 'svg/mark-zand.svg', 'svg/mark-symbool.svg', 'svg/mark-mono.svg'],
              'print': ['svg/print-wordmark.svg', 'svg/print-wordmark-klein.svg', 'svg/print-luifel.svg', 'svg/print-mark.svg', 'svg/print-mark-klein.svg'],
              'favicon_32': 'favicon.svg', 'favicon_16': 'svg/favicon-16.svg'},
    'switch_screen_px': {'logo.svg': META['switch']['logo.svg'], 'svg/logo-klein.svg': META['switch']['logo-klein'], 'mark.svg': 'vanaf 40 px', 'svg/mark-klein.svg': '24–39 px', 'favicon': '16 en 32 px: eigen tekening'},
    'header': {'desktop': f'svg/logo-inline.svg, {HEADER["desktop_px"]} px breed (kapitaalhoogte {caph(HEADER["desktop_px"], "primary")} px)',
               'mobile_390': f'svg/logo-klein-inline.svg, {HEADER["mobile_px"]} px breed (kapitaalhoogte {caph(HEADER["mobile_px"], "klein")} px)',
               'css': 'letters fill=currentColor; tent class="kk-tent", fill var(--logo-tent, #E66414); Zakelijk en één-kleur: currentColor'},
    'min_width_mm': {'logo.svg': wm['primary']['min_width_mm'], 'logo-klein': wm['klein']['min_width_mm'], 'mark (symbool zonder vlak)': mk['min_width_mm'], 'mark-klein': mk['min_width_mm_klein']},
    'clearspace': 'rondom minstens de halve letterhoogte (350 eenheden), gemeten vanaf de buitenkant van letters en tent; op scherm minimaal 12 px',
  },
  'favicon': {
    'theme_assets': {'favicon-16.png': 'brand/img/favicon-16.png', 'favicon-32.png': 'brand/favicon-32.png', 'favicon-192.png': 'brand/favicon-192.png',
                     'apple-touch-icon-180.png': 'brand/img/apple-touch-icon-180.png', 'favicon-cart-16.png': 'brand/img/favicon-cart-16.png', 'favicon-cart-32.png': 'brand/img/favicon-cart-32.png'},
    'drawings': {'32': 'tent op het pixelraster: steil dak (55°), luifel van 2,5 px met twee schulpen, palen van 3 px', '16': 'dak, luifel van 1,5 px met één schulp, palen van 2 px'},
    'no_svg_link': 'Geen <link rel="icon" type="image/svg+xml">: dan schaalt de browser één tekening en wordt de 16-px-tekening nooit gebruikt.',
    'cart_state': 'Zand-stip met Inkt-ring rechtsboven (favicon-cart-*.png); wisselen via handoff/favicon-cart.js'},
  'render': {'backdrop': H['linnen'], 'tent_colour': 'stockkleur van de leverancier (renders/js/materials.js: rood #B5161E, zwart, wit), nooit Lampion',
             'print_colour': {'op rood en zwart doek': H['zand'], 'op wit doek': H['inkt']},
             'note': 'renders/render.mjs --bg "#ECE4D6"; de standaard in renders/ is nog #EFEDE8 (Steen, v5) en moet mee.'},
}
os.makedirs(OUT, exist_ok=True)
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w'), indent=2, ensure_ascii=False)
json.dump({'rows': rows, 'forbidden': forb, 'separation': separation, 'surfaces': surfaces, 'scheme_checks': scheme_checks, 'derived': {k: v[0] for k, v in D.items()}},
          open(os.path.join(OUT, 'tools', '_contrast.json'), 'w'), indent=1, ensure_ascii=False)
print('pairs', len(rows), 'fails', len(bad), [(b['fg'], b['bg'], b['ratio']) for b in bad])
print('scheme checks', len(scheme_checks), 'fails', bad_s)
print('derived', {k: v[0] for k, v in D.items()})
print('separation', json.dumps(separation, ensure_ascii=False))
print('forbidden', [(f['fg'], f['bg'], f['ratio']) for f in forb])
