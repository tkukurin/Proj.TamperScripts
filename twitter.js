// ==UserScript==
// @name         Twitter
// @namespace    tkukurin
// @version      1.0
// @description  Copy threads from Twitter.
// @author       Toni Kukurin
// @match        https://twitter.com/*
// @require      file:///home/toni/.config/tampermonkey/include.js
// @grant        none
// ==/UserScript==

class Thread {
  constructor() {
    this.content = [];
  }

  add(obj) {
    if (this.content.length > 500) {
      // NOTE(tk) magic constant max threshold.
      // in case of a bug, don't make the list unreasonably long.
      return;
    }

    if (!this.content.find(o => o.text == obj.text)) {
      this.content.push(obj);
    }
  }

  toString() {
    this.content = this.content.sort(c => c.time);
    return this.content.map(c => c.text).join('\n');
  }
}

(function() {
  'use strict';

  let TIMELINE_ARIA = 'Timeline: Conversation'

  function addIfThread(nodes) {
    Array.from(nodes)
      .filter(node => node.parentNode.parentNode.ariaLabel == TIMELINE_ARIA)
      .map(node => ({text:node.querySelector('[lang="en"]'), time: node.querySelector('time')}))
      .filter(node => node.text)
      .forEach(obj => thread.add({
        text: obj.text.textContent,
        // We're okay with NaN if time is not available.
        time: new Date((obj.time || {}).dateTime).getTime(),
      }));
  }

  let thread = new Thread();
  // NOTE(tk) make accessible from console
  window.thread = thread;

  function initThreadReader() {
    console.log('Thread read initd');

    let newNodeObserver = new MutationObserver(mutations =>
      Array.from(mutations).map(m => m.addedNodes).forEach(addIfThread));

    let curHref = document.location.href;
    let hrefObserver = new MutationObserver((_, self) => {
      if (curHref != document.location.href) {
        console.log('Changed href. Disconnect observer.');
        window.thread = undefined;
        newNodeObserver.disconnect();
        self.disconnect();
      }
    });

    hrefObserver.observe(document.body, {childList:true, subtree:true});
    Q.doc('main').then(
      el => newNodeObserver.observe(el, {childList:true, subtree: true}));
    const thread = Q.all(`[aria-label="${TIMELINE_ARIA}"] > div > div`);
    addIfThread(thread);
  }

  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('t', initThreadReader),
      Shortcut.fun('c', () => navigator.clipboard.writeText(thread.toString()))
    ],
  });

})();
