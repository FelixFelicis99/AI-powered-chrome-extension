document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["geminiApiKey"], ({geminiApiKey}) =>{
        // if geminiApiKey exists then assign its value to element with id "api-key" in options.html
        if(geminiApiKey) document.getElementById("api-key").value = geminiApiKey;

    });

    // now we need to save the settings 
    document.getElementById("save-button").addEventListener("click", ()=>{
        // check if api key was entered .. if not then return nothing
        const apiKey= document.getElementById("api-key").value.trim();
        if(!apiKey) return;
        
        // else if api key is entered by user then save it to chrome storage using set 
        chrome.storage.sync.set({ geminiApiKey: apiKey },()=>{
            //after saving, show the success message for 1 sec 
            // this is set to none in options.html so we create a display block
            document.getElementById("success-message").style.display = "block";
            // after saving and displaying message, we close the tab after 1 seocnd
            setTimeout(() => window.close(), 1000);
        });
    });
});