import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./UserTopHeader.scss";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const KNOWN_COUNTRIES = [
  "USA", "United States", "US",
  "UK", "United Kingdom",
  "Canada", "Australia", "Germany", "India", "Singapore",
  "Ireland", "France", "New Zealand", "Netherlands", "Sweden",
  "Switzerland", "Japan", "China", "Italy", "Spain", "UAE", "Dubai",
  "Azerbaijan", "Russia", "South Korea", "Malaysia", "Indonesia", "Brazil"
];

// Helper: parse destination country, university, and pathway from path name or document
const extractDestInfo = (name = "", pathDoc = {}, userOriginCountry = "") => {
  let country = "";
  let university = "";
  let pathway = "";
  let course = "";

  // 1. Explicit destination country in document
  if (pathDoc.destination_country && typeof pathDoc.destination_country === "string" && pathDoc.destination_country.trim()) {
    country = pathDoc.destination_country.trim();
  } else if (pathDoc.feature_coordinates?.destination_country && typeof pathDoc.feature_coordinates.destination_country === "string") {
    country = pathDoc.feature_coordinates.destination_country.trim();
  }

  // 2. Parse from path name (e.g. segments or known country names)
  if (name) {
    const parts = name.split(/[•·|—–]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const matched = KNOWN_COUNTRIES.find((c) => c.toLowerCase() === lastPart.toLowerCase());
      if (matched) {
        country = matched;
      }
    } else {
      // Check comma separated e.g. "Yale, USA"
      const commaParts = name.split(",").map((p) => p.trim()).filter(Boolean);
      if (commaParts.length >= 2) {
        const last = commaParts[commaParts.length - 1];
        const matched = KNOWN_COUNTRIES.find((c) => c.toLowerCase() === last.toLowerCase());
        if (matched) country = matched;
      }
      // Scan for any known country word in title
      if (!country) {
        for (const c of KNOWN_COUNTRIES) {
          const regex = new RegExp(`\\b${c}\\b`, "i");
          if (regex.test(name)) {
            country = c;
            break;
          }
        }
      }
    }
  }

  // 3. Fallbacks for country from pathDoc.country (only if foreign or different from origin country)
  if (!country && pathDoc.country && typeof pathDoc.country === "string") {
    const docCountry = pathDoc.country.trim();
    const originLower = (userOriginCountry || "").trim().toLowerCase();
    const docCountryLower = docCountry.toLowerCase();

    if (originLower && docCountryLower !== originLower && docCountryLower !== "india") {
      country = docCountry;
    } else if (!originLower && docCountryLower !== "india") {
      country = docCountry;
    }
  }

  // Normalize aliases
  if (country) {
    const lower = country.toLowerCase();
    if (lower === "united states" || lower === "us") {
      country = "USA";
    } else if (lower === "united kingdom") {
      country = "UK";
    }
  }

  // 4. Extract university / institution
  if (pathDoc.destination_institution && typeof pathDoc.destination_institution === "string") {
    university = pathDoc.destination_institution.trim();
  } else if (pathDoc.feature_coordinates?.destination_institution && typeof pathDoc.feature_coordinates.destination_institution === "string") {
    university = pathDoc.feature_coordinates.destination_institution.trim();
  } else if (Array.isArray(pathDoc.university) && pathDoc.university.length > 0 && typeof pathDoc.university[0] === "string") {
    university = pathDoc.university[0].trim();
  } else if (typeof pathDoc.university === "string" && pathDoc.university.trim()) {
    university = pathDoc.university.trim();
  }

  // Filter out dummy/test words for university
  if (university && ["job", "wq", "hudhh", "test", "unknown", "n/a", "-"].includes(university.toLowerCase())) {
    university = "";
  }

  // 5. Extract pathway / program / course
  if (pathDoc.feature_coordinates?.program && typeof pathDoc.feature_coordinates.program === "string") {
    pathway = pathDoc.feature_coordinates.program.trim();
  } else if (pathDoc.program && typeof pathDoc.program === "string") {
    pathway = pathDoc.program.trim();
  } else if (pathDoc.feature_coordinates?.destination_degree && typeof pathDoc.feature_coordinates.destination_degree === "string") {
    pathway = pathDoc.feature_coordinates.destination_degree.trim();
  } else if (pathDoc.destination_degree && typeof pathDoc.destination_degree === "string") {
    pathway = pathDoc.destination_degree.trim();
  }

  if (pathway && ["unknown", "n/a", "none", "-"].includes(pathway.toLowerCase())) {
    pathway = "";
  }

  // Check segments if name is composite
  if (name) {
    const parts = name.split(/[•·|—–]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      for (const part of parts) {
        if (!country || part.toLowerCase() !== country.toLowerCase()) {
          const lowerP = part.toLowerCase();
          if (
            !university &&
            (lowerP.includes("university") ||
             lowerP.includes("college") ||
             lowerP.includes("institute") ||
             lowerP.includes("school") ||
             lowerP.includes("academy") ||
             /\b(iit|nit|mit|harvard|stanford|yale|oxford|cambridge|cornell|princeton|columbia)\b/i.test(part))
          ) {
            university = part;
          } else if (!pathway && (lowerP.includes("path") || lowerP.includes("career") || lowerP.includes("bachelor") || lowerP.includes("master"))) {
            pathway = part;
          }
        }
      }
    }
  }

  // If still no pathway, use nameOfPath / name if it's descriptive
  const fallbackName = (pathDoc.nameOfPath || pathDoc.name || name || "").trim();
  if (!pathway && fallbackName) {
    if (!KNOWN_COUNTRIES.some(c => c.toLowerCase() === fallbackName.toLowerCase())) {
      pathway = fallbackName;
    }
  }

  course = pathway || "";

  return { country, university, pathway, course };
};

