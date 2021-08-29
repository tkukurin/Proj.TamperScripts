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

const TIMELINE_ARIA = 'Timeline: Conversation';

class Thread {
  content = []

  addFrom(nodes) {
    Array.from(nodes)
      .filter(node => node.parentNode.parentNode.ariaLabel == TIMELINE_ARIA)
      .map(node => ({
        // NOTE(tk) seems usually 1st is original tweet, 2nd is quote tweet
        texts: node.querySelectorAll('[lang="en"]'),
        time: node.querySelector('time')
      }))
      .filter(node => node.texts)
      .forEach(obj => this.#add({
        text: obj.texts.map(n => n.textContent)
          .map(t => t.replace(/\n+/, ' ')).join('\n> ').trim(),
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
    return this.content.map(c => c.text).join('\n\n');
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
    const nodes = Q.all(`[aria-label="${TIMELINE_ARIA}"] > div > div`);
    thread.addFrom(nodes);
  }

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
