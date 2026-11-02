const mongoose = require("mongoose");
const marketplaceModel = require("../models/MarketplaceModel");
const stepModel = require("../models/StepsModel");
const {
  getRankedMarketplaceItems,
  trackMarketplaceEvent,
  recalculateAllMarketplaceScores,
} = require("../services/MarketplaceRankingService");

// [OK] Activity logging
const { logEvent } = require("./ActivityController");

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
// POST /api/marketplace/add
// Creates a new marketplace item AND pushes its _id into the step's
// [layer]_marketplace array. Logs "listing" event.
// ─────────────────────────────────────────────────────────────────────────────
const addMarketplaceItem = async (req, res) => {
  try {
    const {
      name, role, layer, step_id, path_id, partner_email,
      category, access, cost, goal, outcomes, duration, iterations, discount, features
    } = req.body;

    if (!step_id || !layer) {
      return res.status(400).json({ status: false, message: "step_id and layer are required" });
    }

    const resolvedRole = role || category || "vendor";
    const resolvedCategory = (category || role || "vendor").toLowerCase();
    const resolvedLayer = (layer || "macro").toLowerCase();

    const item = await marketplaceModel.create({
      name, role: resolvedRole, layer: resolvedLayer, step_id, path_id, partner_email,
      category: resolvedCategory, access, cost, goal, outcomes, duration, iterations,
      discount, features, status: "active"
    });

    // Push this item's _id into the step's [layer]_marketplace array
    if (step_id && mongoose.Types.ObjectId.isValid(step_id)) {
      await stepModel.findByIdAndUpdate(
        step_id,
        { $addToSet: { [`${resolvedLayer}_marketplace`]: item._id } }
      );
    }

    // [OK] Log marketplace listing created
    if (partner_email) {
      const { displayName, partnerType } = await getPartnerInfo(partner_email);
      logEvent({
        role:        "partner",
        email:       partner_email,
        displayName,
        partnerType,
        eventType:   "listing",
        title:       `Marketplace Listing Added: ${name || "New Item"}`,
        desc:        `Added "${name || "New Item"}" (${layer} · ${access || "free"}) to marketplace`,
      }).catch(err => console.error("logEvent addMarketplaceItem error:", err));
    }

    return res.json({ status: true, data: item });
  } catch (error) {
    console.error("addMarketplaceItem error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — check whether a user has unlocked a step layer (credit or subscription)
// ─────────────────────────────────────────────────────────────────────────────
async function isLayerUnlockedForUser(email, stepId, layer) {
  if (!layer || layer === "macro") return true; // Macro view is free
  if (!email || !stepId) return false;

  try {
    const SubscriptionModel = require("../models/SubscriptionModel");
    const cleanEmail = String(email).trim().toLowerCase();
    const subs = await SubscriptionModel.find({
      userEmail: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });

    if (!subs || subs.length === 0) return false;

    for (const sub of subs) {
      // Active subscription covering this tier
      if (sub.status === "active") {
        if (sub.tier === "nano") return true;
        if (layer === "micro" && (sub.tier === "micro" || sub.tier === "nano")) return true;
      }

      // Step-specific credit unlock
      if (Array.isArray(sub.unlockedSteps)) {
        const isUnlocked = sub.unlockedSteps.some(
          (u) => String(u.step_id) === String(stepId) && u.layer === layer
        );
        if (isUnlocked) return true;
      }
    }
  } catch (err) {
    console.error("Error checking layer unlock:", err);
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/step/:step_id?layer=macro|micro|nano
// ─────────────────────────────────────────────────────────────────────────────
const getMarketplaceItemsByStep = async (req, res) => {
  try {
    const { step_id } = req.params;
    const { layer, category, searchQ, intent, path_id, email } = req.query;

    if (!step_id) {
      return res.json({ status: true, data: [] });
    }

    // If a specific layer is explicitly queried that requires unlock, verify permission
    if (layer && layer !== "macro" && email) {
      const unlocked = await isLayerUnlockedForUser(email, step_id, layer);
      if (!unlocked) {
        return res.json({ status: true, data: [] });
      }
    }

    // 1. Fetch from marketplaceModel
    let mItems = [];
    try {
      const mFilter = { status: "active" };
      if (mongoose.Types.ObjectId.isValid(step_id)) {
        mFilter.$or = [{ step_id: new mongoose.Types.ObjectId(step_id) }, { step_id: String(step_id) }];
      } else {
        mFilter.step_id = String(step_id);
      }
      mItems = await marketplaceModel.find(mFilter).lean();
    } catch (e) {
      console.warn("MarketplaceItem find error:", e);
    }

    // 2. Fetch the step document to extract partner marketplace items from macro/micro/nano arrays
    let stepDoc = null;
    try {
      if (mongoose.Types.ObjectId.isValid(step_id)) {
        stepDoc = await stepModel.findById(step_id).lean();
      }
      if (!stepDoc) {
        stepDoc = await stepModel.findOne({ _id: step_id }).lean();
      }
      if (!stepDoc && mongoose.connection.db) {
        stepDoc = await mongoose.connection.db.collection("career_steps").findOne({
          _id: mongoose.Types.ObjectId.isValid(step_id) ? new mongoose.Types.ObjectId(step_id) : step_id,
        });
      }
      if (!stepDoc && mongoose.connection.db) {
        stepDoc = await mongoose.connection.db.collection("steps").findOne({
          _id: mongoose.Types.ObjectId.isValid(step_id) ? new mongoose.Types.ObjectId(step_id) : step_id,
        });
      }
    } catch (e) {
      console.warn("Step fetch error in getMarketplaceItemsByStep:", e);
    }

    const combined = [...mItems];
    const seenNames = new Set(
      mItems.map((i) => `${(i.name || "").toLowerCase().trim()}_${(i.layer || "").toLowerCase().trim()}`)
    );
    const seenIds = new Set(mItems.map((i) => String(i._id)));

    if (stepDoc) {
      const stepLayers = ["macro", "micro", "nano"];
      for (const lay of stepLayers) {
        const rawArr = [
          ...(Array.isArray(stepDoc[`${lay}_marketplace`]) ? stepDoc[`${lay}_marketplace`] : []),
          ...(Array.isArray(stepDoc[lay]?.marketplace) ? stepDoc[lay].marketplace : []),
        ];

        for (let idx = 0; idx < rawArr.length; idx++) {
          const entry = rawArr[idx];
          if (!entry) continue;

          // If entry is an ObjectId or reference string
          if (typeof entry === "string" || entry instanceof mongoose.Types.ObjectId) {
            const entryIdStr = String(entry);
            if (!seenIds.has(entryIdStr) && mongoose.Types.ObjectId.isValid(entryIdStr)) {
              try {
                const refItem = await marketplaceModel.findById(entryIdStr).lean();
                if (refItem && refItem.status === "active") {
                  seenIds.add(entryIdStr);
                  seenNames.add(`${(refItem.name || "").toLowerCase().trim()}_${(refItem.layer || lay).toLowerCase().trim()}`);
                  combined.push({
                    ...refItem,
                    layer: (refItem.layer || lay).toLowerCase(),
                  });
                }
              } catch (_) {}
            }
          } else if (typeof entry === "object" && entry.name && String(entry.name).trim()) {
            // Embedded marketplace item object (saved from partner step modal)
            const normName = String(entry.name).trim();
            const resolvedLayer = (entry.layer || lay).toLowerCase();
            const nameKey = `${normName.toLowerCase()}_${resolvedLayer}`;
            const entryIdStr = entry._id ? String(entry._id) : null;

            if ((entryIdStr && seenIds.has(entryIdStr)) || seenNames.has(nameKey)) {
              continue;
            }

            const resolvedRole = entry.role || entry.category || "vendor";
            const resolvedCategory = (entry.category || entry.role || "vendor").toLowerCase();
            const costVal = entry.cost !== undefined ? String(entry.cost) : "0";
            const isFree = costVal === "0" || costVal.toLowerCase() === "free" || !costVal;

            const normalizedItem = {
              _id: entryIdStr || `step_${stepDoc._id}_${lay}_${idx}`,
              name: normName,
              role: resolvedRole,
              category: resolvedCategory,
              layer: resolvedLayer,
              step_id: stepDoc._id,
              path_id: stepDoc.path_id || path_id || null,
              partner_email: entry.partner_email || stepDoc.email || "",
              access: entry.access || (isFree ? "Free" : "Paid"),
              cost: costVal,
              goal: entry.goal || "",
              outcomes: entry.outcomes || "",
              duration: entry.duration || "Self-Paced",
              iterations: entry.iterations || "",
              discount: entry.discount || "None",
              features: entry.features || "",
              status: "active",
              sourceType: "step",
              createdAt: entry.createdAt || stepDoc.createdAt || new Date(),
            };

            if (entryIdStr) seenIds.add(entryIdStr);
            seenNames.add(nameKey);
            combined.push(normalizedItem);
          }
        }
      }
    }

    // 3. Filter by layer if specific layer query is passed
    let finalItems = combined;
    if (layer) {
      finalItems = finalItems.filter((i) => (i.layer || "macro").toLowerCase() === layer.toLowerCase());
    }

    // 4. Filter by category if requested
    if (category && category !== "all") {
      finalItems = finalItems.filter(
        (i) => (i.category || i.role || "").toLowerCase() === category.toLowerCase()
      );
    }

    const userContext = {
      searchQuery: searchQ || intent || "",
      pathId: path_id || (stepDoc?.path_id ? String(stepDoc.path_id) : ""),
      stepId: String(step_id),
    };

    const ranked = await getRankedMarketplaceItems(finalItems, userContext);
    return res.json({ status: true, data: ranked });
  } catch (err) {
    console.error("getMarketplaceItemsByStep error:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/admin/get-all?layer=macro|micro|nano
// ─────────────────────────────────────────────────────────────────────────────
const getAllMarketplaceItems = async (req, res) => {
  try {
    const filter = { status: "active" };
    if (req.query.layer) filter.layer = req.query.layer;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.partner_email) filter.partner_email = req.query.partner_email.trim();
    const items = await getRankedMarketplaceItems(filter);
    res.json({ status: true, data: items });
  } catch (err) {
    console.error("getAllMarketplaceItems error:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketplace/link-step
// Links/unlinks a marketplace item to/from a step. Logs "listing" event.
// ─────────────────────────────────────────────────────────────────────────────
const linkMarketplaceToStep = async (req, res) => {
  try {
    const { item_id, step_id } = req.body;

    if (!item_id) {
      return res.status(400).json({ status: false, message: "item_id is required" });
    }

    const updated = await marketplaceModel.findByIdAndUpdate(
      item_id,
      { step_id: step_id || null },
      { new: true }
    );

    // [OK] Log listing linked/unlinked activity
    if (updated?.partner_email) {
      const { displayName, partnerType } = await getPartnerInfo(updated.partner_email);
      const action = step_id ? "Linked to Step" : "Unlinked from Step";
      logEvent({
        role:        "partner",
        email:       updated.partner_email,
        displayName,
        partnerType,
        eventType:   "listing",
        title:       `Marketplace Item ${action}: ${updated.name || "Item"}`,
        desc:        `"${updated.name || "Item"}" ${step_id ? "linked to a step" : "unlinked from step"}`,
      }).catch(err => console.error("logEvent linkMarketplaceToStep error:", err));
    }

    return res.json({ status: true, data: updated });
  } catch (error) {
    console.error("linkMarketplaceToStep error:", error);
    return res.status(500).json({ status: false, message: "Failed to link marketplace item" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/marketplace/admin/update/:id
// Updates an existing marketplace item. Logs "listing" event.
// ─────────────────────────────────────────────────────────────────────────────
const updateMarketplaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    
    // Find the original item before update for logging
    const originalItem = await marketplaceModel.findById(id);
    if (!originalItem) {
      return res.status(404).json({ 
        status: false, 
        message: "Marketplace item not found" 
      });
    }

    // Validate access vs cost
    const targetAccess = updateData.access !== undefined ? updateData.access : originalItem.access;
    const targetCost   = updateData.cost !== undefined ? updateData.cost : originalItem.cost;

    if (targetAccess !== undefined && targetCost !== undefined) {
      const normAccess = String(targetAccess || "").trim().toLowerCase();
      const rawCost = String(targetCost || "").replace(/[₹$,\s]/g, "").trim();
      const isZeroOrFree = !rawCost || rawCost === "0" || rawCost.toLowerCase() === "free" || Number(rawCost) === 0;

      if (normAccess === "free" && !isZeroOrFree) {
        return res.status(400).json({
          status: false,
          message: "Cannot set a paid price for Free access. Please set price to 0 or change access to Paid."
        });
      }
      if (normAccess === "paid" && isZeroOrFree) {
        return res.status(400).json({
          status: false,
          message: "Price must be greater than 0 for Paid access."
        });
      }
    }
    
    // Update the item
    const updatedItem = await marketplaceModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // [OK] Log marketplace listing updated
    if (updatedItem?.partner_email) {
      const { displayName, partnerType } = await getPartnerInfo(updatedItem.partner_email);
      logEvent({
        role:        "partner",
        email:       updatedItem.partner_email,
        displayName,
        partnerType,
        eventType:   "listing",
        title:       `Marketplace Listing Updated: ${updatedItem.name || "Item"}`,
        desc:        `Updated "${updatedItem.name || "Item"}" (${updatedItem.layer} · ${updatedItem.access || "free"}) in marketplace`,
      }).catch(err => console.error("logEvent updateMarketplaceItem error:", err));
    }
    
    return res.json({ 
      status: true, 
      message: "Item updated successfully",
      data: updatedItem 
    });
  } catch (error) {
    console.error("updateMarketplaceItem error:", error);
    res.status(500).json({ 
      status: false, 
      message: error.message 
    });
  }
};

// GET /api/marketplace/rankings?layer=macro|micro|nano&category=mentor
const getMarketplaceRankings = async (req, res) => {
  try {
    const filter = { status: "active" };
    if (req.query.step_id) filter.step_id = req.query.step_id;
    if (req.query.layer) filter.layer = req.query.layer;
    if (req.query.category) filter.category = req.query.category;

    const userContext = {
      searchQuery: req.query.searchQ || req.query.intent || "",
      pathId: req.query.path_id || "",
      stepId: req.query.step_id || "",
    };

    const items = await getRankedMarketplaceItems(filter, userContext);
    return res.json({ status: true, data: items });
  } catch (err) {
    console.error("getMarketplaceRankings error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET /api/marketplace/admin/score-breakdown/:id
const getMarketplaceItemScoreBreakdown = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await marketplaceModel.findById(id).lean();
    if (!item) {
      return res.status(404).json({ status: false, message: "Marketplace item not found" });
    }
    const MarketplaceAnalytics = require("../models/MarketplaceAnalyticsModel");
    const { calculateMarketplaceScore } = require("../services/MarketplaceRankingService");
    const analytics = await MarketplaceAnalytics.findOne({ service_id: id }).lean();
    
    const userContext = {
      searchQuery: req.query.searchQ || "",
      pathId: req.query.path_id || item.path_id || "",
      stepId: req.query.step_id || item.step_id || "",
    };

    const scoreObj = calculateMarketplaceScore(item, analytics, userContext);
    return res.json({
      status: true,
      data: {
        item: {
          _id: item._id,
          name: item.name,
          role: item.role,
          category: item.category,
          partner_email: item.partner_email,
        },
        naavi_score: scoreObj.naavi_score,
        score_breakdown: scoreObj.score_breakdown,
        analytics,
      },
    });
  } catch (err) {
    console.error("getMarketplaceItemScoreBreakdown error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// POST /api/marketplace/analytics
const updateMarketplaceAnalytics = async (req, res) => {
  try {
    const {
      service_id,
      serviceId,
      marketplaceItemId,
      action,
      value,
      rating,
      partner_email,
    } = req.body;

    const itemId = service_id || serviceId || marketplaceItemId;
    if (!itemId || !action) {
      return res.status(400).json({
        status: false,
        message: "service_id and action are required",
      });
    }

    const analytics = await trackMarketplaceEvent({
      serviceId: itemId,
      action,
      value,
      rating,
      partnerEmail: partner_email,
    });

    if (!analytics) {
      return res.status(404).json({ status: false, message: "Marketplace item not found" });
    }

    return res.json({ status: true, data: analytics });
  } catch (err) {
    console.error("updateMarketplaceAnalytics error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// POST /api/marketplace/recalculate
const recalculateMarketplaceRankings = async (req, res) => {
  try {
    const rankedItems = await recalculateAllMarketplaceScores();
    return res.json({ status: true, data: rankedItems });
  } catch (err) {
    console.error("recalculateMarketplaceRankings error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET /api/marketplace/:id
const getMarketplaceItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: "Invalid ID format" });
    }
    const item = await marketplaceModel.findById(id).lean();
    if (!item) {
      return res.status(404).json({ status: false, message: "Marketplace item not found" });
    }
    
    // Enrich with dynamic checkoutType based on registered partner
    const Partner = require("../models/PartnerModel");
    if (item.partner_email) {
      const partner = await Partner.findOne({ email: { $regex: `^${item.partner_email.trim()}$`, $options: "i" } }).select("partnerId creationSource partnerType").lean();
      if (partner) {
        const isInternal = partner.creationSource === "admin_created" || (partner.partnerType || "").toLowerCase() === "internal";
        item.checkoutType = isInternal ? "internal" : "external";
        item.partnerId = partner.partnerId;
        item.creationSource = partner.creationSource;
        item.partnerType = partner.partnerType;
      } else {
        item.checkoutType = "internal";
      }
    } else {
      item.checkoutType = "internal";
    }
    
    return res.json({ status: true, data: item });
  } catch (err) {
    console.error("getMarketplaceItemById error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET /api/marketplace/partner/:partnerId
const getMarketplaceByPartnerId = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) {
      return res.status(400).json({ status: false, message: "partnerId is required" });
    }

    const Partner = require("../models/PartnerModel");
    const partner = await Partner.findOne({ partnerId: partnerId.trim() }).lean();
    if (!partner) {
      return res.status(404).json({ status: false, message: "Partner not found" });
    }

    // Find all active marketplace items for this partner
    const items = await marketplaceModel.find({
      partner_email: { $regex: `^${partner.email.trim()}$`, $options: "i" },
      status: "active"
    }).lean();

    const isInternal = partner.creationSource === "admin_created" || (partner.partnerType || "").toLowerCase() === "internal";

    // Enrich all items with dynamic fields
    const enrichedItems = items.map(item => {
      return {
        ...item,
        checkoutType: isInternal ? "internal" : "external",
        creationSource: partner.creationSource,
        partnerType: partner.partnerType,
        partnerId: partner.partnerId
      };
    });

    return res.json({
      status: true,
      partner: {
        partnerId: partner.partnerId,
        businessName: partner.businessName || partner.username,
        email: partner.email,
        website: partner.website,
        firstName: partner.firstName,
        lastName: partner.lastName,
        partnerType: partner.partnerType,
        creationSource: partner.creationSource,
        isInternal,
      },
      data: enrichedItems
    });
  } catch (err) {
    console.error("getMarketplaceByPartnerId error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET /api/marketplace/purchases or /api/purchases
const getAllPurchases = async (req, res) => {
  try {
    const Purchase = require("../models/PurchaseModel");
    const Payment = require("../models/PaymentModel");

    // Fetch from both collections
    const [rawPurchases, rawPayments] = await Promise.all([
      Purchase.find().sort({ createdAt: -1 }).lean(),
      Payment.find().sort({ createdAt: -1 }).lean()
    ]);

    const formattedList = [];

    // Map PurchaseModel records
    rawPurchases.forEach(p => {
      const clientName = p.clientName || p.creatorEmail || "User";
      const initials = clientName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
      const dt = new Date(p.date || p.createdAt);
      const isToday = new Date().toDateString() === dt.toDateString();
      const formattedDate = isToday 
        ? `Today, ${dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      formattedList.push({
        id: p._id.toString(),
        user: clientName,
        email: p.clientEmail || p.creatorEmail || "N/A",
        initials,
        item: p.productName || "Marketplace Item",
        type: p.billingFrequency || "One-Time",
        plan: "Bundle",
        marketplace: p.partnerId ? `Partner (${p.partnerId})` : "Naaviverse Core",
        amount: `₹${p.amount || 0}`,
        amountVal: p.amount || 0,
        date: formattedDate,
        rawDate: dt,
        status: (p.status || "completed").toLowerCase() === "completed" || (p.status || "completed").toLowerCase() === "paid" ? "completed" : "pending",
        microLessons: 1,
        steps: 1,
        duration: "Self-Paced"
      });
    });

    // Map PaymentModel records
    rawPayments.forEach(p => {
      const emailName = p.userEmail ? p.userEmail.split("@")[0] : "User";
      const user = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      const initials = user.slice(0, 2).toUpperCase();
      const dt = new Date(p.createdAt);
      const isToday = new Date().toDateString() === dt.toDateString();
      const formattedDate = isToday 
        ? `Today, ${dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const planName = p.planTier ? p.planTier.charAt(0).toUpperCase() + p.planTier.slice(1) : (p.tier ? p.tier.charAt(0).toUpperCase() + p.tier.slice(1) : "Standard");

      formattedList.push({
        id: p._id.toString(),
        user,
        email: p.userEmail,
        initials,
        item: p.productName || "Marketplace Subscription",
        type: p.billingMethod ? (p.billingMethod.charAt(0).toUpperCase() + p.billingMethod.slice(1)) : "Subscription",
        plan: planName,
        marketplace: p.partnerEmail ? p.partnerEmail : "Naaviverse Platform",
        amount: `₹${p.amount || 0}`,
        amountVal: p.amount || 0,
        date: formattedDate,
        rawDate: dt,
        status: p.status === "paid" || p.status === "completed" ? "completed" : "pending",
        microLessons: p.tier === "nano" ? 5 : 20,
        steps: 4,
        duration: p.billingMethod === "annual" ? "1 Year" : "1 Month"
      });
    });

    // Sort combined list descending by rawDate
    formattedList.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

    // Calculate metrics
    const totalCount = formattedList.length;
    const todayCount = formattedList.filter(p => p.date.startsWith("Today")).length;
    const pendingCount = formattedList.filter(p => p.status === "pending").length;
    const completedCount = formattedList.filter(p => p.status === "completed").length;
    const totalRevenue = formattedList.reduce((sum, p) => sum + (p.amountVal || 0), 0);

    const stats = {
      total: totalCount,
      today: todayCount,
      pending: pendingCount,
      completed: completedCount,
      revenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
      revenuePaise: totalRevenue * 100
    };

    return res.json({
      status: true,
      data: formattedList,
      stats
    });
  } catch (err) {
    console.error("getAllPurchases error:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = {
  addMarketplaceItem,
  getMarketplaceItemsByStep,
  getAllMarketplaceItems,
  getMarketplaceRankings,
  getMarketplaceItemScoreBreakdown,
  updateMarketplaceAnalytics,
  recalculateMarketplaceRankings,
  linkMarketplaceToStep,
  updateMarketplaceItem, // [OK] Export the new function
  getMarketplaceItemById,
  getMarketplaceByPartnerId,
  getAllPurchases,
};
