// cf. https://stackoverflow.com/questions/24042953/how-to-automatically-load-a-local-script-file-in-an-external-website
// ==UserScript==
// @name         Lib
// @namespace    tkukurin
// @version      0.1
// @description  Generic functions
// @author       Toni
// @match
// @grant        none
// ==/UserScript==


// TODO softlink this to proj/


const ret = val => fn => args => {fn(args); return val};
const retArg = fn => a => ret(a)(fn)(a);
const retTrue = ret(true);
const retFalse = ret(false);

const chk = (x, fn) => x && fn(x);
const qe = (e, s, fn) => chk(e.querySelector(s), fn);
const qd = (s, fn) => qe(document, s, fn);

// {k:key, sel:selector to clck, fn:custom fn, mods:modifier keys}
const sse = (k, sel, ...mods) => ({k:k, sel:sel, mods:mods});
const sfn = (k, fn, ...mods) => ({k:k, fn:fn, mods:mods});
const norm = (...modKeys) => retArg(s => {
  // 'a'.charCodeAt() == 96, e.which == 65 for 'a'
  if (s.k.charCodeAt) s.k = s.k.charCodeAt() - 32;
  if (s.fn) s.fn = retTrue(s.fn);
  s.mods = (s.mods||[]).concat(modKeys.map(m => ({
    s:e => e.ShiftKey, a: e => e.altKey, c: e => e.ctrlKey, m: e => e.metaKey
  })[m]))
});

const shortcuts = shorts => (e) => {
  shorts.forEach(s => {
    if (s.mods.every(mod => mod(e)) && e.which == s.k) {
      // if s.fn returns true, don't click anything
      (s.fn && s.fn(e)) || qd(s.sel, x=>x.click());
      (e.stopPropagation && e.stopPropagation());
    }
  });
}

// Function wrappers
const F = {};
F.bestEffort = x => {try{return x();}catch(e){}};
F.guard = x => (x && Promise.resolve(x)) || Promise.reject();
F.ret = val => fn => args => {fn(args); return val};
F.retSelf = fn => a => F.ret(a)(fn)(a);
F.retTrue = F.ret(true);
F.retFalse = F.ret(false);

// Query
NodeList.prototype.forEach = Array.prototype.forEach;
NodeList.prototype.flatMap = Array.prototype.flatMap;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;

HTMLCollection.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.flatMap = Array.prototype.flatMap;
HTMLCollection.prototype.filter = Array.prototype.filter;
HTMLCollection.prototype.map = Array.prototype.map;

const Q = {}
Q.el = (el, sel) => F.guard(el.querySelector(sel));
Q.doc = (sel) => Q.el(document, sel);
Q.all = sel => document.querySelectorAll(sel);

const Shortcut = {
  sel: (k, sel, ...mods) => ({k:k, sel:sel, mods:mods}),
  fun: (k, fn, ...mods) => ({k:k, fn:fn, mods:mods}),
  // 'a'.charCodeAt() == 96, e.which == 65 for 'a'
  kcode: k => k.charCodeAt ? k.charCodeAt() - 32 : k,
};

Shortcut.init = shortcuts => Shortcut._init(
  Array.isArray(shortcuts) ? shortcuts : Object.entries(shortcuts).flatMap(
    str2shortObj => str2shortObj[1].map(Shortcut.norm(str2shortObj[0]))
))

Shortcut._init = shortcuts => e => shortcuts.forEach(shortcut => {
  if (shortcut.mods.every(mod => mod(e)) && e.which == shortcut.k) {
    // If s.fn returns true (was invoked), don't click anything
    (shortcut.fn && shortcut.fn(e)) || Q.doc(shortcut.sel).then(x => x.click());
    (e.stopPropagation && e.stopPropagation());
  }
});

Shortcut.norm = (...modKeys) => F.retSelf(shortcut => {
  shortcut.k = Shortcut.kcode(shortcut.k);
  if (shortcut.fn) shortcut.fn = F.retTrue(shortcut.fn);
  shortcut.mods = (shortcut.mods||[]).concat(modKeys.map(m => ({
    s:e => e.ShiftKey, a: e => e.altKey, c: e => e.ctrlKey, m: e => e.metaKey
  })[m]))
});

