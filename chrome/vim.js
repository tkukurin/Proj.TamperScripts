console.log('Vim shortcuts loaded');

// TODO include? This is just c/p from utils.
NodeList.prototype.forEach = Array.prototype.forEach;
NodeList.prototype.flatMap = Array.prototype.flatMap;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;

const SCROLL_BY = 50;

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
    ['INPUT', 'TEXTAREA'].indexOf(el.tagName) >= 0 || el.contentEditable === 'true'),
  isVisible: el => {
    // + window.getComputedStyle(el).visibility !== 'hidden' maybe?
    const rect = el.getBoundingClientRect();
    const W = document.body.offsetWidth;
    const H = document.body.offsetHeight;
    const visible = rect.width && rect.height;
    const inBounds = 0 <= rect.x && rect.x <= W && 0 <= rect.y && rect.y <= H;
    return visible && inBounds;
  }
}

class FollowState {
  constructor() {
    const _me = this;
    _me.links = {};
    _me.follow = '';
    const chars = "asdfqwertzxcv";  // or const k = i + 10?
    document.querySelectorAll('a').filter(Util.isVisible).forEach((el, i) => {
      const k = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.mk('div', {className: '__vim_follow', innerHTML: k}));
      _me.links[k] = el;
    });

    _me.reset = () => Object.values(_me.links).forEach(e => e.lastChild.remove());
  }
  next(c) {
    this.follow += c;
    if (this.follow.length >= 2) {
      this.links[this.follow]?.click();
      this.reset();
      return new BaseState();
    }
    return this;
  }
}

class GState {
  next(c) {
    const pageHeight = document.documentElement.scrollHeight;
    switch(c) {
      case 'g': window.scrollBy(0, -pageHeight); break;
    }
    return new BaseState();
  }
  reset() {}
}

class BaseState {
  next(c) {
    const pageHeight = document.documentElement.scrollHeight;
    switch (c) {
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
      case 'g': return new GState();

      // history (return, no State change / fallthrough)
      case 'H': window.history.back(); break;
      case 'L': window.history.forward(); break;

      case 'f': return new FollowState();
    }
    return this;
  }
  reset() {}
}

let s = new BaseState();
window.addEventListener('keydown', e => {
  if (Util.isInput(document.activeElement) || e.key === 'Escape') {
    s.reset();
    return (s = new BaseState());
  }

  s = s.next(e.key);
}, false);

