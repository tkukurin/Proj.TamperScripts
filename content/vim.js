
// TODO pretty sure this can be managed from Chrome somehow
// Similar with the shortcuts themselves.
const Settings = {
  preventBubble: true, // prevent event bubbling if shortcuts clash
  scrollBy: 50,
}

class State {
  constructor() { this.storage = localStorage; }
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
          this.storage.setItem(window.location.host, 0);
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
      this.storage.setItem(window.location.host, 1);
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
      case 'y': return new YankState();
    }
    return this;
  }
}


// TODO(tk) improve the heuristics (moz-readability-like?).
// TODO(tk) consolidate some elements with FollowState.
/** Copy text verbatim from heuristically selected elements. */
class YankState extends State {
  static #visibleElemsWithHints(chars) {
    const text = document.querySelectorAll('p,li,td,h1,h2,h3,h4,h5').filter(
      Util.isVisible);
    const maxlen = Math.pow(chars.length, 2)
    if (text.length > maxlen) {
      console.warn(`Found ${text.length} links (> ${maxlen})`);
    }
    return text.slice(0, maxlen).map((el, i) => {
      const hint = chars[parseInt(i / chars.length)] + chars[i % chars.length];
      el.append(Util.newEl('div', {className: '__vim_follow', innerHTML: hint}));
      return {hint, el};
    });
  }

  constructor() {
    super();
    this.texts = YankState.#visibleElemsWithHints('asdfqwerzxcvplmokijn');
    this.accum = '';
  }

  nextHook(c) {

    switch(c) { // for now this is just excluded from the list of hint chars
      case 't': // yank title
        const url = window.location.href;
        const show = document.querySelector('h1').innerText || window.location.host;
        navigator.clipboard.writeText(`[${show}](${url})`);
        Util.toast('Copied title.');
        return this.reset();
    }

    this.accum += c;
    this.texts = this.texts.filter(({hint, el}) =>
      hint.startsWith(this.accum) || el.lastChild.remove());
    let found = this.texts.find(({hint, _}) => hint == this.accum);
    let ret = this;
    if (found || !this.texts) {
      ret = this.reset(); // purposefully before copy - rm hints from inner text
      navigator.clipboard.writeText(found?.el.innerText)
    }
    return ret;
  }

  resetHook() { this.texts.forEach(({_, el}) => el.lastChild.remove()); }
}

class FollowState extends State {
  static OPEN_TAB = 'F';
  static OPEN_CUR = 'f';
  static #visibleElemsWithHints(chars) {
    const clickables = document.querySelectorAll('a,button').filter(
      Util.isVisible);
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

const storedNull = localStorage.getItem(window.location.host) == 0
let s = storedNull ? new NullState() : new State().reset();
console.log('Vim shortcuts loaded: ', storedNull, s);
console.log(Settings);
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

