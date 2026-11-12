const stepModel = require('../models/StepsModel');
const serviceModel = require('../models/ServicesModel');
const pathModel = require('../models/PathModel');
const axios = require('axios');
const mongoose = require('mongoose');

// [OK] Activity logging
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
// ADD STEP — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const addStep = async (req, res) => {
  try {
    const pathId = req.body.path_id || req.query.path_id;

    if (!pathId) {
      return res.json({ status: false, message: "path_id is required to create a step" });
    }

    const existingPath = await pathModel.findById(pathId);
    if (!existingPath) {
      return res.json({ status: false, message: "Invalid path_id" });
    }

    const createStep = {
      email: req.body.email,
      name: req.body.name,
      description: req.body.description,
      length: req.body.length,
      cost: req.body.cost,
      gradeData: req.body.gradeData || [],
      curriculumData: req.body.curriculumData || [],
      financialData: req.body.financialData || [],
      streamData: req.body.streamData || [],
      gradePointAverageData: req.body.gradePointAverageData || [],
      personalityData: req.body.personalityData || [],
      micro_description: req.body.micro_description,
      micro_name: req.body.micro_name,
      micro_length: req.body.micro_length,
      micro_access: req.body.micro_access,
      micro_instructions: req.body.micro_instructions,
      micro_chances: req.body.micro_chances,
      microservices: req.body.microservices || [],
      micro_marketplace: req.body.micro_marketplace || [],
      macro_description: req.body.macro_description,
      macro_name: req.body.macro_name,
      macro_length: req.body.macro_length,
      macro_access: req.body.macro_access,
      macro_instructions: req.body.macro_instructions,
      macro_chances: req.body.macro_chances,
      macroservices: req.body.macroservices || [],
      macro_marketplace: req.body.macro_marketplace || [],
      nano_description: req.body.nano_description,
      nano_name: req.body.nano_name,
      nano_length: req.body.nano_length,
      nano_access: req.body.nano_access,
      nano_instructions: req.body.nano_instructions,
      nano_chances: req.body.nano_chances,
      nanoservices: req.body.nanoservices || [],
      nano_marketplace: req.body.nano_marketplace || [],
      step_order: req.body.step_order,
      path_id: pathId,
      status: req.body.status || "active",
    };

    const step = await stepModel.create(createStep);

    await pathModel.findByIdAndUpdate(
      pathId,
      { $push: { the_ids: { step_id: step._id } } },
      { new: true }
    );

    // [OK] Log step created activity
    if (req.body.email) {
      const { displayName, partnerType } = await getPartnerInfo(req.body.email);
      const pathName = existingPath?.name || existingPath?.title || "a path";
      logEvent({
        role:        "partner",
        email:       req.body.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Step Created: ${req.body.name || "New Step"}`,
        desc:        `Added step "${req.body.name || "New Step"}" to path "${pathName}"`,
      }).catch(err => console.error("logEvent addStep error:", err));
    }

    return res.json({ status: true, message: "Step created and linked to path", data: step });

  } catch (error) {
    console.error("addStep error:", error);
    return res.json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET STEPS
// ─────────────────────────────────────────────────────────────────────────────
const getSteps = async (req, res) => {
  try {
    let filter = {};
    const pathId = req.query.path_id || req.body.path_id;

    if (pathId) {
      const pathObjId = mongoose.Types.ObjectId.isValid(pathId) ? new mongoose.Types.ObjectId(pathId) : null;
      let stepIds = [];
      try {
        const path = await pathModel.findById(pathObjId || pathId).lean();
        if (path && Array.isArray(path.the_ids)) {
          stepIds = path.the_ids
            .map((s) => s?.step_id)
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        }
      } catch (e) {
        console.warn("Could not lookup path the_ids in getSteps:", e.message);
      }

      const orMatchers = [];
      if (pathObjId) orMatchers.push({ path_id: pathObjId });
      orMatchers.push({ path_id: String(pathId) });
      if (stepIds.length > 0) {
        orMatchers.push({ _id: { $in: stepIds } });
      }

      filter.$or = orMatchers;
    }

    if (req.query.status) {
      filter.status = req.query.status === "all" ? { $ne: "delete" } : req.query.status;
    } else {
      filter.status = "active";
    }

    const steps = await stepModel
      .find(filter)
      .populate({ path: "services", model: "naavi_services" })
      .sort({ step_order: 1, createdAt: 1 });

    return res.json({ status: true, total: steps.length, data: steps });
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STEP — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const updateStep = async (req, res) => {
  try {
    const updateData = {};

    const fields = [
      'name', 'description', 'length', 'cost', 'step_order', 'status',
      'macro_name', 'macro_description', 'macro_length', 'macro_access',
      'macro_instructions', 'macro_chances', 'macroservices', 'macro_marketplace',
      'micro_name', 'micro_description', 'micro_length', 'micro_access',
      'micro_instructions', 'micro_chances', 'microservices', 'micro_marketplace',
      'nano_name', 'nano_description', 'nano_length', 'nano_access',
      'nano_instructions', 'nano_chances', 'nanoservices', 'nano_marketplace',
    ];

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    if (req.body.path_id) {
      const pathExists = await pathModel.findById(req.body.path_id);
      if (!pathExists) {
        return res.json({ status: false, message: "Invalid path_id" });
      }
      updateData.path_id = req.body.path_id;
    }

    const updatedStep = await stepModel.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: "delete" } },
      { $set: updateData },
      { new: true }
    );

    if (!updatedStep) {
      return res.json({ status: false, message: "Step not found or inactive" });
    }

    // [OK] Log step updated activity
    const email = updatedStep.email || req.body.email;
    if (email) {
      const { displayName, partnerType } = await getPartnerInfo(email);
      logEvent({
        role:        "partner",
        email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Step Updated: ${updatedStep.name || "Step"}`,
        desc:        `Updated step "${updatedStep.name || "Step"}"`,
      }).catch(err => console.error("logEvent updateStep error:", err));
    }

    return res.json({ status: true, message: "Step updated", data: updatedStep });

  } catch (error) {
    console.error("updateStep error:", error);
    return res.json({ status: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT STEP — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const editStep = async (req, res) => {
  try {
    let stepId = req.params.id;
    console.log("Received stepId:", stepId, "Type:", typeof stepId);

    if (!stepId || typeof stepId !== "string") {
      return res.status(400).json({ status: false, message: "Step ID is missing or invalid" });
    }
    stepId = stepId.trim();

    if (!mongoose.Types.ObjectId.isValid(stepId)) {
      return res.status(400).json({ status: false, message: "Invalid step ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(stepId);
    let existingStep = await stepModel.findById(objectId);
    if (!existingStep) {
      return res.status(404).json({ status: false, message: "Step not found" });
    }

    let updateData = {};
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null && key !== "stepId") {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ status: false, message: "No valid fields provided for update" });
    }

    let updatedStep = await stepModel.findByIdAndUpdate(
      objectId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // [OK] Log step edited activity
    const email = existingStep.email || req.body.email;
    if (email) {
      const { displayName, partnerType } = await getPartnerInfo(email);
      logEvent({
        role:        "partner",
        email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Step Edited: ${updatedStep.name || existingStep.name || "Step"}`,
        desc:        `Edited step "${updatedStep.name || existingStep.name || "Step"}"`,
      }).catch(err => console.error("logEvent editStep error:", err));
    }

    return res.status(200).json({ status: true, message: "Step updated successfully", data: updatedStep });

  } catch (error) {
    console.error("Error updating step:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE STEP — logs "publish" event (as a content change)
// ─────────────────────────────────────────────────────────────────────────────
const deleteStep = async (req, res) => {
  try {
    const stepId = req.params.id;
    const step = await stepModel.findById(stepId);

    if (!step) {
      return res.status(404).json({ status: false, message: 'Step not found' });
    }

    if (step.status === "active") {
      const updatedStep = await stepModel.findByIdAndUpdate(
        stepId, { status: "inactive" }, { new: true }
      );

      // [OK] Log step deactivated
      if (step.email) {
        const { displayName, partnerType } = await getPartnerInfo(step.email);
        logEvent({
          role:        "partner",
          email:       step.email,
          displayName,
          partnerType,
          eventType:   "publish",
          title:       `Step Deactivated: ${step.name || "Step"}`,
          desc:        `Step "${step.name || "Step"}" moved to inactive`,
        }).catch(err => console.error("logEvent deleteStep error:", err));
      }

      return res.status(200).json({ status: true, message: 'Step moved to Inactive Steps', data: updatedStep });

    } else if (step.status === "inactive") {
      const deletedStep = await stepModel.findByIdAndDelete(stepId);

      // [OK] Log step permanently deleted
      if (step.email) {
        const { displayName, partnerType } = await getPartnerInfo(step.email);
        logEvent({
          role:        "partner",
          email:       step.email,
          displayName,
          partnerType,
          eventType:   "publish",
          title:       `Step Deleted: ${step.name || "Step"}`,
          desc:        `Step "${step.name || "Step"}" permanently deleted`,
        }).catch(err => console.error("logEvent deleteStep error:", err));
      }

      return res.status(200).json({ status: true, message: 'Step permanently deleted', data: deletedStep });

    } else {
      return res.status(400).json({ status: false, message: 'Invalid step status.' });
    }
  } catch (error) {
    console.error("Error in deleteStep:", error);
    return res.status(500).json({ status: false, message: 'An error occurred while processing the request.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE STEP STATUS — logs "publish" event
// ─────────────────────────────────────────────────────────────────────────────
const toggleStepStatus = async (req, res) => {
  try {
    const { stepId } = req.params;
    const step = await stepModel.findById(stepId);
    if (!step) {
      return res.status(404).json({ status: false, message: "Step not found" });
    }

    step.status = step.status === "active" ? "inactive" : "active";
    await step.save();

    // [OK] Log toggle activity
    if (step.email) {
      const { displayName, partnerType } = await getPartnerInfo(step.email);
      logEvent({
        role:        "partner",
        email:       step.email,
        displayName,
        partnerType,
        eventType:   "publish",
        title:       `Step ${step.status === "active" ? "Activated" : "Deactivated"}: ${step.name || "Step"}`,
        desc:        `Step "${step.name || "Step"}" is now ${step.status}`,
      }).catch(err => console.error("logEvent toggleStepStatus error:", err));
    }

    return res.json({ status: true, message: "Status updated", data: step });

  } catch (error) {
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESTORE STEP
// ─────────────────────────────────────────────────────────────────────────────
const restoreStep = async (req, res) => {
  let restoreStepData = await stepModel.findOneAndUpdate(
    { _id: req.params.id, status: "inactive" },
    { status: "active" },
    { new: true }
  );
  if (!restoreStepData) {
    return res.json({ status: false, message: 'Data not found' });
  }

  // [OK] Log restore activity
  if (restoreStepData.email) {
    const { displayName, partnerType } = await getPartnerInfo(restoreStepData.email);
    logEvent({
      role:        "partner",
      email:       restoreStepData.email,
      displayName,
      partnerType,
      eventType:   "publish",
      title:       `Step Restored: ${restoreStepData.name || "Step"}`,
      desc:        `Step "${restoreStepData.name || "Step"}" restored to active`,
    }).catch(err => console.error("logEvent restoreStep error:", err));
  }

  return res.json({ status: true, message: 'Step restored', data: restoreStepData });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET STEPS BY PARTNER
// ─────────────────────────────────────────────────────────────────────────────
const getStepsByPartner = async (req, res) => {
  try {
    const email = req.params.email || req.query.email;
    const status = req.query.status;

    if (!email) {
      return res.status(400).json({ status: false, message: "Email is required" });
    }

    let filter = { email };
    if (status && status !== "all") filter.status = status;

    const steps = await stepModel.find(filter).sort({ createdAt: -1 });
    return res.json({ status: true, total: steps.length, data: steps });

  } catch (error) {
    console.error("getStepsByPartner error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET STEP BY ID
// ─────────────────────────────────────────────────────────────────────────────
const getStepById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: "Invalid Step ID" });
    }
    const step = await stepModel.findById(id);
    if (!step) {
      return res.status(404).json({ status: false, message: "Step not found" });
    }
    res.json({ status: true, data: step });
  } catch (error) {
    console.error("Error fetching step:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES — unchanged, no activity needed
// ─────────────────────────────────────────────────────────────────────────────
const addServicesToStep = async (req, res) => {
  try {
    const { step_id, service_ids } = req.body;
    if (!step_id || !Array.isArray(service_ids)) {
      return res.status(400).json({ status: false, message: "Invalid input" });
    }
    const step = await stepModel.findById(step_id).populate({ path: "services", model: "naavi_services" });
    if (!step) {
      return res.status(404).json({ status: false, message: "Step not found" });
    }
    const currentServiceIds = (step.services || []).map(s => s._id.toString());
    const incomingIds = service_ids.map(id => new mongoose.Types.ObjectId(id));
    const merged = Array.from(
      new Set([...currentServiceIds, ...incomingIds.map(id => id.toString())])
    ).map(id => new mongoose.Types.ObjectId(id));
    step.services = merged;
    await step.save();
    await step.populate({ path: "services", model: "naavi_services" });
    return res.json({ status: true, message: "Services added", data: step });
  } catch (error) {
    console.error("Error attaching services to step:", error);
    return res.status(500).json({ status: false, message: "Internal server error", error: error.message });
  }
};

const getServicesForStep = async (req, res) => {
  const { step_id } = req.params;
  if (!step_id) {
    return res.status(400).json({ status: false, message: 'Invalid input. step_id is required.' });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(step_id)) {
      return res.status(400).json({ status: false, message: 'Invalid Step ID' });
    }
    const step = await stepModel.findById(step_id).populate({ path: "services", model: "naavi_services" });
    if (!step) {
      return res.status(404).json({ status: false, message: 'Step not found.' });
    }
    return res.json({ status: true, message: 'Services fetched successfully.', data: step.services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ status: false, message: 'Internal server error.', error: error.message });
  }
};

const removeServiceFromStep = async (req, res) => {
  try {
    const { stepId, serviceId } = req.params;
    if (!stepId || !serviceId) {
      return res.status(400).json({ status: false, message: "Missing stepId or serviceId" });
    }
    const step = await stepModel.findById(stepId);
    if (!step) {
      return res.status(404).json({ status: false, message: "Step not found" });
    }
    const serviceExists = step.services.map(s => s.toString()).includes(serviceId.toString());
    if (!serviceExists) {
      return res.status(404).json({ status: false, message: "Service not found in step" });
    }
    step.services = step.services.filter(service => service.toString() !== serviceId.toString());
    await step.save();
    return res.status(200).json({ status: true, message: "Service removed successfully", data: step });
  } catch (error) {
    console.error("Error removing service:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const getServicesOfStep = async (req, res) => {
  try {
    const { step_id } = req.params;
    if (!step_id) return res.status(400).json({ status: false, message: "step_id is required" });
    if (!mongoose.Types.ObjectId.isValid(step_id)) return res.status(400).json({ status: false, message: "Invalid step_id" });
    const step = await stepModel.findById(step_id).populate("services");
    if (!step) return res.status(404).json({ status: false, message: "Step not found" });
    return res.json({ status: true, total: step.services.length, data: step.services });
  } catch (error) {
    console.error("Error in getServicesOfStep:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
  }
};

const repairStepServices = async (req, res) => {
  try {
    const steps = await stepModel.find();
    let fixed = [];
    for (const step of steps) {
      const cleaned = step.services
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (JSON.stringify(cleaned) !== JSON.stringify(step.services)) {
        step.services = cleaned;
        await step.save();
        fixed.push(step._id);
      }
    }
    res.json({ status: true, message: "Repaired all steps", fixedSteps: fixed });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

const getAllServicesForRemove = async (req, res) => {
  try {
    const { step_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(step_id)) {
      return res.status(400).json({ status: false, message: "Invalid step_id" });
    }
    const step = await stepModel.findById(step_id);
    if (!step) return res.status(404).json({ status: false, message: "Step not found" });
    const allServices = await serviceModel.find({ status: "active" });
    const attachedServiceIds = (step.services || []).map(id => id.toString());
    const finalServices = allServices.map(service => ({
      ...service.toObject(),
      attached: attachedServiceIds.includes(service._id.toString())
    }));
    return res.json({ status: true, total: finalServices.length, data: finalServices });
  } catch (error) {
    console.error("getAllServicesForRemove error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const detachStepFromPath = async (req, res) => {
  try {
    const { stepId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(stepId)) {
      return res.status(400).json({ status: false, message: "Invalid step ID" });
    }
    const step = await stepModel.findById(stepId);
    if (!step) return res.status(404).json({ status: false, message: "Step not found" });
    const pathId = step.path_id;
    await pathModel.findByIdAndUpdate(pathId, { $pull: { the_ids: { step_id: stepId } } });
    step.path_id = null;
    await step.save();
    return res.json({ status: true, message: "Step detached from path successfully" });
  } catch (error) {
    console.error("Detach step error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const bulkUploadSteps = async (req, res) => {
  try {
    const { email, records } = req.body;
    if (!email) return res.json({ status: false, message: "Email is required" });
    if (!Array.isArray(records) || records.length === 0) return res.json({ status: false, message: "Records array is required" });
    if (records.some(r => !r.path_id)) return res.json({ status: false, message: "path_id is required for all steps" });
    const formatted = records.map((r) => ({ ...r, email, path_id: r.path_id, status: "active" }));
    const inserted = await stepModel.insertMany(formatted, { ordered: false });

    // [OK] Log bulk upload activity
    const { displayName, partnerType } = await getPartnerInfo(email);
    logEvent({
      role:        "partner",
      email,
      displayName,
      partnerType,
      eventType:   "publish",
      title:       `Bulk Upload: ${inserted.length} Steps`,
      desc:        `Uploaded ${inserted.length} steps in bulk`,
    }).catch(err => console.error("logEvent bulkUploadSteps error:", err));

    return res.json({ status: true, message: "Bulk steps inserted successfully", count: inserted.length });
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};

module.exports = {
  addStep,
  getSteps,
  updateStep,
  deleteStep,
  restoreStep,
  getStepsByPartner,
  getStepById,
  editStep,
  addServicesToStep,
  getServicesForStep,
  removeServiceFromStep,
  getServicesOfStep,
  repairStepServices,
  getAllServicesForRemove,
  bulkUploadSteps,
  detachStepFromPath,
  toggleStepStatus,
};
