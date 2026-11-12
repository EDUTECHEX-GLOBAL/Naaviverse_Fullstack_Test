const pathModel = require('../models/PathModel');
const stepModel = require('../models/StepsModel');
const userModel = require('../models/UsersModel');
const mongoose = require('mongoose');

// [OK] FIXED: import logEvent (for partners) instead of logActivityInternal (users only)
const { logEvent } = require('./ActivityController');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — fetch partner display info from email
// ─────────────────────────────────────────────────────────────────────────────
async function getPartnerInfo(email) {
  try {
    if (!email) return { displayName: "Partner", partnerType: "" };
    const Partner = require('../models/PartnerModel');
    const partner = await Partner.findOne({ email }).select('businessName username partnerType').lean();
    return {
      displayName: partner?.businessName || partner?.username || email,
      partnerType: partner?.partnerType || "",
    };
  } catch (_) {
    return { displayName: email, partnerType: "" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD PATH — logs "publish" event (path created as draft)
// ─────────────────────────────────────────────────────────────────────────────
const addPath = async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.email) {
      return res.status(400).json({ status: false, message: "Partner email is required" });
    }

    if (!body.nameOfPath || !String(body.nameOfPath).trim()) {
      return res.status(400).json({ status: false, message: "Path name is required" });
    }

    const trimmedName = String(body.nameOfPath).trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existing = await pathModel.findOne({
      email: body.email,
      nameOfPath: { $regex: `^${escapedName}$`, $options: "i" },
      status: { $in: ["draft", "waitingforapproval"] }
    });

    if (existing) {
      return res.status(400).json({ status: false, message: "A path with this name already exists and is pending approval" });
    }

    // Safely filter and validate step IDs
    const rawTheIds = Array.isArray(body.the_ids) ? body.the_ids : [];
    const validSteps = rawTheIds.filter(
      s => s && s.step_id && mongoose.Types.ObjectId.isValid(s.step_id)
    );
    const stepIds = validSteps.map(s => s.step_id.toString());
    const uniqueStepIds = new Set(stepIds);
    if (uniqueStepIds.size !== stepIds.length) {
      return res.status(400).json({ status: false, message: "Duplicate steps are not allowed in a path" });
    }

    if (stepIds.length > 0) {
      const steps = await stepModel.find({ _id: { $in: stepIds }, status: { $ne: "delete" } });
      if (steps.length !== stepIds.length) {
        return res.status(400).json({ status: false, message: "One or more steps are invalid or deleted" });
      }
    }

    // Validate path_type and path_cat against enums
    const validPathTypes = ['education', 'career', 'immigration'];
    const pathType = validPathTypes.includes(String(body.path_type || '').toLowerCase())
      ? String(body.path_type).toLowerCase()
      : 'education';

    const validPathCats = ['K12', 'Degree'];
    const pathCat = validPathCats.includes(body.path_cat) ? body.path_cat : 'K12';

    // Validate enum arrays against schema enums to prevent Mongoose ValidationError
    const validGrades = ['9', '10', '11', '12'];
    const safeGrade = Array.isArray(body.grade)
      ? body.grade.map(String).filter(g => validGrades.includes(g))
      : [];

    const validGradeAvg = [
      '0% - 35%', '36% - 60%', '61% - 75%', '76% - 85%', '86% - 95%', '96% - 100%'
    ];
    const safeGradeAvg = Array.isArray(body.grade_avg)
      ? body.grade_avg.map(String).filter(g => validGradeAvg.includes(g))
      : [];

    const validCurriculums = ['IB', 'IGCSE', 'CBSE', 'ICSE', 'Nordic'];
    const safeCurriculum = Array.isArray(body.curriculum)
      ? body.curriculum.map(String).filter(c => validCurriculums.includes(c))
      : [];

    const validStreams = ['MPC', 'BIPC', 'CEC', 'MEC', 'HEC'];
    const safeStream = Array.isArray(body.stream)
      ? body.stream.map(String).filter(s => validStreams.includes(s))
      : [];

    const validFinances = ['0-25L', '25L-75L', '75L-3CR', '3CR+', 'Other'];
    const safeFinance = Array.isArray(body.financialSituation)
      ? body.financialSituation.map(String).filter(f => validFinances.includes(f))
      : [];

    const safeTheIds = validSteps.map(step => {
      const stepObj = {
        step_id: new mongoose.Types.ObjectId(step.step_id),
        stepName: step.stepName || "",
        stepDescription: step.stepDescription || "",
        backupPathName: step.backupPathName || "",
        backupPathDescription: step.backupPathDescription || ""
      };
      if (step.backup_pathId && mongoose.Types.ObjectId.isValid(step.backup_pathId)) {
        stepObj.backup_pathId = new mongoose.Types.ObjectId(step.backup_pathId);
      } else {
        stepObj.backup_pathId = null;
      }
      return stepObj;
    });

    const personalityStr = Array.isArray(body.personality)
      ? body.personality.join(', ')
      : (typeof body.personality === 'string' ? body.personality : '');

    const currentCoords = { ...(body.current_coordinates || {}) };
    if (Array.isArray(currentCoords.personality)) {
      currentCoords.personality = currentCoords.personality.join(', ');
    } else if (!currentCoords.personality && personalityStr) {
      currentCoords.personality = personalityStr;
    }

    const newPath = {
      email: body.email,
      nameOfPath: trimmedName,
      name: trimmedName,
      description: body.description || "",
      current_coordinates: currentCoords,
      feature_coordinates: {
        ...(body.feature_coordinates || {}),
        path_type: pathType,
        path_cat: pathCat,
      },
      path_type: pathType,
      path_cat: pathCat,
      destination_institution: body.destination_institution || "",
      destination_degree: body.destination_degree || "unknown",
      length: Number(body.length) || 0,
      total_steps: Number(body.total_steps) || 5,
      city: body.city || "",
      country: body.country || "",
      program: body.program || "",
      grade: safeGrade,
      grade_avg: safeGradeAvg,
      curriculum: safeCurriculum,
      stream: safeStream,
      financialSituation: safeFinance,
      personality: personalityStr,
      the_ids: safeTheIds,
      status: "draft"
    };

    const saved = await pathModel.create(newPath);

    // Log path created (draft) activity safely in background
    if (body.email) {
      getPartnerInfo(body.email).then(({ displayName, partnerType }) => {
        logEvent({
          role:        "partner",
          email:       body.email,
          displayName,
          partnerType,
          eventType:   "publish",
          title:       `Path Created: ${trimmedName}`,
          desc:        `Draft path "${trimmedName}" created`,
        }).catch(err => console.error("logEvent addPath error:", err));
      }).catch(err => console.error("getPartnerInfo error:", err));
    }

    return res.status(200).json({ status: true, message: "Path created successfully", data: saved });
  } catch (error) {
    console.error("Add Path Error:", error);
    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      status: false,
      message: error.message || "Failed to create path",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PATH — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const updatePath = async (req, res) => {
  try {
    const pathId = req.params.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ status: false, message: "Invalid pathId" });
    }

    const existingPath = await pathModel.findById(pathId);
    if (!existingPath) return res.status(404).json({ status: false, message: "Path not found" });

    if (!["draft", "rejected", "waitingforapproval", "changesrequested"].includes(existingPath.status)) {
      return res.status(400).json({ status: false, message: "Editing not allowed. Path is locked." });
    }

    delete updateData.status;

    if (Array.isArray(updateData.personality)) {
      updateData.personality = updateData.personality.join(', ');
    }
    if (updateData.current_coordinates && Array.isArray(updateData.current_coordinates.personality)) {
      updateData.current_coordinates.personality = updateData.current_coordinates.personality.join(', ');
    }

    const updatedPath = await pathModel.findByIdAndUpdate(pathId, { $set: updateData }, { new: true, runValidators: true });

    // [OK] Log path updated activity
    if (existingPath.email) {
      const { displayName, partnerType } = await getPartnerInfo(existingPath.email);
      logEvent({
        role:        "partner",
        email:       existingPath.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Path Updated: ${existingPath.nameOfPath || "Path"}`,
        desc:        `Updated draft path "${existingPath.nameOfPath || "Path"}"`,
      }).catch(err => console.error("logEvent updatePath error:", err));
    }

    return res.status(200).json({ status: true, message: "Path updated successfully", data: updatedPath });
  } catch (error) {
    console.error("Error updating path:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT FOR APPROVAL — logs "approval" event (the key one!)
// ─────────────────────────────────────────────────────────────────────────────
const submitForApproval = async (req, res) => {
  try {
    const { pathId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ status: false, message: "Invalid pathId" });
    }

    const path = await pathModel.findById(pathId);
    if (!path) return res.status(404).json({ status: false, message: "Path not found" });

    if (!path.the_ids || path.the_ids.length === 0) {
      return res.status(400).json({ status: false, message: "Cannot submit empty path. Add at least one step." });
    }

    if (!["draft", "rejected", "changesrequested", "waitingforapproval"].includes(path.status)) {
      return res.status(400).json({ status: false, message: "Only draft, rejected, or paths under review can be submitted" });
    }

    // Count steps saved in the steps collection by path_id
    const stepCount = await stepModel.countDocuments({
      path_id: pathId,
      status: { $ne: "delete" }
    });

    const requiredSteps = path.total_steps || 5;

    if (stepCount < requiredSteps) {
      return res.status(400).json({
        status: false,
        message: `Please complete all ${requiredSteps} steps before submitting. You have added ${stepCount}/${requiredSteps} steps.`,
        data: { current: stepCount, required: requiredSteps }
      });
    }

    // Mark all pending change requests as addressed on resubmit
    if (path.changeRequests && path.changeRequests.length > 0) {
      path.changeRequests.forEach(cr => {
        cr.status = "addressed";
      });
      path.markModified("changeRequests");
    }

    path.review_notes = '';
    path.status = "waitingforapproval";
    await path.save();

    // [OK] FIXED: Log as PARTNER "approval" event (not user logActivityInternal)
    if (path.email) {
      const { displayName, partnerType } = await getPartnerInfo(path.email);
      logEvent({
        role:        "partner",
        email:       path.email,
        displayName,
        partnerType,
        eventType:   "approval",
        title:       `Path Submitted for Approval: ${path.nameOfPath || "Path"}`,
        desc:        `"${path.nameOfPath || "Path"}" submitted for admin review with ${stepCount} step(s)`,
      }).catch(err => console.error("logEvent submitForApproval error:", err));
    }

    return res.json({ status: true, message: "Path submitted for approval", data: path });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PATH — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const deletePath = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: false, message: "Invalid path ID" });

    const path = await pathModel.findById(id);
    if (!path) return res.status(404).json({ status: false, message: "Path not found" });

    let newStatus;
    switch (path.status) {
      case "draft": case "rejected": case "waitingforapproval": newStatus = "delete"; break;
      case "active": newStatus = "inactive"; break;
      case "inactive": newStatus = "delete"; break;
      case "delete": return res.status(400).json({ status: false, message: "Path is already deleted" });
      default: return res.status(400).json({ status: false, message: "Invalid path status" });
    }

    const updatedPath = await pathModel.findByIdAndUpdate(id, { status: newStatus }, { new: true });

    // [OK] Log path deleted/deactivated
    if (path.email) {
      const { displayName, partnerType } = await getPartnerInfo(path.email);
      logEvent({
        role:        "partner",
        email:       path.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Path ${newStatus === "delete" ? "Deleted" : "Deactivated"}: ${path.nameOfPath || "Path"}`,
        desc:        `Path "${path.nameOfPath || "Path"}" moved to ${newStatus}`,
      }).catch(err => console.error("logEvent deletePath error:", err));
    }

    return res.status(200).json({ status: true, message: `Path moved to ${newStatus}`, data: updatedPath });
  } catch (error) {
    console.error("Error in deletePath:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESTORE PATH — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const restorePath = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: false, message: "Invalid path ID" });

    const restored = await pathModel.findOneAndUpdate(
      { _id: id, status: "delete" },
      { status: "inactive" },
      { new: true }
    );
    if (!restored) return res.status(404).json({ status: false, message: "Path not found or not deleted" });

    // [OK] Log path restored
    if (restored.email) {
      const { displayName, partnerType } = await getPartnerInfo(restored.email);
      logEvent({
        role:        "partner",
        email:       restored.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Path Restored: ${restored.nameOfPath || "Path"}`,
        desc:        `Path "${restored.nameOfPath || "Path"}" restored to inactive`,
      }).catch(err => console.error("logEvent restorePath error:", err));
    }

    return res.status(200).json({ status: true, message: "Path restored to inactive", data: restored });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REACTIVATE PATH — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const reactivatePath = async (req, res) => {
  try {
    const { id } = req.params;
    const path = await pathModel.findById(id);
    if (!path) return res.status(404).json({ status: false, message: "Path not found" });
    if (path.status !== "inactive") return res.status(400).json({ status: false, message: "Only inactive paths can be reactivated" });

    path.status = "active";
    await path.save();

    // [OK] Log path reactivated
    if (path.email) {
      const { displayName, partnerType } = await getPartnerInfo(path.email);
      logEvent({
        role:        "partner",
        email:       path.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Path Reactivated: ${path.nameOfPath || "Path"}`,
        desc:        `Path "${path.nameOfPath || "Path"}" is now active`,
      }).catch(err => console.error("logEvent reactivatePath error:", err));
    }

    return res.status(200).json({ status: true, message: "Path reactivated successfully", data: path });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const reactivateInactivePath = async (req, res) => {
  try {
    const { id } = req.params;
    const path = await pathModel.findById(id);
    if (!path) return res.status(404).json({ status: false, message: "Path not found" });
    if (path.status !== "inactive") return res.status(400).json({ status: false, message: "Only inactive paths can be reactivated" });

    path.status = "active";
    await path.save();

    // [OK] Log reactivate
    if (path.email) {
      const { displayName, partnerType } = await getPartnerInfo(path.email);
      logEvent({
        role:        "partner",
        email:       path.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Path Reactivated: ${path.nameOfPath || "Path"}`,
        desc:        `Path "${path.nameOfPath || "Path"}" is now active`,
      }).catch(err => console.error("logEvent reactivateInactivePath error:", err));
    }

    return res.json({ status: true, message: "Path reactivated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPLOAD PATHS — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const uploadBulkPaths = async (req, res) => {
  try {
    const { email, records } = req.body;
    if (!email) return res.status(400).json({ status: false, message: "Email is required" });
    if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ status: false, message: "Records array is required" });

    const formatted = records.map(r => ({ ...r, email, status: "active" }));
    const inserted = await pathModel.insertMany(formatted);

    // [OK] Log bulk upload
    const { displayName, partnerType } = await getPartnerInfo(email);
    logEvent({
      role:        "partner",
      email,
      displayName,
      partnerType,
      eventType:   "publish",
      title:       `Bulk Upload: ${inserted.length} Paths`,
      desc:        `Uploaded ${inserted.length} paths in bulk`,
    }).catch(err => console.error("logEvent uploadBulkPaths error:", err));

    return res.status(200).json({ status: true, message: "Bulk paths inserted successfully", count: inserted.length });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return res.status(500).json({ status: false, message: "Internal server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST CHANGES (admin → partner) — logs "approval" event on partner side
// ─────────────────────────────────────────────────────────────────────────────
const requestChanges = async (req, res) => {
  try {
    const pathId = req.params.id;
    const { issues, adminNote, adminEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ status: false, message: "Invalid pathId" });
    }

    if (!adminNote || !adminNote.trim()) {
      return res.status(400).json({ status: false, message: "Admin note is required" });
    }

    const path = await pathModel.findById(pathId);
    if (!path) return res.status(404).json({ status: false, message: "Path not found" });

    if (path.status !== "waitingforapproval" && path.status !== "changesrequested") {
      return res.status(400).json({ status: false, message: "Path must be under review to request changes" });
    }

    path.changeRequests.push({
      issues: issues || [],
      adminNote: adminNote.trim(),
      adminEmail: adminEmail || "",
      sentAt: new Date(),
      status: "pending"
    });

    path.status = "changesrequested";
    await path.save();

    // [OK] Log changes requested — partner needs to act on this
    if (path.email) {
      const { displayName, partnerType } = await getPartnerInfo(path.email);
      logEvent({
        role:        "partner",
        email:       path.email,
        displayName,
        partnerType,
        eventType:   "approval",
        title:       `Changes Requested: ${path.nameOfPath || "Path"}`,
        desc:        `Admin requested changes on "${path.nameOfPath || "Path"}": ${adminNote.trim().slice(0, 80)}`,
      }).catch(err => console.error("logEvent requestChanges error:", err));
    }

    return res.status(200).json({ status: true, message: "Change request sent to partner", data: path });
  } catch (error) {
    console.error("Error in requestChanges:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PATH STATUS (admin approves/rejects) — no partner activity log needed
// ─────────────────────────────────────────────────────────────────────────────
const updatePathStatus = async (req, res) => {
  const pathId = req.params.id;
  const { status, review_notes } = req.body;

  if (!status || !['active', 'draft'].includes(status)) {
    return res.status(400).json({ status: false, message: 'Invalid status' });
  }

  try {
    const path = await pathModel.findById(pathId);
    if (!path) return res.status(404).json({ status: false, message: 'Path not found' });

    if (!["waitingforapproval", "changesrequested"].includes(path.status)) {
      return res.status(400).json({ status: false, message: "Only paths under review can be approved or rejected" });
    }

    path.status = status;

    if (status === 'draft' && review_notes) {
      path.review_notes = review_notes;
      path.changeRequests.push({
        issues: [],
        adminNote: review_notes,
        sentAt: new Date(),
        status: "pending"
      });
    }

    if (status === 'active') {
      path.review_notes = '';
    }

    await path.save();
    return res.status(200).json({ status: true, message: `Path status updated to ${status}`, data: path });
  } catch (error) {
    console.error("Error updating path status:", error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REPLY TO CHANGE REQUEST — logs "message" event for partner
// ─────────────────────────────────────────────────────────────────────────────
const replyToChangeRequest = async (req, res) => {
  try {
    const { pathId, changeRequestId } = req.params;
    const { from, message, partnerEmail, adminEmail } = req.body;

    if (!from || !message?.trim()) {
      return res.status(400).json({ status: false, message: "from and message are required" });
    }

    const reply = {
      from,
      message: message.trim(),
      sentAt: new Date(),
      ...(from === "partner" ? { partnerEmail } : { adminEmail }),
    };

   const result = await pathModel.findOneAndUpdate(
  { _id: pathId, "changeRequests._id": changeRequestId },
  {
    $push: { "changeRequests.$.replies": reply },
    // no auto-address — only admin can mark as addressed
  },
  { new: true }
);
    if (!result) {
      return res.status(404).json({ status: false, message: "Path or change request not found" });
    }

    // [OK] Log partner reply as a "message" event
    if (from === "partner" && partnerEmail) {
      const { displayName, partnerType } = await getPartnerInfo(partnerEmail);
      logEvent({
        role:        "partner",
        email:       partnerEmail,
        displayName,
        partnerType,
        eventType:   "message",
        title:       `Replied to Change Request: ${result.nameOfPath || "Path"}`,
        desc:        `Partner replied on "${result.nameOfPath || "Path"}": ${message.trim().slice(0, 80)}`,
      }).catch(err => console.error("logEvent replyToChangeRequest error:", err));
    }

    return res.json({ status: true, message: "Reply added", data: reply });
  } catch (error) {
    console.error("Reply error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK CHANGE REQUEST AS ADDRESSED (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const markChangeRequestAddressed = async (req, res) => {
  try {
    const { pathId, changeRequestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ status: false, message: "Invalid pathId" });
    }

    const result = await pathModel.findOneAndUpdate(
      { _id: pathId, "changeRequests._id": changeRequestId },
      { $set: { "changeRequests.$.status": "addressed" } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ status: false, message: "Path or change request not found" });
    }

    // If ALL CRs are now addressed → move path back to waitingforapproval
    const allAddressed = result.changeRequests.every(cr => cr.status === "addressed");
    if (allAddressed) {
      await pathModel.findByIdAndUpdate(pathId, {
        status: "waitingforapproval",
        review_notes: "",
      });
    }

    return res.json({ status: true, message: "Change request marked as addressed", data: result });
  } catch (error) {
    console.error("markChangeRequestAddressed error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
}; 

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY endpoints — no activity logging needed
// ─────────────────────────────────────────────────────────────────────────────
const getPath = async (req, res) => {
  try {
    let filter = {};

    if (req.query.status) {
      if (req.query.status !== "all") filter.status = req.query.status;
    } else {
      filter.status = { $ne: "delete" };
    }

    if (req.query.path_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.path_id)) {
        return res.status(400).json({ status: false, message: "Invalid path_id" });
      }
      filter._id = new mongoose.Types.ObjectId(req.query.path_id);
    }

    if (req.query.email) filter.email = { $regex: `^${req.query.email.trim()}$`, $options: "i" };
    if (req.query.nameOfPath) filter.nameOfPath = req.query.nameOfPath;
    if (req.query.program) filter.program = req.query.program;

    const paths = await pathModel.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "career_steps",
          let: { stepIds: "$the_ids.step_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $in: ["$_id", "$$stepIds"] }, { $eq: ["$status", "active"] }] } } },
            { $sort: { step_order: 1, createdAt: 1 } }
          ],
          as: "StepDetails"
        }
      },
      {
        $lookup: {
          from: "naavi_partners",
          let: { pathEmail: { $toLower: { $ifNull: ["$email", ""] } } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toLower: { $ifNull: ["$email", ""] } }, "$$pathEmail"]
                }
              }
            },
            {
              $project: {
                password: 0,
                OTP: 0,
                OTPCreatedTime: 0,
                OTPAttempts: 0,
              }
            }
          ],
          as: "partnerDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          let: { pathEmail: { $toLower: { $ifNull: ["$email", ""] } } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toLower: { $ifNull: ["$email", ""] } }, "$$pathEmail"]
                }
              }
            },
            {
              $project: {
                password: 0,
                OTP: 0,
                OTPCreatedTime: 0,
              }
            }
          ],
          as: "userDetails"
        }
      },
      {
        $addFields: {
          partnerDetails: {
            $ifNull: [
              { $arrayElemAt: ["$partnerDetails", 0] },
              {
                $let: {
                  vars: { u: { $arrayElemAt: ["$userDetails", 0] } },
                  in: {
                    $cond: [
                      { $ne: ["$$u", null] },
                      {
                        firstName: "$$u.name",
                        lastName: "",
                        username: "$$u.username",
                        email: "$$u.email",
                        phone: { $ifNull: ["$$u.phoneNumber", "$$u.phone"] },
                        phoneNumber: { $ifNull: ["$$u.phoneNumber", "$$u.phone"] },
                        partnerType: "Creator",
                        yourPosition: "$$u.userType",
                      },
                      null
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    ]);

    return res.status(200).json({
      status: true, total: paths.length,
      message: paths.length ? "Paths data found" : "No data found",
      data: paths
    });
  } catch (error) {
    console.error("Error in getPath:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getPathSpecific = async (req, res) => {
  try {
    let filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    } else {
      filter.status = "active";
    }

    if (req.query.path_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.path_id)) {
        return res.status(400).json({ status: false, message: "Invalid path_id" });
      }
      filter._id = new mongoose.Types.ObjectId(req.query.path_id);
    }

    if (!req.query.email) return res.status(400).json({ status: false, message: "Email is required" });

    const user = await userModel.findOne({ email: req.query.email }).lean();
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const filterFields = ["curriculum", "grade", "stream", "grade_avg", "financialSituation", "personality"];
    filterFields.forEach(field => {
      if (req.query[field] === "true" && user[field]) {
        filter[field] = Array.isArray(user[field]) ? { $in: user[field] } : user[field];
      }
    });

    const paths = await pathModel.find(filter).lean();
    return res.status(200).json({ status: true, total: paths.length, message: paths.length ? "Paths data found" : "No data found", data: paths });
  } catch (error) {
    console.error("Error in getPathSpecific:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getPathNormal = async (req, res) => {
  try {
    const { status, financialSituation, performance, curriculum, grade, stream, personality } = req.body;
    let filter = {};

    if (status && status !== "all") filter.status = status;
    else filter.status = "active";

    if (financialSituation) filter.financialSituation = { $in: financialSituation };
    if (performance) filter.grade_avg = { $in: performance };
    if (curriculum) filter.curriculum = { $in: curriculum };
    if (grade) filter.grade = { $in: grade };
    if (stream) filter.stream = { $in: stream };
    if (personality) filter.personality = { $in: personality };

    const paths = await pathModel.find(filter).lean();
    if (paths.length === 0) return res.json({ status: true, data: [], message: 'No data found' });
    return res.status(200).json({ status: true, total: paths.length, message: 'Paths data found', data: paths });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const updateFields = async (req, res) => {
  let updateAll = await pathModel.updateMany({}, { $set: { personality: "realistic" } }, { new: true });
  if (!updateAll) return res.json({ status: false, message: 'Data not found' });
  return res.json({ status: true, message: 'Details updated', data: updateAll });
};

// ── Cooldown guard: sync agent paths at most once every 5 minutes ──
let _lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const getActivePaths = async (req, res) => {
  try {
    // ── Fire-and-forget background sync (non-blocking) with cooldown ──
    const now = Date.now();
    if (now - _lastSyncTime > SYNC_COOLDOWN_MS) {
      _lastSyncTime = now; // set early to prevent concurrent triggers
      try {
        const { syncAgentPaths } = require('./AgentPathsController');
        // Do NOT await — let it run in the background
        syncAgentPaths().catch((syncErr) => {
          console.error("[AgentSync] background sync failed:", syncErr.message);
        });
      } catch (syncErr) {
        console.error("[AgentSync] background sync failed:", syncErr.message);
      }
    }

    const query = { status: "active" };
    if (req.query.grade) query.grade = { $in: [req.query.grade] };
    if (req.query.curriculum) query.curriculum = { $in: [req.query.curriculum] };
    if (req.query.stream) query.stream = { $in: [req.query.stream] };
    if (req.query.financial) query.financialSituation = { $in: [req.query.financial] };
    if (req.query.performance) query.grade_avg = { $in: [req.query.performance] };
    if (req.query.personality) query.personality = req.query.personality;

    const activePaths = await pathModel.find(query).lean();
    return res.status(200).json({ success: true, total: activePaths.length, data: activePaths });
  } catch (error) {
    console.error("Error fetching active paths:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPathById = async (req, res) => {
  try {
    const pathId = req.params.path_id;
    if (!mongoose.Types.ObjectId.isValid(pathId)) return res.status(400).json({ status: false, message: "Invalid path ID provided" });

    const result = await pathModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(pathId) } },
      {
        $lookup: {
          from: "career_steps",
          let: { stepIds: "$the_ids.step_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $in: ["$_id", "$$stepIds"] }, { $eq: ["$status", "active"] }] } } },
            { $sort: { step_order: 1, createdAt: 1 } }
          ],
          as: "StepDetails",
        },
      },
      {
        $lookup: {
          from: "naavi_partners",
          let: { pathEmail: { $toLower: { $ifNull: ["$email", ""] } } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toLower: { $ifNull: ["$email", ""] } }, "$$pathEmail"]
                }
              }
            },
            {
              $project: {
                password: 0,
                OTP: 0,
                OTPCreatedTime: 0,
                OTPAttempts: 0,
              }
            }
          ],
          as: "partnerDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          let: { pathEmail: { $toLower: { $ifNull: ["$email", ""] } } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toLower: { $ifNull: ["$email", ""] } }, "$$pathEmail"]
                }
              }
            },
            {
              $project: {
                password: 0,
                OTP: 0,
                OTPCreatedTime: 0,
              }
            }
          ],
          as: "userDetails"
        }
      },
      {
        $addFields: {
          partnerDetails: {
            $ifNull: [
              { $arrayElemAt: ["$partnerDetails", 0] },
              {
                $let: {
                  vars: { u: { $arrayElemAt: ["$userDetails", 0] } },
                  in: {
                    $cond: [
                      { $ne: ["$$u", null] },
                      {
                        firstName: "$$u.name",
                        lastName: "",
                        username: "$$u.username",
                        email: "$$u.email",
                        phone: { $ifNull: ["$$u.phoneNumber", "$$u.phone"] },
                        phoneNumber: { $ifNull: ["$$u.phoneNumber", "$$u.phone"] },
                        partnerType: "Creator",
                        yourPosition: "$$u.userType",
                      },
                      null
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    ]);

    if (!result || result.length === 0) return res.status(404).json({ status: false, message: "Path not found" });
    return res.status(200).json({ status: true, message: "Path data found", data: result[0] });
  } catch (err) {
    console.error("Error fetching path:", err);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const editPath = async (req, res) => {
  try {
    const { pathId, ...updateData } = req.body;

    if (!pathId || !mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ status: false, message: "Invalid or missing pathId" });
    }

    const existingPath = await pathModel.findById(pathId);
    if (!existingPath) {
      return res.status(404).json({ status: false, message: "Path not found" });
    }

    // Never allow status changes through this endpoint
    delete updateData.status;

    const updatedPath = await pathModel.findByIdAndUpdate(
      pathId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ status: true, message: "Path updated successfully", data: updatedPath });
  } catch (error) {
    console.error("editPath error:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

module.exports = {
  addPath,
  submitForApproval,
  getPath,
  deletePath,
  restorePath,
  getPathSpecific,
  getPathNormal,
  updateFields,
  updatePath,
  editPath,
  getActivePaths,
  updatePathStatus,
  reactivatePath,
  reactivateInactivePath,
  getPathById,
  uploadBulkPaths,
  requestChanges,
  replyToChangeRequest,
  markChangeRequestAddressed,
};
