import CustomSelect from '../../pages/accDashbaoard/CustomSelect';
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiSend,
} from "react-icons/fi";
import "./SuperAdminCustomPathBuilder.scss";
import { SvgSparkles } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4545";

// ── SVG Category Icons ─────────────────────────────────────
const IconVendor = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMentor = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDistributor = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 9.4 7.55 4.24M3.29 7 12 12l8.71-5M12 22V12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 15v6M15 18h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const IconInstitution = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CATEGORIES = [
  { key: "vendors", label: "Vendors", Icon: IconVendor, singular: "Vendor" },
  { key: "mentors", label: "Mentors", Icon: IconMentor, singular: "Mentor" },
  { key: "distributors", label: "Distributors", Icon: IconDistributor, singular: "Distributor" },
  { key: "institutions", label: "Institutions", Icon: IconInstitution, singular: "Institution" },
];

export const VIEWS = [
  { key: "macro", label: "Macro View", tag: "Foundational / Free", color: "#0d6b6e" },
  { key: "micro", label: "Micro View", tag: "Intermediate / Structured", color: "#2563eb" },
  { key: "nano", label: "Nano View", tag: "Advanced / Expert", color: "#7c3aed" },
];

export const GRADE_LIST = ["9", "10", "11", "12"];
export const GRADE_AVG_LIST = [
  "0% - 35%",
  "36% - 60%",
  "61% - 75%",
  "76% - 85%",
  "86% - 95%",
  "96% - 100%",
];
export const CURRICULUM_LIST = ["IB", "IGCSE", "CBSE", "ICSE", "Nordic"];
export const STREAM_LIST = ["MPC", "BIPC", "CEC", "MEC", "HEC"];
export const FINANCE_LIST = ["0-25L", "25L-75L", "75L-3CR", "3CR+", "Other"];
export const PERSONALITY_LIST = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];
export const PATH_TYPES = ["education", "career", "immigration"];
export const PATH_CATS = ["Degree", "K12"];

// Helper to create a clean, unpopulated step without hardcoded sample sentences
function createCleanStep(stepOrder = 1) {
  return {
    name: "",
    description: "",
    duration: "",
    macro: {
      name: "",
      desc: "",
      instructions: "",
      duration: "",
      access: "free",
      marketplace: [],
    },
    micro: {
      name: "",
      desc: "",
      instructions: "",
      duration: "",
      access: "paid",
      marketplace: [],
    },
    nano: {
      name: "",
      desc: "",
      instructions: "",
      duration: "",
      access: "paid",
      marketplace: [],
    },
  };
}

function normalizeRawStep(raw, idx = 0) {
  const normMarket = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => ({
        name: item.name || "",
        category: item.category || item.role || "vendors",
        role: item.role || item.category || "vendors",
        cost: item.cost || item.price || "Free",
        duration: item.duration || "1 Month",
        discount: item.discount || "0%",
        access: item.access || "Free",
        goal: item.goal || item.why || "",
        outcomes: item.outcomes || "",
      }))
      .filter((it) => it.name && it.name.trim() !== "");
  };

  const stepName = raw.name || raw.macro_name || `Step ${idx + 1}`;
  const stepDesc = raw.description || raw.macro_description || "";
  const stepDuration = raw.macro_length || "1 Year";

  return {
    name: stepName,
    description: stepDesc,
    duration: typeof stepDuration === "string" ? stepDuration : "1 Year",
    macro: {
      name: raw.macro_name || raw.macro?.name || stepName,
      desc: raw.macro_description || raw.macro?.desc || stepDesc,
      instructions: raw.macro_instructions || raw.macro?.instructions || "",
      duration: raw.macro_length || "1 Year",
      access: raw.macro_access || "free",
      marketplace: normMarket(raw.macro_marketplace || raw.macro?.marketplace),
    },
    micro: {
      name: raw.micro_name || raw.micro?.name || `${stepName} (Micro)`,
      desc: raw.micro_description || raw.micro?.desc || stepDesc,
      instructions: raw.micro_instructions || raw.micro?.instructions || "",
      duration: raw.micro_length || "1 Year",
      access: raw.micro_access || "paid",
      marketplace: normMarket(raw.micro_marketplace || raw.micro?.marketplace),
    },
    nano: {
      name: raw.nano_name || raw.nano?.name || `${stepName} (Nano)`,
      desc: raw.nano_description || raw.nano?.desc || stepDesc,
      instructions: raw.nano_instructions || raw.nano?.instructions || "",
      duration: raw.nano_length || "6 Months",
      access: raw.nano_access || "paid",
      marketplace: normMarket(raw.nano_marketplace || raw.nano?.marketplace),
    },
  };
}

