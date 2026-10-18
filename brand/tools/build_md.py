"""Fill brand.template.md and technisch.template.md with the measured tables (v7).

    python3 build_md.py <brand-dir>

Every number in the tables comes from tools/logo-meta.json, tokens.json, tools/_contrast.json, tools/_repro.json or
tools/_recognition_proxy.json, so the book cannot drift from the files.
"""
import json, os, re, sys
B = sys.argv[1]
T = os.path.join(B, 'tools')
META = json.load(open(os.path.join(T, 'logo-meta.json')))
TOK = json.load(open(os.path.join(B, 'tokens.json')))
CON = json.load(open(os.path.join(T, '_contrast.json')))
REP = json.load(open(os.path.join(T, '_repro.json')))
REC = json.load(open(os.path.join(T, '_recognition_proxy.json')))

def nl(v, d=2):
    if isinstance(v, int): return f'{v}'
    s = f'{v:.{d}f}'.rstrip('0').rstrip('.') if d else f'{v:.0f}'
    return s.replace('.', ',')
def r2(v): return f'{v:.2f}'.replace('.', ',')

V = {}
wm = META['wordmark']; p = META['params']; tm = META['tent']
V['CAP'] = '700'
rows = ['| Vorm | Eenheden | % van de kapitaalhoogte |', '|---|---:|---:|']
for k, v in META['strokes_units'].items():
    rows.append(f'| {k} | {nl(v, 1)} | {nl(v / 7, 1)} % |')
V['T_STROKES'] = '\n'.join(rows)
rows = ['| Hoek | Gemeten |', '|---|---:|']
for k, v in META['angles_deg'].items():
    rows.append(f'| {k} | {nl(v, 1)}° |')
V['T_ANGLES'] = '\n'.join(rows)
rows = ['| Tussen | logo.svg: kortste afstand | logo.svg: wit per regel | logo-klein: kortste afstand |', '|---|---:|---:|---:|']
names = {'K|LA': 'K – LA', 'LA|P': 'LA – P', 'P|K': 'P – K', 'LA|tent': 'A – tent', 'tent|R': 'tent – R'}
seen = set()
for gp, gk in zip(wm['primary']['letter_gaps'], wm['klein']['letter_gaps']):
    if gp['pair'] in seen: continue
    seen.add(gp['pair'])
    rows.append(f"| {names.get(gp['pair'], gp['pair'])} | {nl(gp['units'], 0)} | {nl(gp['white_units'], 0)} | {nl(gk['units'], 0)} |")
V['T_GAPS'] = '\n'.join(rows)
rows = ['| Hoogte (eenheden) | Tent-A | Gewone A |', '|---|---:|---:|',
        f"| piek / top | {nl(tm['peak_y'], 0)} geometrisch, {nl(700 + wm['primary']['peak_above_cap_units'], 1)} na de afronding | 700 (vlakke top) |",
        f"| bovenkant luifel = bovenkant dwarsbalk | {tm['valance_top']} | {tm['a_crossbar'][1]} |",
        f"| onderkant luifelband (tussen de schulpen) | {nl(tm['cusps'], 1)} | – |",
        f"| onderkant schulpen = onderkant dwarsbalk | {nl(tm['scallop_tips'], 1)} | {nl(tm['a_crossbar'][0], 1)} |",
        f"| breedte | {tm['width']} | {p['W_A']} |"]
V['T_TENT'] = '\n'.join(rows)
tz = META['tent_zwaar']
rows = ['| Maat (eenheden) | Zware tent-A | Slanke tent-A |', '|---|---:|---:|',
        f"| dak (vanaf horizontaal) | {nl(tz['pitch_deg'], 1)}°, rechte randen | {nl(tz['pitch_slank_deg'], 1)}°, randen 11 naar binnen gebogen |",
        f"| piek | {nl(tz['peak_y'], 0)} geometrisch, {nl(tz['peak_after_rounding'], 1)} na de afronding | {nl(tm['peak_y'], 0)} geometrisch, {nl(700 + wm['primary']['peak_above_cap_units'], 1)} na de afronding |",
        f"| dakhoeken | {nl(tz['roof_corners'], 1)} | {tm['valance_top']} (dak loopt over in de luifel) |",
        f"| open naad tussen dak en luifel | {nl(tz['seam'], 0)} | – |",
        f"| bovenkant luifel | {nl(tz['valance_top'], 1)} | {tm['valance_top']} |",
        f"| onderkant luifelband (tussen de schulpen) | {nl(tz['cusps'], 1)} | {nl(tm['cusps'], 1)} |",
        f"| onderkant schulpen = hoogte van de opening tussen de palen | {nl(tz['scallop_tips'], 1)} | {nl(tm['scallop_tips'], 1)} |",
        f"| luifelband | {nl(tz['band'], 0)} | {nl(tm['valance_top'] - tm['cusps'], 1)} |",
        f"| schulpen | {tz['scallops']} × {nl(tz['scallop_depth'], 0)} diep | {p['T_SCAL']} × {p['T_SCAL_D']} diep |",
        f"| palen | {nl(tz['pole'], 0)} ({nl(tz['pole_to_stem'], 2)} × de stok) | {p['T_LEG']} ({nl(tm['pole_to_stem'], 2)} × de stok) |",
        f"| paal ingesprongen vanaf de luifelhoek | {nl(tz['pole_inset'], 0)} | {p['T_INSET']} |",
        f"| breedte | {nl(tz['width'], 0)} | {tm['width']} |"]
