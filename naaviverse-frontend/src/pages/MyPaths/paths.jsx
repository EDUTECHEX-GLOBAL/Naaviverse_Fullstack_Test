import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

// ── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = "epm-styles-v6";
["epm-styles-v5", "epm-styles-v4", "epm-styles-v3", "epm-styles-v2", "epm-styles-v1"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.remove();
});
let style = document.getElementById(STYLE_ID);
if (!style) {
  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
}
const EPM_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    /* ── Overlay ────────────────────────────────────── */
    .epm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 18, 30, 0.52);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: epmOverlayIn 0.2s ease both;
    }
    @keyframes epmOverlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Modal ──────────────────────────────────────── */
    .epm-modal {
      font-family: 'Poppins', sans-serif;
      background: #ffffff;
      border-radius: 22px;
      width: 100%;
      max-width: 580px;
      max-height: 86vh;
      display: flex;
      flex-direction: column;
      box-shadow:
        0 2px 4px rgba(0,0,0,0.03),
        0 12px 32px rgba(0,0,0,0.12),
        0 32px 64px rgba(0,0,0,0.10);
      /* NO transform/translate — starts centered via flexbox on overlay */
      animation: epmModalIn 0.24s cubic-bezier(0.34, 1.26, 0.64, 1) both;
      overflow: hidden;
    }
    @keyframes epmModalIn {
      from { opacity: 0; transform: scale(0.94) translateY(16px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);     }
    }

    /* ── Header ─────────────────────────────────────── */
    .epm-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 22px 24px 16px;
      border-bottom: 1px solid #f0f4f8;
      flex-shrink: 0;
    }
    .epm-header-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      color: #0d1b2a;
      margin: 0 0 3px;
      letter-spacing: -0.015em;
    }
    .epm-header-sub {
      font-size: 0.74rem;
      color: #94a3b8;
      margin: 0;
    }
    .epm-close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .epm-close:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #ef4444;
    }

    /* ── Body ───────────────────────────────────────── */
    .epm-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 20px 24px 8px;
    }
    .epm-body::-webkit-scrollbar { width: 4px; }
    .epm-body::-webkit-scrollbar-track { background: transparent; }
    .epm-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    /* ── Section label ──────────────────────────────── */
    .epm-sec {
      font-size: 0.63rem;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 20px 0 10px;
    }
    .epm-sec:first-child { margin-top: 4px; }

    /* ── Grid layouts ───────────────────────────────── */
    .epm-row2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* ── Field ──────────────────────────────────────── */
    .epm-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 12px;
      position: relative;
    }
    .epm-label {
      font-size: 0.71rem;
      font-weight: 600;
      color: #475569;
    }
    .epm-input,
    .epm-select,
    .epm-textarea {
      font-family: 'Poppins', sans-serif;
      font-size: 0.84rem;
      color: #0d1b2a;
      background: #f8fafc;
      border: 1.5px solid #e8ecf2;
      border-radius: 10px;
      padding: 8px 11px;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    }
    .epm-input:focus,
    .epm-select:focus,
    .epm-textarea:focus {
      border-color: #0d9488;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(13,148,136,0.10);
    }
    .epm-input::placeholder,
    .epm-textarea::placeholder { color: #c8d5e0; }
    .epm-textarea { resize: vertical; min-height: 68px; line-height: 1.5; }
    .epm-select {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 11px center;
      padding-right: 30px;
    }

    /* ── Dropdown Select Component Base (Desktop default: native select) ── */
    .epm-select-wrap {
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }
    .epm-select-wrap.is-open {
      z-index: 1050;
      position: relative;
    }
    .epm-select-desktop {
      display: none !important;
      width: 100%;
      box-sizing: border-box;
    }
    .epm-select-mobile {
      display: block !important;
      width: 100%;
      position: relative;
      box-sizing: border-box;
    }
    .epm-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.84rem;
      color: #0d1b2a;
      background: #f8fafc;
      border: 1.5px solid #e8ecf2;
      border-radius: 10px;
      padding: 8px 11px;
      cursor: pointer;
      user-select: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      outline: none;
      text-align: left;
    }
    .epm-select-trigger:hover {
      border-color: #cbd5e1;
      background: #ffffff;
    }
    .epm-select-trigger.open {
      border-color: #0d9488;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(13,148,136,0.10);
    }
    .epm-select-trigger.is-placeholder .epm-select-val {
      color: #94a3b8;
    }
    .epm-select-val {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
      flex: 1;
    }
    .epm-select-chevron {
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .epm-select-chevron.open {
      transform: rotate(180deg);
    }
    .epm-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      background: #ffffff;
      border: 1.5px solid #0d9488;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(13, 27, 42, 0.14);
      padding: 4px;
      z-index: 1000;
      max-height: 180px;
      overflow-y: auto;
      box-sizing: border-box;
      animation: epmFadeIn 0.15s ease-out;
    }
    @keyframes epmFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .epm-dropdown-item {
      font-family: 'Poppins', sans-serif;
      font-size: 0.80rem;
      color: #334155;
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      transition: all 0.12s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .epm-dropdown-item:hover {
      background: #f1f5f9;
      color: #0d1b2a;
    }
    .epm-dropdown-item.selected {
      background: #0d9488;
      color: #ffffff;
      font-weight: 500;
    }

    /* ── Pill group ─────────────────────────────────── */
    .epm-pills {
      display: flex;
      flex-wrap: wrap;     /* CRITICAL: must wrap */
      gap: 8px;
      width: 100%;
    }
    .epm-pill {
      font-family: 'Poppins', sans-serif;
      font-size: 0.74rem;
      font-weight: 500;
      padding: 5px 13px;
      border-radius: 50px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      flex-shrink: 0;       /* pills never shrink — they wrap instead */
      transition: all 0.13s;
      line-height: 1.4;
    }
    .epm-pill:hover {
      border-color: #99f6e4;
      background: #f0fdf4;
      color: #0d9488;
    }
    .epm-pill.on {
      border-color: #0d9488;
      background: #ccfbf1;
      color: #0f766e;
      font-weight: 600;
    }

    /* ── Error banner ───────────────────────────────── */
    .epm-err {
      background: #fff1f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 9px 13px;
      font-size: 0.79rem;
      color: #be123c;
      margin-bottom: 14px;
    }

    /* ── Footer ─────────────────────────────────────── */
    .epm-footer {
      padding: 14px 24px 18px;
      border-top: 1px solid #f0f4f8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-shrink: 0;
    }
    .epm-hint {
      font-size: 0.71rem;
      color: #94a3b8;
    }
    .epm-hint strong { color: #f59e0b; font-weight: 600; }
    .epm-btns { display: flex; gap: 8px; }

    .epm-btn-cancel {
      font-family: 'Poppins', sans-serif;
      font-size: 0.81rem;
      font-weight: 500;
      padding: 9px 18px;
      border-radius: 50px;
      border: 1.5px solid #e2e8f0;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .epm-btn-cancel:hover { background: #f1f5f9; }

    .epm-btn-save {
      font-family: 'Poppins', sans-serif;
      font-size: 0.81rem;
      font-weight: 600;
      padding: 9px 22px;
      border-radius: 50px;
      border: none;
      background: #0d9488;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .epm-btn-save:hover:not(:disabled) {
      background: #0f766e;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(13,148,136,0.28);
    }
    .epm-btn-save:disabled { opacity: 0.48; cursor: not-allowed; transform: none; }

    /* ── Spinner ────────────────────────────────────── */
    .epm-spin {
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: epmSpin 0.65s linear infinite;
      display: inline-block;
    }
    @keyframes epmSpin { to { transform: rotate(360deg); } }

    /* ── Success ────────────────────────────────────── */
    .epm-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 52px 24px;
      text-align: center;
      gap: 10px;
    }
    .epm-success-icon {
      width: 54px; height: 54px;
      border-radius: 50%;
      background: #d1fae5;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .epm-success h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.2rem; font-weight: 600;
      color: #0d1b2a; margin: 0;
    }
    .epm-success p { font-size: 0.81rem; color: #64748b; margin: 0; }

    /* ── Mobile Responsive Layout ──────────────────── */
    @media (max-width: 768px) {
      .epm-overlay {
        padding: 12px;
      }
      .epm-modal {
        border-radius: 16px;
        max-height: 92vh;
        width: 100%;
        max-width: 440px;
      }
      .epm-header {
        padding: 16px 18px 12px;
      }
      .epm-header-title {
        font-size: 1.12rem;
      }
      .epm-body {
        padding: 14px 16px 20px;
      }
      .epm-row2 {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .epm-field {
        margin-bottom: 10px;
        position: relative;
      }
      .epm-field:has(.is-open),
      .epm-row2:has(.is-open) {
        z-index: 1050;
        position: relative;
      }
      .epm-label {
        font-size: 0.68rem;
      }
      .epm-input,
      .epm-textarea {
        font-size: 0.76rem;
        padding: 6px 10px;
        border-radius: 8px;
        min-height: 36px;
      }
      .epm-select-desktop {
        display: none !important;
      }
      .epm-select-mobile {
        display: block !important;
        width: 100%;
        position: relative;
        box-sizing: border-box;
      }
      .epm-select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.76rem;
        color: #0d1b2a;
        background: #f8fafc;
        border: 1.5px solid #e8ecf2;
        border-radius: 8px;
        padding: 6px 10px;
        min-height: 34px;
        cursor: pointer;
        user-select: none;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        outline: none;
        text-align: left;
      }
      .epm-select-trigger:hover {
        border-color: #cbd5e1;
        background: #ffffff;
      }
      .epm-select-trigger.open {
        border-color: #0d9488;
        background: #ffffff;
        box-shadow: 0 0 0 2px rgba(13,148,136,0.12);
      }
      .epm-select-trigger.is-placeholder .epm-select-val {
        color: #94a3b8;
      }
      .epm-select-val {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        flex: 1;
        font-size: 0.76rem;
        color: #0d1b2a;
      }
      .epm-select-chevron {
        width: 9px;
        height: 5px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }
      .epm-select-chevron.open {
        transform: rotate(180deg);
      }
      .epm-dropdown-menu {
        position: absolute;
        top: calc(100% + 3px);
        left: 0;
        right: 0;
        width: 100%;
        max-width: 100%;
        background: #ffffff;
        border: 1.5px solid #0d9488;
        border-radius: 8px;
        box-shadow: 0 4px 18px rgba(13, 27, 42, 0.12);
        padding: 3px;
        z-index: 1050;
        max-height: 135px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        animation: epmFadeIn 0.12s ease-out;
      }
      .epm-dropdown-menu::-webkit-scrollbar {
        width: 4px;
      }
      .epm-dropdown-menu::-webkit-scrollbar-track {
        background: #f8fafc;
        border-radius: 4px;
      }
      .epm-dropdown-menu::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .epm-dropdown-item {
        font-family: 'Poppins', sans-serif;
        font-size: 0.73rem;
        color: #334155;
        padding: 6px 8px;
        border-radius: 5px;
        cursor: pointer;
        user-select: none;
        transition: all 0.12s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }
      .epm-dropdown-item:hover {
        background: #f1f5f9;
        color: #0d1b2a;
      }
      .epm-dropdown-item.selected {
        background: #0d9488;
        color: #ffffff;
        font-weight: 500;
      }
      .epm-footer {
        padding: 12px 16px;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      .epm-btns {
        justify-content: flex-end;
      }
    }

    @media (max-width: 480px) {
      .epm-overlay {
        padding: 8px;
      }
      .epm-modal {
        border-radius: 14px;
        max-height: 94vh;
      }
      .epm-header {
        padding: 14px 14px 10px;
      }
      .epm-body {
        padding: 12px 14px 16px;
      }
      .epm-footer {
        padding: 10px 14px;
      }
      .epm-btn-cancel,
      .epm-btn-save {
        padding: 7px 16px;
        font-size: 0.76rem;
      }
      .epm-select-trigger {
        font-size: 0.74rem;
        padding: 5px 8px;
        min-height: 32px;
        border-radius: 7px;
      }
      .epm-select-val {
        font-size: 0.74rem;
      }
      .epm-dropdown-menu {
        max-height: 120px;
        padding: 2px;
        border-radius: 7px;
      }
      .epm-dropdown-item {
        font-size: 0.71rem;
        padding: 5px 7px;
        border-radius: 4px;
      }
    }

    /* ── Surface Pro 10 & iPad Pro 13 Tablet Responsive Layout ── */
    /* Target Surface Pro 10:
         Portrait: 912px - 960px width
         Landscape: 1368px - 1440px width x 912px - 960px height
       Target iPad Pro 13:
         Portrait: 1024px - 1032px width
         Landscape: 1366px - 1376px width x 1024px - 1032px height
    */
    @media (min-width: 769px) and (max-width: 1040px),
           (min-width: 1041px) and (max-width: 1440px) and (max-height: 1040px),
           (min-width: 912px) and (max-width: 1440px) and (orientation: landscape) and (max-height: 1040px) {
      .epm-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: max(16px, env(safe-area-inset-top, 16px))
                 max(20px, env(safe-area-inset-right, 20px))
                 max(16px, env(safe-area-inset-bottom, 16px))
                 max(20px, env(safe-area-inset-left, 20px));
        z-index: 10005;
        overflow: hidden;
        box-sizing: border-box;
      }
      .epm-modal {
        width: 100%;
        max-width: 580px;
        max-height: calc(100vh - 44px);
        max-height: calc(100dvh - 44px);
        min-height: 0;
        border-radius: 20px;
        margin: auto;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        box-shadow:
          0 4px 12px rgba(0,0,0,0.06),
          0 16px 40px rgba(0,0,0,0.18);
      }
      .epm-header {
        padding: 20px 24px 14px;
        flex-shrink: 0;
      }
      .epm-header-title {
        font-size: 1.22rem;
      }
      .epm-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding: 16px 24px 12px;
        box-sizing: border-box;
      }
      .epm-footer {
        padding: 14px 24px 16px;
        flex-shrink: 0;
        background: #ffffff;
        border-top: 1px solid #f0f4f8;
      }
      .epm-btns {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .epm-row2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
      }
      .epm-field {
        width: 100%;
        box-sizing: border-box;
      }
      .epm-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .epm-dropdown-menu {
        max-height: 170px;
        z-index: 1050;
      }
    }

    /* Tablet Landscape orientation adjustments for shorter vertical viewport */
    @media (min-width: 769px) and (max-width: 1440px) and (orientation: landscape) and (max-height: 1040px),
           (min-width: 769px) and (max-width: 1440px) and (max-height: 960px) {
      .epm-overlay {
        padding: max(12px, env(safe-area-inset-top, 12px))
                 max(16px, env(safe-area-inset-right, 16px))
                 max(12px, env(safe-area-inset-bottom, 12px))
                 max(16px, env(safe-area-inset-left, 16px));
      }
      .epm-modal {
        max-height: calc(100vh - 28px);
        max-height: calc(100dvh - 28px);
        border-radius: 18px;
      }
      .epm-header {
        padding: 15px 22px 11px;
      }
      .epm-header-title {
        font-size: 1.15rem;
      }
      .epm-body {
        padding: 12px 22px 10px;
      }
      .epm-footer {
        padding: 10px 22px 12px;
      }
      .epm-field {
        margin-bottom: 10px;
      }
      .epm-sec {
        margin: 14px 0 8px;
      }
      .epm-textarea {
        min-height: 56px;
      }
      .epm-dropdown-menu {
        max-height: 140px;
      }
    }
  `;
style.textContent = EPM_CSS;

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const OPTS = {
  financialSituation: ["0-25L", "25L-75L", "75L-3CR", "3CR+", "Other"],
  curriculum:         ["IB", "IGCSE", "CBSE", "ICSE", "Nordic"],
  grade:              ["9", "10", "11", "12"],
  stream:             ["MPC", "BIPC", "CEC", "MEC", "HEC"],
  gradeAvg: [
    "0% - 35%", "36% - 60%", "61% - 75%",
    "76% - 85%", "86% - 95%", "96% - 100%",
  ],
  personality: [
    "realistic", "investigative", "artistic",
    "social", "enterprising", "conventional",
  ],
  pathType: ["education", "career", "immigration"],
  pathCat:  ["K12", "Degree"],
};

// ── Dropdown Select Component ────────────────────────────────────────────────
const EpmSelect = ({ name, value, onChange, placeholder = "Select...", options = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const normOptions = (options || []).map(o => {
    if (typeof o === "object" && o !== null) {
      return { label: o.label || o.value, value: o.value };
    }
    const str = String(o);
    const label = /^[a-z]/.test(str) ? str.charAt(0).toUpperCase() + str.slice(1) : str;
    return { label, value: str };
  });

  const selectedOpt = normOptions.find(o => String(o.value) === String(value));
  const displayText = selectedOpt ? selectedOpt.label : placeholder;

  return (
    <div className="epm-select-container">
      {/* DESKTOP: 100% untouched native select */}
      <div className="epm-select-desktop">
        <select
          className="epm-select"
          name={name}
          value={value}
          onChange={onChange}
        >
          <option value="">{placeholder}</option>
          {normOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* MOBILE: Strictly bounded, compact custom in-DOM dropdown */}
      <div className="epm-select-mobile">
        <div
          className={`epm-select-wrap ${open ? "is-open" : ""}`}
          ref={ref}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            zIndex: open ? 1050 : 1,
          }}
        >
      <button
        type="button"
        className={`epm-select-trigger ${open ? "open" : ""} ${!value ? "is-placeholder" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.76rem",
          color: value ? "#0d1b2a" : "#94a3b8",
          background: open ? "#ffffff" : "#f8fafc",
          border: open ? "1.5px solid #2a9d8f" : "1.5px solid #e8ecf2",
          borderRadius: "8px",
          padding: "6px 10px",
          minHeight: "34px",
          cursor: "pointer",
          userSelect: "none",
          textAlign: "left",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(42,157,143,0.12)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        <span
          className="epm-select-val"
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "0.76rem",
            color: value ? "#0d1b2a" : "#94a3b8",
          }}
        >
          {displayText}
        </span>
        <svg
          className={`epm-select-chevron ${open ? "open" : ""}`}
          width="9"
          height="5"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="epm-dropdown-menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            background: "#ffffff",
            border: "1.5px solid #2a9d8f",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(13, 27, 42, 0.14)",
            padding: "3px",
            zIndex: 1050,
            maxHeight: "135px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <div
            className={`epm-dropdown-item ${!value ? "selected" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange({ target: { name, value: "" } });
              setOpen(false);
            }}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.74rem",
              color: !value ? "#0d9488" : "#64748b",
              background: !value ? "rgba(42, 157, 143, 0.15)" : "transparent",
              fontWeight: !value ? 600 : 400,
              padding: "6px 8px",
              borderRadius: "5px",
              cursor: "pointer",
              userSelect: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: "2px",
            }}
          >
            {placeholder}
          </div>
          {normOptions.map((opt) => {
            const isSelected = String(value) === String(opt.value);
            return (
              <div
                key={opt.value}
                className={`epm-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({ target: { name, value: opt.value } });
                  setOpen(false);
                }}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.74rem",
                  color: isSelected ? "#2a9d8f" : "#0f2137",
                  background: isSelected ? "rgba(42, 157, 143, 0.15)" : "transparent",
                  fontWeight: isSelected ? 600 : 400,
                  padding: "6px 8px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: "2px",
                  transition: "background 0.12s ease",
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

