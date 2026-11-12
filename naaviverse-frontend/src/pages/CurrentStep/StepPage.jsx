/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, array-callback-return */
import React, { useState, useEffect } from "react";
import "./currentstep.scss";
import { useCoinContextData } from "../../context/CoinContext";
import { useStore } from "../../components/store/store.ts";
import axios from "axios";
import Step4 from "../dashboard/MallProduct/Step4.jsx";
import CoinComponent from "../dashboard/MallProduct/CoinComponent.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import Dashsidebar from "../../components/dashsidebar/dashsidebar.jsx";
import AccDashsidebar from "../../components/accDashsidebar/accDashsidebar.jsx";
import AdminAccDashsidebar from "../../components/AdminAccDashsidebar/index.jsx";
import MenuNav from "../../components/MenuNav/index.jsx";

// images
import dummy from "../JourneyPage/dummy.svg";
import edutech from "./edutech.svg";
import resory from "./resory.svg";
import lek from "./lek.svg";
import logo from "../../static/images/logo.svg";
import logout from "../../static/images/dashboard/logout.svg";
import profilea from "../../static/images/dashboard/profilea.svg";
import sidearrow from "../../static/images/dashboard/sidearrow.svg";
import searchIcon from "../../static/images/icons/search.svg";
import profile from "../../static/images/dashboard/profile.svg";
import downarrow from "../../static/images/dashboard/downarrow.svg";

import logActivity from "../../utils/activityLogger";
import { SvgCheckCircle } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

/** ===================== FALLBACK SERVICES ====================== **/
const getFallbackServices = () => [
  {
    _id: "fallback-1",
    name: "Academic Counseling Service",
    description: "Get personalized guidance for your academic journey and subject selection",
    ServiceDetails: [{
      first_purchase: { price: 0, coin: "Free" },
      billing_cycle: { monthly: { price: 0, coin: "Free" }, annual: { price: 0, coin: "Free" } },
      product_name: "Academic Counseling",
    }],
  },
  {
    _id: "fallback-2",
    name: "Portfolio Review",
    description: "Expert feedback on your creative portfolio for architecture applications",
    ServiceDetails: [{
      first_purchase: { price: 50, coin: "USD" },
      billing_cycle: { monthly: { price: 0, coin: "One-time" }, annual: { price: 0, coin: "One-time" } },
      product_name: "Portfolio Review",
    }],
  },
  {
    _id: "fallback-3",
    name: "Test Preparation Guidance",
    description: "Strategies and resources for standardized test preparation",
    ServiceDetails: [{
      first_purchase: { price: 0, coin: "Free" },
      billing_cycle: { monthly: { price: 0, coin: "Free" }, annual: { price: 0, coin: "Free" } },
      product_name: "Test Prep Resources",
    }],
  },
];

