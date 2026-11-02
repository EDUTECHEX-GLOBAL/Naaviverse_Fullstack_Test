import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Subscriptions.scss";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ── Normalizers ────────────────────────────────────────────────── */
const normalizePlan = (planTier) => {
  if (!planTier) return "Standard";
  const clean = String(planTier).trim().toLowerCase().replace(/[\s_-]+/g, "");
  const map = {
    standard: "Standard",
    gold: "Standard",
    pro: "Pro",
    silver: "Pro",
    proplus: "Pro Plus",
    platinum: "Pro Plus",
  };
  return map[clean] || (planTier.charAt(0).toUpperCase() + planTier.slice(1));
};
const normalizeLayer = (tier) => {
  if (!tier) return "Micro";
  return tier.charAt(0).toUpperCase() + tier.slice(1).replace("_only", "");
};
const normalizeBilling = (billingMethod) => {
  if (!billingMethod) return "Monthly";
  const map = { monthly: "Monthly", annual: "Annual", lifetime: "Lifetime" };
  return map[billingMethod.toLowerCase()] || billingMethod;
};
const normalizeStatus = (status) => {
  if (!status) return "Active";
  return status.charAt(0).toUpperCase() + status.slice(1);
};
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
};
const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

/* ── Colors ─────────────────────────────────────────────────────── */
const STATUS_META = {
  Active:    { dot: "#22c55e", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  Expired:   { dot: "#f87171", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  Cancelled: { dot: "#94a3b8", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};
const BILLING_META = {
  Monthly:  { bg: "#fefce8", color: "#a16207" },
  Annual:   { bg: "#faf5ff", color: "#7c3aed" },
  Lifetime: { bg: "#f0fdf4", color: "#15803d" },
};
const PLAN_META = {
  Standard:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Pro:        { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Pro Plus": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  proplus:    { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  pro:        { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  standard:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};
const AVATAR_GRADIENTS = [
  ["#fbbf24","#d97706"],["#34d399","#059669"],
  ["#60a5fa","#2563eb"],["#f472b6","#db2777"],
  ["#a78bfa","#7c3aed"],["#fb923c","#ea580c"],
  ["#38bdf8","#0284c7"],["#4ade80","#16a34a"],
];
const getInitials = (name) => name.split("@")[0].slice(0, 2).toUpperCase();

/* ── Icons ───────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Stat Card ───────────────────────────────────────────────────── */
const StatCard = ({ label, value, accent, bg, iconPath }) => (
  <div className="subs-stat-card" style={{ background: bg }}>
    <div className="stat-icon-wrapper" style={{ background: accent }}>
      <svg viewBox="0 0 24 24" fill="none"
        stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {iconPath}
      </svg>
    </div>
    <div className="stat-info">
      <div className="stat-label" style={{ color: accent }}>{label}</div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
    </div>
  </div>
);
/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function Subscriptions() {
  const [search, setSearch]               = useState("");
  const [planFilter, setPlanFilter]       = useState("All");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/subscriptions/all?limit=100`);
        if (res.data?.success) setSubscriptions(res.data.subscriptions || []);
      } catch {
        setError("Failed to load subscriptions.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const normalized = subscriptions.map((s, i) => ({
    id:      s._id || i,
    name:    s.userEmail?.split("@")[0] || "Unknown",
    email:   s.userEmail || "—",
    plan:    normalizePlan(s.planTier),
    layer:   normalizeLayer(s.tier),
    billing: normalizeBilling(s.billingMethod),
    date:    formatDate(s.startDate || s.createdAt),
    time:    formatTime(s.startDate || s.createdAt),
    amount:  s.amount || 0,
    status:  normalizeStatus(s.status),
    _idx:    i,
  }));

  const filtered = normalized.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.plan.toLowerCase().includes(q);
    const matchPlan =
      planFilter === "All" ||
      s.plan.toLowerCase().replace(/[\s_-]+/g, "") ===
        planFilter.toLowerCase().replace(/[\s_-]+/g, "");
    const matchStatus =
      statusFilter === "All" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchPlan && matchStatus;
  });

  const activeCount  = normalized.filter(s => s.status === "Active").length;
  const expiredCount = normalized.filter(s => s.status === "Expired").length;
  const cancelCount  = normalized.filter(s => s.status === "Cancelled").length;

  const statusLabel = statusFilter === "All"
    ? `All (${normalized.length})`
    : `${statusFilter} (${normalized.filter(s => s.status === statusFilter).length})`;

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
      Loading subscriptions…
    </div>
  );
  if (error) return (
    <div style={{ padding: "60px", textAlign: "center", color: "#dc2626", fontSize: "14px" }}>
      {error}
    </div>
  );

  return (
    <div className="subs-container" onClick={() => setStatusDropOpen(false)}>

    

    

      {/* ── Filter bar ── */}
      <div className="subs-filter-section">

        {/* Row 1: Plan pills — single scrollable row */}
        <div className="subs-pills-row">
          {["All", "Standard", "Pro", "Pro Plus"].map((p) => {
            const active = planFilter === p;
            const meta   = PLAN_META[p] || {};
            return (
              <button
                key={p}
                className="subs-pill-btn"
                onClick={() => setPlanFilter(p)}
                style={{
                  background:   active ? (meta.bg     || "#e2e8f0") : "#fff",
                  color:        active ? (meta.color  || "#475569") : "#64748b",
                  borderColor:  active ? (meta.border || "#e2e8f0") : "#e2e8f0",
                }}
              >{p}</button>
            );
          })}
        </div>

        {/* Row 2: Status dropdown + Search */}
        <div className="subs-controls-row">

          {/* Status dropdown */}
          <div className="subs-status-dropdown" onClick={e => e.stopPropagation()}>
            <button
              className="subs-dropdown-btn"
              onClick={() => setStatusDropOpen(o => !o)}
            >
              {statusLabel} <IconChevron />
            </button>
            {statusDropOpen && (
              <div className="subs-dropdown-menu">
                {[
                  { label: `All (${normalized.length})`, value: "All" },
                  { label: `Active (${activeCount})`,    value: "Active" },
                  { label: `Expired (${expiredCount})`,  value: "Expired" },
                  { label: `Cancelled (${cancelCount})`, value: "Cancelled" },
                ].map((t) => (
                  <div key={t.value}
                    className={`dropdown-item ${statusFilter === t.value ? "active" : ""}`}
                    onClick={() => { setStatusFilter(t.value); setStatusDropOpen(false); }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search — takes remaining space */}
          <div className="subs-search-box">
            <IconSearch />
            <input
              type="text"
              placeholder="Search user email or plan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="subs-search-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                title="Clear search"
              >
                <IconClose />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table — horizontal scroll wrapper ── */}
      <div className="subs-table-wrap">
        <table className="subs-table">
          <thead>
            <tr>
              {["User", "Plan", "Layer", "Amount", "Billing", "Date", "Status"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#cbd5e1" }}>
                  No subscriptions found.
                </td>
              </tr>
            ) : filtered.map((s, i) => {
              const [g1, g2] = AVATAR_GRADIENTS[s._idx % AVATAR_GRADIENTS.length];
              const sm = STATUS_META[s.status]   || STATUS_META.Active;
              const bm = BILLING_META[s.billing] || BILLING_META.Monthly;
              const pm = PLAN_META[s.plan]       || PLAN_META.Standard;
              return (
                <tr key={s.id}>
                  {/* User */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: `linear-gradient(135deg, ${g1}, ${g2})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}>{getInitials(s.email)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "12px" }}>{s.name}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px" }}>{s.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td>
                    <span style={{
                      padding: "3px 9px", borderRadius: "20px",
                      fontSize: "10px", fontWeight: 600,
                      background: pm.bg, color: pm.color,
                      border: `1px solid ${pm.border}`,
                    }}>{s.plan}</span>
                  </td>

                  {/* Layer */}
                  <td>
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      padding: "3px 9px", borderRadius: "7px",
                      background: s.layer === "Nano" ? "#faf5ff" : "#eff6ff",
                      color:      s.layer === "Nano" ? "#7c3aed" : "#2563eb",
                      border:     s.layer === "Nano" ? "1px solid #e9d5ff" : "1px solid #bfdbfe",
                    }}>
                      <span style={{
                        display: "inline-block", width: "5px", height: "5px",
                        borderRadius: "50%", marginRight: "4px", verticalAlign: "middle",
                        background: s.layer === "Nano" ? "#a78bfa" : "#60a5fa",
                      }} />
                      {s.layer}
                    </span>
                  </td>

                  {/* Amount */}
                  <td style={{ fontWeight: 600, color: "#0f172a", fontSize: "12px" }}>
                    {fmt(s.amount)}
                  </td>

                  {/* Billing */}
                  <td>
                    <span style={{
                      padding: "3px 9px", borderRadius: "20px",
                      fontSize: "10px", fontWeight: 600,
                      background: bm.bg, color: bm.color,
                    }}>{s.billing}</span>
                  </td>

                  {/* Date */}
                  <td>
                    <div style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>{s.date}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px" }}>{s.time}</div>
                  </td>

                  {/* Status */}
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "3px 9px", borderRadius: "20px",
                      fontSize: "10px", fontWeight: 700,
                      background: sm.bg, color: sm.color,
                      border: `1px solid ${sm.border}`,
                    }}>
                      <span style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: sm.dot, flexShrink: 0,
                      }} />
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="subs-footer">
        Showing {filtered.length} of {normalized.length} subscriptions
      </div>
    </div>
  );
}