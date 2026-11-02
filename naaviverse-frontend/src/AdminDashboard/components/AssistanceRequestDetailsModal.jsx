import CustomSelect from '../../pages/accDashbaoard/CustomSelect';
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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
  other: "Other",
};

export default function AssistanceRequestDetailsModal({
  isOpen,
  onClose,
  request,
  onStatusChange,
  availableServices = [],
}) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("details"); // "details" | "chat" | "all"
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Lock body scroll when modal is open so background does not scroll on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleCopyTicket = (e) => {
    e.stopPropagation();
    if (!request?.id) return;
    navigator.clipboard?.writeText(request.id);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleStatusUpdate = (newStatus) => {
    if (typeof onStatusChange === "function") {
      const updated = { ...request, status: newStatus };
      if (onStatusChange.length === 1) {
        onStatusChange(updated);
      } else {
        onStatusChange(request.id, newStatus);
      }
    }
  };

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
    if (isOpen && request?.id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, request?.id, loadMessages]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen || !request) return null;

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
      if (request.status === "pending") {
        handleStatusUpdate("reviewing");
      }
    } catch (err) {
      console.error("Error recommending service:", err);
    }
  };

  const reasonsList = request.userRequirement?.reasons || [];

  const modalElement = (
    <div className="admin-assist-details-overlay" onClick={onClose}>
      <div className="admin-assist-details-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="aadd-header">
          <div className="aadd-header-content">
            <div className="aadd-meta-top">
              <div className="aadd-meta-left">
                <span
                  className="aadd-id"
                  onClick={handleCopyTicket}
                  title="Click to copy Ticket ID"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span className="aadd-id-text">Ticket #{request.id}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copiedTicket && (
                    <span style={{ fontSize: "10.5px", color: "#16a34a", fontWeight: 700 }}>Copied!</span>
                  )}
                </span>
                <span className={`aadd-status-badge status-${request.status}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
              <button className="aadd-close-btn aadd-close-btn--inline" onClick={onClose} aria-label="Close details modal" title="Close"><SvgClose size={14} /></button>
            </div>
            <h2 className="aadd-title">
              <span className="aadd-user-name">{request.userName}</span>
              {request.userEmail && <span className="aadd-user-email"> ({request.userEmail})</span>}
            </h2>
            <div className="aadd-path-step">
              <span className="aadd-path-part">Path: <strong>{request.pathName}</strong></span>
              {request.stepName && <span className="aadd-step-part"> › Step: <strong>{request.stepName}</strong></span>}
            </div>
          </div>
          <button className="aadd-close-btn aadd-close-btn--desktop" onClick={onClose} aria-label="Close details modal" title="Close"><SvgClose size={14} /></button>
        </div>

        {/* Action Toolbar */}
        <div className="aadd-toolbar">
          <div className="aadd-status-select-wrap">
            <span className="status-lbl">Update Status:</span>
            <div className="project-desktop-custom-select inline" style={{ minWidth: "160px" }}>
              <CustomSelect
                value={request.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "In Review / Chatting", value: "reviewing" },
                  { label: "Resolved", value: "resolved" },
                ]}
                searchable={false}
              />
            </div>
            <div className="project-mobile-native-select inline">
              <select
              className="status-dropdown"
              value={request.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="reviewing">In Review / Chatting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            </div>
          </div>

          <button
            className="aadd-rec-btn"
            onClick={() => setShowRecModal(true)}
          >
            <SvgStarFilled size={14} /> Recommend Marketplace Item
          </button>
        </div>

        {/* Mobile Tab Switcher (Visible only on mobile <= 768px) */}
        <div className="aadd-mobile-tab-nav">
          <button
            type="button"
            className={`aadd-mobile-tab-btn ${activeMobileTab === "details" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("details")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Ticket Details</span>
          </button>
          <button
            type="button"
            className={`aadd-mobile-tab-btn ${activeMobileTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("chat")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Live Chat {messages.length > 0 ? `(${messages.length})` : ""}</span>
          </button>
          <button
            type="button"
            className={`aadd-mobile-tab-btn ${activeMobileTab === "all" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("all")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
            <span>All</span>
          </button>
        </div>

        {/* Content Container (Two Column / Split) */}
        <div className={`aadd-content-grid tab-${activeMobileTab}`}>
          {/* Left Column: Requirements & History */}
          <div className="aadd-info-pane">
            <div className="aadd-card">
              <h4 className="card-title">User Requirement Statement</h4>
              <p className="req-quote">
                "{request.userRequirement?.message || "User requested customized options after 3 replacement rounds."}"
              </p>
              {reasonsList.length > 0 && (
                <div className="reasons-wrap">
                  <div className="reasons-title">Rejection Reasons Tagged:</div>
                  <div className="reasons-chips">
                    {reasonsList.map((r, i) => (
                      <span key={i} className="r-chip">
                        {REASON_LABELS[r] || r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Previous Recommendations */}
            <div className="aadd-card">
              <h4 className="card-title">
                Previous Recommendations ({request.previousRecommendations?.length || 0} / 3)
              </h4>
              <div className="prev-items-list">
                {request.previousRecommendations?.map((item, idx) => (
                  <div key={item.id || item._id || idx} className="prev-item-row">
                    <div className="pir-left">
                      <span className="pir-num">#{idx + 1}</span>
                      <div>
                        <div className="pir-name">{item.name || `Service ${item}`}</div>
                        {item.cost !== undefined && (
                          <div className="pir-cost">
                            Cost: {item.cost === 0 || item.cost === "0" ? "Free" : `₹${item.cost}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="pir-badge">Rejected</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Chat History */}
          <div className="aadd-chat-pane">
            <div className="chat-pane-header">
              <h4>Conversation with {request.userName}</h4>
              <span className="chat-count">{messages.length} messages</span>
            </div>

            <div className="admin-chat-messages" ref={chatMessagesRef}>
              {messages.length === 0 ? (
                <div className="chat-empty">No messages yet. Send the first message to the user below.</div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderRole === "SUPER_ADMIN";
                  return (
                    <div key={m.id} className={`adm-msg-wrap ${isAdmin ? "from-admin" : "from-user"}`}>
                      <div className="adm-msg-header">
                        <span className="adm-msg-name" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {isAdmin ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              </svg> You (Super Admin)
                            </>
                          ) : m.senderName}
                        </span>
                        <span className="adm-msg-time">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className={`adm-msg-bubble ${isAdmin ? "adm-bubble" : "usr-bubble"}`}>
                        <div className="adm-msg-text">{m.message}</div>
                        {m.recommendedService && (
                          <div className="admin-rec-attached">
                            <div className="ara-tag" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg> Recommended to User
                            </div>
                            <div className="ara-title">{m.recommendedService.name}</div>
                            <div className="ara-price">
                              Price: {!m.recommendedService.cost || m.recommendedService.cost === "0"
                                ? "Free"
                                : `₹${Number(m.recommendedService.cost).toLocaleString("en-IN")}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="admin-chat-input-row">
              <input
                type="text"
                placeholder="Type response to user..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sending}
              />
              <button type="submit" disabled={!inputMsg.trim() || sending}>
                {sending ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>

        {/* Recommend Modal */}
        <AdminMarketplaceRecommendationModal
          isOpen={showRecModal}
          onClose={() => setShowRecModal(false)}
          onRecommend={handleRecommendService}
          availableServices={availableServices}
          request={request}
          studentName={request?.userName}
        />
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? ReactDOM.createPortal(modalElement, document.body)
    : modalElement;
}

