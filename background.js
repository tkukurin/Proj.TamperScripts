
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
  } else if (req.cmd == 'meta') {
    // TODO I wanted to store tab content on this action
  }
});

// chrome.webRequest.onBeforeRequest.addListener(
//   function(details) {
//     console.log("Request URL: ", details.url);
//     // You can perform additional logging or data processing here
//   },
//   { urls: ["<all_urls>"] },
//   ["blocking"]
// );


// details.url: The URL of the intercepted request.
// details.method: The HTTP method of the request (e.g., "GET", "POST").
// details.requestHeaders: An array of the request headers.
// details.requestBody: Information about the request body if present.
// details.frameId: The ID of the frame that initiated the request.
// details.tabId: The ID of the tab that initiated the request.
// details.type: The type of resource being requested (e.g., "main_frame", "script").
// details.initiator: The initiator of the request.
// details.timeStamp: The timestamp when the request was initiated.
// details.incognito: Indicates whether the request is in incognito mode.
// details.documentUrl: The URL of the document in which the request originated.

chrome.runtime.onInstalled.addListener(function () {
  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      // Save the request to a file
      console.log("Request intercepted:", details.url);
      saveToFile(details.url);
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );

  function saveToFile(url) {
    // You can customize the file-saving logic here
    // For simplicity, this example uses the Downloads API to download a file
    const filename = "network_logs.txt";
    const content = `${url}\n`;

    chrome.downloads.download({
      url: URL.createObjectURL(new Blob([content], { type: "text/plain" })),
      filename: filename,
      saveAs: false,
    });
  }
});
