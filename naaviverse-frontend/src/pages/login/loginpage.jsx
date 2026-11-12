import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./loginpage.scss";

import { useStore } from "../../components/store/store.ts";
import logo from '../../assets/images/logo/naavi_final_logo2.png';
import loginHero from "../../static/images/login/login_hero.png";

import loadinglogo from "./favicon3.png";
import axios from "axios";
import info from "./info.svg";
import { Loginservice, GoogleLoginservice } from "../../services/loginapis";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SvgCheck, SvgCheckCircle, SvgClose, SvgWarning, SvgStarFilled } from "../../utils/SvgIcons";
import { validateEmail } from "../../utils/emailValidator";
import tickMark from "../Registration/tick.svg";
import tickMarkValid from "../Registration/tickMarkValid.svg";


const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/* ── inline field icons (no new deps, matches signup page) ── */
const EmailIcon = () => (
    <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
        <path d="M3 6.5C3 5.67 3.67 5 4.5 5h15c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="m4 6.5 8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const LockIcon = () => (
    <svg className="fieldIcon" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="10.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

const WarningIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const SwitchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);

const EyeIcon = ({ open }) => (
    open ? (
        <svg viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.6 6.7C4.5 8.1 3 10 2.5 12c1.3 4.2 5.3 7 9.5 7 1.6 0 3.1-.4 4.4-1.1M9.9 4.2A10.6 10.6 0 0 1 12 4c4.2 0 8.2 2.8 9.5 7-.4 1.3-1 2.5-1.9 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12C3.8 7.8 7.8 5 12 5s8.2 2.8 9.5 7c-1.3 4.2-5.3 7-9.5 7s-8.2-2.8-9.5-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>
    )
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

const checkPasswordRequirements = (pwd) => {
    const password = pwd || "";
    const capitalLetter = /[A-Z]/.test(password);
    const specialCharacter = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const tenCharacters = password.length >= 10;
    const oneNumber = /[0-9]/.test(password);
    return {
        capitalLetter,
        specialCharacter,
        tenCharacters,
        oneNumber,
        isValid: capitalLetter && specialCharacter && tenCharacters && oneNumber,
    };
};

const PasswordRequirementsCard = ({ password, showToggle = true }) => {
    const [showReqs, setShowReqs] = useState(true);
    const reqs = checkPasswordRequirements(password);

    return (
        <div style={{ width: "100%", margin: "8px 0 16px 0" }}>
            {showToggle && (
                <div
                    onClick={() => setShowReqs(!showReqs)}
                    style={{
                        fontSize: "12.5px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        color: "#2c7cb2",
                        fontWeight: "500",
                        display: "inline-block",
                        userSelect: "none"
                    }}
                >
                    {showReqs ? "Hide" : "View"} Password Requirements
                </div>
            )}
            {showReqs && (
                <div style={{
                    background: "#e8f1f8",
                    border: "1px solid rgba(44, 124, 178, 0.2)",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    animation: "fadeIn 0.3s ease"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 0", fontSize: "12.5px", color: reqs.capitalLetter ? "#1e293b" : "#64748b", fontWeight: reqs.capitalLetter ? "600" : "400" }}>
                        <img src={reqs.capitalLetter ? tickMarkValid : tickMark} alt={reqs.capitalLetter ? "Valid" : "Pending"} style={{ width: "16px", height: "16px" }} />
                        One Capital Letter
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 0", fontSize: "12.5px", color: reqs.specialCharacter ? "#1e293b" : "#64748b", fontWeight: reqs.specialCharacter ? "600" : "400" }}>
                        <img src={reqs.specialCharacter ? tickMarkValid : tickMark} alt={reqs.specialCharacter ? "Valid" : "Pending"} style={{ width: "16px", height: "16px" }} />
                        One Special Character
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 0", fontSize: "12.5px", color: reqs.tenCharacters ? "#1e293b" : "#64748b", fontWeight: reqs.tenCharacters ? "600" : "400" }}>
                        <img src={reqs.tenCharacters ? tickMarkValid : tickMark} alt={reqs.tenCharacters ? "Valid" : "Pending"} style={{ width: "16px", height: "16px" }} />
                        Ten Characters
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 0", fontSize: "12.5px", color: reqs.oneNumber ? "#1e293b" : "#64748b", fontWeight: reqs.oneNumber ? "600" : "400" }}>
                        <img src={reqs.oneNumber ? tickMarkValid : tickMark} alt={reqs.oneNumber ? "Valid" : "Pending"} style={{ width: "16px", height: "16px" }} />
                        One Number
                    </div>
                </div>
            )}
        </div>
    );
};

const Loginpage = ({ initialType }) => {
    const navigate = useNavigate();
    const { loginType, setLoginType } = useStore();
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [eye, seteye] = useState(false);
    const [iserror, setiserror] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const hasGoogleToken = typeof window !== "undefined" && window.location.hash.includes("access_token");
    const [isGoogleProcessing, setIsGoogleProcessing] = useState(hasGoogleToken);
    const [isLoading, setIsLoading] = useState(hasGoogleToken);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
    const [code, setCode] = useState("");
    const [newPassword1, setNewPassword1] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    const [forgotEye1, setForgotEye1] = useState(false);
    const [forgotEye2, setForgotEye2] = useState(false);
    const [passwordResetMsg, setPasswordResetMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [forgotCountdown, setForgotCountdown] = useState(60);
    const [forgotResendLoading, setForgotResendLoading] = useState(false);
    const [forgotResendSuccess, setForgotResendSuccess] = useState("");
    const [forgotOtpError, setForgotOtpError] = useState("");
    const [forgotOtpLoading, setForgotOtpLoading] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState("");

    // Countdown timer for Forgot Password OTP
    useEffect(() => {
        let timer;
        if (forgotPassword && forgotPasswordStep === 2 && forgotCountdown > 0) {
            timer = setInterval(() => {
                setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [forgotPassword, forgotPasswordStep, forgotCountdown]);

    // Force Password Update States (when mustChangePassword is true)
    const [mustChangePasswordMode, setMustChangePasswordMode] = useState(false);
    const [forceNewPassword, setForceNewPassword] = useState("");
    const [forceConfirmPassword, setForceConfirmPassword] = useState("");
    const [forcePasswordLoading, setForcePasswordLoading] = useState(false);
    const [forcePasswordError, setForcePasswordError] = useState("");
    const [forceEye1, setForceEye1] = useState(false);
    const [forceEye2, setForceEye2] = useState(false);
    const [partnerContext, setPartnerContext] = useState(null);

    const handleSwitchRole = (targetRole) => {
        setLoginType(targetRole);
        setLoginError(null);
        setiserror(false);
        const label = targetRole === "Accountants" ? "Partner" : "User";
        toast.info(`Switched to ${label} login. Please enter your password.`, {
            position: "top-right",
            autoClose: 3000,
        });
    };

    const handleEmailBlur = async () => {
        const cleanEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) return;

        try {
            const res = await axios.post(`${BASE_URL}/api/auth/checkEmailDuplicate`, { email: cleanEmail });
            const data = res.data;
            if (data && data.exists) {
                if (data.registeredRole === "Partner" && loginType === "Users") {
                    setLoginError({
                        type: "toggle_warning",
                        targetRole: "Accountants",
                        targetRoleLabel: "Partner",
                        title: "Partner Account Detected",
                        message: "This email is registered as a Partner account.",
                        detail: "You are currently on User login. Click below to switch to Partner login.",
                        actionText: "Switch to Partner Login",
                        actionType: "switch_role",
                    });
                } else if (data.registeredRole === "User" && loginType === "Accountants") {
                    setLoginError({
                        type: "toggle_warning",
                        targetRole: "Users",
                        targetRoleLabel: "User",
                        title: "User Account Detected",
                        message: "This email is registered as a standard User account.",
                        detail: "You are currently on Partner login. Click below to switch to User login.",
                        actionText: "Switch to User Login",
                        actionType: "switch_role",
                    });
                } else if (loginError?.type === "toggle_warning") {
                    setLoginError(null);
                }
            }
        } catch (e) {
            // Ignore background check failure
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get("role");
        const type = urlParams.get("type");
        const hash = window.location.hash;
        const isGoogleAuth = hash && hash.includes("access_token");
        const storedGoogleRole = isGoogleAuth ? localStorage.getItem("googleAuthRole") : null;

        if (
            initialType === "Partner" ||
            window.location.pathname.includes("/partner/login") ||
            type === "partner" ||
            role === "Accountants" ||
            role === "partner" ||
            storedGoogleRole === "Accountants" ||
            storedGoogleRole === "partner"
        ) {
            setLoginType("Accountants");
        } else if (role === "Users" || role === "user" || type === "user" || storedGoogleRole === "Users" || storedGoogleRole === "user") {
            setLoginType("Users");
        }

        const testForgotStep = urlParams.get("testForgotStep");
        if (testForgotStep) {
            setForgotPassword(true);
            setForgotPasswordStep(parseInt(testForgotStep, 10));
        }
    }, [initialType, setLoginType]);

    // Handle Google OAuth Callback (extract token from URL hash)
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || !hash.includes("access_token")) return;

        const handleGoogleCallback = async () => {
            setIsLoading(true);
            const storedRole = localStorage.getItem("googleAuthRole") || (initialType === "Partner" ? "Accountants" : loginType) || "Users";
            const targetRole = (storedRole === "Accountants" || storedRole === "partner") ? "Accountants" : "Users";
            setLoginType(targetRole);

            try {
                // Parse access_token from hash
                const hashParams = new URLSearchParams(hash.substring(1));
                const accessToken = hashParams.get("access_token");

                // Clean hash from URL without reloading
                window.history.replaceState(null, "", window.location.pathname + window.location.search);

                if (!accessToken) {
                    setIsLoading(false);
                    return;
                }

                // Fetch Google profile
                const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                const googleUser = googleRes.data;
                console.log("[check] Google user fetched:", googleUser?.email);

                // Authenticate with backend
                const res = await GoogleLoginservice({
                    email: googleUser.email,
                    name: googleUser.name,
                    picture: googleUser.picture,
                    role: targetRole,
                });

                const result = res.data;
                if (!result.success) {
                    setLoginError({
                        type: "error",
                        title: "Login Failed",
                        message: result.message || "Failed to log in with Google.",
                    });
                    setiserror(true);
                    setIsLoading(false);
                    return;
                }

                localStorage.setItem("authToken", result.token);
                const isUserAuth = result.userType === "user" || (!result.partner && Boolean(result.user));
                localStorage.setItem("userType", isUserAuth ? "user" : "partner");
                setLoginType(isUserAuth ? "Users" : "Accountants");

                if (result.user) {
                    const userObj = {
                        ...result.user,
                        user: result.user,
                        email: result.user.email,
                        username: result.user.username,
                        name: result.user.name || result.user.username,
                        _id: result.user.id || result.user._id,
                        id: result.user.id || result.user._id,
                    };
                    localStorage.setItem("user", JSON.stringify(userObj));
                    if (result.user.name) localStorage.setItem("userName", result.user.name);
                    if (result.user.profilePicture) localStorage.setItem("userProfilePic", result.user.profilePicture);

                    try {
                        const profileRes = await axios.get(
                            `${BASE_URL}/api/users/get/${result.user.email}`
                        );
                        const profileData = profileRes.data?.data;
                        if (profileData) {
                            localStorage.setItem("userProfile", JSON.stringify(profileData));
                            if (profileData.name) {
                                localStorage.setItem("userName", profileData.name);
                                localStorage.setItem("user", JSON.stringify({
                                    ...userObj,
                                    name: profileData.name,
                                }));
                            }
                            if (profileData.profilePicture) {
                                localStorage.setItem("userProfilePic", profileData.profilePicture);
                            }
                        }
                    } catch (e) {
                        console.warn("Could not fetch profile at login:", e?.message);
                    }

                    // Clear any path data from a previous user or session
                    const prevPathOwner = localStorage.getItem("selectedPathOwner");
                    if (prevPathOwner && prevPathOwner.toLowerCase() !== result.user.email.toLowerCase()) {
                        [
                            "selectedPathId", "selectedPathName", "selectedPathSteps",
                            "selectedPathCountry", "selectedPathUniversity", "selectedPathPathway",
                            "selectedPathCountryForId", "selectedPathOwner"
                        ].forEach((k) => localStorage.removeItem(k));
                    }
                }

                const emailToStore = result?.user?.email || result?.partner?.email || googleUser.email || "";
                localStorage.setItem("loginEmail", emailToStore);

                if (isUserAuth) {
                    // Check user profile completion directly to route without flashing the dashboard
                    let isComplete = false;
                    try {
                        const profileRes = await axios.get(
                            `${BASE_URL}/api/users/get/${result.user.email}`
                        );
                        const profileData = profileRes.data?.data;
                        if (profileData) {
                            isComplete =
                                profileData.isProfileCompleted === true ||
                                Boolean(
                                    profileData.name &&
                                    profileData.username &&
                                    profileData.phoneNumber &&
                                    profileData.school &&
                                    profileData.personality
                                );
                        }
                    } catch (e) {
                        console.warn("Could not check user profile completion:", e?.message);
                    }

                    if (!isComplete) {
                        navigate("/dashboard/users/profile", { replace: true });
                    } else {
                        // Check live approval status before routing to home
                        let approvalStatus = "pending";
                        try {
                            const approvalRes = await axios.get(
                                `${BASE_URL}/api/approvals/status?email=${result.user.email}&role=User`
                            );
                            approvalStatus = approvalRes.data?.data?.status || "pending";
                        } catch (e) {
                            console.warn("Could not check approval status:", e?.message);
                        }

                        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                        localStorage.setItem("user", JSON.stringify({
                            ...currentUser,
                            approvalStatus,
                        }));

                        if (approvalStatus === "approved") {
                            navigate("/dashboard/users/home", { replace: true });
                        } else {
                            navigate("/dashboard/users/profile", { replace: true });
                        }
                    }
                } else {
                    const partnerData = result.partner || {};
                    let isProfileComplete = false;
                    try {
                        const profileRes = await axios.get(
                            `${BASE_URL}/api/partner/get?email=${emailToStore}`
                        );
                        const raw = profileRes.data?.data || {};
                        const hasProfile = Boolean(
                            (raw.businessName && String(raw.businessName).trim() !== "") ||
                            (raw.firstName && String(raw.firstName).trim() !== "") ||
                            raw.logo
                        );
                        isProfileComplete = hasProfile;
                    } catch (profileErr) {
                        console.warn("Could not fetch partner profile at login:", profileErr?.message);
                    }

                    const currentApprovalStatus = partnerData.approvalStatus || (isProfileComplete ? "pending" : "not_submitted");
                    const enrichedPartner = {
                        ...partnerData,
                        creationSource: partnerData.creationSource || "self_registered",
                        approvalStatus: currentApprovalStatus,
                        mustChangePassword: false,
                    };
                    localStorage.setItem("partner", JSON.stringify(enrichedPartner));

                    if (currentApprovalStatus === "approved") {
                        navigate("/dashboard/accountants/home", { replace: true });
                    } else {
                        navigate("/dashboard/accountants/profile", { replace: true });
                    }
                }
            } catch (error) {
                setIsGoogleProcessing(false);
                setIsLoading(false);
                console.error("Google Auth Callback Error:", error);
                const errData = error.response?.data;
                const code = errData?.code;
                const msg = errData?.message;
                const registeredRole = errData?.registeredRole;

                if (code === "REGISTERED_AS_PARTNER" || registeredRole === "Partner") {
                    setLoginError({
                        type: "toggle_warning",
                        targetRole: "Accountants",
                        targetRoleLabel: "Partner",
                        title: "Registered as Partner",
                        message: "This email is registered as a Partner account.",
                        detail: "You tried signing in as a User. Switch to Partner login to continue with this account.",
                        actionText: "Switch to Partner Login",
                        actionType: "switch_role",
                    });
                } else if (code === "REGISTERED_AS_USER" || registeredRole === "User") {
                    setLoginError({
                        type: "toggle_warning",
                        targetRole: "Users",
                        targetRoleLabel: "User",
                        title: "Registered as User",
                        message: "This email is registered as a User account.",
                        detail: "You tried signing in as a Partner. Switch to User login to continue with this account.",
                        actionText: "Switch to User Login",
                        actionType: "switch_role",
                    });
                } else {
                    setLoginType(targetRole);
                    setLoginError({
                        type: "error",
                        title: "Google Sign-In Failed",
                        message: msg || "Failed to authenticate with Google. Please try again.",
                    });
                    setiserror(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        handleGoogleCallback();
    }, [navigate, loginType]);

    const getProfilePic = async (email, loginType) => {
        try {
            const url =
                loginType === "Users"
                    ? `${BASE_URL}/api/auth/get-profile-pic`
                    : `${BASE_URL}/api/partner/get-profile-pic`;

            const response = await axios.get(url, { params: { email } });

            if (response.data.status && response.data.profilePic) {
                localStorage.setItem("userProfilePic", response.data.profilePic);
                return response.data.profilePic;
            }

            return null;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn("No profile picture found, using default.");
                return null;
            }
            console.error("Error fetching profile picture:", error);
            return null;
        }
    };

    const handleLogin = async (overrideRole) => {
        setIsLoading(true);
        setLoginError(null);
        setiserror(false);
        const currentRole = overrideRole || loginType;
        const cleanEmail = (email || "").trim();
        const obj = { email: cleanEmail, password };

        try {
            const response = await Loginservice(obj, currentRole);
            const result = response.data;

            console.log("[fire] FULL LOGIN RESPONSE:", result);

            if (!result?.token) {
                console.error("Login failed:", result?.message || "Unknown error");
                setLoginError({
                    type: "error",
                    title: "Login Failed",
                    message: result?.message || "Invalid credentials. Please try again.",
                });
                setiserror(true);
                setIsLoading(false);
                return;
            }

            localStorage.setItem("authToken", result.token);

            if (result.user) {
                const fullUser = {
                    ...result.user,
                    user: result.user,
                    approvalStatus: result.user.approvalStatus || "approved",
                };
                localStorage.setItem("user", JSON.stringify(fullUser));
            }

            localStorage.setItem("userType", currentRole === "Users" ? "user" : "partner");

            const emailToStore =
                result?.user?.email ||
                result?.partner?.email ||
                cleanEmail ||
                "";

            localStorage.setItem("loginEmail", emailToStore);

            console.log("[fire] STORED EMAIL:", emailToStore);

            if (currentRole === "Users") {
                if (result.user) {
                    let userObj = {
                        ...result.user,
                        user: result.user,
                        approvalStatus: result.user.approvalStatus || "approved",
                    };
                    localStorage.setItem("user", JSON.stringify(userObj));

                    if (result.user.profilePicture) {
                        localStorage.setItem("userProfilePic", result.user.profilePicture);
                    }

                    try {
                        const profileRes = await axios.get(
                            `${BASE_URL}/api/users/get/${result.user.email}`
                        );
                        const profileData = profileRes.data?.data;
                        if (profileData) {
                            localStorage.setItem("userProfile", JSON.stringify(profileData));
                            if (profileData.name) {
                                localStorage.setItem("userName", profileData.name);
                                userObj.name = profileData.name;
                            }
                            if (profileData.profilePicture) {
                                localStorage.setItem("userProfilePic", profileData.profilePicture);
                            }
                        }
                    } catch (e) {
                        console.warn("Could not fetch profile at login:", e?.message);
                    }

                    // Check live approval status
                    let approvalStatus = result.user.approvalStatus || "approved";
                    try {
                        const approvalRes = await axios.get(
                            `${BASE_URL}/api/approvals/status?email=${result.user.email}&role=User`
                        );
                        if (approvalRes.data?.data?.status) {
                            approvalStatus = approvalRes.data.data.status;
                        }
                    } catch (e) {
                        console.warn("Could not fetch approval status at login:", e?.message);
                    }

                    userObj.approvalStatus = approvalStatus;
                    localStorage.setItem("user", JSON.stringify(userObj));

                    // Clear path data ONLY if switching to a different user account
                    const prevPathOwner = localStorage.getItem("selectedPathOwner");
                    if (prevPathOwner && prevPathOwner.toLowerCase() !== result.user.email.toLowerCase()) {
                        [
                            "selectedPathId", "selectedPathName", "selectedPathSteps",
                            "selectedPathCountry", "selectedPathUniversity", "selectedPathPathway",
                            "selectedPathCountryForId", "selectedPathOwner"
                        ].forEach((k) => localStorage.removeItem(k));
                    }

                    // Restore user's selected path from database if present
                    if (result.user.selectedPath) {
                        localStorage.setItem("selectedPathId", String(result.user.selectedPath));
                        localStorage.setItem("selectedPathOwner", result.user.email.toLowerCase());
                    } else if (!localStorage.getItem("selectedPathId")) {
                        try {
                            const selRes = await axios.get(`${BASE_URL}/api/userpaths/selected?email=${result.user.email}`);
                            if (selRes.data?.pathId) {
                                localStorage.setItem("selectedPathId", String(selRes.data.pathId));
                                localStorage.setItem("selectedPathOwner", result.user.email.toLowerCase());
                            }
                        } catch (_) {}
                    }

                    try {
                        window.dispatchEvent(new Event("naavi:login"));
                    } catch (_) {}
                    if (approvalStatus === "approved") {
                        navigate("/dashboard/users/home");
                    } else {
                        navigate("/dashboard/users/profile");
                    }
                }

            } else {
                const partnerData = result.partner || {};

                const isInternal = partnerData.creationSource === "admin_created" || String(partnerData.partnerType).toLowerCase() === "internal";

                let approvalStatus = partnerData.approvalStatus || (isInternal ? "approved" : "");

                if (isInternal) {
                    approvalStatus = "approved";
                } else {
                    try {
                        const approvalRes = await axios.get(
                            `${BASE_URL}/api/approvals/status?email=${emailToStore}`
                        );
                        const liveStatus = approvalRes.data?.data?.status;
                        if (liveStatus) {
                            approvalStatus = liveStatus;
                            console.log("[check] Approval status fetched at login:", liveStatus);
                        } else if (!approvalStatus) {
                            approvalStatus = "not_submitted";
                        }
                    } catch (approvalErr) {
                        console.warn("Could not fetch approval status at login:", approvalErr?.message);
                        if (!approvalStatus) approvalStatus = "not_submitted";
                    }
                }

                let profileData = {};
                let rawMustChange = false;
                try {
                    const profileRes = await axios.get(
                        `${BASE_URL}/api/partner/get?email=${emailToStore}`
                    );
                    const raw = profileRes.data?.data || {};
                    if (raw) {
                        rawMustChange = raw.mustChangePassword === true || raw.mustChangePassword === "true";
                        profileData = {
                            firstName: raw.firstName,
                            lastName: raw.lastName,
                            businessName: raw.businessName,
                            website: raw.website,
                            mustChangePassword: rawMustChange,
                        };
                        console.log("[check] Partner profile fetched at login:", profileData.businessName);
                    }
                } catch (profileErr) {
                    console.warn("Could not fetch partner profile at login:", profileErr?.message);
                }

                const mustChange =
                    partnerData?.mustChangePassword === true ||
                    partnerData?.mustChangePassword === "true" ||
                    result?.partner?.mustChangePassword === true ||
                    result?.partner?.mustChangePassword === "true" ||
                    result?.mustChangePassword === true ||
                    result?.mustChangePassword === "true" ||
                    rawMustChange;

                const enrichedPartner = {
                    ...partnerData,
                    creationSource: partnerData.creationSource || (isInternal ? "admin_created" : "self_registered"),
                    approvalStatus,
                    ...profileData,
                    mustChangePassword: mustChange,
                };
                localStorage.setItem("partner", JSON.stringify(enrichedPartner));

                console.log("[check] Partner saved to localStorage. mustChangePassword:", mustChange, "approvalStatus:", approvalStatus);

                // Check if internal partner must update temporary password
                if (mustChange) {
                    console.log("[lock] Partner must change temporary password before dashboard access");
                    setPartnerContext({
                        partnerData: enrichedPartner,
                        emailToStore,
                        profileData,
                    });
                    setMustChangePasswordMode(true);
                    setIsLoading(false);
                    return;
                }

                const isProfileComplete = Boolean(
                    (profileData?.businessName && String(profileData.businessName).trim() !== "") ||
                    (profileData?.firstName && String(profileData.firstName).trim() !== "")
                );

                if (isInternal || approvalStatus === "approved" || partnerData.accountStatus === "active") {
                    // Approved partner -> direct home access
                    navigate("/dashboard/accountants/home");
                } else {
                    // Pending approval, rejected, or new partner -> profile page
                    navigate("/dashboard/accountants/profile");
                }
            }

            getProfilePic(emailToStore, loginType);
            setiserror(false);
            setLoginError(null);

        } catch (error) {
            console.error("Error during login:", error.message || error);
            const errData = error.response?.data;
            const code = errData?.code;
            const msg = errData?.message;
            const registeredRole = errData?.registeredRole;

            if ((code === "REGISTERED_AS_PARTNER" || registeredRole === "Partner") && currentRole === "Users") {
                setLoginType("Accountants");
                if (password) {
                    return handleLogin("Accountants");
                }
                setLoginError({
                    type: "toggle_warning",
                    targetRole: "Accountants",
                    targetRoleLabel: "Partner",
                    title: "Registered as Partner",
                    message: "This email is registered as a Partner account.",
                    detail: "Switched to Partner login. Please enter your password to continue.",
                    actionText: "Switch to Partner Login",
                    actionType: "switch_role",
                });
                toast.info("Switched to Partner login. Please enter your password to continue.", {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else if ((code === "REGISTERED_AS_USER" || registeredRole === "User") && currentRole === "Accountants") {
                setLoginType("Users");
                if (password) {
                    return handleLogin("Users");
                }
                setLoginError({
                    type: "toggle_warning",
                    targetRole: "Users",
                    targetRoleLabel: "User",
                    title: "Registered as User",
                    message: "This email is registered as a User account.",
                    detail: "Switched to User login. Please enter your password to continue.",
                    actionText: "Switch to User Login",
                    actionType: "switch_role",
                });
                toast.info("Switched to User login. Please enter your password to continue.", {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else if (error.response?.status === 403) {
                setLoginError({
                    type: "error",
                    title: "Account Inactive",
                    message: msg || "Your account is currently inactive. Please contact the administrator.",
                });
            } else if (code === "USER_NOT_FOUND" || code === "PARTNER_NOT_FOUND" || error.response?.status === 404) {
                setLoginError({
                    type: "not_found",
                    title: "Account Not Found",
                    message: loginType === "Users"
                        ? "No User account exists with this email address."
                        : "No Partner account exists with this email address.",
                    detail: "Please check your email address or create a new account.",
                    actionText: "Create New Account",
                    actionType: "register",
                });
            } else if (code === "INVALID_PASSWORD") {
                setLoginError({
                    type: "invalid_password",
                    title: "Incorrect Password",
                    message: "The password you entered is incorrect.",
                    detail: "Please check your password or reset it if forgotten.",
                    actionText: "Forgot Password?",
                    actionType: "forgot_password",
                });
            } else if (code === "OTP_NOT_VERIFIED") {
                setLoginError({
                    type: "error",
                    title: "Email Verification Required",
                    message: msg || "Please verify your email via OTP before logging in.",
                });
            } else if (!error.response || error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
                setLoginError({
                    type: "error",
                    title: "Server Connection Error",
                    message: "Unable to reach the backend server on port 4545. Please ensure the server is active.",
                });
            } else {
                setLoginError({
                    type: "error",
                    title: "Sign In Error",
                    message: msg || "The credentials you entered are incorrect. Please try again or reset your password.",
                });
            }
            setiserror(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = () => {
        const effectiveType = (initialType === "Partner" || window.location.pathname.includes("/partner/login"))
            ? "Accountants"
            : loginType;
        const isUser = effectiveType === "Users";
        const role = isUser ? "user" : "partner";
        localStorage.setItem("userType", role);
        localStorage.setItem("googleAuthRole", effectiveType);

        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        const redirectUri = encodeURIComponent(`${window.location.origin}/login`);

        if (!clientId) {
            toast.error(
                "Google Client ID is missing. Please add REACT_APP_GOOGLE_CLIENT_ID to your .env file."
            );
            return;
        }

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

        window.location.href = googleAuthUrl;
    };

    const handleForcePasswordUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!forceNewPassword || !forceConfirmPassword) {
            setForcePasswordError("Please enter and confirm your new password.");
            return;
        }
        const forceReqs = checkPasswordRequirements(forceNewPassword);
        if (!forceReqs.isValid) {
            setForcePasswordError("Password must be at least 10 characters and contain a capital letter, number, and special character.");
            return;
        }
        if (forceNewPassword !== forceConfirmPassword) {
            setForcePasswordError("New passwords do not match.");
            return;
        }

        try {
            setForcePasswordLoading(true);
            setForcePasswordError("");
            const res = await axios.post(`${BASE_URL}/api/partner/internal/change-password`, {
                email: partnerContext?.emailToStore || email,
                oldPassword: password,
                newPassword: forceNewPassword,
            });

            if (res.data && res.data.success) {
                // Update partner object in localStorage so mustChangePassword is false
                const stored = JSON.parse(localStorage.getItem("partner") || "{}");
                localStorage.setItem("partner", JSON.stringify({
                    ...stored,
                    mustChangePassword: false,
                }));

                // Proceed to partner dashboard
                if (partnerContext?.profileData?.businessName) {
                    navigate("/dashboard/accountants/home");
                } else {
                    navigate("/dashboard/accountants/profile");
                }
            } else {
                setForcePasswordError(res.data?.message || "Error updating password.");
            }
        } catch (err) {
            console.error("Force password update error:", err);
            setForcePasswordError(err.response?.data?.message || "Failed to update password. Please try again.");
        } finally {
            setForcePasswordLoading(false);
        }
    };

    const initiateForgotPassword = async () => {
        const cleanEmail = (email || "").trim();
        if (!cleanEmail) {
            toast.error("Please enter your email address.");
            return;
        }

        const emailValidation = validateEmail(cleanEmail);
        if (!emailValidation.isValid) {
            toast.error(emailValidation.message || "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${BASE_URL}/${loginType === "Users" ? "api/auth" : "api/partner"}/forgotPassword`,
                { email: cleanEmail.toLowerCase() }
            );

            const result = response.data;

            if (result?.success) {
                setForgotPasswordStep(2);
                setForgotCountdown(60);
                setForgotResendSuccess("");
                toast.success("Verification code sent to your email!");
            } else {
                toast.error(result?.message || "Failed to send reset code. Please check your email.");
            }
        } catch (error) {
            console.error("Error in initiateForgotPassword:", error);
            const errMsg = error.response?.data?.message || "Failed to send reset email. Please enter a registered email.";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendForgotOtp = async () => {
        if (forgotCountdown > 0 || forgotResendLoading || !email) return;
        const cleanEmail = (email || "").trim();
        const emailValidation = validateEmail(cleanEmail);
        if (!emailValidation.isValid) {
            toast.error(emailValidation.message || "Please enter a valid email address.");
            return;
        }

        setForgotResendLoading(true);
        setForgotResendSuccess("");
        setForgotOtpError("");
        try {
            const response = await axios.post(
                `${BASE_URL}/${loginType === "Users" ? "api/auth" : "api/partner"}/forgotPassword`,
                { email: cleanEmail.toLowerCase() }
            );
            if (response.data?.success) {
                setForgotCountdown(60);
                setCode("");
                setForgotOtpError("");
                setForgotResendSuccess("A new code has been sent to your email.");
                toast.success("New verification code sent to your email!");
                setTimeout(() => setForgotResendSuccess(""), 4000);
            } else {
                toast.error(response.data?.message || "Failed to resend code.");
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || "Failed to resend code. Please try again.";
            toast.error(errMsg);
        } finally {
            setForgotResendLoading(false);
        }
    };

    const handleVerifyForgotOtp = async (e) => {
        if (e) e.preventDefault();
        const cleanCode = (code || "").trim();
        if (!cleanCode || cleanCode.length !== 6) {
            const msg = "Please enter the 6-digit verification code.";
            setForgotOtpError(msg);
            toast.error(msg);
            return;
        }

        const cleanEmail = (email || "").trim().toLowerCase();
        if (!cleanEmail) {
            const msg = "Email address is missing. Please restart the reset process.";
            setForgotOtpError(msg);
            toast.error(msg);
            return;
        }

        setForgotOtpLoading(true);
        setForgotOtpError("");
        try {
            const url = `${BASE_URL}/${loginType === "Users" ? "api/auth" : "api/partner"}/verifyotp`;
            const response = await axios.post(url, {
                email: cleanEmail,
                otp: cleanCode,
                purpose: "forgot_password",
                type: "forgot_password",
            });

            if (response.data?.success) {
                setForgotOtpError("");
                toast.success("OTP verified successfully!");
                setForgotPasswordStep(3);
            } else {
                const msg = response.data?.message || "Invalid OTP. Please enter the correct OTP.";
                setForgotOtpError(msg);
                toast.error(msg);
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            const serverMsg = error.response?.data?.message;
            let displayMsg = "Invalid OTP. Please enter the correct OTP.";
            if (serverMsg) {
                if (serverMsg.toLowerCase().includes("expired")) {
                    displayMsg = "OTP expired. Please request a new verification code.";
                } else if (
                    serverMsg.toLowerCase().includes("invalid") ||
                    serverMsg.toLowerCase().includes("match") ||
                    serverMsg.toLowerCase().includes("incorrect") ||
                    serverMsg.toLowerCase().includes("wrong")
                ) {
                    displayMsg = "Invalid OTP. Please enter the correct OTP.";
                } else {
                    displayMsg = serverMsg;
                }
            }
            setForgotOtpError(displayMsg);
            toast.error(displayMsg);
        } finally {
            setForgotOtpLoading(false);
        }
    };

    const submitForgotPassword = async () => {
        if (!code || !newPassword2) return;

        const obj = {
            email: (email || "").trim().toLowerCase(),
            code,
            newPassword: newPassword2,
        };

        try {
            setLoading(true);
            setResetPasswordError("");
            const response = await axios.post(
                `${BASE_URL}/${loginType === "Users" ? "api/auth" : "api/partner"}/updatepassword`,
                obj
            );

            const result = response.data;
            if (result?.success) {
                toast.success("Password updated successfully! Please log in with your new password.");
                setPasswordResetMsg("Password reset successfully");
                setForgotPassword(false);
                setForgotPasswordStep(1);
                setemail("");
                setCode("");
                setNewPassword1("");
                setNewPassword2("");
                setForgotOtpError("");
                setResetPasswordError("");
            } else {
                const msg = result?.message || "Password reset failed. Please try again.";
                setResetPasswordError(msg);
                toast.error(msg);
            }
        } catch (error) {
            const serverMsg = error.response?.data?.message;
            const errMsg = serverMsg || "Error submitting password reset. Please try again.";

            const isOtpError =
                errMsg.toLowerCase().includes("otp") ||
                errMsg.toLowerCase().includes("code") ||
                errMsg.toLowerCase().includes("verification");

            if (isOtpError) {
                const otpErrMsg = "Invalid OTP. Please enter the correct OTP.";
                setForgotOtpError(otpErrMsg);
                toast.error(otpErrMsg);
                // Redirect user back to Step 2 so they can enter the correct OTP
                setCode("");
                setForgotPasswordStep(2);
            } else {
                setResetPasswordError(errMsg);
                toast.error(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const heroContent = {
        Users: {
            badge: "Student & Professional Platform",
            title: "Navigate Your",
            highlight: "Career Path",
            subtitle: "Access personalized career assessments, skill-building pathways, and expert mentorship to achieve your professional goals.",
            stats: [
                { value: "10K+", label: "Active Users" },
                { value: "500+", label: "Career Paths" },
                { value: "98%", label: "Satisfaction" },
            ],
        },
        Accountants: {
            badge: "Partner Business Suite",
            title: "Grow Your",
            highlight: "Business",
            subtitle: "Join our network of trusted partners. Manage clients, expand your reach, and access exclusive tools designed for your success.",
            stats: [
                { value: "2K+", label: "Partners" },
                { value: "50K+", label: "Clients Served" },
                { value: <>4.9 <SvgStarFilled size={14} color="#f59e0b" style={{ verticalAlign: "middle" }} /></>, label: "Partner Rating" },
            ],
        },
        ForgotPasswordUsers: {
            badge: "Account Security & Recovery",
            title: "Reset Your",
            highlight: "Password",
            subtitle: "Follow the simple verification steps to securely reset your credentials and access your dashboard.",
            stats: [
                { value: "100%", label: "Secure Recovery" },
                { value: "256-bit", label: "Encryption" },
                { value: "Instant", label: "Verification" },
            ],
        },
        ForgotPasswordPartners: {
            badge: "Partner Account Security",
            title: "Recover Partner",
            highlight: "Account",
            subtitle: "Reset your partner password securely to regain access to your client management dashboard.",
            stats: [
                { value: "100%", label: "Secure Recovery" },
                { value: "256-bit", label: "Encryption" },
                { value: "Instant", label: "Verification" },
            ],
        },
    };

    const hero = forgotPassword
        ? (loginType === "Accountants" ? heroContent.ForgotPasswordPartners : heroContent.ForgotPasswordUsers)
        : (heroContent[loginType] || heroContent.Users);

    // ── RENDER: FORGOT PASSWORD FLOWS ──
    const renderForgotPassword = () => {
        if (forgotPasswordStep === 1) {
            return (
                <div className="login-box">
                    <div className="full-logo-box">
                        <img className="full-logo" src={logo} alt="Naaviverse" />
                    </div>
                    <div className="login-welcome">
                        <div className="auth-step-pill">Step 1 of 4</div>
                        <div className="welcome-title">Reset Password</div>
                        <div className="welcome-subtitle">Enter your email address and we'll send you a verification code.</div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!loading && email) initiateForgotPassword();
                        }}
                        style={{ width: "100%" }}
                    >
                        <div className="input-box">
                            <EmailIcon />
                            <input
                                className="input-inp"
                                type="email"
                                placeholder="Email address"
                                required
                                value={email}
                                autoCapitalize="none"
                                autoComplete="email"
                                onInput={(e) => {
                                    setiserror(false);
                                    setemail(e.target.value);
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`login-btn ${loading || !email ? "disabled" : ""}`}
                            disabled={loading || !email}
                        >
                            {loading ? "Sending..." : "Send Verification Code"}
                        </button>
                    </form>
                    <div className="login-footer-link" style={{ marginTop: "20px" }}>
                        Remember your password?{" "}
                        <span
                            className="link-highlight"
                            onClick={() => {
                                setForgotPassword(false);
                                setForgotPasswordStep(1);
                                setemail("");
                                setCode("");
                                setForgotOtpError("");
                                setResetPasswordError("");
                                setLoading(false);
                            }}
                        >
                            Sign In
                        </span>
                    </div>
                </div>
            );
        }

        if (forgotPasswordStep === 2) {
            return (
                <div className="login-box">
                    <div className="full-logo-box">
                        <img className="full-logo" src={logo} alt="Naaviverse" />
                    </div>
                    <div className="login-welcome">
                        <div className="auth-step-pill">Step 2 of 4</div>
                        <div className="welcome-title">Verify Code</div>
                        <div className="welcome-subtitle">We've sent a 6-digit verification code to your email. Please enter it below.</div>
                    </div>
                    <form
                        onSubmit={handleVerifyForgotOtp}
                        style={{ width: "100%" }}
                    >
                        {forgotOtpError && (
                            <div className="prompt-div" style={{ marginBottom: "12px" }}>
                                <SvgWarning size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>{forgotOtpError}</span>
                            </div>
                        )}
                        <div className={`input-box otp-box ${forgotOtpError ? "input-error" : ""}`}>
                            <OtpIcon />
                            <input
                                className="input-inp"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
                                    const cleanDigits = pasted.replace(/[^0-9]/g, "").slice(0, 6);
                                    setCode(cleanDigits);
                                    setForgotOtpError("");
                                }}
                                onChange={(e) => {
                                    const cleanDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                    setCode(cleanDigits);
                                    setForgotOtpError("");
                                }}
                                onInput={(e) => {
                                    const cleanDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                    setCode(cleanDigits);
                                    setForgotOtpError("");
                                }}
                                maxLength={6}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", marginBottom: "16px", fontSize: "13px" }}>
                            {forgotResendSuccess ? (
                                <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: "600" }}>{forgotResendSuccess}</span>
                            ) : <span></span>}
                            {forgotCountdown > 0 ? (
                                <span style={{ color: "#64748b", fontSize: "12.5px" }}>
                                    Resend code in <strong style={{ color: "#0d9488" }}>00:{forgotCountdown < 10 ? `0${forgotCountdown}` : forgotCountdown}</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendForgotOtp}
                                    disabled={forgotResendLoading}
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
                                    {forgotResendLoading ? "Sending..." : "Didn't receive code? Resend OTP"}
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className={`login-btn ${code?.length === 6 && !forgotOtpLoading ? "" : "disabled"}`}
                            disabled={code?.length !== 6 || forgotOtpLoading}
                        >
                            {forgotOtpLoading ? "Verifying..." : "Verify Code"}
                        </button>
                    </form>
                    <div className="login-footer-link" style={{ marginTop: "20px" }}>
                        <span
                            className="link-highlight"
                            onClick={() => {
                                setForgotPasswordStep(1);
                                setCode("");
                                setForgotOtpError("");
                            }}
                        >
                            ← Back to Email
                        </span>
                    </div>
                </div>
            );
        }

        if (forgotPasswordStep === 3) {
            const reqs = checkPasswordRequirements(newPassword1);

            return (
                <div className="login-box">
                    <div className="full-logo-box">
                        <img className="full-logo" src={logo} alt="Naaviverse" />
                    </div>
                    <div className="login-welcome">
                        <div className="auth-step-pill">Step 3 of 4</div>
                        <div className="welcome-title">New Password</div>
                        <div className="welcome-subtitle">Create a strong password for your account (minimum 10 characters).</div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (reqs.isValid) setForgotPasswordStep(4);
                        }}
                        style={{ width: "100%" }}
                    >
                        <div className="input-box password-box">
                            <LockIcon />
                            <input
                                className="input-inp"
                                type={forgotEye1 ? "text" : "password"}
                                placeholder="Create new password"
                                value={newPassword1}
                                onInput={(e) => setNewPassword1(e.target.value)}
                            />
                            <div className="eye-icon" onClick={() => setForgotEye1(!forgotEye1)}>
                                <EyeIcon open={forgotEye1} />
                            </div>
                        </div>

                        <PasswordRequirementsCard password={newPassword1} />

                        <button
                            type="submit"
                            className={`login-btn ${reqs.isValid ? "" : "disabled"}`}
                            disabled={!reqs.isValid}
                        >
                            Continue
                        </button>
                    </form>
                    <div className="login-footer-link" style={{ marginTop: "20px" }}>
                        <span
                            className="link-highlight"
                            onClick={() => {
                                setForgotPasswordStep(2);
                                setNewPassword1("");
                            }}
                        >
                            ← Back to Code Verification
                        </span>
                    </div>
                </div>
            );
        }

        if (forgotPasswordStep === 4) {
            const reqs = checkPasswordRequirements(newPassword1);
            const isMatching = (newPassword2 || "").length > 0 && newPassword2 === newPassword1;
            const isValid = reqs.isValid && isMatching;

            return (
                <div className="login-box">
                    <div className="full-logo-box">
                        <img className="full-logo" src={logo} alt="Naaviverse" />
                    </div>
                    <div className="login-welcome">
                        <div className="auth-step-pill">Step 4 of 4</div>
                        <div className="welcome-title">Confirm Password</div>
                        <div className="welcome-subtitle">Re-enter your new password to confirm.</div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (isValid && !loading) {
                                submitForgotPassword();
                            }
                        }}
                        style={{ width: "100%" }}
                    >
                        {resetPasswordError && (
                            <div className="prompt-div" style={{ marginBottom: "12px" }}>
                                <SvgWarning size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>{resetPasswordError}</span>
                            </div>
                        )}
                        <div className={`input-box password-box ${resetPasswordError ? "input-error" : ""}`}>
                            <LockIcon />
                            <input
                                className="input-inp"
                                type={forgotEye2 ? "text" : "password"}
                                placeholder="Confirm password"
                                value={newPassword2}
                                onInput={(e) => {
                                    setNewPassword2(e.target.value);
                                    setResetPasswordError("");
                                }}
                            />
                            <div className="eye-icon" onClick={() => setForgotEye2(!forgotEye2)}>
                                <EyeIcon open={forgotEye2} />
                            </div>
                        </div>

                        {newPassword2?.length > 0 && (
                            <div style={{
                                fontSize: "0.8rem",
                                fontWeight: "500",
                                marginTop: "6px",
                                marginBottom: "14px",
                                paddingLeft: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: isMatching ? "#16a34a" : "#dc2626"
                            }}>
                                {isMatching ? (
                                    <><span><SvgCheck size={14} /></span> Passwords match</>
                                ) : (
                                    <><span><SvgClose size={14} /></span> Passwords do not match</>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`login-btn ${isValid && !loading ? "" : "disabled"}`}
                            disabled={!isValid || loading}
                        >
                            {loading ? "Resetting Password..." : "Reset Password"}
                        </button>
                    </form>
                    <div className="login-footer-link" style={{ marginTop: "20px" }}>
                        <span
                            className="link-highlight"
                            onClick={() => {
                                setForgotPasswordStep(3);
                                setNewPassword2("");
                                setResetPasswordError("");
                            }}
                        >
                            ← Back to New Password
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    // ── RENDER: FORCE PASSWORD CHANGE FORM (Internal Partner First Login) ──
    const renderForcePasswordChange = () => {
        const reqs = checkPasswordRequirements(forceNewPassword);
        const isMatching = forceConfirmPassword.length > 0 && forceNewPassword === forceConfirmPassword;
        const isPasswordValid = reqs.isValid && isMatching;

        return (
            <div className="login-box">
                <div className="full-logo-box">
                    <img className="full-logo" src={logo} alt="Naaviverse" />
                </div>

                <div className="login-welcome">
                    <div className="welcome-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Set Permanent Password</span>
                    </div>
                    <div className="welcome-subtitle">
                        You are logging in with a temporary password. Please set your new permanent password to secure your partner account (minimum 10 characters).
                    </div>
                </div>

                {forcePasswordError && (
                    <div className="prompt-div" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span><SvgWarning size={14} /> {forcePasswordError}</span>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isPasswordValid && !forcePasswordLoading) {
                            handleForcePasswordUpdate(e);
                        }
                    }}
                    style={{ width: "100%" }}
                >
                    <div className="input-box password-box">
                        <LockIcon />
                        <input
                            className="input-inp"
                            type={forceEye1 ? "text" : "password"}
                            placeholder="New Password (min. 10 characters)"
                            value={forceNewPassword}
                            onChange={(e) => {
                                setForcePasswordError("");
                                setForceNewPassword(e.target.value);
                            }}
                        />
                        <div className="eye-icon" onClick={() => setForceEye1(!forceEye1)}>
                            <EyeIcon open={forceEye1} />
                        </div>
                    </div>

                    <PasswordRequirementsCard password={forceNewPassword} />

                    <div className="input-box password-box" style={{ marginTop: "12px" }}>
                        <LockIcon />
                        <input
                            className="input-inp"
                            type={forceEye2 ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={forceConfirmPassword}
                            onChange={(e) => {
                                setForcePasswordError("");
                                setForceConfirmPassword(e.target.value);
                            }}
                        />
                        <div className="eye-icon" onClick={() => setForceEye2(!forceEye2)}>
                            <EyeIcon open={forceEye2} />
                        </div>
                    </div>

                    {forceConfirmPassword.length > 0 && (
                        <div style={{
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            marginTop: "6px",
                            paddingLeft: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: isMatching && reqs.isValid ? "#16a34a" : "#dc2626"
                        }}>
                            {isMatching && reqs.isValid ? (
                                <><span><SvgCheck size={14} /></span> Passwords match</>
                            ) : !reqs.isValid ? (
                                <><span><SvgClose size={14} /></span> Password does not meet all requirements</>
                            ) : (
                                <><span><SvgClose size={14} /></span> Passwords do not match</>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`login-btn ${forcePasswordLoading || !isPasswordValid ? "disabled" : ""}`}
                        style={{ marginTop: "20px" }}
                        disabled={!isPasswordValid || forcePasswordLoading}
                    >
                        {forcePasswordLoading ? "Updating Password..." : "Set Password & Continue"}
                    </button>
                </form>
            </div>
        );
    };

    // ── RENDER: MAIN LOGIN FORM ──
    const renderLoginForm = () => (
        <div className="login-box">
            <div className="full-logo-box">
                <img className="full-logo" src={logo} alt="Naaviverse" />
            </div>

            <div className="login-welcome">
                <div className="welcome-title">
                    {loginType === "Users" ? "Welcome Back" : "Partner Login"}
                </div>
                <div className="welcome-subtitle">
                    {loginType === "Users"
                        ? "Sign in to continue your career journey"
                        : "Access your partner dashboard and manage your business"}
                </div>
            </div>

            <div className="toggle-box">
                <div
                    className={`toggle-each ${loginType === "Users" ? "toggle-each-active" : ""}`}
                    onClick={() => {
                        setLoginType("Users");
                        setLoginError(null);
                        setiserror(false);
                    }}
                >
                    <UserToggleIcon /> User
                </div>
                <div
                    className={`toggle-each ${loginType === "Accountants" ? "toggle-each-active" : ""}`}
                    onClick={() => {
                        setLoginType("Accountants");
                        setLoginError(null);
                        setiserror(false);
                    }}
                >
                    <PartnerToggleIcon /> Partner
                </div>
            </div>

            {passwordResetMsg && (
                <div className="success-message">
                    <SvgCheckCircle size={14} /> {passwordResetMsg}
                </div>
            )}

            {loginError && loginError.type === "toggle_warning" && (
                <div className="toggle-warning-box">
                    <div className="warning-header">
                        <WarningIcon />
                        <span>{loginError.title || "Role Mismatch"}</span>
                    </div>
                    <div className="warning-message">
                        <div>{loginError.message}</div>
                        {loginError.detail && <div className="warning-detail">{loginError.detail}</div>}
                    </div>
                    <button
                        type="button"
                        className="warning-action-btn"
                        onClick={() => handleSwitchRole(loginError.targetRole)}
                    >
                        <SwitchIcon />
                        <span>{loginError.actionText || `Switch to ${loginError.targetRoleLabel}`}</span>
                    </button>
                </div>
            )}

            {loginError && loginError.type !== "toggle_warning" && (
                <div className={`login-alert-box ${loginError.type}`}>
                    <div className="alert-icon">
                        <img src={info} alt="" />
                    </div>
                    <div className="alert-content">
                        {loginError.title && <div className="alert-title">{loginError.title}</div>}
                        <div className="alert-msg">{loginError.message}</div>
                        {loginError.detail && <div className="alert-detail">{loginError.detail}</div>}
                        {loginError.actionType === "register" && (
                            <span
                                className="alert-link"
                                onClick={() => navigate(`/register?role=${loginType}`)}
                            >
                                {loginError.actionText} →
                            </span>
                        )}
                        {loginError.actionType === "forgot_password" && (
                            <span
                                className="alert-link"
                                onClick={() => setForgotPassword(true)}
                            >
                                {loginError.actionText} →
                            </span>
                        )}
                    </div>
                </div>
            )}

                       <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (email && password && !isLoading) handleLogin();
                }}
                style={{ width: "100%" }}
            >
                <div className="input-box">
                    <EmailIcon />
                    <input
                        className="input-inp"
                        type="text"
                        placeholder="Email address"
                        value={email}
                        onInput={(e) => {
                            setLoginError(null);
                            setiserror(false);
                            setemail(e.target.value);
                        }}
                        onBlur={handleEmailBlur}
                    />
                </div>

                <div className="input-box password-box">
                    <LockIcon />
                    <input
                        className="input-inp"
                        type={eye ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            if (loginError?.type === "invalid_password" || loginError?.type === "error") {
                                setLoginError(null);
                            }
                            setiserror(false);
                            setpassword(e.target.value);
                        }}
                    />
                    <div className="eye-icon" onClick={() => seteye(!eye)}>
                        <EyeIcon open={eye} />
                    </div>
                </div>

                <div className="forgot" onClick={() => setForgotPassword(true)}>
                    Forgot Password?
                </div>

                <button
                    type="submit"
                    className={`login-btn ${(!email || !password || isLoading) ? "disabled" : ""}`}
                    disabled={!email || !password || isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </form>

            <div className="login-divider">
                <div className="divider-line"></div>
                <span className="divider-text">or</span>
                <div className="divider-line"></div>
            </div>

            <div className="google-btn" onClick={isLoading ? undefined : handleGoogleAuth}>
                <GoogleIcon />
                <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
            </div>

            <div className="login-footer-link">
                Don't have an account?{" "}
                <span
                    className="link-highlight"
                    onClick={() => {
                        console.log("REGISTER CLICKED");
                        navigate(`/register?role=${loginType}`);
                    }}
                >
                    Create New Account
                </span>
            </div>
        </div>
    );

    if (isGoogleProcessing) {
        return (
            <div style={{
                position: "fixed",
                inset: 0,
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                zIndex: 99999
            }}>
                <img src={logo} alt="Naaviverse" style={{ width: "160px", objectFit: "contain" }} />
                <div style={{
                    width: "42px",
                    height: "42px",
                    border: "3px solid #cbd5e1",
                    borderTopColor: "#2c7cb2",
                    borderRadius: "50%",
                    animation: "loginGoogleSpin 0.75s linear infinite"
                }} />
                <p style={{ color: "#475569", fontSize: "15px", fontWeight: "500", margin: 0 }}>
                    Signing in with Google, please wait...
                </p>
                <style>{`@keyframes loginGoogleSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="login-main">
            {/* ── LEFT HERO PANEL (Logo above image in both desktop and mobile) ── */}
            <div className="login-hero-panel">
                <div className="auth-hero-header">
                    <img src={logo} alt="SkillNaav" className="auth-hero-logo" onClick={() => navigate("/")} />
                </div>
                <div className="hero-visual-area">
                    <img src={loginHero} alt="Platform visual" className="hero-bg" />
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
                        <div className="hero-stats">
                            {hero.stats.map((stat, i) => (
                                <div className="stat-item" key={i}>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="login-form-panel">
                {mustChangePasswordMode
                    ? renderForcePasswordChange()
                    : forgotPassword
                    ? renderForgotPassword()
                    : renderLoginForm()}
            </div>

            {/* ── LOADING OVERLAY ── */}
            {isLoading && (
                <div className="otclogo">
                    <img className="otclogoimg" src={loadinglogo} alt="" />
                </div>
            )}

            <ToastContainer position="top-right" autoClose={4000} />
        </div>
    );
};

export default Loginpage;