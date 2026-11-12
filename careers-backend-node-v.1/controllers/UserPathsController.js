// controllers/userPaths.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// UPDATED: addUserPath now allows multiple active paths per user.
// Only blocks if the exact same path is already active (duplicate guard).
// ─────────────────────────────────────────────────────────────────────────────

const pathModel     = require('../models/PathModel');
const userPathModel = require('../models/UserPathsModel');
const userModel     = require('../models/UsersModel');
const mongoose      = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// ADD / SELECT A PATH
// ─────────────────────────────────────────────────────────────────────────────
const addUserPath = async (req, res) => {
    const cleanEmail = (req.body.email || "").trim();
    const emailRegex = new RegExp("^" + cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
    const pathObjId = mongoose.Types.ObjectId.isValid(req.body.pathId) ? new mongoose.Types.ObjectId(req.body.pathId) : req.body.pathId;

    // ── Check if already active ───────────────────────────────────────────
    let existingUserPath = await userPathModel.findOne({
        email:  emailRegex,
        pathId: pathObjId,
    });

    if (existingUserPath) {
        existingUserPath.status = "active";
        existingUserPath.updatedAt = new Date();
        await existingUserPath.save();
        await userModel.findOneAndUpdate({ email: emailRegex }, { selectedPath: req.body.pathId });
        return res.json({
            status:  true,
            message: "Path selected successfully",
            data:    existingUserPath,
        });
    }

    // ── Verify path exists and is active ─────────────────────────────────
    const existingPath = await pathModel.findOne({
        _id:    pathObjId,
        status: "active",
    });

    if (!existingPath) {
        return res.json({
            status:  false,
            message: "Path not found or not active",
        });
    }

    // ── Create a new userPath doc (allows multiple active paths) ──────────
    const path = await userPathModel.create({
        email:          cleanEmail.toLowerCase(),
        pathId:         pathObjId,
        status:         "active",
        completedSteps: [],
        currentStep:    "",
    });
    await userModel.findOneAndUpdate({ email: emailRegex }, { selectedPath: req.body.pathId });

    if (!path) {
        return res.json({
            status:  false,
            message: "Error creating user path",
        });
    }

    return res.json({
        status:  true,
        message: "Path selected successfully",
        data:    path,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET USER PATHS (all active paths for a user, or filtered)
// ─────────────────────────────────────────────────────────────────────────────
const getUserPath = async (req, res) => {
    let filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
        if (req.query.status === "all") filter = {};
    } else {
        filter.status = "active";
    }
    if (req.query.email) {
        const cleanEmail = req.query.email.trim();
        filter.email = new RegExp("^" + cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
    }

    userPathModel.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "paths",
                let: { pathId: "$pathId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$$pathId", "$_id"] },
                                    { $eq: ["$status", "active"] },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "career_steps",
                            let: { the_ids: "$the_ids.step_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $in: ["$_id", "$$the_ids"] },
                                                { $eq: ["$status", "active"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "StepDetails",
                        },
                    },
                ],
                as: "PathDetails",
            },
        },
    ])
        .then(userpaths => {
            if (userpaths.length === 0) {
                return res.json({ status: false, message: "No data found" });
            }
            return res.json({
                status:  true,
                total:   userpaths.length,
                message: "User Paths data found",
                data:    userpaths,
            });
        })
        .catch(err => {
            console.error("getUserPath error:", err);
            res.json({ status: false, message: err.message });
        });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER PATH (active, with current step resolved)
