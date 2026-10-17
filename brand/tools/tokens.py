"""Write brand/tokens.json (v4) and the WCAG tables (brand/tools/_contrast.json).

    python3 tokens.py <brand-dir>      (needs <brand-dir>/tools/_repro.json and tools/logo-meta.json)
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contrast import cr
from color3 import lab65, de2000, lab_hue

OUT = sys.argv[1]
REPRO = json.load(open(os.path.join(OUT, 'tools', '_repro.json')))
META = json.load(open(os.path.join(OUT, 'tools', 'logo-meta.json')))

# name: (hex, role family, role) -- every colour has ONE role family. v4: 13 colours (v3: 17).
COL = {
  'klaproos':        ('#C83812', 'merk & kopen', 'Het merkrood, alleen als vlak: de tent in het logo, het Klaproos-dakdoek en de primaire knop (In mijn winkelwagen, Afrekenen). Eén gevulde Klaproos-knop per kolom; nooit op productkaarten in een raster (daar is de Klaproos-tent zelf het rood). Als tekst alleen koppen ≥ 24 px op Zand of Wit.'),
  'klaproos-donker': ('#982A0E', 'merk & kopen', 'Alleen de ingedrukte stand (:active) van de primaire knop.'),
  'zon':             ('#FFC23A', 'vlag & voordeel', 'De vlag: het vlaggetje (digitaal), de tent van het logo op Polder en Inkt, de Actie-badge en het actieprijs-label, altijd met Inkt-tekst. Nooit tekst op licht, nooit een melding of stip.'),
  'polder':          ('#154F3E', 'vertrouwen & klaar', 'Donkere vlakken (utility-balk, footer), secundaire en Zakelijk-knop, en alles wat ‘klaar’ betekent: Op voorraad (stip), Toegevoegd (knop), succesmelding, de winkelwagen-stip in het favicon.'),
  'inkt':            ('#1D2420', 'tekst', 'Tekst, koppen, links (onderstreept), omlijnde knop, focusring op licht, hover van de primaire knop op lichte schema’s, badge Met jouw logo.'),
  'kiezel':          ('#5D625C', 'tekst', 'Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs), randen van invoervelden, uitgeschakelde knop (stippelrand + label).'),
  'zand':            ('#FBF6EC', 'vlak', 'Paginaachtergrond; tekst, knop en focusring op Polder en Inkt.'),
  'duin':            ('#F2E8D5', 'vlak', 'Warm vlak: heroband, chips, geneste kaarten.'),
  'steen':           ('#EFEDE8', 'vlak', 'Koel, rustig vlak: achtergrond van elke productrender (naadloos met het beeldvlak van de kaart) én van Klapklaar Zakelijk, staffel- en specificatietabellen. Vervangt Linnen en Studio uit v3.'),
  'wit':             ('#FFFFFF', 'vlak', 'Productkaarten, invoervelden, drawers en meldingen; label op Klaproos- en Polder-knoppen.'),
  'lijn':            ('#E4D6BE', 'vlak', 'Decoratieve scheidingslijnen en de 1 px rand om meldingen (draagt geen informatie).'),
  'bordeaux':        ('#8A1538', 'fout', 'Fouten: kop, icoon en 4 px linkerrand van een foutmelding, tekst en rand van een veld met fout. Nooit een gevuld vlak, nooit een knop.'),
  'oker':            ('#865800', 'wachten', 'Levertijd en let-op: ‘Leverbaar over 2–3 weken’ (tekst + halve stip), kop, icoon en linkerrand van een let-op-melding.'),
}
H = {k: v[0] for k, v in COL.items()}

# text/background pairs the system uses (fg, bg, use, kind)  kind: text (4.5) | large (>= 24 px bold, 3.0) | ui (3.0)
PAIRS = [
  ('inkt', 'zand', 'Lopende tekst op pagina', 'text'), ('inkt', 'duin', 'Tekst op heroband en chips', 'text'),
  ('inkt', 'wit', 'Tekst op kaarten, velden, meldingen', 'text'), ('inkt', 'steen', 'Zakelijk-blokken, badges op het beeldvlak', 'text'),
  ('inkt', 'zon', 'Actie-badge en actieprijs-label', 'text'),
  ('kiezel', 'zand', 'Specs, btw-regel', 'text'), ('kiezel', 'duin', 'Specs op Duin', 'text'), ('kiezel', 'wit', 'Specs op kaart, van-prijs', 'text'),
  ('kiezel', 'steen', 'Specs in Zakelijk, bijschrift op beeldvlak', 'text'),
  ('polder', 'zand', 'Op voorraad, links in Zakelijk', 'text'), ('polder', 'wit', 'Op voorraad op kaart, succesmelding (kop)', 'text'), ('polder', 'duin', 'Op voorraad op Duin', 'text'),
  ('polder', 'steen', 'Zakelijk-koppen, badge Staffelprijs', 'text'),
  ('bordeaux', 'wit', 'Foutmelding (kop), veldfout onder invoerveld', 'text'), ('bordeaux', 'zand', 'Veldfout op pagina', 'text'), ('bordeaux', 'steen', 'Veldfout in Zakelijk-formulier', 'text'),
  ('oker', 'zand', 'Leverbaar over 2–3 weken', 'text'), ('oker', 'wit', 'Levertijd op kaart, let-op-melding (kop)', 'text'), ('oker', 'duin', 'Levertijd op Duin', 'text'), ('oker', 'steen', 'Levertijd in Zakelijk', 'text'),
  ('wit', 'klaproos', 'Primaire knop', 'text'), ('wit', 'inkt', 'Primaire knop, hover (licht schema)', 'text'), ('wit', 'klaproos-donker', 'Primaire knop, ingedrukt', 'text'),
  ('zand', 'polder', 'Secundaire/Zakelijk-knop, Toegevoegd, footer, utility-balk, badge Nieuw', 'text'), ('wit', 'polder', 'Secundaire knop (wit label)', 'text'),
  ('zand', 'inkt', 'Badge Met jouw logo, omlijnde knop hover, donkere banden', 'text'), ('inkt', 'zand', 'Primaire knop op Polder (Zand vlak, Inkt label), hover op Inkt', 'text'),
  ('polder', 'wit', 'Zakelijk-knop hover (omlijnd: Wit vlak, Polder label)', 'text'),
  ('zon', 'inkt', 'Vlag en actie op Inkt', 'text'), ('zon', 'polder', 'Vlag en actie op Polder', 'text'),
  ('klaproos', 'zand', 'Display-kop op pagina (≥ 24 px vet)', 'large'), ('klaproos', 'wit', 'Display-kop op kaart (≥ 24 px vet)', 'large'),
  # non-text UI (3:1)
  ('kiezel', 'wit', 'Rand invoerveld, stippelrand uitgeschakelde knop', 'ui'), ('kiezel', 'zand', 'Rand invoerveld op pagina', 'ui'), ('kiezel', 'duin', 'Rand invoerveld / uitgeschakeld op Duin', 'ui'), ('kiezel', 'steen', 'Rand invoerveld in Zakelijk', 'ui'),
  ('klaproos', 'zand', 'Primaire knop tegen pagina', 'ui'), ('klaproos', 'duin', 'Primaire knop tegen Duin', 'ui'), ('klaproos', 'wit', 'Primaire knop tegen kaart', 'ui'),
  ('klaproos', 'inkt', 'Primaire knop op Inkt-vlak', 'ui'),
  ('inkt', 'zand', 'Hover-knop, focusring op licht', 'ui'), ('inkt', 'wit', 'Focusring op kaart', 'ui'), ('inkt', 'duin', 'Focusring op Duin', 'ui'), ('inkt', 'steen', 'Focusring, omlijnde knop in Zakelijk', 'ui'),
  ('polder', 'zand', 'Secundaire knop / Toegevoegd tegen pagina', 'ui'), ('polder', 'wit', 'Toegevoegd tegen kaart, voorraadstip', 'ui'), ('polder', 'steen', 'Zakelijk-knop en hover-rand tegen Steen', 'ui'),
  ('zand', 'polder', 'Focusring, Zand-knop en hover-rand op Polder', 'ui'), ('zand', 'inkt', 'Focusring en hover-vlak op Inkt', 'ui'),
  ('bordeaux', 'wit', 'Linkerrand + icoon foutmelding, rand veld met fout', 'ui'),
  ('oker', 'wit', 'Linkerrand + icoon let-op, halve stip levertijd', 'ui'), ('oker', 'zand', 'Halve stip levertijd op pagina', 'ui'),
  ('polder', 'klaproos', 'Winkelwagen-stip in het favicon (met 1,5 px Zand-ring)', 'ui-info'),
]
FORBIDDEN = [('zon', 'zand', 'Zon als tekst of rand op licht'), ('zon', 'wit', 'Zon als tekst of rand op wit'),
             ('klaproos', 'duin', 'Klaproos als tekst op Duin (ook niet als kop)'), ('klaproos', 'steen', 'Klaproos als tekst op Steen'),
             ('klaproos', 'inkt', 'Klaproos-tekst op Inkt'), ('klaproos', 'polder', 'Klaproos op Polder (ook als knop of tent)'),
             ('kiezel', 'inkt', 'Kiezel op donker'), ('kiezel', 'polder', 'Kiezel op Polder'), ('polder', 'inkt', 'Polder op Inkt (knop verdwijnt)'),
             ('wit', 'bordeaux', 'Bordeaux als gevuld vlak (fout is nooit een knop)'), ('zon', 'klaproos', 'Zon-tent op Klaproos (logo op Klaproos is één kleur Zand)')]

NEED = {'text': 4.5, 'large': 3.0, 'ui': 3.0, 'ui-info': 1.0}
rows = []
for fg, bg, use, kind in PAIRS:
    r = cr(H[fg], H[bg])
    rows.append({'fg': fg, 'bg': bg, 'fg_hex': H[fg], 'bg_hex': H[bg], 'use': use, 'kind': kind, 'ratio': round(r, 2),
                 'need': NEED[kind], 'pass': r >= NEED[kind], 'aaa': r >= (7 if kind == 'text' else 4.5)})
info_rows = [x for x in rows if x['kind'] == 'ui-info']
rows = [x for x in rows if x['kind'] != 'ui-info']
bad = [x for x in rows if not x['pass']]
forb = [{'fg': a, 'bg': b, 'use': u, 'ratio': round(cr(H[a], H[b]), 2)} for a, b, u in FORBIDDEN]

def sep(a, b): return round(de2000(lab65(H[a]), lab65(H[b])), 1)
separation = {
  'klaproos_vs_bordeaux': {'de2000': sep('klaproos', 'bordeaux'), 'hue_klaproos': round(lab_hue(lab65(H['klaproos'])), 1), 'hue_bordeaux': round(lab_hue(lab65(H['bordeaux'])), 1), 'contrast': round(cr(H['klaproos'], H['bordeaux']), 2)},
  'klaproos_vs_inkt_hover': {'de2000': sep('klaproos', 'inkt'), 'contrast': round(cr(H['klaproos'], H['inkt']), 2)},
  'klaproos_vs_zon': {'de2000': sep('klaproos', 'zon')},
}
SURF = ['zand', 'duin', 'steen', 'wit']
surfaces = {f'{a}–{b}': {'de2000': sep(a, b), 'contrast': round(cr(H[a], H[b]), 2)} for i, a in enumerate(SURF) for b in SURF[i + 1:]}

# ---------------------------------------------------------------- colour schemes with explicit states
def btn(bg, label, border=None): return {'bg': bg, 'label': label, 'border': border or bg}
SCHEMES = {
  'scheme-1': {'naam': 'Pagina', 'background': 'zand', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt',
               'primary': btn('klaproos', 'wit'), 'primary_hover': btn('inkt', 'wit'), 'primary_active': btn('klaproos-donker', 'wit'),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('inkt', 'zand')},
  'scheme-2': {'naam': 'Kaart', 'background': 'wit', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt',
               'primary': btn('klaproos', 'wit'), 'primary_hover': btn('inkt', 'wit'), 'primary_active': btn('klaproos-donker', 'wit'),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('inkt', 'zand')},
  'scheme-3': {'naam': 'Duin', 'background': 'duin', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt',
               'primary': btn('klaproos', 'wit'), 'primary_hover': btn('inkt', 'wit'), 'primary_active': btn('klaproos-donker', 'wit'),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('inkt', 'zand')},
  'scheme-4': {'naam': 'Zakelijk (Steen)', 'background': 'steen', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt',
               'primary': btn('polder', 'zand'), 'primary_hover': btn('wit', 'polder', 'polder'), 'primary_active': btn('inkt', 'zand'),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('inkt', 'zand')},
  'scheme-5': {'naam': 'Polder', 'background': 'polder', 'text': 'zand', 'muted': 'zand', 'focus': 'zand',
               'primary': btn('zand', 'inkt'), 'primary_hover': btn('transparent', 'zand', 'zand'), 'primary_active': btn('wit', 'inkt'),
               'secondary': btn('transparent', 'zand', 'zand'), 'secondary_hover': btn('zand', 'inkt')},
  'scheme-6': {'naam': 'Inkt', 'background': 'inkt', 'text': 'zand', 'muted': 'zand', 'focus': 'zand',
               'primary': btn('klaproos', 'wit'), 'primary_hover': btn('zand', 'inkt'), 'primary_active': btn('duin', 'inkt'),
               'secondary': btn('transparent', 'zand', 'zand'), 'secondary_hover': btn('zand', 'inkt')},
}
def hx(n, bgname): return H[bgname] if n == 'transparent' else H[n]
scheme_checks = []
for sid, s in SCHEMES.items():
    bgn = s['background']
    for state in ('primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover'):
        b = s[state]
        fill = hx(b['bg'], bgn); edge = hx(b['border'], bgn)
        lab = cr(H[b['label']], fill)
        shape = max(cr(fill, H[bgn]), cr(edge, H[bgn]))
        scheme_checks.append({'scheme': sid, 'state': state, 'label_ratio': round(lab, 2), 'shape_ratio': round(shape, 2),
                              'pass': lab >= 4.5 and shape >= 3.0})
    rest, hov = s['primary'], s['primary_hover']
    r_f, h_f = hx(rest['bg'], bgn), hx(hov['bg'], bgn)
    s['hover_change'] = {'fill_rest_vs_hover': round(cr(r_f, h_f), 2), 'how': 'vol → omlijnd' if hov['bg'] in ('transparent', 'wit') and rest['bg'] not in ('transparent', 'wit') else 'andere vulling'}
    s['text_ratio'] = round(cr(H[s['text']], H[bgn]), 2)
bad_s = [c for c in scheme_checks if not c['pass']]

R = REPRO['colors']
def ref(k):
    e = R[k]
    return {
      'srgb': e['hex'], 'lab_d50': e['lab_d50'],
      'cmyk_coated_fogra39': e['cmyk_fogra39'], 'cmyk_uncoated_fogra29': e['cmyk_fogra29'],
      'proof_de2000_coated': e.get('fogra39_proof_de'), 'proof_de2000_uncoated': e.get('fogra29_proof_de'),
      'pantone_c': e['pantone_c'][0]['name'], 'pantone_c_de2000': e['pantone_c'][0]['de'],
      'pantone_tcx': e['pantone_tcx'][0]['name'], 'pantone_tcx_de2000': e['pantone_tcx'][0]['de'],
      'ral_classic': [e['ral_b'][0]['name'].split(' (')[0], e['ral_a'][0]['name']],
      'ral_de2000': [e['ral_b'][0]['de'], e['ral_a'][0]['de']],
      'oracal_651': e['oracal651'][0]['name'], 'oracal_de2000': e['oracal651'][0]['de'],
      'status': 'digitale benadering, NIET fysiek afgetekend',
    }

wm, mk = META['wordmark'], META['mark']
SW = lambda v: wm[v]['min_sizes']['scherm']['min_width_px']
tokens = {
  '$schema_note': 'Klapklaar design tokens v4 (2026-10-17). 13 kleuren met één rol, kleurschema’s met hover/actief per schema, reproductiereferenties, Shopify font_picker-handles + fallbacks, radii, spacing, schaduwen, motion, componentstaten, logo- en faviconregels. Contrast en bronnen: brand.md.',
  'color': {k: {'value': v[0], 'family': v[1], 'role': v[2]} for k, v in COL.items()},
  'color_removed_in_v4': {'linnen #ECEEE8': 'samengevoegd in steen (ΔE00 2,1 van studio: niet uit elkaar te houden)', 'studio #EFEDE8': 'heet nu steen',
                          'mos #E4EEE8, foutroze #FBEAEA, okerlicht #FFF4DA': 'meldingen staan op Wit met een gekleurde linkerrand; geen getinte vlakken meer',
                          '#2E8B57 (voorraadstip), #E7E3DA (uitgeschakeld)': 'buiten het palet; nu Polder en een Kiezel-stippelrand'},
  'color_semantic': {
    'background': 'zand', 'surface': 'wit', 'surface-warm': 'duin', 'surface-cool': 'steen', 'media': 'steen', 'surface-zakelijk': 'steen',
    'text': 'inkt', 'text-muted': 'kiezel', 'text-on-dark': 'zand', 'link': 'inkt', 'link-hover': 'inkt (onderstreping 3 px)',
    'price': 'inkt', 'price-compare': 'kiezel', 'price-sale-bg': 'zon', 'price-sale-text': 'inkt',
    'badge-actie': ['zon', 'inkt'], 'badge-nieuw': ['polder', 'zand'], 'badge-logo': ['inkt', 'zand', 'vlaggetje zon'], 'badge-staffel': ['steen', 'polder'],
    'stock-in': 'polder (volle stip + tekst)', 'stock-later': 'oker (halve stip + tekst)', 'stock-out': 'kiezel (open ring + tekst)',
    'error': 'bordeaux', 'notice': 'oker', 'success': 'polder', 'alert-surface': 'wit', 'alert-border': 'lijn',
    'focus-on-light': 'inkt', 'focus-on-dark': 'zand', 'border-input': 'kiezel', 'divider': 'lijn',
    'header-utility-bg': 'polder', 'footer-bg': 'polder', 'footer-text': 'zand', 'favicon-cart-dot': 'polder',
  },
  'color_separation': separation,
  'surface_separation_de2000': surfaces,
  'color_schemes': SCHEMES,
  'color_scheme_checks': {'rows': scheme_checks, 'fails': len(bad_s),
                          'rule': 'Elke knopstand: label ≥ 4,5:1 op zijn vulling en vorm (vulling of rand) ≥ 3:1 tegen de schemaachtergrond. Hover verandert altijd zichtbaar: andere vulling (≥ 1,8:1) of vol ↔ omlijnd.'},
  'shopify_color_schemes': {sid: {'background': H[s['background']], 'text': H[s['text']],
                                  'button': H[s['primary']['bg']], 'button_label': H[s['primary']['label']],
                                  'secondary_button_label': H[s['secondary']['label']], 'border': H['kiezel'] if s['background'] not in ('polder', 'inkt') else H['zand'],
                                  'button_hover': 'transparent' if s['primary_hover']['bg'] == 'transparent' else H[s['primary_hover']['bg']],
                                  'button_hover_label': H[s['primary_hover']['label']], 'button_hover_border': H[s['primary_hover']['border']]}
                            for sid, s in SCHEMES.items()},
  'print': {
    'note': 'Reproductiereferenties per kleur. Digitale dichtstbijzijnde stockkleur (CIEDE2000) uit open datasets; CMYK via Adobe Coated FOGRA39 / Uncoated FOGRA29 (relatief colorimetrisch + zwartpuntcompensatie). Vóór productie fysiek aftekenen (brand.md 4.4).',
    'tolerance_de2000': {'drukwerk_gestreken': 2.0, 'textiel_en_folie': 3.0},
    'multi_colour_rule': 'Op doek, folie en papier raken twee kleuren elkaar nooit: letters en tent liggen minstens 44 eenheden uit elkaar, de vlag heeft altijd de kleur van de tent. Er is dus geen overlap en geen trap nodig. De Zon-vlag op een Zand-paal (mark.svg, favicon) is alleen digitaal.',
    'colors': {k: ref(k) for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand')},
    'sources': REPRO['sources'],
  },
  'font': {
    'family': 'Figtree (één familie, vier gewichten)',
    'heading': {'family': 'Figtree', 'shopify_handle': 'figtree_n8', 'shopify_handle_h3': 'figtree_n7',
                'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 'weights': {'display/h1/h2': 800, 'h3/h4/kaarttitel': 700}},
    'body': {'family': 'Figtree', 'shopify_handle': 'figtree_n4', 'variants': {'label/nav': 'figtree_n6', 'knop/prijs': 'figtree_n7', 'koppen': 'figtree_n8'},
             'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'},
    'settings_schema': {'type_header_font': 'figtree_n8', 'type_body_font': 'figtree_n4'},
    'evidence': {
      'figtree_n4': 'https://github.com/mrshahbazdev/shopify-section-factory-clone/blob/f2b6217daa4961e435b959c3d5ec3bc5935c4982/app/sections/featured-collection-9.liquid (font_face-uitvoer met /cdn/fonts/figtree/figtree_n4…woff2)',
      'figtree_n5_n6': 'https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json (fonts.shopifycdn.com/figtree/figtree_n5 en _n6)',
      'figtree_n7': 'zelfde bestand als figtree_n4 (figtree_n7…woff2)',
      'figtree_n8': 'https://github.com/LM-3434/aquacorail.ca/blob/a84889e15bf7c7c81207cca64c4d681e144bc95c/assets/screen-settings.css (//aquacorail.ca/cdn/fonts/figtree/figtree_n8…woff2)',
      'status': 'waarschijnlijk: Shopify maakt /cdn/fonts/<familie>/<handle>-paden alleen voor fonts uit zijn bibliotheek; de officiële lijst (shopify.dev) kon niet worden gelezen',
    },
    'opentype': {'tnum': 'aanwezig in Figtree[wght].ttf (GSUB tnum, pnum, case, frac); of de door Shopify geserveerde woff2 dezelfde features houdt is niet gecontroleerd: test font-variant-numeric in de theme-preview'},
    'self_host_fallback': 'brand/fonts/Figtree-VF.ttf (SIL OFL 1.1) als theme-asset met @font-face en font-display: swap, alleen als de handle in de theme-editor ontbreekt',
    'rejected': {'Mona Sans (v3)': 'te dicht bij het getekende woordmerk en alleen via een kopie van de fontlijst bevestigd', 'Archivo (v2)': 'te dicht bij Figtree', 'Bricolage Grotesque (v1)': 'modieus', 'Barlow': 'n8 niet als Shopify-CDN-pad gevonden; DIN-achtige kommen botsen met het woordmerk'},
    'numeric': {'font-variant-numeric': 'tabular-nums', 'apply_to': ['prijzen', 'maten', 'aantallen', 'staffeltabellen', 'ordernummers', 'levertijden']},
    'logo_rule': 'Het woordmerk heeft een eigen eenverdiepings-a. Tekst direct bij het logo (descriptor, Zakelijk) is altijd in kapitalen.',
  },
  'type_scale': {
    'display': {'weight': 800, 'size_desktop': 64, 'size_mobile': 40, 'line_height': 1.0, 'tracking': '-0.025em'},
    'h1': {'weight': 800, 'size_desktop': 48, 'size_mobile': 34, 'line_height': 1.05, 'tracking': '-0.02em'},
    'h2': {'weight': 800, 'size_desktop': 36, 'size_mobile': 28, 'line_height': 1.1, 'tracking': '-0.015em'},
    'h3': {'weight': 700, 'size_desktop': 22, 'size_mobile': 20, 'line_height': 1.2, 'tracking': '-0.005em'},
    'h4': {'weight': 700, 'size_desktop': 18, 'size_mobile': 17, 'line_height': 1.3, 'tracking': '0'},
    'body-lg': {'weight': 400, 'size_desktop': 19, 'size_mobile': 17, 'line_height': 1.55},
    'body': {'weight': 400, 'size_desktop': 17, 'size_mobile': 16, 'line_height': 1.55},
    'small': {'weight': 400, 'size_desktop': 14, 'size_mobile': 14, 'line_height': 1.45},
    'label': {'weight': 600, 'size_desktop': 15, 'size_mobile': 15, 'line_height': 1.3},
    'eyebrow': {'weight': 700, 'size_desktop': 12.5, 'size_mobile': 12, 'line_height': 1.2, 'tracking': '0.08em', 'transform': 'uppercase'},
    'price': {'weight': 700, 'size_desktop': 20, 'size_mobile': 19, 'line_height': 1.2, 'numeric': 'tabular-nums'},
    'button': {'weight': 700, 'size_desktop': 16, 'size_mobile': 16, 'line_height': 1.0},
  },
  'radius': {'none': 0, 'badge': 4, 'input': 8, 'button': 8, 'card': 12, 'media': 12, 'panel': 16, 'pill': 999},
  'spacing': {'unit': 4, 'scale': {'0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64, '20': 80, '24': 96, '32': 128},
              'page_gutter': {'mobile': 16, 'tablet': 24, 'desktop': 40}, 'container_max': 1360, 'section_gap': {'mobile': 48, 'desktop': 96},
              'grid_gap': {'mobile': 12, 'desktop': 24}, 'touch_target_min': 44},
  'breakpoints': {'sm': 390, 'md': 750, 'lg': 990, 'xl': 1440},
  'border': {'hairline': '1px solid #E4D6BE', 'input': '1.5px solid #5D625C', 'input-focus': '2px solid #1D2420', 'error': '2px solid #8A1538',
             'alert': '1px solid #E4D6BE + 4px linkerrand in de statuskleur', 'disabled': '2px dashed #5D625C'},
  'shadow': {
    'none': 'none',
    'card-hover': '0 1px 2px rgba(29,36,32,.06), 0 10px 24px -14px rgba(29,36,32,.22)',
    'sticky': '0 1px 0 rgba(29,36,32,.08), 0 6px 16px -10px rgba(29,36,32,.20)',
    'drawer': '0 24px 64px -24px rgba(29,36,32,.38)',
    'toast': '0 12px 32px -12px rgba(29,36,32,.35)',
  },
  'focus': {'outline': '3px solid var(--focus)', 'offset': '2px', 'on_light': H['inkt'], 'on_dark': H['zand']},
  'components': {
    'button-primary': {'default': 'zie color_schemes (Klaproos/Wit op licht)', 'hover': 'per schema (color_schemes.*.primary_hover)', 'active': 'per schema',
                       'focus-visible': {'outline': '3px focuskleur van het schema, offset 2px'},
                       'disabled': {'bg': 'transparent', 'border': '2px dashed kiezel (licht) / zand (donker)', 'label': 'kiezel (licht) / zand (donker)', 'aria': 'aria-disabled="true"'},
                       'busy': {'label': 'Toevoegen…', 'fill': 'ongewijzigd'},
                       'done': {'bg': 'polder', 'label': 'zand', 'text': 'Toegevoegd', 'icon': 'vinkje', 'duration_ms': 1500, 'then': 'terug naar default'}},
    'add-to-cart': {'label': 'In mijn winkelwagen · {regeltotaal}', 'label_variant_missing': 'Kies je maat', 'label_soldout': 'Uitverkocht',
                    'quantity': 'stepper − / + (44 px), totaal live in het label, tabular-nums'},
    'product-card': {'quick_add': 'omlijnde Inkt-knop of icoonknop (+), hover Inkt-vlak', 'filled_klaproos_button': 'nooit: het product (vaak een Klaproos-tent) is het rood',
                     'image_bg': 'steen', 'spec_line': 'kiezel, 1 regel', 'price': 'inkt tabular'},
    'price-sale': {'shape': 'Zon-label met vlaggetjes-inkeping rechts, Inkt-tekst, tabular', 'compare': 'Kiezel, doorgestreept'},
    'stock': {'in': {'text': 'Op voorraad', 'color': 'polder', 'marker': 'volle stip polder'},
              'later': {'text': 'Leverbaar over 2–3 weken', 'color': 'oker', 'marker': 'halve stip oker'},
              'out': {'text': 'Tijdelijk uitverkocht', 'color': 'kiezel', 'marker': 'open ring kiezel'}},
    'alert': {'surface': 'wit', 'border': '1px lijn', 'accent': '4px linkerrand', 'error': 'bordeaux', 'notice': 'oker', 'success': 'polder',
              'parts': 'icoon + vetgedrukte kop in de statuskleur, uitleg in Inkt'},
    'trust': {'slots': ['betaalmethoden (Shopify payment_type_svg_tag, alleen ingeschakelde)', 'bel/app ons + openingstijden [claim]', 'KvK- en btw-nummer [claim]',
                        'Thuiswinkel Waarborg (alleen met lidmaatschap) [claim]', 'reviewscore (alleen via review-app met echte data; anders niets)', 'herroepingsrecht 14 dagen, niet voor bedrukt maatwerk'],
              'style': 'Inkt-iconen 24 px + label, rustig op Steen of in de footer op Polder; geen badges of sterren zonder bron'},
  },
  'motion': {
    'duration': {'instant': 80, 'fast': 140, 'base': 220, 'slow': 320},
    'easing': {'standard': 'cubic-bezier(.2,0,0,1)', 'uitklap (enter)': 'cubic-bezier(.16,1,.3,1)', 'inklap (exit)': 'cubic-bezier(.4,0,1,1)'},
    'patterns': {'drawer/accordion': 'uitklappen: height/transform 220 ms uitklap, geen bounce',
                 'add-to-cart': 'label → "Toevoegen…" → Polder + vinkje + "Toegevoegd" (140 ms), na 1,5 s terug; toast "Klaar! Hij staat erin." 220 ms van rechtsonder',
                 'hover kaart': 'schaduw card-hover 140 ms; beeld schaal max 1,02',
                 'hover knop': 'vulling/rand volgens het schema in 140 ms (standard)'},
    'reduced_motion': 'prefers-reduced-motion: alle transform-animaties uit, alleen opacity ≤ 140 ms',
  },
  'icon': {'grid': 24, 'stroke': 2, 'stroke_small': 1.75, 'linecap': 'butt', 'linejoin': 'round', 'corner_radius': 2, 'color': 'currentColor', 'accent': 'zon (alleen het vlaggetje)'},
  'logo': {
    'construction': {'x_height': 500, 'stok': 130, 'dun': 65, 'pitch_deg': 21, 'min_tip_deg': wm['primary']['corners']['min_tip_deg']},
    'files': {'primary': 'logo.svg', 'inverse': 'logo-inverse.svg', 'inline_theme': 'svg/logo-inline.svg', 'klein': 'svg/logo-klein.svg', 'klein_inline_theme': 'svg/logo-klein-inline.svg',
              'mark': 'mark.svg', 'mark_klein': 'svg/mark-klein.svg', 'favicon_32': 'favicon.svg', 'favicon_16': 'svg/favicon-16.svg'},
    'switch_screen_px': {'logo.svg': f'≥ {SW("primary")} px breed', 'svg/logo-klein.svg': f'{SW("klein")}–{SW("primary") - 1} px', 'mark.svg': f'≥ {mk["primary"]["min_sizes"]["scherm"]["min_width_px"]} px (symboolbreedte)', 'favicon': '16 / 32 px eigen tekening'},
    'header': {'desktop': f'svg/logo-inline.svg inline, 168 px breed (≥ {SW("primary")})', 'mobile_390': f'svg/logo-klein-inline.svg inline, 108 px breed (≥ {SW("klein")})',
               'css': '.kk-tent{fill:var(--logo-tent)} — letters volgen currentColor', 'tent_colour': {'scheme-1..4': 'klaproos (Zakelijk-pagina’s: polder)', 'scheme-5/6': 'zon'}},
    'min_sizes_mm': {v: {m: wm[v]['min_sizes'][m]['min_width_mm'] for m in wm[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'mark_min_sizes_mm': {v: {m: mk[v]['min_sizes'][m]['min_width_mm'] for m in mk[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'clearspace': 'x-hoogte van de a (1 x) rondom; boven het vlaggetje ook 1 x',
  },
  'favicon': {
    'head': ['<link rel="icon" type="image/png" sizes="16x16" href="{{ \'favicon-16.png\' | asset_url }}" data-favicon="16">',
             '<link rel="icon" type="image/png" sizes="32x32" href="{{ \'favicon-32.png\' | asset_url }}" data-favicon="32">',
             '<link rel="icon" type="image/png" sizes="192x192" href="{{ \'favicon-192.png\' | asset_url }}">',
             '<link rel="apple-touch-icon" href="{{ \'apple-touch-icon.png\' | asset_url }}">'],
    'no_svg_link': 'Geen <link rel="icon" type="image/svg+xml">: browsers met SVG-favicon schalen dan één tekening voor alle maten en de 16-px-tekening wordt nooit gebruikt.',
    'cart_state': {'assets': ['favicon-cart-16.png', 'favicon-cart-32.png'], 'liquid': 'eerste stand uit cart.item_count', 'js': 'in KK.updateCartCount(count) (theme/assets/global.js, na /cart/add.js en /cart/change.js) beide hrefs wisselen; code in brand.md 12'},
  },
  'render': {'klaproos_albedo': '#AF2D03', 'finish': 'mat', 'backdrop': H['steen'], 'note': 'Ingangskleur voor de renderer zodat het belichte dakvlak als Klaproos uit de render komt (gemeten, brand.md 8.2).'},
}
os.makedirs(OUT, exist_ok=True)
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w'), indent=2, ensure_ascii=False)
json.dump({'rows': rows, 'info_rows': info_rows, 'forbidden': forb, 'separation': separation, 'surfaces': surfaces, 'scheme_checks': scheme_checks}, open(os.path.join(OUT, 'tools', '_contrast.json'), 'w'), indent=1, ensure_ascii=False)
print('pairs', len(rows), 'fails', len(bad), [(b['fg'], b['bg'], b['ratio']) for b in bad])
print('scheme checks', len(scheme_checks), 'fails', [(c['scheme'], c['state'], c['label_ratio'], c['shape_ratio']) for c in bad_s])
print('hover', {k: v['hover_change'] for k, v in SCHEMES.items()})
print('surfaces', surfaces)
