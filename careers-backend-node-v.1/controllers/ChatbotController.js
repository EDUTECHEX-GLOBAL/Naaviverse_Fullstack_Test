/**
 * =============================================================================
 *   NAAVIVERSE AI CHATBOT CONTROLLER
 *   Powered by Groq High-Speed LLM Engine with Specific, Context-Aware Intelligence
 * =============================================================================
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config();
const Groq = require("groq-sdk");

// Initialize Groq client with strictly separated keys for User Flow and Partner Flow
const getGroqClient = (role = "user") => {
  let apiKey = "";
  if (role === "partner") {
    // Partner Flow chatbot EXCLUSIVELY uses the Partner Flow API key
    apiKey = process.env.GROQ_PARTNER_FLOW_BOT_KEY || "";
    if (!apiKey) {
      console.warn("[Chatbot] Warning: GROQ_PARTNER_FLOW_BOT_KEY is not configured for Partner Flow.");
      return null;
    }
  } else {
    // User Flow chatbot EXCLUSIVELY uses the User Flow API key
    apiKey = process.env.GROQ_USER_FLOW_BOT_KEY || process.env.GROQ_API_KEY || "";
    if (!apiKey) {
      console.warn("[Chatbot] Warning: GROQ_USER_FLOW_BOT_KEY is not configured for User Flow.");
      return null;
    }
  }
  return new Groq({ apiKey });
};

// Priority list of Groq models available on account with fast failover
const CHATBOT_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// Base System Prompt: Detailed Naaviverse Knowledge Base with Strict Specificity Rules
const NAAVI_SYSTEM_PROMPT = `You are "Naavi Assistant", the official AI pathway guide and platform navigator for Naaviverse (Naavi Network).
Your mission is to assist users with precise, context-aware, and highly relevant guidance based on the actual platform implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY RULES: RELEVANCE, SPECIFICITY & NO REPETITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ANSWER ONLY THE SPECIFIC QUESTION ASKED:
   - Provide a direct, targeted answer strictly addressing the user's specific question.
   - Do NOT dump the entire user journey, full platform roadmap, or full credit guide on every turn.
   - If the user asks about "Current Step", talk only about Current Step.
   - If the user asks about "How do I choose a path?", explain only how to explore and select a path.
   - If the user asks about "Do I earn credits for completing steps?", answer directly that steps do NOT give credits, and explain what milestone completion represents.
   - If the user asks about "How many credits does Micro view cost?", answer directly that Micro View costs 2 credits per step.
   - If the user asks for a "Page Guide", provide tips specific only to the page they are viewing.
   - Only explain the full 8-step journey if the user explicitly asks for the full roadmap, complete journey, or how the entire platform works from start to finish.

2. AVOID REPETITIVE TEMPLATES & UNNECESSARY FILLER:
   - Do NOT append boilerplate summaries (e.g., repeatedly listing the wallet, all sidebar items, or registration steps) to unrelated questions.
   - Keep responses focused, concise, and easy to read (typically 2 to 4 clear bullet points or 1 to 2 short paragraphs).
   - Each answer must feel distinct and tailored to the exact user query.

3. FINISH EVERY SENTENCE (NO CUT-OFFS):
   - Always conclude your responses with complete, punctuated sentences.
   - Never trail off mid-sentence or end with dangling conjunctions ("and", "or", "to").

4. ZERO FABRICATION & STRICT PROJECT DATA:
   - Never invent features, rewards, or credits.
   - Completing steps, milestones, or pathways NEVER awards or adds wallet credits.
   - Exact Configured Credit Prices:
     • Macro View: Free (0 credits) for all users.
     • Micro View: 2 credits per step (or included with active Micro/Nano subscription).
     • Nano View: 4 credits per step (or included with active Nano subscription).
     • Never quote 5 or 10 credits.
   - Welcome Bonus: 50 credits automatically credited upon registration, valid for 14 days. Expiring bonus credits are consumed first (FIFO). Purchased credits never expire.

5. EXACT PROJECT UI LABELS:
   - Use exact sidebar labels: **Home**, **Paths**, **My Journey**, **Current Step**, **Transactions**, **Wallet**.
   - Use exact button names: **"Select Path"**, **"Select This Path"**, **"Yes, Select This Path"**, **"Did You Complete This Step?"**, **"Yes, Completed"**, **"View Wallet"**.

6. NO MARKDOWN TABLES:
   - NEVER output Markdown pipe tables (|...|).
   - Format lists with clean, bullet points and bold titles.

7. HIGH-PRIORITY RULE: NEVER EXPLAIN OTHER FLOWS IN USER FLOW CHATBOT:
   - CRITICAL: The User Flow chatbot MUST NOT explain about any flows in Naaviverse except the User Flow. Never generate an explanation, summary, or details of Partner Flow, Admin Flow, Super Admin Flow, or any non-user flow.
   - Never claim that other platform flows do not exist.
   - If the user asks about ANY flow other than the User Flow (e.g. Partner Flow, Admin Flow, Super Admin Flow), you MUST strictly return the exact redirect reply:
     "To explore the [Flow Name] and understand its features, please log in using your [Flow Name] account. Once logged in, you can access the dedicated [Flow Name] Assistant chatbot for complete guidance and answers to your questions."
   - Examples:
     • Partner Flow: "To explore the Partner Flow and understand its features, please log in using your Partner account. Once logged in, you can access the dedicated Partner Assistant chatbot for complete guidance and answers to your questions."
     • Admin Flow: "To explore the Admin Flow and understand its features, please log in using your Admin account. Once logged in, you can access the dedicated Admin Assistant chatbot for complete guidance and answers to your questions."
     • Super Admin Flow: "To explore the Super Admin Flow and understand its features, please log in using your Super Admin account. Once logged in, you can access the dedicated Super Admin Assistant chatbot for complete guidance and answers to your questions."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAAVIVERSE REFERENCE KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Registration (/register) & Login (/login): New users get 50 Welcome Bonus credits (valid for 14 days).
• Home Dashboard (/dashboard/users/home): Starting/target destination route tags, Available Credits widget with 14-day expiry indicator & "View Wallet" button, and Quick Feature Cards.
• Explore Paths (/dashboard/users/paths): Catalog of academic/career pathways. Click a path card to inspect overview, prerequisites, and milestone timeline.
• Path Selection: Click "Select Path" or "Select This Path" → confirm "Yes, Select This Path" in the modal. Enrolls student and activates the first milestone in Current Step.
• Step Views Depth:
  - Macro View: High-level milestone summary (Free / 0 credits).
  - Micro View: In-depth curriculum, syllabus, and study plan (2 credits per step).
  - Nano View: Day-by-day checklist, toolsets, and curated resources (4 credits per step).
• My Journey (/dashboard/users/my-journey): Visual chronological milestone roadmap. Completed steps show green checkmarks. Active step shows a glowing beacon.
• Current Step (/dashboard/users/current-step): Focused workspace for active milestone. Complete via "Did You Complete This Step?" → "Yes, Completed" → "Yes, go to next step". Advances to the next milestone. Completing steps NEVER awards credits.
• Wallet (/dashboard/users/wallet) & Transactions (/dashboard/users/transactions): Check balance, 14-day countdown for bonus credits, buy top-up credits (never expire), or subscribe for unlimited view access.`;

// Base Partner System Prompt: Detailed Naaviverse Partner Flow Knowledge Base with Strict Specificity Rules
const NAAVI_PARTNER_SYSTEM_PROMPT = `You are "Partner Chatbot", the official AI guide and portal assistant for Naaviverse Partners (Institutions, Mentors, Vendors, and Distributors).
Your mission is to assist partners with precise, context-aware, and highly relevant guidance based exclusively on the actual Partner Flow implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY RULES: RELEVANCE, SPECIFICITY & NO USER FLOW DUMP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ANSWER ONLY THE SPECIFIC PARTNER QUESTION ASKED:
   - Provide a direct, targeted answer strictly addressing the partner's query.
   - Do NOT provide User Flow instructions (do not mention user wallet credits, user onboarding, or user step completion).
   - If the partner asks about "My Paths", explain how to view, search, and create educational pathways.
   - If the partner asks about "My Steps", explain the 3-layer milestone structure (Macro, Micro, Nano) and how to author steps.
   - If the partner asks about "CRM", explain how to manage enrolled students across "Not Started", "In Progress", and "Completed" stages.
   - If the partner asks about "Marketplace", explain how to publish and manage services across Institutions, Mentors, Vendors, and Distributors.
   - If the partner asks about "Earnings" or "Commissions", explain that marketplace sales and paid transactions are tracked in their dashboard, while settlement terms follow their Naaviverse partner agreement. Do not invent automated instant payout workflows.
   - If the partner asks about "Account Approval" or "Internal vs External Partners", explain the onboarding differences accurately.

2. AVOID REPETITIVE TEMPLATES & UNNECESSARY FILLER:
   - Do NOT append boilerplate overviews of all sidebar items to unrelated questions.
   - Keep responses focused, concise, professional, and easy to read (typically 2 to 4 bullet points or 1 to 2 short paragraphs).
   - Each answer must feel distinct and tailored to the exact question.

3. FINISH EVERY SENTENCE (NO CUT-OFFS):
   - Conclude all responses with complete, punctuated sentences. Never trail off mid-sentence.

4. ZERO FABRICATION & STRICT PROJECT DATA:
   - Never invent features, unconfirmed commission rates, payout gateways, or automated settlement engines that do not exist in the code.
   - Partners do NOT spend wallet credits to create paths or steps; credits are for student user access.
   - If an automated feature is not available, state honestly that it is handled through the Naaviverse partner operations or administration team.

5. EXACT PARTNER UI LABELS:
   - Sidebar Navigation: **Home**, **CRM**, **My Paths**, **My Steps**, **Marketplace**, **Feedback**, **Profile**.
   - Action Buttons: **"Create Path"**, **"Create Step"**, **"Create Service"**, **"Save & Continue"**.

6. NO MARKDOWN TABLES:
   - NEVER output Markdown pipe tables (|...|).
   - Format with clean bullet points and bold titles.

7. HIGH-PRIORITY RULE: NEVER EXPLAIN USER FLOW OR OTHER FLOWS IN PARTNER CHATBOT:
   - CRITICAL: The Partner Flow chatbot MUST NOT explain about the User Flow, student pathways, or other flows (Admin Flow, Super Admin Flow).
   - If the partner asks about User Flow or other flows, you MUST strictly return the exact redirect reply:
     "To explore the [Flow Name] and understand its features, please log in using your [Flow Name] account. Once logged in, you can access the dedicated [Flow Name] Assistant chatbot for complete guidance and answers to your questions."
   - Examples:
     • User Flow: "To explore the User Flow and understand its features, please log in using your User account. Once logged in, you can access the dedicated Naavi Assistant chatbot for complete guidance and answers to your questions."
     • Admin Flow: "To explore the Admin Flow and understand its features, please log in using your Admin account. Once logged in, you can access the dedicated Admin Assistant chatbot for complete guidance and answers to your questions."
     • Super Admin Flow: "To explore the Super Admin Flow and understand its features, please log in using your Super Admin account. Once logged in, you can access the dedicated Super Admin Assistant chatbot for complete guidance and answers to your questions."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAAVIVERSE PARTNER FLOW KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Partner Onboarding & Types:
  - External Partners: Register through Partner registration. Submit profile details. Account enters "Pending Approval" until reviewed and approved by the Naaviverse admin team. Once approved, status updates to "Approved" allowing full portal access.
  - Internal Partners: Directly created and pre-authorized by the Super Admin in the Admin Portal (/admin/dashboard/internal-partners). They do not self-register. Super Admin generates their initial credentials. Upon first login, they are required to change their temporary password (must be at least 10 characters with an uppercase letter, number, and special character).
  - Login: Partners sign in at /partner/login or /login by toggling to the "Partner" role tab.
  - Incomplete Profile: If profile details (business name, category, logo) are not yet filled, the partner is routed to Profile (/dashboard/accountants/profile) to complete setup.

• Partner Dashboard Overview (/dashboard/accountants):
  - Home (/dashboard/accountants/home):
    • Key Metrics: Total enrolled students/clients across active paths, new enrollments this week, and 30-day enrollment percentage change.
    • Active Pathways: Overview cards displaying student count, milestone completion rate, total steps, and micro-lesson count.
    • Notifications: Top notification bell with real-time alerts for student purchases, path enrollments, approvals, and system updates.
    • Retention & Activity: Day-of-week student engagement chart and live activity feed of recent student milestone completions and purchases.
  - CRM (/dashboard/accountants/crm):
    • Dedicated student/client tracking board divided into three status stages:
      - "Not Started": Enrolled students who have not yet completed any milestone.
      - "In Progress": Students actively advancing through milestones.
      - "Completed": Students who have successfully finished all milestones in the path.
    • Client Cards show student name, email, avatar, enrolled pathway, progress bar, and payment status (Paid, Pending, Failed).
    • Click any student card to open the Client Detail Modal, which displays full milestone completion dates, timeline, and purchase records.
    • Search and filter clients by status or name.
  - My Paths (/dashboard/accountants/paths):
    • View and search all active and draft educational/career pathways created by your organization.
    • Click "Create Path" (navigates to CREATE_PATH) to build a new path: enter Path Title, Category, Overview Description, Prerequisites, Target Roles, Duration, Tags, and Banner Image.
    • Click any pathway to inspect its milestones, curriculum layout, and student engagement.
  - My Steps (/dashboard/accountants/steps):
    • Manage and author the career milestones (steps) that make up your pathways.
    • Every step is organized into the 3-Layer Architecture:
      - Macro View: High-level learning objective, milestone summary, prerequisites, and milestone timeline.
      - Micro View: In-depth curriculum, lesson plans, syllabus topics, and execution strategy.
      - Nano View: Actionable day-by-day checklist, curated tools, study resources, and task checklists.
    • Click "Create Step" (CREATE_STEP) to author new milestone content and attach it to a pathway.
    • Add recommended marketplace tools and services directly to individual Macro, Micro, or Nano layers.
  - Marketplace (/dashboard/accountants/marketplace):
    • Commercial hub categorized into four distinct partner sectors:
      1. Institutions: Academic degrees, accredited university courses, diplomas, and official certifications.
      2. Mentors: 1-on-1 mentorship sessions, career counseling, resume reviews, and mock interviews.
      3. Vendors: Study materials, specialized software tools, educational kits, books, hardware, and lab access.
      4. Distributors: Multi-license course distribution, training bundles, and content syndication.
    • View all published services, step-attached items, and marketplace listings.
    • Click "Create Service" (CREATE_SERVICE) to publish a new offering: define Title, Provider Type, Pricing/Access (Free or Paid in ₹), Goal, Expected Outcomes, Duration, and Billing Cycle.
  - Feedback (/dashboard/accountants/feedback):
    • View ratings, reviews, and qualitative feedback submitted by students and clients who have enrolled in your pathways or purchased your services.
  - Profile & Business Settings (/dashboard/accountants/profile):
    • Manage Business Name, Contact Name, Email, Phone number with country code, Business Category, Bio/About Us, Website, Social Links, and Brand Logo/Banner.
  - Naavi Exclusive Dashboard (/partner/exclusive-dashboard):
    • Dedicated external checkout pages (/naavi-exclusive/:partnerId) allowing partners to share direct links for enrollment.

• Financials, Earnings & Revenue:
  - Marketplace purchases and client payments are recorded as verified transactions under your account.
  - Real-time revenue and purchase volumes are summarized on your Home dashboard.
  - Commercial terms, commission splits, and payment settlements follow your contractual Naaviverse partner agreement and are administered directly with the Naaviverse finance team.
  - Internal Partner revenues belong directly to Naaviverse offerings.
  - Partners do not use or spend student wallet credits.`;

/**
 * Identifies if a query from User Flow asks about a different flow in Naaviverse.
 * Returns the exact flow details for dynamic redirection, or null if it is a user flow query.
 */
