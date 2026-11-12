/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, array-callback-return */
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Country, State, City } from "country-state-city";
import {
  validatePersonName,
  sanitizePostalCode,
  validatePostalCode,
  getCountryPostalRules,
} from "../../utils/emailValidator";
import { SvgCheck, SvgClose } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ── Country-specific mobile phone number digit rules ──────────────────────────
// Supports exact length (e.g. India: 10, Australia: 9) and variable lengths (e.g. Germany: 10-11, Brazil: 10-11, Indonesia: 9-12)
export const COUNTRY_MOBILE_RULES = {
  // North America & Caribbean (NANP + others)
  US: [10], CA: [10], MX: [10], AG: [10], AI: [10], AS: [10], BB: [10], BM: [10],
  BS: [10], DM: [10], DO: [10], GD: [10], GU: [10], JM: [10], KN: [10], KY: [10],
  LC: [10], MP: [10], MS: [10], PR: [10], SX: [10], TC: [10], TT: [7, 10], VC: [10],
  VG: [10], VI: [10], CU: [8], HT: [8],
  // Asia
  IN: [10], CN: [11], JP: [10], KR: [9, 10], SG: [8], MY: [9, 10], ID: [9, 10, 11, 12],
  PH: [10], VN: [9], TH: [9], PK: [10], BD: [10], LK: [9], NP: [10], MM: [8, 9, 10],
  HK: [8], TW: [9], MO: [8], KH: [8, 9], LA: [9, 10], MN: [8], AF: [9], BT: [8],
  BN: [7], MV: [7],
  // Middle East
  AE: [9], SA: [9], QA: [8], KW: [8], BH: [8], OM: [8], IL: [9], JO: [9],
  LB: [7, 8], IQ: [10], IR: [10], SY: [9], YE: [9], PS: [9],
  // Europe
  GB: [10], DE: [10, 11], FR: [9], IT: [9, 10], ES: [9], NL: [9], BE: [9],
  CH: [9], AT: [10, 11, 12, 13], SE: [9], NO: [8], DK: [8], FI: [9, 10],
  IE: [9], PT: [9], PL: [9], CZ: [9], SK: [9], HU: [9], RO: [9], BG: [8, 9],
  GR: [10], TR: [10], RU: [10], UA: [9], BY: [9], RS: [8, 9], HR: [8, 9],
  SI: [8], BA: [8], AL: [9], MK: [8], ME: [8], IS: [7], LU: [9], MT: [8],
  CY: [8], EE: [7, 8], LV: [8], LT: [8], MD: [8], GE: [9], AM: [8], AZ: [9],
  KZ: [10], UZ: [9], KG: [9], TJ: [9], TM: [8], AD: [6], FO: [6], GI: [8],
  GL: [6], LI: [7, 8, 9], MC: [8, 9], SM: [6, 10],
  // Oceania
  AU: [9], NZ: [8, 9, 10], FJ: [7], PG: [8], NC: [6], PF: [8], WS: [7],
  TO: [5, 7], VU: [7], SB: [7],
  // Central & South America
  BR: [10, 11], AR: [10], CL: [9], CO: [10], PE: [9], VE: [10], EC: [9],
  BO: [8], PY: [9], UY: [8], CR: [8], PA: [8], GT: [8], HN: [8], SV: [8],
  NI: [8], BZ: [7], GY: [7], SR: [7], AW: [7], CW: [7, 8],
  // Africa
  ZA: [9], NG: [10], EG: [10], KE: [9], GH: [9], ET: [9], TZ: [9], UG: [9],
  DZ: [9], MA: [9], TN: [8], SD: [9], AO: [9], MZ: [9], ZW: [9], ZM: [9],
  SN: [9], CM: [9], CI: [10], RW: [9], MG: [9], MU: [8], NA: [9], BW: [8],
  BJ: [8], BF: [8], BI: [8], CV: [7], CF: [8], TD: [8], CD: [9], CG: [9],
  DJ: [8], GQ: [9], ER: [7], GA: [7, 8], GM: [7], GN: [9], GW: [7], LR: [7, 8],
  LY: [9], MW: [9], ML: [8], MR: [8], NE: [8], SL: [8], SO: [8, 9], SS: [9],
  SZ: [8], TG: [8], SC: [7], ST: [7], KM: [7], LS: [8], TL: [7, 8],
  KI: [5, 8], FM: [7], PW: [7], MH: [7], NR: [7], TV: [5, 6], VA: [10], XK: [8],
  BQ: [7, 8],
};

/**
 * Resolves country phone digit rules by country ISO code, ISD calling code,
 * country name, or a country object.
 */