V['T_TENT_Z'] = '\n'.join(rows)
V['PITCH_Z'] = nl(tz['pitch_deg'], 1); V['POLE_Z'] = nl(tz['pole'], 0); V['BAND_Z'] = nl(tz['band'], 0); V['SCAL_Z'] = nl(tz['scallop_depth'], 0)
V['SEAM_Z'] = nl(tz['seam'], 0); V['POLE_Z_RATIO'] = nl(tz['pole_to_stem'], 2); V['VT_Z'] = nl(tz['valance_top'], 0)
V['ICON_SHARE'] = nl(META['mark']['icon_tent_height_share'] * 100, 0)
pz = wm['primary_een_kleur']
V['STROKE_PZ'] = nl(pz['thinnest_stroke_units'], 0); V['GAP_PZ'] = nl(pz['smallest_opening_units'], 0)
V['EMB_PZ'] = str(pz['min_width_mm']['Borduren (satijnsteek)'])
V['PEAK_OVER'] = nl(wm['primary']['peak_above_cap_units'], 1)
V['PEAK_PCT'] = nl(wm['primary']['peak_above_cap_units'] / 7, 1)
V['PITCH'] = nl(META['angles_deg']['tentdak, koorde top-hoek (vanaf horizontaal)'], 1)
V['POLE_RATIO'] = nl(tm['pole_to_stem'], 2)
V['ASPECT'] = nl(wm['primary']['aspect'], 2)
V['W_UNITS'] = nl(wm['primary']['width_units'], 0)
V['W_UNITS_KLEIN'] = nl(wm['klein']['width_units'], 0)
V['STROKE_P'] = nl(wm['primary']['thinnest_stroke_units'], 0); V['GAP_P'] = nl(wm['primary']['smallest_opening_units'], 0)
V['STROKE_K'] = nl(wm['klein']['thinnest_stroke_units'], 0); V['GAP_K'] = nl(wm['klein']['smallest_opening_units'], 0)
V['A_COUNTER'] = nl(wm['primary']['a_counter_width_units'], 0)
V['SWITCH_P'] = META['switch']['logo.svg']; V['SWITCH_K'] = META['switch']['logo-klein']
methods = [m for m in wm['primary']['min_width_mm'] if m != 'Scherm (px)']
ASSUME = {'Borduren (satijnsteek)': '1,2 / 1,0', 'Flock-transfer (geplot)': '1,5 / 1,5', 'Flex-/snijfolie (textiel)': '1,0 / 1,0',
          'Snijfolie bus/bord': '1,5 / 1,5', 'Zeefdruk textiel': '0,5 / 0,6', 'DTF-transfer': '0,5 / 0,5', 'Sublimatie (luifel, rok)': '0,3 / 0,3',
          'Offset/digitaal papier': '0,15 / 0,15'}
rows = ['| Methode | Kleinste lijn / opening (aanname, mm) | logo.svg (twee kleuren) | print-wordmark.svg (één kleur) | logo-klein, print-wordmark-klein | beeldmerk (print-mark.svg) |', '|---|---|---:|---:|---:|---:|']
for m in methods:
    rows.append(f"| {m} | {ASSUME[m]} | {wm['primary']['min_width_mm'][m]} mm | {pz['min_width_mm'][m]} mm | {wm['klein']['min_width_mm'][m]} mm | {META['mark']['min_width_mm'][m]} mm |")
rows.append(f"| Scherm, technisch minimum (1x) | 1,6 px / 1 px | {wm['primary']['min_width_mm']['Scherm (px)']} px | {pz['min_width_mm']['Scherm (px)']} px | {wm['klein']['min_width_mm']['Scherm (px)']} px | {META['mark']['min_width_mm']['Scherm (px)']} px |")
V['T_MINSIZE'] = '\n'.join(rows)
V['EMB_P'] = str(wm['primary']['min_width_mm']['Borduren (satijnsteek)']); V['EMB_K'] = str(wm['klein']['min_width_mm']['Borduren (satijnsteek)'])
V['EMB_M'] = str(META['mark']['min_width_mm']['Borduren (satijnsteek)'])
V['FLOCK_K'] = str(wm['klein']['min_width_mm']['Flock-transfer (geplot)'])
V['SUB_P'] = str(wm['primary']['min_width_mm']['Sublimatie (luifel, rok)'])

