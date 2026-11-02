import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./InternalPartners.scss";
import { toast } from "react-toastify";
import { Country } from "country-state-city";
import { getCountryPhoneRules, sanitizePhoneInput, validatePhoneDigits, isPhoneKeyAllowed } from "../../UserProfile/LevelOneModal";
import { validatePersonName, sanitizePostalCode, validatePostalCode } from "../../../utils/emailValidator";
import { SvgClose } from "../../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const CATEGORIES = [
  "All Categories",
  "Education & Learning",
  "Career Guidance",
  "Tech & Software",
  "Mentorship & Coaching",
  "Financial Advisory",
  "Internal Core Team",
];

// 5 pastel avatar families defined in InternalPartners.scss (.fam-0 … .fam-4)
const FAMILY_COUNT = 5;

const InternalPartners = () => {
  // Main State
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [viewMode, setViewMode] = useState("table");

  // Drawer / Modal States
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    partnerName: "",
    organizationName: "",
    contactPerson: "",
    email: "",
    phone: "",
    category: "Career Guidance",
    description: "",
    tempPassword: "",
    mustChangePassword: true,
    accountStatus: "active",
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetPartner, setResetTargetPartner] = useState(null);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // ── Existing country data and calling code options ────────────────────────
  const allCountries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const dialCodeOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    allCountries.forEach((c) => {
      if (c.phonecode) {
        const formattedCode = c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`;
        const key = `${c.isoCode}-${formattedCode}`;
        if (!seen.has(key)) {
          seen.add(key);
          const rules = getCountryPhoneRules(c.isoCode);
          list.push({
            code: formattedCode,
            isoCode: c.isoCode,
            name: c.name,
            flag: c.flag || "",
            lengths: rules.lengths,
            minLength: rules.minLength,
            maxLength: rules.maxLength,
            formatDescription: rules.formatDescription,
            placeholder: rules.placeholder,
          });
        }
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allCountries]);

  const [selectedPhoneIso, setSelectedPhoneIso] = useState("IN");

  const currentPhoneCountry = useMemo(() => {
    return (
      dialCodeOptions.find((c) => c.isoCode === selectedPhoneIso) ||
      dialCodeOptions.find((c) => c.isoCode === "IN") ||
      dialCodeOptions[0] ||
      {
        lengths: [10],
        minLength: 10,
        maxLength: 10,
        formatDescription: "exactly 10 digits",
        placeholder: "9876543210",
        name: "India",
        code: "+91",
        isoCode: "IN",
        flag: "",
      }
    );
  }, [dialCodeOptions, selectedPhoneIso]);

  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const phoneDropdownRef = useRef(null);

  const [modalCategoryOpen, setModalCategoryOpen] = useState(false);
  const modalCategoryRef = useRef(null);

  const [toolbarCategoryOpen, setToolbarCategoryOpen] = useState(false);
  const toolbarCategoryRef = useRef(null);

  const filteredDialCodes = useMemo(() => {
    if (!phoneCodeSearch.trim()) return dialCodeOptions;
    const q = phoneCodeSearch.toLowerCase();
    return dialCodeOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.code.includes(q) ||
        opt.isoCode.toLowerCase().includes(q)
    );
  }, [dialCodeOptions, phoneCodeSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target)) {
        setPhoneCodeDropdownOpen(false);
        setPhoneCodeSearch("");
      }
      if (modalCategoryRef.current && !modalCategoryRef.current.contains(e.target)) {
        setModalCategoryOpen(false);
      }
      if (toolbarCategoryRef.current && !toolbarCategoryRef.current.contains(e.target)) {
        setToolbarCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPhoneCodeDropdownOpen(false);
        setPhoneCodeSearch("");
        setModalCategoryOpen(false);
        setToolbarCategoryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Synchronize calling code when Country input changes
  useEffect(() => {
    if (formData.country) {
      const clean = formData.country.trim().toLowerCase();
      const match = dialCodeOptions.find(
        (c) => c.name.toLowerCase() === clean || c.isoCode.toLowerCase() === clean
      );
      if (match && match.isoCode !== selectedPhoneIso) {
        setSelectedPhoneIso(match.isoCode);
        setFormData((prev) => ({
          ...prev,
          phone: (prev.phone || "").slice(0, match.maxLength),
        }));
      }
    }
  }, [formData.country, dialCodeOptions, selectedPhoneIso]);

  const handlePhoneCountryChange = (isoCode) => {
    setSelectedPhoneIso(isoCode);
    const countryObj = dialCodeOptions.find((c) => c.isoCode === isoCode);
    if (countryObj) {
      setFormData((prev) => ({
        ...prev,
        phone: sanitizePhoneInput(prev.phone || "", countryObj.maxLength),
      }));
    }
  };

  const handlePartnerPhoneChange = (val) => {
    const max = currentPhoneCountry.maxLength;
    setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(val, max) }));
  };

  const handlePhoneKeyDown = (e) => {
    if (!isPhoneKeyAllowed(e, formData.phone, currentPhoneCountry.maxLength)) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
    const max = currentPhoneCountry.maxLength;
    const target = e.target;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const current = formData.phone || "";
    const merged = current.slice(0, start) + pasted + current.slice(end);
    setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(merged, max) }));
  };

  // Fetch partners from real backend
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/partner/internal/all`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setPartners(res.data.data);
      } else {
        setPartners([]);
      }
    } catch (err) {
      console.warn("Failed to fetch internal partners from backend:", err.message);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      const updated = partners.find((p) => p.id === selectedPartner.id);
      if (updated) {
        setSelectedPartner(updated);
      }
    }
  }, [partners]);

  /* ---------------- HELPERS ---------------- */
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Stable pastel family per partner, based on position in the full list
  // (so a given partner keeps the same color across searches/filters/views).
  const getFamilyClass = (partnerId) => {
    const idx = partners.findIndex((x) => x.id === partnerId);
    const safeIdx = idx >= 0 ? idx : 0;
    return `fam-${safeIdx % FAMILY_COUNT}`;
  };

  // Phone numbers sometimes arrive under different keys depending on the
  // source (manual create vs imported record) — check the common variants
  // before falling back to an em dash.
  const getPhoneValue = (partner) =>
    partner?.phone || partner?.phoneNumber || partner?.mobile || partner?.contactNumber || "—";

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedPhoneIso("IN");
    setFormData({
      id: "",
      partnerName: "",
      // organizationName: "Naaviverse Internal",
      contactPerson: "",
      lastName: "",
      email: "",
      phone: "",
      category: "Education & Learning",
      website: "",
      yourPosition: "Internal Partner Manager",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      description: "",
      tempPassword: generateStrongPassword(),
      mustChangePassword: true,
      accountStatus: "active",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (partner, e) => {
    e?.stopPropagation();
    setIsEditing(true);

    let rawPhone = getPhoneValue(partner) === "—" ? "" : getPhoneValue(partner);
    let matchedIso = "IN";
    if (partner.country) {
      const cleanC = partner.country.trim().toLowerCase();
      const match = dialCodeOptions.find(
        (c) => c.name.toLowerCase() === cleanC || c.isoCode.toLowerCase() === cleanC
      );
      if (match) matchedIso = match.isoCode;
    }
    if (rawPhone.startsWith("+")) {
      const matchDial = dialCodeOptions.find((d) => rawPhone.startsWith(d.code));
      if (matchDial) {
        matchedIso = matchDial.isoCode;
        rawPhone = rawPhone.slice(matchDial.code.length).trim();
      }
    }
    setSelectedPhoneIso(matchedIso);
    const cleanDigits = rawPhone.replace(/\D/g, "");

    setFormData({
      id: partner.id,
      partnerName: partner.partnerName,
      organizationName: partner.organizationName,
      contactPerson: partner.contactPerson || partner.firstName || "",
      lastName: partner.lastName || "",
      email: partner.email,
      phone: cleanDigits,
      category: partner.category,
      website: partner.website || "",
      yourPosition: partner.yourPosition || "",
      street: partner.street || "",
      city: partner.city || "",
      state: partner.state || "",
      pincode: partner.pincode || "",
      country: partner.country || "India",
      description: partner.description,
      tempPassword: "",
      mustChangePassword: partner.mustChangePassword,
      accountStatus: partner.accountStatus,
    });
    setIsFormModalOpen(true);
  };

  const internalPostalTimerRef = useRef(null);

  const cleanInternalPostalPlace = (raw) => {
    if (!raw) return "";
    return raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ā/g, "a")
      .replace(/Ā/g, "A")
      .replace(/\s+[HSB]\s*\.?O\.?$/i, "")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*(City|GPO|North|South|East|West|Central)$/gi, "")
      .trim();
  };

  const lookupInternalPartnerPostal = async (code, countryName) => {
    const trimmed = (code || "").trim();
    if (!trimmed || trimmed.length < 3) return;

    try {
      const activeCountry = countryName || formData.country || "India";
      const isIndia = activeCountry.toLowerCase() === "india" || /^\d{6}$/.test(trimmed);
      const iso = isIndia ? "in" : "us";

      const tasks = [
        fetch(`https://api.zippopotam.us/${iso}/${encodeURIComponent(trimmed)}`, { signal: AbortSignal.timeout(8000) })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.places && d.places.length > 0) {
              const p = d.places[0];
              const c = cleanInternalPostalPlace(p["place name"]);
              if (c) return { city: c, state: p["state"] || "", country: d.country || activeCountry };
            }
            throw new Error("No place");
          }),
      ];

      if (isIndia && /^\d{6}$/.test(trimmed)) {
        tasks.push(
          fetch(`https://api.postalpincode.in/pincode/${trimmed}`, { signal: AbortSignal.timeout(8000) })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              const res = d && d[0];
              if (res && res.Status === "Success" && res.PostOffice?.length > 0) {
                const po = res.PostOffice[0];
                const cleanBlock = (po.Block || "").replace(/\s*\(Urban\)/i, "").replace(/\s*\(Rural\)/i, "").trim();
                const cleanDiv = (po.Division || "").replace(/\s*(City|GPO|North|South|East|West|Central)/gi, "").trim();
                let extractedCity = "";
                if (cleanDiv && cleanDiv !== po.District && !po.District.toLowerCase().includes(cleanDiv.toLowerCase())) {
                  extractedCity = cleanDiv;
                } else if (cleanBlock && cleanBlock !== po.District && cleanBlock !== "Shaikpet" && !po.District.toLowerCase().includes(cleanBlock.toLowerCase())) {
                  extractedCity = cleanBlock;
                } else {
                  extractedCity = po.District || po.Division || po.Name || "";
                }
                const c = cleanInternalPostalPlace(extractedCity);
                if (c) return { city: c, state: po.State || "", country: po.Country || "India" };
              }
              throw new Error("No PO");
            })
        );
      }

      const res = await Promise.any(tasks);
      if (res) {
        setFormData((prev) => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state,
          country: prev.country || res.country,
        }));
      }
    } catch (e) {}
  };

  const handlePincodeChange = (val) => {
    const sanitized = sanitizePostalCode(val);
    setFormData((prev) => ({ ...prev, pincode: sanitized }));
    clearTimeout(internalPostalTimerRef.current);
    const trimmed = sanitized.trim();
    if (trimmed.length >= 3) {
      internalPostalTimerRef.current = setTimeout(() => {
        lookupInternalPartnerPostal(trimmed, formData.country);
      }, 250);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.partnerName || !formData.email || !formData.contactPerson) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    const contactVal = validatePersonName(formData.contactPerson, "First name");
    if (!contactVal.isValid) {
      toast.error(contactVal.message);
      return;
    }

    if (formData.lastName && formData.lastName.trim()) {
      const lastVal = validatePersonName(formData.lastName, "Last name");
      if (!lastVal.isValid) {
        toast.error(lastVal.message);
        return;
      }
    }

    if (formData.pincode && formData.pincode.trim()) {
      const pinVal = validatePostalCode(formData.pincode, false, "Pincode");
      if (!pinVal.isValid) {
        toast.error(pinVal.message);
        return;
      }
    }

    if (formData.phone) {
      const phoneVal = validatePhoneDigits(formData.phone, currentPhoneCountry, currentPhoneCountry.name, true);
      if (!phoneVal.isValid) {
        toast.error(phoneVal.message);
        return;
      }
    }

    const formattedPhone = formData.phone
      ? (formData.phone.startsWith("+") ? formData.phone : `${currentPhoneCountry.code} ${formData.phone}`)
      : "";

    const payload = {
      ...formData,
      phone: formattedPhone,
      phoneNumber: formattedPhone,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const res = await axios.put(`${BASE_URL}/api/partner/internal/update/${formData.id}`, payload);
        if (res.data && res.data.success) {
          toast.success(`Partner "${formData.partnerName}" updated!`);
          if (selectedPartner && selectedPartner.id === formData.id) {
            setSelectedPartner((prev) => ({
              ...prev,
              ...(res.data.data || {}),
              phone: formattedPhone || res.data.data?.phone || prev.phone,
              phoneNumber: formattedPhone || res.data.data?.phoneNumber || prev.phoneNumber,
            }));
          }
          fetchPartners();
          setIsFormModalOpen(false);
        } else {
          toast.error(res.data?.message || "Failed to update partner");
        }
      } else {
        const res = await axios.post(`${BASE_URL}/api/partner/internal/create`, payload);
        if (res.data && res.data.success) {
          toast.success(`Internal Partner "${formData.partnerName}" created successfully!`);
          fetchPartners();
          setIsFormModalOpen(false);
        } else {
          toast.error(res.data?.message || "Failed to create partner");
        }
      }
    } catch (err) {
      console.error("API error submitting form:", err);
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (partner, e) => {
    e?.stopPropagation();
    try {
      const res = await axios.patch(`${BASE_URL}/api/partner/internal/status/${partner.id}`);
      if (res.data && res.data.success) {
        toast.info(`Partner "${partner.partnerName}" is now ${res.data.accountStatus}`);
        if (selectedPartner && selectedPartner.id === partner.id) {
          setSelectedPartner((prev) => ({ ...prev, accountStatus: res.data.accountStatus }));
        }
        fetchPartners();
      }
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.error("Failed to update partner status");
    }
  };

  const handleOpenResetModal = (partner, e) => {
    e?.stopPropagation();
    setResetTargetPartner(partner);
    setNewTempPassword(generateStrongPassword());
    setIsResetModalOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (isResetSubmitting) return;
    if (!newTempPassword) {
      toast.error("Password cannot be blank.");
      return;
    }
    if (!resetTargetPartner) return;
    try {
      setIsResetSubmitting(true);
      const res = await axios.post(`${BASE_URL}/api/partner/internal/reset-password`, {
        partnerId: resetTargetPartner.id || resetTargetPartner.email,
        newTempPassword,
      });
      if (res.data && res.data.success) {
        toast.success(`Password reset for ${resetTargetPartner.partnerName || resetTargetPartner.email}`);
        setIsResetModalOpen(false);
        fetchPartners();
      } else {
        toast.error(res.data?.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!resetTargetPartner) return;
    const textToCopy = `Email: ${resetTargetPartner.email}\nTemp Pass: ${newTempPassword}\nLogin: https://naaviverse.com/partner/login`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Credentials copied!");
  };

  const handleViewDetails = (partner) => {
    setSelectedPartner(partner);
    setDetailTab("overview");
    setIsDetailDrawerOpen(true);
  };

  /* ---------------- COMPUTED ---------------- */
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch =
        p.partnerName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        p.organizationName.toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = p.accountStatus === "active";
      if (statusFilter === "inactive") matchesStatus = p.accountStatus === "inactive";
      if (statusFilter === "tempPass") matchesStatus = p.mustChangePassword === true;

      let matchesCategory = true;
      if (categoryFilter !== "All Categories") {
        matchesCategory = p.category === categoryFilter;
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [partners, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter((p) => p.accountStatus === "active").length;
    const inactive = partners.filter((p) => p.accountStatus === "inactive").length;
    const tempPassCount = partners.filter((p) => p.mustChangePassword).length;
    return { total, active, inactive, tempPassCount };
  }, [partners]);

  const getInitials = (name) => {
    if (!name) return "IP";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="internal-partners-minimal">
      {/* ── COMPACT HEADER ── */}
      <div className="ip-top-bar">
        <div className="ip-header-info">
          <div className="title-row">
            <h2>Internal Partners</h2>
          </div>
          <p className="sub-title">Manage internal Naaviverse partners, accounts & direct revenue offerings.</p>
        </div>

        <button className="ip-btn-primary" onClick={handleOpenCreateModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create Partner</span>
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="ip-compact-toolbar">
        <div className="ip-search-inline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search partner, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")} aria-label="Clear search">
              <SvgClose size={14} />
            </button>
          )}
        </div>

        <div className="ip-category-dropdown" ref={toolbarCategoryRef}>
          <div
            className={`ip-category-trigger ${toolbarCategoryOpen ? "open" : ""}`}
            onClick={() => setToolbarCategoryOpen((prev) => !prev)}
            title={categoryFilter}
          >
            <span className="cat-label">{categoryFilter}</span>
            <span className={`cat-arrow ${toolbarCategoryOpen ? "open" : ""}`}>▼</span>
          </div>

          {toolbarCategoryOpen && (
            <div className="ip-category-menu" onClick={(e) => e.stopPropagation()}>
              {CATEGORIES.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <div
                    key={cat}
                    className={`ip-category-item ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setToolbarCategoryOpen(false);
                    }}
                    title={cat}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ip-segment-pills">
          <button className={`seg-btn ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>All</button>
          <button className={`seg-btn ${statusFilter === "active" ? "active" : ""}`} onClick={() => setStatusFilter("active")}>Active</button>
          <button className={`seg-btn ${statusFilter === "inactive" ? "active" : ""}`} onClick={() => setStatusFilter("inactive")}>Inactive</button>
          <button className={`seg-btn ${statusFilter === "tempPass" ? "active" : ""}`} onClick={() => setStatusFilter("tempPass")}>Temp</button>
        </div>

        <div className="ip-view-switch">
          <button className={`v-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="List view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button className={`v-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── TABLE / GRID ── */}
      {filteredPartners.length === 0 ? (
        <div className="ip-empty-compact">
          <p>No partners match the selected filter criteria.</p>
          <button className="ip-btn-text" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("All Categories"); }}>
            Clear filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="ip-table-card">
          <table className="ip-slim-table">
            <thead>
              <tr>
                <th className="th-partner">Partner Account</th>
                <th className="th-category">Category</th>
                <th className="th-contact">Contact</th>
                <th className="th-status">Status</th>
                {/* <th>Security</th> */}
                <th className="th-offerings">Offerings</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((p) => (
                <tr key={p.id} className={getFamilyClass(p.id)} onClick={() => handleViewDetails(p)}>
                  <td className="td-partner">
                    <div className="partner-compact-cell">
                      <div className="avatar-sm">{getInitials(p.partnerName)}</div>
                      <span className="p-title">{p.partnerName}</span>
                    </div>
                  </td>

                  <td className="td-category">
                    <span className="chip-cat">{p.category}</span>
                  </td>

                  <td className="td-contact">
                    <div className="contact-compact">
                      <span className="c-person">{p.contactPerson}</span>
                      <span className="c-email">{p.email}</span>
                    </div>
                  </td>

                  <td className="td-status">
                    <span className={`badge-status ${p.accountStatus}`}>
                      <span className="dot"></span>
                      {p.accountStatus === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* <td>
                    {p.mustChangePassword ? (
                      <span className="chip-sec temp">Temp pass</span>
                    ) : (
                      <span className="chip-sec ok">Secured</span>
                    )}
                  </td> */}

                  <td className="td-offerings">
                    <div className="offering-compact">
                      <span className="o-num">{p.totalOfferings} items</span>
                      <span className="o-rev">{p.totalRevenue}</span>
                    </div>
                  </td>

                  <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="actions-inline">
                      <button className="act-btn view-btn" title="View partner details" onClick={() => handleViewDetails(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      <button className="act-btn edit-btn" title="Edit partner" onClick={(e) => handleOpenEditModal(p, e)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button className="act-btn key-btn" title="Reset password" onClick={(e) => handleOpenResetModal(p, e)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                      </button>

                      <button
                        className={`act-btn status-btn ${p.accountStatus}`}
                        title={p.accountStatus === "active" ? "Deactivate partner" : "Activate partner"}
                        onClick={(e) => handleToggleStatus(p, e)}
                      >
                        {p.accountStatus === "active" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ip-grid-compact">
          {filteredPartners.map((p) => (
            <div key={p.id} className={`grid-item-card ${getFamilyClass(p.id)}`} onClick={() => handleViewDetails(p)}>
              <div className="g-top">
                <div className="avatar-sm">{getInitials(p.partnerName)}</div>
                <span className={`badge-status ${p.accountStatus}`}>
                  <span className="dot"></span>
                  {p.accountStatus === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <h4 className="g-title">{p.partnerName}</h4>
              <p className="g-sub">{p.contactPerson}</p>

              <div className="g-mid">
                <span className="chip-cat">{p.category}</span>
                <span className="g-rev">{p.totalRevenue}</span>
              </div>

              <div className="g-footer" onClick={(e) => e.stopPropagation()}>
                <span className="g-email">{p.email}</span>
                <div className="g-actions">
                  <button className="icon-sm-btn" title="View" onClick={() => handleViewDetails(p)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button className="icon-sm-btn" title="Edit" onClick={(e) => handleOpenEditModal(p, e)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="icon-sm-btn amber-hover" title="Reset password" onClick={(e) => handleOpenResetModal(p, e)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {isFormModalOpen && (
        <div className="ip-modal-backdrop" onClick={() => !isSubmitting && setIsFormModalOpen(false)}>
          <div className="ip-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="m-header">
              <div>
                <h3>{isEditing ? "Edit Internal Partner" : "Create Internal Partner"}</h3>
                <p className="m-sub">Directly provision internal partner credentials & assignment</p>
              </div>
              <button
                className="m-close"
                disabled={isSubmitting}
                onClick={() => !isSubmitting && setIsFormModalOpen(false)}
                aria-label="Close modal"
              >
                <SvgClose size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="m-form">
              <div className="m-form-scroll">
                <div className="m-row">
                  <div className="m-field">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Naavi Career Pathways"
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    />
                  </div>
                  <div className="m-field">
                    <label>Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Naaviverse Education Pvt Ltd"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="m-row">
                  <div className="m-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aris"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                    {formData.contactPerson && !validatePersonName(formData.contactPerson, "First name").isValid && (
                      <span style={{ fontSize: "11px", color: "#dc2626", marginTop: "3px" }}>
                        {validatePersonName(formData.contactPerson, "First name").message}
                      </span>
                    )}
                  </div>
                  <div className="m-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vance"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    {formData.lastName && !validatePersonName(formData.lastName, "Last name").isValid && (
                      <span style={{ fontSize: "11px", color: "#dc2626", marginTop: "3px" }}>
                        {validatePersonName(formData.lastName, "Last name").message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="m-row">
                  <div className="m-field" style={{ position: "relative" }} ref={modalCategoryRef}>
                    <label>Category *</label>
                    <div
                      onClick={() => setModalCategoryOpen((prev) => !prev)}
                      style={{
                        height: "34px",
                        border: modalCategoryOpen ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fafbfe",
                        borderRadius: "7px",
                        padding: "0 10px",
                        fontSize: "0.78rem",
                        color: "var(--ink)",
                        fontFamily: "'Poppins', sans-serif",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        userSelect: "none",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease",
                      }}
                      title={formData.category}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formData.category || "Select Category"}
                      </span>
                      <span
                        style={{
                          fontSize: "8px",
                          color: "var(--ink-faint)",
                          transform: modalCategoryOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.15s ease",
                          flexShrink: 0,
                          marginLeft: "6px",
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {/* Modal Category Dropdown Menu: EXACT TOP BOX SIZE ONLY, STRICTLY DOWNWARDS */}
                    {modalCategoryOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          width: "100%",
                          minWidth: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          background: "#ffffff",
                          border: "1px solid #c7bffb",
                          borderRadius: "8px",
                          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.14)",
                          zIndex: 9999,
                          overflow: "hidden",
                          padding: "4px 0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CATEGORIES.filter((c) => c !== "All Categories").map((cat) => {
                          const isSelected = formData.category === cat;
                          return (
                            <div
                              key={cat}
                              onClick={() => {
                                setFormData({ ...formData, category: cat });
                                setModalCategoryOpen(false);
                              }}
                              style={{
                                padding: "7px 10px",
                                fontSize: "0.76rem",
                                fontFamily: "'Poppins', sans-serif",
                                color: isSelected ? "#ffffff" : "var(--ink)",
                                background: isSelected ? "var(--accent)" : "transparent",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                transition: "background 0.1s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "#f4f3ff";
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "transparent";
                              }}
                              title={cat}
                            >
                              {cat}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="m-field">
                    <label>Position / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Officer"
                      value={formData.yourPosition}
                      onChange={(e) => setFormData({ ...formData, yourPosition: e.target.value })}
                    />
                  </div>
                </div>

                <div className="m-row">
                  <div className="m-field">
                    <label>Login Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="career.internal@naaviverse.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="m-field">
                    <label>Phone Number</label>
                    <div
                      ref={phoneDropdownRef}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: phoneCodeDropdownOpen ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fafbfe",
                        borderRadius: "7px",
                        height: "34px",
                        padding: "0 10px",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease",
                        position: "relative",
                      }}
                      className="ip-phone-input-group"
                    >
                      {/* Country Calling Code & Flag trigger */}
                      <div
                        onClick={() => setPhoneCodeDropdownOpen((prev) => !prev)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          position: "relative",
                          paddingRight: "8px",
                          borderRight: "1px solid #d8dae6",
                          cursor: "pointer",
                          flexShrink: 0,
                          height: "100%",
                          userSelect: "none",
                        }}
                        title="Click to select country calling code"
                      >
                        <img
                          src={`https://flagcdn.com/w40/${currentPhoneCountry.isoCode.toLowerCase()}.png`}
                          alt={currentPhoneCountry.name}
                          style={{
                            width: "18px",
                            height: "12px",
                            objectFit: "cover",
                            borderRadius: "2px",
                            boxShadow: "0 0 1px rgba(0,0,0,0.3)",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
                          {currentPhoneCountry.code}
                        </span>
                        <span
                          style={{
                            fontSize: "8px",
                            color: "var(--ink-faint)",
                            display: "inline-block",
                            transform: phoneCodeDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          ▼
                        </span>
                      </div>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phone}
                        maxLength={currentPhoneCountry.maxLength + 8}
                        onChange={(e) => handlePartnerPhoneChange(e.target.value)}
                        onKeyDown={handlePhoneKeyDown}
                        onPaste={handlePhonePaste}
                        className="ip-phone-input"
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: "0.78rem",
                          fontWeight: "500",
                          color: "var(--ink)",
                          flex: 1,
                          width: "100%",
                          height: "100%",
                          padding: "0 0 0 8px",
                          boxSizing: "border-box",
                          boxShadow: "none",
                        }}
                      />

                      {/* Phone Code Dropdown Menu: EXACT TOP BOX SIZE ONLY, STRICTLY DOWNWARDS */}
                      {phoneCodeDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            width: "100%",
                            minWidth: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                            background: "#ffffff",
                            border: "1px solid #c7bffb",
                            borderRadius: "8px",
                            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.14)",
                            zIndex: 9999,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Search wrap */}
                          <div
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #edf0f7",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "#fafbfe",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                              type="text"
                              placeholder="Search country or code..."
                              value={phoneCodeSearch}
                              onChange={(e) => setPhoneCodeSearch(e.target.value)}
                              autoFocus
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "11.5px",
                                fontFamily: "'Poppins', sans-serif",
                                color: "var(--ink)",
                                height: "22px",
                                padding: 0,
                              }}
                            />
                            {phoneCodeSearch && (
                              <span
                                onClick={() => setPhoneCodeSearch("")}
                                style={{ cursor: "pointer", fontSize: "11px", color: "#94a3b8" }}
                              >
                                ✕
                              </span>
                            )}
                          </div>

                          {/* Code List */}
                          <div
                            style={{
                              maxHeight: "160px",
                              overflowY: "auto",
                              overflowX: "hidden",
                              padding: "3px 0",
                            }}
                          >
                            {filteredDialCodes.length === 0 ? (
                              <div style={{ padding: "8px 10px", fontSize: "11.5px", color: "#94a3b8", textAlign: "center" }}>
                                No codes found
                              </div>
                            ) : (
                              filteredDialCodes.map((opt) => {
                                const isSelected = opt.isoCode === selectedPhoneIso;
                                return (
                                  <div
                                    key={`${opt.isoCode}-${opt.code}`}
                                    onClick={() => {
                                      handlePhoneCountryChange(opt.isoCode);
                                      setPhoneCodeDropdownOpen(false);
                                      setPhoneCodeSearch("");
                                    }}
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "11.5px",
                                      fontFamily: "'Poppins', sans-serif",
                                      color: isSelected ? "#ffffff" : "var(--ink)",
                                      background: isSelected ? "var(--accent)" : "transparent",
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "6px",
                                      transition: "background 0.1s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = "#f4f3ff";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = "transparent";
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      <img
                                        src={`https://flagcdn.com/w40/${opt.isoCode.toLowerCase()}.png`}
                                        alt={opt.name}
                                        style={{
                                          width: "16px",
                                          height: "11px",
                                          objectFit: "cover",
                                          borderRadius: "2px",
                                          flexShrink: 0,
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {opt.name}
                                      </span>
                                    </div>
                                    <span style={{ fontWeight: "600", fontSize: "11px", color: isSelected ? "#ffffff" : "var(--ink-soft)", flexShrink: 0 }}>
                                      {opt.code}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="m-row">
                  <div className="m-field">
                    <label>Website URL</label>
                    <input
                      type="url"
                      placeholder="https://naaviverse.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div className="m-field">
                    <label>Country</label>
                    <input
                      type="text"
                      placeholder="India"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="m-row">
                  <div className="m-field">
                    <label>Street Address</label>
                    <input
                      type="text"
                      placeholder="Street, Landmark..."
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    />
                  </div>
                  <div className="m-field">
                    <label>City / State / Pincode</label>
                    <div className="m-input-triplet">
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="Pincode"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={() => lookupInternalPartnerPostal(formData.pincode, formData.country)}
                      />
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className="m-field">
                    <label>Temporary Password *</label>
                    <div className="pass-inline-group">
                      <input
                        type={showPasswordText ? "text" : "password"}
                        required
                        value={formData.tempPassword}
                        onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                      />
                      <button type="button" className="btn-opt" onClick={() => setShowPasswordText(!showPasswordText)}>
                        {showPasswordText ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="btn-opt highlight"
                        onClick={() => setFormData({ ...formData, tempPassword: generateStrongPassword() })}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}

                <div className="m-field">
                  <label>Description / Scope</label>
                  <textarea
                    rows="2"
                    placeholder="Responsibilities or offerings scope..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="m-check-row">
                  <label className="m-check">
                    <input
                      type="checkbox"
                      checked={formData.mustChangePassword}
                      onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                    />
                    <span>Require password change on first login</span>
                  </label>
                </div>
              </div>

              <div className="m-actions">
                <button
                  type="button"
                  className="ip-btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`ip-btn-primary ${isSubmitting ? "loading" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="ip-btn-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span>{isEditing ? "Saving Changes..." : "Creating Partner..."}</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Save Changes" : "Create Partner"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {isResetModalOpen && resetTargetPartner && (
        <div
          className="ip-modal-backdrop"
          onClick={() => !isResetSubmitting && setIsResetModalOpen(false)}
        >
          <div className="ip-modal-box reset" onClick={(e) => e.stopPropagation()}>
            <div className="m-header">
              <div>
                <h3>Reset Password</h3>
                <p className="m-sub">Issue new temporary access credentials</p>
              </div>
              <button
                className="m-close"
                disabled={isResetSubmitting}
                onClick={() => !isResetSubmitting && setIsResetModalOpen(false)}
                aria-label="Close modal"
              >
                <SvgClose size={18} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmPasswordReset(); }}>
              <div className="m-body">
                <p className="reset-desc">
                  Target account: <strong>{resetTargetPartner.email}</strong>
                </p>

                <div className="m-field">
                  <label>New Temporary Password</label>
                  <div className="pass-inline-group">
                    <input
                      type={showPasswordText ? "text" : "password"}
                      value={newTempPassword}
                      disabled={isResetSubmitting}
                      onChange={(e) => setNewTempPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-opt highlight"
                      disabled={isResetSubmitting}
                      onClick={() => setNewTempPassword(generateStrongPassword())}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="copy-snippet-box">
                  <div className="snippet-top">
                    <span>Credentials Snippet</span>
                    <button
                      type="button"
                      className="btn-copy"
                      disabled={isResetSubmitting}
                      onClick={handleCopyCredentials}
                    >
                      Copy
                    </button>
                  </div>
                  <code>{`Email: ${resetTargetPartner.email}\nPass: ${newTempPassword}`}</code>
                </div>
              </div>

              <div className="m-actions">
                <button
                  type="button"
                  className="ip-btn-secondary"
                  disabled={isResetSubmitting}
                  onClick={() => !isResetSubmitting && setIsResetModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`ip-btn-primary ${isResetSubmitting ? "loading" : ""}`}
                  disabled={isResetSubmitting}
                >
                  {isResetSubmitting ? (
                    <>
                      <svg className="ip-btn-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Confirm Reset</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER ── */}
      {isDetailDrawerOpen && selectedPartner && (
        <>
          <div className="ip-drawer-mask" onClick={() => setIsDetailDrawerOpen(false)} />
          <div className={`ip-drawer-clean ${getFamilyClass(selectedPartner.id)}`}>
            <div className="d-head">
              <div className="d-user">
                <div className="avatar-sm">{getInitials(selectedPartner.partnerName)}</div>
                <div>
                  <h3>{selectedPartner.partnerName}</h3>
                  <span className="d-sub">{selectedPartner.organizationName}</span>
                </div>
              </div>
              <button className="m-close" onClick={() => setIsDetailDrawerOpen(false)} aria-label="Close drawer">
                <SvgClose size={18} />
              </button>
            </div>

            <div className="d-nav">
              <button className={`d-link ${detailTab === "overview" ? "active" : ""}`} onClick={() => setDetailTab("overview")}>Overview</button>
              <button className={`d-link ${detailTab === "security" ? "active" : ""}`} onClick={() => setDetailTab("security")}>Security</button>
              <button className={`d-link ${detailTab === "offerings" ? "active" : ""}`} onClick={() => setDetailTab("offerings")}>Offerings</button>
            </div>

            <div className="d-content">
              {detailTab === "overview" && (
                <div className="d-grid-info">
                  <div className="d-cell"><span className="lbl">Contact</span><span className="val">{selectedPartner.contactPerson}</span></div>
                  <div className="d-cell"><span className="lbl">Email</span><span className="val">{selectedPartner.email}</span></div>
                  <div className="d-cell"><span className="lbl">Phone</span><span className="val">{getPhoneValue(selectedPartner)}</span></div>
                  <div className="d-cell"><span className="lbl">Category</span><span className="val">{selectedPartner.category}</span></div>
                  <div className="d-cell"><span className="lbl">Created Date</span><span className="val">{selectedPartner.createdAt}</span></div>
                  <div className="d-cell"><span className="lbl">Created By</span><span className="val">{selectedPartner.createdBy}</span></div>
                </div>
              )}

              {detailTab === "security" && (
                <div className="d-security-box">
                  <div className="s-line"><span className="k">partner_type</span><span className="v">internal</span></div>
                  <div className="s-line"><span className="k">creation_source</span><span className="v">admin_created</span></div>
                  <div className="s-line"><span className="k">must_change_password</span><span className="v">{selectedPartner.mustChangePassword ? "true" : "false"}</span></div>
                  <button className="ip-btn-secondary full flex-btn" onClick={(e) => handleOpenResetModal(selectedPartner, e)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                    <span>Reset Credentials</span>
                  </button>
                </div>
              )}

              {detailTab === "offerings" && (
                <div className="d-off-list">
                  <div className="d-off-item">
                    <span>Path Assessment Module</span>
                    <strong>₹4,999</strong>
                  </div>
                  <div className="d-off-item">
                    <span>Academic Guidance Session</span>
                    <strong>₹2,499</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="d-foot">
              <button className="ip-btn-secondary" onClick={() => handleOpenEditModal(selectedPartner)}>Edit</button>
              <button className={`ip-btn-primary ${selectedPartner.accountStatus === "active" ? "danger" : ""}`} onClick={(e) => handleToggleStatus(selectedPartner, e)}>
                {selectedPartner.accountStatus === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InternalPartners;
