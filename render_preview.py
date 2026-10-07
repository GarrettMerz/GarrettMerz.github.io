#!/usr/bin/env python3
"""Render index.html through _layouts/event.html without Jekyll.

Writes preview.html next to index.html so the relative assets/ and images/ paths
resolve. Open it in a browser:  xdg-open preview.html
"""
import re, json, html, yaml

idx = open('index.html').read()
m = re.match(r'^---\n(.*?)\n---\n', idx, re.S)
fm, content = yaml.safe_load(m.group(1)), idx[m.end():]
lay = re.sub(r'^---\n.*?\n---\n', '', open('_layouts/event.html').read(), flags=re.S)
secs = yaml.safe_load(open('_data/sections.yml'))
site = yaml.safe_load(open('_config.yml'))
desc = fm.get('description') or site.get('description') or ''   # Liquid's `default` treats '' as missing, so Jekyll falls back too
if not fm.get('description'): print('WARNING index.html has no description; Jekyll will use _config.yml description:', repr(desc))

# sanity checks that Jekyll wouldn't do for you
objs = [s['object'] for s in secs]
assert len(objs) == len(set(objs)), f'an event object is used twice: {objs}'
ids = {s['id'] for s in secs}
# plain pages (data-title=…, no event object) are allowed to be absent from sections.yml
have = {m.group(1) for m in re.finditer(r'<section class="stage" data-obj="([^"]+)"(?![^>]*data-title)', content)}
if ids - have: print('WARNING sections.yml ids with no <section data-obj> in index.html:', ids - have)
if have - ids: print('WARNING <section data-obj> in index.html not listed in sections.yml:', have - ids)

nav = ''.join(f'\n    <a href="#{s["id"]}">{html.escape(s["title"])}</a>' for s in secs)
lay = re.sub(r'\{%- for s in site.data.sections %\}.*?\{%- endfor %\}', nav, lay, flags=re.S)
for a, b in [('{{ site.locale | slice: 0,2 }}', 'en'),
             ('{{ page.title | default: site.title }}', html.escape(fm['title'])),
             ('{{ page.description | default: site.description }}', html.escape(desc)),
             ("{{ '/assets/css/event.css' | relative_url }}", 'assets/css/event.css'),
             ("{{ '/images/site-logo.png' | relative_url }}", 'images/site-logo.png'),
             ("{{ '/assets/js/event.js' | relative_url }}", 'assets/js/event.js'),
             ('{{ site.data.sections | jsonify }}', json.dumps(secs)),
             ("?v={{ site.time | date: '%s' }}", ''),   # cache-buster: Jekyll stamps the build time; the local preview doesn't need it
             ('{{ content }}', content)]:
    lay = lay.replace(a, b)
assert '{{' not in lay and '{%' not in lay, 'unresolved Liquid tag'
open('preview.html', 'w').write(lay)
print('wrote preview.html')
