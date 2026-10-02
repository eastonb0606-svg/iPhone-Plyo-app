import re
import os
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')+'/'
out=os.path.dirname(os.path.abspath(__file__))+'/'
r=lambda f: open(d+f).read()
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap">'
body='''<div class="wrap"><main id="app" aria-live="polite"></main></div>
<nav id="tabbar" class="tabbar" aria-label="Sections"></nav>
<button id="fab" class="fab" hidden aria-label="Open timer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg><span id="fab-t">Timer</span></button>
'''
js='\n'.join(r(f) for f in ['anim.js','scenes.js','data.js','app.js'])
css=r('app.css')+'\n'+r('anim.css')
frag=f'<title>Spring 12 Training</title>\n{fonts}\n<style>\n{css}\n</style>\n{body}<script>\n{js}\n</script>\n'
open(out+'spring12-fragment.html','w').write(frag)
full=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Spring 12"><meta name="theme-color" content="#eef1f4">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}[hidden]{{display:none!important}}img{{max-width:100%}}</style>
</head><body>
{frag}</body></html>
'''
open(out+'index.html','w').write(full)
print(len(frag), 'bytes')
