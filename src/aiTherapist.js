// src/aiTherapist.js
export async function sendMessageToAI(message) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        }),
      });
  
      const data = await response.json();
  
      if (!data.choices || !data.choices[0]) {
        throw new Error("No response from AI.");
      }
  
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Error:", error.message);
      return "Sorry, I had trouble responding. Please try again in a moment.";
    }
  }
  