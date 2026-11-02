const Approval = require("../models/ApprovalModel");
const { sendNotificationMail } = require("../middlewares/verifySignUp");
const { getApprovalEmailContent } = require("../utils/otpEmailTemplate");
const User = require("../models/UsersModel");
const Partner = require("../models/PartnerModel");
const { validatePersonName } = require("../utils/emailValidator");

exports.createApproval = async (req, res) => {
  try {
    const { role, email, businessName, type, website,
            firstName, lastName, position, country } = req.body;

    if (!email || !role) {
      return res.status(400).json({ status: false, message: "email and role are required" });
    }

    if (firstName) {
      const fNameVal = validatePersonName(firstName, "First name");
      if (!fNameVal.isValid) {
        return res.status(400).json({ status: false, message: fNameVal.message });
      }
    }

    if (lastName) {
      const lNameVal = validatePersonName(lastName, "Last name");
      if (!lNameVal.isValid) {
        return res.status(400).json({ status: false, message: lNameVal.message });
      }
    }

    const normalisedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const existing = await Approval.findOne({ email, role: normalisedRole });
    if (existing) {
      return res.json({ status: true, data: existing, message: "Approval record already exists" });
    }

    const date = new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

    const approval = await Approval.create({
      role: normalisedRole, email, businessName, type,
      website, firstName, lastName, position, country,
      status: "pending", date,
    });

    res.json({ status: true, data: approval });
  } catch (err) {
    console.error("createApproval error:", err);
    res.status(500).json({ status: false, message: "Error creating approval record" });
  }
};

// [OK] GET approvals — filtered by role if provided
// Enriches Partner approvals with partnerScope: "internal" | "external"
exports.getApprovals = async (req, res) => {
  try {
    const { role } = req.query;

    const query = role
      ? { role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() }
      : {};

    const approvals = await Approval.find(query).sort({ createdAt: -1 });

    // Enrich Partner approvals with partnerScope
    const normRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : null;
    if (normRole === "Partner" || !role) {
      const partnerEmails = approvals
        .filter((a) => a.role === "Partner" && a.email)
        .map((a) => a.email.toLowerCase().trim());

      const partners = partnerEmails.length
        ? await Partner.find({ email: { $in: partnerEmails } })
            .select("email creationSource partnerType")
            .lean()
        : [];

      const pMap = new Map();
      partners.forEach((p) => {
        if (p.email) pMap.set(p.email.toLowerCase().trim(), p);
      });

      const enriched = approvals.map((a) => {
        const obj = a.toObject();
        if (obj.role === "Partner") {
          const p = obj.email ? pMap.get(obj.email.toLowerCase().trim()) : null;
          const isInternal = Boolean(
            (p && (p.creationSource === "admin_created" || (p.partnerType && String(p.partnerType).toLowerCase() === "internal"))) ||
            (obj.businessName && /naaviverse\s+internal/i.test(obj.businessName))
          );
          obj.partnerScope = isInternal ? "internal" : "external";
        }
        return obj;
      });

      return res.json({ status: true, data: enriched });
    }

    res.json({ status: true, data: approvals });
  } catch (err) {
    console.error("getApprovals error:", err);
    res.status(500).json({ status: false, message: "Error fetching approvals" });
  }
};

// [OK] GET approval status by email + role
exports.getApprovalByEmail = async (req, res) => {
  try {
    const { email, role } = req.query;

    if (!email) {
      return res.status(400).json({ status: false, message: "Email is required" });
    }

    const normalisedRole = role
      ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
      : "Partner";

    const approval = await Approval.findOne({ email, role: normalisedRole });

    if (!approval) {
      return res.json({ status: false, message: "No approval record found", data: null });
    }

    res.json({ status: true, data: approval });
  } catch (err) {
    res.status(500).json({ status: false, message: "Error fetching approval status" });
  }
};

