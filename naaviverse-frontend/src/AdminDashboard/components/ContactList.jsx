import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Pagination, Button, Input, message as antMessage } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import {
  FiDownload,
  FiFilter,
  FiCalendar,
  FiSearch,
  FiX,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiSend,
  FiUser,
  FiUsers,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import ResponsiveDatePicker from '../../components/ResponsiveDatePicker/ResponsiveDatePicker';
import CustomSelect from '../../pages/accDashbaoard/CustomSelect';
import './ContactList.scss';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const INQUIRY_CONFIG = {
  WHAT_IS_NAAVI: { label: "What is Naavi?", question: "What is Naavi and how does it work?", tagClass: "tag-blue" },
  PATHWAY_ENGINE: { label: "AI Pathway Engine", question: "How does the AI Pathway Engine generate my path?", tagClass: "tag-purple" },
  SKILL_GAP: { label: "Skill Gap", question: "How does Naavi help bridge my skill gap?", tagClass: "tag-amber" },
  MENTOR_CONNECT: { label: "Mentor Connect", question: "How can I connect with mentors on Naavi?", tagClass: "tag-teal" },
  NAAVIVERSE: { label: "Naaviverse Ecosystem", question: "What is the Naaviverse ecosystem?", tagClass: "tag-cyan" },
  CAREER_PATHS: { label: "Career Paths", question: "Can Naavi help me switch careers or industries?", tagClass: "tag-indigo" },
  INSTITUTIONS: { label: "Institution Partnership", question: "How can my institution partner with Naavi?", tagClass: "tag-violet" },
  DEMO: { label: "Product Demo", question: "I'd like to request a product demo", tagClass: "tag-green" },
  PARTNERSHIP: { label: "Partnership Opportunity", question: "Explore a partnership opportunity", tagClass: "tag-pink" },
  OTHER: { label: "General Inquiry", question: "Something else", tagClass: "tag-gray" },
  OTHERS: { label: "General Inquiry", question: "Something else", tagClass: "tag-gray" },
  GROUND: { label: "Ground Inquiry", question: "Ground Level Inquiry", tagClass: "tag-orange" },
  DEFENCE: { label: "Defence Pathways", question: "Defence Career Pathways", tagClass: "tag-red" },
};

const QUICK_REPLIES = [
  "Thank you for contacting Naavi! We would be delighted to guide you through our AI Pathway Engine.",
  "Hello! Thank you for your inquiry. Our expert team is reviewing your request and will reach out shortly.",
  "Thanks for your interest in partnering with Naavi. We have scheduled an introduction call for you.",
  "Your question has been resolved. Please let us know if you need any additional assistance!",
];

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Modal / Drawer state for viewing & replying to enquiry
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("Replied");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const contactsPerPage = 10;

  // Lock body scroll when reply modal is open
  useEffect(() => {
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin-contact`);
      setContacts(res.data);
      setFilteredContacts(res.data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
      antMessage.error("Failed to fetch contacts list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    let filtered = [...contacts];

    // Filter by dates
    if (startDate && endDate) {
      filtered = filtered.filter((contact) => {
        const created = dayjs(contact.createdAt);
        return (
          created.isAfter(dayjs(startDate).subtract(1, 'day')) &&
          created.isBefore(dayjs(endDate).add(1, 'day'))
        );
      });
    } else if (startDate) {
      filtered = filtered.filter((contact) => {
        const created = dayjs(contact.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day'));
      });
    } else if (endDate) {
      filtered = filtered.filter((contact) => {
        const created = dayjs(contact.createdAt);
        return created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    }

    // Filter by Search Query (Name, Email, Mobile, Message, Question, Inquiry)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const name = (c.fullName || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const mobile = (c.mobile || "").toLowerCase();
        const msg = (c.message || "").toLowerCase();
        const question = (c.question || "").toLowerCase();
        const inqLabel = (INQUIRY_CONFIG[c.product]?.label || c.product || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          mobile.includes(q) ||
          msg.includes(q) ||
          question.includes(q) ||
          inqLabel.includes(q)
        );
      });
    }


    // Filter by Status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => (c.status || "Pending") === statusFilter);
    }

    // Sort latest first (descending order)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [startDate, endDate, searchQuery, statusFilter, contacts]);
  const indexOfLast = currentPage * contactsPerPage;
  const indexOfFirst = indexOfLast - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirst, indexOfLast);

  // Status stats
  const stats = useMemo(() => {
    let pending = 0;
    let replied = 0;
    let resolved = 0;
    contacts.forEach((c) => {
      const s = c.status || (c.replies?.length > 0 || c.reply ? "Replied" : "Pending");
      if (s === "Resolved") resolved++;
      else if (s === "Replied") replied++;
      else pending++;
    });
    return { total: contacts.length, pending, replied, resolved };
  }, [contacts]);

  const exportData = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = filteredContacts.map((c, i) => {
        const cfg = INQUIRY_CONFIG[c.product] || {};
        return {
          SNo: i + 1,
          Name: c.fullName || "—",
          Email: c.email || "—",
          Mobile: c.mobile || "—",
          InquiryType: cfg.label || c.product || c.inquiryType || "General Inquiry",
          Question: c.question || cfg.question || c.message || "—",
          Message: c.message || "—",
          Status: c.status || (c.replies?.length > 0 || c.reply ? "Replied" : "Pending"),
          RepliesCount: (c.replies?.length) || (c.reply ? 1 : 0),
          LatestReply: c.reply || (c.replies && c.replies[c.replies.length - 1]?.message) || "—",
          CreatedOn: new Date(c.createdAt).toLocaleString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts & Enquiries");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, `Enquiries_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
      antMessage.error("Failed to export data");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  const hasFilters = Boolean(
    startDate || endDate || searchQuery.trim() || statusFilter !== "ALL"
  );

  const openEnquiryModal = (contact) => {
    setSelectedContact(contact);
    setReplyText("");
    setReplyStatus(contact.status === "Resolved" ? "Resolved" : "Replied");
    setIsModalOpen(true);
  };

  const closeEnquiryModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    setReplyText("");
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedContact?._id) {
      antMessage.warning("Please type a reply message before sending.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      const res = await axios.post(`${BASE_URL}/api/admin-contact/${selectedContact._id}/reply`, {
        message: replyText.trim(),
        repliedBy: "Admin",
        status: replyStatus,
      });

      antMessage.success("Reply saved and recorded successfully!");
      const updatedContact = res.data.contact || {
        ...selectedContact,
        status: replyStatus,
        reply: replyText.trim(),
        replies: [
          ...(selectedContact.replies || []),
          { message: replyText.trim(), repliedBy: "Admin", repliedAt: new Date() },
        ],
      };

      // Update state in contact list
      setContacts((prev) =>
        prev.map((c) => (c._id === selectedContact._id ? { ...c, ...updatedContact } : c))
      );
      setSelectedContact(updatedContact);
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      antMessage.error(err.response?.data?.message || "Failed to send reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedContact?._id) return;
    try {
      const res = await axios.patch(`${BASE_URL}/api/admin-contact/${selectedContact._id}/status`, {
        status: newStatus,
      });
      antMessage.success(`Status updated to ${newStatus}`);
      const updated = res.data.contact || { ...selectedContact, status: newStatus };
      setSelectedContact(updated);
      setContacts((prev) =>
        prev.map((c) => (c._id === selectedContact._id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      antMessage.error("Failed to update status");
    }
  };

  const renderStatusBadge = (statusValue) => {
    const s = statusValue || "Pending";
    if (s === "Resolved") {
      return (
        <span className="contact-status-badge status-resolved">
          <FiCheckCircle size={11} /> Resolved
        </span>
      );
    }
    if (s === "Replied") {
      return (
        <span className="contact-status-badge status-replied">
          <FiMessageSquare size={11} /> Replied
        </span>
      );
    }
    return (
      <span className="contact-status-badge status-pending">
        <FiClock size={11} /> Pending
      </span>
    );
  };

  return (
    <div className="contact-list">
      {/* Header */}
      <div className="contact-list__header">
        <div>
          <h2 className="contact-list__title">User Inquiries &amp; Contacts</h2>
          <p className="contact-list__subtitle">
            Manage, review, and reply to all user questions and contact submissions from the Landing Page
          </p>
        </div>
        <div className="contact-list__actions">
          <Button
            size="small"
            onClick={exportData}
            icon={!isExporting ? <FiDownload size={11} /> : null}
            loading={isExporting}
            disabled={isExporting}
            type="primary"
            className={`btn-primary ${isExporting ? 'btn-exporting' : ''}`}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="contact-list__kpi-row">
        <div
          className={`stat-pill stat-pill--blue ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
          title="Show all enquiries"
          role="button"
          tabIndex={0}
        >
          <FiUsers className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.total}</span>
          <span className="stat-pill__label">Total</span>
        </div>
        <div
          className={`stat-pill stat-pill--yellow ${statusFilter === "Pending" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "ALL" : "Pending")}
          title="Filter pending enquiries"
          role="button"
          tabIndex={0}
        >
          <FiClock className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.pending}</span>
          <span className="stat-pill__label">Pending</span>
        </div>
        <div
          className={`stat-pill stat-pill--pink ${statusFilter === "Replied" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Replied" ? "ALL" : "Replied")}
          title="Filter replied enquiries"
          role="button"
          tabIndex={0}
        >
          <FiMessageSquare className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.replied}</span>
          <span className="stat-pill__label">Replied</span>
        </div>
        <div
          className={`stat-pill stat-pill--green ${statusFilter === "Resolved" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Resolved" ? "ALL" : "Resolved")}
          title="Filter resolved enquiries"
          role="button"
          tabIndex={0}
        >
          <FiCheckCircle className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.resolved}</span>
          <span className="stat-pill__label">Resolved</span>
        </div>
      </div>

      {/* Filters */}
      <div className="contact-list__filters">
        <div className="filter-item">
          <div className="filter-label"><FiCalendar /> Start</div>
          <ResponsiveDatePicker
            value={startDate}
            onChange={(e) => setStartDate(e?.target ? e.target.value : (e || null))}
            format="MMM DD, YYYY"
            placeholder="Start date"
            className="filter-date"
            allowClear
            showToday
          />
        </div>

        <div className="filter-item">
          <div className="filter-label"><FiCalendar /> End</div>
          <ResponsiveDatePicker
            value={endDate}
            onChange={(e) => setEndDate(e?.target ? e.target.value : (e || null))}
            format="MMM DD, YYYY"
            placeholder="End date"
            className="filter-date"
            allowClear
            showToday
          />
        </div>

        <div className="filter-item">
          <div className="filter-label"><FiSearch /> Search</div>
          <Input
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, query..."
            className="filter-search"
            allowClear
          />
        </div>

        {hasFilters && (
          <div className="filter-item filter-item--clear">
            <div className="filter-label filter-label--empty">&nbsp;</div>
            <Button
              size="small"
              onClick={clearFilters}
              icon={<FiFilter size={11} />}
              className="btn-outline filter-clear-btn"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="contact-list__stats">
        <span>Showing {filteredContacts.length} of {contacts.length} total enquiries</span>
      </div>

      {/* Table */}
      <div className="contact-list__table-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : currentContacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <p>No enquiries match your search or filter criteria</p>
            {hasFilters && (
              <Button size="small" onClick={clearFilters} type="link">Clear all filters</Button>
            )}
          </div>
        ) : (
          <table className="contact-table">
            <thead>
              <tr>
                <th className="col-sn">#</th>
                <th className="col-name">Name</th>
                <th className="col-email">Email</th>
                <th className="col-mobile">Mobile</th>
                <th className="col-inquiry">Question</th>
                <th className="col-message">Message</th>
                <th className="col-status">Status</th>
                <th className="col-date">Created</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map((contact, idx) => {
                const cfg = INQUIRY_CONFIG[contact.product] || INQUIRY_CONFIG.OTHER;
                const questionText = contact.question || cfg.question || contact.product || "General Inquiry";

                const repliesCount = (contact.replies?.length) || (contact.reply ? 1 : 0);

                return (
                  <tr key={contact._id || idx}>
                    <td className="col-sn">{indexOfFirst + idx + 1}</td>
                    <td className="col-name">
                      <span className="name-text">{contact.fullName}</span>
                    </td>
                    <td className="col-email">
                      <a href={`mailto:${contact.email}`} className="email-link" title={`Email ${contact.fullName}`}>
                        {contact.email}
                      </a>
                    </td>
                    <td className="col-mobile">{contact.mobile || '—'}</td>
                    <td className="col-inquiry">
                      <span className="question-title" title={questionText}>
                        {questionText}
                      </span>
                    </td>
                    <td className="col-message">
                      <span className="message-content" title={contact.message}>
                        {contact.message || '—'}
                      </span>
                    </td>
                    <td className="col-status">
                      {renderStatusBadge(contact.status)}
                    </td>
                    <td className="col-date">
                      <div className="date-wrap">
                        <span className="date">{dayjs(contact.createdAt).format('MMM DD, YYYY')}</span>
                        <span className="time">{dayjs(contact.createdAt).format('hh:mm A')}</span>
                      </div>
                    </td>
                    <td className="col-action">
                      <button
                        type="button"
                        className="btn-view-reply"
                        onClick={() => openEnquiryModal(contact)}
                        title="View enquiry details and send reply"
                      >
                        <FiMessageSquare size={13} />
                        <span>Reply</span>
                        {repliesCount > 0 && <span className="reply-count-badge">{repliesCount}</span>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredContacts.length > contactsPerPage && (
        <div className="contact-list__pagination">
          <Pagination
            current={currentPage}
            total={filteredContacts.length}
            pageSize={contactsPerPage}
            onChange={setCurrentPage}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}

      {/* Modal / Drawer for Enquiry Details & Admin Reply */}
      {isModalOpen && selectedContact && (
        <div className="enquiry-modal-backdrop" onClick={closeEnquiryModal}>
          <div
            className="enquiry-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="enquiry-modal__header">
              <div className="modal-title-group">
                <span className="modal-eyebrow">ENQUIRY &amp; REPLY</span>
                <h3 className="modal-title">
                  Inquiry from {selectedContact.fullName}
                </h3>
              </div>
              <div className="modal-header-actions">
                <div className="status-selector-wrap">
                  <label>Status:</label>
                  <div className="modal-status-select-box">
                    <CustomSelect
                      value={selectedContact.status || "Pending"}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      options={[
                        { label: "Pending", value: "Pending" },
                        { label: "Replied", value: "Replied" },
                        { label: "Resolved", value: "Resolved" },
                      ]}
                      placeholder="Status"
                      searchable={false}
                      className="contact-custom-select modal-status-custom-select"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeEnquiryModal}
                  aria-label="Close modal"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="enquiry-modal__body">
              {/* User Information Card */}
              <div className="user-info-card">
                <div className="user-info-item">
                  <span className="icon"><FiUser /></span>
                  <div>
                    <div className="label">Sender Name</div>
                    <div className="val font-semibold">{selectedContact.fullName}</div>
                  </div>
                </div>

                <div className="user-info-item">
                  <span className="icon"><FiMail /></span>
                  <div>
                    <div className="label">Email Address</div>
                    <a href={`mailto:${selectedContact.email}`} className="val email-val">
                      {selectedContact.email}
                    </a>
                  </div>
                </div>

                <div className="user-info-item">
                  <span className="icon"><FiPhone /></span>
                  <div>
                    <div className="label">Phone / Mobile</div>
                    <div className="val">{selectedContact.mobile || "Not provided"}</div>
                  </div>
                </div>

                <div className="user-info-item">
                  <span className="icon"><FiCalendar /></span>
                  <div>
                    <div className="label">Submitted Date</div>
                    <div className="val">
                      {dayjs(selectedContact.createdAt).format("MMM DD, YYYY [at] hh:mm A")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Question & Message Details */}
              <div className="enquiry-details-box">
                <div className="enquiry-question-banner">
                  <span className="question-tag">Selected Question / Inquiry Type</span>
                  <h4 className="question-text">
                    {selectedContact.question ||
                      INQUIRY_CONFIG[selectedContact.product]?.question ||
                      selectedContact.product ||
                      "General Inquiry"}
                  </h4>
                </div>

                <div className="enquiry-message-card">
                  <div className="message-header">
                    <span className="message-header-title">User's Message:</span>
                    <span className="message-date">
                      {dayjs(selectedContact.createdAt).format("MMM DD, YYYY hh:mm A")}
                    </span>
                  </div>
                  <div className="message-body">
                    {selectedContact.message || "(No message entered)"}
                  </div>
                </div>
              </div>

              {/* Reply History Section */}
              <div className="reply-history-section">
                <h4 className="section-title">
                  <FiMessageSquare /> Previous Replies (
                  {(selectedContact.replies?.length) || (selectedContact.reply ? 1 : 0)}
                  )
                </h4>

                {selectedContact.replies && selectedContact.replies.length > 0 ? (
                  <div className="replies-list">
                    {selectedContact.replies.map((r, i) => (
                      <div key={r._id || i} className="reply-item">
                        <div className="reply-item-header">
                          <span className="reply-sender">{r.repliedBy || "Admin"}</span>
                          <span className="reply-time">
                            {dayjs(r.repliedAt || selectedContact.updatedAt).format("MMM DD, YYYY hh:mm A")}
                          </span>
                        </div>
                        <div className="reply-item-message">{r.message}</div>
                      </div>
                    ))}
                  </div>
                ) : selectedContact.reply ? (
                  <div className="replies-list">
                    <div className="reply-item">
                      <div className="reply-item-header">
                        <span className="reply-sender">{selectedContact.repliedBy || "Admin"}</span>
                        <span className="reply-time">
                          {selectedContact.repliedAt
                            ? dayjs(selectedContact.repliedAt).format("MMM DD, YYYY hh:mm A")
                            : "Replied"}
                        </span>
                      </div>
                      <div className="reply-item-message">{selectedContact.reply}</div>
                    </div>
                  </div>
                ) : (
                  <div className="no-replies-box">
                    <FiClock className="no-replies-icon" />
                    <span>No replies sent to this user yet. You can respond below.</span>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="reply-form-section">
                <div className="reply-form-header">
                  <h4 className="section-title">Send Reply to {selectedContact.fullName}</h4>
                  <span className="reply-target-email">Replying via {selectedContact.email}</span>
                </div>

                {/* Quick Canned Replies */}
                <div className="quick-replies-wrap">
                  <span className="quick-replies-label">Quick Templates:</span>
                  <div className="quick-replies-chips">
                    {QUICK_REPLIES.map((qr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="quick-reply-chip"
                        onClick={() => setReplyText(qr)}
                      >
                        {qr.slice(0, 36)}...
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="reply-form">
                  <textarea
                    rows={4}
                    className="reply-textarea"
                    placeholder={`Write your response to ${selectedContact.fullName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />

                  <div className="reply-form-footer">
                    <div className="reply-status-toggle">
                      <label>After replying, set status to:</label>
                      <div className="reply-status-select-box">
                        <CustomSelect
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          options={[
                            { label: "Replied", value: "Replied" },
                            { label: "Resolved", value: "Resolved" },
                          ]}
                          placeholder="Select status"
                          searchable={false}
                          className="contact-custom-select reply-status-custom-select"
                        />
                      </div>
                    </div>

                    <div className="reply-action-buttons">
                      <Button onClick={closeEnquiryModal} className="btn-cancel">
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmittingReply}
                        icon={<FiSend size={13} />}
                        className="btn-submit-reply"
                      >
                        {isSubmittingReply ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