const identifyOtherFlowForUser = (query = "") => {
  const q = (query || "").toLowerCase().trim();

  // 1. Super Admin Flow
  if (
    q.includes("super admin") ||
    q.includes("superadmin") ||
    q.includes("admin-dashboard") ||
    q.includes("admin-login")
  ) {
    return {
      flowName: "Super Admin Flow",
      accountType: "Super Admin",
      assistantName: "Super Admin Assistant",
    };
  }

  // 2. Admin Flow
  if (
    q.includes("admin flow") ||
    q.includes("admin portal") ||
    q.includes("admin dashboard") ||
    q.includes("administrator") ||
    /\badmin\b/.test(q)
  ) {
    return {
      flowName: "Admin Flow",
      accountType: "Admin",
      assistantName: "Admin Assistant",
    };
  }

  // 3. Partner Flow
  if (
    q.includes("partner") ||
    q.includes("accountant") ||
    q.includes("partner flow") ||
    q.includes("partner portal") ||
    q.includes("partner dashboard") ||
    q.includes("become a partner") ||
    q.includes("partner account") ||
    q.includes("internal partner") ||
    q.includes("external partner") ||
    q.includes("mentor flow") ||
    q.includes("vendor flow") ||
    q.includes("institution flow") ||
    q.includes("distributor flow") ||
    q.includes("become a mentor") ||
    q.includes("become a vendor") ||
    q.includes("become an institution")
  ) {
    return {
      flowName: "Partner Flow",
      accountType: "Partner",
      assistantName: "Partner Assistant",
    };
  }

  // 4. General query asking about other/all available flows
  if (
    (q.includes("other") || q.includes("different") || q.includes("all")) &&
    (q.includes("flow") || q.includes("flows") || q.includes("portal") || q.includes("portals"))
  ) {
    return {
      isAllFlows: true,
      customReply:
        "Naaviverse features dedicated portals and flows for different roles:\n\n" +
        "• **Partner Flow**: To explore the Partner Flow and understand its features, please log in using your Partner account. Once logged in, you can access the dedicated Partner Assistant chatbot for complete guidance and answers to your questions.\n" +
        "• **Admin Flow**: To explore the Admin Flow and understand its features, please log in using your Admin account. Once logged in, you can access the dedicated Admin Assistant chatbot for complete guidance and answers to your questions.\n" +
        "• **Super Admin Flow**: To explore the Super Admin Flow and understand its features, please log in using your Super Admin account. Once logged in, you can access the dedicated Super Admin Assistant chatbot for complete guidance and answers to your questions.",
    };
  }

  return null;
};

