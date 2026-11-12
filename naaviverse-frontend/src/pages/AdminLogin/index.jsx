import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo/naavi_final_logo2.png";
import loadinglogo from "./naavi_favicon.png";
import info from "./info.svg";
import { validateEmail } from "../../utils/emailValidator";
import "./loginpage.scss";

/* ── inline icons — no new deps ── */
const ShieldIcon = () => (
    <svg className="eyebrowIcon" viewBox="0 0 24 24" fill="none">
        <path d="M12 3.5 19 6.5v5.2c0 4.6-3 8.1-7 9.3-4-1.2-7-4.7-7-9.3V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m9.2 12.2 1.9 1.9 3.7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
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
const EyeIcon = ({ open }) => (
    open ? (
        <svg viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.6 6.7C4.5 8.1 3 10 2.5 12c1.3 4.2 5.3 7 9.5 7 1.6 0 3.1-.4 4.4-1.1M9.9 4.2A10.6 10.6 0 0 1 12 4c4.2 0 8.2 2.8 9.5 7-.4 1.3-1 2.5-1.9 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12C3.8 7.8 7.8 5 12 5s8.2 2.8 9.5 7c-1.3 4.2-5.3 7-9.5 7s-8.2-2.8-9.5-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>
    )
);

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
    const [forgotError, setForgotError] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [passwordResetMsg, setPasswordResetMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [code, setCode] = useState('');

    const BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const handleLogin = async () => {
        setIsLoading(true);

        try {
            const response = await axios.post(
                `${BASE_URL}/api/admin/login`,
                { email, password }
            );

            if (response.status === 200) {
                localStorage.setItem("adminuser", JSON.stringify({ email }));
                navigate('/admin/dashboard/accountants');
            }
        } catch (error) {
            setIsError(true);
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const initiateForgotPassword = async () => {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail) {
            setForgotError("Please enter your admin email address.");
            return;
        }

        const emailValidation = validateEmail(cleanEmail);
        if (!emailValidation.isValid) {
            setForgotError(emailValidation.message || "Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        setForgotError('');

        try {
            const response = await axios.post(
                `${BASE_URL}/api/admin/forgotPassword`,
                { email: cleanEmail }
            );

            const result = response?.data;
            if (result?.success || response.status === 200) {
                setForgotPasswordStep(2);
                setForgotError('');
            } else {
                setForgotError(result?.message || "Failed to send reset code. Please enter a registered email.");
            }
        } catch (error) {
            console.error("Error in initiateForgotPassword:", error);
            const serverMsg = error.response?.data?.message;
            setForgotError(serverMsg || "No admin account found with this email address. Please enter a registered email.");
        } finally {
            setIsLoading(false);
        }
    };

    const submitForgotPassword = async () => {
        if (!code || !newPassword2) {
            setForgotError("Please enter both the reset code and your new password.");
            return;
        }

        if (newPassword2.length < 8) {
            setForgotError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        setForgotError('');

        const cleanEmail = (email || '').trim().toLowerCase();
        const obj = {
            email: cleanEmail,
            code: code.trim(),
            newPassword: newPassword2,
        };

        try {
            const response = await axios.post(
                `${BASE_URL}/api/admin/updatepassword`,
                obj
            );

            const result = response?.data;
            if (result?.success || response.status === 200) {
                setPasswordResetMsg("Password reset successfully. Please log in with your new credentials.");
                setForgotPassword(false);
                setForgotPasswordStep(1);
                setEmail("");
                setCode("");
                setNewPassword2("");
                setForgotError("");
            } else {
                setForgotError(result?.message || "Failed to reset password. Please check your code.");
            }
        } catch (error) {
            console.error("Error in submitForgotPassword:", error);
            const serverMsg = error.response?.data?.message;
            setForgotError(serverMsg || "Invalid or expired reset code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="adminLoginMain">
            <div className="gridOverlay"></div>

            <div className="adminLoginCard">
                <div className="logoChip">
                    <img className="full-logo" src={logo} alt="Naaviverse" />
                </div>

                <div className="eyebrow">
                    <ShieldIcon />
                    Restricted Access · Super Admin
                </div>

                {forgotPassword ? (
                    forgotPasswordStep === 1 ? (
                        <>
                            <div className="admin-welcome">
                                <div className="welcome-title">Reset Credentials</div>
                                <div className="welcome-subtitle">
                                    Enter the admin email on file. A reset code will be issued to it.
                                </div>
                            </div>

                            {forgotError && (
                                <div className="prompt-div">
                                    <div><img src={info} alt="" /></div>
                                    <div>{forgotError}</div>
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (email?.length > 0 && !isLoading) initiateForgotPassword();
                                }}
                                style={{ width: "100%" }}
                            >
                                <div className="input-box">
                                    <EmailIcon />
                                    <input
                                        className="input-inp"
                                        type="text"
                                        placeholder="Admin email"
                                        required
                                        id="email"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onInput={(e) => { setIsError(false); setForgotError(""); setEmail(e.target.value); }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`login-btn ${email?.length > 0 && !isLoading ? "" : "disabled"}`}
                                    disabled={!email || email.length === 0 || isLoading}
                                >
                                    {isLoading ? "Sending Code..." : "Send Reset Code"}
                                </button>
                            </form>
                            <div className="ghost-btn" onClick={() => { setForgotPassword(false); setForgotError(""); setEmail(""); }}>
                                Never Mind
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="admin-welcome">
                                <div className="welcome-title">Verify &amp; Reset</div>
                                <div className="welcome-subtitle">
                                    Enter the code we sent, then set a new password.
                                </div>
                            </div>

                            {forgotError && (
                                <div className="prompt-div">
                                    <div><img src={info} alt="" /></div>
                                    <div>{forgotError}</div>
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (code && newPassword2 && !isLoading) submitForgotPassword();
                                }}
                                style={{ width: "100%" }}
                            >
                                <div className="input-box otp-box">
                                    <OtpIcon />
                                    <input
                                        className="input-inp"
                                        type="text"
                                        placeholder="Enter code"
                                        value={code}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
                                            const cleanDigits = pasted.replace(/[^0-9]/g, "").slice(0, 6);
                                            setForgotError("");
                                            setCode(cleanDigits);
                                        }}
                                        onChange={e => {
                                            const cleanDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                            setForgotError("");
                                            setCode(cleanDigits);
                                        }}
                                        onInput={e => {
                                            const cleanDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                            setForgotError("");
                                            setCode(cleanDigits);
                                        }}
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <div className="input-box">
                                    <LockIcon />
                                    <input
                                        className="input-inp"
                                        type="password"
                                        placeholder="New password"
                                        value={newPassword2}
                                        onInput={e => { setForgotError(""); setNewPassword2(e.target.value); }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`login-btn ${(code && newPassword2 && !isLoading) ? "" : "disabled"}`}
                                    disabled={!code || !newPassword2 || isLoading}
                                >
                                    {isLoading ? "Submitting..." : "Submit"}
                                </button>
                            </form>
                            <div
                                className="ghost-btn"
                                onClick={() => { setForgotPassword(false); setForgotPasswordStep(1); setCode(""); setNewPassword2(""); setForgotError(""); }}
                            >
                                Cancel
                            </div>
                        </>
                    )
                ) : (
                    <>
                        <div className="admin-welcome">
                            <div className="welcome-title">Super Admin Console</div>
                            <div className="welcome-subtitle">
                                Sign in with your administrator credentials to manage the Naaviverse platform.
                            </div>
                        </div>

                        {passwordResetMsg?.length > 1 && (
                            <div className="success-message">{passwordResetMsg}</div>
                        )}

                        {isError && (
                            <div className="prompt-div">
                                <div><img src={info} alt="" /></div>
                                <div>The credentials you entered are incorrect. Please try again or reset your password.</div>
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
                                    placeholder="Admin email"
                                    required
                                    id="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onInput={(e) => { setIsError(false); setEmail(e.target.value); }}
                                />
                            </div>

                            <div className="input-box">
                                <LockIcon />
                                <input
                                    className="input-inp"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    id="password"
                                    autoComplete="new-password"
                                    name="password"
                                    required
                                    value={password}
                                    onInput={(e) => { setIsError(false); setPassword(e.target.value); }}
                                />
                                <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                    <EyeIcon open={showPassword} />
                                </div>
                            </div>

                            <div className="forgot" onClick={() => { setForgotPassword(true); setIsError(false); setForgotError(""); setPasswordResetMsg(""); }}>
                                Forgot Password?
                            </div>

                            <button
                                type="submit"
                                className={`login-btn ${(!email || !password || isLoading) ? "disabled" : ""}`}
                                disabled={!email || !password || isLoading}
                            >
                                Sign In
                            </button>
                        </form>
                    </>
                )}

                <div className="secureFooter">
                    <span className="pulseDot"></span>
                    Access to this console is logged and monitored
                </div>
            </div>

            {isLoading && (
                <div className="otclogo">
                    <img className="otclogoimg" src={loadinglogo} alt="" />
                </div>
            )}
        </div>
    );
};

export default AdminLogin;