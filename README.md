# Chrome extensions

Main use: replicate TamperMonkey style tooling by having my own base plugin.
Probably on-and-off more-or-less usable and/or useful.

* YouTube: Copy current timestamp and recent captions to clipboard.
* YouTube: Video speed control based on [igrigorik/videospeed](https://github.com/igrigorik/videospeed).
* GitHub: Shortcut to visit Sourcegraph or Colab for current page
* Twitter/Bluesky: Copy contents of entire current thread as plain text
* Vim: navigate using `hjkl`, back/forward `HL` and follow links with `f`

`include.js` is a simple library; has shorthand methods for DOM manipulation,
shortcut definition, etc.

Install:
```bash
git clone git@github.com:tkukurin/Proj.TamperScripts.git /my/path
chrome 'chrome://extensions'
```

Then "load unpacked" the folder in `/my/path`.

