import React, { useState, useEffect, useRef } from "react";
import "./Marketplace.scss";
import Skeleton from "react-loading-skeleton";
import closepop from "../../static/images/dashboard/closepop.svg";
import axios from "axios";
import { SvgClose } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ── Premium SVG Icons ─────────────────────────────────────
const IconInstitution = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMentor = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.65"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconVendor = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 0 1-8 0"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDistributor = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 9.4 7.55 4.24M3.29 7 12 12l8.71-5M12 22V12"
      stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 15v6M15 18h6" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/>
  </svg>
);

// ── Config ────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  institution: { color: "#3E7BFA", colorLight: "#EFF6FF", Icon: IconInstitution, label: "Institutions" },
  mentor:      { color: "#059669", colorLight: "#ECFDF5", Icon: IconMentor,      label: "Mentors" },
  vendor:      { color: "#E11D48", colorLight: "#FFF1F2", Icon: IconVendor,      label: "Vendors" },
  distributor: { color: "#D97706", colorLight: "#FFFBEB", Icon: IconDistributor, label: "Distributors" },
};

const LAYER_COLORS = {
  NANO:  { bg: "#EFF6FF", color: "#2563EB" },
  MICRO: { bg: "#ECFDF5", color: "#059669" },
  MACRO: { bg: "#FFFBEB", color: "#D97706" },
};

const getRoleConf   = (role) => CATEGORY_CONFIG[role?.toLowerCase()] || { color: "#94a3b8", colorLight: "#f1f5f9", Icon: () => null, label: "Unknown" };
const formatPrice = (cost) => {
  if (!cost || cost === "0" || cost === 0 || cost === "Free" || cost === "free") return "Free";
  const str = String(cost).trim().replace(/^\$+/, "").trim();
  return str.startsWith("₹") ? str : `₹${str}`;
};
const formatAccess  = (access) => {
  if (!access) return "Free";
  return access.toLowerCase().includes("free") ? "Free" : "Paid";
};

const getBillingInfo = (bc = {}) => {
  if (bc?.monthly?.price  !== undefined) return { price: bc.monthly.price };
  if (bc?.annual?.price   !== undefined) return { price: bc.annual.price };
  if (bc?.lifetime?.price !== undefined) return { price: bc.lifetime.price };
  return { price: 0 };
};

