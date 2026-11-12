import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button, Pagination, Input, Select } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import ResponsiveDatePicker from '../../components/ResponsiveDatePicker/ResponsiveDatePicker';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  FiDownload,
  FiFilter,
  FiCalendar,
  FiGlobe,
  FiUser,
  FiSearch,
  FiEye
} from 'react-icons/fi';
import './VisitorsList.scss';

dayjs.extend(relativeTime);

const { Option } = Select;
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Fallback used whenever a value isn't present on the visitor/contact record
const EMPTY = 'Unknown';
const val = (v) => {
  if (v === undefined || v === null) return EMPTY;
  const str = String(v).trim();
  if (
    str === '' ||
    str === '―' ||
    str === '-' ||
    str.toLowerCase() === 'local' ||
    str.toLowerCase() === 'localhost' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'undefined'
  ) {
    return EMPTY;
  }
  return str;
};

const VisitorsList = () => {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, countries: 0, today: 0 });

  const visitorsPerPage = 10;

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${BASE_URL}/api/admin-visitors`);
        const data = res.data || [];
        setVisitors(data);
        setFilteredVisitors(data);

        const today = dayjs().startOf('day');
        const todayCount = data.filter(v => dayjs(v.createdAt).isSame(today, 'day')).length;
        const countries = new Set(data.map(v => v.country).filter(Boolean));

        setStats({ total: data.length, countries: countries.size, today: todayCount });
      } catch (err) {
        console.error("Error fetching visitors", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  useEffect(() => {
    let filtered = [...visitors];

    if (startDate && endDate) {
      filtered = filtered.filter(v => {
        const created = dayjs(v.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day')) &&
               created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    } else if (startDate) {
      filtered = filtered.filter(v => {
        const created = dayjs(v.createdAt);
        return created.isAfter(dayjs(startDate).subtract(1, 'day'));
      });
    } else if (endDate) {
      filtered = filtered.filter(v => {
        const created = dayjs(v.createdAt);
        return created.isBefore(dayjs(endDate).add(1, 'day'));
      });
    }

    if (countryFilter) {
      filtered = filtered.filter(v =>
        v.country?.toLowerCase() === countryFilter.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(v =>
        v.ip?.toLowerCase().includes(term) ||
        v.city?.toLowerCase().includes(term) ||
        v.region?.toLowerCase().includes(term) ||
        v.country?.toLowerCase().includes(term) ||
        v.fullName?.toLowerCase().includes(term) ||
        v.name?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.organization?.toLowerCase().includes(term)
      );
    }

    setFilteredVisitors(filtered);
    setCurrentPage(1);
  }, [startDate, endDate, countryFilter, searchTerm, visitors]);

  const indexOfLast = currentPage * visitorsPerPage;
  const indexOfFirst = indexOfLast - visitorsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirst, indexOfLast);

  const getCity = (v) => val(v.city);
  const getRegion = (v) => val(v.region);
  const getPostal = (v) => val(v.postalCode);
  const getCountry = (v) => val(v.country);

  const exportData = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = filteredVisitors.map((v, i) => ({
        SNo: i + 1,
        IPAddress: v.ip,
        City: getCity(v),
        Region: getRegion(v),
        PostalCode: getPostal(v),
        Country: getCountry(v),
        FullName: v.fullName || v.name,
        Email: v.email,
        Organization: v.organization,
        AreaOfInterest: v.areaOfInterest,
        ProjectStage: v.projectStage,
        Phone: v.phone,
        Message: v.message,
        VisitedOn: dayjs(v.createdAt).format('MMM DD, YYYY hh:mm A'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(fileData, `Visitors_${dayjs().format('YYYY-MM-DD')}.xlsx`);
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
    setCountryFilter('');
    setSearchTerm('');
  };

  const getCountryFlag = (countryCode) => {
    return <FiGlobe style={{ verticalAlign: 'middle', marginRight: 4 }} />;
  };

  const getUniqueCountries = () => {
    return [...new Set(visitors.map(v => v.country).filter(Boolean))].sort();
  };

  const hasFilters = startDate || endDate || countryFilter || searchTerm;

  return (
    <div className="visitors-list">
      {/* Header */}
      <div className="visitors-list__header">
        <div>
          <p className="visitors-list__subtitle">Track and analyze website traffic</p>
        </div>
        <div className="visitors-list__actions">
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
      <div className="visitors-list__stats">
        <div className="stat-pill stat-pill--green">
          <FiEye className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.total}</span>
          <span className="stat-pill__label">Total</span>
        </div>
        <div className="stat-pill stat-pill--blue">
          <FiGlobe className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.countries}</span>
          <span className="stat-pill__label">Countries</span>
        </div>
        <div className="stat-pill stat-pill--yellow">
          <FiCalendar className="stat-pill__icon" />
          <span className="stat-pill__value">{stats.today}</span>
          <span className="stat-pill__label">Today</span>
        </div>
      </div>

      {/* Filters */}
      <div className="visitors-list__filters">
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
          <div className="filter-label"><FiGlobe /> Country</div>
          <Select
            size="small"
            value={countryFilter || undefined}
            onChange={(val) => setCountryFilter(val || '')}
            placeholder="All"
            className="filter-select"
            allowClear
          >
            {getUniqueCountries().map((country, idx) => (
              <Option key={idx} value={country}>
                {getCountryFlag(country)} {country}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-item">
          <div className="filter-label"><FiSearch /> Search</div>
          <Input
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="IP, city, region..."
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

      {/* Summary */}
      <div className="visitors-list__summary">
        <span>{filteredVisitors.length} visitor{filteredVisitors.length !== 1 ? 's' : ''}</span>
        {countryFilter && <span className="summary-badge">{getCountryFlag(countryFilter)} {countryFilter}</span>}
        {(startDate || endDate) && <span className="summary-badge">Date range</span>}
      </div>

      {/* Table */}
      <div className="visitors-list__table-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : currentVisitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p>No visitors found</p>
            {visitors.length > 0 && (
              <Button size="small" onClick={clearFilters} type="link">Clear filters</Button>
            )}
          </div>
        ) : (
          <table className="visitors-table">
            <thead>
              <tr>
                <th className="col-sn">#</th>
                <th className="col-ip">IP Address</th>
                <th className="col-city">City</th>
                <th className="col-region">Region</th>
                <th className="col-postal">Postal Code</th>
                <th className="col-country">Country</th>
                <th className="col-date">Visited On</th>
              </tr>
            </thead>
            <tbody>
              {currentVisitors.map((visitor, idx) => (
                <tr key={visitor._id || idx}>
                  <td className="col-sn">{indexOfFirst + idx + 1}</td>
                  <td className="col-ip">
                    <div className="ip-cell">
                      <FiUser className="ip-icon" />
                      <span className="ip-address">{visitor.ip || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="col-city">{getCity(visitor)}</td>
                  <td className="col-region">
                    <span className="region-badge">{getRegion(visitor)}</span>
                  </td>
                  <td className="col-postal">{getPostal(visitor)}</td>
                  <td className="col-country">{getCountry(visitor)}</td>
                  <td className="col-date">
                    <div className="date-wrap">
                      <span className="date">{dayjs(visitor.createdAt).format('MMM DD, YYYY')}</span>
                      <span className="time">{dayjs(visitor.createdAt).format('hh:mm A')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredVisitors.length > visitorsPerPage && (
        <div className="visitors-list__pagination">
          <Pagination
            current={currentPage}
            total={filteredVisitors.length}
            pageSize={visitorsPerPage}
            onChange={setCurrentPage}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default VisitorsList;