// ── Pill components ───────────────────────────────────────────────────────────
const Pills = ({ options, value = [], onChange }) => (
  <div className="epm-pills">
    {options.map(opt => (
      <span
        key={opt}
        className={`epm-pill${value.includes(opt) ? " on" : ""}`}
        onClick={() =>
          onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
        }
      >
        {opt}
      </span>
    ))}
  </div>
);

const PillsSingle = ({ options, value, onChange }) => (
  <div className="epm-pills">
    {options.map(opt => (
      <span
        key={opt}
        className={`epm-pill${value === opt ? " on" : ""}`}
        onClick={() => onChange(opt === value ? "" : opt)}
      >
        {opt}
      </span>
    ))}
  </div>
);

const PillsMax = ({ options, value = [], onChange, max = 2 }) => {
  const current = Array.isArray(value) ? value : (value ? [value] : []);
  return (
    <div className="epm-pills">
      {options.map(opt => {
        const isSelected = current.includes(opt);
        return (
          <span
            key={opt}
            className={`epm-pill${isSelected ? " on" : ""}`}
            onClick={() => {
              if (isSelected) {
                onChange(current.filter(v => v !== opt));
              } else if (current.length < max) {
                onChange([...current, opt]);
              }
            }}
          >
            {opt}
          </span>
        );
      })}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const EditPathForm = ({ selectedPath, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const blank = () => ({
    nameOfPath:              "",
    description:             "",
    program:                 "",
    path_type:               "",
    path_cat:                "",
    personality:             [],
    financialSituation:      [],
    curriculum:              [],
    grade:                   [],
    stream:                  [],
    length:                  "",
    destination_institution: "",
    city:                    "",
    country:                 "",
    grade_avg:               [],
  });

  const [form, setForm] = useState(blank);

  useEffect(() => {
    let s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = EPM_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!selectedPath) return;
    setForm({
      nameOfPath:              selectedPath.nameOfPath              || "",
      description:             selectedPath.description             || "",
      program:                 selectedPath.program                 || "",
      path_type:               selectedPath.path_type               || "",
      path_cat:                selectedPath.path_cat                || "",
      personality:             Array.isArray(selectedPath.personality)
                                ? selectedPath.personality
                                : (selectedPath.personality
                                    ? selectedPath.personality.split(',').map(s => s.trim()).filter(Boolean)
                                    : []),
      financialSituation:      selectedPath.financialSituation      || [],
      curriculum:              selectedPath.curriculum              || [],
      grade:                   selectedPath.grade                   || [],
      stream:                  selectedPath.stream                  || [],
      length:                  selectedPath.length                  || "",
      destination_institution:
        selectedPath.destination_institution ||
        selectedPath.university              || "",
      city:                    selectedPath.city                    || "",
      country:                 selectedPath.country                 || "",
      grade_avg:               selectedPath.grade_avg               || [],
    });
    setSuccess(false);
    setError("");
  }, [selectedPath]);

  // count changed fields
  const changedCount = Object.keys(form).filter(key => {
    const nv = form[key], ov = selectedPath?.[key];
    if (Array.isArray(nv)) {
      const oa = Array.isArray(ov) ? ov : (ov ? [ov] : []);
      return !(nv.length === oa.length && nv.every((v, i) => String(v) === String(oa[i])));
    }
    return nv !== (ov ?? "");
  }).length;

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const onTxt  = e => { const { name, value } = e.target; set(name, value); };
  const onGA   = e => set("grade_avg", e.target.value ? [e.target.value] : []);

  // overlay click closes
  const overlayClick = e => { if (e.target === e.currentTarget) onCancel?.(); };

  const save = async () => {
    if (!selectedPath?._id) return;
    setError("");
    const diff = {};
    Object.keys(form).forEach(key => {
      const nv = form[key], ov = selectedPath[key];
      if (Array.isArray(nv)) {
        const oa = Array.isArray(ov) ? ov : (ov ? [ov] : []);
        const same = nv.length === oa.length && nv.every((v, i) => String(v) === String(oa[i]));
        if (!same) diff[key] = nv;
      } else if (nv !== (ov ?? "")) {
        diff[key] = typeof nv === "string" ? nv.trim() : nv;
      }
    });
    if (!Object.keys(diff).length) { setError("No changes detected."); return; }
    setLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/paths/update/${selectedPath._id}`, diff);
      setSuccess(true);
      onSave?.(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    /* Overlay renders directly — no parent drawer wrapper needed */
    <div className="epm-overlay" onClick={overlayClick}>
      <div className="epm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="epm-header">
          <div>
            <p className="epm-header-title">Edit Path</p>
            <p className="epm-header-sub">{selectedPath?.nameOfPath || "Untitled Path"}</p>
          </div>
          <button className="epm-close" onClick={onCancel} aria-label="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="epm-success">
            <div className="epm-success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#059669" strokeWidth="2.2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3>Path updated!</h3>
            <p>Your changes have been saved successfully.</p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="epm-body">
              {error && <div className="epm-err">{error}</div>}

              {/* ── Basic Info ── */}
              <p className="epm-sec">Basic Info</p>

              <div className="epm-field">
                <label className="epm-label">Path Name</label>
                <input className="epm-input" type="text" name="nameOfPath"
                  value={form.nameOfPath} onChange={onTxt}
                  placeholder="e.g. IBDP Engineering Pathway" />
              </div>

              <div className="epm-field">
                <label className="epm-label">Description</label>
                <textarea className="epm-textarea" name="description"
                  value={form.description} onChange={onTxt}
                  placeholder="Describe what this path covers..." />
              </div>

              <div className="epm-row2">
                <div className="epm-field">
                  <label className="epm-label">Program</label>
                  <input className="epm-input" type="text" name="program"
                    value={form.program} onChange={onTxt}
                    placeholder="e.g. B.Sc. Engineering" />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Destination Institution</label>
                  <input className="epm-input" type="text"
                    name="destination_institution"
                    value={form.destination_institution} onChange={onTxt}
                    placeholder="e.g. TU Munich" />
                </div>
              </div>

              <div className="epm-row2">
                <div className="epm-field">
                  <label className="epm-label">City</label>
                  <input className="epm-input" type="text" name="city"
                    value={form.city} onChange={onTxt} placeholder="City" />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Country</label>
                  <input className="epm-input" type="text" name="country"
                    value={form.country} onChange={onTxt} placeholder="Country" />
                </div>
              </div>

              <div className="epm-row2">
                <div className="epm-field">
                  <label className="epm-label">Path Type</label>
                  <EpmSelect
                    name="path_type"
                    value={form.path_type}
                    onChange={onTxt}
                    placeholder="Select type"
                    options={OPTS.pathType}
                  />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Category</label>
                  <EpmSelect
                    name="path_cat"
                    value={form.path_cat}
                    onChange={onTxt}
                    placeholder="Select category"
                    options={OPTS.pathCat}
                  />
                </div>
              </div>

              <div className="epm-row2">
                <div className="epm-field">
                  <label className="epm-label">Length (months)</label>
                  <input className="epm-input" type="text" name="length"
                    value={form.length} onChange={onTxt} placeholder="e.g. 24" />
                </div>
                <div className="epm-field">
                  <label className="epm-label">Grade Average</label>
                  <EpmSelect
                    name="grade_avg"
                    value={form.grade_avg?.[0] || ""}
                    onChange={onGA}
                    placeholder="Select range"
                    options={OPTS.gradeAvg}
                  />
                </div>
              </div>

              {/* ── Personality ── */}
              <p className="epm-sec">Personality Type <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b" }}>(Select up to 2)</span></p>
              <div className="epm-field">
                <PillsMax options={OPTS.personality}
                  value={form.personality}
                  max={2}
                  onChange={v => set("personality", v)} />
              </div>

              {/* ── Academic Filters ── */}
              <p className="epm-sec">Academic Filters</p>

              <div className="epm-field">
                <label className="epm-label">Curriculum</label>
                <Pills options={OPTS.curriculum}
                  value={form.curriculum}
                  onChange={v => set("curriculum", v)} />
              </div>

              <div className="epm-field">
                <label className="epm-label">Grade</label>
                <Pills options={OPTS.grade}
                  value={form.grade}
                  onChange={v => set("grade", v)} />
              </div>

              <div className="epm-field">
                <label className="epm-label">Stream</label>
                <Pills options={OPTS.stream}
                  value={form.stream}
                  onChange={v => set("stream", v)} />
              </div>

              {/* ── Financial ── */}
              <p className="epm-sec">Financial Situation</p>
              <div className="epm-field" style={{ marginBottom: 8 }}>
                <Pills options={OPTS.financialSituation}
                  value={form.financialSituation}
                  onChange={v => set("financialSituation", v)} />
              </div>

            </div>

            {/* Footer */}
            <div className="epm-footer">
              <span className="epm-hint">
                {changedCount > 0
                  ? <><strong>{changedCount}</strong> field{changedCount > 1 ? "s" : ""} modified</>
                  : "No changes yet"
                }
              </span>
              <div className="epm-btns">
                <button className="epm-btn-cancel" onClick={onCancel} disabled={loading}>
                  Cancel
                </button>
                <button className="epm-btn-save" onClick={save}
                  disabled={loading || changedCount === 0}>
                  {loading
                    ? <><span className="epm-spin" /> Saving…</>
                    : "Save Changes"
                  }
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export default EditPathForm;