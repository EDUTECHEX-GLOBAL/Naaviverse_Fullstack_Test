const express = require('express');
const router = express.Router();
const Contact = require('../models/ContactModel');
const { validateEmail, validatePersonName } = require('../../utils/emailValidator');

const INQUIRY_LABELS = {
  WHAT_IS_NAAVI: "What is Naavi and how does it work?",
  PATHWAY_ENGINE: "How does the AI Pathway Engine generate my path?",
  SKILL_GAP: "How does Naavi help bridge my skill gap?",
  MENTOR_CONNECT: "How can I connect with mentors on Naavi?",
  NAAVIVERSE: "What is the Naaviverse ecosystem?",
  CAREER_PATHS: "Can Naavi help me switch careers or industries?",
  INSTITUTIONS: "How can my institution partner with Naavi?",
  DEMO: "I'd like to request a product demo",
  PARTNERSHIP: "Explore a partnership opportunity",
  OTHER: "Something else",
  OTHERS: "Something else",
  GROUND: "Ground Level Inquiry",
  DEFENCE: "Defence Career Pathways",
};

const resolveQuestion = (data) => {
  if (data.question && data.question.trim()) return data.question.trim();
  if (data.inquiryType && INQUIRY_LABELS[data.inquiryType]) return INQUIRY_LABELS[data.inquiryType];
  if (data.product && INQUIRY_LABELS[data.product]) return INQUIRY_LABELS[data.product];
  return data.inquiryType || data.product || "General Inquiry";
};

// POST — save message
router.post('/', async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const rawFullName = req.body.fullName || req.body.name || "Anonymous";
    const rawMobile = req.body.mobile || req.body.phone || "";
    const rawMessage = req.body.message || "";
    const rawProduct = req.body.product || req.body.inquiryType || "OTHER";
    const rawInquiryType = req.body.inquiryType || req.body.product || "OTHER";
    const rawSource = req.body.source || "Landing Page";

    if (!rawEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const validation = validateEmail(rawEmail);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const nameValidation = validatePersonName(rawFullName, "Full name");
    const cleanName = nameValidation.isValid ? nameValidation.cleanName : rawFullName.trim();

    const resolvedQ = resolveQuestion({
      question: req.body.question,
      inquiryType: rawInquiryType,
      product: rawProduct,
    });

    const newContact = await Contact.create({
      fullName: cleanName,
      email: validation.cleanEmail,
      mobile: rawMobile.trim(),
      message: rawMessage.trim(),
      product: rawProduct,
      inquiryType: rawInquiryType,
      question: resolvedQ,
      source: rawSource,
      status: req.body.status || 'Pending',
      replies: [],
    });

    res.status(201).json({ message: "Message saved successfully", contact: newContact });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ message: "Error saving message" });
  }
});

// GET — fetch all contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();

    // Normalize legacy entries to ensure question & status are populated
    const normalized = contacts.map(c => {
      const q = c.question || INQUIRY_LABELS[c.product] || INQUIRY_LABELS[c.inquiryType] || c.product || c.inquiryType || "General Inquiry";
      const s = c.status || ((c.replies && c.replies.length > 0) || c.reply ? 'Replied' : 'Pending');
      return {
        ...c,
        question: q,
        inquiryType: c.inquiryType || c.product || "OTHER",
        status: s,
        replies: c.replies || [],
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Error fetching contacts" });
  }
});

// GET /count
router.get('/count', async (req, res) => {
  try {
    const count = await Contact.countDocuments();
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching count" });
  }
});

// GET /:id — fetch single enquiry
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    const q = contact.question || INQUIRY_LABELS[contact.product] || INQUIRY_LABELS[contact.inquiryType] || contact.product || "General Inquiry";
    const s = contact.status || ((contact.replies && contact.replies.length > 0) || contact.reply ? 'Replied' : 'Pending');
    res.json({
      ...contact,
      question: q,
      inquiryType: contact.inquiryType || contact.product || "OTHER",
      status: s,
      replies: contact.replies || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving enquiry" });
  }
});

// POST /:id/reply — Admin replies to user enquiry
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, repliedBy = 'Admin', status = 'Replied' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Reply message cannot be empty" });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    const newReply = {
      message: message.trim(),
      repliedBy: repliedBy || 'Admin',
      repliedAt: new Date(),
    };

    contact.replies.push(newReply);
    contact.reply = newReply.message;
    contact.repliedAt = newReply.repliedAt;
    contact.repliedBy = newReply.repliedBy;
    contact.status = status || 'Replied';

    if (!contact.question) {
      contact.question = resolveQuestion(contact);
    }

    await contact.save();

    // Attempt optional email notification if transporter is configured
    try {
      const nodemailer = require('nodemailer');
      const emailUser = process.env.EMAIL_SERVICE_USER || process.env.BREVO_USER;
      const emailPass = process.env.EMAIL_SERVICE_PASS || process.env.BREVO_API_KEY;
      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: emailUser, pass: emailPass },
        });
        transporter.sendMail({
          from: `"Naavi Support" <${emailUser}>`,
          to: contact.email,
          subject: `Response to your inquiry: ${contact.question || "Naavi Support"}`,
          text: `Hello ${contact.fullName},\n\nThank you for reaching out to Naavi.\n\nHere is our response to your inquiry regarding "${contact.question || 'your inquiry'}":\n\n${newReply.message}\n\nBest regards,\nNaavi Team`,
        }).catch(err => console.log("Email notification skipped:", err.message));
      }
    } catch (e) {
      // SMTP optional, non-blocking
    }

    res.status(200).json({
      message: "Reply sent successfully",
      contact,
    });
  } catch (err) {
    console.error("Error replying to enquiry:", err);
    res.status(500).json({ message: "Error sending reply" });
  }
});

// PATCH /:id/status — update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Replied', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be Pending, Replied, or Resolved." });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Status updated successfully", contact });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

// PUT /:id/status (for compatibility)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Replied', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Status updated successfully", contact });
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
});

// DELETE /:id — delete enquiry
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.json({ message: "Enquiry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting enquiry" });
  }
});

module.exports = router;
