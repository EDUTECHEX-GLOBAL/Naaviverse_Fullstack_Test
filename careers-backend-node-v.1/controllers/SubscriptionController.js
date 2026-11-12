const Subscription = require("../models/SubscriptionModel");
const VaultTransaction = require("../models/VaultTransactionModel");
const Payment = require("../models/PaymentModel");

const LAYER_COST_FREEMIUM = { micro: 2, nano: 4 };
const LAYER_COST_SUBSCRIBER = { micro: 2, nano: 4 };
const PRODUCT_ID = "naavi-platform";

const computeEndDate = (billingMethod) => {
  if (billingMethod === "lifetime") return null;
  const now = new Date();
  if (billingMethod === "monthly") return new Date(now.setMonth(now.getMonth() + 1));
  if (billingMethod === "annual") return new Date(now.setFullYear(now.getFullYear() + 1));
  return null;
};

const isActive = (sub) => {
  if (!sub) return false;
  if (sub.status === "expired") return false;
  if (sub.billingMethod === "lifetime") return true;
  return sub.endDate && sub.endDate > new Date();
};

const getWalletBalance = async (email) => {
  const now = new Date();
  const txns = await VaultTransaction.find({ email });
  return txns.reduce((acc, t) => {
    if (t.type === "credit") {
      if (t.expiresAt && t.expiresAt < now) return acc;
      return acc + t.amount;
    }
    return acc - t.amount;
  }, 0);
};

