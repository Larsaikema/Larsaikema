"""Write brand/tokens.json and the WCAG pair table (brand/tools/_contrast.json + markdown on stdout)."""
import json, sys, os
from contrast import cr

OUT = sys.argv[1]
COL = {
  # brand
  'klaproos':        ('#BE3A1D', 'Merkrood. Dak in het logo, primaire knop (In mijn winkelwagen), merktent (Google Shopping-standaardbeeld). Als tekst alleen voor korte nadruk; gewone links zijn Inkt.'),
  'klaproos-donker': ('#9A2F17', 'Hover/ingedrukt van de primaire knop; rode tekst op Duin/Linnen als nadruk nodig is.'),
  'zon':             ('#FFC23A', 'Accent: dak in het logo op donker, vlaggetje, Actie-badge (met Inkt-tekst), USP-vinkjes, focusring op donker. Nooit tekst of rand op lichte vlakken.'),
  'polder':          ('#154F3E', 'Donkere vlakken (utility-balk, footer), secundaire knop, Op voorraad / Toegevoegd (met icoon), Zakelijk.'),
  'inkt':            ('#1D2420', 'Tekst, koppen, outline-knoppen, links (onderstreept), focusring op licht.'),
  # neutrals
  'zand':            ('#FBF6EC', 'Paginaachtergrond (warmer dan wit, zodat witte kaarten loskomen).'),
  'duin':            ('#F2E8D5', 'Warme vlakken: heroband, chips, geneste kaarten.'),
  'linnen':          ('#ECEEE8', 'Rustig koel vlak voor Zakelijk, offerte, staffels, specificatietabellen.'),
  'studio':          ('#EFEDE8', 'Achtergrond van elke productrender en van het beeldvlak in productkaarten (naadloos).'),
  'wit':             ('#FFFFFF', 'Productkaarten, invoervelden, drawers.'),
  'kiezel':          ('#5D625C', 'Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs) en randen van invoervelden (>= 3:1).'),
  'lijn':            ('#E4D6BE', 'Decoratieve scheidingslijnen (geen informatiedragend element).'),
  # functional
  'bordeaux':        ('#8C1D2B', 'Fouten: tekst, icoon en linkerrand van foutmeldingen, veldfouten. Nooit als gevuld knopvlak.'),
  'foutroze':        ('#FBEAEA', 'Achtergrond van foutmeldingen.'),
  'oker':            ('#865800', 'Voorraadstatus "Leverbaar over 2-3 weken" (tekst), naast een Zon-stip.'),
  'okerlicht':       ('#FFF4DA', 'Achtergrond van let-op-meldingen (levertijd, drukproef nodig).'),
  'mos':             ('#E4EEE8', 'Achtergrond van succesmeldingen (Polder-tekst).'),
}
# text/background pairs the system actually uses (fg, bg, use, kind) kind: text|large|ui
PAIRS = [
  ('inkt', 'zand', 'Lopende tekst op pagina', 'text'), ('inkt', 'duin', 'Tekst op heroband/chips', 'text'),
  ('inkt', 'wit', 'Tekst op kaarten/velden', 'text'), ('inkt', 'linnen', 'Zakelijk-blokken', 'text'),
  ('inkt', 'studio', 'Tekst op beeldvlak (badges)', 'text'), ('inkt', 'zon', 'Actie-badge', 'text'),
  ('inkt', 'foutroze', 'Uitleg in foutmelding', 'text'), ('inkt', 'okerlicht', 'Uitleg in let-op-melding', 'text'), ('inkt', 'mos', 'Uitleg in succesmelding', 'text'),
  ('kiezel', 'zand', 'Specs, btw-regel', 'text'), ('kiezel', 'duin', 'Specs op Duin', 'text'), ('kiezel', 'wit', 'Specs op kaart, van-prijs', 'text'), ('kiezel', 'linnen', 'Specs in Zakelijk', 'text'),
  ('polder', 'zand', 'Op voorraad, links in Zakelijk', 'text'), ('polder', 'wit', 'Op voorraad op kaart', 'text'), ('polder', 'duin', 'Op voorraad op Duin', 'text'), ('polder', 'linnen', 'Zakelijk-koppen', 'text'), ('polder', 'mos', 'Succesmelding', 'text'),
  ('klaproos', 'zand', 'Korte nadruk', 'text'), ('klaproos', 'wit', 'Korte nadruk op kaart', 'text'), ('klaproos', 'duin', 'Korte nadruk op Duin', 'text'), ('klaproos', 'linnen', 'Korte nadruk op Linnen', 'text'), ('klaproos', 'studio', 'Korte nadruk op beeldvlak', 'text'),
  ('klaproos-donker', 'zand', 'Hover-tekst', 'text'), ('klaproos-donker', 'duin', 'Hover-tekst op Duin', 'text'),
  ('bordeaux', 'foutroze', 'Foutmelding (kop)', 'text'), ('bordeaux', 'wit', 'Veldfout onder invoerveld', 'text'), ('bordeaux', 'zand', 'Veldfout op pagina', 'text'),
  ('oker', 'zand', 'Leverbaar over 2-3 weken', 'text'), ('oker', 'wit', 'Leverbaar over 2-3 weken (kaart)', 'text'), ('oker', 'okerlicht', 'Let-op-melding (kop)', 'text'), ('oker', 'duin', 'Levertijd op Duin', 'text'),
  ('wit', 'klaproos', 'Primaire knop', 'text'), ('wit', 'klaproos-donker', 'Primaire knop hover', 'text'),
  ('zand', 'klaproos', 'Logo/merktekst op Klaproos', 'text'),
  ('zand', 'polder', 'Secundaire knop, footer, utility-balk', 'text'), ('wit', 'polder', 'Secundaire knop (wit)', 'text'),
  ('zand', 'inkt', 'Met jouw logo-badge, donkere banden', 'text'), ('zon', 'inkt', 'Accenttekst op Inkt', 'text'), ('zon', 'polder', 'Accenttekst/iconen op Polder', 'text'),
  # non-text UI (3:1)
  ('kiezel', 'wit', 'Rand invoerveld', 'ui'), ('kiezel', 'zand', 'Rand invoerveld op pagina', 'ui'),
  ('klaproos', 'zand', 'Knopvlak tegen pagina', 'ui'), ('klaproos', 'duin', 'Knopvlak tegen Duin', 'ui'), ('klaproos', 'wit', 'Knopvlak tegen kaart', 'ui'),
  ('polder', 'zand', 'Secundaire knop tegen pagina', 'ui'), ('inkt', 'zand', 'Focusring op licht', 'ui'), ('zon', 'polder', 'Focusring op Polder', 'ui'), ('zon', 'inkt', 'Focusring op Inkt', 'ui'),
  ('bordeaux', 'foutroze', 'Linkerrand + icoon foutmelding', 'ui'),
]
# pairs that are explicitly NOT allowed (documented so nobody tries)
FORBIDDEN = [('zon', 'zand', 'Zon als tekst/rand op licht'), ('zon', 'wit', 'Zon als tekst/rand op wit'), ('klaproos', 'inkt', 'Klaproos-tekst op Inkt'),
             ('klaproos', 'polder', 'Klaproos op Polder'), ('kiezel', 'inkt', 'Kiezel op donker')]

