"""Write tools/render-jobs.jsonl (v4) from the print artwork that build.py wrote (tools/print-*.json).
    python3 make_jobs.py <brand-dir>      then: node <renders>/render.mjs --batch <brand-dir>/tools/render-jobs.jsonl --samples 32
Outputs land in <brand-dir>/img (paths are relative to the jobs file)."""
import json, os, sys
B = sys.argv[1]
T = os.path.join(B, 'tools')
wm = json.load(open(os.path.join(T, 'print-wordmark.json')))
mk = json.load(open(os.path.join(T, 'print-mark.json')))
ALB = '#AF2D03'      # measured input colour for Klaproos (brand.md 8.2; calibrate.py, renderer of 17-10-2026)
ZAND = '#FBF6EC'
val = {'d': wm['d'], 'vb': wm['viewBox'], 'color': ZAND, 'sides': ['front', 'back', 'left', 'right'], 'pad': 0.05}
rok = lambda az=22: {'d': mk['d'], 'vb': mk['viewBox'], 'color': ZAND, 'width': 0.15, 'y': 0.27, 'azimuth': az}
tent = {'model': 'easyUpTent', 'w': 3, 'd': 3, 'color': ALB, 'finish': 'mat', 'legs': 'premium'}
jobs = [
  dict(out='../img/tent-3x3-klaproos-hero.webp', **tent, angle='hero', size=1400),
  dict(out='../img/tent-3x3-klaproos-logo-hero.webp', **tent, angle='hero', valancePrint=val, size=1400),
  dict(out='../img/tent-3x3-klaproos-logo-front.webp', **tent, angle='front', valancePrint=val, size=1400),
  dict(out='../img/statafelrok-stretch-zwart-print-hero.webp', model='statafelCover', type='stretch', color='zwart', diameter=0.8, angle='hero', camera={'azimuth': 22}, print=rok(), size=1400),
  dict(out='../img/tent-3x6-wit-zijwanden-hero.webp', model='easyUpTent', w=6, d=3, color='wit', legs='premium', walls={'back': ['window', 'window'], 'left': 'window', 'right': 'door'}, angle='hero', size=900),
  dict(out='../img/scene-hero.webp', imageWidth=1800, imageHeight=1100, angle='hero', camera={'fill': 0.84}, items=[
      dict(**tent, valancePrint=val),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-0.55, 0, 0.35], print=rok()),
      dict(model='statafelCover', type='stretch', color='wit', diameter=0.8, position=[0.75, 0, -0.35])]),
  # Zakelijk: one order, many pieces - a 3x6 Professional with the logo and four printed stretch covers
  # (table x positions chosen so no front leg crosses a printed cover at the hero angle)
  dict(out='../img/scene-zakelijk.webp', imageWidth=1800, imageHeight=1100, angle='hero', camera={'fill': 0.86}, items=[
      dict(model='easyUpTent', w=6, d=3, color=ALB, finish='mat', legs='professional', valancePrint=val),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-2.0, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[-0.4, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[1.0, 0, -0.3], print=rok()),
      dict(model='statafelCover', type='stretch', color='zwart', diameter=0.8, position=[2.6, 0, -0.3], print=rok())]),
]
with open(os.path.join(T, 'render-jobs.jsonl'), 'w') as f:
    for j in jobs: f.write(json.dumps(j) + '\n')
print('jobs', len(jobs))