// [OK] UPDATE approval status — role-aware email notification & DB status sync
exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const updateFields = { status };
    if (reason) updateFields.reason = reason;

    const approval = await Approval.findByIdAndUpdate(id, updateFields, { new: true });

    if (!approval) {
      return res.status(404).json({ status: false, message: "Approval record not found" });
    }

    const isUser    = approval.role?.toLowerCase() === "user";
    const roleLabel = isUser ? "User" : "Partner";
    const greeting  = isUser ? "Dear User" : "Dear Partner";

    if (status === "approved") {
      const { subject: appSubject, html: appHtml } = getApprovalEmailContent({
        role: approval.role,
        email: approval.email,
        recipientName: approval.firstName || approval.businessName || approval.email,
      });

      sendNotificationMail(approval.email, appSubject, appHtml);

      const emailQuery = { email: { $regex: new RegExp("^" + (approval.email || "").trim() + "$", "i") } };
      if (isUser) {
        await User.findOneAndUpdate(emailQuery, { status: "active", isBlocked: false, OTPverified: true });
      } else {
        await Partner.findOneAndUpdate(emailQuery, { status: true, isBlocked: false, accountStatus: "active", OTPverified: true });
      }
    } else if (status === "rejected") {
      sendNotificationMail(
        approval.email,
        `Naaviverse ${roleLabel} Application Update`,
        `${greeting},<br>Unfortunately your application was not approved.<br>${reason ? `Reason: ${reason}` : "Please contact support for more information."}`
      );
    } else if (status === "deactivated") {
      const emailQuery = { email: { $regex: new RegExp("^" + (approval.email || "").trim() + "$", "i") } };
      if (isUser) {
        await User.findOneAndUpdate(emailQuery, { status: "inactive", isBlocked: true });
      } else {
        await Partner.findOneAndUpdate(emailQuery, { status: false, isBlocked: true, accountStatus: "inactive" });
      }
    }

    res.json({ status: true, data: approval });
  } catch (err) {
    console.error("updateApproval error:", err);
    res.status(500).json({ status: false, message: "Error updating approval" });
  }
};

// [OK] DEACTIVATE approval & mark user/partner deactivated in DB
exports.deactivateApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await Approval.findByIdAndUpdate(
      id,
      { status: "deactivated" },
      { new: true }
    );

    if (!approval) {
      return res.status(404).json({ status: false, message: "Approval record not found" });
    }

    const isUser = approval.role?.toLowerCase() === "user";
    const emailQuery = { email: { $regex: new RegExp("^" + (approval.email || "").trim() + "$", "i") } };
    if (isUser) {
      await User.findOneAndUpdate(
        emailQuery,
        { status: "inactive", isBlocked: true }
      );
    } else {
      await Partner.findOneAndUpdate(
        emailQuery,
        { status: false, isBlocked: true, accountStatus: "inactive" }
      );
    }

    res.json({ status: true, data: approval, message: "Record deactivated in DB successfully" });
  } catch (err) {
    console.error("deactivateApproval error:", err);
    res.status(500).json({ status: false, message: "Error deactivating record" });
  }
};

// [OK] ACTIVATE / REACTIVATE approval & mark user/partner active in DB
exports.activateApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await Approval.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!approval) {
      return res.status(404).json({ status: false, message: "Approval record not found" });
    }

    const isUser = approval.role?.toLowerCase() === "user";
    const emailQuery = { email: { $regex: new RegExp("^" + (approval.email || "").trim() + "$", "i") } };
    if (isUser) {
      await User.findOneAndUpdate(
        emailQuery,
        { status: "active", isBlocked: false, OTPverified: true }
      );
    } else {
      await Partner.findOneAndUpdate(
        emailQuery,
        { status: true, isBlocked: false, accountStatus: "active", OTPverified: true }
      );
    }

    res.json({ status: true, data: approval, message: "Record activated in DB successfully" });
  } catch (err) {
    console.error("activateApproval error:", err);
    res.status(500).json({ status: false, message: "Error activating record" });
  }
};

// [OK] DELETE approval & delete user/partner from DB
exports.deleteApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await Approval.findByIdAndDelete(id);

    if (!approval) {
      return res.status(404).json({ status: false, message: "Approval record not found" });
    }

    const isUser = approval.role?.toLowerCase() === "user";
    if (isUser) {
      await User.findOneAndDelete({ email: approval.email });
    } else {
      await Partner.findOneAndDelete({ email: approval.email });
    }

    res.json({ status: true, message: "Record deleted from database successfully", id });
  } catch (err) {
    console.error("deleteApproval error:", err);
    res.status(500).json({ status: false, message: "Error deleting record" });
  }
};
