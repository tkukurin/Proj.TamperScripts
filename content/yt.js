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
  function copyUrl(withCaptions) {
    function timeToUrl(timeStr) {
      const id = /\?v\=([^&]+)/g.exec(window.location.search);
      return (id && `https://youtu.be/${id[1]}?t=${timeStr}`) ||
        window.location.href.replace(/&t\=[^&]+/, `&t=${timeStr}`);
    }
    // NOTE(tk) `?t=vid.currentTime` also works but h/m/s is semantically nicer
    const vid = document.querySelector('video');
    const subs = window.tamperSubs;
    const t = vid.currentTime;
    // TODO copy things *around* current captions
    const maybeCaptions = (withCaptions && subs && subs.get(t).content) || '';
    const timeStr = [t/3600, (t/60)%60, (t%60)].map(n => parseInt(n)).map(
      (n, i) => n ? `${n}${'hms'[i]}` : '').join('');
    const url = timeToUrl(timeStr);
    const cpText = `[@${timeStr}](${url})\n${maybeCaptions}`.trim();
    navigator.clipboard.writeText(cpText);
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

  async function subtitleTrackToggle() {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    let subtitleWrap = document.querySelector(
      '#body > ytd-transcript-body-renderer');

    if (!subtitleWrap) {
      document.querySelector('#button > yt-icon.ytd-menu-renderer').click();
      await sleep(250);
      const clickToShowSubs = document.querySelector(
        `#items > ytd-menu-service-item-renderer:nth-child(2) >
         tp-yt-paper-item > yt-formatted-string`);
      if (!clickToShowSubs) return Util.toast('No subs!');
      clickToShowSubs.click();
    }

    for (let i = 0; i < 7; i++) {
      await sleep(100);
      subtitleWrap = document.querySelector(
        '#body > ytd-transcript-body-renderer');
      if (subtitleWrap && (divs = subtitleWrap.querySelectorAll('div'))) {
        const subtitles = new Subtitles(divs);
        window.tamperSubs = subtitles;
        return Util.toast('Captions on');
      }
    }

    Util.toast('Failed getting captions');
  }

  window.onkeyup = document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('a', () => copyUrl(false)),
      Shortcut.fun('c', () => copyUrl(true)),

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
