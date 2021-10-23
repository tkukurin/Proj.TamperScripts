// ==UserScript==
// @name         CaptionTracker
// @namespace    tkukurin
// @version      0.1
// @description  Track `maxCaptions` captions from given element and container.
// @author       Toni Kukurin
// @grant        none
// ==/UserScript==


// @deprecated: YT allows you to view *all* captions from the bar under video.
// Thus I don't think this stuff is really necessary.
class CaptionTracker {
  constructor(maxCaptions, captionContainerSelector, captionSelector) {
    this.containerSelector = captionContainerSelector;
    this.isActive = false;
    this.times = new Array(maxCaptions).fill(0);
    this.captions = new Array(maxCaptions).fill('');
    // start and end indices of the last captions added
    this.startIdx = 0;
    this.endIdx = -1;  // to match update on 1st iteration
    const _me = this;
    this.observer = new MutationObserver(mutations => {
      for (let m of mutations) {
        if (m.target.matches(captionSelector)) {
          Q.el('video').then(vid => vid.currentTime)
            .then(time => _me.update(time, m.target.innerText.split('\n')));
          break;
        }
      }
    });
    this.reset(true);
  }

  update(time, textLines) {
    const heuristicCharCount = 10;
    const wrapIdx = i => (i + this.captions.length) % this.captions.length;

    for (; this.startIdx != wrapIdx(this.endIdx + 1);
            this.startIdx = wrapIdx(this.startIdx + 1)) {
      let part = this.captions[this.startIdx].substr(0, heuristicCharCount);
      if (textLines[0].startsWith(part)) break;
    }

    this.endIdx = this.startIdx;
    for (let j = 0; j < textLines.length; j++) {
      this.endIdx = wrapIdx(this.endIdx + j);
      this.captions[this.endIdx] = textLines[j];
      this.times[this.endIdx] = time;
    }

    return this;
  }

  _resetCaptions() {
    this.times.fill(0);
    this.captions.fill('');
    this.startIdx = this.endIdx = 0;
  }

  reset(isActive) {
    this._resetCaptions();
    this.isActive = isActive;
    if (!this.isActive) {
     this.observer.disconnect();
    } else {
      const opts = {childList: true, subtree: true};
      Q.el(this.containerSelector).then(el => this.observer.observe(el, opts));
    }
    return this;
  }

  get() {
    // Get subtitles in sequence as they appeared.
    const ci = this.endIdx;
    const text1 = this.captions.slice(0, ci + 2).join('\n');
    const text2 = this.captions.slice(ci + 2, this.captions.length).join('\n');
    return `${text2}\n${text1}`.trim();
  }
}

