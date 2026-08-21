from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HEADER = (ROOT / 'includes' / 'vmg-header.html').read_text()
FOOTER = (ROOT / 'includes' / 'vmg-footer.html').read_text()

STYLE_BLOCK = '''
    <link rel="stylesheet" href="/assets/css/vmg-trade-nav.css" data-vmg-trade-nav="true">
    <link rel="stylesheet" href="/assets/css/vmg-nav-premium-overrides.css" data-vmg-nav-premium="true">
    <link rel="stylesheet" href="/assets/css/vmg-feedback.css" data-vmg-feedback-style="true">
    <link rel="stylesheet" href="/assets/css/vmg-footer.css" data-vmg-footer-style="true">
    <link rel="stylesheet" href="/assets/css/vmg-responsive-polish.css?v=20260821g" data-vmg-responsive-polish="true">
    <link rel="stylesheet" href="/assets/css/vmg-header-sticky-fix.css?v=20260822b" data-vmg-header-sticky-fix="true">'''

pages = sorted(ROOT.glob('*.html'))
market = ROOT / 'market-prices' / 'index.html'
if market.exists():
    pages.append(market)

changed = []
for path in pages:
    text = path.read_text()
    original = text

    if 'data-vmg-trade-nav="true"' not in text:
        text = text.replace('</head>', STYLE_BLOCK + '\n  </head>', 1)

    text, hc = re.subn(r'<header\b[^>]*class="[^"]*site-header[^"]*"[^>]*>.*?</header>', HEADER, text, count=1, flags=re.S | re.I)
    text, fc = re.subn(r'<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>.*?</footer>', FOOTER, text, count=1, flags=re.S | re.I)

    if hc != 1:
        print(f'WARNING: no header replaced in {path.relative_to(ROOT)}')
    if fc != 1:
        print(f'WARNING: no footer replaced in {path.relative_to(ROOT)}')

    text = text.replace('Preview Company Profile', 'Preview VMG Brochure')
    text = text.replace('Download Company Profile', 'Download VMG Brochure')
    text = text.replace('View Company Profile', 'View VMG Brochure')
    text = re.sub(r'assets/js/config\.js(?:\?v=[^"\']+)?', '/assets/js/config.js?v=20260822b', text)

    if text != original:
        path.write_text(text)
        changed.append(path.relative_to(ROOT).as_posix())

print('Updated pages:')
for item in changed:
    print(' -', item)
