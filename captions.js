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
    this.reset(true);
  }

  update(textLines) {
    // heuristic: assume still the same line if first K characters match
    // Subtitles are updated in chunks as they are spoken, not sure if there's
    // an easier way to get the same result.
    const heuristicCharCount = 10;
    const wrapIdx = (idx, inc=1) => (idx + inc) % this.captions.length;
    const part = this.captions[this.cIndex].substr(0, heuristicCharCount);
    if (!textLines[0].startsWith(part)) {
      // increment current idx by 2 if neither textLines match the current line
      // (this means both subtitle lines changed at once, instead of a gradual
      // transition - usually happens if the video is sped up)
      let inc = 1 + (textLines[1] && !textLines[1].startsWith(part));
      this.cIndex = wrapIdx(this.cIndex, inc);
    }
    this.captions[this.cIndex] = textLines[0];
    this.captions[(this.cIndex+1) % this.captions.length] = textLines[1] || '';
    return this;
  }

  _resetCaptions() { this.captions.fill(''); this.cIndex = 0; }

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

