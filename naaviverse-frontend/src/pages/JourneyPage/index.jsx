import React, { useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { useNavigate } from "react-router-dom";
import "./journey.scss";
import pathIcon from '../../assets/images/assets/naavi-icon2.webp';
import { useCoinContextData } from "../../context/CoinContext";
import { useStore } from "../../components/store/store.ts";
import stepIcon from '../../assets/images/assets/naavi-icon3.webp';
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const parseDuration = (raw) => {
  try {
    const l = JSON.parse(raw);
    const parts = [];
    if (parseInt(l.years) > 0)  parts.push(`${l.years}y`);
    if (parseInt(l.months) > 0) parts.push(`${l.months}m`);
    if (parseInt(l.days) > 0)   parts.push(`${l.days}d`);
    return parts.length > 0 ? parts.join(" ") : null;
  } catch {
    return null;
  }
};

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const IconTarget = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Step Card ──────────────────────────────────────────────────────────────
const StepCard = ({ step, index, onClick, isCompleted }) => {
  const stepNum = step.step_order || index + 1;

  return (
    <div
      className={`step-card${isCompleted ? " step-card--completed" : ""}`}
      onClick={onClick}
    >
      {/* Frosted "Completed" badge visible on hover */}
      {isCompleted && (
        <div className="sc-completed-overlay">
          <div className="sc-completed-badge">
            <IconCheck />
            <span>Completed</span>
          </div>
        </div>
      )}

      <div className="sc-top">
        <div className={`sc-number${isCompleted ? " sc-number--done" : ""}`}>
  <img src={stepIcon} alt="step" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
</div>
      </div>

      <div className="sc-body">
        <div className="sc-title">{step.macro_name}</div>
        <div className="sc-desc">{step.macro_description}</div>
      </div>

      <div className="sc-footer">
        <span className={`sc-cta${isCompleted ? " sc-cta--done" : ""}`}>
          {isCompleted ? "Review Step" : "View Step"} <IconArrow />
        </span>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const JourneyPage = () => {
  const navigate = useNavigate();
  const { setCurrentStepData, setCurrentStepDataLength } = useCoinContextData();
  const { setsideNav } = useStore();

  const [loading,          setLoading]          = useState(true);
  const [journeyPageData,  setJourneyPageData]  = useState(null);
  const [completedStepIds, setCompletedStepIds] = useState(new Set());

  // Read user email once — robust fallback across all auth formats
  const userEmail = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const p = JSON.parse(localStorage.getItem("userProfile") || "null");
      return u?.user?.email || u?.email || p?.email || localStorage.getItem("loginEmail") || null;
    } catch {
      return localStorage.getItem("loginEmail") || null;
    }
  })();

  useEffect(() => {
    const init = async () => {
      let pathId = localStorage.getItem("selectedPathId");
      const pathOwner = localStorage.getItem("selectedPathOwner");

      // ── If stored path belongs to a different user, clear it ──
      if (pathId && pathOwner && userEmail && pathOwner.toLowerCase() !== userEmail.toLowerCase()) {
        localStorage.removeItem("selectedPathId");
        localStorage.removeItem("selectedPathOwner");
        localStorage.removeItem("selectedStepId");
        localStorage.removeItem("selectedStepNumber");
        pathId = null;
      }

      // ── If no pathId, try to restore from backend for THIS user ──
      if (!pathId && userEmail) {
        try {
          const res = await axios.get(`${BASE_URL}/api/userpaths/selected`, {
            params: { email: userEmail },
          });
          if (res.data?.status && res.data?.pathId) {
            pathId = res.data.pathId;
            localStorage.setItem("selectedPathId", pathId);
            localStorage.setItem("selectedPathOwner", userEmail);
          }
        } catch (err) {
          console.error("Failed to restore selectedPathId:", err);
        }
      }

      if (!pathId) {
        setJourneyPageData(null);
        setLoading(false);
        return;
      }

      fetchJourneyData(pathId);
    };

    init();
  }, [userEmail]);

  // Re-fetch when CurrentStep fires completion OR when a new path is selected
  useEffect(() => {
    const handleStepCompleted = () => {
      const pathId = localStorage.getItem("selectedPathId");
      if (pathId) fetchJourneyData(pathId);
    };

    const handlePathSelected = () => {
      const pathId = localStorage.getItem("selectedPathId");
      if (pathId) {
        setLoading(true);
        fetchJourneyData(pathId);
      }
    };

    window.addEventListener("naavi:step-completed", handleStepCompleted);
    window.addEventListener("naavi:path-selected", handlePathSelected);
    window.addEventListener("storage", handlePathSelected);

    return () => {
      window.removeEventListener("naavi:step-completed", handleStepCompleted);
      window.removeEventListener("naavi:path-selected", handlePathSelected);
      window.removeEventListener("storage", handlePathSelected);
    };
  }, [userEmail]);

  const fetchJourneyData = async (pathId) => {
    try {
      // ── 1. Steps  GET /api/userpaths/steps?pathId=xxx ──────────────────
      // Router: router.get("/steps", ...) in userpathRouter.js
      // Returns: { status, data: { name, description, steps: [...] } }
      const stepsRes = await axios.get(`${BASE_URL}/api/userpaths/steps?pathId=${pathId}`);

      if (!stepsRes.data.status) {
        setJourneyPageData(null);
        setLoading(false);
        return;
      }

      const data = stepsRes.data.data;
      if (data?.steps) {
        data.steps = data.steps
          .filter((s) => s.status === "active" || !s.status)
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
      }
      setJourneyPageData(data);

      // ── 2. UserPath doc  GET /api/userpaths?email=xxx&pathId=xxx ───────
      // Router: router.get("/", getUserPath) in userpathRouter.js
      // getUserPath filters by { email, pathId, status:"active" } and returns
      // the full UserPath doc which includes: completedSteps: [ObjectId, ...]
      // completedSteps is populated via $addToSet in the completeStep() controller
      if (!userEmail) return;

      const userPathRes = await axios.get(`${BASE_URL}/api/userpaths`, {
        params: { email: userEmail, pathId },
      });

      if (!userPathRes.data?.status || !Array.isArray(userPathRes.data.data)) return;

      // getUserPath may return multiple docs — find the one for this pathId
      const userPathDoc =
        userPathRes.data.data.find((doc) => String(doc.pathId) === String(pathId)) ||
        userPathRes.data.data[0];

      if (!userPathDoc) return;

      // completedSteps stores step _ids as ObjectId → convert all to strings for comparison
      const rawCompleted = userPathDoc.completedSteps || [];
      setCompletedStepIds(new Set(rawCompleted.map((id) => String(id))));

    } catch (error) {
      console.error("[error] Error fetching journey data:", error);
      setJourneyPageData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step, index) => {
    setsideNav("Current Step");
    setCurrentStepData(step);
    setCurrentStepDataLength(journeyPageData?.steps?.length);
    localStorage.setItem("selectedStepId", step._id);
    localStorage.setItem("selectedStepNumber", step.step_order || index + 1);
    navigate("/dashboard/users/current-step");
  };

  const renderNoPathSelected = () => (
    <div className="no-path-wrap">
      <div className="no-path-icon"><IconTarget /></div>
      <div className="no-path-title">No Path Selected</div>
      <div className="no-path-sub">Go to Paths and select your journey to get started.</div>
      <button className="no-path-btn" onClick={() => { setsideNav("Paths"); navigate("/dashboard/users/paths"); }}>
        Go To Paths <IconArrow />
      </button>
    </div>
  );

  const totalSteps     = journeyPageData?.steps?.length || 0;
  const completedCount = completedStepIds.size;

  return (
    <div className="journeypage">

      {/* ── PATH HEADER ── */}
      {journeyPageData && !loading && (
        <div className="journey-header">
          <div className="jh-left">
            <div className="jh-eyebrow">
              <span className="jh-icon"><IconMap /></span>
              Your Selected Path
            </div>
           <h1 className="jh-title">
  <img src={pathIcon} alt="path" style={{ width: "28px", height: "28px", objectFit: "contain", marginRight: "8px", verticalAlign: "middle" }} />
  {journeyPageData?.nameOfPath || journeyPageData?.name || "N/A"}
</h1>
            <p className="jh-desc">{journeyPageData?.description}</p>
          </div>
          <div className="jh-right">
            <div className="jh-stat">
              <span className="jh-stat-num">{totalSteps}</span>
              <span className="jh-stat-lbl">Total Steps</span>
            </div>
            {completedCount > 0 && (
              <div className="jh-stat jh-stat--completed">
                <span className="jh-stat-num">{completedCount}</span>
                <span className="jh-stat-lbl">Completed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION LABEL ── */}
      {journeyPageData && !loading && (
        <div className="steps-section-head">
          <span className="ssh-label">All Steps</span>
          <div className="ssh-line" />
          <span className="ssh-count">{totalSteps} step{totalSteps !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* ── STEPS GRID ── */}
      <div className="steps-grid">
        {loading ? (
          [1, 2, 3, 4].map(n => (
            <div className="step-card-skeleton" key={n}>
              <Skeleton height={180} borderRadius={14} />
            </div>
          ))
        ) : !localStorage.getItem("selectedPathId") ? (
          renderNoPathSelected()
        ) : journeyPageData?.steps?.length > 0 ? (
          journeyPageData.steps.map((step, index) => {
            // Step _id from the steps collection must match what completeStep()
            // pushed into completedSteps via $addToSet — both are ObjectId strings
            const stepId      = String(step._id || step.step_id || "");
            const isCompleted = completedStepIds.has(stepId);
            return (
              <StepCard
                key={stepId || index}
                step={step}
                index={index}
                isCompleted={isCompleted}
                onClick={() => handleStepClick(step, index)}
              />
            );
          })
        ) : (
          <div className="no-steps-msg">No steps found for this path.</div>
        )}
      </div>

    </div>
  );
};

export default JourneyPage;