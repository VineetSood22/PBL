import React, { useState, useRef, useEffect } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hello! I’m your Trip Assistant. Ask me anything about travel ✈️" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.reply || "🤖 Sorry, I didn’t understand that. Can you rephrase?",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error connecting to chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container fixed bottom-4 right-4 w-96 max-h-[600px] bg-white border border-gray-300 rounded-xl shadow-lg flex flex-col">
      <div className="chatbot-header bg-blue-600 text-white p-3 rounded-t-xl font-bold text-lg flex items-center justify-between">
        🌍 Trip Assistant
      </div>

      {/* Messages */}
      <div className="chatbot-messages flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 max-w-xs rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 italic">✍️ Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chatbot-input p-3 border-t border-gray-300">
        <textarea
          rows={2}
          className="w-full border rounded-lg p-2 resize-none focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about trips, hotels, weather..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
