import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./index.css";

function App() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const savedChatId = localStorage.getItem("chatId");

    if (savedChatId) {
      setChatId(savedChatId);

      const res = await fetch(
        `http://localhost:3001/chat/${savedChatId}`
      );

      const data = await res.json();

      setMessages(data.messages);
    } else {
      const res = await fetch(
        "http://localhost:3001/new-chat",
        {
          method: "POST",
        }
      );

      const data = await res.json();

      localStorage.setItem("chatId", data.chatId);

      setChatId(data.chatId);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    const currentInput = input;

    setInput("");
    setLoading(true);

    // add user message and placeholder assistant message
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        role: "assistant",
        content: "",
      },
    ]);

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message: currentInput,
      }),
    });

    const reader = res.body.getReader();

    const decoder = new TextDecoder();

    let assistantReply = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);

      assistantReply += chunk;

      setMessages((prev) => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantReply,
        };

        return updated;
      });
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI Chatbot</h1>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role}`}
          >
            <div className="role">
              {msg.role}
            </div>

            <ReactMarkdown>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}

        {loading && (
          <div className="typing">
            AI is typing...
          </div>
        )}
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;