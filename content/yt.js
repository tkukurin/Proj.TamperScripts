/**
 * Quick and dirty plugin to copy captions from a YT video.
 */

console.log("Caption plugin loaded");

const getVideo = () => document.querySelector('video');

function getUrl(timeStr) {
  const id = /\?v\=([^&]+)/g.exec(window.location.search);
  const suffix = (timeStr && `?t=${timeStr}`) || '';
  return (id && `https://youtu.be/${id[1]}${suffix}`) ||
    window.location.href.replace(/&t\=[^&]+/, `&t=${timeStr}`);
}

function secsToHmsStr(tSec) {
  const hms = [tSec/3600, (tSec/60)%60, (tSec%60)].map(n => parseInt(n));
  return hms.map((n, i) => n ? `${n}${'hms'[i]}` : '').join('');
}

function renderCaption(c) {
  const timeStr = secsToHmsStr(c.tstamp);
  const url = getUrl(timeStr);
  return `[@${timeStr}](${url})\n${c.content}`.trim();
}

/** NB, if `withCaptions` is true it'll copy around the current tstamp. */
function copyUrl(withCaptions) {
  const vid = getVideo();
  const subs = window.tamperSubs;
  const tstamp = vid.currentTime;
  const content = (withCaptions && subs && subs.around(tstamp)) || '';
  navigator.clipboard.writeText(renderCaption(content || { tstamp, content }));
  Util.toast(`Copied time ${content ? 'with' : 'without'} captions`);
}


/** Wrapper for all subtitles in the current video. */
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

    this.subs = new SortedArray(subtitles, 'tstamp');
  }

  around(secs, secsBefore=5, secsAfter=5) {
    return this.get(Math.max(0, secs - secsBefore), secs + secsAfter);
  }

  get(secs, maybeEndSecs) {
    let subs = this.subs.get(secs, maybeEndSecs);
    const content = subs.map(x => x.content).join('\n');
    return { content, tstamp: subs[0].tstamp, timeStr: subs[0].timeStr };
  }
}

/** If available, show subtitles next to the YT video and start tracking. */
async function tryInitSubs() {
  const subtitleWrapSel = '#body > ytd-transcript-body-renderer';

  if (!document.querySelector(subtitleWrapSel)) {
    document.querySelector('#info #button > yt-icon.ytd-menu-renderer').click();
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
    console.error(msg);
    Util.toast('Failed getting captions');
  });
}

/** Quick&dirty class encapsulating all captions within a session. */
class Tracker {
  static TIME_JITTER = 5;
  prev = null;
  trackedCaptions = new SortedUniqueArray([], 'tstamp');
  /** Toggles state: 1st starts tracking subtitles, then stores them. */
  ckpt() {
    const subs = window.tamperSubs;
    const vid = getVideo();
    if (!subs) return Util.toast('Subs not active');
    if (!this.prev) {
      Util.toast('Started tracking captions.');
      this.prev = vid.currentTime;
    } else {
      const caps = subs.get(
        this.prev - Tracker.TIME_JITTER,
        vid.currentTime + Tracker.TIME_JITTER);
      this.trackedCaptions.insert(caps);
      // TODO easiest way to use tracked captions as container?
      Promise.try(caps => caps.map(renderCaption).join('\n'), this.trackedCaptions)
        .then(navigator.clipboard.writeText)
        .then(() => {
          this.prev = null;
          Util.toast('Copied captions.');
        })
        .catch(err => Util.toast('Failed copying'));
    }
  }
}

const tracker = new Tracker();
window.onkeyup = document.onkeyup = Shortcut.init({
  a: [
    // alt-a to copy url at current tstamp without captions
    Shortcut.fun('a', () => copyUrl(false)),
    // alt-c to copy url around current tstamp with captions
    Shortcut.fun('c', () => copyUrl(true)),
    // alt-v multiple times to track particular sections of the video
    Shortcut.fun('v', () => tracker.ckpt()),
    // alt-w to copy the title
    Shortcut.fun('w', () => {
      const title = document.querySelector(
        "#info h1.title.ytd-video-primary-info-renderer").textContent;
      const url = getUrl();
      navigator.clipboard.writeText(`[${title}](${url})`);
      Util.toast(`Copied title`);
    }),
    // alt-o to start tracking subtitles if available
    Shortcut.fun('o', tryInitSubs),

    Shortcut.sel('i', '.ytp-miniplayer-button'),
    Shortcut.sel('i', '.ytp-miniplayer-expand-watch-page-button'),

    Shortcut.sel('m', '.ytp-mute-button'),
    Shortcut.sel('t', '.ytp-size-button'),
    Shortcut.sel('s', '.ytp-subtitles-button'),
    Shortcut.sel('b', '.ytp-fullscreen-button'),
  ],
  m: [Shortcut.sel('b', '.ytp-fullscreen-button.ytp-button'),]
});

