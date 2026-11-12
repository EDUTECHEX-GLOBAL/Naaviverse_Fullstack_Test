import React, { useEffect, useState, useMemo, useRef } from 'react';
import logo from "../../logos/naavi_final_logo2.png"; // ️ adjust to actual relative path from this file to src/logos
import signupHero from "./assets/images/signup_hero.png";
import axios from 'axios';
import "./App.scss";
import { useLocation, useNavigate } from "react-router-dom";
import tickMark from "./tick.svg";
import tickMarkValid from "./tickMarkValid.svg";
import { ApplyWelcomeBonus } from "../../views/inner-pages/pages/services/wallet";
import { validateEmail } from "../../utils/emailValidator";
import { SvgCheck } from "../../utils/SvgIcons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ── inline field icons (no new deps) ── */
const EmailIcon = () => (
  <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
    <path d="M3 6.5C3 5.67 3.67 5 4.5 5h15c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="m4 6.5 8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UserIcon = () => (
  <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const LockIcon = () => (
  <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const EyeIcon = () => (
  <svg className="eyeToggleIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="eyeToggleIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="7.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const OtpIcon = () => (
  <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const UserToggleIcon = () => (
  <svg className="toggleIcon" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PartnerToggleIcon = () => (
  <svg className="toggleIcon" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="7.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const AwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const BriefcaseFeatureIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const HandshakeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const AlertWarningIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const NewHomePage = () => {
  const navigate = useNavigate();

  // ── Separate independent state for User vs Partner signup ──
  const [userState, setUserState] = useState({
    userName: "",
    userEmail: "",
    emailTouched: false,
    userPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    showOtp: false,
    userOtp: "",
    wrongOtp: false,
    errorMessage: "",
    roleWarning: null,
  });

  const [partnerState, setPartnerState] = useState({
    userName: "",
    userEmail: "",
    emailTouched: false,
    userPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    partnerType: "",
    showOtp: false,
    userOtp: "",
    wrongOtp: false,
    errorMessage: "",
    roleWarning: null,
  });

  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState("");
  const [showPassReq, setShowPassReq] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const [validations, setValidations] = useState({
    capitalLetter: false,
    specialCharacter: false,
    tenCharacters: false,
    oneNumber: false
  });

  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const role = urlParams.get("role");
    const type = urlParams.get("type");
    if (role === "Accountants" || role === "partner" || type === "partner") {
      setSignupRole("Accountants");
    } else {
      setSignupRole("Users");
    }
  }, [location]);

  const isUser = signupRole === "Users";
  const isPartner = signupRole === "Accountants";

  // ── Custom Dropdown for Partner Type (downward only, matches top box size) ──
  const [partnerTypeOpen, setPartnerTypeOpen] = useState(false);
  const partnerTypeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (partnerTypeRef.current && !partnerTypeRef.current.contains(e.target)) {
        setPartnerTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current active form based on selected tab
  const currentForm = isUser ? userState : partnerState;
  const updateCurrentForm = (fields) => {
    if (isUser) {
      setUserState((prev) => ({ ...prev, ...fields }));
    } else {
      setPartnerState((prev) => ({ ...prev, ...fields }));
    }
  };

  // Real-time email validation
  const emailValidation = useMemo(() => {
    if (!currentForm.userEmail) return { isValid: false, message: "" };
    return validateEmail(currentForm.userEmail);
  }, [currentForm.userEmail]);

  useEffect(() => {
    validatePassword(currentForm.userPassword);
  }, [currentForm.userPassword]);

  const validatePassword = (password) => {
    const pwd = password || "";
    const capitalLetterRegex = /[A-Z]/;
    const specialCharacterRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    const numberRegex = /[0-9]/;

    setValidations({
      capitalLetter: capitalLetterRegex.test(pwd),
      specialCharacter: specialCharacterRegex.test(pwd),
      tenCharacters: pwd.length >= 10,
      oneNumber: numberRegex.test(pwd)
    });
  };

  // ── Resend OTP Countdown Timer ──
  useEffect(() => {
    let timer;
    if (currentForm.showOtp && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentForm.showOtp, resendCountdown]);

  const handleResendRegistrationOtp = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess("");

    const signupUrl = isUser
      ? `${BASE_URL}/api/auth/signup`
      : `${BASE_URL}/api/partner/signup`;

    const cleanEmail = (currentForm.userEmail || "").trim().toLowerCase();
    const cleanUser = (currentForm.userName || "").trim();

    const payload = isUser
      ? {
        username: cleanUser,
        email: cleanEmail,
        password: currentForm.userPassword,
      }
      : {
        username: cleanUser,
        email: cleanEmail,
        password: currentForm.userPassword,
        partnerType: currentForm.partnerType,
      };

    try {
      const { data } = await axios.post(signupUrl, payload);
      setResendLoading(false);
      if (data.success) {
        setResendCountdown(60);
        updateCurrentForm({ wrongOtp: false, userOtp: "" });
        setResendSuccess("A new code has been sent to your email.");
        setTimeout(() => setResendSuccess(""), 4000);
      } else {
        updateCurrentForm({ errorMessage: data?.message || "Failed to resend code." });
      }
    } catch (err) {
      setResendLoading(false);
      updateCurrentForm({ errorMessage: err.response?.data?.message || "Error resending code." });
    }
  };

  const handleCreateAccount = () => {
    const emailVal = validateEmail(currentForm.userEmail);
    if (!emailVal.isValid) {
      updateCurrentForm({ emailTouched: true, errorMessage: emailVal.message });
      return;
    }

    if (isPartner && !currentForm.partnerType) {
      updateCurrentForm({ errorMessage: "Please select a Partner Type to continue." });
      return;
    }

    if (currentForm.userPassword !== currentForm.confirmPassword) {
      updateCurrentForm({ errorMessage: "Passwords do not match." });
      return;
    }

    if (
      !validations.capitalLetter ||
      !validations.specialCharacter ||
      !validations.tenCharacters ||
      !validations.oneNumber
    ) {
      updateCurrentForm({ errorMessage: "Please ensure all password requirements are met." });
      setShowPassReq(true);
      return;
    }

    setLoading(true);
    updateCurrentForm({ errorMessage: "", roleWarning: null });
    const cleanEmail = (currentForm.userEmail || "").trim().toLowerCase();

    axios.post(`${BASE_URL}/api/auth/checkEmailDuplicate`, {
      email: cleanEmail
    })
      .then(({ data }) => {
        if (data && (data.exists || data.count >= 1)) {
          setLoading(false);
          const registeredRole = data.registeredRole;
          if (registeredRole === "Partner" && isUser) {
            updateCurrentForm({
              roleWarning: {
                role: "Partner",
                title: "Registered as Partner",
                message: "This email is already registered as a Partner account.",
                targetRole: "Accountants",
                action: "switch_role",
              }
            });
          } else if (registeredRole === "User" && isPartner) {
            updateCurrentForm({
              roleWarning: {
                role: "User",
                title: "Registered as User",
                message: "This email is already registered as a standard User account.",
                targetRole: "Users",
                action: "switch_role",
              }
            });
          } else {
            updateCurrentForm({
              roleWarning: {
                role: registeredRole || (isUser ? "User" : "Partner"),
                title: "Email Already Registered",
                message: `This email is already registered as a ${registeredRole || (isUser ? "User" : "Partner")} account.`,
                action: "login",
              }
            });
          }
        } else {
          registerUser();
        }
      })
      .catch((err) => {
        setLoading(false);
        const errData = err.response?.data;
        const msg = errData?.message;
        if (msg && msg.toLowerCase().includes("already exists")) {
          updateCurrentForm({ errorMessage: "This email is already registered." });
        } else {
          updateCurrentForm({ errorMessage: errData?.message || "Error checking email." });
        }
      });
  };

  const registerUser = () => {
    const signupUrl = isUser
      ? `${BASE_URL}/api/auth/signup`
      : `${BASE_URL}/api/partner/signup`;

    const cleanEmail = (currentForm.userEmail || "").trim().toLowerCase();
    const cleanUser = (currentForm.userName || "").trim();

    const payload = isUser
      ? {
        username: cleanUser,
        email: cleanEmail,
        password: currentForm.userPassword,
      }
      : {
        username: cleanUser,
        email: cleanEmail,
        password: currentForm.userPassword,
        partnerType: currentForm.partnerType,
      };

    axios.post(signupUrl, payload)
      .then(({ data }) => {
        setLoading(false);
        if (data.success) {
          setResendCountdown(60);
          setResendSuccess("");
          updateCurrentForm({ showOtp: true, wrongOtp: false });
        } else {
          updateCurrentForm({ errorMessage: data?.message || "Signup failed." });
        }
      })
      .catch((err) => {
        setLoading(false);
        const errData = err.response?.data;
        if (errData?.registeredRole) {
          const regRole = errData.registeredRole;
          if (regRole === "Partner" && isUser) {
            updateCurrentForm({
              roleWarning: {
                role: "Partner",
                title: "Registered as Partner",
                message: "This email is already registered as a Partner account.",
                targetRole: "Accountants",
                action: "switch_role",
              }
            });
          } else if (regRole === "User" && isPartner) {
            updateCurrentForm({
              roleWarning: {
                role: "User",
                title: "Registered as User",
                message: "This email is already registered as a User account.",
                targetRole: "Users",
                action: "switch_role",
              }
            });
          } else {
            updateCurrentForm({
              roleWarning: {
                role: regRole,
                title: "Email Already Registered",
                message: `This email is already registered as a ${regRole} account.`,
                action: "login",
              }
            });
          }
        } else {
          updateCurrentForm({ errorMessage: errData?.message || "Signup failed. Please try again." });
        }
      });
  };

  const confirmEmail = () => {
    setLoading(true);
    const verifyOtpUrl = isUser
      ? `${BASE_URL}/api/auth/verifyotp`
      : `${BASE_URL}/api/partner/verifyotp`;

    const cleanEmail = (currentForm.userEmail || "").trim().toLowerCase();
    const cleanUser = (currentForm.userName || "").trim();

    axios.post(verifyOtpUrl, {
      email: cleanEmail,
      username: cleanUser,
      password: currentForm.userPassword,
      partnerType: currentForm.partnerType,
      otp: (currentForm.userOtp || "").trim(),
    })
      .then(({ data }) => {
        if (data.success) {
          if (isUser) {
            ApplyWelcomeBonus(cleanEmail)
              .then(() => console.log("Welcome bonus applied"))
              .catch((err) => console.error("Welcome bonus failed:", err.message));
          }
          navigate(`/login?role=${signupRole}`);
        } else {
          setLoading(false);
          updateCurrentForm({ wrongOtp: true });
          const msg = data?.message || "Invalid OTP. Please enter the correct OTP.";
          toast.error(msg);
        }
      })
      .catch((err) => {
        setLoading(false);
        updateCurrentForm({ wrongOtp: true });
        const errMsg = err.response?.data?.message || "Invalid OTP. Please enter the correct OTP.";
        toast.error(errMsg);
      });
  };

  const heroData = {
    Users: {
      badge: "Join 10,000+ Users",
      title: "Start Your",
      highlight: "Journey Today",
      subtitle: "Create your account and unlock personalized career assessments, AI-powered skill recommendations, and expert mentorship.",
      features: [
        { icon: <TargetIcon />, text: "Personalized career path recommendations" },
        { icon: <BarChartIcon />, text: "AI-powered skill gap analysis" },
        { icon: <AwardIcon />, text: "Industry-recognized certifications" },
      ],
    },
    Accountants: {
      badge: "Trusted Partner Network",
      title: "Become a",
      highlight: "Partner",
      subtitle: "Register as a partner to access exclusive business tools, manage your clients, and grow your professional practice.",
      features: [
        { icon: <BriefcaseFeatureIcon />, text: "Complete business management suite" },
        { icon: <TrendingUpIcon />, text: "Client analytics & growth insights" },
        { icon: <HandshakeIcon />, text: "Dedicated partner support team" },
      ],
    },
  };

  const hero = heroData[signupRole] || heroData.Accountants;

  const isFormValid =
    emailValidation.isValid &&
    Boolean(currentForm.userName) &&
    (isUser || Boolean(currentForm.partnerType)) &&
    Boolean(currentForm.userPassword) &&
    Boolean(currentForm.confirmPassword) &&
    currentForm.userPassword === currentForm.confirmPassword &&
    validations.capitalLetter &&
    validations.specialCharacter &&
    validations.tenCharacters &&
    validations.oneNumber;

  const handleGoogleAuth = () => {
    const role = isUser ? "Users" : "Accountants";
    localStorage.setItem("userType", isUser ? "user" : "partner");
    localStorage.setItem("googleAuthRole", role);
    if (isPartner && partnerState.partnerType) {
      localStorage.setItem("partnerType", partnerState.partnerType);
    }

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);

    if (!clientId) {
      updateCurrentForm({
        errorMessage: "Google Client ID is missing. Please add REACT_APP_GOOGLE_CLIENT_ID to your .env file."
      });
      return;
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className='regContainer'>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* ── LEFT HERO PANEL (Logo above image in both desktop and mobile) ── */}
      <div className='regleftside'>
        <div className="auth-hero-header">
          <img src={logo} alt="SkillNaav" className="auth-hero-logo" onClick={() => navigate("/")} />
        </div>
        <div className="hero-visual-area">
          <img src={signupHero} alt="Join Naaviverse" className="hero-bg" />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              {hero.badge}
            </div>
            <h1 className="hero-title">
              {hero.title}{" "}
              <span className="hero-highlight">{hero.highlight}</span>
            </h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
            <div className="hero-features">
              {hero.features.map((feat, i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-icon">{feat.icon}</div>
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className='regrightside'>
        <div className='reginside'>

          <div className="brandRow">
            <img src={logo} alt="Naaviverse" className='logoimg' />
          </div>

          <div className="reg-welcome-title">
            {isUser ? "Create Your Account" : "Partner Registration"}
          </div>
          <div className="reg-welcome-subtitle">
            {isUser
              ? "Fill in your details to get started on your career journey"
              : "Register your business and join our growing partner network"}
          </div>

          {/* Role pill switcher */}
          <div className="toggle-box">
            <div
              className={`toggle-each ${isUser ? "toggle-each-active" : ""}`}
              onClick={() => {
                setSignupRole("Users");
              }}
            >
              <UserToggleIcon /> User Signup
            </div>
            <div
              className={`toggle-each ${isPartner ? "toggle-each-active" : ""}`}
              onClick={() => {
                setSignupRole("Accountants");
              }}
            >
              <PartnerToggleIcon /> Partner Signup
            </div>
          </div>

          {currentForm.roleWarning && (
            <div className="signup-toggle-warning">
              <div className="warning-head">
                <span className="warning-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <AlertWarningIcon size={13} /> Notice
                </span>
                <strong>{currentForm.roleWarning.title}</strong>
              </div>
              <p className="warning-desc">{currentForm.roleWarning.message}</p>
              <div className="warning-actions">
                {currentForm.roleWarning.targetRole && (
                  <button
                    type="button"
                    className="warning-btn primary"
                    onClick={() => {
                      setSignupRole(currentForm.roleWarning.targetRole);
                    }}
                  >
                    Switch to {currentForm.roleWarning.targetRole === "Accountants" ? "Partner Signup" : "User Signup"}
                  </button>
                )}
                <button
                  type="button"
                  className="warning-btn secondary"
                  onClick={() => {
                    navigate(`/login?role=${currentForm.roleWarning.targetRole || signupRole}`);
                  }}
                >
                  Sign In Now →
                </button>
              </div>
            </div>
          )}

          {currentForm.errorMessage && <div className="errorMsg">{currentForm.errorMessage}</div>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (loading) return;
              if (currentForm.showOtp) {
                if (currentForm.userOtp && currentForm.userOtp.trim().length > 0) confirmEmail();
              } else if (isFormValid) {
                handleCreateAccount();
              }
            }}
            style={{ width: "100%" }}
          >
            <div
              className='input1'
              style={{
                borderColor: (currentForm.emailTouched || (currentForm.userEmail && currentForm.userEmail.includes('@'))) && currentForm.userEmail && !emailValidation.isValid ? "#ef4444" : undefined
              }}
            >
              <EmailIcon />
              <input
                type="email"
                placeholder='Email address'
                disabled={currentForm.showOtp}
                value={currentForm.userEmail}
                onBlur={() => updateCurrentForm({ emailTouched: true })}
                onChange={e => {
                  updateCurrentForm({
                    roleWarning: null,
                    errorMessage: "",
                    userEmail: e.target.value,
                    emailTouched: true
                  });
                }}
              />
            </div>
            {(currentForm.emailTouched || (currentForm.userEmail && currentForm.userEmail.includes('@'))) && currentForm.userEmail && !emailValidation.isValid && (
              <div className="field-error-hint" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertWarningIcon size={13} /> {emailValidation.message}
              </div>
            )}

            <div className='input1'>
              <UserIcon />
              <input
                type="text"
                placeholder='Choose a username'
                disabled={currentForm.showOtp}
                value={currentForm.userName}
                onChange={e => updateCurrentForm({ userName: e.target.value })}
              />
            </div>

            {isPartner && (
              <div
                ref={partnerTypeRef}
                className={`input1 selectWrap ${currentForm.partnerType ? "hasValue" : ""}`}
                style={{
                  position: "relative",
                  cursor: currentForm.showOtp ? "not-allowed" : "pointer",
                  userSelect: "none",
                  borderColor: partnerTypeOpen ? "#2c7cb2" : undefined,
                  boxShadow: partnerTypeOpen ? "0 0 0 3px rgba(44, 124, 178, 0.1)" : undefined,
                }}
                onClick={() => {
                  if (!currentForm.showOtp) {
                    setPartnerTypeOpen((prev) => !prev);
                  }
                }}
              >
                <BriefcaseIcon />
                <span
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    fontFamily: "'Poppins', sans-serif",
                    color: currentForm.partnerType ? "#1e293b" : "#94a3b8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentForm.partnerType || "Select Partner Type"}
                </span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={partnerTypeOpen ? "#2c7cb2" : "#94a3b8"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: partnerTypeOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                    marginLeft: "auto",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>

                {partnerTypeOpen && !currentForm.showOtp && (
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
                    {["Distributor", "Vendor", "Mentor", "Institution"].map((type) => {
                      const isSelected = currentForm.partnerType === type;
                      return (
                        <div
                          key={type}
                          onClick={() => {
                            updateCurrentForm({ partnerType: type });
                            setPartnerTypeOpen(false);
                          }}
                          style={{
                            padding: "9px 14px",
                            fontSize: "13.5px",
                            fontFamily: "'Poppins', sans-serif",
                            color: isSelected ? "#ffffff" : "#1e293b",
                            background: isSelected ? "#2c7cb2" : "transparent",
                            cursor: "pointer",
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
            )}

            <div className='passwordWrapper'>
              <div className='input2'>
                <LockIcon />
                <input
                  type={currentForm.showPassword ? "text" : "password"}
                  placeholder='Create password'
                  disabled={currentForm.showOtp}
                  value={currentForm.userPassword}
                  onChange={e => updateCurrentForm({ userPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  tabIndex={-1}
                  aria-label={currentForm.showPassword ? "Hide password" : "Show password"}
                  onClick={() => updateCurrentForm({ showPassword: !currentForm.showPassword })}
                >
                  {currentForm.showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className='input2'>
                <LockIcon />
                <input
                  type={currentForm.showConfirmPassword ? "text" : "password"}
                  placeholder='Confirm password'
                  disabled={currentForm.showOtp}
                  value={currentForm.confirmPassword}
                  onChange={e => updateCurrentForm({ confirmPassword: e.target.value })}
                  style={{
                    borderColor: currentForm.confirmPassword && currentForm.userPassword !== currentForm.confirmPassword ? "#ef4444" : undefined,
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  tabIndex={-1}
                  aria-label={currentForm.showConfirmPassword ? "Hide password" : "Show password"}
                  onClick={() => updateCurrentForm({ showConfirmPassword: !currentForm.showConfirmPassword })}
                >
                  {currentForm.showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className='passreq' onClick={() => setShowPassReq(!showPassReq)}>
              {showPassReq ? "Hide" : "View"} Password Requirements
            </div>

            {(showPassReq || (currentForm.userPassword && currentForm.userPassword.length > 0)) && (
              <div className='passreqCard'>
                <div>{validations.capitalLetter ? <img src={tickMarkValid} alt="Valid" /> : <img src={tickMark} alt="Pending" />} One Capital Letter</div>
                <div>{validations.specialCharacter ? <img src={tickMarkValid} alt="Valid" /> : <img src={tickMark} alt="Pending" />} One Special Character</div>
                <div>{validations.tenCharacters ? <img src={tickMarkValid} alt="Valid" /> : <img src={tickMark} alt="Pending" />} Ten Characters</div>
                <div>{validations.oneNumber ? <img src={tickMarkValid} alt="Valid" /> : <img src={tickMark} alt="Pending" />} One Number</div>
              </div>
            )}

            {currentForm.showOtp && (
              <>
                <div className="otpHelperText">
                  {currentForm.wrongOtp
                    ? <span className="otpError">Invalid OTP. Please enter the correct OTP.</span>
                    : "We've sent a verification code to your email. Please enter it below."
                  }
                </div>
                <div className='input2 otpInput'>
                  <OtpIcon />
                  <input
                    type="text"
                    placeholder='Enter 6-digit code'
                    value={currentForm.userOtp}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
                      const cleanDigits = pasted.replace(/[^0-9]/g, "").slice(0, 6);
                      updateCurrentForm({ userOtp: cleanDigits });
                    }}
                    onChange={e => {
                      const cleanDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      updateCurrentForm({ userOtp: cleanDigits });
                    }}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", marginBottom: "6px", fontSize: "13px" }}>
                  {resendSuccess ? (
                    <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: "600" }}>{resendSuccess}</span>
                  ) : <span></span>}
                  {resendCountdown > 0 ? (
                    <span style={{ color: "#64748b", fontSize: "12.5px" }}>
                      Resend code in <strong style={{ color: "#0d9488" }}>00:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendRegistrationOtp}
                      disabled={resendLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0d9488",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: "0",
                        textDecoration: "underline",
                        fontSize: "12.5px"
                      }}
                    >
                      {resendLoading ? "Sending..." : "Didn't receive code? Resend OTP"}
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={currentForm.showOtp ? (!currentForm.userOtp || currentForm.userOtp.trim().length === 0 || loading) : (!isFormValid || loading)}
              className={`nextStep ${(currentForm.showOtp ? (currentForm.userOtp && currentForm.userOtp.trim().length > 0 && !loading) : (isFormValid && !loading)) ? "" : "disabled"} ${loading ? "loading" : ""}`}
            >
              {loading ? (
                <span className="btn-loading-content">
                  <span className="btn-spinner" />
                  <span>{currentForm.showOtp ? "Verifying..." : "Creating Account..."}</span>
                </span>
              ) : currentForm.showOtp ? (
                "Verify & Continue"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="login-divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <div className="google-btn" onClick={handleGoogleAuth}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </div>

          <div className="login-link-section">
            Already have an account?{" "}
            <span
              className="login-link"
              onClick={() => navigate(`/login?role=${signupRole}`)}
            >
              Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHomePage;