"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./chatwidget.module.css";

interface Message {
  role: "user" | "bot";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "bot",
  content:
    "👋 Hi! I'm your **HealthBuddy AI**. I have access to your health records and can answer questions about your sugar levels, HbA1c, weight, and more.\n\nTry asking: *\"What is my latest blood sugar?\"* or *\"Am I in the diabetic range?\"*",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.role !== "bot" || m !== WELCOME_MESSAGE)
        .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "Sorry, I ran into an issue. Please try again." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Connection error. Please check your internet and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  // Simple markdown-like rendering (bold, italic, bullets)
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let content = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code style='background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.8rem'>$1</code>");

      if (line.startsWith("- ") || line.startsWith("• ")) {
        content = `• ${content.slice(2)}`;
      }

      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: content }} />
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={styles.chatBubble}>
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderAvatar}>🤖</div>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatHeaderName}>HealthBuddy AI</div>
              <div className={styles.chatHeaderStatus}>Online · Powered by May AI!</div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.message} ${
                  msg.role === "user" ? styles.messageUser : styles.messageBot
                }`}
              >
                {msg.role === "bot" && (
                  <div className={styles.messageAvatar}>🤖</div>
                )}
                <div className={styles.messageBubble}>{renderContent(msg.content)}</div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.messageBot}`}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            ⚕️ AI assistant only. Always consult a doctor for medical decisions.
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              className={styles.input}
              placeholder="Ask about your health..."
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className={styles.chatToggleBtn}
        onClick={() => setIsOpen((v) => !v)}
        title="Chat with HealthBuddy AI"
      >
        {isOpen ? "✕" : "💬"}
        <span className={styles.pulse} />
      </button>
    </div>
  );
}
