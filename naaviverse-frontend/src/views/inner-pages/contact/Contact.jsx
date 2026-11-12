import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Helmet } from "react-helmet-async";
import "./contact.scss";
import Footer from '../../../components/footernew/index';
import {
  validateEmail,
  validatePersonName,
  getDialCodeOptions,
  sanitizePhoneInput,
  isPhoneKeyAllowed,
  validatePhoneDigits,
} from "../../../utils/emailValidator";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const INQUIRY_OPTIONS = [
  { value: "WHAT_IS_NAAVI", desktop: "What is Naavi and how does it work?", mobile: "What is Naavi & how it works?" },
  { value: "PATHWAY_ENGINE", desktop: "How does the AI Pathway Engine generate my path?", mobile: "How does AI Pathway Engine work?" },
  { value: "SKILL_GAP", desktop: "How does Naavi help bridge my skill gap?", mobile: "How Naavi bridges skill gaps?" },
  { value: "MENTOR_CONNECT", desktop: "How can I connect with mentors on Naavi?", mobile: "How to connect with mentors?" },
  { value: "NAAVIVERSE", desktop: "What is the Naaviverse ecosystem?", mobile: "What is Naaviverse ecosystem?" },
  { value: "CAREER_PATHS", desktop: "Can Naavi help me switch careers or industries?", mobile: "Can Naavi help switch careers?" },
  { value: "INSTITUTIONS", desktop: "How can my institution partner with Naavi?", mobile: "How can institutions partner?" },
  { value: "DEMO", desktop: "I'd like to request a product demo", mobile: "Request a product demo" },
  { value: "PARTNERSHIP", desktop: "Explore a partnership opportunity", mobile: "Explore partnership opportunity" },
  { value: "OTHER", desktop: "Something else", mobile: "Something else" },
];

