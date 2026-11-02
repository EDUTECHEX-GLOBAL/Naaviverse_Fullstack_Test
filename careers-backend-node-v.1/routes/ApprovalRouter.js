const express = require("express");
const router = express.Router();
const ApprovalController = require("../controllers/ApprovalController");

router.post("/create", ApprovalController.createApproval);

// GET all approvals (admin)
router.get("/get", ApprovalController.getApprovals);

// [OK] NEW: GET approval status by email
// Usage: GET /api/approval/status?email=xxx@gmail.com
router.get("/status", ApprovalController.getApprovalByEmail);

// UPDATE approval status by id
router.put("/update/:id", ApprovalController.updateApproval);

// ACTIVATE / REACTIVATE user/partner approval by id
router.put("/activate/:id", ApprovalController.activateApproval);

// DEACTIVATE user/partner approval by id
router.put("/deactivate/:id", ApprovalController.deactivateApproval);

// DELETE user/partner approval and DB user/partner by id
router.delete("/delete/:id", ApprovalController.deleteApproval);

module.exports = router;
