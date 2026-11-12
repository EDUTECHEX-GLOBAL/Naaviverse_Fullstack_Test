const express = require("express");
const router = express.Router();
const { chat, health } = require("../controllers/ChatbotController");

// Health check
router.get("/health", health);

// Main chat completion endpoint
router.post("/chat", chat);

module.exports = router;

