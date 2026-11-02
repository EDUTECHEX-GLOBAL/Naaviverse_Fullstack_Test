const pathModel       = require("../models/PathModel");
const marketplaceModel = require("../models/MarketplaceModel");
const Approval        = require("../models/ApprovalModel");
const Purchase        = require("../models/PurchaseModel");
const MarketplaceAssistance = require("../models/MarketplaceAssistanceModel");
const Activity        = require("../models/ActivityModel");

function formatTimeAgo(date) {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  if (isNaN(diff) || diff < 0) return "Recently";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return "1 hr ago";
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/**
 * GET /api/dashboard/stats
 *
 * Replaces 6 separate API calls from the frontend with one
 * optimised aggregation query per collection.
 *
 * Response shape:
 * {
 *   paths:       { total, active, inactive, pending },
 *   marketplace: { total, institution, mentor, distributor, vendor },
 *   approvals:   { total, approved, pending, rejected }
 * }
 */
const getDashboardStats = async (req, res) => {
  try {

    // ── 1. PATHS ─────────────────────────────────────────────────────────────
    // Count active / inactive / waitingforapproval in one aggregation
    const pathAgg = await pathModel.aggregate([
      {
        $match: {
          status: { $in: ["active", "inactive", "waitingforapproval"] },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const pathMap = { active: 0, inactive: 0, waitingforapproval: 0 };
    pathAgg.forEach(({ _id, count }) => {
      if (_id in pathMap) pathMap[_id] = count;
    });

    const paths = {
      total:    pathMap.active + pathMap.inactive + pathMap.waitingforapproval,
      active:   pathMap.active,
      inactive: pathMap.inactive,
      pending:  pathMap.waitingforapproval,   // UI calls it "pending"
    };

    // ── 2. MARKETPLACE ────────────────────────────────────────────────────────
    // Group by role (case-insensitive) for active items only
    const marketAgg = await marketplaceModel.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: { $toLower: "$role" },   // normalise case
          count: { $sum: 1 },
        },
      },
    ]);

    const marketMap = { institution: 0, mentor: 0, distributor: 0, vendor: 0 };
    let marketTotal = 0;
    marketAgg.forEach(({ _id, count }) => {
      marketTotal += count;
      if (_id in marketMap) marketMap[_id] = count;
    });

    const marketplace = {
      total:       marketTotal,
      institution: marketMap.institution,
      mentor:      marketMap.mentor,
      distributor: marketMap.distributor,
      vendor:      marketMap.vendor,
    };

    // ── 3. APPROVALS ──────────────────────────────────────────────────────────
    // Single aggregation across both Partner + User roles
    const approvalAgg = await Approval.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const approvalMap = { pending: 0, approved: 0, rejected: 0 };
    let approvalTotal = 0;
    approvalAgg.forEach(({ _id, count }) => {
      approvalTotal += count;
      if (_id in approvalMap) approvalMap[_id] = count;
    });

    const approvals = {
      total:    approvalTotal,
      approved: approvalMap.approved,
      pending:  approvalMap.pending,
      rejected: approvalMap.rejected,
    };

    // ── RESPONSE ──────────────────────────────────────────────────────────────
    return res.json({
      status: true,
      data: { paths, marketplace, approvals },
    });

  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({
      status: false,
      message: "Error fetching dashboard stats",
    });
  }
};

/**
 * GET /api/dashboard/notifications
 * GET /api/admin/notifications
 *
 * Real, live notification feed aggregated from:
 * - Paths (created, pending review, published)
 * - Purchases (new customer marketplace orders)
 * - Approvals (partner registrations awaiting review or newly approved)
 * - Assistance requests (student marketplace escalations)
 * - Activity stream (recent user and partner events)
 */
const getAdminNotifications = async (req, res) => {
  try {
    const [paths, purchases, approvals, assistanceRequests, activities] = await Promise.all([
      pathModel.find().sort({ createdAt: -1 }).limit(15).lean().catch(() => []),
      Purchase.find().sort({ createdAt: -1 }).limit(15).lean().catch(() => []),
      Approval.find().sort({ createdAt: -1 }).limit(15).lean().catch(() => []),
      MarketplaceAssistance.find().sort({ createdAt: -1 }).limit(15).lean().catch(() => []),
      Activity.find({ "events.0": { $exists: true } }).sort({ lastEventAt: -1 }).limit(15).lean().catch(() => []),
    ]);

    const notifs = [];

    // 1. Paths
    (paths || []).forEach((p) => {
      let type = "path";
      let title = "New Path Created";
      if (p.status === "waitingforapproval") {
        type = "approval";
        title = "Path Approval Pending";
      } else if (p.status === "changesrequested") {
        title = "Path Changes Requested";
      } else if (p.status === "active") {
        title = "Path Published Live";
      }

      const creator = p.partner_email || p.user_email || "Admin";
      const desc = p.status === "waitingforapproval"
        ? `"${p.nameOfPath || "Pathway"}" submitted for review by ${creator}`
        : `${creator} created "${p.nameOfPath || "Pathway"}"`;

      notifs.push({
        id: `path-${p._id}`,
        type,
        title,
        desc,
        time: formatTimeAgo(p.createdAt),
        rawDate: p.createdAt || new Date(),
        targetTab: "paths",
        targetId: p._id,
      });
    });

    // 2. Purchases
    (purchases || []).forEach((pur) => {
      const buyer = pur.clientName || pur.clientEmail || "Student";
      const item = pur.productName || "Service";
      const amt = Number(pur.amount || 0);
      const amtStr = amt > 0 ? ` (₹${amt.toLocaleString("en-IN")})` : "";

      notifs.push({
        id: `pur-${pur._id}`,
        type: "purchase",
        title: "New Purchase",
        desc: `${buyer} purchased "${item}"${amtStr}`,
        time: formatTimeAgo(pur.createdAt || pur.date),
        rawDate: pur.createdAt || pur.date || new Date(),
        targetTab: "crm",
        targetId: pur._id,
      });
    });

    // 3. Approvals
    (approvals || []).forEach((app) => {
      const name = app.businessName || `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email || "Partner";
      const isApproved = app.status === "approved";
      notifs.push({
        id: `app-${app._id}`,
        type: "approval",
        title: isApproved ? "Partner Approved" : "Approval Pending",
        desc: isApproved ? `${name} was approved and onboarded` : `${name} submitted application for review`,
        time: formatTimeAgo(app.createdAt),
        rawDate: app.createdAt || new Date(),
        targetTab: "approvals",
        targetId: app._id,
      });
    });

    // 4. Assistance Requests
    (assistanceRequests || []).forEach((ast) => {
      const user = ast.userName || ast.userEmail || "Student";
      const milestone = ast.stepName || ast.pathName || "Marketplace Service";
      notifs.push({
        id: `ast-${ast.ticketId || ast._id}`,
        type: "system",
        title: "Marketplace Assistance",
        desc: `${user} requested recommendations for "${milestone}"`,
        time: formatTimeAgo(ast.createdAt),
        rawDate: ast.createdAt || new Date(),
        targetTab: "marketplace",
        targetId: ast.ticketId || ast._id,
      });
    });

    // 5. Live Activity Events
    (activities || []).forEach((act) => {
      const latest = act.events?.[act.events.length - 1];
      if (latest) {
        let type = "system";
        if (latest.type === "market" || latest.type === "purchase") type = "purchase";
        else if (latest.type === "path" || latest.type === "step") type = "path";

        const isPartner = act.role === "partner" || (latest.title && /partner/i.test(latest.title));
        const actor = act.actorName || act.actorEmail || (isPartner ? "Partner" : "User");

        let targetTab = "activity";
        if (type === "path") targetTab = "paths";
        else if (type === "purchase") targetTab = "marketplace";
        else if (isPartner) targetTab = "partnerActivity";
        else targetTab = "activity";

        notifs.push({
          id: `act-${act._id}-${latest._id || Date.now()}`,
          type,
          role: act.role || (isPartner ? "partner" : "user"),
          actorEmail: act.actorEmail || "",
          targetId: act.actorId || act._id,
          title: latest.title || (isPartner ? "Partner Activity" : latest.type === "market" ? "Marketplace Activity" : "Live User Activity"),
          desc: `${actor}: ${latest.desc || latest.title || "Active on platform"}`,
          time: formatTimeAgo(latest.createdAt || act.lastEventAt),
          rawDate: latest.createdAt || act.lastEventAt || new Date(),
          targetTab,
        });
      }
    });

    // Sort newest first
    notifs.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

    // Limit to top 50 notifications
    const limited = notifs.slice(0, 50);

    return res.json({
      status: true,
      notifications: limited,
      total: limited.length,
    });
  } catch (err) {
    console.error("getAdminNotifications error:", err);
    return res.status(500).json({ status: false, message: "Error fetching notifications", error: err.message });
  }
};

module.exports = { getDashboardStats, getAdminNotifications };

