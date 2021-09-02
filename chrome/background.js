// * chrome      - the global namespace for Chrome's extension APIs
// * runtime     – the namespace of the specific API we want to use
// * onInstalled - the event we want to subscribe to
// * addListener - what we want to do with this event
//
// cf. https://developer.chrome.com/docs/extensions/reference/events/
chrome.runtime.onInstalled.addListener(async () => {
  // let url = chrome.runtime.getURL("hello.html");
  // let tab = await chrome.tabs.create({ url });
  // console.log(`Created tab ${tab.id}`);
});
