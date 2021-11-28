// ==UserScript==
// @name         GitHub to SourceGraph
// @namespace    tkukurin
// @version      0.1
// @description  Change current GitHub URL to SourceGraph or Colab.
// @author       Toni
// @match        https://github.com/*
// @match        github.com
// @require      file:///home/toni/.config/tampermonkey/include.js
// @grant        none
// ==/UserScript==

console.log('GitHub script enabled');

document.onkeyup = Shortcut.init({
  a: [
    Shortcut.fun('s', () => {
      const base = 'https://sourcegraph.com/';
      let cs = window.location.pathname.substr(1).split('/');
      if (cs.length < 2) return;
      let user = cs[0];
      let repo = cs[1];
      let maybeCommit = cs[3] ? `@${cs[3]}` : '';
      let rest = cs.slice(4).join('/');
      window.location.href = `${base}/github.com/${user}/${repo}${maybeCommit}/-/blob/${rest}`;
    }),

    Shortcut.fun('c', () => {
      // Inspired by
      // https://github.com/googlecolab/open_in_colab/blob/main/js/background.js
      // Badge: https://colab.research.google.com/assets/colab-badge.svg
      const base = 'https://colab.research.google.com/';
      const url = window.location.href
      const gith = /^https?:\/\/github\.com\/(.+)\/(.*\.ipynb)$/.exec(url);
      const gist =
        /gist\.github\.com\/(.+)\/([a-f0-9]+(?:\#file\-.*\-ipynb)?)$/.exec(url);

      if (gith) {
        window.location.href = `${base}/github/${gith[1]}/${gith[2]}`;
      } else if (gist) {
        window.location.href = `${base}/gist/${gist[1]}/${gist[2]}`;
      } else {
        Util.toast('Not recognized as a github-hosted notebook');
      }
    })
  ],
});
