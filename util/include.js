// cf. https://stackoverflow.com/questions/24042953/how-to-automatically-load-a-local-script-file-in-an-external-website
// ==UserScript==
// @name         TamperLib
// @namespace    tkukurin
// @version      0.2
// @description  Generic functions
// @author       Toni Kukurin
// @grant        none
// ==/UserScript==

// TODO(tk) investigate if this will work in any situation
NodeList.prototype.forEach = Array.prototype.forEach;
NodeList.prototype.flatMap = Array.prototype.flatMap;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;
NodeList.prototype.concat = function(other) {
  if (other instanceof NodeList) {
    other = Object.values(other);
  }
  return Object.values(this).concat(other);
}

HTMLCollection.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.flatMap = Array.prototype.flatMap;
HTMLCollection.prototype.filter = Array.prototype.filter;
HTMLCollection.prototype.map = Array.prototype.map;

// Function wrappers
const F = {};
F.bestEffort = (fn, logOnException) => ((...a) => {
  try {
    return fn(...a);
  } catch(e) {
    logOnException && console.error(e);
  }
});
F.ret = val => fn => (...a) => {
  fn(...a);
  return val;
};
F.guard = x => (x && Promise.resolve(x)) || Promise.reject(`${x} not found`);
F.retSelf = fn => (a) => F.ret(a)(fn)(a);
F.retTrue = F.ret(true);
F.retFalse = F.ret(false);

// Query
const Q = {}
Q.el = (sel, el=document) => F.guard(el.querySelector(sel));
Q.doc = (sel) => Q.el(sel, document);
Q.one = (sel, el=document) => el.querySelector(sel);
Q.all = (sel, el=document) => el.querySelectorAll(sel);

const Util = {
  newEl: (type, propsOrString) => {
    const el = document.createElement(type);
    if (typeof(propsOrString) === 'string') {
      el.innerHTML = propsOrString;
    } else {
      for (let prop in propsOrString) {
        el[prop] = propsOrString[prop];
      }
    }
    return el;
  },
  isInput: el => (
    ['INPUT', 'TEXTAREA'].indexOf(el.tagName) >= 0 || el.contentEditable === 'true'),
  isVisible: el => {
    // + window.getComputedStyle(el).visibility !== 'hidden' maybe?
    // This getBoundingClientRect thing doesn't seem corect for all cases.
    const rect = el.getBoundingClientRect();
    const W = window.innerWidth || document.documentElement.clientWidth;
    const H = window.innerHeight || document.documentElement.clientHeight;
    const visible = rect.width && rect.height;
    const inBounds = 0 <= rect.x && rect.x <= W && 0 <= rect.y && rect.y <= H;
    return visible && inBounds;
  }
}


// cf. https://www.w3schools.com/howto/howto_js_snackbar.asp
// TODO(tk) could cache elements for speed, but I don't expect to use this a lot
Util.toast = text => {
  const toast = Util.newEl('div', {className: '__util_toast', innerHTML: text});
  document.body.prepend(toast);
  setTimeout(() => toast.remove() || style.remove(), 3000);
  return toast;
}

Util.sidebar = content => {
  const side = Util.newEl('div', {className: '__util_side'});
  side.appendChild(content);

  let _open = false;
  function _stoggle() {
    let width = _open ? 0 : '250px';
    let inner = _open ? '&larr;' : '&times;';
    Q.el('.__util_sbtn').then(el => el.innerHTML = inner);
    Q.el('.__util_side').then(el => el.style.width = width);
    document.body.style.marginLeft = width;
    _open = !_open;
  }

  document.body.prepend(Util.newEl('button',
    {className:'__util_sbtn', onclick: _stoggle, innerHTML: '&larr;'}));
  document.head.appendChild(style);
  document.body.prepend(side);

  return side;
};

Util.observe = (f, el=document.body, opts={childList:true, subtree:true}) => {
  const observer = new MutationObserver(f);
  observer.observe(el, opts);
  return observer;
}

const Shortcut = {
  sel: (k, sel, ...mods) => ({k:k, sel:sel, mods:mods}),
  fun: (k, fn, ...mods) => ({k:k, fn:fn, mods:mods}),
  // 'a'.charCodeAt() == 96, e.which == 65 for 'a'
  kcode: k => k.charCodeAt ? k.charCodeAt() - 32 : k,
};

Shortcut.init = shortcuts => Shortcut._init(
  Array.isArray(shortcuts) ? shortcuts : Object.entries(shortcuts).flatMap(
    str2shortObj => str2shortObj[1].map(Shortcut.norm(str2shortObj[0]))
    // Consider: sort by #modifiers and pick only one shortctut in init
    //.sort((x, y) => y.mods.length - x.mods.length)
))

Shortcut._init = shortcuts => e => shortcuts.forEach(shortcut => {
  if (shortcut.mods.every(mod => mod(e)) && e.which == shortcut.k) {
    // If s.fn returns true (was invoked), don't click anything
    (shortcut.fn && shortcut.fn(e)) || shortcut.sel.forEach(
      F.bestEffort(s => Q.one(s).click()));
    (e.stopPropagation && e.stopPropagation());
  }
});

Shortcut.norm = (...modKeys) => F.retSelf(shortcut => {
  shortcut.k = Shortcut.kcode(shortcut.k);
  if (shortcut.fn) shortcut.fn = F.retTrue(shortcut.fn);
  if (!Array.isArray(shortcut.sel)) shortcut.sel = [shortcut.sel];
  shortcut.mods = (shortcut.mods||[]).concat(modKeys).map(m => ({
    s:e => e.ShiftKey, a: e => e.altKey, c: e => e.ctrlKey, m: e => e.metaKey,
  })[m])
});