export const getCountryPhoneRules = (identifier) => {
  if (!identifier) {
    return {
      lengths: [10],
      minLength: 10,
      maxLength: 10,
      formatDescription: "exactly 10 digits",
      placeholder: "9876543210",
      isoCode: "IN",
      isdCode: "+91",
    };
  }

  let isoCode = "";
  let isdCode = "";
  let countryName = "";

  if (typeof identifier === "object" && identifier !== null) {
    isoCode = (identifier.isoCode || identifier.countryIso || identifier.phoneIso || "").toUpperCase();
    isdCode = identifier.code || identifier.phonecode || identifier.isdCode || "";
    countryName = identifier.name || identifier.country || "";
  } else if (typeof identifier === "string") {
    const raw = identifier.trim();
    if (COUNTRY_MOBILE_RULES[raw.toUpperCase()]) {
      isoCode = raw.toUpperCase();
    } else if (raw.startsWith("+") || /^\d+$/.test(raw)) {
      isdCode = raw;
    } else if (raw.length === 2 && /^[a-zA-Z]{2}$/.test(raw)) {
      isoCode = raw.toUpperCase();
    } else {
      countryName = raw;
    }
  }

  let allCountries = [];
  try {
    allCountries = Country.getAllCountries();
  } catch (e) {
    allCountries = [];
  }

  // If countryName given, find country by name
  if (!isoCode && countryName && allCountries.length > 0) {
    const match = allCountries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (match) {
      isoCode = match.isoCode;
      if (!isdCode) isdCode = match.phonecode;
    }
  }

  // If isdCode given without isoCode, try finding matching countries
  let matchedLengths = null;
  if (isoCode && COUNTRY_MOBILE_RULES[isoCode]) {
    matchedLengths = COUNTRY_MOBILE_RULES[isoCode];
    if (!isdCode && allCountries.length > 0) {
      const match = allCountries.find((c) => c.isoCode === isoCode);
      if (match?.phonecode) isdCode = match.phonecode;
    }
  } else if (isdCode) {
    const cleanIsd = isdCode.replace(/\D/g, "");
    const matchingCountries = allCountries.filter(
      (c) => (c.phonecode || "").replace(/\D/g, "") === cleanIsd
    );
    if (matchingCountries.length > 0) {
      if (!isoCode) isoCode = matchingCountries[0].isoCode;
      const combined = [];
      matchingCountries.forEach((c) => {
        if (COUNTRY_MOBILE_RULES[c.isoCode]) {
          combined.push(...COUNTRY_MOBILE_RULES[c.isoCode]);
        }
      });
      if (combined.length > 0) {
        matchedLengths = [...new Set(combined)].sort((a, b) => a - b);
      }
    }
  }

  const lengths = matchedLengths && matchedLengths.length > 0
    ? matchedLengths
    : [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  let formatDescription = "";
  if (lengths.length === 1 || minLength === maxLength) {
    formatDescription = `exactly ${minLength} digits`;
  } else if (maxLength - minLength === lengths.length - 1) {
    formatDescription = `${minLength} to ${maxLength} digits`;
  } else {
    formatDescription = `${lengths.join(" or ")} digits`;
  }

  let placeholder = "9876543210";
  const cleanIsdDigits = (isdCode || "").replace(/\D/g, "");
  if (isoCode === "US" || isoCode === "CA" || cleanIsdDigits === "1") {
    placeholder = "(555) 123-4567";
  } else if (isoCode === "GB" || cleanIsdDigits === "44") {
    placeholder = "07123 456789";
  } else if (isoCode === "IN" || cleanIsdDigits === "91") {
    placeholder = "98765-43210";
  } else if (isoCode === "AU" || cleanIsdDigits === "61") {
    placeholder = "412-345-678";
  } else if (isoCode === "DE" || cleanIsdDigits === "49") {
    placeholder = "151 23456789";
  } else if (lengths[0] === 8) {
    placeholder = "9876-5432";
  } else if (lengths[0] === 9) {
    placeholder = "987-654-321";
  } else if (lengths[0] === 10) {
    placeholder = "98765-43210";
  } else if (lengths[0] === 11) {
    placeholder = "98765-432100";
  } else if (lengths[0] === 7) {
    placeholder = "987-6543";
  }

  const formattedIsd = isdCode
    ? (isdCode.startsWith("+") ? isdCode : `+${isdCode}`)
    : "";

  return {
    lengths,
    minLength,
    maxLength,
    formatDescription,
    placeholder,
    isoCode: isoCode || "",
    isdCode: formattedIsd,
  };
};

/**
 * Sanitizes phone number input:
 * - Allows digits, spaces, hyphens (-), and parentheses ().
 * - Caps the total count of actual digits to maxDigits (preserving formatting characters).
 */
export const sanitizePhoneInput = (val, maxDigits = 15) => {
  if (!val || typeof val !== "string") return "";
  const allowed = val.replace(/[^0-9\s\-()]/g, "");
  let digitCount = 0;
  let result = "";
  for (const char of allowed) {
    if (/\d/.test(char)) {
      if (digitCount < maxDigits) {
        result += char;
        digitCount++;
      }
    } else {
      result += char;
    }
  }
  return result;
};

/**
 * Checks if a keydown event should be permitted in a phone input.
 * Allows control keys (Backspace, Delete, Tab, Arrow keys, Enter, etc.),
 * allowed formatting characters (spaces, hyphens, parentheses),
 * and digits (as long as max digit count hasn't been reached).
 */
export const isPhoneKeyAllowed = (e, currentVal = "", maxDigits = 15) => {
  if (
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Tab" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Enter" ||
    e.key === "Home" ||
    e.key === "End" ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return true;
  }

  if (e.key === " " || e.key === "-" || e.key === "(" || e.key === ")") {
    return true;
  }

  if (/^\d$/.test(e.key)) {
    const target = e.target;
    const hasSelection = target && target.selectionStart !== target.selectionEnd;
    const currentDigits = (currentVal || "").replace(/\D/g, "");
    if (currentDigits.length >= maxDigits && !hasSelection) {
      return false;
    }
    return true;
  }

  return false;
};

/**
 * Dynamically validates maximum and minimum digit length based on country rules.
 * Validates only the actual digits (stripping spaces, hyphens, parentheses).
 */
export const validatePhoneDigits = (
  val,
  countryRulesOrIsd,
  countryName = "the selected country",
  required = true
) => {
  const raw = (val || "").trim();
  const digitsOnly = raw.replace(/\D/g, "");

  if (!digitsOnly) {
    if (required) {
      return { isValid: false, message: "Please enter your phone number.", digitsOnly: "" };
    }
    return { isValid: true, cleanDigits: "", formattedPhone: "" };
  }

  let rules = countryRulesOrIsd;
  if (!rules || typeof rules === "string" || !rules.minLength) {
    rules = getCountryPhoneRules(rules);
  }

  const lengths = rules?.lengths || [7, 8, 9, 10, 11, 12, 13, 14, 15];
  const minLength = rules?.minLength || Math.min(...lengths);
  const maxLength = rules?.maxLength || Math.max(...lengths);
  const desc = rules?.formatDescription || (minLength === maxLength ? `exactly ${minLength} digits` : `${minLength} to ${maxLength} digits`);

  if (minLength === maxLength) {
    if (digitsOnly.length !== minLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be ${desc}.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
  } else {
    if (digitsOnly.length < minLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be at least ${minLength} digits.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
    if (digitsOnly.length > maxLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} cannot exceed ${maxLength} digits.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
    if (lengths.length > 0 && !lengths.includes(digitsOnly.length)) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be ${desc}.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
  }

  return { isValid: true, digitsOnly, rawPhone: raw, minLength, maxLength };
};

export const buildDialCodeOptions = () => {
  const allCountries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
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
          label: `${formattedCode} (${c.isoCode} - ${c.name})`,
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
};

let _cachedDialCodeOptions = null;
export const getDialCodeOptions = () => {
  if (!_cachedDialCodeOptions) {
    _cachedDialCodeOptions = buildDialCodeOptions();
  }
  return _cachedDialCodeOptions;
};


export { getCountryPostalRules };

// ── Reusable Custom Select (always opens DOWNWARDS, matches top-box width) ──
const CustomSelect = ({
  name,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
  searchable = true,
  renderSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (searchable && options.length > 5) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
      setTimeout(() => {
        if (listRef.current) {
          const selectedEl = listRef.current.querySelector(".up-custom-select-item--selected");
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: "nearest" });
          }
        }
      }, 60);
    }
  }, [isOpen, searchable, options.length]);

  const selectedOpt = useMemo(() => {
    return options.find((opt) => (typeof opt === "object" ? opt.value === value : opt === value));
  }, [options, value]);

  const displayLabel = useMemo(() => {
    if (renderSelected) return renderSelected(selectedOpt);
    if (!selectedOpt) return "";
    return typeof selectedOpt === "object" ? selectedOpt.label || selectedOpt.value : selectedOpt;
  }, [selectedOpt, renderSelected]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => {
      if (typeof opt === "object") {
        const text = `${opt.label || ""} ${opt.value || ""} ${opt.searchExtra || ""}`.toLowerCase();
        return text.includes(q);
      }
      return String(opt).toLowerCase().includes(q);
    });
  }, [options, search]);

  const handleSelect = (optVal) => {
    if (onChange) {
      onChange({ target: { name, value: optVal } });
    }
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div
      className={`up-custom-select-wrapper ${isOpen ? "up-custom-select-wrapper--open" : ""} ${disabled ? "up-custom-select-wrapper--disabled" : ""} ${className}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`up-custom-select-trigger ${isOpen ? "up-custom-select-trigger--open" : ""} ${!displayLabel ? "up-custom-select-trigger--placeholder" : ""}`}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="up-custom-select-value" title={displayLabel || placeholder}>
          {displayLabel || placeholder}
        </span>
        <svg
          className={`up-custom-select-arrow ${isOpen ? "up-custom-select-arrow--open" : ""}`}
          width="13"
          height="13"
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

      {isOpen && !disabled && (
        <div className="up-custom-select-menu" role="listbox">
          {searchable && options.length > 5 && (
            <div className="up-custom-select-search-wrap" onClick={(e) => e.stopPropagation()}>
              <svg
                className="up-custom-select-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="up-custom-select-search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                    setSearch("");
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  className="up-custom-select-search-clear"
                  onClick={() => setSearch("")}
                >
                  <SvgClose size={14} />
                </button>
              )}
            </div>
          )}

          <div className="up-custom-select-list" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="up-custom-select-empty">No options found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label || opt.value : opt;
                const isSelected = selectedOpt && (typeof selectedOpt === "object" ? selectedOpt.value : selectedOpt) === optVal;
                return (
                  <div
                    key={`${optVal}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    title={optLabel}
                    className={`up-custom-select-item ${isSelected ? "up-custom-select-item--selected" : ""}`}
                    onClick={() => handleSelect(optVal)}
                  >
                    <span className="up-custom-select-item-text">{optLabel}</span>
                    {isSelected && (
                      <svg
                        className="up-custom-select-check-icon"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LevelOneModal = ({
  inline = false,
  creation = false,
  userDetails,
  existingData,
  existingDocId,
  onClose,
  onComplete,
}) => {
  const [loading,          setLoading]          = useState(false);
  const [uploading,        setUploading]        = useState(false);
  const [previewUrl,       setPreviewUrl]       = useState(existingData?.profilePicture || "");

  const [formData, setFormData] = useState({
    name:           existingData?.name           || "",
    username:       existingData?.username       || "",
    phoneNumber:    existingData?.phoneNumber    || "",
    country:        existingData?.country        || "India",
    state:          existingData?.state          || "",
    city:           existingData?.city           || "",
    postalCode:     existingData?.postalCode     || "",
    profilePicture: existingData?.profilePicture || "",
    email:          existingData?.email          || userDetails?.email || "",
    userType:       existingData?.userType       || "student",
  });

  // ── Country code + phone number split ─────────────────────────────────────
  const [selectedPhoneIso, setSelectedPhoneIso] = useState("IN");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");

  // All countries from library
  const allCountries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Dial code options enriched with country-specific mobile phone digit rules
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
            label: `${formattedCode} (${c.isoCode} - ${c.name})`,
            lengths: rules.lengths,
            minLength: rules.minLength,
            maxLength: rules.maxLength,
            formatDescription: rules.formatDescription,
            placeholder: rules.placeholder,
          });
        }
      }
    });
    return list.sort((a, b) => a.isoCode.localeCompare(b.isoCode));
  }, [allCountries]);

  // Current selected country for phone number rules
  const currentPhoneCountry = useMemo(() => {
    return (
      dialCodeOptions.find((c) => c.isoCode === selectedPhoneIso) ||
      dialCodeOptions.find((c) => c.code === countryCode) ||
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
      }
    );
  }, [dialCodeOptions, selectedPhoneIso, countryCode]);

  // Handler for phone country code dropdown change
  const handlePhoneCountryChange = (isoCode) => {
    setSelectedPhoneIso(isoCode);
    const countryObj = dialCodeOptions.find((c) => c.isoCode === isoCode);
    if (countryObj) {
      setCountryCode(countryObj.code);
      setPhoneDigits((prev) => sanitizePhoneInput(prev, countryObj.maxLength));
    }
  };

  // ── Custom Phone Code Dropdown State & Refs ───────────────────────────────
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const phoneDropdownRef = useRef(null);
  const phoneListRef = useRef(null);

  // Close phone code dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target)) {
        setPhoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to selected option when opened
  useEffect(() => {
    if (phoneDropdownOpen && phoneListRef.current) {
      const selectedEl = phoneListRef.current.querySelector(".up-phone-code-item--selected");
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [phoneDropdownOpen]);

  // Typeahead support: when user types first two letters (e.g. "IN", "US") or country name, jump immediately
  const phoneTypeaheadQueryRef = useRef("");
  const phoneTypeaheadTimerRef = useRef(null);

  const handlePhoneCodeKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPhoneDropdownOpen((prev) => !prev);
      return;
    }
    if (e.key === "Escape") {
      setPhoneDropdownOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!phoneDropdownOpen) {
        setPhoneDropdownOpen(true);
        return;
      }
      const currentIndex = dialCodeOptions.findIndex((o) => o.isoCode === selectedPhoneIso);
      const nextIndex = Math.min(dialCodeOptions.length - 1, currentIndex + 1);
      handlePhoneCountryChange(dialCodeOptions[nextIndex].isoCode);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!phoneDropdownOpen) {
        setPhoneDropdownOpen(true);
        return;
      }
      const currentIndex = dialCodeOptions.findIndex((o) => o.isoCode === selectedPhoneIso);
      const prevIndex = Math.max(0, currentIndex - 1);
      handlePhoneCountryChange(dialCodeOptions[prevIndex].isoCode);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      clearTimeout(phoneTypeaheadTimerRef.current);
      phoneTypeaheadQueryRef.current += e.key.toLowerCase();
      const q = phoneTypeaheadQueryRef.current;

      const found =
        dialCodeOptions.find((opt) => opt.isoCode.toLowerCase().startsWith(q)) ||
        dialCodeOptions.find((opt) => opt.name.toLowerCase().startsWith(q)) ||
        dialCodeOptions.find((opt) => opt.code.replace(/\+/g, "").startsWith(q));

      if (found) {
        handlePhoneCountryChange(found.isoCode);
      }

      phoneTypeaheadTimerRef.current = setTimeout(() => {
        phoneTypeaheadQueryRef.current = "";
      }, 700);
    }
  };

  // Handler for phone digits input: allow numbers, spaces, dashes (-), parentheses (())
  const handlePhoneDigitsChange = (e) => {
    const raw = e.target.value;
    const cleanChars = raw.replace(/[^\d\s\-()]/g, "");
    const digitCount = cleanChars.replace(/\D/g, "").length;
    const maxDigits = currentPhoneCountry?.maxLength || 15;
    if (digitCount <= maxDigits) {
      setPhoneDigits(cleanChars);
    }
  };

  const handlePhoneDigitsKeyDown = (e) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Enter" ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Allow digits, spaces, hyphens (-), and parentheses (())
    if (!/^[\d\s\-()]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Find selected country object
  const selectedCountryObj = useMemo(() => {
    if (!formData.country) return null;
    return allCountries.find(
      (c) => c.name.toLowerCase() === formData.country.toLowerCase() || c.isoCode.toLowerCase() === formData.country.toLowerCase()
    );
  }, [allCountries, formData.country]);

  // States for selected country
  const availableStates = useMemo(() => {
    if (!selectedCountryObj) return [];
    return State.getStatesOfCountry(selectedCountryObj.isoCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountryObj]);

  // Find selected state object
  const selectedStateObj = useMemo(() => {
    if (!formData.state || !availableStates.length) return null;
    return availableStates.find(
      (s) => s.name.toLowerCase() === formData.state.toLowerCase() || s.isoCode.toLowerCase() === formData.state.toLowerCase()
    );
  }, [availableStates, formData.state]);

  // Cities for selected state
  const availableCities = useMemo(() => {
    if (!selectedCountryObj || !selectedStateObj) return [];
    return City.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountryObj, selectedStateObj]);

  // Country options for CustomSelect
  const countryOptions = useMemo(() => {
    return allCountries.map((c) => ({
      value: c.name,
      label: c.name,
      searchExtra: c.isoCode,
    }));
  }, [allCountries]);

  // Phone dial code options for CustomSelect
  const dialCodeSelectOptions = useMemo(() => {
    return dialCodeOptions.map((opt) => ({
      value: opt.isoCode,
      label: `${opt.isoCode} (${opt.code})`,
      searchExtra: `${opt.name} ${opt.code}`,
    }));
  }, [dialCodeOptions]);

  // State options for CustomSelect
  const stateOptions = useMemo(() => {
    return availableStates.map((s) => ({
      value: s.name,
      label: s.name,
    }));
  }, [availableStates]);

  // City options for CustomSelect
  const cityOptions = useMemo(() => {
    const opts = availableCities.map((c) => ({
      value: c.name,
      label: c.name,
    }));
    if (formData.city && !availableCities.some((c) => c.name.toLowerCase() === formData.city.toLowerCase())) {
      opts.unshift({ value: formData.city, label: formData.city });
    }
    return opts;
  }, [availableCities, formData.city]);

  // Postal rules according to selected country
  const postalRules = useMemo(() => {
    return getCountryPostalRules(selectedCountryObj?.isoCode || formData.country || selectedPhoneIso);
  }, [selectedCountryObj, formData.country, selectedPhoneIso]);

  // Parse existing phoneNumber into code + digits on mount or when existingData arrives
  useEffect(() => {
    const ph = existingData?.phoneNumber || "";
    if (ph) {
      const match = ph.match(/^(\+\d{1,4}(?:-\d{1,4})?)\s*(.*)$/);
      if (match) {
        const code = match[1];
        const rawPart = match[2];
        setCountryCode(code);
        const countryByName = dialCodeOptions.find(
          (c) => c.name.toLowerCase() === (existingData.country || formData.country || "").toLowerCase()
        );
        const countryByCode = dialCodeOptions.find((c) => c.code === code);
        const selected = (countryByName && countryByName.code === code) ? countryByName : (countryByCode || countryByName);
        if (selected) {
          setSelectedPhoneIso(selected.isoCode);
          setPhoneDigits(rawPart);
        } else {
          setPhoneDigits(rawPart);
        }
      } else {
        const rawPart = ph.replace(/^[^\d+]+/, "");
        setPhoneDigits(rawPart);
      }
    } else if (existingData?.country) {
      const countryByName = dialCodeOptions.find(
        (c) => c.name.toLowerCase() === existingData.country.toLowerCase()
      );
      if (countryByName) {
        setSelectedPhoneIso(countryByName.isoCode);
        setCountryCode(countryByName.code);
      }
    }
  }, [existingData?.phoneNumber, existingData?.country, dialCodeOptions]);

  const [userNameAvailable, setUserNameAvailable] = useState(null);
  const [checkingUsername,  setCheckingUsername]  = useState(false);

  // ── Track original username to skip re-check when unchanged ──────────────
  const originalUsername = existingData?.username || "";
  const isUsernameUnchanged = formData.username === originalUsername;

  // ── Sync formData when parent passes fresh existingData after save + re-fetch ──
  useEffect(() => {
    if (!existingData) return;
    setFormData({
      name:           existingData.name           || "",
      username:       existingData.username       || "",
      phoneNumber:    existingData.phoneNumber    || "",
      country:        existingData.country        || "India",
      state:          existingData.state          || "",
      city:           existingData.city           || "",
      postalCode:     existingData.postalCode     || "",
      profilePicture: existingData.profilePicture || "",
      email:          existingData.email          || userDetails?.email || "",
      userType:       existingData.userType       || "student",
    });
    setPreviewUrl(existingData.profilePicture || "");
    setUserNameAvailable(null);
  }, [existingData]);

  const [nameTouched, setNameTouched] = useState(false);
  const nameValidation = validatePersonName(formData.name, "Full Name");
  const nameError = !nameValidation.isValid ? nameValidation.message : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === "username") setUserNameAvailable(null);
    if (name === "name") setNameTouched(true);
  };

  // ── Country selection handler ─────────────────────────────────────────────
  const handleCountryChange = (eOrVal) => {
    const countryName = typeof eOrVal === "object" && eOrVal?.target ? eOrVal.target.value : eOrVal;
    if (!countryName) {
      setFormData((p) => ({ ...p, country: "", state: "", city: "", postalCode: "" }));
      return;
    }

    const match = dialCodeOptions.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    ) || allCountries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );

    const newCountryParam = match?.isoCode || countryName;
    const sanitizedPostal = formData.postalCode ? sanitizePostalCode(formData.postalCode, newCountryParam) : "";
    setFormData((p) => ({ ...p, country: countryName, state: "", city: "", postalCode: sanitizedPostal }));

    if (match) {
      if (match.isoCode) {
        setSelectedPhoneIso(match.isoCode);
      }
      const code = match.code || (match.phonecode?.startsWith("+") ? match.phonecode : `+${match.phonecode}`);
      if (code) {
        setCountryCode(code);
      }
      const max = match.maxLength || 15;
      const clean = phoneDigits.replace(/\D/g, "");
      if (clean.length > max) {
        setPhoneDigits(clean.slice(0, max));
      }
    }
  };

  // ── State selection handler ───────────────────────────────────────────────
  const handleStateChange = (eOrVal) => {
    const stateName = typeof eOrVal === "object" && eOrVal?.target ? eOrVal.target.value : eOrVal;
    setFormData((p) => ({ ...p, state: stateName, city: "" }));
  };

  // ── City selection handler ────────────────────────────────────────────────
  const handleCityChange = (eOrVal) => {
    const cityName = typeof eOrVal === "object" && eOrVal?.target ? eOrVal.target.value : eOrVal;
    setFormData((p) => ({ ...p, city: cityName }));
  };

  // ── Automatic City & State lookup from Postal Code ───────────────────────
  const [fetchingCity, setFetchingCity] = useState(false);
  const postalTimerRef = useRef(null);

  const cleanPostalPlaceName = (raw) => {
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

  const lookupPostalCode = async (postalCodeVal, countryName) => {
    const trimmed = (postalCodeVal || "").trim();
    if (!trimmed || trimmed.length < 3) return;

    setFetchingCity(true);
    try {
      const isIndia = !countryName || countryName.toLowerCase() === "india" || /^\d{6}$/.test(trimmed);
      let detectedCity = "";
      let detectedState = "";

      const countryIso = (selectedCountryObj?.isoCode || selectedPhoneIso || (isIndia ? "IN" : "US")).toLowerCase();
      const tasks = [];

      // Task 1: Zippopotam
      tasks.push(
        fetch(`https://api.zippopotam.us/${countryIso}/${encodeURIComponent(trimmed)}`, { signal: AbortSignal.timeout(8000) })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.places && d.places.length > 0) {
              const place = d.places[0];
              const cName = cleanPostalPlaceName(place["place name"]);
              if (cName) return { city: cName, state: place["state"] || "" };
            }
            throw new Error("No place");
          })
      );

      // Task 2: India Post API
      if (isIndia && /^\d{6}$/.test(trimmed)) {
        tasks.push(
          fetch(`https://api.postalpincode.in/pincode/${trimmed}`, { signal: AbortSignal.timeout(8000) })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              const res = d && d[0];
              if (res && res.Status === "Success" && res.PostOffice && res.PostOffice.length > 0) {
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
                const cName = cleanPostalPlaceName(extractedCity);
                if (cName) return { city: cName, state: po.State || "" };
              }
              throw new Error("No PO");
            })
        );
      }

      let resObj = null;
      try {
        resObj = await Promise.any(tasks);
      } catch (raceErr) {
        // Fallback: OpenStreetMap Nominatim
        try {
          const countryParam = countryName || "India";
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&country=${encodeURIComponent(countryParam)}&format=json&addressdetails=1`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              const addr = nomData[0].address;
              const nCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
              resObj = { city: cleanPostalPlaceName(nCity), state: addr.state || "" };
            }
          }
        } catch (e) {}
      }

      if (resObj) {
        detectedCity = resObj.city;
        detectedState = resObj.state;
      }

      if (detectedCity) {
        const currentIso = selectedCountryObj?.isoCode || (isIndia ? "IN" : "US");
        const statesForCountry = State.getStatesOfCountry(currentIso);

        let stateToSet = formData.state;
        if (detectedState) {
          const matchedState = statesForCountry.find(
            (s) =>
              s.name.toLowerCase() === detectedState.toLowerCase() ||
              s.name.toLowerCase().includes(detectedState.toLowerCase()) ||
              detectedState.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matchedState) {
            stateToSet = matchedState.name;
          }
        }

        let cityToSet = detectedCity;
        if (stateToSet) {
          const stateObj = statesForCountry.find((s) => s.name.toLowerCase() === stateToSet.toLowerCase());
          if (stateObj) {
            const citiesInState = City.getCitiesOfState(currentIso, stateObj.isoCode);
            const exactCity = citiesInState.find((c) => c.name.toLowerCase() === detectedCity.toLowerCase());
            const partialCity = citiesInState.find(
              (c) =>
                c.name.toLowerCase().includes(detectedCity.toLowerCase()) ||
                detectedCity.toLowerCase().includes(c.name.toLowerCase())
            );
            if (exactCity) {
              cityToSet = exactCity.name;
            } else if (partialCity) {
              cityToSet = partialCity.name;
            }
          }
        }

        setFormData((prev) => ({
          ...prev,
          state: stateToSet || prev.state,
          city: cityToSet,
        }));
      }
    } catch (err) {
      console.warn("Postal code city detection error:", err.message);
    } finally {
      setFetchingCity(false);
    }
  };

  const handlePostalCodeChange = (e) => {
    const raw = e.target.value;
    const countryParam = selectedCountryObj?.isoCode || formData.country || selectedPhoneIso;
    const sanitized = sanitizePostalCode(raw, countryParam);
    setFormData((p) => ({ ...p, postalCode: sanitized }));

    clearTimeout(postalTimerRef.current);
    const trimmed = sanitized.trim();
    if (trimmed.length >= 3) {
      postalTimerRef.current = setTimeout(() => {
        lookupPostalCode(trimmed, formData.country);
      }, 400);
    }
  };

  const handlePostalCodeBlur = (e) => {
    clearTimeout(postalTimerRef.current);
    const trimmed = (e.target.value || "").trim();
    if (trimmed.length >= 3) {
      lookupPostalCode(trimmed, formData.country);
    }
  };

  // ── Username check — skip API call if username hasn't changed ─────────────
  const handleCheckUsername = async () => {
    if (!formData.username) return;

    if (isUsernameUnchanged) {
      setUserNameAvailable(true);
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/users/check-username?username=${formData.username}`
      );
      setUserNameAvailable(res.data.available);
    } catch {
      setUserNameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const isFormValid = () => {
    const countryName = currentPhoneCountry?.name || "the selected country";
    const phoneVal = validatePhoneDigits(phoneDigits, currentPhoneCountry, countryName, true);
    const countryParam = selectedCountryObj?.isoCode || formData.country || selectedPhoneIso;
    const postalVal = validatePostalCode(
      formData.postalCode,
      countryParam,
      postalRules?.required
    );
    return (
      nameValidation.isValid &&
      formData.username &&
      phoneVal.isValid &&
      formData.country &&
      formData.state &&
      formData.city &&
      postalVal.isValid &&
      userNameAvailable !== false &&
      (isUsernameUnchanged || userNameAvailable === true)
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Max file size is 5MB");         return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      const res = await fetch(`${BASE_URL}/api/upload/get-presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) throw new Error("Upload URL request failed");
      const data = await res.json();
      if (!data.presignedUrl) throw new Error("No presigned URL");

      await fetch(data.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const fileUrl = data.fileUrl
        || `https://thenaaviversebucket.s3.amazonaws.com/${file.name}`;

      setFormData((p) => ({ ...p, profilePicture: fileUrl }));
      toast.success("Image uploaded");
    } catch (err) {
      console.warn("Image upload skipped (optional):", err.message);
      toast.warn("Image upload skipped — you can add a picture later");
      setFormData((p) => ({ ...p, profilePicture: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePic = () => {
    setFormData((p) => ({ ...p, profilePicture: "" }));
    setPreviewUrl("");
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    setNameTouched(true);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.message);
      return;
    }

    const required = ["name", "username", "country", "state", "city"];
    if (postalRules.required) {
      required.push("postalCode");
    }
    for (const f of required) {
      if (!formData[f]) {
        toast.error(`Please fill in ${f.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return;
      }
    }

    const countryParam = selectedCountryObj?.isoCode || formData.country || selectedPhoneIso;
    const postalValidation = validatePostalCode(
      formData.postalCode,
      countryParam,
      postalRules?.required,
      postalRules?.label?.replace(/\s*\*$/, "") || "Postal code"
    );
    if (!postalValidation.isValid) {
      toast.error(postalValidation.message);
      return;
    }
    const countryName = currentPhoneCountry?.name || "the selected country";
    const phoneVal = validatePhoneDigits(phoneDigits, currentPhoneCountry, countryName, true);
    if (!phoneVal.isValid) {
      toast.error(phoneVal.message);
      return;
    }

    if (userNameAvailable === false) {
      toast.error("That username is already taken — please choose another");
      return;
    }

    // If username was changed but availability wasn't checked yet, force a check
    if (!isUsernameUnchanged && userNameAvailable === null) {
      toast.error("Please check username availability before saving");
      return;
    }

    setLoading(true);
    try {
      const email = userDetails?.email || formData.email;
      const fullPhone = `${countryCode} ${phoneDigits.trim()}`;
      const body  = {
        ...formData,
        postalCode: postalValidation.cleanPostalCode !== undefined ? postalValidation.cleanPostalCode : formData.postalCode,
        email,
        phoneNumber: fullPhone,
      };

      let response;
      const editId = existingData?._id || existingDocId;

      if (editId && !creation) {
        // ── Edit mode: PUT /api/users/update/:id ────────────────────────────
        response = await axios.put(`${BASE_URL}/api/users/update/${editId}`, body);
      } else {
        // ── Creation mode: POST /api/users/add ─────────────────────────────
        response = await axios.post(`${BASE_URL}/api/users/add`, body);
      }

      if (response.data?.status) {
        const savedId = response.data?.data?._id || editId;

        // ── Persist pic + name to localStorage so sidebar updates instantly ─
        if (formData.profilePicture) {
          localStorage.setItem("userProfilePic", formData.profilePicture);
        }

        try {
          const raw    = localStorage.getItem("user");
          const parsed = raw ? JSON.parse(raw) : {};
          const updated = parsed?.user
            ? { ...parsed, user: { ...parsed.user, name: formData.name, country: formData.country, city: formData.city, state: formData.state } }
            : { ...parsed, name: formData.name, country: formData.country, city: formData.city, state: formData.state };
          localStorage.setItem("user", JSON.stringify(updated));
          localStorage.setItem("userName", formData.name);

          const rawProf = localStorage.getItem("userProfile");
          const parsedProf = rawProf ? JSON.parse(rawProf) : {};
          const savedData = response.data?.data || {};
          const updatedProf = { ...parsedProf, ...savedData, ...formData };
          localStorage.setItem("userProfile", JSON.stringify(updatedProf));
          window.dispatchEvent(new Event("naavi:profile-updated"));
        } catch {}

        if (typeof onComplete === "function") onComplete(savedId);
      } else {
        toast.error(response.data?.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("Submit error:", err.response?.data || err.message);
      // Surface username-taken error from backend
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("username")) {
        toast.error("That username is already taken — please choose another");
        setUserNameAvailable(false);
      } else {
        toast.error(msg || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="up-form-wrap">
        <div className="up-form-title">
          {creation ? "Step 1 — Basic Information" : "Edit Basic Information"}
        </div>
        <div className="up-form-desc">
          {creation
            ? "Tell us about yourself to get started."
            : "Update your personal & contact details."}
        </div>

        {/* ── Profile Picture ─────────────────────────────────────────────── */}
        <div className="up-form-group">
          <label className="up-form-label">Profile Picture (optional)</label>
          <div className="up-pic-wrap">
            <div
              className="up-pic-circle"
              onClick={() => document.getElementById("up-pic-input").click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" />
              ) : (
                <span className="up-pic-placeholder">Click<br />to upload</span>
              )}
            </div>
            <input
              id="up-pic-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <div className="up-pic-actions">
              <button
                type="button"
                className="up-upload-btn"
                disabled={uploading}
                onClick={() => document.getElementById("up-pic-input").click()}
              >
                {uploading ? "Uploading…" : "Choose Image"}
              </button>
              {previewUrl && (
                <button type="button" className="up-remove-btn" onClick={handleRemovePic}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Name + Username ─────────────────────────────────────────────── */}
        <div className="up-form-row up-form-row--compact">
          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">Full Name *</label>
            <input
              className={`up-input ${nameError && (nameTouched || formData.name) ? "input-err" : ""}`}
              style={nameError && (nameTouched || formData.name) ? { borderColor: "#ef4444" } : {}}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => setNameTouched(true)}
              placeholder="Enter full name"
              required
            />
            {nameError && (nameTouched || formData.name) && (
              <div className="up-username-err">{nameError}</div>
            )}
          </div>

          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">Username *</label>
            <div className="up-username-row">
              <input
                className="up-input"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
              <button
                type="button"
                className="up-check-btn"
                onClick={handleCheckUsername}
                disabled={!formData.username || checkingUsername}
              >
                {checkingUsername ? "…" : "Check"}
              </button>
            </div>

            {/* ── Availability feedback ────────────────────────────────────── */}
            {userNameAvailable === true && (
              <div className="up-username-ok"><SvgCheck size={14} style={{ marginRight: 5, verticalAlign: "middle" }} /> Username available</div>
            )}
            {userNameAvailable === false && (
              <div className="up-username-err"><SvgClose size={14} style={{ marginRight: 5, verticalAlign: "middle" }} /> Username already taken</div>
            )}
            {userNameAvailable === null && isUsernameUnchanged && formData.username && (
              <div className="up-username-ok" style={{ opacity: 0.6 }}>
                <SvgCheck size={14} /> Current username
              </div>
            )}
            {userNameAvailable === null && !isUsernameUnchanged && formData.username && (
              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                Click "Check" to verify availability
              </div>
            )}
          </div>
        </div>

        {/* ── Phone Number with Country Code ──────────────────────────────── */}
        <div className="up-form-group">
          <label className="up-form-label">Phone Number *</label>
          <div className="up-phone-row">
            <div className="up-phone-code-wrapper" ref={phoneDropdownRef}>
              <button
                type="button"
                className={`up-phone-code-trigger ${phoneDropdownOpen ? "up-phone-code-trigger--open" : ""}`}
                onClick={() => setPhoneDropdownOpen((prev) => !prev)}
                onKeyDown={handlePhoneCodeKeyDown}
                aria-haspopup="listbox"
                aria-expanded={phoneDropdownOpen}
              >
                <span className="up-phone-code-text">
                  {selectedPhoneIso} ({countryCode})
                </span>
                <svg
                  className={`up-phone-code-arrow ${phoneDropdownOpen ? "up-phone-code-arrow--open" : ""}`}
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

              {phoneDropdownOpen && (
                <div className="up-phone-code-menu" ref={phoneListRef} role="listbox">
                  {dialCodeOptions.map((opt) => {
                    const isSelected = opt.isoCode === selectedPhoneIso;
                    return (
                      <div
                        key={`${opt.isoCode}-${opt.code}`}
                        role="option"
                        aria-selected={isSelected}
                        className={`up-phone-code-item ${isSelected ? "up-phone-code-item--selected" : ""}`}
                        onClick={() => {
                          handlePhoneCountryChange(opt.isoCode);
                          setPhoneDropdownOpen(false);
                        }}
                      >
                        <span>{opt.isoCode} ({opt.code})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <input
              className="up-input up-phone-input"
              type="tel"
              value={phoneDigits}
              maxLength={currentPhoneCountry.maxLength + 8}
              onChange={(e) => {
                const val = sanitizePhoneInput(e.target.value, currentPhoneCountry.maxLength);
                setPhoneDigits(val);
              }}
              onKeyDown={(e) => {
                if (!isPhoneKeyAllowed(e, phoneDigits, currentPhoneCountry.maxLength)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
                const target = e.target;
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const current = phoneDigits || "";
                const merged = current.slice(0, start) + pasted + current.slice(end);
                setPhoneDigits(sanitizePhoneInput(merged, currentPhoneCountry.maxLength));
              }}
              placeholder={currentPhoneCountry.placeholder}
              required
            />
          </div>
        </div>

        {/* ── Country + State ─────────────────────────────────────────────── */}
        <div className="up-form-row up-form-row--compact">
          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">Country *</label>
            <CustomSelect
              name="country"
              value={formData.country}
              onChange={handleCountryChange}
              options={countryOptions}
              placeholder="Select Country"
              searchPlaceholder="Search country..."
            />
          </div>

          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">State *</label>
            <CustomSelect
              name="state"
              value={formData.state}
              onChange={handleStateChange}
              options={stateOptions}
              placeholder={
                !formData.country
                  ? "Select country first"
                  : availableStates.length
                  ? "Select State"
                  : "No states found"
              }
              searchPlaceholder="Search state..."
              disabled={!availableStates.length}
            />
          </div>
        </div>

        {/* ── City + Postal ────────────────────────────────────────────────── */}
        <div className="up-form-row up-form-row--compact">
          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">
              City * {fetchingCity && <span style={{ textTransform: "none", fontSize: "11px", fontWeight: "400", color: "var(--teal)" }}>Auto-detecting...</span>}
            </label>
            {availableCities.length > 0 ? (
              <CustomSelect
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                options={cityOptions}
                placeholder="Select City"
                searchPlaceholder="Search city..."
              />
            ) : (
              <input
                className="up-input"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                placeholder={formData.state ? "Type your city" : "Select state first"}
                required
              />
            )}
          </div>

          <div className="up-form-group up-form-group--compact">
            <label className="up-form-label">{postalRules?.label || "Postal Code *"}</label>
            <input
              className="up-input"
              type="text"
              name="postalCode"
              maxLength={postalRules?.maxLength || 12}
              value={formData.postalCode}
              onChange={handlePostalCodeChange}
              onBlur={handlePostalCodeBlur}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
                const countryParam = selectedCountryObj?.isoCode || formData.country || selectedPhoneIso;
                const target = e.target;
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const current = formData.postalCode || "";
                const merged = current.slice(0, start) + pasted + current.slice(end);
                const sanitized = sanitizePostalCode(merged, countryParam);
                setFormData((p) => ({ ...p, postalCode: sanitized }));
                clearTimeout(postalTimerRef.current);
                const trimmed = sanitized.trim();
                if (trimmed.length >= 3) {
                  postalTimerRef.current = setTimeout(() => {
                    lookupPostalCode(trimmed, formData.country);
                  }, 400);
                }
              }}
              placeholder={postalRules?.placeholder || "Enter postal code"}
              required={postalRules?.required}
              autoComplete="postal-code"
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="up-form-footer">
          {onClose && !creation && (
            <button type="button" className="up-btn-cancel" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="up-btn-primary"
            disabled={loading || uploading || !isFormValid()}
          >
            {loading ? "Saving…" : creation ? "Continue →" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default LevelOneModal;