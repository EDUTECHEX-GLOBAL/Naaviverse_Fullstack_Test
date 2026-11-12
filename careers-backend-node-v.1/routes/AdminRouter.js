const router = require("express").Router();
const {
  login,
  forgotPassword,
  updatePassword,
} = require("../controllers/AdminController");

router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/forgot-password", forgotPassword);
router.post("/updatepassword", updatePassword);
router.post("/update-password", updatePassword);

module.exports = router;
