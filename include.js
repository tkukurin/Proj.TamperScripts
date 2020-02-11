// cf. https://stackoverflow.com/questions/24042953/how-to-automatically-load-a-local-script-file-in-an-external-website

// ==UserScript==
// @name         TamperLib
// @namespace    tkukurin
// @version      0.1
// @description  Generic functions
// @author       Toni Kukurin
// @grant        none
// ==/UserScript==

// Function wrappers
const F = {};
F.guard = x => (x && Promise.resolve(x)) || Promise.reject();
F.ret = val => fn => args => {fn(args); return val};
F.retSelf = fn => a => F.ret(a)(fn)(a);
F.retT = F.ret(true);
F.retF = F.ret(false);

// Query
const Q = {}
Q.el = (el, sel) => F.guard(el.querySelector(sel));
Q.doc = (sel) => Q.el(document, sel);

const Shortcut = {
  sel: (k, sel, ...mods) => ({k:k, sel:sel, mods:mods}),
  fun: (k, fn, ...mods) => ({k:k, fn:fn, mods:mods}),
  norm: (...modKeys) => F.retSelf(shortcut => {
    // 'a'.charCodeAt() == 96, e.which == 65 for 'a'
    const keyIsString = shortcut.k.charCodeAt;
    if (keyIsString) shortcut.k = shortcut.k.charCodeAt() - 32;
    if (shortcut.fn) shortcut.fn = F.retT(shortcut.fn);
    shortcut.mods = (shortcut.mods||[]).concat(modKeys.map(m => ({
      s:e => e.ShiftKey, a: e => e.altKey, c: e => e.ctrlKey, m: e => e.metaKey
    })[m]))
  }),
  _init: shortcuts => e => shortcuts.forEach(shortcut => {
    if (shortcut.mods.every(mod => mod(e)) && e.which == shortcut.k) {
      // If s.fn returns true (was invoked), don't click anything
      (shortcut.fn && shortcut.fn(e)) || Q.doc(shortcut.sel).then(x => x.click());
      (e.stopPropagation && e.stopPropagation());
    }
  })
};

Shortcut.init = shortcuts => Shortcut._init(
  Array.isArray(shortcuts) ? shortcuts : Object.entries(shortcuts).flatMap(
    str2shortObj => str2shortObj[1].map(Shortcut.norm(str2shortObj[0]))
))
