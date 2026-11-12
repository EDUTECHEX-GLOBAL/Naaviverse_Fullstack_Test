import React, { useState, useRef, useEffect } from "react";
import { triggerLogout } from "../LogoutModal/LogoutManager";
import "./dashsidebar.scss";
import { useStore } from "../store/store.ts";
import { useNavigate, useLocation } from "react-router-dom";
import { useCoinContextData } from "../../context/CoinContext";
import logo from '../../assets/images/logo/naavi_final_logo2.png';
import faviconLogo from '../../assets/images/logo/naavi_favicon.png';
import history from "./history.svg";
import pathIcon from '../../assets/images/assets/naavi-icon2.webp';
import stepIcon from '../../assets/images/assets/naavi-icon1.webp';
const NavIcon = ({ type, isActive }) => {
  const iconProps = {
    className: "user-nav-icon",
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: isActive ? "#0284c7" : "#475569",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (type) {
    case "home":
      return (
        <svg {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "paths":
      return (
        <img
          src={pathIcon}
          alt="paths"
          width="20"
          height="20"
          style={{ objectFit: "contain", opacity: 1 }}
        />
      );
    case "journey":
      return (
        <svg {...iconProps}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "current-step":
      return (
        <img
          src={stepIcon}
          alt="current-step"
          width="20"
          height="20"
          style={{ objectFit: "contain", opacity: 1 }}
        />
      );
    case "transactions":
      return (
        <svg {...iconProps}>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...iconProps}>
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="18" cy="15" r="1" fill={isActive ? "#0284c7" : "#888"} />
        </svg>
      );

    default:
      return <svg {...iconProps}><circle cx="12" cy="12" r="10" /></svg>;
  }
};

const sidebarMenu1 = [
  { id: "home",  title: "Home",  display: "Home",  icon: "home",  path: "/dashboard/users/home" },
  { id: "paths", title: "Paths", display: "Paths", icon: "paths", path: "/dashboard/users/paths" },
];

const sidebarMenu2 = [
  { id: "journey",      title: "My Journey",   display: "My Journey",   icon: "journey",      path: "/dashboard/users/my-journey" },
  { id: "current-step", title: "Current Step", display: "Current Step", icon: "current-step", path: "/dashboard/users/current-step" },
  { id: "transactions", title: "Transactions", display: "Transactions", icon: "transactions", path: "/dashboard/users/transactions" },
  { id: "wallet",       title: "Wallet",       display: "Wallet",       icon: "wallet",       path: "/dashboard/users/wallet" },

];

const allMenuItems = [...sidebarMenu1, ...sidebarMenu2];

const Dashsidebar = ({ isNotOnMainPage, handleChange, approvalStatus, isProfileIncomplete }) => {
  const { setsideNav } = useStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [imgError,       setImgError]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [collapsed,      setCollapsed]      = useState(() => {
    return localStorage.getItem('userSidebarCollapsed') === 'true';
  });
  const logoutMenuRef = useRef(null);

  // Keep --sidebar-width CSS variable in sync with collapsed state
  useEffect(() => {
    const width = collapsed ? '64px' : '240px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [collapsed]);

  useEffect(() => {
    const handleCollapse = () => {
      setCollapsed(true);
      localStorage.setItem('userSidebarCollapsed', 'true');
    };
    const handleExpand = () => {
      setCollapsed(false);
      localStorage.setItem('userSidebarCollapsed', 'false');
    };

    window.addEventListener("naavi:collapse-sidebar", handleCollapse);
    window.addEventListener("naavi:expand-sidebar", handleExpand);
    return () => {
      window.removeEventListener("naavi:collapse-sidebar", handleCollapse);
      window.removeEventListener("naavi:expand-sidebar", handleExpand);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('userSidebarCollapsed', String(next));
      return next;
    });
  };

  const effectiveApprovalStatus = (() => {
    if (approvalStatus) return approvalStatus;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.approvalStatus || parsed?.user?.approvalStatus || "";
    } catch {
      return "";
    }
  })();

  const isApprovalLocked = effectiveApprovalStatus !== "approved";
  const isLocked         = isApprovalLocked;
  const isOnProfilePage  = location.pathname === "/dashboard/users/profile";

  const {
    checkForHistory, preLoginHistoryData,
    setPathItemSelected, setSelectedPathItem,
    setCurrentStepData, setCurrentStepDataLength, setCurrentStepDataPathId,
    setTransactionSelected, setTransactionData,
  } = useCoinContextData();

  const getUserFromStorage = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user || parsed;
    } catch { return null; }
  };

  const userDetails = getUserFromStorage();
  const rawName     = userDetails?.name || userDetails?.fullName || localStorage.getItem("userName") || "";
  const firstName   = rawName.split(" ")[0] || (userDetails?.email || "User").split("@")[0];
  const userInitial = firstName.charAt(0).toUpperCase() || "U";
  const profilePic  = localStorage.getItem("userProfilePic") || userDetails?.profilePicture || userDetails?.profilePicURL || null;

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (e, title, path) => {
    e.stopPropagation();
    if (isLocked) {
      if (!isOnProfilePage) {
        navigate("/dashboard/users/profile");
      }
      return;
    }
    setCurrentStepData("");
    setCurrentStepDataLength("");
    setCurrentStepDataPathId("");
    setTransactionSelected(false);
    setTransactionData([]);
    setsideNav(title);
    navigate(path);
    setShowLogoutMenu(false);
    setMobileOpen(false);
  };

const handleLogout = (e) => {
  if (e) e.stopPropagation();
  triggerLogout(() => {
    try {
      window.dispatchEvent(new Event("naavi:logout"));
    } catch (err) {}
    [
      "authToken", "user", "partner", "userType", "userProfilePic",
      "userProfile", "userName",
      "selectedPathId", "selectedPathOwner",
      "selectedPathName", "selectedPathSteps", "selectedPathCountry",
      "selectedPathUniversity", "selectedPathPathway", "selectedPathCountryForId",
      "selectedStepId", "selectedStepNumber",
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  });
};
  const handleProfileClick = (e) => {
    e.stopPropagation();
    // Profile is always accessible
    setsideNav("Profile");
    navigate("/dashboard/users/profile");
    setShowLogoutMenu(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(e.target)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile burger */}
      <button
        className={`user-mobile-menu-btn ${mobileOpen ? "open" : ""}`}
        onClick={(e) => { e.stopPropagation(); setMobileOpen(v => !v); }}
        aria-label="Toggle navigation menu"
      >
        <span /><span /><span />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="user-sidebar-backdrop visible"
          onMouseDown={(e) => {
            setMobileOpen(false);
            setShowLogoutMenu(false);
          }}
        />
      )}

      {/* Profile-incomplete overlay */}
      {isApprovalLocked && isProfileIncomplete && !isOnProfilePage && (
        <div className="user-profile-overlay">
          <div className="user-profile-overlay-card">
            <div className="user-profile-overlay-icon"></div>
            <div className="user-profile-overlay-title">Complete Your Profile First</div>
            <div className="user-profile-overlay-divider" />
            <div className="user-profile-overlay-message">
              You need to complete all <strong>3 levels</strong> of your Naavi profile before accessing the platform.
            </div>
            <div
              className="user-profile-overlay-button"
              onClick={() => {
                navigate("/dashboard/users/profile");
                setShowLogoutMenu(false);
                setMobileOpen(false);
              }}
            >
              Complete Profile →
            </div>
            <div>
              <span className="user-profile-overlay-logout" onClick={() => handleLogout(null)}>
                Log out instead
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`user-dashboard-sidebar ${mobileOpen ? "mobile-open" : ""} ${collapsed ? "collapsed" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating edge toggle button on sidebar border */}
        <button
          className="sidebar-edge-toggle-btn"
          onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
          </svg>
        </button>

        {/* Logo Section */}
        <div
          className="user-dashboard-left"
          style={{ cursor: "pointer" }}
        >
          <div
            className="sidebar-logo-click"
            onClick={(e) => {
              e.stopPropagation();
              if (collapsed) {
                toggleCollapsed();
                return;
              }
              if (!isLocked) {
                setsideNav("Home");
                navigate("/dashboard/users/home");
                setMobileOpen(false);
              } else {
                setsideNav("Profile");
                navigate("/dashboard/users/profile");
                setMobileOpen(false);
              }
            }}
            title={collapsed ? "Expand sidebar" : "Naavi Home"}
          >
            <img
              className="user-dashboard-logo"
              src={collapsed ? faviconLogo : logo}
              alt="Naavi"
            />
            {collapsed && (
              <img
                className="user-dashboard-logo mobile-only-logo"
                src={logo}
                alt="Naavi"
              />
            )}
          </div>

          <button
            type="button"
            className="user-sidebar-mobile-close"
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(false);
            }}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div className="user-sidebar-menu-scrollable">
          {allMenuItems.map((each) => {
            const active = isActive(each.path);
            return (
              <div
                key={each.id}
                className={`user-each-sidenav ${active ? "active" : ""} ${isLocked ? "locked" : ""}`}
                onClick={(e) => handleNavigation(e, each.title, each.path)}
                title={isLocked ? "Admin approval required to access" : (collapsed ? each.display : "")}
              >
                <span className="user-nav-icon-wrapper">
                  <NavIcon type={each.icon} isActive={active} />
                </span>
                <span className="sidebar-label">{each.display}</span>
              </div>
            );
          })}

          {checkForHistory && !isLocked && (
            <div className="user-history-div">
              <div className="user-history-box">
                <img src={history} alt="history" />
                <div className="user-history-label">You viewed the following path:</div>
                <div className="user-history-details">
                  <div className="user-history-title">{preLoginHistoryData?.destination_institution}</div>
                  <div className="user-history-program">{preLoginHistoryData?.program}</div>
                  <div className="user-pathId-text"><span>pathid:</span> {preLoginHistoryData?._id}</div>
                </div>
                <div
                  className="user-open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPathItemSelected(true);
                    setSelectedPathItem(preLoginHistoryData);
                    localStorage.setItem("selectedPath", JSON.stringify(preLoginHistoryData?.nameOfPath));
                    navigate("/dashboard/users/my-journey");
                    setMobileOpen(false);
                  }}
                >
                  Open
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile section at bottom */}
        <div className="user-sidebar-profile-section">
          <div style={{ position: "relative" }} ref={logoutMenuRef}>
            <div className="user-sidebar-profile-row">
              <div
                className="user-sidebar-profile-info"
                style={{ cursor: "pointer" }}
                onClick={handleProfileClick}
              >
                {profilePic && !imgError ? (
                  <img
                    src={profilePic}
                    alt={firstName}
                    onError={() => setImgError(true)}
                    className="user-sidebar-avatar-img"
                  />
                ) : (
                  <div className="user-sidebar-avatar-initials">{userInitial}</div>
                )}
                <div className="user-sidebar-profile-name-wrap sidebar-label">
                  <div className="user-sidebar-profile-name">{firstName}</div>
                  {isLocked && (
                    <div
                      className="user-sidebar-profile-status"
                      style={{ color: effectiveApprovalStatus === "rejected" ? "#ef4444" : "#f59e0b" }}
                    >
                      {effectiveApprovalStatus === "rejected"
                        ? "Rejected"
                        : effectiveApprovalStatus === "pending"
                        ? "Pending Approval"
                        : isProfileIncomplete
                        ? "Profile Required"
                        : "Awaiting Approval"}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="user-sidebar-dots-btn"
                onClick={(e) => { e.stopPropagation(); setShowLogoutMenu(v => !v); }}
                title="Account options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="2" fill="#000000" />
                  <circle cx="20" cy="12" r="2" fill="#000000" />
                  <circle cx="4" cy="12" r="2" fill="#000000" />
                </svg>
              </div>
            </div>

            {showLogoutMenu && (
              <div className="user-sidebar-logout-menu">
                <div
                  className="user-sidebar-logout-item"
                  onClick={(e) => {
                    setShowLogoutMenu(false);
                    handleLogout(e);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashsidebar;