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
    // heuristic: assume still the same line if first K characters match
    // Subtitles are updated in chunks as they are spoken, not sure if there's
    // an easier way to get the same result.
    const prev = this.captions[this.cIndex];
    const heuristicCharCount = 10;
    const part = prev.substr(0, Math.min(prev.length, heuristicCharCount));
    if (!(textLines[0]).startsWith(part)) {
      this.cIndex = (this.cIndex + 1) % this.captions.length;
    }

    this.captions[this.cIndex] = textLines[0];
    this.captions[(this.cIndex+1) % this.captions.length] = textLines[1] || '';
    return this;
  }

  _resetCaptions() { this.captions.fill(''); }

  reset(isActive) {
    this._resetCaptions();
    this.isActive = isActive;
    if (!this.isActive) {
      this.observer.disconnect();
    } else {
      const opts = {childList: true, subtree: true};
      Q.doc(this.containerSelector).then(el => this.observer.observe(el, opts));
    }
    return this;
  }

  get() {
    // Get subtitles in sequence as they appeared.
    const ci = this.cIndex;
    const text1 = this.captions.slice(0, ci + 2).join('\n');
    const text2 = this.captions.slice(ci + 2, this.captions.length).join('\n');
    return `${text2}\n${text1}`.trim();
  }
}

