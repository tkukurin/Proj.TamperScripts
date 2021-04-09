// ==UserScript==
// @name         GitHub to SourceGraph
// @namespace    tkukurin
// @version      0.1
// @description  Change current GitHub URL to SourceGraph.
// @author       Toni
// @match        https://github.com/*
// @require      file:///home/toni/.config/tampermonkey/include.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const base = 'https://sourcegraph.com/';
  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('s', () => {
        let cs = window.location.pathname.substr(1).split('/');
        if (cs.length < 2) return;
        let user = cs[0];
        let repo = cs[1];
        let maybeCommit = cs[3] ? `@${cs[3]}` : '';
        let rest = cs.slice(4).join('/');
        window.location.href = `${base}/github.com/${user}/${repo}${maybeCommit}/-/blob/${rest}`;
      })
    ],
  });
})();
