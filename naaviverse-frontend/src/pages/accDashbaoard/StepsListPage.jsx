// src/pages/accDashbaoard/StepsListPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccDashsidebar from "../../components/accDashsidebar/accDashsidebar";
import "./StepsListPage.scss";
import { SvgClose } from "../../utils/SvgIcons";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const StepsListPage = () => {
  const { pathId } = useParams();
  const navigate = useNavigate();

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pathName, setPathName] = useState("");
  const [selectedStep, setSelectedStep] = useState(null);
  const [servicesForStep, setServicesForStep] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [removingService, setRemovingService] = useState(null);

  useEffect(() => {
    fetchSteps();
  }, [pathId]);

  const fetchSteps = async () => {
    try {
      setLoading(true);

      const pathRes = await axios.get(`${BASE_URL}/api/paths/viewpath/${pathId}`);
      setPathName(pathRes.data.data?.nameOfPath || "Path Steps");

      const stepsRes = await axios.get(`${BASE_URL}/api/steps/get`, {
        params: { path_id: pathId },
      });

      setSteps(stepsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching steps:", err);
    } finally {
      setLoading(false);
    }
  };

 const fetchServicesForStep = async (stepId) => {
  try {
    setModalLoading(true);

    const response = await axios.get(
      `${BASE_URL}/api/steps/getall/${stepId}`
    );

    setServicesForStep(response.data.data || []);
  } catch (err) {
    console.error("Error fetching services:", err);
    setServicesForStep([]);
  } finally {
    setModalLoading(false);
  }
};
const handleDeleteStep = async (stepId, e) => {
  e.stopPropagation();

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this step?"
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(`${BASE_URL}/api/steps/delete/${stepId}`);

    // refresh steps
    await fetchSteps();
  } catch (err) {
    console.error("Error deleting step:", err);
    toast.error("Failed to delete step");
  }
};
  const handleRemoveServiceFromStep = async (serviceId) => {
    if (!selectedStep) return;

    try {
      setRemovingService(serviceId);

      await axios.post(`${BASE_URL}/api/steps/detachservice`, {
        step_id: selectedStep._id,
        service_id: serviceId,
      });

      await fetchServicesForStep(selectedStep._id);
      await fetchSteps();

    } catch (err) {
      console.error("Error removing service:", err);
      toast.error("Failed to remove service");
    } finally {
      setRemovingService(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatPrice = (service) => {
    if (!service.billing_cycle) return "Free";
    const clean = (val) => {
      if (!val && val !== 0) return "";
      const s = String(val).trim().replace(/^\$+/, "").trim();
      return s.startsWith("₹") ? s : `₹${s}`;
    };
    if (service.billing_cycle.monthly?.price)
      return `${clean(service.billing_cycle.monthly.price)}/mo`;
    if (service.billing_cycle.lifetime?.price)
      return clean(service.billing_cycle.lifetime.price);
    return "Free";
  };

  const openServicesModal = async (step, e) => {
    e.stopPropagation();
    setSelectedStep(step);
    await fetchServicesForStep(step._id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStep(null);
    setServicesForStep([]);
  };

  return (
    <div className="steps-list-container">
      <AccDashsidebar />

      <div className="main-content">
        <div className="page-header">
          <div className="header-title">
            <h1>Steps Overview</h1>
            <div className="path-info">
              <span className="path-name">{pathName}</span>
              <span className="step-count">{steps.length} steps</span>
            </div>
          </div>

          <button
            className="back-button"
            onClick={() =>
              navigate(`/dashboard/accountants/path/${pathId}`)
            }
          >
            ← Back
          </button>
        </div>

        <div className="steps-grid">
          {loading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : steps.length === 0 ? (
            <div className="empty-state">
              <p>No steps yet</p>
            </div>
          ) : (
            steps.map((step, index) => (
              <div key={step._id} className="steps-list-card">
                <div className="card-header">
                  <span className="step-number">
                    {index + 1}
                  </span>

                  <h4 className="step-title">{step.name}</h4>

                  <button
  className="service-pill view-btn"
  onClick={(e) => openServicesModal(step, e)}
>
  View Services
</button>

<button
  className="service-pill remove-btn"
  onClick={(e) => handleDeleteStep(step._id, e)}
>
  Remove
</button>
                </div>

                <p className="step-description">
                  {step.macroDescription ||
                    step.description ||
                    "No description available"}
                </p>

                <div className="step-footer">
                  <span className="date">
                    {formatDate(step.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalOpen && selectedStep && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Services
                <span>{servicesForStep.length}</span>
              </h3>
              <button className="close-button" onClick={closeModal}>
                <SvgClose size={14} />
              </button>
            </div>

            <div className="modal-body">
              {modalLoading ? (
                <p>Loading...</p>
              ) : servicesForStep.length > 0 ? (
                <div className="services-mini-grid">
                  {servicesForStep.map((service) => (
                    <div
                      key={service._id}
                      className="service-mini-card"
                    >
                      <div className="service-mini-info">
  <p className="service-mini-name">
    {service.name}
  </p>
</div>

                      <span className="service-mini-price">
                        {formatPrice(service)}
                      </span>

                      <button
                        className="remove-button"
                        onClick={() =>
                          handleRemoveServiceFromStep(
                            service._id
                          )
                        }
                        disabled={
                          removingService === service._id
                        }
                      >
                        {removingService === service._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modal-empty">
                  <p>No services attached</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepsListPage; 