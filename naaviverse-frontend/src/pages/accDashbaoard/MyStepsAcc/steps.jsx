import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { SvgClose } from "../../../utils/SvgIcons";
import "./steps.css";

const renderInBody = (element) => {
  if (typeof document !== "undefined" && document.body) {
    return createPortal(element, document.body);
  }
  return element;
};

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYERS = ["macro", "micro", "nano"];

const EMPTY_LAYER = {
  name: "",
  desc: "",
  duration: { years: "", months: "", days: "" },
  paid: false,
  free: false,
  instructions: "",
  marketplace: [],
};

const EMPTY_STEP = {
  stepName: "",
  macro: { ...EMPTY_LAYER },
  micro: { ...EMPTY_LAYER },
  nano: { ...EMPTY_LAYER },
};

const EMPTY_MARKET_FORM = {
  name: "",
  access: "Free",
  cost: "",
  goal: "",
  outcomes: "",
  iterations: "",
  durationDays: "",
  discount: "",
  features: "",
};

const ROLE_OPTIONS = [
  { value: "", label: "Select Role" },
  { value: "vendor", label: "Vendor" },
  { value: "mentor", label: "Mentor" },
  { value: "institution", label: "Institution" },
  { value: "distributor", label: "Distributor" },
];

const ACCESS_OPTIONS = [
  { value: "Free", label: "Free" },
  { value: "Covered under Subscription", label: "Covered under Subscription" },
  { value: "Paid", label: "Paid" },
  { value: "Not Applicable", label: "Not Applicable" },
];

const ITERATIONS_OPTIONS = [
  { value: "", label: "Select" },
  { value: "1", label: "1" },
  { value: "3", label: "3" },
  { value: "Unlimited", label: "Unlimited" },
  { value: "Not Applicable", label: "Not Applicable" },
];

const DURATION_OPTIONS = [
  { value: "", label: "Select Duration" },
  { value: "1 Day", label: "1 Day" },
  { value: "1 Week", label: "1 Week" },
  { value: "1 Month", label: "1 Month" },
  { value: "Not Applicable", label: "Not Applicable" },
];

