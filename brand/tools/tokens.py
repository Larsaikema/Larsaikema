"""Write brand/tokens.json (v3) and the WCAG pair table (brand/tools/_contrast.json).

    python3 tokens.py <brand-dir>      (needs <brand-dir>/tools/_repro.json and tools/logo-meta.json)
"""
import json, sys, os, math
from contrast import cr
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from color3 import lab65, de2000, lab_hue

OUT = sys.argv[1]
REPRO = json.load(open(os.path.join(OUT, 'tools', '_repro.json')))
META = json.load(open(os.path.join(OUT, 'tools', 'logo-meta.json')))

# name: (hex, role family, role)  -- every colour has ONE role family
COL = {
  'klaproos':        ('#C83812', 'merk & kopen', 'Het merkrood. Alleen als vlak: dak in het logo, primaire knop (In mijn winkelwagen), het Klaproos-dakdoek. Als tekst alleen in koppen vanaf 24 px op Zand of Wit.'),
  'klaproos-donker': ('#982A0E', 'merk & kopen', 'Alleen de ingedrukte stand (:active) van de primaire knop.'),
  'zon':             ('#FFC23A', 'feest & voordeel', 'De vlag: vlaggetje en dak van het logo op donker, Actie-badge en actieprijs-label (altijd met Inkt-tekst). Verder niets.'),
  'polder':          ('#154F3E', 'vertrouwen', 'Donkere vlakken (utility-balk, footer), secundaire knop, Op voorraad / Toegevoegd (met icoon), Klapklaar Zakelijk.'),
  'inkt':            ('#1D2420', 'tekst', 'Tekst, koppen, links (onderstreept), omlijnde knop, focusring op licht en de hover-stand van de primaire knop.'),
  'kiezel':          ('#5D625C', 'tekst', 'Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs) en randen van invoervelden (>= 3:1).'),
  'zand':            ('#FBF6EC', 'vlak', 'Paginaachtergrond (warmer dan wit, zodat witte kaarten loskomen); tekst en focusring op donker.'),
  'duin':            ('#F2E8D5', 'vlak', 'Warme vlakken: heroband, chips, geneste kaarten.'),
  'linnen':          ('#ECEEE8', 'vlak', 'Rustig koel vlak voor Zakelijk, offerte, staffels en specificatietabellen.'),
  'studio':          ('#EFEDE8', 'vlak', 'Achtergrond van elke productrender en van het beeldvlak in productkaarten (naadloos).'),
  'wit':             ('#FFFFFF', 'vlak', 'Productkaarten, invoervelden, drawers; tekst op de primaire knop.'),
  'lijn':            ('#E4D6BE', 'vlak', 'Decoratieve scheidingslijnen (draagt geen informatie).'),
  'bordeaux':        ('#8A1538', 'fout', 'Fouten: kop, icoon en linkerrand van foutmeldingen, veldfout-tekst en -rand. Nooit een gevuld vlak, nooit een knop.'),
  'foutroze':        ('#FBEAEA', 'fout', 'Achtergrond van foutmeldingen.'),
  'oker':            ('#865800', 'wachten', 'Levertijd en let-op: "Leverbaar over 2–3 weken" (tekst + stip), kop van let-op-meldingen.'),
  'okerlicht':       ('#FFF4DA', 'wachten', 'Achtergrond van let-op-meldingen (drukproef nodig, levertijd).'),
  'mos':             ('#E4EEE8', 'vertrouwen', 'Achtergrond van succesmeldingen (Polder-tekst).'),
}
H = {k: v[0] for k, v in COL.items()}