const StepPage = ({ productDataArray, selectedPathId, showSelectedPath, selectedPath }) => {
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const type = localStorage.getItem("userType");
    setUserType(type);
    if (type === "user") {
      try {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : null;
        const status = parsed?.approvalStatus || parsed?.user?.approvalStatus;
        if (status !== "approved") {
          navigate("/dashboard/users/profile", { replace: true });
        }
      } catch {
        navigate("/dashboard/users/profile", { replace: true });
      }
    }
  }, [navigate]);

  const navigate  = useNavigate();
  const loc       = useLocation();
  const userDetails = JSON.parse(localStorage.getItem("adminuser"));

  const {
    currentStepData,
    setCurrentStepData,
    currentStepDataLength,
    setCurrentStepDataLength,
    currentStepdataPathId,
    setCurrentStepDataPathId,
    stepServices,
    setStepServices,
  } = useCoinContextData();

  const {
    sideNav, setsideNav,
    buy, setBuy,
    mallCoindata, setfilteredcoins,
    index, setIndex,
  } = useStore();

  const [showNewDiv,        setShowNewDiv]        = useState(null);
  const [position1,         setPosition1]         = useState();
  const [position2,         setPosition2]         = useState();
  const [position3,         setPosition3]         = useState();
  const [currentStepPageData, setCurrentStepPageData] = useState([]);
  const [popup,             setPopup]             = useState(false);
  const [popupContent,      setPopupContent]      = useState("default");
  const [popupDetails,      setPopupDetails]      = useState("");
  const [currentStepPagePathId, setCurrentStepPagePathId] = useState("");
  const [selectedCard,      setSelectedCard]      = useState(1);
  const [showDrop,          setShowDrop]          = useState(false);

  // ── Track which micro-views were expanded ─────────────────────────────────
  const [showGradeDesc,       setShowGradeDesc]       = useState(false);
  const [showStreamDesc,      setShowStreamDesc]      = useState(false);
  const [showCurriculumDesc,  setShowCurriculumDesc]  = useState(false);
  const [showGradePointDesc,  setShowGradePointDesc]  = useState(false);
  const [showFinancialDesc,   setShowFinancialDesc]   = useState(false);
  const [showPersonalityDesc, setShowPersonalityDesc] = useState(false);
  const [gradeDescription,       setGradeDescription]       = useState("");
  const [streamDescription,      setStreamDescription]      = useState("");
  const [curriculumDescription,  setCurriculumDescription]  = useState("");
  const [gradePointDescription,  setGradePointDescription]  = useState("");
  const [financialDescription,   setFinancialDescription]   = useState("");
  const [personalityDescription, setPersonalityDescription] = useState("");

  const [cards,       setCards]       = useState(productDataArray);
  const [centerIndex, setCenterIndex] = useState(0);
  const [acceptOffer, setAcceptOffer] = useState(false);
  const [userData,    setUserData]    = useState([]);

  // ── Log step opened (macro view) once on mount ────────────────────────────
  useEffect(() => {
    const stepName = currentStepData?.name || "";
    const pathName = localStorage.getItem("selectedPathName") || "";
    const pathId   = localStorage.getItem("selectedPathId")   || "";
    const stepId   = localStorage.getItem("selectedStepId")   || "";

    if (stepName) {
      logActivity({
        type:     "step",
        title:    `Opened step: ${stepName}`,
        desc:     `User is viewing Macro View of "${stepName}"`,
        pathId,
        pathName,
        stepId,
        stepName,
        microStep: "macro",
        status:   "in_progress",
      });
    }
  }, [currentStepData?.name]);

  // ── Fetch services ────────────────────────────────────────────────────────
  useEffect(() => {
    let storedStepId = localStorage.getItem("selectedStepId");
    try {
      const parsed = JSON.parse(storedStepId);
      if (parsed?.$oid) storedStepId = parsed.$oid;
    } catch {}

    if (!storedStepId) {
      setStepServices(getFallbackServices());
      return;
    }

    axios
      .get(`${BASE_URL}/api/services/by-step?step_id=${storedStepId}`)
      .then(({ data }) => {
        let list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (list.length === 0) list = getFallbackServices();
        setStepServices(list);
      })
      .catch(() => {
        setStepServices(getFallbackServices());
      });
  }, []);

  const handleLogout = () => {
    import('../../components/LogoutModal/LogoutManager').then(({ triggerLogout }) => {
      triggerLogout(() => {
    localStorage.clear();
    navigate("/login");
});
    });  };

  const handleRejectClick = () => {
    if (position1 === 1)      { setPosition1(3); } else if (position1 === 2) { setPosition1(1); } else { setPosition1(2); }
    if (position2 === 2)      { setPosition2(1); } else if (position2 === 3) { setPosition2(2); } else { setPosition2(3); }
    if (position3 === 3)      { setPosition3(2); } else if (position3 === 2) { setPosition3(1); } else { setPosition3(3); }
  };

  function filterItem(text) {
    let filtered = mallCoindata?.filter((item) =>
      item?.coinSymbol?.toLowerCase()?.includes(text?.toLowerCase())
    );
    setfilteredcoins(filtered);
  }

  const reloadServices = async () => {
    const stepId = localStorage.getItem("selectedStepId");
    if (!stepId) return;
    try {
      const { data } = await axios.get(`${BASE_URL}/api/services/by-step?step_id=${stepId}`);
      setStepServices(data.data || []);
    } catch (err) {
      setStepServices([]);
    }
  };

  // ── Helpers for micro-view toggles with logging ───────────────────────────
  const toggleMicroView = (label, currentState, setter) => {
    const next = !currentState;
    setter(next);

    if (next) {
      // Only log when opening (not closing)
      logActivity({
        type:     "step",
        title:    `Explored micro view: ${label}`,
        desc:     `User expanded "${label}" in Micro View`,
        pathId:   localStorage.getItem("selectedPathId")   || "",
        pathName: localStorage.getItem("selectedPathName") || "",
        stepId:   localStorage.getItem("selectedStepId")   || "",
        stepName: currentStepData?.name || "",
        microStep: "micro",
        status:   "viewed",
      });
    }
  };

  return (
    <>
      <div className="dashboard-main">
        <div className="dashboard-body">
          <div style={{ display: "flex", height: "100%", flexShrink: 0 }}>
            {userType === "partner" ? (
              <AccDashsidebar />
            ) : userType === "user" ? (
              <Dashsidebar approvalStatus={JSON.parse(localStorage.getItem("user") || "{}")?.approvalStatus || "pending"} />
            ) : userType === "accountant" || userType === "admin" ? (
              <AdminAccDashsidebar admin={true} />
            ) : (
              <AdminAccDashsidebar admin={true} />
            )}
          </div>

          <div className="dashboard-screens">
            <MenuNav
              showDrop={showDrop}
              setShowDrop={setShowDrop}
              searchPlaceholder="Search..."
            />
            <div className="currentstep" style={{ height: "90vh", overflow: "hidden" }}>

              <div className="cs-top-area" style={{ height: "13rem" }}>
                <div className="cs-text1">
                  <div>Your Current Step</div>
                  <div
                    className="back-Btn"
                    onClick={() => navigate(-1)}
                    style={{ display: currentStepData ? "flex" : "none" }}
                  >
                    Back To Path
                  </div>
                </div>
                <div className="bold-text">
                  <div>{currentStepData?.name}</div>
                  <div className="macro-text-div">{currentStepData?.description}</div>
                  <div>Apx Takes {currentStepPageData?.length > 0 ? currentStepPageData.length : 3} Days</div>
                </div>
              </div>

              <div className="cs-content" style={{ height: "67vh" }}>
                <div className="overall-cs-content">

                  {/* ── MACRO VIEW ── */}
                  <div className="macro-view-box">
                    <div className="macro-text">Macro View:</div>
                    <div className="macro-content">
                      <div className="step-text">
                        {(currentStepData?.macro_name || currentStepPageData?.macro_name)
                          ? (currentStepData?.macro_name || currentStepPageData?.macro_name).replace(/^step\s*\d+\s*:\s*/i, "")
                          : (currentStepData?.name ? currentStepData.name.replace(/^step\s*\d+\s*:\s*/i, "") : (currentStepPageData?.name ? currentStepPageData.name.replace(/^step\s*\d+\s*:\s*/i, "") : "Overview"))}
                      </div>
                      <div className="macro-text-div">
                        {currentStepData?.description ? currentStepData?.description : currentStepPageData?.description}
                      </div>
                    </div>
                  </div>

                  {/* ── MICRO VIEW ── */}
                  <div className="micro-view-box">
                    <div className="micro-text">Micro View:</div>
                    <div className="micro-content">
                      <div className="step-text">
                        <span>{currentStepData?.name ? currentStepData?.name : currentStepPageData?.name}</span>{" "}For You
                      </div>
                      <div className="micro-text-div-container">

                        {/* ── Each micro section logs when opened ── */}
                        {[
                          { label: "Grade",              show: showGradeDesc,       setShow: setShowGradeDesc,       desc: currentStepData?.description || currentStepPageData?.description },
                          { label: "Stream",             show: showStreamDesc,      setShow: setShowStreamDesc,      desc: streamDescription },
                          { label: "Curriculum",         show: showCurriculumDesc,  setShow: setShowCurriculumDesc,  desc: currentStepData?.description },
                          { label: "Grade Point Avg",    show: showGradePointDesc,  setShow: setShowGradePointDesc,  desc: gradePointDescription },
                          { label: "Financial Position", show: showFinancialDesc,   setShow: setShowFinancialDesc,   desc: financialDescription },
                          { label: "Personality",        show: showPersonalityDesc, setShow: setShowPersonalityDesc, desc: personalityDescription },
                        ].map(({ label, show, setShow, desc }) => (
                          <div className="micro-text-div" key={label}>
                            <div className="bold-text-div">
                              <div className="bold-text">Based On Your {label}</div>
                              <div
                                className="unlock-Btn"
                                onClick={() => toggleMicroView(label, show, setShow)}
                              >
                                {show ? "Close" : "Open"}
                              </div>
                            </div>
                            <div className="sub-text" style={{ display: show ? "flex" : "none" }}>
                              {desc}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>
                  </div>

                  {/* ── NANO VIEW ── */}
                  <div className="nano-view-box">
                    <div className="nano-text">Nano View:</div>
                    <div className="nano-content">
                      <div className="step-text">
                        Get A Naavi Certified Vendor To Assist You In Choosing{" "}
                        <span>{currentStepData?.name ? currentStepData?.name : currentStepPageData?.name}</span>
                      </div>
                      <div className="nano-overall-div">
                        {stepServices?.length > 0 ? (
                          stepServices.slice(0, 3).map((item, idx) => (
                            <Carousel1
                              key={idx}
                              item={item}
                              showNewDiv={showNewDiv}
                              handleRejectClick={handleRejectClick}
                              position={idx}
                              selectedCard={selectedCard}
                              setSelectedCard={setSelectedCard}
                              setIndex={setIndex}
                              setAcceptOffer={setAcceptOffer}
                              setBuy={setBuy}
                              userDetails={userDetails}
                              stepName={currentStepData?.name || ""}
                            />
                          ))
                        ) : (
                          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "14px", color: "#666" }}>
                            No services available for this step.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <center>
                <div className="cs-footer1">
                  <div onClick={() => { setPopup(true); setPopupDetails("no"); }}>Failed</div>
                  <div>Did you complete this step?</div>
                  <div onClick={() => { setPopup(true); setPopupDetails("yes"); }}>Yes</div>
                </div>
              </center>

              {acceptOffer && (
                <div
                  className="accept-offer-overlay"
                  onClick={() => { setAcceptOffer(false); setBuy("step1"); setIndex([]); }}
                >
                  <div
                    style={{ right: acceptOffer ? "0" : "-100%" }}
                    className="right-divv-cs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {buy === "step1" ? (
                      <>
                        <div className="amount-details-cs">
                          <div className="left-amnt-cs" style={{ borderRight: "1px solid #E7E7E7" }}>
                            <p className="amnt-font-cs">
                              {(index?.billing_cycle?.lifetime?.price ?? 0).toFixed(2)}&nbsp;
                              {index?.billing_cycle?.lifetime?.coin ?? "USD"}
                            </p>
                            <p className="text-font-cs">Lifetime</p>
                          </div>
                          <div className="left-amnt1-cs">
                            <p className="amnt-font-cs">
                              {(index?.billing_cycle?.monthly?.price ?? 0).toFixed(2)}&nbsp;
                              {index?.billing_cycle?.monthly?.coin ?? "USD"}
                            </p>
                            <p className="text-font-cs">Monthly</p>
                          </div>
                          <div className="left-amnt1-cs">
                            <p className="amnt-font-cs">
                              {(index?.billing_cycle?.annual?.price ?? 0).toFixed(2)}&nbsp;
                              {index?.billing_cycle?.annual?.coin ?? "USD"}
                            </p>
                            <p className="text-font-cs">Yearly</p>
                          </div>
                        </div>
                        <div className="buttonss-cs">
                          <button className="buy-btn-cs" onClick={() => setBuy("step2")}>Buy Now</button>
                        </div>
                      </>
                    ) : buy === "step2" ? (
                      <div className="buy-step1-cs">
                        <div style={{ width: "100%", height: "17%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1F304F" }}>Select Currency To Pay With?</div>
                          <div className="searchh-cs">
                            <input type="text" placeholder="Search Vaults.." onChange={(e) => filterItem(e.target.value)} />
                          </div>
                        </div>
                        <div className="coin-options-cs"><CoinComponent /></div>
                        <div className="buttonss-cs">
                          <div className="share-btn-cs" onClick={() => setBuy("step1")}>Close</div>
                        </div>
                      </div>
                    ) : buy === "step3" ? (
                      <div className="buy-step1-cs">
                        <div style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1F304F" }}>
                          Are You Sure You Want To Subscribe To {index?.product_name}?
                        </div>
                        <div className="boxx-cs" onClick={() => setBuy("step4")}>Confirm Purchase</div>
                        <div className="boxx-cs" style={{ marginTop: "1.5rem" }} onClick={() => setBuy("step1")}>Go Back</div>
                        <div className="boxx-cs" style={{ marginTop: "1.5rem" }} onClick={() => { setBuy("step1"); setAcceptOffer(false); setIndex([]); }}>Cancel Order</div>
                      </div>
                    ) : buy === "step4" ? (
                      <div className="buy-step1-cs"><Step4 setAcceptOffer={setAcceptOffer} /></div>
                    ) : ""}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepPage;

// ─── Carousel1 ────────────────────────────────────────────────────────────────
const Carousel1 = ({
  item,
  showNewDiv,
  handleRejectClick,
  position,
  setSelectedCard,
  selectedCard,
  setIndex,
  setAcceptOffer,
  setBuy,
  userDetails,
  stepName,   // <SvgCheckCircle size={14} /> passed from StepPage
}) => {
  const [razorpayOptions, setRazorpayOptions] = useState(null);

  const initiatePurchase = (service) => {
    axios.post(`https://careers.marketsverse.com/userpurchase/add`, {
      userId: userDetails?.user?._id,
      service_id: service?._id,
      purchaseStatus: "pending",
    }).then(({ data }) => {
      if (data.status) console.log("Purchase initiated:", data);
    });
  };

  const loadScript = (src) =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const displayRazorpay = async (amount) => {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) { alert("Razorpay failed to load!!"); return; }

    const response = await fetch(
      "https://careers.marketsverse.com/api/paymentGateway/razorpay/initialize-payment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_mobile_number: "9599677424",
          amount,
          user_email: userDetails?.user?.email,
        }),
      }
    );
    const data = await response.json();
    if (data?.status) {
      const { order_id, amount: amt, currency, name, email, contact, callbackUrl } = data.data[1];
      setRazorpayOptions({
        key: "rzp_test_pIO7ySTH850hhP",
        amount: amt.toString(),
        currency,
        name,
        description: "Test Transaction",
        order_id,
        callback_url: callbackUrl,
        prefill: { name, email, contact },
        theme: { color: "#3399cc" },
      });
    }
  };

  useEffect(() => {
    if (razorpayOptions) {
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.on("payment.failed", async function (failureResponse) {
        try {
          const err = failureResponse?.error || {};
          const apiBase = BASE_URL || "http://localhost:4545";
          await axios.post(`${apiBase}/api/payment/failure`, {
            razorpay_order_id: err.metadata?.order_id || razorpayOptions.order_id,
            razorpay_payment_id: err.metadata?.payment_id || failureResponse?.razorpay_payment_id,
            userEmail: userDetails?.user?.email,
            amount: parseFloat(razorpayOptions.amount || 0) / 100,
            productId: item?._id || "step-service",
            productName: item?.name || "Step Service",
            billingMethod: "one-time",
            failureReason: err.description || err.reason || "Payment Failed",
            errorCode: err.code || "PAYMENT_FAILED",
            errorDescription: err.description || "",
            errorSource: err.source || "razorpay_checkout",
            errorStep: err.step || "payment_authentication"
          });
          window.dispatchEvent(new CustomEvent("naavi:payment-updated"));
        } catch (e) {
          console.error("Failed to report payment failure", e);
        }
      });
      razorpay.open();
    }
  }, [razorpayOptions]);

  const service = item || {};
  service.first_purchase = {
    price: service.billing_cycle?.monthly?.price || service.billing_cycle?.annual?.price || service.billing_cycle?.lifetime?.price || 0,
    coin:  service.billing_cycle?.monthly?.coin  || service.billing_cycle?.annual?.coin  || service.billing_cycle?.lifetime?.coin  || "",
  };

  const title       = service.name || "Untitled Service";
  const creator     = service.productcreatoremail || "-";
  const billingType = service.chargingtype || "-";
  const cost        = service.billing_cycle?.monthly?.price || service.billing_cycle?.annual?.price || service.billing_cycle?.lifetime?.price || 0;
  const coin        = service.billing_cycle?.monthly?.coin  || service.billing_cycle?.annual?.coin  || service.billing_cycle?.lifetime?.coin  || "";
  const description = service.description || "";

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setSelectedCard(position); }}
      className={`nano-div2 ${showNewDiv === true ? "slide-in" : showNewDiv === false ? "fade-out" : ""}`}
      style={{
        left:    position === 0 ? "0" : position === 1 ? "25%" : "50%",
        zIndex:  position === selectedCard ? "3" : "2",
        height:  position === selectedCard ? "100%" : "85%",
        opacity: position === selectedCard ? "1" : "0.5",
      }}
    >
      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 600 }}>{title}</div>

      <div className="nano-speed-container">
        <div className="speed-div"><span>Offered By: </span><div style={{ marginLeft: "10px" }}>{creator ? creator.substring(0, 10) : "-"}</div></div>
        <div className="speed-div"><span>Billing Type:</span><span>{billingType}</span></div>
        <div className="speed-div"><span>Cost:</span><span>{Number(cost)} {coin}</span></div>
        <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 300 }}>{description}</div>
      </div>

      <div className="nano-btns">
        <div
          className="accept-btn"
          onClick={(e) => {
            e.stopPropagation();

            // [check] Log nano view — user tapped Buy Now on a service card
            logActivity({
              type:     "step",
              title:    `Nano view: "${title}"`,
              desc:     `User tapped Buy Now on nano service "${title}" for step "${stepName}"`,
              pathId:   localStorage.getItem("selectedPathId")   || "",
              pathName: localStorage.getItem("selectedPathName") || "",
              stepId:   localStorage.getItem("selectedStepId")   || "",
              stepName: stepName || "",
              microStep: "nano",
              status:   "in_progress",
            });

            const selectedService = {
              ...service,
              first_purchase: {
                price: service?.billing_cycle?.monthly?.price || service?.billing_cycle?.annual?.price || service?.billing_cycle?.lifetime?.price || 0,
                coin:  service?.billing_cycle?.monthly?.coin  || service?.billing_cycle?.annual?.coin  || service?.billing_cycle?.lifetime?.coin  || "",
              },
            };
            setIndex(selectedService);
            setAcceptOffer(true);
            setBuy("step1");
          }}
        >
          Buy Now
        </div>
      </div>
    </div>
  );
};