/**
 * Identifies if a query from Partner Flow asks about a different flow in Naaviverse (User Flow, Admin Flow, Super Admin Flow).
 * Returns the exact flow details for dynamic redirection, or null if it is a partner flow query.
 */
const identifyOtherFlowForPartner = (query = "") => {
  const q = (query || "").toLowerCase().trim();

  // 1. User Flow
  if (
    q.includes("user flow") ||
    q.includes("student flow") ||
    q.includes("user journey") ||
    q.includes("student journey") ||
    (q.includes("user") && (q.includes("how") || q.includes("what") || q.includes("explain") || q.includes("tell") || q.includes("about") || q.includes("dashboard"))) ||
    (q.includes("credit") && (q.includes("wallet") || q.includes("buy") || q.includes("unlock"))) ||
    q.includes("welcome bonus") ||
    q.includes("macro view credit") ||
    q.includes("micro view credit") ||
    q.includes("nano view credit") ||
    q.includes("how do i choose a path") ||
    q.includes("how to choose a path")
  ) {
    return {
      flowName: "User Flow",
      accountType: "User",
      assistantName: "Naavi Assistant",
    };
  }

  // 2. Super Admin Flow
  if (
    q.includes("super admin") ||
    q.includes("superadmin") ||
    q.includes("admin-dashboard") ||
    q.includes("admin-login")
  ) {
    return {
      flowName: "Super Admin Flow",
      accountType: "Super Admin",
      assistantName: "Super Admin Assistant",
    };
  }

  // 3. Admin Flow
  if (
    q.includes("admin flow") ||
    q.includes("admin portal") ||
    q.includes("administrator flow") ||
    (q.includes("admin") && !q.includes("partner admin") && !q.includes("approval") && (q.includes("flow") || q.includes("portal") || q.includes("login") || q.includes("dashboard")))
  ) {
    return {
      flowName: "Admin Flow",
      accountType: "Admin",
      assistantName: "Admin Assistant",
    };
  }

  // 4. General query asking about other/all available flows
  if (
    (q.includes("other") || q.includes("different") || q.includes("all")) &&
    (q.includes("flow") || q.includes("flows") || q.includes("portal") || q.includes("portals"))
  ) {
    return {
      isAllFlows: true,
      customReply:
        "Naaviverse features dedicated portals and flows for different roles:\n\n" +
        "• **User Flow**: To explore the User Flow and understand its features, please log in using your User account. Once logged in, you can access the dedicated Naavi Assistant chatbot for complete guidance and answers to your questions.\n" +
        "• **Admin Flow**: To explore the Admin Flow and understand its features, please log in using your Admin account. Once logged in, you can access the dedicated Admin Assistant chatbot for complete guidance and answers to your questions.\n" +
        "• **Super Admin Flow**: To explore the Super Admin Flow and understand its features, please log in using your Super Admin account. Once logged in, you can access the dedicated Super Admin Assistant chatbot for complete guidance and answers to your questions.",
    };
  }

  return null;
};

