import CustomSelect from '../../pages/accDashbaoard/CustomSelect';
import React, { useState, useEffect, useRef } from "react";
import "./MarketplaceAssistance.scss";
import marketplaceReplacementService from "../../services/marketplaceReplacementService";
import AdminMarketplaceRecommendationModal from "./AdminMarketplaceRecommendationModal";
import { SvgClose, SvgStarFilled } from "../../utils/SvgIcons";

const REASON_LABELS = {
  too_expensive: "Too expensive",
  wrong_location: "Wrong location",
  wrong_level: "Wrong level",
  wrong_duration: "Wrong duration",
  offline_preferred: "Offline preferred",
  online_preferred: "Online preferred",
  rating_not_suitable: "Rating not suitable",
  service_type_mismatch: "Service type mismatch",
  not_relevant: "Not relevant to goal",
  other: "Other requirement",
};

export default function AssistanceDetailsPage({
  request,
  onBack,
  onStatusChange,
}) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("details");
  const chatMessagesRef = useRef(null);

  const loadMessages = React.useCallback(async () => {
    if (!request?.id) return;
    try {
      const data = await marketplaceReplacementService.getMessages(request.id);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, [request?.id]);

  useEffect(() => {
    if (request?.id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [request?.id, loadMessages]);

  // Scroll ONLY the internal chat container, never the window / full page
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  if (!request) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Assistance Request Selected</h3>
        <button
          onClick={onBack}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const text = inputMsg.trim();
    setInputMsg("");
    setSending(true);

    try {
      const sent = await marketplaceReplacementService.sendMessage({
        requestId: request.id,
        senderId: "super_admin_lead",
        senderRole: "SUPER_ADMIN",
        senderName: "Naavi Support Lead",
        message: text,
      });
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleRecommendService = async (service, note) => {
    try {
      const sent = await marketplaceReplacementService.recommendServiceToUser({
        requestId: request.id,
        adminId: "super_admin_lead",
        adminName: "Naavi Support Lead",
        service,
        note,
        stepId: request.stepId || request.step_id,
        userEmail: request.userEmail || request.userId,
      });
      setMessages((prev) => [...prev, sent]);
      if (request.status === "pending" && onStatusChange) {
        onStatusChange({ ...request, status: "reviewing" });
      }
    } catch (err) {
      console.error("Error recommending service:", err);
    }
  };

  const reasonsList = request.userRequirement?.reasons || [];

  return (
    <div className="admin-assist-details-page-container">
      {/* Top Breadcrumbs & Action Bar */}
      <div className="adp-top-bar">
        <button className="adp-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Overview</span>
        </button>

        <div className="adp-header-actions">
          <div className="adp-status-updater">
            <span className="adp-status-label">Ticket Status:</span>
            <div className="project-desktop-custom-select inline" style={{ minWidth: "160px" }}>
              <CustomSelect
                value={request.status}
                onChange={(e) => onStatusChange && onStatusChange({ ...request, status: e.target.value })}
                options={[
                  { label: "Pending Review", value: "pending" },
                  { label: "In Review / Active Chat", value: "reviewing" },
                  { label: "Resolved", value: "resolved" },
                  { label: "Closed", value: "closed" },
                ]}
                searchable={false}
              />
            </div>
            <div className="project-mobile-native-select inline">
              <select
                className={`adp-status-select status-${request.status}`}
                value={request.status}
                onChange={(e) => onStatusChange && onStatusChange({ ...request, status: e.target.value })}
              >
                <option value="pending">Pending Review</option>
                <option value="reviewing">In Review / Active Chat</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <button
            className="adp-rec-btn"
            onClick={() => setShowRecModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 5 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Recommend Marketplace Service
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="adp-mobile-tab-nav">
        <button
          type="button"
          className={`adp-mobile-tab-btn ${activeMobileTab === "details" ? "active" : ""}`}
          onClick={() => setActiveMobileTab("details")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>Ticket Details</span>
        </button>
        <button
          type="button"
          className={`adp-mobile-tab-btn ${activeMobileTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveMobileTab("chat")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Live Chat {messages.length > 0 ? `(${messages.length})` : ""}</span>
        </button>
        <button
          type="button"
          className={`adp-mobile-tab-btn ${activeMobileTab === "all" ? "active" : ""}`}
          onClick={() => setActiveMobileTab("all")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
          <span>All</span>
        </button>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="adp-content-grid">
        {/* Left Column: Comprehensive Context */}
        <div className={`adp-left-col ${activeMobileTab === "chat" ? "mobile-hidden" : ""}`}>
          {/* Student Profile Card */}
          <div className="adp-card">
            <div className="adp-card-header">
              <div className="adp-card-icon user-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="adp-card-title-box">
                <h3 className="adp-card-title">Student Details</h3>
                <span className="adp-card-sub">Escalation Ticket #{request.id}</span>
              </div>
            </div>
            <div className="adp-meta-grid">
              <div className="adp-meta-cell">
                <span className="lbl">Name</span>
                <span className="val highlight">{request.userName || "Student"}</span>
              </div>
              <div className="adp-meta-cell">
                <span className="lbl">Email</span>
                <span className="val" style={{ wordBreak: "break-all", whiteSpace: "normal" }} title={request.userEmail}>{request.userEmail}</span>
              </div>
              <div className="adp-meta-cell">
                <span className="lbl">Submitted</span>
                <span className="val">
                  {new Date(request.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <div className="adp-meta-cell">
                <span className="lbl">Replacements</span>
                <span className="val count-badge">3 of 3 Exhausted</span>
              </div>
            </div>
          </div>

          {/* Path & Step Card */}
          <div className="adp-card">
            <div className="adp-card-header">
              <div className="adp-card-icon path-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <div className="adp-card-title-box">
                <h3 className="adp-card-title">Learning Path & Career Step</h3>
                <span className="adp-card-sub">Associated roadmapped milestone</span>
              </div>
            </div>
            <div className="adp-path-stack">
              <div className="adp-path-row">
                <span className="path-label">Learning Path:</span>
                <div className="path-pill-wrap">
                  <span className="tag-path">{request.pathName || "Learning Path"}</span>
                </div>
              </div>
              <div className="adp-path-row">
                <span className="path-label">Current Step:</span>
                <div className="path-pill-wrap">
                  <span className="tag-step">{request.stepName || "Learning Step"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Original Recommendation & Rejection History */}
          <div className="adp-card">
            <div className="adp-card-header">
              <div className="adp-card-icon item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="adp-card-title-box">
                <h3 className="adp-card-title">Marketplace Recommendations Evaluated</h3>
                <span className="adp-card-sub">Previous 3 options presented to student</span>
              </div>
            </div>

            <div className="adp-evaluated-list">
              <div className="adp-eval-item original">
                <div className="eval-info">
                  <span className="eval-tag">Original Recommendation</span>
                  <div className="eval-name">{request.originalItemName || "Primary Recommendation"}</div>
                </div>
                <span className="eval-status rejected">Rejected</span>
              </div>

              {(request.previousRecommendations || []).map((prev, idx) => (
                <div key={prev.id || idx} className="adp-eval-item">
                  <div className="eval-info">
                    <span className="eval-tag">Alternative #{idx + 1}</span>
                    <div className="eval-name">{prev.name || prev.id}</div>
                  </div>
                  <span className="eval-status rejected">Rejected</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student's Custom Requirement Statement */}
          <div className="adp-card highlight-card">
            <div className="adp-card-header">
              <div className="adp-card-icon note-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="adp-card-title-box">
                <h3 className="adp-card-title">Student's Stated Requirement</h3>
                <span className="adp-card-sub">Specific preferences & rejection reasons</span>
              </div>
            </div>

            {reasonsList.length > 0 && (
              <div className="adp-reasons-wrap">
                {reasonsList.map((r, i) => (
                  <span key={i} className="adp-reason-chip">
                    <SvgClose size={14} /> {REASON_LABELS[r] || r.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            <div className="adp-user-message-quote">
              <div className="quote-mark">“</div>
              <p>{request.userRequirement?.message || "No additional text provided."}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat & Admin Support Messenger */}
        <div className={`adp-right-col ${activeMobileTab === "details" ? "mobile-hidden" : ""}`}>
          <div className="adp-chat-card">
            <div className="adp-chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="chat-header-text">
                  <h3 className="chat-title">Live 2-Way Chat with {request.userName || "Student"}</h3>
                  <span className="chat-sub">Direct support thread & recommendation channel</span>
                </div>
              </div>
              <span className="chat-live-pulse">
                <span className="pulse-dot" /> Connected
              </span>
            </div>

            {/* Messages Body */}
            <div className="adp-chat-messages" ref={chatMessagesRef}>
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <p>No messages yet. Send a response to assist this student!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderRole === "SUPER_ADMIN";
                  return (
                    <div
                      key={m.id}
                      className={`adp-chat-bubble-wrap ${isAdmin ? "is-admin" : "is-user"}`}
                    >
                      <div className="bubble-meta">
                        <span className="sender-name">{m.senderName || (isAdmin ? "Naavi Support Lead" : request.userName)}</span>
                        <span className="time">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="bubble-content">
                        <div className="bubble-text">{m.message}</div>

                        {/* If a marketplace service was recommended in this message */}
                        {m.recommendedService && (
                          <div className="adp-rec-card-attached">
                            <div className="rec-badge"><SvgStarFilled size={12} color="#f59e0b" style={{ marginRight: 4, verticalAlign: "middle" }} />Recommended Alternative</div>
                            <div className="rec-title">{m.recommendedService.name}</div>
                            <div className="rec-desc">{m.recommendedService.goal || m.recommendedService.description}</div>
                            <div className="rec-footer">
                              <span className="rec-cost">
                                {m.recommendedService.cost && String(m.recommendedService.cost) !== "0"
                                  ? `₹${Number(m.recommendedService.cost).toLocaleString("en-IN")}`
                                  : "Free Resource"}
                              </span>
                              <span className="rec-type">{m.recommendedService.category || m.recommendedService.role}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="adp-chat-footer">
              <input
                type="text"
                className="chat-input"
                placeholder={`Type a message to ${request.userName || "the student"}...`}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={sending || !inputMsg.trim()}
                title="Send Message"
              >
                <span className="send-btn-label">{sending ? "Sending..." : "Send"}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recommendation Catalog Modal */}
      <AdminMarketplaceRecommendationModal
        isOpen={showRecModal}
        onClose={() => setShowRecModal(false)}
        onRecommend={handleRecommendService}
        studentName={request.userName}
        request={request}
      />
    </div>
  );
}
