import CustomSelect from '../accDashbaoard/CustomSelect';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCoinContextData } from "../../context/CoinContext.js";
import Skeleton from "react-loading-skeleton";
import "./mypaths.scss";
import axios from "axios";
import { Draggable } from "react-drag-reorder";
import closepop from "../../static/images/dashboard/closepop.svg";
import lg1 from "../../static/images/login/lg1.svg";
import CurrentStep from "../CurrentStep/index.jsx";
import { useStore } from "../../components/store/store.ts";
import { useNavigate, useLocation } from "react-router-dom";
import pathIcon from '../../assets/images/assets/naavi-icon2.webp';
import { SvgCheck, SvgFire, SvgClose } from "../../utils/SvgIcons";
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

const MyPathsAdmin = ({ search, admin, fetchAllServicesAgain, stepDataPage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setaccsideNav } = useStore();
  let userDetails = JSON.parse(localStorage.getItem("adminuser"));
  const { mypathsMenu, setMypathsMenu } = useCoinContextData();
  const [pathChangeRequests, setPathChangeRequests] = useState({}); // { [pathId]: [...changeRequests] }
  const [changeRequestsLoading, setChangeRequestsLoading] = useState({});

  const [adminReplyTexts, setAdminReplyTexts] = useState({});
  const [adminReplyLoading, setAdminReplyLoading] = useState({});
  const [partnerPathData, setPartnerPathData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partnerStepsData, setPartnerStepsData] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [pathActionEnabled, setPathActionEnabled] = useState(false);
  const [pathActionStep, setPathActionStep] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState("");
  const [stepActionEnabled, setStepActionEnabled] = useState(false);
  const [stepActionStep, setStepActionStep] = useState(1);
  const [editPaths, setEditPaths] = useState("default");
  const [selectedPath, setSelectedPath] = useState({});
  const [viewPathEnabled, setViewPathEnabled] = useState(false);
  const [viewPathLoading] = useState(false);
  const [viewPathData, setViewPathData] = useState([]);
  const [showSelectedPath, setShowSelectedPath] = useState(null);
  const [backupPathData, setBackupPathData] = useState([]);
  const [stepId, setStepId] = useState("");
  const [backupPathId, setBackupPathId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [productDataArray, setProductDataArray] = useState([]);
  const [productKeys, setProductKeys] = useState(null);
  const [allServicesToAdd, setAllServicesToAdd] = useState([]);
  const [allServicesToRemove, setAllServicesToRemove] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [pendingPopup, setPendingPopup] = useState(null); // { type: 'approve'|'request'|'reject'|'compare', pathId, path }
  const [rejectChecklist, setRejectChecklist] = useState([]);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectNoteError, setRejectNoteError] = useState(false);
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all"); // "all" | "manual" | "generated"
  const [counts, setCounts] = useState({ all: 0, active: 0, pending: 0, inactive: 0 });
  // ── Marketplace states ────────────────────────────────────────
  const [marketLayer, setMarketLayer] = useState("");
  const [marketplaceItems, setMarketplaceItems] = useState([]);       // all items for this layer
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [attachedServices, setAttachedServices] = useState([]);       // items attached to this step+layer
  const [marketStepId, setMarketStepId] = useState("");
  const [marketStepData, setMarketStepData] = useState(null);

  // ── Marketplace create-listing form states ────────────────────
  const [mpRole, setMpRole] = useState("");
  const [mpName, setMpName] = useState("");
  const [mpAccess, setMpAccess] = useState("Free");
  const [mpCost, setMpCost] = useState("");
  const [mpGoal, setMpGoal] = useState("");
  const [mpOutcomes, setMpOutcomes] = useState("");
  const [mpDuration, setMpDuration] = useState("");
  const [mpFeatures, setMpFeatures] = useState("");
  const [mpDiscount, setMpDiscount] = useState("");
  const [otherIssue, setOtherIssue] = useState("");
  const [vcrSelectedRequest, setVcrSelectedRequest] = useState(null);
  const [creatorModalPath, setCreatorModalPath] = useState(null);

  // ─── Agent vs Manual path source ────────────────────────────
  const AGENT_EMAIL = "pathengine.admin@gmail.com";
  const isAgentGenerated = (path) =>
    (path?.email || "").trim().toLowerCase() === AGENT_EMAIL;

  const getCreatorLabel = (path) => {
    if (isAgentGenerated(path)) {
      return "AI Generated";
    }
    const pd = Array.isArray(path?.partnerDetails) ? path?.partnerDetails[0] : path?.partnerDetails;
    const email = path?.email || pd?.email || pd?.loginEmail;
    return email ? `Manual • ${email}` : "Manual";
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

  // ─── Fetchers ────────────────────────────────────────────────
  const fetchCounts = () => {
    if (!admin) return;
    axios.get(`${BASE_URL}/api/paths/get?status=all`).then(({ data }) => {
      if (data?.status && Array.isArray(data?.data)) {
        const all = data.data;
        setCounts({
          all: all.length,
          active: all.filter(p => p.status === "active").length,
          pending: all.filter(p => p.status === "waitingforapproval" || p.status === "changesrequested").length,
          inactive: all.filter(p => p.status === "inactive").length,
        });
      }
    }).catch(() => {});
  };

  const fetchAllStatusPaths = () => {
    setLoading(true);
    const endpoint = admin
      ? `${BASE_URL}/api/paths/get?status=all`
      : `${BASE_URL}/api/paths/get?email=${userDetails?.email}`;
    axios.get(endpoint).then(({ data }) => {
      setPartnerPathData(data?.data || []);
      if (data?.status && data?.data) setBackupPathData(data.data);
      setLoading(false);
      fetchCounts();
    }).catch(() => setLoading(false));
  };

  const getAllPaths = () => {
    setLoading(true);
    const email = userDetails?.email;
    const endpoint = admin
      ? `${BASE_URL}/api/paths/get?status=active`
      : `${BASE_URL}/api/paths/get?email=${email}`;
    axios.get(endpoint).then(({ data }) => {
      setPartnerPathData(data?.data);
      if (data?.status && data?.data) setBackupPathData(data.data);
      setLoading(false);
      fetchCounts();
    }).catch(() => setLoading(false));
  };

  const getInactivePath = () => {
    setLoading(true);
    const email = userDetails?.email;
    const endpoint = admin
      ? `${BASE_URL}/api/paths/get?status=inactive`
      : `${BASE_URL}/api/paths/get?email=${email}`;
    axios.get(endpoint).then(({ data }) => {
      setPartnerPathData(data?.data);
      setLoading(false);
      fetchCounts();
    }).catch(() => setLoading(false));
  };

  const getNewPath = () => {
    setLoading(true);
    // Fetch both waitingforapproval AND changesrequested paths for Pending Paths tab
    Promise.all([
      axios.get(`${BASE_URL}/api/paths/get?status=waitingforapproval`),
      axios.get(`${BASE_URL}/api/paths/get?status=changesrequested`),
    ]).then(([res1, res2]) => {
      const combined = [
        ...(res1.data?.data || []),
        ...(res2.data?.data || []),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPartnerPathData(combined);
      setLoading(false);
      fetchCounts();
    }).catch(() => setLoading(false));
  };

  const refreshCurrentTabPaths = () => {
    fetchCounts();
    if (mypathsMenu === "All Paths") fetchAllStatusPaths();
    else if (mypathsMenu === "Pending Paths") getNewPath();
    else if (mypathsMenu === "Inactive Paths") getInactivePath();
    else getAllPaths();
  };
  const getAllSteps = () => {
    axios.get(`${BASE_URL}/api/steps/get?status=active`).then(({ data }) => {
      setPartnerStepsData(data?.data);
    });
  };

  /**
   * fetchMarketplaceData — loads:
   *  1. Items attached to this step+layer  (via /marketplace/step/:id?layer=X)
   *  2. ALL items for this layer            (via /marketplace/admin/get-all?layer=X)
   *     The "available" list is derived in the render by filtering out attached ones.
   */

  const fetchChangeRequests = (pathId) => {
    if (pathChangeRequests[pathId]) return; // already loaded
    setChangeRequestsLoading(prev => ({ ...prev, [pathId]: true }));
    axios.get(`${BASE_URL}/api/paths/viewpath/${pathId}`)
      .then(({ data }) => {
        if (data?.status) {
          setPathChangeRequests(prev => ({
            ...prev,
            [pathId]: data.data?.changeRequests || []
          }));
        }
      })
      .catch(() => { })
      .finally(() => setChangeRequestsLoading(prev => ({ ...prev, [pathId]: false })));
  };


  const sendAdminReply = async (pathId, crId) => {
    const msg = (adminReplyTexts[crId] || "").trim();
    if (!msg) return;
    setAdminReplyLoading(prev => ({ ...prev, [crId]: true }));
    setAdminReplyTexts(prev => ({ ...prev, [crId]: "" })); // clear input immediately
    try {
      await axios.patch(`${BASE_URL}/api/paths/reply/${pathId}/${crId}`, {
        from: "admin",
        message: msg,
        adminEmail: userDetails?.email || "",
      });
      // Always do a fresh fetch — bypass cache entirely
      const { data } = await axios.get(`${BASE_URL}/api/paths/viewpath/${pathId}`);
      if (data?.status) {
        setPathChangeRequests(prev => ({
          ...prev,
          [pathId]: data.data?.changeRequests || [],
        }));
      }
    } catch (err) {
      console.error("Admin reply error:", err);
      setAdminReplyTexts(prev => ({ ...prev, [crId]: msg })); // restore on error
    } finally {
      setAdminReplyLoading(prev => ({ ...prev, [crId]: false }));
    }
  };

  const fetchMarketplaceData = (stepId, layer) => {
    const sid = stepId || marketStepId;
    const lay = layer || marketLayer;
    if (!sid || !lay) return;

    setMarketplaceLoading(true);

    // 1. Attached to this step+layer
    axios
      .get(`${BASE_URL}/api/marketplace/step/${sid}?layer=${lay}`)
      .then(({ data }) => {
        setAttachedServices(data?.status ? data.data : []);
      })
      .catch(() => setAttachedServices([]));

    // 2. ALL items for this layer (we compute "available" = all minus attached in render)
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

  const deleteStep = () => {
    setActionLoading(true);
    axios.delete(`${BASE_URL}/api/steps/delete/${selectedStepId}`).then(({ data }) => {
      if (data?.status) {
        setActionLoading(false);
        setStepActionStep(3);
        setTimeout(() => {
          getAllSteps();
          setStepActionEnabled(false);
          setStepActionStep(1);
          setSelectedStepId("");
        }, 2000);
      }
    }).catch(() => setActionLoading(false));
  };

  // ── One-time setup: auxiliary steps, services (deferred for fast initial page load) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      getAllSteps();
      axios.get(`${BASE_URL}/api/services/getservices?status=active`).then(({ data }) => {
        if (data.status) setAllServicesToAdd(data.data);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Read URL tab on mount → set menu + fetch correct data ──
  useEffect(() => {
    fetchCounts();
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "all") {
      setMypathsMenu("All Paths");
      fetchAllStatusPaths();
    } else if (tab === "inactive") {
      setMypathsMenu("Inactive Paths");
      getInactivePath();
    } else if (tab === "pending") {
      setMypathsMenu("Pending Paths");
      getNewPath();
    } else {
      setMypathsMenu("Paths");
      getAllPaths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStepId) {
      axios.get(`${BASE_URL}/api/attachservice/get?step_id=${selectedStepId}`)
        .then(({ data }) => { if (data.status) setAllServicesToRemove(data?.data[0]); })
        .catch(() => { });
    }
  }, [selectedStepId]);

  useEffect(() => {
    if (!productKeys || !Array.isArray(productKeys) || productKeys.length === 0) {
      setProductDataArray([]); return;
    }
    Promise.all(productKeys.map(id =>
      axios.get(`${BASE_URL}/api/services/getbyid/${id}`).then(r => r.data.data).catch(() => null)
    )).then(results => setProductDataArray(results.filter(Boolean)));
  }, [productKeys]);

  useEffect(() => {
    setShowSelectedPath(null);
    setSearchName("");
    setSearchEmail("");
    setSourceTypeFilter("all");
  }, [mypathsMenu]);

  useEffect(() => {
    if (pathActionEnabled || stepActionEnabled) document.body.classList.add("admin-popup-open");
    else document.body.classList.remove("admin-popup-open");
    return () => document.body.classList.remove("admin-popup-open");
  }, [pathActionEnabled, stepActionEnabled]);

  useEffect(() => {
    if (!stepActionEnabled) { setSelectedServices([]); setStepActionStep(1); }
  }, [stepActionEnabled]);

  // ─── Filter ──────────────────────────────────────────────────
  const filteredPartnerPathData = partnerPathData?.filter((entry) => {
    const qName = searchName.trim().toLowerCase();
    const qEmail = searchEmail.trim().toLowerCase();

    const matchesName = qName
      ? entry?.nameOfPath?.toLowerCase()?.includes(qName)
      : true;

    const creatorEmail = (entry?.email || "").toLowerCase();
    const partnerName = (entry?.partnerDetails?.businessName || entry?.partnerDetails?.username || "").toLowerCase();
    const matchesEmail = qEmail
      ? (creatorEmail.includes(qEmail) || partnerName.includes(qEmail))
      : true;

    const isAi = isAgentGenerated(entry);
    const matchesSource =
      sourceTypeFilter === "all"
        ? true
        : sourceTypeFilter === "generated"
        ? isAi
        : !isAi;

    return matchesName && matchesEmail && matchesSource;
  });

  // ─── Pagination states & reset ────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [mypathsMenu, searchName, searchEmail, sourceTypeFilter]);

  // ─── Pagination calculations ──────────────────────────────────
  const totalPathsCount = filteredPartnerPathData?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalPathsCount / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalPathsCount);
  const paginatedPartnerPathData = filteredPartnerPathData?.slice(startIndex, endIndex) || [];

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

  // ─── Reset ───────────────────────────────────────────────────
  const resetPathAction = () => {
    setPathActionEnabled(false);
    setPathActionStep(1);
    setSelectedPathId("");
    setEditPaths("default");
    setSelectedPath([]);
    setViewPathData([]);
    setMarketStepId("");
    setMarketStepData(null);
    setAttachedServices([]);
    setMarketplaceItems([]);
    setMarketLayer("");
    setMpRole(""); setMpName(""); setMpAccess("Free"); setMpCost("");
    setMpGoal(""); setMpOutcomes(""); setMpDuration("");
    setMpFeatures(""); setMpDiscount("");
  };

  // ─── Path Actions ─────────────────────────────────────────────
  const deletePath = () => {
    setActionLoading(true);
    axios.delete(`${BASE_URL}/api/paths/delete/${selectedPathId}`).then(({ data }) => {
      if (data?.status) {
        setActionLoading(false);
        setPathActionStep(3);
        refreshCurrentTabPaths();
      }
    }).catch(() => setActionLoading(false));
  };

  const reactivatePath = () => {
    setActionLoading(true);
    axios.put(`${BASE_URL}/api/paths/reactivate/${selectedPathId}`).then(({ data }) => {
      if (data?.status) { setActionLoading(false); setPathActionStep(3); refreshCurrentTabPaths(); }
    }).catch(() => setActionLoading(false));
  };

  const handleApprovePath = () => {
    setActionLoading(true);
    axios.put(`${BASE_URL}/api/paths/updatepath/${selectedPathId}`, { status: "active" }).then(({ data }) => {
      if (data.status) { refreshCurrentTabPaths(); setPathActionEnabled(false); setActionLoading(false); setPathActionStep(1); }
    }).catch(() => setActionLoading(false));
  };

  const handleRejectPath = () => {
    setActionLoading(true);
    axios.put(`${BASE_URL}/api/paths/updatepath/${selectedPathId}`, { status: "draft" }).then(({ data }) => {
      if (data.status) {
        refreshCurrentTabPaths();
        setPathActionEnabled(false); setActionLoading(false); setPathActionStep(1);
      }
    });
  };


  const REJECT_ISSUES = [
    "Price needs to be reduced",
    "Path description is too vague",
    "Steps are incomplete",
    "Duration is unrealistic",
    "Images / media missing",
    "Target audience not specified",
    <input
      type="text"
      placeholder="Other (type here)"
      className="popup-note-area"
      value={otherIssue}                          // ← was rejectNote
      onChange={(e) => setOtherIssue(e.target.value)}  // ← was setRejectNote
    />
  ];

  const toggleRejectCheck = (issue) => {
    setRejectChecklist(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const closePendingPopup = () => {
    setPendingPopup(null);
    setRejectChecklist([]);
    setRejectNote("");
    setOtherIssue("");
    setRejectNoteError(false);
    setVcrSelectedRequest(null); // ← add this
  };




  const handleRequestChanges = () => {
    if (!rejectNote.trim()) { setRejectNoteError(true); return; }
    setActionLoading(true);

    const allIssues = [
      ...rejectChecklist,
      ...(otherIssue.trim() ? [otherIssue.trim()] : []),
    ];

    axios.put(`${BASE_URL}/api/paths/requestchanges/${pendingPopup?.pathId}`, {
      issues: allIssues,
      adminNote: rejectNote,
      adminEmail: userDetails?.email || "",
    })
      .then(({ data }) => {
        if (data.status) {
          getNewPath();
          closePendingPopup();
        }
      })
      .catch((err) => {
        console.error("Request changes error:", err);
      })
      .finally(() => {
        setActionLoading(false);
      });
  };


  const handleFinalReject = () => {
    if (!rejectNote.trim()) { setRejectNoteError(true); return; }
    setActionLoading(true);
    axios.put(`${BASE_URL}/api/paths/updatepath/${pendingPopup?.pathId}`, {
      status: "draft",
      review_notes: rejectNote.trim(),
    }).then(({ data }) => {
      if (data.status) { refreshCurrentTabPaths(); setActionLoading(false); closePendingPopup(); }
    }).catch(() => setActionLoading(false));
  };

  const handleApproveConfirm = () => {
    setActionLoading(true);
    axios.put(`${BASE_URL}/api/paths/updatepath/${pendingPopup?.pathId}`, { status: "active" }).then(({ data }) => {
      if (data.status) { refreshCurrentTabPaths(); setActionLoading(false); closePendingPopup(); }
    }).catch(() => setActionLoading(false));
  };





  const handlePlace = (item, index) => {
    const arr = (item?.the_ids || []).map(({ step_id, backup_pathId }) => ({ step_id, backup_pathId }));
    arr.splice(index, 0, { step_id: stepId, backup_pathId: backupPathId });
    axios.patch(`${BASE_URL}/api/paths/edit`, { pathId: selectedPath?._id, the_ids: arr }).then(({ data }) => {
      if (data.status) { resetPathAction(); getAllPaths(); }
    });
  };

  const handledeletePathPosition = (fullObject, idToDelete) => {
    const updated = [...fullObject.the_ids];
    const idx = updated.findIndex(o => o.step_id === idToDelete);
    if (idx !== -1) updated.splice(idx, 1);
    const body = updated.map(({ step_id, backup_pathId }) => ({ step_id, backup_pathId }));
    axios.patch(`${BASE_URL}/api/paths/edit`, { pathId: selectedPath?._id, the_ids: body }).then(({ data }) => {
      if (data.status) { resetPathAction(); getAllPaths(); }
    });
  };

  const getChangedPos = (currentPos, newPos) => {
    if (!Array.isArray(selectedPath?.StepDetails) || currentPos === newPos) return;
    const reordered = [...selectedPath.StepDetails];
    const [moved] = reordered.splice(currentPos, 1);
    reordered.splice(newPos, 0, moved);
    const body = reordered.map(s => ({ step_id: s._id, backup_pathId: s.backup_pathId || null }));
    axios.patch(`${BASE_URL}/api/paths/edit`, { pathId: selectedPath._id, the_ids: body }).then(({ data }) => {
      if (data.status) {
        axios.get(`${BASE_URL}/api/paths/viewpath/${selectedPath._id}`).then(({ data }) => {
          if (data?.data) setSelectedPath(data.data);
        });
      }
    });
  };

  const handleSelectServicesForStep = (id) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const addServicesToStep = () => {
    setActionLoading(true);
    axios.post(`${BASE_URL}/api/steps/attachservice`, { step_id: selectedStepId, service_ids: [...selectedServices] }).then(({ data }) => {
      if (data.status) { setStepActionEnabled(false); setActionLoading(false); setSelectedServices([]); fetchAllServicesAgain(); getAllPaths(); }
    }).catch(() => setActionLoading(false));
  };

  const removeServiceFromStep = (id) => {
    setActionLoading(true);
    axios.delete(`${BASE_URL}/api/steps/service/${selectedStepId}/${id}`).then(({ data }) => {
      if (data.status) { setStepActionEnabled(false); setActionLoading(false); fetchAllServicesAgain(); getAllPaths(); }
    }).catch(() => setActionLoading(false));
  };

  // ─── Marketplace Actions ──────────────────────────────────────

  /**
   * attachMarketService — links an existing marketplace item to this step+layer.
   * Updates: marketplace item's step_id + step's [layer]_marketplace array.
   */
  const attachMarketService = (item) => {
    setActionLoading(true);

    const fieldKey = `${marketLayer}_marketplace`;
    const currentIds = (marketStepData?.[fieldKey] || []).map(id => id.toString());

    if (currentIds.includes(item._id.toString())) {
      setActionLoading(false);
      return;
    }

    const updatedIds = [...currentIds, item._id.toString()];

    // 1. Update the step's [layer]_marketplace array
    axios
      .put(`${BASE_URL}/api/steps/update/${marketStepId}`, { [fieldKey]: updatedIds })
      .then(({ data }) => {
        if (data?.status) {
          setMarketStepData(prev => ({ ...prev, [fieldKey]: updatedIds }));

          // 2. Update the marketplace item's step_id
          axios.patch(`${BASE_URL}/api/marketplace/link-step`, {
            item_id: item._id,
            step_id: marketStepId,
          }).then(() => {
            // 3. Move item from "available" to "attached" in UI
            setAttachedServices(prev => [...prev, item]);
            setMarketplaceItems(prev =>
              prev.map(m => m._id === item._id ? { ...m, step_id: marketStepId } : m)
            );
          });
        }
        setActionLoading(false);
      })
      .catch(() => setActionLoading(false));
  };

  /**
   * detachMarketService — removes a marketplace item from this step+layer.
   * Updates: marketplace item's step_id → null + step's [layer]_marketplace array.
   */
  const detachMarketService = (item) => {
    setActionLoading(true);

    const fieldKey = `${marketLayer}_marketplace`;
    const currentIds = (marketStepData?.[fieldKey] || []).map(id => id.toString());
    const updatedIds = currentIds.filter(id => id !== item._id.toString());

    // 1. Update the step's [layer]_marketplace array
    axios
      .put(`${BASE_URL}/api/steps/update/${marketStepId}`, { [fieldKey]: updatedIds })
      .then(({ data }) => {
        if (data?.status) {
          setMarketStepData(prev => ({ ...prev, [fieldKey]: updatedIds }));

          // 2. Nullify the marketplace item's step_id
          axios.patch(`${BASE_URL}/api/marketplace/link-step`, {
            item_id: item._id,
            step_id: null,
          }).then(() => {
            // 3. Move item from "attached" back to full list in UI
            setAttachedServices(prev => prev.filter(s => s._id !== item._id));
            setMarketplaceItems(prev =>
              prev.map(m => m._id === item._id ? { ...m, step_id: null } : m)
            );
          });
        }
        setActionLoading(false);
      })
      .catch(() => setActionLoading(false));
  };

  // ─── Back navigation ─────────────────────────────────────────
  const handleBack = () => {
    const backMap = {
      "Edit steps": "default",
      "add_step": "Edit steps",
      "add_sub_step": "add_step",
      "show_all_paths": "add_sub_step",
      "remove_step": "Edit steps",
      "reorder_step": "Edit steps",
      "marketplace_steps": "default",
      "marketplace_layer": "marketplace_steps",
      "marketplace_attach": "marketplace_layer",
      "marketplace_create": "marketplace_attach",
    };
    if (editPaths !== "default") setEditPaths(backMap[editPaths] || "default");
    else setPathActionStep(1);
  };

  const showBack = pathActionStep > 1 || editPaths !== "default";

  const getModalTitle = () => {
    if (["Edit steps", "add_step", "add_sub_step", "show_all_paths", "remove_step", "reorder_step"].includes(editPaths)) return "Edit Path";
    if (["marketplace_steps", "marketplace_layer", "marketplace_attach", "marketplace_create"].includes(editPaths)) return "Marketplace";
    if (pathActionStep === 5) return "Approve Path";
    if (pathActionStep === 6) return "Reject Path";
    if (pathActionStep === 2) return mypathsMenu === "Inactive Paths" ? "Reactivate Path" : "Delete Path";
    if (pathActionStep === 3) return "Done";
    if (pathActionStep === 4) return "Edit Path";
    return "Path Actions";
  };

  // ─── SVG Icons ───────────────────────────────────────────────
  const IconPencil = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
  const IconTrash = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0h10" />
      <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
  const IconCheck = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  const IconShop = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
  const IconChevron = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const ActionCard = ({ color, icon, title, desc, onClick }) => (
    <div className={`pp-card pp-card--${color}`} onClick={onClick}>
      <div className="pp-card-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );

  const OptionRow = ({ iconColor, icon, title, sub, onClick }) => (
    <div className="pp-option-item" onClick={onClick}>
      <div className={`pp-option-icon pp-option-icon--${iconColor}`}>{icon}</div>
      <div className="pp-option-content"><strong>{title}</strong><span>{sub}</span></div>
      <IconChevron />
    </div>
  );

  // Convenience: current layer config object
  const currentLayerCfg = marketStepData ? getLayerConfig(marketStepData)[marketLayer] : null;

  // Derived: items NOT yet attached to this step (available to attach)
  const attachedIds = new Set(attachedServices.map(s => s._id?.toString()));
  const availableItems = marketplaceItems.filter(
    item => !attachedIds.has(item._id?.toString())
  );

  return (
    <div className="admin-mypaths">

      {/* TOPBAR */}
      <div className="admin-paths-topbar">
        {/* Status Tabs with real counts */}
        <div className="admin-paths-tabs">
          {admin && (
            <button
              type="button"
              className={`paths-tab ${mypathsMenu === "All Paths" ? "active" : ""}`}
              onClick={() => {
                setMypathsMenu("All Paths");
                setViewPathEnabled(false);
                setViewPathData([]);
                setSearchName("");
                setSearchEmail("");
                setSourceTypeFilter("all");
                fetchAllStatusPaths();
                navigate("/admin/dashboard/paths?tab=all");
              }}>
              <span className="tab-dot dot-all"></span>
              All Paths
              {counts.all > 0 && <span className="tab-count">{counts.all}</span>}
            </button>
          )}

          <button
            type="button"
            className={`paths-tab ${mypathsMenu === "Paths" ? "active" : ""}`}
            onClick={() => {
              setMypathsMenu("Paths");
              setViewPathEnabled(false);
              setViewPathData([]);
              setSearchName("");
              setSearchEmail("");
              setSourceTypeFilter("all");
              getAllPaths();
              navigate("/admin/dashboard/paths?tab=active");
            }}>
            <span className="tab-dot dot-active"></span>
            {admin ? "Active Paths" : "Paths"}
            {counts.active > 0 && <span className="tab-count">{counts.active}</span>}
          </button>

          {admin && (
            <button
              type="button"
              className={`paths-tab ${mypathsMenu === "Pending Paths" ? "active" : ""}`}
              onClick={() => {
                setMypathsMenu("Pending Paths");
                setViewPathEnabled(false);
                setViewPathData([]);
                setSearchName("");
                setSearchEmail("");
                setSourceTypeFilter("all");
                getNewPath();
                navigate("/admin/dashboard/paths?tab=pending");
              }}>
              <span className="tab-dot dot-pending"></span>
              Pending Paths
              {counts.pending > 0 && <span className="tab-count">{counts.pending}</span>}
            </button>
          )}

          {admin && (
            <button
              type="button"
              className={`paths-tab ${mypathsMenu === "Inactive Paths" ? "active" : ""}`}
              onClick={() => {
                setMypathsMenu("Inactive Paths");
                setViewPathEnabled(false);
                setViewPathData([]);
                setSearchName("");
                setSearchEmail("");
                setSourceTypeFilter("all");
                getInactivePath();
                navigate("/admin/dashboard/paths?tab=inactive");
              }}>
              <span className="tab-dot dot-inactive"></span>
              Inactive Paths
              {counts.inactive > 0 && <span className="tab-count">{counts.inactive}</span>}
            </button>
          )}
        </div>

        {/* Row 2: Type Filters & Search */}
        <div className="admin-paths-controls">
          {/* Creation Type Filter: All / Manual / AI Generated */}
          <div className="paths-type-filter">
            <span className="filter-label">Source:</span>
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-btn ${sourceTypeFilter === "all" ? "active" : ""}`}
                onClick={() => setSourceTypeFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`type-btn ${sourceTypeFilter === "manual" ? "active" : ""}`}
                onClick={() => setSourceTypeFilter("manual")}
                title="Paths created manually by partners/admins"
              >
                <span className="type-dot manual-dot"></span> Manuals
              </button>
              <button
                type="button"
                className={`type-btn ${sourceTypeFilter === "generated" ? "active" : ""}`}
                onClick={() => setSourceTypeFilter("generated")}
                title="AI Agent Generated Paths"
              >
                <span className="type-dot ai-dot"></span> AI Generated
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <div className="admin-paths-search-row">
            <div className="paths-search-input">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by path name..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
              />
              {searchName && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchName("")} title="Clear" aria-label="Clear search">
                  <SvgClose size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="paths-search-input">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="text"
                placeholder="Search by creator / email..."
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
              />
              {searchEmail && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchEmail("")} title="Clear" aria-label="Clear search">
                  <SvgClose size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {(searchName || searchEmail || sourceTypeFilter !== "all") && (
              <button
                type="button"
                className="paths-reset-filter-btn"
                onClick={() => {
                  setSearchName("");
                  setSearchEmail("");
                  setSourceTypeFilter("all");
                }}
                title="Reset all filters"
              >
                Reset Filters
              </button>
            )}

            <div className="paths-count-badge">
              <strong>{filteredPartnerPathData?.length || 0}</strong> {filteredPartnerPathData?.length === 1 ? "Path" : "Paths"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-mypaths-content">
        {showSelectedPath ? (
          <div>
            <CurrentStep
              productDataArray={productDataArray}
              selectedPathId={selectedPathId}
              showSelectedPath={showSelectedPath}
              selectedPath={selectedPath}
            />
          </div>
        ) : viewPathEnabled ? (
          <div className="admin-viewpath-container">
            <div className="admin-viewpath-top-area">
              <div>Your Selected Path:</div>
              {viewPathLoading ? <Skeleton width={150} height={30} /> : (
                <div className="admin-viewpath-bold-text">
                  {viewPathData && Object.keys(viewPathData).length > 0 ? viewPathData?.destination_institution : ""}
                </div>
              )}
              {viewPathLoading ? <Skeleton width={500} height={20} /> : (
                <div className="admin-viewpath-des">
                  {viewPathData && Object.keys(viewPathData).length > 0 ? viewPathData?.description : ""}
                </div>
              )}
              <div className="admin-viewpath-goBack-div" onClick={() => setViewPathEnabled(false)}>Go Back</div>
            </div>
            <div className="admin-viewpath-steps-area">
              {viewPathLoading
                ? Array(6).fill("").map((_, i) => (
                  <div className="admin-viewpath-each-j-step" key={i}>...</div>
                ))
                : viewPathData?.StepDetails?.map((e, i) => (
                  <div
                    key={i}
                    className="admin-viewpath-each-j-step enhanced-step-card"
                    onClick={() => {
                      setShowSelectedPath(e);
                      setProductKeys(e?.product_ids);
                    }}
                  >
                    {/* STEP HEADER */}
                    <div className="step-top">
                      <div className="step-icon">
                        <img src={e?.icon} alt="" />
                      </div>
                      <div className="step-info">
                        <div className="step-title">{i + 1}. {e?.name}</div>
                        <div className="step-desc">{e?.description}</div>
                      </div>
                    </div>

                    {/* <SvgFire size={14} /> 3 VIEW CARDS */}
                    <div className="step-views">

                      {/* MACRO */}
                      <div className="view-card macro">
                        <div className="view-label">Macro</div>
                        <div className="view-name">
                          {e?.macro_name || "Macro View"}
                        </div>
                        <div className="view-desc">
                          {e?.macro_description || "High level overview"}
                        </div>
                      </div>

                      {/* MICRO */}
                      <div className="view-card micro">
                        <div className="view-label">Micro</div>
                        <div className="view-name">
                          {e?.micro_name || "Micro View"}
                        </div>
                        <div className="view-desc">
                          {e?.micro_description || "Mid level details"}
                        </div>
                      </div>

                      {/* NANO */}
                      <div className="view-card nano">
                        <div className="view-label">Nano</div>
                        <div className="view-name">
                          {e?.nano_name || "Nano View"}
                        </div>
                        <div className="view-desc">
                          {e?.nano_description || "Detailed execution"}
                        </div>
                      </div>

                    </div>

                    {/* COST (optional) */}
                    {e?.cost && (
                      <div className="step-cost">
                        {e?.cost}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="paths-table-body">
            {loading ? (
              Array(8).fill("").map((_, i) => (
                <div className="paths-table-row" key={i}>
                  <div className="paths-col-name"><Skeleton width={120} height={20} /></div>
                  <div className="paths-col-desc"><Skeleton width="90%" height={20} /></div>
                  <div className="paths-col-steps"><Skeleton width={70} height={28} borderRadius={50} /></div>
                </div>
              ))
            ) : filteredPartnerPathData?.length > 0 ? (
              paginatedPartnerPathData.map((path, i) => (
                mypathsMenu === "Pending Paths" ? (
                  <div className="pending-path-card" key={i}>
                    <div className="pending-card-top">
                      <div className="pending-card-left">
                        <div className="admin-icon-box">
                          <img src={pathIcon} alt="path" style={{ width: "14px", height: "14px", objectFit: "contain" }} />
                        </div>
                        <span className="pending-path-name">{path?.nameOfPath}</span>
                        <span
                          className={`path-source-pill ${isAgentGenerated(path) ? "path-source-pill--agent" : "path-source-pill--manual"} clickable`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setCreatorModalPath(path);
                          }}
                          title="Click to view creator & partner details"
                        >
                          {getCreatorLabel(path)}
                        </span>
                      </div>
                      <span className="pending-date">
                        {path?.createdAt ? new Date(path.createdAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        }) : ""}
                      </span>
                    </div>

                    <p className="pending-desc">
                      {expandedRows[path?._id]
                        ? path?.description
                        : (path?.description?.length > 160 ? path?.description?.substring(0, 160) + "..." : path?.description)}
                      {path?.description?.length > 160 && (
                        <span className="path-desc-toggle"
                          onClick={() => setExpandedRows(prev => ({ ...prev, [path._id]: !prev[path._id] }))}>
                          {expandedRows[path?._id] ? " Read Less" : " Read More"}
                        </span>
                      )}
                    </p>

                    <div className="pending-action-row">
                      <button className="pab pab--review"
                        onClick={() => { localStorage.setItem("selectedPathId", path?._id); navigate(`/dashboard/path/${path?._id}`); }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        View steps
                      </button>
                      <button className="pab pab--approve"
                        onClick={() => setPendingPopup({ type: "approve", pathId: path?._id, path: path })}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        Approve
                      </button>
                      <button className="pab pab--request"
                        onClick={() => { setRejectChecklist([]); setRejectNote(""); setRejectNoteError(false); setPendingPopup({ type: "request", pathId: path?._id, path: path }); }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        Request Changes
                      </button>
                      <button className="pab pab--compare"
                        onClick={() => {
                          fetchChangeRequests(path?._id);
                          setPendingPopup({ type: "compare", pathId: path?._id, path: path });
                        }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>
                        Review
                      </button>
                      <button className="pab pab--reject"
                        onClick={() => { setRejectChecklist([]); setRejectNote(""); setRejectNoteError(false); setPendingPopup({ type: "reject", pathId: path?._id, path: path }); }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Reject
                      </button>
                    </div>

                  </div>

                ) : (
                  <div className="paths-table-row" key={i}
                    onClick={async () => {
                      setPathActionEnabled(true);
                      setSelectedPathId(path?._id);
                      const res = await axios.get(`${BASE_URL}/api/paths/viewpath/${path?._id}`);
                      if (res.data?.data) setSelectedPath(res.data.data);
                    }}>
                    <div className="paths-col-name">
                      <div className="admin-icon-box">
                        <img src={pathIcon} alt="path" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
                      </div>
                      <span className="path-name-text">{path?.nameOfPath}</span>
                      <span
                        className={`path-source-pill ${isAgentGenerated(path) ? "path-source-pill--agent" : "path-source-pill--manual"} clickable`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setCreatorModalPath(path);
                        }}
                        title="Click to view creator & partner details"
                      >
                        {getCreatorLabel(path)}
                      </span>
                      {(mypathsMenu === "All Paths" || path?.status !== "active") && (
                        <span className={`path-status-pill status-${path?.status || "active"}`}>
                          <span className="status-dot"></span>
                          {path?.status === "waitingforapproval"
                            ? "Pending"
                            : path?.status === "changesrequested"
                            ? "Changes Req."
                            : path?.status === "inactive"
                            ? "Inactive"
                            : path?.status === "draft"
                            ? "Draft"
                            : "Active"}
                        </span>
                      )}
                    </div>
                    <div className="paths-col-desc" onClick={ev => ev.stopPropagation()}>
                      <p className="path-desc-text">
                        {expandedRows[path?._id] ? path?.description : (path?.description?.length > 120 ? path?.description?.substring(0, 120) + "..." : path?.description)}
                        {path?.description?.length > 120 && (
                          <span className="path-desc-toggle" onClick={ev => { ev.stopPropagation(); setExpandedRows(prev => ({ ...prev, [path._id]: !prev[path._id] })); }}>
                            {expandedRows[path?._id] ? " Read Less" : " Read More"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="paths-col-steps">
                      <div className="path-meta-info">
                        <span className="meta-date">
                          {(function () {
                            const date = path?.createdAt ? new Date(path.createdAt) : new Date();
                            return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
                          })()}
                        </span>
                      </div>
                      <div className="path-actions-group">
                        <button
                          className="admin-view-steps-btn"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (setaccsideNav) setaccsideNav("Steps");
                            navigate(`/admin/dashboard/steps?tab=active&pathId=${path?._id}&pathName=${encodeURIComponent(path?.nameOfPath || "")}`);
                          }}
                        >
                          View Steps
                        </button>
                        <span className="actions-pill">Actions</span>
                      </div>
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="paths-empty-state">
                <div className="empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h3>No paths found</h3>
                <p>
                  {searchName || searchEmail || sourceTypeFilter !== "all"
                    ? "No pathways match your current filter criteria. Try adjusting or resetting filters."
                    : `No ${mypathsMenu.toLowerCase()} available at the moment.`}
                </p>
                {(searchName || searchEmail || sourceTypeFilter !== "all") && (
                  <button
                    type="button"
                    className="empty-reset-btn"
                    onClick={() => {
                      setSearchName("");
                      setSearchEmail("");
                      setSourceTypeFilter("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* ─── PAGINATION CONTROLS ─── */}
            {totalPathsCount > 0 && !loading && (
              <div className="admin-paths-pagination">
                <div className="paths-pagination-left">
                  <span className="paths-pagination-info">
                    Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalPathsCount}</strong> {totalPathsCount === 1 ? "path" : "paths"}
                  </span>
                  <div className="paths-per-page-selector">
                    <label htmlFor="paths-per-page">Rows per page:</label>
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
                        id="paths-per-page"
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

                <div className="paths-pagination-controls">
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
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          PATH ACTION MODAL
      ══════════════════════════════════════════════════════════ */}
      {pathActionEnabled && (
        <>
          <div className="pp-overlay" onClick={() => resetPathAction()} />
          <div className="pp-modal">

            <div className="pp-header">
              <div className="pp-header-left">
                <h3 className="pp-title">{getModalTitle()}</h3>
                <p className="pp-subtitle">{selectedPath?.nameOfPath || "—"}</p>
              </div>
              <div className="pp-header-right">
                {showBack && (
                  <button className="pp-back-btn" onClick={handleBack}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                  </button>
                )}
                <button className="pp-close-btn" onClick={() => resetPathAction()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="pp-body">

              {/* ── STEP 1: MAIN ACTIONS — ACTIVE / INACTIVE ── */}
              {pathActionStep === 1 && editPaths === "default" && mypathsMenu !== "Pending Paths" && (
                <div className="pp-cards-grid">
                  {/* For Inactive Paths: only show Review and Reactivate */}
                  {mypathsMenu === "Inactive Paths" ? (
                    <>
                      <ActionCard
                        color="green"
                        icon={<IconCheck />}
                        title="Reactivate Path"
                        desc="Restore this path to active"
                        onClick={() => setPathActionStep(2)}
                      />
                      <ActionCard
                        color="purple"
                        icon={<IconPencil />}
                        title="Review Path"
                        desc="Open the complete path page"
                        onClick={() => { localStorage.setItem("selectedPathId", selectedPathId); navigate(`/dashboard/path/${selectedPathId}`); }}
                      />
                    </>
                  ) : (
                    <>
                      <ActionCard
                        color="blue"
                        icon={<IconPencil />}
                        title="Edit Path"
                        desc="Modify steps, metadata, or structure"
                        onClick={() => setPathActionStep(4)}
                      />
                      <ActionCard
                        color="red"
                        icon={<IconTrash />}
                        title="Delete Path"
                        desc="Permanently remove this path"
                        onClick={() => setPathActionStep(2)}
                      />
                      <ActionCard
                        color="purple"
                        icon={<IconPencil />}
                        title="Review Path"
                        desc="Open the complete path page"
                        onClick={() => { localStorage.setItem("selectedPathId", selectedPathId); navigate(`/dashboard/path/${selectedPathId}`); }}
                      />
                      <ActionCard
                        color="teal"
                        icon={<IconShop />}
                        title="Marketplace"
                        desc="Attach services to steps"
                        onClick={() => setEditPaths("marketplace_steps")}
                      />
                    </>
                  )}
                </div>
              )}

              {/* ── STEP 2: DELETE / REACTIVATE CONFIRM ── */}
              {pathActionStep === 2 && (
                <div className="pp-confirm">
                  <div className={`pp-confirm-icon ${mypathsMenu === "Inactive Paths" ? "pp-confirm-icon--green" : "pp-confirm-icon--red"}`}>
                    {mypathsMenu === "Inactive Paths"
                      ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                      : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0h10" /></svg>}
                  </div>
                  <h3>{mypathsMenu === "Inactive Paths" ? "Reactivate this path?" : "Delete this path?"}</h3>
                  <p className="pp-confirm-msg">
                    <strong>"{selectedPath?.nameOfPath}"</strong> will be {mypathsMenu === "Inactive Paths" ? "restored and visible to users." : "permanently removed. This cannot be undone."}
                  </p>
                  <div className="pp-confirm-actions">
                    <button
                      className={`pp-btn ${mypathsMenu === "Inactive Paths" ? "pp-btn--green" : "pp-btn--red"}`}
                      onClick={() => mypathsMenu === "Inactive Paths" ? reactivatePath() : deletePath()}>
                      {actionLoading ? "Processing..." : mypathsMenu === "Inactive Paths" ? "Yes, Reactivate" : "Yes, Delete"}
                    </button>
                    <button className="pp-btn pp-btn--ghost" onClick={() => setPathActionStep(1)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: SUCCESS ── */}
              {pathActionStep === 3 && (
                <div className="pp-success">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 6-6" />
                  </svg>
                  <h3>Done!</h3>
                  <p>Action completed successfully</p>
                </div>
              )}

              {/* ── STEP 4: EDIT OPTIONS ── */}
              {pathActionStep === 4 && editPaths === "default" && (
                <div className="pp-option-list">
                  <p className="pp-section-label">What would you like to edit?</p>
                  <OptionRow
                    iconColor="blue"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
                        <circle cx="3" cy="6" r="1" fill="currentColor" />
                        <circle cx="3" cy="12" r="1" fill="currentColor" />
                        <circle cx="3" cy="18" r="1" fill="currentColor" />
                      </svg>
                    }
                    title="Edit Steps"
                    sub="Add, remove, or reorder steps in this path"
                    onClick={() => setEditPaths("Edit steps")}
                  />
                </div>
              )}

              {/* ── STEP MANAGEMENT ── */}
              {editPaths === "Edit steps" && (
                <div className="pp-option-list">
                  <p className="pp-section-label">Step Management</p>
                  <OptionRow
                    iconColor="green"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
                    title="Add New Step" sub="Insert a step from your library" onClick={() => setEditPaths("add_step")}
                  />
                  <OptionRow
                    iconColor="red"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                    title="Remove Step" sub="Delete a step from this path" onClick={() => setEditPaths("remove_step")}
                  />
                  <OptionRow
                    iconColor="amber"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    }
                    title="Reorder Steps" sub="Drag and drop to change sequence" onClick={() => setEditPaths("reorder_step")}
                  />
                </div>
              )}

              {/* ── ADD STEP ── */}
              {editPaths === "add_step" && (
                <div className="pp-selector">
                  <p className="pp-section-label">Select step to add</p>
                  <div className="pp-selector-list">
                    {partnerStepsData?.map(item => {
                      const added = selectedPath?.StepDetails?.some(s => s._id === item._id);
                      return (
                        <div key={item._id} className={`pp-selector-item ${added ? "pp-selector-item--disabled" : ""}`}
                          onClick={() => { if (!added) { setEditPaths("add_sub_step"); setStepId(item._id); } }}>
                          <div className="pp-selector-item-body">
                            <strong>{item?.name}</strong>
                            {item?.description && <p>{item.description.substring(0, 110)}{item.description.length > 110 ? "..." : ""}</p>}
                            <code>{item?._id}</code>
                          </div>
                          <span className={`pp-tag ${added ? "pp-tag--gray" : "pp-tag--blue"}`}>{added ? "Already Added" : "Select →"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SELECT BACKUP PATH ── */}
              {editPaths === "add_sub_step" && (
                <div className="pp-selector">
                  <p className="pp-section-label">Select backup path</p>
                  <div className="pp-selector-list">
                    {backupPathData?.map(item => (
                      <div key={item._id} className="pp-selector-item"
                        onClick={() => { setEditPaths("show_all_paths"); setBackupPathId(item._id); }}>
                        <div className="pp-selector-item-body">
                          <strong>{item?.nameOfPath}</strong>
                          {item?.description && <p>{item.description.substring(0, 110)}{item.description.length > 110 ? "..." : ""}</p>}
                          <code>{item?._id}</code>
                        </div>
                        <span className="pp-tag pp-tag--indigo">Select →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CHOOSE POSITION ── */}
              {editPaths === "show_all_paths" && (
                <div className="pp-position">
                  <p className="pp-section-label">Choose insertion position</p>
                  <div className="pp-position-list">
                    {selectedPath?.StepDetails?.map((item, index) => (
                      <React.Fragment key={item._id}>
                        <div className="pp-position-step">
                          <span className="pp-step-num">{index + 1}</span>
                          <span className="pp-step-name">{item.name}</span>
                        </div>
                        <button className="pp-insert-btn" onClick={() => handlePlace(selectedPath, index + 1)}>+ Insert Here</button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REMOVE STEP ── */}
              {editPaths === "remove_step" && (
                <div className="pp-selector">
                  <p className="pp-section-label">Select step to remove</p>
                  <div className="pp-selector-list">
                    {selectedPath?.StepDetails?.filter(item => item?.name)?.map(item => (
                      <div key={item._id} className="pp-selector-item pp-selector-item--remove"
                        onClick={() => handledeletePathPosition(selectedPath, item._id)}>
                        <div className="pp-selector-item-body">
                          <strong>{item?.name}</strong>
                          {item?.description && <p>{item.description.substring(0, 110)}{item.description.length > 110 ? "..." : ""}</p>}
                          <code>{item?._id}</code>
                        </div>
                        <span className="pp-tag pp-tag--red">Remove</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REORDER STEPS ── */}
              {editPaths === "reorder_step" && (
                <div className="pp-reorder">
                  <p className="pp-section-label">Drag to reorder</p>
                  <div className="pp-reorder-list">
                    {Array.isArray(selectedPath?.StepDetails) && selectedPath.StepDetails.length > 0 ? (
                      <Draggable onPosChange={(cur, nxt) => { if (cur !== nxt) getChangedPos(cur, nxt); }}>
                        {selectedPath.StepDetails.map((item, idx) => (
                          <div key={item._id} className="pp-reorder-item">
                            <div className="pp-reorder-handle">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                              </svg>
                            </div>
                            <span className="pp-reorder-num">{idx + 1}</span>
                            <div className="pp-reorder-content">
                              <strong>{item.name}</strong>
                              {item.description && <span>{item.description.substring(0, 80)}{item.description.length > 80 ? "..." : ""}</span>}
                            </div>
                          </div>
                        ))}
                      </Draggable>
                    ) : (
                      <div className="pp-empty">No steps to reorder</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 5: APPROVE CONFIRM ── */}
              {pathActionStep === 5 && (
                <div className="pp-confirm">
                  <div className="pp-confirm-icon pp-confirm-icon--green">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <h3>Approve this path?</h3>
                  <p className="pp-confirm-msg">This path will become visible to all users.</p>
                  <div className="pp-confirm-actions">
                    <button className="pp-btn pp-btn--green" onClick={handleApprovePath}>{actionLoading ? "Processing..." : "Yes, Approve"}</button>
                    <button className="pp-btn pp-btn--ghost" onClick={() => setPathActionStep(1)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── STEP 6: REJECT CONFIRM ── */}
              {pathActionStep === 6 && (
                <div className="pp-confirm">
                  <div className="pp-confirm-icon pp-confirm-icon--red">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <h3>Reject this path?</h3>
                  <p className="pp-confirm-msg">It will be moved to drafts for revision.</p>
                  <div className="pp-confirm-actions">
                    <button className="pp-btn pp-btn--red" onClick={handleRejectPath}>{actionLoading ? "Processing..." : "Yes, Reject"}</button>
                    <button className="pp-btn pp-btn--ghost" onClick={() => setPathActionStep(1)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  MARKETPLACE STEP 1 — SELECT STEP
              ══════════════════════════════════════════════════════ */}
              {editPaths === "marketplace_steps" && (
                <div className="pp-selector">
                  <p className="pp-section-label">Select a step to manage its marketplace</p>
                  <div className="pp-selector-list">
                    {selectedPath?.StepDetails?.filter(s => s?.name)?.map(step => (
                      <div
                        key={step._id}
                        className="pp-selector-item"
                        onClick={() => {
                          setMarketStepId(step._id);
                          setAttachedServices([]);
                          setMarketplaceItems([]);
                          axios.get(`${BASE_URL}/api/steps/${step._id}`)
                            .then(({ data }) => {
                              if (data?.data) setMarketStepData(data.data);
                            });
                          setEditPaths("marketplace_layer");
                        }}>
                        <div className="pp-selector-item-body">
                          <strong>{step.name}</strong>
                          {step.description && <p>{step.description.substring(0, 80)}{step.description.length > 80 ? "..." : ""}</p>}
                        </div>
                        <span className="pp-tag pp-tag--teal">Select →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  MARKETPLACE STEP 2 — SELECT LAYER
              ══════════════════════════════════════════════════════ */}
              {editPaths === "marketplace_layer" && (
                <div className="pp-selector">
                  <p className="pp-section-label">Select a view to manage</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(getLayerConfig(marketStepData)).map(([layerKey, cfg]) => (
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
                          // fetchMarketplaceData with explicit args since state hasn't updated yet
                          fetchMarketplaceData(marketStepId, layerKey);
                          setEditPaths("marketplace_attach");
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

              {/* ══════════════════════════════════════════════════════
                  MARKETPLACE STEP 3 — ATTACH / DETACH
              ══════════════════════════════════════════════════════ */}
              {editPaths === "marketplace_attach" && (
                <div>
                  {/* Layer title */}
                  {currentLayerCfg && (
                    <div className="pp-layer-header" style={{ marginBottom: "12px" }}>
                      <h3 className="pp-layer-title" style={{ fontSize: "17px", fontWeight: "700", lineHeight: "1.25", margin: "0 0 5px 0", color: "#0f172a" }}>{currentLayerCfg.viewName}</h3>
                      <p className="pp-layer-desc" style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.38", margin: 0 }}>{currentLayerCfg.viewDesc}</p>
                    </div>
                  )}

                  {/* ATTACHED */}
                  <p className="pp-section-label">
                    ATTACHED TO THIS STEP ({marketLayer?.toUpperCase()})
                  </p>

                  {marketplaceLoading ? (
                    <div style={{ padding: "12px 0", color: "#64748b", fontSize: "13px" }}>Loading...</div>
                  ) : attachedServices.length > 0 ? (
                    attachedServices.map(item => (
                      <div className="pp-market-item" key={item._id}>
                        <div className="pp-market-item-info">
                          <div className="pp-market-emoji">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                          </div>
                          <div className="pp-market-item-text">
                            <strong>{item.name}</strong>
                            <span>{item.role}</span>
                          </div>
                        </div>
                        <button
                          className="pp-market-remove-btn"
                          disabled={actionLoading}
                          onClick={() => detachMarketService(item)}>
                          {actionLoading ? "..." : "Remove"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="pp-empty">No items attached to this step</div>
                  )}

                  {/* CREATE BUTTON */}
                  <button
                    className="pp-create-btn"
                    style={{ marginTop: "16px", marginBottom: "8px" }}
                    onClick={() => setEditPaths("marketplace_create")}>
                    + Create New Listing
                  </button>

                  {/* AVAILABLE (all in this layer, not yet attached to this step) */}
                  <p className="pp-section-label" style={{ marginTop: "20px" }}>
                    ALL {marketLayer?.toUpperCase()} MARKETPLACE ({availableItems.length} available)
                  </p>

                  {marketplaceLoading ? (
                    <div style={{ padding: "12px 0", color: "#64748b", fontSize: "13px" }}>Loading...</div>
                  ) : availableItems.length === 0 ? (
                    <div className="pp-empty">No other {marketLayer} items in marketplace</div>
                  ) : (
                    availableItems.map(item => (
                      <div className="pp-market-item" key={item._id}>
                        <div className="pp-market-item-info">
                          <div className="pp-market-emoji">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                          </div>
                          <div className="pp-market-item-text">
                            <strong>{item.name}</strong>
                            <span>{item.role}</span>
                            {item.step_id && (
                              <span
                                className="pp-market-warning"
                                style={{
                                  fontSize: "11px",
                                  color: "#f59e0b",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "3px",
                                  lineHeight: "1.2",
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg> Already linked to another step
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="pp-market-attach-btn"
                          disabled={actionLoading}
                          onClick={() => attachMarketService(item)}>
                          {actionLoading ? "..." : "Attach"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  MARKETPLACE STEP 4 — CREATE NEW LISTING
              ══════════════════════════════════════════════════════ */}
              {editPaths === "marketplace_create" && (
                <div className="pp-selector">
                  {/* Layer badge */}
                  {currentLayerCfg && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 14px", background: currentLayerCfg.bg,
                      borderRadius: 10, border: `1.5px solid ${currentLayerCfg.border}`,
                      fontSize: "0.78rem", color: currentLayerCfg.color,
                      fontWeight: 500, marginBottom: 16,
                    }}>
                      <span style={{ color: "#64748b" }}>Adding to</span>
                      <strong style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {currentLayerCfg.label}
                      </strong>
                      <span style={{ color: "#64748b" }}>layer</span>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Role */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="pp-section-label" style={{ marginBottom: 0 }}>Role *</label>
                      <DropdownSelect
                        value={mpRole}
                        onChange={setMpRole}
                        options={ROLE_OPTIONS}
                        placeholder="Select role..."
                        ariaLabel="Role"
                      />
                    </div>

                    {/* Name */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="pp-section-label" style={{ marginBottom: 0 }}>Name *</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpName} onChange={e => setMpName(e.target.value)}
                        placeholder="e.g. Malla Reddy University"
                      />
                    </div>

                    {/* Access + Cost */}
                    <div className="sm-form-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="pp-section-label" style={{ marginBottom: 0 }}>Access</label>
                        <DropdownSelect
                          value={mpAccess}
                          onChange={setMpAccess}
                          options={ACCESS_OPTIONS}
                          placeholder="Free"
                          ariaLabel="Access"
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="pp-section-label" style={{ marginBottom: 0 }}>Cost</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpCost} onChange={e => setMpCost(e.target.value)} placeholder="e.g. ₹65,000"
                        />
                      </div>
                    </div>

                    {/* Duration */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="pp-section-label" style={{ marginBottom: 0 }}>Duration</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpDuration} onChange={e => setMpDuration(e.target.value)} placeholder="e.g. 3 months"
                      />
                    </div>

                    {/* Goal */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="pp-section-label" style={{ marginBottom: 0 }}>Goal</label>
                      <input
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                        type="text" value={mpGoal} onChange={e => setMpGoal(e.target.value)} placeholder="What goal does this serve?"
                      />
                    </div>

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className="pp-section-label" style={{ marginBottom: 0 }}>Features</label>
                      <textarea
                        style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none", minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
                        value={mpFeatures} onChange={e => setMpFeatures(e.target.value)} placeholder="Key features or offerings"
                      />
                    </div>

                    {/* Outcomes + Discount */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="pp-section-label" style={{ marginBottom: 0 }}>Outcomes</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpOutcomes} onChange={e => setMpOutcomes(e.target.value)} placeholder="Expected outcomes"
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label className="pp-section-label" style={{ marginBottom: 0 }}>Discount</label>
                        <input
                          style={{ padding: "9px 12px", border: "1.5px solid #e8ecf0", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
                          type="text" value={mpDiscount} onChange={e => setMpDiscount(e.target.value)} placeholder="e.g. 10%"
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      className="pp-btn pp-btn--blue"
                      style={{ marginTop: 4, borderRadius: 50 }}
                      disabled={actionLoading}
                      onClick={() => {
                        if (!mpRole || !mpName) { alert("Role and Name are required"); return; }
                        setActionLoading(true);

                        axios
                          .post(`${BASE_URL}/api/marketplace/add`, {
                            name: mpName,
                            role: mpRole,
                            layer: marketLayer,
                            step_id: marketStepId,
                            path_id: selectedPathId,
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
                              // Add to attached list and to full items list
                              setAttachedServices(prev => [...prev, newItem]);
                              setMarketplaceItems(prev => [...prev, newItem]);
                              setMarketStepData(prev => ({
                                ...prev,
                                [`${marketLayer}_marketplace`]: [
                                  ...(prev?.[`${marketLayer}_marketplace`] || []),
                                  newItem._id
                                ]
                              }));
                              // Reset form fields
                              setMpRole(""); setMpName(""); setMpAccess("Free"); setMpCost("");
                              setMpGoal(""); setMpOutcomes(""); setMpDuration("");
                              setMpFeatures(""); setMpDiscount("");
                              setEditPaths("marketplace_attach");
                            }
                            setActionLoading(false);
                          })
                          .catch(() => setActionLoading(false));
                      }}>
                      {actionLoading ? "Adding..." : "Add to Marketplace"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}


      {/* ══════════════════════════════════════════════════════════
    PENDING PATH POPUPS
══════════════════════════════════════════════════════════ */}
      {pendingPopup && (
        <>
          <div className="pp-overlay" onClick={closePendingPopup} />
          <div className="pending-popup-modal">

            <div className="pending-popup-header">
              <div>
                <h3 className="pending-popup-title">
                  {pendingPopup.type === "approve" && "Approve Path"}
                  {pendingPopup.type === "request" && "Request Changes"}
                  {pendingPopup.type === "reject" && "Reject Path"}
                  {pendingPopup.type === "compare" && "Version Comparison"}
                </h3>
                <p className="pending-popup-subtitle">{pendingPopup.path?.nameOfPath}</p>
              </div>
              <button className="pp-close-btn" onClick={closePendingPopup}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* APPROVE */}
            {pendingPopup.type === "approve" && (
              <div className="pending-popup-body">
                <h4 className="popup-confirm-heading">Are you sure you want to approve?</h4>
                <p className="popup-confirm-msg">
                  This path will become <strong>live and visible</strong> to users.
                </p>

                <div className="popup-confirm-actions">
                  <button className="pp-btn pp-btn--green" onClick={handleApproveConfirm}>
                    Yes, Approve
                  </button>
                  <button className="pp-btn pp-btn--ghost" onClick={closePendingPopup}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* REQUEST CHANGES */}
            {pendingPopup.type === "request" && (
              <div className="pending-popup-body">
                <p className="pp-section-label">Flag issues for partner</p>
                <div className="popup-checklist">
                  {REJECT_ISSUES.map((issue, idx) => (
                    <label key={idx} className={`popup-check-item ${rejectChecklist.includes(issue) ? "checked" : ""}`}>
                      <input type="checkbox" checked={rejectChecklist.includes(issue)} onChange={() => toggleRejectCheck(issue)} />
                      {issue}
                    </label>
                  ))}
                </div>
                <p className="pp-section-label" style={{ marginTop: "16px" }}>
                  Note to partner <span style={{ color: "#ef4444" }}>*</span>
                </p>
                <textarea
                  className={`popup-note-area ${rejectNoteError ? "error" : ""}`}
                  placeholder="Explain what the partner needs to fix before resubmitting..."
                  value={rejectNote}
                  onChange={ev => { setRejectNote(ev.target.value); setRejectNoteError(false); }}
                />
                {rejectNoteError && <p className="popup-note-error">Note is required before sending.</p>}
                <div className="popup-footer">
                  <button className="pp-btn pp-btn--ghost" onClick={closePendingPopup}>Cancel</button>
                  <button className="pp-btn pp-btn--amber" onClick={handleRequestChanges}>
                    {actionLoading ? "Sending..." : "Send Change Request →"}
                  </button>
                </div>
              </div>
            )}

            {/* REJECT */}
            {pendingPopup.type === "reject" && (
              <div className="pending-popup-body">
                <div className="popup-confirm-icon popup-confirm-icon--red">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
                <h4 className="popup-confirm-heading">Are you sure you want to reject?</h4>
                <p className="pp-section-label" style={{ marginTop: "4px" }}>Select rejection reasons</p>
                <div className="popup-checklist">
                  {REJECT_ISSUES.map(issue => (
                    <label key={issue} className={`popup-check-item ${rejectChecklist.includes(issue) ? "checked" : ""}`}>
                      <input type="checkbox" checked={rejectChecklist.includes(issue)} onChange={() => toggleRejectCheck(issue)} />
                      {issue}
                    </label>
                  ))}
                </div>
                <p className="pp-section-label" style={{ marginTop: "16px" }}>
                  Rejection note <span style={{ color: "#ef4444" }}>*</span> (mandatory)
                </p>
                <textarea
                  className={`popup-note-area ${rejectNoteError ? "error" : ""}`}
                  placeholder="Explain why this path is being rejected..."
                  value={rejectNote}
                  onChange={ev => { setRejectNote(ev.target.value); setRejectNoteError(false); }}
                />
                {rejectNoteError && <p className="popup-note-error">Note is required before rejecting.</p>}
                <div className="popup-footer">
                  <button className="pp-btn pp-btn--ghost" onClick={closePendingPopup}>Cancel</button>
                  <button className="pp-btn pp-btn--red" onClick={handleFinalReject}>
                    {actionLoading ? "Rejecting..." : "Confirm Reject"}
                  </button>
                </div>
              </div>
            )}


            {pendingPopup.type === "compare" && (
              <div className="pending-popup-body vcr-body-wrap">

                {changeRequestsLoading[pendingPopup?.pathId] ? (
                  <div className="vcr-loading">Loading…</div>

                ) : vcrSelectedRequest !== null ? (
                  // ─── DETAIL VIEW: single request thread ───────────────────
                  (() => {
                    const cr = (pathChangeRequests[pendingPopup?.pathId] || [])[vcrSelectedRequest];
                    if (!cr) return null;
                    return (
                      <div>
                        {/* Back button */}
                        <button
                          className="vcr-back-btn"
                          onClick={() => setVcrSelectedRequest(null)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                          </svg>
                          Back to all requests
                        </button>

                        <div className="vcr-detail-header">
                          <span className="vcr-thread-num">Request {vcrSelectedRequest + 1}</span>
                          <span className="vcr-thread-time">
                            {new Date(cr.sentAt).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span className={`vcr-status-badge ${cr.status === "addressed" ? "resolved" : "pending"}`}>
                            {cr.status === "addressed" ? "Resolved" : "Pending"}
                          </span>
                        </div>

                        <div className="vcr-chat-area">
                          {/* Admin original message */}
                          <div className="vcr-msg admin-msg">
                            <div className="vcr-msg-content">
                              <span className="vcr-msg-label align-right">You (Admin)</span>
                              <div className="vcr-bubble admin-bubble">
                                {(cr.issues || []).filter(i => i?.trim()).length > 0 && (
                                  <div className="vcr-issue-pills">
                                    {cr.issues.filter(i => i?.trim()).map((issue, ii) => (
                                      <span key={ii} className="vcr-issue-pill">{issue}</span>
                                    ))}
                                  </div>
                                )}
                                {cr.adminNote && (
                                  <p className="vcr-bubble-text admin-text">{cr.adminNote}</p>
                                )}
                              </div>
                            </div>
                            <div className="vcr-avatar admin-av">AD</div>
                          </div>

                          {/* Replies */}
                          {(cr.replies || []).map((reply, rIdx) => {
                            const isAdmin = reply.from === "admin";
                            return (
                              <div key={rIdx} className={`vcr-msg ${isAdmin ? "admin-msg" : "partner-msg"}`}>
                                {isAdmin ? (
                                  <>
                                    <div className="vcr-msg-content">
                                      <span className="vcr-msg-label align-right">
                                        You (Admin) · {new Date(reply.sentAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      <div className="vcr-bubble admin-bubble">
                                        <p className="vcr-bubble-text admin-text">{reply.message}</p>
                                      </div>
                                    </div>
                                    <div className="vcr-avatar admin-av">AD</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="vcr-avatar partner-av">P</div>
                                    <div className="vcr-msg-content">
                                      <span className="vcr-msg-label">
                                        Partner · {new Date(reply.sentAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      <div className="vcr-bubble partner-bubble">
                                        <p className="vcr-bubble-text partner-text">{reply.message}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {/* Reply input */}
                          <div className="vcr-reply-box">
                            <textarea
                              className="vcr-reply-input"
                              rows={1}
                              placeholder="Reply to partner…"
                              value={adminReplyTexts[cr._id] || ""}
                              onChange={(e) => {
                                setAdminReplyTexts(prev => ({ ...prev, [cr._id]: e.target.value }));
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendAdminReply(pendingPopup?.pathId, cr._id);
                                }
                              }}
                            />
                            <button
                              className={`vcr-send-btn ${adminReplyTexts[cr._id]?.trim() ? "active" : ""}`}
                              disabled={!adminReplyTexts[cr._id]?.trim() || adminReplyLoading[cr._id]}
                              onClick={() => sendAdminReply(pendingPopup?.pathId, cr._id)}
                            >
                              {adminReplyLoading[cr._id] ? (
                                <span className="vcr-send-spinner" />
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* ── MARK AS ADDRESSED BUTTON ── */}
                          {cr.status !== "addressed" && (
                            <button
                              onClick={async () => {
                                try {
                                  setActionLoading(true);
                                  await axios.patch(
                                    `${BASE_URL}/api/paths/address/${pendingPopup?.pathId}/${cr._id}`
                                  );
                                  // Refresh the change requests
                                  const { data } = await axios.get(
                                    `${BASE_URL}/api/paths/viewpath/${pendingPopup?.pathId}`
                                  );
                                  if (data?.status) {
                                    setPathChangeRequests(prev => ({
                                      ...prev,
                                      [pendingPopup?.pathId]: data.data?.changeRequests || [],
                                    }));
                                  }
                                  setActionLoading(false);
                                } catch (err) {
                                  console.error("Address error:", err);
                                  setActionLoading(false);
                                }
                              }}
                              className="vcr-address-btn"
                            >
                              <SvgCheck size={14} /> Mark as Addressed
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()

                ) : (
                  // ─── LIST VIEW: all requests as clickable cards ────────────
                  (pathChangeRequests[pendingPopup?.pathId] || []).length === 0 ? (
                    <div className="vcr-empty-state">No change requests sent yet.</div>
                  ) : (
                    <div className="vcr-request-list">
                      <p className="pp-section-label" style={{ marginBottom: 12 }}>
                        {(pathChangeRequests[pendingPopup?.pathId] || []).length} change request(s) sent
                      </p>
                      {(pathChangeRequests[pendingPopup?.pathId] || []).map((cr, idx) => {
                        const replyCount = (cr.replies || []).length;
                        const partnerReplied = (cr.replies || []).some(r => r.from === "partner");
                        return (
                          <div
                            key={cr._id || idx}
                            className="vcr-request-card"
                            onClick={() => setVcrSelectedRequest(idx)}
                          >
                            <div className="vcr-request-card-left">
                              <span className="vcr-request-num">Request {idx + 1}</span>
                              <span className="vcr-request-date">
                                {new Date(cr.sentAt).toLocaleString("en-IN", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                              {(cr.issues || []).filter(i => i?.trim()).length > 0 && (
                                <div className="vcr-request-issues">
                                  {cr.issues.filter(i => i?.trim()).slice(0, 2).map((issue, ii) => (
                                    <span key={ii} className="vcr-issue-pill">{issue}</span>
                                  ))}
                                  {cr.issues.filter(i => i?.trim()).length > 2 && (
                                    <span className="vcr-issue-pill vcr-issue-more">
                                      +{cr.issues.filter(i => i?.trim()).length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="vcr-request-meta">
                                <span className="vcr-reply-count" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg> {replyCount} {replyCount === 1 ? "reply" : "replies"}
                                </span>
                                {partnerReplied && (
                                  <span className="vcr-partner-replied">Partner replied</span>
                                )}
                              </div>
                            </div>
                            <div className="vcr-request-card-right">
                              <span className={`vcr-status-badge ${cr.status === "addressed" ? "resolved" : "pending"}`}>
                                {cr.status === "addressed" ? "Resolved" : "Pending"}
                              </span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                <div className="popup-footer">
                  <button className="pp-btn pp-btn--ghost" onClick={closePendingPopup}>Close</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* ══════════════════════════════════════════════════════════
          STEP ACTION POPUP
      ══════════════════════════════════════════════════════════ */}
      {stepActionEnabled && (
        <>
          <div
            className="pp-overlay"
            onClick={() => { setStepActionEnabled(false); setStepActionStep(1); setSelectedStepId(""); }}
          />
          <div className="admin-acc-popular1">
            <div className="admin-acc-popular-top" style={{ display: stepActionStep === 3 ? "none" : "" }}>
              <div className="admin-acc-popular-head">My Step Actions</div>
              <div className="admin-acc-popular-img-box" style={{ cursor: "pointer" }}
                onClick={() => { setStepActionEnabled(false); setStepActionStep(1); setSelectedStepId(""); }}>
                <img className="admin-acc-popular-img" src={closepop} alt="" />
              </div>
            </div>
            {stepActionStep === 1 && (
              <div style={{ marginTop: "3rem" }}>
                <div className="admin-acc-step-box" onClick={() => setStepActionStep(4)}>Edit Services</div>
                <div className="admin-acc-step-box">Edit Step</div>
                <div className="admin-acc-step-box" onClick={() => deleteStep()}>Delete step</div>
              </div>
            )}
            {stepActionStep === 2 && (
              <div style={{ marginTop: "3rem" }}>
                <div className="admin-acc-step-box" onClick={() => deleteStep()}>Confirm and delete</div>
                <div className="admin-goBack2" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}
            {stepActionStep === 3 && <div className="admin-success-box1">Step Successfully Deleted</div>}
            {stepActionStep === 4 && (
              <div className="admin-acc-mt-div">
                <div className="admin-acc-sub-text">What do you want to do?</div>
                <div className="admin-acc-scroll-div">
                  <div className="admin-acc-step-box4" style={{ flexDirection: "column", alignItems: "flex-start" }} onClick={() => setStepActionStep(5)}>Add a Service</div>
                  <div className="admin-acc-step-box4" style={{ flexDirection: "column", alignItems: "flex-start" }} onClick={() => setStepActionStep(6)}>Remove a Service</div>
                </div>
                <div className="admin-goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}
            {stepActionStep === 5 && (
              <div className="admin-acc-mt-div">
                <div className="admin-acc-sub-text">Which service do you want to add?</div>
                <div className="admin-acc-scroll-div">
                  {allServicesToAdd?.map(item => (
                    <div key={item?._id}
                      className={selectedServices.includes(item?._id) ? "admin-acc-step-box4-selected" : "admin-acc-step-box4"}
                      style={{ flexDirection: "column", alignItems: "flex-start" }}
                      onClick={() => handleSelectServicesForStep(item?._id)}>
                      <div>{item?.name}</div>
                      <div style={{ fontSize: "12px", fontWeight: 400, paddingTop: "5px" }}>{item?._id}</div>
                    </div>
                  ))}
                </div>
                <div className="admin-save-Btn" style={{ opacity: selectedServices.length > 0 ? 1 : 0.3 }}
                  onClick={() => selectedServices.length > 0 && addServicesToStep()}>
                  Add Selected Services
                </div>
                <div className="admin-goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}
            {stepActionStep === 6 && (
              <div className="admin-acc-mt-div">
                <div className="admin-acc-sub-text">Which service do you want to remove?</div>
                <div className="admin-acc-scroll-div">
                  {allServicesToRemove?.serviceDetails?.map(item => (
                    <div key={item?._id} className="admin-acc-step-box4"
                      style={{ flexDirection: "column", alignItems: "flex-start" }}
                      onClick={() => removeServiceFromStep(item?._id)}>
                      <div>{item?.name}</div>
                      <div style={{ fontSize: "12px", fontWeight: 400, paddingTop: "5px" }}>{item?._id}</div>
                    </div>
                  ))}
                </div>
                <div className="admin-goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}
            {actionLoading && (
              <div className="admin-popularlogo">
                <img className="admin-popularlogoimg" src={lg1} alt="" />
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          CREATOR & PARTNER DETAILS MODAL
      ══════════════════════════════════════════════════════════ */}
      {creatorModalPath && (
        <>
          <div className="pp-overlay" onClick={() => setCreatorModalPath(null)} />
          <div className="creator-details-modal">
            <div className="creator-modal-header">
              <div className="creator-modal-title-box">
                <div className={`creator-modal-badge ${isAgentGenerated(creatorModalPath) ? "agent" : "manual"}`} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  {isAgentGenerated(creatorModalPath) ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg> AI Generated Path
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg> Partner Manual Path
                    </>
                  )}
                </div>
                <h3 className="creator-modal-heading">Creator & Partner Details</h3>
                <p className="creator-modal-sub">Path: {creatorModalPath.nameOfPath}</p>
              </div>
              <button className="pp-close-btn" onClick={() => setCreatorModalPath(null)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="creator-modal-body">
              {isAgentGenerated(creatorModalPath) ? (
                <div className="creator-info-grid">
                  <div className="creator-info-item">
                    <span className="creator-info-label">Creation Source</span>
                    <span className="creator-info-val">Automated AI Path Engine</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Creator Email</span>
                    <span className="creator-info-val email-highlight">pathengine.admin@gmail.com</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">System Role</span>
                    <span className="creator-info-val">Naavi AI System Generator</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Path Created Date</span>
                    <span className="creator-info-val">
                      {creatorModalPath.createdAt ? new Date(creatorModalPath.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : "—"}
                    </span>
                  </div>
                  <div className="creator-info-item full-width">
                    <span className="creator-info-label">Description</span>
                    <span className="creator-info-val text-desc">This pathway was generated automatically using Naavi's AI Path Engine.</span>
                  </div>
                </div>
              ) : (
                <div className="creator-info-grid">
                  <div className="creator-info-item">
                    <span className="creator-info-label">Creator Email</span>
                    <span className="creator-info-val email-highlight">{creatorModalPath.email || creatorModalPath.partnerDetails?.email || "—"}</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Business Name</span>
                    <span className="creator-info-val">{creatorModalPath.partnerDetails?.businessName || creatorModalPath.partnerDetails?.username || "—"}</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Joined Platform Date</span>
                    <span className="creator-info-val highlight-date">
                      {creatorModalPath.partnerDetails?.createdAt ? new Date(creatorModalPath.partnerDetails.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                      }) : (creatorModalPath.createdAt ? new Date(creatorModalPath.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—")}
                    </span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Partner ID</span>
                    <span className="creator-info-val font-mono">{creatorModalPath.partnerDetails?.partnerId || "—"}</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Contact Person</span>
                    <span className="creator-info-val">
                      {[creatorModalPath.partnerDetails?.firstName, creatorModalPath.partnerDetails?.lastName].filter(Boolean).join(" ") || creatorModalPath.partnerDetails?.username || "—"}
                    </span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Position / Role</span>
                    <span className="creator-info-val">{creatorModalPath.partnerDetails?.yourPosition || "Internal Partner"}</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Category / Business Type</span>
                    <span className="creator-info-val type-badge">{creatorModalPath.partnerDetails?.partnerType || creatorModalPath.partnerDetails?.type || "Partner"}</span>
                  </div>
                  <div className="creator-info-item">
                    <span className="creator-info-label">Phone Number</span>
                    <span className="creator-info-val">
                      {creatorModalPath.partnerDetails?.phone ||
                        creatorModalPath.partnerDetails?.phoneNumber ||
                        creatorModalPath.partnerDetails?.mobile ||
                        creatorModalPath.partnerDetails?.contactNumber ||
                        creatorModalPath.phone ||
                        creatorModalPath.phoneNumber ||
                        creatorModalPath.contactNumber ||
                        "—"}
                    </span>
                  </div>
                  {creatorModalPath.partnerDetails?.website && (
                    <div className="creator-info-item">
                      <span className="creator-info-label">Website</span>
                      <a href={creatorModalPath.partnerDetails.website.startsWith("http") ? creatorModalPath.partnerDetails.website : `https://${creatorModalPath.partnerDetails.website}`} target="_blank" rel="noopener noreferrer" className="creator-info-link">
                        {creatorModalPath.partnerDetails.website}
                      </a>
                    </div>
                  )}
                  {(creatorModalPath.partnerDetails?.city || creatorModalPath.partnerDetails?.country || creatorModalPath.partnerDetails?.street) && (
                    <div className="creator-info-item">
                      <span className="creator-info-label">Location / Address</span>
                      <span className="creator-info-val">
                        {[creatorModalPath.partnerDetails?.street, creatorModalPath.partnerDetails?.city, creatorModalPath.partnerDetails?.state, creatorModalPath.partnerDetails?.country, creatorModalPath.partnerDetails?.pincode].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  {creatorModalPath.partnerDetails?.description && (
                    <div className="creator-info-item full-width">
                      <span className="creator-info-label">About Partner</span>
                      <span className="creator-info-val text-desc">{creatorModalPath.partnerDetails.description}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="creator-modal-footer">
              <button className="pp-btn pp-btn--ghost" onClick={() => setCreatorModalPath(null)}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyPathsAdmin;