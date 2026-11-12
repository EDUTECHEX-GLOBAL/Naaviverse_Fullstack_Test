import React, { useEffect, useState } from "react";
import axios from "axios";
import "./pathview.scss";
import { useNavigate } from "react-router-dom";
import { SvgParty } from "../../utils/SvgIcons";
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PathView = ({ selectedUniversity, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [steps, setSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);

  const navigate = useNavigate();

  const uniId = selectedUniversity?._id;

  /* --------------------------------------------
     RESET UI WHEN NEW UNIVERSITY IS OPENED
  --------------------------------------------- */
  useEffect(() => {
    setShowSteps(false);
    setShowConfirm(false);
  }, [selectedUniversity]);

  /* --------------------------------------------
     CHECK LOCAL STORAGE SELECTED UNIVERSITY
  --------------------------------------------- */
  useEffect(() => {
    if (!uniId) return;

    const savedId = localStorage.getItem("selectedUniversityId");

    setIsSelected(savedId === uniId);
  }, [uniId]);

  /* --------------------------------------------
     SYNC WITH BACKEND SELECTED PATH
  --------------------------------------------- */
  useEffect(() => {
    const fetchSelectedPath = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const email = user?.user?.email;

        const res = await axios.get(`${BASE_URL}/api/fetch/getSelectedPath?email=${email}`);

        if (res?.data?.status && res.data?.universityId) {
          const backendId = res.data.universityId;

          // Sync localStorage
          localStorage.setItem("selectedUniversityId", backendId);

          setIsSelected(backendId === uniId);
        }
      } catch (err) {
        console.log("Error syncing selected path:", err);
      }
    };

    fetchSelectedPath();
  }, [uniId]);

  /* --------------------------------------------
     FETCH STEPS FOR EXPLORE VIEW
  --------------------------------------------- */
  const fetchSteps = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/userpaths/steps?universityId=${uniId}`);
      if (res?.data?.success) {
        setSteps(res.data.data.steps || []);
      }
    } catch (error) {
      console.log("Error fetching steps:", error);
    }
  };

  const handleExplore = async () => {
    setShowSteps(true);
    await fetchSteps();
  };

  /* --------------------------------------------
     SELECT PATH → SAVE → REDIRECT
  --------------------------------------------- */
  const handleSelectPath = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const email = user?.user?.email || user?.email || localStorage.getItem("loginEmail") || "";

      const response = await axios.post(`${BASE_URL}/api/fetch/selectpath`, {
        email,
        universityId: uniId,
      });

      if (response.data.status) {
        // Save selected university
        localStorage.setItem("selectedUniversityId", uniId);

        setIsSelected(true);
        setShowConfirm(false);

        navigate("/dashboard/journey");
      }
    } catch (error) {
      console.log("Path selection error:", error);
    }
  };

  if (!selectedUniversity) return null;

  return (
    <div className="pathview-container">
      <div className="right-panel">

        {/* Already Selected Path */}
        {isSelected && !showSteps && !showConfirm && (
          <div className="congrats-box">
            <h3><SvgParty size={14} /> You Already Selected This Path</h3>
            <button className="panel-btn" onClick={() => navigate("/dashboard/journey")}>
              Go To My Journey
            </button>
            <button className="panel-btn secondary" onClick={onClose}>
              Go Back
            </button>
          </div>
        )}

        {/* Steps List (Explore Path) */}
        {showSteps && !isSelected && !showConfirm && (
          <div className="steps-box">
            <h3 className="panel-title">{selectedUniversity.name}</h3>

            {steps.length === 0 && <p>No steps found.</p>}

            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">Step {i + 1}</div>
                <div className="step-title">{step.name}</div>
              </div>
            ))}

            <button className="panel-btn" onClick={() => setShowConfirm(true)}>
              Select This Path
            </button>

            <button className="panel-btn secondary" onClick={onClose}>
              Go Back
            </button>
          </div>
        )}

        {/* First View */}
        {!showSteps && !isSelected && !showConfirm && (
          <>
            <h3 className="panel-title">What do you want to do?</h3>

            <button className="panel-btn" onClick={handleExplore}>
              Explore Path
            </button>

            <button className="panel-btn" onClick={() => setShowConfirm(true)}>
              Select Path
            </button>

            <button className="panel-btn secondary" onClick={onClose}>
              Go Back
            </button>
          </>
        )}

        {/* Confirm Selection */}
        {showConfirm && !isSelected && (
          <>
            <h3 className="panel-title">Confirm your selection?</h3>

            <button className="panel-btn" onClick={handleSelectPath}>
              Yes, Select This Path
            </button>

            <button className="panel-btn secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PathView;
