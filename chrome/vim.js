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
    const link = State.attached[follow];
    if (link) {
      link.click(); // window.location.href = link.href;
      State.reset();
    }
    return;
  }

  let scrollY = 0;
  let scrollX = 0;
  const pageHeight = document.documentElement.scrollHeight;
  switch (e.key) {
    // up
    case 'k': case 'w': scrollY = -SCROLL_BY; break;
    case 'u': scrollY = -SCROLL_BY * 2; break;

    // down
    case 'j': case 's': scrollY = SCROLL_BY; break;
    case 'd': scrollY = SCROLL_BY * 2; break;

    // left / right
    case 'l': scrollX = SCROLL_BY; break;
    case 'h': scrollX = -SCROLL_BY; break;

    // full
    case 'G': scrollY = pageHeight; break;
    case 'g': scrollY = State.is('g') * -pageHeight; break;

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
  }

  window.scrollBy(scrollX, scrollY);
  State.next(e.key);
}, false);


