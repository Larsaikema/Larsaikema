"""Minimal TrueType variable-font outline extractor (glyf + gvar + avar), stdlib only.
Usage as module: f = VFont(path); f.set({'wght':800,'opsz':96}); f.glyph_path(ch) -> (svg_d, advance)
"""
import struct

def u16(b, o): return struct.unpack_from('>H', b, o)[0]
def i16(b, o): return struct.unpack_from('>h', b, o)[0]
def u32(b, o): return struct.unpack_from('>I', b, o)[0]
def f2d14(b, o): return i16(b, o) / 16384.0
def fixed(b, o): return struct.unpack_from('>i', b, o)[0] / 65536.0

class VFont:
    def __init__(self, path):
        self.b = b = open(path, 'rb').read()
        n = u16(b, 4)
        self.t = {}
        for i in range(n):
            o = 12 + 16 * i
            tag = b[o:o+4].decode('latin1')
            self.t[tag] = (u32(b, o + 8), u32(b, o + 12))
        h = self.t['head'][0]
        self.upem = u16(b, h + 18)
        self.loca_long = i16(b, h + 50) == 1
        self.numGlyphs = u16(b, self.t['maxp'][0] + 4)
        self.numHM = u16(b, self.t['hhea'][0] + 34)
        hh = self.t['hhea'][0]
        self.ascender = i16(b, hh + 4); self.descender = i16(b, hh + 6)
        self._cmap()
        self._fvar()
        self._avar()
        self.coords = [0.0] * len(self.axes)

    # ---------- tables
    def _cmap(self):
        b = self.b; c = self.t['cmap'][0]
        n = u16(b, c + 2); best = None
        for i in range(n):
            pid, eid, off = u16(b, c + 4 + 8*i), u16(b, c + 6 + 8*i), u32(b, c + 8 + 8*i)
            fmt = u16(b, c + off)
            if fmt == 12: best = (12, c + off); break
            if fmt == 4 and best is None: best = (4, c + off)
        self.cmap = {}
        fmt, o = best
        if fmt == 4:
            seg = u16(b, o + 6) // 2
            ends = o + 14; starts = ends + 2*seg + 2; deltas = starts + 2*seg; ros = deltas + 2*seg
            for s in range(seg):
                end, start = u16(b, ends + 2*s), u16(b, starts + 2*s)
                delta, ro = i16(b, deltas + 2*s), u16(b, ros + 2*s)
                for ch in range(start, end + 1):
                    if ch == 0xFFFF: continue
                    if ro == 0: g = (ch + delta) & 0xFFFF
                    else:
                        g = u16(b, ros + 2*s + ro + 2*(ch - start))
                        if g: g = (g + delta) & 0xFFFF
                    self.cmap[ch] = g
        else:
            ng = u32(b, o + 12)
            for i in range(ng):
                s, e, g = u32(b, o+16+12*i), u32(b, o+20+12*i), u32(b, o+24+12*i)
                for ch in range(s, e + 1): self.cmap[ch] = g + ch - s

    def _fvar(self):
        self.axes = []
        if 'fvar' not in self.t: return
        b = self.b; o = self.t['fvar'][0]
        ao, ac, asz = u16(b, o + 4), u16(b, o + 8), u16(b, o + 10)
        for i in range(ac):
            a = o + ao + i * asz
            self.axes.append((b[a:a+4].decode(), fixed(b, a+4), fixed(b, a+8), fixed(b, a+12)))

    def _avar(self):
        self.avar = None
        if 'avar' not in self.t: return
        b = self.b; o = self.t['avar'][0]
        n = u16(b, o + 6); p = o + 8; self.avar = []
        for i in range(n):
            cnt = u16(b, p); p += 2
            m = [(f2d14(b, p + 4*k), f2d14(b, p + 4*k + 2)) for k in range(cnt)]
            p += 4 * cnt; self.avar.append(m)

    def set(self, loc):
        coords = []
        for i, (tag, mn, df, mx) in enumerate(self.axes):
            v = min(max(loc.get(tag, df), mn), mx)
            if v < df: n = (v - df) / (df - mn)
            elif v > df: n = (v - df) / (mx - df)
            else: n = 0.0
            if self.avar and self.avar[i]:
                m = self.avar[i]
                for k in range(len(m) - 1):
                    (a0, b0), (a1, b1) = m[k], m[k+1]
                    if a0 <= n <= a1:
                        n = b0 if a1 == a0 else b0 + (n - a0) * (b1 - b0) / (a1 - a0); break
            coords.append(round(n * 16384) / 16384)
        self.coords = coords

    def gid(self, ch): return self.cmap.get(ord(ch), 0)

    def _loca(self, g):
        b = self.b; l = self.t['loca'][0]
        if self.loca_long: return u32(b, l + 4*g), u32(b, l + 4*g + 4)
        return u16(b, l + 2*g) * 2, u16(b, l + 2*g + 2) * 2

    def _hmtx(self, g):
        b = self.b; o = self.t['hmtx'][0]
        if g < self.numHM: return u16(b, o + 4*g), i16(b, o + 4*g + 2)
        adv = u16(b, o + 4*(self.numHM - 1))
        return adv, i16(b, o + 4*self.numHM + 2*(g - self.numHM))

    # ---------- glyph parsing
    def _raw(self, g):
        b = self.b; s, e = self._loca(g); base = self.t['glyf'][0] + s
        adv, lsb = self._hmtx(g)
        if e == s:
            return {'type': 'empty', 'pts': [], 'ends': [], 'on': [], 'adv': adv, 'xmin': 0, 'lsb': lsb}
        nc = i16(b, base); xmin = i16(b, base + 2)
        if nc >= 0:
            p = base + 10
            ends = [u16(b, p + 2*i) for i in range(nc)]; p += 2*nc
            il = u16(b, p); p += 2 + il
            npts = ends[-1] + 1 if ends else 0
            flags = []
            while len(flags) < npts:
                f = b[p]; p += 1; flags.append(f)
                if f & 8:
                    r = b[p]; p += 1; flags.extend([f] * r)
            xs = []; x = 0
            for f in flags:
                if f & 2:
                    d = b[p]; p += 1; x += d if f & 16 else -d
                elif not (f & 16):
                    x += i16(b, p); p += 2
                xs.append(x)
            ys = []; y = 0
            for f in flags:
                if f & 4:
                    d = b[p]; p += 1; y += d if f & 32 else -d
                elif not (f & 32):
                    y += i16(b, p); p += 2
                ys.append(y)
            return {'type': 'simple', 'pts': list(zip(xs, ys)), 'ends': ends,
                    'on': [bool(f & 1) for f in flags], 'adv': adv, 'xmin': xmin, 'lsb': lsb}
        comps = []; p = base + 10
        while True:
            fl = u16(b, p); cg = u16(b, p + 2); p += 4
            if fl & 1: a1, a2 = i16(b, p), i16(b, p + 2); p += 4
            else: a1, a2 = struct.unpack_from('>bb', b, p); p += 2
            m = (1, 0, 0, 1)
            if fl & 8: s_ = f2d14(b, p); m = (s_, 0, 0, s_); p += 2
            elif fl & 0x40: m = (f2d14(b, p), 0, 0, f2d14(b, p + 2)); p += 4
            elif fl & 0x80: m = (f2d14(b, p), f2d14(b, p+2), f2d14(b, p+4), f2d14(b, p+6)); p += 8
            comps.append({'g': cg, 'dx': a1, 'dy': a2, 'm': m})
            if not (fl & 0x20): break
        return {'type': 'comp', 'comps': comps, 'adv': adv, 'xmin': xmin, 'lsb': lsb}

    def _deltas(self, g, coords_pts, ends):
        """coords_pts: list of (x,y) incl. 4 phantom points at the end. returns summed deltas."""
        n = len(coords_pts)
        out = [[0.0, 0.0] for _ in range(n)]
        if 'gvar' not in self.t or not any(self.coords): return out
        b = self.b; gv = self.t['gvar'][0]
        axc = u16(b, gv + 4); shc = u16(b, gv + 6); sho = u32(b, gv + 8)
        flags = u16(b, gv + 14); arr = u32(b, gv + 16)
        if flags & 1: o0, o1 = u32(b, gv + 20 + 4*g), u32(b, gv + 24 + 4*g)
        else: o0, o1 = u16(b, gv + 20 + 2*g) * 2, u16(b, gv + 22 + 2*g) * 2
        if o0 == o1: return out
        gd = gv + arr + o0
        tvc = u16(b, gd); doff = u16(b, gd + 2)
        count = tvc & 0x0FFF; shared_pts = None
        dp = gd + doff; hp = gd + 4
        def read_points(p):
            c = b[p]; p += 1
            if c == 0: return None, p
            if c & 0x80: c = ((c & 0x7F) << 8) | b[p]; p += 1
            pts = []; last = 0
            while len(pts) < c:
                ctl = b[p]; p += 1; rc = (ctl & 0x7F) + 1
                for _ in range(rc):
                    if ctl & 0x80: v = u16(b, p); p += 2
                    else: v = b[p]; p += 1
                    last += v; pts.append(last)
            return pts, p
        def read_deltas(p, cnt):
            ds = []
            while len(ds) < cnt:
                ctl = b[p]; p += 1; rc = (ctl & 0x3F) + 1
                if ctl & 0x80: ds.extend([0] * rc)
                elif ctl & 0x40:
                    for _ in range(rc): ds.append(i16(b, p)); p += 2
                else:
                    for _ in range(rc): ds.append(struct.unpack_from('>b', b, p)[0]); p += 1
            return ds, p
        if tvc & 0x8000: shared_pts, dp = read_points(dp)
        for _ in range(count):
            size = u16(b, hp); ti = u16(b, hp + 2); hp += 4
            if ti & 0x8000:
                peak = [f2d14(b, hp + 2*k) for k in range(axc)]; hp += 2*axc
            else:
                idx = ti & 0x0FFF; peak = [f2d14(b, gv + sho + (idx*axc + k)*2) for k in range(axc)]
            if ti & 0x4000:
                start = [f2d14(b, hp + 2*k) for k in range(axc)]; hp += 2*axc
                end = [f2d14(b, hp + 2*k) for k in range(axc)]; hp += 2*axc
            else: start = end = None
            sc = 1.0
            for k in range(axc):
                c, pk = self.coords[k], peak[k]
                if pk == 0: continue
                if c == 0: sc = 0; break
                if start is None:
                    if c < min(0, pk) or c > max(0, pk): sc = 0; break
                    sc *= c / pk
                else:
                    s_, e_ = start[k], end[k]
                    if c < s_ or c > e_: sc = 0; break
                    if c == pk: continue
                    sc *= (c - s_) / (pk - s_) if c < pk else (e_ - c) / (e_ - pk)
            p = dp; dp += size
            if sc == 0: continue
            if ti & 0x2000: pts, p = read_points(p)
            else: pts = shared_pts
            cnt = n if pts is None else len(pts)
            dx, p = read_deltas(p, cnt); dy, p = read_deltas(p, cnt)
            if pts is None:
                for i in range(n): out[i][0] += sc*dx[i]; out[i][1] += sc*dy[i]
                continue
            tdel = {}
            for k, pi in enumerate(pts):
                if pi < n: tdel[pi] = (dx[k], dy[k])
            full = self._iup(coords_pts, ends, tdel, n)
            for i in range(n): out[i][0] += sc*full[i][0]; out[i][1] += sc*full[i][1]
        return out

    def _iup(self, pts, ends, tdel, n):
        full = [(0.0, 0.0)] * n
        for i, d in tdel.items(): full[i] = d
        start = 0
        for e in ends:
            idx = list(range(start, e + 1)); start = e + 1
            touched = [i for i in idx if i in tdel]
            if not touched: continue
            if len(touched) == 1:
                for i in idx: full[i] = tdel[touched[0]]
                continue
            for ti_, t1 in enumerate(touched):
                t2 = touched[(ti_ + 1) % len(touched)]
                # untouched points strictly between t1 and t2 (cyclic within contour)
                L = len(idx); a = idx.index(t1); bpos = idx.index(t2)
                k = (a + 1) % L
                while k != bpos:
                    i = idx[k]; res = []
                    for j in (0, 1):
                        x1, x2 = pts[t1][j], pts[t2][j]; d1, d2 = tdel[t1][j], tdel[t2][j]
                        x = pts[i][j]
                        if x1 == x2: res.append(d1 if d1 == d2 else 0); continue
                        if x1 > x2: x1, x2, d1, d2 = x2, x1, d2, d1
                        if x <= x1: res.append(d1)
                        elif x >= x2: res.append(d2)
                        else: res.append(d1 + (x - x1) * (d2 - d1) / (x2 - x1))
                    full[i] = tuple(res); k = (k + 1) % L
        for i in range(len(full)):
            if i in tdel: full[i] = tdel[i]
        return full

    def glyph(self, g):
        """returns contours [[(x,y,on),...]], advance (varied)"""
        r = self._raw(g)
        if r['type'] == 'empty':
            pts = []; ends = []
        if r['type'] in ('simple', 'empty'):
            pts = r['pts']; ends = r['ends']
            pp1x = r['xmin'] - r['lsb']
            allp = list(pts) + [(pp1x, 0), (pp1x + r['adv'], 0), (0, 0), (0, 0)]
            d = self._deltas(g, allp, ends)
            moved = [(allp[i][0] + d[i][0], allp[i][1] + d[i][1]) for i in range(len(allp))]
            adv = moved[-3][0] - moved[-4][0]
            contours = []; s = 0
            for e in ends:
                contours.append([(moved[i][0], moved[i][1], r['on'][i]) for i in range(s, e + 1)]); s = e + 1
            return contours, adv
        comps = r['comps']
        pp1x = r['xmin'] - r['lsb']
        allp = [(c['dx'], c['dy']) for c in comps] + [(pp1x, 0), (pp1x + r['adv'], 0), (0, 0), (0, 0)]
        d = self._deltas(g, allp, [])
        contours = []
        for i, c in enumerate(comps):
            sub, _ = self.glyph(c['g'])
            a, bb, cc, dd = c['m']; ox, oy = allp[i][0] + d[i][0], allp[i][1] + d[i][1]
            for ct in sub:
                contours.append([(a*x + cc*y + ox, bb*x + dd*y + oy, on) for x, y, on in ct])
        nn = len(comps)
        adv = (allp[nn+1][0] + d[nn+1][0]) - (allp[nn][0] + d[nn][0])
        return contours, adv

