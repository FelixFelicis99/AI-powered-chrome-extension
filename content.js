// this block will help us to extract data/text from the curent article/website 
console.log("✅ content.js injected");

    // // searches the web page for the first <article> element. stores the return value in a constant variable "article"
    // const article = document.querySelector("article"); 
    // // this checks if return value "article" is not empty, then returns its inner text, i.e, only visible text without html tags 
    // if(article) return article.innerText;

    // // if there is no article tag, then extract all paragraph <p> elements from the page 
    // // document.querySelectorAll("p") returns a NodeList, which is converted to a normal JavaScript array using Array.from()
    // const paragraphs =  Array.from(document.querySelectorAll("p"));
    // return paragraphs.map((p) => p.innerText).join("\n");
    
    // const bodyText = document.body.innerText.trim(); //heheh 
    // return bodyText.length > 200 ? bodyText : "";

    function getArticleText() {
        const article = document.querySelector("article");
        if (article && article.innerText.trim().length > 200) {
            return article.innerText;
        }

        const paragraphs = Array.from(document.querySelectorAll("p"))
            .map(p => p.innerText.trim())
            .filter(text => text.length > 50);

        if (paragraphs.length > 0) {
            return paragraphs.join("\n");
        }
        if (document.body && document.body.innerText) {
        return document.body.innerText.trim();
        }
        return "";

//   // FINAL FALLBACK — this fixes MOST failures
//   const bodyText = document.body.innerText.trim();
//   return bodyText.length > 200 ? bodyText : "";



    }// basically this block returns the text from webpage under "article" or by combinig all paragraphs 


chrome.runtime.onMessage.addListener((req, _sender , sendResponse)=> {
    // if the request is to get article then it triggers the getArticleText() and stores its return value in a constant text
    // then returns text to popup.js    
    if(req.type === "GET_ARTICLE_TEXT"){
        setTimeout(() => {
            const text = getArticleText() || "";
            console.log("📄 Extracted text length:", text.length);
            sendResponse({ text });
        }, 500);
    }
    return true;
});