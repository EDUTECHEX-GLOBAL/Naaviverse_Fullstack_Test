import React, { useState, useEffect, useRef } from "react";
import { useCoinContextData } from "../../context/CoinContext";
import Skeleton from "react-loading-skeleton";
import "./mypaths.scss";
import axios from "axios";
import { Draggable } from "react-drag-reorder";
import EditPathForm from "../MyPaths/paths.jsx";
import pathIcon from '../../assets/images/assets/naavi-icon2.webp';
// images
import dummy from "./dummy.svg";
import closepop from "../../static/images/dashboard/closepop.svg";
import lg1 from "../../static/images/login/lg1.svg";
import CurrentStep from "../CurrentStep";
import { useStore } from "../../components/store/store.ts";
import { useNavigate, useLocation } from "react-router-dom";
import { SvgCheckCircle, SvgClose } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyPaths = ({ search, admin, fetchAllServicesAgain, stpesMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sideNav, setsideNav } = useStore();
  // [check] FIX: Safe parsing with fallback
  let userDetails = null;
  try {
    const raw = localStorage.getItem("partner");
    userDetails = raw ? JSON.parse(raw) : null;
  } catch (e) { userDetails = null; }
  const getPartnerEmail = () => {
    try {
      const partnerRaw = localStorage.getItem("partner");
      const p = partnerRaw ? JSON.parse(partnerRaw) : null;
      const email = p?.email || p?.user?.email || localStorage.getItem("loginEmail") || null;
      console.log("[search] getPartnerEmail:", email, "from partner:", !!p, "loginEmail:", localStorage.getItem("loginEmail"));
      return email;
    } catch (e) {
      const fallback = localStorage.getItem("loginEmail") || null;
      console.log("[search] getPartnerEmail fallback:", fallback);
      return fallback;
    }
  };
  const {
    setCurrentStepData,
    setCurrentStepDataLength,
    mypathsMenu,
    setMypathsMenu,
  } = useCoinContextData();

  const [partnerPathData, setPartnerPathData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [pathActionEnabled, setPathActionEnabled] = useState(false);
  const [pathActionStep, setPathActionStep] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState("");
  const [stepActionEnabled, setStepActionEnabled] = useState(false);
  const [stepActionStep, setStepActionStep] = useState(1);
  const [editPaths, setEditPaths] = useState("default");
  const [metaDataStep, setMetaDataStep] = useState("default");
  const [selectedPath, setSelectedPath] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [viewPathEnabled, setViewPathEnabled] = useState(false);
  const [viewStepsModal, setViewStepsModal] = useState(false);
  const [viewPathLoading, setViewPathLoading] = useState(false);
  const [viewPathData, setViewPathData] = useState([]);
  const [showSelectedPath, setShowSelectedPath] = useState(null);
  const [addServiceStep, setAddServiceStep] = useState(null);
  const [selectedSubStep, setSelectedSubStep] = useState(null);
  const [backupPathData, setBackupPathData] = useState([]);
  const [stepId, setStepId] = useState("");
  const [backupPathId, setBackupPathId] = useState("");
  const [allServices, setAllServices] = useState([]);
  const [productDataArray, setProductDataArray] = useState([]);
  const [productKeys, setProductKeys] = useState(null);
  const [allServicesToAdd, setAllServicesToAdd] = useState([]);
  const [allServicesToRemove, setAllServicesToRemove] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [localSearch, setLocalSearch] = useState(search || "");
  const searchInputRef = useRef(null);

  const handleClearSearch = () => {
    setLocalSearch("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // [check] FIX: stepCounts stores real DB step counts per path _id
  const [stepCounts, setStepCounts] = useState({});

  // [check] FIX: fetchStepCounts hits the same endpoint DraftPathView uses
  const fetchStepCounts = async (paths) => {
    const counts = {};
    await Promise.all(
      paths.map(async (path) => {
        try {
          const res = await axios.get(`${BASE_URL}/api/steps/get`, {
            params: { path_id: path._id },
          });
          counts[path._id] = res.data?.data?.length || 0;
        } catch {
          counts[path._id] = 0;
        }
      })
    );
    setStepCounts(counts);
  };

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  const [expandedDesc, setExpandedDesc] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const tabMap = {
      active: "Paths",
      draft: "Draft",
      pending: "Pending Approval",
      inactive: "Inactive Paths",
    };
    if (tab && tabMap[tab]) {
      setMypathsMenu(tabMap[tab]);
    } else {
      setMypathsMenu("Paths");
    }
  }, [location.search]);

  // ============================================
  // API Calls
  // ============================================
  const toggleDescription = (pathId) => {
    setExpandedDesc(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  const getAllPaths = () => {
    setPartnerPathData([]);
    setLoading(true);

    const email = getPartnerEmail();
    let endpoint = "";

    if (!email) {
      console.warn("[error] MyPaths getAllPaths: No partner email found, skipping fetch");
      setLoading(false);
      return;
    }

    if (admin && (mypathsMenu === "Pending Approval" || mypathsMenu === "Pending Paths")) {
      endpoint = `/api/paths/get?status=waitingforapproval`;
    } else if (!admin && mypathsMenu === "Draft") {
      Promise.all([
        axios.get(`${BASE_URL}/api/paths/get?email=${email}&status=draft`),
        axios.get(`${BASE_URL}/api/paths/get?email=${email}&status=changesrequested`),
      ]).then(([res1, res2]) => {
        const combined = [
          ...(res1.data?.data || []),
          ...(res2.data?.data || []),
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setPartnerPathData(combined);
        fetchStepCounts(combined);
      }).catch((err) => { console.error("[error] Error fetching draft paths (getAllPaths):", err); }).finally(() => setLoading(false));
      return;
    } else if (!admin && mypathsMenu === "Pending Approval") {
      endpoint = `/api/paths/get?email=${email}&status=waitingforapproval`;
    } else if (mypathsMenu === "Inactive Paths") {
      endpoint = `/api/paths/get?email=${email}&status=inactive`;
    } else {
      endpoint = `/api/paths/get?email=${email}&status=active`;
    }

    console.log("[arrow-right]️ FINAL API CALL:", `${BASE_URL}${endpoint}`);

    axios
      .get(`${BASE_URL}${endpoint}`)
      .then((response) => {
        // [check] FIX 1: also call fetchStepCounts after loading paths
        const paths = response?.data?.data || [];
        setPartnerPathData(paths);
        fetchStepCounts(paths);
      })
      .catch((error) => {
        console.log("[error] Error fetching partnerPathData:", error);
      })
      .finally(() => setLoading(false));
  };

  const getAllServices = () => {
    let email = userDetails?.email;
    axios
      .get(`${BASE_URL}/api/attachservice/getnotaddedservices?step_id=${selectedStepId}&productcreatoremail=${email}`)
      .then(({ data }) => {
        if (data.status) {
          setAllServices(data.data);
        }
      });
  };

  // Load backup paths once
  useEffect(() => {
    const email = userDetails?.email;
    if (!email) return;
    axios.get(`${BASE_URL}/api/paths/get?email=${email}`).then(({ data }) => {
      if (data.status) setBackupPathData(data.data);
    });
  }, []);

  // Load services when step changes
  useEffect(() => {
    if (!selectedStepId) return;
    getAllServices();
  }, [selectedStepId]);

  // [check] FIX: Force re-fetch on every mount (handles returning from DraftPathView)
  const [mountKey, setMountKey] = useState(0);
  useEffect(() => {
    setMountKey((k) => k + 1);
  }, []);

  // [check] FIX 2: URL-based fetch also calls fetchStepCounts after loading
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    const tabToStatus = {
      active: "active",
      draft: "draft",
      pending: "waitingforapproval",
      inactive: "inactive",
    };

    const status = tabToStatus[tab] || "active";
    // [check] FIX: Read partner email fresh from localStorage (not stale closure)
    const email = getPartnerEmail();

    console.log("[clipboard] MyPaths useEffect triggered. tab:", tab, "status:", status, "email:", email, "mountKey:", mountKey);

    if (!email) {
      console.warn("[error] MyPaths useEffect: No partner email found, skipping fetch. tab=", tab);
      setLoading(false);
      return;
    }

    setPartnerPathData([]);
    setLoading(true);

    let endpoint = "";

    if (status === "draft") {
      const url1 = `${BASE_URL}/api/paths/get?email=${encodeURIComponent(email)}&status=draft`;
      const url2 = `${BASE_URL}/api/paths/get?email=${encodeURIComponent(email)}&status=changesrequested`;
      console.log("[clipboard] Fetching draft paths:", url1, url2);
      Promise.all([
        axios.get(url1),
        axios.get(url2),
      ]).then(([res1, res2]) => {
        console.log("[check] Draft paths response:", res1.data?.total, "draft,", res2.data?.total, "changesrequested");
        const combined = [
          ...(res1.data?.data || []),
          ...(res2.data?.data || []),
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setPartnerPathData(combined);
        fetchStepCounts(combined);
      }).catch((err) => { console.error("[error] Error fetching draft paths:", err); }).finally(() => setLoading(false));
      return;
    } else if (status === "waitingforapproval") {
      endpoint = `/api/paths/get?email=${encodeURIComponent(email)}&status=waitingforapproval`;
    } else if (status === "inactive") {
      endpoint = `/api/paths/get?email=${encodeURIComponent(email)}&status=inactive`;
    } else {
      endpoint = `/api/paths/get?email=${encodeURIComponent(email)}&status=active`;
    }

    axios
      .get(`${BASE_URL}${endpoint}`)
      .then((response) => {
        // [check] FIX 2: also call fetchStepCounts after loading paths
        const paths = response?.data?.data || [];
        setPartnerPathData(paths);
        fetchStepCounts(paths);
      })
      .catch((error) => {
        console.log("[error] Error fetching partnerPathData:", error);
      })
      .finally(() => setLoading(false));

  }, [location.search, mountKey]);

  // Load services for add/remove
  useEffect(() => {
    if (selectedStepId) {
      axios.get(`${BASE_URL}/api/attachservice/getnotaddedservices?step_id=${selectedStepId}&productcreatoremail=${userDetails?.user?.email}`)
        .then(({ data }) => {
          if (data.status) setAllServicesToAdd(data?.data[0]);
        });
    }
  }, [selectedStepId]);

  useEffect(() => {
    if (selectedStepId) {
      axios.get(`${BASE_URL}/api/attachservice/get?step_id=${selectedStepId}`)
        .then(({ data }) => {
          if (data.status) setAllServicesToRemove(data?.data[0]);
        });
    }
  }, [selectedStepId]);

  // Reset selected path when menu changes
  useEffect(() => {
    setShowSelectedPath(null);
  }, [mypathsMenu]);

  useEffect(() => {
    if (!stepActionEnabled) {
      setSelectedServices([]);
      setStepActionStep(1);
    }
  }, [stepActionEnabled]);

  useEffect(() => {
    if (!mypathsMenu) {
      setMypathsMenu("Paths");
    }
  }, []);

  // ============================================
  // Action Handlers
  // ============================================

  const myPathsTimeout = () => {
    setTimeout(reload1, 2000);
  };

  function reload1() {
    setPathActionEnabled(false);
    setPathActionStep(1);
    setSelectedPathId("");
    setEditPaths("default");
    setMetaDataStep("default");
    setSelectedPath([]);
    setNewValue("");
  }

  const myStepsTimeout = () => {
    setTimeout(reload2, 2000);
  };

  function reload2() {
    setStepActionEnabled(false);
    setStepActionStep(1);
    setSelectedStepId("");
  }

  const deletePath = (status) => {
    setActionLoading(true);
    axios
      .delete(`${BASE_URL}/api/paths/delete/${selectedPathId}`, {
        data: { status },
      })
      .then((response) => {
        let result = response?.data;
        if (result?.status) {
          setActionLoading(false);
          setPathActionStep(3);
          myPathsTimeout();
        }
      })
      .catch((error) => {
        console.log(error, "error in deletePath");
      });
  };

  const deleteStep = () => {
    setActionLoading(true);
    axios
      .delete(`${BASE_URL}/api/steps/delete/${selectedStepId}`)
      .then((response) => {
        let result = response?.data;
        if (result?.status) {
          setActionLoading(false);
          setStepActionStep(3);
          myStepsTimeout();
        }
      })
      .catch((error) => {
        console.log(error, "error in deleteStep");
      });
  };

  const resetPathAction = () => {
    setPathActionEnabled(false);
    setPathActionStep(1);
    setSelectedPathId("");
    setEditPaths("default");
    setMetaDataStep("default");
    setSelectedPath([]);
    setNewValue("");
    setViewPathData([]);
  };

  const editMetaData = (field) => {
    setActionLoading(true);
    let obj = { [field]: newValue };
    axios
      .put(`${BASE_URL}/api/paths/update/${selectedPathId}`, obj)
      .then((response) => {
        let result = response?.data;
        if (result?.status) {
          setMetaDataStep("success");
          setActionLoading(false);
          myPathsTimeout();
        }
      })
      .catch((error) => {
        console.log(error, "ediMetaData error");
      });
  };

  const viewPathById = (id) => {
    if (!id) {
      console.error("[error] NO ID SENT TO API");
      return;
    }
    setViewPathLoading(true);
    axios
      .get(`${BASE_URL}/api/paths/viewpath/${id}`)
      .then((response) => {
        let result = response?.data?.data;
        setViewPathData(Array.isArray(result) ? result[0] : result);
      })
      .catch((error) => {
        console.log("Error in fetching view path data:", error);
      })
      .finally(() => setViewPathLoading(false));
  };

  const handleApprovePath = () => {
    setActionLoading(true);
    axios
      .put(`${BASE_URL}/api/paths/updatepath/${selectedPathId}`, {
        status: "active",
      })
      .then(({ data }) => {
        if (data.status) {
          getAllPaths();
          setPathActionEnabled(false);
          setActionLoading(false);
          setPathActionStep(1);
        }
      })
      .catch(() => setActionLoading(false));
  };

  const handleRejectPath = () => {
    setActionLoading(true);
    axios
      .put(`${BASE_URL}/api/paths/updatepath/${selectedPathId}`, {
        status: "draft",
      })
      .then(({ data }) => {
        if (data.status) {
          setMypathsMenu("Draft");
          getAllPaths();
          setPathActionEnabled(false);
          setActionLoading(false);
          setPathActionStep(1);
        }
      })
      .catch(() => setActionLoading(false));
  };

  const handleAddService = (newId) => {
    setActionLoading(true);
    axios
      .post(`${BASE_URL}/api/steps/addproducts/${selectedStepId}`, {
        product_ids: [newId],
      })
      .then(({ data }) => {
        if (data.status) {
          getAllPaths();
          getAllServices();
          setPathActionEnabled(false);
          setStepActionEnabled(false);
          setActionLoading(false);
          setPathActionStep(1);
          fetchAllServicesAgain();
        }
      });
  };

  const handleSelectServicesForStep = (item) => {
    const isSelected = selectedServices.includes(item);
    if (isSelected) {
      const updatedServices = selectedServices.filter((service) => service !== item);
      setSelectedServices(updatedServices);
    } else {
      setSelectedServices([...selectedServices, item]);
    }
  };

  const addServicesToStep = () => {
    setActionLoading(true);
    setLoading(true);
    axios
      .post(`${BASE_URL}/api/attachservice/add`, {
        step_id: selectedStepId,
        service_ids: [...selectedServices],
      })
      .then(({ data }) => {
        if (data.status) {
          setStepActionEnabled(false);
        }
        setActionLoading(false);
        setLoading(false);
        setSelectedServices([]);
      });
  };

  const removeServiceFromStep = (id) => {
    axios
      .put(`${BASE_URL}/api/attachservice/remove/${allServicesToRemove?._id}`, {
        service_id: id,
      })
      .then(({ data }) => {
        if (data.status) {
          setStepActionEnabled(false);
          setActionLoading(false);
          setLoading(false);
        }
      });
  };

  const handleEditSubmit = () => {
    setPathActionStep(1);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="mypaths">
      {admin && (
        <div
          className="each-mypath-menu"
          style={{
            fontWeight: mypathsMenu === "Pending Paths" ? "700" : "",
            background: mypathsMenu === "Pending Paths" ? "rgba(241, 241, 241, 0.5)" : "",
          }}
          onClick={() => {
            setMypathsMenu("Pending Paths");
            if (viewPathEnabled) {
              setViewPathEnabled(false);
              setViewPathData([]);
            }
          }}
        >
          Pending Paths
        </div>
      )}

      {/* Main Content */}
      <div className="mypaths-content">
        {showSelectedPath ? (
          <div>
            <CurrentStep
              productDataArray={productDataArray}
              selectedPathId={selectedPathId}
              showSelectedPath={showSelectedPath}
              selectedPath={selectedPath}
              onBack={() => {
                setShowSelectedPath(null);
                setViewPathEnabled(false);
              }}
            />
          </div>
        ) : viewPathEnabled ? (
          <div className="viewpath-container">
            <div className="viewpath-top-area">
              <div>Your Selected Path:</div>
              <div className="viewpath-bold-text">
                {viewPathData?.nameOfPath || viewPathData?.destination_institution || "Untitled Path"}
              </div>
              <div className="viewpath-des">{viewPathData?.description}</div>
              <div className="viewpath-goBack-div" onClick={() => setViewPathEnabled(false)}>
                Go Back
              </div>
            </div>

            <div className="viewpath-steps-area">
              {viewPathData?.StepDetails?.map((e, i) => (
                <div
                  key={i}
                  className="viewpath-each-j-step viewpath-relative-div"
                  style={{ cursor: "default", pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#0d6b6e",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      marginBottom: "0.5rem",
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="viewpath-each-j-step-text">
                    {e?.macro_name || e?.name || "Untitled Step"}
                  </div>
                  <div className="viewpath-each-j-step-text1">
                    {e?.macro_description || e?.description || ""}
                  </div>
                  <div className="viewpath-each-j-amount-div">
                    <div className="viewpath-each-j-amount">
                      {e?.macro_access || e?.cost || "Free"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Filter Tabs + Search Row */}
            <div className="mypaths-controls-row">
              <div className="filter-tabs">
                <span
                  className={`filter-tab ${mypathsMenu === 'Paths' ? 'active' : ''}`}
                  onClick={() => {
                    setMypathsMenu('Paths');
                    navigate('/dashboard/accountants/paths?tab=active');
                  }}
                >
                  Active Paths
                </span>
                <span
                  className={`filter-tab ${mypathsMenu === 'Draft' ? 'active' : ''}`}
                  onClick={() => {
                    setMypathsMenu('Draft');
                    navigate('/dashboard/accountants/paths?tab=draft');
                  }}
                  style={{ position: 'relative' }}
                >
                  Draft
                  {/* Red dot if any draft paths have review_notes */}
                  {partnerPathData.some(p => (p.status === 'draft' || p.status === 'changesrequested') && p.review_notes) && mypathsMenu !== 'Draft' && (<span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#ef4444', border: '2px solid white'
                  }} />
                  )}
                </span>
                <span
                  className={`filter-tab ${mypathsMenu === 'Pending Approval' ? 'active' : ''}`}
                  onClick={() => {
                    setMypathsMenu('Pending Approval');
                    navigate('/dashboard/accountants/paths?tab=pending');
                  }}
                >
                  Pending Approval
                </span>
                <span
                  className={`filter-tab ${mypathsMenu === 'Inactive Paths' ? 'active' : ''}`}
                  onClick={() => {
                    setMypathsMenu('Inactive Paths');
                    navigate('/dashboard/accountants/paths?tab=inactive');
                  }}
                >
                  Inactive
                </span>
              </div>

              {/* Search Bar */}
              <div className="mp-search-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21L16.65 16.65" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search paths..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="mp-search-input"
                  aria-label="Search paths"
                />
                {localSearch && (
                  <button
                    type="button"
                    className="mp-search-clear-btn"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <SvgClose size={13} color="currentColor" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="paths-grid">
                {Array(3)
                  .fill("")
                  .map((_, i) => (
                    <div className="path-card" key={i}>
                      <div className="path-header">
                        <div className="path-title">
                          <Skeleton width={200} height={30} />
                        </div>
                        <Skeleton width={100} height={25} />
                      </div>
                      <Skeleton count={3} />
                      <div className="path-stats">
                        <Skeleton width={80} height={30} />
                        <Skeleton width={120} height={30} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="paths-grid">
                {partnerPathData
                  ?.filter((e) =>
                    !localSearch ||
                    e?.nameOfPath?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    e?.description?.toLowerCase().includes(localSearch.toLowerCase()) ||
                    e?.destination_institution?.toLowerCase().includes(localSearch.toLowerCase())
                  )
                  ?.map((e, i) => {
                    const lastUpdated = formatDate(e?.updatedAt);

                    return (
                      <div
                        className="path-card"
                        key={i}
                        onClick={() => {
                          setSelectedPathId(e?._id);
                          setSelectedPath(e);
                          localStorage.setItem("selectedPathId", e?._id);
                          localStorage.setItem("selectedPathName", e?.nameOfPath || e?.name || "");
                          localStorage.removeItem("selectedPathCountry");
                          localStorage.removeItem("selectedPathUniversity");
                          localStorage.removeItem("selectedPathPathway");
                          localStorage.removeItem("selectedPathCourse");
                          localStorage.removeItem("selectedPathCountryForId");
                          window.dispatchEvent(new Event("naavi:path-selected"));

                          if (e?.status === "draft" || e?.status === "changesrequested") {
                            navigate(`/dashboard/accountants/path/${e._id}`);
                          } else {
                            setPathActionEnabled(true);
                          }
                        }}
                      >

                     {e?.status === "changesrequested" &&
  (e?.changeRequests || []).some(cr => cr.status === "pending") && (() => {
  const latestCR = (e?.changeRequests || [])
    .filter(cr => cr.status === "pending")
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];

  if (!latestCR) return null;

  // No need to show issues/adminNote on card — just show simple banner
  return (
    <div
      style={{
        background: '#fff1f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '10px',
      }}
      onClick={(evt) => evt.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#ef4444', flexShrink: 0, display: 'inline-block'
        }} />
        <span style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 700 }}>
          Changes Requested
        </span>
      </div>
    </div>
  );
})()}
                        {/* Card Header */}
                        <div className="path-header">
                          <div className="path-title">
                           <img src={pathIcon} alt="path" style={{ width: "18px", height: "18px", objectFit: "contain", opacity: 0.8, flexShrink: 0 }} />
<h3>{e?.nameOfPath || "Untitled Path"}</h3>
                          </div>
                          <div className="path-meta">
                            {(e?.status === "draft" || e?.status === "changesrequested") ? (
                              <button
                                className="draft-arrow-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/dashboard/accountants/path/${e._id}`);
                                }}
                                title="Go to Draft Page"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            ) : (
                              <span className="path-date">{lastUpdated}</span>
                            )}
                          </div>
                        </div>

                        {/* Description with Read More */}
                        <div className="path-description">
                          {(() => {
                            const description = e?.description || "No description provided.";
                            const isExpanded = expandedDesc[e?._id];
                            const maxLength = 120;

                            if (description.length > maxLength) {
                              return (
                                <span>
                                  {isExpanded
                                    ? description
                                    : description.substring(0, maxLength) + "... "}
                                  <span
                                    className="read-more-btn"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleDescription(e?._id);
                                    }}
                                  >
                                    {isExpanded ? "Read less" : "Read more"}
                                  </span>
                                </span>
                              );
                            }
                            return <span>{description}</span>;
                          })()}
                        </div>

                        {/* <SvgCheckCircle size={14} /> FIX 3: Stats Row - use stepCounts from DB, fallback to the_ids */}
                        <div className="path-stats-row">
                          <div className="stats-group">
                            <span className="stat-badge">
                              {" "}
                              {stepCounts[e?._id] !== undefined
                                ? stepCounts[e?._id]
                                : e?.the_ids?.length || 0}{" "}
                              Steps
                            </span>
                          </div>
                          <button
                            className="view-steps-btn"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              navigate(
                                `/dashboard/accountants/steps?pathId=${e?._id}&pathName=${encodeURIComponent(e?.nameOfPath || "")}`
                              );
                            }}
                          >
                            View Steps
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="path-footer" onClick={(e) => e.stopPropagation()}>
                          {e?.status === "waitingforapproval" && admin && (
                            <button
                              className="btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPathId(e?._id);
                                setPathActionStep(5);
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Empty state */}
                {partnerPathData?.filter((e) =>
                  !localSearch ||
                  e?.nameOfPath?.toLowerCase().includes(localSearch.toLowerCase()) ||
                  e?.description?.toLowerCase().includes(localSearch.toLowerCase()) ||
                  e?.destination_institution?.toLowerCase().includes(localSearch.toLowerCase())
                ).length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#5e6f7e' }}>
                      No paths found. Click "Create New Path" to get started.
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* Step Action Popup */}
        {stepActionEnabled && (
          <div className="acc-popular1">
            <div className="acc-popular-top" style={{ display: stepActionStep === 3 ? "none" : "" }}>
              <div className="acc-popular-head">My Step Actions</div>
              <div
                className="acc-popular-img-box"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setStepActionEnabled(false);
                  setStepActionStep(1);
                  setSelectedStepId("");
                }}
              >
                <img className="acc-popular-img" src={closepop} alt="" />
              </div>
            </div>

            {stepActionStep === 1 && (
              <div style={{ marginTop: "3rem" }}>
                <div className="acc-step-box" onClick={() => setStepActionStep(4)}>Edit Services</div>
                <div className="acc-step-box">Edit Step</div>
                <div className="acc-step-box">Delete step</div>
              </div>
            )}

            {stepActionStep === 2 && (
              <div style={{ marginTop: "3rem" }}>
                <div className="acc-step-box" onClick={deleteStep}>Confirm and delete</div>
                <div className="goBack2" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}

            {stepActionStep === 3 && <div className="success-box1">Step Successfully Deleted</div>}

            {stepActionStep === 4 && (
              <div className="acc-mt-div">
                <div className="acc-sub-text">What do you want to do?</div>
                <div className="acc-scroll-div">
                  <div
                    className="acc-step-box4"
                    style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}
                    onClick={() => setStepActionStep(5)}
                  >
                    <div>Add a Service</div>
                  </div>
                  <div
                    className="acc-step-box4"
                    style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}
                    onClick={() => setStepActionStep(6)}
                  >
                    <div>Remove a Service</div>
                  </div>
                </div>
                <div className="goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}

            {stepActionStep === 5 && (
              <div className="acc-mt-div">
                <div className="acc-sub-text">Which service do you want to add?</div>
                <div className="acc-scroll-div">
                  {allServicesToAdd &&
                    allServicesToAdd?.serviceDetails?.map((item) => (
                      <div
                        className={selectedServices.includes(item?._id) ? "acc-step-box4-selected" : "acc-step-box4"}
                        style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}
                        onClick={() => handleSelectServicesForStep(item?._id)}
                        key={item?._id}
                      >
                        <div>{item?.name}</div>
                        <div style={{ fontSize: "12px", fontWeight: 400, paddingTop: "5px" }}>{item?._id}</div>
                      </div>
                    ))}
                </div>
                <div
                  className="save-Btn"
                  style={{ opacity: selectedServices.length > 0 ? 1 : 0.3 }}
                  onClick={() => selectedServices.length > 0 && addServicesToStep()}
                >
                  Add Selected Services
                </div>
                <div className="goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}

            {stepActionStep === 6 && (
              <div className="acc-mt-div">
                <div className="acc-sub-text">Which service do you want to remove?</div>
                <div className="acc-scroll-div">
                  {allServicesToRemove &&
                    allServicesToRemove?.serviceDetails?.map((item) => (
                      <div
                        className={selectedServices.includes(item?._id) ? "acc-step-box4-selected" : "acc-step-box4"}
                        style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}
                        onClick={() => removeServiceFromStep(item?._id)}
                        key={item?._id}
                      >
                        <div>{item?.name}</div>
                        <div style={{ fontSize: "12px", fontWeight: 400, paddingTop: "5px" }}>{item?._id}</div>
                      </div>
                    ))}
                </div>
                <div className="goBack3" onClick={() => setStepActionStep(1)}>Go Back</div>
              </div>
            )}

            {actionLoading && (
              <div className="popularlogo">
                <img className="popularlogoimg" src={lg1} alt="" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPaths;