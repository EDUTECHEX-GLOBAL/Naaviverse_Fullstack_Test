// [check] CORRECTED App.js
import React, { Fragment, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import AOS from "aos";
import "aos/dist/aos.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import ScrollToTop from "./components/ScrollToTop";
import MyStepsAdmin from "./pages/AdminAccDashbaoard/MyStepsAdmin";

/* ================= TEMPLATE ROUTER ================= */
import AppRouter from "./router/AppRouter";

/* ================= PUBLIC ================= */
import MapsPage from "./pages/MapsPage";
import Loginpage from "./pages/login/loginpage";
import NewHomePage from "./pages/Registration/Home";

/* ================= USER ================= */
import Dashboard from "./pages/dashboard/dashboard";
import UserProfile from "./pages/UserProfile";
import Wallet from "./pages/Wallet";
import StepPage from "./pages/CurrentStep/StepPage";
import MallProduct from "./pages/dashboard/MallProduct/MallProduct";

/* ================= ACCOUNTANT ================= */
import AccDashboard from "./pages/accDashbaoard/accDashboard";
import AccProfile from "./pages/accProfile/AccProfile";
import MyPaths from "./pages/MyPaths";
import NewStep1 from "./globalComponents/GlobalDrawer/NewStep1";
import CreateNewStep from "./pages/accDashbaoard/CreateNewStep";
import MyStepsAcc from "./pages/accDashbaoard/MyStepsAcc";
import PathPage from "./components/Pathview/PathPage";
import StepsListPage from "./pages/accDashbaoard/StepsListPage";
import ServicesListPage from "./pages/accDashbaoard/ServicesListPage";

/* ========== ADMIN ========== */
import AdminLogin from "./pages/AdminLogin";
import AdminAccDashbaoard from "./pages/AdminAccDashbaoard";
import AdminProfilePage from "./pages/AdminAccDashbaoard/Profile/profile_page";
import Subscriptions from "./pages/AdminAccDashbaoard/Subscriptions";
/* ================= SUPER ADMIN ================= */
import SuperAdminLogin from "./AdminDashboard/pages/SuperAdminLogin";
import AdminDashboard from "./AdminDashboard/pages/AdminDashboard";
import PrivateRoute from "./AdminDashboard/components/PrivateRoute";
import HomeDashboard from "./AdminDashboard/components/Home";
import ContactList from "./AdminDashboard/components/ContactList";
import SubscriptionList from "./AdminDashboard/components/SubscriptionList";
import VisitorsList from "./AdminDashboard/components/VisitorsList";
import MarketplaceAssistance from "./AdminDashboard/components/MarketplaceAssistance";

/* ================= OTHER ================= */
import PurchaseSuccess from "./pages/PurchaseSuccess";
import RoutePage from "./pages/RoutePage/routepage";
import NaaviExclusivePage from "./pages/NaaviExclusive/NaaviExclusivePage";
import PartnerExclusiveDashboard from "./pages/NaaviExclusive/PartnerExclusiveDashboard";
import { SvgCheckCircle } from "./utils/SvgIcons";
import Chatbot from "./components/Chatbot/Chatbot";
import PartnerChatbot from "./components/Chatbot/PartnerChatbot";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function VisitorLogger() {
  const location = useLocation();
  const loggedRef = useRef(false);

  useEffect(() => {
    const isAdminRoute =
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/admin-dashboard") ||
      location.pathname.startsWith("/admin-login");

    if (isAdminRoute) return;

    // Ignore automated headless browsers (e.g. Puppeteer, Selenium, web crawlers)
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const sessionKey = "naavi_vl_" + todayStr;
    if (sessionStorage.getItem(sessionKey) || loggedRef.current) return;
    loggedRef.current = true;

    const logVisit = async () => {
      let clientIp = null;
      try {
        const ipRes = await axios.get("https://api.ipify.org?format=json", {
          timeout: 3000,
        });
        if (ipRes.data && ipRes.data.ip) {
          clientIp = ipRes.data.ip;
        }
      } catch (e) {
        // Fallback: backend will use proxy headers
      }

      try {
        await axios.post(`${BASE_URL}/api/admin-visitors/admin-visitor`, {
          clientIp,
        });
        sessionStorage.setItem(sessionKey, "1");
      } catch (err) {
        loggedRef.current = false;
      }
    };

    logVisit();
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: false,
    });
  }, []);

  return (
    <Fragment>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <BrowserRouter>
        <VisitorLogger />
        <ScrollToTop />
        <Chatbot />
        <PartnerChatbot />
        <Routes>


          {/* ================= PUBLIC ================= */}
          <Route path="/login" element={<Loginpage />} />
          <Route path="/partner/login" element={<Loginpage initialType="Partner" />} />
          <Route path="/register" element={<NewHomePage />} />
          <Route path="/maps" element={<MapsPage />} />

          {/* ================= USER DASHBOARD ================= */}
          <Route path="/dashboard/users" element={<Dashboard />} />
          <Route path="/dashboard/users/profile" element={<UserProfile />} />
          <Route path="/dashboard/users/paths" element={<Dashboard />} />
          <Route path="/dashboard/users/my-journey" element={<Dashboard />} />
          <Route path="/dashboard/users/current-step" element={<Dashboard />} />
          <Route path="/dashboard/users/transactions" element={<Dashboard />} />
          <Route path="/dashboard/users/purchases" element={<Dashboard />} />
          <Route path="/dashboard/users/mentors" element={<Dashboard />} />
          <Route path="/dashboard/users/wallet" element={<Wallet />} />
          <Route path="/dashboard/users/notifications" element={<Dashboard />} />
          <Route path="/dashboard/users/home" element={<Dashboard />} />

          {/* <SvgCheckCircle size={14} /> MUST be before /:id wildcard so it doesn't get caught by MallProduct */}
          <Route path="/dashboard/users/Marketplace" element={<Dashboard />} />

          {/* This wildcard catches everything else like /dashboard/users/some-product-code */}
          <Route path="/dashboard/users/:id" element={<MallProduct />} />

          {/* ================= PATH / STEP ================= */}
          <Route path="/dashboard/path/:id" element={<PathPage />} />
          <Route path="/dashboard/step/:id" element={<StepPage />} />
          <Route path="/paths/:pathId/steps" element={<StepsListPage />} />

          {/* ================= SERVICES ROUTES ================= */}
          <Route path="/services/all" element={<ServicesListPage />} />

          {/* ================= ACCOUNTANT ================= */}
          <Route path="/dashboard/accountants" element={<AccDashboard />}>
            <Route index element={<AccDashboard />} />
            <Route path="home" element={<AccDashboard />} />
            <Route path="crm" element={<AccDashboard />} />
            <Route path="paths" element={<AccDashboard />} />
            <Route path="steps" element={<AccDashboard />} />
            <Route path="marketplace" element={<AccDashboard />} />
            <Route path="feedback" element={<AccDashboard />} />
            <Route path="path/:id/create-step" element={<NewStep1 />} />
            <Route path="path/:id" element={<PathPage />} />
          </Route>

          <Route path="/dashboard/accountants/profile" element={<AccProfile />} />

          {/* ================= ADMIN ================= */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard/profile" element={<AdminProfilePage />} />

          {/* <SvgCheckCircle size={14} /> Replace single route with nested sub-routes */}
          <Route path="/admin/dashboard/accountants" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/crm" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/paths" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/steps" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/marketplace" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/subscriptions" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/feedback" element={<AdminAccDashbaoard />} />
          <Route path="/admin/dashboard/internal-partners" element={<AdminAccDashbaoard />} />

          {/* ================= SUPER ADMIN ================= */}
          <Route path="/admin-login" element={<SuperAdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route path="admin-home" element={<HomeDashboard />} />
            <Route path="admin-contact" element={<ContactList />} />
            <Route path="admin-subscribe" element={<SubscriptionList />} />
            <Route path="admin-visitors" element={<VisitorsList />} />
            <Route path="admin-marketplace-assistance" element={<MarketplaceAssistance />} />
          </Route>

          {/* ================= PURCHASE ================= */}
          <Route path="/purchase/success" element={<PurchaseSuccess />} />

          {/* ================= NAAVI EXCLUSIVE (External Partner Checkout) ================= */}
          <Route path="/naavi-exclusive" element={<NaaviExclusivePage />} />
          <Route path="/naavi-exclusive/:partnerId" element={<NaaviExclusivePage />} />
          <Route path="/partner/exclusive-dashboard" element={<PartnerExclusiveDashboard />} />
          <Route path="/partner/exclusive-dashboard/:tab" element={<PartnerExclusiveDashboard />} />

          {/* ================= FALLBACK ================= */}
          <Route path="/*" element={<AppRouter />} />
          <Route path="*" element={<RoutePage />} />

        </Routes>
      </BrowserRouter>
    </Fragment>
  );
}

export default App;
