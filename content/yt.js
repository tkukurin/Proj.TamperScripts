// ==UserScript==
// @name         CaptionCopy
// @namespace    tkukurin
// @version      1.0
// @description  Copy captions from video.
// @author       Toni Kukurin
// @match        https://www.youtube.com/*
// @require      file:///home/toni/.config/tampermonkey/include.js
// @require      file:///home/toni/.config/tampermonkey/captions.js
// @grant        none
// ==/UserScript==

console.log("Caption plugin loaded");

(function() {
  function timeToUrl(timeStr) {
    const id = /\?v\=([^&]+)/g.exec(window.location.search);
    return (id && `https://youtu.be/${id[1]}?t=${timeStr}`) ||
      window.location.href.replace(/&t\=[^&]+/, `&t=${timeStr}`);
  }

  function copyUrl(withCaptions) {
    // NOTE(tk) `?t=vid.currentTime` also works but h/m/s is semantically nicer
    const vid = document.querySelector('video');
    const subs = window.tamperSubs;
    const t = vid.currentTime;
    // TODO copy things *around* current captions
    const maybeCaptions = (withCaptions && subs && subs.around(t).content) || '';
    const timeStr = [t/3600, (t/60)%60, (t%60)].map(n => parseInt(n)).map(
      (n, i) => n ? `${n}${'hms'[i]}` : '').join('');
    const url = timeToUrl(timeStr);
    const mdTimeCaptions = `[@${timeStr}](${url})\n${maybeCaptions}`.trim();
    navigator.clipboard.writeText(mdTimeCaptions);
    Util.toast(`Copied time ${maybeCaptions ? 'with' : 'without'} captions`);
  }

  class Subtitles {
    constructor(subtitleDivs) {
      const subtitles = [];
      for (let subtitleDiv of subtitleDivs) {
        let innerDivs = subtitleDiv.querySelectorAll('div');
        if (!innerDivs || innerDivs.length < 3) continue;
        let timeStr = innerDivs[0].innerText.trim();
        let tstamp = timeStr.split(':').map(n => parseInt(n)).reverse()
          .map((n, i) => (n * Math.pow(60, i)))
          .reduce((a, b) => a + b);
        let content = innerDivs[2].innerText.trim();
        subtitles.push({timeStr, tstamp, content});
      }

      this.subtitles = subtitles;
    }

    around(key, pre=5, post=5) {
      const i = this.getIndex(key);
      const subs = this.subtitles.slice(Math.max(0, i - pre), i + post);
      const content = subs.map(s => s.content).join("\n");
      return { content, tstamp: subs[0].tstamp, timeStr: subs[0].timeStr }
    }

    get(key) {
      return this.subtitles[this.getIndex(key)];
    }

    getIndex(key) {
      let start = 0;
      let end = this.subtitles.length;
      while (start < end) {
        let mid = Math.ceil((start + end) / 2);
        if (this.subtitles[mid].tstamp > key) end = mid - 1;
        else start = mid;
      }
      return start;
    }
  }

  class Retry {
    #sleepMs = 100
    #maxRetries = 7
    static sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    async call(fn) {
      for (let i = 0; i < this.#maxRetries; i++) {
        await Retry.sleep(this.#sleepMs);
        let result = fn();
        if (result) return result;
      }
      throw `Retry failed after ${this.maxRetries} at ${this.sleepMs}ms`;
    }
  }

  async function subtitleTrackToggle() {
    const subtitleWrapSel = '#body > ytd-transcript-body-renderer';

    if (!document.querySelector(subtitleWrapSel)) {
      document.querySelector('#button > yt-icon.ytd-menu-renderer').click();
      await Retry.sleep(250);
      const openTranscriptItem = Array.from(document.querySelectorAll(
        `tp-yt-iron-dropdown.ytd-popup-container
        #contentWrapper ytd-menu-service-item-renderer`))
        .find(el => el.textContent.match("Open transcript"));
      if (!openTranscriptItem) return Util.toast('No transcript item found!');
      openTranscriptItem.click();
    }

    new Retry().call(() => {
      let subtitleWrap = document.querySelector(subtitleWrapSel);
      if (subtitleWrap && (divs = subtitleWrap.querySelectorAll('div'))) {
        return new Subtitles(divs);
      }
    }).then(subs => {
      window.tamperSubs = subs;
      Util.toast('Tracking with captions');
    }).catch(msg => {
      console.err(msg);
      Util.toast('Failed getting captions');
    });
  }

  window.onkeyup = document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('a', () => copyUrl(false)),
      Shortcut.fun('c', () => copyUrl(true)),
      Shortcut.fun('v', toggleTrack),
      Shortcut.fun('w', () => {  // why w? no particular reason.
        const title = document.querySelector(
          "#info h1.title.ytd-video-primary-info-renderer").textContent;
        const url = timeToUrl("0");
        navigator.clipboard.writeText(`[${title}](${url})`);
        Util.toast(`Copied title`);
      }),

      Shortcut.sel('i', '.ytp-miniplayer-button'),
      Shortcut.sel('i', '.ytp-miniplayer-expand-watch-page-button'),

      Shortcut.sel('m', '.ytp-mute-button'),
      Shortcut.sel('t', '.ytp-size-button'),
      Shortcut.sel('s', '.ytp-subtitles-button'),
      Shortcut.sel('b', '.ytp-fullscreen-button'),

      Shortcut.fun('o', subtitleTrackToggle),
    ],
    m: [Shortcut.sel('b', '.ytp-fullscreen-button.ytp-button'),]
  });

})();
