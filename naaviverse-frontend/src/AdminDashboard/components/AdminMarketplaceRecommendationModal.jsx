import CustomSelect from '../../pages/accDashbaoard/CustomSelect';
import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import "./MarketplaceAssistance.scss";
import marketplaceReplacementService from "../../services/marketplaceReplacementService";
import { SvgCheck, SvgClose } from "../../utils/SvgIcons";

export default function AdminMarketplaceRecommendationModal({
  isOpen,
  onClose,
  onRecommend,
  availableServices = null,
  studentName = "Student",
  request = null,
}) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "custom"
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Search & Catalog state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [detailsService, setDetailsService] = useState(null);

  // Custom Service Form state
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Mentorship Program");
  const [customProvider, setCustomProvider] = useState("Edutechex");
  const [customCost, setCustomCost] = useState("4999");
  const [customMode, setCustomMode] = useState("Online");
  const [customDuration, setCustomDuration] = useState("4 Weeks");
  const [customGoal, setCustomGoal] = useState("");

  // Admin Note
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track if we already loaded services for this modal session
  const loadedForStepRef = useRef(null);

  const stepId = request?.stepId || request?.step_id;

  // Single fetch on modal open — never loop
  useEffect(() => {
    if (!isOpen) {
      loadedForStepRef.current = null;
      setSelectedService(null);
      setSearch("");
      setLoadingServices(false);
      return;
    }

    // If parent passed explicit array of services
    if (Array.isArray(availableServices) && availableServices.length > 0) {
      setServices(availableServices);
      setLoadingServices(false);
      return;
    }

    const currentKey = stepId || "all_catalog";
    if (loadedForStepRef.current === currentKey) {
      return;
    }

    loadedForStepRef.current = currentKey;
    let isCurrent = true;
    setLoadingServices(true);

    marketplaceReplacementService
      .getAllCatalogServices(stepId)
      .then((items) => {
        if (isCurrent) {
          setServices(Array.isArray(items) ? items : []);
        }
      })
      .catch((err) => {
        console.error("Failed to load step marketplace services:", err);
        if (isCurrent) {
          setServices([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoadingServices(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, stepId, availableServices]);

  // Filter catalog items
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (services || []).filter((s) => {
      const name = s.name || s.title || "";
      const cat = s.category || s.layer || s.role || "";
      const prov = s.provider || s.partner_email || "";
      const goal = s.goal || s.description || s.desc || "";

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        prov.toLowerCase().includes(q) ||
        goal.toLowerCase().includes(q);

      const isFree = !s.cost || s.cost === "0" || String(s.cost).toLowerCase() === "free";

      const catLower = cat.toLowerCase();
      const nameLower = name.toLowerCase();

      const matchesCat =
        categoryFilter === "all" ||
        (categoryFilter === "free" && isFree) ||
        (categoryFilter === "mentorship" && (catLower.includes("mentor") || s.role === "MENTOR" || nameLower.includes("mentor"))) ||
        (categoryFilter === "summer_program" && (catLower.includes("summer") || nameLower.includes("summer") || s.role === "INSTITUTION")) ||
        (categoryFilter === "course" && (catLower.includes("course") || catLower.includes("bootcamp") || s.role === "VENDOR" || nameLower.includes("course") || nameLower.includes("materials")));

      return matchesSearch && matchesCat;
    });
  }, [search, categoryFilter, services]);

  if (!isOpen) return null;

  const handleSwitchToCustomWithName = (nameToPreFill) => {
    if (nameToPreFill) {
      setCustomName(nameToPreFill);
    }
    setActiveTab("custom");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let serviceToRecommend = null;

    if (activeTab === "custom") {
      if (!customName.trim()) {
        alert("Please enter a service name for the custom recommendation.");
        return;
      }

      serviceToRecommend = {
        id: `custom-${Date.now()}`,
        _id: `custom-${Date.now()}`,
        name: customName.trim(),
        category: customCategory,
        role: customCategory.toUpperCase().includes("MENTOR") ? "MENTOR" : "VENDOR",
        provider: customProvider.trim() || "Accredited Partner",
        cost: customCost.trim() ? customCost.trim().replace(/[^\d]/g, "") || "0" : "0",
        mode: customMode,
        duration: customDuration,
        goal: customGoal.trim() || `Customized ${customCategory} recommendation provided by Super Admin.`,
        desc: customGoal.trim() || `Customized ${customCategory} recommendation provided by Super Admin.`,
        step_id: stepId,
        path_id: request?.pathId || request?.path_id,
      };

      // Also persist to backend if possible
      try {
        marketplaceReplacementService.createCustomService(serviceToRecommend).catch(() => {});
      } catch (err) {
        // silent
      }
    } else {
      if (!selectedService) {
        alert("Please select a service from the list or create a custom service.");
        return;
      }
      serviceToRecommend = selectedService;
    }

    setSubmitting(true);
    try {
      await onRecommend(serviceToRecommend, adminNote.trim());
      onClose();
    } catch (err) {
      console.error("Failed to recommend service:", err);
      alert("Failed to send recommendation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    activeTab === "custom" ? customName.trim().length > 0 : Boolean(selectedService);

  const modalElement = (
    <div className="admin-mkt-rec-overlay" onClick={onClose}>
      <div className="admin-mkt-rec-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="amr-header">
          <div>
            <h3 className="amr-title">Recommend Marketplace Service</h3>
            <p className="amr-sub">
              {activeTab === "catalog"
                ? `Pick an existing service from catalog to send to ${studentName}`
                : `Create and attach a custom marketplace replacement option for ${studentName}`}
            </p>
          </div>
          <button className="amr-close-btn" onClick={onClose} type="button">
            <SvgClose size={14} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="amr-mode-tabs">
          <button
            type="button"
            className={`amr-mode-tab ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search Catalog</span>
          </button>

          <button
            type="button"
            className={`amr-mode-tab ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Custom Service</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="amr-body">
          {/* ═════════ TAB 1: CATALOG SEARCH & SELECT ═════════ */}
          {activeTab === "catalog" && (
            <div className="amr-catalog-pane">
              {/* Search + Create Button Row */}
              <div className="amr-search-row">
                <div className="amr-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="amr-search-input"
                    placeholder="Search related services for this step (e.g. Edutechex)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="amr-clear-search"
                      onClick={() => setSearch("")}
                    >
                      <SvgClose size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="amr-add-custom-quick-btn"
                  onClick={() => handleSwitchToCustomWithName(search.trim())}
                  title="Create a custom service for this student"
                >
                  <span>+ Custom</span>
                </button>
              </div>

              {/* Quick Category Filter Pills */}
              <div className="amr-cat-pills">
                {[
                  { key: "all", label: "All" },
                  { key: "mentorship", label: "Mentorship" },
                  { key: "summer_program", label: "Summer Programs" },
                  { key: "course", label: "Courses" },
                  { key: "free", label: "Free" },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`amr-cat-pill ${categoryFilter === c.key ? "active" : ""}`}
                    onClick={() => setCategoryFilter(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Service Cards List (Compact Clean Rows) */}
              <div className="amr-services-list">
                {loadingServices ? (
                  <div className="amr-empty">Loading related marketplace options...</div>
                ) : filtered.length === 0 ? (
                  <div className="amr-empty-with-action">
                    <p>
                      {services.length === 0
                        ? "No pre-existing marketplace services linked to this step."
                        : `No services matching "${search || categoryFilter}".`}
                    </p>
                  </div>
                ) : (
                  filtered.map((s) => {
                    const sId = String(s._id || s.id || s.name || "");
                    const selId = selectedService
                      ? String(selectedService._id || selectedService.id || selectedService.name || "")
                      : "";
                    const isSelected = Boolean(selectedService && sId && selId === sId);

                    const name = s.name || s.title || "Marketplace Service";
                    const costVal = s.cost !== undefined ? s.cost : s.price;
                    const cost =
                      !costVal || costVal === "0" || String(costVal).toLowerCase() === "free"
                        ? "Free"
                        : `₹${Number(String(costVal).replace(/[^\d]/g, "")).toLocaleString("en-IN")}`;
                    const category = s.category || s.layer || s.role || "Service";

                    return (
                      <div
                        key={s._id || s.id || name}
                        className={`amr-service-row ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedService(s)}
                      >
                        <div className="amr-row-left">
                          <span className={`custom-radio ${isSelected ? "checked" : ""}`} />
                          <span className="amr-row-cat">{category}</span>
                          <span className="amr-row-name" title={name}>
                            {name}
                          </span>
                        </div>

                        <div className="amr-row-right">
                          <span className="amr-row-price">{cost}</span>
                          <button
                            type="button"
                            className="amr-row-details-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsService(s);
                            }}
                            title="View full service details"
                          >
                            View Details
                          </button>
                          <span className={`amr-row-sel-badge ${isSelected ? "selected" : ""}`}>
                            {isSelected ? "● Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: CREATE CUSTOM SERVICE ═════════ */}
          {activeTab === "custom" && (
            <div className="amr-custom-form-pane">
              <div className="amr-custom-intro">
                <span className="amr-sparkle" style={{ display: "flex", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <path d="M12 3l1.912 4.888L18.8 9.8l-4.888 1.912L12 16.6l-1.912-4.888L5.2 9.8l4.888-1.912L12 3z"/>
                  </svg>
                </span>
                <div className="amr-intro-text">
                  <span className="amr-intro-title">Create Custom Marketplace Service</span>
                  <span className="amr-intro-desc">Define a customized service or mentorship offer for this student.</span>
                </div>
              </div>

              <div className="amr-form-grid">
                {/* Service Name */}
                <div className="amr-field full">
                  <label className="amr-label">
                    Service / Program Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="amr-input"
                    placeholder="e.g. Edutechex 1-on-1 Economics Research Mentorship"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>

                {/* Category / Type */}
                <div className="amr-field">
                  <label className="amr-label">Category / Type</label>
                  <div className="project-desktop-custom-select">
                    <CustomSelect
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      options={[
                        "Mentorship Program",
                        "Summer Program",
                        "Course / Bootcamp",
                        "Research Project",
                        "Internship / Training",
                        "Admissions Counseling",
                        { label: "Other Custom Service", value: "Other" }
                      ]}
                      searchable={false}
                    />
                  </div>
                  <div className="project-mobile-native-select">
                    <select
                      className="amr-select"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    >
                      <option value="Mentorship Program">Mentorship Program</option>
                      <option value="Summer Program">Summer Program</option>
                      <option value="Course / Bootcamp">Course / Bootcamp</option>
                      <option value="Research Project">Research Project</option>
                      <option value="Internship / Training">Internship / Training</option>
                      <option value="Admissions Counseling">Admissions Counseling</option>
                      <option value="Other">Other Custom Service</option>
                    </select>
                  </div>
                </div>

                {/* Provider / Institute */}
                <div className="amr-field">
                  <label className="amr-label">Provider / Institute</label>
                  <input
                    type="text"
                    className="amr-input"
                    placeholder="e.g. Edutechex Global / University Partner"
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value)}
                  />
                </div>

                {/* Cost / Price */}
                <div className="amr-field">
                  <label className="amr-label">Price / Cost (₹)</label>
                  <input
                    type="text"
                    className="amr-input"
                    placeholder="e.g. 4999 or Free / 0"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                  />
                </div>

                {/* Mode & Duration */}
                <div className="amr-field">
                  <label className="amr-label">Delivery Mode & Duration</label>
                  <div className="amr-field-split">
                    <div className="project-desktop-custom-select" style={{ minWidth: "120px" }}>
                      <CustomSelect
                        value={customMode}
                        onChange={(e) => setCustomMode(e.target.value)}
                        options={["Online", "Offline", "Hybrid"]}
                        searchable={false}
                      />
                    </div>
                    <div className="project-mobile-native-select">
                      <select
                        className="amr-select"
                        value={customMode}
                        onChange={(e) => setCustomMode(e.target.value)}
                      >
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="amr-input"
                      placeholder="e.g. 4 Weeks"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description / Goal */}
                <div className="amr-field full">
                  <label className="amr-label">Program Description & Goal</label>
                  <textarea
                    className="amr-textarea"
                    rows={2}
                    placeholder="e.g. Direct 1-on-1 mentorship with senior research scholars, weekly personalized milestones, and certificate of completion."
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Message / Note to User */}
          <div className="amr-note-section">
            <label className="amr-note-label">Message / Note to User (Optional):</label>
            <textarea
              className="amr-note-textarea"
              placeholder="e.g. Here, you can get better mentorship tailored to your Economics stream."
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="amr-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-send-rec"
              disabled={!isFormValid || submitting}
            >
              {submitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Admin View Details Modal for Catalog Service ── */}
      {detailsService && (
        <div className="amr-details-modal-overlay" onClick={() => setDetailsService(null)}>
          <div className="amr-details-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admb-head">
              <div>
                <span className="admb-badge">Marketplace Catalog Details</span>
                <h4 className="admb-title">{detailsService.name || detailsService.title}</h4>
              </div>
              <button
                type="button"
                className="admb-close"
                onClick={() => setDetailsService(null)}
              >
                <SvgClose size={14} />
              </button>
            </div>

            <div className="admb-body">
              <div className="admb-grid">
                <div className="admb-grid-item">
                  <span className="lbl">Category / Role</span>
                  <span className="val highlight">{detailsService.category || detailsService.role || "Mentorship"}</span>
                </div>
                <div className="admb-grid-item">
                  <span className="lbl">Provider / Institute</span>
                  <span className="val">{detailsService.provider || detailsService.partner_email || "Accredited Partner"}</span>
                </div>
                <div className="admb-grid-item">
                  <span className="lbl">Delivery Mode</span>
                  <span className="val" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {detailsService.mode || "Online"}
                  </span>
                </div>
                <div className="admb-grid-item">
                  <span className="lbl">Duration</span>
                  <span className="val" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {detailsService.duration || "Self-Paced"}
                  </span>
                </div>
              </div>

              <div className="admb-desc-block">
                <h5 className="admb-sec-lbl">Full Description & Objective</h5>
                <p className="admb-desc-text">
                  {detailsService.goal || detailsService.desc || detailsService.description || "Comprehensive marketplace recommendation tailored for the student's learning step."}
                </p>
              </div>

              <div className="admb-footer">
                <div className="admb-price-box">
                  <span className="lbl">Price</span>
                  <span className="val">
                    {!detailsService.cost || detailsService.cost === "0" || String(detailsService.cost).toLowerCase() === "free"
                      ? "Free"
                      : `₹${Number(String(detailsService.cost).replace(/[^\d]/g, "")).toLocaleString("en-IN")}`}
                  </span>
                </div>

                <div className="admb-actions">
                  <button
                    type="button"
                    className="admb-btn-cancel"
                    onClick={() => setDetailsService(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="admb-btn-select"
                    onClick={() => {
                      setSelectedService(detailsService);
                      setDetailsService(null);
                    }}
                  >
                    <SvgCheck size={14} /> Select This Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== "undefined"
    ? ReactDOM.createPortal(modalElement, document.body)
    : modalElement;
}
