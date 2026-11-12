import React, { useState, useEffect, useRef, useCallback } from "react";
import "./userHome.scss";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { GetWalletBalance, GetWalletTxns } from "../../views/inner-pages/pages/services/wallet";
import pathIcon from "../../assets/images/assets/naavi-icon2.webp";
import stepIcon from "../../assets/images/assets/naavi-icon3.webp";
import { SvgShoppingBag, SvgCompass, SvgGlobe, SvgMap } from "../../utils/SvgIcons";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || parsed;
  } catch { return null; }
};

const mapTxnType = (t) => {
  const src = t.metadata?.source || "";
  const typ = t.metadata?.type || "";
  if (typ === "welcome_bonus") return "bonus";
  if (src === "marketplace") return "purchase";
  if (src === "mentor") return "mentor";
  if (t.type === "credit") return "step";
  return "purchase";
};

const parseDuration = (raw) => {
  try {
    const l = JSON.parse(raw);
    const parts = [];
    if (parseInt(l.years) > 0) parts.push(`${l.years}y`);
    if (parseInt(l.months) > 0) parts.push(`${l.months}m`);
    if (parseInt(l.days) > 0) parts.push(`${l.days}d`);
    return parts.length > 0 ? parts.join(" ") : null;
  } catch { return null; }
};

const Icon = ({ type, size = 16, color = "currentColor" }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "wallet": return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><circle cx="18" cy="15" r="1" fill={color} /></svg>;
    case "path": return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "market": return <svg {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>;
    case "mentor": return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    case "bell": return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "arrow-r": return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case "arrow-l": return <svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case "check": return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "activity": return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    case "explore": return <svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "credit": return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
    case "steps": return <svg {...p}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
    case "lock": return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
    case "map": return <svg {...p}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>;
  }
};

const Ring = ({ pct, size = 52, stroke = 4, color = "#60a5fa", bg = "rgba(96,165,250,0.18)" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
};

// ── Static data ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "wallet", label: "My Wallet", icon: "wallet", path: "/dashboard/users/wallet" },
  { key: "purchases", label: "Purchases", icon: "market", path: "/dashboard/users/purchases" },
  { key: "subscriptions", label: "Subscriptions", icon: "credit", path: "/dashboard/users/transactions" },
  { key: "mypath", label: "My Path", icon: "steps", path: "/dashboard/users/my-journey" },
  { key: "paths", label: "Explore Paths", icon: "map", path: "/dashboard/users/paths" },
];

// ── Notif Config (Exact match to Admin Notifications system) ───────────────────
const NOTIF_CONFIG = {
  path: {
    bg: "#ede9fe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "Paths",
    tagBg: "#ede9fe",
    tagColor: "#7c3aed",
  },
  purchase: {
    bg: "#dcfce7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "Purchases",
    tagBg: "#dcfce7",
    tagColor: "#15803d",
  },
  approval: {
    bg: "#fef3c7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "Approvals",
    tagBg: "#fef3c7",
    tagColor: "#b45309",
  },
  wallet: {
    bg: "#fce7f3",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "Wallet",
    tagBg: "#fce7f3",
    tagColor: "#be185d",
  },
  subscription: {
    bg: "#fef3c7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "Subscriptions",
    tagBg: "#fef3c7",
    tagColor: "#b45309",
  },
  system: {
    bg: "#f1f5f9",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    tag: "System",
    tagBg: "#f1f5f9",
    tagColor: "#475569",
  },
};

