# TamperStudy for Chrome

WIP. TamperMonkey Chrome scripts simplifying note-taking for video lectures.

* Copy current timestamp and recent captions to clipboard.
* Lightweight video speed control based on excellent work by [igrigorik/videospeed](https://github.com/igrigorik/videospeed).

Also adds some additional useful shortcuts (e.g. YouTube, Evernote).
`include.js` is a simple library I usually invoke in my TamperMonkey scripts.
It contains shorthand methods for DOM manipulation and shortcut definition.

## Usage

### YouTube
YouTube shortcuts are setup in `yt.js`.
`Alt-A` copies links with timestamp and subtitles if enabled.
Show subtitles using `Alt-S` and toggle subtitle copying using `Alt-O`.

### Evernote
Basic, possibly buggy Evernote shortcuts in `evernote.js`.
Use `Alt-J` and `Alt-K` to navigate notes up and down.
`Ctrl-Space` invokes note search.
Some other shortcuts for the main menu (switch between notebooks, etc.).