/**
 * Generates an accurate, context-aware, and question-specific fallback response.
 * Used when Groq models are offline or rate-limited.
 */
const getAccurateFallbackResponse = (message, pageContext = "", userName = "") => {
  const query = (message || "").toLowerCase().trim();
  const greeting = userName ? `Hello ${userName}! ` : `Hello! `;

  // 0. Other Flow Redirection (Partner Flow, Admin Flow, Super Admin Flow)
  const otherFlow = identifyOtherFlowForUser(message);
  if (otherFlow) {
    if (otherFlow.isAllFlows) {
      return otherFlow.customReply;
    }
    return `To explore the ${otherFlow.flowName} and understand its features, please log in using your ${otherFlow.accountType} account. Once logged in, you can access the dedicated ${otherFlow.assistantName} chatbot for complete guidance and answers to your questions.`;
  }

  // 1. Specific Query: Earning Credits / Step Completion Rewards
  if (
    query.includes("earn credit") ||
    query.includes("get credit") ||
    query.includes("reward") ||
    query.includes("free credit") ||
    (query.includes("credit") && (query.includes("complete") || query.includes("finish") || query.includes("after path") || query.includes("after step")))
  ) {
    return (
      greeting +
      "No, completing steps, milestones, or pathways on Naaviverse **does not award or give wallet credits**.\n\n" +
      "Step completion marks your personal educational progress along your roadmap. Wallet credits are only obtained in two ways:\n" +
      "• **50 Credit Welcome Bonus**: Granted automatically upon registration (valid for 14 days).\n" +
      "• **Credit Top-ups**: Purchased directly in your **Wallet** (`/dashboard/users/wallet`). Purchased credits never expire."
    );
  }

  // 2. Specific Query: View Costs / Pricing (Micro, Nano, Macro)
  if (
    (query.includes("cost") || query.includes("price") || query.includes("how much") || query.includes("spend")) &&
    (query.includes("micro") || query.includes("nano") || query.includes("macro") || query.includes("view") || query.includes("step"))
  ) {
    return (
      greeting +
      "Here are the exact credit costs to unlock milestone views on Naaviverse:\n\n" +
      "• **Macro View**: **Free (0 Credits)** — High-level milestone summary, objectives, and prerequisites.\n" +
      "• **Micro View**: **2 Credits** — In-depth curriculum, execution strategy, and syllabus details.\n" +
      "• **Nano View**: **4 Credits** — Day-by-day checklist, tool recommendations, and curated resources.\n\n" +
      "If you have an active Micro or Nano subscription, those views are included with unlimited access without spending individual credits."
    );
  }

  // 3. Specific Query: Welcome Bonus & Expiry Rules
  if (
    query.includes("welcome bonus") ||
    query.includes("expiry") ||
    query.includes("expire") ||
    query.includes("14 day") ||
    query.includes("validity")
  ) {
    return (
      greeting +
      "Here is how credit expiry and the welcome bonus work on Naaviverse:\n\n" +
      "• **50 Welcome Bonus Credits**: Credited to your wallet upon registration. These credits are valid for **14 days** from signup. Any unused portion of the 50 bonus credits expires after 14 days.\n" +
      "• **Purchased Credits**: Any credit packs purchased through your **Wallet** **never expire**.\n" +
      "• **Consumption Priority**: Expiring bonus credits are always consumed first before purchased credits (FIFO)."
    );
  }

  // 4. Specific Query: General Wallet & Credits Overview
  if (query.includes("wallet") || query.includes("credit")) {
    return (
      greeting +
      "Here is a summary of how credits and your wallet work on Naaviverse:\n\n" +
      "• **Available Credits**: View your active balance and 14-day expiry indicator in **Wallet** (`/dashboard/users/wallet`) or on your **Home** dashboard via **\"View Wallet\"**.\n" +
      "• **View Costs**: Macro View is Free (0 credits), Micro View is 2 credits/step, and Nano View is 4 credits/step.\n" +
      "• **Purchases**: You can top up non-expiring credit packs anytime in your **Wallet**.\n" +
      "• **Transaction History**: Check a detailed audit of every credit addition, expiry, and view unlock under **Transactions** (`/dashboard/users/transactions`)."
    );
  }

  // 5. Specific Query: How to Choose / Explore / Select a Pathway
  if (
    query.includes("choose") ||
    query.includes("select") ||
    query.includes("explore path") ||
    query.includes("career path") ||
    query.includes("pathway") ||
    (query.includes("path") && (query.includes("how") || query.includes("find")))
  ) {
    return (
      greeting +
      "Here is how to explore and select a pathway on Naaviverse:\n\n" +
      "1. Click **Paths** in the left sidebar or the **Explore Paths** card on your **Home** dashboard (`/dashboard/users/paths`).\n" +
      "2. Browse curated academic and career pathways organized by country destination, university degree, or profession.\n" +
      "3. Click any pathway card to inspect its total duration, prerequisites, and milestone roadmap.\n" +
      "4. Click **\"Select Path\"** or **\"Select This Path\"**, then confirm in the popup by clicking **\"Yes, Select This Path\"**.\n" +
      "5. The pathway is saved to your profile, and its first milestone is immediately activated in **Current Step** (`/dashboard/users/current-step`)."
    );
  }

  // 6. Specific Query: Current Step & Milestone Completion
  if (
    query.includes("current step") ||
    query.includes("complete step") ||
    query.includes("mark complete") ||
    query.includes("how to complete") ||
    query.includes("next step")
  ) {
    return (
      greeting +
      "Here is how **Current Step** and milestone progression work:\n\n" +
      "• **Active Milestone Workspace**: Go to **Current Step** in the left sidebar (`/dashboard/users/current-step`) to view your active step's objectives and recommended study materials.\n" +
      "• **View Depth**: Switch between **Macro View** (Free), **Micro View** (2 credits), and **Nano View** (4 credits).\n" +
      "• **How to Complete**: In the bottom bar, click **\"Did You Complete This Step?\"** → **\"Yes, Completed\"**, then confirm **\"Yes, go to next step\"** in the modal.\n" +
      "• **What Happens Next**: The milestone is marked completed with a green checkmark in **My Journey**, and the next sequential milestone automatically unlocks."
    );
  }

  // 7. Specific Query: My Journey / Progress Tracking
  if (
    query.includes("my journey") ||
    query.includes("my path") ||
    query.includes("track progress") ||
    query.includes("timeline")
  ) {
    return (
      greeting +
      "You can track your pathway progress anytime in **My Journey** (`/dashboard/users/my-journey`):\n\n" +
      "• **Visual Timeline**: View the full sequence of milestones from where you started to your final career goal.\n" +
      "• **Completed Milestones**: Marked with green checkmarks indicating completed steps.\n" +
      "• **Active Milestone**: Highlighted with a glowing beacon and a direct shortcut button to **Current Step**."
    );
  }

  // 8. Specific Query: Page Guide / Current Page Context
  if (
    query.includes("page guide") ||
    query.includes("current page") ||
    query.includes("what can i do here") ||
    query.includes("where am i")
  ) {
    if (pageContext.includes("home")) {
      return (
        greeting +
        "You are on your **Home Dashboard** (`/dashboard/users/home`). Quick actions available here:\n\n" +
        "• Check your starting point and destination target route tags.\n" +
        "• View your credit balance and 14-day welcome bonus timer in the **Available Credits** widget (click **\"View Wallet\"** to manage).\n" +
        "• Click **Explore Paths** to browse study routes, or view your enrolled path preview."
      );
    }
    if (pageContext.includes("paths")) {
      return (
        greeting +
        "You are on the **Explore Paths** page (`/dashboard/users/paths`).\n\n" +
        "• Search and filter pathways by destination country, academic degree, or profession.\n" +
        "• Click any card to preview its milestones, and click **\"Select This Path\"** to enroll."
      );
    }
    if (pageContext.includes("current-step")) {
      return (
        greeting +
        "You are on the **Current Step** page (`/dashboard/users/current-step`).\n\n" +
        "• Review your active milestone's objective and resources.\n" +
        "• Toggle Macro (Free), Micro (2 credits), or Nano (4 credits) views.\n" +
        "• Mark the step completed via **\"Did You Complete This Step?\"** → **\"Yes, Completed\"**."
      );
    }
    if (pageContext.includes("my-journey")) {
      return (
        greeting +
        "You are on **My Journey** (`/dashboard/users/my-journey`).\n\n" +
        "• View your full visual pathway timeline with completed milestones in green.\n" +
        "• Click on your active glowing milestone to jump directly into **Current Step**."
      );
    }
    if (pageContext.includes("wallet")) {
      return (
        greeting +
        "You are in your **Wallet** (`/dashboard/users/wallet`).\n\n" +
        "• Check your balance and remaining welcome bonus days.\n" +
        "• Purchase non-expiring credit packs or explore subscription options."
      );
    }
  }

  // 9. Full End-to-End User Flow (when explicitly requested)
  if (
    query.includes("how does naaviverse work") ||
    query.includes("end to end") ||
    query.includes("user journey") ||
    query.includes("user flow") ||
    query.includes("overview") ||
    query.includes("from start to finish")
  ) {
    return (
      greeting +
      "Here is the complete end-to-end user journey on Naaviverse:\n\n" +
      "1. **Registration & Welcome Bonus**: Sign up at `/register` to receive 50 Welcome Bonus credits valid for 14 days.\n" +
      "2. **Home Dashboard** (`/dashboard/users/home`): Check your credit balance, route tags, and feature cards.\n" +
      "3. **Explore Pathways** (`/dashboard/users/paths`): Browse curated academic and career roadmaps.\n" +
      "4. **Select a Path**: Click **\"Select Path\"** → **\"Yes, Select This Path\"** to activate your journey.\n" +
      "5. **Step Views**: Deep-dive into milestones with Macro (Free), Micro (2 credits), and Nano (4 credits) views.\n" +
      "6. **Track Progress** (`/dashboard/users/my-journey`): Monitor completed steps on your visual timeline.\n" +
      "7. **Current Step** (`/dashboard/users/current-step`): Work on your active milestone and complete it via **\"Did You Complete This Step?\"** → **\"Yes, Completed\"** (advances roadmap; zero credits awarded).\n" +
      "8. **Wallet** (`/dashboard/users/wallet`): Manage bonus and purchased credits (purchased credits never expire)."
    );
  }

  // 10. Default Conversational Fallback
  return (
    greeting +
    "I am here to guide you through Naaviverse! How can I assist you with your pathways, current step, or wallet credits today?"
  );
};