# text/background pairs the system uses (fg, bg, use, kind)  kind: text | large (>= 24 px bold) | ui (3:1)
PAIRS = [
  ('inkt', 'zand', 'Lopende tekst op pagina', 'text'), ('inkt', 'duin', 'Tekst op heroband/chips', 'text'),
  ('inkt', 'wit', 'Tekst op kaarten/velden', 'text'), ('inkt', 'linnen', 'Zakelijk-blokken', 'text'),
  ('inkt', 'studio', 'Badges op het beeldvlak', 'text'), ('inkt', 'zon', 'Actie-badge en actieprijs-label', 'text'),
  ('inkt', 'foutroze', 'Uitleg in foutmelding', 'text'), ('inkt', 'okerlicht', 'Uitleg in let-op-melding', 'text'), ('inkt', 'mos', 'Uitleg in succesmelding', 'text'),
  ('kiezel', 'zand', 'Specs, btw-regel', 'text'), ('kiezel', 'duin', 'Specs op Duin', 'text'), ('kiezel', 'wit', 'Specs op kaart, van-prijs', 'text'),
  ('kiezel', 'linnen', 'Specs in Zakelijk', 'text'), ('kiezel', 'studio', 'Bijschrift op beeldvlak', 'text'),
  ('polder', 'zand', 'Op voorraad, links in Zakelijk', 'text'), ('polder', 'wit', 'Op voorraad op kaart', 'text'), ('polder', 'duin', 'Op voorraad op Duin', 'text'),
  ('polder', 'linnen', 'Zakelijk-koppen', 'text'), ('polder', 'mos', 'Succesmelding (kop)', 'text'),
  ('bordeaux', 'foutroze', 'Foutmelding (kop)', 'text'), ('bordeaux', 'wit', 'Veldfout onder invoerveld', 'text'), ('bordeaux', 'zand', 'Veldfout op pagina', 'text'),
  ('oker', 'zand', 'Leverbaar over 2–3 weken', 'text'), ('oker', 'wit', 'Leverbaar over 2–3 weken (kaart)', 'text'), ('oker', 'okerlicht', 'Let-op-melding (kop)', 'text'), ('oker', 'duin', 'Levertijd op Duin', 'text'),
  ('wit', 'klaproos', 'Primaire knop', 'text'), ('wit', 'inkt', 'Primaire knop, hover', 'text'), ('wit', 'klaproos-donker', 'Primaire knop, ingedrukt', 'text'),
  ('zand', 'polder', 'Secundaire knop, footer, utility-balk', 'text'), ('wit', 'polder', 'Secundaire knop (wit label)', 'text'),
  ('zand', 'inkt', 'Met jouw logo-badge, donkere banden', 'text'), ('inkt', 'zand', 'Primaire knop op Polder (Zand vlak, Inkt label)', 'text'),
  ('zon', 'inkt', 'Accent op Inkt (vlag, actie)', 'text'), ('zon', 'polder', 'Accent op Polder (vlag, actie)', 'text'),
  ('klaproos', 'zand', 'Display-kop op pagina (>= 24 px)', 'large'), ('klaproos', 'wit', 'Display-kop op kaart (>= 24 px)', 'large'),
  # non-text UI (3:1)
  ('kiezel', 'wit', 'Rand invoerveld', 'ui'), ('kiezel', 'zand', 'Rand invoerveld op pagina', 'ui'),
  ('klaproos', 'zand', 'Primaire knop tegen pagina', 'ui'), ('klaproos', 'duin', 'Primaire knop tegen Duin', 'ui'), ('klaproos', 'wit', 'Primaire knop tegen kaart', 'ui'),
  ('klaproos', 'linnen', 'Primaire knop tegen Linnen', 'ui'), ('klaproos', 'inkt', 'Primaire knop op Inkt-vlak', 'ui'),
  ('inkt', 'zand', 'Hover-knop / focusring op licht', 'ui'), ('polder', 'zand', 'Secundaire knop tegen pagina', 'ui'), ('polder', 'linnen', 'Primaire knop Zakelijk tegen Linnen', 'ui'),
  ('zand', 'polder', 'Focusring + Zand-knop op Polder', 'ui'), ('zand', 'inkt', 'Focusring op Inkt', 'ui'),
  ('bordeaux', 'foutroze', 'Linkerrand + icoon foutmelding', 'ui'), ('bordeaux', 'wit', 'Rand van een veld met fout', 'ui'),
  ('oker', 'zand', 'Stip "leverbaar over x weken"', 'ui'), ('zon', 'wit', 'Actieprijs-label tegen kaart (alleen vorm, tekst is Inkt)', 'ui-info'),
]
FORBIDDEN = [('zon', 'zand', 'Zon als tekst of rand op licht'), ('zon', 'wit', 'Zon als tekst of rand op wit'),
             ('klaproos', 'duin', 'Klaproos als gewone tekst (alleen display >= 24 px op Zand/Wit)'),
             ('klaproos', 'inkt', 'Klaproos-tekst op Inkt'), ('klaproos', 'polder', 'Klaproos op Polder (ook als knop)'),
             ('kiezel', 'inkt', 'Kiezel op donker'), ('wit', 'bordeaux', 'Bordeaux als gevuld vlak (fout is nooit een knop)')]

