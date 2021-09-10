
function tabsel(tab, count) {
  chrome.tabs.query({windowId: tab.windowId}, tabs => {
    const index = Util.mod(count + tab.index, tabs.length);
    return chrome.tabs.update(tabs[index].id, {active: true});
  });
}

chrome.runtime.onMessage.addListener((req, sender, callback) => {
  if (req.cmd === 'tab') {
    chrome.tabs.query({active: true, currentWindow: true}, e =>
      tabsel(e[0], (req.key === 'j' ? 1 : -1)));
  }
});


