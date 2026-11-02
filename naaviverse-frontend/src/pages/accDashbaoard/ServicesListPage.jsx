import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccDashsidebar from "../../components/accDashsidebar/accDashsidebar";
import "./ServicesListPage.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { SvgClose } from "../../utils/SvgIcons";
const ServicesListPage = () => {
  const navigate = useNavigate();
const location = useLocation();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);
  const [stepsUsingService, setStepsUsingService] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [removingStep, setRemovingStep] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

 useEffect(() => {
  if (location.state?.attachedServices) {
    setServices(location.state.attachedServices);
    setLoading(false);
  } else {
    fetchServices();
  }
}, []);

  /* ================= FETCH SERVICES ================= */

  const fetchServices = async () => {
    try {
      setLoading(true);
      const partner = JSON.parse(localStorage.getItem("partner"));
      const email = partner?.email;

      const response = await axios.get(`/api/services/getservices`, {
        params: { productcreatoremail: email },
      });

      setServices(response.data.data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH STEPS USING SERVICE ================= */

  const fetchStepsForService = async (serviceId) => {
    try {
      setModalLoading(true);
      const response = await axios.get(`/api/services/steps-using/${serviceId}`);
      setStepsUsingService(response.data.data || []);
    } catch (err) {
      console.error("Error fetching steps:", err);
      setStepsUsingService([]);
    } finally {
      setModalLoading(false);
    }
  };

  /* ================= REMOVE SERVICE FROM STEP ================= */

  const handleRemoveServiceFromStep = async (stepId) => {
    if (!selectedService) return;

    try {
      setRemovingStep(stepId);

      await axios.post(`/api/steps/detachservice`, {
        step_id: stepId,
        service_id: selectedService._id,
      });

      // Update UI instantly
      setStepsUsingService((prev) =>
        prev.filter((step) => step._id !== stepId)
      );
    } catch (err) {
      console.error("Error removing service from step:", err);
      toast.error("Failed to remove service from step");
    } finally {
      setRemovingStep(null);
    }
  };

  /* ================= DELETE SERVICE COMPLETELY ================= */

  const handleDeleteService = async (serviceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this service?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingService(serviceId);

      await axios.delete(`/api/services/delete/${serviceId}`);

      // Remove from UI instantly
      setServices((prev) =>
        prev.filter((service) => service._id !== serviceId)
      );

      // If modal open for this service, close it
      if (selectedService?._id === serviceId) {
        setSelectedService(null);
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      toast.error("Failed to delete service");
    } finally {
      setDeletingService(null);
    }
  };

  /* ================= FORMAT PRICE ================= */

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

  return (
    <div className="services-list-container">
      <AccDashsidebar />

      <div className="main-content">
        <div className="page-header">
          <div className="header-title">
            <h1>Services Overview</h1>
            <div className="services-info">
              <span className="services-count">
                {services.length} services
              </span>
            </div>
          </div>

          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <div className="services-grid">
          {loading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <h3>No Services Yet</h3>
              <p>Create services to attach them to steps.</p>
            </div>
          ) : (
            services.map((service, index) => (
              <div key={service._id} className="service-card">
                <div className="card-header">
                  <div className="service-icon">
                    {service.product_icon ? (
                      <img
                        src={service.product_icon}
                        alt={service.name}
                      />
                    ) : (
                      <div className="step-number">
  {index + 1}
</div>
                    )}
                  </div>

                  <div className="service-info">
                    <h4 className="service-name">
                      {service.name}
                    </h4>
                    <p className="service-description">
                      {service.description || "No description"}
                    </p>
                  </div>

                  <button
                    className="steps-pill"
                    onClick={() => {
                      setSelectedService(service);
                      fetchStepsForService(service._id);
                    }}
                  >
                    View Steps
                  </button>

                  <button
                    className="steps-pill remove-pill"
                    disabled={deletingService === service._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteService(service._id);
                    }}
                  >
                    {deletingService === service._id
                      ? "Deleting..."
                      : "Remove"}
                  </button>
                </div>

                <div className="service-footer">
                  <span className="price-tag">
                    {formatPrice(service)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}

      {selectedService && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Steps Using {selectedService.name} (
                {stepsUsingService.length})
              </h3>
              <button
                className="close-button"
                onClick={() => setSelectedService(null)}
              >
                <SvgClose size={14} />
              </button>
            </div>

            <div className="modal-body">
              {modalLoading ? (
                <p>Loading...</p>
              ) : stepsUsingService.length > 0 ? (
                <div className="steps-mini-grid">
                  {stepsUsingService.map((step, index) => (
                    <div key={step._id} className="step-mini-card">
                      <div className="step-mini-icon">
                        {index + 1}
                      </div>

                      <div className="step-mini-info">
  <h4 className="step-mini-name">{step.name}</h4>
  <p className="step-mini-desc">
    {step.description || "No description"}
  </p>
</div>

                      <button
                        className="remove-button"
                        onClick={() =>
                          handleRemoveServiceFromStep(step._id)
                        }
                        disabled={removingStep === step._id}
                      >
                        {removingStep === step._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modal-empty">
                  <p>No steps are using this service yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesListPage;