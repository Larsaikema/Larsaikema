"""Find the renderer input colour that makes the LIT face of a tent come out as the brand swatch.

python3 calibrate.py <renders-dir> <target-hex> [start-hex] [workdir]
Renders a 3x3 easy-up (hero, finish mat) at 700 px / 16 spp, measures it with measure_render.py and corrects the
input colour per channel in linear light until the lit face is within dE2000 2.0. Log: <workdir>/calibrate-log.json
"""
import subprocess, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from measure_render import measure
from color3 import hex2rgb, rgb2hex
def lin(c): c /= 255; return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def srgb(v): v = max(0, min(1, v)); return 255 * (v * 12.92 if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055)
R, target = sys.argv[1], sys.argv[2]
inp = sys.argv[3] if len(sys.argv) > 3 else target
W = sys.argv[4] if len(sys.argv) > 4 else '.'
T = [lin(c) for c in hex2rgb(target)]
log = []
for it in range(6):
    out = os.path.join(W, f'calibrate-{it}.png')
    spec = {"model": "easyUpTent", "w": 3, "d": 3, "color": inp, "legs": "premium", "angle": "hero", "finish": "mat"}
    subprocess.run(['node', os.path.join(R, 'render.mjs'), '--spec', json.dumps(spec), '--out', out, '--size', '700', '--samples', '16'], capture_output=True)
    m = measure(out, target)
    log.append({'input': inp, **m}); print(json.dumps(log[-1]), flush=True)
    if m['lit']['de2000'] <= 2.0: break
    Mx = [lin(c) for c in hex2rgb(m['lit']['hex'])]; I = [lin(c) for c in hex2rgb(inp)]
    inp = rgb2hex(*[srgb(I[i] * (T[i] / max(Mx[i], 1e-4)) ** 0.9) for i in range(3)])
json.dump(log, open(os.path.join(W, 'calibrate-log.json'), 'w'), indent=1)
