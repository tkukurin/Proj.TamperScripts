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

(function() {
  const captionTracker = new CaptionTracker(
    100, '#player-container', '.captions-text');
  window.captionTracker = captionTracker;

  function copyUrl() {
    function timeToUrl(timeStr) {
      const id = /\?v\=([^&]+)/g.exec(window.location.search);
      const url = (id && `https://youtu.be/${id[1]}?t=${timeStr}`) ||
        window.location.href.replace(/&t\=[^&]+/, `&t=${timeStr}`);
      return {t: timeStr, url: url};
    }
    // NOTE(tk) could also just use ?t=vid.currentTime
    // but having h/m/s is semantically nicer
    Q.doc('video')
      .then(vid => vid.currentTime)
      .then(time => [time/3600, (time/60)%60, (time%60)])
      .then(ts => ts.map(n => parseInt(n)))
      .then(ts => ts.map((n, i) => n ? `${n}${'hms'[i]}`.padStart(3, 0) : ''))
      .then(tsWithTime => tsWithTime.join(''))
      .then(timeToUrl)
      .then(({t, url}) => `[@${t}](${url})\n${captionTracker.get()}`.trim())
      .then(copyText => navigator.clipboard.writeText(copyText))
      .then(_ => Util.toast(
        `Copied time ${captionTracker.isActive ? 'with' : 'without'} captions`));
  }

  function ensureSubtitles() {
    return Q.el('.ytp-subtitles-button')
      .then(el => el.ariaPressed === 'true' || el.click())
  }

  function subtitleTrackToggle() {
    captionTracker.reset(!captionTracker.isActive);
    if (captionTracker.isActive) {
      ensureSubtitles().then(_ => Util.toast('Captions on'));
    } else {
      Util.toast('Captions off');
    }
  }

  window.onkeyup = document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('a', copyUrl),
      Shortcut.fun('l', copyUrl),

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
