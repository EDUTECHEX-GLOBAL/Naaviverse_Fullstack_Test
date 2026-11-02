import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button, Pagination, Input } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import ResponsiveDatePicker from '../../components/ResponsiveDatePicker/ResponsiveDatePicker';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FiDownload, FiFilter, FiCalendar, FiMail, FiSearch, FiUsers } from 'react-icons/fi';
import './SubscriptionList.scss';

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, recent: 0, uniqueDomains: 0 });

  const subscriptionsPerPage = 10;

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${BASE_URL}/api/admin-subscribe`);
        const data = res.data || [];
        setSubscriptions(data);
        setFilteredSubscriptions(data);

        const today = dayjs().startOf('day');
        const recent = data.filter(sub =>
          dayjs(sub.createdAt).isAfter(today.subtract(7, 'day'))
        ).length;

        const domains = new Set();
        data.forEach(sub => {
          if (sub.email) {
            const domain = sub.email.split('@')[1];
            if (domain) domains.add(domain.toLowerCase());
          }
        });

        setStats({ total: data.length, recent, uniqueDomains: domains.size });
      } catch (err) {
        console.error("Failed to fetch subscriptions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    let filtered = [...subscriptions];

    if (startDate && endDate) {
      filtered = filtered.filter(sub => {
        const created = dayjs(sub.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day')) &&
               created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    } else if (startDate) {
      filtered = filtered.filter(sub => {
        const created = dayjs(sub.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day'));
      });
    } else if (endDate) {
      filtered = filtered.filter(sub => {
        const created = dayjs(sub.createdAt);
        return created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    }

    if (searchEmail.trim()) {
      const term = searchEmail.toLowerCase().trim();
      filtered = filtered.filter(sub => sub.email?.toLowerCase().includes(term));
    }

    // Sort latest first (descending order)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setFilteredSubscriptions(filtered);
    setCurrentPage(1);
  }, [startDate, endDate, searchEmail, subscriptions]);

  const indexOfLast = currentPage * subscriptionsPerPage;
  const indexOfFirst = indexOfLast - subscriptionsPerPage;
  const currentSubscriptions = filteredSubscriptions.slice(indexOfFirst, indexOfLast);

  const exportData = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = filteredSubscriptions.map((sub, i) => ({
        SNo: i + 1,
        Email: sub.email,
        SubscribedOn: dayjs(sub.createdAt).format('MMM DD, YYYY hh:mm A'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, `Subscriptions_${dayjs().format('YYYY-MM-DD')}.xlsx`);
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
    setSearchEmail('');
  };

  const getDomain = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1];
    return domain ? domain.split('.')[0] : '';
  };

  const hasFilters = startDate || endDate || searchEmail;

  return (
    <div className="subscription-list">
      {/* Header */}
      <div className="subscription-list__header">
        <div>
          <p className="subscription-list__subtitle">Manage and analyze subscriber data</p>
        </div>
        <div className="subscription-list__actions">
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

      {/* Stat Pills */}
      <div className="subscription-list__stats">
        <div className="stat-pill stat-pill--blue">
          <FiUsers className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.total}</span>
          <span className="stat-pill__label">Total</span>
        </div>
        <div className="stat-pill stat-pill--yellow">
          <FiCalendar className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.recent}</span>
          <span className="stat-pill__label">Last 7 days</span>
        </div>
        <div className="stat-pill stat-pill--green">
          <FiMail className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.uniqueDomains}</span>
          <span className="stat-pill__label">Domains</span>
        </div>
      </div>

      {/* Filters */}
      <div className="subscription-list__filters">
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
          <div className="filter-label"><FiSearch /> Email</div>
          <Input
            size="small"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search email..."
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

      {/* Stats bar */}
      <div className="subscription-list__summary">
        <span>{filteredSubscriptions.length} subscriber{filteredSubscriptions.length !== 1 ? 's' : ''}</span>
        {searchEmail && <span className="summary-badge">Search: {searchEmail}</span>}
        {(startDate || endDate) && <span className="summary-badge">Date range</span>}
      </div>

      {/* Table */}
      <div className="subscription-list__table-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : currentSubscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <p>No subscriptions found</p>
            {subscriptions.length > 0 && (
              <Button size="small" onClick={clearFilters} type="link">Clear filters</Button>
            )}
          </div>
        ) : (
          <table className="subscription-table">
            <thead>
              <tr>
                <th className="col-sn">#</th>
                <th className="col-email">Email</th>
                <th className="col-domain">Domain</th>
                <th className="col-date">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {currentSubscriptions.map((sub, idx) => (
                <tr key={sub._id || idx}>
                  <td className="col-sn">{indexOfFirst + idx + 1}</td>
                  <td className="col-email">
                    <div className="email-cell">
                      <FiMail className="email-icon" />
                      <a href={`mailto:${sub.email}`} className="email-link">
                        {sub.email}
                      </a>
                    </div>
                  </td>
                  <td className="col-domain">
                    <span className="domain-badge">{getDomain(sub.email)}</span>
                  </td>
                  <td className="col-date">
                    <div className="date-wrap">
                      <span className="date">{dayjs(sub.createdAt).format('MMM DD, YYYY')}</span>
                      <span className="time">{dayjs(sub.createdAt).format('hh:mm A')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredSubscriptions.length > subscriptionsPerPage && (
        <div className="subscription-list__pagination">
          <Pagination
            current={currentPage}
            total={filteredSubscriptions.length}
            pageSize={subscriptionsPerPage}
            onChange={setCurrentPage}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;