NEED = {'text': 4.5, 'large': 3.0, 'ui': 3.0, 'ui-info': 1.0}
rows = []
for fg, bg, use, kind in PAIRS:
    r = cr(H[fg], H[bg])
    rows.append({'fg': fg, 'bg': bg, 'fg_hex': H[fg], 'bg_hex': H[bg], 'use': use, 'kind': kind, 'ratio': round(r, 2),
                 'need': NEED[kind], 'pass': r >= NEED[kind], 'aaa': r >= (7 if kind == 'text' else 4.5)})
rows = [x for x in rows if x['kind'] != 'ui-info']
bad = [x for x in rows if not x['pass']]
forb = [{'fg': a, 'bg': b, 'use': u, 'ratio': round(cr(H[a], H[b]), 2)} for a, b, u in FORBIDDEN]

# perceptual separation of the three "loud" roles (CIEDE2000 + hue angle, D65)
def sep(a, b): return round(de2000(lab65(H[a]), lab65(H[b])), 1)
separation = {
  'klaproos_vs_bordeaux': {'de2000': sep('klaproos', 'bordeaux'), 'hue_klaproos': round(lab_hue(lab65(H['klaproos'])), 1), 'hue_bordeaux': round(lab_hue(lab65(H['bordeaux'])), 1), 'contrast': round(cr(H['klaproos'], H['bordeaux']), 2)},
  'klaproos_vs_inkt_hover': {'de2000': sep('klaproos', 'inkt'), 'contrast': round(cr(H['klaproos'], H['inkt']), 2)},
  'klaproos_vs_zon': {'de2000': sep('klaproos', 'zon')},
}

R = REPRO['colors']
def ref(k):
    e = R[k]
    return {
      'srgb': e['hex'], 'lab_d50': e['lab_d50'],
      'cmyk_coated_fogra39': e['cmyk_fogra39'], 'cmyk_uncoated_fogra29': e['cmyk_fogra29'],
      'pantone_c': e['pantone_c'][0]['name'], 'pantone_c_de2000': e['pantone_c'][0]['de'],
      'pantone_tcx': e['pantone_tcx'][0]['name'], 'pantone_tcx_de2000': e['pantone_tcx'][0]['de'],
      'ral_classic': [e['ral_b'][0]['name'].split(' (')[0], e['ral_a'][0]['name']],
      'ral_de2000': [e['ral_b'][0]['de'], e['ral_a'][0]['de']],
      'oracal_651': e['oracal651'][0]['name'], 'oracal_de2000': e['oracal651'][0]['de'],
      'status': 'digitale benadering, NIET fysiek afgetekend',
    }

