import React, { useEffect, useState, useCallback } from "react";
import "./currentstep.scss";
import { useCoinContextData } from "../../context/CoinContext";
import { useStore } from "../../components/store/store.ts";
import axios from "axios";
import Step4 from "../dashboard/MallProduct/Step4.jsx";
import CoinComponent from "../dashboard/MallProduct/CoinComponent.jsx";
import { useRazorpayPayment } from "../../app/useRazorpayPayment";
import { useNavigate } from "react-router-dom";
import logo from "../../logos/naavi_final_logo2.png";
import { SvgClose, SvgCheck } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const LAYER_COST_FREEMIUM = { micro: 2, nano: 4 };
const LAYER_COST_SUBSCRIBER = { micro: 5, nano: 10 };

const PLAN_META = {
  standard: { label: "Standard", credits: 100, monthlyPrice: "₹830", annualPrice: "₹9,960", monthlyAmt: 830, annualAmt: 9960 },
  pro: { label: "Pro", credits: 500, monthlyPrice: "₹4,150", annualPrice: "₹49,800", monthlyAmt: 4150, annualAmt: 49800, tag: "Most Popular" },
  proplus: { label: "Pro Plus", credits: 1000, monthlyPrice: "₹8,300", annualPrice: "₹99,600", monthlyAmt: 8300, annualAmt: 99600, tag: "Best Value" },
};

const NANO_PLAN_META = {
  standard: { label: "Standard Nano", credits: 100, monthlyPrice: "₹1,660", tag: null },
  pro: { label: "Pro Nano", credits: 500, monthlyPrice: "₹8,300", tag: "Most Popular" },
  proplus: { label: "Pro Plus Nano", credits: 1000, monthlyPrice: "₹16,600", tag: "Best Value" },
};

const PLAN_COLORS = {
  standard: { accent: "#0a5244", bg: "#d6f0e8", border: "#8ecfbe", badge: "#0e7a62" },
  pro: { accent: "#2e1f9a", bg: "#e0dcfa", border: "#a89ded", badge: "#3d2eb0" },
  proplus: { accent: "#8a3e00", bg: "#fde8cc", border: "#f0bc78", badge: "#b05e10" },
};

const PLAN_FEATS = {
  standard: [
    "Macro View — Always Free",
    "Micro View — 5 Credits/Step",
    "Nano View — 10 Credits/Step",
    "Full Marketplace Access",
    "Cancel Anytime",
  ],
  pro: [
    "Macro View — Always Free",
    "Micro View — 5 Credits/Step",
    "Nano View — 10 Credits/Step",
    "Priority Marketplace Access",
    "Progress Tracking",
    "Cancel Anytime",
  ],
  proplus: [
    "Macro View — Always Free",
    "Micro View — 5 Credits/Step",
    "Nano View — 10 Credits/Step",
    "Full Marketplace + Exclusive Content",
    "Priority Mentor Matching",
    "Dedicated Success Manager",
    "Locked-In Pricing",
  ],
};

/* ─── Skeletons ─────────────────────────────────────────────────── */
const FEEDBACK_ACTIONS = [
  { key: "helpful", label: "Helpful" },
  { key: "notRelevant", label: "Not Relevant" },
  { key: "comment", label: "Comment" },
  { key: "skip", label: "Skip" },
];

