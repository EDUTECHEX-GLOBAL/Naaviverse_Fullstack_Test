import CustomSelect from '../accDashbaoard/CustomSelect';
/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, array-callback-return */
import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../accDashbaoard/accDashboard.scss";
import styles from "./new.module.scss"
import searchic from "../../static/images/dashboard/searchic.svg";
import downarrow from "../../static/images/dashboard/downarrow.svg";
import uploadv from "../../static/images/dashboard/uploadv.svg";
import nvest from "../../static/images/dashboard/nvest.svg";
import profile from "../../static/images/dashboard/profile.svg";
import closepop from "../../static/images/dashboard/closepop.svg";
import accounts from "../../static/images/dashboard/accounts.svg";
import vaults from "../../static/images/dashboard/vaults.svg";
import profilea from "../../static/images/dashboard/profilea.svg";
import support from "../../static/images/dashboard/support.svg";
import settings from "../../static/images/dashboard/settings.svg";
import sidearrow from "../../static/images/dashboard/sidearrow.svg";
import logout from "../../static/images/dashboard/logout.svg";
import upgif from "../../static/images/dashboard/upgif.gif";
import lg1 from "../login/favicon3.png";
import threedot from "../../static/images/dashboard/threedot.svg";
import { useStore } from "../../components/store/store.ts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AccDashsidebar from "../../components/accDashsidebar/accDashsidebar";
import { validatePersonName, validateBusinessName, validatePostalCode, validateWebsite } from "../../utils/emailValidator";
import {
  GetFollowersPerAccount,
  GetCategoriesAcc,
  GetAllCustomerLicenses,
  GetLogServices,
  GetAllCurrencies,
  CreatePopularService,
  CheckStatusAccountant,
} from "../../services/accountant";
import { formatDate } from "../../utils/time";
import * as jose from "jose";
import { LoadingAnimation1 } from "../../components/LoadingAnimation1";
import { useCoinContextData } from "../../context/CoinContext";
import NewStep1 from "../../globalComponents/GlobalDrawer/NewStep1";

