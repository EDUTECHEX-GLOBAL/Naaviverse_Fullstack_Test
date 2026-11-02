import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "./Dashboard.scss";
import { useNavigate } from "react-router-dom";
import marketplaceReplacementService from "../../services/marketplaceReplacementService";
import AssistanceRequestDetailsModal from "../../AdminDashboard/components/AssistanceRequestDetailsModal";
import AssistanceDetailsPage from "../../AdminDashboard/components/AssistanceDetailsPage";
import SuperAdminCustomPathBuilder from "../../AdminDashboard/components/SuperAdminCustomPathBuilder";
import { SvgBuilding, SvgClock, SvgGraduation, SvgPin, SvgCheck, SvgClose, SvgBan, SvgHourglass, SvgSparkles, SvgClipboard, SvgGlobe } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ── Portal Dropdown ──────────────────────────────────────────────────────────
function PortalDropdown({ anchorRef, isOpen, onClose, children }) {
  const [pos, setPos] = useState(null);

  const updatePos = useCallback(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 768;

      if (isMobile) {
        // Mobile: align with button left edge, clamped within safe margins so it's never cut off
        const dropdownWidth = 210;
        const left = Math.max(12, Math.min(rect.left, viewportWidth - dropdownWidth - 12));
        setPos({
          top: rect.bottom + 6,
          left,
          isMobile: true,
        });
      } else {
        // Desktop: preserve existing exact behavior (anchor to right with translateX(-100%))
        setPos({
          top: rect.bottom + 6,
          left: rect.right,
          isMobile: false,
        });
      }
    } else {
      setPos(null);
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    updatePos();
    if (isOpen) {
      window.addEventListener("resize", updatePos);
      window.addEventListener("scroll", updatePos, true);
      return () => {
        window.removeEventListener("resize", updatePos);
        window.removeEventListener("scroll", updatePos, true);
      };
    }
  }, [isOpen, updatePos]);

  if (!isOpen || !pos) return null;

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }} />
      <div
        className={`role-dropdown-menu ${pos.isMobile ? "mobile-dropdown" : ""}`}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: pos.isMobile ? "none" : "translateX(-100%)",
          zIndex: 99999,
          minWidth: "210px",
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

// ── Notif Config ─────────────────────────────────────────────────────────────
const NOTIF_CONFIG = {
  path: {
    bg: "#ede9fe",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 17L8 7l4 6 4-4 4 8" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tag: "Path", tagBg: "#ede9fe", tagColor: "#7c3aed",
  },
  purchase: {
    bg: "#dcfce7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tag: "Purchase", tagBg: "#dcfce7", tagColor: "#15803d",
  },
  approval: {
    bg: "#fef3c7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    tag: "Approval", tagBg: "#fef3c7", tagColor: "#b45309",
  },
  system: {
    bg: "#f1f5f9",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    tag: "System", tagBg: "#f1f5f9", tagColor: "#475569",
  },
};

// ── NotifItem Component ───────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onView, full = false }) {
  const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.system;

  if (full) {
    return (
      <div className={`full-notif-item ${notif.unread ? "unread" : ""}`}>
        <div className="full-notif-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
        <div className="full-notif-body">
          <div className="full-notif-title">{notif.title}</div>
          <div className="full-notif-desc">{notif.desc}</div>
          <div className="full-notif-meta">
            <span className="full-notif-time">{notif.time}</span>
            <span className="full-notif-tag" style={{ background: cfg.tagBg, color: cfg.tagColor }}>{cfg.tag}</span>
          </div>
        </div>
        <div className="full-notif-right">
          {notif.unread && <div className="full-unread-dot" />}
          <button className="full-view-btn" onClick={(e) => { e.stopPropagation(); onView(); }}>View →</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`notif-dd-item ${notif.unread ? "unread" : ""}`} onClick={onRead}>
      <div className="notif-dd-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
      <div className="notif-dd-body">
        <div className="notif-dd-item-title">{notif.title}</div>
        <div className="notif-dd-item-desc">{notif.desc}</div>
        <div className="notif-dd-item-time">{notif.time}</div>
      </div>
      <div className="notif-dd-right">
        {notif.unread && <div className="notif-unread-dot" />}
        <button className="notif-item-view-btn" onClick={(e) => { e.stopPropagation(); onView(); }}>View</button>
      </div>
    </div>
  );
}

// REMOVE emoji fields entirely — they're used in activity timeline icons
// Replace: emoji: "[search]" → use SVG in activity-tl-icon directly

const TYPE_CONFIG = {
  login: {
    bg: "#f1f5f9", color: "#475569", chipClass: "activity-chip-login",
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
  },
  explore: {
    bg: "#fef3c7", color: "#b45309", chipClass: "activity-chip-explore",
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
  },
  path: {
    bg: "#ede9fe", color: "#7c3aed", chipClass: "activity-chip-path",
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><path d="M4 17L8 7l4 6 4-4 4 8" /></svg>
  },
  market: {
    bg: "#cffafe", color: "#0e7490", chipClass: "activity-chip-market",
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
  },
  step: {
    bg: "#dcfce7", color: "#15803d", chipClass: "activity-chip-path",
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  },
};

const STATUS_COLORS = {
  active: "#22c55e",
  idle: "#f59e0b",
  offline: "#94a3b8",
};

const AVATAR_PALETTE = [
  { color: "#ede9fe", textColor: "#6d28d9" },
  { color: "#fef3c7", textColor: "#b45309" },
  { color: "#fce7f3", textColor: "#be185d" },
  { color: "#e0f2fe", textColor: "#0369a1" },
  { color: "#dcfce7", textColor: "#15803d" },
  { color: "#fff7ed", textColor: "#c2410c" },
];

const PARTNER_STATUS_COLORS = { active: "#22c55e", idle: "#f59e0b", offline: "#94a3b8" };
const PARTNER_AVATAR_PALETTE = [
  { color: "#d1fae5", textColor: "#065f46" },
  { color: "#a7f3d0", textColor: "#047857" },
  { color: "#6ee7b7", textColor: "#065f46" },
  { color: "#d1fae5", textColor: "#047857" },
  { color: "#ecfdf5", textColor: "#059669" },
];
const PURCHASE_AVATAR_PALETTE = [
  { color: "#e0e7ff", textColor: "#3730a3" },
  { color: "#c7d2fe", textColor: "#4338ca" },
  { color: "#a5b4fc", textColor: "#3730a3" },
  { color: "#e0e7ff", textColor: "#4f46e5" },
  { color: "#ede9fe", textColor: "#4338ca" },
];
const PLAN_BADGE_CLASS = { Micro: "plan-micro", Nano: "plan-nano", Bundle: "plan-bundle", Premium: "plan-premium" };

