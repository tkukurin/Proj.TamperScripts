
(function() {
  'use strict';
  const Present = {};
  Present.toggle = function(x) {
    const maybeParent = this[x];
    this[x] = x.parentElement;
    (maybeParent && maybeParent.appendChild(x)) || x.remove();
  };

  Q.all('div.entry').forEach(e =>
    Q.el('li.first a', e).then(
      c => Q.el('p.title', e).then(
        t => t.appendChild(c)))
    .catch(console.log));

  const toggle = el => el.style.display = (
    el.style.display == 'none') ? 'block' : 'none';
  Q.el('.side').then(toggle);
  window.onkeyup = document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('s', _ => Q.doc('.side').then(toggle)),
      Shortcut.fun('a', _ => Present.toggle(customStyle)),
    ]
  });
})();

