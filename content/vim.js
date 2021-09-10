
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
    const end = this.shortCircuit(e);
    if (end) return end;

    const focused = document.activeElement;
    if (Util.isInput(focused) || e.key === 'Escape') return this.reset();
    if (Settings.preventBubble && !e.ctrlKey) {  // ctrl = chrome shortcuts
      e.cancelBubble = true;
      e.preventDefault();
      e.stopPropagation();
    }
    return this.nextHook(e.key);
  }

  shortCircuit(e) {  // stops current vim state from executing
    if (e.altKey) {
      switch (e.key) {
        case 'q':
          return new NullState();
        case 'p':
          Settings.preventBubble = !Settings.preventBubble;
          console.log(Settings);
          break;
        case 'j': case 'k':
          chrome.runtime.sendMessage({cmd: 'tab', key: e.key});
      }
    }
    const endEarly = (e.altKey || e.metaKey || e.ctrlKey || e.code == 'Space'
      || e.code.startsWith('Arrow'));
    return endEarly ? this : null;

  }

  reset() {
    this.resetHook();
    return new BaseState(Settings.scrollBy);
  }

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
  constructor(scrollBy) { super(); this.scrollBy = scrollBy; }
  reset() { return this; }
  nextHook(c) {
    switch (c) {
      // up
      case 'k': case 'w': window.scrollBy(0, -this.scrollBy); break;
      case 'u': window.scrollBy(0, -this.scrollBy * 2); break;

      // down
      case 'j': case 's': window.scrollBy(0, this.scrollBy); break;
      case 'd': window.scrollBy(0, this.scrollBy * 2); break;

      // left / right
      case 'l': window.scrollBy(this.scrollBy, 0); break;
      case 'h': window.scrollBy(-this.scrollBy, 0); break;

      // full
      case 'G': window.scrollBy(0, document.documentElement.scrollHeight); break;
      case 'g': return new GotoState();

      // history
      case 'H': window.history.back(); break;
      case 'L': window.history.forward(); break;

      case FollowState.OPEN_CUR: case FollowState.OPEN_TAB:
        const follow = new FollowState(c);
        return follow.links.length ? follow : this;
      case 'm': return new MarkState();
    }
    return this;
  }
}

class FollowState extends State {
  static OPEN_TAB = 'F';
  static OPEN_CUR = 'f';
  static #visibleElemsWithHints(chars) {
    const clickables = document.querySelectorAll('a').concat(
      document.querySelectorAll('button')).filter(Util.isVisible);
    const maxlen = Math.pow(chars.length, 2)
    if (clickables.length > maxlen) {
      console.warn(`Found ${clickables.length} links (> ${maxlen})`);
    }
    return clickables.slice(0, maxlen).map((el, i) => {
      const hint = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: hint}));
      return {hint, el};
    });
  }

  constructor(open=FollowState.OPEN_CUR) {
    super();
    this.evt = new MouseEvent('click', {ctrlKey: open == FollowState.OPEN_TAB});
    this.links = FollowState.#visibleElemsWithHints('asdfqwertzxcvplmokijn');
    this.accum = '';
  }

  nextHook(c) {
    this.accum += c;
    this.links = this.links.filter(({hint, el}) =>
      hint.startsWith(this.accum) || el.lastChild.remove());
    let found = this.links.find(({hint, _}) => hint == this.accum);
    if (found || !this.links) {
      found?.el.dispatchEvent(this.evt);
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

let s = new State().reset()
document.addEventListener('keydown', e => {
  try {
    s = s.next(e);
  } catch(e) {
    console.error(e);
    s = new NullState();
  }
}, true);
document.addEventListener('keyup', e => {
  // fixes some bug w/ twitter script maybe? esc not triggered on keydown
  e.key === 'Escape' && (s = s.reset());
});

