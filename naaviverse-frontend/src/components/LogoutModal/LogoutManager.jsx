import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './LogoutModal.css';

let triggerLogoutFn = null;

export const triggerLogout = (callback) => {
  if (triggerLogoutFn) {
    triggerLogoutFn(callback);
  } else {
    // Fallback if component is not mounted
    if (window.confirm("Are you sure you want to logout?")) {
      callback();
    }
  }
};

const LogoutManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [callback, setCallback] = useState(null);

  useEffect(() => {
    triggerLogoutFn = (cb) => {
      setCallback(() => cb);
      setIsOpen(true);
    };
    return () => {
      triggerLogoutFn = null;
    };
  }, []);

  if (!isOpen) return null;

  const handleConfirm = () => {
    try {
      window.dispatchEvent(new Event("naavi:logout"));
    } catch (e) {}
    if (callback) callback();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return ReactDOM.createPortal(
    <div className="logout-modal-overlay" onClick={handleClose}>
      <div className="logout-modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="logout-modal-title">Logout</h3>
        <p className="logout-modal-text">Are you sure you want to logout?</p>
        <div className="logout-modal-actions">
          <button className="logout-btn-yes" onClick={handleConfirm}>Yes</button>
          <button className="logout-btn-no" onClick={handleClose}>No</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutManager;
