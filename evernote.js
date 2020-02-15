// ==UserScript==
// @name         Evernote
// @namespace    tkukurin
// @version      1.0
// @description  Evernote shortcuts
// @author       Toni Kukurin
// @match        https://www.evernote.com/*
// @require      file:///home/toni/.config/tampermonkey/include.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function gotoNotes(e) {
    const noteIdRe = /#n=([^&]+)/g;
    // The note ID is reset after clicking on notes,
    // so we cache it here and restore afterwards.
    const cachedNoteId = noteIdRe.exec(window.location.href);
    Q.doc('#gwt-debug-Sidebar-notesButton')
      .then(notesBtn => notesBtn.click())
      .then(_ => window.location.assign(
        window.location.href.replace(noteIdRe, cachedNoteId[0] || '')));
  }

  const focusNote = F.retTrue(() =>
    Q.doc('.RichTextArea-entinymce').then(tmce => tmce.click()));
  const navScroll = nextNoteFn => Q.doc('.focus-NotesView-Note-selected')
    .then(selectedNote => selectedNote.parentElement)
    .then(nextNoteFn)
    .then(toSelect => Q.el(toSelect, '.focus-NotesView-Note'))
    .then(toSelectContainer => toSelectContainer.click() || toSelectContainer)
    .then(container => container.offsetTop - /*container height=*/ 56)
    .then(deltaY => Q.doc('.NotesView-ScrollWindow').then(sw => sw.scrollTo(0, deltaY)));

  // 'Escape' = 27, 'Space' = 32, Enter = 13
  const noPrefixShorts = [
    {k: 27, fn: gotoNotes},
    {k: 13, fn: focusNote},
  ].map(Shortcut.norm());
  const altShorts = [
    {k:'k', fn: evt => navScroll(el => el.previousSibling).then(focusNote)},
    {k:'j', fn: evt => navScroll(el => el.nextSibling).then(focusNote)},
    {k:'b', sel: '#gwt-debug-Sidebar-notebooksButton'},
    {k:'n', sel: '#gwt-debug-Sidebar-notesButton'},
    {k:'q', sel: '#gwt-debug-Sidebar-notesButton'},
    {k:'s', sel: '#gwt-debug-Sidebar-shortcutsButton'},
    {k:'t', sel: '#gwt-debug-Sidebar-tagsButton'},
  ].map(Shortcut.norm('a'));
  const ctrlShorts = [
    {k: 32, sel: '#gwt-debug-Sidebar-searchButton'},
  ].map(Shortcut.norm('c'));

  // Hack for TinyMce focused iframe
  noPrefixShorts.forEach(s => s.unfocusTmce = true);
  altShorts.forEach(s => s.modMaps = ['a']);
  ctrlShorts.forEach(s => s.modMaps = ['c']);

  const shorts = altShorts.concat(ctrlShorts).concat(noPrefixShorts);
  window.onkeyup = document.onkeyup = Shortcut.init(shorts);

  // https://stackoverflow.com/questions/42376464/uncaught-domexception-failed-to-execute-postmessage-on-window-an-object-co
  // NOTE: be careful with the fn below; it'll be injected as string into src of TinyMCE iframes.
  // The idea is to be able to still manipulate objects on the parent website from an iframe.
  // shortcutObjs need to be a function argument because we can't access them from an iframe.
  function tinyMceUnfocus(e, shortcutObjs) {
    const sendToParent = ['ShiftKey', 'altKey', 'ctrlKey', 'which'];
    const char2keydown = sendToParent.reduce((obj, k) => {
      obj[k.charAt(0).toLowerCase()] = e[k];
      return obj;
    }, {});
    const isAllMods = s => (s.modMaps || []).every(k => char2keydown[k]);
    const activeShorts = shortcutObjs.filter(s => isAllMods(s) && s.k == e.which);
    if (activeShorts.length) {
      parent.postMessage(
        sendToParent.reduce((obj, k) => {obj[k] = e[k]; return obj}, {}),
        'https://www.evernote.com');
      (activeShorts.some(s => s.unfocusTmce) && parent.focus());
      e.stopPropagation();
    }
  }

  window.addEventListener('message', m => window.onkeyup(m.data), false);
  // Convert shortcuts to string and inject it into all editors on page.
  // Not a front-end expert so IDK of a better way to hack iframe shortcuts.
  const shortsStr = JSON.stringify(shorts);
  const tmceFnStr = 'tinyMceUnfocus';
  // TODO modify this to use a mutation listener
  // (something like - if a new iframe appears ...)
  window.onclick = document.onclick = function() {
    Q.all('.RichTextArea-entinymce')
      .filter(iframe => iframe.src.indexOf(tmceFnStr) == -1)
      .forEach(iframe => {
        iframe.src = `javascript:
          ${tinyMceUnfocus.toString()};
          document.onnkeyup = window.onkeyup = e => ${tmceFnStr}(e, ${shortsStr});
        `;
      })
  }
})();
