"""Compare a competitor colour (picked with a colour picker from their logo, header or buy button) with the Klapklaar
palette, for brand.md §12.2.

    python3 compare.py '#1F6C3C' ['#hex' ...]

Prints CIEDE2000 and CIELAB hue against every Klapklaar colour, and the verdict of the decision rule:
'te dichtbij' when a competitor's main colour lies within dE00 15 of Lampion.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from color3 import lab65, de2000, lab_hue

TOK = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tokens.json')))
PAL = {k: v['value'] for k, v in TOK['color'].items()}

if len(sys.argv) < 2: sys.exit(__doc__)
for h in sys.argv[1:]:
    h = h if h.startswith('#') else '#' + h
    L = lab65(h)
    print(f'\n{h}  (L* {L[0]:.1f}, hue {lab_hue(L):.1f}°)')
    rows = sorted(((de2000(L, lab65(v)), k, v) for k, v in PAL.items()), key=lambda t: t[0])
    for d, k, v in rows:
        print(f'  {k:9s} {v}  ΔE00 {d:5.1f}')
    d = de2000(L, lab65(PAL['lampion']))
    print('  oordeel:', 'TE DICHTBIJ bij Lampion (ΔE00 < 15): schuif de merkkleur' if d < 15 else f'ver genoeg van Lampion (ΔE00 {d:.1f} ≥ 15)')
