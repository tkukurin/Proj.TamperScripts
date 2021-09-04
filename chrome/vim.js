console.log('Vim shortcuts loaded');

// TODO include? This is just c/p from utils.
NodeList.prototype.forEach = Array.prototype.forEach;
NodeList.prototype.flatMap = Array.prototype.flatMap;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;

const SCROLL_BY = 50;
const INPUT_TAGS = ['INPUT', 'TEXTAREA'];

// Awful global state wrapper. Works while script is smallish.
const State = {
  _repr: null, _val: '', _attached: {},

  attach: function(k, v) { return this._attached[k] = v; },
  attached: function(k) { return this._attached[k]; },
  is: function(c) { return this._repr && this._repr.startsWith(c); },
  next: function(c) {
    if (this.is('f')) {
      this._val += c;
      return parseInt(this._val);
    } else {
      this._repr = this._repr == c ? null : c;
      return this._repr;
    }
  },
  reset: function() {
    Object.values(this._attached).forEach(
      el => el.children[el.children.length - 1].remove());
    this._repr = null;
    this._val = '';
    this._attached = {};
  }
}

const Util = {
  mk: (type, propsOrString) => {
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
    INPUT_TAGS.indexOf(el.tagName) >= 0 || el.contentEditable === 'true'),
  isVisible: el => {
    // cf. https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    const rect = el.getBoundingClientRect();
    const W = document.body.offsetWidth;
    const H = document.body.offsetHeight;
    const visible = rect.width && rect.height;
    const inBounds = 0 <= rect.x && rect.x <= W && 0 <= rect.y && rect.y <= H;
    return visible && inBounds;
  }
}

window.addEventListener('keydown', e => {
  if (Util.isInput(document.activeElement) || e.key === 'Escape') {
    return State.reset();
  }

  if (State.is('f')) {
    const follow = State.next(e.key);
    State.attached(follow)?.click();
    return follow >= 10 && State.reset();
  }

  const pageHeight = document.documentElement.scrollHeight;
  switch (e.key) {
    // up
    case 'k': case 'w': window.scrollBy(0, -SCROLL_BY); break;
    case 'u': window.scrollBy(0, -SCROLL_BY * 2); break;

    // down
    case 'j': case 's': window.scrollBy(0, SCROLL_BY); break;
    case 'd': window.scrollBy(0, SCROLL_BY * 2); break;

    // left / right
    case 'l': window.scrollBy(SCROLL_BY, 0); break;
    case 'h': window.scrollBy(-SCROLL_BY, 0); break;

    // full
    case 'G': window.scrollBy(0, pageHeight); break;
    case 'g': window.scrollBy(0, State.is('g') * -pageHeight); break;

    // history (return, no State change / fallthrough)
    case 'H': return window.history.back();
    case 'L': return window.history.forward();

    // follow
    case 'f':
      document.querySelectorAll('a').filter(Util.isVisible).forEach((el, i) => {
        const k = i + 10;  // start from double digits (90 labels total).
        el.append(Util.mk('div', {className: '__vim_follow', innerHTML: k}));
        State.attach(k, el);
      });
      break;
  }

  State.next(e.key);
}, false);