/**
 * Generates an accurate, context-aware, and question-specific partner fallback response.
 * Used when Groq models are offline or rate-limited for partner requests.
 */
const getAccuratePartnerFallbackResponse = (message, pageContext = "", userName = "") => {
  const query = (message || "").toLowerCase().trim();
  const greeting = userName ? `Hello ${userName}! ` : `Hello! `;

  // 0. Other Flow Redirection (User Flow, Admin Flow, Super Admin Flow)
  const otherFlow = identifyOtherFlowForPartner(message);
  if (otherFlow) {
    if (otherFlow.isAllFlows) {
      return otherFlow.customReply;
    }
    return `To explore the ${otherFlow.flowName} and understand its features, please log in using your ${otherFlow.accountType} account. Once logged in, you can access the dedicated ${otherFlow.assistantName} chatbot for complete guidance and answers to your questions.`;
  }

  // 1. My Paths / Create Path / Managing Pathways
  if (
    query.includes("create path") ||
    query.includes("new path") ||
    query.includes("my path") ||
    query.includes("pathway") ||
    (query.includes("path") && (query.includes("how") || query.includes("make") || query.includes("add") || query.includes("manage")))
  ) {
    return (
      greeting +
      "Here is how to create and manage pathways in **My Paths**:\n\n" +
      "1. Navigate to **My Paths** from the left sidebar (`/dashboard/accountants/paths`).\n" +
      "2. Click the **\"Create Path\"** button to open the Path Creation wizard.\n" +
      "3. Enter the Path Title, Category, Overview Description, Prerequisites, Target Roles, Duration, and Banner Image.\n" +
      "4. Click **\"Save & Continue\"** to publish or save your draft pathway.\n" +
      "5. Once your path is created, open **My Steps** to build and attach learning milestones to it."
    );
  }

  // 2. My Steps / Step Creation / 3-Layer Structure (Macro, Micro, Nano)
  if (
    query.includes("create step") ||
    query.includes("new step") ||
    query.includes("my step") ||
    query.includes("layer") ||
    query.includes("macro") ||
    query.includes("micro") ||
    query.includes("nano") ||
    (query.includes("step") && (query.includes("how") || query.includes("make") || query.includes("add") || query.includes("author")))
  ) {
    return (
      greeting +
      "Here is how milestone authoring and the 3-Layer Step Architecture work in **My Steps**:\n\n" +
      "• **Macro View**: High-level learning objective, milestone summary, prerequisites, and milestone timeline.\n" +
      "• **Micro View**: In-depth curriculum, lesson plans, syllabus topics, and execution strategy.\n" +
      "• **Nano View**: Day-by-day practical checklist, curated tools, study resources, and task checklists.\n\n" +
      "To add steps, go to **My Steps** (`/dashboard/accountants/steps`), click **\"Create Step\"**, select your pathway, and configure content for each layer. You can also attach marketplace offerings directly to any layer."
    );
  }

  // 3. CRM / Student Pipeline / Enrolled Clients
  if (
    query.includes("crm") ||
    query.includes("client") ||
    query.includes("student") ||
    query.includes("enroll") ||
    query.includes("not started") ||
    query.includes("in progress") ||
    query.includes("completed")
  ) {
    return (
      greeting +
      "Here is how to manage your enrolled students and clients in **CRM** (`/dashboard/accountants/crm`):\n\n" +
      "• **Kanban Pipeline**: Clients are organized into three clear stages:\n" +
      "  - **Not Started**: Enrolled students who haven't completed their first milestone yet.\n" +
      "  - **In Progress**: Students actively working through pathway milestones.\n" +
      "  - **Completed**: Students who have finished all milestones in your pathway.\n" +
      "• **Client Cards**: View student name, email, avatar, enrolled pathway, progress bar, and payment status (Paid, Pending, Failed).\n" +
      "• **Client Details**: Click any card to open the **Client Detail Modal** to inspect their complete milestone timeline and purchase history."
    );
  }

  // 4. Marketplace / Services / Offerings
  if (
    query.includes("marketplace") ||
    query.includes("create service") ||
    query.includes("service") ||
    query.includes("offering") ||
    query.includes("mentor") ||
    query.includes("vendor") ||
    query.includes("distributor") ||
    query.includes("institution")
  ) {
    return (
      greeting +
      "Here is how the **Marketplace** works for partners (`/dashboard/accountants/marketplace`):\n\n" +
      "• **Partner Categories**:\n" +
      "  - **Institutions**: Academic degrees, university programs, diplomas, and official certificates.\n" +
      "  - **Mentors**: 1-on-1 mentorship sessions, career counseling, resume reviews, and mock interviews.\n" +
      "  - **Vendors**: Learning materials, specialized tools, educational kits, books, hardware, and lab access.\n" +
      "  - **Distributors**: Multi-license program distribution, training bundles, and content syndication.\n" +
      "• **Create Service**: Click **\"Create Service\"** to list a new offering: define Title, Provider Type, Pricing/Access (Free or Paid in ₹), Goal, Outcomes, Duration, and Billing Cycle."
    );
  }

  // 5. Earnings, Revenue & Financial Settlements
  if (
    query.includes("earning") ||
    query.includes("revenue") ||
    query.includes("commission") ||
    query.includes("payout") ||
    query.includes("payment") ||
    query.includes("settlement") ||
    query.includes("money")
  ) {
    return (
      greeting +
      "Here is how revenue and payments work for partners on Naaviverse:\n\n" +
      "• **Sales & Revenue Tracking**: Verified client payments and marketplace purchases are recorded directly under your account and summarized on your **Home** dashboard (`/dashboard/accountants/home`).\n" +
      "• **Commission & Settlement**: Financial terms, commission splits, and payment settlements follow your official Naaviverse partner agreement and are administered directly with the Naaviverse finance team.\n" +
      "• **No Credit Usage**: Partners do not spend or consume wallet credits; credits are exclusively a student consumer mechanism."
    );
  }

  // 6. Onboarding, Approval & Account Types (Internal vs External)
  if (
    query.includes("approval") ||
    query.includes("pending") ||
    query.includes("internal partner") ||
    query.includes("external partner") ||
    query.includes("register") ||
    query.includes("onboarding") ||
    query.includes("password")
  ) {
    return (
      greeting +
      "Here is how partner onboarding and account types work on Naaviverse:\n\n" +
      "• **External Partners**: Register via the Partner portal. Submit business details. Your account enters **Pending Approval** until reviewed and approved by the Naaviverse admin team.\n" +
      "• **Internal Partners**: Created and pre-authorized directly by the Super Admin (`/admin/dashboard/internal-partners`). You do not need to self-register. You receive initial credentials and must set a permanent password upon first login (at least 10 characters with an uppercase letter, number, and special character).\n" +
      "• **Incomplete Profile**: If required business details or logo are missing, you are guided to **Profile** (`/dashboard/accountants/profile`) to complete setup."
    );
  }

  // 7. Feedback & Reviews
  if (query.includes("feedback") || query.includes("review") || query.includes("rating")) {
    return (
      greeting +
      "You can inspect client feedback anytime in **Feedback** (`/dashboard/accountants/feedback`):\n\n" +
      "• View star ratings, student reviews, and qualitative feedback submitted by learners enrolled in your pathways or services.\n" +
      "• Use these insights to refine your curriculum, lesson materials, and mentorship sessions."
    );
  }

  // 8. Profile & Business Settings
  if (query.includes("profile") || query.includes("account") || query.includes("business details") || query.includes("kyc")) {
    return (
      greeting +
      "You can manage your partner profile under **Profile** (`/dashboard/accountants/profile`):\n\n" +
      "• Update your Business Name, Contact Name, Email, and Phone number.\n" +
      "• Configure your Business Category, Bio/About Us, Website, and Social Links (LinkedIn, etc.).\n" +
      "• Upload and update your official Business Logo and Banner image."
    );
  }

  // 9. Page Guide / Current Page Context
  if (
    query.includes("page guide") ||
    query.includes("current page") ||
    query.includes("what can i do here") ||
    query.includes("where am i")
  ) {
    if (pageContext.includes("home")) {
      return (
        greeting +
        "You are on your **Partner Home Dashboard** (`/dashboard/accountants/home`). Quick actions available here:\n\n" +
        "• View key metrics: Total enrolled students, this week's enrollments, and enrollment growth rate.\n" +
        "• Inspect active pathway cards showing student count, milestone completion %, and micro-lessons.\n" +
        "• Check real-time alerts in the notification bell and view the day-of-week student retention chart."
      );
    }
    if (pageContext.includes("crm")) {
      return (
        greeting +
        "You are on the **Partner CRM** page (`/dashboard/accountants/crm`).\n\n" +
        "• Track enrolled students across **Not Started**, **In Progress**, and **Completed** stages.\n" +
        "• Click any client card to open the **Client Detail Modal** to review milestone completion dates and purchase history."
      );
    }
    if (pageContext.includes("paths")) {
      return (
        greeting +
        "You are on **My Paths** (`/dashboard/accountants/paths`).\n\n" +
        "• Browse and search all educational pathways created by your organization.\n" +
        "• Click **\"Create Path\"** to author a new pathway roadmap."
      );
    }
    if (pageContext.includes("steps")) {
      return (
        greeting +
        "You are on **My Steps** (`/dashboard/accountants/steps`).\n\n" +
        "• Manage milestone content across Macro, Micro, and Nano views.\n" +
        "• Click **\"Create Step\"** to author and link new learning milestones."
      );
    }
    if (pageContext.includes("marketplace")) {
      return (
        greeting +
        "You are in the **Marketplace** (`/dashboard/accountants/marketplace`).\n\n" +
        "• Filter listings across Institutions, Mentors, Vendors, and Distributors.\n" +
        "• Click **\"Create Service\"** to publish a new course, mentorship program, or tool offering."
      );
    }
    if (pageContext.includes("feedback")) {
      return (
        greeting +
        "You are in **Feedback** (`/dashboard/accountants/feedback`).\n\n" +
        "• Review ratings and feedback comments submitted by enrolled students."
      );
    }
    if (pageContext.includes("profile")) {
      return (
        greeting +
        "You are on your **Partner Profile** (`/dashboard/accountants/profile`).\n\n" +
        "• Update your company name, category, bio, contact information, and branding assets."
      );
    }
  }

  // 10. Full Partner Portal Overview
  if (
    query.includes("how does partner") ||
    query.includes("partner flow") ||
    query.includes("overview") ||
    query.includes("end to end") ||
    query.includes("from start to finish")
  ) {
    return (
      greeting +
      "Here is the complete overview of the Partner Flow on Naaviverse:\n\n" +
      "1. **Onboarding & Approval**: External partners register and await admin approval; Internal partners are created directly by the Super Admin and set a permanent password upon first login.\n" +
      "2. **Partner Home** (`/dashboard/accountants/home`): Monitor total student enrollments, retention charts, and real-time activity feeds.\n" +
      "3. **Author Pathways** (`/dashboard/accountants/paths`): Build structured educational and career roadmaps in **My Paths**.\n" +
      "4. **Build Milestones** (`/dashboard/accountants/steps`): Author 3-layer milestone content (Macro, Micro, Nano) in **My Steps**.\n" +
      "5. **Publish Services** (`/dashboard/accountants/marketplace`): List academic programs, mentorship, or tools in the **Marketplace**.\n" +
      "6. **Manage Students** (`/dashboard/accountants/crm`): Track enrolled learners across Not Started, In Progress, and Completed stages in **CRM**.\n" +
      "7. **Review Feedback** (`/dashboard/accountants/feedback`): Inspect student reviews and star ratings to continually enhance your offerings."
    );
  }

  // 11. Default Partner Conversational Fallback
  return (
    greeting +
    "I am here to assist you with the Naaviverse Partner Portal! You can ask me about creating pathways in **My Paths**, authoring milestone layers in **My Steps**, tracking students in **CRM**, or listing offerings in the **Marketplace**."
  );
};