# palette
rows = ['| Kleur | Hex | Betekenis | Rol |', '|---|---|---|---|']
for k, v in TOK['color'].items():
    rows.append(f"| **{k.capitalize()}** | `{v['value']}` | {v['family']} | {v['role']} |")
V['T_PALETTE'] = '\n'.join(rows)
V['T_DERIVED'] = ', '.join(f"{k} `{v['value']}` ({v['role']})" for k, v in TOK['color_derived'].items())
# schemes
LBL = {'buy': 'koopknop', 'primary': 'hoofdknop', 'secondary': 'omlijnd'}
rows = ['| Schema | Achtergrond / tekst | Koopknop: rust → hover | Hoofdknop: rust → hover | Omlijnd: rust → hover | Kleinste label / vorm |', '|---|---|---|---|---|---|']
by = {}
for c in CON['scheme_checks']: by.setdefault(c['scheme'], []).append(c)
for sid, s in TOK['color_schemes'].items():
    ch = by[sid]
    buy = f"{s['buy']['bg']} met {s['buy']['label']} → + rand {s['buy_hover']['border']}" if 'buy' in s else '— (hier wordt niet gekocht)'
    pr = f"{s['primary']['bg']} met {s['primary']['label']} → {s['primary_hover']['bg']}" + (f" + rand {s['primary_hover']['border']}" if s['primary_hover']['border'] != s['primary_hover']['bg'] else '')
    se = f"{s['secondary']['label']}-rand → {s['secondary_hover']['bg']}"
    rows.append(f"| {sid} · {s['naam']} | {s['background']} / {s['text']} ({r2(s['text_ratio'])}:1) | {buy} | {pr} | {se} | {r2(min(c['label_ratio'] for c in ch))}:1 / {r2(min(c['shape_ratio'] for c in ch))}:1 |")
V['T_SCHEMES'] = '\n'.join(rows)
V['N_SCHEME_CHECKS'] = str(len(CON['scheme_checks']))
V['N_SCHEME_FAILS'] = str(sum(not c['pass'] for c in CON['scheme_checks']))
def lvl(r):
    if r['kind'] == 'text': return 'AAA' if r['ratio'] >= 7 else 'AA'
    if r['kind'] == 'large': return 'AA groot' if r['ratio'] < 4.5 else 'AA'
    return '≥ 3:1'
rows = ['| Tekst op vlak | Waar | Ratio | Niveau |', '|---|---|---:|---|']
for r in CON['rows']:
    if r['kind'] in ('text', 'large'):
        rows.append(f"| {r['fg'].capitalize()} op {r['bg']} | {r['use']} | {r2(r['ratio'])}:1 | {lvl(r)} |")
V['T_CONTRAST_TEXT'] = '\n'.join(rows)
rows = ['| Vorm tegen vlak | Waar | Ratio | Eis 3:1 |', '|---|---|---:|---|']
for r in CON['rows']:
    if r['kind'] == 'ui':
        rows.append(f"| {r['fg'].capitalize()} tegen {r['bg']} | {r['use']} | {r2(r['ratio'])}:1 | {'ja' if r['pass'] else 'NEE'} |")
V['T_CONTRAST_UI'] = '\n'.join(rows)
rows = ['| Voorgrond | Achtergrond | Wat niet | Ratio |', '|---|---|---|---:|']
for f in CON['forbidden']:
    rows.append(f"| {f['fg']} | {f['bg']} | {f['use']} | {r2(f['ratio'])}:1 |")
