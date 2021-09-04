console.log('Vim shortcuts loaded');

const SCROLL_BY = 50;

class State {
  next(e) {
    if (e.altKey && e.key == 'q') {
      return new NullState();
    }
    if (e.metaKey || e.altKey || e.ctrlKey) {
      return this;
    }
    if (Util.isInput(document.activeElement) || e.key === 'Escape') {
      return this.reset();
    }
    return this._next(e.key);
  }
  _next() {}
  reset() { this._reset(); return new BaseState(); }
  _reset() {}
}

class NullState extends State {
  constructor() { super(); console.log("[VIM DBG] Disabling"); }
  next(e) {
    if (e.altKey && e.key == 'q') {
      console.log("[VIM DBG] Enabling");
      return this.reset();
    }
    return this;
  }
}

class BaseState extends State {
  _next(c) {
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
      case 'g': return new GotoState();

      // history (return, no State change / fallthrough)
      case 'H': window.history.back(); break;
      case 'L': window.history.forward(); break;

      case 'f': return new FollowState();
      case 'm': return new MarkState();
    }
    return this;
  }
  reset() { return this; }
}

class FollowState extends State {
  constructor() {
    super();
    const _me = this;
    _me.links = {};
    _me.follow = '';
    // TODO
    //const clickables = (document.querySelectorAll('a').concat(
    // document.querySelectorAll('button'));
    const chars = 'asdfqwertzxcv';  // or const k = i + 10?
    document.querySelectorAll('a').filter(Util.isVisible).forEach((el, i) => {
      const k = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: k}));
      _me.links[k] = el;  // kinda implicitly assume < chars^2 links on screen
    });
  }
  _next(c) {
    this.follow += c;
    if (this.follow.length >= 2) {
      this.links[this.follow]?.click();
      return this.reset();
    }
    return this;
  }
  _reset() { Object.values(this.links).forEach(e => e.lastChild.remove()); }
}

class MarkState extends State {
  class Mark {
    constructor(c) {
      this.pos = {x: window.pageXOffset, y: window.pageYOffset};
      this.sel = window.getSelection()?.anchorNode;
      this.txt = this.sel?.data;
    }
  }
  static Marks = {
    _marks: {},  // global state :(
    set: function(c) { this._marks[c] = new Mark(c); },
    get: function(c) { return this._marks[c]; }
  }
  _next(c) {
    switch(c) {
      case 'g': console.error('Mark g taken'); break;
      default: MarkState.Marks.set(c);
    }
    return this.reset();
  }
}

class GotoState extends State {
  _next(c) {
    const pageHeight = document.documentElement.scrollHeight;
    switch(c) {
      case 'g': window.scrollBy(0, -pageHeight); break;
      default:
        const mark = MarkState.Marks.get(c);
        window.scrollTo(mark.pos.x, mark.pos.y);
    }
    return this.reset();
  }
}

let s = new BaseState();
window.addEventListener('keydown', e => (s = s.next(e)), false);

