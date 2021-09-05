console.log('Reddit script loaded');

const Present = {};
Present.toggle = function(x) {
  console.log(x);
  const maybeParent = this[x];
  this[x] = x.parentElement;
  (maybeParent && maybeParent.appendChild(x)) || x.remove();
};
const showNone = '#header-img,#redesign-beta-optin-btn,.footer-parent,a.thumbnail,div.midcol.unvoted,.entry .flat-list.buttons, span.rank';
const customStyle = Util.newEl('style', `${showNone} {display:none !important}
div.trending-subreddits {visibility: hidden; height: 0px}
div.content {max-width: 600px;margin: 20px auto !important}
.searchpane {margin: 0 !important}`);
Q.el('head').then(el => el.append(customStyle));
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
    Shortcut.fun('s', _ => Q.el('.side').then(toggle)),
    Shortcut.fun('a', _ => Present.toggle(customStyle)),
  ]
});
