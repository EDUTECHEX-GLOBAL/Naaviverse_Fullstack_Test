// routes/userpathRouter.js
// ─────────────────────────────────────────────────────────────────────────────
// Users can select MULTIPLE paths simultaneously.
// Each selection creates a new doc in userPaths collection.
// Only blocked if the user has already selected that EXACT path (duplicate guard).
// ─────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");

const User     = require("../models/UsersModel");
const Path     = require("../models/PathModel");
const Step     = require("../models/StepsModel");
const UserPath = require("../models/UserPathsModel");   // ← THE SOURCE OF TRUTH
const Purchase = require("../models/PurchaseModel");    // ← For CRM clients
const { getUserActivity } = require("../controllers/UserActivityController");
const { getUserPath, completeStep, failedStep } = require("../controllers/UserPathsController");

// ─────────────────────────────────────────────────────────────────────────────
// SELECT A PATH FOR THE USER
// POST /api/userpaths/selectpath
// Users can select MULTIPLE paths. Each path creates a separate active doc.
// Only blocks if this exact path is already active for this user (no duplicates).
// ─────────────────────────────────────────────────────────────────────────────
router.post("/selectpath", async (req, res) => {
  try {
    const { email, pathId } = req.body;

    if (!email || !pathId) {
      return res.status(400).json({
        status: false,
        message: "email and pathId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid pathId",
      });
    }

    const cleanEmail = (email || "").trim();
    const emailRegex = new RegExp("^" + cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
    const pathObjId = mongoose.Types.ObjectId.isValid(pathId) ? new mongoose.Types.ObjectId(pathId) : pathId;

    // ── 1. Verify user exists ─────────────────────────────────────────────
    const user = await User.findOne({ email: emailRegex });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // ── 2. Verify path is active ──────────────────────────────────────────
    const path = await Path.findOne({
      _id:    pathObjId,
      status: "active",
    }).lean();

    if (!path) {
      return res.status(404).json({ status: false, message: "Path not found or not active" });
    }

    // ── 3. Check if user already enrolled in this path (or re-selecting) ─
    let userPathDoc = await UserPath.findOne({
      email: emailRegex,
      pathId: pathObjId,
    });

    if (userPathDoc) {
      userPathDoc.status = "active";
      userPathDoc.updatedAt = new Date();
      await userPathDoc.save();
    } else {
      userPathDoc = await UserPath.create({
        email: cleanEmail.toLowerCase(),
        pathId:         pathObjId,
        status:         "active",
        completedSteps: [],
        currentStep:    "",
      });
    }

    // ── 4. Keep naavi_users.selectedPath pointing to latest selection ─────
    user.selectedPath = pathId;
    await user.save();

    return res.status(200).json({
      status:  true,
      message: "Path selected successfully",
      pathId,
      data:    userPathDoc,
    });
  } catch (error) {
    console.error("Select Path Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET THE STEPS FOR THE SELECTED PATH
// GET /api/userpaths/steps?pathId=xxx
// ─────────────────────────────────────────────────────────────────────────────

router.get("/", getUserPath);
router.get("/activity", getUserActivity);
router.get("/steps", async (req, res) => {
  try {
    const { pathId } = req.query;

    if (!pathId) {
      return res.status(400).json({ status: false, message: "pathId is required" });
    }

    const pathObjId = mongoose.Types.ObjectId.isValid(pathId) ? new mongoose.Types.ObjectId(pathId) : pathId;
    const path = await Path.findById(pathObjId).lean();
    if (!path) {
      return res.status(404).json({ status: false, message: "Path not found" });
    }

    const stepIds = (Array.isArray(path.the_ids) ? path.the_ids.map(s => s?.step_id) : [])
      .filter(id => id && mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Must fetch ONLY active steps (exclude inactive/deleted) so step count matches Explore Paths
    const steps = await Step.find({
      status: "active",
      $or: [
        { path_id: pathObjId },
        ...(stepIds.length > 0 ? [{ _id: { $in: stepIds } }] : [])
      ]
    })
      .populate({ path: "services", model: "naavi_services" })
      .sort({ step_order: 1, createdAt: 1 })
      .lean();

    // Determine destination country & course from destination coordinates or path name
    let destCountry = path.destination_country || path.feature_coordinates?.country || "";
    let courseName = path.destination_degree || path.program || path.feature_coordinates?.destination_degree || path.feature_coordinates?.program || "";

    const fullName = path.nameOfPath || path.name || "";
    if (fullName.includes("•") || fullName.includes("·")) {
      const parts = fullName.split(/[•·]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        if (!destCountry) destCountry = parts[parts.length - 1];
        if (!courseName && parts.length >= 3) courseName = parts[1];
      }
    }

    return res.status(200).json({
      status: true,
      data: {
        name:               path.nameOfPath || path.name,
        nameOfPath:         path.nameOfPath || path.name,
        description:        path.description,
        country:            destCountry,
        course:             courseName,
        destination_degree: path.destination_degree || path.feature_coordinates?.destination_degree || "",
        program:            path.program || path.feature_coordinates?.program || "",
        steps,
      },
    });
  } catch (error) {
    console.error("Get Path Steps Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET USER'S SELECTED PATH ID
// GET /api/userpaths/selected?email=xxx
// ─────────────────────────────────────────────────────────────────────────────
// REPLACE the existing /selected route with this:
router.get("/selected", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ status: false, message: "Email is required" });

    const cleanEmail = (email || "").trim();
    const emailRegex = new RegExp("^" + cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");

    // ── First priority: user.selectedPath (set on every path selection) ──
    const user = await User.findOne({ email: emailRegex }).lean();
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    if (user.selectedPath) {
      const selectedPathId = user.selectedPath.toString();
      const pathObjId = mongoose.Types.ObjectId.isValid(selectedPathId) ? new mongoose.Types.ObjectId(selectedPathId) : selectedPathId;

      // Verify this path is still active in userPaths collection
      const stillActive = await UserPath.findOne({
        email: emailRegex,
        pathId: pathObjId,
        status: "active",
      }).lean();

      if (stillActive) {
        return res.status(200).json({
          status: true,
          pathId: selectedPathId,
        });
      }

      // If user.selectedPath is set, check if path itself is active
      const pathValid = await Path.findOne({
        _id: pathObjId,
        status: "active",
      }).lean();
      if (pathValid) {
        return res.status(200).json({
          status: true,
          pathId: selectedPathId,
        });
      }
    }

    // ── Fallback: most recently enrolled active path ──
    const latestUserPath = await UserPath.findOne(
      { email: emailRegex, status: "active" },
      { pathId: 1 },
      { sort: { updatedAt: -1, createdAt: -1 } }
    ).lean();

    return res.status(200).json({
      status: true,
      pathId: latestUserPath ? latestUserPath.pathId.toString() : null,
    });

  } catch (error) {
    console.error("Get Selected Path Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// MARK STEP AS COMPLETED
// PUT /api/userpaths/completeStep
// ─────────────────────────────────────────────────────────────────────────────
router.put("/completeStep", completeStep);

// ─────────────────────────────────────────────────────────────────────────────
// MARK STEP AS FAILED
// PUT /api/userpaths/failedStep
// ─────────────────────────────────────────────────────────────────────────────
router.put("/failedStep", failedStep);


// ─────────────────────────────────────────────────────────────────────────────
// GET CRM CLIENTS FOR A PARTNER
// GET /api/userpaths/crm-clients?partnerEmail=xxx
// Returns all users who selected any path belonging to this partner,
// along with their purchase count and basic info.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/crm-clients", async (req, res) => {
  try {
    const { partnerEmail } = req.query;

    if (!partnerEmail) {
      return res.status(400).json({ status: false, message: "partnerEmail is required" });
    }

    // ── 1. Find all active paths belonging to this partner ────────────────
    const partnerPaths = await Path.find({
      email: partnerEmail,   // Using 'email' field to match partner's email
      status: "active",
    }).lean();

    if (!partnerPaths.length) {
      return res.status(200).json({ status: true, total: 0, data: [] });
    }

    const partnerPathIds = partnerPaths.map(p => p._id);

    // ── 2. Find all userPaths where pathId is one of this partner's paths ─
    const userPaths = await UserPath.find({
      pathId: { $in: partnerPathIds },
      status: "active",
    }).lean();

    if (!userPaths.length) {
      return res.status(200).json({ status: true, total: 0, data: [] });
    }

    // ── 3. Get unique user emails ─────────────────────────────────────────
    const uniqueEmails = [...new Set(userPaths.map(up => up.email))];

    // ── 4. Fetch full user details ────────────────────────────────────────
    const users = await User.find({ email: { $in: uniqueEmails } }).lean();

    // ── 5. Fetch purchases for these users (adjust model/field as needed) ─
    let purchaseMap = {};
    try {
      const purchases = await Purchase.find({
        email: { $in: uniqueEmails },
      }).lean();

      for (const pu of purchases) {
        if (!purchaseMap[pu.email]) purchaseMap[pu.email] = [];
        purchaseMap[pu.email].push(pu);
      }
    } catch (_) {
      // Purchase model may not exist yet — gracefully skip
      console.log("Purchase model not available or error fetching purchases");
    }

    // ── 6. Shape the response ─────────────────────────────────────────────
    const clients = users.map(u => ({
      name:         u.username || u.name || u.email,
      email:        u.email,
      phone:        u.phone || u.phoneNumber || "—",
      country:      u.country || "—",
      joinedAt:     u.createdAt,
      avatar:       (u.username || u.name || u.email).slice(0, 2).toUpperCase(),
      purchases:    (purchaseMap[u.email] || []).length,
      purchaseList: purchaseMap[u.email] || [],
    }));

    return res.status(200).json({
      status: true,
      total:  clients.length,
      data:   clients,
    });
  } catch (error) {
    console.error("CRM Clients Error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});


module.exports = router;


//changed as per requirements