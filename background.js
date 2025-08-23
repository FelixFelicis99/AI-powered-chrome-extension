// Add this file to your extension
chrome.runtime.onInstalled.addListener(() => {
    // This will prompt the user to enter their API key on first install
    // geminiApiKey specifies the key we want to retrieve from chrome's storage
    // result is the object that will have the return value from chrome
    // => {  is the function call that happens when the return value is stored in result
    // !result.geminiApiKey checks if result is epmpty, null or undefined 
    //  if so then we create/open a new chrome tab where user will enter their api key
    chrome.storage.sync.get(["geminiApiKey"], (result) => {  // sync stores api key across all chrome sessions
      if (!result.geminiApiKey) { // if this happens then we will open the options page
        chrome.tabs.create({
          url: "options.html",
        });
      }
    });
  });