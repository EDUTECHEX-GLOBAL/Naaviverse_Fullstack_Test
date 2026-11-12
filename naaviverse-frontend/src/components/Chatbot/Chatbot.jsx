import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./Chatbot.scss";

// Reference chatbot logo
import chatbotLogo from "../../assets/images/assets/chatbot-logo.png";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4545";

// Quick suggestion prompts with clean SVG icons and space-efficient typography
const SUGGESTED_PROMPTS = [
  {
    id: "paths",
    label: "Choose a Path",
    query: "How do I choose and explore a career path on Naaviverse?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
  },
  {
    id: "step",
    label: "Current Step",
    query: "What is Current Step and how do I track my active milestone progress?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: "wallet",
    label: "Wallet Credits",
    query: "How do wallet credits work and what are they used for?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="17" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "guide",
    label: "Page Guide",
    query: "What can I do on my current page?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
];

/**
 * Safe Markdown-like text formatter for AI responses
 */
const renderFormattedMessage = (text) => {
  if (!text) return null;

  // Split into lines
  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let currentTable = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="naavi-chat-bullet-list">
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInlineText(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      const parsedRows = currentTable
        .map((row) => {
          const cells = row.split("|").map((c) => c.trim());
          if (cells.length > 0 && cells[0] === "") cells.shift();
          if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
          return cells;
        })
        .filter((cells) => cells.length > 0);

      const dividerIndex = parsedRows.findIndex((cells) =>
        cells.every((c) => /^[-: ]+$/.test(c))
      );

      let headerRow = null;
      let bodyRows = [];

      if (dividerIndex > 0) {
        headerRow = parsedRows[dividerIndex - 1];
        bodyRows = parsedRows.filter((_, idx) => idx !== dividerIndex - 1 && idx !== dividerIndex);
      } else {
        bodyRows = parsedRows.filter((cells) => !cells.every((c) => /^[-: ]+$/.test(c)));
      }

      if (bodyRows.length > 0) {
        elements.push(
          <div key={`cards-${elements.length}`} className="naavi-chat-data-cards">
            {bodyRows.map((r, rIdx) => (
              <div key={`card-${rIdx}`} className="naavi-chat-data-card">
                {r[0] && (
                  <div className="naavi-chat-card-title">
                    <span className="naavi-chat-card-badge">{parseInlineText(r[0])}</span>
                  </div>
                )}
                {r.length > 1 && (
                  <div className="naavi-chat-card-fields">
                    {r.slice(1).map((cell, cIdx) => (
                      <div key={`f-${cIdx}`} className="naavi-chat-card-field">
                        {headerRow && headerRow[cIdx + 1] && (
                          <span className="naavi-chat-field-label">
                            {headerRow[cIdx + 1]}:
                          </span>
                        )}
                        <span className="naavi-chat-field-value">
                          {parseInlineText(cell)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      currentTable = [];
    }
  };

  const parseInlineText = (str) => {
    if (!str) return null;
    // Replace <br>, **bold**, *italic*, and `code`
    const parts = [];
    const regex = /(<br\s*\/?>|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/gi;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (/^<br\s*\/?>$/i.test(token)) {
        parts.push(<br key={`br-${match.index}`} />);
      } else if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={match.index} className="naavi-chat-bold">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em key={match.index} className="naavi-chat-italic">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code key={match.index} className="naavi-chat-code">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Markdown Table rows
    if (trimmed.startsWith("|") && (trimmed.endsWith("|") || trimmed.includes("|"))) {
      flushList();
      currentTable.push(trimmed);
      return;
    }

    // Flush any pending table
    flushTable();

    // Bullet items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
      currentList.push(content);
      return;
    }

    // Flush any pending list
    flushList();

    if (!trimmed) {
      elements.push(<div key={`spacer-${index}`} className="naavi-chat-spacer" />);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h5 key={`h5-${index}`} className="naavi-chat-heading-h5">
          {parseInlineText(trimmed.replace(/^###\s+/, ""))}
        </h5>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h4 key={`h4-${index}`} className="naavi-chat-heading-h4">
          {parseInlineText(trimmed.replace(/^##\s+/, ""))}
        </h4>
      );
      return;
    }

    // Blockquote / Tip
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div key={`quote-${index}`} className="naavi-chat-callout">
          {parseInlineText(trimmed.replace(/^>\s+/, ""))}
        </div>
      );
      return;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={`hr-${index}`} className="naavi-chat-divider" />);
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${index}`} className="naavi-chat-paragraph">
        {parseInlineText(trimmed)}
      </p>
    );
  });

  flushList();
  flushTable();
  return elements;
};

const Chatbot = () => {
  const location = useLocation();

  // Restrict chatbot strictly to User Flow
  // Explicitly excludes Partner Flow (/dashboard/accountants, /partner, /naavi-exclusive),
  // Admin Flow (/admin, /admin-dashboard), and public landing/auth pages.
  const isExcludedFlow =
    location.pathname.startsWith("/dashboard/accountants") ||
    location.pathname.startsWith("/partner") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/admin-dashboard") ||
    location.pathname.startsWith("/admin-login") ||
    location.pathname.startsWith("/naavi-exclusive");

  const isUserFlow =
    !isExcludedFlow &&
    (location.pathname.startsWith("/dashboard/users") ||
      location.pathname.startsWith("/dashboard/path") ||
      location.pathname.startsWith("/dashboard/step") ||
      location.pathname.startsWith("/paths") ||
      location.pathname.startsWith("/purchase/success"));

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Retrieve user details from localStorage if logged in
  const [userName, setUserName] = useState("");

  const [messages, setMessages] = useState(() => {
    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 **Welcome to Naaviverse!**\n\nI am **Naavi Assistant**, your AI pathway guide. Whether you are exploring academic destinations, selecting career roadmaps, or completing milestones in **Current Step**, I am here to guide you every step of the way!\n\nHow can I assist you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update user name from localStorage on mount and route changes
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name = parsed.name || parsed.firstName || (parsed.email ? parsed.email.split("@")[0] : "");
        setUserName(name || "");
      } else {
        setUserName("");
      }
    } catch (e) {
      setUserName("");
    }
  }, [location.pathname]);

  // Ensure chatbot automatically closes and resets whenever user logs out or leaves user flow
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!isUserFlow || !token) {
      setIsOpen(false);
      setIsClosing(false);
      setInputMessage("");
    }
  }, [location.pathname, isUserFlow]);

  // Listen for explicit logout/login events across the app to reset conversation and ensure closed state
  useEffect(() => {
    const handleResetSession = () => {
      setIsOpen(false);
      setIsClosing(false);
      setInputMessage("");
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "👋 **Welcome to Naaviverse!**\n\nI am **Naavi Assistant**, your AI pathway guide. Whether you are exploring academic destinations, selecting career roadmaps, or completing milestones in **Current Step**, I am here to guide you every step of the way!\n\nHow can I assist you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    };

    window.addEventListener("naavi:logout", handleResetSession);
    window.addEventListener("naavi:login", handleResetSession);
    return () => {
      window.removeEventListener("naavi:logout", handleResetSession);
      window.removeEventListener("naavi:login", handleResetSession);
    };
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      // Focus input field when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, messages, isLoading]);

  // Smooth drawer close
  const closeChat = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const openChat = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        closeChat();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, isClosing]);

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isClosing) {
      closeChat();
    }
  };

  // Toggle open/close
  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  // Clear conversation
  const handleClearConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `👋 **Conversation cleared!**\n\nHello${
          userName ? " " + userName : ""
        }! I am ready to help you navigate Naaviverse. You can ask about exploring pathways, tracking milestones in **My Journey**, or managing your wallet credits. What would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessageTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newUserMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: userMessageTime,
    };

    // Append user message immediately
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    // Format conversation history for API (filter welcome / limit to last 8 messages)
    const historyPayload = updatedMessages
      .filter((m) => m.id !== "welcome")
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await axios.post(
        `${BASE_URL}/api/chatbot/chat`,
        {
          message: query,
          conversationHistory: historyPayload,
          history: historyPayload,
          pageContext: location.pathname,
          userName: userName || undefined,
        },
        { timeout: 35000 }
      );

      const replyContent =
        response.data?.reply ||
        "I'm here to help you navigate Naaviverse! You can explore career pathways in **Paths**, follow your milestone roadmap in **My Journey**, or check your active task in **Current Step**.";

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (error) {
      console.error("[Naavi Chatbot API Error]:", error);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I had trouble connecting to the Naaviverse pathway engine. Please make sure you are connected or try asking your question again in a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isUserFlow) {
    return null;
  }

  return (
    <div className="naavi-chatbot-root">
      {/* Floating Chat Trigger Button */}
      <button
        type="button"
        className={`naavi-chat-floating-btn ${isOpen ? "active" : ""}`}
        onClick={toggleChat}
        aria-label={isOpen ? "Close Naavi Assistant" : "Open Naavi Assistant"}
        title={isOpen ? "Close Assistant" : "Ask Naavi AI"}
      >
        <span className="naavi-chat-logo-ring">
          <img src={chatbotLogo} alt="Naavi Assistant Logo" className="naavi-chat-avatar-img" />
        </span>
        {!isOpen && hasUnread && <span className="naavi-chat-unread-dot" />}
        {!isOpen && (
          <span className="naavi-chat-tooltip-pill">
            <span className="naavi-chat-pill-dot" />
            Ask Naavi AI
          </span>
        )}
      </button>

      {/* Modern Right-Side Sliding Drawer with Backdrop */}
      {(isOpen || isClosing) && (
        <div
          className={`naavi-chat-backdrop ${isClosing ? "naavi-chat-closing" : ""}`}
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            className={`naavi-chat-drawer naavi-chat-modal ${isClosing ? "naavi-chat-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Naavi Assistant Drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="naavi-chat-header">
              <div className="naavi-chat-header-profile">
                <div className="naavi-chat-header-avatar">
                  <img src={chatbotLogo} alt="Naavi Logo" />
                  <span className="naavi-chat-online-badge" />
                </div>
                <h3 className="naavi-chat-title">Naavi Assistant</h3>
              </div>

              <div className="naavi-chat-header-actions">
                <button
                  type="button"
                  className="naavi-chat-header-btn naavi-chat-clear-btn"
                  onClick={handleClearConversation}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="naavi-chat-header-btn naavi-chat-close-btn"
                  onClick={closeChat}
                  title="Close assistant"
                  aria-label="Close assistant"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="naavi-chat-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`naavi-chat-message-row ${
                    msg.role === "user" ? "user-message-row" : "assistant-message-row"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="naavi-chat-msg-avatar">
                      <img src={chatbotLogo} alt="Naavi" />
                    </div>
                  )}

                  <div className={`naavi-chat-bubble ${msg.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                    <div className="naavi-chat-bubble-content">
                      {msg.role === "assistant" ? renderFormattedMessage(msg.content) : msg.content}
                    </div>
                    <span className="naavi-chat-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="naavi-chat-message-row assistant-message-row">
                  <div className="naavi-chat-msg-avatar">
                    <img src={chatbotLogo} alt="Naavi" />
                  </div>
                  <div className="naavi-chat-bubble assistant-bubble typing-bubble">
                    <div className="naavi-typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="naavi-chat-suggestions">
              <div className="naavi-chat-suggestions-scroll">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    className="naavi-chat-pill-btn"
                    onClick={() => handleSendMessage(prompt.query)}
                    disabled={isLoading}
                  >
                    <span className="naavi-chat-pill-icon">{prompt.icon}</span>
                    <span className="naavi-chat-pill-label">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="naavi-chat-footer">
              <div className="naavi-chat-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="naavi-chat-input"
                  placeholder="Ask about paths, steps, credits, or features..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`naavi-chat-send-btn ${inputMessage.trim() && !isLoading ? "active" : ""}`}
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Send message"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