/* =================================================================
   1. CREATE / ACTIVATE SUBSCRIPTION
================================================================= */
const createSubscription = async (req, res) => {
  try {
    const { userEmail, profileId, productId, productName, billingMethod, tier, planTier } = req.body;

    if (!userEmail || !productId || !productName || !billingMethod) {
      return res.status(400).json({
        success: false,
        message: "userEmail, productId, productName, and billingMethod are required.",
      });
    }

    const validMethods = ["monthly", "annual", "lifetime"];
    if (!validMethods.includes(billingMethod)) {
      return res.status(400).json({
        success: false,
        message: `billingMethod must be one of: ${validMethods.join(", ")}`,
      });
    }

    const validTiers = ["micro", "nano"];
    const validPlanTiers = ["standard", "pro", "proplus"];
    const resolvedTier = validTiers.includes(tier) ? tier : "micro";
    const resolvedPlanTier = validPlanTiers.includes(planTier) ? planTier : "standard";

    const existing = await Subscription.findOne({ userEmail, productId });

    if (existing && isActive(existing)) {
      // UPGRADE micro → nano
      if (existing.tier === "micro" && resolvedTier === "nano") {
        existing.tier = "nano";
        existing.planTier = resolvedPlanTier;
        existing.billingMethod = billingMethod;
        existing.startDate = new Date();
        existing.endDate = computeEndDate(billingMethod);
        if (profileId) existing.profileId = profileId;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: "Subscription upgraded to Nano successfully.",
          subscription: existing,
        });
      }
      return res.status(409).json({
        success: false,
        message: "User already has an active subscription for this product.",
        subscription: existing,
      });
    }

    const endDate = computeEndDate(billingMethod);

    // REACTIVATE expired
    if (existing) {
      existing.tier = resolvedTier;
      existing.planTier = resolvedPlanTier;
      existing.billingMethod = billingMethod;
      existing.status = "active";
      existing.startDate = new Date();
      existing.endDate = endDate;
      if (profileId) existing.profileId = profileId;
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Subscription reactivated successfully.",
        subscription: existing,
      });
    }

    // CREATE fresh
    const subscription = await Subscription.create({
      userEmail,
      profileId: profileId || null,
      productId,
      productName,
      tier: resolvedTier,
      planTier: resolvedPlanTier,
      billingMethod,
      status: "active",
      startDate: new Date(),
      endDate,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully.",
      subscription,
    });
  } catch (err) {
    console.error("[ERROR] createSubscription error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =================================================================
   2. CHECK SUBSCRIPTION STATUS
================================================================= */
const checkStatus = async (req, res) => {
  try {
    const { email, productId } = req.query;
    if (!email || !productId) {
      return res.status(400).json({
        success: false,
        message: "email and productId query params are required.",
      });
    }

    // ── 1. Check Subscription collection first ────────────────────
    const sub = await Subscription.findOne({ userEmail: email, productId });

    if (sub) {
      if (sub.billingMethod !== "lifetime" && sub.endDate && sub.endDate < new Date()) {
        sub.status = "expired";
        await sub.save();
        return res.json({
          success: true,
          subscribed: false,
          tier: null,
          planTier: null,
          subscription: sub,
        });
      }
      const active = sub.status === "active";
      return res.json({
        success: true,
        subscribed: active,
        tier: active ? (sub.tier || "micro") : null,
        planTier: active ? (sub.planTier || "standard") : null,
        subscription: sub,
      });
    }

    // ── 2. Fallback: check Payment collection ─────────────────────
    const payment = await Payment.findOne({ userEmail: email, productId, status: "paid" });

    if (!payment) {
      return res.json({ success: true, subscribed: false, tier: null, planTier: null });
    }

    // Derive planTier from productName
    let planTier = payment.planTier || null;
    if (!planTier && payment.productName) {
      const name = payment.productName.toLowerCase();
      planTier = name.includes("proplus") || name.includes("pro plus") ? "proplus"
        : name.includes("pro") ? "pro"
          : "standard";
    }

    // Derive tier (view layer) from productName
    const tier = (payment.productName || "").toLowerCase().includes("nano") ? "nano" : "micro";

    // ── 3. Auto-create missing Subscription record ────────────────
    const endDate = computeEndDate(payment.billingMethod);
    await Subscription.create({
      userEmail: email,
      profileId: payment.profileId || null,
      productId,
      productName: payment.productName,
      tier,
      planTier: planTier || "standard",
      billingMethod: payment.billingMethod,
      status: "active",
      startDate: payment.createdAt || new Date(),
      endDate,
      unlockedSteps: [],
    });

    return res.json({
      success: true,
      subscribed: true,
      tier,
      planTier,
    });

  } catch (err) {
    console.error("[ERROR] checkStatus error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =================================================================
   3. GET ALL SUBSCRIPTIONS FOR A USER
================================================================= */
const getUserSubscriptions = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "email query param is required." });

    const subscriptions = await Subscription.find({ userEmail: email }).sort({ createdAt: -1 });
    const now = new Date();
    const updates = subscriptions
      .filter((s) => s.billingMethod !== "lifetime" && s.endDate < now && s.status === "active")
      .map((s) => { s.status = "expired"; return s.save(); });
    if (updates.length) await Promise.all(updates);

    return res.json({ success: true, total: subscriptions.length, subscriptions });
  } catch (err) {
    console.error("[ERROR] getUserSubscriptions error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =================================================================
   4. CANCEL SUBSCRIPTION
================================================================= */
const cancelSubscription = async (req, res) => {
  try {
    const { email, productId } = req.body;
    if (!email || !productId) return res.status(400).json({ success: false, message: "email and productId are required." });

    const sub = await Subscription.findOne({ userEmail: email, productId, status: "active" });
    if (!sub) return res.status(404).json({ success: false, message: "No active subscription found." });

    sub.status = "expired";
    sub.endDate = new Date();
    await sub.save();
    return res.json({ success: true, message: "Subscription cancelled successfully.", subscription: sub });
  } catch (err) {
    console.error("[ERROR] cancelSubscription error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =================================================================
   5. RENEW SUBSCRIPTION
================================================================= */
const renewSubscription = async (req, res) => {
  try {
    const { email, productId, billingMethod, tier, planTier } = req.body;
    if (!email || !productId) return res.status(400).json({ success: false, message: "email and productId are required." });

    const sub = await Subscription.findOne({ userEmail: email, productId });
    if (!sub) return res.status(404).json({ success: false, message: "No subscription record found." });

    if (billingMethod) {
      const validMethods = ["monthly", "annual", "lifetime"];
      if (!validMethods.includes(billingMethod)) {
        return res.status(400).json({
          success: false,
          message: `billingMethod must be one of: ${validMethods.join(", ")}`,
        });
      }
      sub.billingMethod = billingMethod;
    }

    const validTiers = ["micro", "nano"];
    const validPlanTiers = ["standard", "pro", "proplus"];
    if (tier && validTiers.includes(tier)) sub.tier = tier;
    if (planTier && validPlanTiers.includes(planTier)) sub.planTier = planTier;

    sub.status = "active";
    sub.startDate = new Date();
    sub.endDate = computeEndDate(sub.billingMethod);
    await sub.save();
    return res.json({ success: true, message: "Subscription renewed successfully.", subscription: sub });
  } catch (err) {
    console.error("[ERROR] renewSubscription error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =================================================================
   6. ADMIN — GET ALL SUBSCRIPTIONS
================================================================= */
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, billingMethod, tier, planTier, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (billingMethod) filter.billingMethod = billingMethod;
    if (tier) filter.tier = tier;
    if (planTier) filter.planTier = planTier;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Subscription.countDocuments(filter),
    ]);

    // ── Enrich each subscription with payment amount ──────────
    const enriched = await Promise.all(
      subscriptions.map(async (sub) => {
        const payment = await Payment.findOne({
          userEmail: sub.userEmail,
          productId: sub.productId,
          status: "paid",
        }).sort({ createdAt: -1 });

        return {
          ...sub.toObject(),
          amount: payment?.amount || 0,
          currency: payment?.currency || "INR",
        };
      })
    );

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      subscriptions: enriched,
    });
  } catch (err) {
    console.error("[ERROR] getAllSubscriptions error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
/* =================================================================
   7. CHECK STEP UNLOCKS
================================================================= */
const checkStepUnlock = async (req, res) => {
  try {
    const { email, step_id } = req.query;
    if (!email || !step_id) {
      return res.status(400).json({ status: false, message: "email and step_id are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const subs = await Subscription.find({
      userEmail: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });

    if (!subs || subs.length === 0) {
      return res.json({ status: true, unlocked: { micro: false, nano: false } });
    }

    let microUnlocked = false;
    let nanoUnlocked = false;

    for (const sub of subs) {
      // Check active subscription coverage
      if (sub.status === "active") {
        if (sub.tier === "nano") {
          microUnlocked = true;
          nanoUnlocked = true;
        } else if (sub.tier === "micro") {
          microUnlocked = true;
        }
      }

      // Check step-specific credit unlocks
      if (Array.isArray(sub.unlockedSteps)) {
        const stepUnlocks = sub.unlockedSteps.filter((u) => String(u.step_id) === String(step_id));
        const layers = stepUnlocks.map((u) => u.layer);
        if (layers.includes("micro")) microUnlocked = true;
        if (layers.includes("nano")) nanoUnlocked = true;
      }
    }

    return res.json({
      status: true,
      unlocked: {
        micro: microUnlocked,
        nano: nanoUnlocked,
      },
    });
  } catch (err) {
    console.error("[ERROR] checkStepUnlock error:", err);
    return res.status(500).json({ status: false, error: err.message });
  }
};

/* =================================================================
   8. UNLOCK A STEP LAYER WITH CREDITS
================================================================= */
const unlockStep = async (req, res) => {
  try {
    const { email, step_id, layer, isSubscriber } = req.body;

    if (!email || !step_id || !layer) {
      return res.status(400).json({ status: false, message: "email, step_id and layer are required" });
    }
    if (!["micro", "nano"].includes(layer)) {
      return res.status(400).json({ status: false, message: "layer must be 'micro' or 'nano'" });
    }

    // ── Pick correct cost based on subscriber status ──────────
    const cost = isSubscriber
      ? LAYER_COST_SUBSCRIBER[layer]
      : LAYER_COST_FREEMIUM[layer];

    let sub = await Subscription.findOne({ userEmail: email, productId: PRODUCT_ID });

    if (!sub) {
      sub = await Subscription.create({
        userEmail: email,
        productId: PRODUCT_ID,
        productName: "Naavi Platform",
        billingMethod: "credit_only",
        status: "expired",
        tier: "credit_only",
        planTier: "standard",
        unlockedSteps: [],
      });
    }

    const alreadyUnlocked = sub.unlockedSteps?.some(
      (u) => u.step_id === step_id && u.layer === layer
    );
    if (alreadyUnlocked) {
      return res.status(409).json({
        status: false,
        message: `${layer} is already unlocked for this step`,
      });
    }

    const balance = await getWalletBalance(email);
    if (balance < cost) {
      return res.status(400).json({
        status: false,
        message: `Insufficient credits. You need ${cost} but have ${balance}.`,
        balance,
      });
    }

    await VaultTransaction.create({
      email,
      type: "debit",
      amount: cost,
      metadata: {
        type: "step_unlock",
        description: `Unlocked ${layer.charAt(0).toUpperCase() + layer.slice(1)} View`,
        source: "step_unlock",
        step_id,
        layer,
        isSubscriber: !!isSubscriber,
      },
    });

    sub.unlockedSteps.push({
      step_id,
      layer,
      credits_spent: cost,
      unlocked_at: new Date(),
    });
    await sub.save();

    const remaining = balance - cost;

    return res.json({
      status: true,
      message: `${layer} view unlocked successfully!`,
      credits_spent: cost,
      remainingBalance: remaining,
    });
  } catch (err) {
    console.error("[ERROR] unlockStep error:", err);
    return res.status(500).json({ status: false, error: err.message });
  }
};

module.exports = {
  createSubscription,
  checkStatus,
  getUserSubscriptions,
  cancelSubscription,
  renewSubscription,
  getAllSubscriptions,
  checkStepUnlock,
  unlockStep,
};