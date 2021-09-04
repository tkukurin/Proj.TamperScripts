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
      const url = (id && `https://youtu.be/${id[1]}?t=${timeStr}`) ||
        window.location.href.replace(/&t\=[^&]+/, `&t=${timeStr}`);
      return {t: timeStr, url: url};
    }
    const tracker = window.captionTracker;
    const maybeCaptions = withCaptions && tracker ? tracker.get() : '';
    // NOTE(tk) `?t=vid.currentTime` also works but h/m/s is semantically nicer
    Q.doc('video')
      .then(vid => vid.currentTime)
      .then(time => [time/3600, (time/60)%60, (time%60)])
      .then(ts => ts.map(n => parseInt(n)))
      .then(ts => ts.map((n, i) => n ? `${n}${'hms'[i]}` : ''))
      .then(tsWithTime => tsWithTime.join(''))
      .then(timeToUrl)
      .then(({t, url}) => `[@${t}](${url})\n${maybeCaptions}`.trim())
      .then(copyText => navigator.clipboard.writeText(copyText))
      .then(_ => Util.toast(
        `Copied time ${maybeCaptions ? 'with' : 'without'} captions`));
  }

  function ensureSubtitles() {
    return Q.el('.ytp-subtitles-button')
      .then(el => el.ariaPressed === 'true' || el.click())
  }

  function subtitleTrackToggle() {
    if (!window.captionTracker) {
      window.captionTracker = new CaptionTracker(
        100, '#player-container', '.captions-text');
      ensureSubtitles().then(_ => Util.toast('Captions on'));

      // So long as you are staying in the same yt session,
      // keep tracking subtitles but reset them when switching videos.
      let curHref = document.location.href;
      window.hrefObserver = new MutationObserver((_, self) => {
        if (curHref != document.location.href) {
          window.captionTracker.reset(true);
          curHref = document.location.href;
        }
      });
      window.hrefObserver.observe(document.body, {childList:true, subtree:true});
    } else {
      window.hrefObserver.disconnect();
      // necessary to deactivate observer
      window.captionTracker.reset(false);

      window.captionTracker = null;
      window.hrefObserver = null;

      Util.toast('Captions off');
    }
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