rows = []
for fg, bg, use, kind in PAIRS:
    r = cr(COL[fg][0], COL[bg][0])
    need = 3.0 if kind in ('ui', 'large') else 4.5
    rows.append({'fg': fg, 'bg': bg, 'fg_hex': COL[fg][0], 'bg_hex': COL[bg][0], 'use': use, 'kind': kind, 'ratio': round(r, 2),
                 'need': need, 'pass': r >= need, 'aaa': r >= (7 if kind == 'text' else 4.5)})
bad = [x for x in rows if not x['pass']]
forb = [{'fg': a, 'bg': b, 'use': u, 'ratio': round(cr(COL[a][0], COL[b][0]), 2)} for a, b, u in FORBIDDEN]

tokens = {
  '$schema_note': 'Klapklaar design tokens v2 (2026-10-17). Kleuren met rol, Shopify font_picker-handles + fallbacks, radii, spacing, schaduwen, motion. Contrast: zie brand.md.',
  'color': {k: {'value': v[0], 'role': v[1]} for k, v in COL.items()},
  'color_semantic': {
    'background': 'zand', 'surface': 'wit', 'surface-warm': 'duin', 'surface-zakelijk': 'linnen', 'media': 'studio',
    'text': 'inkt', 'text-muted': 'kiezel', 'link': 'inkt', 'link-hover': 'klaproos-donker',
    'button-primary-bg': 'klaproos', 'button-primary-text': 'wit', 'button-primary-hover': 'klaproos-donker',
    'button-secondary-bg': 'polder', 'button-secondary-text': 'zand', 'button-outline': 'inkt',
    'badge-actie-bg': 'zon', 'badge-actie-text': 'inkt', 'badge-nieuw-bg': 'polder', 'badge-nieuw-text': 'zand',
    'badge-logo-bg': 'inkt', 'badge-logo-text': 'zand', 'badge-zakelijk-bg': 'linnen', 'badge-zakelijk-text': 'polder',
    'price': 'inkt', 'price-compare': 'kiezel', 'price-sale': 'inkt',
    'stock-in': 'polder', 'stock-later': 'oker', 'stock-later-dot': 'zon', 'stock-out': 'kiezel',
    'error': 'bordeaux', 'error-surface': 'foutroze', 'success': 'polder', 'success-surface': 'mos', 'notice': 'oker', 'notice-surface': 'okerlicht',
    'focus-on-light': 'inkt', 'focus-on-dark': 'zon', 'border-input': 'kiezel', 'divider': 'lijn',
    'header-utility-bg': 'polder', 'footer-bg': 'polder', 'footer-text': 'zand',
  },
  'shopify_color_schemes': {
    'scheme-1 (pagina)':  {'background': '#FBF6EC', 'foreground': '#1D2420', 'primary_button': '#BE3A1D', 'primary_button_label': '#FFFFFF', 'secondary_button': '#154F3E', 'secondary_button_label': '#FBF6EC', 'border': '#5D625C'},
    'scheme-2 (kaart)':   {'background': '#FFFFFF', 'foreground': '#1D2420', 'primary_button': '#BE3A1D', 'primary_button_label': '#FFFFFF', 'secondary_button': '#154F3E', 'secondary_button_label': '#FBF6EC', 'border': '#5D625C'},
    'scheme-3 (duin)':    {'background': '#F2E8D5', 'foreground': '#1D2420', 'primary_button': '#BE3A1D', 'primary_button_label': '#FFFFFF', 'secondary_button': '#154F3E', 'secondary_button_label': '#FBF6EC', 'border': '#5D625C'},
    'scheme-4 (zakelijk)':{'background': '#ECEEE8', 'foreground': '#1D2420', 'primary_button': '#154F3E', 'primary_button_label': '#FBF6EC', 'secondary_button': '#1D2420', 'secondary_button_label': '#FBF6EC', 'border': '#5D625C'},
    'scheme-5 (polder)':  {'background': '#154F3E', 'foreground': '#FBF6EC', 'primary_button': '#FFC23A', 'primary_button_label': '#1D2420', 'secondary_button': '#FBF6EC', 'secondary_button_label': '#154F3E', 'border': '#FBF6EC'},
    'scheme-6 (inkt)':    {'background': '#1D2420', 'foreground': '#FBF6EC', 'primary_button': '#FFC23A', 'primary_button_label': '#1D2420', 'secondary_button': '#FBF6EC', 'secondary_button_label': '#1D2420', 'border': '#FBF6EC'},
  },
  'font': {
    'heading': {'family': 'Archivo', 'shopify_handle': 'archivo_n8', 'shopify_handle_fallback': 'archivo_n7',
                'css_fallback': '"Archivo", "Helvetica Neue", Arial, sans-serif', 'weights': {'display/h1/h2': 800, 'h3/h4/kaarttitel': 700},
                'evidence': 'archivo_n7 + archivo_n6 op Shopify font-CDN (/cdn/fonts/archivo/archivo_n7.6f363ab3...woff2); archivo_n8 als font_picker-waarde in settings_data.json. n8 op de CDN: niet bevestigd.'},
    'body': {'family': 'Figtree', 'shopify_handle': 'figtree_n4', 'variants': {'label/nav': 'figtree_n6', 'knop/prijs': 'figtree_n7'},
             'css_fallback': '"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
             'evidence': 'figtree_n4/n5/n6/n7 op Shopify font-CDN (zie brand.md). figtree_i4 niet gebruikt.'},
    'numeric': {'font-variant-numeric': 'tabular-nums', 'apply_to': ['prijzen', 'maten', 'aantallen', 'staffeltabellen', 'ordernummers', 'levertijden']},
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
  'border': {'hairline': '1px solid #E4D6BE', 'input': '1.5px solid #5D625C', 'input-focus': '2px solid #1D2420', 'error': '2px solid #8C1D2B'},
  'shadow': {
    'none': 'none',
    'card-hover': '0 1px 2px rgba(29,36,32,.06), 0 10px 24px -14px rgba(29,36,32,.22)',
    'sticky': '0 1px 0 rgba(29,36,32,.08), 0 6px 16px -10px rgba(29,36,32,.20)',
    'drawer': '0 24px 64px -24px rgba(29,36,32,.38)',
    'toast': '0 12px 32px -12px rgba(29,36,32,.35)',
  },
  'focus': {'outline': '3px solid var(--focus)', 'offset': '2px', 'on_light': '#1D2420', 'on_dark': '#FFC23A'},
  'motion': {
    'duration': {'instant': 80, 'fast': 140, 'base': 220, 'slow': 320},
    'easing': {'standard': 'cubic-bezier(.2,0,0,1)', 'uitklap (enter)': 'cubic-bezier(.16,1,.3,1)', 'inklap (exit)': 'cubic-bezier(.4,0,1,1)'},
    'patterns': {'drawer/accordion': 'uitklappen: height/transform 220ms uitklap, geen bounce',
                 'add-to-cart': 'knoplabel -> vinkje + "Erin!" 140ms, toast 220ms van rechtsonder',
                 'hover kaart': 'schaduw card-hover 140ms; beeld schaal max 1.02'},
    'reduced_motion': 'prefers-reduced-motion: alle transform-animaties uit, alleen opacity <= 140ms',
  },
  'icon': {'grid': 24, 'stroke': 2, 'stroke_small': 1.75, 'linecap': 'butt', 'linejoin': 'round', 'corner_radius': 2, 'color': 'currentColor', 'accent': 'zon (alleen vlaggetje/stip)'},
  'logo': {'min_width_px': {'logo.svg': 112, 'mark.svg': 24, 'favicon': 16}, 'clearspace': 'x-hoogte van de a (1 x) rondom; luifel-lock-up: 1 x boven het vlaggetje',
           'files': {'primary': 'logo.svg', 'inverse': 'logo-inverse.svg', 'mark': 'mark.svg', 'favicon': 'favicon.svg'}},
}
os.makedirs(OUT, exist_ok=True)
json.dump(tokens, open(os.path.join(OUT, 'tokens.json'), 'w'), indent=2, ensure_ascii=False)
os.makedirs(os.path.join(OUT, 'tools'), exist_ok=True)
json.dump({'rows': rows, 'forbidden': forb}, open(os.path.join(OUT, 'tools', '_contrast.json'), 'w'), indent=1, ensure_ascii=False)
print('pairs', len(rows), 'fails', len(bad), [ (b['fg'], b['bg'], b['ratio']) for b in bad])
print('| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | AA |')
print('|---|---|---|---:|---:|:--:|')
for x in rows:
    print(f"| {x['fg']} `{x['fg_hex']}` | {x['bg']} `{x['bg_hex']}` | {x['use']} | {x['ratio']:.2f}:1 | {x['need']:.1f} | {'ja' if x['pass'] else 'NEE'}{' (AAA)' if x['aaa'] else ''} |")
print()
for f in forb: print(f"| {f['fg']} | {f['bg']} | {f['use']} | {f['ratio']:.2f}:1 | niet toegestaan |")
