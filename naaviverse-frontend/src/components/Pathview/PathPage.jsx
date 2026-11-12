import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "./pathview.scss";
import { motion } from "framer-motion";
import { SvgClock } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const parseDuration = (raw) => {
  try {
    const l = JSON.parse(raw);
    const parts = [];
    if (parseInt(l.years)  > 0) parts.push(`${l.years}y`);
    if (parseInt(l.months) > 0) parts.push(`${l.months}m`);
    if (parseInt(l.days)   > 0) parts.push(`${l.days}d`);
    return parts.length > 0 ? parts.join(" ") : null;
  } catch {
    return null;
  }
};

const PathPage = () => {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const location  = useLocation();

  const [loading,  setLoading]  = useState(true);
  const [pathName, setPathName] = useState("");
  const [steps,    setSteps]    = useState([]);
  const [error,    setError]    = useState(null);

  const isPartnerFlow = location.pathname.startsWith("/dashboard/accountants");

  useEffect(() => {
    const fetchPath = async () => {
      setLoading(true);
      setError(null);

      const pathId = id || localStorage.getItem("selectedPathId");
      if (!pathId) {
        setError("No path selected.");
        setLoading(false);
        return;
      }

      try {
        const pathRes = await axios.get(`${BASE_URL}/api/paths/viewpath/${pathId}`);
        setPathName(pathRes?.data?.data?.nameOfPath || "Untitled Path");

        let stepsList = [];
        try {
          const userStepsRes = await axios.get(`${BASE_URL}/api/userpaths/steps`, {
            params: { pathId },
          });
          if (Array.isArray(userStepsRes?.data?.data?.steps)) {
            stepsList = userStepsRes.data.data.steps;
          }
        } catch (_) {}

        if (!stepsList.length) {
          const stepsRes = await axios.get(`${BASE_URL}/api/steps/get`, {
            params: { path_id: pathId },
          });
          stepsList = stepsRes?.data?.data || [];
        }

        const sorted = (stepsList || [])
          .filter((s) => s.status === "active")
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
        setSteps(sorted);
      } catch (err) {
        setError("Failed to fetch path details.");
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPath();
  }, [id]);

  return (
    <div className="pathpage-root">

      {/* HEADER */}
      <div className="pathpage-header">
        <div className="pathpage-header-left">
          <span className="pathpage-label">Your Selected Path</span>
          {loading
            ? <Skeleton width={260} height={28} />
            : <h1 className="pathpage-title">{pathName}</h1>
          }
        </div>
        <div className="pathpage-header-right">
          <button className="pathpage-back-btn" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
          {isPartnerFlow && (
            <button
              className="pathpage-create-btn"
              onClick={() => navigate(`/dashboard/accountants/create-step/${id}`)}
            >
              + Create Step
            </button>
          )}
        </div>
      </div>

      {/* STEPS */}
      <div className="pathpage-scroll-area">
        {loading ? (
          <div className="pathpage-skeleton-grid">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} height={180} borderRadius={20} />
            ))}
          </div>
        ) : error ? (
          <p className="pathpage-error">{error}</p>
        ) : steps.length === 0 ? (
          <p className="pathpage-error">No steps found for this path.</p>
        ) : (
          <div className="pathpage-steps-grid">
            {steps.map((step, index) => {
              const duration = parseDuration(step.macro_length);
              return (
                <motion.div
                  key={step._id}
                  className="pathpage-step-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="pathpage-step-number">
                    {step.step_order || index + 1}
                  </div>

                  <div className="pathpage-step-name">{step.macro_name}</div>

                  {step.macro_description && (
                    <div className="pathpage-step-desc">{step.macro_description}</div>
                  )}

                  {duration && (
                    <div style={{
                      marginTop: "auto",
                      paddingTop: 12,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#6c5ce7",
                      background: "rgba(108,92,231,0.07)",
                      borderRadius: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "8px 20px",
                      minHeight: 36,
                      border: "1px solid rgba(108,92,231,0.16)",
                      borderRadius: 10,
                      fontSize: "0.95rem",
                      boxShadow: "0 1px 4px rgba(108, 92, 231, 0.08)",
                    }}>
                      <SvgClock size={15} /> {duration}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default PathPage;