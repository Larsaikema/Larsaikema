"""Write brand/tokens.json (v5) and the WCAG tables (brand/tools/_contrast.json).

    python3 tokens.py <brand-dir>      (needs <brand-dir>/tools/_repro.json and tools/logo-meta.json)
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contrast import cr
from color3 import lab65, de2000, lab_hue

OUT = sys.argv[1]
REPRO = json.load(open(os.path.join(OUT, 'tools', '_repro.json')))
META = json.load(open(os.path.join(OUT, 'tools', 'logo-meta.json')))

# name: (hex, role family, role) -- every colour has ONE role family. v5: 14 colours (v4 + Polder donker).
COL = {
  'klaproos':        ('#C83812', 'merk & kopen', 'Het merkrood, alleen als vlak: de tent in het logo, het Klaproos-dakdoek en de primaire knop (In mijn winkelwagen, Afrekenen). Eén gevulde Klaproos-knop per kolom; nooit op productkaarten in een raster (daar is de Klaproos-tent zelf het rood). Als tekst alleen koppen ≥ 24 px op Zand of Wit.'),
  'klaproos-donker': ('#982A0E', 'merk & kopen', 'Hover van de primaire knop (de knop blijft rood als je erop wijst) en, met een inzet-schaduw, de ingedrukte stand.'),
  'zon':             ('#FFC23A', 'voordeel & accent', 'Actie-badge en actieprijs-label (altijd met Inkt-tekst), de tent van het logo op Polder en Inkt, de vlaggenlijn op Inkt. Nooit tekst op licht, nooit een melding of stip.'),
  'polder':          ('#154F3E', 'vertrouwen & klaar', 'Donkere vlakken (utility-balk, footer), de Zakelijk-knop, en alles wat ‘klaar’ betekent: Op voorraad (stip), Toegevoegd (knop), succesmelding, de winkelwagen-stip in het favicon.'),
  'polder-donker':   ('#0E3A2D', 'vertrouwen & klaar', 'Alleen hover en ingedrukt van de Polder-knop (Klapklaar Zakelijk).'),
  'inkt':            ('#1D2420', 'tekst', 'Tekst, koppen, links (onderstreept), omlijnde knop, focusring op licht, badge Met jouw logo.'),
  'kiezel':          ('#5D625C', 'tekst', 'Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs), randen van invoervelden, uitgeschakelde knop (stippelrand + label).'),
  'zand':            ('#FBF6EC', 'vlak', 'Paginaachtergrond; tekst, knop en focusring op Polder en Inkt.'),
  'duin':            ('#F2E8D5', 'vlak', 'Warm vlak: heroband, chips, geneste kaarten.'),
  'steen':           ('#EFEDE8', 'vlak', 'Koel, rustig vlak: achtergrond van elke productrender en van Klapklaar Zakelijk, staffel- en specificatietabellen. Staat altijd in een Wit kaart of heeft een 1 px Lijn-rand (ligt te dicht bij Zand om los te staan).'),
  'wit':             ('#FFFFFF', 'vlak', 'Productkaarten, invoervelden, drawers en meldingen; label op Klaproos- en Polder-knoppen.'),
  'lijn':            ('#E4D6BE', 'vlak', 'Scheidingslijnen, de 1 px rand om kaarten, beeldvlakken en meldingen (draagt geen informatie).'),
  'bordeaux':        ('#8A1538', 'fout', 'Fouten: kop, icoon en 4 px linkerrand van een foutmelding, tekst en rand van een veld met fout. Nooit een gevuld vlak, nooit een knop.'),
  'oker':            ('#865800', 'wachten', 'Levertijd en let-op: ‘Leverbaar over 2–3 weken’ (tekst + halve stip), kop, icoon en linkerrand van een let-op-melding.'),
}
H = {k: v[0] for k, v in COL.items()}

def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % tuple(round(x + (y - x) * t) for x, y in zip(a, b))
# hover of the outline button on light schemes: the scheme background with 8% Inkt (CSS: color-mix(in srgb, bg, #1D2420 8%))
TINT = {bg: mix(H[bg], H['inkt'], 0.08) for bg in ('zand', 'wit', 'duin', 'steen')}
for bg, hx_ in TINT.items(): H[f'tint-{bg}'] = hx_

# text/background pairs the system uses (fg, bg, use, kind)  kind: text (4.5) | large (>= 24 px bold, 3.0) | ui (3.0)
PAIRS = [
  ('inkt', 'zand', 'Lopende tekst op pagina', 'text'), ('inkt', 'duin', 'Tekst op heroband en chips', 'text'),
  ('inkt', 'wit', 'Tekst op kaarten, velden, meldingen', 'text'), ('inkt', 'steen', 'Zakelijk-blokken, tabellen, badges op het beeldvlak', 'text'),
  ('inkt', 'zon', 'Actie-badge en actieprijs-label', 'text'), ('inkt', 'lijn', 'Tekst op een Lijn-chip of scheiding', 'text'),
  ('kiezel', 'zand', 'Specs, btw-regel', 'text'), ('kiezel', 'duin', 'Specs op Duin', 'text'), ('kiezel', 'wit', 'Specs op kaart, van-prijs', 'text'),
  ('kiezel', 'steen', 'Specs in Zakelijk, bijschrift op beeldvlak', 'text'),
  ('polder', 'zand', 'Op voorraad, links in Zakelijk', 'text'), ('polder', 'wit', 'Op voorraad op kaart, succesmelding (kop)', 'text'), ('polder', 'duin', 'Op voorraad op Duin', 'text'),
  ('polder', 'steen', 'Zakelijk-koppen, badge Staffelprijs', 'text'),
  ('bordeaux', 'wit', 'Foutmelding (kop), veldfout onder invoerveld', 'text'), ('bordeaux', 'zand', 'Veldfout op pagina', 'text'), ('bordeaux', 'steen', 'Veldfout in Zakelijk-formulier', 'text'),
  ('oker', 'zand', 'Leverbaar over 2–3 weken', 'text'), ('oker', 'wit', 'Levertijd op kaart, let-op-melding (kop)', 'text'), ('oker', 'duin', 'Levertijd op Duin', 'text'), ('oker', 'steen', 'Levertijd in Zakelijk', 'text'),
  ('wit', 'klaproos', 'Primaire knop', 'text'), ('wit', 'klaproos-donker', 'Primaire knop: hover en ingedrukt', 'text'),
  ('zand', 'polder', 'Zakelijk-knop, Toegevoegd, footer, utility-balk, badge Nieuw', 'text'), ('wit', 'polder', 'Polder-knop met wit label', 'text'),
  ('zand', 'polder-donker', 'Zakelijk-knop: hover en ingedrukt', 'text'),
  ('inkt', 'tint-zand', 'Omlijnde knop, hover op pagina', 'text'), ('inkt', 'tint-wit', 'Omlijnde knop, hover op kaart', 'text'),
  ('inkt', 'tint-duin', 'Omlijnde knop, hover op Duin', 'text'), ('inkt', 'tint-steen', 'Omlijnde knop, hover in Zakelijk', 'text'),
  ('zand', 'inkt', 'Badge Met jouw logo, donkere banden', 'text'), ('inkt', 'zand', 'Zand-knop op Polder en Inkt (Inkt label)', 'text'),
  ('zon', 'inkt', 'Actie en logo-tent op Inkt', 'text'), ('zon', 'polder', 'Actie en logo-tent op Polder', 'text'),
  ('klaproos', 'zand', 'Display-kop op pagina (≥ 24 px vet)', 'large'), ('klaproos', 'wit', 'Display-kop op kaart (≥ 24 px vet)', 'large'),
  # non-text UI (3:1)
  ('kiezel', 'wit', 'Rand invoerveld, stippelrand uitgeschakelde knop', 'ui'), ('kiezel', 'zand', 'Rand invoerveld op pagina', 'ui'), ('kiezel', 'duin', 'Rand invoerveld / uitgeschakeld op Duin', 'ui'), ('kiezel', 'steen', 'Rand invoerveld in Zakelijk', 'ui'),
  ('klaproos', 'zand', 'Primaire knop tegen pagina', 'ui'), ('klaproos', 'duin', 'Primaire knop tegen Duin', 'ui'), ('klaproos', 'wit', 'Primaire knop tegen kaart', 'ui'),
  ('klaproos', 'inkt', 'Primaire knop op Inkt-vlak', 'ui'),
  ('klaproos-donker', 'zand', 'Primaire knop hover tegen pagina', 'ui'), ('klaproos-donker', 'wit', 'Primaire knop hover tegen kaart', 'ui'), ('klaproos-donker', 'duin', 'Primaire knop hover tegen Duin', 'ui'),
  ('inkt', 'zand', 'Omlijnde knop, focusring op licht', 'ui'), ('inkt', 'wit', 'Focusring op kaart', 'ui'), ('inkt', 'duin', 'Focusring op Duin', 'ui'), ('inkt', 'steen', 'Focusring, omlijnde knop in Zakelijk', 'ui'),
  ('polder', 'zand', 'Toegevoegd tegen pagina', 'ui'), ('polder', 'wit', 'Toegevoegd tegen kaart, voorraadstip', 'ui'), ('polder', 'steen', 'Zakelijk-knop tegen Steen', 'ui'),
  ('polder-donker', 'steen', 'Zakelijk-knop hover tegen Steen', 'ui'),
  ('zand', 'polder', 'Focusring, Zand-knop en hover-rand op Polder', 'ui'), ('zand', 'inkt', 'Focusring en hover-rand op Inkt', 'ui'),
  ('bordeaux', 'wit', 'Linkerrand + icoon foutmelding, rand veld met fout', 'ui'),
  ('oker', 'wit', 'Linkerrand + icoon let-op, halve stip levertijd', 'ui'), ('oker', 'zand', 'Halve stip levertijd op pagina', 'ui'),
  ('zand', 'klaproos', 'Logo in Zand op Klaproos-doek of -vlak (grafisch)', 'ui'),
  ('polder', 'klaproos', 'Winkelwagen-stip in het favicon (met 1,5 px Zand-ring)', 'ui-info'),
]
FORBIDDEN = [('zon', 'zand', 'Zon als tekst of rand op licht'), ('zon', 'wit', 'Zon als tekst of rand op wit'),
             ('klaproos', 'duin', 'Klaproos als tekst op Duin (ook niet als kop)'), ('klaproos', 'steen', 'Klaproos als tekst op Steen'),
             ('klaproos', 'inkt', 'Klaproos-tekst op Inkt'), ('klaproos', 'polder', 'Klaproos op Polder (ook als knop of tent)'),
             ('kiezel', 'inkt', 'Kiezel op donker'), ('kiezel', 'polder', 'Kiezel op Polder'), ('polder', 'inkt', 'Polder op Inkt (knop verdwijnt)'),
             ('wit', 'bordeaux', 'Bordeaux als gevuld vlak (fout is nooit een knop)'), ('zon', 'klaproos', 'Zon-tent op Klaproos (logo op Klaproos is één kleur Zand)'),
             ('klaproos-donker', 'inkt', 'Klaproos donker als hover op Inkt (vorm verdwijnt: daar hover = Zand-rand)'),
             ('polder', 'polder-donker', 'Polder donker als vlak naast Polder (alleen als knopstand)')]

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
  'klaproos_vs_hover': {'de2000': sep('klaproos', 'klaproos-donker'), 'contrast': round(cr(H['klaproos'], H['klaproos-donker']), 2)},
  'klaproos_vs_zon': {'de2000': sep('klaproos', 'zon')},
}
SURF = ['zand', 'duin', 'steen', 'wit']
surfaces = {f'{a}–{b}': {'de2000': sep(a, b), 'contrast': round(cr(H[a], H[b]), 2)} for i, a in enumerate(SURF) for b in SURF[i + 1:]}

# ---------------------------------------------------------------- colour schemes with explicit states
# v5: hover keeps the button's identity. The primary button stays red (Klaproos donker) when you point at it; the
# outline button gets a light tint, never a dark fill, so the two never look alike (v4: both turned Inkt).
for d in ('polder', 'inkt'): H[f'tintd-{d}'] = mix(H[d], H['zand'], 0.12)   # outline-button hover on dark schemes
def btn(bg, label, border=None, inset=False):
    b = {'bg': bg, 'label': label, 'border': border or bg}
    if inset: b['inset'] = 'inset 0 2px 0 rgba(0,0,0,.28)'
    return b
def light(bgname):
    return {'primary': btn('klaproos', 'wit'), 'primary_hover': btn('klaproos-donker', 'wit'), 'primary_active': btn('klaproos-donker', 'wit', inset=True),
            'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn(f'tint-{bgname}', 'inkt', 'inkt')}
SCHEMES = {
  'scheme-1': {'naam': 'Pagina', 'background': 'zand', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', **light('zand')},
  'scheme-2': {'naam': 'Kaart', 'background': 'wit', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', **light('wit')},
  'scheme-3': {'naam': 'Duin', 'background': 'duin', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt', **light('duin')},
  'scheme-4': {'naam': 'Zakelijk (Steen)', 'background': 'steen', 'text': 'inkt', 'muted': 'kiezel', 'focus': 'inkt',
               'primary': btn('polder', 'zand'), 'primary_hover': btn('polder-donker', 'zand'), 'primary_active': btn('polder-donker', 'zand', inset=True),
               'secondary': btn('transparent', 'inkt', 'inkt'), 'secondary_hover': btn('tint-steen', 'inkt', 'inkt')},
  'scheme-5': {'naam': 'Polder', 'background': 'polder', 'text': 'zand', 'muted': 'zand', 'focus': 'zand',
               'primary': btn('zand', 'inkt'), 'primary_hover': btn('zon', 'inkt'), 'primary_active': btn('zon', 'inkt', inset=True),
               'secondary': btn('transparent', 'zand', 'zand'), 'secondary_hover': btn('tintd-polder', 'zand', 'zand')},
  'scheme-6': {'naam': 'Inkt', 'background': 'inkt', 'text': 'zand', 'muted': 'zand', 'focus': 'zand',
               'primary': btn('klaproos', 'wit'), 'primary_hover': btn('klaproos', 'wit', 'zand'), 'primary_active': btn('klaproos-donker', 'wit', 'zand', inset=True),
               'secondary': btn('transparent', 'zand', 'zand'), 'secondary_hover': btn('tintd-inkt', 'zand', 'zand')},
}
def hx(n, bgname): return H[bgname] if n == 'transparent' else H[n]
scheme_checks = []
for sid, s_ in SCHEMES.items():
    bgn = s_['background']
    for state in ('primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover'):
        b = s_[state]
        fill = hx(b['bg'], bgn); edge = hx(b['border'], bgn)
        lab = cr(H[b['label']], fill)
        shape = max(cr(fill, H[bgn]), cr(edge, H[bgn]))
        scheme_checks.append({'scheme': sid, 'state': state, 'label_ratio': round(lab, 2), 'shape_ratio': round(shape, 2),
                              'pass': lab >= 4.5 and shape >= 3.0})
    rest, hov, sec, sech = s_['primary'], s_['primary_hover'], s_['secondary'], s_['secondary_hover']
    look = lambda b: (hx(b['bg'], bgn), hx(b['border'], bgn), b['label'])
    # the two buttons must never look alike in any pair of states the user can see at the same time
    distinct = len({look(rest), look(hov), look(sec), look(sech)}) == 4
    how = ('rand erbij' if rest['bg'] == hov['bg'] else 'donkerder, zelfde kleur' if hov['bg'].startswith(rest['bg']) else 'andere vulling')
    s_['hover_change'] = {'fill_rest_vs_hover': round(cr(hx(rest['bg'], bgn), hx(hov['bg'], bgn)), 2), 'how': how,
                          'secondary_hover': 'lichte tint + rand (nooit een donkere vulling)', 'all_four_states_distinct': distinct}
    s_['text_ratio'] = round(cr(H[s_['text']], H[bgn]), 2)
bad_s = [c for c in scheme_checks if not c['pass']] + [{'scheme': k, 'state': 'distinct', 'label_ratio': 0, 'shape_ratio': 0} for k, v in SCHEMES.items() if not v['hover_change']['all_four_states_distinct']]

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
GR = META['grouping']
# header sizes (px): chosen so the x-height of the logo is >= 20 px on desktop and >= 12 px on mobile
WU = {'primary': wm['primary']['width_units'], 'klein': wm['klein']['width_units']}
HU = {'primary': wm['primary']['height_units'], 'klein': wm['klein']['height_units']}
HEADER = {'desktop_px': 200, 'mobile_px': 124}
xh = lambda w, v: f'{w * 500 / WU[v]:.1f}'.replace('.', ',')
hh = lambda w, v: f'{w * HU[v] / WU[v]:.0f}'
tokens = {
  '$schema_note': 'Klapklaar design tokens v5 (2026-10-17). 14 kleuren met één rol, kleurschema’s met rust/hover/ingedrukt/focus per schema, reproductiereferenties, Shopify font_picker-handles + fallbacks, radii, spacing, randen, schaduwen, motion, componentstaten, logo- en faviconregels. Uitleg: brand.md; maten en bronnen: technisch.md.',
  'color': {k: {'value': v[0], 'family': v[1], 'role': v[2]} for k, v in COL.items()},
  'color_derived': {**{f'tint-{bg}': {'value': TINT[bg], 'css': f'color-mix(in srgb, var(--color-{bg}) 92%, var(--color-inkt))', 'role': f'hover van de omlijnde knop op {bg}'} for bg in TINT},
                    **{f'tintd-{d}': {'value': H[f'tintd-{d}'], 'css': f'color-mix(in srgb, var(--color-{d}) 88%, var(--color-zand))', 'role': f'hover van de omlijnde knop op {d}'} for d in ('polder', 'inkt')}},
  'color_changes_v5': {'klaproos-donker': 'was alleen ingedrukt; nu ook hover (v4 maakte de primaire knop bij hover Inkt, gelijk aan de omlijnde knop bij hover)',
                       'polder-donker #0E3A2D': 'nieuw: hover en ingedrukt van de Zakelijk-knop',
                       'zon': 'rol ‘vlag & voordeel’ wordt ‘voordeel & accent’: het vlaggetje is uit het logo, Zon is ook hover van de Zand-knop op Polder',
                       'tint-*': 'nieuw, afgeleid: lichte hover van de omlijnde knop (8% Inkt over de achtergrond)'},
  'color_semantic': {
    'background': 'zand', 'surface': 'wit', 'surface-warm': 'duin', 'surface-cool': 'steen', 'media': 'steen', 'surface-zakelijk': 'steen',
    'text': 'inkt', 'text-muted': 'kiezel', 'text-on-dark': 'zand', 'link': 'inkt', 'link-hover': 'inkt (onderstreping 3 px)',
    'price': 'inkt', 'price-compare': 'kiezel', 'price-sale-bg': 'zon', 'price-sale-text': 'inkt',
    'badge-actie': ['zon', 'inkt'], 'badge-nieuw': ['polder', 'zand'], 'badge-logo': ['inkt', 'zand', 'icoon logo-uploaden'], 'badge-staffel': ['steen', 'polder'],
    'stock-in': 'polder (volle stip + tekst)', 'stock-later': 'oker (halve stip + tekst)', 'stock-out': 'kiezel (open ring + tekst)',
    'error': 'bordeaux', 'notice': 'oker', 'success': 'polder', 'alert-surface': 'wit', 'alert-border': 'lijn',
    'card': 'wit', 'card-border': 'lijn', 'media-in-card': 'steen', 'media-border': 'lijn (als het beeldvlak niet in een Wit kaart staat)',
    'focus-on-light': 'inkt', 'focus-on-dark': 'zand', 'border-input': 'kiezel', 'divider': 'lijn',
    'header-utility-bg': 'polder', 'footer-bg': 'polder', 'footer-text': 'zand', 'favicon-cart-dot': 'polder',
  },
  'surface_rule': 'Steen (beeldvlak, Zakelijk) ligt ΔE00 3,0 van Zand. Standaard staat een Steen-vlak daarom in een Wit kaart met een 1 px Lijn-rand (product-card), of loopt het als band over de volle breedte. Een los Steen-vlak op Zand krijgt altijd border.media. Dit is de default in de tokens, geen advies.',
  'color_separation': separation,
  'surface_separation_de2000': surfaces,
  'color_schemes': SCHEMES,
  'color_scheme_checks': {'rows': scheme_checks, 'fails': len(bad_s),
                          'rule': 'Elke knopstand: label ≥ 4,5:1 op zijn vulling en vorm (vulling of rand) ≥ 3:1 tegen de schemaachtergrond. Hover houdt de identiteit van de knop: de primaire knop blijft rood (Klaproos donker), de omlijnde knop krijgt een lichte tint. Rust en hover van beide knoppen zijn alle vier verschillend.'},
  'shopify_color_schemes': {sid: {'background': H[s['background']], 'text': H[s['text']],
                                  'button': H[s['primary']['bg']], 'button_label': H[s['primary']['label']],
                                  'button_hover': H[s['primary_hover']['bg']], 'button_hover_label': H[s['primary_hover']['label']], 'button_hover_border': H[s['primary_hover']['border']],
                                  'button_active_shadow': s['primary_active'].get('inset', 'none'),
                                  'secondary_button_label': H[s['secondary']['label']], 'secondary_button_border': H[s['secondary']['border']],
                                  'secondary_button_hover_bg': H[s['secondary_hover']['bg']],
                                  'border': H['kiezel'] if s['background'] not in ('polder', 'inkt') else H['zand']}
                            for sid, s in SCHEMES.items()},
  'print': {
    'note': 'Reproductiereferenties per kleur. Digitale dichtstbijzijnde stockkleur (CIEDE2000) uit open datasets; CMYK via Adobe Coated FOGRA39 / Uncoated FOGRA29 (relatief colorimetrisch + zwartpuntcompensatie). Vóór productie fysiek aftekenen (technisch.md 4).',
    'tolerance_de2000': {'drukwerk_gestreken': 2.0, 'textiel_en_folie': 3.0},
    'multi_colour_rule': f'Op doek, folie en papier raken twee kleuren elkaar nooit: letters en tent liggen minstens {round(GR["v5"]["leg_letter_min"])} eenheden uit elkaar (logo.svg). Er is dus geen overlap en geen trap nodig.',
    'colors': {k: ref(k) for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand')},
    'sources': REPRO['sources'],
  },
  'font': {
    'family': 'Figtree (één familie, vier gewichten)',
    'why': 'Bewuste keuze: Figtree is een van de gangbaarste gratis sans-serifs in Shopify. Het onderscheid zit in het getekende woordmerk, de tent en de kleuren; de letter moet vooral prijzen, maten en specs rustig en leesbaar zetten (echte tabelcijfers, gewone nul voor Ø 80 cm). Een opvallende tweede letter zou met het woordmerk concurreren.',
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
      'status': 'waarschijnlijk: Shopify maakt /cdn/fonts/<familie>/<handle>-paden alleen voor fonts uit zijn bibliotheek; de officiële lijst (shopify.dev) kon niet worden gelezen. Controle: kies Figtree ExtraBold in de theme-editor.',
    },
    'opentype': {'tnum': 'aanwezig in Figtree[wght].ttf (GSUB tnum, pnum, case, frac); of de door Shopify geserveerde woff2 dezelfde features houdt is niet gecontroleerd: test font-variant-numeric in de theme-preview'},
    'self_host_fallback': 'brand/fonts/Figtree-VF.ttf (SIL OFL 1.1) als theme-asset met @font-face en font-display: swap, alleen als de handle in de theme-editor ontbreekt',
    'numeric': {'font-variant-numeric': 'tabular-nums', 'apply_to': ['prijzen', 'maten', 'aantallen', 'staffeltabellen', 'ordernummers', 'levertijden']},
    'logo_rule': 'Het woordmerk heeft een eigen eenverdiepings-a. Tekst direct bij het logo (descriptor, ZAKELIJK) is altijd in kapitalen.',
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
  'border': {'hairline': '1px solid #E4D6BE', 'card': '1px solid #E4D6BE', 'media': '1px solid #E4D6BE',
             'input': '1.5px solid #5D625C', 'input-focus': '2px solid #1D2420', 'error': '2px solid #8A1538',
             'button-outline': '2px solid currentColor', 'alert': '1px solid #E4D6BE + 4px linkerrand in de statuskleur', 'disabled': '2px dashed #5D625C'},
  'shadow': {
    'none': 'none',
    'card-hover': '0 1px 2px rgba(29,36,32,.06), 0 10px 24px -14px rgba(29,36,32,.22)',
    'sticky': '0 1px 0 rgba(29,36,32,.08), 0 6px 16px -10px rgba(29,36,32,.20)',
    'drawer': '0 24px 64px -24px rgba(29,36,32,.38)',
    'toast': '0 12px 32px -12px rgba(29,36,32,.35)',
    'button-pressed': 'inset 0 2px 0 rgba(0,0,0,.28)',
  },
  'focus': {'outline': '3px solid var(--focus)', 'offset': '2px', 'on_light': H['inkt'], 'on_dark': H['zand']},
  'components': {
    'button-primary': {'default': 'zie color_schemes (Klaproos met Wit op licht)', 'hover': 'Klaproos donker #982A0E met Wit (de knop blijft rood); op Inkt: Klaproos + 2 px Zand-rand',
                       'active': 'Klaproos donker + shadow.button-pressed + translateY(1px)',
                       'focus-visible': {'outline': '3px focuskleur van het schema, offset 2px'},
                       'disabled': {'bg': 'transparent', 'border': '2px dashed kiezel (licht) / zand (donker)', 'label': 'kiezel (licht) / zand (donker)', 'aria': 'aria-disabled="true"'},
                       'busy': {'label': 'Toevoegen…', 'fill': 'ongewijzigd'},
                       'done': {'bg': 'polder', 'label': 'zand', 'text': 'Toegevoegd', 'icon': 'vinkje', 'duration_ms': 1500, 'then': 'terug naar default'}},
    'button-secondary': {'default': 'transparant, 2 px rand en label Inkt (licht) / Zand (donker)', 'hover': 'lichte tint (tint-<achtergrond>) + dezelfde rand: nooit een donkere vulling', 'active': 'tint + shadow.button-pressed'},
    'add-to-cart': {'label': 'In mijn winkelwagen · {regeltotaal}', 'label_variant_missing': 'Kies je maat', 'label_soldout': 'Uitverkocht',
                    'quantity': 'stepper − / + (44 px), totaal live in het label, tabular-nums',
                    'toast': {'title': 'Staat in je winkelwagen.', 'body': '{producttitel}, {variant}, {aantal} ×', 'actions': ['Naar winkelwagen', 'Verder winkelen'], 'grammar': 'nooit ‘hij/het staat erin’: noem het product of zeg ‘Staat in je winkelwagen.’ (werkt voor de- én het-woorden)'}},
    'product-card': {'card': 'Wit, border.card, radius.card', 'media': 'Steen binnen de kaart (nooit een los Steen-vlak op Zand)', 'quick_add': 'omlijnde Inkt-knop of icoonknop (+), hover tint-wit',
                     'filled_klaproos_button': 'nooit: het product (vaak een Klaproos-tent) is het rood',
                     'spec_line': 'kiezel, 1 regel', 'price': 'inkt tabular'},
    'price-sale': {'shape': 'Zon-label met inkeping rechts, Inkt-tekst, tabular', 'compare': 'Kiezel, doorgestreept'},
    'stock': {'in': {'text': 'Op voorraad', 'color': 'polder', 'marker': 'volle stip polder'},
              'later': {'text': 'Leverbaar over 2–3 weken', 'color': 'oker', 'marker': 'halve stip oker'},
              'out': {'text': 'Tijdelijk uitverkocht', 'color': 'kiezel', 'marker': 'open ring kiezel'}},
    'alert': {'surface': 'wit', 'border': '1px lijn', 'accent': '4px linkerrand', 'error': 'bordeaux', 'notice': 'oker', 'success': 'polder',
              'parts': 'icoon + vetgedrukte kop in de statuskleur, uitleg in Inkt'},
    'trust': {'slots': ['betaalmethoden (Shopify payment_type_svg_tag, alleen ingeschakelde)', 'bel/app ons + openingstijden [claim]', 'KvK- en btw-nummer [claim]',
                        'Thuiswinkel Waarborg (alleen met lidmaatschap) [claim]', 'reviewscore (alleen via review-app met echte data; anders niets)', 'herroepingsrecht 14 dagen, niet voor bedrukt maatwerk [claim]'],
              'style': 'Inkt-iconen 24 px + label, rustig op Steen of in de footer op Polder; geen badges of sterren zonder bron'},
    'bunting': {'light': 'svg/vlaggenlijn.svg (één kleur Klaproos, twee lengtes)', 'on_inkt': 'svg/vlaggenlijn-inkt.svg (Klaproos, Zon, Zand)',
                'never': ['op Polder', 'met Polder erin (rood-geel-groen leest als een landsvlag)', 'in Zakelijk, offerte, checkout of bij een fout']},
  },
  'motion': {
    'duration': {'instant': 80, 'fast': 140, 'base': 220, 'slow': 320},
    'easing': {'standard': 'cubic-bezier(.2,0,0,1)', 'uitklap (enter)': 'cubic-bezier(.16,1,.3,1)', 'inklap (exit)': 'cubic-bezier(.4,0,1,1)'},
    'patterns': {'drawer/accordion': 'uitklappen: height/transform 220 ms uitklap, geen bounce',
                 'add-to-cart': 'label → "Toevoegen…" → Polder + vinkje + "Toegevoegd" (140 ms), na 1,5 s terug; toast "Staat in je winkelwagen." 220 ms van rechtsonder',
                 'hover kaart': 'schaduw card-hover 140 ms; beeld schaal max 1,02',
                 'hover knop': 'vulling/rand volgens het schema in 140 ms (standard); ingedrukt: inzet-schaduw + 1 px omlaag'},
    'reduced_motion': 'prefers-reduced-motion: alle transform-animaties uit, alleen opacity ≤ 140 ms',
  },
  'icon': {'grid': 24, 'stroke': 2, 'stroke_small': 1.75, 'linecap': 'butt', 'linejoin': 'round', 'corner_radius': 2, 'color': 'currentColor', 'accent': 'geen: iconen zijn altijd één kleur (currentColor)'},
  'logo': {
    'construction': {'x_height': 500, 'stok': 130, 'dun': 65, 'pitch_deg': 24, 'roof_sag_k': 0.10, 'descender': -165,
                     'leg_gap_vs_letter_gap': GR['v5']['ratio'], 'leg_gap_vs_letter_gap_v4': GR['v4']['ratio'], 'min_tip_deg': wm['primary']['corners']['min_tip_deg']},
    'files': {'primary': 'logo.svg', 'inverse': 'logo-inverse.svg', 'inline_theme': 'svg/logo-inline.svg', 'klein': 'svg/logo-klein.svg', 'klein_inline_theme': 'svg/logo-klein-inline.svg',
              'on_klaproos': 'svg/logo-on-klaproos.svg', 'mono': 'svg/logo-mono.svg', 'luifel': 'svg/logo-luifel.svg', 'zakelijk': 'svg/logo-zakelijk.svg',
              'mark': 'mark.svg', 'mark_klein': 'svg/mark-klein.svg', 'print': ['svg/print-wordmark.svg', 'svg/print-wordmark-klein.svg', 'svg/print-mark.svg', 'svg/print-mark-klein.svg'],
              'favicon_32': 'favicon.svg', 'favicon_16': 'svg/favicon-16.svg'},
    'switch_screen_px': {'logo.svg': f'≥ {SW("primary")} px breed', 'svg/logo-klein.svg': f'{SW("klein")}–{SW("primary") - 1} px', 'mark.svg': f'≥ {mk["primary"]["min_sizes"]["scherm"]["min_width_px"]} px (symboolbreedte)', 'favicon': '16 / 32 px eigen tekening'},
    'header': {'desktop': f'svg/logo-inline.svg inline, {HEADER["desktop_px"]} px breed ({hh(HEADER["desktop_px"], "primary")} px hoog, x-hoogte {xh(HEADER["desktop_px"], "primary")} px)',
               'mobile_390': f'svg/logo-klein-inline.svg inline, {HEADER["mobile_px"]} px breed ({hh(HEADER["mobile_px"], "klein")} px hoog, x-hoogte {xh(HEADER["mobile_px"], "klein")} px)',
               'css': 'handoff/logo.liquid: letters fill=currentColor, tent class="logo-svg__roof" met fill: var(--logo-roof, var(--c-klaproos)); de bronbestanden svg/logo-inline.svg gebruiken class="kk-tent"', 'tent_colour': {'scheme-1..3': 'klaproos', 'scheme-4 (Zakelijk)': 'polder', 'scheme-5/6': 'zon'}},
    'min_sizes_mm': {v: {m: wm[v]['min_sizes'][m]['min_width_mm'] for m in wm[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'mark_min_sizes_mm': {v: {m: mk[v]['min_sizes'][m]['min_width_mm'] for m in mk[v]['min_sizes'] if m != 'scherm'} for v in ('primary', 'klein')},
    'clearspace': 'x-hoogte van de a (1 x) rondom, gemeten vanaf de buitenkant van letters en tent',
  },
  'favicon': {
    'theme_assets': {'favicon-16.png': 'brand/img/favicon-16.png', 'favicon-32.png': 'brand/favicon-32.png', 'favicon-192.png': 'brand/favicon-192.png',
                     'apple-touch-icon-180.png': 'brand/img/apple-touch-icon-180.png', 'favicon-cart-16.png': 'brand/img/favicon-cart-16.png', 'favicon-cart-32.png': 'brand/img/favicon-cart-32.png'},
    'head': ['<link rel="icon" type="image/png" sizes="16x16" href="{{ \'favicon-16.png\' | asset_url }}" data-favicon="16">',
             '<link rel="icon" type="image/png" sizes="32x32" href="{{ \'favicon-32.png\' | asset_url }}" data-favicon="32">',
             '<link rel="icon" type="image/png" sizes="192x192" href="{{ \'favicon-192.png\' | asset_url }}">',
             '<link rel="apple-touch-icon" href="{{ \'apple-touch-icon-180.png\' | asset_url }}">'],
    'no_svg_link': 'Geen <link rel="icon" type="image/svg+xml"> en geen favicon.svg / favicon-cart.svg in de theme: browsers met SVG-favicon schalen dan één tekening voor alle maten en de 16-px-tekening wordt nooit gebruikt.',
    'cart_state': {'assets': ['favicon-cart-16.png', 'favicon-cart-32.png'], 'liquid': 'eerste stand uit cart.item_count', 'js': 'in KK.updateCartCount(count) beide hrefs wisselen; code in technisch.md 6'},
  },
  'render': {'klaproos_albedo': '#AF2D03', 'finish': 'mat', 'backdrop': H['steen'], 'note': 'Ingangskleur voor de renderer zodat het belichte dakvlak als Klaproos uit de render komt (gemeten, technisch.md 5).'},
}
os.makedirs(OUT, exist_ok=True)
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w'), indent=2, ensure_ascii=False)
json.dump({'rows': rows, 'info_rows': info_rows, 'forbidden': forb, 'separation': separation, 'surfaces': surfaces, 'scheme_checks': scheme_checks}, open(os.path.join(OUT, 'tools', '_contrast.json'), 'w'), indent=1, ensure_ascii=False)
print('pairs', len(rows), 'fails', len(bad), [(b['fg'], b['bg'], b['ratio']) for b in bad])
print('scheme checks', len(scheme_checks), 'fails', [(c['scheme'], c['state'], c['label_ratio'], c['shape_ratio']) for c in bad_s])
print('hover', {k: v['hover_change'] for k, v in SCHEMES.items()})
print('tints', TINT, H['tintd-polder'], H['tintd-inkt'])
print('surfaces', surfaces)
