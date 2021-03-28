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

  const TIMELINE_ARIA = 'Timeline: Conversation'

  function addIfThread(thread, nodes) {
    Array.from(nodes)
      .filter(node => node.parentNode.parentNode.ariaLabel == TIMELINE_ARIA)
      .map(node => ({
        text: node.querySelector('[lang="en"]'),
        time: node.querySelector('time')
      }))
      .filter(node => node.text)
      .forEach(obj => thread.add({
        text: obj.text.textContent,
        // We're okay with NaN if time is not available.
        time: new Date((obj.time || {}).dateTime).getTime(),
      }));
  }

  function initThreadReader(thread) {
    // NOTE(tk) Don't do twice.
    if (window.thread) return;
    // NOTE(tk) make accessible from console
    window.thread = thread;

    console.log('Thread read initd');
    Util.toast('Thread read init.');

    let newNodeObserver = new MutationObserver(mutations =>
      Array.from(mutations).map(m => m.addedNodes).forEach(ns => addIfThread(thread, ns)));

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
    const nodes = Q.all(`[aria-label="${TIMELINE_ARIA}"] > div > div`);
    addIfThread(thread, nodes);
  }

  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('t', () => initThreadReader(new Thread())),
      Shortcut.fun('c', () => navigator.clipboard.writeText(thread.toString()))
    ],
  });

})();
