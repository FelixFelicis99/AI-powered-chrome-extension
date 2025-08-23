// this block will help us to extract data/text from the curent article/website 
console.log("✅ content.js injected");
function getArticleText(){
    // searches the web page for the first <article> element. stores the return value in a constant variable "article"
    const article = document.querySelector("article"); 
    // this checks if return value "article" is not empty, then returns its inner text, i.e, only visible text without html tags 
    if(article) return article.innerText;

    // if there is no article tag, then extract all paragraph <p> elements from the page 
    // document.querySelectorAll("p") returns a NodeList, which is converted to a normal JavaScript array using Array.from()
    const paragraphs =  Array.from(document.querySelectorAll("p"));
    // now we have to combine all the paragraphs in the array into a sigle text and return
    // this line maps over the array of paragraph elements and combines its innertext with line separations
    return paragraphs.map((p) => p.innerText).join("\n");
} // basically this block returns the text from webpage under "article" or by combinig all paragraphs 

// this is the trigger function for getArticleText()
// It listens for messages sent using chrome.runtime.sendMessage(...)
// it listens for 3 things, the message or object sent(req), the sender, and the call back to send response
chrome.runtime.onMessage.addListener((req, _sender , sendResponse)=> {
    // if the request is to get article then it triggers the getArticleText() and stores its return value in a constant text
    // then returns text to popup.js    
    if(req.type === "GET_ARTICLE_TEXT"){
        const text= getArticleText();
        sendResponse({ text });
    }
    return true;
});