// ── Main Component ────────────────────────────────────────
const Marketplace = ({ search = "", selectedRole = "all", onRoleChange, onSearchChange }) => {
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("institution");
  const [localSearch,    setLocalSearch]    = useState(search || "");
  const searchInputRef = useRef(null);

  const handleClearSearch = () => {
    setLocalSearch("");
    if (onSearchChange) onSearchChange("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [tableKey,       setTableKey]       = useState(0);

  useEffect(() => { fetchMarketplaceItems(); }, []);
  useEffect(() => { setLocalSearch(search); }, [search]);

  const fetchMarketplaceItems = async () => {
    setLoading(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem("partner")) || {};
      const email = userDetails?.email || userDetails?.user?.email;
      if (!email) { setLoading(false); return; }

      const [servicesRes, stepsRes, marketplaceRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/services/getservices`, { params: { productcreatoremail: email } }),
        axios.get(`${BASE_URL}/api/steps/partner`,        { params: { email } }),
        axios.get(`${BASE_URL}/api/marketplace/accountant/get-all`, { params: { partner_email: email } }),
      ]);

      const services = servicesRes.status === "fulfilled" ? servicesRes.value.data?.data || [] : [];
      const serviceItems = services.map((s) => {
        const billing = getBillingInfo(s?.billing_cycle);
        return {
          _id: s._id, role: (s.type || s.serviceProvider || "vendor").toLowerCase(),
          name: s.name || "Unnamed Service", access: s.access || "Free",
          cost: s.cost || billing.price || 0, goal: s.goal || "",
          outcomes: s.outcome || "", iterations: s.iterations?.length || 0,
          duration: s.duration ? `${s.duration} days` : "",
          discount: s.discountType ? `${s.discountAmount}%` : "",
          features: s.features?.join(", ") || s.description || "",
          sourceType: "service", sourceLabel: "My Services",
        };
      });

      const stepItems = [];
      if (stepsRes.status === "fulfilled") {
        const allSteps = stepsRes.value.data?.data || [];
        allSteps.forEach((step) => { step.path_name = step.name || step.macro_name || "Unknown Path"; });
        allSteps.forEach((step, si) => {
          ["macro","micro","nano"].forEach((layer) => {
            const arr = step[`${layer}_marketplace`] || step[layer]?.marketplace || [];
            arr.forEach((item, ii) => {
              if (!item?.name) return;
              stepItems.push({
                _id: `${step._id}-${layer}-${ii}`, name: item.name,
                role: (item.role || "vendor").toLowerCase(), access: item.access || "Free",
                cost: item.cost || "Free", goal: item.goal || "",
                outcomes: item.outcomes || "", iterations: item.iterations || "",
                duration: item.duration || "", discount: item.discount || "",
                features: item.features || "", sourceType: "step",
                sourceLabel: step.macro_name || step.name || `Step ${si+1}`,
                sourceStep:  step.macro_name || step.name || `Step ${si+1}`,
                sourceLayer: layer.toUpperCase(), pathName: step.path_name || "Unknown Path",
              });
            });
          });
        });
      }

      const collectionItems = [];
      if (marketplaceRes.status === "fulfilled") {
        const all = marketplaceRes.value.data?.data || [];
        all.filter((item) => item.partner_email === email).forEach((item) => {
          collectionItems.push({
            _id: item._id, name: item.name || "Unnamed",
            role: (item.role || "vendor").toLowerCase(), access: item.access || "Free",
            cost: item.cost || "Free", goal: item.goal || "",
            outcomes: item.outcomes || "", iterations: item.iterations || "",
            duration: item.duration || "", discount: item.discount || "",
            features: item.features || "", sourceType: "marketplace",
            sourceLabel: "Marketplace Items", pathName: item.path_name,
            stepName: item.step_name, sourceLayer: item.layer?.toUpperCase(),
          });
        });
      }

      const seen = new Set();
      const merged = [];
      [...serviceItems, ...collectionItems, ...stepItems].forEach((item) => {
        const key = `${item.name?.toLowerCase()}-${item.role?.toLowerCase()}`;
        if (!seen.has(key)) { seen.add(key); merged.push(item); }
      });
      setItems(merged);
    } catch (err) {
      console.error("Error fetching marketplace items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (cat) => {
    if (cat === activeCategory) return;
    setTableKey((k) => k + 1);
    setActiveCategory(cat);
    if (onRoleChange) onRoleChange(cat);
  };

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  const categoryCounts = Object.keys(CATEGORY_CONFIG).reduce((acc, cat) => {
    acc[cat] = items.filter((i) => i.role?.toLowerCase() === cat).length;
    return acc;
  }, {});

  const filteredItems = items.filter((item) => {
    const q = localSearch?.toLowerCase();
    return (
      (!q || item.name?.toLowerCase().includes(q) || item.goal?.toLowerCase().includes(q)) &&
      item.role?.toLowerCase() === activeCategory
    );
  });

  const ac = CATEGORY_CONFIG[activeCategory];

  return (
    <div className="mp-root">

      {/* Header */}
      <div className="mp-header">
        <h1 className="mp-header__title">Marketplace</h1>
        {!loading && <span className="mp-header__badge">{items.length} Total Items</span>}
      </div>

      {/* Category Tabs — clean with colored icon circles */}
      <div className="mp-cat-tabs">
        {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => {
          const { Icon } = conf;
          return (
            <div
              key={key}
              className={`mp-cat-tab ${activeCategory === key ? "mp-cat-tab--active" : ""}`}
              style={{ "--cc": conf.color, "--cl": conf.colorLight }}
              onClick={() => handleCategoryClick(key)}
            >
              <span className="mp-cat-tab__icon"><Icon /></span>
              <span className="mp-cat-tab__label">{conf.label}</span>
            </div>
          );
        })}
      </div>

      {/* Table Panel */}
      <div className="mp-panel">
        <div className="mp-panel__bar">
          <div className="mp-panel__bar-left">
            <span className="mp-panel__dot" style={{ background: ac.color }} />
            <span className="mp-panel__title">{ac.label}</span>
          </div>
          <div className="mp-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21L16.65 16.65" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={handleSearchChange}
              className="mp-search__input"
              aria-label="Search marketplace items"
            />
            {localSearch && (
              <button
                type="button"
                className="mp-search__clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
                title="Clear search"
              >
                <SvgClose size={11} color="currentColor" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div className="mp-table-wrap" key={tableKey}>
          {loading ? (
            <div className="mp-skeletons">
              {Array(4).fill(0).map((_, i) => (
                <div className="mp-skel-row" key={i}>
                  <Skeleton circle width={24} height={24} />
                  <Skeleton height={11} width={130} />
                  <Skeleton height={11} width={90} />
                  <Skeleton height={18} width={40} borderRadius={20} />
                  <Skeleton height={22} width={50} borderRadius={6} />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty__icon" style={{ color: ac.color }}><ac.Icon /></div>
              <p className="mp-empty__text">No {ac.label.toLowerCase()} found</p>
            </div>
          ) : (
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Access</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id} className="mp-row" onClick={() => setSelectedItem(item)}>
                    <td className="mp-row__name-td">
                      <span className="mp-row__icon" style={{ background: ac.colorLight, color: ac.color }}>
                        <ac.Icon />
                      </span>
                      <span className="mp-row__name-text">
                        <span className="mp-row__name">{item.name || "Untitled"}</span>
                        {item.goal && <span className="mp-row__goal-sub">{item.goal}</span>}
                      </span>
                    </td>
                    <td>
                      <span className={`mp-access ${formatAccess(item.access) === "Free" ? "mp-access--free" : "mp-access--paid"}`}>
                        {formatAccess(item.access)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mp-view-btn"
                        style={{ "--bc": ac.color, "--bl": ac.colorLight }}
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

      {/* Detail Modal */}
      {selectedItem && (() => {
        const rc  = getRoleConf(selectedItem.role);
        const RcIcon = rc.Icon;
        const layer  = selectedItem.sourceLayer || selectedItem.layer;
        const ls     = LAYER_COLORS[layer] || { bg: "#f1f5f9", color: "#475569" };
        return (
          <div className="mp-overlay" onClick={() => setSelectedItem(null)}>
            <div className="mp-modal" onClick={(e) => e.stopPropagation()}>

              <button className="mp-modal__x" onClick={() => setSelectedItem(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>

              <div className="mp-modal__head" style={{ "--rc": rc.color, "--rl": rc.colorLight }}>
                <div className="mp-modal__avatar"><RcIcon /></div>
                <div className="mp-modal__head-text">
                  <h2 className="mp-modal__name">{selectedItem.name || "Item Details"}</h2>
                  <span className="mp-modal__role-tag" style={{ background: rc.colorLight, color: rc.color }}>
                    {rc.label}
                  </span>
                </div>
              </div>

              <div className="mp-modal__body">
                <div className="mp-chips">
                  <div className="mp-chip">
                    <span className="mp-chip__label">Access</span>
                    <span className="mp-chip__val"
                      style={{ color: formatAccess(selectedItem.access) === "Free" ? "#059669" : "#E11D48" }}>
                      {formatAccess(selectedItem.access)}
                    </span>
                  </div>
                  <div className="mp-chip">
                    <span className="mp-chip__label">Price</span>
                    <span className="mp-chip__val">{formatPrice(selectedItem.cost)}</span>
                  </div>
                  {layer && (
                    <div className="mp-chip">
                      <span className="mp-chip__label">Layer</span>
                      <span className="mp-layer-pill" style={{ background: ls.bg, color: ls.color }}>{layer}</span>
                    </div>
                  )}
                  {selectedItem.duration && (
                    <div className="mp-chip">
                      <span className="mp-chip__label">Duration</span>
                      <span className="mp-chip__val">{selectedItem.duration}</span>
                    </div>
                  )}
                  {selectedItem.discount && (
                    <div className="mp-chip">
                      <span className="mp-chip__label">Discount</span>
                      <span className="mp-chip__val" style={{ color: "#E11D48" }}>{selectedItem.discount}</span>
                    </div>
                  )}
                  {selectedItem.iterations && selectedItem.iterations !== "0" && (
                    <div className="mp-chip">
                      <span className="mp-chip__label">Iterations</span>
                      <span className="mp-chip__val">{selectedItem.iterations}</span>
                    </div>
                  )}
                </div>

                {selectedItem.goal && (
                  <div className="mp-mfield">
                    <span className="mp-mfield__label">Goal</span>
                    <p className="mp-mfield__text">{selectedItem.goal}</p>
                  </div>
                )}
                {selectedItem.outcomes && (
                  <div className="mp-mfield">
                    <span className="mp-mfield__label">Outcomes</span>
                    <p className="mp-mfield__text">{selectedItem.outcomes}</p>
                  </div>
                )}
                {selectedItem.features && (
                  <div className="mp-mfield">
                    <span className="mp-mfield__label">Features</span>
                    <p className="mp-mfield__text">{selectedItem.features}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Marketplace;