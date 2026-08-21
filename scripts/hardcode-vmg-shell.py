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

# Once the approved shell is hardcoded, config.js must not reconstruct it again.
config = ROOT / 'assets' / 'js' / 'config.js'
config_text = config.read_text()
needle = "  function enhanceNavigation() {\n    var header = document.querySelector('.site-header');"
replacement = "  function enhanceNavigation() {\n    var staticHeader = document.querySelector('.site-header[data-vmg-static-header=\"true\"]');\n    if (staticHeader) {\n      bindTrackForms();\n      return;\n    }\n    var header = document.querySelector('.site-header');"
if needle in config_text:
    config_text = config_text.replace(needle, replacement, 1)
config.write_text(config_text)

# Prevent vmg-footer.js from replacing the hardcoded footer after DOMContentLoaded.
footer_js = ROOT / 'assets' / 'js' / 'vmg-footer.js'
footer_text = footer_js.read_text()
needle = "  function init(){\n    var existing=document.querySelector('footer.site-footer');\n    var footer=createFooter();"
replacement = "  function init(){\n    var existing=document.querySelector('footer.site-footer');\n    if(existing && existing.getAttribute('data-vmg-static-footer') === 'true'){ bindSubscribe(existing); return; }\n    var footer=createFooter();"
if needle in footer_text:
    footer_text = footer_text.replace(needle, replacement, 1)
footer_js.write_text(footer_text)

print('Updated pages:')
for item in changed:
    print(' -', item)
print('Dynamic shell replacement disabled for hardcoded header/footer.')