const DISCOUNT_OPTIONS = [
  { value: "", label: "Select" },
  { value: "0%", label: "0%" },
  { value: "10%", label: "10%" },
  { value: "20%", label: "20%" },
  { value: "Not Applicable", label: "Not Applicable" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDuration = (val) => {
  if (!val) return { years: "", months: "", days: "" };
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return { years: "", months: "", days: "" };
  }
};

const normalizeStep = (raw) => {
  if (!raw) return JSON.parse(JSON.stringify(EMPTY_STEP));

  const stepName = raw.name || raw.stepName || (raw.step_order ? `Step ${raw.step_order}: ${raw.macro_name || ""}` : raw.macro_name) || "";

  // Already in new shape
  if (raw.macro && typeof raw.macro === "object" && raw.macro.name !== undefined) {
    return {
      stepName,
      macro: { ...EMPTY_LAYER, ...raw.macro, paid: false, free: raw.macro.free !== undefined ? raw.macro.free : true, marketplace: raw.macro.marketplace || [] },
      micro: { ...EMPTY_LAYER, ...raw.micro, marketplace: raw.micro?.marketplace || [] },
      nano: { ...EMPTY_LAYER, ...raw.nano, marketplace: raw.nano?.marketplace || [] },
    };
  }

  // Legacy flat shape
  return {
    stepName,
    macro: {
      ...EMPTY_LAYER,
      name: raw.macro_name || "",
      desc: raw.macro_description || raw.description || "",
      duration: parseDuration(raw.macro_length || raw.length),
      paid: false,
      free: true,
      instructions: raw.macro_instructions || "",
      marketplace: raw.macro_marketplace || [],
    },
    micro: {
      ...EMPTY_LAYER,
      name: raw.micro_name || "",
      desc: raw.micro_description || raw.microDescription || "",
      duration: parseDuration(raw.micro_length),
      paid: raw.micro_access === "paid",
      free: raw.micro_access === "free",
      instructions: raw.micro_instructions || "",
      marketplace: raw.micro_marketplace || [],
    },
    nano: {
      ...EMPTY_LAYER,
      name: raw.nano_name || "",
      desc: raw.nano_description || raw.nanoDescription || "",
      duration: parseDuration(raw.nano_length),
      paid: raw.nano_access === "paid",
      free: raw.nano_access === "free",
      instructions: raw.nano_instructions || "",
      marketplace: raw.nano_marketplace || [],
    },
  };
};

// ─── DurationSelect ───────────────────────────────────────────────────────────

const DurationSelect = ({ value, onChange, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const configs = {
    years:  { label: "Years",  count: 11 },
    months: { label: "Months", count: 12 },
    days:   { label: "Days",   count: 31 },
  };
  const { label, count } = configs[type];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const hasValue = value !== "" && value !== undefined && value !== null;
  const numVal = Number(value);
  const displayLabel = hasValue
    ? `${numVal} ${numVal === 1 ? label.slice(0, -1) : label}`
    : label;

  return (
    <div style={{ flex: 1, minWidth: 90, position: "relative", zIndex: isOpen ? 60 : "auto" }} ref={dropdownRef}>
      <button
        type="button"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "0.45rem 0.65rem",
          borderRadius: 8,
          border: isOpen ? "1px solid #0d6b6e" : "1px solid #d1dce8",
          fontSize: "0.85rem",
          background: "#fff",
          color: hasValue ? "#1e3a4a" : "#64748b",
          cursor: "pointer",
          boxSizing: "border-box",
          boxShadow: isOpen ? "0 0 0 3px rgba(13, 107, 110, 0.1)" : "none",
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayLabel}
        </span>
        <svg
          style={{
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: isOpen ? "#0d6b6e" : "#5a7085",
          }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            minWidth: 100,
            maxHeight: 160,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #dbe5ee",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(10, 28, 42, 0.12)",
            zIndex: 100,
            padding: 4,
          }}
        >
          <div
            style={{
              padding: "6px 8px",
              fontSize: "0.82rem",
              borderRadius: 6,
              cursor: "pointer",
              background: !hasValue ? "#e6f3f4" : "transparent",
              color: !hasValue ? "#0d6b6e" : "#1e3a4a",
              fontWeight: !hasValue ? 600 : 400,
            }}
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            {label}
          </div>
          {[...Array(count)].map((_, i) => {
            const isSelected = hasValue && String(value) === String(i);
            const optText = `${i} ${i === 1 ? label.slice(0, -1) : label}`;
            return (
              <div
                key={i}
                style={{
                  padding: "6px 8px",
                  fontSize: "0.82rem",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isSelected ? "#e6f3f4" : "transparent",
                  color: isSelected ? "#0d6b6e" : "#1e3a4a",
                  fontWeight: isSelected ? 600 : 400,
                }}
                onClick={() => {
                  onChange(String(i));
                  setIsOpen(false);
                }}
              >
                {optText}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ResponsiveSelect = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (options[0]?.label || placeholder);
  const isPlaceholder = !value || (selectedOption && selectedOption.value === "");

  return (
    <div className={`responsive-select-container ${isOpen ? "is-open" : ""}`} ref={wrapperRef}>
      {/* DESKTOP SELECT: Standard select for desktop view */}
      <select
        className="responsive-select-desktop"
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* MOBILE SELECT: Dropdown bounded inside container */}
      <div className={`responsive-select-mobile ${isOpen ? "open" : ""}`}>
        <button
          type="button"
          className={`responsive-select-trigger ${isOpen ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          <span className={`responsive-select-text ${isPlaceholder ? "is-placeholder" : ""}`}>
            {displayLabel}
          </span>
          <svg
            className={`responsive-select-arrow ${isOpen ? "open" : ""}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="responsive-select-menu" onClick={(e) => e.stopPropagation()}>
            {options.map((opt, idx) => {
              const isSelected = String(value) === String(opt.value);
              return (
                <div
                  key={idx}
                  className={`responsive-select-option ${isSelected ? "selected" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MarketplaceItemCard ──────────────────────────────────────────────────────

const MarketplaceItemCard = ({ item, onRemove, onEdit }) => (
  <div className="marketplace-item-card" style={styles.marketCard}>
    <div className="mic-header" style={styles.marketCardHeader}>
      <div className="mic-title-wrap" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span className="mic-title" style={styles.marketCardTitle}>
          {item.name || "Unnamed"}
        </span>
        <span className="mic-role-badge">({item.role || "unknown"})</span>
      </div>
      <div className="mic-actions" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {item.cost ? <span className="mic-cost-badge" style={styles.marketCardCost}>{item.cost}</span> : null}
        {onEdit && (
          <button
            type="button"
            className="mic-edit-btn"
            onClick={(e) => { e.preventDefault(); onEdit(); }}
            style={{
              background: "#e6f3f4",
              border: "1px solid #0d6b6e",
              color: "#0d6b6e",
              borderRadius: "20px",
              padding: "2px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Edit Marketplace Item"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
        {onRemove && (
          <button className="mic-remove-btn" onClick={onRemove} style={styles.removeBtn} title="Remove" aria-label="Remove"><SvgClose size={13} /></button>
        )}
      </div>
    </div>
    <div className="mic-meta-grid" style={styles.marketCardMeta}>
      {item.goal      && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Goal:</strong> </span><span className="mic-meta-value">{item.goal}</span></div>}
      {item.outcomes  && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Outcomes:</strong> </span><span className="mic-meta-value">{item.outcomes}</span></div>}
      {item.access    && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Access:</strong> </span><span className="mic-meta-value">{item.access}</span></div>}
      {item.iterations && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Iterations:</strong> </span><span className="mic-meta-value">{item.iterations}</span></div>}
      {item.duration  && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Duration:</strong> </span><span className="mic-meta-value">{item.duration}</span></div>}
      {item.discount  && <div className="mic-meta-item"><span className="mic-meta-label"><strong>Discount:</strong> </span><span className="mic-meta-value">{item.discount}</span></div>}
    </div>
    {item.features && (
      <div className="mic-features-row" style={styles.marketCardFeatures}><strong className="mic-features-label">Features:</strong> <span className="mic-features-value">{item.features}</span></div>
    )}
  </div>
);

// ─── LayerSection ─────────────────────────────────────────────────────────────

const LayerSection = ({ layerKey, data, onChange, onAddMarketplace, onEditMarketplace }) => {
  const colorMap = { macro: "#0d6b6e", micro: "#3b82f6", nano: "#a855f7" };
  const color = colorMap[layerKey];

  const update = (field, value) => onChange({ ...data, [field]: value });
  const updateDuration = (part, value) =>
    onChange({ ...data, duration: { ...data.duration, [part]: value } });

  const removeMarketplaceItem = (index) => {
    const updated = (data.marketplace || []).filter((_, i) => i !== index);
    onChange({ ...data, marketplace: updated });
  };

  return (
    <div style={{ ...styles.layerSection, borderLeft: `3px solid ${color}` }}>
      <h3 style={{ ...styles.layerTitle, color }}>{layerKey.toUpperCase()}</h3>

      {/* Name */}
      <div style={styles.formGroup}>
        <label style={styles.label}>{layerKey === "macro" ? "Macro View Name" : layerKey === "micro" ? "Micro View Name" : "Nano View Name"}</label>
        <input
          type="text"
          style={styles.input}
          placeholder={`${layerKey.charAt(0).toUpperCase() + layerKey.slice(1)} name...`}
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      {/* Description */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Description</label>
        <textarea
          rows={3}
          style={styles.textarea}
          placeholder="Enter description..."
          value={data.desc}
          onChange={(e) => update("desc", e.target.value)}
        />
      </div>

      {/* Duration */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Duration</label>
        <div style={styles.durationRow}>
          <DurationSelect type="years"  value={data.duration?.years}  onChange={(v) => updateDuration("years", v)} />
          <DurationSelect type="months" value={data.duration?.months} onChange={(v) => updateDuration("months", v)} />
          <DurationSelect type="days"   value={data.duration?.days}   onChange={(v) => updateDuration("days", v)} />
        </div>
        <div style={{ ...styles.checkboxRow, display: "flex", alignItems: "center", gap: "24px", marginTop: "8px" }}>
          {layerKey !== "macro" && (
            <label style={{ ...styles.checkboxLabel, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                style={{ margin: 0, marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
                checked={!!data.paid}
                onChange={(e) => update("paid", e.target.checked)}
              />
              <span>Paid</span>
            </label>
          )}
          <label style={{ ...styles.checkboxLabel, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              style={{ margin: 0, marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
              checked={!!data.free}
              onChange={(e) => update("free", e.target.checked)}
            />
            <span>Free</span>
          </label>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Instructions</label>
        <textarea
          rows={3}
          style={styles.textarea}
          placeholder="Enter instructions..."
          value={data.instructions}
          onChange={(e) => update("instructions", e.target.value)}
        />
      </div>

      {/* Marketplace */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Marketplace Items</label>
        <div style={styles.marketplaceList}>
          {(data.marketplace || []).length === 0 ? (
            <p style={styles.noItems}>No Marketplace Items Added.</p>
          ) : (
            (data.marketplace || []).map((item, i) => (
              <MarketplaceItemCard
                key={i}
                item={item}
                onEdit={() => onEditMarketplace && onEditMarketplace(layerKey, i, item)}
                onRemove={() => removeMarketplaceItem(i)}
              />
            ))
          )}
        </div>
        <button
          style={styles.addMarketBtn}
          onClick={(e) => { e.preventDefault(); onAddMarketplace(layerKey); }}
        >
          + Add Marketplace
        </button>
      </div>
    </div>
  );
};

// ─── MarketplaceModal ─────────────────────────────────────────────────────────

const MarketplaceModal = ({ layerKey, onAdd, onClose, editItem, onSaveEdit }) => {
  const [selectedRole, setSelectedRole] = useState(editItem?.role || editItem?.category || "");
  const [form, setForm] = useState(
    editItem
      ? {
          name: editItem.name || "",
          access: editItem.access || "Free",
          cost: editItem.cost !== undefined && editItem.cost !== null ? String(editItem.cost) : "",
          goal: editItem.goal || "",
          outcomes: editItem.outcomes || "",
          iterations: editItem.iterations || "",
          durationDays: editItem.duration || "",
          discount: editItem.discount || "",
          features: editItem.features || "",
        }
      : EMPTY_MARKET_FORM
  );

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = () => {
    if (!form.name || !selectedRole) return;
    const itemData = {
      role: selectedRole,
      category: selectedRole,
      layer: layerKey,
      name: form.name,
      access: form.access,
      cost: form.cost,
      goal: form.goal,
      outcomes: form.outcomes,
      iterations: form.iterations,
      duration: form.durationDays,
      discount: form.discount,
      features: form.features,
    };
    if (editItem && onSaveEdit) {
      onSaveEdit(itemData);
    } else {
      onAdd(itemData);
    }
  };

  return renderInBody(
    <div
      style={{
        ...styles.modalOverlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.modalContent,
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalContext}>
          {editItem ? "Editing in " : "Adding to "}<strong>{layerKey.charAt(0).toUpperCase() + layerKey.slice(1)}</strong>
        </div>
        <h3 style={styles.modalTitle}>{editItem ? "Edit Marketplace Listing" : "Marketplace Listing"}</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Marketplace Role *</label>
          <ResponsiveSelect
            value={selectedRole}
            onChange={(val) => setSelectedRole(val)}
            options={ROLE_OPTIONS}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Name *</label>
          <input type="text" style={styles.input} placeholder="Marketplace Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Access</label>
          <ResponsiveSelect
            value={form.access}
            onChange={(val) => set("access", val)}
            options={ACCESS_OPTIONS}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Cost</label>
          <input type="text" style={styles.input} placeholder="e.g. 65000, 1500 per hour, Free, NA" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Goal</label>
          <input type="text" style={styles.input} placeholder="Goal" value={form.goal} onChange={(e) => set("goal", e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Outcomes</label>
          <input type="text" style={styles.input} placeholder="Outcome metrics" value={form.outcomes} onChange={(e) => set("outcomes", e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Iterations</label>
          <ResponsiveSelect
            value={form.iterations}
            onChange={(val) => set("iterations", val)}
            options={ITERATIONS_OPTIONS}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Duration</label>
          <ResponsiveSelect
            value={form.durationDays}
            onChange={(val) => set("durationDays", val)}
            options={DURATION_OPTIONS}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Discount</label>
          <ResponsiveSelect
            value={form.discount}
            onChange={(val) => set("discount", val)}
            options={DISCOUNT_OPTIONS}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Features / Description</label>
          <textarea rows={3} style={styles.textarea} placeholder="Features or description" value={form.features} onChange={(e) => set("features", e.target.value)} />
        </div>

        <div style={styles.modalFooter} className="modal-footer">
          <button style={styles.cancelBtn} className="btn-outline modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            style={{ ...styles.saveBtn, opacity: (!form.name || !selectedRole) ? 0.5 : 1 }}
            className="btn-primary modal-save-btn"
            disabled={!form.name || !selectedRole}
            onClick={handleAdd}
          >
            {editItem ? "Update Item" : "Add to Step"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── EditStepForm (main) ──────────────────────────────────────────────────────

const EditStepForm = ({ selectedStep, onSave, onCancel }) => {
  const [formData, setFormData] = useState(JSON.parse(JSON.stringify(EMPTY_STEP)));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [currentLayer, setCurrentLayer] = useState("macro");

  const [editingMarketIndex, setEditingMarketIndex] = useState(null);
  const [editingMarketItem, setEditingMarketItem] = useState(null);

  // ── Prefill from selectedStep ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStep) return;
    setFormData(normalizeStep(selectedStep));
  }, [selectedStep]);

  // ── Layer update ───────────────────────────────────────────────────────────
  const updateLayer = (layerKey, newLayerData) => {
    setFormData((prev) => ({ ...prev, [layerKey]: newLayerData }));
  };

  // ── Marketplace ────────────────────────────────────────────────────────────
  const openMarketplace = (layerKey) => {
    setCurrentLayer(layerKey);
    setEditingMarketIndex(null);
    setEditingMarketItem(null);
    setMarketplaceOpen(true);
  };

  const openEditMarketplace = (layerKey, index, item) => {
    setCurrentLayer(layerKey);
    setEditingMarketIndex(index);
    setEditingMarketItem(item);
    setMarketplaceOpen(true);
  };

  const saveEditMarketplaceItem = (updatedItem) => {
    setFormData((prev) => {
      const list = [...(prev[currentLayer]?.marketplace || [])];
      list[editingMarketIndex] = { ...list[editingMarketIndex], ...updatedItem };
      return {
        ...prev,
        [currentLayer]: {
          ...prev[currentLayer],
          marketplace: list,
        },
      };
    });
    setMarketplaceOpen(false);
    setEditingMarketIndex(null);
    setEditingMarketItem(null);
  };

  const addMarketplaceItem = (newItem) => {
    setFormData((prev) => ({
      ...prev,
      [currentLayer]: {
        ...prev[currentLayer],
        marketplace: [...(prev[currentLayer]?.marketplace || []), newItem],
      },
    }));
    setMarketplaceOpen(false);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedStep?._id) return;
    setLoading(true);
    setMessage("");

    try {
      const partner = JSON.parse(localStorage.getItem("partner"));

      const rawStepName = formData.stepName?.trim();
      const macroName = formData.macro?.name?.trim() || "";
      const stepOrder = selectedStep?.step_order || 1;

      let finalStepName = rawStepName;
      if (!finalStepName) {
        if (macroName) {
          finalStepName = `Step ${stepOrder}: Foundation & ${macroName.replace(/^step\s*\d+\s*:\s*/i, "")}`;
        } else {
          finalStepName = `Step ${stepOrder}: Milestone`;
        }
      } else if (!/^step\s*\d+\s*:/i.test(finalStepName) && stepOrder) {
        finalStepName = `Step ${stepOrder}: ${finalStepName}`;
      }

      const payload = {
        email: partner?.email || "",
        name: finalStepName,

        macro_name:         macroName,
        macro_description:  formData.macro?.desc || "",
        macro_length:       JSON.stringify(formData.macro?.duration || {}),
        macro_access:       "free",
        macro_instructions: formData.macro?.instructions || "",
        macro_marketplace:  formData.macro?.marketplace || [],

        micro_name:         formData.micro?.name || "",
        micro_description:  formData.micro?.desc || "",
        micro_length:       JSON.stringify(formData.micro?.duration || {}),
        micro_access:       formData.micro?.paid ? "paid" : "free",
        micro_instructions: formData.micro?.instructions || "",
        micro_marketplace:  formData.micro?.marketplace || [],

        nano_name:          formData.nano?.name || "",
        nano_description:   formData.nano?.desc || "",
        nano_length:        JSON.stringify(formData.nano?.duration || {}),
        nano_access:        formData.nano?.paid ? "paid" : "free",
        nano_instructions:  formData.nano?.instructions || "",
        nano_marketplace:   formData.nano?.marketplace || [],
      };

      const response = await axios.put(
        `${BASE_URL}/api/steps/update/${selectedStep._id}`,
        payload,
        {
          headers: {
            email: partner?.email,
            token: partner?.token || partner?.idToken,
          },
        }
      );

      if (response.data.status) {
        setMessage("Step updated successfully!");
        setShowSuccess(true);
        onSave(response.data.data);
      } else {
        setMessage(response.data.message || "Failed to update step.");
      }
    } catch (error) {
      console.error(error.response?.data || error);
      setMessage("Failed to update step.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div style={styles.successPage}>
        <p style={styles.successText}>{message}</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {message && !showSuccess && (
        <div style={styles.errorMsg}>{message}</div>
      )}

      {/* Step Details (Step Name) */}
      <div style={{ ...styles.layerSection, borderLeft: "3px solid #0d6b6e" }}>
        <h3 style={{ ...styles.layerTitle, color: "#0d6b6e" }}>STEP DETAILS</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>Step Name <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 400 }}>(Overall Milestone Title — should be different from Macro View Name)</span></label>
          <input
            type="text"
            style={styles.input}
            placeholder="e.g. Step 1: Explore Career Opportunities..."
            value={formData.stepName || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, stepName: e.target.value }))}
          />
        </div>
      </div>

      {LAYERS.map((layerKey) => (
        <LayerSection
          key={layerKey}
          layerKey={layerKey}
          data={formData[layerKey]}
          onChange={(newData) => updateLayer(layerKey, newData)}
          onAddMarketplace={openMarketplace}
          onEditMarketplace={openEditMarketplace}
        />
      ))}

      <div style={styles.buttonRow}>
        <button style={styles.cancelBtn} onClick={onCancel} disabled={loading}>
          Go Back
        </button>
        <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {marketplaceOpen && (
        <MarketplaceModal
          layerKey={currentLayer}
          editItem={editingMarketItem}
          onAdd={addMarketplaceItem}
          onSaveEdit={saveEditMarketplaceItem}
          onClose={() => {
            setMarketplaceOpen(false);
            setEditingMarketIndex(null);
            setEditingMarketItem(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    maxHeight: "80vh",
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  layerSection: {
    background: "#f9fbfd",
    borderRadius: 12,
    padding: "1.25rem",
    border: "1px solid #e2eaf2",
  },
  layerTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: "1rem",
    letterSpacing: "0.08em",
  },
  formGroup: {
    marginBottom: "0.9rem",
  },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#4a5568",
    marginBottom: "0.3rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #d1dce8",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "0.45rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #d1dce8",
    fontSize: "0.85rem",
    lineHeight: "1.35",
    minHeight: 52,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  },
  durationRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  durationSelect: {
    flex: 1,
    minWidth: 90,
    padding: "0.45rem 0.5rem",
    borderRadius: 8,
    border: "1px solid #d1dce8",
    fontSize: "0.85rem",
    background: "#fff",
    cursor: "pointer",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    marginTop: "0.5rem",
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.88rem",
    cursor: "pointer",
    color: "#2d3748",
    userSelect: "none",
  },
  marketplaceList: {
    marginBottom: "0.5rem",
  },
  noItems: {
    fontSize: "0.82rem",
    color: "#a0aec0",
    fontStyle: "italic",
    margin: "0 0 0.4rem 0",
  },
  marketCard: {
    background: "#eef4fb",
    borderRadius: 10,
    padding: "0.7rem 0.9rem",
    marginBottom: "0.4rem",
    border: "1px solid #ccdae5",
    fontSize: "0.83rem",
  },
  marketCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
    marginBottom: "0.25rem",
  },
  marketCardTitle: {
    fontSize: "0.85rem",
  },
  marketCardCost: {
    fontSize: "0.8rem",
    color: "#2c5282",
  },
  marketCardMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1rem",
    color: "#4a5568",
    fontSize: "0.8rem",
  },
  marketCardFeatures: {
    marginTop: "0.3rem",
    fontSize: "0.8rem",
    color: "#4a5568",
  },
  removeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#e53e3e",
    fontSize: "0.85rem",
    padding: "0 0.2rem",
    lineHeight: 1,
  },
  addMarketBtn: {
    background: "none",
    border: "1px dashed #a0aec0",
    borderRadius: 8,
    padding: "0.4rem 0.9rem",
    fontSize: "0.82rem",
    color: "#4a5568",
    cursor: "pointer",
    marginTop: "0.25rem",
  },
  buttonRow: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    paddingTop: "0.5rem",
  },
  cancelBtn: {
    padding: "0.4rem 1.15rem",
    borderRadius: 30,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#2c3e50",
    fontSize: "0.82rem",
    cursor: "pointer",
    fontWeight: 500,
    flex: "0 0 auto",
    width: "auto",
    whiteSpace: "nowrap",
    lineHeight: "1.3",
    margin: 0,
  },
  saveBtn: {
    padding: "0.4rem 1.15rem",
    borderRadius: 30,
    border: "none",
    background: "linear-gradient(90deg, #47b4d5 0%, #29449d 100%)",
    color: "#fff",
    fontSize: "0.82rem",
    cursor: "pointer",
    fontWeight: 600,
    flex: "0 0 auto",
    width: "auto",
    whiteSpace: "nowrap",
    lineHeight: "1.3",
    margin: 0,
  },
  errorMsg: {
    background: "#fff5f5",
    border: "1px solid #fed7d7",
    color: "#c53030",
    borderRadius: 8,
    padding: "0.6rem 1rem",
    fontSize: "0.85rem",
  },
  successPage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  successText: {
    fontSize: "1rem",
    color: "#2f855a",
    fontWeight: 500,
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    background: "#fff",
    borderRadius: 16,
    padding: "1.5rem",
    width: "100%",
    maxWidth: 480,
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalContext: {
    fontSize: "0.8rem",
    color: "#718096",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  modalTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#1a202c",
  },
  modalFooter: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.65rem",
    marginTop: "1.25rem",
    padding: "0.5rem 0 0 0",
    borderTop: "none",
    width: "100%",
  },
};

export default EditStepForm;