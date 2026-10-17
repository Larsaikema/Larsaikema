"""Check every brand SVG: parses (lxml), has a viewBox and a <title>, has no <text>, no external references
(href, url(), @import, <image>, <use>, <script>, <foreignObject>), no style blocks. Writes tools/_svg_check.json.
    python3 check_svg.py <brand-dir>"""
import os, sys, json, glob, re
from lxml import etree
B = sys.argv[1]
files = sorted(glob.glob(os.path.join(B, '*.svg')) + glob.glob(os.path.join(B, 'svg', '*.svg')))
NS = '{http://www.w3.org/2000/svg}'
rows = []; bad = 0
for f in files:
    raw = open(f, 'rb').read()
    t = etree.fromstring(raw)
    tags = {e.tag.replace(NS, '') for e in t.iter() if isinstance(e.tag, str)}
    issues = []
    if t.get('viewBox') is None: issues.append('geen viewBox')
    if 'title' not in tags: issues.append('geen title')
    for bad_tag in ('text', 'image', 'use', 'script', 'foreignObject', 'style'):
        if bad_tag in tags: issues.append(f'<{bad_tag}>')
    s = raw.decode()
    if re.search(r'(xlink:)?href=|url\(|@import', s): issues.append('externe verwijzing')
    rows.append({'file': os.path.relpath(f, B), 'bytes': len(raw), 'paths': s.count('<path'), 'issues': issues})
    bad += bool(issues)
json.dump({'checked': len(rows), 'with_issues': bad, 'rows': rows}, open(os.path.join(B, 'tools', '_svg_check.json'), 'w'), indent=1)
print('checked', len(rows), 'with issues', bad, [r for r in rows if r['issues']])
