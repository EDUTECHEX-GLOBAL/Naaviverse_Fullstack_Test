import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./partnerHome.scss";
import { useStore } from "../../components/store/store.ts";
import { SvgArrowRight, SvgSparkles, SvgZap, SvgHourglass, SvgShoppingCart, SvgCheck, SvgTrendingUp } from "../../utils/SvgIcons";
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

function getPartnerEmail() {
  try {
    const raw = localStorage.getItem("partnerData") || localStorage.getItem("partner");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email || null;
  } catch { return null; }
}

const NOTIF_CFG = {
  purchase: { bg: "#dcfce7", color: "#15803d", icon: <SvgShoppingCart size={15} color="#15803d" />, label: "Purchase" },
  approval: { bg: "#fef3c7", color: "#b45309", icon: <SvgCheck size={15} color="#b45309" />, label: "Approval" },
  path: { bg: "#ccfbf1", color: "#0f766e", icon: <SvgTrendingUp size={15} color="#0f766e" />, label: "Path" },
  system: { bg: "#f1f5f9", color: "#475569", icon: <SvgZap size={15} color="#475569" />, label: "System" },
};

const urgencyOrder = { high: 0, medium: 1, low: 2 };


const PLAN_BADGE = {
  Micro: { bg: "#e0e7ff", color: "#4338ca" },
  Nano: { bg: "#d1fae5", color: "#047857" },
  Bundle: { bg: "#fef3c7", color: "#b45309" },
  Premium: { bg: "#fce7f3", color: "#be185d" },
};

const Skeleton = ({ width = "100%", height = 16, radius = 6, style = {} }) => (
  <div style={{ width, height, borderRadius: radius, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "ph-shimmer 1.4s infinite", ...style }} />
);

