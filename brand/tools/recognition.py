"""Silhouette proxy for the 'bank/landmark icon' reading: render each shape black-on-white, fit to an NxN box
(aspect kept, centred), threshold, and compare with a generic landmark pictogram and a generic house pictogram
(both drawn here from their usual description: pediment + slab + columns + base; roof + walls + door).
Score = IoU of the binary masks (1 = identical silhouette). Not a substitute for the human test."""
import sys, os, json, importlib.util, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kkgeo as G7
spec = importlib.util.spec_from_file_location('kk6', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kkgeo_v6.py'))
G6 = importlib.util.module_from_spec(spec); spec.loader.exec_module(G6)
from PIL import Image, ImageDraw
import numpy as np

def raster_paths(paths, N, ss=8):
    pts = [c.flatten(24) for c in paths]
    xs = [q[0] for p in pts for q in p]; ys = [q[1] for p in pts for q in p]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = (N * ss * 0.9) / max(x1 - x0, y1 - y0)
    W = N * ss
    ox = (W - (x1 - x0) * s) / 2; oy = (W - (y1 - y0) * s) / 2
    im = Image.new('L', (W, W), 0); d = ImageDraw.Draw(im)
    # even-odd via XOR of each contour
    acc = np.zeros((W, W), bool)
    for p in pts:
        m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).polygon([((q[0] - x0) * s + ox, W - ((q[1] - y0) * s + oy)) for q in p], fill=255)
        acc ^= np.array(m) > 127
    im = Image.fromarray((acc * 255).astype('uint8')).resize((N, N), Image.BOX)
    return np.array(im) / 255.0

def raster_polys(polys, N, ss=8, box=(0, 0, 24, 24)):
    W = N * ss
    x0, y0, x1, y1 = box
    s = W * 0.9 / max(x1 - x0, y1 - y0); ox = (W - (x1 - x0) * s) / 2; oy = (W - (y1 - y0) * s) / 2
    acc = np.zeros((W, W), bool)
    for p, mode in polys:
        m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).polygon([((x - x0) * s + ox, (y - y0) * s + oy) for x, y in p], fill=255)
        mm = np.array(m) > 127
        acc = (acc | mm) if mode == '+' else (acc & ~mm)
    return np.array(Image.fromarray((acc * 255).astype('uint8')).resize((N, N), Image.BOX)) / 255.0

def rect(x, y, w, h): return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
LANDMARK = [([(2, 9), (12, 3), (22, 9)], '+'), (rect(2.5, 9.6, 19, 2.2), '+')] + [(rect(x, 12.6, 2.2, 6), '+') for x in (4.3, 8.5, 13.3, 17.5)] + [(rect(2, 19.4, 20, 2.2), '+')]
HOUSE = [([(2.5, 11), (12, 3), (21.5, 11)], '+'), (rect(4.5, 10, 15, 11), '+'), (rect(10, 14, 4, 7), '-')]
# bbox of the pictograms for fitting
def bb(polys):
    xs = [x for p, m in polys for x, y in p]; ys = [y for p, m in polys for x, y in p]
    return min(xs), min(ys), max(xs), max(ys)

def iou(a, b, t=0.5):
    A, B = a > t, b > t
    return float((A & B).sum() / max((A | B).sum(), 1))

shapes = {
    'v6 tent-A (letter)': G6.glyph_tent(G6.P).paths,
    'v6 beeldmerk (tent + statafel)': (lambda g, e: g.paths + e)(*G6.mark_geometry(G6.P)),
    'v7 tent-A (letter = beeldmerk)': G7.glyph_tent(G7.P).paths,
    'v7 mark-klein': G7.glyph_tent(G7.P, leg=96, scallops=2).paths,
}
out = {'method': __doc__.strip(), 'rows': []}
for name, paths in shapes.items():
    row = {'shape': name}
    for N in (16, 32, 64):
        a = raster_paths(paths, N)
        row[f'landmark_{N}'] = round(iou(a, raster_polys(LANDMARK, N, box=bb(LANDMARK))), 2)
        row[f'house_{N}'] = round(iou(a, raster_polys(HOUSE, N, box=bb(HOUSE))), 2)
    out['rows'].append(row); print(row)
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '_recognition_proxy.json'), 'w'), indent=1, ensure_ascii=False)
# save a visual strip
strip = []
for name, paths in shapes.items():
    strip.append(raster_paths(paths, 32))
strip += [raster_polys(LANDMARK, 32, box=bb(LANDMARK)), raster_polys(HOUSE, 32, box=bb(HOUSE))]
im = np.concatenate([np.pad(1 - s, 2, constant_values=1) for s in strip], axis=1)
pass
