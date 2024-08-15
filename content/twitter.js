// ==UserScript==
// @name         Twitter
// @namespace    tkukurin
// @version      1.0
// @description  Twitter thread copy
// @author       Toni Kukurin
// @match        https://twitter.com/*
// @require      file:///home/toni/.config/tampermonkey/include.js
// @grant        none
// ==/UserScript==

function parseTweet(container) {
  const article = container.querySelector('[data-testid="tweet"]');
  if (!article) return null;

  const username = article.querySelector('[data-testid="User-Name"] span')?.textContent || 'Unknown User';
  const handle = article.querySelector('[data-testid="User-Name"] a')?.href.split('/').pop() || 'unknown_handle';
  const time = article.querySelector('time')?.textContent || 'Unknown Time';

  const texts = article.querySelectorAll('[data-testid="tweetText"] span');
  const text = Array.from(texts).map(t => {
      const maybeLink = t.querySelector('a');
      if (maybeLink) {
          return `[${maybeLink.innerText.trim()}](${maybeLink.href})`;
      }
      return t.innerText.trim();
  }).join(' ');

  const imgElements = article.querySelectorAll('[data-testid="tweetPhoto"] img');
  const imgSrcs = Array.from(imgElements).map(img => `![](${img.src})`).join('\n');

  const videoElement = article.querySelector('[data-testid="videoPlayer"] video');
  const videoSrc = videoElement ? `Video: [Watch Video](${videoElement.src})` : '';

  const gifElement = article.querySelector('[data-testid="tweetGif"] img');
  const gifSrc = gifElement ? `GIF: ![](${gifElement.src})` : '';

  const quoteContainer = container.querySelector('div[aria-labelledby^="id__"]');
  const quoteTweet = quoteContainer ? (parseTweet(quoteContainer) || ''): '';

  const txt = `@${handle} (${username}) @ ${time}\n${text}\n\n${imgSrcs}\n${videoSrc}\n${gifSrc}\n\n${quoteTweet}`;
  return {
    tweet: txt,
    time: new Date((time || {}).dateTime).getTime(),
  }
}
// console.log(Array.from(document.querySelectorAll('main div[aria-label="Timeline: Conversation"] > div > div')).map(x => x && parseTweet(x).trim()).filter(x => x).join('\n\n'))


class Thread {
  content = []

  addFrom(nodes) {
    Array.from(nodes)
      // .filter(node => node.parentNode.parentNode.ariaLabel == TIMELINE_ARIA)
      // .map(node => ({
      //   // NOTE(tk) seems usually 1st is original tweet, 2nd is quote tweet
      //   texts: node.querySelectorAll(sel),
      //   //texts: node.querySelectorAll('[lang="en"]'),
      //   time: node.querySelector('time')
      // }))
      // .filter(node => node.texts)
      .filter(x => x)
      .map(parseTweet)
      .filter(t => t && t.tweet && t.tweet != 'null')
      .forEach(obj => this.#add({
        text: obj.tweet, //obj.texts.map(_handleNode).join("\n").trim(),
        // We're okay with NaN if time is not available.
        time: new Date((obj.time || {}).dateTime).getTime(),
      }));
  }

  #add(obj) {
    if (this.content.length > 99) return; // don't make list unreasonably long
    if (this.content.find(o => o.text == obj.text)) return;
    this.content.push(obj);
  }

  toString() {
    this.content = this.content.sort(c => c.time);
    return this.content.map(c => c.text).join('\n\n---\n\n');
  }
}

(function() {
  function initThreadReader(thread) {
    if (window.thread) return;  // don't do twice.
    window.thread = thread; // make accessible from console

    Util.toast('Thread read init.');

    let obsNewNodes = new MutationObserver(muts =>
      Array.from(muts).map(m => m.addedNodes).forEach(ns => thread.addFrom(ns)));

    let curHref = document.location.href;
    Util.observe((_, self) => {
      if (curHref != document.location.href) {
        console.log('Changed href. Disconnect observer.');
        window.thread = undefined;
        obsNewNodes.disconnect();
        self.disconnect();
      }
    });

    Q.el('main').then(el => obsNewNodes.observe(el, {childList:true, subtree: true}));
    const sel = 'main div[aria-label="Timeline: Conversation"] > div > div'
    thread.addFrom(Q.all(sel));
  }

  // TODO expanding replies?
  // <div role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-16y2uox
  // r-19u6a5r r-1ny4l3l r-m2pi6t r-o7ynqc r-6416eg"><div class="css-1dbjc4n
  // r-18u37iz"><div class="css-1dbjc4n r-1awozwy r-1kihuf0 r-1hwvwag r-18kxxzh
  // r-10ptun7 r-1wtj0ep r-1b7u577 r-bnwqim"><div class="css-1dbjc4n r-1bimlpy
  // r-1adg3ll r-epq5cr r-m5arl1"></div><div class="css-1dbjc4n r-1bimlpy
  // r-1adg3ll r-epq5cr r-m5arl1"></div><div class="css-1dbjc4n r-1bimlpy
  // r-1adg3ll r-epq5cr r-m5arl1"></div></div><div class="css-1dbjc4n r-1iusvr4
  // r-16y2uox"><div dir="auto" class="css-901oao r-1n1174f r-37j5jr r-a023e6
  // r-16dba41 r-rjixqe r-bcqeeo r-5njf8e r-qvutc0"><span class="css-901oao
  // css-16my406 r-poiln3 r-bcqeeo r-qvutc0"> Show replies

  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('t', () => initThreadReader(new Thread())),
      Shortcut.fun('c', () => {
        F.guard(window.thread).then(t => t.toString()).then(c =>
            navigator.clipboard.writeText(`${document.location.href}\n${c}`)
              && Util.toast('Copied'))
          .catch(msg => Util.toast(`Error: "${msg}"<br/>Forgot thread init?`));
      })
    ],
  });

})();