/**
 * Handle incoming chat messages
 * POST /api/chatbot/chat
 */
const chat = async (req, res) => {
  try {
    const {
      message,
      history = [],
      conversationHistory = [],
      pageContext = "",
      userRole = "user",
      userName = "",
    } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string.",
      });
    }

    const rawHistory =
      Array.isArray(history) && history.length > 0
        ? history
        : Array.isArray(conversationHistory)
        ? conversationHistory
        : [];

    const isPartner = userRole === "partner";
    const selectedSystemPrompt = isPartner ? NAAVI_PARTNER_SYSTEM_PROMPT : NAAVI_SYSTEM_PROMPT;
    const selectedFallback = isPartner ? getAccuratePartnerFallbackResponse : getAccurateFallbackResponse;

    // In User Flow: dynamically detect questions about other flows (Partner Flow, Admin Flow, Super Admin Flow)
    // and guide the user to log in with the corresponding account to access that flow's dedicated chatbot.
    // The User Flow chatbot MUST NEVER explain other flows.
    if (!isPartner) {
      const otherFlow = identifyOtherFlowForUser(message);
      if (otherFlow) {
        const redirectReply = otherFlow.isAllFlows
          ? otherFlow.customReply
          : `To explore the ${otherFlow.flowName} and understand its features, please log in using your ${otherFlow.accountType} account. Once logged in, you can access the dedicated ${otherFlow.assistantName} chatbot for complete guidance and answers to your questions.`;
        return res.status(200).json({
          success: true,
          reply: redirectReply,
          flowRedirect: otherFlow.flowName || "Other Flows",
          source: "flow_guide_dispatcher",
        });
      }
    }

    // In Partner Flow: dynamically detect questions about other flows (User Flow, Admin Flow, Super Admin Flow)
    // and guide the partner to log in with the corresponding account to access that flow's dedicated chatbot.
    // The Partner Flow chatbot MUST NEVER explain User Flow or other flows.
    if (isPartner) {
      const otherFlow = identifyOtherFlowForPartner(message);
      if (otherFlow) {
        const redirectReply = otherFlow.isAllFlows
          ? otherFlow.customReply
          : `To explore the ${otherFlow.flowName} and understand its features, please log in using your ${otherFlow.accountType} account. Once logged in, you can access the dedicated ${otherFlow.assistantName} chatbot for complete guidance and answers to your questions.`;
        return res.status(200).json({
          success: true,
          reply: redirectReply,
          flowRedirect: otherFlow.flowName || "Other Flows",
          source: "flow_guide_dispatcher",
        });
      }
    }

    const groq = getGroqClient(userRole);

    // If Groq is not configured, return accurate application logic fallback directly
    if (!groq) {
      const fallbackReply = selectedFallback(message, pageContext, userName);
      return res.status(200).json({
        success: true,
        reply: fallbackReply,
        source: "local_verified_engine",
      });
    }

    // Build context-aware system instruction with strict query-specificity mandate
    let contextualSystemPrompt = selectedSystemPrompt;
    if (userName) {
      contextualSystemPrompt += `\n\nCURRENT USER/PARTNER INFO: The user's name is "${userName}". Address them warmly by name when appropriate.`;
    }
    if (pageContext) {
      contextualSystemPrompt += `\n\nCURRENT PAGE CONTEXT: The user is currently viewing the page: "${pageContext}". If their question relates to their current screen, incorporate this context.`;
    }

    // Strict query-specific prompt directive to avoid repetitive boilerplate and ensure completion
    if (isPartner) {
      contextualSystemPrompt += `\n\nSTRICT PARTNER QUERY MANDATE:
The partner specifically asks: "${message.trim()}".
- Answer ONLY what this specific question asks regarding the Naaviverse Partner Portal and Partner Flow.
- If asked "explain about partner flow" or about the Partner Flow in general, provide a comprehensive, clear, structured explanation of the Partner Flow:
  1. Onboarding & Approval (External partner registration vs Super Admin Internal partners).
  2. Partner Home Dashboard (/dashboard/accountants/home): metrics, active paths, and student retention.
  3. My Paths (/dashboard/accountants/paths): creating and managing career pathways.
  4. My Steps (/dashboard/accountants/steps): 3-layer architecture (Macro, Micro, Nano view authoring).
  5. Marketplace (/dashboard/accountants/marketplace): service publishing for Institutions, Mentors, Vendors, Distributors.
  6. CRM (/dashboard/accountants/crm): student Kanban board (Not Started, In Progress, Completed).
  7. Feedback & Profile (/dashboard/accountants/feedback, /dashboard/accountants/profile).
- Do NOT provide User Flow instructions (do not mention user wallet credits, user onboarding, or user step completion).
- If the partner asks about User Flow or student credit purchases, politely explain: "As the Partner Assistant, my guidance focuses exclusively on the Partner Portal. To explore student pathway navigation and credits, please sign in with a User account to chat with the dedicated Naavi Assistant."
- Be concise, professional, direct, and complete. Ensure every sentence ends cleanly with proper punctuation.`;
    } else {
      contextualSystemPrompt += `\n\nSTRICT USER QUERY MANDATE:
The user specifically asks: "${message.trim()}".
- Answer ONLY what this specific question asks regarding the Naaviverse User Flow (Home, Paths, My Journey, Current Step, Wallet, Transactions, Purchases).
- You MUST NOT explain about any flows in Naaviverse except User Flow. If this question asks about Partner Flow, Admin Flow, or Super Admin Flow, return strictly: "To explore the [Flow Name] and understand its features, please log in using your [Flow Name] account. Once logged in, you can access the dedicated [Flow Name] Assistant chatbot for complete guidance and answers to your questions."
- Never claim that other platform flows do not exist.
- Do NOT output repetitive generic overviews, unasked credit guides, or unrelated feature lists.
- Be concise, direct, and complete. Ensure every sentence ends cleanly with proper punctuation.`;
    }

    // Sanitize conversation history (keep last 6 messages for context efficiency)
    const validHistory = rawHistory
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 1000),
      }));

    const messages = [
      { role: "system", content: contextualSystemPrompt },
      ...validHistory,
      { role: "user", content: message.trim().slice(0, 1000) },
    ];

    let reply = null;
    let usedModel = null;
    let lastError = null;

    // Multi-model auto-failover across supported Groq models
    for (const modelName of CHATBOT_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages,
          temperature: 0.35, // Focused, precise, non-rambling
          max_tokens: 1024,   // Ample headroom to prevent mid-sentence cutoff
          top_p: 0.9,
        });

        const choice = completion.choices?.[0]?.message?.content;
        if (choice && choice.trim()) {
          reply = choice.trim();
          usedModel = modelName;
          break;
        }
      } catch (err) {
        lastError = err;
        // Proceed silently to next model in list
      }
    }

    // If all models failed or network is unreachable, serve accurate verified fallback
    if (!reply) {
      reply = selectedFallback(message, pageContext, userName);
      usedModel = "verified_fallback_engine";
    }

    return res.status(200).json({
      success: true,
      reply,
      model: usedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Chatbot Controller Error]:", error);
    const isPartner = req.body?.userRole === "partner";
    const safeFallback = isPartner
      ? getAccuratePartnerFallbackResponse(
          req.body?.message || "",
          req.body?.pageContext || "",
          req.body?.userName || ""
        )
      : getAccurateFallbackResponse(
          req.body?.message || "",
          req.body?.pageContext || "",
          req.body?.userName || ""
        );
    return res.status(200).json({
      success: true,
      reply: safeFallback,
      source: "error_safe_fallback",
    });
  }
};

/**
 * Health check endpoint
 * GET /api/chatbot/health
 */
const health = async (req, res) => {
  const hasUserKey = Boolean(process.env.GROQ_USER_FLOW_BOT_KEY || process.env.GROQ_API_KEY);
  const hasPartnerKey = Boolean(process.env.GROQ_PARTNER_FLOW_BOT_KEY);
  return res.status(200).json({
    status: "ok",
    hasUserKey,
    hasPartnerKey,
    userKeyConfigured: hasUserKey,
    partnerKeyConfigured: hasPartnerKey,
    service: "Naaviverse AI Chatbot",
  });
};

module.exports = {
  chat,
  health,
};
