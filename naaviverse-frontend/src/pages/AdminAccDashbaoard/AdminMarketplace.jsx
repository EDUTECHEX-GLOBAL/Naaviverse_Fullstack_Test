import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import "./AdminMarketplace.scss";
import Skeleton from "react-loading-skeleton";
import axios from "axios";
import { toast } from "react-toastify";
import MarketplaceAssistance from "../../AdminDashboard/components/MarketplaceAssistance";
import marketplaceReplacementService from "../../services/marketplaceReplacementService";
import { SvgStarFilled, SvgStarEmpty } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ── Premium SVG Icons ─────────────────────────────────────
const IconInstitution = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMentor = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.65"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconVendor = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 0 1-8 0"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconDistributor = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 9.4 7.55 4.24M3.29 7 12 12l8.71-5M12 22V12"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 15v6M15 18h6" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/>
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Stat icons ────────────────────────────────────────────
const StatListings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
  </svg>
);
const StatPaid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 0 0 5 0"/>
  </svg>
);
const StatFree = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const StatPartners = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Config (single-color system — no per-category palettes) ─
const CATEGORY_CONFIG = {
  institution: { Icon: IconInstitution, label: "Institutions" },
  mentor:      { Icon: IconMentor,      label: "Mentors" },
  vendor:      { Icon: IconVendor,      label: "Vendors" },
  distributor: { Icon: IconDistributor, label: "Distributors" },
};

const getRoleConf = (role) =>
  CATEGORY_CONFIG[role?.toLowerCase()] || { Icon: () => null, label: "Unknown" };

const formatPrice = (cost) => {
  if (!cost || cost === "0" || cost === 0 || cost === "Free" || cost === "free") return "Free";
  const str = String(cost).trim().replace(/^\$+/, "").trim();
  return str.startsWith("₹") ? str : `₹${str}`;
};

const getAccessPriceConflict = (accessVal, costVal) => {
  const normAccess = String(accessVal || "").trim().toLowerCase();
  const rawCost = String(costVal || "").trim().replace(/[₹$,\s]/g, "");
  const normCostLower = rawCost.toLowerCase();

  const isCostZeroOrFree = !rawCost || rawCost === "0" || normCostLower === "free" || Number(rawCost) === 0;
  const numCost = Number(rawCost);
  const isCostPositive = !isNaN(numCost) && numCost > 0;

  if (normAccess === "free") {
    if (isCostPositive || (!isCostZeroOrFree && rawCost !== "")) {
      return {
        hasConflict: true,
        type: "free_with_price",
        message: `Conflict: Access is set to Free, but Price is ₹${rawCost}. Free items cannot have a price greater than ₹0.`,
        priceError: true,
        accessError: true,
      };
    }
  } else if (normAccess === "paid") {
    if (isCostZeroOrFree) {
      return {
        hasConflict: true,
        type: "paid_with_zero",
        message: "Conflict: Access is set to Paid, but Price is ₹0 or Free. Paid items must have a price greater than ₹0.",
        priceError: true,
        accessError: true,
      };
    }
  }

  return { hasConflict: false, type: null, message: "", priceError: false, accessError: false };
};

const getMarketplaceStarRating = (item) => {
  const avg = Number(item?.average_rating || item?.analytics?.average_rating || item?.rating || 0);
  if (avg > 0) return Math.min(5, Math.max(1, avg)).toFixed(1);

  const score = Number(item?.naavi_score || item?.marketplace_score || item?.analytics?.marketplace_score || 0);
  if (score > 0) {
    const derived = 3.8 + (score / 100) * 1.1;
    return Math.min(4.9, Math.max(3.8, derived)).toFixed(1);
  }

  const hash = String(item?._id || item?.name || "1").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (4.0 + (hash % 10) * 0.1).toFixed(1);
};

const RenderStars = ({ rating = 5, size = 12 }) => {
  const numRating = Math.round(Number(rating) || 5);
  return (
    <span className="adm-rating-stars" style={{ display: "inline-flex", gap: "2px", verticalAlign: "middle", flexShrink: 0 }}>
      {Array.from({ length: 5 }, (_, i) =>
        i < numRating ? (
          <SvgStarFilled key={i} size={size} color="#f59e0b" />
        ) : (
          <SvgStarEmpty key={i} size={size} color="#cbd5e1" />
        )
      )}
    </span>
  );
};

