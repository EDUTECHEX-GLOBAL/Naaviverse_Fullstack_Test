import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./PartnerChatbot.scss";

// Reference chatbot logo
import chatbotLogo from "../../assets/images/assets/chatbot-logo.png";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4545";

// Quick suggestion prompts tailored specifically for Naaviverse Partners
const SUGGESTED_PROMPTS = [
  {
    id: "paths",
    label: "My Paths",
    query: "How do I create and manage pathways in My Paths?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
  },
  {
    id: "steps",
    label: "My Steps",
    query: "How do I author milestones with Macro, Micro, and Nano views in My Steps?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: "crm",
    label: "Partner CRM",
    query: "How do I track students and client progress in CRM?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "marketplace",
    label: "Marketplace",
    query: "How do I list services and offerings in the Marketplace?",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: "guide",
    label: "Page Guide",
    query: "What features are available on my current partner dashboard page?",
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

  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let currentTable = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="naavi-partner-chat-bullet-list">
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
          const cells = row
            .split("|")
            .map((c) => c.trim())
            .filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
          return cells;
        })
        .filter((row) => row.length > 0 && !row.every((cell) => /^[-:\s]+$/.test(cell)));

      if (parsedRows.length > 0) {
        const headerRow = parsedRows[0];
        const bodyRows = parsedRows.slice(1);

        elements.push(
          <div key={`table-wrapper-${elements.length}`} className="naavi-partner-chat-table-wrapper">
            <table className="naavi-partner-chat-table">
              {headerRow && (
                <thead>
                  <tr>
                    {headerRow.map((cell, idx) => (
                      <th key={idx}>{parseInlineText(cell)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              {bodyRows.length > 0 && (
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{parseInlineText(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        );
      }
      currentTable = [];
    }
  };

  const parseInlineText = (lineText) => {
    if (!lineText) return null;

    // Tokenize markdown bold (**text**), inline code (`code`), and markdown links [text](url)
    const tokens = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(lineText)) !== null) {
      if (match.index > lastIdx) {
        tokens.push(lineText.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        tokens.push(
          <strong key={`b-${tokens.length}`}>{token.slice(2, -2)}</strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        tokens.push(
          <code key={`c-${tokens.length}`} className="naavi-partner-chat-code-inline">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const textMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (textMatch) {
          tokens.push(
            <a
              key={`a-${tokens.length}`}
              href={textMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="naavi-partner-chat-link"
            >
              {textMatch[1]}
            </a>
          );
        } else {
          tokens.push(token);
        }
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < lineText.length) {
      tokens.push(lineText.substring(lastIdx));
    }

    return tokens.length > 0 ? tokens : lineText;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
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
      elements.push(<div key={`spacer-${index}`} className="naavi-partner-chat-spacer" />);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h5 key={`h5-${index}`} className="naavi-partner-chat-heading-h5">
          {parseInlineText(trimmed.replace(/^###\s+/, ""))}
        </h5>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h4 key={`h4-${index}`} className="naavi-partner-chat-heading-h4">
          {parseInlineText(trimmed.replace(/^##\s+/, ""))}
        </h4>
      );
      return;
    }

    // Blockquote / Tip
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div key={`quote-${index}`} className="naavi-partner-chat-callout">
          {parseInlineText(trimmed.replace(/^>\s+/, ""))}
        </div>
      );
      return;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={`hr-${index}`} className="naavi-partner-chat-divider" />);
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${index}`} className="naavi-partner-chat-paragraph">
        {parseInlineText(trimmed)}
      </p>
    );
  });

  flushList();
  flushTable();
  return elements;
};

const PartnerChatbot = () => {
  const location = useLocation();
  const rawPath = location?.pathname || "";
  const pathname = rawPath.toLowerCase();

  // Restrict Partner Chatbot strictly to Partner Flow pages.
  // Explicitly excludes User Flow (/dashboard/users, /paths),
  // Admin Flow (/admin, /admin-dashboard), and public landing/auth pages.
  const isExcludedFlow =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin-dashboard") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/path") ||
    pathname.startsWith("/dashboard/step") ||
    pathname.startsWith("/paths") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/purchase/success");

  const isPartnerFlow =
    !isExcludedFlow &&
    (pathname.startsWith("/dashboard/accountants") ||
      pathname.startsWith("/partner/exclusive-dashboard") ||
      pathname.includes("/accountants"));

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Retrieve partner details from localStorage if logged in
  const [partnerName, setPartnerName] = useState("");

  const [messages, setMessages] = useState(() => {
    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 **Welcome to Naaviverse Partner Portal!**\n\nI am **Partner Chatbot**, your dedicated AI assistant for managing educational pathways, creating learning milestones in **My Steps**, tracking enrolled students in **CRM**, and publishing offerings in the **Marketplace**.\n\nHow can I help you manage your partner portal today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update partner name from localStorage on mount and route changes
  useEffect(() => {
    try {
      const storedPartner = localStorage.getItem("partner");
      if (storedPartner) {
        const parsed = JSON.parse(storedPartner);
        const name =
          parsed.businessName ||
          parsed.username ||
          parsed.firstName ||
          (parsed.email ? parsed.email.split("@")[0] : "");
        setPartnerName(name || "");
      } else {
        setPartnerName("");
      }
    } catch (e) {
      setPartnerName("");
    }
  }, [location.pathname]);

  // Ensure chatbot automatically closes and resets whenever partner logs out or leaves partner flow
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!isPartnerFlow || !token) {
      setIsOpen(false);
      setIsClosing(false);
      setInputMessage("");
    }
  }, [location.pathname, isPartnerFlow]);

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
            "👋 **Welcome to Naaviverse Partner Portal!**\n\nI am **Partner Chatbot**, your dedicated AI assistant for managing educational pathways, creating learning milestones in **My Steps**, tracking enrolled students in **CRM**, and publishing offerings in the **Marketplace**.\n\nHow can I help you manage your partner portal today?",
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
          partnerName ? " " + partnerName : ""
        }! I am ready to help you navigate your Partner Portal. You can ask about creating pathways in **My Paths**, authoring milestones in **My Steps**, tracking enrolled learners in **CRM**, or listing offerings in the **Marketplace**. What would you like to explore?`,
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
          userRole: "partner",
          userName: partnerName || undefined,
        },
        { timeout: 35000 }
      );

      const replyContent =
        response.data?.reply ||
        "I'm here to assist you with the Partner Portal! You can build pathways in **My Paths**, author milestones in **My Steps**, track clients in **CRM**, or list services in the **Marketplace**.";

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
      console.error("[Naavi Partner Chatbot API Error]:", error);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I had trouble connecting to the partner engine. Please make sure you are connected or try asking your question again in a moment!",
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

  if (!isPartnerFlow) {
    return null;
  }

  return (
    <div className="naavi-partner-chatbot-root">
      {/* Floating Chat Trigger Button */}
      <button
        type="button"
        className={`naavi-partner-chat-floating-btn ${isOpen ? "active" : ""}`}
        onClick={toggleChat}
        aria-label={isOpen ? "Close Partner Chatbot" : "Open Partner Chatbot"}
        title={isOpen ? "Close Assistant" : "Ask Partner AI"}
      >
        <span className="naavi-partner-chat-logo-ring">
          <img src={chatbotLogo} alt="Partner Chatbot Logo" className="naavi-partner-chat-avatar-img" />
        </span>
        {!isOpen && hasUnread && <span className="naavi-partner-chat-unread-dot" />}
        {!isOpen && (
          <span className="naavi-partner-chat-tooltip-pill">
            <span className="naavi-partner-chat-pill-dot" />
            Ask Partner AI
          </span>
        )}
      </button>

      {/* Modern Right-Side Sliding Drawer with Backdrop */}
      {(isOpen || isClosing) && (
        <div
          className={`naavi-partner-chat-backdrop ${isClosing ? "naavi-partner-chat-closing" : ""}`}
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            className={`naavi-partner-chat-drawer naavi-partner-chat-modal ${isClosing ? "naavi-partner-chat-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Partner Chatbot Drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="naavi-partner-chat-header">
              <div className="naavi-partner-chat-header-profile">
                <div className="naavi-partner-chat-header-avatar">
                  <img src={chatbotLogo} alt="Partner Logo" />
                  <span className="naavi-partner-chat-online-badge" />
                </div>
                <div className="naavi-partner-chat-header-info">
                  <h3 className="naavi-partner-chat-title">Partner Chatbot</h3>
                  <span className="naavi-partner-chat-badge">Partner</span>
                </div>
              </div>

              <div className="naavi-partner-chat-header-actions">
                <button
                  type="button"
                  className="naavi-partner-chat-header-btn naavi-partner-chat-clear-btn"
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
                  className="naavi-partner-chat-header-btn naavi-partner-chat-close-btn"
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
            <div className="naavi-partner-chat-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`naavi-partner-chat-message-row ${
                    msg.role === "user" ? "partner-user-message-row" : "partner-assistant-message-row"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="naavi-partner-chat-msg-avatar">
                      <img src={chatbotLogo} alt="Naavi Partner" />
                    </div>
                  )}

                  <div className={`naavi-partner-chat-bubble ${msg.role === "user" ? "partner-user-bubble" : "partner-assistant-bubble"}`}>
                    <div className="naavi-partner-chat-bubble-content">
                      {msg.role === "assistant" ? renderFormattedMessage(msg.content) : msg.content}
                    </div>
                    <span className="naavi-partner-chat-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="naavi-partner-chat-message-row partner-assistant-message-row">
                  <div className="naavi-partner-chat-msg-avatar">
                    <img src={chatbotLogo} alt="Naavi Partner" />
                  </div>
                  <div className="naavi-partner-chat-bubble partner-assistant-bubble partner-typing-bubble">
                    <div className="naavi-partner-typing-indicator">
                      <span className="partner-typing-dot" />
                      <span className="partner-typing-dot" />
                      <span className="partner-typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="naavi-partner-chat-suggestions">
              <div className="naavi-partner-chat-suggestions-scroll">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    className="naavi-partner-chat-pill-btn"
                    onClick={() => handleSendMessage(prompt.query)}
                    disabled={isLoading}
                  >
                    <span className="naavi-partner-chat-pill-icon">{prompt.icon}</span>
                    <span className="naavi-partner-chat-pill-label">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="naavi-partner-chat-footer">
              <div className="naavi-partner-chat-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="naavi-partner-chat-input"
                  placeholder="Ask about paths, steps, CRM, or marketplace..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`naavi-partner-chat-send-btn ${inputMessage.trim() && !isLoading ? "active" : ""}`}
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

export default PartnerChatbot;

