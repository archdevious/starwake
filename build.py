import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['stars_data', 'data', 'star_desc', 'engine', 'ui_core', 'ship_icons', 'audio', 'ui_panels', 'ui_screens', 'main']
js = '\n'.join((src / f'{n}.js').read_text() for n in order)
html = (src / 'shell.html').read_text().replace('/*CSS*/', (src / 'style.css').read_text()).replace('/*JS*/', js)
(root / 'index.html').write_text(html)
print('built', len(html), 'bytes')
