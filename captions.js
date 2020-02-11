// ==UserScript==
// @name         CaptionTracker
// @namespace    tkukurin
// @version      0.1
// @description  Track `maxCaptions` captions from given element and
//               container selectors. Usage: include into TamperMonkey scripts.
// @author       Toni Kukurin
// @grant        none
// ==/UserScript==

class CaptionTracker {
  constructor(maxCaptions, captionContainerSelector, captionSelector) {
    this.containerSelector = captionContainerSelector;
    this.isActive = false;
    this.captions = new Array(maxCaptions).fill('');
    this.cIndex = 0;
    const _me = this;
    this.observer = new MutationObserver(mutations => {
      for (let m of mutations) {
        if (m.target.matches(captionSelector)) {
          _me.update(m.target.innerText.split('\n'));
          break;
        }
      }
    });
  }

  update(textLines) {
    const prev = this.captions[this.cIndex];
    const part = prev.substr(0, Math.min(prev.length, 10));
    if (!(textLines[0]).startsWith(part)) {
      this.cIndex = (this.cIndex + 1) % this.captions.length;
    }

    this.captions[this.cIndex] = textLines[0];
    this.captions[(this.cIndex+1) % this.captions.length] = textLines[1] || '';
    return this;
  }

  reset(isActive) {
    this.captions.fill('');
    this.isActive = isActive;
    if (!this.isActive) {
      this.observer.disconnect();
    } else {
      const opts = {childList: true, subtree: true};
      Q.doc(this.containerSelector).then(el => this.observer.observe(el, opts));
    }
  }

  get() {
    const ci = this.cIndex;
    const text1 = this.captions.slice(0, ci + 2).join('\n');
    const text2 = this.captions.slice(ci + 2, this.captions.length).join('\n');
    return `${text2}\n${text1}`.trim();
  }
}

