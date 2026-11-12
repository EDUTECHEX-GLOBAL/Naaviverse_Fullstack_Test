const express = require('express');
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  resetPassword, 
  loginSuperAdmin,
} = require('../controllers/AdminAuthController');
const {
  forgotPassword,
  updatePassword,
} = require('../../controllers/AdminController');


router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/super-login', loginSuperAdmin);
router.post('/reset', resetPassword);
router.post('/forgotPassword', forgotPassword);
router.post('/forgot-password', forgotPassword);
router.post('/updatepassword', updatePassword);
router.post('/update-password', updatePassword);

module.exports = router;