const LAYER_OPTIONS = [
  { value: "", label: "—" },
  { value: "Foundation", label: "Foundation" },
  { value: "macro", label: "Macro" },
  { value: "micro", label: "Micro" },
  { value: "nano", label: "Nano" },
];

const parseFeatures = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  return features.split(/[,;]+/).map((f) => f.trim()).filter(Boolean);
};

// ── Main Component ────────────────────────────────────────
const AdminMarketplace = () => {
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("institution");
  const [emailSearch,    setEmailSearch]    = useState("");
  const [nameSearch,     setNameSearch]     = useState("");
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [isSaving,       setIsSaving]       = useState(false);
  const [tableKey,       setTableKey]       = useState(0);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);
  const layerDropdownRef = useRef(null);
  const [editFormData,   setEditFormData]   = useState({
    name: "", access: "", cost: "", discount: "", layer: "",
    duration: "", goal: "", features: "", outcomes: "", iterations: "", partner_email: "",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState(urlTab === "assistance" ? "assistance" : "catalog");
  const [pendingAssistanceCount, setPendingAssistanceCount] = useState(0);

  useEffect(() => {
    if (urlTab === "assistance") {
      setActiveSection("assistance");
    } else if (urlTab === "catalog") {
      setActiveSection("catalog");
    }
  }, [urlTab]);

  useEffect(() => {
    marketplaceReplacementService.getAllAssistanceRequests().then((reqs) => {
      const pending = (reqs || []).filter((r) => r.status === "pending" || r.status === "reviewing").length;
      setPendingAssistanceCount(pending);
    }).catch(() => {});
  }, [activeSection]);

  const dropdownRef = useRef(null);

  const fetchMarketplaceItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/marketplace/admin/get-all`);
      if (res.data?.status) setItems(res.data.data || []);
      else { setItems([]); toast.error(res.data?.message || "Failed to load items"); }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error loading items");
      setItems([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMarketplaceItems(); }, [fetchMarketplaceItems]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
      if (layerDropdownRef.current && !layerDropdownRef.current.contains(e.target)) {
        setLayerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryClick = (cat) => {
    setCatDropdownOpen(false);
    if (cat === activeCategory) return;
    setTableKey((k) => k + 1);
    setActiveCategory(cat);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    let initialCost   = selectedItem.cost   || "";
    let initialAccess = selectedItem.access || "";

    const cleanCost = String(initialCost).replace(/[₹$,\s]/g, "").trim().toLowerCase();
    const numCost = Number(cleanCost);

    // Auto-harmonize access based on actual cost
    if (!isNaN(numCost) && numCost > 0) {
      initialAccess = "Paid";
    } else if (cleanCost === "0" || cleanCost === "free" || !cleanCost) {
      initialAccess = "Free";
      initialCost = "0";
    }

    setEditFormData({
      name:          selectedItem.name          || "",
      access:        initialAccess,
      cost:          initialCost,
      discount:      selectedItem.discount      || "",
      layer:         selectedItem.layer         || "",
      duration:      selectedItem.duration      || "",
      goal:          selectedItem.goal          || "",
      features:      selectedItem.features      || "",
      outcomes:      selectedItem.outcomes      || "",
      iterations:    selectedItem.iterations    || "",
      partner_email: selectedItem.partner_email || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      let next = { ...prev, [name]: value };

      if (name === "access") {
        const norm = value.trim().toLowerCase();
        if (norm === "free") {
          const rawCost = String(prev.cost || "").trim().replace(/[₹$,\s]/g, "");
          const numCost = Number(rawCost);
          if (!isNaN(numCost) && numCost > 0) {
            next.cost = "0";
          }
        } else if (norm === "paid") {
          const rawCost = String(prev.cost || "").trim().toLowerCase();
          if (!rawCost || rawCost === "0" || rawCost === "free") {
            next.cost = "";
          }
        }
      } else if (name === "cost") {
        const rawCost = String(value || "").trim().replace(/[₹$,\s]/g, "");
        const numCost = Number(rawCost);
        if (!isNaN(numCost) && numCost > 0) {
          if ((prev.access || "").trim().toLowerCase() !== "paid") {
            next.access = "Paid";
          }
        } else if (value.trim().toLowerCase() === "free" || rawCost === "0") {
          if ((prev.access || "").trim().toLowerCase() !== "free") {
            next.access = "Free";
          }
        }
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    const conflict = getAccessPriceConflict(editFormData.access, editFormData.cost);
    if (conflict.hasConflict) {
      toast.error(conflict.message);
      return;
    }

    const normAccess = (editFormData.access || "").trim().toLowerCase();
    let finalPayload = { ...editFormData };

    if (normAccess === "free") {
      finalPayload.access = "Free";
      finalPayload.cost = "0";
    } else if (normAccess === "paid") {
      finalPayload.access = "Paid";
      finalPayload.cost = String(editFormData.cost || "").replace(/[₹$,\s]/g, "");
    }

    setIsSaving(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/marketplace/admin/update/${selectedItem._id}`,
        finalPayload
      );
      if (res.data?.status) {
        toast.success("Item updated!");
        const updated = res.data.data;
        setItems((prev) => prev.map((i) => (i._id === selectedItem._id ? updated : i)));
        setSelectedItem(updated);
        setIsEditing(false);
        setLayerDropdownOpen(false);
      } else toast.error(res.data?.message || "Failed to update");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating item.");
    } finally {
      setIsSaving(false);
    }
  };

  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [loadingScore,   setLoadingScore]   = useState(false);

  const fetchScoreBreakdown = useCallback(async (itemId) => {
    if (!itemId) return;
    setLoadingScore(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/marketplace/admin/score-breakdown/${itemId}`);
      if (res.data?.status) {
        setScoreBreakdown(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load score breakdown:", err);
    } finally {
      setLoadingScore(false);
    }
  }, []);

  useEffect(() => {
    if (selectedItem?._id) {
      fetchScoreBreakdown(selectedItem._id);
    } else {
      setScoreBreakdown(null);
    }
  }, [selectedItem, fetchScoreBreakdown]);

  const handleCancel = () => {
    if (isSaving) return;
    setIsEditing(false);
    setEditFormData({});
    setLayerDropdownOpen(false);
  };
  const handleCloseModal = () => {
    if (isSaving) return;
    setSelectedItem(null);
    setIsEditing(false);
    setScoreBreakdown(null);
    setLayerDropdownOpen(false);
  };

  // Counts per category (no email/name filter — used in the dropdown menu)
  const categoryCounts = Object.keys(CATEGORY_CONFIG).reduce((acc, cat) => {
    acc[cat] = items.filter((i) => {
      const r = i.role?.toLowerCase().trim();
      return r === cat || (cat === "distributor" && r?.startsWith("distribut")) || (cat === "institution" && r?.startsWith("institut"));
    }).length;
    return acc;
  }, {});

  // Filtered items for the active table view
  const filteredItems = items.filter((item) => {
    const r = item.role?.toLowerCase().trim();
    const roleMatch  =
      r === activeCategory ||
      (activeCategory === "distributor" && r?.startsWith("distribut")) ||
      (activeCategory === "institution" && r?.startsWith("institut"));
    const emailMatch = !emailSearch || item.partner_email?.toLowerCase().includes(emailSearch.toLowerCase());
    const nameMatch  = !nameSearch  || item.name?.toLowerCase().includes(nameSearch.toLowerCase());
    return roleMatch && emailMatch && nameMatch;
  });

  // Stats (across all categories, respecting email/name filters)
  const allFiltered    = items.filter((i) => (!emailSearch || i.partner_email?.toLowerCase().includes(emailSearch.toLowerCase())) && (!nameSearch || i.name?.toLowerCase().includes(nameSearch.toLowerCase())));
  const totalItems     = allFiltered.length;
  const freeItems      = allFiltered.filter((i) => !i.cost || i.cost === "0" || i.cost === 0).length;
  const paidItems      = totalItems - freeItems;
  const uniquePartners = new Set(allFiltered.map((i) => i.partner_email).filter(Boolean)).size;

  const ac = CATEGORY_CONFIG[activeCategory];

  return (
    <div className="adm-root">

      {/* ── Section Header Navigation (Catalog vs Assistance Requests) ── */}
      <div className="adm-header-nav">
        <div className="adm-header-tabs">
          <button
            type="button"
            className={`adm-header-tab ${activeSection === "catalog" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("catalog");
              setSearchParams({ tab: "catalog" });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span>Marketplace Catalog</span>
          </button>

          <button
            type="button"
            className={`adm-header-tab ${activeSection === "assistance" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("assistance");
              setSearchParams({ tab: "assistance" });
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Assistance Requests</span>
          </button>
        </div>
      </div>

      {activeSection === "assistance" ? (
        <div className="adm-assistance-embedded">
          <MarketplaceAssistance />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="adm-stats">
        {[
          { label: "Total Listings", value: totalItems,     Icon: StatListings, variant: "total" },
          { label: "Paid Items",     value: paidItems,      Icon: StatPaid,     variant: "paid" },
          { label: "Free Items",     value: freeItems,      Icon: StatFree,     variant: "free" },
          { label: "Partners",       value: uniquePartners, Icon: StatPartners, variant: "partners" },
        ].map(({ label, value, Icon, variant }) => (
          <div className={`adm-stat adm-stat--${variant}`} key={label}>
            <div className="adm-stat__icon"><Icon /></div>
            <div className="adm-stat__body">
              <span className="adm-stat__label">{label}</span>
              <span className="adm-stat__val">{loading ? "—" : value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Panel */}
      <div className="adm-panel">
        <div className="adm-panel__bar">
          <div className="adm-panel__bar-left">
            <div className="adm-cat-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`adm-cat-dropdown__btn ${catDropdownOpen ? "adm-cat-dropdown__btn--open" : ""}`}
                onClick={() => setCatDropdownOpen((o) => !o)}
              >
                <span className="adm-cat-dropdown__icon"><ac.Icon /></span>
                <span className="adm-panel__title">{ac.label}</span>
                <span className="adm-cat-dropdown__count">{loading ? "—" : (categoryCounts[activeCategory] || 0)}</span>
                <span className="adm-cat-dropdown__chevron"><IconChevronDown /></span>
              </button>

              {catDropdownOpen && (
                <div className="adm-cat-dropdown__menu">
                  {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => {
                    const ItemIcon = conf.Icon;
                    return (
                      <div
                        key={key}
                        className={`adm-cat-dropdown__item ${activeCategory === key ? "adm-cat-dropdown__item--active" : ""}`}
                        onClick={() => handleCategoryClick(key)}
                      >
                        <span className="adm-cat-dropdown__item-icon"><ItemIcon /></span>
                        <span className="adm-cat-dropdown__item-label">{conf.label}</span>
                        <span className="adm-cat-dropdown__item-count">
                          {loading ? "—" : (categoryCounts[key] || 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="adm-panel__bar-right">
            <div className="adm-search">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search name..." value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)} className="adm-search__input" />
              {nameSearch && (
                <button
                  type="button"
                  className="adm-search__clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNameSearch("");
                  }}
                  title="Clear"
                  aria-label="Clear name search"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="adm-search">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="text" placeholder="Search email..." value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)} className="adm-search__input" />
              {emailSearch && (
                <button
                  type="button"
                  className="adm-search__clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailSearch("");
                  }}
                  title="Clear"
                  aria-label="Clear email search"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="adm-table-wrap" key={tableKey}>
          {loading ? (
            <div className="adm-skeletons">
              {Array(5).fill(0).map((_, i) => (
                <div className="adm-skel-row" key={i}>
                  <Skeleton circle width={24} height={24} />
                  <Skeleton height={11} width={130} />
                  <Skeleton height={11} width={150} />
                  <Skeleton height={11} width={90} />
                  <Skeleton height={18} width={40} borderRadius={20} />
                  <Skeleton height={22} width={60} borderRadius={20} />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty__icon"><ac.Icon /></div>
              <p className="adm-empty__text">No {ac.label.toLowerCase()} found</p>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Partner Email</th>
                  <th>Rating</th>
                  <th>Access</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id} className="adm-row" onClick={() => setSelectedItem(item)}>
                    <td className="adm-row__name-td">
                      <div className="adm-row__name-wrap">
                        <span className="adm-row__icon">
                          <ac.Icon />
                        </span>
                        <span className="adm-row__name" title={item.name || "Untitled"}>
                          {item.name || "Untitled"}
                        </span>
                      </div>
                    </td>
                    <td className="adm-row__email" data-label="Email" title={item.partner_email || ""}>
                      {item.partner_email || <span className="adm-nil">—</span>}
                    </td>
                    <td data-label="Rating">
                      <span className="adm-rating-badge">
                        <RenderStars rating={getMarketplaceStarRating(item)} size={12} />
                        <span>{getMarketplaceStarRating(item)}</span>
                      </span>
                    </td>
                    <td data-label="Access">
                      <span className={`adm-access ${!item.cost || item.cost === "0" || item.cost === 0 ? "adm-access--free" : "adm-access--paid"}`}>
                        {!item.cost || item.cost === "0" || item.cost === 0 ? "Free" : "Paid"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="adm-view-btn"
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail / Edit Modal */}
      {selectedItem && (() => {
        const rc = getRoleConf(selectedItem.role);
        const RcIcon = rc.Icon;
        const layer  = selectedItem.layer?.toUpperCase();
        const featureList = parseFeatures(selectedItem.features);
        const conflict = isEditing
          ? getAccessPriceConflict(editFormData.access, editFormData.cost)
          : { hasConflict: false };

        return createPortal(
          <div className="adm-overlay" onClick={handleCloseModal}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>

              {/* Close button */}
              <button className="adm-modal__x" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* Head */}
              <div className="adm-modal__head">
                <div className="adm-modal__avatar"><RcIcon /></div>
                <div className="adm-modal__head-text">
                  {!isEditing ? (
                    <>
                      <h2 className="adm-modal__name">{selectedItem.name || "Item Details"}</h2>
                      <div className="adm-modal__meta">
                        <span>{selectedItem.partner_email || "—"}</span>
                        {selectedItem.createdAt && (
                          <>
                            <span className="adm-modal__meta-dot">·</span>
                            <span>{new Date(selectedItem.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <input
                      type="text" name="name" value={editFormData.name}
                      onChange={handleInputChange} className="adm-edit-title"
                      placeholder="Item Name"
                    />
                  )}
                </div>
                <div className="adm-modal__head-right">
                  <span className="adm-modal__role-tag">{rc.label}</span>
                  {!isEditing ? (
                    <button className="adm-modal__edit-btn" onClick={handleEditClick} title="Edit">
                      <IconEdit />
                    </button>
                  ) : (
                    <div className="adm-modal__edit-actions">
                      <button
                        type="button"
                        className={`adm-modal__save-btn ${(conflict.hasConflict || isSaving) ? "adm-modal__save-btn--disabled" : ""} ${isSaving ? "adm-modal__save-btn--loading" : ""}`}
                        onClick={handleSave}
                        disabled={isSaving || conflict.hasConflict}
                        title={conflict.hasConflict ? conflict.message : isSaving ? "Saving changes..." : "Save changes"}
                      >
                        {isSaving ? (
                          <>
                            <svg className="adm-save-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        className="adm-modal__cancel-btn"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="adm-modal__body">

                {/* Chip row */}
                <div className="adm-chips">
                  <div className="adm-chip">
                    <span className="adm-chip__label">Rating</span>
                    <span className="adm-rating-badge adm-rating-badge--modal">
                      <RenderStars rating={getMarketplaceStarRating(selectedItem)} size={12} />
                      <span>{getMarketplaceStarRating(selectedItem)}</span>
                    </span>
                  </div>
                  <div className="adm-chip">
                    <span className="adm-chip__label">Access</span>
                    {!isEditing ? (
                      <span
                        className={`adm-chip__val ${(!selectedItem.cost || selectedItem.cost === "0") ? "adm-chip__val--free" : "adm-chip__val--paid"}`}
                        title={(!selectedItem.cost || selectedItem.cost === "0") ? "Free" : (selectedItem.access && selectedItem.access.toLowerCase() !== "free" ? selectedItem.access : "Paid")}
                      >
                        {(!selectedItem.cost || selectedItem.cost === "0") ? "Free" : (selectedItem.access && selectedItem.access.toLowerCase() !== "free" ? selectedItem.access : "Paid")}
                      </span>
                    ) : (
                      <>
                        <input
                          name="access"
                          list="adm-access-list"
                          value={editFormData.access}
                          onChange={handleInputChange}
                          className={`adm-chip__input ${conflict.accessError ? "adm-chip__input--error" : ""}`}
                          placeholder="Free or Paid"
                          autoComplete="off"
                        />
                        <datalist id="adm-access-list">
                          <option value="Free" />
                          <option value="Paid" />
                        </datalist>
                      </>
                    )}
                  </div>
                  <div className="adm-chip">
                    <span className="adm-chip__label">Price</span>
                    {!isEditing ? (
                      <span className="adm-chip__val" title={formatPrice(selectedItem.cost)}>
                        {formatPrice(selectedItem.cost)}
                      </span>
                    ) : (
                      <input
                        name="cost"
                        value={editFormData.cost}
                        onChange={handleInputChange}
                        className={`adm-chip__input ${conflict.priceError ? "adm-chip__input--error" : ""}`}
                        placeholder={editFormData.access?.toLowerCase() === "free" ? "0" : "Price (₹)"}
                      />
                    )}
                  </div>
                  {(selectedItem.discount || isEditing) && (
                    <div className="adm-chip">
                      <span className="adm-chip__label">Discount</span>
                      {!isEditing ? (
                        <span className="adm-chip__val adm-chip__val--paid">{selectedItem.discount}</span>
                      ) : (
                        <input name="discount" value={editFormData.discount} onChange={handleInputChange} className="adm-chip__input" />
                      )}
                    </div>
                  )}
                  {(layer || isEditing) && (
                    <div className="adm-chip">
                      <span className="adm-chip__label">Layer</span>
                      {!isEditing ? (
                        <span className="adm-layer-pill">{layer}</span>
                      ) : (
                        <div className="adm-layer-select-wrap" ref={layerDropdownRef}>
                          <button
                            type="button"
                            className="adm-layer-select-btn"
                            onClick={() => setLayerDropdownOpen((prev) => !prev)}
                            aria-expanded={layerDropdownOpen}
                          >
                            <span>
                              {LAYER_OPTIONS.find((o) => o.value.toLowerCase() === (editFormData.layer || "").toLowerCase())?.label || editFormData.layer || "—"}
                            </span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: layerDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {layerDropdownOpen && (
                            <div className="adm-layer-select-menu">
                              {LAYER_OPTIONS.map((opt) => {
                                const isSelected = (editFormData.layer || "").toLowerCase() === opt.value.toLowerCase();
                                return (
                                  <div
                                    key={opt.value}
                                    className={`adm-layer-select-opt ${isSelected ? "is-selected" : ""}`}
                                    onClick={() => {
                                      setEditFormData((prev) => ({ ...prev, layer: opt.value }));
                                      setLayerDropdownOpen(false);
                                    }}
                                  >
                                    {opt.label}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {(selectedItem.duration || isEditing) && (
                    <div className="adm-chip">
                      <span className="adm-chip__label">Duration</span>
                      {!isEditing ? (
                        <span className="adm-chip__val">{selectedItem.duration}</span>
                      ) : (
                        <input name="duration" value={editFormData.duration} onChange={handleInputChange} className="adm-chip__input" />
                      )}
                    </div>
                  )}
                  {(selectedItem.iterations || isEditing) && (
                    <div className="adm-chip">
                      <span className="adm-chip__label">Iterations</span>
                      {!isEditing ? (
                        <span className="adm-chip__val">{selectedItem.iterations}</span>
                      ) : (
                        <input name="iterations" value={editFormData.iterations} onChange={handleInputChange} className="adm-chip__input" />
                      )}
                    </div>
                  )}
                </div>

                {/* Conflict Alert Banner */}
                {isEditing && conflict.hasConflict && (
                  <div className="adm-conflict-alert">
                    <div className="adm-conflict-alert__content">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h20.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <span>{conflict.message}</span>
                    </div>
                    <div className="adm-conflict-alert__actions">
                      {conflict.type === "free_with_price" && (
                        <>
                          <button
                            type="button"
                            className="adm-conflict-alert__btn adm-conflict-alert__btn--primary"
                            onClick={() => setEditFormData((prev) => ({ ...prev, access: "Paid" }))}
                          >
                            Set Access to Paid
                          </button>
                          <button
                            type="button"
                            className="adm-conflict-alert__btn"
                            onClick={() => setEditFormData((prev) => ({ ...prev, cost: "0" }))}
                          >
                            Set Price to ₹0 (Free)
                          </button>
                        </>
                      )}
                      {conflict.type === "paid_with_zero" && (
                        <button
                          type="button"
                          className="adm-conflict-alert__btn adm-conflict-alert__btn--primary"
                          onClick={() => setEditFormData((prev) => ({ ...prev, access: "Free", cost: "0" }))}
                        >
                          Set Access to Free
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Text fields */}
                {(selectedItem.goal || isEditing) && (
                  <div className="adm-mfield">
                    <span className="adm-mfield__label">Goal</span>
                    {!isEditing ? (
                      <p className="adm-mfield__text">{selectedItem.goal}</p>
                    ) : (
                      <textarea name="goal" value={editFormData.goal} onChange={handleInputChange}
                        className="adm-mfield__textarea" rows="3" />
                    )}
                  </div>
                )}
                {(selectedItem.outcomes || isEditing) && (
                  <div className="adm-mfield">
                    <span className="adm-mfield__label">Outcomes</span>
                    {!isEditing ? (
                      <p className="adm-mfield__text">{selectedItem.outcomes}</p>
                    ) : (
                      <textarea name="outcomes" value={editFormData.outcomes} onChange={handleInputChange}
                        className="adm-mfield__textarea" rows="3" />
                    )}
                  </div>
                )}
                {(selectedItem.features || isEditing) && (
                  <div className="adm-mfield">
                    <span className="adm-mfield__label">Features</span>
                    {!isEditing ? (
                      featureList.length > 0 ? (
                        <div className="adm-feature-chips">
                          {featureList.map((f, i) => (
                            <span key={i} className="adm-feature-chip">{f}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="adm-mfield__text">{selectedItem.features}</p>
                      )
                    ) : (
                      <textarea name="features" value={editFormData.features} onChange={handleInputChange}
                        className="adm-mfield__textarea" rows="3"
                        placeholder="Live Sessions, Mentorship, Certification" />
                    )}
                  </div>
                )}

                {/* ── 10-Factor Naavi Score Inspector (Matching marketplace_review.md Section 10) ── */}
                {!isEditing && (
                  <div className="adm-score-inspector">
                    <div className="adm-score-inspector__head">
                      <div className="adm-score-inspector__title-wrap">
                        <span className="adm-score-inspector__tag">RANKING BREAKDOWN</span>
                        <h3 className="adm-score-inspector__title">Naavi Score Inspection</h3>
                      </div>
                      <div className="adm-score-inspector__badge">
                        <span className="adm-score-inspector__score-num">
                          {loadingScore ? "..." : (scoreBreakdown?.naavi_score || selectedItem.naavi_score || selectedItem.marketplace_score || "75.0")}
                        </span>
                        <span className="adm-score-inspector__score-max">/100</span>
                      </div>
                    </div>

                    <div className="adm-score-factors">
                      {[
                        { key: "intentMatch",     label: "Intent Match",      weight: "25%" },
                        { key: "pathStepMatch",   label: "Path & Step Match", weight: "20%" },
                        { key: "personalization", label: "Personalization",   weight: "12%" },
                        { key: "partnerQuality",  label: "Partner Quality",    weight: "10%" },
                        { key: "popularity",      label: "Popularity",         weight: "8%"  },
                        { key: "value",           label: "Price / Value",      weight: "8%"  },
                        { key: "partnerTrust",    label: "Partner Trust",      weight: "7%"  },
                        { key: "availability",    label: "Availability",       weight: "4%"  },
                        { key: "freshness",       label: "Freshness",          weight: "3%"  },
                        { key: "exploration",     label: "Exploration Boost",  weight: "3%"  },
                      ].map(({ key, label, weight }) => {
                        const val = scoreBreakdown?.score_breakdown?.[key] ?? 70;
                        return (
                          <div className="adm-factor-row" key={key}>
                            <div className="adm-factor-row__info">
                              <span className="adm-factor-row__name">{label} <small className="adm-factor-row__weight">({weight})</small></span>
                              <span className="adm-factor-row__val">{val}/100</span>
                            </div>
                            <div className="adm-factor-row__bar-track">
                              <div
                                className={`adm-factor-row__bar-fill ${val >= 80 ? "high" : val >= 60 ? "mid" : "low"}`}
                                style={{ width: `${Math.min(100, Math.max(5, val))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
        </>
      )}
    </div>
  );
};

export default AdminMarketplace;