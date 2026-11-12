import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Pathview from "../Pathview";
import JourneyPage from "../Pathview/JourneyPage";
import educationIcon from "../../static/images/mapspage/educationIcon.svg";

import { useCoinContextData } from "../../context/CoinContext";
import { GlobalContex } from "../../globalContext";
import { useStore } from "../../components/store/store.ts";
import logActivity from "../../utils/activityLogger";
import UserPathRequestModal from "../UserPathRequestModal/UserPathRequestModal";

import "./mapspage.scss";
import { SvgArrowLeft, SvgClose, SvgClock } from "../../utils/SvgIcons";
import PathFitAnalysis from "../PathFitAnalysis/PathFitAnalysis";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ─── Modal Step Enum ───────────────────────────────────────────
// null        → no modal
// "view"      → view path details (name, desc, Explore / Select / Back)
// "explore"   → show steps inside same modal
// "confirm"   → are you sure?
// "success"   → congratulations

const PathComponent = () => {
  const navigate = useNavigate();
  const { sideNav, setsideNav } = useStore();

  const [coordsOpen, setCoordsOpen] = useState(false);

  // Modal state
  const [modalPath, setModalPath] = useState(null);   // path object
  const [modalStep, setModalStep] = useState(null);   // "view" | "explore" | "confirm" | "success"
  const [pathSteps, setPathSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  const {
    pathItemSelected,
    setPathItemSelected,
    pathItemStep,
    setPathItemStep,
    selectedPathItem,
    setSelectedPathItem,
    showPathDetails,
  } = useCoinContextData();

  const {
    gradeToggle, setGradeToggle,
    curriculumToggle, setCurriculumToggle,
    streamToggle, setStreamToggle,
    performanceToggle, setPerformanceToggle,
    financialToggle, setFinancialToggle,
    personalityToggle, setPersonalityToggle,
    refetchPaths, setRefetchPaths,
  } = useContext(GlobalContex);

  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [approvedPaths, setApprovedPaths] = useState([]);
  const [pathFitMap, setPathFitMap] = useState({});

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem("userProfile");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // ── Stable identity for userProfile to prevent object-ref re-renders ──
  const userProfileId = userProfile?._id || userProfile?.email || null;

  const exploreLoggedRef = useRef(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  // ── Custom Path Request states ──
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestModalInitialGoal, setRequestModalInitialGoal] = useState("");
  const [requestModalTab, setRequestModalTab] = useState("request");
  const [userPathRequests, setUserPathRequests] = useState([]);

  const fetchUserRequests = async () => {
    const email = user?.email || userProfile?.email;
    if (!email) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/path-requests/my-requests?email=${encodeURIComponent(email)}`
      );
      if (res.data?.status) {
        setUserPathRequests(res.data.data || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user?.email, userProfileId]);

  const handleOpenRequestModal = (goal = "") => {
    setRequestModalInitialGoal(goal || "");
    setRequestModalTab("request");
    setRequestModalOpen(true);
  };

  const handleOpenMyRequests = () => {
    setRequestModalInitialGoal("");
    setRequestModalTab("my_requests");
    setRequestModalOpen(true);
    fetchUserRequests();
  };

  const handleSelectCreatedPath = async (createdPathId, pathName) => {
    const resolvedEmail =
      user?.email ||
      user?.user?.email ||
      userProfile?.email ||
      localStorage.getItem("loginEmail") ||
      "";
    if (!resolvedEmail || !createdPathId) return;
    try {
      await axios.post(`${BASE_URL}/api/userpaths/selectpath`, {
        email: resolvedEmail,
        pathId: createdPathId,
      });
      localStorage.setItem("selectedPathId", String(createdPathId));
      localStorage.setItem("selectedPathOwner", resolvedEmail);
      localStorage.setItem("selectedPathName", pathName || "Custom Path");
      localStorage.removeItem("selectedStepId");
      localStorage.removeItem("selectedStepNumber");
      localStorage.removeItem("selectedPathCountry");
      localStorage.removeItem("selectedPathUniversity");
      localStorage.removeItem("selectedPathPathway");
      localStorage.removeItem("selectedPathCourse");
      localStorage.removeItem("selectedPathCountryForId");
      localStorage.removeItem("selectedPathSteps");
      window.dispatchEvent(new Event("naavi:path-selected"));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Select created path error:", err.response?.data || err.message);
      localStorage.setItem("selectedPathId", String(createdPathId));
      localStorage.setItem("selectedPathOwner", resolvedEmail);
      localStorage.setItem("selectedPathName", pathName || "Custom Path");
      window.dispatchEvent(new Event("naavi:path-selected"));
      window.dispatchEvent(new Event("storage"));
    } finally {
      setRequestModalOpen(false);
      setsideNav("My Journey");
      navigate("/dashboard/users/my-journey");
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const email = user?.email;
        if (!email) return;
        const res = await axios.get(`${BASE_URL}/api/users/get/${email}`);
        if (res.data.status) {
          const newProfile = res.data.data;
          // Only update state if profile actually changed (prevents re-render cascade)
          setUserProfile((prev) => {
            const prevId = prev?._id || prev?.email;
            const newId = newProfile?._id || newProfile?.email;
            if (prevId === newId && JSON.stringify(prev) === JSON.stringify(newProfile)) {
              return prev; // same reference — no re-render
            }
            return newProfile;
          });
          localStorage.setItem("userProfile", JSON.stringify(newProfile));
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (exploreLoggedRef.current) return;
    exploreLoggedRef.current = true;
    logActivity({
      type: "explore",
      title: "Browsing learning paths",
      desc: "User opened the Explore Paths page",
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchApprovedPaths = async () => {
      try {
        setLoading(true);
        const params = {};
        if (gradeToggle && userProfile?.grade) params.grade = userProfile.grade;
        if (curriculumToggle && userProfile?.curriculum) params.curriculum = userProfile.curriculum;
        if (streamToggle && userProfile?.stream) params.stream = userProfile.stream;
        if (performanceToggle && userProfile?.performance) params.performance = userProfile.performance;
        if (financialToggle && userProfile?.financialSituation) params.financial = userProfile.financialSituation;
        if (personalityToggle && userProfile?.personality) params.personality = userProfile.personality;

        const res = await axios.get(`${BASE_URL}/api/paths/active`, {
          params,
          signal: controller.signal,
        });
        setApprovedPaths(res.data.data || []);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === "CanceledError") return; // aborted — ignore
        console.error("Failed to load approved paths:", err);
        setApprovedPaths([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchApprovedPaths();

    return () => controller.abort(); // cancel stale request on re-trigger
  }, [
    refetchPaths,
    gradeToggle, curriculumToggle, streamToggle,
    performanceToggle, financialToggle, personalityToggle,
    userProfileId,  // ← stable string instead of object reference
  ]);

  // ── Fetch Batch Fit Analysis for Explore Paths ─────────────────
  useEffect(() => {
    if (!approvedPaths || approvedPaths.length === 0) {
      setPathFitMap({});
      return;
    }

    const fetchBatchFit = async () => {
      try {
        const pathIds = approvedPaths.map((p) => p._id).filter(Boolean);
        const res = await axios.post(`${BASE_URL}/api/paths/batch-fit-analysis`, {
          email: user?.email || userProfile?.email,
          profile: userProfile,
          pathIds,
        });
        if (res.data?.status && res.data.data) {
          setPathFitMap(res.data.data);
        }
      } catch (err) {
        console.warn("Batch fit analysis fetch failed:", err?.message);
      }
    };

    fetchBatchFit();
  }, [approvedPaths, userProfileId, userProfile?.stream, userProfile?.grade, userProfile?.personality]);

  // ── Open "View Path" modal ────────────────────────────────────
  const handleViewPath = (path) => {
    setModalPath(path);
    setModalStep("view");
    setPathSteps([]);
  };

  // ── Close all modals & reset state ───────────────────────────
  const closeModal = () => {
    setModalStep(null);
    setModalPath(null);
    setPathSteps([]);
    // Also reset legacy pathItemSelected state so returning to paths is clean
    setPathItemSelected(false);
    setSelectedPathItem(null);
  };

  // ── Explore Path: fetch steps & show inside modal ─────────────
  const handleExplore = async () => {
    if (!modalPath?._id) return;
    setModalStep("explore");
    setStepsLoading(true);
    try {
      // 1. Fetch via canonical /api/userpaths/steps so step count and ordering match My Journey & UserTopHeader
      const res = await axios.get(`${BASE_URL}/api/userpaths/steps`, {
        params: { pathId: modalPath._id },
      });
      let stepsList = res?.data?.data?.steps;
      if (!Array.isArray(stepsList) || stepsList.length === 0) {
        // Fallback to /api/steps/get
        const fallbackRes = await axios.get(`${BASE_URL}/api/steps/get`, {
          params: { path_id: modalPath._id },
        });
        stepsList = fallbackRes?.data?.data || [];
      }
      const sorted = (stepsList || [])
        .filter((s) => s.status === "active")
        .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
      setPathSteps(sorted);
    } catch {
      try {
        const fallbackRes = await axios.get(`${BASE_URL}/api/steps/get`, {
          params: { path_id: modalPath._id },
        });
        const sorted = (fallbackRes?.data?.data || [])
          .filter((s) => s.status === "active")
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
        setPathSteps(sorted);
      } catch {
        setPathSteps([]);
      }
    } finally {
      setStepsLoading(false);
    }
  };

  // ── Confirm selection ─────────────────────────────────────────
  const handleConfirmSelect = async () => {
    const resolvedEmail =
      user?.email ||
      user?.user?.email ||
      userProfile?.email ||
      localStorage.getItem("loginEmail") ||
      "";
    const pathId = modalPath?._id;
    if (!resolvedEmail || !pathId) {
      console.warn("Missing email or pathId for selection:", { resolvedEmail, pathId });
      return;
    }

    try {
      setConfirmLoading(true);

      // 1. Post to backend FIRST so MongoDB saves user.selectedPath before any client events fire
      await axios.post(`${BASE_URL}/api/userpaths/selectpath`, {
        email: resolvedEmail,
        pathId,
      });

      // 2. Set localStorage with complete path info
      localStorage.setItem("selectedPathId", String(pathId));
      localStorage.setItem("selectedPathOwner", resolvedEmail);
      const pName = modalPath?.nameOfPath || modalPath?.name || "";
      localStorage.setItem("selectedPathName", pName);

      // Clean up previous path caches
      localStorage.removeItem("selectedPathCountry");
      localStorage.removeItem("selectedPathUniversity");
      localStorage.removeItem("selectedPathPathway");
      localStorage.removeItem("selectedPathCourse");
      localStorage.removeItem("selectedPathCountryForId");
      localStorage.removeItem("selectedStepId");
      localStorage.removeItem("selectedStepNumber");

      let stepsCount = pathSteps?.length || 0;
      if (!stepsCount) {
        try {
          const stepRes = await axios.get(`${BASE_URL}/api/userpaths/steps`, {
            params: { pathId },
          });
          const list = stepRes?.data?.data?.steps;
          if (Array.isArray(list) && list.length > 0) {
            stepsCount = list.filter((s) => s.status === "active").length;
          }
        } catch {
          // ignore
        }
      }
      if (!stepsCount) {
        try {
          const stepRes = await axios.get(`${BASE_URL}/api/steps/get`, {
            params: { path_id: pathId },
          });
          stepsCount = stepRes.data?.data?.length || 0;
        } catch {
          stepsCount =
            modalPath?.StepDetails?.filter(s => s.status === "active")?.length ||
            modalPath?.the_ids?.length ||
            modalPath?.total_steps ||
            0;
        }
      }
      if (stepsCount > 0) {
        localStorage.setItem("selectedPathSteps", `${stepsCount} Steps`);
      } else {
        localStorage.removeItem("selectedPathSteps");
      }

      // 3. Dispatch events AFTER backend save and localStorage update
      window.dispatchEvent(new Event("naavi:path-selected"));
      window.dispatchEvent(new Event("storage"));

      logActivity({
        type: "path",
        title: `Selected path: ${pName}`,
        desc: `User enrolled in "${pName}"`,
        pathId: pathId,
        pathName: pName,
        status: "completed",
      });

      setModalStep("success");

      // Auto-navigate after 1.8 s to My Journey
      setTimeout(() => {
        closeModal();
        setsideNav("My Journey");
        navigate("/dashboard/users/my-journey");
      }, 1800);
    } catch (err) {
      console.error("Select path error:", err.response?.data || err.message);
      // Fallback: save to localStorage and dispatch so UI still reflects selection
      localStorage.setItem("selectedPathId", String(pathId));
      localStorage.setItem("selectedPathOwner", resolvedEmail);
      localStorage.setItem("selectedPathName", modalPath?.nameOfPath || modalPath?.name || "");
      window.dispatchEvent(new Event("naavi:path-selected"));
      window.dispatchEvent(new Event("storage"));
      setModalStep("success");
      setTimeout(() => {
        closeModal();
        setsideNav("My Journey");
        navigate("/dashboard/users/my-journey");
      }, 1800);
    } finally {
      setConfirmLoading(false);
    }
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

  const coordinates = [
    { label: "Grade", value: userProfile?.grade, toggle: gradeToggle, setToggle: setGradeToggle },
    { label: "Curriculum", value: userProfile?.curriculum, toggle: curriculumToggle, setToggle: setCurriculumToggle },
    { label: "Stream", value: userProfile?.stream, toggle: streamToggle, setToggle: setStreamToggle },
    { label: "Performance", value: userProfile?.performance, toggle: performanceToggle, setToggle: setPerformanceToggle },
    { label: "Financial", value: userProfile?.financialSituation, toggle: financialToggle, setToggle: setFinancialToggle },
    { label: "Personality", value: userProfile?.personality, toggle: personalityToggle, setToggle: setPersonalityToggle },
  ];

  const isModalOpen = !!modalStep;

  return (
    <div className="mapspage-modern">
      {showPathDetails ? (
        <JourneyPage />
      ) : (
        <div className="maps-main-container">
          <div className="maps-paths-area">
            <Pathview
              paths={approvedPaths}
              loading={loading}
              onAdjustCoordinates={() => setCoordsOpen(true)}
              onViewPath={handleViewPath}
              onRequestPath={handleOpenRequestModal}
              onOpenMyRequests={handleOpenMyRequests}
              myRequestsCount={userPathRequests.length}
              readyRequestsCount={userPathRequests.filter((r) => r.status === "created").length}
              pathFitMap={pathFitMap}
              userProfile={userProfile}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL SYSTEM — backdrop only covers main content
      ══════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          className="content-modal-backdrop"
          onClick={closeModal}
        />
      )}

      {/* ── VIEW PATH MODAL ── */}
      {modalStep === "view" && modalPath && (
        <div className="path-flow-modal path-flow-modal--fit">
          <button className="pfm-close" onClick={closeModal} title="Close"><SvgClose size={14} /></button>
          <div className="pfm-content-scroll">

          <div className="pfm-icon">
            {(modalPath.nameOfPath || "P").charAt(0).toUpperCase()}
          </div>
          <h3 className="pfm-title">{modalPath.nameOfPath || modalPath.name}</h3>


          {modalPath.description && modalPath.description !== "-" && (
            <p className="pfm-desc" style={{ marginTop: 0 }}>{modalPath.description}</p>
          )}

            <PathFitAnalysis path={modalPath} userProfile={userProfile} />

            <div className="pfm-btns pfm-btns--scroll">
              <button className="pfm-btn pfm-btn--outline" onClick={handleExplore}>
                Explore Path
              </button>
              <button className="pfm-btn pfm-btn--primary" onClick={() => setModalStep("confirm")}>
                Select This Path
              </button>
              <button className="pfm-btn pfm-btn--ghost" onClick={closeModal}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLORE STEPS MODAL ── */}
      {modalStep === "explore" && modalPath && (
        <div className="path-flow-modal path-flow-modal--wide">
          <div className="pfm-top-bar">
            <button className="pfm-back-btn" onClick={() => setModalStep("view")}>← Back</button>
            <button className="pfm-close" onClick={closeModal} title="Close" aria-label="Close"><SvgClose size={14} /></button>
          </div>

          <div className="pfm-explore-header">
            <div className="pfm-icon pfm-icon--sm">
              {(modalPath.nameOfPath || "P").charAt(0).toUpperCase()}
            </div>
            <div className="pfm-explore-header__text">
              <h3 className="pfm-title pfm-title--left">{modalPath.nameOfPath}</h3>
            </div>
          </div>

          <div className="pfm-steps-scroll">
            {stepsLoading ? (
              <div className="pfm-steps-loading">
                <div className="pfm-spinner" />
                <span>Loading steps…</span>
              </div>
            ) : pathSteps.length === 0 ? (
              <p className="pfm-no-steps">No steps found for this path.</p>
            ) : (
              <div className="pfm-steps-list">
                {pathSteps.map((step, idx) => {
                  const dur = parseDuration(step.macro_length);
                  return (
                    <div className="pfm-step-card" key={step._id}>
                      <div className="pfm-step-num">{step.step_order || idx + 1}</div>
                      <div className="pfm-step-body">
                        <div className="pfm-step-name">{step.macro_name}</div>
                        {step.macro_description && (
                          <div className="pfm-step-desc">{step.macro_description}</div>
                        )}
                        {dur && <div className="pfm-step-dur"><SvgClock size={16} style={{ marginRight: 3, verticalAlign: "middle", flexShrink: 0 }} />{dur}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pfm-btns pfm-btns--bottom">
            <button
              className="pfm-btn pfm-btn--primary"
              onClick={() => setModalStep("confirm")}
            >
              Select This Path
            </button>
          </div>
        </div>
      )}

     {modalStep === "confirm" && modalPath && (
  <div className="path-flow-modal">
    <button className="pfm-close" onClick={closeModal} title="Close" aria-label="Close"><SvgClose size={14} /></button>

    {/* CENTERED ICON - no wrapper div */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shield shape */}
        <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" fill="#3b82f6" opacity="0.15"/>
        <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="#3b82f6" strokeWidth="1.8" strokeLinejoin="round"/>
        {/* Checkmark inside */}
        <path d="M8.5 12L11 14.5L15.5 10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>

    <h3 className="pfm-title">Confirm Selection</h3>
    <p className="pfm-sub">Are you sure you want to select this path?</p>
    <span className="pfm-tag pfm-tag--lg">
      {modalPath.nameOfPath || modalPath.name}
    </span>

    <div className="pfm-btns">
      <button
        className="pfm-btn pfm-btn--primary"
        onClick={handleConfirmSelect}
        disabled={confirmLoading}
      >
        {confirmLoading ? "Confirming…" : "Yes, Select"}
      </button>
      <button
        className="pfm-btn pfm-btn--ghost"
        onClick={() => setModalStep(pathSteps.length ? "explore" : "view")}
      >
        ← Cancel
      </button>
    </div>
  </div>
)}

      {/* ── SUCCESS MODAL ── */}
      {modalStep === "success" && modalPath && (
        <div className="path-flow-modal">
          <button className="pfm-close" onClick={closeModal} title="Close" aria-label="Close"><SvgClose size={14} /></button>

          <div className="pfm-icon pfm-icon--success">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
</div>
          <h3 className="pfm-title pfm-title--success">Congratulations!</h3>
          <p className="pfm-sub">You've successfully enrolled in:</p>
          <span className="pfm-tag pfm-tag--lg">
            {modalPath.nameOfPath || modalPath.name}
          </span>
          <small className="pfm-redirect">Redirecting to My Journey…</small>
        </div>
      )}

      {/* ─── COORDINATES RIGHT SIDEBAR ─── */}
      {coordsOpen && (
        <div className="coords-overlay" onClick={() => setCoordsOpen(false)} />
      )}
      <div className={`coords-sidebar ${coordsOpen ? "coords-sidebar--open" : ""}`}>
        <div className="coords-sidebar__header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* ── Education icon ── */}
            <div className="coords-sidebar__icon">
              <img
                src={educationIcon}
                alt="Education"
                width="32"
                height="32"
              />
            </div>
            <div>
              <p className="coords-sidebar__label">Education</p>
              <h3 className="coords-sidebar__title">My Coordinates</h3>
            </div>
          </div>
          <button className="coords-sidebar__close" onClick={() => setCoordsOpen(false)} title="Close" aria-label="Close"><SvgClose size={14} /></button>
        </div>

        <span className="coords-sidebar__hint" style={{ display: 'block' }}>
          Toggle filters to personalise your path recommendations.
        </span>

        <div className="coords-list">
          {coordinates.map(({ label, value, toggle, setToggle }) => (
            <div className="coord-row" key={label}>
              <div className="coord-row__left">
                <span className="coord-row__label">{label}</span>
                <span className="coord-row__value">{value || "Not set"}</span>
              </div>
              <button
                className={`toggle-pill ${toggle ? "toggle-pill--on" : ""}`}
                onClick={() => setToggle(!toggle)}
                aria-pressed={toggle}
              >
                <span className="toggle-pill__knob" />
              </button>
            </div>
          ))}
        </div>

        <button
          className="btn-primary coords-sidebar__apply"
          onClick={() => {
            setRefetchPaths(!refetchPaths);
            setCoordsOpen(false);
          }}
        >
          Apply & Find Paths
        </button>
      </div>

      {/* ── Custom Path Request Modal (User ↔ Super Admin) ── */}
      <UserPathRequestModal
        isOpen={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          fetchUserRequests();
        }}
        initialGoal={requestModalInitialGoal}
        userProfile={userProfile}
        initialTab={requestModalTab}
        onSelectCreatedPath={handleSelectCreatedPath}
      />
    </div>
  );
};

export default PathComponent;