// ─────────────────────────────────────────────────────────────────────────────
const getCurrentUserPath = async (req, res) => {
    let filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
        if (req.query.status === "all") filter = {};
    } else {
        filter.status = "active";
    }
    if (req.query.email) filter.email = req.query.email;

    // If a specific pathId is given, filter to that path
    if (req.query.pathId) filter.pathId = new mongoose.Types.ObjectId(req.query.pathId);

    if (req.query.email) {
        const fetchCurrentStep = await userPathModel.findOne(filter);
        if (!fetchCurrentStep) {
            return res.json({ status: false, message: "No active path found" });
        }
        if (fetchCurrentStep.currentStep === "completed") {
            return res.json({ status: false, message: "All steps completed" });
        }
        if (!fetchCurrentStep.currentStep) {
            const fetchPathData = await pathModel.findOne({
                _id:    fetchCurrentStep.pathId,
                status: "active",
            });
            if (fetchPathData?.the_ids?.length) {
                await userPathModel.findOneAndUpdate(
                    filter,
                    { currentStep: fetchPathData.the_ids[0].step_id },
                    { new: true }
                );
            }
        }
    }

    userPathModel.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "career_steps",
                let: { currentStepObjectId: { $toObjectId: "$currentStep" } },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$currentStepObjectId"] },
                                    { $eq: ["$status", "active"] },
                                ],
                            },
                        },
                    },
                ],
                as: "StepDetails",
            },
        },
    ])
        .then(userpaths => {
            if (userpaths.length === 0) {
                return res.json({ status: false, message: "No data found" });
            }
            return res.json({
                status:  true,
                total:   userpaths.length,
                message: "User Paths data found",
                data:    userpaths,
            });
        })
        .catch(err => {
            console.error("getCurrentUserPath error:", err);
            res.json({ status: false, message: err.message });
        });
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE A STEP
// ─────────────────────────────────────────────────────────────────────────────
const completeStep = async (req, res) => {
    let updateData = {};
    try {
        // Find the path doc matching this pathId
        const currentPath = await pathModel.findOne({
            _id:    req.body.pathId,
            status: "active",
        });

        if (currentPath) {
            const currentIndex = currentPath.the_ids.findIndex(
                item => item.step_id.toString() === req.body.step_id.toString()
            );
            if (currentIndex !== -1 && currentIndex < currentPath.the_ids.length - 1) {
                updateData.currentStep = currentPath.the_ids[currentIndex + 1].step_id;
            }
            if (currentIndex === currentPath.the_ids.length - 1) {
                updateData.currentStep = "completed";
            }
        } else {
            return res.json({
                status:  false,
                message: "Step id not found / does not belong to the selected user path",
            });
        }
    } catch (error) {
        console.error(error);
        return res.json({ status: false, message: "Error finding next step" });
    }

    updateData = {
        ...updateData,
        $addToSet: { completedSteps: req.body.step_id },
    };

    // Update the specific path doc for this user
    const cleanEmail = (req.body.email || "").trim();
    const emailRegex = new RegExp("^" + cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
    const pathObjId = mongoose.Types.ObjectId.isValid(req.body.pathId) ? new mongoose.Types.ObjectId(req.body.pathId) : req.body.pathId;
    const filter = { email: emailRegex, pathId: pathObjId, status: "active" };
    const updated = await userPathModel.findOneAndUpdate(filter, updateData, { new: true });

    if (!updated) {
        return res.json({ status: false, message: "User path not found" });
    }
    return res.json({ status: true, message: "Step completed", data: updated });
};

// ─────────────────────────────────────────────────────────────────────────────
// FAIL A STEP (redirects to backup path)
// ─────────────────────────────────────────────────────────────────────────────
const failedStep = async (req, res) => {
    const checkStep = await userPathModel.findOne({
        email:  req.body.email,
        pathId: req.body.pathId,
        status: "active",
    });

    if (!checkStep) {
        return res.json({ status: false, message: "User path not found" });
    }
    if (checkStep.completedSteps.includes(req.body.step_id)) {
        return res.json({ status: false, message: "This step is already completed" });
    }

    const pathDetail = await pathModel.findOne({
        _id:              req.body.pathId,
        'the_ids.step_id': req.body.step_id,
        status:           "active",
    });

    if (!pathDetail) {
        return res.json({ status: false, message: "Step not found in path" });
    }

    const selectedStep = pathDetail.the_ids.find(
        item => item.step_id.toString() === req.body.step_id.toString()
    );

    const updateData = {
        pathId:         selectedStep.backup_pathId,
        completedSteps: [],
        currentStep:    "",
    };

    const updated = await userPathModel.findOneAndUpdate(
        { email: req.body.email, pathId: req.body.pathId, status: "active" },
        updateData,
        { new: true }
    );

    if (!updated) {
        return res.json({ status: false, message: "Failed to update path" });
    }
    return res.json({ status: true, message: "Path updated to backup", data: updated });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET USER PATHS BY PARTNER (for partner to see who enrolled in their paths)
// ─────────────────────────────────────────────────────────────────────────────
const getUserPathbyPartner = async (req, res) => {
    let filter = {};
    if (req.body.status) {
        filter.status = req.body.status;
        if (req.body.status === "all") filter = {};
    } else {
        filter.status = "active";
    }
    if (req.body.email) filter.email = req.body.email;

    pathModel.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "userpaths",
                let: { pathId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$$pathId", "$pathId"] },
                                    { $eq: ["$status", "active"] },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "naavi_users",
                            let: { email: "$email" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$email", "$$email"] },
                                                { $eq: ["$status", "active"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "UseDetails",
                        },
                    },
                ],
                as: "PathDetails",
            },
        },
        {
            $project: {
                _id:                           1,
                nameOfPath:                    1,
                "PathDetails._id":             1,
                "PathDetails.UseDetails._id":  1,
                "PathDetails.UseDetails.email":    1,
                "PathDetails.UseDetails.username": 1,
                "PathDetails.createdAt":       1,
            },
        },
    ])
        .then(userpaths => {
            if (userpaths.length === 0) {
                return res.json({ status: false, message: "No data found" });
            }
            const userdetails = [];
            for (const up of userpaths) {
                for (const pd of up.PathDetails) {
                    if (pd.UseDetails?.[0]) {
                        userdetails.push({
                            createdAt:  pd.createdAt,
                            username:   pd.UseDetails[0].username,
                            email:      pd.UseDetails[0].email,
                            nameOfPath: up.nameOfPath,
                        });
                    }
                }
            }
            return res.json({
                status:  true,
                total:   userdetails.length,
                message: "User Paths data found",
                data:    userdetails,
            });
        })
        .catch(err => {
            console.error("getUserPathbyPartner error:", err);
            res.json({ status: false, message: err.message });
        });
};

module.exports = {
    addUserPath,
    getUserPath,
    getCurrentUserPath,
    completeStep,
    failedStep,
    getUserPathbyPartner,
};