wm, mk = META['wordmark'], META['mark']
tokens = {
  '$schema_note': 'Klapklaar design tokens v3 (2026-10-17). Kleuren met één rol, reproductiereferenties, Shopify font_picker-handles + fallbacks, radii, spacing, schaduwen, motion, componentstaten. Contrast en bronnen: brand.md.',
  'color': {k: {'value': v[0], 'family': v[1], 'role': v[2]} for k, v in COL.items()},
  'color_semantic': {
    'background': 'zand', 'surface': 'wit', 'surface-warm': 'duin', 'surface-zakelijk': 'linnen', 'media': 'studio',
    'text': 'inkt', 'text-muted': 'kiezel', 'text-on-dark': 'zand', 'link': 'inkt', 'link-hover': 'inkt (onderstreping 3 px)',
    'button-primary-bg': 'klaproos', 'button-primary-text': 'wit', 'button-primary-hover-bg': 'inkt', 'button-primary-active-bg': 'klaproos-donker',
    'button-secondary-bg': 'polder', 'button-secondary-text': 'zand', 'button-secondary-hover-bg': 'inkt',
    'button-outline-border': 'inkt', 'button-outline-hover-bg': 'inkt', 'button-outline-hover-text': 'zand',
    'button-disabled-bg': '#E7E3DA', 'button-disabled-text': 'kiezel',
    'badge-actie-bg': 'zon', 'badge-actie-text': 'inkt', 'badge-nieuw-bg': 'polder', 'badge-nieuw-text': 'zand',
    'badge-logo-bg': 'inkt', 'badge-logo-text': 'zand', 'badge-staffel-bg': 'linnen', 'badge-staffel-text': 'polder',
    'price': 'inkt', 'price-compare': 'kiezel', 'price-sale-bg': 'zon', 'price-sale-text': 'inkt',
    'stock-in': 'polder', 'stock-later': 'oker', 'stock-out': 'kiezel',
    'error': 'bordeaux', 'error-surface': 'foutroze', 'success': 'polder', 'success-surface': 'mos', 'notice': 'oker', 'notice-surface': 'okerlicht',
    'focus-on-light': 'inkt', 'focus-on-dark': 'zand', 'border-input': 'kiezel', 'divider': 'lijn',
    'header-utility-bg': 'polder', 'footer-bg': 'polder', 'footer-text': 'zand',
  },
  'color_separation': separation,
  'shopify_color_schemes': {
    'scheme-1 (pagina)':  {'background': H['zand'], 'foreground': H['inkt'], 'primary_button': H['klaproos'], 'primary_button_label': H['wit'], 'secondary_button': H['polder'], 'secondary_button_label': H['zand'], 'border': H['kiezel']},
    'scheme-2 (kaart)':   {'background': H['wit'], 'foreground': H['inkt'], 'primary_button': H['klaproos'], 'primary_button_label': H['wit'], 'secondary_button': H['polder'], 'secondary_button_label': H['zand'], 'border': H['kiezel']},
    'scheme-3 (duin)':    {'background': H['duin'], 'foreground': H['inkt'], 'primary_button': H['klaproos'], 'primary_button_label': H['wit'], 'secondary_button': H['polder'], 'secondary_button_label': H['zand'], 'border': H['kiezel']},
    'scheme-4 (zakelijk)':{'background': H['linnen'], 'foreground': H['inkt'], 'primary_button': H['polder'], 'primary_button_label': H['zand'], 'secondary_button': H['inkt'], 'secondary_button_label': H['zand'], 'border': H['kiezel']},
    'scheme-5 (polder)':  {'background': H['polder'], 'foreground': H['zand'], 'primary_button': H['zand'], 'primary_button_label': H['inkt'], 'secondary_button': H['polder'], 'secondary_button_label': H['zand'], 'secondary_button_border': H['zand'], 'border': H['zand']},
    'scheme-6 (inkt)':    {'background': H['inkt'], 'foreground': H['zand'], 'primary_button': H['klaproos'], 'primary_button_label': H['wit'], 'secondary_button': H['inkt'], 'secondary_button_label': H['zand'], 'secondary_button_border': H['zand'], 'border': H['zand']},
  },
  'print': {
    'note': 'Reproductiereferenties per kleur. Digitale dichtstbijzijnde stockkleur (CIEDE2000) uit open datasets; CMYK via Adobe Coated FOGRA39 / Uncoated FOGRA29 (relatief colorimetrisch + zwartpuntcompensatie). Vóór productie fysiek aftekenen tegen waaiers en een drukproef (brand.md 4.4).',
    'tolerance_de2000': {'drukwerk_gestreken': 2.0, 'textiel_en_folie': 3.0},
    'colors': {k: ref(k) for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand')},
    'sources': REPRO['sources'],
  },
  'font': {
    'heading': {'family': 'Mona Sans', 'shopify_handle': 'mona_sans_n8', 'shopify_handle_h3': 'mona_sans_n7',
                'css_fallback': '"Mona Sans", "Arial Black", "Helvetica Neue", Arial, sans-serif', 'weights': {'display/h1/h2': 800, 'h3/h4/kaarttitel': 700},
                'self_host_fallback': 'brand/fonts/MonaSans-VF.ttf (SIL OFL 1.1) als theme-asset met @font-face, alleen als de handle in de theme-editor ontbreekt',
                'evidence': 'mona_sans_n2…n9 in de Shopify-fontlijst (shopify.dev "Available fonts", via kopie in itsmylife44/shopify-theme-builder@0d6d758, opgehaald 2026-09-22)',
                'rejected': {'Hubot Sans': 'nul met streep: "Ø 80 cm" leest als "Ø 8Ø"', 'Archivo (v2)': 'te dicht bij Figtree', 'Bricolage Grotesque (v1)': 'modieus, leest als consumentenwinkeltje'}},
    'body': {'family': 'Figtree', 'shopify_handle': 'figtree_n4', 'variants': {'label/nav': 'figtree_n6', 'knop/prijs': 'figtree_n7', 'descriptor in lock-ups': 'figtree_n8 (omgezet naar paden)'},
             'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
             'self_host_fallback': 'brand/fonts/Figtree-VF.ttf (SIL OFL 1.1)',
             'evidence': 'figtree_n3…n9 in dezelfde Shopify-fontlijst; figtree_n4/n6/n7 ook als font-CDN-pad in echte winkels (brand.md 5)'},
    'numeric': {'font-variant-numeric': 'tabular-nums', 'apply_to': ['prijzen', 'maten', 'aantallen', 'staffeltabellen', 'ordernummers', 'levertijden']},
    'logo_rule': 'Het woordmerk heeft een eigen eenverdiepings-a. Tekst die direct bij het logo staat (descriptor, Zakelijk, tagline-lock-up) is altijd in kapitalen; nooit een gezette kleine a naast de getekende a.',
  },
  'type_scale': {
    'display': {'font': 'heading', 'weight': 800, 'size_desktop': 64, 'size_mobile': 40, 'line_height': 1.0, 'tracking': '-0.02em'},
    'h1': {'font': 'heading', 'weight': 800, 'size_desktop': 48, 'size_mobile': 34, 'line_height': 1.05, 'tracking': '-0.015em'},
    'h2': {'font': 'heading', 'weight': 800, 'size_desktop': 36, 'size_mobile': 28, 'line_height': 1.1, 'tracking': '-0.01em'},
    'h3': {'font': 'heading', 'weight': 700, 'size_desktop': 22, 'size_mobile': 20, 'line_height': 1.2, 'tracking': '0'},
    'h4': {'font': 'heading', 'weight': 700, 'size_desktop': 18, 'size_mobile': 17, 'line_height': 1.3, 'tracking': '0'},
    'body-lg': {'font': 'body', 'weight': 400, 'size_desktop': 19, 'size_mobile': 17, 'line_height': 1.55},
    'body': {'font': 'body', 'weight': 400, 'size_desktop': 17, 'size_mobile': 16, 'line_height': 1.55},
    'small': {'font': 'body', 'weight': 400, 'size_desktop': 14, 'size_mobile': 14, 'line_height': 1.45},
    'label': {'font': 'body', 'weight': 600, 'size_desktop': 15, 'size_mobile': 15, 'line_height': 1.3},
    'eyebrow': {'font': 'body', 'weight': 700, 'size_desktop': 12.5, 'size_mobile': 12, 'line_height': 1.2, 'tracking': '0.08em', 'transform': 'uppercase'},
    'price': {'font': 'body', 'weight': 700, 'size_desktop': 20, 'size_mobile': 19, 'line_height': 1.2, 'numeric': 'tabular-nums'},
    'button': {'font': 'body', 'weight': 700, 'size_desktop': 16, 'size_mobile': 16, 'line_height': 1.0},
  },
  'radius': {'none': 0, 'badge': 4, 'input': 8, 'button': 8, 'card': 12, 'media': 12, 'panel': 16, 'pill': 999},
  'spacing': {'unit': 4, 'scale': {'0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64, '20': 80, '24': 96, '32': 128},
              'page_gutter': {'mobile': 16, 'tablet': 24, 'desktop': 40}, 'container_max': 1360, 'section_gap': {'mobile': 48, 'desktop': 96},
              'grid_gap': {'mobile': 12, 'desktop': 24}, 'touch_target_min': 44},
  'breakpoints': {'sm': 390, 'md': 750, 'lg': 990, 'xl': 1440},
  'border': {'hairline': '1px solid #E4D6BE', 'input': '1.5px solid #5D625C', 'input-focus': '2px solid #1D2420', 'error': '2px solid #8A1538'},
  'shadow': {
    'none': 'none',
    'card-hover': '0 1px 2px rgba(29,36,32,.06), 0 10px 24px -14px rgba(29,36,32,.22)',
    'sticky': '0 1px 0 rgba(29,36,32,.08), 0 6px 16px -10px rgba(29,36,32,.20)',
    'drawer': '0 24px 64px -24px rgba(29,36,32,.38)',
    'toast': '0 12px 32px -12px rgba(29,36,32,.35)',
  },
  'focus': {'outline': '3px solid var(--focus)', 'offset': '2px', 'on_light': H['inkt'], 'on_dark': H['zand']},
  'components': {
    'button-primary': {'default': {'bg': 'klaproos', 'text': 'wit'}, 'hover': {'bg': 'inkt', 'text': 'wit'}, 'active': {'bg': 'klaproos-donker', 'text': 'wit'},
                       'focus-visible': {'outline': '3px inkt, offset 2px'}, 'disabled': {'bg': '#E7E3DA', 'text': 'kiezel'},
                       'busy': {'label': 'Toevoegen…'}, 'done': {'label': 'Toegevoegd', 'icon': 'check', 'duration_ms': 1500}},
    'add-to-cart': {'label': 'In mijn winkelwagen · {regeltotaal}', 'label_variant_missing': 'Kies je maat', 'label_soldout': 'Uitverkocht'},
    'price-sale': {'shape': 'Zon-label met vlaggetjes-inkeping rechts, Inkt-tekst, tabular', 'compare': 'Kiezel, doorgestreept'},
    'stock': {'in': {'text': 'Op voorraad', 'color': 'polder', 'dot': '#2E8B57'}, 'later': {'text': 'Leverbaar over 2–3 weken', 'color': 'oker', 'dot': 'oker'},
              'out': {'text': 'Tijdelijk uitverkocht', 'color': 'kiezel', 'dot': 'open cirkel kiezel'}},
    'alert': {'shape': 'getint vlak + linkerrand 5 px + icoon + vetgedrukte kop', 'error': ['foutroze', 'bordeaux'], 'notice': ['okerlicht', 'oker'], 'success': ['mos', 'polder']},
  },
  'motion': {
    'duration': {'instant': 80, 'fast': 140, 'base': 220, 'slow': 320},
    'easing': {'standard': 'cubic-bezier(.2,0,0,1)', 'uitklap (enter)': 'cubic-bezier(.16,1,.3,1)', 'inklap (exit)': 'cubic-bezier(.4,0,1,1)'},
    'patterns': {'drawer/accordion': 'uitklappen: height/transform 220 ms uitklap, geen bounce',
                 'add-to-cart': 'knop: label -> "Toevoegen…" -> vinkje + "Toegevoegd" (140 ms), na 1,5 s terug; toast "Klaar! Hij staat erin." 220 ms van rechtsonder',
                 'hover kaart': 'schaduw card-hover 140 ms; beeld schaal max 1,02',
                 'hover knop': 'achtergrond naar Inkt in 140 ms (standard)'},
    'reduced_motion': 'prefers-reduced-motion: alle transform-animaties uit, alleen opacity <= 140 ms',
  },
  'icon': {'grid': 24, 'stroke': 2, 'stroke_small': 1.75, 'linecap': 'butt', 'linejoin': 'round', 'corner_radius': 2, 'color': 'currentColor', 'accent': 'zon (alleen het vlaggetje)'},
  'logo': {
    'construction': {'x_height': 500, 'stem': 130, 'opening': 65, 'pitch_deg': 21},
    'files': {'primary': 'logo.svg', 'inverse': 'logo-inverse.svg', 'klein': 'svg/logo-klein.svg', 'mark': 'mark.svg', 'mark_klein': 'svg/mark-klein.svg', 'favicon': 'favicon.svg', 'favicon_16': 'svg/favicon-16.svg'},
    'switch': {'logo.svg': f">= {wm['primary']['min_sizes']['scherm']['min_width_px']} px breed", 'svg/logo-klein.svg': f"{wm['klein']['min_sizes']['scherm']['min_width_px']}–{wm['primary']['min_sizes']['scherm']['min_width_px'] - 1} px", 'mark.svg': f">= {mk['primary']['min_sizes']['scherm']['min_width_px']} px", 'favicon': '16 / 32 px eigen tekening'},
    'min_sizes_mm': {v: {m: wm[v]['min_sizes'][m]['min_width_mm'] for m in wm[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'mark_min_sizes_mm': {v: {m: mk[v]['min_sizes'][m]['min_width_mm'] for m in mk[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'clearspace': 'x-hoogte van de a (1 x) rondom; boven het vlaggetje ook 1 x',
  },
  'render': {'klaproos_albedo': '#9B2502', 'finish': 'mat', 'note': 'Ingangskleur voor de renderer zodat het belichte dakvlak als Klaproos #C83812 uit de render komt (gemeten, zie brand.md 8.2).'},
}
os.makedirs(OUT, exist_ok=True)
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w'), indent=2, ensure_ascii=False)
json.dump({'rows': rows, 'forbidden': forb, 'separation': separation}, open(os.path.join(OUT, 'tools', '_contrast.json'), 'w'), indent=1, ensure_ascii=False)
print('pairs', len(rows), 'fails', len(bad), [(b['fg'], b['bg'], b['ratio']) for b in bad])
print('separation', separation)
