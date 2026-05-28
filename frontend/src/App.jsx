import { useState } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    /*
      The model itself is NOT remembering.

      You are explicitly sending:

      prior messages,
      current message,
      full conversation context.

      This is foundational.
    */
    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: input,
      },
    ];

    // Every request sends:
    // entire conversation history
    setMessages(updatedMessages);

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
    });

    const data = await res.json();

    setMessages([
      ...updatedMessages,
      {
        role: "assistant",
        content: data.reply,
      },
    ]);

    setInput("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Chatbot</h1>

      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.role}:</strong>
            <ReactMarkdown>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;