def contours_to_d(contours, scale=1.0, ox=0.0, oy=0.0, prec=2):
    """font units (y up) -> svg path d (y down). baseline at oy."""
    def P(x, y): return (round(ox + x*scale, prec), round(oy - y*scale, prec))
    def fmt(v): s = ('%.*f' % (prec, v)).rstrip('0').rstrip('.'); return s if s not in ('-0', '') else '0'
    out = []
    for ct in contours:
        if not ct: continue
        pts = [(x, y, on) for x, y, on in ct]
        # find start on-curve
        si = next((i for i, p in enumerate(pts) if p[2]), None)
        if si is None:
            a, b2 = pts[0], pts[1]
            pts.insert(0, ((a[0]+b2[0])/2, (a[1]+b2[1])/2, True)); si = 0
        pts = pts[si:] + pts[:si]
        x0, y0 = P(pts[0][0], pts[0][1])
        seg = ['M%s %s' % (fmt(x0), fmt(y0))]
        n = len(pts); i = 1; prev_off = None
        seq = pts[1:] + [pts[0]]
        for x, y, on in seq:
            if on:
                if prev_off is not None:
                    cx, cy = P(*prev_off); px, py = P(x, y)
                    seg.append('Q%s %s %s %s' % (fmt(cx), fmt(cy), fmt(px), fmt(py))); prev_off = None
                else:
                    px, py = P(x, y); seg.append('L%s %s' % (fmt(px), fmt(py)))
            else:
                if prev_off is not None:
                    mx, my = (prev_off[0]+x)/2, (prev_off[1]+y)/2
                    cx, cy = P(*prev_off); px, py = P(mx, my)
                    seg.append('Q%s %s %s %s' % (fmt(cx), fmt(cy), fmt(px), fmt(py)))
                prev_off = (x, y)
        seg.append('Z'); out.append(''.join(seg))
    return ''.join(out)
