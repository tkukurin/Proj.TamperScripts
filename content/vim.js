console.log('Vim shortcuts loaded');

const Settings = {
  preventBubble: false, // prevent event bubbling if shortcuts clash
  scrollBy: 50,
}

class State {
  next(e) {
    if (e.altKey) {
      switch (e.key) {
        case 'q': return new NullState();
        case 'p':
          Settings.preventBubble = !Settings.preventBubble;
          console.log(Settings);
      }
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
    switch (c) {
      // up
      case 'k': case 'w': window.scrollBy(0, -Settings.scrollBy); break;
      case 'u': window.scrollBy(0, -Settings.scrollBy * 2); break;

      // down
      case 'j': case 's': window.scrollBy(0, Settings.scrollBy); break;
      case 'd': window.scrollBy(0, Settings.scrollBy * 2); break;

      // left / right
      case 'l': window.scrollBy(Settings.scrollBy, 0); break;
      case 'h': window.scrollBy(-Settings.scrollBy, 0); break;

      // full
      case 'G': window.scrollBy(0, document.documentElement.scrollHeight); break;
      case 'g': return new GotoState();

      // history (return, no State change / fallthrough)
      case 'H': window.history.back(); break;
      case 'L': window.history.forward(); break;

      case 'f': return new FollowState();
      case 'F': return new FollowState('tab');
      case 'm': return new MarkState();
    }
    return this;
  }
  reset() { return this; }
}

class FollowState extends State {
  constructor(target='') {
    super();
    this.openOpts = (target==='tab') ? {ctrlKey: true} : {};
    this.follow = '';
    const clickables =
      document.querySelectorAll('a').concat(document.querySelectorAll('button'));
    const chars = 'asdfqwertzxcvplmokijn';
    if (clickables.length > chars.length * chars.length) {
      throw `TODO: This would produce duplicates (${clickables.length} links)`;
    }
    this.links = clickables.filter(Util.isVisible).map((el, i) => {
      const k = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: k}));
      return {hint:k, el: el};
    });
  }
  _next(c) {
    this.follow += c;
    this.links = this.links
      .filter(v => v.hint.startsWith(this.follow) || v.el.lastChild.remove());
    let found = this.links.find(({hint, el}) => hint == this.follow);
    if (found || !this.links) {
      found?.el.dispatchEvent(new MouseEvent("click", this.openOpts));
      return this.reset();
    }
    return this;
  }
  _reset() { this.links.forEach(({_, el}) => el.lastChild.remove()); }
}

class Mark {
  constructor(c) {
    this.pos = {x: window.pageXOffset, y: window.pageYOffset};
    this.sel = window.getSelection()?.anchorNode;
    this.txt = this.sel?.data;
  }
}

class MarkState extends State {
  static Marks = {
    _marks: {},  // global state :(
    set: function(c) { this._marks[c] = new Mark(c); },
    get: function(c) { return this._marks[c]; }
  }
  _next(c) {
    switch(c) {
      // ugly sync with GotoState
      case 'g': console.error('Mark g taken'); break;
      default: MarkState.Marks.set(c);
    }
    return this.reset();
  }
}

class GotoState extends State {
  _next(c) {
    switch(c) {
      case 'g': window.scrollTo(0, 0); break;
      default:
        const mark = MarkState.Marks.get(c);
        window.scrollTo(mark.pos.x, mark.pos.y);
    }
    return this.reset();
  }
}

let s = new BaseState();
document.addEventListener('keydown', e => {
  try {
    s = s.next(e);
  } catch(e) {
    console.error("[VIM] ", e);
    s = new NullState();
  }

  if (Settings.preventBubble) {
    e.cancelBubble = true;
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
document.addEventListener('keyup', e => {
  // fixes some bug w/ twitter script maybe? esc not triggered on keydown
  e.key === 'Escape' && (s = s.reset());
});

