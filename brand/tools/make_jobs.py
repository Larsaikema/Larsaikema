"""Write tools/render-jobs.jsonl (brand v7): the renders with a print on them, plus the van and carton applications.

    python3 make_jobs.py <brand-dir>
    node <scratch copy of renders/ + tools/renders-svgprint.patch + tools/brandApps.js>/render.mjs \
         --batch <brand-dir>/tools/render-jobs.jsonl --samples 32

Art direction (brand.md §8): backdrop Linnen #ECE4D6, tents and covers in the supplier's stock colours (renders/js/
materials.js: rood #B5161E, zwart, wit), never in Lampion. Prints on cloth are one colour (Zand on red and black,
Inkt on white) from svg/print-wordmark.svg (valance) and svg/print-mark.svg (statafelrok). The van wrap is printed
foil, so it carries the full-colour luifel lock-up; the carton is one-colour Inkt flexo on kraft.
Renders without a print (tent-3x3-rood-hero, -wit-hero, statafels, 3x6 with walls) are not repeated here.
"""
import json, os, re, sys
B = sys.argv[1]
T = os.path.join(B, 'tools')

def art(rel, recolor=None):
    s = open(os.path.join(B, rel)).read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()[2:]]
    layers = []
    for m in re.finditer(r'<path([^>]*)/>', s):
        a = m.group(1)
        d = re.search(r' d="([^"]+)"', a).group(1)
        fill = re.search(r'fill="([^"]+)"', a).group(1)
        rule = 'evenodd' if 'evenodd' in a else 'nonzero'
        layers.append({'d': d, 'color': (recolor or {}).get(fill, fill), 'rule': rule})
    return {'vb': vb, 'layers': layers}

def one(rel):   # single-colour artwork as (d, vb) for the renderer's svgPrintTexture
    a = art(rel)
    return ''.join(l['d'] for l in a['layers']), a['vb']

LINNEN = '#ECE4D6'; ZAND = '#FBF6EC'; INKT = '#1D2420'; LAMPION = '#E66414'
wd, wvb = one('svg/print-wordmark.svg')
md, mvb = one('svg/print-mark.svg')
val = lambda c=ZAND: {'d': wd, 'vb': wvb, 'color': c, 'sides': ['front', 'back', 'left', 'right'], 'pad': 0.18}
rok = lambda az=22, c=ZAND: {'d': md, 'vb': mvb, 'color': c, 'width': 0.13, 'y': 0.30, 'azimuth': az}
tent = {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': 'rood', 'legs': 'premium'}

luifel = art('svg/logo-luifel.svg')
print_luifel = art('svg/print-luifel.svg', {'#000000': INKT})
print_mark = art('svg/print-mark.svg', {'#000000': INKT})
wordmark_zand = art('svg/print-wordmark.svg', {'#000000': ZAND})
wordmark_inkt = art('svg/print-wordmark.svg', {'#000000': INKT})

jobs = [
  # brand tent: our own tent with the wordmark on all four valance sides (campaigns, social, print section)
  dict(out='../img/tent-3x3-rood-logo-hero.webp', **tent, angle='hero', valancePrint=val(), size=1400, bg=LINNEN),
  dict(out='../img/tent-3x3-rood-logo-front.webp', **tent, angle='front', valancePrint=val(), size=1400, bg=LINNEN),
  dict(out='../img/statafelrok-stretch-zwart-print-hero.webp', model='statafelCover', type='stretch', color='zwart', diameter=0.8, angle='hero',
       camera={'azimuth': 22}, print=rok(), size=1200, bg=LINNEN),
  # storefront hero: a white tent (one-colour Inkt print), so the only orange on the home page is the brand itself
  dict(out='../img/scene-hero.webp', imageWidth=1800, imageHeight=1100, angle='hero', camera={'fill': 0.84}, bg=LINNEN, items=[
      dict(model='easyUpTent', w=3, d=3, color='wit', legs='premium', valancePrint=val(INKT)),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-0.55, 0, 0.35], print=rok()),
      dict(model='statafelCover', type='strik', color='wit', diameter=0.8, position=[0.75, 0, -0.35])]),
  # Zakelijk: a 3 x 6 Professional in black with the wordmark, four printed covers
  dict(out='../img/scene-zakelijk.webp', imageWidth=1800, imageHeight=1100, angle='hero', camera={'fill': 0.86}, bg=LINNEN, items=[
      dict(model='easyUpTent', w=6, d=3, color='zwart', legs='professional', valancePrint=val()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-2.0, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-0.4, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[1.0, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[2.6, 0, -0.3], print=rok())]),
  # applications: printed van wrap (full colour) and the shipping carton (one colour on kraft) with the tent bag
  dict(out='../img/app-bestelbus.webp', model='bestelbus', imageWidth=1800, imageHeight=1100, angle='hero', bg=LINNEN,
       camera={'azimuth': 32, 'elevation': 7, 'fill': 0.9},
       wrap={'band': {'color': LAMPION, 'top': 0.66, 'bottom': 0.3},
             'art': [dict(luifel, x=-2.35, top=2.05, width=2.75)]}),
  dict(out='../img/app-verpakking.webp', model='verpakking', imageWidth=1800, imageHeight=1100, angle='hero', bg=LINNEN,
       camera={'azimuth': 24, 'elevation': 22, 'fill': 0.86},
       side=dict(print_luifel, width=0.36), end=dict(print_mark, width=0.12),
       tape={'color': '#C49A6C', 'art': dict(wordmark_inkt, width=0.16)},
       label={'art': print_mark}, bag={'art': dict(wordmark_zand, width=0.25)}),
]
with open(os.path.join(T, 'render-jobs.jsonl'), 'w') as f:
    for j in jobs: f.write(json.dumps(j) + '\n')
print('jobs', len(jobs))
