

(function() {

  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('c', () => {
        try {
          const els = document.querySelectorAll(
            'div[data-testid^="postThreadItem-"]')
          const texts = [...els].map(div => div.textContent.trim());
          const joined = texts.join('\n\n---\n\n');
          navigator.clipboard.writeText(joined);
          Util.toast('Copied');
        } catch(e) {
          console.error('(tk)', e)
        }
      }),
    ],
  });
})();