V['T_FORBIDDEN'] = '\n'.join(rows)
V['N_PAIRS'] = str(len(CON['rows'])); V['N_FAILS'] = str(sum(not r['pass'] for r in CON['rows']))
rows = ['| Vlakken | ΔE<sub>00</sub> | Contrast |', '|---|---:|---:|']
for k, v in CON['surfaces'].items(): rows.append(f"| {k} | {nl(v['de2000'], 1)} | {r2(v['contrast'])}:1 |")
V['T_SURFACES'] = '\n'.join(rows)
sep = CON['separation']
rows = ['| Merkkleur tegen | ΔE<sub>00</sub> | Hue (CIELAB) |', '|---|---:|---:|', f"| Lampion zelf | – | {nl(sep['lampion_hue'], 1)}° |"]
for k, v in sep['lampion_vs_stock'].items(): rows.append(f"| {k} | {nl(v['de2000'], 1)} | {nl(v['hue'], 1)}° |")
rows.append(f"| Zon | {nl(sep['lampion_vs_zon']['de2000'], 1)} | |"); rows.append(f"| Oker | {nl(sep['lampion_vs_oker']['de2000'], 1)} | |"); rows.append(f"| Bordeaux | {nl(sep['lampion_vs_bordeaux']['de2000'], 1)} | |")
rows.append(f"| ter vergelijking: v6 Klaproos | | {nl(sep['klaproos_v6_hue'], 1)}° |")
V['T_SEPARATION'] = '\n'.join(rows)
V['DE_RENDER'] = nl(sep['lampion_vs_stock']['rood (render, gemeten)']['de2000'], 1)
V['DE_ROK'] = nl(sep['lampion_vs_stock']['oranje stretchrok (catalogus)']['de2000'], 1)
# reproduction
rows = ['| Kleur | sRGB | CMYK gestreken (FOGRA39) | CMYK ongestreken (FOGRA29) | Pantone C | Pantone U | Pantone TCX (textiel) | RAL Classic | Oracal 651 |', '|---|---|---|---|---|---|---|---|---|']
for k, e in REP['colors'].items():
    c1, c2 = e['cmyk_fogra39'], e['cmyk_fogra29']
    rows.append(f"| **{k.capitalize()}** | `{e['hex']}` | C{c1[0]} M{c1[1]} Y{c1[2]} K{c1[3]} | C{c2[0]} M{c2[1]} Y{c2[2]} K{c2[3]} | {e['pantone_c'][0]['name']} (ΔE {nl(e['pantone_c'][0]['de'], 1)}) | {e['pantone_u'][0]['name']} (ΔE {nl(e['pantone_u'][0]['de'], 1)}) | {e['pantone_tcx'][0]['name']} (ΔE {nl(e['pantone_tcx'][0]['de'], 1)}) | {e['ral_b'][0]['name'].split(' (')[0]} ({nl(e['ral_b'][0]['de'], 1)}) | {e['oracal651'][0]['name'].replace('ORACAL ', '')} (ΔE {nl(e['oracal651'][0]['de'], 1)}) |")
V['T_REPRO'] = '\n'.join(rows)
rows = ['| Kleur | Madeira Polyneon 40 | Isacord 40 | Gunold Poly | Alternatief (2e keus) |', '|---|---|---|---|---|']
for k, e in REP['colors'].items():
    f = lambda key, i=0: f"{e[key][i]['name'].replace('Madeira Polyneon ', '').replace('Isacord ', '').replace('Gunold Poly ', '')} (ΔE {nl(e[key][i]['de'], 1)})"
    rows.append(f"| **{k.capitalize()}** | {f('madeira')} | {f('isacord')} | {f('gunold')} | Madeira {f('madeira', 1)} |")
V['T_THREADS'] = '\n'.join(rows)
srcs = []
for k, s_ in REP['sources'].items():
    url = f"https://github.com/{s_['repo'].split('github.com/')[1]}/blob/{s_['commit']}/{s_['file'].split(' · ')[0]}" if 'repo' in s_ else ''
    srcs.append(f"- {s_.get('what', k)}: {url}")
V['L_REPRO_SOURCES'] = '\n'.join(srcs)
lg = TOK['logo']
V['HEADER_D'] = lg['header']['desktop']; V['HEADER_M'] = lg['header']['mobile_390']
rows = ['| Vorm (IoU op 16 · 32 · 64 px) | landmark | huis | schoppen ♠ | druppel |', '|---|---:|---:|---:|---:|']
def trio(r, k): return ' · '.join(nl(r[f'{k}_{n}']) for n in (16, 32, 64))
for r in REC['rows']:
    rows.append(f"| {r['shape']} | {trio(r, 'landmark')} | {trio(r, 'house')} | {trio(r, 'spade')} | {trio(r, 'drop')} |")
V['T_RECOG'] = '\n'.join(rows)
r6 = REC['rows'][0]; r7 = REC['rows'][2]; rz = REC['rows'][3]
V['REC_L32_6'] = nl(r6['landmark_32']); V['REC_L32_7'] = nl(r7['landmark_32']); V['REC_H32_6'] = nl(r6['house_32']); V['REC_H32_7'] = nl(r7['house_32'])
V['REC_L32_Z'] = nl(rz['landmark_32']); V['REC_H32_Z'] = nl(rz['house_32'])
V['REC_S32_7'] = nl(r7['spade_32']); V['REC_S32_Z'] = nl(rz['spade_32']); V['REC_D32_7'] = nl(r7['drop_32']); V['REC_D32_Z'] = nl(rz['drop_32'])

for name in ('brand', 'technisch'):
    src = open(os.path.join(T, f'{name}.template.md')).read()
    def sub(m):
        k = m.group(1)
        if k not in V: raise KeyError(k)
        return V[k]
    out = re.sub(r'\{\{([A-Z0-9_]+)\}\}', sub, src)
    open(os.path.join(B, f'{name}.md'), 'w').write(out)
    print(name, len(out))
