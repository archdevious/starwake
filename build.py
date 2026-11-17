import pathlib, sys
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['data', 'engine', 'tactical', 'ai', 'ui_core', 'ui_panels', 'ui_screens', 'ui_battle', 'main']
js = '\n'.join((src / f'{n}.js').read_text() for n in order)
css = (src / 'style.css').read_text()
html = (src / 'shell.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js)
out = root / 'index.html'

out.write_text(html)
print('built', out, len(html), 'bytes')