import cover from "../../images/cover.svg";
import uploadGrey from "../../images/uploadGrey.svg";
import close from "../../images/close.svg";
import arrow from "../../images/arrow.svg";
import colorArrow from "../../images/colorArrow.svg";
import edit from "../../images/edit.svg";
import downArrow from "../../images/downArrow.svg";
import upArrow from "../../images/upArrow.svg";
import upload from "../../images/upload.svg";
import {
  InputDivsCheck,
  InputDivsTextArea1,
  InputDivsWithMT,
  InputDivsWithColorCode,
  InputDivsCreatePartner,
  InputDivsTextAreaPartner,
} from "../../components/createAccountant/CreatePlanB";
import { uploadImageFunc } from "../../utils/imageUpload";
import classNames from "../../components/createAccountant/components.module.scss";
import trash from "../accDashbaoard/trash.svg";
import { Country, State } from "country-state-city";
import MenuNav from "../../components/MenuNav/index.jsx";
import { getCountryPhoneRules, sanitizePhoneInput, validatePhoneDigits, isPhoneKeyAllowed } from "../UserProfile/LevelOneModal";
import { SvgCheck, SvgCheckCircle, SvgClose } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ─── Icons ────────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 3L21 7L7 21H3V17L17 3Z" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12H22M12 2C9.5 4 8 8 8 12C8 16 9.5 20 12 22C14.5 20 16 16 16 12C16 8 14.5 4 12 2Z" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22C12 22 20 16 20 10C20 5 16 2 12 2C8 2 4 5 4 10C4 16 12 22 12 22Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6H16M8 10H16M8 14H12" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
    <path d="M22 6L12 13L2 6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6V12L16 14" strokeLinecap="round" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9L9 15M9 9L15 15" strokeLinecap="round" />
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AccProfile = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const { accsideNav, setaccsideNav, ispopular, setispopular } = useStore();
  const [search, setSearch] = useState("");
  const [crmMenu, setcrmMenu] = useState("Followers");
  const [servicesMenu, setservicesMenu] = useState("Services");
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [isCatoading, setIsCatLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [followCount, setfollowCount] = useState(0);
  const [followData, setfollowData] = useState([]);
  const [coverImageS3url, setCoverImageS3url] = useState("");
  const [selectedFollower, setSelectedFollower] = useState({});
  const [pstep, setpstep] = useState(1);
  const [selectNew, setselectNew] = useState("");
  const [billingType, setbillingType] = useState("");
  const [categoriesData, setcategoriesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [selectCategory, setselectCategory] = useState("");
  const [serviceNameInput, setServiceNameInput] = useState("");
  const [serviceCodeInput, setServiceCodeInput] = useState("");
  const [productLabel, setProductLabel] = useState("");
  const [serviceTagline, setServiceTagline] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [isCurrencies, setIsCurrencies] = useState(false);
  const [allCurrencies, setallCurrencies] = useState([]);
  const [searchCurrency, setSearchCurrency] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [firstMonthPrice, setfirstMonthPrice] = useState("");
  const [monthlyPrice, setmonthlyPrice] = useState("");
  const [gracePeriod, setgracePeriod] = useState("");
  const [secondChargeAttempt, setsecondChargeAttempt] = useState("");
  const [thirdChargeAttempt, setthirdChargeAttempt] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmit, setIsSubmit] = useState(false);
  const [isServicesAcc, setIsServicesAcc] = useState(false);
  const [servicesAcc, setservicesAcc] = useState([]);
  const [isProfileData, setIsProfileData] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [profileSpecalities, setprofileSpecalities] = useState([]);
  const [email, setemail] = useState("");
  const [brandtag, setbrandtag] = useState("");
  const [country, setcountry] = useState("");
  const [address, setaddress] = useState("");
  const [displayname, setdisplayname] = useState("");
  const [phno, setphno] = useState("");
  const [description, setdescription] = useState("");
  const [colorcode, setcolorcode] = useState("");
  const [patneringinstitution, setpatneringinstitution] = useState("");
  const [autodeposit, setautodeposit] = useState("");
  const [cashback, setcashback] = useState("");
  const [category, setcategory] = useState("");
  const [subcategory, setsubcategory] = useState("");
  const [shouldReload, setShouldReload] = useState(false);

  // ── NEW: approval status state ────────────────────────────────────────────
  // Possible values: "" | "pending" | "approved" | "rejected"
  const [accStatus, setAccStatus] = useState("");
  // Rejection reason returned by the admin (if any)
  const [rejectionReason, setRejectionReason] = useState("");
  // Loading state while we check approval / fetch profile
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // create brand profile
  const [createBrandProfile, setCreateBrandProfile] = useState(false);
  const [createBrandProfileStep, setCreateBrandProfileStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState();
  const [userName, setUserName] = useState("");
  const [coverPhoto1, setCoverPhoto1] = useState();
  const [brandDisplayName, setBrandDisplayName] = useState();
  const [brandUserName, setBrandUserName] = useState("");
  const [brandDescription, setBrandDescription] = useState();
  const [brandColorCode, setBrandColorCode] = useState();
  const [headquarter, setHeadquarter] = useState();
  const [brandAddress, setBrandAddress] = useState();
  const [whiteProPic, setWhiteProPic] = useState();
  const [isloading, setIsloading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hidden1, setHidden1] = useState(false);
  const [hidden2, setHidden2] = useState(false);
  const [userNameAvailable, setUserNameAvailable] = useState(false);
  const [userNameAvailable1, setUserNameAvailable1] = useState(false);
  const [changing, setChanging] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit mode states
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState({});

  // new path
  const [grade, setGrade] = useState([]);
  const [gradeAvg, setGradeAvg] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [stream, setStream] = useState([]);
  const [finance, setFinance] = useState([]);
  const [personality, setPersonality] = useState("");
  const streamList = ["MPC", "BIPC", "CEC", "MEC", "HEC"];
  const curriculumList = ["IB", "IGCSE", "CBSE", "ICSE", "Nordic"];
  const gradeList = ["9", "10", "11", "12"];
  const gradePointAvg = [
    "0% - 35%", "36% - 60%", "61% - 75%",
    "76% - 85%", "86% - 95%", "96% - 100%",
  ];
  const financeList = ["0-25L", "25L-75L", "75L-3CR", "3CR+", "Other"];
  const personalityList = [
    "realistic", "investigative", "artistic",
    "social", "enterprising", "conventional",
  ];

  const {
    allSteps, setAllSteps,
    stepsToggle, setStepsToggle,
    pathSteps, setPathSteps,
    creatingPath, setCreatingPath,
    mypathsMenu, setMypathsMenu,
    selectedSteps, setSelectedSteps,
    countryApiValue,
  } = useCoinContextData();

  let navigate = useNavigate();

  // edit accountant data
  const [editProfilePic, setEditProfilePic] = useState(false);
  const [editCountry, setEditCountry] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(false);
  const [editPhoneNo, setEditPhoneNo] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [editCoverPic, setEditCoverPic] = useState(false);
  const [editColorCode, setEditColorCode] = useState(false);
  const [editPartneringInstitutions, setEditPartneringInstitutions] = useState(false);
  const [editCategory, setEditCategory] = useState(false);
  const [editSubCategory, setEditSubCategory] = useState(false);
  const [editSpecialities, setEditSpecialities] = useState(false);

  // accountant profile new values
  const [newAddress, setNewAddress] = useState();
  const [newDisplayName, setNewDisplayName] = useState();
  const [newPhoneNo, setNewPhoneNo] = useState();
  const [newDescription, setNewDescription] = useState();
  const [newColorCode, setNewColorCode] = useState();
  const [newCountry, setNewCountry] = useState();
  const [newPartneringInstitutions, setNewPartneringInstitutions] = useState();
  const [newAutoDeposit, setNewAutoDeposit] = useState();
  const [newCashBack, setNewCashBack] = useState();
  const [newCategory, setNewCategory] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState();
  const [newSpecialities, setNewSpecialities] = useState(false);
  const [newCoverPic, setNewCoverPic] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState();
  const [partnerStepsData, setPartnerStepsData] = useState([]);

  const [backupPathList, setBackupPathList] = useState([]);
  const [showBackupPathList, setShowBackupPathList] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // upload part starts here
  const secrAet = "uyrw7826^&(896GYUFWE&*#GBjkbuaf";
  const emailDev = "rahulrajsb@outlook.com";
  const userDetails = JSON.parse(localStorage.getItem("partner"));

  useEffect(() => {
    console.log("Partner data retrieved from localStorage:", userDetails);
  }, []);

  const [businessName, setBusinessName] = useState(() => {
    const bn = userDetails?.businessName;
    return (bn && bn !== userDetails?.username) ? bn : '';
  });
  const [businessDesc, setBusinessDesc] = useState('');
  const [website, setWebsite] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessLogo, setBusinessLogo] = useState(userDetails?.logo || userDetails?.picture || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [businessCountry, setBusinessCountry] = useState('');
  const [firstName, setFirstName] = useState(() => {
    if (userDetails?.firstName) return userDetails.firstName;
    if (userDetails?.name) {
      const parts = userDetails.name.trim().split(/\s+/);
      return parts[0] || '';
    }
    return '';
  });
  const [lastName, setLastName] = useState(() => {
    if (userDetails?.lastName) return userDetails.lastName;
    if (userDetails?.name) {
      const parts = userDetails.name.trim().split(/\s+/);
      return parts.slice(1).join(' ') || '';
    }
    return '';
  });
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');

  // ── Automatic City & State lookup from Postal Code for Partner Profile ───
  const partnerPostalTimerRef = useRef(null);

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

  const lookupPartnerPostalCode = async (postalCodeVal, currentCountry) => {
    const trimmed = (postalCodeVal || "").trim();
    if (!trimmed || trimmed.length < 3) return;

    try {
      const activeCountry = currentCountry || businessCountry || "India";
      const isIndia = activeCountry.toLowerCase() === "india" || /^\d{6}$/.test(trimmed);

      // Determine ISO for Zippopotam
      let countryIso = isIndia ? "in" : "us";
      if (activeCountry && countryApiValue?.length) {
        const found = countryApiValue.find(
          (c) => c?.name?.common?.toLowerCase() === activeCountry.toLowerCase()
        );
        if (found?.cca2) countryIso = found.cca2.toLowerCase();
      }

      const tasks = [];

      // Task 1: Zippopotam (sub-second fast response)
      tasks.push(
        fetch(`https://api.zippopotam.us/${countryIso}/${encodeURIComponent(trimmed)}`, { signal: AbortSignal.timeout(8000) })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.places && d.places.length > 0) {
              const place = d.places[0];
              const cName = cleanPostalPlaceName(place["place name"]);
              if (cName) {
                return {
                  city: cName,
                  state: place["state"] || "",
                  country: d.country || activeCountry || "India",
                };
              }
            }
            throw new Error("No place");
          })
      );

      // Task 2: India Post API (if 6-digit PIN code)
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
                if (cName) {
                  return {
                    city: cName,
                    state: po.State || "",
                    country: po.Country || "India",
                  };
                }
              }
              throw new Error("No PO");
            })
        );
      }

      // Race to get the fastest valid result
      let result = null;
      try {
        result = await Promise.any(tasks);
      } catch (raceErr) {
        // Fallback: OpenStreetMap Nominatim if both failed
        try {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&country=${encodeURIComponent(activeCountry)}&format=json&addressdetails=1`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              const addr = nomData[0].address;
              const nCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
              result = {
                city: cleanPostalPlaceName(nCity),
                state: addr.state || "",
                country: addr.country || activeCountry,
              };
            }
          }
        } catch (e) {}
      }

      if (result) {
        if (result.city) setCity(result.city);
        if (result.state) setBusinessState(result.state);
        if (result.country && !businessCountry) {
          const matchedCountry = countryApiValue?.find(
            (c) => c?.name?.common?.toLowerCase() === result.country.toLowerCase()
          );
          setBusinessCountry(matchedCountry ? matchedCountry.name.common : result.country);
        }
      }
    } catch (err) {
      console.warn("Partner postal code auto-fill error:", err.message);
    }
  };

  const handlePartnerPinCodeChange = (val) => {
    const isIndia = (businessCountry || "").toLowerCase().includes("india");
    let cleanVal = val || "";
    if (isIndia) {
      // Numbers only, strictly max 6 digits
      cleanVal = cleanVal.replace(/\D/g, "").slice(0, 6);
    } else {
      // Alphanumeric, space, hyphen only, strictly max 10 chars
      cleanVal = cleanVal.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 10);
    }
    setPinCode(cleanVal);
    clearTimeout(partnerPostalTimerRef.current);
    if (cleanVal.length >= 3) {
      partnerPostalTimerRef.current = setTimeout(() => {
        lookupPartnerPostalCode(cleanVal, businessCountry);
      }, 250);
    }
  };

  const handleDownload = (type) => {
    let filePath;
    if (type === "Path") filePath = "/PathTemplate.xlsx";
    else if (type === "Step") filePath = "/StepTemplate.xlsx";
    else filePath = "/ServiceTemplate.xlsx";

    const link = document.createElement("a");
    link.href = filePath;
    link.download = filePath.substring(filePath.lastIndexOf("/") + 1);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => resetpop(), 300);
  };
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

  // Synchronize calling code when Section 2 country changes
  useEffect(() => {
    if (businessCountry) {
      const clean = businessCountry.trim().toLowerCase();
      const match = dialCodeOptions.find(
        (c) => c.name.toLowerCase() === clean || c.isoCode.toLowerCase() === clean
      );
      if (match && match.isoCode !== selectedPhoneIso) {
        setSelectedPhoneIso(match.isoCode);
        setPhone((prev) => prev.slice(0, match.maxLength));
      }
    }
  }, [businessCountry, dialCodeOptions]);

  const handlePhoneCountryChange = (isoCode) => {
    setSelectedPhoneIso(isoCode);
    const countryObj = dialCodeOptions.find((c) => c.isoCode === isoCode);
    if (countryObj) {
      setPhone((prev) => sanitizePhoneInput(prev, countryObj.maxLength));
    }
  };

  const handlePartnerPhoneChange = (val) => {
    const max = currentPhoneCountry.maxLength;
    setPhone(sanitizePhoneInput(val, max));
  };

  const handlePhoneKeyDown = (e) => {
    if (!isPhoneKeyAllowed(e, phone, currentPhoneCountry.maxLength)) {
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
    const current = phone || "";
    const merged = current.slice(0, start) + pasted + current.slice(end);
    setPhone(sanitizePhoneInput(merged, max));
  };

  // ── Custom Dropdowns for Country, Phone Code, and Business Type (top box size only, strictly downward) ──
  const countryDropdownRef = useRef(null);
  const phoneContainerRef = useRef(null);
  const businessTypeDropdownRef = useRef(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const [phoneInputFocused, setPhoneInputFocused] = useState(false);
  const [businessTypeDropdownOpen, setBusinessTypeDropdownOpen] = useState(false);

  const BUSINESS_TYPES = [
    "Distributor",
    "Vendor",
    "Mentor",
    "Institution",
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
        setCountrySearch("");
      }
      if (phoneContainerRef.current && !phoneContainerRef.current.contains(e.target)) {
        setPhoneCodeDropdownOpen(false);
        setPhoneCodeSearch("");
      }
      if (businessTypeDropdownRef.current && !businessTypeDropdownRef.current.contains(e.target)) {
        setBusinessTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const partnerCountryOptions = useMemo(() => {
    if (countryApiValue?.length) {
      return countryApiValue.map((c) => ({
        code: c.cca2,
        name: c?.name?.common || c.cca2,
      })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return allCountries.map((c) => ({
      code: c.isoCode,
      name: c.name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCountries, countryApiValue]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return partnerCountryOptions;
    const q = countrySearch.toLowerCase();
    return partnerCountryOptions.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
    );
  }, [partnerCountryOptions, countrySearch]);

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

  const isPhoneValid = validatePhoneDigits(phone, currentPhoneCountry, currentPhoneCountry.name, true).isValid;

  const isFirstNameValid = validatePersonName(firstName, "First Name").isValid;
  const isLastNameValid = validatePersonName(lastName, "Last Name").isValid;
  const isBusinessNameValid = validateBusinessName(businessName).isValid;
  const isPostalCodeValid = validatePostalCode(pinCode, businessCountry).isValid;
  const isWebsiteValid = validateWebsite(website).isValid;

  const allSelected = Boolean(
    isBusinessNameValid &&
    businessType &&
    businessLogo &&
    isPostalCodeValid &&
    businessCountry &&
    (city && city.trim()) &&
    (businessState && businessState.trim()) &&
    isFirstNameValid &&
    isLastNameValid &&
    (position && position.trim()) &&
    isPhoneValid &&
    isWebsiteValid
  );

  // ─── Approval Flow Helpers ──────────────────────────────────────────────────

  /**
   * Helper to verify if partner has actually submitted onboarding details.
   */
  const checkIsProfileComplete = (raw, profileRes) => {
    if (!raw) return false;
    const isApproved =
      profileRes?.data?.approvalStatus === "approved" ||
      profileRes?.data?.profileIncomplete === false ||
      raw?.approvalStatus === "approved" ||
      raw?.accountStatus === "active" ||
      raw?.status === true;
    if (isApproved) return true;

    return Boolean(
      (raw.businessName && String(raw.businessName).trim() !== "") ||
      (raw.firstName && String(raw.firstName).trim() !== "") ||
      (raw.username && String(raw.username).trim() !== "") ||
      raw.logo
    );
  };

  /**
   * Writes the approval status into localStorage so we can skip the
   * approval API on the next page load if we already know the answer.
   */
  const updateLocalStorage = (status) => {
    const existing = JSON.parse(localStorage.getItem("partner") || "{}");
    localStorage.setItem("partner", JSON.stringify({ ...existing, approvalStatus: status, status }));
  };

  /**
   * Fetches the partner profile data and populates state.
   * Pass the target status so we set accStatus correctly
   * (approved partners can edit; pending/rejected see read-only).
   */
  const fetchAndShowProfile = (mailId, targetStatus = "approved") => {
    setIsLoadingProfile(true);
    axios
      .get(`${BASE_URL}/api/partner/get?email=${mailId}`)
      .then((profileRes) => {
        const raw = profileRes.data?.data || {};
        const isApprovedStatus =
          targetStatus === "approved" ||
          profileRes.data?.approvalStatus === "approved" ||
          raw?.approvalStatus === "approved" ||
          raw?.accountStatus === "active" ||
          raw?.status === true ||
          userDetails?.approvalStatus === "approved" ||
          userDetails?.status === "approved";

        if (!isApprovedStatus && !checkIsProfileComplete(raw, profileRes)) {
          // API returned empty or incomplete data - no complete profile exists yet
          setIsProfileData(false);
          setProfileData({});
          setCreateBrandProfile(false);
          setAccStatus("");
          setIsLoadingProfile(false);
          return;
        }

        const effectiveStatus = isApprovedStatus ? "approved" : targetStatus;
        const normalized = {
          ...raw,
          businessName: raw.businessName || raw.username || userDetails?.businessName || userDetails?.username || "Partner",
          firstName: raw.firstName || raw.username || userDetails?.firstName || userDetails?.username || "Partner",
          type: raw.type || raw.partnerType || raw.businessType || "Distributor",
        };
        setIsProfileData(true);
        setProfileData(normalized);
        setprofileSpecalities(raw.specialities || []);
        setCreateBrandProfile(false);
        setAccStatus(effectiveStatus);

        // Always sync to localStorage for ALL statuses so the sidebar shows
        // the business name correctly and approvalStatus survives logout/re-login
        const existing = JSON.parse(localStorage.getItem("partner") || "{}");
        localStorage.setItem("partner", JSON.stringify({
          ...existing,
          approvalStatus: effectiveStatus,
          status: effectiveStatus,
          accountStatus: effectiveStatus === "approved" ? "active" : existing.accountStatus,
          firstName: normalized.firstName,
          lastName: raw.lastName || existing.lastName || "",
          businessName: normalized.businessName,
        }));

        setIsLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        if (targetStatus === "approved") {
          const existing = JSON.parse(localStorage.getItem("partner") || "{}");
          setProfileData({
            businessName: existing.businessName || existing.username || "Partner",
            firstName: existing.firstName || existing.username || "Partner",
            type: existing.partnerType || "Distributor",
          });
          setIsProfileData(true);
          setAccStatus("approved");
          setCreateBrandProfile(false);
        } else {
          setIsProfileData(false);
          setProfileData({});
          setAccStatus("");
          setCreateBrandProfile(false);
        }
        setIsLoadingProfile(false);
      });
  };

  /**
   * Step 1 of the flow: hit the approvals endpoint first, then branch.
   * For pending AND rejected we still fetch the profile so it can be
   * displayed in read-only mode with a status banner on top.
   */
  const loadApprovalThenProfile = (mailId) => {
    setIsLoadingProfile(true);
    axios
      .get(`${BASE_URL}/api/approvals/status?email=${mailId}&role=Partner`)
      .then((approvalRes) => {
        const liveStatus = approvalRes.data?.data?.status;
        // Grab any rejection reason the admin may have left
        const reason = approvalRes.data?.data?.reason || approvalRes.data?.data?.rejectionReason || "";
        console.log("[search] liveStatus:", liveStatus, "| reason:", reason);

        if (liveStatus === "approved") {
          updateLocalStorage("approved");
          fetchAndShowProfile(mailId, "approved");
        } else if (liveStatus === "rejected") {
          setRejectionReason(reason);
          updateLocalStorage("rejected");
          setCreateBrandProfile(false);
          // Still load the profile so the partner can see what they submitted
          fetchAndShowProfile(mailId, "rejected");
        } else if (liveStatus === "pending") {
          // Verify they actually submitted a profile before locking into pending view
          axios
            .get(`${BASE_URL}/api/partner/get?email=${mailId}`)
            .then((profileRes) => {
              const raw = profileRes.data?.data || {};
              if (profileRes.data?.approvalStatus === "approved" || raw.accountStatus === "active" || raw.status === true) {
                updateLocalStorage("approved");
                setCreateBrandProfile(false);
                fetchAndShowProfile(mailId, "approved");
              } else if (checkIsProfileComplete(raw, profileRes)) {
                updateLocalStorage("pending");
                setCreateBrandProfile(false);
                fetchAndShowProfile(mailId, "pending");
              } else {
                setIsProfileData(false);
                setProfileData({});
                setAccStatus("");
                setCreateBrandProfile(false);
                setIsLoadingProfile(false);
              }
            })
            .catch(() => {
              updateLocalStorage("pending");
              setCreateBrandProfile(false);
              fetchAndShowProfile(mailId, "pending");
            });
        } else {
          // No approval record yet — check whether partner has an approved/active status directly in Partner collection
          axios
            .get(`${BASE_URL}/api/partner/get?email=${mailId}`)
            .then((profileRes) => {
              const raw = profileRes.data?.data || {};
              const isApproved =
                profileRes.data?.approvalStatus === "approved" ||
                raw.accountStatus === "active" ||
                raw.status === true ||
                userDetails?.accountStatus === "active" ||
                userDetails?.approvalStatus === "approved" ||
                userDetails?.status === "approved";

              if (isApproved) {
                console.log("Partner active in DB -> treating as approved");
                updateLocalStorage("approved");
                fetchAndShowProfile(mailId, "approved");
              } else if (checkIsProfileComplete(raw, profileRes)) {
                console.log("Profile found but no approval record -> pending");
                updateLocalStorage("pending");
                fetchAndShowProfile(mailId, "pending");
              } else {
                setIsProfileData(false);
                setProfileData({});
                setAccStatus("");
                setCreateBrandProfile(false);
              }
              setIsLoadingProfile(false);
            })
            .catch(() => {
              setIsProfileData(false);
              setProfileData({});
              setAccStatus("");
              setCreateBrandProfile(false);
              setIsLoadingProfile(false);
            });
        }
      })
      .catch((err) => {
        console.log("Error fetching approval status:", err);
        // Approvals API failed — fall back to checking the partner profile directly
        axios
          .get(`${BASE_URL}/api/partner/get?email=${mailId}`)
          .then((profileRes) => {
            const raw = profileRes.data?.data || {};
            const existingLS = JSON.parse(localStorage.getItem("partner") || "{}");
            const isApproved =
              profileRes.data?.approvalStatus === "approved" ||
              raw.accountStatus === "active" ||
              raw.status === true ||
              existingLS.approvalStatus === "approved" ||
              existingLS.status === "approved";

            if (isApproved) {
              fetchAndShowProfile(mailId, "approved");
            } else if (checkIsProfileComplete(raw, profileRes)) {
              const fallbackStatus = existingLS.approvalStatus || "pending";
              fetchAndShowProfile(mailId, fallbackStatus);
            } else {
              setIsProfileData(false);
              setProfileData({});
              setAccStatus("");
              setCreateBrandProfile(false);
            }
            setIsLoadingProfile(false);
          })
          .catch(() => {
            setIsProfileData(false);
            setProfileData({});
            setAccStatus("");
            setCreateBrandProfile(false);
            setIsLoadingProfile(false);
          });
      });
  };

  /**
   * Main entry-point (replaces the old handleAccountantData).
   * Only "approved" uses a fast path (approved cannot revert).
   * "pending" and "rejected" always do a live approval check so admin
   * actions (approve / reject) are reflected immediately on next page load.
   */
  const handleAccountantData = () => {
    const mailId = userDetails?.email || localStorage.getItem("loginEmail");
    if (!mailId) return;

    const isInternal = userDetails?.creationSource === "admin_created";
    const isAlreadyApproved =
      userDetails?.approvalStatus === "approved" ||
      userDetails?.status === "approved" ||
      userDetails?.accountStatus === "active";

    if (isInternal || isAlreadyApproved) {
      fetchAndShowProfile(mailId, "approved");
    } else {
      // External self-registered partner — check live approval pipeline
      loadApprovalThenProfile(mailId);
    }
  };

  // ─── Everything below is unchanged from the original ──────────────────────

  const uploadBulkPath = async (file) => {
    try {
      setIsUploadLoading(true);
      const text = await file.text();
      const json = JSON.parse(text);
      let { data } = await axios.post(`${BASE_URL}/api/paths/bulk`, json);
      if (data?.status) {
        setIsUploadLoading(false);
        alert("Bulk paths uploaded successfully!");
      } else {
        setIsUploadLoading(false);
        alert("Error uploading");
      }
    } catch (error) {
      setIsUploadLoading(false);
      console.error("Bulk upload error:", error);
    }
  };

  const uploadBulkStep = async (file) => {
    try {
      setIsUploadLoading(true);
      const text = await file.text();
      const records = JSON.parse(text);
      if (!Array.isArray(records) || records.length === 0) {
        alert("JSON must contain an array of records");
        setIsUploadLoading(false);
        return;
      }
      const email = localStorage.getItem("loginEmail");
      if (!email) {
        alert("User email missing. Login again.");
        setIsUploadLoading(false);
        return;
      }
      const body = { email, records };
      const res = await axios.post(`${BASE_URL}/api/steps/bulk`, body);
      if (res.data?.status) {
        alert(`Uploaded ${res.data.count} steps successfully`);
        setpstep(12);
      } else {
        alert("Upload failed, check console");
      }
    } catch (err) {
      console.error("Error uploading bulk steps:", err);
      alert("Bulk upload error. Check console.");
    } finally {
      setIsUploadLoading(false);
    }
  };

  const uploadBulkService = async (file) => {
    try {
      setIsUploadLoading(true);
      const text = await file.text();
      const records = JSON.parse(text);
      if (!Array.isArray(records) || records.length === 0) {
        alert("JSON must contain an array of records");
        setIsUploadLoading(false);
        return;
      }
      const email = JSON.parse(localStorage.getItem("partner"))?.email;
      if (!email) {
        alert("User email missing");
        setIsUploadLoading(false);
        return;
      }
      const body = { email, records };
      const res = await axios.post(`${BASE_URL}/api/services/bulk`, body);
      if (res.data?.status) {
        alert(`Uploaded ${res.data.count} services successfully`);
        setpstep(12);
      } else {
        alert("Upload failed, check console");
      }
    } catch (err) {
      console.error("Error uploading bulk services:", err);
      alert("Bulk upload error. Check console.");
    } finally {
      setIsUploadLoading(false);
    }
  };

  const signJwt = async (fileName, emailDev, secret) => {
    try {
      const jwts = await new jose.SignJWT({ name: fileName, email: emailDev })
        .setProtectedHeader({ alg: "HS512" })
        .setIssuer("gxjwtenchs512")
        .setExpirationTime("10m")
        .sign(new TextEncoder().encode(secret));
      return jwts;
    } catch (error) {
      console.log(error, "kjbedkjwebdw");
    }
  };

  useEffect(() => {
    axios.get(`${BASE_URL}/api/paths/active`).then((res) => {
      let result = res?.data?.data;
      setBackupPathList(result);
    });
  }, []);

  const addBackupPath = (backupPathId, selectedStepId) => {
    pathSteps?.the_ids.map((item) => {
      if (item.step_id === selectedStepId) {
        item.backup_pathId = backupPathId;
      }
    });
    setShowBackupPathList(false);
  };

  function renameFile(originalFile, newName) {
    return new File([originalFile], newName, {
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    });
  }

  const getActiveSteps = () => {
    setLoading(true);
    const email = userDetails?.email || localStorage.getItem("loginEmail");
    axios
      .get(`${BASE_URL}/api/steps?path_id=selectedPathId`)
      .then((response) => {
        let result = response?.data?.data;
        setPartnerStepsData(result || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching partner steps:", error.response?.data || error.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log("Updated partnerStepsData:", partnerStepsData);
  }, [partnerStepsData]);

  const handleGrade = (item) => {
    if (grade.includes(item)) setGrade(grade.filter((o) => o !== item));
    else setGrade([...grade, item]);
  };

  const handleGradeAvg = (item) => {
    if (gradeAvg.includes(item)) setGradeAvg(gradeAvg.filter((o) => o !== item));
    else setGradeAvg([...gradeAvg, item]);
  };

  const handleCurriculum = (item) => {
    if (curriculum.includes(item)) setCurriculum(curriculum.filter((o) => o !== item));
    else setCurriculum([...curriculum, item]);
  };

  const handleStream = (item) => {
    if (stream.includes(item)) setStream(stream.filter((o) => o !== item));
    else setStream([...stream, item]);
  };

  const handleFinance = (item) => {
    if (finance.includes(item)) setFinance(finance.filter((o) => o !== item));
    else setFinance([...finance, item]);
  };

  const handlePersonality = (item) => setPersonality(item);

  const handleFollowerPerAccountants = () => {
    setIsLoading(true);
    GetFollowersPerAccount()
      .then((res) => {
        let result = res.data;
        if (result.status) {
          setfollowCount(result.data.count);
          setfollowData(result.data.followers);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        toast.error("Something Went Wrong!", { position: toast.POSITION.TOP_RIGHT });
      });
  };

  const handleAllCustomerLicenses = () => {
    const userDetails = JSON.parse(localStorage.getItem("partner"));
    setIsPurchaseLoading(true);
    GetAllCustomerLicenses(userDetails.email)
      .then((res) => {
        let result = res.data;
        if (result.status) {
          setPurchaseData(result.licenses);
          setIsPurchaseLoading(false);
        }
      })
      .catch(() => setIsPurchaseLoading(false));
  };

  const handleCategories = () => {
    setIsCatLoading(true);
    GetCategoriesAcc()
      .then((res) => {
        let result = res.data;
        if (result.status) {
          setcategoriesData(result.categories);
          setIsCatLoading(false);
        }
      })
      .catch((err) => {
        setIsCatLoading(false);
        toast.error("Something Went Wrong!", { position: toast.POSITION.TOP_RIGHT });
      });
  };

  const handleGetCurrencies = () => {
    setIsCurrencies(true);
    GetAllCurrencies()
      .then((res) => {
        let result = res.data;
        if (result.status) {
          setallCurrencies(result.coins);
          setIsCurrencies(false);
        }
      })
      .catch((err) => {
        setIsCurrencies(false);
        toast.error("Something Went Wrong!", { position: toast.POSITION.TOP_RIGHT });
      });
  };

  const resetpop = () => {
    setispopular(false);
    setpstep(1);
    setbillingType("");
    setselectNew("");
    setselectCategory("");
    setcategoriesData([]);
    setSearch("");
    setSelectedCurrency({});
    setServiceNameInput("");
    setServiceCodeInput("");
    setProductLabel("");
    setServiceTagline("");
    setServiceDescription("");
    setfirstMonthPrice("");
    setmonthlyPrice("");
    setgracePeriod("");
    setsecondChargeAttempt("");
    setthirdChargeAttempt("");
    setCoverImageS3url("");
    setImage(null);
    setPathSteps({
      email: userDetails?.email,
      nameOfPath: "",
      description: "",
      length: "",
      path_type: "",
      the_ids: [],
      destination_institution: "",
    });
    setSelectedSteps([]);
    setGrade([]);
    setGradeAvg([]);
    setCurriculum([]);
    setStream([]);
    setFinance([]);
    setPersonality("");
    setSearchCurrency("");
    setIsSubmit(false);
  };

  const handleLogout = () => {
    import('../../components/LogoutModal/LogoutManager').then(({ triggerLogout }) => {
      triggerLogout(() => {
    localStorage.removeItem("partner");
    localStorage.removeItem("loginEmail");
    navigate("/login");
});
    });  };

  const handleServicesForLogged = () => {
    setIsServicesAcc(true);
    GetLogServices()
      .then((res) => {
        let result = res.data;
        if (result.status) {
          setservicesAcc(result.products);
          setIsServicesAcc(false);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsServicesAcc(false);
      });
  };

  const fileInputRef = useRef(null);

  const handleImageClick = () => fileInputRef.current.click();

  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const uploadedUrl = await uploadImageFunc(e, setImage, setLoading);
    if (uploadedUrl) setImage(uploadedUrl);
  };

  const handleFileInputChange1 = (e) => {
    setImage(e.target.files[0]);
    uploadBulkPath(e.target.files[0]);
  };

  const handleFileInputChange2 = (e) => {
    setImage(e.target.files[0]);
    uploadBulkStep(e.target.files[0]);
  };

  const handleFileInputChange3 = (e) => {
    setImage(e.target.files[0]);
    uploadBulkService(e.target.files[0]);
  };

  const myTimeoutService = () => setTimeout(reloadService, 3000);

  function reloadService() {
    setispopular(false);
    setpstep(1);
    navigate('/dashboard/accountants');
    setaccsideNav("My Services");
    setservicesMenu("Services");
  }

  const handleFinalSubmit = () => {
    setIsSubmit(true);
    let userDetails = JSON.parse(localStorage.getItem("partner"));
    let objmonthly = {
      productcreatoremail: userDetails.email,
      token: userDetails.idToken,
      product_code: serviceCodeInput,
      product_name: serviceNameInput,
      product_icon: image,
      revenue_account: userDetails.email,
      client_app: "naavi",
      product_category_code: "CoE",
      sub_category_code: "",
      custom_product_label: productLabel,
      points_creation: false,
      sub_text: serviceTagline,
      full_description: serviceDescription,
      first_purchase: {
        price: firstMonthPrice !== "" ? parseFloat(firstMonthPrice) : 0,
        coin: selectedCurrency.coinSymbol,
      },
      billing_cycle: {
        monthly: {
          price: billingType === "One Time"
            ? firstMonthPrice !== "" ? parseFloat(firstMonthPrice) : 0
            : monthlyPrice !== "" ? parseFloat(monthlyPrice) : 0,
          coin: selectedCurrency.coinSymbol,
        },
      },
      grace_period: billingType === "One Time" ? 0 : gracePeriod !== "" ? parseFloat(gracePeriod) : 0,
      first_retry: billingType === "One Time" ? 0 : secondChargeAttempt !== "" ? parseFloat(secondChargeAttempt) : 0,
      second_retry: billingType === "One Time" ? 0 : thirdChargeAttempt !== "" ? parseFloat(thirdChargeAttempt) : 0,
      staking_allowed: false,
      staking_details: {},
    };

    let objone = {
      ...objmonthly,
      billing_cycle: {
        lifetime: {
          price: billingType === "One Time"
            ? firstMonthPrice !== "" ? parseFloat(firstMonthPrice) : 0
            : monthlyPrice !== "" ? parseFloat(monthlyPrice) : 0,
          coin: selectedCurrency.coinSymbol,
        },
      },
    };

    let obj = billingType === "One Time" ? objone : objmonthly;
    CreatePopularService(obj)
      .then((res) => {
        let result = res.data;
        if (result.status) {
          myTimeoutService();
          setpstep(7);
          setbillingType(""); setselectNew(""); setselectCategory("");
          setcategoriesData([]); setSearch(""); setSelectedCurrency({});
          setServiceNameInput(""); setServiceCodeInput(""); setProductLabel("");
          setServiceTagline(""); setServiceDescription("");
          setfirstMonthPrice(""); setmonthlyPrice(""); setgracePeriod("");
          setsecondChargeAttempt(""); setthirdChargeAttempt("");
          setIsSubmit(false); setImage(null);
        }
      })
      .catch(() => setIsSubmit(false));
  };

  useEffect(() => {
    setaccsideNav("");
    resetpop();
    handleAccountantData(); // ← uses the new approval-aware flow
  }, []);

  const myTimeout1 = () => setTimeout(reload1, 3000);

  function reload1() {
    setCreateBrandProfile(false);
    setCreateBrandProfileStep(1);
    setProfilePicture("");
    setFirstName(""); setLastName(""); setUserName("");
    setCoverPhoto1(""); setBrandDisplayName(""); setBrandUserName("");
    setBrandDescription(""); setBrandColorCode(""); setHeadquarter("");
    setBrandAddress(""); setWhiteProPic("");
    handleAccountantData();
  }

  const createPartnerProfile = () => {
    let email = userDetails?.email || localStorage.getItem("loginEmail");
    if (!email) return;

    const bNameVal = validateBusinessName(businessName);
    if (!bNameVal.isValid) {
      toast.error(bNameVal.message);
      return;
    }

    const pinVal = validatePostalCode(pinCode, businessCountry);
    if (!pinVal.isValid) {
      toast.error(pinVal.message);
      return;
    }

    const webVal = validateWebsite(website);
    if (!webVal.isValid) {
      toast.error(webVal.message);
      return;
    }

    const firstVal = validatePersonName(firstName, "First Name");
    if (!firstVal.isValid) {
      toast.error(firstVal.message);
      return;
    }
    const lastVal = validatePersonName(lastName, "Last Name");
    if (!lastVal.isValid) {
      toast.error(lastVal.message);
      return;
    }

    const fullPhoneNumber = phone ? `${currentPhoneCountry.code} ${phone}` : "";

    axios.put(`${BASE_URL}/api/partner/add`, {
      email, firstName, lastName, businessName,
      phone, phoneNumber: fullPhoneNumber || phone,
      countryCode: currentPhoneCountry.code,
      phoneCountryIso: selectedPhoneIso,
      logo: businessLogo, street, city,
      state: businessState, pincode: pinCode,
      country: businessCountry, description: businessDesc,
      website, type: businessType, yourPosition: position,
    })
      .then(({ data }) => {
        if (data.success) {
          // Populate profileData immediately from form values so the
          // pending read-only view renders without a second API call.
          const freshProfile = {
            email,
            firstName,
            lastName,
            businessName,
            phone,
            phoneNumber: fullPhoneNumber || phone,
            countryCode: currentPhoneCountry.code,
            logo: businessLogo,
            street,
            city,
            state: businessState,
            pincode: pinCode,
            country: businessCountry,
            description: businessDesc,
            website,
            type: businessType,
            yourPosition: position,
          };
          setProfileData(freshProfile);
          setIsProfileData(true);
          setAccStatus("pending");
          // Write pending + businessName so sidebar shows correct name
          // immediately and survives logout/re-login
          const existingLS = JSON.parse(localStorage.getItem("partner") || "{}");
          localStorage.setItem("partner", JSON.stringify({
            ...existingLS,
            approvalStatus: "pending",
            firstName: firstName || existingLS.firstName,
            lastName: lastName || existingLS.lastName,
            businessName: businessName || existingLS.businessName,
          }));
          setCreateBrandProfile(false);
        }
      })
      .catch(err => console.error("Profile creation error:", err));
  };

  const createBankerProfile = () => {
    setIsloading(true);
    let email = userDetails?.user?.email;
    let token = userDetails?.idToken;
    axios
      .post(
        `${BASE_URL}/lxUser/register/banker`,
        {
          bankerTag: brandUserName, colorCode: brandColorCode,
          address: brandAddress, coverPicURL: coverPhoto1,
          displayName: brandDisplayName, description: brandDescription,
          partneringInstitutions: [], country: headquarter,
          profilePicURL: profilePicture, profilePicPNG: profilePicture,
          profilePicWhite: whiteProPic, profilePicWhitePNG: whiteProPic,
          autoDeposit: false, sefcoin_cashback: false, other_data: {},
        },
        { headers: { email, token } }
      )
      .then(() => {
        setIsloading(false);
        setCreateBrandProfileStep(3);
      })
      .catch((error) => console.log(error, "error in createBankerProfile"));
  };

  const changeStatus = (value) => {
    setChanging(true);
    let email = userDetails?.email;
    axios
      .post(
        `${BASE_URL}/banker/assignCategory`,
        { categoryName: value === "Public" ? "education consultants" : "marketmakers", email },
        { headers: { email, token: userDetails?.idToken } }
      )
      .then((response) => {
        let result = response?.data;
        if (result?.status) { setAccStatus(value); setChanging(false); }
        else setChanging(false);
      })
      .catch(() => setChanging(false));
  };

  const myTimeout = () => setTimeout(reload, 2000);

  function reload() {
    if (editAddress) { setEditAddress(false); setNewAddress(""); }
    else if (editDisplayName) { setEditDisplayName(false); setNewDisplayName(""); }
    else if (editDescription) { setEditDescription(false); setNewDescription(""); }
    else if (editPhoneNo) { setEditPhoneNo(false); setNewPhoneNo(""); }
    else if (editColorCode) { setEditColorCode(false); setNewColorCode(""); }
    else if (editCountry) { setEditCountry(false); setNewCountry(""); }
    else if (editCoverPic) { setEditCoverPic(false); setNewCoverPic(""); }
    else if (editProfilePic) { setEditProfilePic(false); setNewProfilePic(""); }
    handleAccountantData();
  }

  const editData = async (field, value) => {
    setLoading(true);
    let email = userDetails?.email;
    let token = userDetails?.idToken;
    try {
      let result = await axios.put(
        `${BASE_URL}/lxUser/update/banker`,
        { [field]: value },
        { headers: { token, email } }
      );
      if (result?.data?.status) { myTimeout(); setLoading(false); }
      else setLoading(false);
    } catch (error) {
      console.log(error, "error in editData");
    }
  };

  const handleChangeAccDashsidebar = () => {
    if (showDrop) setShowDrop(false);
  };

  useEffect(() => {
    let email = userDetails?.email;
    axios
      .get(`${BASE_URL}/api/steps/get?email=${email}`)
      .then((response) => setAllSteps(response?.data?.data))
      .catch((error) => console.log(error, "error in fetching all steps accprofile"));
  }, []);

  const pathSubmission = () => {
    setCreatingPath(true);
    axios
      .post(`${BASE_URL}/api/paths/add`, {
        ...pathSteps,
        performance: gradeAvg, curriculum, grade, stream,
        financialSituation: finance,
        personality: Array.isArray(personality) ? personality.join(', ') : (personality || ''),
        the_ids: pathSteps.the_ids.map(step => ({
          step_id: step.step_id, stepName: step.stepName,
          stepDescription: step.stepDescription, backup_pathId: step.backup_pathId,
          backupPathName: step.backupPathName, backupPathDescription: step.backupPathDescription,
        })),
      })
      .then((response) => {
        if (response?.data?.status) { setCreatingPath(false); window.location.reload(); }
        else setCreatingPath(false);
      })
      .catch(() => setCreatingPath(false));
  };

  const removeStep = (stepId) => {
    setSelectedSteps(selectedSteps.filter((step) => step._id !== stepId));
    setPathSteps({ ...pathSteps, the_ids: pathSteps?.the_ids?.filter((obj) => obj.step_id !== stepId) });
  };


  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* ── MOBILE TOPBAR ── only visible on ≤768px via CSS when sidebar is closed ── */}
      {!sidebarOpen && (
        <div className="mobile-topbar">
          <div className="mobile-topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Open menu"
              title="Open menu"
              type="button"
            >
              {/* Hamburger icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-main" style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.3)",
              zIndex: 1000,
              pointerEvents: "all",
            }}
          />
        )}
        <div className="dashboard-body">
          <div>
            <AccDashsidebar
              handleChangeAccDashsidebar={handleChangeAccDashsidebar}
              accStatus={accStatus}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
          <div className="dashboard-screens" onClick={() => resetpop()} style={{ background: "#F8FAFC" }}>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", height: "100%" }}>
              <MenuNav
                showDrop={showDrop}
                setShowDrop={setShowDrop}
                searchPlaceholder="Search..."
                hideSearch={true}
              />

              {/* ── PROFILE LOADING STATE ── */}
              {isLoadingProfile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                  <LoadingAnimation1 icon={lg1} width={160} />
                </div>

                /* ── APPROVED: show full profile ── */
              ) : (isProfileData || accStatus === "approved") && accStatus === "approved" ? (
                <div className="profile-modern-container" style={{
                  maxWidth: "100%", width: "100%", padding: "20px 28px",
                  boxSizing: "border-box", overflowY: "auto", flex: 1, minHeight: 0,
                  scrollbarWidth: "none", msOverflowStyle: "none",
                }}>

                  {/* ── Page Header: Title + Pastel Edit Button ── */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Avatar */}
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "10px",
                        background: "#fff", border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden", flexShrink: 0,
                      }}>
                        <img
                          src={profileData?.logo}
                          alt={profileData?.businessName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentNode.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)";
                            e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700">${(profileData?.businessName || "P").charAt(0).toUpperCase()}</div>`;
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                            {profileData?.businessName || "Your Profile"}
                          </h1>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: "3px",
                            padding: "2px 7px", background: "#ecfdf5", borderRadius: "4px",
                            fontSize: "11px", fontWeight: "600", color: "#059669",
                          }}>
                            <CheckIcon /><span>Verified</span>
                          </div>
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: "400" }}>
                          View and manage your business profile details
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => { setEditMode("all"); setEditValue({}); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        padding: "6px 14px", background: "#e0f2fe",
                        border: "1px solid #93c5fd", borderRadius: "6px",
                        color: "#1d4ed8", fontWeight: "600", fontSize: "12px",
                        cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.target.style.background = "#bae6fd"; e.target.style.borderColor = "#60a5fa"; }}
                      onMouseLeave={e => { e.target.style.background = "#e0f2fe"; e.target.style.borderColor = "#93c5fd"; }}
                    >
                      <EditIcon /> Edit Profile
                    </button>
                  </div>

                  {/* ── Section 1: Business & Company Information ── */}
                  <div style={{
                    background: "#ffffff", borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "14px", overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fafafa",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Business & Company Information</span>
                      <span style={{
                        fontSize: "11px", fontWeight: "500", color: "#475569",
                        background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px",
                      }}>{profileData?.type || "Business"}</span>
                    </div>

                    <div style={{ padding: "16px 18px 6px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "14px" }}>
                        {[
                          { label: "Business Name", value: profileData?.businessName, field: "businessName" },
                          { label: "Email Address", value: userDetails?.email, field: null },
                        ].map((item) => (
                          <div key={item.label}>
                            <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>{item.label}</div>
                            {editMode === "all" && item.field ? (
                              <input defaultValue={item.value || ""} onChange={e => setEditValue(prev => ({ ...prev, [item.field]: e.target.value }))} style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", border: "none", borderBottom: "1px solid #cbd5e1", padding: "4px 0", width: "100%", outline: "none", background: "transparent" }} />
                            ) : (
                              <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px", wordBreak: "break-all" }}>{item.value || "—"}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>Website</div>
                        {editMode === "all" ? (
                          <input defaultValue={profileData?.website || ""} onChange={e => setEditValue(prev => ({ ...prev, website: e.target.value }))} style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", border: "none", borderBottom: "1px solid #cbd5e1", padding: "4px 0", width: "100%", outline: "none", background: "transparent" }} />
                        ) : (
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px", wordBreak: "break-all" }}>{profileData?.website || "—"}</div>
                        )}
                      </div>

                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>Description</div>
                        {editMode === "all" ? (
                          <textarea
                            defaultValue={profileData?.description || ""}
                            onChange={e => setEditValue(prev => ({ ...prev, description: e.target.value }))}
                            style={{ fontSize: "13px", color: "#0f172a", lineHeight: "1.5", border: "none", borderBottom: "1px solid #cbd5e1", padding: "4px 0", width: "100%", outline: "none", resize: "vertical", minHeight: "50px", background: "transparent" }}
                          />
                        ) : (
                          <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{profileData?.description || "—"}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: Personal Information ── */}
                  <div style={{
                    background: "#ffffff", borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "14px", overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fafafa",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Personal Information</span>
                    </div>

                    <div style={{ padding: "16px 18px 6px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "14px" }}>
                        {[
                          { label: "First Name", value: profileData?.firstName, field: "firstName" },
                          { label: "Last Name", value: profileData?.lastName, field: "lastName" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>{item.label}</div>
                            {editMode === "all" && item.field ? (
                              <input defaultValue={item.value || ""} onChange={e => setEditValue(prev => ({ ...prev, [item.field]: e.target.value }))} style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", border: "none", borderBottom: "1px solid #cbd5e1", padding: "4px 0", width: "100%", outline: "none", background: "transparent" }} />
                            ) : (
                              <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{item.value || "—"}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "14px" }}>
                        {[
                          { label: "Position", value: profileData?.yourPosition, field: "yourPosition" },
                          { label: "Phone Number", value: profileData?.phone || profileData?.phoneNumber, field: "phone" },
                          { label: "Country", value: profileData?.country, field: "country" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>{item.label}</div>
                            {editMode === "all" && item.field ? (
                              <input
                                defaultValue={item.value || ""}
                                type={item.field === "phone" ? "tel" : "text"}
                                inputMode={item.field === "phone" ? "numeric" : undefined}
                                maxLength={item.field === "phone" ? 10 : undefined}
                                onChange={e => {
                                  let val = e.target.value;
                                  if (item.field === "phone") {
                                    val = val.replace(/\D/g, "").slice(0, 10);
                                    e.target.value = val;
                                  }
                                  setEditValue(prev => ({
                                    ...prev,
                                    [item.field]: val,
                                    ...(item.field === "phone" ? { phoneNumber: val } : {})
                                  }));
                                }}
                                style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", border: "none", borderBottom: "1px solid #cbd5e1", padding: "4px 0", width: "100%", outline: "none", background: "transparent" }}
                              />
                            ) : (
                              <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{item.value || "—"}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Location & Address ── */}
                  <div style={{
                    background: "#ffffff", borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "20px", overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fafafa",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Location & Address</span>
                    </div>

                    <div style={{ padding: "16px 18px 6px" }}>
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>Street Address</div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{profileData?.street || "—"}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "14px" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>City</div>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{profileData?.city || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>State</div>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{profileData?.state || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "500", color: "#64748b", marginBottom: "3px" }}>PIN Code</div>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>{profileData?.pincode || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save / Cancel Buttons */}
                  {editMode === "all" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", gap: "8px" }}>
                      <button
                        onClick={() => { setEditMode(null); setEditValue({}); }}
                        style={{ padding: "7px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.15s ease" }}
                        onMouseEnter={e => { e.target.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { e.target.style.background = "#fff"; }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const email = userDetails?.email;
                          const updates = editValue || {};
                          if (updates.firstName !== undefined) {
                            const fnRes = validatePersonName(updates.firstName, "First name");
                            if (!fnRes.isValid) {
                              toast.error(fnRes.message);
                              return;
                            }
                          }
                          if (updates.lastName !== undefined) {
                            const lnRes = validatePersonName(updates.lastName, "Last name");
                            if (!lnRes.isValid) {
                              toast.error(lnRes.message);
                              return;
                            }
                          }
                          axios.put(`${BASE_URL}/api/partner/add`, { email, ...updates })
                            .then(({ data }) => {
                              if (data.success) {
                                setEditMode(null);
                                setEditValue({});
                                handleAccountantData();
                                toast.success("Profile has been updated!", { position: toast.POSITION.TOP_RIGHT, autoClose: 3000 });
                              }
                            })
                            .catch(err => console.error("Update error:", err));
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "7px 16px",
                          background: "#e0f2fe", border: "1px solid #93c5fd",
                          borderRadius: "6px", color: "#1d4ed8", fontWeight: "600", fontSize: "12px",
                          cursor: "pointer", transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.target.style.background = "#bae6fd"; }}
                        onMouseLeave={e => { e.target.style.background = "#e0f2fe"; }}
                      >
                        <EditIcon /> Save Changes
                      </button>
                    </div>
                  )}
                </div>

                /* ── PENDING: profile visible in read-only + yellow banner ── */
              ) : accStatus === "pending" && isProfileData ? (
                <div className="profile-modern-container" style={{
                  maxWidth: "100%", width: "100%", padding: "20px 28px",
                  boxSizing: "border-box", overflowY: "auto", flex: 1, minHeight: 0,
                  scrollbarWidth: "none", msOverflowStyle: "none",
                }}>

                  {/* ── Pending status banner ── */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 20px", marginBottom: "20px",
                    background: "#fffbeb", borderRadius: "12px",
                    border: "1px solid #fde68a",
                  }}>
                    <div style={{ color: "#f59e0b", flexShrink: 0 }}><ClockIcon /></div>
                    <div>
                      <div style={{ fontWeight: "700", color: "#92400e", fontSize: "14px" }}>
                        Profile Under Review
                      </div>
                      <div style={{ fontSize: "13px", color: "#b45309", marginTop: "2px" }}>
                        Your profile has been submitted and is awaiting admin approval. All fields are read-only until approved. This usually takes 1–2 business days.
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner — no Edit button */}
                  <div className="profile-header-banner">
                    <div className="profile-cover" />
                    {/* Avatar */}
                    <div className="profile-avatar-wrapper">
                      <img
                        src={profileData?.logo}
                        alt={profileData?.businessName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentNode.style.background = "linear-gradient(135deg, #9ca3af, #6b7280)";
                          e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">${(profileData?.businessName || "P").charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Name + pending badge */}
                  <div className="profile-header-info">
                    <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1f36", margin: 0 }}>
                      {profileData?.businessName}
                    </h1>
                    <span style={{ fontSize: "13px", color: "#718096" }}>
                      {profileData?.type || "Business"}
                    </span>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "3px 10px", background: "#fffbeb", borderRadius: "20px",
                      fontSize: "12px", fontWeight: "600", color: "#92400e",
                      border: "1px solid #fde68a",
                    }}>
                      <ClockIcon /><span>Pending Approval</span>
                    </div>
                  </div>

                  {/* Read-only profile details card */}
                  <div className="profile-details-card">
                    <div className="profile-grid-4col">
                      {[
                        { label: "Business Name", value: profileData?.businessName },
                        { label: "Business Type", value: profileData?.type },
                        { label: "Website", value: profileData?.website },
                        { label: "Email", value: userDetails?.email },
                      ].map((item) => (
                        <div key={item.label} className="profile-cell">
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                          <span style={{ fontSize: "14px", fontWeight: "500", color: "#1a1f36", wordBreak: "break-word" }}>{item.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="profile-grid-5col">
                      {[
                        { label: "First Name", value: profileData?.firstName },
                        { label: "Last Name", value: profileData?.lastName },
                        { label: "Position", value: profileData?.yourPosition },
                        { label: "Phone Number", value: profileData?.phone || profileData?.phoneNumber },
                        { label: "Country", value: profileData?.country },
                      ].map((item) => (
                        <div key={item.label} className="profile-cell">
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                          <span style={{ fontSize: "14px", fontWeight: "500", color: "#1a1f36", wordBreak: "break-word" }}>{item.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="profile-grid-2col">
                      <div className="profile-cell">
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Description</div>
                        <span style={{ fontSize: "14px", color: "#1a1f36", lineHeight: "1.6", wordBreak: "break-word" }}>{profileData?.description || "—"}</span>
                      </div>
                      <div className="profile-cell">
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Address</div>
                        <div style={{ fontSize: "14px", color: "#1a1f36", lineHeight: "1.7", wordBreak: "break-word" }}>
                          <div>{profileData?.street || "—"}</div>
                          <div>{[profileData?.city, profileData?.state].filter(Boolean).join(", ")}</div>
                          <div>{[profileData?.country, profileData?.pincode].filter(Boolean).join(" ")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                /* ── REJECTED: profile visible in read-only + red banner with reason ── */
              ) : accStatus === "rejected" && isProfileData ? (
                <div className="profile-modern-container" style={{
                  maxWidth: "100%", width: "100%", padding: "20px 28px",
                  boxSizing: "border-box", overflowY: "auto", flex: 1, minHeight: 0,
                  scrollbarWidth: "none", msOverflowStyle: "none",
                }}>

                  {/* ── Rejection banner with reason ── */}
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "14px 20px", marginBottom: "20px",
                    background: "#fef2f2", borderRadius: "12px",
                    border: "1px solid #fecaca",
                  }}>
                    <div style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}><XCircleIcon /></div>
                    <div>
                      <div style={{ fontWeight: "700", color: "#991b1b", fontSize: "14px" }}>
                        Application Not Approved
                      </div>
                      <div style={{ fontSize: "13px", color: "#b91c1c", marginTop: "4px" }}>
                        {rejectionReason
                          ? <><strong>Reason: </strong>{rejectionReason}</>
                          : "Your application was not approved. Please contact support@naavi.com for more information."
                        }
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner — no Edit button, greyed out */}
                  <div className="profile-header-banner">
                    <div className="profile-cover" style={{ background: "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)" }} />
                    <div className="profile-avatar-wrapper">
                      <img
                        src={profileData?.logo}
                        alt={profileData?.businessName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentNode.style.background = "linear-gradient(135deg, #f87171, #ef4444)";
                          e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">${(profileData?.businessName || "P").charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Name + rejected badge */}
                  <div className="profile-header-info">
                    <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1f36", margin: 0 }}>
                      {profileData?.businessName}
                    </h1>
                    <span style={{ fontSize: "13px", color: "#718096" }}>{profileData?.type || "Business"}</span>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "3px 10px", background: "#fef2f2", borderRadius: "20px",
                      fontSize: "12px", fontWeight: "600", color: "#991b1b",
                      border: "1px solid #fecaca",
                    }}>
                      <XCircleIcon /><span>Not Approved</span>
                    </div>
                  </div>

                  {/* Read-only profile details card */}
                  <div className="profile-details-card" style={{ borderColor: "#fee2e2", opacity: 0.85 }}>
                    <div className="profile-grid-4col">
                      {[
                        { label: "Business Name", value: profileData?.businessName },
                        { label: "Business Type", value: profileData?.type },
                        { label: "Website", value: profileData?.website },
                        { label: "Email", value: userDetails?.email },
                      ].map((item) => (
                        <div key={item.label} className="profile-cell">
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                          <span style={{ fontSize: "14px", fontWeight: "500", color: "#1a1f36", wordBreak: "break-word" }}>{item.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="profile-grid-4col">
                      {[
                        { label: "First Name", value: profileData?.firstName },
                        { label: "Last Name", value: profileData?.lastName },
                        { label: "Position", value: profileData?.yourPosition },
                        { label: "Country", value: profileData?.country },
                      ].map((item) => (
                        <div key={item.label} className="profile-cell">
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                          <span style={{ fontSize: "14px", fontWeight: "500", color: "#1a1f36", wordBreak: "break-word" }}>{item.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="profile-grid-2col">
                      <div className="profile-cell">
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Description</div>
                        <span style={{ fontSize: "14px", color: "#1a1f36", lineHeight: "1.6", wordBreak: "break-word" }}>{profileData?.description || "—"}</span>
                      </div>
                      <div className="profile-cell">
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Address</div>
                        <div style={{ fontSize: "14px", color: "#1a1f36", lineHeight: "1.7", wordBreak: "break-word" }}>
                          <div>{profileData?.street || "—"}</div>
                          <div>{[profileData?.city, profileData?.state].filter(Boolean).join(", ")}</div>
                          <div>{[profileData?.country, profileData?.pincode].filter(Boolean).join(" ")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                /* ── NO PROFILE YET: show create form trigger ── */
              ) : (
                <div className="create-profile-prompt">
                  <div className="prompt-card">
                    <h2>Create Your Partner Profile</h2>
                    <p>Get started by setting up your business profile on Naavi</p>
                    <button className="prompt-btn" onClick={() => setCreateBrandProfile(true)}>
                      Create Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {ispopular && accStatus === "approved" && (
        <>
          {/* BLUR OVERLAY */}
          <div
            onClick={() => resetpop()}
            style={{
              position: "fixed",
              inset: 0,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              background: "rgba(0, 0, 0, 0.25)",
              zIndex: 998,
            }}
          />

          <div
            className="acc-popular"
            onClick={() => setShowDrop(false)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="acc-popular-top">
              <div className="acc-popular-head">
                {pstep > 1 && pstep < 8 ? "New Service" : "Popular Actions"}
              </div>
              <div
                className="acc-popular-img-box"
                onClick={() => resetpop()}
                style={{ cursor: "pointer" }}
              >
                <img className="acc-popular-img" src={closepop} alt="" />
              </div>
            </div>

            <>
              {pstep === 1 ? (
                <div>
                  <div>
                    {/* <SvgCheckCircle size={14} /> UPDATED: Service */}
                    <div
                      className="acc-step-box"
                      onClick={() => {
                        setselectNew("Service");
                        setispopular(false);
                        navigate("/dashboard/accountants", {
                          state: { openCreateService: true },
                        });
                      }}
                    >
                      Service
                    </div>

                    {/* <SvgCheckCircle size={14} /> UPDATED: Path */}
                    <div
                      className="acc-step-box"
                      onClick={() => {
                        setselectNew("Path");
                        setispopular(false);
                        navigate("/dashboard/accountants", {
                          state: { openCreatePath: true },
                        });
                      }}
                    >
                      Path
                    </div>

                    {/* <SvgCheckCircle size={14} /> UPDATED: Bulk Service */}
                    <div
                      className="acc-step-box"
                      onClick={() => {
                        setselectNew("Bulk Service");
                        setpstep(13);
                      }}
                    >
                      Bulk Service
                    </div>

                    {/* <SvgCheckCircle size={14} /> UPDATED: Bulk Path */}
                    <div
                      className="acc-step-box"
                      onClick={() => {
                        setselectNew("Bulk Path");
                        setpstep(10);
                      }}
                    >
                      Bulk Path
                    </div>

                    {/* <SvgCheckCircle size={14} /> UPDATED: Bulk Step */}
                    <div
                      className="acc-step-box"
                      onClick={() => {
                        setselectNew("Bulk Step");
                        setpstep(11);
                      }}
                    >
                      Bulk Step
                    </div>
                  </div>
                </div>
              ) : pstep === 10 ? (
                <div>
                  <div className="acc-step-text">Bulk Path Action</div>
                  <div>
                    <div className="acc-step-box" onClick={() => handleDownload("Path")}>
                      Download
                    </div>
                    <div className="acc-step-box" onClick={handleImageClick}>
                      Upload
                      <input
                        type="file"
                        onChange={handleFileInputChange1}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                      />
                    </div>
                  </div>
                  <div className="goBack" onClick={() => setpstep(1)}>
                    Go Back
                  </div>
                </div>
              ) : pstep === 11 ? (
                <div>
                  <div className="acc-step-text">Bulk Step Action</div>
                  <div>
                    <div className="acc-step-box" onClick={() => handleDownload("Step")}>
                      Download
                    </div>
                    <div className="acc-step-box" onClick={handleImageClick}>
                      Upload
                      <input
                        type="file"
                        onChange={handleFileInputChange2}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                      />
                    </div>
                  </div>
                  <div className="goBack" onClick={() => setpstep(1)}>
                    Go Back
                  </div>
                </div>
              ) : pstep === 13 ? (
                <div>
                  <div className="acc-step-text">Bulk Service Action</div>
                  <div>
                    <div className="acc-step-box" onClick={() => handleDownload("Service")}>
                      Download
                    </div>
                    <div className="acc-step-box" onClick={handleImageClick}>
                      Upload
                      <input
                        type="file"
                        onChange={handleFileInputChange3}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                      />
                    </div>
                  </div>
                  <div className="goBack" onClick={() => setpstep(1)}>
                    Go Back
                  </div>
                </div>
              ) : pstep === 12 ? (
                <div>
                  <div className="acc-step-text">Uploaded Successfully</div>
                  <div className="goBack" onClick={() => { setpstep(1); setbillingType(""); }}>
                    Go Back
                  </div>
                </div>
              ) : null}
            </>
          </div>
        </>
      )}


      {/* ── Create Brand Profile Modal ── */}
      {createBrandProfile && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setCreateBrandProfile(false)}
            style={{
              position: "fixed",
              inset: 0,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              background: "rgba(15, 23, 42, 0.45)",
              zIndex: 999,
              transition: "all 0.3s ease"
            }}
          />

          <div className="popularS partner-create-modal">
            {createBrandProfileStep === 1 && (
              <>
                <div className="head-txt partner-modal-header" style={{ margin: 0, paddingBottom: "1rem" }}>
                  <div className="partner-modal-header-text">
                    <div className="partner-modal-title" style={{ fontSize: "1.35rem", fontWeight: "700", color: "#1e293b" }}>Create Partner Profile</div>
                    <div className="partner-modal-subtitle" style={{ fontSize: "0.82rem", fontWeight: "400", color: "#64748b", marginTop: "2px" }}>
                      Fill in your business details to complete partner onboarding
                    </div>
                  </div>
                  <div
                    onClick={() => { setCreateBrandProfile(false); setUserName(""); setLastName(""); setFirstName(""); setProfilePicture(""); }}
                    className="close-div"
                    aria-label="Close"
                  >
                    <img src={close} alt="close" className="partner-close-img-desktop" style={{ width: "14px", height: "14px" }} />
                    <svg
                      className="partner-close-svg-mobile"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const bNameRes = validateBusinessName(businessName);
                    if (!bNameRes.isValid) {
                      toast.error(bNameRes.message);
                      return;
                    }
                    if (!businessType) {
                      toast.error("Please select a business type (*)");
                      return;
                    }
                    if (!businessLogo) {
                      toast.error("Please upload a company logo (*)");
                      return;
                    }
                    if (!businessCountry) {
                      toast.error("Please select your country (*)");
                      return;
                    }
                    const pinRes = validatePostalCode(pinCode, businessCountry);
                    if (!pinRes.isValid) {
                      toast.error(pinRes.message);
                      return;
                    }
                    if (!city || !city.trim()) {
                      toast.error("City is required (*)");
                      return;
                    }
                    if (!businessState || !businessState.trim()) {
                      toast.error("State / Province is required (*)");
                      return;
                    }
                    const fnRes = validatePersonName(firstName, "First name");
                    if (!fnRes.isValid) {
                      toast.error(fnRes.message);
                      return;
                    }
                    const lnRes = validatePersonName(lastName, "Last name");
                    if (!lnRes.isValid) {
                      toast.error(lnRes.message);
                      return;
                    }
                    if (!position || !position.trim()) {
                      toast.error("Your designation / position is required (*)");
                      return;
                    }
                    if (!phone) {
                      toast.error("Please enter your mobile number (*)");
                      return;
                    }
                    if (!isPhoneValid) {
                      toast.error(
                        `Mobile number for ${currentPhoneCountry.name} must be ${currentPhoneCountry.formatDescription || `${currentPhoneCountry.maxLength} digits`}`
                      );
                      return;
                    }
                    const webRes = validateWebsite(website);
                    if (!webRes.isValid) {
                      toast.error(webRes.message);
                      return;
                    }
                    createPartnerProfile();
                  }}
                  className="overall-div"
                  style={{ padding: "10px 4px 10px 0" }}
                >
                  
                  {/* Section 1: Business Details */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#2c7cb2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <BuildingIcon /> Business Details
                    </div>

                    <InputDivsCreatePartner
                      placeholderText="Business Name * (e.g. Acme EdTech Inc.)"
                      setFunc={setBusinessName}
                      funcValue={businessName}
                      maxLength={100}
                      containerStyle={{ marginBottom: "12px" }}
                      style={{
                        height: "48px",
                        minHeight: "48px",
                        padding: "10px 14px",
                        fontSize: "14px",
                      }}
                    />
                    <InputDivsTextAreaPartner
                      placeholderText="Short Business Description & Overview (Optional)..."
                      setFunc={setBusinessDesc}
                      funcValue={businessDesc}
                      style={{
                        height: "72px",
                        minHeight: "72px",
                        padding: "8px 12px",
                        fontSize: "13.5px",
                      }}
                    />

                    <div className="partner-modal-grid-row">
                      <InputDivsCreatePartner
                        placeholderText="Website (e.g. https://example.com) (Optional)"
                        setFunc={setWebsite}
                        funcValue={website}
                        maxLength={150}
                      />
                      <div
                        ref={businessTypeDropdownRef}
                        style={{
                          position: "relative",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          onClick={() => setBusinessTypeDropdownOpen((prev) => !prev)}
                          style={{
                            width: "100%",
                            height: "40px",
                            minHeight: "40px",
                            border: businessTypeDropdownOpen ? "1.5px solid #2c7cb2" : "1.5px solid #e2e8f0",
                            boxShadow: businessTypeDropdownOpen ? "0 0 0 3px rgba(44, 124, 178, 0.15)" : "none",
                            borderRadius: "10px",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px",
                            cursor: "pointer",
                            boxSizing: "border-box",
                            userSelect: "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13.5px",
                              fontFamily: "'Poppins', sans-serif",
                              color: businessType ? "#0f172a" : "#94a3b8",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {businessType || "Business Type * (e.g. Vendor, Institution)"}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={businessTypeDropdownOpen ? "#2c7cb2" : "#64748b"}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: businessTypeDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0,
                              marginLeft: "6px",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>

                        {businessTypeDropdownOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              bottom: "auto",
                              width: "100%",
                              minWidth: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              border: "1.5px solid #2c7cb2",
                              borderRadius: "10px",
                              boxShadow: "0 8px 24px rgba(15, 31, 61, 0.14)",
                              zIndex: 99999,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              padding: "4px 0",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {BUSINESS_TYPES.map((type) => {
                              const isSelected = businessType === type;
                              return (
                                <div
                                  key={type}
                                  onClick={() => {
                                    setBusinessType(type);
                                    setBusinessTypeDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: "9px 14px",
                                    fontSize: "13.5px",
                                    fontFamily: "'Poppins', sans-serif",
                                    color: isSelected ? "#ffffff" : "#1e293b",
                                    background: isSelected ? "#2c7cb2" : "transparent",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "background 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  <span>{type}</span>
                                  {isSelected && <span style={{ fontWeight: "700" }}><SvgCheck size={14} /></span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`${styles.imgContainer} partner-logo-container`} style={{ marginTop: "14px", background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <ImageUploadDivProfilePic setFunc={setBusinessLogo} funcValue={businessLogo} />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#1e293b" }}>Company Logo *</div>
                        <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>Upload PNG, JPG or SVG (Max 5MB)</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Business Address */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#2c7cb2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPinIcon /> Business Address
                    </div>

                    <InputDivsCreatePartner placeholderText="Street Address (Optional)..." setFunc={setStreet} funcValue={street} maxLength={150} />

                    <div className="partner-modal-grid-row">
                      <InputDivsCreatePartner placeholderText="City *..." setFunc={setCity} funcValue={city} maxLength={60} />
                      <InputDivsCreatePartner
                        placeholderText="Pincode / Postal Code *..."
                        setFunc={handlePartnerPinCodeChange}
                        onBlur={() => lookupPartnerPostalCode(pinCode, businessCountry)}
                        funcValue={pinCode}
                        maxLength={(businessCountry || "").toLowerCase().includes("india") ? 6 : 10}
                        inputMode={(businessCountry || "").toLowerCase().includes("india") ? "numeric" : "text"}
                      />
                    </div>

                    <div className="partner-modal-grid-row">
                      <InputDivsCreatePartner placeholderText="State / Province *..." setFunc={setBusinessState} funcValue={businessState} maxLength={60} />
                      <div
                        ref={countryDropdownRef}
                        style={{
                          position: "relative",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          onClick={() => setCountryDropdownOpen((prev) => !prev)}
                          style={{
                            width: "100%",
                            height: "40px",
                            minHeight: "40px",
                            border: countryDropdownOpen ? "1.5px solid #2c7cb2" : "1.5px solid #e2e8f0",
                            boxShadow: countryDropdownOpen ? "0 0 0 3px rgba(44, 124, 178, 0.15)" : "none",
                            borderRadius: "10px",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px",
                            cursor: "pointer",
                            boxSizing: "border-box",
                            userSelect: "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13.5px",
                              fontFamily: "'Poppins', sans-serif",
                              color: businessCountry ? "#0f172a" : "#94a3b8",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {businessCountry || "Select Country *"}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={countryDropdownOpen ? "#2c7cb2" : "#64748b"}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: countryDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0,
                              marginLeft: "6px",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>

                        {countryDropdownOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              bottom: "auto",
                              width: "100%",
                              minWidth: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              border: "1.5px solid #2c7cb2",
                              borderRadius: "10px",
                              boxShadow: "0 8px 24px rgba(15, 31, 61, 0.14)",
                              zIndex: 99999,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Search bar */}
                            <div
                              style={{
                                padding: "8px 10px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#f8fafc",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                autoFocus
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                  fontSize: "13px",
                                  fontFamily: "'Poppins', sans-serif",
                                  color: "#0f172a",
                                }}
                              />
                              {countrySearch && (
                                <span
                                  onClick={() => setCountrySearch("")}
                                  style={{ cursor: "pointer", fontSize: "12px", color: "#94a3b8" }}
                                >
                                  <SvgClose size={14} />
                                </span>
                              )}
                            </div>

                            {/* Options list */}
                            <div
                              style={{
                                maxHeight: "190px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "4px 0",
                              }}
                            >
                              {filteredCountries.length === 0 ? (
                                <div style={{ padding: "10px 14px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
                                  No countries found
                                </div>
                              ) : (
                                filteredCountries.map((c) => {
                                  const isSelected = businessCountry === c.name;
                                  return (
                                    <div
                                      key={c.code || c.name}
                                      onClick={() => {
                                        setBusinessCountry(c.name);
                                        setCountryDropdownOpen(false);
                                        setCountrySearch("");
                                      }}
                                      style={{
                                        padding: "8px 14px",
                                        fontSize: "13px",
                                        fontFamily: "'Poppins', sans-serif",
                                        color: isSelected ? "#ffffff" : "#1e293b",
                                        background: isSelected ? "#2c7cb2" : "transparent",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        transition: "background 0.15s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = "transparent";
                                      }}
                                    >
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                                      {isSelected && <span style={{ marginLeft: "6px" }}><SvgCheck size={14} /></span>}
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

                  {/* Section 3: Contact Person */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#2c7cb2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MailIcon /> Contact Information
                    </div>

                    <div className="partner-modal-grid-row" style={{ marginTop: "0px" }}>
                      <InputDivsCreatePartner placeholderText="First Name *..." setFunc={setFirstName} funcValue={firstName} maxLength={50} />
                      <InputDivsCreatePartner placeholderText="Last Name *..." setFunc={setLastName} funcValue={lastName} maxLength={50} />
                    </div>
                    <div className="partner-modal-grid-row">
                      <InputDivsCreatePartner placeholderText="Your Designation / Position * (e.g. Director, Partner)" setFunc={setPosition} funcValue={position} maxLength={80} />
                      <div
                        ref={phoneContainerRef}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: (phoneCodeDropdownOpen || phoneInputFocused) ? "1.5px solid #2c7cb2" : "1.5px solid #e2e8f0",
                          boxShadow: (phoneCodeDropdownOpen || phoneInputFocused) ? "0 0 0 3px rgba(44, 124, 178, 0.15)" : "none",
                          borderRadius: "10px",
                          height: "40px",
                          minHeight: "40px",
                          background: "#ffffff",
                          padding: "0 10px",
                          boxSizing: "border-box",
                          marginBottom: "0px",
                          width: "100%",
                          position: "relative",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Country Calling Code & Flag selector trigger */}
                        <div
                          onClick={() => setPhoneCodeDropdownOpen((prev) => !prev)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            paddingRight: "8px",
                            borderRight: "1px solid #e2e8f0",
                            cursor: "pointer",
                            flexShrink: 0,
                            height: "100%",
                            userSelect: "none",
                          }}
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
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                            {currentPhoneCountry.code}
                          </span>
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2.5"
                            style={{
                              transform: phoneCodeDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>

                        {/* Local Mobile Number Input */}
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="Phone Number *"
                          value={phone}
                          maxLength={currentPhoneCountry.maxLength + 8}
                          onChange={(e) => handlePartnerPhoneChange(e.target.value)}
                          onKeyDown={handlePhoneKeyDown}
                          onPaste={handlePhonePaste}
                          onFocus={() => setPhoneInputFocused(true)}
                          onBlur={() => setPhoneInputFocused(false)}
                          style={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: "13.5px",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: "500",
                            color: "#0f172a",
                            flex: 1,
                            width: "100%",
                            height: "100%",
                            padding: "0 0 0 10px",
                            boxSizing: "border-box",
                          }}
                        />

                        {/* Phone Code Dropdown Menu: TOP BOX SIZE ONLY, STRICTLY DOWNWARDS */}
                        {phoneCodeDropdownOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              bottom: "auto",
                              width: "100%",
                              minWidth: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              border: "1.5px solid #2c7cb2",
                              borderRadius: "10px",
                              boxShadow: "0 8px 24px rgba(15, 31, 61, 0.14)",
                              zIndex: 99999,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Search wrap */}
                            <div
                              style={{
                                padding: "8px 10px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#f8fafc",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                              <input
                                type="text"
                                placeholder="Search code or country..."
                                value={phoneCodeSearch}
                                onChange={(e) => setPhoneCodeSearch(e.target.value)}
                                autoFocus
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                  fontSize: "13px",
                                  fontFamily: "'Poppins', sans-serif",
                                  color: "#0f172a",
                                }}
                              />
                              {phoneCodeSearch && (
                                <span
                                  onClick={() => setPhoneCodeSearch("")}
                                  style={{ cursor: "pointer", fontSize: "12px", color: "#94a3b8" }}
                                >
                                  <SvgClose size={14} />
                                </span>
                              )}
                            </div>

                            {/* Code List */}
                            <div
                              style={{
                                maxHeight: "190px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "4px 0",
                              }}
                            >
                              {filteredDialCodes.length === 0 ? (
                                <div style={{ padding: "10px 14px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
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
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        fontFamily: "'Poppins', sans-serif",
                                        color: isSelected ? "#ffffff" : "#1e293b",
                                        background: isSelected ? "#2c7cb2" : "transparent",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        transition: "background 0.15s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = "transparent";
                                      }}
                                    >
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
                                      <span style={{ fontWeight: "600", minWidth: "42px" }}>{opt.code}</span>
                                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{opt.name}</span>
                                      {isSelected && <span><SvgCheck size={14} /></span>}
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      background: allSelected ? "linear-gradient(135deg, #2c7cb2 0%, #1a5a8a 100%)" : "#cbd5e1",
                      color: "#ffffff",
                      borderRadius: "12px",
                      padding: "14px",
                      fontSize: "0.95rem",
                      fontWeight: "700",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: allSelected ? "0 4px 14px rgba(44, 124, 178, 0.35)" : "none",
                      marginTop: "10px",
                      display: "block"
                    }}
                  >
                    Become a Partner →
                  </button>
                </form>
              </>
            )}

          {createBrandProfileStep === 2 && (
            <>
              <div className="head-txt" style={{ padding: "0 3rem", height: "4rem" }}>
                <div>Step 2</div>
                <div onClick={() => { setCreateBrandProfile(false); setCreateBrandProfileStep(1); }} className="close-div" aria-label="Close">
                  <img src={close} alt="" className="partner-close-img-desktop" />
                  <svg
                    className="partner-close-svg-mobile"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>
              <div className="overall-div" style={{ height: "calc(100% - 4rem)" }}>
                <div className="coverPic-container">
                  <div className="coverPicDiv"><ImageUploadDivCoverPic1 setFunc={setCoverPhoto1} funcValue={coverPhoto1} /></div>
                  <div className="logoDiv"><img src={profilePicture} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", border: "none" }} /></div>
                </div>
                <div className="inputs-container">
                  <InputDivsWithMT heading="Display Name *" placeholderText="Display Name.." setFunc={setBrandDisplayName} funcValue={brandDisplayName} />
                  <InputDivsCheckFunctionality heading="Naavi Username *" placeholderText="Username.." setFunc={setBrandUserName} funcValue={brandUserName} userNameAvailable={userNameAvailable1} />
                  <InputDivsTextArea1 heading="Naavi Bio *" placeholderText="Bio..." setFunc={setBrandDescription} funcValue={brandDescription} />
                  <InputDivsWithColorCode heading="Colour Code *" placeholderText="#000000" setFunc={setBrandColorCode} funcValue={brandColorCode} colorCode={brandColorCode} />
                  <div style={{ paddingTop: '30px' }}>Select Country *</div>
                  <div className="project-desktop-custom-select" style={{ marginTop: '8px' }}>
                    <CustomSelect
                      value={headquarter}
                      onChange={(e) => setHeadquarter(e.target.value)}
                      options={countryApiValue || []}
                      placeholder="Click to Select"
                    />
                  </div>
                  <div className="project-mobile-native-select">
                    <div className={styles.inputDivs} style={{ border: '1px solid #e7e7e7', borderRadius: '30px', fontSize: "13px", fontWeight: "500", paddingLeft: '10px' }}>
                      <select name="country" style={{ border: "none", padding: '1rem', width: '90%', fontSize: "16px" }} onChange={(e) => setHeadquarter(e.target.value)}>
                        <option value="">Click to Select</option>
                        {countryApiValue?.map((item) => <option key={item.cca2} value={item?.name?.common}>{item?.name?.common}</option>)}
                      </select>
                    </div>
                  </div>
                  <InputDivsWithMT heading="What is your office address? *" placeholderText="Enter address..." setFunc={setBrandAddress} funcValue={brandAddress} />
                  <div style={{ marginTop: "3rem", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Upload white profile picture *</div>
                  <ImageUploadProfilePic2 setFunc={setWhiteProPic} funcValue={whiteProPic} />
                  <div className="stepBtns" style={{ marginTop: "3.5rem" }}>
                    <div style={{ cursor: "pointer", background: "#1F304F", width: "48%" }} onClick={() => { setCreateBrandProfileStep(1); }}>Go Back</div>
                    <div
                      style={{ opacity: coverPhoto1 && whiteProPic && brandAddress && headquarter && brandColorCode && brandDescription && brandUserName.length > 0 && brandDisplayName && userNameAvailable1 ? "1" : "0.25", cursor: coverPhoto1 && whiteProPic && brandAddress && headquarter && brandColorCode && brandDescription && brandUserName.length > 0 && brandDisplayName && userNameAvailable1 ? "pointer" : "not-allowed", background: "#59A2DD", width: "48%" }}
                      onClick={() => { if (coverPhoto1 && whiteProPic && brandAddress && headquarter && brandColorCode && brandDescription && brandUserName.length > 0 && brandDisplayName && userNameAvailable1) createBankerProfile(); }}
                    >Complete</div>
                  </div>
                </div>
              </div>
              {isloading && (
                <div className="loading-component" style={{ top: "0", left: "0", width: "100%", height: "100%", position: "absolute", display: "flex" }}>
                  <LoadingAnimation1 icon={lg1} width={200} />
                </div>
              )}
            </>
          )}

          {createBrandProfileStep === 3 && (
            <div className="successMsg">You Have Successfully Created Your Naavi Profile.</div>
          )}
        </div>
      </>
      )}

      {/* ── Edit Modals (unchanged) ── */}
      {editCountry && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Country</div><div onClick={() => { setEditCountry(false); setNewCountry(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1"><div>{profileData?.country}</div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="project-desktop-custom-select" style={{ margin: '12px 0' }}>
              <CustomSelect
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                options={countryApiValue || []}
                placeholder="Click to Select"
              />
            </div>
            <div className="project-mobile-native-select">
              <div className="each-action1">
                <select name="country" style={{ border: "none", padding: '1.5rem', width: '90%', fontSize: "16px" }} onChange={(e) => setNewCountry(e.target.value)}>
                  {countryApiValue?.map((item) => <option key={item.cca2} value={item?.name?.common}>{item?.name?.common}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newCountry ? "1" : "0.25", cursor: newCountry ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newCountry) editData("country", newCountry); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editAddress && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Address</div><div onClick={() => { setEditAddress(false); setNewAddress(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1"><div>{profileData?.address}</div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1"><input type="text" placeholder="New Address.." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newAddress) editData("address", newAddress); }} /></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newAddress ? "1" : "0.25", cursor: newAddress ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newAddress) editData("address", newAddress); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editDisplayName && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Display Name</div><div onClick={() => { setEditDisplayName(false); setNewDisplayName(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1"><div>{profileData?.displayName}</div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1"><input type="text" placeholder="New Display Name.." value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newDisplayName) editData("displayName", newDisplayName); }} /></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newDisplayName ? "1" : "0.25", cursor: newDisplayName ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newDisplayName) editData("displayName", newDisplayName); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editPhoneNo && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Phone Number</div><div onClick={() => { setEditPhoneNo(false); setNewPhoneNo(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1"><div>{profileData?.phone}</div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1">
              <input
                type="tel"
                placeholder={currentPhoneCountry.placeholder || "New Phone Number.."}
                value={newPhoneNo}
                maxLength={currentPhoneCountry.maxLength + 8}
                onChange={(e) => setNewPhoneNo(sanitizePhoneInput(e.target.value, currentPhoneCountry.maxLength))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPhoneNo) {
                    const phoneVal = validatePhoneDigits(newPhoneNo, currentPhoneCountry, currentPhoneCountry.name, true);
                    if (!phoneVal.isValid) {
                      toast.error(phoneVal.message);
                      return;
                    }
                    editData("phone", newPhoneNo);
                  } else if (!isPhoneKeyAllowed(e, newPhoneNo, currentPhoneCountry.maxLength)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}>
            <div
              style={{ opacity: newPhoneNo ? "1" : "0.25", cursor: newPhoneNo ? "pointer" : "not-allowed", background: "#59A2DD" }}
              onClick={() => {
                if (newPhoneNo) {
                  const phoneVal = validatePhoneDigits(newPhoneNo, currentPhoneCountry, currentPhoneCountry.name, true);
                  if (!phoneVal.isValid) {
                    toast.error(phoneVal.message);
                    return;
                  }
                  editData("phone", newPhoneNo);
                }
              }}
            >
              Submit Edit
            </div>
          </div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editDescription && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Description</div><div onClick={() => { setEditDescription(false); setNewDescription(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1"><div>{profileData?.description}</div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1"><input type="text" placeholder="New Description.." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newDescription) editData("description", newDescription); }} /></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newDescription ? "1" : "0.25", cursor: newDescription ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newDescription) editData("description", newDescription); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editColorCode && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Colour Code</div><div onClick={() => { setEditColorCode(false); setNewColorCode(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1" style={{ position: "relative" }}><div>{profileData?.colorCode}</div><div className="bgColorDiv" style={{ background: `#${profileData?.colorCode}` }}></div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1" style={{ position: "relative" }}><input type="text" placeholder="New Colour Code.." value={newColorCode} onChange={(e) => setNewColorCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newColorCode) editData("colorCode", newColorCode); }} /><div className="bgColorDiv" style={{ background: newColorCode ? `#${newColorCode}` : "transparent" }}></div></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newColorCode ? "1" : "0.25", cursor: newColorCode ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newColorCode) editData("colorCode", newColorCode); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editProfilePic && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Profile Picture</div><div onClick={() => { setEditProfilePic(false); setNewProfilePic(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1" style={{ border: "none", justifyContent: "center" }}><div style={{ height: "120px", width: "120px" }}><img src={profileData?.profilePicURL} alt="" style={{ height: "100%", width: "100%", borderRadius: "50%", border: "0.5px solid #e5e5e5" }} /></div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1" style={{ border: "none", justifyContent: "center" }}><ImageUploadDivProfilePic setFunc={setNewProfilePic} funcValue={newProfilePic} /></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newProfilePic ? "1" : "0.25", cursor: newProfilePic ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newProfilePic) editData("profilePicURL", newProfilePic); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {editCoverPic && (
        <div className="popularS">
          <div className="head-txt"><div>Edit Cover Photo</div><div onClick={() => { setEditCoverPic(false); setNewCoverPic(""); }} className="close-div"><img src={close} alt="" /></div></div>
          <div className="overall-div" style={{ height: "calc(100% - 10.5rem)" }}>
            <div className="each-action1" style={{ height: "12rem", padding: "0" }}><div style={{ height: "100%", width: "100%" }}><img src={profileData?.coverPicURL} alt="" style={{ height: "100%", width: "100%" }} /></div></div>
            <div className="line-container"><div className="linee"></div><div className="new-txt">New</div><div className="linee"></div></div>
            <div className="each-action1" style={{ height: "12rem", padding: "0" }}><ImageUploadDivCoverPic setFunc={setNewCoverPic} funcValue={newCoverPic} /></div>
          </div>
          <div className="stepBtns" style={{ height: "4.5rem" }}><div style={{ opacity: newCoverPic ? "1" : "0.25", cursor: newCoverPic ? "pointer" : "not-allowed", background: "#59A2DD" }} onClick={() => { if (newCoverPic) editData("coverPicURL", newCoverPic); }}>Submit Edit</div></div>
          {loading && <div className="loading-component" style={{ top: "0", right: "0", width: "100%", height: "calc(100% - 70px)", position: "absolute", display: "flex" }}><LoadingAnimation1 icon={lg1} width={200} /></div>}
        </div>
      )}

      {changing && <div className="loading-overlay"><LoadingAnimation1 icon={lg1} width={200} /></div>}

      <ToastContainer />
    </div>
  );
};

export default AccProfile;

// ─── Exported sub-components (unchanged) ──────────────────────────────────────

export const ImageUploadDivProfilePic1 = ({ setFunc, funcValue }) => {
  const { planBAccountPicUploading, setplanBAccountPicUploading, setSelectedDropDown } = useStore();
  return (
    <div className="imageUploadDiv" onClick={() => setSelectedDropDown("")} style={{ minWidth: "140px", minHeight: "140px", maxWidth: "140px", maxHeight: "140px", border: "0.5px solid #e7e7e7", borderRadius: "50%" }}>
      {funcValue ? (
        <div className="imageDiv" style={{ height: "100%", width: "100%", marginRight: "0" }}><img src={funcValue} alt="planBAccountPic" className="profileImg" style={{ width: "100%", height: "100%" }} /></div>
      ) : (
        <label htmlFor="profileUpdateImgPlanB" className="uploadFileDiv" style={{ width: "100%", height: "100%", marginBottom: "0" }}>
          <input className="uploadNewPicPlanB" type="file" onChange={(e) => uploadImageFunc(e, setFunc, setplanBAccountPicUploading)} accept="image/*" id="profileUpdateImgPlanB" />
          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", border: "0.5px solid #2c7cb2", borderRadius: "50%" }}>
            {planBAccountPicUploading ? <div>Uploading...</div> : <div><img src={uploadGrey} alt="" style={{ width: "40px", height: "40px" }} /></div>}
          </div>
        </label>
      )}
    </div>
  );
};

export const ImageUploadProfilePic2 = ({ setFunc, funcValue }) => {
  const { planBAccountPicUploading, setplanBAccountPicUploading, setSelectedDropDown } = useStore();
  return (
    <div className="imageUploadDiv" onClick={() => setSelectedDropDown("")} style={{ minWidth: "140px", minHeight: "140px", maxWidth: "140px", maxHeight: "140px", border: "0.5px solid #e7e7e7", borderRadius: "50%", display: "flex" }}>
      {funcValue ? (
        <div className="imageDiv" style={{ height: "100%", width: "100%", marginRight: "0" }}><img src={funcValue} alt="planBAccountPic" className="profileImg" style={{ width: "100%", height: "100%" }} /></div>
      ) : (
        <label htmlFor="profileUpdateImgPlanB" className="uploadFileDiv" style={{ width: "140px", height: "140px", marginBottom: "0" }}>
          <input className="uploadNewPicPlanB" type="file" onChange={(e) => uploadImageFunc(e, setFunc, setplanBAccountPicUploading)} accept="image/*" id="profileUpdateImgPlanB" />
          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", border: "none", borderRadius: "50%" }}>
            {planBAccountPicUploading ? <div>Uploading...</div> : <div><img src={uploadGrey} alt="" style={{ width: "40px", height: "40px" }} /></div>}
          </div>
        </label>
      )}
    </div>
  );
};

export const ImageUploadDivCoverPic1 = ({ setFunc, funcValue }) => {
  const { planBAccountPicUploading, setplanBAccountPicUploading, setSelectedDropDown } = useStore();
  return (
    <div className="imageUploadDiv" onClick={() => setSelectedDropDown("")} style={{ width: "100%", height: "100%" }}>
      {funcValue ? (
        <div className="imageDiv" style={{ height: "100%", width: "100%", marginRight: "0" }}><img src={funcValue} alt="planBAccountPic" className="profileImg" style={{ width: "100%", height: "100%", borderRadius: "0" }} /></div>
      ) : (
        <label htmlFor="profileUpdateImgPlanB" className="uploadFileDiv" style={{ width: "100%", height: "100%", marginBottom: "0" }}>
          <input className="uploadNewPicPlanB" type="file" onChange={(e) => uploadImageFunc(e, setFunc, setplanBAccountPicUploading)} accept="image/*" id="profileUpdateImgPlanB" />
          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", border: "none" }}>
            {planBAccountPicUploading ? <div>Uploading</div> : <div><img src={cover} alt="" /></div>}
          </div>
        </label>
      )}
    </div>
  );
};

export const InputDivsCheckFunctionality = ({ heading, placeholderText, setFunc, funcValue, userNameAvailable }) => {
  return (
    <div className={classNames.inputDivs} style={{ marginTop: "3rem" }}>
      <div className={classNames.heading}>{heading}</div>
      <div className={classNames.inputHolder}>
        <input className={classNames.inputFields} placeholder={placeholderText} onChange={(event) => setFunc(event.target.value)} value={funcValue ? funcValue : ""} style={{ borderRadius: "35px" }} />
        <div className={classNames.currencyDiv2} style={{ background: userNameAvailable ? "#86D5BD" : "#1f304f" }}>
          {userNameAvailable ? "Available" : "Check"}
        </div>
      </div>
      {funcValue?.length > 0 && !userNameAvailable && (
        <div style={{ fontSize: "0.8rem", zIndex: "2", width: "95%", display: "flex", justifyContent: "center", background: "rgba(241, 244, 246)", padding: "5px", borderBottomLeftRadius: "35px", borderBottomRightRadius: "35px", margin: "-16px auto" }}>
          This username is not available. Please try again.
        </div>
      )}
    </div>
  );
};

export const InputDivsCheckFunctionality1 = ({ heading, placeholderText, setFunc, funcValue, userNameAvailable }) => {
  return (
    <div className={classNames.inputDivs} style={{ marginTop: "3rem" }}>
      <div className={classNames.heading}>{heading}</div>
      <div className={classNames.inputHolder}>
        <input className={classNames.inputFields} placeholder={placeholderText} onChange={(event) => setFunc(event.target.value)} value={funcValue ? funcValue : ""} style={{ borderRadius: "35px" }} />
        <div className={classNames.currencyDiv2} style={{ background: userNameAvailable ? "#86D5BD" : "#1f304f" }}>
          {userNameAvailable ? "Available" : "Check"}
        </div>
      </div>
    </div>
  );
};

export const ImageUploadDivProfilePic = ({ setFunc, funcValue }) => {
  const { planBAccountPicUploading, setplanBAccountPicUploading, setSelectedDropDown } = useStore();
  return (
    <div className="imageUploadDiv" onClick={() => setSelectedDropDown("")} style={{ width: "120px", height: "120px", border: "0.5px solid #2c7cb2", borderRadius: "50%" }}>
      {funcValue ? (
        <div className="imageDiv" style={{ height: "100%", width: "100%", marginRight: "0" }}><img src={funcValue} alt="planBAccountPic" className="profileImg" style={{ width: "100%", height: "100%", borderRadius: "50%" }} /></div>
      ) : (
        <label htmlFor="profileUpdateImgPlanB" className="uploadFileDiv" style={{ width: "100%", height: "100%", marginBottom: "0" }}>
          <input className="uploadNewPicPlanB" type="file" onChange={(e) => uploadImageFunc(e, setFunc, setplanBAccountPicUploading)} accept="image/*" id="profileUpdateImgPlanB" />
          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", border: "none" }}>
            {planBAccountPicUploading ? <div>Uploading...</div> : <div><img src={upload} alt="" style={{ width: "30px", height: "30px" }} /></div>}
          </div>
        </label>
      )}
    </div>
  );
};

export const ImageUploadDivCoverPic = ({ setFunc, funcValue }) => {
  const { planBAccountPicUploading, setplanBAccountPicUploading, setSelectedDropDown } = useStore();
  return (
    <div className="imageUploadDiv" onClick={() => setSelectedDropDown("")} style={{ width: "100%", height: "100%" }}>
      {funcValue ? (
        <div className="imageDiv" style={{ height: "100%", width: "100%", marginRight: "0" }}><img src={funcValue} alt="planBAccountPic" className="profileImg" style={{ width: "100%", height: "100%" }} /></div>
      ) : (
        <label htmlFor="profileUpdateImgPlanB" className="uploadFileDiv" style={{ width: "100%", height: "100%", marginBottom: "0" }}>
          <input className="uploadNewPicPlanB" type="file" onChange={(e) => uploadImageFunc(e, setFunc, setplanBAccountPicUploading)} accept="image/*" id="profileUpdateImgPlanB" />
          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", border: "none" }}>
            {planBAccountPicUploading ? <div>Uploading...</div> : <div><img src={upload} alt="" style={{ width: "50px", height: "50px" }} /></div>}
          </div>
        </label>
      )}
    </div>
  );
};