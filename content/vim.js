console.log('Vim shortcuts loaded');

const SCROLL_BY = 50;

class FollowState {
  constructor() {
    const _me = this;
    _me.links = {};
    _me.follow = '';
    const chars = "asdfqwertzxcv";  // or const k = i + 10?
    document.querySelectorAll('a').filter(Util.isVisible).forEach((el, i) => {
      const k = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: k}));
      _me.links[k] = el;
    });
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
  reset() { Object.values(this.links).forEach(e => e.lastChild.remove()); }
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

