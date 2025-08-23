//toggle switch 
document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const mode = e.target.value;
    document.getElementById("summarize-section").style.display =
      mode === "summarize" ? "block" : "none";
    document.getElementById("ask-section").style.display =
      mode === "ask" ? "block" : "none";
  });
});

// dark mode
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("dark-mode-toggle");
  const body = document.body;

  // Load preference from storage
  chrome.storage.sync.get(["darkMode"], ({ darkMode }) => {
    body.setAttribute("data-theme", darkMode ? "dark" : "light");
    toggle.checked = !!darkMode;
  });

  // Toggle listener
  toggle.addEventListener("change", () => {
    const isDark = toggle.checked;
    body.setAttribute("data-theme", isDark ? "dark" : "light");
    chrome.storage.sync.set({ darkMode: isDark });
  });
});




// getElementById selects the html element with the id "summarize" from the current web page
// click means that when this element is clicked on the current web page the code that follows will run

document.getElementById("summarize").addEventListener("click", () =>{
    // <div id="result"> in popup.html
    const resultDiv = document.getElementById("result"); // the element with id "result" is saved in variable result 
    const summaryType = document.getElementById("summary-type").value;
    resultDiv.innerHTML = '<div class= "loader"></div> ';

    //GET USER'S API KEY
    chrome.storage.sync.get(['geminiApiKey'], ({geminiApiKey}) =>{
        if(!geminiApiKey) {
            resultDiv.textContent = "no api key set. click gear icon to add one";
            return;
        }

        //ASK CONTENT.JS FOR THE PAGE TEXT
        // chrome.tabs.querry is used to get info about tabs. active: true, currentWindow: true means Get the currently active tab in the current browser window.
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) =>     {
        // Sends a message to the content script in the specified tab
        chrome.tabs.sendMessage(
            tab.id, // id of the active tab
            { type: "GET_ARTICLE_TEXT" }, // sends the message which content.js is listening for 
            async ( response ) => { // this is the call back from content.js
                const text = response?.text; 
                if(!text) {
                    resultDiv.textContent = "couldn't extract text from this page";
                    return;
                }
                
                // SEND TEXT TO GEMINI
                try {
                    const summary= await getGeminiSummary(text, summaryType, geminiApiKey);
                    resultDiv.textContent = summary;
                } catch (error) {
                      resultDiv.innerText = `Error: ${
                      error.message || "Failed to generate summary."
                    }`;
                }
            }
        );
    });

    });
});

async function getGeminiSummary(rawText, type, apiKey) {
    const max= 20000;
    const text = rawText.length > max ? rawText.slice(0,max) + "..." : rawText;

    // create a promptMap with all types of summaries 
    const promptMap = {
        brief: `Provide a brief summary of the following article in 2-3 sentences:\n\n${text}`,
        detailed: `Provide a detailed summary of the following article, covering all main points and key details:\n\n${text}`,
        bullets: `Summarize the following article in 5-7 key points. Format each point as a line starting with "- " (dash followed by a space). Do not use asterisks or other bullet symbols, only use the dash.:\n\n${text}`,
    };

    // whatever type of summary is needed, save it to prompt else default is set to brief
    const prompt = promptMap[type] || promptMap.brief;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{text: prompt }] }],
                generationConfig: { temperature: 0.2 },
            }),
        } 
    );

    if(!res.ok) {
        const{error} = await res.json();
        throw new Error(error?.message || "Request failed");
    }

    const data= await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary";

}

document.getElementById("ask-question").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");
  const userInput = document.getElementById("user-question").value.trim();

  if (!userInput) {
    resultDiv.textContent = "Please enter a question first.";
    return;
  }
  resultDiv.innerHTML = '<div class="loader"></div>';

  chrome.storage.sync.get(["geminiApiKey"], async ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "No API key set. Click gear icon to add one.";
      return;
    }

    try {
       // 🧠 Load recent chat history for context
      const { history = [] } = await chrome.storage.session.get(["history"]);
      const recentHistory = history.slice(-5);
      let context = recentHistory
        .map(({ question, answer }) => `Q: ${question}\nA: ${answer}`)
        .join("\n\n");
      const prompt = `${context}\n\nQ: ${userInput}\nA:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error?.message || "Request failed");
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer found.";
      await appendToHistory(userInput, answer);
      resultDiv.textContent = answer;
    } catch (error) {
      resultDiv.innerText = `Error: ${error.message || "Failed to get answer."}`;
    }
  });
});




document.addEventListener("DOMContentLoaded", () => {
  const copyBtn = document.getElementById("copy-btn");
  const resultDiv = document.getElementById("result");

  if (copyBtn && resultDiv) {
    copyBtn.addEventListener("click", () => {
      const text = resultDiv.innerText;
      if (!text.trim()) return;

      navigator.clipboard.writeText(text)
        .then(() => {
          const oldText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(() => copyBtn.textContent = oldText, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });
  }
});

// Store question and answer in session storage
async function appendToHistory(question, answer) {
  const { history = [] } = await chrome.storage.session.get(["history"]);
  history.push({ question, answer });
  await chrome.storage.session.set({ history });
}

// Load history from session storage
async function loadHistory() {
  const { history = [] } = await chrome.storage.session.get(["history"]);
  return history;
}

document.addEventListener("DOMContentLoaded", async () => {
  const history = await loadHistory();
  const historyDiv = document.getElementById("history");

  if (!historyDiv) return;

  historyDiv.innerHTML = history
    .map(
      ({ question, answer }) => `
        <div style="margin-bottom: 10px;">
          <strong>Q:</strong> ${question}<br/>
          <strong>A:</strong> ${answer}
        </div>`
    )
    .join("");
});

document.getElementById("clear-history").addEventListener("click", async () => {
  await chrome.storage.session.remove("history");
  document.getElementById("history").innerHTML = "";
});