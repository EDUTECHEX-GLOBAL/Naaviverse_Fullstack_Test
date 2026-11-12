/**
 * ============================
 *   [GLOBE] NAAVIVERSE BACKEND
 *   Express Application Setup
 * ============================
 */

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Override default DNS servers to prevent ECONNREFUSED issues on MongoDB Atlas
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

var axios = require("axios");
const AWS = require("aws-sdk");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY || "loopback, linklocal, uniquelocal");

/* ------------------- AWS CONFIG ------------------- */
AWS.config.update({ region: "ap-south-1" });
const s3 = new AWS.S3();

/* ------------------- ROUTER IMPORTS ------------------- */

var indexRouter = require("./routes/IndexRouter");
var authRouter = require("./routes/AuthRouter");
var servicesRouter = require("./routes/ServicesRouter");
var adminServicesRouter = require("./routes/AdminServicesRouter");
var usersRouter = require("./routes/UsersRouter");
var universitiesRouter = require("./routes/UniversitiesRouter");
var pathsRouter = require("./routes/PathRouter");
var userpathRouter = require("./routes/UserPathRouter");
var preLoginRouter = require("./routes/PreLoginRouter");
var userPersonalityRouter = require("./routes/UserPersonalityRouter");
var partnerRouter = require("./routes/PartnerRouter");
var adminRouter = require("./routes/AdminRouter");
var personalityRouter = require("./routes/PersonalityRouter");
var programRouter = require("./routes/ProgramRouter");
var uploadRouter = require("./routes/UploadRouter");
var approvalRouter = require("./routes/ApprovalRouter");
var visitorRoutes = require("./Admin/routes/VisitorRouter");
const adminAuthRoutes = require("./Admin/routes/AdminAuthRouter");
const adminDashboardRoutes = require("./Admin/routes/AdminDashboardRouter");
const dashboardRouter = require("./routes/DashboardRouter");
const activityRouter  = require("./routes/ActivityRouter");
const stepsRouter = require("./routes/StepsRouter");
const marketplaceRouter = require("./routes/MarketplaceRouter");
 const partnerDashboardRouter = require("./routes/PartnerDashboardRouter");
const programNameRouter = require("./routes/ProgramNameRouter");
const universityProgramRouter = require("./routes/UniversityProgramRouter");
const locationRouter = require("./routes/LocationRouter");

const currencyRoutes = require("./routes/CurrencyRouter");
const countryRoutes = require("./routes/CountryRouter");
const stateRoutes = require("./routes/StateRouter");
const cityRoutes = require("./routes/CityRouter");
const agentPathsRouter = require("./routes/AgentPathsRouter");
const feedbackRouter = require("./routes/FeedbackRouter");
const pathRequestRouter = require("./routes/PathRequestRouter");
const chatbotRouter = require("./routes/ChatbotRouter");

// ── Super Admin — newsletter/landing page email subscriptions ──────────────
const adminNewsletterRoutes = require("./Admin/routes/SubscriptionRouter");
const contactRoutes = require("./Admin/routes/ContactRouter");

// ── Platform Admin — paid platform subscriptions (monthly/annual) ──────────
const platformSubscriptionRoutes = require("./routes/SubscriptionRouter");

/* ------------------- APP SETTINGS ------------------- */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/* ------------------- MIDDLEWARE ------------------- */

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* -------------------------------- CORS CONFIG ---------------------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4545",
  "http://127.0.0.1:4545",
  "https://naaviverse-vercel-frontend-sigma.vercel.app",
  "https://naaviverse-frontend-sepia.vercel.app",
  "https://naavinetwork.ai",
  "https://www.naavinetwork.ai"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("[ERROR] CORS blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ------------------- DATABASE CONNECTION ------------------- */

const database_url = process.env.DATABASE_URI;

mongoose
  .connect(database_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("[OK] Connected to MongoDB"))
  .catch((err) => console.error("[ERROR] MongoDB Connection Error:", err));

/* ------------------- ROUTES ------------------- */

app.use("/", indexRouter);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/upload", uploadRouter);

app.use("/api/services", servicesRouter);
app.use("/admin/services", adminServicesRouter);

app.use("/api/steps", stepsRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/admin/marketplace", marketplaceRouter);
app.get("/api/purchases", require("./controllers/MarketPlaceController").getAllPurchases);

app.use("/api/universities", universitiesRouter);
app.use("/api/paths", pathsRouter);
app.use("/api/path-requests", pathRequestRouter);
app.use("/api/userpaths", userpathRouter);
app.use("/api/pre_login", preLoginRouter);
app.use("/api/userAnswers", userPersonalityRouter);
app.use("/api/partner", partnerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/personality", personalityRouter);
app.use("/api/approvals", approvalRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin/notifications", dashboardRouter);
app.use("/api/activity",  activityRouter);
app.use("/api/payment", require("./routes/PaymentRouter"));
app.use("/api/partner-dashboard", partnerDashboardRouter);
app.get("/api/user-dashboard/notifications", require("./controllers/UserDashboardController").getUserNotifications);
// ── Super Admin routes (newsletter, contacts, visitors, dashboard) ─────────
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/admin-subscribe", adminNewsletterRoutes);   // newsletter subscribers
app.use("/api/admin-contact", contactRoutes);
app.use("/api/admin-visitors", visitorRoutes);

/* ---------- EXTRA ROUTES ---------- */

app.use("/api", currencyRoutes);

app.use("/api/programs", programNameRouter);
app.use("/api/university-programs", universityProgramRouter);
app.use("/api/locations", locationRouter);

app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);

// ── Platform subscription routes (paid plans — monthly/annual) ────────────
app.use("/api/subscriptions", platformSubscriptionRoutes);

// ── AI Agent published paths (fetched from HuggingFace) ───────────────────
app.use("/api/agent-paths", agentPathsRouter);

// ── Student Feedback routes (forwarded to Naav Agent) ─────────────────────
const {
  getPartnerFeedbacks,
  getPathEngineFeedbacks,
  getAdminFeedbacks
} = require("./controllers/FeedbackController");

app.get("/api/partner/feedbacks", getPartnerFeedbacks);
app.get("/api/path-engine/feedbacks", getPathEngineFeedbacks);
app.get("/api/admin/feedbacks", getAdminFeedbacks);
app.use("/api/feedback", feedbackRouter);

app.use("/api/perplexity", require("./routes/PerplexityRouter"));
app.use("/api/regenerate", require("./routes/RegenerateAllRouter"));
app.use("/api/crm", require("./routes/CrmRouter"));
app.use("/api/regenerate", require("./routes/RegenerateBatchRouter"));
app.use("/api/utils", require("./routes/AddStepIdsRouter"));
app.use("/api/stepviews", require("./routes/StepViewsRouter"));
app.use("/api/wallet", require("./routes/VaultRouter"));
app.use("/api/categories", require("./routes/CategoriesRouter"));
app.use("/api/chatbot", chatbotRouter);

/* ------------------- ERROR HANDLING ------------------- */

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

const PORT = process.env.PORT || 4545;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[LAUNCH] Server running on port ${PORT}`);
});

module.exports = app;
