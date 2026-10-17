"""Fill brand.template.md -> ../brand.md with palette and WCAG tables from tokens.json / _contrast.json."""
import json, os
T = os.path.dirname(os.path.abspath(__file__)); B = os.path.dirname(T)
tok = json.load(open(os.path.join(B, 'tokens.json'))); con = json.load(open(os.path.join(T, '_contrast.json')))
pal = '\n'.join(f"| {k.replace('-', ' ').capitalize()} | `{v['value']}` | {v['role']} |" for k, v in tok['color'].items())
def name(k): return k.replace('-', ' ')
rows = ['| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |', '|---|---|---|---:|---:|---|']
for x in con['rows']:
    res = ('AAA' if x['aaa'] else 'AA') if x['kind'] == 'text' else 'voldoet (UI)'
    rows.append(f"| {name(x['fg'])} `{x['fg_hex']}` | {name(x['bg'])} `{x['bg_hex']}` | {x['use']}{' (UI-deel)' if x['kind']=='ui' else ''} | {x['ratio']:.2f}:1 | {x['need']:.1f}:1 | {res} |")
forb = '\n'.join(f"| {name(f['fg'])} | {name(f['bg'])} | {f['use']} | {f['ratio']:.2f}:1 | niet gebruiken |" for f in con['forbidden'])
md = open(os.path.join(T, 'brand.template.md')).read()
md = md.replace('{{PALETTE}}', pal).replace('{{CONTRAST}}', '\n'.join(rows)).replace('{{FORBIDDEN}}', forb).replace('{{PAIRS_N}}', str(len(con['rows'])))
open(os.path.join(B, 'brand.md'), 'w').write(md)
print('ok', len(md))
