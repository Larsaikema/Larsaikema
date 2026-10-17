"""Measure the brand-colour faces in a product render.

python3 measure_render.py <image> <target-hex> [mask-hex-hue-range]
Selects saturated red-orange product pixels (Lab hue 25-65 deg, chroma > 30), splits them into the
lit roof face and the shaded faces by lightness, and reports mean colours (averaged in linear light)
plus CIEDE2000 against the target swatch.
"""
import sys, json, math
import numpy as np
from PIL import Image
sys.path.insert(0, __import__('os').path.dirname(__file__))
from color3 import lab65, de2000, rgb2hex

def srgb_to_lin(a): return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
def lin_to_srgb(a): return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(np.clip(a, 0, None), 1 / 2.4) - 0.055)

def lab_arr(rgb):
    lin = srgb_to_lin(rgb / 255.0)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > (6/29) ** 3, np.cbrt(xyz), xyz / (3 * (6/29) ** 2) + 4/29)
    L = 116 * f[:, 1] - 16; a = 500 * (f[:, 0] - f[:, 1]); b = 200 * (f[:, 1] - f[:, 2])
    return np.stack([L, a, b], 1)

def mean_hex(px):
    m = lin_to_srgb(srgb_to_lin(px / 255.0).mean(0)) * 255
    return rgb2hex(*np.clip(m, 0, 255))

def measure(path, target):
    im = np.asarray(Image.open(path).convert('RGB')).reshape(-1, 3).astype(float)
    lab = lab_arr(im)
    hue = np.degrees(np.arctan2(lab[:, 2], lab[:, 1])) % 360
    chroma = np.hypot(lab[:, 1], lab[:, 2])
    sel = ((hue > 355) | (hue < 70)) & (chroma > 28)
    px = im[sel]; L = lab[sel, 0]
    if len(px) < 100: return {'error': 'no product pixels'}
    q = np.percentile(L, [10, 30, 50, 70, 75, 95])
    lit = px[(L >= q[4]) & (L <= q[5])]            # brightest quarter minus highlights = lit roof face
    shade = px[(L >= q[0]) & (L <= q[1])]
    mid = px[(L >= q[1]) & (L <= q[3])]
    out = {'pixels': int(sel.sum())}
    T = lab65(target)
    for k, arr in (('lit', lit), ('mid', mid), ('shade', shade)):
        h = mean_hex(arr); out[k] = {'hex': h, 'de2000': round(de2000(lab65(h), T), 1), 'L': round(lab65(h)[0], 1)}
    out['target'] = {'hex': target, 'L': round(T[0], 1)}
    return out

if __name__ == '__main__':
    print(json.dumps(measure(sys.argv[1], sys.argv[2])))
