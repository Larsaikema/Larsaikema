"""Klapklaar cadeaubon packshot (catalog/images/cadeaubon-hero.webp): an Inkt card with the inverse logo and 'Cadeaubon' in Figtree,
lying on Linnen (brand.md §8.1). No amount on the card (one image for every Bedrag). Run: python3 catalog/tools/giftcard.py <out.webp>"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
REPO = str(Path(__file__).resolve().parents[2])
out = sys.argv[1]
S = 2400                       # supersampled, downscaled to 1200
LINNEN, INKT, ZAND, LAMPION = (0xEC, 0xE4, 0xD6), (0x1D, 0x24, 0x20), (0xFB, 0xF6, 0xEC), (0xE6, 0x64, 0x14)
bg = Image.new('RGB', (S, S), LINNEN)
cw, ch = int(S * 0.72), int(S * 0.72 / 1.586)   # ID-1 card ratio 85,6 x 54 mm
card = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
d = ImageDraw.Draw(card)
d.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=int(cw * 0.045), fill=INKT + (255,))
# inverse logo: Inkt letters -> Zand, the Lampion tent stays
logo = Image.open(REPO + '/brand/img/logo-1200.png').convert('RGBA')
lw = int(cw * 0.62); lh = int(logo.height * lw / logo.width)
logo = logo.resize((lw, lh), Image.LANCZOS)
px = logo.load()
for y in range(lh):
    for x in range(lw):
        r, g, b, a = px[x, y]
        if a and not (r > 150 and g < 150):     # not the orange tent
            px[x, y] = ZAND + (a,)
mx = int(cw * 0.085)
card.alpha_composite(logo, (mx, int(ch * 0.14)))
font = ImageFont.truetype(REPO + '/brand/fonts/Figtree-VF.ttf', int(ch * 0.16))
try:
    font.set_variation_by_axes([800])
except Exception:
    pass
ty = int(ch * 0.56)
d.text((mx, ty), 'Cadeaubon', font=font, fill=ZAND + (255,))
bb = d.textbbox((mx, ty), 'Cadeaubon', font=font)
d.rectangle([mx, bb[3] + int(ch * 0.04), mx + int((bb[2] - bb[0]) * 0.42), bb[3] + int(ch * 0.04) + int(ch * 0.022)], fill=LAMPION + (255,))
card = card.rotate(-7, resample=Image.BICUBIC, expand=True)
# soft contact shadow
sh = Image.new('L', bg.size, 0)
mask = card.split()[3]
ox, oy = (S - card.width) // 2, (S - card.height) // 2
sh.paste(mask, (ox + int(S * 0.012), oy + int(S * 0.02)))
sh = sh.filter(ImageFilter.GaussianBlur(S * 0.018))
shadow = Image.new('RGB', bg.size, (0x9A, 0x92, 0x84))
bg = Image.composite(shadow, bg, sh.point(lambda v: int(v * 0.55)))
bg.paste(card, (ox, oy), card)
bg = bg.resize((1200, 1200), Image.LANCZOS)
bg.save(out, 'WEBP', quality=88, method=6)
print('wrote', out)
