import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./dashboard.scss";
import Directory from "../Directory";
import Dashsidebar from "../../components/dashsidebar/dashsidebar";
import searchic from "../../static/images/dashboard/searchic.svg";
import downarrow from "../../static/images/dashboard/downarrow.svg";
import darrow from "../../static/images/dashboard/darrow.svg";
import profile from "../../static/images/dashboard/profile.svg";
import correct from "../../static/images/dashboard/correct.svg";
import closepop from "../../static/images/dashboard/closepop.svg";
import { useStore } from "../../components/store/store.ts";
import {
  FollowBrand,
  GetFollowList,
  UnfollowBrand,
} from "../../services/accountant";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatDate } from "../../utils/time";
import EarningCalendar from "./EarningCalendar/index";
import Vaults from "../Vaults";
import Toggle from "../../components/Toggle";
import Tasks from "../Tasks";
import WalletScan from "./WalletScan";
import PathComponent from "../../components/PathComponent";
import JourneyPage from "../JourneyPage";
import CurrentStep from "../CurrentStep";
import { useCoinContextData } from "../../context/CoinContext";
import axios from "axios";
import VaultTransactions from "../VaultTransactions/index.jsx";
import TransactionPage from "./TransactionPage/index.jsx";
import UserHome from "./userHome.jsx"; 
import UserMarketplace from "../UserMarketplace.jsx";
import UserPurchasesPage from "./UserPurchasesPage.jsx";
import UserMentorsPage from "./UserMentorsPage.jsx";
import UserTopHeader from "../../components/UserTopHeader/UserTopHeader";
import { SvgArrowLeft, SvgCheckCircle } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const URL_TO_SIDENAV = {
  "/dashboard/users/home": "Home",
  "/dashboard/users/Marketplace": "Market Place",
  "/dashboard/users/current-step": "Current Step",
  "/dashboard/users/my-journey": "My Journey",
  "/dashboard/users/transactions": "Transactions",
  "/dashboard/users/purchases": "PurchasesPage",
  "/dashboard/users/mentors": "MentorsPage",
  "/dashboard/users/paths": "Paths",
  "/dashboard/users/notifications": "Notifications",
  "/dashboard/users": "Home",
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    sideNav,
    setsideNav,
    isLoading,
    setisLoading,
    coinType,
    setCoinType,
    balanceToggle,
    setBalanceToggle,
  } = useStore();

  const {
    searchTerm,
    setSearchterm,
    transactionSelected,
    setTransactionSelected,
    setTransactionData,
    setSelectedCoin,
    coinActionEnabled,
    setCoinActionEnabled,
    coinAction,
    setCoinAction,
    selectedCoin,
    addActionStep,
    setAddActionStep,
    paymentMethodData,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    addForexAmount,
    setAddForexAmount,
    forexPathId,
    setForexPathId,
    forexQuote,
    setForexQuote,
  } = useCoinContextData();

  const [search, setSearch] = useState("");
  const [accountantsList, setAccountantsList] = useState(null);
  const [submit, setsubmit] = useState(false);
  const [follow, setFollow] = useState({});
  const [followList, setFollowList] = useState([]);
  const [openRight, setOpenRight] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [currentFollow, setcurrentFollow] = useState({});
  const [choice, setChoice] = useState("");
  const [searchVault, setSearchVault] = useState("");
  const [productKeys, setProductKeys] = useState(null);
  const [profileId, setProfileId] = useState("");
  const [productDataArray, setProductDataArray] = useState([]);
  
  // Helper to read cached approval status
  const getCachedApproval = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.approvalStatus || parsed?.user?.approvalStatus || "";
    } catch {
      return "";
    }
  };

  // [check] Access control states
  const [approvalStatus, setApprovalStatus] = useState(getCachedApproval);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false); 
  const [checkingAccess, setCheckingAccess] = useState(() => getCachedApproval() !== "approved");

  const userDetails = JSON.parse(localStorage.getItem("user"));

  // [check] Function to check user access (profile completion + approval)
  const checkUserAccess = async () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        navigate("/login", { replace: true });
        return;
      }
      const parsed = JSON.parse(raw);
      const email = parsed?.user?.email || parsed?.email;
      if (!email) {
        navigate("/login", { replace: true });
        return;
      }

      // Check profile completion (informative only, doesn't lock approved user flow out)
      let isComplete = false;
      try {
        const profileRes = await axios.get(`${BASE_URL}/api/users/get/${email}`);
        const data = profileRes.data?.data;
        isComplete =
          data?.isProfileCompleted === true ||
          Boolean(data?.name && data?.username);
      } catch (_) {}

      setIsProfileIncomplete(!isComplete);

      // Check live approval status with backend
      let liveStatus = parsed?.approvalStatus || "approved";
      try {
        const approvalRes = await axios.get(
          `${BASE_URL}/api/approvals/status?email=${email}&role=User`
        );
        if (approvalRes.data?.data?.status) {
          liveStatus = approvalRes.data.data.status;
        }
      } catch (e) {
        console.warn("Could not fetch approval status:", e?.message);
      }

      if (liveStatus !== "approved") {
        const effectiveStatus = liveStatus || "pending";
        setApprovalStatus(effectiveStatus);
        const updated = { ...parsed, approvalStatus: effectiveStatus };
        localStorage.setItem("user", JSON.stringify(updated));
        navigate("/dashboard/users/profile", { replace: true });
        setCheckingAccess(false);
        return;
      }

      // User IS approved by admin
      setApprovalStatus("approved");
      const updated = { ...parsed, approvalStatus: "approved" };
      localStorage.setItem("user", JSON.stringify(updated));
      setCheckingAccess(false);

    } catch (err) {
      console.error("Access check failed:", err);
      const cached = getCachedApproval();
      if (cached !== "approved") {
        navigate("/dashboard/users/profile", { replace: true });
      } else {
        setApprovalStatus("approved");
      }
      setCheckingAccess(false);
    }
  };

  // [check] Derive correct page from URL SYNCHRONOUSLY on every render
  const activePage = (() => {
    const currentPath = location.pathname;
    const matchedKey = Object.keys(URL_TO_SIDENAV)
      .sort((a, b) => b.length - a.length)
      .find((p) => currentPath === p || currentPath.startsWith(p + "/"));
    return matchedKey ? URL_TO_SIDENAV[matchedKey] : sideNav;
  })();

  // Keep Zustand store in sync so sidebar highlights correctly
  useEffect(() => {
    if (activePage && activePage !== sideNav) {
      setsideNav(activePage);
    }
  }, [activePage]);

  // Reset any ancestor scroll so sidebar stays at exact top 0
  useEffect(() => {
    const db = document.querySelector('.dashboard-body');
    if (db && db.scrollTop !== 0) db.scrollTop = 0;
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }, [location.pathname]);

  // ── Product data ────────────────────────────────────────────────────────
  const fetchProductData = async (apiKey) => {
    try {
      const response = await axios.get(
        `https://comms.globalxchange.io/gxb/product/get?product_id=${apiKey}`
      );
      return response?.data?.products?.[0] || null;
    } catch (error) {
      console.error(`Error fetching product data for key ${apiKey}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setProductDataArray([]);
      if (Array.isArray(productKeys) && productKeys.length > 0) {
        try {
          const results = await Promise.all(productKeys.map(fetchProductData));
          setProductDataArray(results.filter(Boolean));
        } catch (error) {
          console.error("[error] Error fetching product data:", error);
        }
      }
    };
    fetchData();
  }, [productKeys]);

  // ── Auth + follow + access check ────────────────────────────────────────
  // [check] REPLACED: Added checkUserAccess() call
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("user"));
    if (!userDetails) navigate("/login");
    handleFollowList();
    checkUserAccess(); // <SvgArrowLeft size={14} /> ADDED: Check profile and approval status
  }, []);

  const handleFollowList = () => {
    const userDetails = JSON.parse(localStorage.getItem("user"));
    GetFollowList(userDetails?.user?.email).then((res) => {
      const result = res?.data;
      if (result?.status) {
        const bankers = Array.isArray(result?.data?.bankers) ? result.data.bankers : [];
        setFollowList(bankers);
        setcurrentFollow(bankers.length > 0 ? bankers[0] : {});
      }
    });
  };

  const handleFollowBrand = async (brand) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await FollowBrand({ email: user?.user?.email, brandEmail: brand?.email || "" });
      if (res?.data?.status) { setsubmit(true); setFollow(brand); }
    } catch (err) { console.error("[error] Error in handleFollowBrand:", err); }
  };

  const handleUnFollowBrand = async (brand) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await UnfollowBrand({ email: user?.user?.email, brandEmail: brand?.email || "" });
      if (res?.data?.status) { setsubmit(true); setFollow(brand); }
    } catch (err) { console.error("[error] Error in handleUnFollowBrand:", err); }
  };

  // ── Forex ────────────────────────────────────────────────────────────────
  const getPathId = () => {
    axios
      .get(`https://comms.globalxchange.io/coin/vault/service/payment/paths/get?from_currency=${selectedCoin?.coinSymbol}&to_currency=${selectedCoin?.coinSymbol}&select_type=fund&banker=shorupan@indianotc.com&paymentMethod=${selectedPaymentMethod}`)
      .then((response) => {
        const result = response?.data?.paths;
        if (Array.isArray(result) && result.length > 0) setForexPathId(result[0]?.path_id || "");
      })
      .catch((error) => console.error("Error in getPathId:", error));
  };

  const getQuote = () => {
    const obj = {
      token: userDetails?.idToken,
      email: userDetails?.user?.email,
      app_code: "naavi",
      profile_id: profileId,
      coin_purchased: selectedCoin?.coinSymbol,
      purchased_from: selectedCoin?.coinSymbol,
      from_amount: addForexAmount,
      stats: true,
      identifier: `Add ${addForexAmount} ${selectedCoin?.coinSymbol} Via ${selectedPaymentMethod}`,
      path_id: forexPathId,
    };
    axios
      .post(`https://comms.globalxchange.io/coin/vault/service/trade/execute`, obj)
      .then((response) => {
        const result = response?.data;
        if (result?.status) { setForexQuote(result); setAddActionStep(3); }
      })
      .catch((error) => console.log(error, "error in getQuote"));
  };

  const resetCoinAction = () => {
    setCoinActionEnabled(false);
    setCoinAction([]);
    setAddActionStep(1);
    setSelectedPaymentMethod("");
    setAddForexAmount("");
  };

  const onBlur = (e) => {
    const float = parseFloat(e.target.value);
    setAddForexAmount(float.toFixed(2));
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  if (approvalStatus !== "approved" && checkingAccess) {
    return (
      <div>
        <div className="dashboard-main">
          <div className="dashboard-body">
            <div onClick={() => setShowDrop(false)} style={{ display: "flex", height: "100%", flexShrink: 0 }}>
              <Dashsidebar
                approvalStatus={approvalStatus || "pending"}
                isProfileIncomplete={isProfileIncomplete === true}
              />
            </div>
            <div className="dashboard-screens" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f6f5ff" }}>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #e0f2fe",
                  borderTopColor: "#0284c7",
                  borderRadius: "50%",
                  margin: "0 auto 16px"
                }} />
                <p style={{ color: "#64748b", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                  Verifying account access…
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-main">
        <div className="dashboard-body">
          <div onClick={() => setShowDrop(false)} style={{ display: "flex", height: "100%", flexShrink: 0 }}>
            {/* <SvgCheckCircle size={14} /> FIXED: Pass props to Dashsidebar */}
            <Dashsidebar
  approvalStatus={approvalStatus}
  isProfileIncomplete={isProfileIncomplete === true} // only true when CONFIRMED incomplete, not during loading
/>
          </div>

          <div className="dashboard-screens">
            <UserTopHeader />
            <div style={{ height: "calc(100% - 76px)", overflowY: "auto", background: "#f6f5ff" }}>

{activePage === "Home" ? (
  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <UserHome />
  </div>

) : activePage === "Notifications" ? (
  <div className="services-main" style={{ height: "100%" }} onClick={() => setShowDrop(false)}>
    <UserHome initialView="notifications" />
  </div>

) : activePage === "Market Place" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <UserMarketplace
      onStepChange={(view) => {
        if (view === "currentStep") {
          setsideNav("Current Step");
          navigate("/dashboard/users/current-step");
        } else if (view === "myJourney") {
          setsideNav("My Journey");
          navigate("/dashboard/users/my-journey");
        }
      }}
    />
  </div>

) : activePage === "Paths" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <PathComponent />
  </div>

) : activePage === "My Journey" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <JourneyPage />
  </div>

) : activePage === "Current Step" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <CurrentStep productDataArray={productDataArray} />
  </div>

) : activePage === "PurchasesPage" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <UserPurchasesPage />
  </div>

) : activePage === "MentorsPage" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <UserMentorsPage />
  </div>

) : activePage === "Transactions" ? (

  <TransactionPage
    showDrop={showDrop}
    setShowDrop={setShowDrop}
    search={search}
    setSearch={setSearch}
    searchic={searchic}
    profile={profile}
    downarrow={downarrow}
  />

) : activePage === "Partners" ? (

  <div className="account-container" onClick={() => setShowDrop(false)}>
    <div className="account-left" style={{ paddingBottom: "0" }}>
      <div className="all-account">
        {accountantsList?.data
          ?.filter((e) =>
            e.displayName.toLowerCase().startsWith(search.toLowerCase())
          )
          ?.map((each, i) => (
            <div className="each-account" key={i}>
              <div className="account-img-box">
                <img className="account-img" src={each?.profilePicURL} alt="" />
              </div>
              <div className="account-name">{each?.displayName}</div>
              <div className="account-work">{each?.description}</div>
              <div
                className="account-see-more"
                onClick={() => {
                  if (!each?.userFollow) {
                    handleFollowBrand(each);
                    setChoice("Follow");
                  } else {
                    handleUnFollowBrand(each);
                    setChoice("Unfollow");
                  }
                }}
                style={{
                  background: each?.userFollow ? "#FE2C55" : "#59A2DD",
                }}
              >
                {each?.userFollow ? "Unfollow" : "Follow"}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>

) : activePage === "Calendar" ? (

  <div onClick={() => setShowDrop(false)}>
    <EarningCalendar />
  </div>

) : activePage === "Wallet" ? (

  transactionSelected ? (
    <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
      <div className="services-all-menu" style={{ borderBottom: "0.5px solid #E5E5E5" }}>
        <div style={{ display: "flex", width: "calc(100% - 110px)" }}>
          <div
            className="services-each-menu"
            style={{
              background: coinType === "fiat" ? "rgba(241,241,241,0.5)" : "",
              fontWeight: coinType === "fiat" ? "700" : "",
            }}
            onClick={() => {
              setCoinType("fiat");
              setSearch("");
            }}
          >
            Forex
          </div>
        </div>
        <div
          style={{
            fontWeight: "600",
            textDecorationLine: "underline",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          onClick={() => {
            setTransactionSelected(false);
            setTransactionData([]);
            setSelectedCoin({});
          }}
        >
          Back
        </div>
      </div>
      <VaultTransactions />
    </div>
  ) : (
    <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
      <div className="services-all-menu" style={{ borderBottom: "0.5px solid #E5E5E5" }}>
        <div style={{ display: "flex", width: "83%" }}>
          <div
            className="services-each-menu"
            style={{
              background: coinType === "fiat" ? "rgba(241,241,241,0.5)" : "",
              fontWeight: coinType === "fiat" ? "700" : "",
            }}
            onClick={() => {
              setCoinType("fiat");
              setSearch("");
            }}
          >
            Forex
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <Toggle toggle={balanceToggle} setToggle={setBalanceToggle} coinType={coinType} />
        </div>
      </div>
      <Vaults searchedValue={searchVault} />
    </div>
  )

) : activePage === "Task Manager" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <Tasks />
  </div>

) : activePage === "Scanner" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <WalletScan />
  </div>

) : activePage === "Universities" ? (

  <div className="services-main" style={{ minHeight: "100%" }} onClick={() => setShowDrop(false)}>
    <Directory />
  </div>

) : (
  ""
)}

            </div>
          </div>
        </div>
      </div>

      {/* ── Follow confirmation popup ── */}
      {submit && (
        <div className="pagemask" onMouseDown={() => { setsubmit(false); setFollow(""); setChoice(""); }} onClick={() => setShowDrop(false)}>
          <div className="full-box">
            <div className="endbox" onMouseDown={(e) => e.stopPropagation()}>
              <div className="account-img-box"><img className="account-img" src={follow.profilePicURL} alt="" /></div>
              <div className="follow-text">
                {choice === "Follow" ? "You Are Now Following" : "You Have Now Unfollowed"}<br />{follow?.displayName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Coin action drawer ── */}
      {coinActionEnabled && (
        <div className="acc-popular" onMouseDown={(e) => e.stopPropagation()}>
          <div className="acc-popular-top" style={{ height: "3rem", marginBottom: "0" }}>
            <div className="acc-popular-head">{selectedCoin?.coinName} Actions</div>
            <div className="acc-popular-img-box" onClick={() => resetCoinAction()} style={{ cursor: "pointer" }}>
              <img className="acc-popular-img" src={closepop} alt="" />
            </div>
          </div>
          <>
            {coinAction.includes("Menu") ? (
              <div>
                <div className="acc-step-text1">What would you like to do?</div>
                <div className="acc-step-box2" onClick={() => setCoinAction(["Add"])}>Add</div>
                <div className="acc-step-box2">Withdraw</div>
                <div className="acc-step-box2">Transfer</div>
              </div>
            ) : coinAction.includes("Add") ? (
              <div style={{ height: "calc(100% - 3rem)" }}>
                {addActionStep === 1 ? (
                  <>
                    <div className="acc-step-text1">How do you want to add money?</div>
                    <div className="scroll-box">
                      {paymentMethodData?.map((e) => (
                        <div className="acc-step-box2" key={e?._id} onClick={() => setSelectedPaymentMethod(e?.metadata?.name)} style={{ borderColor: selectedPaymentMethod === e?.metadata?.name ? "#182542" : "#e7e7e7" }}>
                          <div><img src={e?.metadata?.icon} alt="" /></div>
                          <div>{e?.metadata?.name}</div>
                        </div>
                      ))}
                    </div>
                    <div className="back-next-btns">
                      <div className="back-Btn" onClick={() => { setCoinAction(["Menu"]); setForexPathId(""); setSelectedPaymentMethod(""); }}>Go Back</div>
                      <div className="next-Btn" onClick={() => { if (selectedPaymentMethod?.length > 0) { setAddActionStep(2); getPathId(); } }} style={{ opacity: selectedPaymentMethod?.length > 0 ? "1" : "0.5" }}>Next Step</div>
                    </div>
                  </>
                ) : addActionStep === 2 ? (
                  <>
                    <div className="acc-step-text1">How much do you want to add?</div>
                    <div className="scroll-box">
                      <div className="acc-step-box3">
                        <div className="coin-details-div">
                          <div><img src={selectedCoin?.coinImage} alt="" /></div>
                          <div>{selectedCoin?.coinSymbol}</div>
                        </div>
                        <div className="amount-details-div">
                          <input type="number" placeholder="0.00" onChange={(e) => setAddForexAmount(e.target.value)} value={addForexAmount} onBlur={onBlur} />
                        </div>
                      </div>
                    </div>
                    <div className="back-next-btns">
                      <div className="back-Btn" onClick={() => { setAddActionStep(1); setAddForexAmount(""); }}>Go Back</div>
                      <div className="next-Btn" style={{ opacity: addForexAmount ? "1" : "0.5" }} onClick={() => { if (addForexAmount) getQuote(); }}>Next Step</div>
                    </div>
                  </>
                ) : addActionStep === 3 ? (
                  <>
                    <div className="acc-step-text1">You will be depositing</div>
                    <div className="scroll-box">
                      <div className="acc-step-box3">
                        <div className="coin-details-div">
                          <div><img src={selectedCoin?.coinImage} alt="" /></div>
                          <div>{selectedCoin?.coinSymbol}</div>
                        </div>
                        <div className="amount-details-div">{forexQuote?.finalFromAmount ? forexQuote?.finalFromAmount?.toFixed(2) : "0.00"}</div>
                      </div>
                      <div className="acc-step-text1" style={{ marginTop: "4rem" }}>You will be recieving</div>
                      <div className="acc-step-box3">
                        <div className="coin-details-div">
                          <div><img src={selectedCoin?.coinImage} alt="" /></div>
                          <div>{selectedCoin?.coinSymbol}</div>
                        </div>
                        <div className="amount-details-div">{forexQuote?.finalToAmount ? forexQuote?.finalToAmount?.toFixed(2) : "0.00"}</div>
                      </div>
                    </div>
                    <div className="back-next-btns">
                      <div className="back-Btn" onClick={() => setAddActionStep(2)}>Go Back</div>
                      <div className="next-Btn">Next Step</div>
                    </div>
                  </>
                ) : ""}
              </div>
            ) : ""}
          </>
        </div>
      )}

      {/* ── Follow list drawer ── */}
      {openRight && sideNav === "Services" && (
        <div className="all-follow" onClick={() => setShowDrop(false)}>
          <div className="all-follow-head-box">
            <div className="all-follow-head-title">Partners You Follow</div>
            <div className="all-follow-head-box-img-box" onClick={() => setOpenRight(false)} style={{ cursor: "pointer" }}>
              <img className="all-follow-head-img" src={closepop} alt="" />
            </div>
          </div>
          <div className="scrollable-follow">
            <div className="follow-current">
              <div className="follow-current-head">Currently Selected</div>
              <div className="each-follow" style={{ boxShadow: "rgba(0,0,0,0.24) 0px 3px 8px", borderRadius: "10px" }}>
                <div className="follow-details">
                  <div className="follow-icon-box"><img className="follow-icon" src={currentFollow?.bankerDetails?.profilePicURL} alt="" /></div>
                  <div className="follow-name-box">
                    <div className="follow-pop-name">{currentFollow?.bankerDetails?.displayName}</div>
                    <div className="follow-pop-time">Following&nbsp;Since&nbsp;<span>{formatDate(currentFollow?.timeStamp)}</span></div>
                  </div>
                </div>
                <div className="follow-button-box">
                  <div className="unfollow-btn">Unfollow</div>
                  <div className="profilebtn">Profile</div>
                </div>
              </div>
            </div>
            <div className="follow-current">
              <div className="follow-current-head">Other</div>
              {followList?.filter((item) => item !== currentFollow)?.map((each, i) => (
                <div className="each-follow" key={i} onClick={() => setcurrentFollow(each)}>
                  <div className="follow-details">
                    <div className="follow-icon-box"><img className="follow-icon" src={each?.bankerDetails?.profilePicURL} alt="" /></div>
                    <div className="follow-name-box">
                      <div className="follow-pop-name">{each?.bankerDetails?.displayName}</div>
                      <div className="follow-pop-time">Following&nbsp;Since&nbsp;<span>{formatDate(each?.timeStamp)}</span></div>
                    </div>
                  </div>
                  <div className="follow-button-box">
                    <div className="unfollow-btn">Unfollow</div>
                    <div className="profilebtn">Profile</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Dashboard; 