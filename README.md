# Spring 12

A 12-week jump, speed and evasion program as a single-page iPhone web app. It has three sessions a week (A: Jump & Land, B: Speed, Cuts & Evasion, C: Control, Rhythm & Armor). It also has animated exercise demos, collapsible explanations, a per-block checklist, a rest/hold timer, a test sheet (weeks 2, 8, 12) and a training log.

## Use it
- **Easiest:** open the published Claude artifact link on your iPhone in Safari, then Share → Add to Home Screen. When you're signed in to Claude, your data syncs to your account.
- **From this repo:** `index.html` is fully self-contained. Host it anywhere (for example GitHub Pages) and open it in Safari. Outside Claude, data is saved on the device only.

## Edit it
The sources live in `src/`:
- `data.js`: all program content (exercises, sessions, tests, research)
- `scenes.js`: the animated demos
- `anim.js`: the animation engine
- `app.js`, `app.css`: the app itself

After editing, run `python3 build.py` to regenerate `index.html`.
