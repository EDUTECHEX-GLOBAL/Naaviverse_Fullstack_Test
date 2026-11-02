import CustomSelect from '../accDashbaoard/CustomSelect';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./accDashboard.scss";
import { SvgClose } from "../../utils/SvgIcons";

const EditServiceForm = ({ service, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    sub_text: "",
    description: "",
    status: "active",
    chargingtype: "",
    first_purchase_price: 0,
    monthly_price: 0,
    annual_price: 0,
    lifetime_price: 0,
    revenue_account: "",
    client_app: "",
    product_category_code: "",
    custom_product_label: "",
    grace_period: 0,
    first_retry: 0,
    second_retry: 0,
    staking_allowed: false,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!service) return;

    setFormData({
      name: service.name || service.product_name || "",
      sub_text: service.sub_text || "",
      description: service.description || service.full_description || "",
      status: service.status || "active",
      chargingtype: service.chargingtype || "",
      first_purchase_price: service.first_purchase?.price || 0,
      monthly_price: service.billing_cycle?.monthly?.price || 0,
      annual_price: service.billing_cycle?.annual?.price || 0,
      lifetime_price: service.billing_cycle?.lifetime?.price || 0,
      revenue_account: service.revenue_account || "",
      client_app: service.client_app || "",
      product_category_code: service.product_category_code || "",
      custom_product_label: service.custom_product_label || "",
      grace_period: service.grace_period || 0,
      first_retry: service.first_retry || 0,
      second_retry: service.second_retry || 0,
      staking_allowed: service.staking_allowed || false,
    });
  }, [service]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              type === "number" ? parseFloat(value) || 0 : 
              value
    }));
  };

  const handleSave = async () => {
    if (!service?._id) return;
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        sub_text: formData.sub_text.trim(),
        description: formData.description.trim(),
        status: formData.status,
        chargingtype: formData.chargingtype.trim(),
        
        first_purchase: {
          price: Number(formData.first_purchase_price),
          coin: "INR"
        },
        
        billing_cycle: {
          ...(formData.monthly_price > 0 && {
            monthly: { price: Number(formData.monthly_price), coin: "INR" }
          }),
          ...(formData.annual_price > 0 && {
            annual: { price: Number(formData.annual_price), coin: "INR" }
          }),
          ...(formData.lifetime_price > 0 && {
            lifetime: { price: Number(formData.lifetime_price), coin: "INR" }
          })
        },
        
        revenue_account: formData.revenue_account.trim(),
        client_app: formData.client_app.trim(),
        product_category_code: formData.product_category_code.trim(),
        custom_product_label: formData.custom_product_label.trim(),
        
        grace_period: Number(formData.grace_period),
        first_retry: Number(formData.first_retry),
        second_retry: Number(formData.second_retry),
        staking_allowed: formData.staking_allowed,
      };

      const { data } = await axios.put(
        `/admin/services/update/${service._id}`,
        payload
      );

      if (data?.status) {
        toast.success("Service updated successfully");
        onSave(data.data);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Update failed - Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all changes?")) {
      if (service) {
        setFormData({
          name: service.name || service.product_name || "",
          sub_text: service.sub_text || "",
          description: service.description || service.full_description || "",
          status: service.status || "active",
          chargingtype: service.chargingtype || "",
          first_purchase_price: service.first_purchase?.price || 0,
          monthly_price: service.billing_cycle?.monthly?.price || 0,
          annual_price: service.billing_cycle?.annual?.price || 0,
          lifetime_price: service.billing_cycle?.lifetime?.price || 0,
          revenue_account: service.revenue_account || "",
          client_app: service.client_app || "",
          product_category_code: service.product_category_code || "",
          custom_product_label: service.custom_product_label || "",
          grace_period: service.grace_period || 0,
          first_retry: service.first_retry || 0,
          second_retry: service.second_retry || 0,
          staking_allowed: service.staking_allowed || false,
        });
      }
    }
  };

  return (
    <div className="drawer-content">
      <form onSubmit={(e) => { e.preventDefault(); if (!loading) handleSave(); }} className="edit-form-container">
        <h3>
          {/* <span className="edit-icon">[edit]️</span> */}
          Edit Service
        </h3>

        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Service Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter service name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Sub Text</label>
              <input
                type="text"
                name="sub_text"
                placeholder="Brief tagline"
                value={formData.sub_text}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Detailed service description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <div className="project-desktop-custom-select">
                <CustomSelect
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                  searchable={false}
                />
              </div>
              <div className="project-mobile-native-select">
                <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="active">🟢 Active</option>
                <option value="inactive">[red-dot] Inactive</option>
              </select>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Pricing Configuration</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Charging Type</label>
              <input
                type="text"
                name="chargingtype"
                placeholder="e.g., Subscription, One-time"
                value={formData.chargingtype}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>First Purchase (₹)</label>
              <input
                type="number"
                name="first_purchase_price"
                placeholder="0.00"
                value={formData.first_purchase_price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Monthly (₹)</label>
              <input
                type="number"
                name="monthly_price"
                placeholder="0.00"
                value={formData.monthly_price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Annual (₹)</label>
              <input
                type="number"
                name="annual_price"
                placeholder="0.00"
                value={formData.annual_price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Lifetime (₹)</label>
              <input
                type="number"
                name="lifetime_price"
                placeholder="0.00"
                value={formData.lifetime_price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Business Details</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Revenue Account</label>
              <input
                type="text"
                name="revenue_account"
                placeholder="Account email"
                value={formData.revenue_account}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Client App</label>
              <input
                type="text"
                name="client_app"
                placeholder="App identifier"
                value={formData.client_app}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Category Code</label>
              <input
                type="text"
                name="product_category_code"
                placeholder="e.g., CoE"
                value={formData.product_category_code}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Custom Label</label>
              <input
                type="text"
                name="custom_product_label"
                placeholder="Custom identifier"
                value={formData.custom_product_label}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Advanced Configuration</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Grace Period (days)</label>
              <input
                type="number"
                name="grace_period"
                placeholder="0"
                value={formData.grace_period}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>First Retry (days)</label>
              <input
                type="number"
                name="first_retry"
                placeholder="0"
                value={formData.first_retry}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Second Retry (days)</label>
              <input
                type="number"
                name="second_retry"
                placeholder="0"
                value={formData.second_retry}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="staking_allowed"
                  checked={formData.staking_allowed}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span>Staking Allowed</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button 
            onClick={handleReset} 
            className="reset-btn"
            type="button"
          >
            ↩ Reset
          </button>
          <button 
            onClick={onCancel} 
            className="cancel-btn"
            type="button"
          >
            <SvgClose size={14} /> Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="save-btn"
            type="submit"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              ' Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditServiceForm;