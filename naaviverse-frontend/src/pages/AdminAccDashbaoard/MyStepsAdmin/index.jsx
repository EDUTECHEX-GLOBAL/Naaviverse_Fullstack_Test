import CustomSelect from '../../accDashbaoard/CustomSelect';
import React, { useState, useEffect, useRef, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "./mypaths.scss";
import axios from "axios";
import lg1 from "../../../static/images/login/lg1.svg";
import { useStore } from "../../../components/store/store.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import stepIcon from '../../../assets/images/assets/naavi-icon3.webp';
import { SvgWarning, SvgPin, SvgPackage } from "../../../utils/SvgIcons";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ROLE_OPTIONS = [
  { value: "", label: "Select role..." },
  { value: "institution", label: "Institution" },
  { value: "mentor", label: "Mentor" },
  { value: "distributor", label: "Distributor" },
  { value: "vendor", label: "Vendor" },
];

const ACCESS_OPTIONS = [
  { value: "Free", label: "Free" },
  { value: "Paid", label: "Paid" },
  { value: "Subscription", label: "Subscription" },
];

// Clean, bounded, responsive dropdown select component for desktop and mobile
const DropdownSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  ariaLabel = "Select option",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, { passive: true });
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return { value: opt.value, label: opt.label || opt.value };
      }
      return { value: opt, label: opt };
    });
  }, [options]);

  const selectedOpt = normalizedOptions.find((o) => String(o.value) === String(value));
  const isSelected = !!selectedOpt && selectedOpt.value !== "";
  const displayLabel = selectedOpt && selectedOpt.value !== "" ? selectedOpt.label : placeholder;

  return (
    <div
      ref={containerRef}
      className={`admin-custom-select-container ${isOpen ? "is-open" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        className="admin-custom-select-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          border: isOpen ? "1.5px solid #2563eb" : "1.5px solid #e8ecf0",
          borderRadius: 10,
          fontSize: "0.85rem",
          fontWeight: isSelected ? 500 : 400,
          color: isSelected ? "#1e293b" : "#64748b",
          background: "#fff",
          outline: "none",
          cursor: "pointer",
          textAlign: "left",
          boxSizing: "border-box",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginRight: 8,
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="admin-custom-select-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
            zIndex: 1050,
            overflowY: "auto",
            maxHeight: "180px",
            padding: "4px",
          }}
        >
          {normalizedOptions.map((opt, idx) => {
            const isOptSelected = String(value) === String(opt.value);
            return (
              <div
                key={idx}
                className={`admin-custom-select-option ${isOptSelected ? "selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  fontWeight: isOptSelected ? 600 : 500,
                  color: isOptSelected ? "#2563eb" : "#334155",
                  background: isOptSelected ? "#eff6ff" : "transparent",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background 0.15s ease, color 0.15s ease",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isOptSelected) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.color = "#0f172a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOptSelected) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#334155";
                  }
                }}
              >
                <span>{opt.label}</span>
                {isOptSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const parseDuration = (raw) => {
  if (!raw) return null;
  try {
    const dur = typeof raw === "string" ? JSON.parse(raw) : raw;
    const parts = [];

    const years = dur?.Years || dur?.years || "";
    const months = dur?.Months || dur?.months || "";
    const days = dur?.Days || dur?.days || "";

    if (parseInt(years) > 0) parts.push(`${years} ${years === "1" ? "Year" : "Years"}`);
    if (parseInt(months) > 0) parts.push(`${months} ${months === "1" ? "Month" : "Months"}`);
    if (parseInt(days) > 0) parts.push(`${days} ${days === "1" ? "Day" : "Days"}`);

    return parts.length ? parts.join(" ") : null;
  } catch { return null; }
};

// ─── layerConfig — reads actual names/descriptions from the step document ───
const getLayerConfig = (stepData) => ({
  macro: {
    label: "Macro",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
    viewName: stepData?.macro_name || "Macro View",
    viewDesc: stepData?.macro_description || "High-Level Pathway Services",
  },
  micro: {
    label: "Micro",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    viewName: stepData?.micro_name || "Micro View",
    viewDesc: stepData?.micro_description || "Mid-Level Support Services",
  },
  nano: {
    label: "Nano",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    viewName: stepData?.nano_name || "Nano View",
    viewDesc: stepData?.nano_description || "Granular Task-Level Services",
  },
});

const MyStepsAdmin = ({ search, admin, fetchAllServicesAgain }) => {
  const navigate = useNavigate();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const pathId = queryParams.get("pathId");
  const pathName = queryParams.get("pathName");
  const tabParam = queryParams.get("tab");
  const { setaccsideNav } = useStore();
  let userDetails = JSON.parse(localStorage.getItem("adminuser"));

  const [stepsMenu, setStepsMenu] = useState(
    tabParam === "inactive" ? "Inactive Steps" : "Active Steps"
  );

  const [partnerStepsData, setPartnerStepsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCountMap, setServiceCountMap] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScreen, setModalScreen] = useState("main");
  const [selectedStep, setSelectedStep] = useState(null);
  const [modalHistory, setModalHistory] = useState([]);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLength, setEditLength] = useState("");
  const [editCost, setEditCost] = useState("");

  // View step layer tab
  const [viewLayerTab, setViewLayerTab] = useState("macro");
  const [expandedSteps, setExpandedSteps] = useState({});

  // ── Marketplace states ────────────────────────────────
  const [marketLayer, setMarketLayer] = useState("");
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [attachedServices, setAttachedServices] = useState([]);

  // ── Marketplace create-listing form states ────────────────────────────────
  const [mpRole, setMpRole] = useState("");
  const [mpName, setMpName] = useState("");
  const [mpAccess, setMpAccess] = useState("Free");
  const [mpCost, setMpCost] = useState("");
  const [mpGoal, setMpGoal] = useState("");
  const [mpOutcomes, setMpOutcomes] = useState("");
  const [mpDuration, setMpDuration] = useState("");
  const [mpFeatures, setMpFeatures] = useState("");
  const [mpDiscount, setMpDiscount] = useState("");

  // ─── Data fetchers ────────────────────────────────────────────────────────

  const getAllSteps = (statusOverride, pathIdOverride) => {
    setLoading(true);
    const targetStatus = statusOverride || (stepsMenu === "Inactive Steps" ? "inactive" : "active");
    const targetPathId = pathIdOverride !== undefined ? pathIdOverride : new URLSearchParams(location.search).get("pathId");

    let url = `${BASE_URL}/api/steps/get?status=${targetStatus}`;
    if (targetPathId) {
      url += `&path_id=${targetPathId}`;
    }

    axios.get(url)
      .then(({ data }) => {
        const result = data?.data || [];
        setPartnerStepsData(result);
        setLoading(false);
      })
      .catch(() => { setPartnerStepsData([]); setLoading(false); });
  };

  const fetchMarketplaceCounts = async (steps = []) => {
    if (!Array.isArray(steps) || steps.length === 0) return;
    const counts = {};
    await Promise.all(steps.map(async (step) => {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/marketplace/step/${step._id}`);
        counts[step._id] = data?.data?.length || 0;
      } catch { counts[step._id] = 0; }
    }));
    setServiceCountMap(counts);
  };

  const fetchMarketplaceData = (stepId, layer) => {
    const sid = stepId || selectedStep?._id;
    const lay = layer || marketLayer;
    if (!sid || !lay) return;

    setMarketplaceLoading(true);

    axios
      .get(`${BASE_URL}/api/marketplace/step/${sid}?layer=${lay}`)
      .then(({ data }) => {
        setAttachedServices(data?.status ? data.data : []);
      })
      .catch(() => setAttachedServices([]));

    axios
      .get(`${BASE_URL}/api/marketplace/admin/get-all?layer=${lay}`)
      .then(({ data }) => {
        setMarketplaceItems(data?.status ? data.data : []);
        setMarketplaceLoading(false);
      })
      .catch(() => {
        setMarketplaceItems([]);
        setMarketplaceLoading(false);
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const pId = params.get("pathId");
    const activeMenu = tab === "inactive" ? "Inactive Steps" : "Active Steps";
    const status = tab === "inactive" ? "inactive" : "active";

    setStepsMenu(activeMenu);
    getAllSteps(status, pId);
  }, [location.search]);

  useEffect(() => {
    if (modalOpen) document.body.classList.add("admin-popup-open");
    else document.body.classList.remove("admin-popup-open");
    return () => document.body.classList.remove("admin-popup-open");
  }, [modalOpen]);

  // ─── Modal navigation ─────────────────────────────────────────────────────

  const openModal = (step) => {
    setSelectedStep(step);
    setModalScreen("main");
    setModalHistory([]);
    setModalOpen(true);
  };

  const goTo = (screen) => {
    setModalHistory(prev => [...prev, modalScreen]);
    setModalScreen(screen);

    if (screen === "editStep") {
      setEditName(selectedStep?.name || "");
      setEditDesc(selectedStep?.macro_description || selectedStep?.description || "");
      setEditLength(selectedStep?.length ?? "");
      setEditCost(selectedStep?.cost || "");
    }
    if (screen === "marketplace_layer") {
      setMarketLayer("");
      setAttachedServices([]);
      setMarketplaceItems([]);
    }
    if (screen === "marketplace_create") {
      setMpRole(""); setMpName(""); setMpAccess("Free"); setMpCost("");
      setMpGoal(""); setMpOutcomes(""); setMpDuration("");
      setMpFeatures(""); setMpDiscount("");
    }
    if (screen === "viewStep") {
      setViewLayerTab("macro");
    }
  };

  const goBack = () => {
    if (modalHistory.length > 0) {
      const prev = modalHistory[modalHistory.length - 1];
      setModalHistory(h => h.slice(0, -1));
      setModalScreen(prev);
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalScreen("main");
    setModalHistory([]);
    setSelectedStep(null);
    setMarketLayer("");
    setAttachedServices([]);
    setMarketplaceItems([]);
    setMpRole(""); setMpName(""); setMpAccess("Free"); setMpCost("");
    setMpGoal(""); setMpOutcomes(""); setMpDuration("");
    setMpFeatures(""); setMpDiscount("");
  };

  const getTitle = () => {
    const titles = {
      main: "Step Actions",
      editStep: "Edit Step",
      viewStep: "View Step",
      marketplace_layer: "Marketplace",
      marketplace_attach: "Marketplace",
      marketplace_create: "Marketplace",
      deleteConfirm: "Delete Step",
      success: "",
    };
    return titles[modalScreen] || "Step Actions";
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleDeleteStep = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.delete(`${BASE_URL}/api/steps/delete/${selectedStep._id}`);
      if (data?.status) {
        setActionLoading(false);
        setModalScreen("success");
        setTimeout(() => { closeModal(); getAllSteps(); }, 1800);
      }
    } catch { setActionLoading(false); }
  };

  const handleSaveStep = async () => {
    setActionLoading(true);
    try {
      const payload = {};
      if (editName !== undefined) payload.name = editName;
      if (editDesc !== undefined) {
        payload.description = editDesc;
        payload.macro_description = editDesc;
      }
      if (editLength !== "" && editLength !== null && editLength !== undefined) {
        payload.length = Number(editLength);
      }
      if (editCost !== undefined) {
        payload.cost = editCost;
        payload.macro_cost = editCost;
      }
      const { data } = await axios.put(`${BASE_URL}/api/steps/update/${selectedStep._id}`, payload);
      if (data && data.status === false) {
        toast.error(data.message || "Failed to update step");
        setActionLoading(false);
        return;
      }

      // Optimistically update partnerStepsData so changes show immediately
      setPartnerStepsData(prev => prev.map(s => s._id === selectedStep._id ? {
        ...s,
        name: editName !== undefined ? editName : s.name,
        description: editDesc !== undefined ? editDesc : s.description,
        macro_description: editDesc !== undefined ? editDesc : s.macro_description,
        length: editLength !== "" && editLength !== null && editLength !== undefined ? Number(editLength) : s.length,
        cost: editCost !== undefined ? editCost : s.cost,
        macro_cost: editCost !== undefined ? editCost : s.macro_cost,
      } : s));

      setSelectedStep(prev => prev ? {
        ...prev,
        name: editName !== undefined ? editName : prev.name,
        description: editDesc !== undefined ? editDesc : prev.description,
        macro_description: editDesc !== undefined ? editDesc : prev.macro_description,
        length: editLength !== "" && editLength !== null && editLength !== undefined ? Number(editLength) : prev.length,
        cost: editCost !== undefined ? editCost : prev.cost,
        macro_cost: editCost !== undefined ? editCost : prev.macro_cost,
      } : prev);

      toast.success("Step updated");
      setActionLoading(false);
      getAllSteps();
      goBack();
    } catch {
      toast.error("Failed to update");
      setActionLoading(false);
    }
  };

  // ─── Marketplace Actions ───────────────────────────────────────────

  const attachMarketService = (item) => {
    setActionLoading(true);

    const fieldKey = `${marketLayer}_marketplace`;
    const currentIds = (selectedStep?.[fieldKey] || []).map(id => id.toString());

    if (currentIds.includes(item._id.toString())) {
      setActionLoading(false);
      return;
    }

    const updatedIds = [...currentIds, item._id.toString()];

    axios
      .put(`${BASE_URL}/api/steps/update/${selectedStep._id}`, { [fieldKey]: updatedIds })
      .then(({ data }) => {
        if (data?.status) {
          setSelectedStep(prev => ({ ...prev, [fieldKey]: updatedIds }));

          axios.patch(`${BASE_URL}/api/marketplace/link-step`, {
            item_id: item._id,
            step_id: selectedStep._id,
          }).then(() => {
            setAttachedServices(prev => [...prev, item]);
            setMarketplaceItems(prev =>
              prev.map(m => m._id === item._id ? { ...m, step_id: selectedStep._id } : m)
            );
            fetchMarketplaceCounts(partnerStepsData);
          });
        }
        setActionLoading(false);
      })
      .catch(() => setActionLoading(false));
  };

  const detachMarketService = (item) => {
    setActionLoading(true);

    const fieldKey = `${marketLayer}_marketplace`;
    const currentIds = (selectedStep?.[fieldKey] || []).map(id => id.toString());
    const updatedIds = currentIds.filter(id => id !== item._id.toString());

    axios
      .put(`${BASE_URL}/api/steps/update/${selectedStep._id}`, { [fieldKey]: updatedIds })
      .then(({ data }) => {
        if (data?.status) {
          setSelectedStep(prev => ({ ...prev, [fieldKey]: updatedIds }));

          axios.patch(`${BASE_URL}/api/marketplace/link-step`, {
            item_id: item._id,
            step_id: null,
          }).then(() => {
            setAttachedServices(prev => prev.filter(s => s._id !== item._id));
            setMarketplaceItems(prev =>
              prev.map(m => m._id === item._id ? { ...m, step_id: null } : m)
            );
            fetchMarketplaceCounts(partnerStepsData);
          });
        }
        setActionLoading(false);
      })
      .catch(() => setActionLoading(false));
  };




  // ─── Pagination states & reset ────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [stepsMenu, search, pathId]);

  const filtered = partnerStepsData?.filter(e =>
    e?.name?.toLowerCase()?.includes(search?.toLowerCase() || "")
  );

  // ─── Pagination calculations ──────────────────────────────────
  const totalStepsCount = filtered?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalStepsCount / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalStepsCount);
  const paginatedSteps = filtered?.slice(startIndex, endIndex) || [];

  const handlePageChange = (newPage) => {
    const page = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(page);
    const container = document.querySelector(".dashboard-screens") || window;
    container.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const currentLayerCfg = selectedStep ? getLayerConfig(selectedStep)[marketLayer] : null;
  const attachedIds = new Set(attachedServices.map(s => s._id?.toString()));
  const availableItems = marketplaceItems.filter(
    item => !attachedIds.has(item._id?.toString())
  );

  const IconChevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <div className="admin-steps-container">

      {/* TABS + SEARCH */}
      <div className="admin-steps-topbar">
        <div className="admin-steps-menu">
          {["Active Steps", "Inactive Steps"].map(tab => (
            <div key={tab}
              className={`admin-steps-menu-item ${stepsMenu === tab ? "active-tab" : ""}`}
              onClick={() => {
                setStepsMenu(tab);
                const tabValue = tab === "Inactive Steps" ? "inactive" : "active";
                let url = `/admin/dashboard/steps?tab=${tabValue}`;
                if (pathId) {
                  url += `&pathId=${pathId}`;
                  if (pathName) url += `&pathName=${encodeURIComponent(pathName)}`;
                }
                navigate(url);
              }}>
              {tab}
            </div>
          ))}
        </div>
        <div className="admin-steps-search-row">
          <div className="admin-steps-search-input">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by step"
              value={search || ""}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-steps-content">

        {pathId && (
          <div className="steps-back-banner admin-steps-banner">
            <div className="admin-steps-banner-left">
              <span
                className="admin-steps-back-btn"
                onClick={() => {
                  if (setaccsideNav) setaccsideNav("Paths");
                  navigate("/admin/dashboard/paths?tab=active");
                }}
              >
                ← Back to Paths
              </span>
              <span className="admin-steps-banner-divider">|</span>
              <span className="admin-steps-banner-label">
                Showing steps for: <strong>{decodeURIComponent(pathName || "")}</strong>
              </span>
            </div>
            <button
              type="button"
              className="admin-steps-clear-btn"
              onClick={() => {
                const tabValue = stepsMenu === "Inactive Steps" ? "inactive" : "active";
                navigate(`/admin/dashboard/steps?tab=${tabValue}`);
              }}
            >
              Show All Steps
            </button>
          </div>
        )}
        <div className="admin-steps-list">
          {loading ? (
            Array(6).fill("").map((_, i) => (
              <div className="admin-step-card" key={i}>
                <div className="admin-step-name"><Skeleton width={120} height={20} /></div>
                <div className="admin-step-desc"><Skeleton width="90%" height={20} /></div>
                <div className="admin-step-right"><Skeleton width={80} height={32} borderRadius={50} /></div>
              </div>
            ))
          ) : filtered?.length === 0 ? (
            <div className="admin-steps-empty">
              <div className="admin-steps-empty-icon"><SvgPin size={32} /></div>
              <div className="admin-steps-empty-title">No Steps Found</div>
              <div className="admin-steps-empty-sub">
                {pathId ? "No steps found for this path." : "Try adjusting your search or switch tabs."}
              </div>
            </div>
          ) : (
            paginatedSteps?.map(e => {
              const isFree = !e?.cost || e?.cost?.toLowerCase() === "free";
              const rawDesc = e?.macro_description || e?.micro_description || e?.nano_description || e?.description || "";
              const isExpanded = expandedSteps[e._id];
              const isLong = rawDesc.length > 120;
              const desc = rawDesc.trim().length > 0
                ? (isExpanded || !isLong ? rawDesc : rawDesc.substring(0, 120))
                : null;
              return (
                <div className="admin-step-card" key={e._id} onClick={() => openModal(e)}>
     <div className="admin-step-name">
  <div className="admin-icon-box">
    <img src={stepIcon} alt="step" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
  </div>
  <span className="admin-step-name-text">{e?.name || "Untitled"}</span>
</div>
                  <div className="admin-step-desc" onClick={ev => ev.stopPropagation()}>
                    {desc ? (
                      <span className="admin-step-desc-text">
                        {desc}
                        {isLong && (
                          <span
                            onClick={ev => {
                              ev.stopPropagation();
                              setExpandedSteps(prev => ({ ...prev, [e._id]: !prev[e._id] }));
                            }}
                            style={{
                              color: "#7c3aed",
                              fontWeight: 600,
                              cursor: "pointer",
                              marginLeft: 4,
                              fontSize: "0.82rem",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {isExpanded ? " Show Less " : "... See More "}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="admin-step-desc-empty">No description available</span>
                    )}
                  </div>
                  <div className="admin-step-right">
                    <div className="admin-step-meta">
                      <span className="admin-step-date">
                        {e?.createdAt
                          ? new Date(e.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                      {e?.cost && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            background: isFree ? "#f1f5f9" : "#e0f2fe",
                            color: isFree ? "#64748b" : "#0284c7",
                            border: isFree ? "1px solid #e2e8f0" : "1px solid #bae6fd",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.cost}
                        </span>
                      )}
                    </div>
                    <span
                      className="admin-step-actions-pill"
                      onClick={ev => { ev.stopPropagation(); openModal(e); }}
                    >
                      Actions
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── PAGINATION CONTROLS ─── */}
        {totalStepsCount > 0 && !loading && (
          <div className="admin-steps-pagination">
            <div className="steps-pagination-left">
              <span className="steps-pagination-info">
                Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalStepsCount}</strong> {totalStepsCount === 1 ? "step" : "steps"}
              </span>
              <div className="steps-per-page-selector">
                <label htmlFor="steps-per-page">Rows per page:</label>
                <div className="project-desktop-custom-select inline" style={{ width: "75px" }}>
                  <CustomSelect
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    options={[5, 10, 20, 50]}
                    searchable={false}
                  />
                </div>
                <div className="project-mobile-native-select inline">
                  <select
                    id="steps-per-page"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="steps-pagination-controls">
              <button
                type="button"
                className="pagination-btn pagination-nav-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => handlePageChange(1)}
                title="First Page"
                aria-label="First page"
              >
                «
              </button>
              <button
                type="button"
                className="pagination-btn pagination-nav-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                title="Previous Page"
                aria-label="Previous page"
              >
                ‹ Prev
              </button>

              <div className="pagination-pages-group">
                {getPageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="pagination-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`pagination-btn pagination-page-btn ${p === safeCurrentPage ? "active" : ""}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="pagination-btn pagination-nav-btn"
                disabled={safeCurrentPage === totalPages}
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                title="Next Page"
                aria-label="Next page"
              >
                Next ›
              </button>
              <button
                type="button"
                className="pagination-btn pagination-nav-btn"
                disabled={safeCurrentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
                title="Last Page"
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP MODAL - Keep same modal classes as they don't conflict */}
      {modalOpen && (
        <>
          <div className="sm-overlay" onClick={closeModal} />
          <div className="sm-modal" onClick={e => e.stopPropagation()}>

            {modalScreen !== "success" && (
              <div className="sm-header">
                <div className="sm-header-left">
                  {modalHistory.length > 0 && (
                    <button className="sm-back-btn" onClick={goBack}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                      </svg>
                      Back
                    </button>
                  )}
                  <h2 className="sm-title">{getTitle()}</h2>
                </div>
                <button className="sm-close-btn" onClick={closeModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {selectedStep && modalScreen !== "success" && (
              <div className="sm-chip">
                <span className="sm-chip-dot" />
                {selectedStep.name}
              </div>
            )}

            <div className="sm-body">
              {/* MAIN - Keep same content structure but with admin classes where needed */}
           {modalScreen === "main" && (
  <div className="sm-option-list">

    {/* Edit Step — only for Active */}
    {stepsMenu === "Active Steps" && (
      <div className="sm-option" onClick={() => goTo("editStep")}>
        <div className="sm-option-icon" style={{ background: "#eff6ff" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
        </div>
        <div className="sm-option-content">
          <strong>Edit Step</strong>
          <span>Update name, description, cost and length</span>
        </div>
        <IconChevron />
      </div>
    )}

    {/* View Step — always visible */}
    <div className="sm-option" onClick={() => goTo("viewStep")}>
      <div className="sm-option-icon" style={{ background: "#f5f3ff" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <div className="sm-option-content">
        <strong>View Step</strong>
        <span>See Macro, Micro and Nano layer details</span>
      </div>
      <IconChevron />
    </div>

    {/* Marketplace — only for Active */}
    {stepsMenu === "Active Steps" && (
      <div className="sm-option" onClick={() => goTo("marketplace_layer")}>
        <div className="sm-option-icon" style={{ background: "#f0fdfa" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <div className="sm-option-content">
          <strong>Marketplace</strong>
          <span>Add or manage marketplace listings by layer</span>
        </div>
        <IconChevron />
      </div>
    )}

    {/* Delete — always visible */}
    <div className="sm-option sm-option--danger" onClick={() => goTo("deleteConfirm")}>
      <div className="sm-option-icon" style={{ background: "#fef2f2" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0h10" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>
      <div className="sm-option-content">
        <strong>Delete Step</strong>
        <span>Permanently remove this step</span>
      </div>
      <IconChevron />
    </div>

  </div>
)}
              

              {/* EDIT STEP */}
              {modalScreen === "editStep" && (
                <form onSubmit={(e) => { e.preventDefault(); if (!actionLoading) handleSaveStep(); }} className="sm-form">
                  <div className="sm-form-group">
                    <label className="sm-label">Name</label>
                    <input className="sm-input" type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Step name" />
                  </div>
                  <div className="sm-form-group">
                    <label className="sm-label">Description</label>
                    <textarea className="sm-input sm-textarea" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="What does this step cover?" />
                  </div>
                  <div className="sm-form-row">
                    <div className="sm-form-group">
                      <label className="sm-label">Length (days)</label>
                      <input className="sm-input" type="number" value={editLength} onChange={e => setEditLength(e.target.value)} placeholder="e.g. 30" />
                    </div>
                    <div className="sm-form-group">
                      <label className="sm-label">Cost</label>
                      <input className="sm-input" type="text" value={editCost} onChange={e => setEditCost(e.target.value)} placeholder="Free or amount" />
                    </div>
                  </div>
                  <button type="submit" className="sm-btn-primary" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}

              {/* VIEW STEP - Keep same structure */}
              {modalScreen === "viewStep" && (
                <div className="sm-view-step">
                  <div className="sm-layer-tabs">
                    {[
                      { key: "macro", label: "Macro", color: "#7c3aed" },
                      { key: "micro", label: "Micro", color: "#0891b2" },
                      { key: "nano", label: "Nano", color: "#d97706" },
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        className={`sm-layer-tab ${viewLayerTab === key ? "active" : ""}`}
                        style={viewLayerTab === key ? { background: color, color: "#fff", borderColor: color } : {}}
                        onClick={() => setViewLayerTab(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {["macro", "micro", "nano"].map(layer => (
                    viewLayerTab === layer && (
                      <div key={layer} className={`sm-layer-card sm-layer-card--${layer}`}>
                        {[
                          ["Name", selectedStep?.[`${layer}_name`]],
                          ["Description", selectedStep?.[`${layer}_description`]],
                          ["Length", parseDuration(selectedStep?.length) || parseDuration(selectedStep?.[`${layer}_length`])],
                          ["Access", selectedStep?.[`${layer}_access`]],
                          ["Cost", selectedStep?.cost || selectedStep?.[`${layer}_cost`]],
                          ["Instructions", selectedStep?.[`${layer}_instructions`]],
                          ["Chances", selectedStep?.[`${layer}_chances`]],
                        ].map(([label, val]) => val ? (
                          <div key={label} className="sm-layer-row">
                            <span className="sm-layer-key">{label}</span>
                            <span className="sm-layer-val">{val}</span>
                          </div>
                        ) : null)}
                        {!selectedStep?.[`${layer}_name`] && !selectedStep?.[`${layer}_description`] && (
                          <p className="sm-layer-empty">
                            No {layer.charAt(0).toUpperCase() + layer.slice(1)} data configured for this step.
                          </p>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* MARKETPLACE LAYER SELECTOR */}
              {modalScreen === "marketplace_layer" && (
                <div className="admin-pp-selector">
                  <p className="admin-pp-section-label">Select a view to manage</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(getLayerConfig(selectedStep)).map(([layerKey, cfg]) => (
                      <div
                        key={layerKey}
                        style={{
                          padding: "18px 20px",
                          borderRadius: 16,
                          cursor: "pointer",
                          border: `1.5px solid ${cfg.border}`,
                          background: cfg.bg,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          transition: "all 0.15s",
                        }}
                        onClick={() => {
                          setMarketLayer(layerKey);
                          setAttachedServices([]);
                          setMarketplaceItems([]);
                          fetchMarketplaceData(selectedStep._id, layerKey);
                          goTo("marketplace_attach");
                        }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: cfg.color, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 800, fontSize: "1rem", flexShrink: 0,
                        }}>
                          {cfg.label[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: "0.78rem",
                            color: cfg.color, textTransform: "uppercase",
                            letterSpacing: "0.07em", marginBottom: 3,
                          }}>
                            {cfg.label}
                          </div>
                          <div style={{
                            fontWeight: 600, fontSize: "0.88rem",
                            color: "#0f172a", marginBottom: 2,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {cfg.viewName}
                          </div>
                          <div style={{
                            fontSize: "0.74rem", color: "#64748b",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {cfg.viewDesc}
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MARKETPLACE ATTACH */}
              {modalScreen === "marketplace_attach" && (
                <div>
                  {currentLayerCfg && (
                    <div className="admin-pp-layer-header pp-layer-header" style={{ marginBottom: "16px" }}>
                      <h3 className="admin-pp-layer-title pp-layer-title" style={{ fontSize: "18px", fontWeight: "600" }}>{currentLayerCfg.viewName}</h3>
                      <p className="admin-pp-layer-desc pp-layer-desc" style={{ color: "#64748b", fontSize: "13px" }}>{currentLayerCfg.viewDesc}</p>
                    </div>
                  )}

                  <p className="admin-pp-section-label">
                    ATTACHED TO THIS STEP ({marketLayer?.toUpperCase()})
                  </p>

                  {marketplaceLoading ? (
                    <div style={{ padding: "12px 0", color: "#64748b", fontSize: "13px" }}>Loading...</div>
                  ) : attachedServices.length > 0 ? (
                    attachedServices.map(item => (
                      <div className="admin-pp-market-item" key={item._id}>
                        <div className="admin-pp-market-item-info">
                          <div className="admin-pp-market-emoji"><SvgPackage size={20} /></div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.role}</span>
                          </div>
                        </div>
                        <button
                          className="admin-pp-market-remove-btn"
                          disabled={actionLoading}
                          onClick={() => detachMarketService(item)}>
                          {actionLoading ? "..." : "Remove"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="admin-pp-empty">No items attached to this step</div>
                  )}

                  <button
                    className="admin-pp-create-btn"
                    style={{ marginTop: "16px", marginBottom: "8px" }}
                    onClick={() => goTo("marketplace_create")}>
                    + Create New Listing
                  </button>

                  <p className="admin-pp-section-label" style={{ marginTop: "20px" }}>
                    ALL {marketLayer?.toUpperCase()} MARKETPLACE ({availableItems.length} available)
                  </p>

                  {marketplaceLoading ? (
                    <div style={{ padding: "12px 0", color: "#64748b", fontSize: "13px" }}>Loading...</div>
                  ) : availableItems.length === 0 ? (
                    <div className="admin-pp-empty">No other {marketLayer} items in marketplace</div>
                  ) : (
                    // REPLACE the availableItems.map block in marketplace_attach
                    availableItems.map(item => (
                      <div className="admin-pp-market-item" key={item._id}>
                        <div className="admin-pp-market-item-info">
                          <div className="admin-pp-market-emoji"><SvgPackage size={20} /></div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.role}</span>    {/* ← span is already separate, issue is CSS */}
                            {item.step_id && (
                              <span style={{ fontSize: "11px", color: "#f59e0b", display: "block" }}>
                                <SvgWarning size={14} /> Already linked to another step
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="admin-pp-market-attach-btn"
                          disabled={actionLoading}
                          onClick={() => attachMarketService(item)}>
                          {actionLoading ? "..." : "Attach"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* MARKETPLACE CREATE */}
              {modalScreen === "marketplace_create" && (
                <div className="admin-pp-selector">
                  {currentLayerCfg && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      background: currentLayerCfg.bg,
                      borderRadius: 8,
                      border: `1.5px solid ${currentLayerCfg.border}`,
                      fontSize: "0.75rem",
                      color: currentLayerCfg.color,
                      fontWeight: 600,
                      marginBottom: 14,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {currentLayerCfg.label} — {currentLayerCfg.viewName}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (actionLoading) return;
                      if (!mpRole || !mpName) { toast.error("Role and Name are required"); return; }
                      setActionLoading(true);

                      axios
                        .post(`${BASE_URL}/api/marketplace/add`, {
                          name: mpName,
                          role: mpRole,
                          layer: marketLayer,
                          step_id: selectedStep._id,
                          path_id: null,
                          partner_email: userDetails?.email || "",
                          access: mpAccess,
                          cost: mpCost,
                          goal: mpGoal,
                          outcomes: mpOutcomes,
                          duration: mpDuration,
                          features: mpFeatures,
                          discount: mpDiscount,
                        })
                        .then(({ data }) => {
                          if (data?.status && data?.data) {
                            const newItem = data.data;
                            setAttachedServices(prev => [...prev, newItem]);
                            setMarketplaceItems(prev => [...prev, newItem]);
                            const fieldKey = `${marketLayer}_marketplace`;
                            setSelectedStep(prev => ({
                              ...prev,
                              [fieldKey]: [...(prev?.[fieldKey] || []), newItem._id],
                            }));
                            setMpRole(""); setMpName(""); setMpAccess("Free"); setMpCost("");
                            setMpGoal(""); setMpOutcomes(""); setMpDuration("");
                            setMpFeatures(""); setMpDiscount("");
                            fetchMarketplaceCounts(partnerStepsData);
                            goBack();
                          }
                          setActionLoading(false);
                        })
                        .catch(() => {
                          toast.error("Failed to add marketplace item");
                          setActionLoading(false);
                        });
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Role *</label>
                      <DropdownSelect
                        value={mpRole}
                        onChange={setMpRole}
                        options={ROLE_OPTIONS}
                        placeholder="Select role..."
                        ariaLabel="Role"
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Name *</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpName} onChange={e => setMpName(e.target.value)}
                        placeholder="e.g. Malla Reddy University"
                      />
                    </div>

                    <div className="sm-form-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Access</label>
                        <DropdownSelect
                          value={mpAccess}
                          onChange={setMpAccess}
                          options={ACCESS_OPTIONS}
                          placeholder="Free"
                          ariaLabel="Access"
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Cost</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpCost} onChange={e => setMpCost(e.target.value)} placeholder="e.g. ₹65,000"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Duration</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpDuration} onChange={e => setMpDuration(e.target.value)} placeholder="e.g. 3 months"
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Goal</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpGoal} onChange={e => setMpGoal(e.target.value)} placeholder="What goal does this serve?"
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Features</label>
                      <textarea
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none", minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
                        value={mpFeatures} onChange={e => setMpFeatures(e.target.value)} placeholder="Key features or offerings"
                      />
                    </div>

                    <div className="sm-form-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Outcomes</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpOutcomes} onChange={e => setMpOutcomes(e.target.value)} placeholder="Expected outcomes"
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="admin-pp-section-label" style={{ marginBottom: 0 }}>Discount</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpDiscount} onChange={e => setMpDiscount(e.target.value)} placeholder="e.g. 10%"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="admin-pp-btn admin-pp-btn--blue"
                      style={{ marginTop: 4, borderRadius: 50 }}
                      disabled={actionLoading}>
                      {actionLoading ? "Adding..." : "Add to Marketplace"}
                    </button>
                  </form>
                </div>
              )}

              {/* DELETE CONFIRM */}
              {modalScreen === "deleteConfirm" && (
                <div className="sm-confirm">
                  <div className="sm-confirm-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0h10" />
                    </svg>
                  </div>
                  <h3>Delete this step?</h3>
                  <p> will be permanently removed</p>
                  <div className="sm-confirm-actions">
                    <button className="sm-btn-danger" onClick={handleDeleteStep} disabled={actionLoading}>
                      {actionLoading ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button className="sm-btn-ghost" onClick={goBack}>Cancel</button>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {modalScreen === "success" && (
                <div className="sm-success">
                  <div className="sm-success-circle">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3>Done!</h3>
                  <p>Step deleted successfully</p>
                </div>
              )}
            </div>
            {actionLoading && !["deleteConfirm", "editStep", "marketplace_create"].includes(modalScreen) && (
              <div className="sm-loading-overlay">
                <img src={lg1} alt="" style={{ width: 40, height: 40, animation: "smSpin 1s linear infinite" }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyStepsAdmin;