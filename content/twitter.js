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


function clickShowMoreButtons(container = document) {
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    if (button.textContent.trim().toLowerCase().includes('show more')) {
      console.log('click:', button.textContent.trim());
      button.click();
    }
  });
}


function parseTweet(container) {
  if (!container) return null;
  const article = container.querySelector('[data-testid="tweet"]');
  if (!article) return null;

  const username = article.querySelector('[data-testid="User-Name"] span')?.textContent || 'Unknown User';
  const handle = article.querySelector('[data-testid="User-Name"] a')?.href.split('/').pop() || 'unknown_handle';
  const time = article.querySelector('time')?.textContent || 'Unknown Time';

  const tweets = article.querySelector('[data-testid="tweetText"]');
  const texts = tweets.querySelectorAll('span:not(a>span),a');
  const text = Array.from(texts).map(t => {
      if (t.nodeName == "A") {
          return `[${t.innerText.trim()}](${t.href})`;
      }
      return t.innerText.trim();
  }).join(' ');

  const imgElements = article.querySelectorAll('[data-testid="tweetPhoto"] img');
  const imgSrcs = Array.from(imgElements).map(img => `![](${img.src})`).join('\n');

  const videoElement = article.querySelector('[data-testid="videoPlayer"] video');
  const videoSrc = videoElement ? `Video: [Watch Video](${videoElement.src})` : '';

  const gifElement = article.querySelector('[data-testid="tweetGif"] img');
  const gifSrc = gifElement ? `GIF: ![](${gifElement.src})` : '';

  // TODO currently we just capture it via `text` above
  // const quoteContainer = container.querySelector('div[aria-labelledby^="id__"]');
  // const quoteTweet = (parseTweet(quoteContainer) || {text: ''}).text;

  const out = (
    `@${handle} (${username}) @ ${time}\n` +
    `${text}\n\n${imgSrcs}\n${videoSrc}\n${gifSrc}`
    // `\n\n${quoteTweet}`
  )
  return {
    username: username,
    handle: handle,
    text: out.trim(),
    time: new Date((time || {}).dateTime).getTime(),
  }
}

class Thread {
  content = []

  addFrom(nodes) {
    for (let node of nodes) {
      clickShowMoreButtons(node);
    }
    Array.from(nodes)
      .filter(x => x)
      .map(parseTweet)
      .filter(t => t && t.text)
      .forEach(obj => this.#add(obj));
    this.content = this.content.sort(c => c.time);
  }

  #add(obj) {
    if (this.content.length > 99) return; // don't make list unreasonably long
    if (this.content.find(o => o.text == obj.text)) return;
    this.content.push(obj);
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

  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('t', () => initThreadReader(new Thread())),
      Shortcut.fun('c', () => {
        F.guard(window.thread)
          .then(t => {
            const user = t.content[0].username || t.content[0].handle;
            const url = document.location.href;
            const tweets = t.content.map(c => c.text).join('\n\n---\n\n');
            return `# [Tweet from ${user}](${url})\n\n${tweets}`;
          })
          .then(c => navigator.clipboard.writeText(c) && Util.toast('Copied'))
          .catch(msg => Util.toast(`Error: "${msg}"<br/>Forgot thread init?`));
      })
    ],
  });

})();