export default function UserTopHeader({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [fromLabel, setFromLabel] = useState("");
  const [toLabel, setToLabel] = useState("");
  const [mobileToLabel, setMobileToLabel] = useState("");
  const [stepsLabel, setStepsLabel] = useState("");
  const [cityLabel, setCityLabel] = useState("");

  const lastPathIdRef = useRef(localStorage.getItem("selectedPathId"));
  const lastPathNameRef = useRef(localStorage.getItem("selectedPathName"));

  const updateHeaderInfo = async () => {
    try {
      // 1. User & Profile Data
      let userObj = null;
      try {
        const rawUser = localStorage.getItem("user");
        const parsed = rawUser ? JSON.parse(rawUser) : null;
        userObj = parsed?.user || parsed;
      } catch (e) {
        userObj = null;
      }

      const email = userObj?.email || "";

      let profileObj = null;
      try {
        const rawProfile = localStorage.getItem("userProfile");
        profileObj = rawProfile ? JSON.parse(rawProfile) : null;
      } catch (e) {
        profileObj = null;
      }

      // If cached profile belongs to a different user, clear it immediately
      if (profileObj?.email && email && profileObj.email.toLowerCase() !== email.toLowerCase()) {
        profileObj = null;
        localStorage.removeItem("userProfile");
      }

      // Fetch fresh profile data for the current user from the API
      if (email) {
        try {
          const profRes = await axios.get(`${BASE_URL}/api/users/get/${encodeURIComponent(email)}`);
          if (profRes.data?.status && profRes.data?.data) {
            profileObj = profRes.data.data;
            localStorage.setItem("userProfile", JSON.stringify(profileObj));
          }
        } catch (e) {
          // ignore network error, keep current profileObj
        }
      }

      const userOriginCountry = profileObj?.country || userObj?.country || "";

      // Determine 'FROM' (Current Position) from the new user's real profile
      const buildFrom = (p) => {
        if (!p) return "";
        // Priority 1: Grade • Stream / Curriculum • Country
        const academicParts = [
          p.grade,
          p.stream || p.curriculum,
          p.country
        ].filter(Boolean);
        if (academicParts.length >= 2) {
          return academicParts.join(" • ");
        }

        // Priority 2: Grade • School • Country
        if (p.grade && (p.school || p.country)) {
          return [p.grade, p.school, p.country].filter(Boolean).join(" • ");
        }

        // Priority 3: School • Country
        if (p.school && p.country) {
          return `${p.school} • ${p.country}`;
        }

        // Priority 4: Profession / Current Position
        if (p.profession || p.currentPosition) {
          return [p.profession || p.currentPosition, p.country].filter(Boolean).join(" • ");
        }

        // Priority 5: City • Country (e.g. Level 1 completed)
        if (p.city && p.country) {
          return `${p.city} • ${p.country}`;
        }
        if (p.country) return p.country;
        if (p.city) return p.city;
        if (p.school) return p.school;
        if (p.grade) return p.grade;

        return "";
      };

      const fromVal = buildFrom(profileObj) || buildFrom(userObj) || userObj?.name || "";
      setFromLabel(fromVal);

      // Determine City / Location
      const city = profileObj?.city || userObj?.city || profileObj?.country || userObj?.country || "";
      setCityLabel(city);

      // Check approval status: if user is not approved, they CANNOT have a selected path
      const approvalStatus = profileObj?.approvalStatus || userObj?.approvalStatus || "";
      const isApproved = approvalStatus === "approved";

      // Verify path ownership: if selectedPathOwner in localStorage doesn't match current user, purge it!
      const pathOwner = localStorage.getItem("selectedPathOwner");
      if (pathOwner && email && pathOwner.toLowerCase() !== email.toLowerCase()) {
        localStorage.removeItem("selectedPathId");
        localStorage.removeItem("selectedPathName");
        localStorage.removeItem("selectedPathSteps");
        localStorage.removeItem("selectedPathCountry");
        localStorage.removeItem("selectedPathUniversity");
        localStorage.removeItem("selectedPathPathway");
        localStorage.removeItem("selectedPathCountryForId");
        localStorage.removeItem("selectedPathOwner");
      }

      // For a new user whose account is still not approved, TO and STEPS must be empty!
      // They should be filled ONLY after path selection.
      if (!isApproved) {
        localStorage.removeItem("selectedPathId");
        localStorage.removeItem("selectedPathName");
        localStorage.removeItem("selectedPathSteps");
        localStorage.removeItem("selectedPathCountry");
        localStorage.removeItem("selectedPathUniversity");
        localStorage.removeItem("selectedPathPathway");
        localStorage.removeItem("selectedPathCountryForId");

        setToLabel("");
        setMobileToLabel("");
        setStepsLabel("");
        return;
      }

      // 2. Selected Path & Steps (Destination for Approved Users)
      let pathId = localStorage.getItem("selectedPathId");
      let pathName = localStorage.getItem("selectedPathName");
      let stepsCount = localStorage.getItem("selectedPathSteps");
      const currentOwner = localStorage.getItem("selectedPathOwner");

      // Verify active path from API for this user
      if (email) {
        try {
          const selRes = await axios.get(`${BASE_URL}/api/userpaths/selected`, {
            params: { email },
          });
          const serverPathId = selRes.data?.status && selRes.data?.pathId ? selRes.data.pathId : null;
          // If no local pathId or stored path owner does not match, adopt serverPathId
          if (!pathId || (currentOwner && currentOwner.toLowerCase() !== email.toLowerCase())) {
            if (serverPathId) {
              pathId = serverPathId;
              localStorage.setItem("selectedPathId", pathId);
              localStorage.setItem("selectedPathOwner", email);
            }
          } else if (!serverPathId && !pathId) {
            pathId = null;
            pathName = null;
            stepsCount = null;
            localStorage.removeItem("selectedPathId");
            localStorage.removeItem("selectedPathName");
            localStorage.removeItem("selectedPathSteps");
          }
        } catch (err) {
          // ignore
        }
      }

      // If no path selected, TO and STEPS must be empty
      if (!pathId) {
        setToLabel("");
        setMobileToLabel("");
        setStepsLabel("");
        return;
      }

      // Only re-use cached destination info if it was saved FOR THIS EXACT pathId
      const cachedForId = localStorage.getItem("selectedPathCountryForId");
      let pathCountry = (cachedForId && cachedForId === pathId) ? (localStorage.getItem("selectedPathCountry") || "") : "";
      let pathUniversity = (cachedForId && cachedForId === pathId) ? (localStorage.getItem("selectedPathUniversity") || "") : "";
      let pathPathway = (cachedForId && cachedForId === pathId) ? (localStorage.getItem("selectedPathPathway") || "") : "";

      // Fetch latest path details for the active pathId
      try {
        const [viewRes, stepsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/api/paths/viewpath/${pathId}`),
          axios.get(`${BASE_URL}/api/userpaths/steps?pathId=${pathId}`),
        ]);

        const pathDoc = viewRes.status === "fulfilled" && viewRes.value?.data?.data ? viewRes.value.data.data : {};
        const stepsData = stepsRes.status === "fulfilled" && stepsRes.value?.data?.data ? stepsRes.value.data.data : {};

        const fetchedName = pathDoc.nameOfPath || pathDoc.name || stepsData.name || stepsData.nameOfPath || "";
        if (fetchedName) {
          pathName = fetchedName;
          localStorage.setItem("selectedPathName", fetchedName);
        }

        const count =
          (Array.isArray(stepsData.steps) && stepsData.steps.length > 0 ? stepsData.steps.length : null) ||
          (Array.isArray(pathDoc.StepDetails) && pathDoc.StepDetails.length > 0 ? pathDoc.StepDetails.filter(s => s.status === "active").length || pathDoc.StepDetails.length : null) ||
          pathDoc.total_steps ||
          0;
        if (count > 0) {
          stepsCount = `${count} Steps`;
          localStorage.setItem("selectedPathSteps", stepsCount);
        }

        const { country: extCountry, university: extUniversity, pathway: extPathway } = extractDestInfo(pathName, pathDoc, userOriginCountry);
        pathCountry = extCountry || "";
        pathUniversity = extUniversity || "";
        pathPathway = extPathway || "";

        localStorage.setItem("selectedPathCountry", pathCountry);
        localStorage.setItem("selectedPathUniversity", pathUniversity);
        localStorage.setItem("selectedPathPathway", pathPathway);
        localStorage.setItem("selectedPathCountryForId", pathId);
      } catch (err) {
        // ignore error
      }

      // Fallback: If no API call was able to run but pathName is in memory:
      if (!pathCountry && pathName) {
        const { country: extCountry, university: extUniversity, pathway: extPathway } = extractDestInfo(pathName, {}, userOriginCountry);
        if (extCountry) pathCountry = extCountry;
        if (extUniversity) pathUniversity = extUniversity;
        if (extPathway) pathPathway = extPathway;
      }

      setToLabel(pathName || "");
      setStepsLabel(stepsCount || "");

      // On mobile: show Country if available; if no specified country, present either Pathway or University name
      let mobileVal = "";
      if (pathCountry) {
        mobileVal = pathCountry;
      } else if (pathUniversity) {
        mobileVal = pathUniversity;
      } else if (pathPathway) {
        mobileVal = pathPathway;
      } else if (pathName) {
        mobileVal = pathName;
      }
      setMobileToLabel(mobileVal);
    } catch (e) {
      console.error("Error updating UserTopHeader:", e);
    }
  };

  useEffect(() => {
    lastPathIdRef.current = localStorage.getItem("selectedPathId");
    lastPathNameRef.current = localStorage.getItem("selectedPathName");
    updateHeaderInfo();

    const handleStorageChange = () => updateHeaderInfo();
    const handlePathSelected = () => updateHeaderInfo();
    const handleStepCompleted = () => updateHeaderInfo();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("naavi:path-selected", handlePathSelected);
    window.addEventListener("naavi:profile-updated", handleStorageChange);
    window.addEventListener("naavi:step-completed", handleStepCompleted);

    // Polling interval check to immediately detect if path changed in localStorage
    const pollInterval = setInterval(() => {
      const curId = localStorage.getItem("selectedPathId");
      const curName = localStorage.getItem("selectedPathName");
      if (curId !== lastPathIdRef.current || curName !== lastPathNameRef.current) {
        lastPathIdRef.current = curId;
        lastPathNameRef.current = curName;
        updateHeaderInfo();
      }
    }, 800);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("naavi:path-selected", handlePathSelected);
      window.removeEventListener("naavi:profile-updated", handleStorageChange);
      window.removeEventListener("naavi:step-completed", handleStepCompleted);
      clearInterval(pollInterval);
    };
  }, [location.pathname]);

  const isHome = location.pathname === "/dashboard/users" || location.pathname === "/dashboard/users/home";

  const handleBackClick = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    if (isMobile) {
      const isMarketplace = location.pathname.toLowerCase().includes("marketplace");
      if (isMarketplace) {
        navigate("/dashboard/users");
        return;
      }
    }

    if (location.pathname.toLowerCase().includes("notifications") || location.search.toLowerCase().includes("notifications")) {
      navigate("/dashboard/users/home");
      return;
    }

    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="user-top-header">
      <div className="uth-left-actions">
        {!isHome && (
          <button className="uth-back-btn" onClick={handleBackClick} aria-label="Go back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="uth-route-searchbar" aria-label="Current career route">
        {/* FROM */}
        <div className="uth-route-segment uth-from-segment">
          <div className="uth-search-point from-point">
            <svg className="uth-desktop-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <svg className="uth-mobile-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="uth-search-copy uth-from-copy">
            <span className="uth-label">FROM</span>
            <strong className="uth-value" title={fromLabel || ""}>
              {fromLabel}
            </strong>
          </div>
        </div>

        <div className="uth-divider" />

        {/* TO */}
        <div className="uth-route-segment uth-to-segment">
          <div className="uth-search-point to-point">
            <svg className="uth-desktop-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <svg className="uth-mobile-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="uth-search-copy uth-to-copy">
            <span className="uth-label">TO</span>
            <strong className="uth-value uth-desktop-val" title={toLabel || ""}>
              {toLabel}
            </strong>
            <strong className="uth-value uth-mobile-val" title={mobileToLabel || ""}>
              {mobileToLabel}
            </strong>
          </div>
        </div>

        <div className="uth-divider" />

        {/* STEPS */}
        <div className="uth-search-copy uth-steps-copy">
          <span className="uth-label">STEPS</span>
          <strong className="uth-value">
            {stepsLabel}
          </strong>
        </div>
      </div>

      {cityLabel ? (
        <div className="uth-location-pill" title={cityLabel}>
          <svg className="uth-desktop-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <svg className="uth-mobile-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span>{cityLabel}</span>
        </div>
      ) : null}
    </header>
  );
}