export default function Contact() {
  const formRef = useRef(null);
  const dropdownRef = useRef(null);
  const phoneDropdownRef = useRef(null);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Phone / country calling code state
  const [selectedPhoneIso, setSelectedPhoneIso] = useState("IN");
  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const dialCodeOptions = useMemo(() => getDialCodeOptions(), []);

  const currentPhoneCountry = useMemo(() => {
    return (
      dialCodeOptions.find((c) => c.isoCode === selectedPhoneIso) ||
      dialCodeOptions.find((c) => c.isoCode === "IN") ||
      dialCodeOptions[0] ||
      {
        code: "+91",
        isoCode: "IN",
        name: "India",
        lengths: [10],
        minLength: 10,
        maxLength: 10,
        placeholder: "98765-43210",
      }
    );
  }, [dialCodeOptions, selectedPhoneIso]);

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
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth <= 1199);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target)) {
        setPhoneCodeDropdownOpen(false);
        setPhoneCodeSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [location]);

  useEffect(() => {
    if (location.search) {
      const params = new URLSearchParams(location.search);
      const inq = params.get("inquiry") || params.get("product") || params.get("type");
      if (inq) {
        const match = INQUIRY_OPTIONS.find(
          (o) =>
            o.value.toLowerCase() === inq.toLowerCase() ||
            o.desktop.toLowerCase().includes(inq.toLowerCase())
        );
        if (match) {
          setProduct(match.value);
        }
      }
    }
  }, [location.search]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = INQUIRY_OPTIONS.find((item) => item.value === product);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nameVal = validatePersonName(fullName, "Full Name");
    if (!nameVal.isValid) {
      setStatus(nameVal.message);
      setStatusType("error");
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => {
          setStatus("");
          setStatusType("");
        }, 400);
      }, 5000);
      return;
    }

    const validation = validateEmail(email);
    if (!validation.isValid) {
      setStatus(validation.message);
      setStatusType("error");
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => {
          setStatus("");
          setStatusType("");
        }, 400);
      }, 5000);
      return;
    }
    const cleanEmail = validation.cleanEmail;

    const phoneVal = validatePhoneDigits(mobile, currentPhoneCountry, currentPhoneCountry.name, true);
    if (!phoneVal.isValid) {
      setStatus(phoneVal.message);
      setStatusType("error");
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => {
          setStatus("");
          setStatusType("");
        }, 400);
      }, 5000);
      return;
    }

    const formattedMobile = `${currentPhoneCountry.code} ${mobile.trim()}`;
    const questionText = selectedOption ? (isMobile ? selectedOption.mobile : selectedOption.desktop) : (product || "General Inquiry");
    const contactData = {
      fullName: fullName.trim(),
      email: cleanEmail,
      product: product || "OTHER",
      inquiryType: product || "OTHER",
      question: questionText,
      mobile: formattedMobile,
      message: message.trim(),
      source: "Landing Page Contact Us",
    };

    setIsSubmitting(true);
    try {
      await axios.post(`${BASE_URL}/api/admin-contact`, contactData);
      setStatus("Message sent successfully! We'll reach out to you soon.");
      setStatusType("success");
      setFullName("");
      setEmail("");
      setProduct("");
      setMobile("");
      setMessage("");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error sending message. Please try again.";
      setStatus(errorMsg);
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }

    setToastVisible(true);


    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setStatus("");
        setStatusType("");
      }, 400);
    }, 5000);
  };

  return (
    <>
      <Helmet>
        <title>Contact Naavi Network | AI Powered Path Engine</title>
        <meta
          name="description"
          content="Get in touch with Naavi Network for product demos, partnerships, career guidance, institutional collaborations, or questions about our AI Powered Path Engine."
        />
        <meta
          name="keywords"
          content="Contact Naavi Network, Contact AI Path Engine, Education Technology, AI Career Guidance, Partnership, Product Demo, Naaviverse, Hyderabad"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://naavinetwork.ai/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Naavi Network" />
        <meta property="og:title" content="Contact Naavi Network" />
        <meta
          property="og:description"
          content="Connect with the Naavi Network team for partnerships, demos, support, and AI-powered education and career navigation."
        />
        <meta property="og:url" content="https://naavinetwork.ai/contact" />
        <meta property="og:image" content="https://naavinetwork.ai/logo512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Naavi Network" />
        <meta
          name="twitter:description"
          content="Reach out to Naavi Network for product demos, partnerships, or support."
        />
        <meta name="twitter:image" content="https://naavinetwork.ai/logo512.png" />
      </Helmet>

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-container">
          <div className="contact-hero-content">
            <span className="contact-hero-tag">GET IN TOUCH</span>
            <h1 className="contact-hero-title">
              Let's talk about <span className="contact-accent">the future</span>
            </h1>
            <p className="contact-hero-desc">
              Have questions about Naavi? Want to explore partnership opportunities?
              We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section" ref={formRef}>
        <div className="contact-container">
          <div className="contact-grid">

            {/* Left Side - Contact Info Card */}
            <div className="contact-info-card">
              <span className="contact-info-eyebrow">REACH OUT</span>
              <p className="contact-info-desc">
                Whether you're curious about features, want to request a demo,
                or explore partnership opportunities — our team is ready to assist.
              </p>

              <div className="contact-info-details">
                {/* Visit Us */}
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Icon icon="carbon:location" width={20} />
                  </div>
                  <div className="contact-info-text">
                    <h4>Visit Us</h4>
                    <p>T-Hub, 2nd Floor, SY.NO.83/1, Raidurg Village, Hyderabad, Telangana 500081</p>
                  </div>
                </div>

                {/* Email Us */}
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Icon icon="carbon:email" width={20} />
                  </div>
                  <div className="contact-info-text">
                    <h4>Email Us</h4>
                    <p>info@naavinetwork.ai</p>
                  </div>
                </div>

                {/* Call Us */}
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Icon icon="carbon:phone" width={20} />
                  </div>
                  <div className="contact-info-text">
                    <h4>Call Us</h4>
                    <p>+91 40 1234 5678</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form Card */}
            <div className="contact-form-card">
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="contact-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="hello@naavi.ai"
                      pattern="[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}"
                      title="Please enter a valid email address (e.g. name@gmail.com, .in, .net, .org, .edu)"
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label>Mobile Number *</label>
                    <div
                      className={`contact-phone-input-group ${phoneCodeDropdownOpen ? "focused" : ""}`}
                      ref={phoneDropdownRef}
                    >
                      <div
                        className="contact-phone-trigger"
                        onClick={() => setPhoneCodeDropdownOpen((p) => !p)}
                        role="button"
                        tabIndex={0}
                        title="Click to select country calling code"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPhoneCodeDropdownOpen((p) => !p);
                          }
                        }}
                      >
                        <img
                          src={`https://flagcdn.com/w40/${currentPhoneCountry.isoCode.toLowerCase()}.png`}
                          alt={currentPhoneCountry.name}
                          className="contact-phone-flag"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <span className="contact-phone-code">{currentPhoneCountry.code}</span>
                        <span className={`contact-phone-arrow ${phoneCodeDropdownOpen ? "open" : ""}`}>▼</span>
                      </div>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => {
                          const val = sanitizePhoneInput(e.target.value, currentPhoneCountry.maxLength);
                          setMobile(val);
                        }}
                        onKeyDown={(e) => {
                          if (!isPhoneKeyAllowed(e, mobile, currentPhoneCountry.maxLength)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
                          const target = e.target;
                          const start = target.selectionStart || 0;
                          const end = target.selectionEnd || 0;
                          const current = mobile || "";
                          const merged = current.slice(0, start) + pasted + current.slice(end);
                          setMobile(sanitizePhoneInput(merged, currentPhoneCountry.maxLength));
                        }}
                        required
                        maxLength={currentPhoneCountry.maxLength + 8}
                        placeholder={currentPhoneCountry.placeholder}
                        className="contact-phone-input"
                      />
                      {phoneCodeDropdownOpen && (
                        <div className="contact-phone-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="contact-phone-search-wrap">
                            <input
                              type="text"
                              className="contact-phone-search-input"
                              placeholder="Search country or code..."
                              value={phoneCodeSearch}
                              onChange={(e) => setPhoneCodeSearch(e.target.value)}
                              autoFocus
                            />
                            {phoneCodeSearch && (
                              <button
                                type="button"
                                className="contact-phone-search-clear"
                                onClick={() => setPhoneCodeSearch("")}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className="contact-phone-list" role="listbox">
                            {filteredDialCodes.map((item) => (
                              <div
                                key={`${item.isoCode}-${item.code}`}
                                className={`contact-phone-item ${item.isoCode === selectedPhoneIso ? "active" : ""}`}
                                onClick={() => {
                                  setSelectedPhoneIso(item.isoCode);
                                  setMobile((prev) => sanitizePhoneInput(prev, item.maxLength));
                                  setPhoneCodeDropdownOpen(false);
                                  setPhoneCodeSearch("");
                                }}
                                role="option"
                                aria-selected={item.isoCode === selectedPhoneIso}
                              >
                                <img
                                  src={`https://flagcdn.com/w40/${item.isoCode.toLowerCase()}.png`}
                                  alt={item.name}
                                  className="contact-phone-item-flag"
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                                <span className="contact-phone-item-name">{item.name}</span>
                                <span className="contact-phone-item-code">{item.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="contact-form-group">
                    <label>Inquiry Type *</label>
                    <div className="custom-dropdown-container" ref={dropdownRef}>
                      <button
                        type="button"
                        className={`custom-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                      >
                        <span className="custom-dropdown-label">
                          {selectedOption
                            ? (isMobile ? selectedOption.mobile : selectedOption.desktop)
                            : "Select your question"}
                        </span>
                        <span className={`custom-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7A8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>
                      {isDropdownOpen && (
                        <ul className="custom-dropdown-menu" role="listbox">
                          <li
                            className={`custom-dropdown-item ${product === "" ? 'selected' : ''}`}
                            onClick={() => {
                              setProduct("");
                              setIsDropdownOpen(false);
                            }}
                            role="option"
                            aria-selected={product === ""}
                          >
                            Select your question
                          </li>
                          {INQUIRY_OPTIONS.map((item) => (
                            <li
                              key={item.value}
                              className={`custom-dropdown-item ${product === item.value ? 'selected' : ''}`}
                              onClick={() => {
                                setProduct(item.value);
                                setIsDropdownOpen(false);
                              }}
                              role="option"
                              aria-selected={product === item.value}
                            >
                              {isMobile ? item.mobile : item.desktop}
                            </li>
                          ))}
                        </ul>
                      )}
                      <input type="hidden" name="product" value={product} />
                    </div>
                  </div>
                </div>

                <div className="contact-form-group contact-form-full">
                  <label>Message *</label>
                  <textarea
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Tell us how we can help you today..."
                  />
                </div>

                <button
                  type="submit"
                  className={`contact-submit-btn ${isSubmitting ? "is-loading" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="contact-btn-spinner" aria-hidden="true" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Icon icon="bi:arrow-right" />
                    </>
                  )}
                </button>

                {status && (
                  <div className={`contact-toast contact-toast--${statusType} ${toastVisible ? 'contact-toast--visible' : ''}`}>
                    <Icon
                      icon={statusType === 'success' ? 'carbon:checkmark-filled' : 'carbon:warning-filled'}
                      width={18}
                    />
                    <span>{status}</span>
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <div className="contact-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.5387246675623!2d78.3762381736905!3d17.43391080146618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93bd18410b0f%3A0x8d7e3fea891858ce!2sT-Hub!5e0!3m2!1sen!2sin!4v1745926796929!5m2!1sen!2sin"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="T-Hub Hyderabad"
        />
      </div>

      <Footer />
    </>
  );
}