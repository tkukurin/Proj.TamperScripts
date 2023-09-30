
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


// const fileQueue = {};

chrome.runtime.onInstalled.addListener(function () {
  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      saveToFile(details.url, details);
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );


  function saveToFile(url, details) {
    const domain = extractDomain(url);
    const filename = `requests/${domain}.json`;
    const requestData = {
      url: url,
      method: details.method,
      body: details.requestBody,
    };

    // if (fileQueue[filename]) {
    //   setTimeout(() => {
    //       saveToFile(url, details);
    //   }, 100);
    // }

    const content = JSON.stringify(requestData, null, 2);
    // Check if the file already exists
    chrome.downloads.search({ filename: filename }, (results) => {
      if (results && results.length > 0) {
        // File exists, read existing content
        chrome.downloads.getFileIcon(results[0].id, { size: 0 }, (icon) => {
          const reader = new FileReader();
          reader.onloadend = function () {
            const existingContent = reader.result || '';
            const updatedContent = existingContent + '\n' + content;

            // Save the updated content back to the same file
            chrome.downloads.download({
              url: URL.createObjectURL(new Blob([updatedContent], { type: "application/json" })),
              filename: filename,
              saveAs: false,
            });
          };
          reader.readAsText(icon);
        });
      } else {
        // File doesn't exist, create a new file
        chrome.downloads.download({
          url: URL.createObjectURL(new Blob([content], { type: "application/json" })),
          filename: filename,
          saveAs: false,
        });
      }
    });
  }

  function extractDomain(url) {
    const matches = url.match(/^https?:\/\/([^/]+)/i);
    if (matches && matches[1]) {
      return matches[1];
    }
    // Default to using the full URL as the domain
    return url;
  }

});