export default function PartnerHome({ setispopular }) {
  const [view, setView] = useState("home");
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pathTab, setPathTab] = useState("all");
  const { setaccsideNav } = useStore();

  const [activityTab, setActivityTab] = useState("All");
  const [showNotif, setShowNotif] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [dashStats, setDashStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [pathUsers, setPathUsers] = useState([]);
  const [pathUsersLoading, setPathUsersLoading] = useState(false);
  const [showGuideNote, setShowGuideNote] = useState(() => {
    try {
      return localStorage.getItem("dont_show_add_path_hint") !== "true";
    } catch {
      return true;
    }
  });
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(true);

  const notifRef = useRef(null);
  const guideNoteRef = useRef(null);
  const unread = notifications.filter(n => n.unread).length;

  const fetchNotifications = useCallback(async () => {
    const email = getPartnerEmail();
    if (!email) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/partner-dashboard/notifications`, { params: { email } });
      if (res.data?.status && Array.isArray(res.data.notifications)) {
        let readIds = new Set();
        try {
          const raw = localStorage.getItem(`read_notifs_${email}`);
          if (raw) readIds = new Set(JSON.parse(raw));
        } catch { }

        const formatted = res.data.notifications.map(n => ({
          ...n,
          unread: !readIds.has(n.id),
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.error("fetchNotifications error:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    if (showNotif) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotif]);

  const markAllRead = () => {
    setNotifications(p => p.map(n => ({ ...n, unread: false })));
    try {
      const email = getPartnerEmail();
      if (email) {
        const allIds = notifications.map(n => n.id);
        const existing = new Set(JSON.parse(localStorage.getItem(`read_notifs_${email}`) || "[]"));
        allIds.forEach(id => existing.add(id));
        localStorage.setItem(`read_notifs_${email}`, JSON.stringify([...existing]));
      }
    } catch { }
  };

  const markRead = (id) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, unread: false } : n));
    try {
      const email = getPartnerEmail();
      if (email) {
        const existing = new Set(JSON.parse(localStorage.getItem(`read_notifs_${email}`) || "[]"));
        existing.add(id);
        localStorage.setItem(`read_notifs_${email}`, JSON.stringify([...existing]));
      }
    } catch { }
  };

  const handleNotifAction = (n) => {
    markRead(n.id);
    setShowNotif(false);

    const tab = n.targetTab || (n.type === "path" ? "Paths" : n.type === "purchase" ? "CRM" : "Home");
    if (tab === "Paths" && setaccsideNav) {
      setaccsideNav("Paths");
    } else if (tab === "CRM" && setaccsideNav) {
      setaccsideNav("CRM");
    } else if (tab === "Marketplace" && setaccsideNav) {
      setaccsideNav("Marketplace");
    } else if (tab === "Feedback" && setaccsideNav) {
      setaccsideNav("Feedback");
    } else {
      setView("home");
    }
  };

  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchStats = useCallback(async () => {
    const email = getPartnerEmail();
    if (!email) { setStatsError("Partner email not found."); setStatsLoading(false); return; }
    try {
      setStatsLoading(true); setStatsError(null);
      const res = await axios.get(`${BASE_URL}/api/partner-dashboard/stats`, { params: { email } });
      if (res.data?.status) {
        setDashStats(res.data.data);
        if (Array.isArray(res.data.data?.notifications) && res.data.data.notifications.length > 0) {
          let readIds = new Set();
          try {
            const raw = localStorage.getItem(`read_notifs_${email}`);
            if (raw) readIds = new Set(JSON.parse(raw));
          } catch { }

          const formattedNotifs = res.data.data.notifications.map(act => ({
            ...act,
            unread: !readIds.has(act.id),
          }));
          setNotifications(formattedNotifs);
        }
      }
      else setStatsError(res.data?.message || "Failed to load stats");
    } catch { setStatsError("Could not load dashboard data."); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fetchPathUsers = useCallback(async (pathId) => {
    const partnerEmail = getPartnerEmail();
    if (!pathId || !partnerEmail) return;
    try {
      setPathUsersLoading(true);
      const res = await axios.get(`${BASE_URL}/api/partner-dashboard/path-users`, { params: { pathId, partnerEmail } });
      setPathUsers(res.data?.status ? (res.data.data || []) : []);
    } catch { setPathUsers([]); }
    finally { setPathUsersLoading(false); }
  }, []);

  const MY_PATHS = dashStats?.paths || [];
  const MARKETPLACE_ITEMS = dashStats?.marketplaceItems || [];
  const partnerName = dashStats?.partnerName || "Partner";
  const totalSelected = dashStats?.totalSelected ?? 0;
  const thisWeek = dashStats?.thisWeek ?? 0;
  const percentChange = dashStats?.percentChange ?? 0;
  const totalPurchases = dashStats?.totalMarketplacePurchases ?? 0;
  const totalMarketplaceRevenue = dashStats?.totalMarketplaceRevenue ?? 0;
  const totalBundles = MARKETPLACE_ITEMS.filter(m => m.type === "Bundle").reduce((s, m) => s + (m.purchases || 0), 0);
  const LIVE_ACTIVITY = dashStats?.liveActivity || [];
  const pendingActions = dashStats?.pendingActions || [];
  const sortedActions = [...pendingActions].sort((a, b) => (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2));
  const highCount = pendingActions.filter(a => a.urgency === "high").length;
  const actFiltered = activityTab === "All"
    ? LIVE_ACTIVITY
    : LIVE_ACTIVITY.filter(a => (a.type || "").toLowerCase() === activityTab.toLowerCase());
  const displayedActivity = showAllActivity ? actFiltered : actFiltered.slice(0, 4);

  const weeklyRetention = dashStats?.weeklyRetention || (() => {
    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const events = (notifications || []).concat(LIVE_ACTIVITY || []);
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let hasEvents = false;

    events.forEach(e => {
      const dt = e.rawDate || e.date;
      if (dt) {
        const d = new Date(dt);
        if (!isNaN(d.getTime())) {
          counts[d.getDay()] = (counts[d.getDay()] || 0) + 1;
          hasEvents = true;
        }
      }
    });

    const totalStudents = totalSelected || 0;
    let peakDay = null;
    let peakRate = 0;

    const rates = dayIndices.map((idx, di) => {
      const cnt = counts[idx] || 0;
      let r = 0;
      if (totalStudents > 0) {
        r = Math.min(100, Math.round((cnt / totalStudents) * 100));
      } else if (hasEvents && cnt > 0) {
        r = 100;
      }
      if (r > peakRate) {
        peakRate = r;
        peakDay = dayNames[di];
      }
      return r;
    });

    return {
      days: dayLabels,
      rates,
      peakDay: peakRate > 0 ? peakDay : null,
      peakRate,
    };
  })();

  // ── NOTIFICATIONS PAGE ──────────────────────────────────────────────────
  if (view === "notifications") {
    const FILTERS = [
      { key: "all", label: "All", dot: "#0d9488" },
      { key: "purchase", label: "Purchases", dot: "#15803d" },
      { key: "path", label: "Paths", dot: "#0f766e" },
      { key: "approval", label: "Approvals", dot: "#b45309" },
      { key: "system", label: "System", dot: "#64748b" },
    ];
    const filtered = notifFilter === "all" ? notifications : notifications.filter(n => n.type === notifFilter);
    return (
      <div className="ph-root ph-notif-root">
        <div className="ph-notif-page">
          <div className="ph-notif-topbar">
            <button className="ph-back-btn" onClick={() => setView("home")}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to Dashboard
            </button>
            <div className="ph-notif-page-title">Notifications</div>
            <div className="ph-notif-topbar-actions" style={{ display: "flex", gap: 8 }}>
              <button className="ph-mark-all-btn" onClick={markAllRead}>Mark all read</button>
            </div>
          </div>
          <div className="ph-notif-body">
            <div className="ph-notif-sidebar">
              <div className="ph-notif-sidebar-label">Filter</div>
              {FILTERS.map(f => {
                const cnt = f.key === "all" ? notifications.length : notifications.filter(n => n.type === f.key).length;
                return (
                  <button key={f.key} className={`ph-notif-filter-btn ${notifFilter === f.key ? "active" : ""}`} onClick={() => setNotifFilter(f.key)}>
                    <span className="ph-notif-filter-dot" style={{ background: f.dot }} />{f.label}
                    <span className="ph-notif-filter-count">{cnt}</span>
                  </button>
                );
              })}
            </div>
            <div className="ph-notif-list-full">
              {filtered.length === 0 ? <div className="ph-notif-empty">No notifications</div>
                : filtered.map(n => {
                  const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.system;
                  return (
                    <div key={n.id} className={`ph-notif-full-item ${n.unread ? "unread" : ""}`} onClick={() => handleNotifAction(n)}>
                      <div className="ph-notif-full-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
                      <div className="ph-notif-full-body">
                        <div className="ph-notif-full-title">{n.title}</div>
                        <div className="ph-notif-full-desc">{n.desc}</div>
                        <div className="ph-notif-full-meta">
                          <span className="ph-notif-full-time">{n.time}</span>
                          <span className="ph-notif-full-tag" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                      <div className="ph-notif-full-right">
                        {n.unread && <div className="ph-unread-dot" />}
                        <button
                          type="button"
                          className="ph-full-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotifAction(n);
                          }}
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIONS PAGE ────────────────────────────────────────────────────────
  if (view === "actions") {
    return (
      <div className="ph-root ph-actions-root">
        <div className="ph-page-card">
          <div className="ph-page-topbar">
            <button className="ph-back-btn-icon" onClick={() => setView("home")}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back</span>
            </button>
            <div className="ph-page-header-left">
              <div className="ph-page-header-content">
                <h2>Pending Actions</h2>
                <p>{highCount} urgent · {pendingActions.length} total items need attention</p>
              </div>
            </div>
          </div>

          <div className="ph-table-wrap">
            {pendingActions.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><SvgSparkles size={14} /></div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 4 }}>No pending actions</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>All items are currently up to date.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Priority</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedActions.map(action => (
                    <tr key={action.id} className="ph-table-row">
                      <td><div className="ph-cell-name">{action.label}</div></td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{action.desc}</td>
                      <td>
                        <span className={`ph-status-pill ${action.urgency === "high" ? "ph-status-pending" : action.urgency === "medium" ? "ph-status-inactive" : "ph-status-active"}`}>
                          {action.urgency === "high" ? "Urgent" : action.urgency === "medium" ? "Medium" : "Low"}
                        </span>
                      </td>
                      <td>
                        <button className="ph-view-btn" onClick={() => setView(action.nav)}>
                          Go <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ── PATHS LIST PAGE ──────────────────────────────────────────────────────
  if (view === "paths" && !selectedPath) {
    const filtered = pathTab === "all" ? MY_PATHS : MY_PATHS.filter(p => (p.status || "active") === pathTab);
    return (
      <div className="ph-root ph-paths-root">
        <div className="ph-page-card">
          <div className="ph-page-topbar">
            <button className="ph-back-btn-icon" onClick={() => setView("home")}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back</span>
            </button>
            <div className="ph-page-header-left">
              <div className="ph-page-header-content">
                <h2>My Learning Paths</h2>
                <p>Manage paths · track enrollments · monitor completion</p>
              </div>
            </div>
            <button className="ph-refresh-btn" onClick={fetchStats} disabled={statsLoading}>
              {statsLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          <div className="ph-tab-group">
            <button className={`ph-tab-btn ${pathTab === "all" ? "active" : ""}`} onClick={() => setPathTab("all")}>
              All
            </button>
            <button className={`ph-tab-btn ${pathTab === "active" ? "active" : ""}`} onClick={() => setPathTab("active")}>
              Active
            </button>
            <button className={`ph-tab-btn ${pathTab === "inactive" ? "active" : ""}`} onClick={() => setPathTab("inactive")}>
              Inactive
            </button>
            <button className={`ph-tab-btn ${pathTab === "pending" ? "active" : ""}`} onClick={() => setPathTab("pending")}>
              Pending
            </button>
            <button className="ph-add-new-btn" onClick={() => setispopular && setispopular(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Add New
            </button>
          </div>

          {statsLoading ? (
            <div style={{ padding: "24px 0" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <Skeleton width={200} height={14} /><Skeleton width={80} height={14} /><Skeleton width={50} height={14} /><Skeleton width={100} height={14} />
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div style={{ padding: 24, textAlign: "center", color: "#e55a2b" }}>
              {statsError} <button className="ph-refresh-btn" onClick={fetchStats} style={{ marginLeft: 12 }}>Retry</button>
            </div>
          ) : (
            <div className="ph-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Category</th>
                    <th>Enrolled</th>
                    <th>This Week</th>
                    <th>Completion</th>
                    <th>Steps</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No paths found.</td></tr>
                  ) : (
                    filtered.map(path => (
                      <tr key={path._id} className="ph-table-row">
                        <td><div className="ph-cell-name">{path.nameOfPath}</div></td>
                        <td><span className="ph-type-chip">{path.category}</span></td>
                        <td><span style={{ fontWeight: 700, color: "#1e293b" }}>{path.usersEnrolled}</span></td>
                        <td><span style={{ fontSize: 11, fontWeight: 600, color: path.thisWeek > 0 ? "#0d9488" : "#94a3b8" }}>{path.thisWeek > 0 ? `+${path.thisWeek}` : "—"}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="ph-mini-bar"><div className="ph-mini-fill" style={{ width: `${path.completion}%`, background: path.completion > 70 ? "#0d9488" : path.completion > 40 ? "#14b8a6" : "#94a3b8" }} /></div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0d9488" }}>{path.completion}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: "#64748b" }}>{path.steps} steps</td>
                        <td><span className="ph-status-pill ph-status-active">Active</span></td>
                        <td><button className="ph-view-btn" onClick={() => { setSelectedPath(path); fetchPathUsers(path._id); setView("pathDetail"); }}>Details</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PATH DETAIL PAGE ─────────────────────────────────────────────────────
  if (view === "pathDetail" && selectedPath) {
    const p = selectedPath;
    return (
      <div className="ph-root ph-path-detail-root">
        <div className="ph-page-card">
          <button className="ph-back-btn" onClick={() => { setSelectedPath(null); setPathUsers([]); setView("paths"); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to Paths
          </button>
          <div className="ph-detail-hero">
            <div className="ph-detail-avatar">[trending]</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontFamily: "var(--ph-display)", fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>{p.nameOfPath}</h2>
                <span className="ph-status-pill ph-status-active">● Active</span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{p.category}</div>
            </div>
          </div>
          <div className="ph-detail-stats">
            <div className="ph-dsc ph-dsc-teal"><div className="ph-dsc-label">Enrolled</div><div className="ph-dsc-val">{p.usersEnrolled}</div></div>
            <div className="ph-dsc ph-dsc-blue"><div className="ph-dsc-label">Completion</div><div className="ph-dsc-val">{p.completion}%</div></div>
            <div className="ph-dsc ph-dsc-violet"><div className="ph-dsc-label">Steps</div><div className="ph-dsc-val">{p.steps}</div></div>
            <div className="ph-dsc ph-dsc-emerald"><div className="ph-dsc-label">This Week</div><div className="ph-dsc-val">{p.thisWeek > 0 ? `+${p.thisWeek}` : "0"}</div></div>
          </div>
          <div className="ph-detail-grid">
            {[["Path Name", p.nameOfPath], ["Category", p.category], ["Steps", `${p.steps} steps`], ["Micro Lessons", `${p.microLessons || p.steps * 4} lessons`], ["Enrolled", p.usersEnrolled], ["This Week", p.thisWeek > 0 ? `+${p.thisWeek} new` : "No new this week"]].map(([l, v]) => (
              <div key={l} className="ph-detail-row"><div className="ph-detail-label">{l}</div><div className="ph-detail-value">{v}</div></div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "var(--ph-display)", marginBottom: 12 }}>
              Enrolled Users {!pathUsersLoading && <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginLeft: 8 }}>({pathUsers.length} total)</span>}
            </div>
            {pathUsersLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <Skeleton key={i} height={40} radius={8} />)}</div>
            ) : pathUsers.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No users enrolled yet.</div>
            ) : (
              <div className="ph-table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Email</th><th>Enrolled</th><th>Progress</th><th>Steps Done</th><th>Status</th></tr></thead>
                  <tbody>
                    {pathUsers.map((u, i) => (
                      <tr key={u.email + i} className="ph-table-row">
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {(u.name || u.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="ph-cell-name">{u.name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{u.email}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8" }}>{u.enrolledAt ? new Date(u.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="ph-mini-bar" style={{ width: 70 }}><div className="ph-mini-fill" style={{ width: `${u.completion}%`, background: u.completion >= 100 ? "#0d9488" : u.completion > 40 ? "#14b8a6" : "#94a3b8" }} /></div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#0d9488" }}>{u.completion}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{u.completedSteps}/{u.totalSteps}</td>
                        <td>
                          <span className={`ph-status-pill ${u.status === "completed" ? "ph-status-active" : u.status === "in-progress" ? "ph-status-pending" : "ph-status-inactive"}`}>
                            {u.status === "completed" ? "● Done" : u.status === "in-progress" ? <><SvgHourglass size={12} style={{ marginRight: 3, verticalAlign: "middle" }} /> Active</> : "○ Not Started"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MARKETPLACE LIST PAGE ────────────────────────────────────────────────
  if (view === "marketplace" && !selectedItem) {
    const totalRev = MARKETPLACE_ITEMS.reduce((s, m) => s + m.revenue, 0);
    return (
      <div className="ph-root ph-marketplace-root">
        <div className="ph-page-card ph-marketplace-card">
          <div className="ph-marketplace-topbar">
            <div className="ph-marketplace-topbar-left">
              <button
                type="button"
                className="ph-marketplace-back-btn"
                onClick={() => setView("home")}
                title="Back to Dashboard"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Back</span>
              </button>
              <div className="ph-marketplace-title-block">
                <h2 className="ph-marketplace-title">My Marketplace</h2>
                <p className="ph-marketplace-subtitle">Track purchases · monitor revenue · manage listings</p>
              </div>
            </div>
            <div className="ph-marketplace-rev-summary">
              <div className="ph-rev-summary-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="ph-rev-summary-text">
                <span className="ph-rev-summary-label">Total Revenue</span>
                <span className="ph-rev-summary-value">₹{totalRev.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="ph-marketplace-table-container">
            <table className="ph-marketplace-table">
              <thead>
                <tr>
                  <th className="ph-col-item">Item</th>
                  <th className="ph-col-type">Type</th>
                  <th className="ph-col-plan">Plan</th>
                  <th className="ph-col-purchases">Purchases</th>
                  <th className="ph-col-revenue">Revenue</th>
                  <th className="ph-col-status">Status</th>
                  <th className="ph-col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {MARKETPLACE_ITEMS.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ph-table-empty-cell">
                      No marketplace listings found.
                    </td>
                  </tr>
                ) : (
                  MARKETPLACE_ITEMS.map(item => (
                    <tr key={item.id} className="ph-marketplace-row">
                      <td className="ph-col-item">
                        <div className="ph-marketplace-item-name" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      <td className="ph-col-type">
                        <span className="ph-marketplace-type-badge">{item.type}</span>
                      </td>
                      <td className="ph-col-plan">
                        <span
                          className="ph-marketplace-plan-badge"
                          style={{
                            backgroundColor: PLAN_BADGE[item.plan]?.bg || "#eff6ff",
                            color: PLAN_BADGE[item.plan]?.color || "#2563eb",
                            borderColor: PLAN_BADGE[item.plan]?.border || "#bfdbfe",
                          }}
                        >
                          {item.plan}
                        </span>
                      </td>
                      <td className="ph-col-purchases">
                        <span className="ph-purchases-val">{item.purchases}</span>
                      </td>
                      <td className="ph-col-revenue">
                        <span className="ph-revenue-val">₹{item.revenue.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="ph-col-status">
                        <span className={`ph-status-pill ph-status-${item.status}`}>
                          <span className="ph-status-bullet" />
                          {item.status === "active" ? "Active" : "Pending"}
                        </span>
                      </td>
                      <td className="ph-col-actions">
                        <button
                          type="button"
                          className="ph-details-action-btn"
                          onClick={() => { setSelectedItem(item); setView("marketDetail"); }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  // ── MARKETPLACE DETAIL PAGE ──────────────────────────────────────────────
  if (view === "marketDetail" && selectedItem) {
    const item = selectedItem;
    return (
      <div className="ph-root ph-market-detail-root">
        <div className="ph-page-card ph-market-detail-card">
          <div className="ph-detail-top-nav">
            <button
              type="button"
              className="ph-detail-back-btn"
              onClick={() => { setSelectedItem(null); setView("marketplace"); }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to Marketplace</span>
            </button>
          </div>

          <div className="ph-detail-hero-card">
            <div className="ph-detail-hero-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ph-detail-hero-content">
              <div className="ph-detail-hero-top-row">
                <h1 className="ph-detail-item-title">{item.name}</h1>
                <span className={`ph-status-pill ph-status-${item.status}`}>
                  <span className="ph-status-bullet" />
                  {item.status === "active" ? "Active" : "Pending"}
                </span>
              </div>
              <div className="ph-detail-hero-meta">
                <span className="ph-meta-type">{item.type}</span>
                <span className="ph-meta-dot">·</span>
                <span className="ph-meta-plan">{item.plan} Plan</span>
              </div>
            </div>
          </div>

          <div className="ph-detail-metrics-row">
            <div className="ph-detail-stat-card ph-stat-card-purchases">
              <div className="ph-stat-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="ph-stat-card-info">
                <span className="ph-stat-card-label">PURCHASES</span>
                <span className="ph-stat-card-value">{item.purchases}</span>
              </div>
            </div>

            <div className="ph-detail-stat-card ph-stat-card-revenue">
              <div className="ph-stat-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="ph-stat-card-info">
                <span className="ph-stat-card-label">REVENUE</span>
                <span className="ph-stat-card-value">₹{item.revenue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="ph-detail-specs-card">
            <div className="ph-specs-card-header">
              <h3 className="ph-specs-card-title">Listing Details</h3>
              <span className="ph-specs-card-tag">Specifications</span>
            </div>
            <div className="ph-specs-card-body">
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Item Name</span>
                <span className="ph-spec-item-value ph-spec-name-value">{item.name}</span>
              </div>
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Type</span>
                <span className="ph-spec-item-value">{item.type}</span>
              </div>
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Plan</span>
                <span className="ph-spec-item-value">{item.plan}</span>
              </div>
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Purchases</span>
                <span className="ph-spec-item-value">{item.purchases} {item.purchases === 1 ? "unit" : "units"}</span>
              </div>
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Revenue</span>
                <span className="ph-spec-item-value ph-spec-revenue-value">₹{item.revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="ph-spec-item-row">
                <span className="ph-spec-item-label">Status</span>
                <span className="ph-spec-item-value">
                  <span className={`ph-status-pill ph-status-${item.status}`}>
                    <span className="ph-status-bullet" />
                    {item.status === "active" ? "Active" : "Pending"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HOME PAGE ────────────────────────────────────────────────────────────
  return (
    <div className="ph-root">
      <style>{`@keyframes ph-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {/* ── HEADER ── */}
      <div className="ph-header">
        <div className="ph-header-left">
          <div className="ph-welcome">
            Welcome back, <span className="ph-accent">{partnerName}</span>
          </div>
          <div className="ph-sub">Partner overview · updated just now</div>
        </div>

        <div className="ph-header-right">
          <div className="ph-date-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" /></svg>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>

          {/* ── NOTIFICATION BELL IN TOOLBAR ── */}
          <div ref={notifRef} className="ph-notif-wrap">
            <button
              type="button"
              className="ph-bell-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotif(p => !p);
              }}
              title="Notifications"
              aria-label="View notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && <span className="ph-bell-badge">{unread}</span>}
            </button>
            {showNotif && (
              <div className="ph-notif-dd">
                <div className="ph-notif-dd-head">
                  <span className="ph-notif-dd-title">Notifications</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {unread > 0 && <span className="ph-notif-new-badge">{unread} new</span>}
                    <button className="ph-mark-all-btn" onClick={(e) => { e.stopPropagation(); markAllRead(); }}>Mark all read</button>
                  </div>
                </div>
                <div className="ph-notif-dd-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 6).map(n => {
                      const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.system;
                      return (
                        <div key={n.id} className={`ph-notif-dd-item ${n.unread ? "unread" : ""}`} onClick={() => handleNotifAction(n)}>
                          <div className="ph-notif-dd-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
                          <div className="ph-notif-dd-body">
                            <div className="ph-notif-dd-item-title">{n.title}</div>
                            <div className="ph-notif-dd-item-desc">{n.desc}</div>
                            <div className="ph-notif-dd-item-time">{n.time}</div>
                          </div>
                          <div className="ph-notif-dd-right">
                            {n.unread && <div className="ph-unread-dot" />}
                            <button
                              type="button"
                              className="ph-notif-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotifAction(n);
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="ph-notif-dd-footer">
                  <button className="ph-view-all-notif-btn" onClick={(e) => { e.stopPropagation(); setShowNotif(false); setView("notifications"); }}>View all notifications →</button>
                </div>
              </div>
            )}
          </div>

          {/* ── ADD NEW BUTTON ── */}
          <button className="ph-add-btn" onClick={() => setispopular && setispopular(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Add New
          </button>
        </div>
      </div>

      {/* ── TOGGLE NOTE: MINIMAL PATH GUIDE ── */}
      {showGuideNote && (
        <div
          ref={guideNoteRef}
          className={`ph-toggle-note ${isGuideCollapsed ? "ph-toggle-note--collapsed" : "ph-toggle-note--expanded"}`}
        >
          <div className="ph-tn-bar">
            <div
              className="ph-tn-bar-left"
              role="button"
              tabIndex={0}
              onClick={() => setIsGuideCollapsed(p => !p)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsGuideCollapsed(p => !p); }}
            >
              <span className="ph-tn-icon"><SvgSparkles size={16} /></span>
              <span className="ph-tn-title">How to create a path in 3 simple steps</span>
            </div>
            <div className="ph-tn-bar-right">
              <button
                type="button"
                className="ph-tn-toggle-btn"
                onClick={() => setIsGuideCollapsed(p => !p)}
              >
                <span>{isGuideCollapsed ? "Show guide" : "Hide guide"}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: isGuideCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="ph-tn-dont-show-btn"
                onClick={() => {
                  try {
                    localStorage.setItem("dont_show_add_path_hint", "true");
                  } catch { }
                  setShowGuideNote(false);
                }}
                title="Never show this guide again"
              >
                Don't show again
              </button>
              <button
                type="button"
                className="ph-tn-close-btn"
                onClick={() => setShowGuideNote(false)}
                title="Dismiss"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>

          {!isGuideCollapsed && (
            <div className="ph-tn-minimal-body">
              <div className="ph-tn-steps-row">
                <div className="ph-tn-mini-step">
                  <span className="ph-tn-step-num">1</span>
                  <div className="ph-tn-step-text">
                    <strong>Create a path</strong>
                    <span>Name it & set a goal</span>
                  </div>
                </div>
                <span className="ph-tn-step-arrow">→</span>
                <div className="ph-tn-mini-step">
                  <span className="ph-tn-step-num">2</span>
                  <div className="ph-tn-step-text">
                    <strong>Add steps</strong>
                    <span>Courses, sessions & tasks</span>
                  </div>
                </div>
                <span className="ph-tn-step-arrow">→</span>
                <div className="ph-tn-mini-step">
                  <span className="ph-tn-step-num">3</span>
                  <div className="ph-tn-step-text">
                    <strong>Publish</strong>
                    <span>Live on marketplace</span>
                  </div>
                </div>
              </div>

              <div className="ph-tn-minimal-footer">
                <button
                  type="button"
                  className="ph-tn-cta-btn"
                  onClick={() => setispopular && setispopular(true)}
                >
                  Create a path →
                </button>
                <span className="ph-tn-minimal-tip">[idea] Start with a name and outcome. You can fine-tune modules anytime later.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ph-section-label">
        <span className="ph-section-title">OVERVIEW · LAST 30 DAYS</span>
        <div className={`ph-section-actions ${!showGuideNote ? "has-guide-btn" : ""}`}>
          {!showGuideNote && (
            <button
              type="button"
              className="ph-reopen-guide-btn"
              onClick={() => {
                setShowGuideNote(true);
                setIsGuideCollapsed(false);
                setTimeout(() => {
                  if (guideNoteRef.current) {
                    guideNoteRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }, 50);
              }}
              title="Show guide to create a path"
            >
              <span><SvgSparkles size={14} /> How to create a path</span>
            </button>
          )}
          <span className="ph-export-link" onClick={fetchStats} style={{ cursor: "pointer" }}>{statsLoading ? "Loading…" : "↻ Refresh"}</span>
        </div>
      </div>

      {/* ── 3 STAT CARDS ── */}
      <div className="ph-top-stats">

        {/* Card 1 */}
        <div className="ph-stat-card ph-stat-teal">
          <div className="ph-stat-top">
            <div className="ph-stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 17L8 7l4 6 4-4 4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span className="ph-stat-badge">{statsLoading ? "…" : `${percentChange >= 0 ? "↑" : "↓"} ${Math.abs(percentChange)}%`}</span>
          </div>
          {statsLoading ? (
            <><Skeleton height={28} width={100} style={{ marginBottom: 6 }} /><Skeleton height={12} width={180} style={{ marginBottom: 8 }} /><Skeleton height={10} width={140} /></>
          ) : statsError ? (
            <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>—</div>
              <div style={{ fontSize: 10, opacity: .8 }}>{statsError}</div>
            </div>
          ) : (
            <>
              <div className="ph-stat-val">{totalSelected.toLocaleString("en-IN")}</div>
              <div className="ph-stat-label">Paths Selected by Users</div>
              <div className="ph-stat-sub">{totalSelected.toLocaleString("en-IN")} total · {thisWeek} this week</div>
            </>
          )}
          <button className="ph-stat-btn" onClick={() => setView("paths")}>View All →</button>
        </div>

        {/* Card 2 — same structure as card 1 & 3, no extra rows */}
        <div className="ph-stat-card ph-stat-blue">
          <div className="ph-stat-top">
            <div className="ph-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="ph-stat-badge">{highCount > 0 ? `${highCount} urgent` : "All clear"}</span>
          </div>
          <div className="ph-stat-val">{pendingActions.length}</div>
          <div className="ph-stat-label">Pending Actions</div>
          <div className="ph-stat-sub">
            {pendingActions.length > 0
              ? sortedActions.slice(0, 2).map(a => a.label).join(" · ")
              : "No pending items"}
          </div>
          <button className="ph-stat-btn" onClick={() => setView("actions")}>View All →</button>
        </div>

        {/* Card 3 */}
        <div className="ph-stat-card ph-stat-violet">
          <div className="ph-stat-top">
            <div className="ph-stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 2a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span className="ph-stat-badge">{MARKETPLACE_ITEMS.length} items</span>
          </div>
          {statsLoading ? (
            <><Skeleton height={28} width={100} style={{ marginBottom: 6 }} /><Skeleton height={12} width={180} style={{ marginBottom: 8 }} /><Skeleton height={10} width={140} /></>
          ) : (
            <>
              <div className="ph-stat-val">{totalPurchases.toLocaleString("en-IN")}</div>
              <div className="ph-stat-label">Marketplace Purchases</div>
              <div className="ph-stat-sub">{totalPurchases - totalBundles} courses & sessions · {totalBundles} bundles{totalMarketplaceRevenue > 0 ? ` · ₹${totalMarketplaceRevenue.toLocaleString("en-IN")} revenue` : ""}</div>
            </>
          )}
          <button className="ph-stat-btn" onClick={() => setView("marketplace")}>View Market →</button>
        </div>

      </div>

      {/* ── EXCLUSIVE DASHBOARD BANNER ── */}
      <div className="ph-banner-card">
        <div className="ph-banner-left">
          <span className="ph-banner-badge">NEW</span>
          <h3>Exclusive Payments &amp; Transactions Dashboard</h3>
          <p>
            Track Razorpay checkout events, verify student transaction comments, request refunds,
            and set up payout methods under a secure dark-themed analytical panel.
          </p>
        </div>
        <div className="ph-banner-right">
          <button className="ph-banner-btn" onClick={() => window.open("/partner/exclusive-dashboard", "_blank")}>
            Access Payments Dashboard <SvgArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── MID ROW ── */}
      <div className="ph-mid-row">
        <div className="ph-card ph-activity-card">
          <div className="ph-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ph-card-title">Live Activity</span>
              {LIVE_ACTIVITY.length > 0 && (
                <span style={{ fontSize: 11, background: "rgba(13,148,136,0.12)", color: "#0d9488", padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                  {LIVE_ACTIVITY.length}
                </span>
              )}
            </div>
            <div className="ph-act-tabs">
              {["All", "Path", "Purchase"].map(t => (
                <button key={t} className={`ph-act-tab ${activityTab === t ? "active" : ""}`} onClick={() => { setActivityTab(t); setShowAllActivity(false); }}>{t}</button>
              ))}
            </div>
          </div>

          {statsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <Skeleton width={36} height={36} radius={10} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="50%" height={13} style={{ marginBottom: 6 }} />
                    <Skeleton width="75%" height={11} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <Skeleton width={40} height={10} />
                    <Skeleton width={55} height={18} radius={10} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedActivity.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}><SvgZap size={14} /></div>
              <div style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>No live activity yet</div>
              <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 300, margin: "0 auto" }}>
                {activityTab === "All"
                  ? "When students enroll in your paths or purchase marketplace services, activities will stream here live."
                  : `No ${activityTab.toLowerCase()} activities recorded yet.`}
              </div>
            </div>
          ) : (
            <div className="ph-activity-list">
              {displayedActivity.map(a => (
                <div key={a.id} className="ph-act-item">
                  <div className="ph-act-avatar" style={{ background: a.color || "#0d9488" }}>{a.initials || "U"}</div>
                  <div className="ph-act-info">
                    <div className="ph-act-name">{a.name}</div>
                    <div className="ph-act-action">{a.action}</div>
                  </div>
                  <div className="ph-act-right">
                    <div className="ph-act-time">{a.time}</div>
                    <span className="ph-act-chip" style={{ background: a.typeBg || "rgba(13,148,136,.18)", color: a.typeColor || "#0d9488" }}>
                      {a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "Activity"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!statsLoading && actFiltered.length > 4 && (
            <button className="ph-show-more-btn" onClick={() => setShowAllActivity(p => !p)}>
              {showAllActivity ? "Show less ↑" : `View all ${actFiltered.length} →`}
            </button>
          )}
        </div>

        <div className="ph-right-col">
          <div className="ph-card">
            <div className="ph-card-header"><span className="ph-card-title">Top Paths This Week</span></div>
            <div className="ph-top-paths-list">
              {statsLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
                    <Skeleton width={20} height={20} radius={5} />
                    <div style={{ flex: 1 }}><Skeleton height={12} width="70%" style={{ marginBottom: 4 }} /><Skeleton height={10} width="40%" /></div>
                    <Skeleton width={80} height={12} />
                  </div>
                ))
              ) : MY_PATHS.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No active paths yet.</div>
              ) : MY_PATHS.slice(0, 4).map((path, i) => (
                <div key={path._id} className="ph-top-path-row">
                  <span className="ph-path-rank">{i + 1}</span>
                  <div className="ph-path-info">
                    <div className="ph-path-name">{path.nameOfPath}</div>
                    <div className="ph-path-enrolled">{path.usersEnrolled} users</div>
                  </div>
                  <div className="ph-path-bar-wrap">
                    <div className="ph-path-bar"><div className="ph-path-bar-fill" style={{ width: `${path.completion}%` }} /></div>
                    <span className="ph-path-pct">{path.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ph-card">
            <div className="ph-card-header">
              <span className="ph-card-title">Weekly Retention</span>
              <span className="ph-peak-tag">
                {weeklyRetention.peakDay && weeklyRetention.peakRate > 0
                  ? `↑ Peak: ${weeklyRetention.peakDay}`
                  : "No activity yet"}
              </span>
            </div>
            <div className="ph-retention-bars">
              {weeklyRetention.days.map((day, di) => {
                const rate = weeklyRetention.rates?.[di] ?? 0;
                return (
                  <div key={di} className="ph-ret-col">
                    <div className="ph-ret-bar-wrap">
                      <div className="ph-ret-tooltip">{rate}%</div>
                      <div
                        className="ph-ret-bar-fill"
                        style={{
                          height: `${rate}%`,
                          minHeight: rate > 0 ? "4px" : "2px",
                          background:
                            rate >= 75
                              ? "#0d9488"
                              : rate >= 50
                              ? "#14b8a6"
                              : rate >= 25
                              ? "#5eead4"
                              : rate > 0
                              ? "#99f6e4"
                              : "#e2e8f0",
                          opacity: rate === 0 ? 0.6 : 1,
                        }}
                      />
                    </div>
                    <span className="ph-ret-day">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}