const FeedbackStrip = ({ value = {}, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(
    value?.action === "comment" && !value?.comment?.trim() ? "" : (value?.action || "")
  );
  const [commentText, setCommentText] = useState(value?.comment || "");
  const showComment = selected === "comment";

  // Sync external value when prop changes (e.g. on step change or db sync)
  useEffect(() => {
    const act = value?.action || "";
    const comm = value?.comment || "";
    if (act === "comment" && !comm.trim()) {
      setSelected("");
      setCommentText("");
    } else {
      setSelected(act);
      setCommentText(comm);
    }
  }, [value?.action, value?.comment]);

  const handleAction = (action) => {
    if (action === "comment") {
      setSelected("comment");
      setOpen(true);
    } else {
      setSelected(action);
      setOpen(false); // collapse after selection
      onChange({
        action,
        comment: commentText, // preserve comment so switching back retains it
        skipped: action === "skip",
      });
    }
  };

  const handleSubmitComment = (e) => {
    e.stopPropagation();
    const finalComment = (commentText || "").trim();
    if (!finalComment) return;
    onChange({
      action: "comment",
      comment: finalComment,
      skipped: false,
    });
    setSelected("comment");
    setOpen(false); // collapse after submit
  };

  const handleClearComment = (e) => {
    e.stopPropagation();
    setCommentText("");
    onChange({
      action: selected === "comment" ? "" : selected,
      comment: "",
      skipped: false,
    });
    setSelected("");
    setOpen(false);
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    // Revert unsubmitted selection and text back to saved value
    const savedAction = value?.action || "";
    const savedComment = value?.comment || "";
    if (savedAction === "comment" && !savedComment.trim()) {
      setSelected("");
      setCommentText("");
    } else {
      setSelected(savedAction);
      setCommentText(savedComment);
    }
    setOpen(false);
  };

  // A comment counts as submitted ONLY if actual non-empty comment text exists in saved value
  const hasSubmittedComment =
    (selected === "comment" || selected === "comment_submitted") &&
    Boolean((value?.comment || "").trim());

  // Already submitted feedback — show compact badge
  const hasResult = Boolean(
    !open &&
    selected &&
    (selected !== "comment" || hasSubmittedComment)
  );

  const resultLabel =
    selected === "helpful" ? "Helpful" :
    selected === "notRelevant" ? "Not Relevant" :
    selected === "skip" ? "Skipped" :
    hasSubmittedComment ? "Comment Sent" : selected;

  return (
    <div className="feedback-strip">
      {/* ── Collapsed state: just a trigger ── */}
      {!open && !hasResult && (
        <button
          type="button"
          className="feedback-trigger"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Give Feedback
        </button>
      )}

      {/* ── Submitted badge ── */}
      {!open && hasResult && (
        <div className="feedback-result" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
          <span className="feedback-result__badge"><SvgCheck size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />{resultLabel}</span>
          <span className="feedback-result__edit">Change</span>
        </div>
      )}

      {/* ── Expanded state: action pills ── */}
      {open && (
        <div className="feedback-expanded">
          <div className="feedback-expanded__head">
            <span className="feedback-expanded__label">Feedback</span>
            <button
              type="button"
              className="feedback-expanded__close"
              onClick={handleClose}
            ><SvgClose size={14} /></button>
          </div>
          <div className="feedback-strip__actions">
            {FEEDBACK_ACTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`feedback-btn ${selected === key ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {showComment && (
            <div className="feedback-comment-wrapper" onClick={(e) => e.stopPropagation()}>
              <textarea
                className="feedback-comment"
                placeholder="Add a short comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                {Boolean(commentText || value?.comment) && (
                  <button
                    type="button"
                    className="feedback-submit-btn"
                    style={{ background: "#f3f4f6", color: "#4b5563", border: "1px solid #d1d5db" }}
                    onClick={handleClearComment}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="feedback-submit-btn"
                  disabled={!commentText.trim()}
                  style={!commentText.trim() ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                  onClick={handleSubmitComment}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SkeletonBar = ({ width = "100%", height = "14px", style = {} }) => (
  <div className="sk-bar" style={{ width, height, borderRadius: "6px", ...style }} />
);
const SkeletonText = ({ lines = 3 }) => (
  <div className="sk-text-block">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBar key={i} width={i === lines - 1 ? "65%" : "100%"} height="13px"
        style={{ marginBottom: i < lines - 1 ? "8px" : 0 }} />
    ))}
  </div>
);
const SkeletonViewCard = ({ accent }) => (
  <div className={`view-card sk-card sk-card--${accent}`}>
    <div className="vc-head">
      <SkeletonBar width="18px" height="18px" style={{ borderRadius: "50%", flexShrink: 0 }} />
      <SkeletonBar width="90px" height="13px" style={{ marginLeft: "8px" }} />
    </div>
    <div className="vc-body">
      <SkeletonBar width="55%" height="16px" style={{ marginBottom: "14px" }} />
      <SkeletonText lines={4} />
    </div>
    <div className="vc-foot">
      <SkeletonBar width="160px" height="36px" style={{ borderRadius: "8px" }} />
    </div>
  </div>
);
const SkeletonPageHead = () => (
  <div className="page-head sk-page-head">
    <div className="page-head-top-row">
      <SkeletonBar width="200px" height="13px" />
      <SkeletonBar width="110px" height="28px" style={{ borderRadius: "20px" }} />
      <SkeletonBar width="120px" height="28px" style={{ borderRadius: "20px" }} />
    </div>
    <SkeletonBar width="55%" height="32px" style={{ marginTop: "18px", marginBottom: "14px" }} />
    <SkeletonText lines={2} />
  </div>
);

/* ─── Credit Unlock Overlay ─────────────────────────────────────── */
const CreditUnlockOverlay = ({ type, balance, unlocking, onUnlock, onSeePlans, isSubscriber }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const cost = isSubscriber ? LAYER_COST_SUBSCRIBER[type] : LAYER_COST_FREEMIUM[type];
  const canAfford = balance >= cost;

  return (
    <div className={`lock-overlay lock-overlay--${type}`}>
      <div className="lock-overlay__inner">
        <div className="lock-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" opacity="0.15" />
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <p className="lock-overlay__text">
          {type === "nano"
            ? "Unlock 1-on-1 expert sessions & premium mentorship"
            : "Unlock full structured guidance & assessment tools"}
        </p>
        {!showConfirm ? (
          <div className="cuo-actions">
            {canAfford ? (
              <button className="cuo-btn cuo-btn--credits" onClick={() => setShowConfirm(true)} disabled={unlocking}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
                Use {cost} Credits
              </button>
            ) : (
              <div className="cuo-low">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Need {cost} credits · you have {balance}
              </div>
            )}
            <button className="lock-overlay__btn" onClick={onSeePlans}>See Plans →</button>
          </div>
        ) : (
          <div className="cuo-confirm">
            <p className="cuo-confirm-text">
              Spend <strong>{cost} credits</strong> to permanently unlock?
              <br />
              <span className="cuo-confirm-balance">Balance after: {balance - cost} credits</span>
            </p>
            <div className="cuo-confirm-btns">
              <button
                type="button"
                className={`cuo-btn cuo-btn--confirm ${unlocking ? "loading" : ""}`}
                onClick={onUnlock}
                disabled={unlocking}
              >
                {unlocking ? (
                  <>
                    <svg className="cuo-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <span>Yes, Unlock</span>
                )}
              </button>
              <button
                type="button"
                className="cuo-btn cuo-btn--cancel"
                onClick={() => !unlocking && setShowConfirm(false)}
                disabled={unlocking}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Subscription Gate ─────────────────────────────────────────── */
const SubscriptionGate = ({ onBack, onSubscribe, subscribing, subscribingTier = null, initialTier = null }) => {
  const [selectedTier, setSelectedTier] = useState(initialTier || "standard");
  const [selectedBilling, setSelectedBilling] = useState("monthly");

  const getPrice = (p) => {
    const pm = PLAN_META[p];
    return selectedBilling === "annual" ? pm.annualPrice : pm.monthlyPrice;
  };

  return (
    <div className="sub-gate">
      <div className="sub-gate__inner">

        <button className="sub-gate__back" onClick={onBack} disabled={subscribing}>
          ← Back to Current Step
        </button>

        <h2 className="sub-gate__title">Choose Your Naavi Plan</h2>

        <div className="sub-billing-toggle">
          <button
            className={`sbt-btn ${selectedBilling === "monthly" ? "sbt-btn--active" : ""}`}
            onClick={() => setSelectedBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={`sbt-btn ${selectedBilling === "annual" ? "sbt-btn--active" : ""}`}
            onClick={() => setSelectedBilling("annual")}
          >
            Annual
          </button>
        </div>

        <div className="sub-plans-grid">
          {["standard", "pro", "proplus"].map((p) => {
            const pm = PLAN_META[p];
            const pc = PLAN_COLORS[p];
            const active = selectedTier === p;

            return (
              <div
                key={p}
                className={`sub-plan-card sub-plan-card--${p} ${active ? "sub-plan-card--active" : ""}`}
                onClick={() => setSelectedTier(p)}
              >
                {pm.tag && (
                  <div className="spc-tag" style={{ background: pc.badge }}>
                    {pm.tag}
                  </div>
                )}
                <div className="spc-header">
                  <span className="spc-label">{pm.label}</span>
                </div>
                <div className="spc-price">
                  {getPrice(p)}
                  <span className="spc-period">/{selectedBilling === "annual" ? "yr" : "mo"}</span>
                </div>
                <div className="spc-save">
                  {selectedBilling === "annual" ? "2 months free" : "\u00A0"}
                </div>
                <div className="spc-credits">
                  {pm.credits} Credits / Month
                </div>
                <button
                  className="spc-subscribe-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTier(p);
                    onSubscribe({ tier: p, billing: selectedBilling });
                  }}
                  disabled={subscribing}
                >
                  {subscribing && (subscribingTier ? subscribingTier === p : selectedTier === p) ? (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <svg className="cuo-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span>Activating…</span>
                    </span>
                  ) : (
                    "Subscribe Now"
                  )}
                </button>
                <hr className="spc-divider" />
                <ul className="spc-feats">
                  {PLAN_FEATS[p].map((f) => (
                    <li key={f}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="sub-gate__nano-hint">
          Macro View is always free — no credits needed. Unused monthly credits expire after 30 days.
        </p>
      </div>
    </div>
  );
};

/* ─── Subscription Success ──────────────────────────────────────── */
const SubscriptionSuccess = ({ plan, planTier, tier, onStartLearning }) => {
  const isNano = tier === "nano";
  const meta = isNano
    ? (NANO_PLAN_META[planTier] || NANO_PLAN_META.standard)
    : (PLAN_META[planTier] || PLAN_META.standard);
  const color = PLAN_COLORS[planTier]?.accent || "#3b82f6";
  const monthlyPriceStr = meta.monthlyPrice || (meta.monthlyAmt ? `₹${meta.monthlyAmt.toLocaleString()}` : "");
  const annualPriceStr = meta.annualPrice || (meta.annualAmt ? `₹${meta.annualAmt.toLocaleString()}` : "");

  return (
    <div className="sub-success">
      <div className="sub-success__inner">
        <div className="sub-success__icon">
          <svg viewBox="0 0 52 52" className="sub-success__svg">
            <circle className="sub-success__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="sub-success__check" fill="none" d="M14 27l8 8 16-16" />
          </svg>
        </div>
        <div className="sub-success__badge">Payment Successful</div>
        <h2 className="sub-success__title" style={{ color }}>
          Welcome to Naavi {meta.label}!
        </h2>
        <p className="sub-success__desc">
          You now have <strong>{meta.credits} Credits</strong> To Unlock Micro &amp; Nano Views Across Your Learning Steps.
        </p>
        <div className="sub-success__plan-pill" style={{ background: PLAN_COLORS[planTier]?.bg, color, border: `1px solid ${PLAN_COLORS[planTier]?.border}` }}>
          {meta.label} {plan === "annual" ? "Annual" : "Monthly"} —{" "}
          {plan === "annual" ? (annualPriceStr ? annualPriceStr + "/year" : "") : (monthlyPriceStr ? monthlyPriceStr + "/Month" : "")}
        </div>
        <button className="sub-success__cta" onClick={onStartLearning}>Start Learning →</button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const CurrentStep = ({ productDataArray, selectedPathId, showSelectedPath, selectedPath }) => {
  const userDetails = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  const navigate = useNavigate();
  const userEmail = userDetails?.user?.email || userDetails?.email || "guest";

  const SUB_KEY = `naavi_subscribed_${userEmail}`;
  const SUB_TIER_KEY = `naavi_sub_tier_${userEmail}`;
  const SUB_PLANTIER_KEY = `naavi_sub_plantier_${userEmail}`;
  const PRODUCT_ID = "naavi-platform";

  /* ── Subscription state ──────────────────────────────────────── */
  const [subscribed, setSubscribed] = useState(() => localStorage.getItem(SUB_KEY) === "true");
  const [subTier, setSubTier] = useState(() => localStorage.getItem(SUB_TIER_KEY) || null);
  const [subPlanTier, setSubPlanTier] = useState(() => localStorage.getItem(SUB_PLANTIER_KEY) || null);
  const [showSubGate, setShowSubGate] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribingTier, setSubscribingTier] = useState(null);
  const [subError, setSubError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState("");
  const [subscribedPlanTier, setSubscribedPlanTier] = useState("");
  const [subscribedTier, setSubscribedTier] = useState("");
  const [subGateInitialTier, setSubGateInitialTier] = useState(null);
  const [showNanoGate, setShowNanoGate] = useState(false);

  /* ── Credit / wallet state ───────────────────────────────────── */
  const [walletBalance, setWalletBalance] = useState(0);
  const [creditUnlocked, setCreditUnlocked] = useState({ micro: false, nano: false });
  const [unlocking, setUnlocking] = useState({ micro: false, nano: false });
  const [unlockToast, setUnlockToast] = useState("");

  /* ── View states ─────────────────────────────────────────────── */
  const [macroView, setMacroView] = useState(null);
  const [microView, setMicroView] = useState(null);
  const [nanoView, setNanoView] = useState(null);

  /* ── Loading flags ───────────────────────────────────────────── */
  const [stepLoading, setStepLoading] = useState(true);
  const [viewsLoading, setViewsLoading] = useState(true);

  const {
    currentStepData, setCurrentStepData,
    currentStepDataLength, setCurrentStepDataLength,
    currentStepdataPathId, setCurrentStepDataPathId,
    stepServices, setStepServices,
  } = useCoinContextData();

  const {
    sideNav, setsideNav,
    buy, setBuy,
    mallCoindata, setfilteredcoins,
    index, setIndex,
  } = useStore();

  const [totalStepsCount, setTotalStepsCount] = useState(null);
  const [currentStepPageData, setCurrentStepPageData] = useState(null);
  const [currentStepPagePathId, setCurrentStepPagePathId] = useState("");
  const [popup, setPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("default");
  const [popupDetails, setPopupDetails] = useState("");
  const [selectedCard, setSelectedCard] = useState(0);
  const [acceptOffer, setAcceptOffer] = useState(false);
  const activeStepId = localStorage.getItem("selectedStepId") || currentStepData?._id || currentStepPageData?._id || "";

  const loadStoredFeedback = useCallback((email, pathId, stepId) => {
    const cleanMail = (email || userEmail || "guest@naaviverse.com").toLowerCase().trim();
    const cleanPath = pathId || selectedPathId || localStorage.getItem("selectedPathId") || "default";
    const cleanStep = stepId || localStorage.getItem("selectedStepId") || "default";

    const primaryKey = `naavi_step_feedback_${cleanMail}_${cleanPath}_${cleanStep}`;
    const legacyKey = `naavi_step_feedback_${cleanMail}_${cleanStep}`;

    try {
      const primaryRaw = localStorage.getItem(primaryKey);
      if (primaryRaw) {
        const parsed = JSON.parse(primaryRaw);
        if (parsed && typeof parsed === "object") return parsed;
      }
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.warn("Could not load stored step feedback:", e);
    }
    return {};
  }, [userEmail, selectedPathId]);

  const saveStoredFeedback = useCallback((email, pathId, stepId, nextObj) => {
    const cleanMail = (email || userEmail || "guest@naaviverse.com").toLowerCase().trim();
    const cleanPath = pathId || selectedPathId || localStorage.getItem("selectedPathId") || "default";
    const cleanStep = stepId || localStorage.getItem("selectedStepId") || "default";

    const primaryKey = `naavi_step_feedback_${cleanMail}_${cleanPath}_${cleanStep}`;
    const legacyKey = `naavi_step_feedback_${cleanMail}_${cleanStep}`;
    try {
      const serialized = JSON.stringify(nextObj);
      localStorage.setItem(primaryKey, serialized);
      localStorage.setItem(legacyKey, serialized);
    } catch (e) {
      console.warn("Could not save step feedback locally:", e);
    }
  }, [userEmail, selectedPathId]);

  const [stepFeedback, setStepFeedback] = useState(() => {
    try {
      const stepId = localStorage.getItem("selectedStepId") || "";
      const pathId = localStorage.getItem("selectedPathId") || "";
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const email = (
        parsedUser?.user?.email ||
        parsedUser?.email ||
        localStorage.getItem("loginEmail") ||
        localStorage.getItem("userEmail") ||
        "guest@naaviverse.com"
      ).toLowerCase().trim();
      const primaryKey = `naavi_step_feedback_${email}_${pathId || "default"}_${stepId || "default"}`;
      const legacyKey = `naavi_step_feedback_${email}_${stepId || "default"}`;
      const raw = localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.warn("Could not load initial step feedback:", e);
    }
    return {};
  });

  // Re-sync feedback when step, path, or user changes
  useEffect(() => {
    const stepId = activeStepId || localStorage.getItem("selectedStepId") || "";
    const email = (userEmail && userEmail !== "guest" ? userEmail : "guest@naaviverse.com").toLowerCase().trim();
    const pathId = selectedPathId || localStorage.getItem("selectedPathId") || "";

    if (!stepId) {
      setStepFeedback({});
      return;
    }

    // 1. Immediately reset / load feedback for the active step so previous step's comments never leak
    const stored = loadStoredFeedback(email, pathId, stepId);
    setStepFeedback(stored || {});

    // 2. Background reconciliation with backend /api/feedback/path/:pathId
    if (pathId && stepId && email && email !== "guest@naaviverse.com") {
      axios.get(`${BASE_URL}/api/feedback/path/${pathId}`)
        .then((res) => {
          if (res.data?.status && Array.isArray(res.data?.data)) {
            const currentStepOid = currentStepPageData?._id ? String(currentStepPageData._id) : null;
            const matches = res.data.data.filter(
              (f) =>
                f.studentEmail?.toLowerCase() === email.toLowerCase() &&
                (String(f.stepId) === String(stepId) || (currentStepOid && String(f.stepId) === currentStepOid))
            );
            if (matches.length > 0) {
              setStepFeedback((prev) => {
                const next = { ...prev };
                let changed = false;
                const seenViews = new Set();
                matches.forEach((m) => {
                  if (m.viewType && !seenViews.has(m.viewType)) {
                    seenViews.add(m.viewType);
                    // Sync if local is empty or backend has newer comment
                    if (!next[m.viewType] || !next[m.viewType].action || (m.comment && !next[m.viewType].comment)) {
                      if (m.action !== "comment" || (m.comment && m.comment.trim())) {
                        next[m.viewType] = {
                          action: m.action,
                          comment: m.comment || "",
                          skipped: m.action === "skip",
                        };
                        changed = true;
                      }
                    }
                  }
                });
                if (changed) {
                  saveStoredFeedback(email, pathId, stepId, next);
                  return next;
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [activeStepId, userEmail, selectedPathId, loadStoredFeedback, saveStoredFeedback, currentStepPageData?._id]);

  const updateStepFeedback = async (key, nextValue) => {
    const stepId = activeStepId || localStorage.getItem("selectedStepId") || "";
    const pathId = selectedPathId || localStorage.getItem("selectedPathId") || "";
    const email = (userEmail && userEmail !== "guest" ? userEmail : "guest@naaviverse.com").toLowerCase().trim();

    // 1. Immediately update in-memory state and save to user-specific localStorage
    setStepFeedback((prev) => {
      const next = { ...prev };
      if (!nextValue || (!nextValue.action && !nextValue.comment) || (nextValue.action === "comment" && !nextValue.comment?.trim())) {
        delete next[key];
      } else {
        next[key] = nextValue;
      }
      saveStoredFeedback(email, pathId, stepId, next);
      return next;
    });

    // 2. Persist to backend
    try {
      const actionToSend = !nextValue || (!nextValue.action && !nextValue.comment) || (nextValue.action === "comment" && !nextValue.comment?.trim())
        ? "delete"
        : (nextValue.action || "comment");
      await axios.post(`${BASE_URL}/api/feedback`, {
        type: "step",
        studentEmail: email,
        pathId,
        stepId,
        viewType: key, // macro, micro, or nano
        action: actionToSend,
        comment: nextValue?.comment || "",
      });
      console.log(`Step feedback for ${key} view submitted successfully.`);
    } catch (err) {
      console.error("Error submitting step feedback:", err);
    }
  };

  const getMicroText = (mv) => {
    if (!mv) return null;
    const joined = Object.values(mv).filter(Boolean).join("\n\n");
    return joined || null;
  };

  const isSubscriber = subscribed && ["standard", "pro", "proplus"].includes(subPlanTier);
  const hasMicro = (subscribed && (subTier === "micro" || subTier === "nano")) || creditUnlocked.micro;
  const hasNano = (subscribed && subTier === "nano") || creditUnlocked.nano;

  /* ── Razorpay ────────────────────────────────────────────────── */
  const { initiatePayment } = useRazorpayPayment({
    userEmail,
    userDetails,
    onSuccess: ({ tier, billing, actualTier, basePlanTier }) => {
      localStorage.setItem(SUB_KEY, "true");
      localStorage.setItem(SUB_TIER_KEY, actualTier);
      localStorage.setItem(SUB_PLANTIER_KEY, basePlanTier);
      setSubscribed(true);
      setSubTier(actualTier);
      setSubPlanTier(basePlanTier);
      setShowSubGate(false);
      setShowNanoGate(false);
      setSubscribedPlan(billing);
      setSubscribedPlanTier(basePlanTier);
      setSubscribedTier(actualTier);
      setSubscribing(false);
      setSubscribingTier(null);
      setSubError("");
      setShowSuccess(true);
    },
    onError: (msg) => {
      setSubscribing(false);
      setSubscribingTier(null);
      if (msg) setSubError(msg);
    },
  });

  /* ── Verify subscription from DB ─────────────────────────────── */
  const verifySubscription = useCallback(async () => {
    if (!userEmail || userEmail === "guest") return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/subscriptions/status?email=${userEmail}&productId=${PRODUCT_ID}`
      );
      const isSubscribed = res.data?.subscribed === true;
      const tier = res.data?.tier || null;
      const planTier = res.data?.planTier || null;

      localStorage.setItem(SUB_KEY, String(isSubscribed));
      localStorage.setItem(SUB_TIER_KEY, tier || "");
      localStorage.setItem(SUB_PLANTIER_KEY, planTier || "");

      setSubscribed(isSubscribed);
      setSubTier(isSubscribed ? tier : null);
      setSubPlanTier(isSubscribed ? planTier : null);
    } catch {
      const cachedSub = localStorage.getItem(SUB_KEY) === "true";
      const cachedTier = localStorage.getItem(SUB_TIER_KEY) || null;
      const cachedPlanTier = localStorage.getItem(SUB_PLANTIER_KEY) || null;
      setSubscribed(cachedSub);
      setSubTier(cachedSub ? cachedTier : null);
      setSubPlanTier(cachedSub ? cachedPlanTier : null);
    }
  }, [userEmail, SUB_KEY, SUB_TIER_KEY, SUB_PLANTIER_KEY, PRODUCT_ID]);

  useEffect(() => {
    verifySubscription();
  }, [userEmail]);

  /* ── Fetch wallet balance + credit unlocks ───────────────────── */
  useEffect(() => {
    const stepId = localStorage.getItem("selectedStepId");
    if (!userEmail || userEmail === "guest" || !stepId) return;
    Promise.all([
      axios.get(`${BASE_URL}/api/wallet/balance`, { params: { email: userEmail } }),
      axios.get(`${BASE_URL}/api/subscriptions/step-unlock/check`, { params: { email: userEmail, step_id: stepId } }),
    ])
      .then(([balRes, unlockRes]) => {
        if (balRes.data?.status) setWalletBalance(balRes.data.balance);
        if (unlockRes.data?.status) setCreditUnlocked(unlockRes.data.unlocked);
      })
      .catch(() => { });
  }, [userEmail, currentStepPageData?._id]);

  /* ── Credit unlock handler ───────────────────────────────────── */
  const handleCreditUnlock = useCallback(async (layer) => {
    const stepId = localStorage.getItem("selectedStepId");
    if (!stepId || !userEmail || userEmail === "guest") return;
    if (unlocking[layer]) return;

    setUnlocking((prev) => ({ ...prev, [layer]: true }));
    try {
      const { data } = await axios.post(`${BASE_URL}/api/subscriptions/step-unlock/unlock`, {
        email: userEmail, step_id: stepId, layer, isSubscriber,
      });
      if (data?.status) {
        setCreditUnlocked((prev) => ({ ...prev, [layer]: true }));
        setWalletBalance(data.remainingBalance);
        setUnlockToast(layer);
        setTimeout(() => setUnlockToast(""), 3000);
      }
    } catch (err) {
      console.error("Credit unlock failed:", err);
    } finally {
      setUnlocking((prev) => ({ ...prev, [layer]: false }));
    }
  }, [userEmail, unlocking]);

  /* ── Subscription handlers ───────────────────────────────────── */
  const handleSeePlans = (tier = null) => {
    setSubError("");
    setSubGateInitialTier(tier);
    setSubscribing(false);
    setSubscribingTier(null);
    setShowSubGate(true);
  };
  const handleSubscribe = async ({ tier, billing }) => {
    if (!userEmail || userEmail === "guest") { setSubError("Please log in to subscribe."); return; }
    setSubscribing(true);
    setSubscribingTier(tier);
    setSubError("");
    await initiatePayment({ tier, billing });
  };
  const handleBackFromGate = () => {
    setShowSubGate(false);
    setSubError("");
    setSubGateInitialTier(null);
    setSubscribing(false);
    setSubscribingTier(null);
  };

  /* ── Step data fetch ─────────────────────────────────────────── */
  useEffect(() => {
    const stepId = localStorage.getItem("selectedStepId") || activeStepId;
    const pathId = selectedPathId || localStorage.getItem("selectedPathId");
    if (!stepId || !pathId) { setStepLoading(false); return; }
    setStepLoading(true);
    axios.get(`${BASE_URL}/api/userpaths/steps?pathId=${pathId}`)
      .then((res) => {
        const steps = res?.data?.data?.steps || [];
        if (!Array.isArray(steps)) return;
        setTotalStepsCount(steps.length);
        const step = steps.find((s) => String(s?._id) === String(stepId) || String(s?.step_id) === String(stepId));
        if (step) {
          setCurrentStepPageData(step);
          setCurrentStepPagePathId(pathId);
          localStorage.setItem("selectedStepName", step.name || "");
        }
      })
      .catch((err) => console.error("Error fetching path steps:", err))
      .finally(() => setStepLoading(false));
  }, [selectedPathId, activeStepId]);

  /* ── Fetch AI step views ─────────────────────────────────────── */
  useEffect(() => {
    const loadStepViews = async () => {
      const stepId = localStorage.getItem("selectedStepId") || activeStepId;
      const pathId = selectedPathId || localStorage.getItem("selectedPathId");
      if (!stepId || !pathId) { setViewsLoading(false); return; }
      setViewsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/stepviews?pathId=${pathId}&stepId=${stepId}`);
        const data = res?.data?.data || {};
        setMacroView(data.macroView || null);
        setMicroView(data.microView || null);
        setNanoView(data.nanoView || null);
      } catch {
        setMacroView(null); setMicroView(null); setNanoView(null);
      } finally { setViewsLoading(false); }
    };
    loadStepViews();
  }, [selectedPathId, activeStepId]);

  /* ── User data ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!userDetails) return;
    const email = userDetails?.user?.email || userDetails?.email;
    if (!email) return;
    axios.get(`${BASE_URL}/api/users/get/${email}`).catch(() => { });
  }, []);

  useEffect(() => {
    if (!acceptOffer || !stepServices || stepServices.length === 0) return;
    const svc = pickServiceForDrawer();
    if (!svc) { alert("No services available for this step."); return; }
    setIndex(svc); setBuy("step1");
  }, [stepServices]);

  const pickServiceForDrawer = () => {
    try {
      if (!Array.isArray(stepServices) || stepServices.length === 0) return null;
      const selected = stepServices[selectedCard];
      if (selected?._id) return selected;
      const first = stepServices[0];
      return first?._id ? first : null;
    } catch { return null; }
  };

  /* ── Complete step ───────────────────────────────────────────── */
  const completeStep = async (stepid) => {
    const pathId = selectedPathId || localStorage.getItem("selectedPathId");
    const email = userDetails?.email || userDetails?.user?.email;

    console.log("[search] completeStep called with:", { email, pathId, step_id: stepid });

    try {
      const res = await axios.put(`${BASE_URL}/api/userpaths/completeStep`, {
        email,
        pathId,
        step_id: stepid,
      });

      console.log("[check] completeStep response:", res.data);

      if (res.data?.status) {
        // [check] FIX 1 — Use CustomEvent instead of StorageEvent.
        // StorageEvent only fires in OTHER tabs, not the same tab.
        // CustomEvent fires immediately and reliably in the same tab.
        // ADD a small delay so the DB write commits before Home re-fetches
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("naavi:step-completed"));
        }, 800);

        setPopupContent("success");
        setPopupDetails("yes");
      } else {
        console.error("[error] completeStep failed:", res.data?.message);
        alert("Progress save failed: " + res.data?.message);
      }
    } catch (err) {
      console.error("[error] completeStep error:", err);
      alert("Network error saving progress");
    }
  };

  /* ── Fail step ───────────────────────────────────────────────── */
  const failStep = async (stepid) => {
    const pathId = selectedPathId || localStorage.getItem("selectedPathId");
    const email = userDetails?.email || userDetails?.user?.email;

    try {
      const res = await axios.put(`${BASE_URL}/api/userpaths/failedStep`, {
        email,
        pathId,
        step_id: stepid,
      });

      if (res.data?.status) {
        setPopupContent("success");
        setPopupDetails("no");
      } else {
        console.error("[error] failStep failed:", res.data?.message);
      }
    } catch (err) {
      console.error("[error] failStep error:", err);
    }
  };

  function filterItem(text) {
    if (!text) { setfilteredcoins(mallCoindata || []); return; }
    setfilteredcoins(mallCoindata?.filter((c) =>
      c?.coinSymbol?.toLowerCase()?.includes(text.toLowerCase())
    ) || []);
  }

  const handleBackToJourney = () => {
    setCurrentStepData(""); setCurrentStepDataLength(""); setCurrentStepDataPathId("");
    setsideNav("My Journey");
    navigate("/dashboard/users/my-journey");
  };

  /* ── Derived values ──────────────────────────────────────────── */
  const stepName = currentStepData?.name || currentStepPageData?.name || null;
  const stepDesc = currentStepPageData?.macro_description || currentStepPageData?.description || null;
  const macroDesc = currentStepPageData?.macro_description || macroView?.description || macroView || null;
  const microDesc = currentStepPageData?.micro_description || getMicroText(microView) || null;
  const nanoDesc = nanoView?.description || null;
  const isPageLoading = stepLoading;
  const isViewsLoad = viewsLoading;
  const stepNumber = currentStepPageData?.step_order || localStorage.getItem("selectedStepNumber") || null;

  /* ── Render: Success screen ──────────────────────────────────── */
  if (showSuccess) {
    return (
      <div className="currentstep">
        <div className="step-bar">
          <div className="sp active"><span className="sp-n">1</span>Current Step</div>
          <span className="sp-arr">›</span>
          <div className="sp active"><span className="sp-n"><SvgCheck size={12} /></span>Subscription</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">3</span>Marketplace</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">4</span>Cart</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">5</span>Confirmed</div>
        </div>
        <SubscriptionSuccess
          plan={subscribedPlan}
          planTier={subscribedPlanTier}
          tier={subscribedTier}
          onStartLearning={async () => {
            await verifySubscription();
            setShowSuccess(false);
          }}
        />
      </div>
    );
  }

  if (showNanoGate) {
    return (
      <div className="currentstep">
        <div className="step-bar">
          <div className="sp active"><span className="sp-n">1</span>Current Step</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">2</span>Subscription</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">3</span>Marketplace</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">4</span>Cart</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">5</span>Confirmed</div>
        </div>
        {subError && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c",
            padding: "10px 20px", fontSize: "13px", fontWeight: 600, textAlign: "center",
          }}>
            {subError}
          </div>
        )}
        <div className="sub-gate">
          <div className="sub-gate__inner">
            <button className="sub-gate__back"
              onClick={() => { setShowNanoGate(false); setSubError(""); setSubscribing(false); setSubscribingTier(null); }}
              disabled={subscribing}>
              ← Back to Current Step
            </button>
            <h2 className="sub-gate__title">Upgrade to Nano View</h2>
            <p style={{ textAlign: "center", color: "#666", marginBottom: "24px", fontSize: "14px" }}>
              Unlock 1-on-1 Expert Sessions & Premium Mentorship
            </p>
            <div className="sub-plans-grid">
              {["standard", "pro", "proplus"].map((p) => {
                const pm = NANO_PLAN_META[p];
                const pc = PLAN_COLORS[p];
                return (
                  <div key={p} className={`sub-plan-card sub-plan-card--${p}`}>
                    {pm.tag && (
                      <div className="spc-tag" style={{ background: pc.badge }}>{pm.tag}</div>
                    )}
                    <div className="spc-header">
                      <span className="spc-label">{pm.label}</span>
                    </div>
                    <div className="spc-price">
                      {pm.monthlyPrice}
                      <span className="spc-period">/mo</span>
                    </div>
                    <div className="spc-save">&nbsp;</div>
                    <div className="spc-credits">{pm.credits} Credits / Month</div>
                    <button
                      className="spc-subscribe-btn"
                      disabled={subscribing}
                      onClick={() => {
                        setSubscribing(true);
                        setSubscribingTier(p);
                        setSubError("");
                        initiatePayment({ tier: `${p}_nano`, billing: "monthly" });
                      }}
                    >
                      {subscribing && subscribingTier === p ? (
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <svg className="cuo-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          <span>Activating…</span>
                        </span>
                      ) : (
                        "Upgrade to Nano"
                      )}
                    </button>
                    <hr className="spc-divider" />
                    <ul className="spc-feats">
                      {["1-on-1 Expert Sessions", "Premium Mentorship", "Nano View Access", "Priority Support"].map((f) => (
                        <li key={f}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render: Subscription gate ───────────────────────────────── */
  if (showSubGate) {
    return (
      <div className="currentstep">
        <div className="step-bar">
          <div className="sp active"><span className="sp-n">1</span>Current Step</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">2</span>Subscription</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">3</span>Marketplace</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">4</span>Cart</div>
          <span className="sp-arr">›</span>
          <div className="sp"><span className="sp-n">5</span>Confirmed</div>
        </div>
        {subError && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c",
            padding: "10px 20px", fontSize: "13px", fontWeight: 600, textAlign: "center",
          }}>
            {subError}
          </div>
        )}
        <SubscriptionGate
          onBack={handleBackFromGate}
          onSubscribe={handleSubscribe}
          subscribing={subscribing}
          subscribingTier={subscribingTier}
          initialTier={subGateInitialTier}
        />
      </div>
    );
  }

  /* ── Render: Main ────────────────────────────────────────────── */
  return (
    <div className="currentstep">

      <div className="step-bar">
        <div className="sp active"><span className="sp-n">1</span>Current Step</div>
        <span className="sp-arr">›</span>
        <div className="sp"><span className="sp-n">2</span>Marketplace</div>
        <span className="sp-arr">›</span>
        <div className="sp"><span className="sp-n">3</span>Cart</div>
        <span className="sp-arr">›</span>
        <div className="sp"><span className="sp-n">4</span>Checkout</div>
        <span className="sp-arr">›</span>
        <div className="sp"><span className="sp-n">5</span>Confirmed</div>
      </div>

      <div className="cs-page-content">

        {unlockToast && (
          <div className="unlock-toast">
            {unlockToast === "micro" ? "Micro" : "Nano"} View unlocked — {walletBalance} credits remaining.
          </div>
        )}

        {/* Wallet chip */}
        {!isPageLoading && userEmail !== "guest" && (
          <div className="wallet-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            {walletBalance} credits
            {isSubscriber && subPlanTier && PLAN_META[subPlanTier] && (
              <span className="wallet-chip__tier" style={{ color: PLAN_COLORS[subPlanTier]?.accent }}>
                {" "}· {PLAN_META[subPlanTier]?.label}
              </span>
            )}
          </div>
        )}

        {/* Page head */}
        {isPageLoading ? <SkeletonPageHead /> : (
          <div className="page-head">
            <div className="page-head-top-row">
              <div className="breadcrumb">
                <span>My Journey</span><span>›</span>
                <span className="bc-hi">{stepNumber ? `Step ${stepNumber}` : "Current Step"}</span>
              </div>
              <span className="meta-pill mp-gray back-link" onClick={handleBackToJourney}>
                ← Back To Path
              </span>
            </div>
            {stepName && <h1>{stepName}</h1>}
            {stepDesc && <p>{stepDesc}</p>}
          </div>
        )}

        {/* View cards */}
        <div className="views-grid">

          {/* MACRO — always free */}
          {isViewsLoad ? <SkeletonViewCard accent="macro" /> : (
            <div className="view-card vMacro">
              <div className="vc-head hMacro">
                <span className="vc-lbl lMacro">Macro View</span>
                <span className="vc-access-badge badge-free">Free</span>
              </div>
              <div className="vc-body">
                {currentStepPageData?.name && <div className="vc-step-name">{currentStepPageData.name}</div>}
                <div className="vc-title">Why This Step Matters</div>
                {macroDesc
                  ? <div className="vc-desc">{macroDesc}</div>
                  : <div className="vc-desc vc-empty">No macro view available yet.</div>}
              </div>
              <FeedbackStrip
                key={`${activeStepId}_macro`}
                value={stepFeedback.macro}
                onChange={(nextValue) => updateStepFeedback("macro", nextValue)}
              />
              <div className="vc-foot">
                <button className="vc-btn bMacro" onClick={() => {
                  setsideNav("Market Place");
                  navigate("/dashboard/users/Marketplace", {
                    state: {
                      view: "macro",
                      subscribed,
                      creditUnlocked: { micro: hasMicro, nano: hasNano },
                      subTier,
                      subPlanTier,
                      stepId: localStorage.getItem("selectedStepId") || currentStepPageData?._id,
                    },
                  });
                }}>
                  Discover Resources →
                </button>
              </div>
            </div>
          )}

          {/* MICRO */}
          {isViewsLoad ? <SkeletonViewCard accent="micro" /> : (
            <div className={`view-card vMicro ${!hasMicro ? "view-card--locked" : ""}`}>
              {!hasMicro && (
                <CreditUnlockOverlay
                  type="micro"
                  balance={walletBalance}
                  unlocking={unlocking.micro}
                  onUnlock={() => handleCreditUnlock("micro")}
                  onSeePlans={() => handleSeePlans("standard")}
                  isSubscriber={isSubscriber}
                />
              )}
              <div className="vc-head hMicro">
                <span className="vc-lbl lMicro">Micro View</span>
                <span className={`vc-access-badge ${hasMicro ? "badge-sub" : "badge-locked"}`}>
                  {hasMicro
                    ? (creditUnlocked.micro
                      ? "2 Credits"
                      : (isSubscriber && subPlanTier && PLAN_META[subPlanTier]
                        ? PLAN_META[subPlanTier]?.label
                        : "2 Credits"))
                    : "Locked"}
                </span>
              </div>
              <div className="vc-body">
                {currentStepPageData?.micro_name && <div className="vc-step-name">{currentStepPageData.micro_name}</div>}
                <div className="vc-title">How It's Done</div>
                {microDesc
                  ? <div className="vc-desc">{microDesc}</div>
                  : <div className="vc-desc vc-empty">
                    {hasMicro
                      ? "No micro view available yet."
                      : "Unlock with 2 credits or subscribe to access structured guidance."}
                  </div>}
              </div>
              <FeedbackStrip
                key={`${activeStepId}_micro`}
                value={stepFeedback.micro}
                onChange={(nextValue) => updateStepFeedback("micro", nextValue)}
              />
              <div className="vc-foot">
                {hasMicro ? (
                  <button className="vc-btn bMicro" onClick={() => {
                    setsideNav("Market Place");
                    navigate("/dashboard/users/Marketplace", {
                      state: {
                        view: "micro",
                        subscribed,
                        defaultTab: "micro",
                        creditUnlocked: { micro: hasMicro, nano: hasNano },
                        subTier,
                        subPlanTier,
                        stepId: localStorage.getItem("selectedStepId") || currentStepPageData?._id,
                      },
                    });
                  }}>Browse Resources →</button>
                ) : (
                  <button className="vc-btn bLocked" onClick={() => handleSeePlans("standard")}>Unlock Required</button>
                )}
              </div>
            </div>
          )}

          {/* NANO */}
          {isViewsLoad ? <SkeletonViewCard accent="nano" /> : (
            <div className={`view-card vNano ${!hasNano ? "view-card--locked" : ""}`}>
              {!hasNano && (
                <CreditUnlockOverlay
                  type="nano"
                  balance={walletBalance}
                  unlocking={unlocking.nano}
                  onUnlock={() => handleCreditUnlock("nano")}
                  onSeePlans={() => { setSubError(""); setSubscribing(false); setSubscribingTier(null); setShowNanoGate(true); }}
                  isSubscriber={isSubscriber}
                />
              )}
              <div className="vc-head hNano">
                <span className="vc-lbl lNano">Nano View</span>
                <span className={`vc-access-badge ${hasNano ? "badge-paid" : "badge-locked"}`}>
                  {hasNano
                    ? (creditUnlocked.nano
                      ? "10 Credits"
                      : (isSubscriber && subPlanTier && PLAN_META[subPlanTier]
                        ? PLAN_META[subPlanTier]?.label
                        : "10 Credits"))
                    : "Locked"}
                </span>
              </div>
              <div className="vc-body">
                {currentStepPageData?.nano_name && <div className="vc-step-name">{currentStepPageData.nano_name}</div>}
                <div className="vc-title">Live Mentor Guidance</div>
                {nanoDesc
                  ? <div className="vc-desc">{nanoDesc}</div>
                  : <div className="vc-desc vc-empty">
                    {hasNano
                      ? "No nano view available yet."
                      : "Unlock with 4 credits or subscribe to access expert sessions."}
                  </div>}
              </div>
              <FeedbackStrip
                key={`${activeStepId}_nano`}
                value={stepFeedback.nano}
                onChange={(nextValue) => updateStepFeedback("nano", nextValue)}
              />
              <div className="vc-foot">
                {hasNano ? (
                  <button className="vc-btn bNano" onClick={() => {
                    setsideNav("Market Place");
                    navigate("/dashboard/users/Marketplace", {
                      state: {
                        view: "nano",
                        subscribed,
                        defaultTab: "nano",
                        creditUnlocked: { micro: hasMicro, nano: hasNano },
                        subTier,
                        subPlanTier,
                        stepId: localStorage.getItem("selectedStepId") || currentStepPageData?._id,
                      },
                    });
                  }}>Book a Session →</button>
                ) : (
                  <button className="vc-btn bLocked" onClick={() => { setSubError(""); setSubscribing(false); setSubscribingTier(null); setShowNanoGate(true); }}>
                    Unlock Required
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Completion bar */}
        {isPageLoading ? (
          <div className="comp-bar sk-comp-bar">
            <div className="cb-left">
              <SkeletonBar width="120px" height="13px" style={{ marginBottom: "8px" }} />
              <SkeletonBar width="200px" height="16px" />
            </div>
            <div className="cb-btns">
              <SkeletonBar width="100px" height="40px" style={{ borderRadius: "8px" }} />
              <SkeletonBar width="140px" height="40px" style={{ borderRadius: "8px" }} />
            </div>
          </div>
        ) : (
          <div className="comp-bar">
            <div className="cb-left"><span className="cb-q">Did You Complete This Step?</span></div>
            <div className="cb-btns">
              <button className="btn-fail" onClick={() => { setPopup(true); setPopupDetails("no"); }}><SvgClose size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Failed</button>
              <button className="btn-yes" onClick={() => { setPopup(true); setPopupDetails("yes"); }}><SvgCheck size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Yes, Completed</button>
            </div>
          </div>
        )}
      </div>

      {/* Buy drawer */}
      {acceptOffer && (
        <div className="accept-offer-overlay" onClick={() => { setAcceptOffer(false); setBuy("step1"); setIndex([]); }}>
          <div style={{ right: acceptOffer ? "0" : "-100%" }} className="right-divv-cs" onClick={(e) => e.stopPropagation()}>
            {buy === "step1" ? (
              <>
                <div className="amount-details-cs">
                  <div className="left-amnt-cs" style={{ borderRight: "1px solid #E7E7E7" }}>
                    <p className="amnt-font-cs">{(Number(index?.first_purchase?.price ?? 0)).toFixed(2)}&nbsp;{index?.first_purchase?.coin || ""}</p>
                    <p className="text-font-cs">{index?.first_purchase?.coin ? "First Purchase" : ""}</p>
                  </div>
                  <div className="left-amnt1-cs">
                    <p className="amnt-font-cs">{(Number(index?.billing_cycle?.monthly?.price ?? 0)).toFixed(2)}&nbsp;{index?.billing_cycle?.monthly?.coin || ""}</p>
                    <p className="text-font-cs">Monthly</p>
                  </div>
                  {index?.billing_cycle?.annual?.price != null && (
                    <div className="left-amnt1-cs" style={{ borderLeft: "1px solid #E7E7E7" }}>
                      <p className="amnt-font-cs">{(Number(index?.billing_cycle?.annual?.price ?? 0)).toFixed(2)}&nbsp;{index?.billing_cycle?.annual?.coin || ""}</p>
                      <p className="text-font-cs">Yearly</p>
                    </div>
                  )}
                </div>
                <div className="buttonss-cs">
                  <button className="buy-btn-cs" onClick={() => { filterItem(""); setBuy("step2"); }}>Buy Now</button>
                </div>
              </>
            ) : buy === "step2" ? (
              <div className="buy-step1-cs">
                <div style={{ width: "100%", height: "17%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1F304F" }}>Select Currency To Pay With?</div>
                  <div className="searchh-cs">
                    <input type="text" placeholder="Search Vaults.." onChange={(e) => filterItem(e.target.value)} />
                  </div>
                </div>
                <div className="coin-options-cs"><CoinComponent /></div>
                <div className="buttonss-cs"><div className="share-btn-cs" onClick={() => setBuy("step1")}>Close</div></div>
              </div>
            ) : buy === "step3" ? (
              <div className="buy-step1-cs">
                <div style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1F304F" }}>Are You Sure You Want To Subscribe To {index?.product_name}?</div>
                <div className="boxx-cs" onClick={() => setBuy("step4")}>Confirm Purchase</div>
                <div className="boxx-cs" style={{ marginTop: "1.5rem" }} onClick={() => setBuy("step1")}>Go Back</div>
                <div className="boxx-cs" style={{ marginTop: "1.5rem" }} onClick={() => { setBuy("step1"); setAcceptOffer(false); setIndex([]); }}>Cancel Order</div>
              </div>
            ) : buy === "step4" ? (
              <div className="buy-step1-cs"><Step4 setAcceptOffer={setAcceptOffer} /></div>
            ) : null}
          </div>
        </div>
      )}

      {/* Popup */}
      {popup && (
        <div className="popup-overlay" onClick={() => { setPopup(false); setPopupContent("default"); setPopupDetails(""); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div><img src={logo} alt="Naavi" className="modal-step-logo" style={{ height: "44px", maxHeight: "44px", maxWidth: "175px", width: "auto", objectFit: "contain" }} /></div>

            {popupContent === "default" && popupDetails === "yes" && (
              <>
                <div className="popup-text">Are you sure you have completed this step?</div>
                <div className="popup-btns">
                  <div className="yes-Btn" onClick={() => {
                    const id = currentStepData?._id || currentStepPageData?._id;
                    if (id) completeStep(id);
                    else { const fb = localStorage.getItem("selectedStepId"); if (fb) completeStep(fb); }
                  }}>Yes, go to next step</div>
                  <div className="no-btn" onClick={() => { setPopup(false); setPopupDetails(""); setPopupContent("default"); }}>Never mind</div>
                </div>
              </>
            )}

            {popupContent === "default" && popupDetails === "no" && (
              <>
                <div className="popup-text">Are you sure you have failed this step?</div>
                <div className="popup-btns">
                  <div className="yes-Btn" style={{ background: "#100F0D" }} onClick={() => {
                    const id = currentStepData?._id || currentStepPageData?._id;
                    if (id) failStep(id);
                  }}>Yes, move me to another path</div>
                  <div className="no-btn" onClick={() => { setPopup(false); setPopupDetails(""); setPopupContent("default"); }}>Never mind</div>
                </div>
              </>
            )}

            {popupContent === "success" && (
              <>
                <div className="popup-text">{popupDetails === "yes" ? "Completed Step Updated!" : "Failed Step Updated!"}</div>
                <div className="popup-btns">
                  <div className="yes-Btn" onClick={async () => {
                    window.dispatchEvent(new CustomEvent("naavi:step-completed"));
                    if (popupDetails === "yes") {
                      setPopup(false); setPopupContent("default"); setPopupDetails("");
                      try {
                        const pathId = currentStepPagePathId || localStorage.getItem("selectedPathId");
                        const currentNumber = parseInt(stepNumber) || 1;
                        const res = await axios.get(`${BASE_URL}/api/userpaths/steps?pathId=${pathId}`);
                        const allSteps = res?.data?.data?.steps || [];
                        const sorted = [...allSteps].sort((a, b) => a.step_order - b.step_order);
                        const nextStep = sorted.find((s) => s.step_order === currentNumber + 1);
                        if (nextStep) {
                          const nextId = nextStep._id || nextStep.step_id;
                          localStorage.setItem("selectedStepId", nextId);
                          localStorage.setItem("selectedStepNumber", String(nextStep.step_order));
                          setCurrentStepPageData(nextStep);
                          setCurrentStepPagePathId(pathId);
                          setCurrentStepData(nextStep);
                          setCurrentStepDataLength(allSteps.length);
                          setCurrentStepDataPathId(pathId);
                          setMacroView(null); setMicroView(null); setNanoView(null);
                          setCreditUnlocked({ micro: false, nano: false });
                          setViewsLoading(true); setStepLoading(false);
                          try {
                            const viewRes = await axios.get(`${BASE_URL}/api/stepviews?pathId=${pathId}&stepId=${nextId}`);
                            const viewData = viewRes?.data?.data || {};
                            setMacroView(viewData.macroView || null);
                            setMicroView(viewData.microView || null);
                            setNanoView(viewData.nanoView || null);
                            const unlockRes = await axios.get(`${BASE_URL}/api/subscriptions/step-unlock/check`,
                              { params: { email: userEmail, step_id: nextId } });
                            if (unlockRes.data?.status) setCreditUnlocked(unlockRes.data.unlocked);
                          } catch {
                            setMacroView(null); setMicroView(null); setNanoView(null);
                          } finally { setViewsLoading(false); }
                          setsideNav("Current Step");
                        } else {
                          setsideNav("My Journey");
                          navigate("/dashboard/users/my-journey");
                        }
                      } catch {
                        setsideNav("My Journey");
                        navigate("/dashboard/users/my-journey");
                      }
                    } else {
                      setPopup(false); setPopupContent("default"); setPopupDetails("");
                      setsideNav("My Journey");
                      navigate("/dashboard/users/my-journey");
                    }
                  }}>OK</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CurrentStep;