const renderEventTitle = (title) => {
  if (!title) return null;
  const match = typeof title === "string" && title.match(/^Selected Path:\s*(.*)$/i);
  if (match) {
    const pathText = match[1].trim();
    const bulletIdx = pathText.indexOf(" • ");
    let line1 = pathText;
    let line2 = "";
    if (bulletIdx !== -1) {
      line1 = pathText.slice(0, bulletIdx).trim();
      line2 = pathText.slice(bulletIdx + 3).trim();
    } else {
      const words = pathText.split(" ");
      if (words.length > 5) {
        const mid = Math.ceil(words.length / 2);
        line1 = words.slice(0, mid).join(" ");
        line2 = words.slice(mid).join(" ");
      }
    }
    return (
      <div style={{ minWidth: 0, lineHeight: 1.35 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-800)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 8px" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#ede9fe",
            color: "#6d28d9",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "4px",
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            flexShrink: 0
          }}>
            Selected Path
          </span>
          <span style={{ color: "var(--slate-800)", fontWeight: 600 }}>{line1}</span>
        </div>
        {line2 && (
          <div style={{ fontSize: 12, color: "var(--slate-500)", marginTop: 2, overflowWrap: "break-word", wordBreak: "normal" }}>
            {line2}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-800)", lineHeight: 1.35, overflowWrap: "break-word", wordBreak: "normal" }}>
      {title}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [view, setView] = useState("home");
  const navigate = useNavigate();

  // ── Notification state ────────────────────────────────────────────────────
  const READ_NOTIFS_KEY = "admin_read_notif_ids";
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");
  const notifDropdownRef = useRef(null);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const [selectedPartnerUser, setSelectedPartnerUser] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [partnerActivityTab, setPartnerActivityTab] = useState("all");
  const [purchaseTab, setPurchaseTab] = useState("all");

  const fetchNotifications = useCallback(() => {
    setNotifsLoading(true);
    axios
      .get(`${BASE_URL}/api/dashboard/notifications`)
      .then(({ data }) => {
        if (data?.status && Array.isArray(data.notifications)) {
          let readIds = new Set();
          try {
            readIds = new Set(JSON.parse(localStorage.getItem(READ_NOTIFS_KEY) || "[]"));
          } catch (e) {
            readIds = new Set();
          }

          const formatted = data.notifications.map((n) => ({
            ...n,
            unread: !readIds.has(n.id),
          }));
          setNotifications(formatted);
        }
      })
      .catch((err) => console.error("Admin notifications error:", err))
      .finally(() => setNotifsLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = () => {
    setNotifications((prev) => {
      const allIds = prev.map((n) => n.id);
      try {
        const existing = new Set(JSON.parse(localStorage.getItem(READ_NOTIFS_KEY) || "[]"));
        allIds.forEach((id) => existing.add(id));
        localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...existing]));
      } catch (e) {
        console.error("Failed to save read notifs:", e);
      }
      return prev.map((n) => ({ ...n, unread: false }));
    });
  };

  const markOneRead = (id) => {
    try {
      const existing = new Set(JSON.parse(localStorage.getItem(READ_NOTIFS_KEY) || "[]"));
      existing.add(id);
      localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...existing]));
    } catch (e) {
      console.error("Failed to save read notif:", e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleNotifView = (n) => {
    markOneRead(n.id);
    setShowNotifDropdown(false);

    const isPartnerNotif =
      n.targetTab === "partnerActivity" ||
      n.role === "partner" ||
      (n.title && /partner/i.test(n.title)) ||
      (n.desc && /partner|signed in to the portal/i.test(n.desc));

    if (n.targetTab === "paths" || n.type === "path") {
      navigate("/admin/dashboard/paths?tab=active");
    } else if (n.targetTab === "crm") {
      navigate("/admin/dashboard/crm");
    } else if (n.targetTab === "approvals" || n.type === "approval") {
      setView("approvals");
      setSelected(null);
      setTab("all");
    } else if (n.targetTab === "marketplace") {
      if (n.id && typeof n.id === "string" && n.id.startsWith("ast-")) {
        const ticketId = n.targetId || n.id.replace("ast-", "");
        const matched = assistanceRequests.find(
          (r) => r.ticketId === ticketId || r.id === ticketId || r._id === ticketId
        );
        if (matched) {
          setSelectedAssistanceRequest(matched);
          setView("assistanceDetails");
          return;
        }
      }
      navigate("/admin/dashboard/marketplace?tab=assistance");
    } else if (isPartnerNotif) {
      setView("partnerActivity");
      if (typeof fetchPartnerActivity === "function") {
        fetchPartnerActivity();
      }
      const notifEmail = (
        n.actorEmail ||
        n.email ||
        (n.desc ? (n.desc.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "") : "")
      ).toLowerCase();

      const matched = partnerActivityUsers.find((p) => {
        if (n.targetId && (String(p.id) === String(n.targetId) || String(p._id) === String(n.targetId))) return true;
        if (notifEmail && p.email && p.email.toLowerCase() === notifEmail) return true;
        if (p.name && n.desc && n.desc.toLowerCase().includes(p.name.toLowerCase())) return true;
        return false;
      });

      if (matched) {
        const pal = matched.palette || PARTNER_AVATAR_PALETTE[0];
        setSelectedPartnerUser({ ...matched, palette: pal });
      } else {
        setSelectedPartnerUser(null);
      }
    } else if (n.targetTab === "activity") {
      setView("activity");
      const notifEmail = (
        n.actorEmail ||
        n.email ||
        (n.desc ? (n.desc.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "") : "")
      ).toLowerCase();

      const matched = activityUsers.find((u) => {
        if (n.targetId && (String(u.id) === String(n.targetId) || String(u._id) === String(n.targetId))) return true;
        if (notifEmail && u.email && u.email.toLowerCase() === notifEmail) return true;
        if (u.name && n.desc && n.desc.toLowerCase().includes(u.name.toLowerCase())) return true;
        return false;
      });

      if (matched) {
        const pal = matched.palette || AVATAR_PALETTE[0];
        setSelectedActivityUser({ ...matched, palette: pal });
      } else {
        setSelectedActivityUser(null);
      }
    } else if (n.type === "purchase") {
      setView("purchaseActivity");
      setSelectedPurchase(null);
    } else {
      setView("home");
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target))
        setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // ── Dashboard stats ───────────────────────────────────────────────────────
  const [dashStats, setDashStats] = useState({
    paths: { total: 0, active: 0, inactive: 0, pending: 0 },
    marketplace: { total: 0, institution: 0, mentor: 0, distributor: 0, vendor: 0 },
    approvals: { total: 0, approved: 0, pending: 0, rejected: 0 },
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    setStatsLoading(true);
    axios
      .get(`${BASE_URL}/api/dashboard/stats`)
      .then(({ data }) => { if (data?.status) setDashStats(data.data); })
      .catch((err) => console.error("Dashboard stats error:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  // ── Activity users ────────────────────────────────────────────────────────
  const [activityUsers, setActivityUsers] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchActivityUsers = () => {
    setActivityLoading(true);
    axios
      .get(`${BASE_URL}/api/activity/users`)
      .then(({ data }) => { if (data?.status) setActivityUsers(data.data); })
      .catch((err) => console.error("Activity users error:", err))
      .finally(() => setActivityLoading(false));
  };

  useEffect(() => { fetchActivityUsers(); }, []);

  // ── Partner activity (from API) ──────────────────────────────────────────
  const [partnerActivityUsers, setPartnerActivityUsers] = useState([]);
  const [partnerActivityLoading, setPartnerActivityLoading] = useState(false);

  const fetchPartnerActivity = () => {
    setPartnerActivityLoading(true);
    axios
      .get(`${BASE_URL}/api/activity/partners`)
      .then(({ data }) => { if (data?.status) setPartnerActivityUsers(data.data); })
      .catch((err) => console.error("Partner activity error:", err))
      .finally(() => setPartnerActivityLoading(false));
  };

  useEffect(() => { fetchPartnerActivity(); }, []);

  // ── Purchases (from API) ─────────────────────────────────────────────────
  const [purchases, setPurchases] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState({
    total: 0, today: 0, pending: 0, completed: 0, revenue: "₹0", revenuePaise: 0,
  });
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const fetchPurchases = () => {
    setPurchasesLoading(true);
    axios
      .get(`${BASE_URL}/api/purchases`)
      .then(({ data }) => {
        if (data?.status) {
          setPurchases(data.data);
          setPurchaseStats(data.stats);
        }
      })
      .catch((err) => console.error("Purchases error:", err))
      .finally(() => setPurchasesLoading(false));
  };

  useEffect(() => { fetchPurchases(); }, []);

  // ── Marketplace Assistance Requests state ──────────────────────────────────
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [selectedAssistanceRequest, setSelectedAssistanceRequest] = useState(null);
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);

  const fetchAssistanceRequests = async () => {
    try {
      const data = await marketplaceReplacementService.getAllAssistanceRequests();
      setAssistanceRequests(data || []);
    } catch (err) {
      console.error("Failed to fetch assistance requests:", err);
    }
  };

  useEffect(() => {
    fetchAssistanceRequests();
    const interval = setInterval(fetchAssistanceRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Approvals state ───────────────────────────────────────────────────────
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(null);
  const [roleView, setRoleView] = useState("partner"); // "partner" | "user" | "pathRequests"
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [partnerScope, setPartnerScope] = useState("all"); // "all" | "internal" | "external"
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [partnerData, setPartnerData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fullUserData, setFullUserData] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);
  const [approvalConfirmModal, setApprovalConfirmModal] = useState(null); // { type: "approve" | "reject", id, roleName, businessName }

  useEffect(() => {
    if (!approvalConfirmModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setApprovalConfirmModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approvalConfirmModal]);

  // ── User Path Requests state ──────────────────────────────────────────────
  const [pathRequests, setPathRequests] = useState([]);
  const [pathRequestsLoading, setPathRequestsLoading] = useState(false);
  const [pathRequestsTab, setPathRequestsTab] = useState("all");
  const [pathRequestsCounts, setPathRequestsCounts] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    created: 0,
    rejected: 0,
  });
  const [selectedPathRequest, setSelectedPathRequest] = useState(null);

  const fetchPathRequests = useCallback(async (tabStatus = pathRequestsTab) => {
    try {
      setPathRequestsLoading(true);
      const params = {};
      if (tabStatus && tabStatus !== "all") params.status = tabStatus;
      const res = await axios.get(`${BASE_URL}/api/path-requests/all`, { params });
      if (res.data?.status) {
        setPathRequests(res.data.data || []);
        if (res.data.counts) setPathRequestsCounts(res.data.counts);
      }
    } catch (err) {
      console.error("Error fetching path requests:", err);
    } finally {
      setPathRequestsLoading(false);
    }
  }, [pathRequestsTab]);

  useEffect(() => {
    fetchPathRequests();
    const interval = setInterval(() => fetchPathRequests(), 15000);
    return () => clearInterval(interval);
  }, [fetchPathRequests]);

  const updatePathRequestStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`${BASE_URL}/api/path-requests/${id}/status`, { status: newStatus });
      if (res.data?.status) {
        fetchPathRequests(pathRequestsTab);
        if (selectedPathRequest && (selectedPathRequest._id === id || selectedPathRequest.id === id)) {
          setSelectedPathRequest((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Error updating path request status:", err);
    }
  };

  const dropdownRef = useRef(null);
  const scopeDropdownRef = useRef(null);

  const fetchApprovals = useCallback((role, setter, showLoading = true) => {
    if (showLoading) setLoadingData(true);
    return axios
      .get(`${BASE_URL}/api/approvals/get?role=${role}`)
      .then((res) => {
        if (res.data?.status) {
          setter(res.data.data || []);
        }
      })
      .catch((err) => console.error(`Error fetching ${role} approvals:`, err))
      .finally(() => {
        if (showLoading) setLoadingData(false);
      });
  }, []);

  // Fetch both Partner & User approvals and Path Requests immediately on initial render & section load
  const fetchAllApprovalsData = useCallback(() => {
    fetchApprovals("Partner", setPartnerData, roleView === "partner");
    fetchApprovals("User", setUserData, roleView === "user");
    fetchPathRequests("all");
  }, [fetchApprovals, fetchPathRequests, roleView]);

  // Initial render: immediately pre-fetch all counts so dropdown has accurate numbers without any click
  useEffect(() => {
    fetchAllApprovalsData();
  }, [fetchAllApprovalsData]);

  // Whenever switching to approvals section or changing role views, ensure counts and table data are up-to-date
  useEffect(() => {
    if (view === "approvals") {
      fetchApprovals("Partner", setPartnerData, roleView === "partner");
      fetchApprovals("User", setUserData, roleView === "user");
      if (roleView === "pathRequests") {
        fetchPathRequests(pathRequestsTab);
      } else {
        fetchPathRequests("all");
      }
    }
  }, [view, roleView, pathRequestsTab, fetchApprovals, fetchPathRequests]);

  useEffect(() => {
    if (!selected) { setFullUserData(null); return; }
    if (selected.role?.toLowerCase() !== "user") { setFullUserData(null); return; }
    setLoadingUserDetail(true);
    axios
      .get(`${BASE_URL}/api/users/get/${selected.email}`)
      .then((res) => { if (res.data?.status) setFullUserData(res.data.data); })
      .catch((err) => console.error("Error fetching full user data:", err))
      .finally(() => setLoadingUserDetail(false));
  }, [selected]);

  const activeData = roleView === "partner" ? partnerData : userData;
  const scopedData = (roleView === "partner" && partnerScope !== "all")
    ? activeData.filter((a) => a.partnerScope === partnerScope)
    : activeData;
  const filtered = tab === "all" ? scopedData : scopedData.filter((a) => a.status === tab);

  // Counts for scope sub-dropdown
  const internalCount = partnerData.filter((a) => a.partnerScope === "internal").length;
  const externalCount = partnerData.filter((a) => a.partnerScope === "external").length;

  const approve = (id) => {
    axios.put(`${BASE_URL}/api/approvals/update/${id}`, { status: "approved" }).then((res) => {
      if (res.data.status) {
        setPartnerData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "approved" } : i)));
        setUserData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "approved" } : i)));
        if (selected?._id === id) setSelected((p) => ({ ...p, status: "approved" }));
      }
    });
  };

  const reject = (id) => {
    axios.put(`${BASE_URL}/api/approvals/update/${id}`, { status: "rejected" }).then((res) => {
      if (res.data.status) {
        setPartnerData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "rejected" } : i)));
        setUserData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "rejected" } : i)));
        if (selected?._id === id) setSelected((p) => ({ ...p, status: "rejected" }));
      }
    });
  };

  const handleConfirmApprovalAction = () => {
    if (!approvalConfirmModal) return;
    const { type, id } = approvalConfirmModal;
    if (type === "approve") {
      approve(id);
    } else if (type === "reject") {
      reject(id);
    } else if (type === "activate") {
      executeActivate(id);
    } else if (type === "deactivate") {
      executeDeactivate(id);
    } else if (type === "delete") {
      executeDelete(id);
    }
    setApprovalConfirmModal(null);
  };

  const renderApprovalConfirmModal = () => {
    if (!approvalConfirmModal) return null;
    const { type, roleName, businessName } = approvalConfirmModal;
    const isApprove = type === "approve";
    const isReject = type === "reject";
    const isActivate = type === "activate";
    const isDeactivate = type === "deactivate";
    const isDelete = type === "delete";
    const entityLabel = roleName || "partner";

    let title = "";
    let message = "";
    let confirmBtnText = "Confirm";
    let iconClass = "";
    let btnClass = "";
    let iconSvg = null;

    if (isApprove) {
      title = `Approve ${entityLabel === "partner" ? "Partner" : "User"}`;
      message = `Are you sure you want to approve this ${entityLabel}?`;
      confirmBtnText = "Confirm";
      iconClass = "icon-approve";
      btnClass = "btn-confirm-approve";
      iconSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (isReject) {
      title = `Reject ${entityLabel === "partner" ? "Partner" : "User"}`;
      message = `Are you sure you want to reject this ${entityLabel}?`;
      confirmBtnText = "Confirm";
      iconClass = "icon-reject";
      btnClass = "btn-confirm-reject";
      iconSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (isActivate) {
      title = `Activate ${entityLabel === "partner" ? "Partner" : "User"} Account`;
      message = `Are you sure you want to activate this account? The ${entityLabel} status will be set to active in DB.`;
      confirmBtnText = "Confirm Activate";
      iconClass = "icon-activate";
      btnClass = "btn-confirm-activate";
      iconSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    } else if (isDeactivate) {
      title = `Deactivate ${entityLabel === "partner" ? "Partner" : "User"} Account`;
      message = `Are you sure you want to deactivate this account? The ${entityLabel} status will be set to inactive in DB.`;
      confirmBtnText = "Confirm Deactivate";
      iconClass = "icon-deactivate";
      btnClass = "btn-confirm-deactivate";
      iconSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
    } else if (isDelete) {
      title = `Permanently Delete ${entityLabel === "partner" ? "Partner" : "User"}`;
      message = `Are you sure you want to permanently delete this ${entityLabel} from DB? This action cannot be undone.`;
      confirmBtnText = "Delete Permanently";
      iconClass = "icon-delete";
      btnClass = "btn-confirm-delete";
      iconSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    }

    return ReactDOM.createPortal(
      <div
        className="approval-confirm-overlay"
        onClick={() => setApprovalConfirmModal(null)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-confirm-title"
      >
        <div
          className="approval-confirm-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`approval-confirm-icon-wrap ${iconClass}`}>
            {iconSvg}
          </div>

          <h3 id="approval-confirm-title" className="approval-confirm-title">
            {title}
          </h3>

          <p className="approval-confirm-message">
            {message}
          </p>

          {businessName && (
            <div className="approval-confirm-target">
              <span className="target-name">{businessName}</span>
            </div>
          )}

          <div className="approval-confirm-actions">
            <button
              type="button"
              className="btn-confirm-cancel"
              onClick={() => setApprovalConfirmModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn-confirm-action ${btnClass}`}
              onClick={handleConfirmApprovalAction}
            >
              {confirmBtnText}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const executeActivate = (id) => {
    axios.put(`${BASE_URL}/api/approvals/update/${id}`, { status: "approved" }).then((res) => {
      if (res.data.status) {
        setPartnerData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "approved" } : i)));
        setUserData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "approved" } : i)));
        if (selected?._id === id) setSelected((p) => ({ ...p, status: "approved" }));
      }
    }).catch((err) => console.error("Activate error:", err));
  };

  const executeDeactivate = (id) => {
    axios.put(`${BASE_URL}/api/approvals/deactivate/${id}`).then((res) => {
      if (res.data.status) {
        setPartnerData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "deactivated" } : i)));
        setUserData((prev) => prev.map((i) => (i._id === id ? { ...i, status: "deactivated" } : i)));
        if (selected?._id === id) setSelected((p) => ({ ...p, status: "deactivated" }));
      }
    }).catch((err) => console.error("Deactivate error:", err));
  };

  const executeDelete = (id) => {
    axios.delete(`${BASE_URL}/api/approvals/delete/${id}`).then((res) => {
      if (res.data.status) {
        setPartnerData((prev) => prev.filter((i) => i._id !== id));
        setUserData((prev) => prev.filter((i) => i._id !== id));
        if (selected?._id === id) setSelected(null);
      }
    }).catch((err) => console.error("Delete error:", err));
  };

  const activate = (id, role, name) => {
    const roleName = role || (selected && selected._id === id ? (selected.role?.toLowerCase() === "partner" ? "partner" : "user") : (roleView === "partner" ? "partner" : "user"));
    const businessName = name || (selected && selected._id === id ? (selected.businessName || (selected.firstName ? `${selected.firstName} ${selected.lastName || ""}`.trim() : "")) : "");
    setApprovalConfirmModal({
      type: "activate",
      id,
      roleName,
      businessName
    });
  };

  const deactivate = (id, role, name) => {
    const roleName = role || (selected && selected._id === id ? (selected.role?.toLowerCase() === "partner" ? "partner" : "user") : (roleView === "partner" ? "partner" : "user"));
    const businessName = name || (selected && selected._id === id ? (selected.businessName || (selected.firstName ? `${selected.firstName} ${selected.lastName || ""}`.trim() : "")) : "");
    setApprovalConfirmModal({
      type: "deactivate",
      id,
      roleName,
      businessName
    });
  };

  const deleteApproval = (id, role, name) => {
    const roleName = role || (selected && selected._id === id ? (selected.role?.toLowerCase() === "partner" ? "partner" : "user") : (roleView === "partner" ? "partner" : "user"));
    const businessName = name || (selected && selected._id === id ? (selected.businessName || (selected.firstName ? `${selected.firstName} ${selected.lastName || ""}`.trim() : "")) : "");
    setApprovalConfirmModal({
      type: "delete",
      id,
      roleName,
      businessName
    });
  };

  // ── ALL_STAT_CARDS ─────────────────────────────────────────────────────────
  const ALL_STAT_CARDS = [
    {
      colorClass: "box-violet",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M4 17L8 7l4 6 4-4 4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      badge: "Total",
      title: "Learning Paths",
      value: statsLoading ? "—" : dashStats.paths.total,
      subtitleLines: [
        `Active: ${dashStats.paths.active}`,
        `Inactive: ${dashStats.paths.inactive}`,
        `Pending: ${dashStats.paths.pending}`,
      ],
      btnLabel: "View All →",
      onBtn: () => navigate("/admin/dashboard/paths?tab=active"),
    },
    {
      colorClass: "box-rose",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4l3 3M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      badge: "Live",
      title: "User Activity",
      value: activityLoading ? "—" : activityUsers.length,
      subtitleLines: [
        `Active: ${activityUsers.filter((u) => u.status === "active").length}`,
        `Idle: ${activityUsers.filter((u) => u.status === "idle").length}`,
        `Offline: ${activityUsers.filter((u) => u.status === "offline").length}`,
      ],
      btnLabel: "View All →",
      onBtn: () => { setView("activity"); setSelectedActivityUser(null); },
    },
    {
      colorClass: "box-cyan",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      badge: "All",
      title: "Marketplace Items",
      value: statsLoading ? "—" : dashStats.marketplace.total,
      subtitleLines: [
        `Institutions: ${dashStats.marketplace.institution}`,
        `Mentors: ${dashStats.marketplace.mentor}`,
        `Distributors: ${dashStats.marketplace.distributor}`,
        `Vendors: ${dashStats.marketplace.vendor}`,
      ],
      btnLabel: "View All →",
      onBtn: () => navigate("/admin/dashboard/marketplace"),
    },
    {
      colorClass: "box-amber",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      badge: "Summary",
      title: "Approvals Overview",
      value: statsLoading ? "—" : dashStats.approvals.total,
      subtitleLines: [
        `Approved: ${dashStats.approvals.approved}`,
        `Pending: ${dashStats.approvals.pending}`,
        `Rejected: ${dashStats.approvals.rejected}`,
      ],
      btnLabel: "Review →",
      onBtn: () => { setView("approvals"); setSelected(null); setTab("all"); },
    },
    {
      colorClass: "box-emerald",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      badge: "Live",
      title: "Partner Activity",
      value: partnerActivityLoading ? "—" : partnerActivityUsers.length,
      subtitleLines: [
        `Active: ${partnerActivityUsers.filter((u) => u.status === "active").length}`,
        `Idle: ${partnerActivityUsers.filter((u) => u.status === "idle").length}`,
        `Offline: ${partnerActivityUsers.filter((u) => u.status === "offline").length}`,
      ],
      btnLabel: "View All →",
      onBtn: () => { setView("partnerActivity"); setSelectedPartnerUser(null); },
    },
    {
      colorClass: "box-indigo",
      iconSvg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 2a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      badge: "All Time",
      title: "Marketplace Purchases",
      value: purchasesLoading ? "—" : purchaseStats.total,
      subtitleLines: [
        `Today: ${purchaseStats.today}`,
        `Pending: ${purchaseStats.pending}`,
        `Revenue: ${purchaseStats.revenue}`,
      ],
      btnLabel: "View All →",
      onBtn: () => { setView("purchaseActivity"); setSelectedPurchase(null); },
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "home") {
    return (
      <div className="dashboard">
        <div className="home-wrapper">

          {/* ── Header ── */}
          <div className="home-header">
            <div className="home-header-left">
              <p className="home-sub">Your AI-powered path engine — all key metrics at a glance</p>
            </div>
            <div className="home-header-right-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>

              {/* Bell + dropdown */}
              <div ref={notifDropdownRef} style={{ position: "relative" }}>
                <button className="notif-bell-btn" onClick={() => setShowNotifDropdown((p) => !p)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                      stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount}</span>}
                </button>

              {showNotifDropdown && (
  <>
    <div
      className="notif-mobile-backdrop"
      onClick={() => setShowNotifDropdown(false)}
    />
    <div className="notif-dropdown">
      <div className="notif-dd-header">
        <span className="notif-dd-title">Notifications</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && <span className="notif-dd-count">{unreadCount} new</span>}
          <button className="notif-mark-all-btn" onClick={markAllRead}>Mark all read</button>
        </div>
      </div>

      <div className="notif-dd-list">
        {notifsLoading && notifications.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--slate-400)" }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--slate-400)" }}>
            No notifications
          </div>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <NotifItem
              key={n.id}
              notif={n}
              onRead={() => markOneRead(n.id)}
              onView={() => handleNotifView(n)}
            />
          ))
        )}
      </div>

      <div className="notif-dd-footer">
        <button
          className="notif-view-all-btn"
          onClick={() => { setShowNotifDropdown(false); setView("notifications"); setNotifFilter("all"); }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  </>
)}
              </div>

              <div className="home-date-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          <div className="stat-boxes-carousel">
            <div className="stat-boxes-scroll-track">
              {ALL_STAT_CARDS.map((card, idx) => (
                <div key={idx} className={`stat-box ${card.colorClass}`}>
                  <div className="stat-box-top">
                    <div className="stat-box-icon">{card.iconSvg}</div>
                    <div className="stat-box-badge">{card.badge}</div>
                  </div>
                  <div className="stat-box-title">{card.title}</div>
                  <div className="stat-box-value">{card.value}</div>
                  <div className="stat-box-subtitle">
                    {card.subtitleLines.map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </div>
                  <button className="stat-box-btn" onClick={card.onBtn}>
                    {card.btnLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── KPI Section ── */}
          <div className="kpi-section">
            <div className="kpi-header">
              <h2>Key Performance Indicators</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="kpi-swipe-hint">Swipe ↔</span>
                <span className="kpi-tag">Live Data</span>
              </div>
            </div>

            <div className="kpi-grid-2col">
              <div className="kpi-card kpi-engagement-light">
                <div className="kpi-card-label" style={{ marginBottom: 14 }}>Platform Engagement</div>

                <div className="eng-overall-row">
                  <div className="eng-donut-sm">
                    <svg viewBox="0 0 72 72" fill="none" width="72" height="72">
                      <circle cx="36" cy="36" r="28" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="36" cy="36" r="28" stroke="#7c3aed" strokeWidth="8"
                        strokeDasharray="152.4 175.9" strokeLinecap="round"
                        transform="rotate(-90 36 36)" />
                    </svg>
                    <span className="eng-donut-val">87%</span>
                  </div>
                  <div className="eng-overall-details">
                    <div className="eng-overall-pct" style={{ fontSize: 22, fontWeight: 700, color: "var(--slate-800)", lineHeight: 1 }}>87%</div>
                    <div className="eng-overall-lbl" style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 3 }}>Overall avg. engagement</div>
                    <div className="eng-overall-trend" style={{ fontSize: 12, color: "#16a34a", marginTop: 6, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      ↑ +4.2% vs last week
                    </div>
                    <div className="eng-overall-stats" style={{ display: "flex", gap: 16, marginTop: 10 }}>
                      <div className="eng-stat-item" style={{ fontSize: 11, color: "var(--slate-400)" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--slate-700)" }}>2,841</span>
                        <div>active sessions</div>
                      </div>
                      <div className="eng-stat-item" style={{ fontSize: 11, color: "var(--slate-400)" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--slate-700)" }}>18.4m</span>
                        <div>avg. duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="eng-split-row">
                  <div className="eng-entity-card eng-users">
                    <div className="eng-entity-top">
                      <div className="eng-entity-avatar" style={{ background: "#ede9fe", color: "#7c3aed" }}>U</div>
                      <div>
                        <div className="eng-entity-name">Users</div>
                        <div className="eng-entity-sub">1,920 active</div>
                      </div>
                      <div className="eng-entity-pct" style={{ color: "#7c3aed" }}>80%</div>
                    </div>
                    {[["Path completion", 72, "#8b5cf6"], ["Marketplace", 58, "#a78bfa"], ["Repeat logins", 85, "#c4b5fd"]].map(([label, val, color]) => (
                      <div key={label} className="eng-bar-row">
                        <div className="eng-bar-meta"><span>{label}</span><span>{val}%</span></div>
                        <div className="eng-bar-track"><div className="eng-bar-fill" style={{ width: `${val}%`, background: color }} /></div>
                      </div>
                    ))}
                  </div>

                  <div className="eng-entity-card eng-partners">
                    <div className="eng-entity-top">
                      <div className="eng-entity-avatar" style={{ background: "#fce7f3", color: "#e11d48" }}>P</div>
                      <div>
                        <div className="eng-entity-name">Partners</div>
                        <div className="eng-entity-sub">921 active</div>
                      </div>
                      <div className="eng-entity-pct" style={{ color: "#e11d48" }}>95%</div>
                    </div>
                    {[["Content published", 88, "#f43f5e"], ["Approval rate", 91, "#fb7185"], ["Portal revisits", 79, "#fda4af"]].map(([label, val, color]) => (
                      <div key={label} className="eng-bar-row">
                        <div className="eng-bar-meta"><span>{label}</span><span>{val}%</span></div>
                        <div className="eng-bar-track"><div className="eng-bar-fill" style={{ width: `${val}%`, background: color }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── NEW DEDICATED PATH REQUESTS OVERVIEW SECTION ── */}
              <div className="kpi-card kpi-path-requests-card">
                <div className="pr-overview-header">
                  <div className="pr-header-left">
                    <div className="pr-title-row">
                      <span className="pr-icon-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
                        </svg>
                      </span>
                      <h3 className="pr-overview-title">Path Requests</h3>
                      {pathRequestsCounts.pending > 0 && (
                        <span className="pr-pending-pill">{pathRequestsCounts.pending} Pending</span>
                      )}
                    </div>
                    <p className="pr-overview-sub">
                      Students request personalized pathways unavailable in the catalog. Review specs, configure milestones, and curate custom paths.
                    </p>
                  </div>
                  <div className="pr-header-actions">
                    <button
                      type="button"
                      className="pr-view-all-btn"
                      onClick={() => {
                        setRoleView("pathRequests");
                        setPathRequestsTab("all");
                        setView("approvals");
                        setSelected(null);
                        setSelectedPathRequest(null);
                        fetchPathRequests("all");
                      }}
                    >
                      View All Requests →
                    </button>
                  </div>
                </div>

                {/* Summary KPI statistics */}
                <div className="pr-stats-row">
                  <div className="pr-stat-pill" onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("all"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); fetchPathRequests("all"); }}>
                    <span className="pr-stat-val">{pathRequestsCounts.total}</span>
                    <span className="pr-stat-lbl">Total Requests</span>
                  </div>
                  <div className="pr-stat-pill pr-stat-pill--pending" onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("pending"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); fetchPathRequests("pending"); }}>
                    <span className="pr-stat-val">{pathRequestsCounts.pending}</span>
                    <span className="pr-stat-lbl">Pending Review</span>
                  </div>
                  <div className="pr-stat-pill pr-stat-pill--progress" onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("in_progress"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); fetchPathRequests("in_progress"); }}>
                    <span className="pr-stat-val">{pathRequestsCounts.in_progress}</span>
                    <span className="pr-stat-lbl">In Progress</span>
                  </div>
                  <div className="pr-stat-pill pr-stat-pill--ready" onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("created"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); fetchPathRequests("created"); }}>
                    <span className="pr-stat-val">{pathRequestsCounts.created}</span>
                    <span className="pr-stat-lbl">Created & Ready</span>
                  </div>
                  <div className="pr-stat-pill pr-stat-pill--rejected" onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("rejected"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); fetchPathRequests("rejected"); }}>
                    <span className="pr-stat-val">{pathRequestsCounts.rejected}</span>
                    <span className="pr-stat-lbl">Rejected</span>
                  </div>
                </div>

                {/* Recent Requests list */}
                <div className="pr-recent-container">
                  <div className="pr-recent-header">
                    <span className="pr-recent-title">Recent Student Requests</span>
                    <span className="pr-recent-count">{Math.min(pathRequests.length, 5)} showing</span>
                  </div>

                  {pathRequestsLoading && pathRequests.length === 0 ? (
                    <div className="pr-empty-box">Loading path requests...</div>
                  ) : pathRequests.length === 0 ? (
                    <div className="pr-empty-box">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                      <p>No student path requests logged yet.</p>
                    </div>
                  ) : (
                    <div className="pr-recent-list">
                      {pathRequests.slice(0, 5).map((req) => (
                        <div
                          key={req._id || req.requestId}
                          className="pr-recent-item"
                          onClick={() => {
                            setSelectedPathRequest(req);
                            setRoleView("pathRequests");
                            setView("approvals");
                          }}
                        >
                          <div className="pr-item-left">
                            <div className="pr-item-avatar">
                              {(req.userName || req.userEmail || "S")[0].toUpperCase()}
                            </div>
                            <div className="pr-item-info">
                              <div className="pr-item-title-row">
                                <span className="pr-item-goal">{req.targetGoal}</span>
                                {req.targetInstitution && (
                                  <span className="pr-item-inst"><SvgBuilding size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> {req.targetInstitution}</span>
                                )}
                              </div>
                              <div className="pr-item-sub">
                                <span className="pr-item-user">{req.userName}</span>
                                <span className="pr-item-dot">•</span>
                                <span className="pr-item-sector">{req.sector || "General"}</span>
                                <span className="pr-item-dot">•</span>
                                <span className="pr-item-date">{new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pr-item-right">
                            <span className={`pr-status-tag status-${req.status}`}>
                              {req.status === "created"
                                ? "Created"
                                : req.status === "in_progress"
                                ? "In Progress"
                                : req.status === "rejected"
                                ? "Rejected"
                                : "Pending"}
                            </span>
                            <button
                              type="button"
                              className="pr-item-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPathRequest(req);
                                setRoleView("pathRequests");
                                setView("approvals");
                              }}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions bar preserving all original actions */}
                <div className="pr-quick-toolbar">
                  <span className="pr-quick-toolbar-label">Quick Actions:</span>
                  <button type="button" className="pr-quick-btn" onClick={() => { setRoleView("partner"); setView("approvals"); setSelected(null); setSelectedPathRequest(null); }}>
                    Review Approvals
                  </button>
                  <button type="button" className="pr-quick-btn" onClick={() => { setView("activity"); setSelectedActivityUser(null); }}>
                    User Activity
                  </button>
                  <button type="button" className="pr-quick-btn" onClick={() => navigate("/admin/dashboard/paths?tab=active")}>
                    Manage Paths
                  </button>
                  <button type="button" className="pr-quick-btn" onClick={() => { setView("notifications"); setNotifFilter("all"); }}>
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </button>
                  <button type="button" className="pr-quick-btn pr-quick-btn--primary" onClick={() => { setRoleView("pathRequests"); setSelectedPathRequest(pathRequests[0] || { targetGoal: "New Custom Pathway", userEmail: "custom@naaviverse.com" }); setView("customPathBuilder"); }}>
                    + Add New Path
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE ASSISTANCE DETAILS — FULL PAGE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "assistanceDetails") {
    return (
      <div className="dashboard">
        <AssistanceDetailsPage
          request={selectedAssistanceRequest}
          onBack={() => setView("home")}
          onStatusChange={(updatedReq) => {
            setAssistanceRequests((prev) =>
              prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
            );
            setSelectedAssistanceRequest(updatedReq);
          }}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS — FULL PAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "notifications") {
    const FILTERS = [
      { key: "all", label: "All", dot: "#7c3aed", countBg: "#ede9fe", countColor: "#7c3aed" },
      { key: "path", label: "Paths", dot: "#8b5cf6", countBg: "#ede9fe", countColor: "#7c3aed" },
      { key: "purchase", label: "Purchases", dot: "#22c55e", countBg: "#dcfce7", countColor: "#15803d" },
      { key: "approval", label: "Approvals", dot: "#f59e0b", countBg: "#fef3c7", countColor: "#b45309" },
      { key: "system", label: "System", dot: "#94a3b8", countBg: "#f1f5f9", countColor: "#475569" },
    ];
    const filteredNotifs = notifFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === notifFilter);

    return (
      <div className="dashboard">
        <div className="approvals-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 600 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--slate-100)", display: "flex", alignItems: "center", gap: 14 }}>
            <button className="back-btn" style={{ margin: 0 }} onClick={() => setView("home")}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Dashboard
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--slate-800)", margin: 0 }}>
                Notifications
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ fontSize: 12, fontWeight: 600, background: "var(--slate-100)", color: "var(--slate-600)", border: "none", padding: "6px 14px", borderRadius: "var(--radius-full)", cursor: "pointer", fontFamily: "var(--font)" }} onClick={markAllRead}>
                Mark all read
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ width: 210, flexShrink: 0, borderRight: "1px solid var(--slate-100)", padding: "16px 12px", background: "var(--slate-50)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--slate-400)", marginBottom: 10, padding: "0 6px" }}>
                Filter
              </div>
              {FILTERS.map((f) => {
                const count = f.key === "all" ? notifications.length : notifications.filter((n) => n.type === f.key).length;
                return (
                  <button key={f.key} onClick={() => setNotifFilter(f.key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: "var(--radius-md)", marginBottom: 2, border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, textAlign: "left", background: notifFilter === f.key ? "var(--violet-100)" : "transparent", color: notifFilter === f.key ? "var(--violet-700)" : "var(--slate-600)", transition: "all .15s" }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.dot, flexShrink: 0 }} />
                    {f.label}
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: f.countBg, color: f.countColor }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredNotifs.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "var(--slate-400)" }}>
                  <div style={{ marginBottom: 8, opacity: 0.3, display: "flex", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
                  </div>
                  <p>No notifications here</p>
                </div>
              ) : (
                filteredNotifs.map((n) => (
                  <NotifItem key={n.id} notif={n} full
                    onRead={() => markOneRead(n.id)}
                    onView={() => handleNotifView(n)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVITY — LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "activity" && !selectedActivityUser) {
    return (
      <div className="dashboard">
        <div className="approvals-card">
          <button className="back-btn" onClick={() => setView("home")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>

          <div className="card-header">
            <div className="header-left">
              <div className="header-icon" style={{ background: "#fce7f3", border: "1px solid #fbcfe8", fontSize: 22 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
              <div>
                <h2>User Activity</h2>
                <p className="header-subtitle">Live journey overview — login · paths · marketplace</p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>● Live</span>
          </div>

          {activityLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>Loading activity...</div>
          ) : activityUsers.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: 36, opacity: 0.3 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>


              </div>
              <p style={{ color: "#94a3b8", marginTop: 8 }}>No activity recorded yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="activity-table" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    <th className="col-act-user" style={{ width: "25%" }}>User</th>
                    <th className="col-act-status" style={{ width: "14%" }}>Status</th>
                    <th className="col-act-event" style={{ width: "45%" }}>Last Event</th>
                    <th className="col-act-actions" style={{ width: "16%", textAlign: "center", paddingRight: "36px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activityUsers.map((u, idx) => {
                    const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                    const last = u.lastEvent || u.events?.[u.events.length - 1];
                    const cfg = TYPE_CONFIG[last?.type] || TYPE_CONFIG.login;
                    return (
                      <tr key={u.id} className="table-row">
                        <td className="col-act-user" style={{ verticalAlign: "middle", overflow: "hidden" }}>
                          <div className="business-info" style={{ minWidth: 0 }}>
                            <div className="row-avatar" style={{ background: palette.color, color: palette.textColor, flexShrink: 0 }}>
                              {u.initials || (u.name?.trim() ? u.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : null) || u.email?.slice(0, 2).toUpperCase() || "??"}
                            </div>
                            <div style={{ minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                              <div className="business-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, margin: 0 }}>{u.name}</div>
                              <div style={{ fontSize: 12, color: "var(--slate-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, margin: 0 }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="col-act-status" style={{ verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: STATUS_COLORS[u.status] || STATUS_COLORS.offline, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[u.status] || STATUS_COLORS.offline, display: "inline-block" }} />
                            {u.status?.charAt(0).toUpperCase() + u.status?.slice(1) || "Offline"}
                          </span>
                        </td>
                        <td className="col-act-event" style={{ verticalAlign: "middle", overflow: "hidden" }}>
                          {last ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                              <span style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background: cfg.bg,
                                color: cfg.color,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1
                              }}>
                                {cfg.svg}
                              </span>
                              <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                {renderEventTitle(last.title)}
                                <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 2 }}>{last.time}</div>
                              </div>
                            </div>
                          ) : <span style={{ color: "var(--slate-300)" }}>—</span>}
                        </td>
                        <td className="col-act-actions" style={{ textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap", paddingRight: "36px" }}>
                          <button className="view-btn" onClick={() => setSelectedActivityUser({ ...u, palette })}>View Journey</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVITY — DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "activity" && selectedActivityUser) {
    const u = selectedActivityUser;
    const palette = u.palette || AVATAR_PALETTE[0];
    return (
      <div className="dashboard">
        <div className="details-card" style={{ maxWidth: 760 }}>
          <button className="back-btn" onClick={() => setSelectedActivityUser(null)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Activity
          </button>

          <div className="details-hero">
            <div className="details-avatar" style={{ background: palette.color, color: palette.textColor, border: `2px solid ${palette.color}` }}>
              {u.initials || (u.name?.trim() ? u.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : null) || u.email?.slice(0, 2).toUpperCase() || "??"}
            </div>
            <div className="details-hero-info">
              <div className="details-hero-top">
                <h2>{u.name}</h2>
                <span className="details-hero-status" style={{ color: STATUS_COLORS[u.status] || "#94a3b8" }}>
                  <span className="details-hero-status-dot" style={{ background: STATUS_COLORS[u.status] || "#94a3b8" }} />
                  <span>{u.status?.charAt(0).toUpperCase() + u.status?.slice(1) || "Offline"}</span>
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--slate-400)" }}>{u.email} · Joined {u.joinedDays}</div>
            </div>
          </div>

          <div className="details-section-title" style={{ marginBottom: 20 }}>Journey Timeline</div>

          {!u.events || u.events.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No events recorded yet</div>
          ) : (
            <div className="activity-timeline">
              {u.events.map((ev, i) => {
                const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.login;
                return (
                  <div key={i} className="activity-tl-item">
                    <div className="activity-tl-left">
                      <div className="activity-tl-icon" style={{ background: cfg.bg }}>
                        {cfg.svg}
                      </div>
                      {i < u.events.length - 1 && <div className="activity-tl-line" />}
                    </div>
                    <div className="activity-tl-body">
                      <div className="activity-tl-time">{ev.time}</div>
                      <div className="activity-tl-title">{renderEventTitle(ev.title, 500)}</div>
                      {ev.type === "step" && ev.pathName && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, margin: "4px 0" }}>
                          <div style={{ fontSize: 12, color: "var(--violet-600)", fontWeight: 600 }}><SvgPin size={14} /> {ev.pathName}</div>
                          {ev.stepName && <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Step: {ev.stepName}</div>}
                          {ev.microStep && <div style={{ fontSize: 12, color: "var(--slate-400)" }}>Micro: {ev.microStep}</div>}
                        </div>
                      )}
                      <div className="activity-tl-desc">{ev.desc}</div>
                      <span className={`activity-chip ${cfg.chipClass}`}>{ev.chipLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARTNER ACTIVITY — LIST VIEW (UPDATED WITH API DATA)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "partnerActivity" && !selectedPartnerUser) {
    const filteredPartners = partnerActivityLoading
      ? []
      : partnerActivityTab === "all"
        ? partnerActivityUsers
        : partnerActivityUsers.filter((u) => u.status === partnerActivityTab);

    return (
      <div className="dashboard">
        <div className="approvals-card">
          <button className="back-btn" onClick={() => setView("home")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>

          <div className="card-header">
            <div className="header-left">
              <div className="header-icon" style={{ background: "#d1fae5", border: "1px solid #a7f3d0", fontSize: 22 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>

              </div>
              <div>
                <h2>Partner Activity</h2>
                <p className="header-subtitle">Live portal activity — logins · listings · content · messages</p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>● Live</span>
          </div>

          <div className="tab-btn-group">
            {["all", "active", "idle", "offline"].map((t) => (
              <button key={t} className={`tab-btn ${partnerActivityTab === t ? "active" : ""}`} onClick={() => setPartnerActivityTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {partnerActivityLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
              Loading partner activity...
            </div>
          ) : filteredPartners.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: 36, opacity: 0.3 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>


              </div>
              <p style={{ color: "#94a3b8", marginTop: 8 }}>No partner activity recorded yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="partner-activity-table" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    <th className="col-pa-partner" style={{ width: "23%" }}>Partner</th>
                    <th className="col-pa-type" style={{ width: "18%" }}>Type</th>
                    <th className="col-pa-status" style={{ width: "13%" }}>Status</th>
                    <th className="col-pa-event" style={{ width: "31%" }}>Last Event</th>
                    <th className="col-pa-actions" style={{ width: "15%", textAlign: "center", paddingRight: "36px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((u, idx) => {
                    const pal = PARTNER_AVATAR_PALETTE[idx % PARTNER_AVATAR_PALETTE.length];
                    const last = u.events?.[u.events.length - 1];
                    return (
                      <tr key={u.id} className="table-row">
                        <td className="col-pa-partner" style={{ verticalAlign: "middle", overflow: "hidden" }}>
                          <div className="business-info" style={{ minWidth: 0 }}>
                            <div className="row-avatar" style={{ background: pal.color, color: pal.textColor, flexShrink: 0 }}>{u.initials}</div>
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                              <div className="business-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                              <div style={{ fontSize: 12, color: "var(--slate-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="col-pa-type" style={{ verticalAlign: "middle", overflow: "hidden" }}>
                          <span className="type-badge" title={u.type}>{u.type}</span>
                        </td>
                        <td className="col-pa-status" style={{ verticalAlign: "middle", whiteSpace: "nowrap", paddingLeft: "6px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: PARTNER_STATUS_COLORS[u.status] || "#94a3b8" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: PARTNER_STATUS_COLORS[u.status] || "#94a3b8", display: "inline-block" }} />
                            {u.status?.charAt(0).toUpperCase() + u.status?.slice(1) || "Offline"}
                          </span>
                        </td>
                        <td className="col-pa-event" style={{ verticalAlign: "middle", overflow: "hidden" }}>
                          {last ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                              <span style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background: "#f1f5f9",
                                color: "#475569",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17L8 7l4 6 4-4 4 8" /></svg>
                              </span>
                              <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                {renderEventTitle(last.title)}
                                <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 2 }}>{last.time}</div>
                              </div>
                            </div>
                          ) : <span style={{ color: "var(--slate-300)" }}>—</span>}
                        </td>
                        <td className="col-pa-actions" style={{ textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap", paddingRight: "36px" }}>
                          <button className="view-btn" onClick={() => setSelectedPartnerUser({ ...u, palette: pal })}>View Journey</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARTNER ACTIVITY — DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "partnerActivity" && selectedPartnerUser) {
    const u = selectedPartnerUser;
    const pal = u.palette || PARTNER_AVATAR_PALETTE[0];
    const PARTNER_TYPE_ICONS = {
      login: { bg: "#f1f5f9", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg> },
      publish: { bg: "#dcfce7", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg> },
      listing: { bg: "#d1fae5", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
      approval: { bg: "#fef3c7", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      invite: { bg: "#cffafe", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> },
      message: { bg: "#e0e7ff", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
    };
    return (
      <div className="dashboard">
        <div className="details-card" style={{ maxWidth: 760 }}>
          <button className="back-btn" onClick={() => setSelectedPartnerUser(null)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Partner Activity
          </button>
          <div className="details-hero">
            <div className="details-avatar" style={{ background: pal.color, color: pal.textColor, border: `2px solid ${pal.color}` }}>{u.initials}</div>
            <div className="details-hero-info">
              <div className="details-hero-top">
                <h2>{u.name}</h2>
                <span className="details-hero-status" style={{ color: PARTNER_STATUS_COLORS[u.status] || "#94a3b8" }}>
                  <span className="details-hero-status-dot" style={{ background: PARTNER_STATUS_COLORS[u.status] || "#94a3b8" }} />
                  <span>{u.status?.charAt(0).toUpperCase() + u.status?.slice(1) || "Offline"}</span>
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--slate-400)" }}>
                {u.email} · Joined {u.joinedDays} · <span style={{ color: "var(--slate-600)", fontWeight: 600 }}>{u.type}</span>
              </div>
            </div>
          </div>
          <div className="details-section-title" style={{ marginBottom: 20 }}>Journey Timeline</div>
          {!u.events || u.events.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No events recorded yet</div>
          ) : (
            <div className="activity-timeline">
              {u.events.map((ev, i) => {
                const cfg = PARTNER_TYPE_ICONS[ev.type] || PARTNER_TYPE_ICONS.login;
                return (
                  <div key={i} className="activity-tl-item">
                    <div className="activity-tl-left">
                      <div className="activity-tl-icon" style={{ background: cfg.bg }}>{cfg.svg}</div>
                      {i < u.events.length - 1 && <div className="activity-tl-line" />}
                    </div>
                    <div className="activity-tl-body">
                      <div className="activity-tl-time">{ev.time}</div>
                      <div className="activity-tl-title">{renderEventTitle(ev.title, 500)}</div>
                      <div className="activity-tl-desc">{ev.desc}</div>
                      <span className={`activity-chip ${ev.chipClass}`}>{ev.chipLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PURCHASE ACTIVITY — LIST VIEW (UPDATED WITH API DATA)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "purchaseActivity" && !selectedPurchase) {
    const filteredPurchases = purchasesLoading
      ? []
      : purchaseTab === "all" ? purchases
        : purchaseTab === "today" ? purchases.filter((p) => p.date?.startsWith("Today"))
          : purchaseTab === "pending" ? purchases.filter((p) => p.status === "pending")
            : purchases.filter((p) => p.status === "completed");

    return (
      <div className="dashboard">
        <div className="approvals-card">
          <button className="back-btn" onClick={() => setView("home")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </button>
          <div className="card-header">
            <div className="header-left">
              <div className="header-icon" style={{ background: "#e0e7ff", border: "1px solid #c7d2fe", fontSize: 22 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>

              </div>
              <div>
                <h2>Marketplace Purchases</h2>
                <p className="header-subtitle">All user purchases — micro · nano · bundle · premium plans</p>
              </div>
            </div>
            <div className="pur-revenue-badge" style={{ fontSize: 13, fontWeight: 700, background: "#e0e7ff", color: "#4338ca", padding: "6px 16px", borderRadius: 999, border: "1px solid #c7d2fe" }}>
              Revenue: {purchaseStats.revenue}
            </div>
          </div>
          <div className="tab-btn-group">
            {[
              { key: "all", label: `All (${purchases.length})` },
              { key: "today", label: "Today" },
              { key: "completed", label: "Completed" },
              { key: "pending", label: "Pending" },
            ].map(({ key, label }) => (
              <button key={key} className={`tab-btn ${purchaseTab === key ? "active" : ""}`} onClick={() => setPurchaseTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {purchasesLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
              Loading purchases...
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="purchases-table">
                <thead>
                  <tr>
                    <th className="col-pur-user">User</th>
                    <th className="col-pur-item">Item</th>
                    <th className="col-pur-plan">Plan</th>
                    <th className="col-pur-market">Marketplace</th>
                    <th className="col-pur-amount">Amount</th>
                    <th className="col-pur-date">Date</th>
                    <th className="col-pur-status">Status</th>
                    <th className="col-pur-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="no-results" style={{ textAlign: "center", padding: "40px 14px", color: "var(--slate-400)" }}>
                        <div className="empty-state">
                          <div className="empty-icon">🛍️</div>
                          <p>No {purchaseTab} purchases found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p, idx) => {
                      const pal = PURCHASE_AVATAR_PALETTE[idx % PURCHASE_AVATAR_PALETTE.length];
                      return (
                        <tr key={p.id} className="table-row">
                          <td className="col-pur-user" style={{ verticalAlign: "middle" }}>
                            <div className="business-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="row-avatar" style={{ background: pal.color, color: pal.textColor, flexShrink: 0 }}>{p.initials}</div>
                              <div className="pur-user-info" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
                                <div className="business-name" style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-800)", lineHeight: 1.25, margin: 0 }}>{p.user}</div>
                                <div className="pur-user-email" style={{ fontSize: 11, color: "var(--slate-400)", lineHeight: 1.25, margin: 0 }}>{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="col-pur-item" style={{ verticalAlign: "middle" }}>
                            <div className="pur-item-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
                              <div className="pur-item-title" style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-800)", lineHeight: 1.25, margin: 0 }}>{p.item}</div>
                              <div className="pur-item-type" style={{ fontSize: 11, color: "var(--slate-400)", lineHeight: 1.25, margin: 0 }}>{p.type}</div>
                            </div>
                          </td>
                          <td className="col-pur-plan"><span className={`plan-badge ${PLAN_BADGE_CLASS[p.plan]}`}>{p.plan}</span></td>
                          <td className="col-pur-market">{p.marketplace}</td>
                          <td className="col-pur-amount">{p.amount}</td>
                          <td className="col-pur-date date-cell">{p.date}</td>
                          <td className="col-pur-status">
                            <span className={`status-pill ${p.status === "completed" ? "approved" : "pending"}`}>
                              {p.status === "completed" ? <><SvgCheck size={12} style={{ marginRight: 4 }} /> Done</> : "Pending"}
                            </span>
                          </td>
                          <td className="col-pur-actions"><button className="view-btn" onClick={() => setSelectedPurchase(p)}>Details</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PURCHASE ACTIVITY — DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "purchaseActivity" && selectedPurchase) {
    const p = selectedPurchase;
    return (
      <div className="dashboard">
        <div className="details-card" style={{ maxWidth: 760 }}>
          <button className="back-btn" onClick={() => setSelectedPurchase(null)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Purchases
          </button>
          <div className="details-hero">
            <div className="details-avatar" style={{ background: "#e0e7ff", color: "#4338ca", border: "2px solid #c7d2fe" }}>{p.initials}</div>
            <div className="details-hero-info">
              <div className="details-hero-top">
                <h2>{p.user}</h2>
                <span className={`status-pill ${p.status === "completed" ? "approved" : "pending"}`}>
                  {p.status === "completed" ? <><SvgCheck size={12} style={{ marginRight: 4 }} /> Completed</> : "Pending"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--slate-400)" }}>{p.email}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div className="purchase-summary-card purchase-summary-indigo">
              <div className="purchase-summary-label">Amount Paid</div>
              <div className="purchase-summary-value">{p.amount}</div>
              <div className="purchase-summary-sub">{p.plan} Plan · {p.type}</div>
            </div>
            <div className="purchase-summary-card purchase-summary-emerald">
              <div className="purchase-summary-label">Content Access</div>
              <div className="purchase-summary-value">{p.microLessons}</div>
              <div className="purchase-summary-sub">{p.steps} Steps · {p.duration}</div>
            </div>
          </div>
          <div className="details-section-title">Item Details</div>
          <div className="details-grid">
            <DetailItem label="Item Name" value={p.item} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>} />
            <DetailItem label="Item Type" value={p.type} />
            <DetailItem label="Subscription Plan" value={p.plan} />
            <DetailItem label="Marketplace" value={p.marketplace} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>} />
            <DetailItem label="Duration" value={p.duration} />
            <DetailItem label="Total Steps" value={`${p.steps} steps`} />
            <DetailItem label="Micro Lessons" value={`${p.microLessons} lessons`} />
            <DetailItem label="Purchase Date" value={p.date} />
            <DetailItem label="Status" value={p.status === "completed" ? <><SvgCheck size={12} style={{ marginRight: 4 }} /> Completed</> : <><SvgHourglass size={12} style={{ marginRight: 4 }} /> Pending</>} />
          </div>
          <div className="details-section-title">Buyer Details</div>
          <div className="details-grid">
            <DetailItem label="Full Name" value={p.user} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
            <DetailItem label="Email" value={p.email} />
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CUSTOM PATH BUILDER — DEDICATED FULL-PAGE DASHBOARD VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "customPathBuilder" && selectedPathRequest) {
    return (
      <div className="dashboard">
        <SuperAdminCustomPathBuilder
          request={selectedPathRequest}
          onBack={() => setView("approvals")}
          onPathCreated={(createdPath, updatedReq) => {
            fetchPathRequests(pathRequestsTab);
            if (updatedReq) {
              setSelectedPathRequest(updatedReq);
            } else if (selectedPathRequest) {
              setSelectedPathRequest((prev) => ({
                ...prev,
                status: "created",
                createdPathId: createdPath?._id,
                createdPathName: createdPath?.nameOfPath || createdPath?.name || prev.targetGoal,
              }));
            }
            setView("approvals");
          }}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATH REQUESTS — DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "approvals" && roleView === "pathRequests" && selectedPathRequest) {
    const req = selectedPathRequest;
    return (
      <div className="dashboard">
        <div className="details-card">
          <button className="back-btn" onClick={() => setSelectedPathRequest(null)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Path Requests
          </button>
          <div className="details-hero">
            <div className="details-avatar" style={{ background: "#ede9fe", color: "#6d28d9", border: "2px solid #ddd6fe" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#7c3aed" />
              </svg>
            </div>
            <div className="details-hero-info">
              <div className="details-hero-top">
                <h2>{req.targetGoal}</h2>
                <span className={`status-pill ${req.status}`}>
                  {req.status === "created"
                    ? <><SvgCheck size={12} style={{ marginRight: 4 }} /> Created & Ready</>
                    : req.status === "in_progress"
                    ? <><SvgClock size={12} style={{ marginRight: 4 }} /> In Progress</>
                    : req.status === "rejected"
                    ? <><SvgClose size={12} style={{ marginRight: 4 }} /> Rejected</>
                    : <><SvgHourglass size={12} style={{ marginRight: 4 }} /> Pending Review</>}
                </span>
              </div>
              <span className="role-chip path-req">
                <SvgGraduation size={14} /> Custom Pathway Request · {req.requestId || "REQ"}
              </span>
            </div>
          </div>

          <SectionTitle>Target Pathway & Academic Specs</SectionTitle>
          <div className="details-grid">
            <DetailItem label="Target Goal / Title" value={req.targetGoal} />
            <DetailItem label="Target Institution / University" value={req.targetInstitution || "General / Not Specified"} />
            <DetailItem label="Sector / Category" value={req.sector} />
            <DetailItem label="Education Level / Stage" value={req.educationLevel} />
            <DetailItem label="Target Timeline / Duration" value={req.targetTimeline} />
          </div>

          <SectionTitle>Requirements & Student Notes</SectionTitle>
          <div className="details-grid">
            <DetailItem label="Mandatory Prerequisites" value={req.mandatoryRequirements || "None specified"} />
            <DetailItem label="Goal Details & Focus" value={req.goalDetails || "No additional notes"} />
            <DetailItem label="Special Instructions" value={req.specialInstructions || "None"} />
          </div>

          <SectionTitle>Student Information</SectionTitle>
          <div className="details-grid">
            <DetailItem label="Student Name" value={req.userName} />
            <DetailItem label="Student Email" value={req.userEmail} />
            <DetailItem label="Submitted At" value={new Date(req.createdAt).toLocaleString()} />
            {req.status === "created" && (
              <DetailItem
                label="Created Pathway"
                value={req.createdPathName ? `${req.createdPathName} (Live in Catalog)` : "Active Pathway Created"}
              />
            )}
            {req.adminNotes && (
              <DetailItem label="Super Admin Notes / Feedback" value={req.adminNotes} />
            )}
          </div>

          <div className="path-req-actions">
            <button
              type="button"
              className="btn-path-action btn-path-primary"
              onClick={() => setView("customPathBuilder")}
            >
              {req.status === "created" ? "Edit / Reconfigure Path" : "Create Custom Path & Steps"}
            </button>

            {req.status !== "in_progress" && req.status !== "created" && (
              <button
                type="button"
                className="btn-path-action btn-path-progress"
                onClick={() => updatePathRequestStatus(req._id, "in_progress")}
              >
                Mark In Progress
              </button>
            )}

            {req.status !== "rejected" && req.status !== "created" && (
              <button
                type="button"
                className="btn-path-action btn-path-reject"
                onClick={() => updatePathRequestStatus(req._id, "rejected")}
              >
                Reject Request
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════════════
  // APPROVALS — DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "approvals" && selected) {
    const isPartner = selected.role?.toLowerCase() === "partner";
    const isPending = selected.status === "pending";
    return (
      <div className="dashboard">
        <div className="details-card">
          <button className="back-btn" onClick={() => setSelected(null)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to {isPartner ? "Partner" : "User"} Approvals
          </button>
          <div className="details-hero">
            <div className={`details-avatar ${isPartner ? "partner-avatar" : "user-avatar"}`}>
              {selected.businessName?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="details-hero-info">
              <div className="details-hero-top">
                <h2>{selected.businessName}</h2>
                <span className={`status-pill ${selected.status}`}>
                  {selected.status === "approved" ? <><SvgCheck size={13} style={{ marginRight: 4 }} /> Verified</> : selected.status === "rejected" ? <><SvgClose size={13} style={{ marginRight: 4 }} /> Rejected</> : selected.status === "deactivated" ? <><SvgBan size={13} style={{ marginRight: 4 }} /> Deactivated</> : <><SvgHourglass size={13} style={{ marginRight: 4 }} /> Pending</>}
                </span>
              </div>
              <span className={`role-chip ${isPartner ? "partner" : "user"}`}>
                {isPartner ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> Partner</>
                ) : (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> User</>
                )}
              </span>
            </div>
          </div>

          {isPartner ? (
            <>
              <div className="details-section-title">Profile Details</div>
              <div className="details-grid">
                <DetailItem label="Business Name" value={selected.businessName} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>} />
                <DetailItem label="Business Type" value={selected.type} />
                <DetailItem label="Email" value={selected.email} />
                <DetailItem label="Website" value={selected.website} isLink />
                <DetailItem label="First Name" value={selected.firstName} />
                <DetailItem label="Last Name" value={selected.lastName} />
                <DetailItem label="Position" value={selected.position} />
                <DetailItem label="Country" value={selected.country} />
              </div>
            </>
          ) : loadingUserDetail ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: "14px" }}>Loading full profile...</div>
          ) : (
            <>
              <SectionTitle>Level 1 — Basic Info</SectionTitle>
              <div className="details-grid">
                <DetailItem label="Full Name" value={fullUserData?.name || selected.businessName} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                <DetailItem label="Email" value={fullUserData?.email || selected.email} />
                <DetailItem label="Username" value={fullUserData?.username} />
                <DetailItem label="Phone" value={fullUserData?.phoneNumber} />
                <DetailItem label="Account Type" value={fullUserData?.userType || selected.type} />
                <DetailItem label="Country" value={fullUserData?.country || selected.country} />
                <DetailItem label="State" value={fullUserData?.state} />
                <DetailItem label="City" value={fullUserData?.city} />
                <DetailItem label="Postal Code" value={fullUserData?.postalCode} />
              </div>
              <SectionTitle>Level 2 — Academic Info</SectionTitle>
              <div className="details-grid">
                <DetailItem label="School" value={fullUserData?.school} />
                <DetailItem label="Grade" value={fullUserData?.grade} />
                <DetailItem label="Curriculum" value={fullUserData?.curriculum} />
                <DetailItem label="Stream" value={fullUserData?.stream} />
                <DetailItem label="Performance" value={fullUserData?.performance} />
                <DetailItem label="Financial Situation" value={fullUserData?.financialSituation} />
                <DetailItem label="LinkedIn" value={fullUserData?.linkedin} isLink />
              </div>
              <SectionTitle>Level 3 — Personality</SectionTitle>
              <div className="details-grid">
                <DetailItem label="Personality Type" icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4 4 4 0 01-1.2 2.8A4 4 0 0116 12a4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 011.2-3.2A4 4 0 018 6a4 4 0 014-4z" /></svg>}
                  value={fullUserData?.personality ? fullUserData.personality.charAt(0).toUpperCase() + fullUserData.personality.slice(1) : undefined}
                />
              </div>
            </>
          )}

          {isPending && (
            <>
              <div className={`approval-note ${isPartner ? "partner-note" : "user-note"}`}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  Approval confirmation will be emailed to the {isPartner ? "partner" : "user"}
                </span>
              </div>
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn-reject"
                  onClick={() =>
                    setApprovalConfirmModal({
                      type: "reject",
                      id: selected._id,
                      roleName: isPartner ? "partner" : "user",
                      businessName: selected.businessName || (selected.firstName ? `${selected.firstName} ${selected.lastName || ""}`.trim() : "")
                    })
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-approve"
                  onClick={() =>
                    setApprovalConfirmModal({
                      type: "approve",
                      id: selected._id,
                      roleName: isPartner ? "partner" : "user",
                      businessName: selected.businessName || (selected.firstName ? `${selected.firstName} ${selected.lastName || ""}`.trim() : "")
                    })
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Approve
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--slate-100)", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
            {selected.status === "deactivated" ? (
              <button
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
                onClick={() => activate(selected._id, isPartner ? "partner" : "user", selected.businessName)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Activate Account
              </button>
            ) : (
              <button
                style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                onClick={() => deactivate(selected._id, isPartner ? "partner" : "user", selected.businessName)}
              >
                Deactivate
              </button>
            )}
            <button
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              onClick={() => deleteApproval(selected._id, isPartner ? "partner" : "user", selected.businessName)}
            >
              Delete
            </button>
          </div>
        </div>
        {renderApprovalConfirmModal()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // APPROVALS — LIST VIEW (default fallback return)
  // ══════════════════════════════════════════════════════════════════════════
  const isPartnerView = roleView === "partner";

  return (
    <div className="dashboard">
      <div className="approvals-card">
        <button className="back-btn" onClick={() => { setView("home"); setSelected(null); }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </button>

        <div className="card-header">
          <div className="header-left">
            <div className={`header-icon ${roleView === "pathRequests" ? "path-req-icon" : isPartnerView ? "partner-icon" : "user-icon"}`}>
              {roleView === "pathRequests" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#7c3aed" />
                </svg>
              ) : isPartnerView ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              )}
            </div>
            <div>
              <h2>{roleView === "pathRequests" ? "Path Requests Review" : isPartnerView ? "Partner Approvals" : "User Approvals"}</h2>
              <p className="header-subtitle">
                {roleView === "pathRequests"
                  ? "Manage student requests for uncataloged pathways, view prerequisites, and curate custom paths"
                  : isPartnerView
                  ? "Manage and review partner onboarding requests"
                  : "Manage and review user registration requests"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className={`role-toggle-btn ${roleView === "pathRequests" ? "path-req-toggle" : isPartnerView ? "partner-toggle" : "user-toggle"}`}
                onClick={() => setShowRoleDropdown((prev) => !prev)}
              >
                {roleView === "pathRequests" ? "Path Requests" : isPartnerView ? "Partners" : "Users"}
                <svg className={`arrow ${showRoleDropdown ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <PortalDropdown anchorRef={dropdownRef} isOpen={showRoleDropdown} onClose={() => setShowRoleDropdown(false)}>
                <button className={roleView === "partner" ? "partner-active" : ""} onClick={() => { setRoleView("partner"); setTab("all"); setPartnerScope("all"); setShowRoleDropdown(false); }}>
                  <span className="menu-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                  </span> Partners
                  <span className="menu-count partner-count">{partnerData.length}</span>
                </button>
                <button className={roleView === "user" ? "user-active" : ""} onClick={() => { setRoleView("user"); setTab("all"); setPartnerScope("all"); setShowRoleDropdown(false); }}>
                  <span className="menu-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </span> Users
                  <span className="menu-count user-count">{userData.length}</span>
                </button>
                <button className={roleView === "pathRequests" ? "partner-active" : ""} onClick={() => { setRoleView("pathRequests"); setPathRequestsTab("all"); setSelectedPathRequest(null); setShowRoleDropdown(false); fetchPathRequests("all"); }}>
                  <span className="menu-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </span> Path Requests
                  <span className="menu-count" style={{ background: pathRequestsCounts?.pending > 0 ? "#fef3c7" : "#ede9fe", color: pathRequestsCounts?.pending > 0 ? "#b45309" : "#6d28d9" }}>
                    {pathRequestsCounts?.pending > 0 ? `${pathRequestsCounts.pending} new` : (pathRequestsCounts?.total || pathRequests.length || 0)}
                  </span>
                </button>
              </PortalDropdown>
            </div>

            {/* ── Internal / External sub-dropdown (only visible for Partners) ── */}
            {isPartnerView && (
              <div className="dropdown-container" ref={scopeDropdownRef}>
                <button
                  type="button"
                  className="role-toggle-btn scope-toggle"
                  onClick={() => setShowScopeDropdown((prev) => !prev)}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: partnerScope === "internal" ? "#2563eb" : partnerScope === "external" ? "#f59e0b" : "#94a3b8", flexShrink: 0 }} />
                  {partnerScope === "all" ? "All Partners" : partnerScope === "internal" ? "Internal" : "External"}
                  <svg className={`arrow ${showScopeDropdown ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <PortalDropdown anchorRef={scopeDropdownRef} isOpen={showScopeDropdown} onClose={() => setShowScopeDropdown(false)}>
                  <button className={partnerScope === "all" ? "partner-active" : ""} onClick={() => { setPartnerScope("all"); setTab("all"); setShowScopeDropdown(false); }}>
                    <span className="menu-icon"><SvgClipboard size={14} /></span> All Partners
                    <span className="menu-count partner-count">{partnerData.length}</span>
                  </button>
                  <button className={partnerScope === "internal" ? "scope-internal-active" : ""} onClick={() => { setPartnerScope("internal"); setTab("all"); setShowScopeDropdown(false); }}>
                    <span className="menu-icon"><SvgBuilding size={14} /></span> Internal
                    <span className="menu-count scope-internal-count">{internalCount}</span>
                  </button>
                  <button className={partnerScope === "external" ? "scope-external-active" : ""} onClick={() => { setPartnerScope("external"); setTab("all"); setShowScopeDropdown(false); }}>
                    <span className="menu-icon"><SvgGlobe size={14} /></span> External
                    <span className="menu-count scope-external-count">{externalCount}</span>
                  </button>
                </PortalDropdown>
              </div>
            )}
          </div>
        </div>

        {roleView === "pathRequests" ? (
          <div className="tab-btn-group">
            <button className={`tab-btn ${pathRequestsTab === "all" ? "active" : ""}`} onClick={() => { setPathRequestsTab("all"); fetchPathRequests("all"); }}>
              All ({pathRequestsCounts.total})
            </button>
            <button className={`tab-btn ${pathRequestsTab === "pending" ? "active" : ""}`} onClick={() => { setPathRequestsTab("pending"); fetchPathRequests("pending"); }}>
              Pending ({pathRequestsCounts.pending})
            </button>
            <button className={`tab-btn ${pathRequestsTab === "in_progress" ? "active" : ""}`} onClick={() => { setPathRequestsTab("in_progress"); fetchPathRequests("in_progress"); }}>
              In Progress ({pathRequestsCounts.in_progress})
            </button>
            <button className={`tab-btn ${pathRequestsTab === "created" ? "active" : ""}`} onClick={() => { setPathRequestsTab("created"); fetchPathRequests("created"); }}>
              Created & Ready ({pathRequestsCounts.created})
            </button>
            <button className={`tab-btn ${pathRequestsTab === "rejected" ? "active" : ""}`} onClick={() => { setPathRequestsTab("rejected"); fetchPathRequests("rejected"); }}>
              Rejected ({pathRequestsCounts.rejected})
            </button>
          </div>
        ) : (
          <div className="tab-btn-group">
            <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All</button>
            <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>Pending</button>
            <button className={`tab-btn ${tab === "approved" ? "active" : ""}`} onClick={() => setTab("approved")}>Approved</button>
            <button className={`tab-btn ${tab === "rejected" ? "active" : ""}`} onClick={() => setTab("rejected")}>Rejected</button>
            <button className={`tab-btn ${tab === "deactivated" ? "active" : ""}`} onClick={() => setTab("deactivated")}>Deactivated</button>
          </div>
        )}

        <div className="table-wrapper">
          {roleView === "pathRequests" ? (
            pathRequestsLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>Loading custom path requests...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Target Goal & Institution</th>
                    <th>Sector & Timeline</th>
                    <th>Prerequisites</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pathRequests.length > 0 ? (
                    pathRequests.map((req, idx) => {
                      const pal = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                      return (
                        <tr key={req._id || req.requestId} className="table-row path-req-table-row">
                          <td className="col-student">
                            <div className="business-info">
                              <div className="row-avatar" style={{ background: pal.color, color: pal.textColor }}>
                                {req.userName?.slice(0, 2).toUpperCase() || "ST"}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
                                <div className="business-name" style={{ lineHeight: 1.25, margin: 0 }}>{req.userName}</div>
                                <div style={{ fontSize: 11, color: "var(--slate-400)", lineHeight: 1.25, margin: 0 }}>{req.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="col-target">
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--slate-800)" }}>{req.targetGoal}</div>
                            {req.targetInstitution && (
                              <div style={{ fontSize: 11.5, color: "#6366f1", fontWeight: 600 }}><SvgBuilding size={14} /> {req.targetInstitution}</div>
                            )}
                          </td>
                          <td className="col-sector">
                            <div className="col-sector-timeline">
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-700)" }}>{req.sector}</div>
                              <div style={{ fontSize: 11, color: "var(--slate-400)" }}><SvgClock size={14} /> {req.targetTimeline}</div>
                            </div>
                          </td>
                          <td className="col-prereq" title={req.mandatoryRequirements}>
                            <span className="mobile-label prereq-mobile-label">Prerequisites: </span>
                            {req.mandatoryRequirements || "—"}
                          </td>
                          <td className="col-status">
                            <span className={`status-pill ${req.status}`}>
                              {req.status === "created"
                                ? <><SvgCheck size={12} style={{ marginRight: 4 }} /> Created</>
                                : req.status === "in_progress"
                                ? <><SvgClock size={12} style={{ marginRight: 4 }} /> In Progress</>
                                : req.status === "rejected"
                                ? <><SvgClose size={12} style={{ marginRight: 4 }} /> Rejected</>
                                : <><SvgHourglass size={12} style={{ marginRight: 4 }} /> Pending</>}
                            </span>
                          </td>
                          <td className="date-cell col-date">
                            <span className="mobile-label date-mobile-label">Date: </span>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="col-actions">
                            <button
                              className="view-btn"
                              style={{ background: "#f5f3ff", color: "#6d28d9", borderColor: "#ddd6fe", fontWeight: 700 }}
                              onClick={() => setSelectedPathRequest(req)}
                            >
                              Review & Create →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-results">
                        <div className="empty-state">
                          <div className="empty-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                            </svg>
                          </div>
                          <p>No {pathRequestsTab === "all" ? "" : pathRequestsTab} path requests found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          ) : loadingData ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>Loading {isPartnerView ? "partners" : "users"}...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{isPartnerView ? "Business" : "Name"}</th>
                  <th>Type</th>{isPartnerView && <th>Source</th>}<th>Email</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const targetName = item.businessName || (item.firstName ? `${item.firstName} ${item.lastName || ""}`.trim() : item.email) || "";
                    return (
                    <tr key={item._id} className="table-row approval-table-row">
                      <td className="col-business">
                        <div className="business-info">
                          <div className={`row-avatar ${isPartnerView ? "partner-row-avatar" : "user-row-avatar"}`}>
                            {(item.businessName || item.firstName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="business-name">{targetName}</span>
                        </div>
                      </td>
                      <td className="col-type"><span className="type-badge">{item.type || "—"}</span></td>
                      {isPartnerView && (
                        <td className="col-scope">
                          <span className={`scope-badge ${item.partnerScope === "internal" ? "scope-internal" : "scope-external"}`}>
                            {item.partnerScope === "internal" ? <><SvgBuilding size={12} style={{ marginRight: 4 }} /> Internal</> : <><SvgGlobe size={12} style={{ marginRight: 4 }} /> External</>}
                          </span>
                        </td>
                      )}
                      <td className="email-cell col-email">{item.email}</td>
                      <td className="date-cell col-date">{item.date}</td>
                      <td className="col-actions" style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button className="view-btn" onClick={() => setSelected(item)}>View</button>
                          {item.status !== "deactivated" ? (
                            <button
                              style={{
                                background: "#fff7ed",
                                color: "#c2410c",
                                border: "1px solid #ffedd5",
                                padding: "5px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                              onClick={(e) => { e.stopPropagation(); deactivate(item._id, isPartnerView ? "partner" : "user", targetName); }}
                              title="Deactivate account in DB"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              style={{
                                background: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                padding: "5px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                              onClick={(e) => { e.stopPropagation(); activate(item._id, isPartnerView ? "partner" : "user", targetName); }}
                              title="Reactivate account in DB"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            style={{
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fee2e2",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                            onClick={(e) => { e.stopPropagation(); deleteApproval(item._id, isPartnerView ? "partner" : "user", targetName); }}
                            title="Delete record & account from DB"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
                ) : (
                  <tr>
                    <td colSpan={isPartnerView ? "6" : "5"} className="no-results">
                      <div className="empty-state">
                        <div className="empty-icon">
                          {isPartnerView ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                          ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          )}
                        </div>                        <p>No {tab === "all" ? "" : tab} {isPartnerView ? "partner" : "user"} records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Super Admin Assistance Details Modal & Chat ── */}
      <AssistanceRequestDetailsModal
        isOpen={isAssistanceModalOpen}
        onClose={() => {
          setIsAssistanceModalOpen(false);
          setSelectedAssistanceRequest(null);
        }}
        request={selectedAssistanceRequest}
        onStatusChange={(updated) => {
          setAssistanceRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          setSelectedAssistanceRequest(updated);
        }}
      />

      {renderApprovalConfirmModal()}
    </div>
  );
}


// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="details-section-title" style={{ marginTop: "24px", marginBottom: "4px", paddingBottom: "8px", borderBottom: "1px solid #f0f2f5", fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function DetailItem({ label, value, icon, isLink }) {
  const getHref = (val) => {
    if (!val || typeof val !== "string") return "#";
    const trimmed = val.trim();
    if (trimmed.includes("@") && !trimmed.startsWith("http")) {
      return `mailto:${trimmed}`;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  return (
    <div className="detail-row">
      <div className="detail-label">
        {icon && <span className="detail-icon">{icon}</span>}
        {label}
      </div>
      <div className="detail-value">
        {isLink && value ? (
          <a
            href={getHref(value)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${getHref(value)}`}
          >
            {value}
          </a>
        ) : (
          value || <span className="empty-val">—</span>
        )}
      </div>
    </div>
  );
}