// ═══════════════════════════════════════════════════════════════════
export default function UserHome({ initialView = "home" }) {
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const rawName = user?.name || user?.fullName || localStorage.getItem("userName") || "";
  const firstName = rawName.split(" ")[0] || (user?.email || "there").split("@")[0] || "Aparna";

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const matched = TABS.find((t) => t.path === window.location.pathname);
    return matched ? matched.key : "wallet";
  });

  useEffect(() => {
    const matched = TABS.find((t) => t.path === location.pathname);
    if (matched) {
      setActiveTab(matched.key);
    } else {
      setActiveTab((prev) => prev || "wallet");
    }
  }, [location.pathname]);

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes("notifications") || params.get("view") === "notifications" || initialView === "notifications") {
      return "notifications";
    }
    return "home";
  });
  const [notifFilter, setNotifFilter] = useState("all");
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryView = params.get("view");
    if (location.pathname.includes("notifications") || queryView === "notifications" || (initialView && initialView === "notifications")) {
      setView("notifications");
    } else {
      setView("home");
    }
  }, [location.pathname, location.search, initialView]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [myPath, setMyPath] = useState(null);
  const [explorePaths, setExplorePaths] = useState([]);
  const [pathLoading, setPathLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const notifRef = useRef(null);
  const detailCardRef = useRef(null);
  const isInitialMount = useRef(true);
  const unread = notifications.filter(n => !n.read).length;
  const creditPct = credits
    ? Math.round((credits.available / (credits.total || 50)) * 100)
    : 0;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  // ── Close notif panel on outside click ──────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Fetch dynamic user notifications from live backend ─────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.email) return;
    try {
      setNotifLoading(true);
      const res = await axios.get(`${BASE_URL}/api/user-dashboard/notifications`, {
        params: { email: user.email },
      });
      if (res.data?.status && Array.isArray(res.data.notifications)) {
        let readIds = [];
        try {
          readIds = JSON.parse(localStorage.getItem(`read_user_notifs_${user.email}`) || "[]");
        } catch (_) {}
        const readSet = new Set(readIds);
        const mapped = res.data.notifications.map((n) => ({
          ...n,
          read: readSet.has(n.id),
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("User notifications fetch error:", err);
    } finally {
      setNotifLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // [check] Correct placement - This useEffect scrolls when activeTab changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (detailCardRef.current) {
      const scrollParent = detailCardRef.current.closest('.uh-root') || detailCardRef.current.parentElement;
      if (scrollParent && typeof scrollParent.scrollTo === 'function') {
        scrollParent.scrollTo({ top: detailCardRef.current.offsetTop - 20, behavior: "smooth" });
      }
    }
  }, [activeTab]);

  // [check] Listen for CustomEvent fired by CurrentStep on step completion
  useEffect(() => {
    const handleStepCompleted = () => setRefreshKey(k => k + 1);
    window.addEventListener("naavi:step-completed", handleStepCompleted);
    return () => window.removeEventListener("naavi:step-completed", handleStepCompleted);
  }, []);

  // ── Fetch wallet data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;

    const fetchWallet = async () => {
      try {
        setWalletLoading(true);

        const [balRes, txnRes] = await Promise.all([
          GetWalletBalance(user.email),
          GetWalletTxns(user.email),
        ]);

        const bal = balRes.data;
        const txns = txnRes.data.txns || [];

        const bonusTxn = txns.find(t => t.metadata?.type === "welcome_bonus");
        let expiresAt = null;
        if (bonusTxn) {
          if (bonusTxn.expiresAt) {
            expiresAt = new Date(bonusTxn.expiresAt);
          } else if (bonusTxn.timestamp) {
            expiresAt = new Date(bonusTxn.timestamp);
            expiresAt.setDate(expiresAt.getDate() + 14);
          }
        }

        const now = new Date();
        const isExpired = expiresAt ? expiresAt < now : false;
        const msLeft = expiresAt ? Math.max(0, expiresAt - now) : 0;
        const daysLeft = msLeft ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;

        let expiryLabel = "—";
        if (expiresAt) {
          const dateStr = expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          if (isExpired) {
            const daysAgo = Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24));
            expiryLabel = daysAgo === 0 ? "Expired today" : daysAgo === 1 ? "Expired yesterday" : `Expired ${daysAgo}d ago`;
          } else {
            expiryLabel = daysLeft <= 1 ? "Expires today" : daysLeft <= 7 ? `Expires in ${daysLeft} days` : `Expires ${dateStr}`;
          }
        }

        setCredits({
          available: bal.balance,
          used: txns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0),
          total: txns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0),
          expiry: expiryLabel,
          expiresAt,
          daysLeft: isExpired ? 0 : daysLeft,
          isExpired,
          plan: "Premium",
        });

        const mapped = txns.map(t => ({
          id: t._id,
          action: t.metadata?.description || (t.type === "credit" ? "Credits added" : "Credits used"),
          time: new Date(t.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          type: mapTxnType(t),
          delta: t.type === "credit" ? +t.amount : -t.amount,
        }));

        setActivity(mapped);
      } catch (err) {
        console.error("Wallet fetch failed:", err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [user?.email]);

  // ── Fetch paid marketplace purchases & subscriptions ─────────────────────────
  useEffect(() => {
    if (!user?.email) return;

    const fetchTransactionsData = async () => {
      try {
        setPurchasesLoading(true);
        setSubsLoading(true);
        const [txRes, userPathsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/api/payment/transactions`, {
            params: { email: user.email },
          }),
          axios.get(`${BASE_URL}/api/userpaths`, {
            params: { email: user.email, status: "active" },
          }),
        ]);

        const txData = txRes.status === "fulfilled" ? txRes.value.data : null;
        const userPathsData = userPathsRes.status === "fulfilled" ? userPathsRes.value.data?.data || [] : [];

        if (txData?.success) {
          const allTxns = (txData.data || []).filter(
            (t) => t.status?.toLowerCase() !== "pending"
          );

          const isPlatformSubscription = (t) => {
            if (!t) return false;
            const prodId = (t.productId || "").toLowerCase();
            const prodName = (t.productName || "").trim();
            const nameLower = prodName.toLowerCase();

            if (
              prodId === "naavi-marketplace" ||
              prodId.startsWith("macro-") ||
              prodId.startsWith("micro-") ||
              prodId.startsWith("nano-") ||
              nameLower.startsWith("marketplace") ||
              t.partnerId ||
              t.partnerEmail
            ) {
              return false;
            }

            if (prodId === "naavi-platform" || t.planTier) {
              return true;
            }

            return (
              nameLower.includes("nano plan") ||
              nameLower.includes("micro plan") ||
              nameLower.includes("plus plan") ||
              nameLower.includes("pro plan") ||
              nameLower.includes("naavi pro") ||
              nameLower.includes("standard plan") ||
              nameLower.includes("platform subscription")
            );
          };

          // 1. Subscriptions: Only true platform plan subscriptions (Nano, Micro, Pro, Plus, Naavi Platform)
          const subTxns = allTxns
            .filter((t) => t.status?.toLowerCase() === "paid" && isPlatformSubscription(t))
            .map((t) => {
              const cleanName = (t.productName || "Naavi Plan Subscription")
                .replace(/^Marketplace \(Free\) —\s*/i, "")
                .replace(/^Marketplace —\s*/i, "")
                .replace(/^Subscription —\s*/i, "");
              return {
                id: t._id,
                name: cleanName,
                service: "Plan Subscription",
                billing: "Monthly",
                amount: `₹${(t.amount || 0).toLocaleString("en-IN")}`,
                rawAmount: t.amount || 0,
                date: new Date(t.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                status: "Paid",
                partner: "Naavi",
              };
            });

          // 2. Marketplace Purchases & Items
          const marketTxns = allTxns
            .filter((t) => !isPlatformSubscription(t))
            .map((t) => {
              const rawName = t.productName || "Marketplace Item";
              const cleanName = rawName
                .replace(/^Marketplace \(Free\) —\s*/i, "")
                .replace(/^Marketplace —\s*/i, "")
                .replace(/^Subscription —\s*/i, "");

              const isFailed = t.status?.toLowerCase() === "failed";
              const isFree =
                !isFailed &&
                (Number(t.amount || 0) === 0 || rawName.toLowerCase().includes("(free)"));

              const typeLabel = t.tier
                ? t.tier.charAt(0).toUpperCase() + t.tier.slice(1)
                : isFree
                ? "Macro"
                : "Marketplace";

              return {
                id: t._id,
                name: cleanName,
                type: typeLabel,
                plan: isFree
                  ? "Macro View"
                  : "Marketplace",
                cost: isFree ? "₹0" : `₹${(t.amount || 0).toLocaleString("en-IN")}`,
                amount: t.amount || 0,
                isFree,
                isFailed,
                date: new Date(t.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                rawDate: new Date(t.createdAt || Date.now()).getTime(),
                status: isFailed ? "Failed" : isFree ? "Free" : "Paid",
                icon: isFree ? <SvgCompass size={16} /> : <SvgShoppingBag size={16} />,
              };
            });

          // 3. Macro Pathway Enrollments (Enrolled Paths)
          const macroPathEnrollments = (userPathsData || []).map((up) => {
            const pathName =
              up.PathDetails?.[0]?.nameOfPath ||
              up.PathDetails?.[0]?.name ||
              up.pathDetails?.nameOfPath ||
              up.pathName ||
              "Pathway";

            return {
              id: `macro-path-${up._id || up.pathId}`,
              name: `${pathName} (Macro View)`,
              type: "Macro",
              plan: "Macro View",
              cost: "₹0",
              amount: 0,
              isFree: true,
              isFailed: false,
              date: new Date(up.createdAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              rawDate: new Date(up.createdAt || Date.now()).getTime(),
              status: "Free",
              icon: <SvgCompass size={16} />,
            };
          });

          // Combine both marketplace items and macro pathway enrollments, sorted by newest first
          const allPurchases = [...marketTxns, ...macroPathEnrollments].sort(
            (a, b) => b.rawDate - a.rawDate
          );

          setSubscriptions(subTxns);
          setPurchases(allPurchases);
        }
      } catch (err) {
        console.error("[error] Transactions fetch error:", err);
      } finally {
        setPurchasesLoading(false);
        setSubsLoading(false);
      }
    };

    fetchTransactionsData();
  }, [user?.email]);

  // ── Fetch path data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;

    const fetchMyPath = async () => {
      try {
        setPathLoading(true);

        const userPathRes = await axios.get(`${BASE_URL}/api/userpaths`, {
          params: { email: user.email, status: "active" }
        });

        const userPaths = userPathRes.data?.data || [];

        let selectedPathId = localStorage.getItem("selectedPathId");
        if (selectedPathId) {
          const belongsToUser = userPaths.some(
            (p) =>
              p.pathId?.toString() === selectedPathId ||
              p.PathDetails?.[0]?._id?.toString() === selectedPathId ||
              p._id?.toString() === selectedPathId
          );
          if (!belongsToUser) {
            const pathOwner = localStorage.getItem("selectedPathOwner");
            if (pathOwner && user.email && pathOwner.toLowerCase() !== user.email.toLowerCase()) {
              [
                "selectedPathId", "selectedPathOwner", "selectedStepId", "selectedStepNumber",
                "selectedPathName", "selectedPathSteps", "selectedPathCountry",
                "selectedPathUniversity", "selectedPathPathway", "selectedPathCountryForId"
              ].forEach((k) => localStorage.removeItem(k));
              selectedPathId = null;
            }
          }
        }

        if (!selectedPathId) {
          try {
            const selRes = await axios.get(`${BASE_URL}/api/userpaths/selected`, {
              params: { email: user.email },
            });
            if (selRes.data?.status && selRes.data?.pathId) {
              selectedPathId = selRes.data.pathId;
              localStorage.setItem("selectedPathId", selectedPathId);
              localStorage.setItem("selectedPathOwner", user.email);
            }
          } catch (_) { }
        }

        if (!userPaths.length) {
          [
            "selectedPathId", "selectedPathOwner", "selectedStepId", "selectedStepNumber",
            "selectedPathName", "selectedPathSteps", "selectedPathCountry",
            "selectedPathUniversity", "selectedPathPathway", "selectedPathCountryForId"
          ].forEach((k) => localStorage.removeItem(k));
          setMyPath(null);
          setPathLoading(false);
          return;
        }

        const enrolledPathIds = new Set(userPaths.map(p => p.pathId?.toString()));

        let activePath = selectedPathId
          ? userPaths.find(p =>
            p.pathId?.toString() === selectedPathId ||
            p.PathDetails?.[0]?._id?.toString() === selectedPathId
          )
          : null;

        if (!activePath) {
          activePath = [...userPaths].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
        }

        const pathId = activePath?.pathId?.toString() ||
          activePath?.PathDetails?.[0]?._id?.toString();

        if (!pathId) {
          setMyPath(null);
          setPathLoading(false);
          return;
        }

        const freshPathRes = await axios.get(`${BASE_URL}/api/userpaths`, {
          params: { email: user.email, status: "active", _t: Date.now() }
        });
        const freshPaths = freshPathRes.data?.data || [];
        const rawDoc = freshPaths.find(p => p.pathId?.toString() === pathId);

        const completedStepIds = (rawDoc?.completedSteps || []).map(id => id.toString());
        const currentStep = rawDoc?.currentStep?.toString() || null;

        const stepsRes = await axios.get(`${BASE_URL}/api/userpaths/steps`, {
          params: { pathId }
        });

        const pathData = stepsRes.data?.data;

        const steps = (pathData?.steps || [])
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
          .map(s => ({
            id: s._id,
            title: s.macro_name || s.name || "Step",
            desc: s.macro_description || s.description || "",
            duration: s.macro_length ? parseDuration(s.macro_length) : null,
            status: completedStepIds.includes(s._id.toString())
              ? "done"
              : currentStep === s._id.toString()
                ? "active"
                : "locked",
          }));

        const doneCount = steps.filter(s => s.status === "done").length;
        const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

        const pName = pathData?.name || pathData?.nameOfPath || "";
        localStorage.setItem("selectedPathName", pName);
        window.dispatchEvent(new Event("naavi:path-selected"));

        setMyPath({
          name: pName || "—",
          goal: pathData?.description || "",
          progress,
          steps,
          doneCount,
          totalSteps: steps.length,
          enrolledOn: activePath?.createdAt
            ? new Date(activePath.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })
            : "—",
          studentInfo: null,
        });

        try {
          const profileRes = await axios.get(`${BASE_URL}/api/users/get/${user.email}`);
          const pd = profileRes.data?.data;
          if (pd) {
            setMyPath(prev => ({
              ...prev,
              studentInfo: {
                grade: pd.grade || "",
                curriculum: pd.curriculum || "",
                stream: pd.stream || "",
                school: pd.school || "",
              }
            }));
          }
        } catch (_) { }

        try {
          const pathsRes = await axios.get(`${BASE_URL}/api/paths/active`);
          const allPaths = pathsRes.data?.data || [];
          setExplorePaths(allPaths.map(p => ({
            id: p._id,
            icon: p.country ? p.country.slice(0, 2).toUpperCase() : <SvgGlobe size={16} />,
            name: p.nameOfPath || p.name,
            desc: p.description || "",
            steps: p.total_steps || p.the_ids?.length || 0,
            match: Math.floor(Math.random() * 20) + 75,
            enrolled: enrolledPathIds.has(p._id.toString()),
          })));
        } catch (e) {
          console.error("Explore paths fetch failed", e);
        }

      } catch (err) {
        console.error("MyPath fetch failed:", err);
        setMyPath(null);
      } finally {
        setPathLoading(false);
      }
    };

    fetchMyPath();
  }, [user?.email, refreshKey]);

  // ── Notification Helpers ───────────────────────────────────────────────────
  const markOneRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        const readIds = updated.filter((n) => n.read).map((n) => n.id);
        localStorage.setItem(`read_user_notifs_${user?.email || "guest"}`, JSON.stringify(readIds));
      } catch (_) {}
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        const readIds = updated.map((n) => n.id);
        localStorage.setItem(`read_user_notifs_${user?.email || "guest"}`, JSON.stringify(readIds));
      } catch (_) {}
      return updated;
    });
  };

  const handleNotifView = (n) => {
    markOneRead(n.id);
    setShowNotif(false);

    if (n.targetUrl) {
      setView("home");
      navigate(n.targetUrl);
      return;
    }

    if (n.targetTab === "mypath" || n.type === "path") {
      if (n.targetTab === "paths" || (n.desc && n.desc.toLowerCase().includes("explore"))) {
        navigate("/dashboard/users/paths");
      } else if (n.targetTab === "current-step" || (n.desc && n.desc.toLowerCase().includes("unlocked"))) {
        navigate("/dashboard/users/current-step");
      } else {
        navigate("/dashboard/users/my-journey");
      }
    } else if (n.targetTab === "purchases" || n.type === "purchase") {
      navigate("/dashboard/users/purchases");
    } else if (n.targetTab === "subscriptions" || n.type === "subscription") {
      navigate("/dashboard/users/transactions");
    } else if (n.targetTab === "wallet" || n.type === "wallet") {
      navigate("/dashboard/users/wallet");
    } else if (n.targetTab === "marketplace") {
      navigate("/dashboard/users/Marketplace");
    } else {
      setView("home");
    }
  };

  // ── Panels (dashboard = preview only, View All always navigates out) ────────
  const WalletPanel = () => {
    const bonusTxn = activity.find(a => a.type === "bonus");
    const totalCredits = activity.filter(a => a.delta > 0).reduce((s, a) => s + a.delta, 0);
    const totalDebits = activity.filter(a => a.delta < 0).reduce((s, a) => s + Math.abs(a.delta), 0);
    const stepCredits = activity.filter(a => a.type === "step" && a.delta > 0);

    const maxStepsToShow = bonusTxn ? 2 : 3;
    const displayedSteps = stepCredits.slice(0, maxStepsToShow);
    const hasMore = stepCredits.length > maxStepsToShow;

    return (
      <div className="uh-panel">
        {walletLoading ? (
          <div className="uh-loading">Loading wallet…</div>
        ) : (
          <>
            <div className="uh-wallet-summary">
              <div className="uh-ws-card">
                <span className="uh-ws-label">Available</span>
                <span className="uh-ws-num blue">{credits?.available ?? "—"}</span>
                <span className="uh-ws-sub">credits</span>
              </div>
              <div className="uh-ws-card">
                <span className="uh-ws-label">Used</span>
                <span className="uh-ws-num slate">{totalDebits}</span>
                <span className="uh-ws-sub">credits</span>
              </div>
              <div className="uh-ws-card">
                <span className="uh-ws-label">Total Earned</span>
                <span className="uh-ws-num slate">{totalCredits}</span>
                <span className="uh-ws-sub">credits</span>
              </div>
              <div className={`uh-ws-card warn ${credits?.isExpired ? "expired" : ""}`}>
                <span className="uh-ws-label">Expires</span>
                <span className={`uh-ws-num ${credits?.isExpired ? "red" : "amber"}`}>
                  {credits?.isExpired ? "Expired" : credits?.daysLeft ? `${credits.daysLeft}d` : "—"}
                </span>
                <span className="uh-ws-sub">{credits?.expiry ?? "—"}</span>
              </div>
            </div>

            <div className="uh-wallet-bar-wrap" style={{ marginBottom: 18 }}>
              <div className="uh-wallet-bar-track">
                <div className="uh-wallet-bar-fill" style={{ width: `${creditPct}%` }} />
              </div>
              <span className="uh-wallet-bar-pct">{creditPct}% remaining · {credits?.plan ?? ""} Plan</span>
            </div>

            <div className="uh-panel-header">
              <div className="uh-section-title">Credit Breakdown</div>
              {hasMore && (
                <button className="uh-section-view-all" onClick={() => navigate("/dashboard/users/wallet")}>
                  View All →
                </button>
              )}
            </div>
            <div className="uh-wallet-analytics">
              {bonusTxn && (
                <div className="uh-analytics-card uh-analytics-bonus">
                  <div className="uh-analytics-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="uh-analytics-info">
                    <span className="uh-analytics-title">Welcome Bonus</span>
                    <span className="uh-analytics-sub">50 credits · Given on signup</span>
                    <span className="uh-analytics-sub">{bonusTxn.time}</span>
                  </div>
                  <div className="uh-analytics-right">
                    {(credits?.daysLeft ?? 0) <= 0
                      ? <span className="uh-analytics-tag expired">Expired</span>
                      : <span className="uh-analytics-tag active">{credits?.daysLeft}d left</span>
                    }
                    <span className="uh-analytics-cr">+50</span>
                  </div>
                </div>
              )}

              {displayedSteps.map(a => (
                <div key={a.id} className="uh-analytics-card uh-analytics-sub">
                  <div className="uh-analytics-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <circle cx="18" cy="15" r="1" fill="#3b82f6" />
                    </svg>
                  </div>
                  <div className="uh-analytics-info">
                    <span className="uh-analytics-title">{a.action}</span>
                    <span className="uh-analytics-sub">{a.time}</span>
                    <span className="uh-analytics-sub" style={{ color: "#22c55e", fontWeight: 600 }}>Never expires</span>
                  </div>
                  <div className="uh-analytics-right">
                    <span className="uh-analytics-tag permanent">Permanent</span>
                    <span className="uh-analytics-cr">+{a.delta}</span>
                  </div>
                </div>
              ))}

              <div className="uh-usage-summary">
                <div className="uh-usage-row">
                  <span>Credits Earned</span>
                  <div className="uh-usage-bar-wrap"><div className="uh-usage-bar green" style={{ width: "100%" }} /></div>
                  <span className="uh-usage-val green">+{totalCredits}</span>
                </div>
                <div className="uh-usage-row">
                  <span>Credits Spent</span>
                  <div className="uh-usage-bar-wrap">
                    <div className="uh-usage-bar red" style={{ width: `${totalCredits ? (totalDebits / totalCredits) * 100 : 0}%` }} />
                  </div>
                  <span className="uh-usage-val red">-{totalDebits}</span>
                </div>
                <div className="uh-usage-row">
                  <span>Remaining</span>
                  <div className="uh-usage-bar-wrap"><div className="uh-usage-bar blue" style={{ width: `${creditPct}%` }} /></div>
                  <span className="uh-usage-val blue">{credits?.available}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const PurchasesPanel = () => {
    const displayedPurchases = purchases.slice(0, 3);
    const hasMore = purchases.length > 3;

    return (
      <div className="uh-panel">
        <div className="uh-panel-header">
          <div className="uh-section-title">Recent Purchases</div>
          {hasMore && (
            <button className="uh-section-view-all" onClick={() => navigate("/dashboard/users/purchases")}>
              View All →
            </button>
          )}
        </div>
        {purchasesLoading ? (
          <div className="uh-loading">Loading purchases…</div>
        ) : purchases.length === 0 ? (
          <div className="uh-no-purchases" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}><SvgShoppingBag size={14} />️</div>
            <strong>No purchases found</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Paid marketplace items will show up here once purchased.</p>
          </div>
        ) : (
          <>
            <div className="uh-purchases-list">
              {displayedPurchases.map(m => (
                <div key={m.id} className="uh-purchase-row">
                  <div className="uh-purchase-emoji">{m.icon}</div>
                  <div className="uh-purchase-info">
                    <span className="uh-purchase-name">{m.name}</span>
                    <span className="uh-purchase-meta">{m.type} · {m.isFailed ? "Failed on " : m.isFree ? "Enrolled " : "Purchased "} {m.date}</span>
                  </div>
                  <div className="uh-purchase-right">
                    <span className={`uh-plan-tag p-${(m.plan || "").toLowerCase().replace(/\s+/g, "-")}`}>{m.plan}</span>
                    <span className="uh-purchase-cr" style={{ color: m.isFailed ? "#dc2626" : m.isFree ? "#4f46e5" : "#0d9488", fontWeight: "bold" }}>{m.cost}</span>
                  </div>
                  <span className={`uh-status-dot ${m.isFailed ? "s-failed" : m.isFree ? "s-free" : "s-active"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="uh-purchases-total">
              <span>Total spent</span>
              <strong>₹{purchases.filter(p => p.status === "Paid").reduce((s, p) => s + (p.amount || 0), 0).toLocaleString("en-IN")}</strong>
            </div>
          </>
        )}
      </div>
    );
  };

  const ExplorePanel = () => {
    const displayedPaths = explorePaths.slice(0, 3);
    const hasMore = explorePaths.length > 3;

    return (
      <div className="uh-panel">
        <div className="uh-panel-header">
          <div className="uh-section-title">Paths You've Explored</div>
          {hasMore && (
            <button className="uh-section-view-all" onClick={() => navigate("/dashboard/users/paths")}>
              View All →
            </button>
          )}
        </div>
        {explorePaths.length === 0 ? (
          <div className="uh-loading">Loading paths…</div>
        ) : (
          <div className="uh-explore-list">
            {displayedPaths.map(p => (
              <div key={p.id} className={`uh-explore-row ${p.enrolled ? "enrolled" : ""}`}>
                <div className="uh-explore-icon">
                  <img src={pathIcon} alt="path icon" className="uh-path-icon" />
                </div>
                <div className="uh-explore-info">
                  <span className="uh-explore-name">{p.name}</span>
                  <span className="uh-explore-desc">{p.desc}</span>
                  <span className="uh-explore-steps">{p.steps} steps</span>
                </div>
                <div className="uh-explore-right">
                  <div className="uh-match-ring">
                    <Ring
                      pct={p.match}
                      size={40}
                      stroke={3}
                      color={p.match >= 85 ? "#22c55e" : p.match >= 75 ? "#3b82f6" : "#94a3b8"}
                      bg="rgba(148,163,184,.15)"
                    />
                    <span className="uh-match-pct">{p.match}%</span>
                  </div>
                  {p.enrolled
                    ? <span className="uh-enr-tag">Enrolled</span>
                    : <button className="uh-explore-btn" onClick={() => navigate("/dashboard/users/paths")}>Explore</button>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MyPathPanel = () => {
    if (pathLoading) return <div className="uh-loading">Loading path…</div>;
    if (!myPath) return (
      <div className="uh-panel">
        <div className="uh-no-path">
          <div className="uh-no-path-icon"><SvgMap size={36} color="#64748b" /></div>
          <div className="uh-no-path-title">No Path Selected Yet</div>
          <p className="uh-no-path-sub">Choose a learning path to start your Naavi journey.</p>
          <button className="uh-no-path-btn" onClick={() => navigate("/dashboard/users/paths")}>
            Go to Paths →
          </button>
        </div>
      </div>
    );

    const displayedSteps = myPath.steps.slice(0, 3);
    const hasMore = myPath.steps.length > 3;

    return (
      <div className="uh-panel">
        <div className="uh-path-header-compact">
          <div className="uh-path-title-section">
            <div className="uh-path-name-row">
              <img src={pathIcon} alt="path icon" className="uh-path-icon" />
              <h3 className="uh-path-name">{myPath.name}</h3>
            </div>
            <p className="uh-path-goal">{myPath.goal}</p>
            {myPath.studentInfo && (
              <div className="uh-path-student-mini">
                <span>Studying: </span>
                {myPath.studentInfo.grade && <span>{myPath.studentInfo.grade}{myPath.studentInfo.curriculum ? ` · ${myPath.studentInfo.curriculum}` : ""}</span>}
                {myPath.studentInfo.stream && <span> · {myPath.studentInfo.stream}</span>}
                {myPath.studentInfo.school && <span> · {myPath.studentInfo.school}</span>}
              </div>
            )}
          </div>
          <div className="uh-path-stats-row">
            <div className="uh-path-stat-chip">
              <span className="uh-stat-val">{myPath.doneCount}/{myPath.totalSteps}</span>
              <span className="uh-stat-lbl">Steps</span>
            </div>
            <div className="uh-path-stat-chip">
              <span className="uh-stat-val">{myPath.progress}%</span>
              <span className="uh-stat-lbl">Progress</span>
            </div>
          </div>
        </div>

        <div className="uh-path-bar-wrap">
          <div className="uh-path-bar-track">
            <div className="uh-path-bar-fill" style={{ width: `${myPath.progress}%` }} />
          </div>
          <span>{myPath.progress}% complete</span>
        </div>

        <div className="uh-panel-header" style={{ marginTop: 15 }}>
          <div className="uh-section-title">Recent Steps</div>
          {hasMore && (
            <button className="uh-section-view-all" onClick={() => navigate("/dashboard/users/my-journey")}>
              View All →
            </button>
          )}
        </div>

        <div className="uh-steps-list">
          {displayedSteps.map((s, i) => (
            <div key={s.id} className={`uh-step-row s-${s.status}`}>
              <div className="uh-step-num">
                {s.status === "locked"
                  ? <Icon type="lock" size={11} color="#94a3b8" />
                  : <img src={stepIcon} alt="step" style={{ width: "14px", height: "14px", objectFit: "contain", opacity: s.status === "done" ? 1 : 0.7 }} />
                }
              </div>
              <div className="uh-step-info">
                <span className="uh-step-title">{s.title}</span>
                <span className="uh-step-desc">{s.desc}</span>
              </div>
              {s.duration && <span className="uh-step-dur">{s.duration}</span>}
              <span className={`uh-step-badge sb-${s.status}`}>
                {s.status === "done" ? "Done" : s.status === "active" ? "In Progress" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SubscriptionsPanel = () => {
    const displaySubs = subscriptions;

    return (
      <div className="uh-panel">
        <div className="uh-panel-header">
          <div className="uh-section-title">Your Plan Subscriptions</div>
          <button className="uh-section-view-all" onClick={() => navigate("/dashboard/users/transactions")}>
            View All →
          </button>
        </div>

        {subsLoading ? (
          <div className="uh-loading">Loading subscriptions…</div>
        ) : displaySubs.length === 0 ? (
          <div className="uh-empty" style={{ padding: "20px 0", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            No active plan subscriptions found.
          </div>
        ) : (
          <>
            <div className="uh-purchases-list uh-subs-list">
              {displaySubs.map(sub => (
                <div key={sub.id} className="uh-sub-row">
                  <div className="uh-sub-top">
                    <span className="uh-sub-partner-badge">
                      • {sub.partner || "Naavi"}
                    </span>
                    <div className="uh-sub-info">
                      <div className="uh-sub-name">
                        {sub.name}
                      </div>
                      <div className="uh-sub-meta">
                        {sub.service || "Plan"} · {sub.date}
                      </div>
                    </div>
                  </div>

                  <div className="uh-sub-bottom">
                    <div className="uh-sub-bottom-left">
                      <span className="uh-sub-amount">{sub.amount}</span>
                      <span className="uh-sub-billing-badge">
                        {sub.billing || "Monthly"}
                      </span>
                    </div>
                    <span className="uh-sub-status-badge">
                      • {sub.status || "Paid"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="uh-ch-btn"
                style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "500" }}
                onClick={() => navigate("/dashboard/users/transactions")}
              >
                View All Transactions →
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const panels = {
    wallet: <WalletPanel />,
    purchases: <PurchasesPanel />,
    subscriptions: <SubscriptionsPanel />,
    mypath: <MyPathPanel />,
    paths: <ExplorePanel />,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SEPARATE PAGE: NOTIFICATIONS FULL VIEW (MATCHING ADMIN FLOW)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "notifications") {
    const FILTERS = [
      { key: "all", label: "All", dot: "#7c3aed", countBg: "#ede9fe", countColor: "#7c3aed" },
      { key: "path", label: "Paths", dot: "#8b5cf6", countBg: "#ede9fe", countColor: "#7c3aed" },
      { key: "purchase", label: "Purchases", dot: "#22c55e", countBg: "#dcfce7", countColor: "#15803d" },
      { key: "approval", label: "Approvals", dot: "#f59e0b", countBg: "#fef3c7", countColor: "#b45309" },
      { key: "wallet", label: "Wallet", dot: "#ec4899", countBg: "#fce7f3", countColor: "#be185d" },
      { key: "system", label: "System", dot: "#94a3b8", countBg: "#f1f5f9", countColor: "#475569" },
    ];

    const filterNotification = (n, filter) => {
      if (filter === "all") return true;
      if (filter === "path") return n.type === "path" || n.targetTab === "mypath" || n.targetTab === "paths" || n.targetTab === "current-step";
      if (filter === "purchase") return n.type === "purchase" || n.targetTab === "purchases" || n.targetTab === "marketplace";
      if (filter === "approval") return n.type === "approval" || (n.id && n.id.startsWith("ast-")) || (n.desc && n.desc.toLowerCase().includes("approv"));
      if (filter === "wallet") return n.type === "wallet" || n.type === "subscription" || n.targetTab === "wallet" || n.targetTab === "subscriptions";
      if (filter === "system") return n.type === "system" || n.targetTab === "home";
      return n.type === filter;
    };

    const filteredNotifs = notifications.filter(n => filterNotification(n, notifFilter));

    return (
      <div className="uh-root uh-notif-page-root">
        <div className="approvals-card uh-notif-page-card">
          <div className="uh-notif-page-header">
            <div className="uh-notif-page-header-left">
              <h2 className="uh-notif-page-title">
                Notifications
              </h2>
            </div>
            <div className="uh-notif-page-actions">
              <button className="uh-notif-btn-read" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
          </div>
          <div className="uh-notif-page-body">
            <div className="uh-notif-sidebar">
              <div className="uh-notif-sidebar-title">
                FILTER
              </div>
              <div className="uh-notif-filter-list">
                {FILTERS.map((f) => {
                  const count = f.key === "all" ? notifications.length : notifications.filter((n) => filterNotification(n, f.key)).length;
                  const isActive = notifFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setNotifFilter(f.key)}
                      className={`uh-notif-filter-btn ${isActive ? "active" : ""}`}
                    >
                      <span className="uh-notif-dot" style={{ background: f.dot }} />
                      <span className="uh-notif-label">{f.label}</span>
                      <span
                        className="uh-notif-badge"
                        style={{ background: f.countBg, color: f.countColor }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="uh-notif-list-container">
              {filteredNotifs.length === 0 ? (
                <div className="uh-notif-empty-state">
                  <div style={{ marginBottom: 8, opacity: 0.3, display: "flex", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
                  </div>
                  <p>No notifications here</p>
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
                  return (
                    <div key={n.id} className={`full-notif-item ${!n.read ? "unread" : ""}`} onClick={() => handleNotifView(n)}>
                      <div className="full-notif-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
                      <div className="full-notif-body">
                        <div className="full-notif-title">{n.title || n.text}</div>
                        <div className="full-notif-desc">{n.desc || n.text}</div>
                        <div className="full-notif-meta">
                          <span className="full-notif-time">{n.time}</span>
                          <span className="full-notif-tag" style={{ background: cfg.tagBg, color: cfg.tagColor }}>{cfg.tag}</span>
                        </div>
                      </div>
                      <div className="full-notif-right">
                        {!n.read && <div className="full-unread-dot" />}
                        <button className="full-view-btn" onClick={(e) => { e.stopPropagation(); handleNotifView(n); }}>
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="uh-root">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="uh-header">
        <div className="uh-header-left">
          <span className="uh-journey-text">Your Naavi Journey</span>
          <span className="uh-journey-name">— {firstName}</span>
        </div>
        <div className="uh-header-right">
          <span className="uh-date-chip">
            <Icon type="calendar" size={11} color="#3b82f6" />
            {today}
          </span>
          <div className="uh-notif-wrap" ref={notifRef} style={{ position: "relative" }}>
            <button className="notif-bell-btn" onClick={() => setShowNotif((v) => !v)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && <span className="notif-bell-badge">{unread}</span>}
            </button>
            {showNotif && (
              <div className="notif-dropdown">
                <div className="notif-dd-header">
                  <span className="notif-dd-title">Notifications</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {unread > 0 && <span className="notif-dd-count">{unread} New</span>}
                    <button className="notif-mark-all-btn" onClick={markAllRead}>Mark all read</button>
                    <button 
                      onClick={() => setShowNotif(false)} 
                      style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "50%", color: "#94a3b8", transition: "color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#1e293b"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                      aria-label="Close notifications"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="notif-dd-list">
                  {notifLoading && notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--slate-400, #94a3b8)" }}>
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--slate-400, #94a3b8)" }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => {
                      const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
                      return (
                        <div
                          key={n.id}
                          className={`notif-dd-item ${!n.read ? "unread" : ""}`}
                          onClick={() => handleNotifView(n)}
                        >
                          <div className="notif-dd-icon" style={{ background: cfg.bg }}>
                            {cfg.icon}
                          </div>
                          <div className="notif-dd-body">
                            <div className="notif-dd-item-title">{n.title || n.text}</div>
                            <div className="notif-dd-item-desc">{n.desc || n.text}</div>
                            <div className="notif-dd-item-time">{n.time}</div>
                          </div>
                          <div className="notif-dd-right">
                            {!n.read && <div className="notif-unread-dot" />}
                            <button
                              type="button"
                              className="notif-item-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotifView(n);
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
                <div className="notif-dd-footer">
                  <button
                    type="button"
                    className="notif-view-all-btn"
                    onClick={() => {
                      setShowNotif(false);
                      setView("notifications");
                      setNotifFilter("all");
                      navigate("/dashboard/users/notifications");
                    }}
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── TOP STRIP ───────────────────────────────────────────────────────── */}
      <div className="uh-top-strip">
        <div className="uh-credits-hero" onClick={() => navigate("/dashboard/users/wallet")}>
          <div className="uh-ch-left">
            <div className="uh-ch-label">AVAILABLE CREDITS</div>
            <div className="uh-ch-number">{credits?.available ?? "—"}</div>
            <div className="uh-ch-meta">
              {credits?.used ?? "—"} used · {credits?.expiry ? (/^expire/i.test(credits.expiry) ? credits.expiry : `expires ${credits.expiry}`) : "—"}
            </div>
            <div className="uh-ch-bar-wrap">
              <div className="uh-ch-bar" style={{ width: `${creditPct}%` }} />
            </div>
            <div className="uh-ch-pct">{creditPct}% remaining</div>
          </div>
          <div className="uh-ch-right">
            <Ring pct={creditPct} size={60} stroke={5} />
            <button className="uh-ch-btn" onClick={(e) => { e.stopPropagation(); navigate("/dashboard/users/wallet"); }}>
              View Wallet <Icon type="arrow-r" size={11} />
            </button>
          </div>
          <div className="uh-ch-glow" />
        </div>

        <div className="uh-quick-tiles">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`uh-quick-tile ${activeTab === t.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(t.key);
              }}
            >
              <div className="uh-qt-icon"><Icon type={t.icon} size={16} color={activeTab === t.key ? "#2563eb" : "#64748b"} /></div>
              <span>{t.label}</span>
              <Icon type="arrow-r" size={11} color={activeTab === t.key ? "#2563eb" : "#94a3b8"} />
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
      <div className="uh-main-grid">

        {/* Recent Activity */}
        <div className="uh-card uh-card-activity">
          <div className="uh-card-head">
            <div className="uh-ch-icon-wrap blue"><Icon type="activity" size={13} color="#3b82f6" /></div>
            <h3>Recent Activity</h3>
          </div>
          <div className="uh-activity-list">
            {activity.slice(0, 6).map(a => (
              <div key={a.id} className="uh-act-row">
                <div className={`uh-act-dot t-${a.type}`} />
                <div className="uh-act-body">
                  <span className="uh-act-label">{a.action}</span>
                  <span className="uh-act-time">{a.time}</span>
                </div>
                {a.delta !== null && (
                  <span className={`uh-act-delta ${a.delta > 0 ? "pos" : "neg"}`}>
                    {a.delta > 0 ? "+" : ""}{a.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="uh-card-cta" onClick={() => navigate("/dashboard/users/wallet")}>View all →</button>
        </div>

        {/* Detail panel — preview only, each View All routes out */}
        <div className="uh-card uh-card-detail" ref={detailCardRef}>
          <div className="uh-tab-bar">
            {TABS.map(t => (
              <button key={t.key} className={`uh-tab-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                <Icon type={t.icon} size={13} color={activeTab === t.key ? "#2563eb" : "#94a3b8"} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="uh-tab-content">
            {panels[activeTab] || panels["wallet"]}
          </div>
        </div>

      </div>

      {/* ── BOTTOM STRIP ────────────────────────────────────────────────────── */}
      <div className="uh-bottom-strip">
        <div className="uh-bs-item" onClick={() => navigate("/dashboard/users/my-journey")}>
          <span className="uh-bs-num">{myPath ? `${myPath.doneCount}/${myPath.totalSteps}` : "—"}</span>
          <span className="uh-bs-label">Steps done</span>
          <Icon type="arrow-r" size={11} color="#3b82f6" />
        </div>
        <div className="uh-bs-div" />
        <div className="uh-bs-item" onClick={() => setActiveTab("paths")}>
          <span className="uh-bs-num">{explorePaths.length}</span>
          <span className="uh-bs-label">Paths explored</span>
          <Icon type="arrow-r" size={11} color="#3b82f6" />
        </div>
        <div className="uh-bs-div" />
        <div className="uh-bs-item" onClick={() => setActiveTab("purchases")}>
          <span className="uh-bs-num">{purchases.length}</span>
          <span className="uh-bs-label">Purchases</span>
          <Icon type="arrow-r" size={11} color="#3b82f6" />
        </div>
        <div className="uh-bs-div" />
        <div className="uh-bs-item" onClick={() => setActiveTab("subscriptions")}>
          <span className="uh-bs-num">{subscriptions.length}</span>
          <span className="uh-bs-label">Subscriptions</span>
          <Icon type="arrow-r" size={11} color="#3b82f6" />
        </div>
      </div>

    </div>
  );
}