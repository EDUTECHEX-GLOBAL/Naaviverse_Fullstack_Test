import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Pagination, Button } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import { FiDownload, FiFilter, FiCalendar } from 'react-icons/fi';
import ResponsiveDatePicker from '../../components/ResponsiveDatePicker/ResponsiveDatePicker';
import './ContactList.scss';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const contactsPerPage = 10;

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${BASE_URL}/api/admin-contact`);
        setContacts(res.data);
        setFilteredContacts(res.data);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    let filtered = [...contacts];

    if (startDate && endDate) {
      filtered = filtered.filter(contact => {
        const created = dayjs(contact.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day')) &&
               created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    } else if (startDate) {
      filtered = filtered.filter(contact => {
        const created = dayjs(contact.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day'));
      });
    } else if (endDate) {
      filtered = filtered.filter(contact => {
        const created = dayjs(contact.createdAt);
        return created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    }

    // Sort latest first (descending order)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [startDate, endDate, contacts]);

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const indexOfLast = currentPage * contactsPerPage;
  const indexOfFirst = indexOfLast - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirst, indexOfLast);

  const exportData = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = filteredContacts.map((c, i) => ({
        SNo: i + 1,
        Name: c.fullName,
        Email: c.email,
        Mobile: c.mobile,
        Message: c.message,
        CreatedOn: new Date(c.createdAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, `Contact_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const hasFilters = startDate || endDate;

  return (
    <div className="contact-list">
      {/* Header */}
      <div className="contact-list__header">
        <div>
          <p className="contact-list__subtitle">Manage and analyze all inquiries</p>
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

      {/* Filters - Date only */}
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
        <span>{filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}</span>
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
            <p>No submissions found</p>
            {contacts.length > 0 && (
              <Button size="small" onClick={clearFilters} type="link">Clear filters</Button>
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
                <th className="col-message">Message</th>
                <th className="col-date">Created</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map((contact, idx) => (
                <tr key={contact._id || idx}>
                  <td className="col-sn">{indexOfFirst + idx + 1}</td>
                  <td className="col-name">{contact.fullName}</td>
                  <td className="col-email">
                    <a href={`mailto:${contact.email}`} className="email-link">
                      {contact.email}
                    </a>
                  </td>
                  <td className="col-mobile">{contact.mobile}</td>
                  <td className="col-message">{contact.message || '—'}</td>
                  <td className="col-date">
                    <div className="date-wrap">
                      <span className="date">{dayjs(contact.createdAt).format('MMM DD, YYYY')}</span>
                      <span className="time">{dayjs(contact.createdAt).format('hh:mm A')}</span>
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default ContactList;
