
// TODO pretty sure this can be managed from Chrome somehow
// Similar with the shortcuts themselves.
const Settings = {
  preventBubble: true, // prevent event bubbling if shortcuts clash
  scrollBy: 50,
}

console.log('Vim shortcuts loaded');
console.log(Settings);

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
    const focused = document.activeElement;
    if (e.metaKey || e.altKey || e.ctrlKey) return this;
    if (Util.isInput(focused) || e.key === 'Escape') return this.reset();
    if (Settings.preventBubble && !e.ctrlKey) {  // ctrl = chrome shortcuts
      e.cancelBubble = true;
      e.preventDefault();
      e.stopPropagation();
    }
    return this.nextHook(e.key);
  }
  reset() { this.resetHook(); return new BaseState(); }
  nextHook() { return this; }
  resetHook() { return this; }
}

class NullState extends State {
  constructor() {
    super();
    console.log("[VIM DBG] Disabling");
  }
  next(e) {
    if (e.altKey && e.key == 'q') {
      console.log("[VIM DBG] Enabling");
      return this.reset();
    }
    return this;
  }
}

class BaseState extends State {
  nextHook(c) {
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

      case 'f': return new FollowState('cur');
      case 'F': return new FollowState('tab');
      case 'm': return new MarkState();
    }
    return this;
  }
  reset() { return this; }
}

class FollowState extends State {
  static #getVisibleWithHints(cs) {
    const clickables =
      document.querySelectorAll('a').concat(document.querySelectorAll('button'));
    if (clickables.length > Math.pow(cs.length, 2)) {
      throw `TODO: would produce duplicates (${clickables.length} links)`;
    }
    return clickables.filter(Util.isVisible).map((el, i) => {
      const hint = cs[parseInt(i / cs.length)] + cs[i % cs.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: hint}));
      return {hint, el};
    });
  }

  constructor(target='cur') {
    super();
    this.clickEvent = new MouseEvent(
      'click', (target == 'tab' && {ctrlKey:true}) || {});
    this.links = FollowState.#getVisibleWithHints('asdfqwertzxcvplmokijn');
    this.accum = '';
  }

  nextHook(c) {
    this.accum += c;
    this.links = this.links
      .filter(v => v.hint.startsWith(this.accum) || v.el.lastChild.remove());
    let found = this.links.find(({hint, _}) => hint == this.accum);
    if (found || !this.links) {
      found?.el.dispatchEvent(this.clickEvent);
      return this.reset();
    }
    return this;
  }

  resetHook() { this.links.forEach(({_, el}) => el.lastChild.remove()); }
}

class Mark {
  constructor(pos, sel) {
    this.pos = pos || {x: window.pageXOffset, y: window.pageYOffset};
    this.sel = sel || window.getSelection()?.anchorNode;
    this.txt = this.sel?.data;
  }
}

class MarkState extends State {
  static Marks = {
    _marks: {'g': new Mark({x:0, y:0}, null) },  // global state :(
    set: function(c) { this._marks[c] = new Mark(); },
    get: function(c) { return this._marks[c]; }
  }
  nextHook(c) {
    switch(c) {
      case 'g': console.error('Mark g taken'); break; // gg to go (0, 0)
      default: MarkState.Marks.set(c);
    }
    return this.reset();
  }
}

class GotoState extends State {
  nextHook(c) {
    const mark = MarkState.Marks.get(c);
    window.scrollTo(mark.pos.x, mark.pos.y);
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
}, true);
document.addEventListener('keyup', e => {
  // fixes some bug w/ twitter script maybe? esc not triggered on keydown
  e.key === 'Escape' && (s = s.reset());
});

