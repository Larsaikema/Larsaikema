"""Put finished brand renders in <brand>/img, crop the cover image and measure the brand colour in the render.

python3 finish_imgs.py <render-dir> <brand-dir> [v2-reference-image]
<render-dir> may be <brand>/img itself (render-jobs.jsonl writes there). Writes <brand>/tools/_render_check.json;
an existing 'v2' entry is kept unless a v2 reference image is given.
"""
import sys, os, json, shutil
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from measure_render import measure
R, B = sys.argv[1], sys.argv[2]
for f in ('tent-3x3-klaproos-hero.webp', 'tent-3x3-klaproos-logo-hero.webp', 'tent-3x3-klaproos-logo-front.webp',
          'statafelrok-stretch-zwart-print-hero.webp', 'tent-3x6-wit-zijwanden-hero.webp', 'scene-hero.webp'):
    src, dst = os.path.join(R, f), os.path.join(B, 'img', f)
    if os.path.abspath(src) != os.path.abspath(dst): shutil.copy(src, dst)
im = Image.open(os.path.join(B, 'img', 'scene-hero.webp')).convert('RGB')
W, H = im.size
cw, ch = 1240, 1050
x0 = (W - cw) // 2; y0 = max(0, (H - ch) // 2)
im.crop((x0, y0, x0 + cw, y0 + ch)).save(os.path.join(B, 'img', 'scene-hero-crop.webp'), quality=88, method=6)
out = os.path.join(B, 'tools', '_render_check.json')
old = json.load(open(out)) if os.path.exists(out) else {}
chk = {'tent-3x3-klaproos-hero.webp': measure(os.path.join(B, 'img', 'tent-3x3-klaproos-hero.webp'), '#C83812')}
if len(sys.argv) > 3: chk['v2'] = measure(sys.argv[3], '#BE3A1D')
elif 'v2' in old: chk['v2'] = old['v2']
json.dump(chk, open(out, 'w'), indent=1)
print(json.dumps(chk))