export default function SuperAdminCustomPathBuilder({
  request,
  onBack,
  onPathCreated,
}) {
  const [activeStage, setActiveStage] = useState(1); // 1: Path & Fit, 2: Milestones & Views, 3: Marketplace, 4: Review & Publish
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Stage 1: Path & Fit Details
  const [nameOfPath, setNameOfPath] = useState("");
  const [program, setProgram] = useState("");
  const [destinationInstitution, setDestinationInstitution] = useState("");
  const [sector, setSector] = useState("");
  const [destinationDegree, setDestinationDegree] = useState("");
  const [description, setDescription] = useState("");
  const [pathType, setPathType] = useState("education");
  const [pathCat, setPathCat] = useState("Degree");
  const [durationYears, setDurationYears] = useState("3");
  const [durationMonths, setDurationMonths] = useState("0");
  const [durationDays, setDurationDays] = useState("0");

  // Coordinates
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState([]);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [selectedFinance, setSelectedFinance] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState("");
  const [selectedGradeAvg, setSelectedGradeAvg] = useState([]);
  const [targetCountry, setTargetCountry] = useState("");
  const [targetCity, setTargetCity] = useState("");

  // Stage 2 & 3: Steps & Multi-View Marketplace
  const [steps, setSteps] = useState([createCleanStep(1)]);
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);
  const [selectedViewKey, setSelectedViewKey] = useState("macro");
  const [selectedMarketCat, setSelectedMarketCat] = useState("vendors");

  // Marketplace item form
  const [marketForm, setMarketForm] = useState({
    name: "",
    cost: "",
    duration: "",
    discount: "",
    access: "Free",
    goal: "",
    outcomes: "",
  });

  // Stage 4: Admin Notes
  const [adminNotes, setAdminNotes] = useState("");

  const isEditMode = Boolean(
    request?.createdPathId || request?.status === "created"
  );

  // Initialize fields
  useEffect(() => {
    if (request) {
      setErrorMsg("");
      setActiveStage(1);
      setSelectedStepIdx(0);
      setSelectedViewKey("macro");
      setSelectedMarketCat("vendors");

      const initFromRequest = () => {
        const goal = request.targetGoal || "";
        const inst = request.targetInstitution || "";
        const sec = request.sector || "";
        const lvl = request.educationLevel || "";
        const timeLine = request.targetTimeline || "";

        setNameOfPath(goal);
        setProgram(goal);
        setDestinationInstitution(inst);
        setSector(sec);
        setDestinationDegree(lvl);
        setDescription(request.goalDetails || "");
        setPathType("education");
        setPathCat(lvl.toLowerCase().includes("high") ? "K12" : "Degree");

        const yearMatch = timeLine.match(/(\d+)\s*Year/i);
        const monthMatch = timeLine.match(/(\d+)\s*Month/i);
        setDurationYears(yearMatch ? yearMatch[1] : "3");
        setDurationMonths(monthMatch ? monthMatch[1] : "0");
        setDurationDays("0");

        setSelectedGrades([]);
        setSelectedCurriculum([]);
        setSelectedStreams([]);
        setSelectedFinance([]);
        setSelectedPersonality("");
        setSelectedGradeAvg([]);
        setTargetCountry(inst ? "United States" : "");
        setTargetCity("");
        setAdminNotes("");

        // Start with a clean unpopulated step structure
        setSteps([createCleanStep(1)]);
      };

      if (request.createdPathId) {
        setLoadingExisting(true);
        axios
          .get(`${BASE_URL}/api/userpaths/steps?pathId=${request.createdPathId}`)
          .then((res) => {
            if (res.data?.status && res.data.data) {
              const p = res.data.data.path || res.data.data || {};
              const stList = res.data.data.steps || p.steps || [];

              setNameOfPath(p.nameOfPath || p.name || request.targetGoal || "");
              setProgram(p.program || p.destination_degree || request.targetGoal || "");
              setDestinationInstitution(p.destination_institution || request.targetInstitution || "");
              setSector(p.sector || request.sector || "");
              setDestinationDegree(p.destination_degree || request.educationLevel || "");
              setDescription(p.description || request.goalDetails || "");
              setPathType(p.path_type || "education");
              setPathCat(p.path_cat || "Degree");

              if (p.duration) {
                setDurationYears(p.duration.years !== undefined ? String(p.duration.years) : "3");
                setDurationMonths(p.duration.months !== undefined ? String(p.duration.months) : "0");
                setDurationDays(p.duration.days !== undefined ? String(p.duration.days) : "0");
              }

              if (Array.isArray(p.grade)) setSelectedGrades(p.grade);
              if (Array.isArray(p.curriculum)) setSelectedCurriculum(p.curriculum);
              if (Array.isArray(p.stream)) setSelectedStreams(p.stream);
              if (Array.isArray(p.financialSituation)) setSelectedFinance(p.financialSituation);
              if (p.personality) setSelectedPersonality(p.personality);
              if (Array.isArray(p.grade_avg)) setSelectedGradeAvg(p.grade_avg);
              if (p.country) setTargetCountry(p.country);
              if (p.city) setTargetCity(p.city);

              setAdminNotes(request.adminNotes || p.adminNotes || "");

              if (stList.length > 0) {
                setSteps(stList.map((s, idx) => normalizeRawStep(s, idx)));
              } else {
                initFromRequest();
              }
            } else {
              initFromRequest();
            }
          })
          .catch((err) => {
            console.warn("Could not load existing steps, initializing from request:", err);
            initFromRequest();
          })
          .finally(() => {
            setLoadingExisting(false);
          });
      } else {
        initFromRequest();
      }
    }
  }, [request]);

  if (!request) return null;

  // Toggle helpers for multi-select arrays
  const toggleArrayItem = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Step operations
  const handleAddStep = () => {
    const nextIdx = steps.length + 1;
    const newStep = createCleanStep(nextIdx);
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepIdx(steps.length);
  };

  const handleRemoveStep = (idx) => {
    if (steps.length <= 1) {
      alert("A pathway must have at least one milestone step.");
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setSelectedStepIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  // Marketplace actions
  const handleAddMarketplaceItem = () => {
    const name = (marketForm.name || "").trim();
    if (!name) {
      alert("Please enter a name for the marketplace listing.");
      return;
    }

    const newItem = {
      name,
      category: selectedMarketCat,
      role: selectedMarketCat,
      cost: (marketForm.cost || "Free").trim(),
      duration: (marketForm.duration || "").trim(),
      discount: (marketForm.discount || "0%").trim(),
      access: marketForm.access || "Free",
      goal: (marketForm.goal || "").trim(),
      outcomes: (marketForm.outcomes || "").trim(),
    };

    setSteps((prev) => {
      const copy = [...prev];
      const curList = copy[selectedStepIdx]?.[selectedViewKey]?.marketplace || [];
      copy[selectedStepIdx] = {
        ...copy[selectedStepIdx],
        [selectedViewKey]: {
          ...copy[selectedStepIdx][selectedViewKey],
          marketplace: [...curList, newItem],
        },
      };
      return copy;
    });

    setMarketForm({
      name: "",
      cost: "",
      duration: "",
      discount: "",
      access: "Free",
      goal: "",
      outcomes: "",
    });
  };

  const handleRemoveMarketplaceItem = (itemIdx) => {
    setSteps((prev) => {
      const copy = [...prev];
      const curList = copy[selectedStepIdx]?.[selectedViewKey]?.marketplace || [];
      copy[selectedStepIdx] = {
        ...copy[selectedStepIdx],
        [selectedViewKey]: {
          ...copy[selectedStepIdx][selectedViewKey],
          marketplace: curList.filter((_, i) => i !== itemIdx),
        },
      };
      return copy;
    });
  };

  // Submit and Publish
  const handleSaveAndPublish = async () => {
    if (!nameOfPath.trim()) {
      setErrorMsg("Path Title / Goal Name is required.");
      setActiveStage(1);
      return;
    }

    if (steps.length === 0 || !steps[0].name.trim()) {
      setErrorMsg("Please provide at least 1 milestone step with a name.");
      setActiveStage(2);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const totalDays =
        (parseInt(durationYears) || 0) * 365 +
        (parseInt(durationMonths) || 0) * 30 +
        (parseInt(durationDays) || 0);

      const payload = {
        nameOfPath: nameOfPath.trim(),
        program: program.trim() || nameOfPath.trim(),
        destination_institution: destinationInstitution.trim(),
        destination_degree: destinationDegree.trim() || "Undergraduate Degree",
        description: description.trim(),
        sector: sector.trim(),
        path_type: pathType,
        path_cat: pathCat,
        length: totalDays > 0 ? totalDays : 365,
        duration: {
          years: parseInt(durationYears) || 3,
          months: parseInt(durationMonths) || 0,
          days: parseInt(durationDays) || 0,
          totalDays: totalDays > 0 ? totalDays : 365,
        },
        grade: selectedGrades,
        curriculum: selectedCurriculum,
        stream: selectedStreams,
        financialSituation: selectedFinance,
        personality: selectedPersonality,
        grade_avg: selectedGradeAvg,
        country: targetCountry.trim(),
        city: targetCity.trim(),
        steps: steps.map((s, idx) => ({
          step_order: idx + 1,
          name: s.name.trim() || `Step ${idx + 1}`,
          description: s.description.trim() || s.macro?.desc?.trim() || "",
          macro_name: s.macro?.name?.trim() || s.name.trim() || `Step ${idx + 1}`,
          macro_description: s.macro?.desc?.trim() || s.description.trim() || "",
          macro_length: s.macro?.duration?.trim() || s.duration.trim() || "1 Year",
          macro_access: s.macro?.access || "free",
          macro_instructions: s.macro?.instructions?.trim() || "",
          macro_marketplace: s.macro?.marketplace || [],

          micro_name: s.micro?.name?.trim() || `${s.name.trim() || `Step ${idx + 1}`} (Micro)`,
          micro_description: s.micro?.desc?.trim() || s.description.trim() || "",
          micro_length: s.micro?.duration?.trim() || "1 Year",
          micro_access: s.micro?.access || "paid",
          micro_instructions: s.micro?.instructions?.trim() || "",
          micro_marketplace: s.micro?.marketplace || [],

          nano_name: s.nano?.name?.trim() || `${s.name.trim() || `Step ${idx + 1}`} (Nano)`,
          nano_description: s.nano?.desc?.trim() || s.description.trim() || "",
          nano_length: s.nano?.duration?.trim() || "6 Months",
          nano_access: s.nano?.access || "paid",
          nano_instructions: s.nano?.instructions?.trim() || "",
          nano_marketplace: s.nano?.marketplace || [],
        })),
        adminNotes: adminNotes.trim(),
      };

      const targetReqId = request._id || request.id;
      if (!targetReqId) {
        setErrorMsg("Request identifier not found. Please return and re-open the request.");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/path-requests/${targetReqId}/create-path`,
        payload
      );

      if (res.data?.status) {
        if (onPathCreated) {
          onPathCreated(res.data.data.createdPath, res.data.data.request);
        }
      } else {
        setErrorMsg(res.data?.message || "Failed to publish pathway.");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to publish pathway."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[selectedStepIdx] || steps[0] || {};
  const currentViewObj = currentStep[selectedViewKey] || {};
  const activeMarketplaceItems = (currentViewObj.marketplace || []).filter(
    (it) => it.category === selectedMarketCat
  );

  return (
    <div className="sacp-page-container">
      {/* ── Page Header & Compact Request Context ── */}
      <div className="sacp-page-header">
        <div className="sacp-header-top-row">
          <button type="button" className="sacp-back-action-btn" onClick={onBack}>
            <FiArrowLeft /> Back to Request Details
          </button>
          <span className={`sacp-status-tag status-${request.status}`}>
            {request.status === "created"
              ? "Pathway Ready"
              : request.status === "in_progress"
              ? "Designing"
              : "Pending Review"}
          </span>
        </div>

        <div className="sacp-header-main-titles">
          <h2>Create Custom Pathway</h2>
          <p>
            Configure the academic specifications, milestones, learning views, and marketplace recommendations for this student request.
          </p>
        </div>

        {/* Compact Request Context Banner */}
        <div className="sacp-request-summary-bar">
          <div className="summary-item">
            <span className="lbl">Request ID:</span>
            <span className="val badge-id">{request.requestId || "PR"}</span>
          </div>
          <div className="summary-item">
            <span className="lbl">Student:</span>
            <span className="val">{request.userName || "Student"}</span>
          </div>
          <div className="summary-item summary-item-email">
            <span className="lbl">Email:</span>
            <span className="val val-email" title={request.userEmail}>{request.userEmail}</span>
          </div>
          <div className="summary-item">
            <span className="lbl">Requested Goal:</span>
            <span className="val highlight">{request.targetGoal}</span>
          </div>
          <div className="summary-item">
            <span className="lbl">Target Institution:</span>
            <span className="val">{request.targetInstitution || "Not specified"}</span>
          </div>
          <div className="summary-item">
            <span className="lbl">Status:</span>
            <span className="val">{request.status}</span>
          </div>
        </div>
      </div>

      {/* ── 4-Stage Stepper Navigation Bar ── */}
      <div className="sacp-stepper-bar">
        <button
          type="button"
          className={`sacp-step-tab ${activeStage === 1 ? "active" : activeStage > 1 ? "completed" : ""}`}
          onClick={() => setActiveStage(1)}
        >
          <span className="step-num">1</span>
          <span className="step-label">Path & Fit Specs</span>
        </button>
        <div className="step-divider" />
        <button
          type="button"
          className={`sacp-step-tab ${activeStage === 2 ? "active" : activeStage > 2 ? "completed" : ""}`}
          onClick={() => setActiveStage(2)}
        >
          <span className="step-num">2</span>
          <span className="step-label">Milestones & 3 Views</span>
        </button>
        <div className="step-divider" />
        <button
          type="button"
          className={`sacp-step-tab ${activeStage === 3 ? "active" : activeStage > 3 ? "completed" : ""}`}
          onClick={() => setActiveStage(3)}
        >
          <span className="step-num">3</span>
          <span className="step-label">Marketplace Partners</span>
        </button>
        <div className="step-divider" />
        <button
          type="button"
          className={`sacp-step-tab ${activeStage === 4 ? "active" : ""}`}
          onClick={() => setActiveStage(4)}
        >
          <span className="step-num">4</span>
          <span className="step-label">Review & Publish</span>
        </button>
      </div>

      {/* Error message banner */}
      {errorMsg && (
        <div className="sacp-error-banner">
          <FiAlertCircle /> {errorMsg}
        </div>
      )}

      {/* ── Main Working Space ── */}
      <div className="sacp-page-body">
        {loadingExisting ? (
          <div className="sacp-loading-box">
            <div className="sacp-spinner" />
            <span>Loading existing pathway data...</span>
          </div>
        ) : (
          <>
            {/* ── STAGE 1: PATH & FIT DETAILS ── */}
            {activeStage === 1 && (
              <div className="sacp-stage-content">
                <div className="sacp-card-section">
                  <h4 className="sacp-section-heading">Basic Information & Academic Target</h4>
                  <div className="sacp-grid-2col">
                    <div className="sacp-field sacp-col-span-2">
                      <label>
                        Path Name / Title <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        value={nameOfPath}
                        onChange={(e) => setNameOfPath(e.target.value)}
                        placeholder="e.g. Stanford University AI & Computer Science Pathway"
                      />
                    </div>

                    <div className="sacp-field">
                      <label>Target Institution / University</label>
                      <input
                        type="text"
                        value={destinationInstitution}
                        onChange={(e) => setDestinationInstitution(e.target.value)}
                        placeholder="e.g. Stanford University"
                      />
                    </div>

                    <div className="sacp-field">
                      <label>Target Degree / Award Level</label>
                      <input
                        type="text"
                        value={destinationDegree}
                        onChange={(e) => setDestinationDegree(e.target.value)}
                        placeholder="e.g. Bachelor of Science in CS"
                      />
                    </div>

                    <div className="sacp-field">
                      <label>Program Name</label>
                      <input
                        type="text"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        placeholder="e.g. Artificial Intelligence & Computing"
                      />
                    </div>

                    <div className="sacp-field">
                      <label>Domain / Sector</label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="e.g. Computer Science & AI"
                      />
                    </div>

                    <div className="sacp-field">
                      <label>Path Type</label>
                      <div className="sacp-pill-group">
                        {PATH_TYPES.map((t) => (
                          <button
                            type="button"
                            key={t}
                            className={`sacp-toggle-pill ${pathType === t ? "active" : ""}`}
                            onClick={() => setPathType(t)}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sacp-field">
                      <label>Path Category</label>
                      <div className="sacp-pill-group">
                        {PATH_CATS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            className={`sacp-toggle-pill ${pathCat === c ? "active" : ""}`}
                            onClick={() => setPathCat(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sacp-field sacp-col-span-2">
                      <label>Estimated Path Duration</label>
                      <div className="sacp-duration-inputs">
                        <div>
                          <span className="duration-sub">Years</span>
                          <div className="project-desktop-custom-select sacp-duration-custom">
                            <CustomSelect
                              value={durationYears}
                              onChange={(e) => setDurationYears(e.target.value)}
                              options={[...Array(9)].map((_, i) => ({ label: String(i), value: i }))}
                              placeholder="Select"
                              searchable={false}
                            />
                          </div>
                          <div className="project-mobile-native-select">
                            <select
                              value={durationYears}
                              onChange={(e) => setDurationYears(e.target.value)}
                            >
                              {[...Array(9)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <span className="duration-sub">Months</span>
                          <div className="project-desktop-custom-select sacp-duration-custom">
                            <CustomSelect
                              value={durationMonths}
                              onChange={(e) => setDurationMonths(e.target.value)}
                              options={[...Array(12)].map((_, i) => ({ label: String(i), value: i }))}
                              placeholder="Select"
                              searchable={false}
                            />
                          </div>
                          <div className="project-mobile-native-select">
                            <select
                              value={durationMonths}
                              onChange={(e) => setDurationMonths(e.target.value)}
                            >
                              {[...Array(12)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <span className="duration-sub">Days</span>
                          <div className="project-desktop-custom-select sacp-duration-custom">
                            <CustomSelect
                              value={durationDays}
                              onChange={(e) => setDurationDays(e.target.value)}
                              options={[...Array(31)].map((_, i) => ({ label: String(i), value: i }))}
                              placeholder="Select"
                              searchable={false}
                            />
                          </div>
                          <div className="project-mobile-native-select">
                            <select
                              value={durationDays}
                              onChange={(e) => setDurationDays(e.target.value)}
                            >
                              {[...Array(31)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sacp-field sacp-col-span-2">
                      <label>Path Overview Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Comprehensive academic and career pathway guide..."
                      />
                    </div>
                  </div>
                </div>

                {/* Participant Coordinates Section */}
                <div className="sacp-card-section">
                  <h4 className="sacp-section-heading">Participant Fit & Search Coordinates</h4>
                  <p className="sacp-section-sub">
                    Matches the exact filter criteria in Explore Paths (Curriculum, Stream, Grade, Financial, Personality).
                  </p>

                  <div className="sacp-coord-block">
                    <label className="coord-label">Target Grades:</label>
                    <div className="sacp-pill-group">
                      {GRADE_LIST.map((g) => (
                        <button
                          type="button"
                          key={g}
                          className={`sacp-toggle-pill ${selectedGrades.includes(g) ? "active" : ""}`}
                          onClick={() => toggleArrayItem(selectedGrades, setSelectedGrades, g)}
                        >
                          Grade {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sacp-coord-block">
                    <label className="coord-label">Curriculums:</label>
                    <div className="sacp-pill-group">
                      {CURRICULUM_LIST.map((c) => (
                        <button
                          type="button"
                          key={c}
                          className={`sacp-toggle-pill ${selectedCurriculum.includes(c) ? "active" : ""}`}
                          onClick={() => toggleArrayItem(selectedCurriculum, setSelectedCurriculum, c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sacp-coord-block">
                    <label className="coord-label">Academic Streams:</label>
                    <div className="sacp-pill-group">
                      {STREAM_LIST.map((s) => (
                        <button
                          type="button"
                          key={s}
                          className={`sacp-toggle-pill ${selectedStreams.includes(s) ? "active" : ""}`}
                          onClick={() => toggleArrayItem(selectedStreams, setSelectedStreams, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sacp-coord-block">
                    <label className="coord-label">Financial Situations:</label>
                    <div className="sacp-pill-group">
                      {FINANCE_LIST.map((f) => (
                        <button
                          type="button"
                          key={f}
                          className={`sacp-toggle-pill ${selectedFinance.includes(f) ? "active" : ""}`}
                          onClick={() => toggleArrayItem(selectedFinance, setSelectedFinance, f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sacp-coord-block">
                    <label className="coord-label">Ideal Personality Profile:</label>
                    <div className="sacp-pill-group">
                      {PERSONALITY_LIST.map((p) => (
                        <button
                          type="button"
                          key={p}
                          className={`sacp-toggle-pill ${selectedPersonality === p ? "active" : ""}`}
                          onClick={() => setSelectedPersonality(p === selectedPersonality ? "" : p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STAGE 2: MILESTONES & 3 VIEWS ── */}
            {activeStage === 2 && (
              <div className="sacp-stage-content">
                <div className="sacp-milestones-layout">
                  {/* Step selector tabs */}
                  <div className="sacp-step-nav-bar">
                    <div className="step-pill-list">
                      {steps.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`sacp-step-nav-item ${selectedStepIdx === idx ? "active" : ""}`}
                          onClick={() => setSelectedStepIdx(idx)}
                        >
                          <span className="step-idx-badge">{idx + 1}</span>
                          <span className="step-nav-name">{s.name || `Milestone ${idx + 1}`}</span>
                          {steps.length > 1 && (
                            <span
                              className="step-remove-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveStep(idx);
                              }}
                              title="Remove Step"
                            >
                              ×
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="sacp-add-step-btn"
                      onClick={handleAddStep}
                    >
                      <FiPlus /> Add Step
                    </button>
                  </div>

                  {/* Active Step Details */}
                  {currentStep && (
                    <div className="sacp-active-step-panel">
                      <div className="step-main-meta">
                        <div className="sacp-field">
                          <label>Milestone Step Name <span className="req">*</span></label>
                          <input
                            type="text"
                            value={currentStep.name || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) => {
                                const c = [...prev];
                                c[selectedStepIdx] = { ...c[selectedStepIdx], name: val };
                                return c;
                              });
                            }}
                            placeholder="e.g. Milestone 1: Foundations & Prerequisites"
                          />
                        </div>

                        <div className="sacp-field">
                          <label>Milestone Duration</label>
                          <input
                            type="text"
                            value={currentStep.duration || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) => {
                                const c = [...prev];
                                c[selectedStepIdx] = { ...c[selectedStepIdx], duration: val };
                                return c;
                              });
                            }}
                            placeholder="e.g. 1 Year or 6 Months"
                          />
                        </div>
                      </div>

                      {/* 3 Learning Views */}
                      <div className="sacp-views-container">
                        <div className="sacp-view-selector-tabs">
                          {VIEWS.map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              className={`sacp-view-tab ${selectedViewKey === v.key ? "active" : ""}`}
                              onClick={() => setSelectedViewKey(v.key)}
                            >
                              <span className="view-title">{v.label}</span>
                              <span className="view-tag">{v.tag}</span>
                            </button>
                          ))}
                        </div>

                        <div className="sacp-view-editor-card">
                          <div className="sacp-grid-2col">
                            <div className="sacp-field">
                              <label>View Title</label>
                              <input
                                type="text"
                                value={currentStep[selectedViewKey]?.name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSteps((prev) => {
                                    const c = [...prev];
                                    c[selectedStepIdx] = {
                                      ...c[selectedStepIdx],
                                      [selectedViewKey]: {
                                        ...c[selectedStepIdx][selectedViewKey],
                                        name: val,
                                      },
                                    };
                                    return c;
                                  });
                                }}
                                placeholder={`e.g. ${currentStep.name || "Milestone"} (${selectedViewKey.toUpperCase()})`}
                              />
                            </div>

                            <div className="sacp-field">
                              <label>Access Type</label>
                              <div className="project-desktop-custom-select">
                                <CustomSelect
                                  value={currentStep[selectedViewKey]?.access || "free"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSteps((prev) => {
                                      const c = [...prev];
                                      c[selectedStepIdx] = {
                                        ...c[selectedStepIdx],
                                        [selectedViewKey]: {
                                          ...c[selectedStepIdx][selectedViewKey],
                                          access: val,
                                        },
                                      };
                                      return c;
                                    });
                                  }}
                                  options={[
                                    { label: "Free / Baseline", value: "free" },
                                    { label: "Paid / Premium", value: "paid" },
                                  ]}
                                  searchable={false}
                                />
                              </div>
                              <div className="project-mobile-native-select">
                                <select
                                  value={currentStep[selectedViewKey]?.access || "free"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSteps((prev) => {
                                      const c = [...prev];
                                      c[selectedStepIdx] = {
                                        ...c[selectedStepIdx],
                                        [selectedViewKey]: {
                                          ...c[selectedStepIdx][selectedViewKey],
                                          access: val,
                                        },
                                      };
                                      return c;
                                    });
                                  }}
                                >
                                  <option value="free">Free / Baseline</option>
                                  <option value="paid">Paid / Premium</option>
                                </select>
                              </div>
                            </div>

                            <div className="sacp-field sacp-col-span-2">
                              <label>View Instructions & Focus Objectives</label>
                              <textarea
                                rows={3}
                                value={currentStep[selectedViewKey]?.instructions || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSteps((prev) => {
                                    const c = [...prev];
                                    c[selectedStepIdx] = {
                                      ...c[selectedStepIdx],
                                      [selectedViewKey]: {
                                        ...c[selectedStepIdx][selectedViewKey],
                                        instructions: val,
                                      },
                                    };
                                    return c;
                                  });
                                }}
                                placeholder="Specific learning directions, curriculum checkpoints, and activities for this view..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STAGE 3: MARKETPLACE RECOMMENDATIONS ── */}
            {activeStage === 3 && (
              <div className="sacp-stage-content">
                <div className="sacp-card-section">
                  <div className="sacp-market-header-nav">
                    <div className="market-selector-row">
                      <div className="market-sel-group">
                        <label>Active Step:</label>
                        <div className="project-desktop-custom-select sacp-market-custom">
                          <CustomSelect
                            value={selectedStepIdx}
                            onChange={(e) => setSelectedStepIdx(Number(e.target.value))}
                            options={steps.map((s, idx) => ({
                              label: `${idx + 1}. ${s.name || `Step ${idx + 1}`}`,
                              value: idx,
                            }))}
                            searchable={steps.length >= 8}
                          />
                        </div>
                        <div className="project-mobile-native-select">
                          <select
                            value={selectedStepIdx}
                            onChange={(e) => setSelectedStepIdx(Number(e.target.value))}
                          >
                            {steps.map((s, idx) => (
                              <option key={idx} value={idx}>
                                {idx + 1}. {s.name || `Step ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="market-sel-group">
                        <label>Active Learning View:</label>
                        <div className="project-desktop-custom-select sacp-market-custom">
                          <CustomSelect
                            value={selectedViewKey}
                            onChange={(e) => setSelectedViewKey(e.target.value)}
                            options={VIEWS.map((v) => ({
                              label: `${v.label} (${v.tag})`,
                              value: v.key,
                            }))}
                            searchable={false}
                          />
                        </div>
                        <div className="project-mobile-native-select">
                          <select
                            value={selectedViewKey}
                            onChange={(e) => setSelectedViewKey(e.target.value)}
                          >
                            {VIEWS.map((v) => (
                              <option key={v.key} value={v.key}>
                                {v.label} ({v.tag})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 4 Category switcher */}
                    <div className="sacp-market-cat-tabs">
                      {CATEGORIES.map(({ key, label, Icon }) => {
                        const count = (currentViewObj.marketplace || []).filter(
                          (it) => it.category === key
                        ).length;
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`sacp-cat-tab ${selectedMarketCat === key ? "active" : ""}`}
                            onClick={() => setSelectedMarketCat(key)}
                          >
                            <Icon size={15} />
                            <span>{label}</span>
                            <span className="cat-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Recommendation form */}
                  <div className="sacp-add-rec-box">
                    <span className="rec-box-title">
                      + Add {selectedMarketCat.slice(0, -1)} Recommendation for {currentStep.name || `Step ${selectedStepIdx + 1}`} ({selectedViewKey.toUpperCase()})
                    </span>
                    <div className="sacp-rec-form-grid">
                      <input
                        type="text"
                        placeholder="Partner or Resource Name (e.g. Stanford AI Lab Internship, Coursera Deep Learning)"
                        value={marketForm.name}
                        onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })}
                        className="sacp-col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="Cost (e.g. Free or $49)"
                        value={marketForm.cost}
                        onChange={(e) => setMarketForm({ ...marketForm, cost: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 6 Weeks)"
                        value={marketForm.duration}
                        onChange={(e) => setMarketForm({ ...marketForm, duration: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Discount (e.g. 15% off)"
                        value={marketForm.discount}
                        onChange={(e) => setMarketForm({ ...marketForm, discount: e.target.value })}
                      />
                      <div className="project-desktop-custom-select">
                        <CustomSelect
                          value={marketForm.access}
                          onChange={(e) => setMarketForm({ ...marketForm, access: e.target.value })}
                          options={[
                            { label: "Access: Free", value: "Free" },
                            { label: "Access: Paid", value: "Paid" },
                            { label: "Access: Scholarship", value: "Scholarship" },
                          ]}
                          searchable={false}
                        />
                      </div>
                      <div className="project-mobile-native-select">
                        <select
                          value={marketForm.access}
                          onChange={(e) => setMarketForm({ ...marketForm, access: e.target.value })}
                        >
                          <option value="Free">Access: Free</option>
                          <option value="Paid">Access: Paid</option>
                          <option value="Scholarship">Access: Scholarship</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Goal alignment (e.g. Master Neural Networks)"
                        value={marketForm.goal}
                        onChange={(e) => setMarketForm({ ...marketForm, goal: e.target.value })}
                        className="sacp-col-span-2"
                      />
                    </div>
                    <button
                      type="button"
                      className="sacp-add-rec-btn"
                      onClick={handleAddMarketplaceItem}
                    >
                      <FiPlus /> Add to {selectedMarketCat}
                    </button>
                  </div>

                  {/* Existing recommendations table */}
                  <div className="sacp-rec-list">
                    {activeMarketplaceItems.length === 0 ? (
                      <div className="sacp-rec-empty">
                        No {selectedMarketCat} added for this step's {selectedViewKey} view yet.
                      </div>
                    ) : (
                      <table className="sacp-rec-table">
                        <thead>
                          <tr>
                            <th>Listing Name</th>
                            <th>Cost</th>
                            <th>Duration</th>
                            <th>Access</th>
                            <th>Goal</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeMarketplaceItems.map((item, itemIdx) => (
                            <tr key={itemIdx}>
                              <td className="rec-name-cell">{item.name}</td>
                              <td>{item.cost}</td>
                              <td>{item.duration || "—"}</td>
                              <td><span className="rec-access-pill">{item.access}</span></td>
                              <td className="rec-goal-cell">{item.goal || "—"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="rec-del-btn"
                                  onClick={() => handleRemoveMarketplaceItem(itemIdx)}
                                >
                                  <FiTrash2 />
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
            )}

            {/* ── STAGE 4: REVIEW & PUBLISH ── */}
            {activeStage === 4 && (
              <div className="sacp-stage-content">
                <div className="sacp-review-card">
                  <div className="review-header">
                    <FiCheckCircle className="review-ok-icon" />
                    <div>
                      <h4>Pathway Ready for Super Admin Publishing</h4>
                      <p>Verify details below before publishing this pathway to the live catalog.</p>
                    </div>
                  </div>

                  <div className="review-grid">
                    <div className="review-item">
                      <span className="rev-label">Path Title:</span>
                      <span className="rev-val">{nameOfPath || "—"}</span>
                    </div>
                    <div className="review-item">
                      <span className="rev-label">Target University:</span>
                      <span className="rev-val">{destinationInstitution || "General / Universal"}</span>
                    </div>
                    <div className="review-item">
                      <span className="rev-label">Degree / Program:</span>
                      <span className="rev-val">{destinationDegree || "—"} · {program || "—"}</span>
                    </div>
                    <div className="review-item">
                      <span className="rev-label">Duration:</span>
                      <span className="rev-val">{durationYears} Years {durationMonths} Months</span>
                    </div>
                    <div className="review-item">
                      <span className="rev-label">Coordinates:</span>
                      <span className="rev-val">
                        Grades: {selectedGrades.length > 0 ? selectedGrades.join(", ") : "All"} |
                        Streams: {selectedStreams.length > 0 ? selectedStreams.join(", ") : "All"}
                      </span>
                    </div>
                    <div className="review-item">
                      <span className="rev-label">Total Milestones:</span>
                      <span className="rev-val">{steps.length} Curated Steps</span>
                    </div>
                  </div>

                  {/* Step summary list */}
                  <div className="review-steps-summary">
                    <span className="rev-steps-title">Curated Milestone Outline:</span>
                    <ol className="rev-ordered-list">
                      {steps.map((st, i) => (
                        <li key={i}>
                          <strong>{st.name || `Step ${i + 1}`}</strong> {st.duration ? `(${st.duration})` : ""} —
                          Macro: {st.macro?.marketplace?.length || 0} partners |
                          Micro: {st.micro?.marketplace?.length || 0} partners |
                          Nano: {st.nano?.marketplace?.length || 0} partners
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Admin Response Note */}
                  <div className="sacp-field" style={{ marginTop: "16px" }}>
                    <label>Super Admin Note to Student (Visible in My Requests):</label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Provide feedback, guidance, or congratulations for the student..."
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Page Footer Navigation ── */}
      <div className="sacp-page-footer">
        <div className="footer-left">
          {activeStage > 1 ? (
            <button
              type="button"
              className="sacp-btn sacp-btn--ghost"
              onClick={() => setActiveStage((p) => p - 1)}
            >
              <FiArrowLeft /> Previous Stage
            </button>
          ) : (
            <button type="button" className="sacp-btn sacp-btn--ghost" onClick={onBack}>
              Cancel
            </button>
          )}
        </div>

        <div className="footer-right">
          {activeStage < 4 ? (
            <button
              type="button"
              className="sacp-btn sacp-btn--primary"
              onClick={() => {
                if (activeStage === 1 && !nameOfPath.trim()) {
                  setErrorMsg("Please enter a Path Name / Title before continuing.");
                  return;
                }
                if (activeStage === 2 && (!steps.length || !steps[0].name.trim())) {
                  setErrorMsg("Please enter at least one milestone step name before continuing.");
                  return;
                }
                setErrorMsg("");
                setActiveStage((p) => p + 1);
              }}
            >
              Next Stage <FiArrowRight />
            </button>
          ) : (
            <button
              type="button"
              className="sacp-btn sacp-btn--publish"
              disabled={loading}
              onClick={handleSaveAndPublish}
            >
              <FiSend /> {loading ? "Publishing Pathway..." : isEditMode ? "Update & Republish Pathway" : <><SvgSparkles size={14} style={{ marginRight: 5, verticalAlign: "middle" }} />Publish Custom Pathway</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
