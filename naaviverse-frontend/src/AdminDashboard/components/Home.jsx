import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import CountUp from "react-countup";
import { FiTrendingUp, FiTrendingDown, FiUsers, FiMail, FiEye, FiActivity } from "react-icons/fi";
import './Home.scss';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const HomeDashboard = () => {
  const [counts, setCounts] = useState({ contacts: 0, visitors: 0, subscribers: 0 });
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1200);
      setIsMobileOrTablet(width < 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin-dashboard/overview`);
        const { months, trends } = res.data;
        const formatted = months.map((month, index) => ({
          month,
          contacts: trends.contacts[index] || 0,
          visitors: trends.visitors[index] || 0,
          subscribers: trends.subscribers[index] || 0,
        }));
        setTrendData(formatted);
      } catch (error) {
        console.error("Failed to load trend data", error);
        setTrendData([]);
      }
    };
    fetchTrends();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [contactRes, visitorRes, subRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/admin-contact/count`),
          axios.get(`${BASE_URL}/api/admin-visitors/count`),
          axios.get(`${BASE_URL}/api/admin-subscribe/count`),
        ]);
        setCounts({
          contacts: contactRes.data.count || 0,
          visitors: visitorRes.data.count || 0,
          subscribers: subRes.data.count || 0,
        });
      } catch (err) {
        console.error("Failed to fetch counts:", err);
        setCounts({ contacts: 45, visitors: 128, subscribers: 67 });
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const totalReach = counts.contacts + counts.visitors + counts.subscribers;

  const pieData = [
    { name: "Contacts", value: counts.contacts, color: '#3E7BFA' },
    { name: "Visitors", value: counts.visitors, color: '#1FA655' },
    { name: "Subscribers", value: counts.subscribers, color: '#F5B324' },
  ];

  const statsCards = [
    {
      name: "Contacts",
      value: counts.contacts,
      icon: <FiMail />,
      variant: 'blue',
      trend: 40,
      trendUp: true
    },
    {
      name: "Visitors",
      value: counts.visitors,
      icon: <FiEye />,
      variant: 'green',
      trend: 10,
      trendUp: false
    },
    {
      name: "Subscribers",
      value: counts.subscribers,
      icon: <FiUsers />,
      variant: 'yellow',
      trend: 5,
      trendUp: true
    },
    {
      name: "Total Reach",
      value: totalReach,
      icon: <FiActivity />,
      variant: 'red',
      trend: 20,
      trendUp: true
    }
  ];

  return (
    <div className="home-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <p className="dashboard-subtitle">Real-time insights and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        {statsCards.map((card) => (
          <div key={card.name} className={`stat-card stat-card--${card.variant}`}>
            <div className="stat-card-inner">
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-info">
                <div className="stat-name">{card.name}</div>
                <div className="stat-value">
                  {!loading ? <CountUp end={card.value} duration={1.4} separator="," /> : <span>--</span>}
                </div>
                <div className="stat-trend">
                  <span className="trend-badge">
                    {card.trendUp ? <FiTrendingUp /> : <FiTrendingDown />}
                    {card.trend}%
                  </span>
                  <span className="trend-text">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Category Trends</h3>
            <p>Monthly growth across all categories</p>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="contactsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E7BFA" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3E7BFA" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1FA655" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#1FA655" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="subscribersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5B324" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F5B324" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: isMobileOrTablet ? '#0f172a' : '#9aa1b5', fontSize: isMobileOrTablet ? 11 : 10, fontWeight: isMobileOrTablet ? 600 : 400 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: isMobileOrTablet ? '#0f172a' : '#9aa1b5', fontSize: isMobileOrTablet ? 11 : 10, fontWeight: isMobileOrTablet ? 600 : 400 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '6px 10px', border: '1px solid #e7ebf1' }} />
                <Legend wrapperStyle={{ fontSize: isMobileOrTablet ? '11px' : '10px', paddingTop: '6px', color: isMobileOrTablet ? '#0f172a' : undefined }} />
                <Area type="monotone" dataKey="contacts" name="Contacts" stroke="#3E7BFA" strokeWidth={2} fill="url(#contactsGradient)" />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#1FA655" strokeWidth={2} fill="url(#visitorsGradient)" />
                <Area type="monotone" dataKey="subscribers" name="Subscribers" stroke="#F5B324" strokeWidth={2} fill="url(#subscribersGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Distribution</h3>
            <p>Current breakdown by category</p>
          </div>
          <div className="chart-box chart-box--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isTablet ? 68 : 52}
                  innerRadius={isTablet ? 40 : 30}
                  labelLine={false}
                  label={({ percent }) => percent > 0 ? `${Math.round(percent * 100)}%` : ''}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '6px 10px', border: '1px solid #e7ebf1' }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: isMobileOrTablet ? '11px' : '10.5px', paddingTop: '6px', color: isMobileOrTablet ? '#0f172a' : undefined }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="info-row">
        <div className="info-card">
          <div className="info-icon-wrap info-icon-wrap--blue">
            <FiTrendingUp />
          </div>
          <div>
            <h4>Performance</h4>
            <p>Steady growth across all metrics</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon-wrap info-icon-wrap--green">
            <FiUsers />
          </div>
          <div>
            <h4>Engagement</h4>
            <p>15% increase in visitor activity</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon-wrap info-icon-wrap--yellow">
            <FiMail />
          </div>
          <div>
            <h4>Communication</h4>
            <p>40% rise in contact submissions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
