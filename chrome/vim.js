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
  repr: null,
  attached: {},
  val: '',

  is: function(c) {
    return this.repr && this.repr.startsWith(c);
  },
  next: function(c) {
    if (this.is('f')) {
      this.val += c;
      return parseInt(this.val);
    } else {
      this.repr = this.repr == c ? null : c;
      return this.repr;
    }
  },
  reset: function() {
    Object.values(this.attached).forEach(
      el => el.children[el.children.length - 1].remove());
    this.repr = null;
    this.attached = {};
    this.val = '';
  }
}

function isVisible(el) {
  // cf. https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
  const rect = el.getBoundingClientRect();
  const W = document.body.offsetWidth;
  const H = document.body.offsetHeight;
  const visible = rect.width && rect.height;
  const inBounds = 0 <= rect.x && rect.x <= W && 0 <= rect.y && rect.y <= H;
  return visible && inBounds;
}

const Util = {};
Util.newEl = (type, propsOrString) => {
  const el = document.createElement(type);
  if (typeof(propsOrString) === 'string') {
    el.innerHTML = propsOrString;
  } else {
    for (let prop in propsOrString) {
      el[prop] = propsOrString[prop];
    }
  }
  return el;
}

/* some style
  position: absolute;
  color: #302505 !important;
  background-color: #ffd76e !important;
  border-radius: 2px !important;
  padding: 2px !important;
  font-size: 8pt !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  border: 1px solid #ad810c;
  display: inline-block !important;
  vertical-align: middle !important;
  text-align: center !important;
  box-shadow: 2px 2px 1px rgba(0,0,0,0.25) !important;
*/
window.addEventListener('keydown', e => {
  if (INPUT_TAGS.indexOf(document.activeElement.tagName) >= 0
    || document.activeElement.contentEditable === 'true') {
    return;
  }

  if (e.key === 'Escape') {
    return State.reset();
  }

  if (State.is('f')) {
    const follow = State.next(e.key);
    if (follow >= 100) {
      return State.reset();
    }
    const link = State.attached[follow];
    if (link) {
      link.click();
      State.reset();
    }
    return;
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
      document.querySelectorAll('a').filter(isVisible).forEach((el, ix) => {
        const follow = ix + 10;
        // TODO move the style to soe css file or sth.
        el.append(Util.newEl('div', {
          style: `position: absolute; background: #ffd76e; color: #302505;
          border: 1px solid #ad810c; display: inline-block; text-align: center`,
          innerHTML: follow
        }));
        State.attached[follow] = el;
      });
      break;
  }

  State.next(e.key);
}, false);

