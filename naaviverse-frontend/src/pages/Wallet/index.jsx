import React, { useState, useEffect } from "react";
import { useStore } from "../../components/store/store.ts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Dashsidebar from "../../components/dashsidebar/dashsidebar";
import UserTopHeader from "../../components/UserTopHeader/UserTopHeader";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "./wallet.css";
import {
  GetWalletBalance,
  GetWalletTxns,
} from "../../views/inner-pages/pages/services/wallet";
import { SvgCheckCircle } from "../../utils/SvgIcons";

const Wallet = () => {
  const { accsideNav, setaccsideNav } = useStore();
  const navigate = useNavigate();

  const [showDrop, setShowDrop] = useState(false);
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [creditExpiresAt, setCreditExpiresAt] = useState(null);

  // ── NEW: track bonus vs subscription credits separately ─────────────────────
  const [bonusCredits, setBonusCredits] = useState(0);
  const [subscriptionCredits, setSubscriptionCredits] = useState(0);

  const getUserFromStorage = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user || parsed;
    } catch { return null; }
  };

  const userDetails = getUserFromStorage();
  const email = userDetails?.email || "";

  // ─────────────────────────────────────────────────────────────────────────────
  // computeExpiresAt — works for BOTH new and old DB records
  // Priority:
  //  1. txn.expiresAt        — new records (expiresAt stored in DB)
  //  2. txn.timestamp +14d   — old bonus records (no expiresAt in DB)
  //  3. userDetails.createdAt+14d — last fallback
  // ─────────────────────────────────────────────────────────────────────────────
  const computeExpiresAt = (fetchedTxns) => {
    const bonus = fetchedTxns.find((t) => t.metadata?.type === "welcome_bonus");
    if (bonus) {
      if (bonus.expiresAt) return new Date(bonus.expiresAt);
      if (bonus.timestamp) {
        const d = new Date(bonus.timestamp);
        d.setDate(d.getDate() + 14);
        return d;
      }
    }
    const createdAt = userDetails?.createdAt;
    if (createdAt) {
      const d = new Date(createdAt);
      d.setDate(d.getDate() + 14);
      return d;
    }
    return null;
  };

  // ── NEW: compute bonus vs subscription credit amounts from transactions ──────
  const computeCreditBreakdown = (fetchedTxns, totalBalance) => {
    // Sum all non-expired welcome bonus credit txns
    const bonusTotal = fetchedTxns
      .filter((t) => t.metadata?.type === "welcome_bonus" && t.type === "credit" && !t.isExpired)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Sum all subscription/plan credit txns
    const subTotal = fetchedTxns
      .filter((t) => t.metadata?.type !== "welcome_bonus" && t.type === "credit")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Debit txns (credits spent)
    const debits = fetchedTxns
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Remaining bonus (can't exceed actual balance)
    const remainingBonus = Math.max(0, Math.min(bonusTotal, totalBalance));
    // Remaining subscription credits = rest
    const remainingSub = Math.max(0, totalBalance - remainingBonus);

    setBonusCredits(remainingBonus);
    setSubscriptionCredits(remainingSub);
  };

  // REPLACE your useEffect and both fetch functions
  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    // Check approval status: unapproved users can only view profile
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    const approvalStatus = parsed?.approvalStatus || parsed?.user?.approvalStatus;
    if (approvalStatus !== "approved") {
      navigate("/dashboard/users/profile", { replace: true });
      return;
    }
    fetchBalanceThenTxns(); // <SvgCheckCircle size={14} /> chain the calls
    const createdAt = userDetails?.createdAt;
    setIsNewUser(!createdAt || moment().diff(moment(createdAt), "hours") < 24);
  }, [email]);

  const fetchBalanceThenTxns = () => {
    setBalanceLoading(true);
    setTxnsLoading(true);

    GetWalletBalance(email)
      .then((res) => {
        const fetchedBalance = res.data.status ? res.data.balance : 0;
        setBalance(fetchedBalance);
        setBalanceLoading(false);

        // [check] Now fetch txns with the real balance in hand
        return GetWalletTxns(email).then((txnRes) => {
          if (txnRes.data.status) {
            const fetchedTxns = txnRes.data.txns;
            setTxns(fetchedTxns);
            const expiry = computeExpiresAt(fetchedTxns);
            if (expiry) setCreditExpiresAt(expiry);
            computeCreditBreakdown(fetchedTxns, fetchedBalance); // <SvgCheckCircle size={14} /> real balance
          }
          setTxnsLoading(false);
        });
      })
      .catch(() => {
        setBalanceLoading(false);
        setTxnsLoading(false);
        toast.error("Could not load wallet.", { position: toast.POSITION.TOP_RIGHT });
      });
  };

  const fetchTxns = () => {
    setTxnsLoading(true);
    GetWalletTxns(email)
      .then((res) => {
        if (res.data.status) {
          const fetchedTxns = res.data.txns;
          setTxns(fetchedTxns);
          const expiry = computeExpiresAt(fetchedTxns);
          if (expiry) setCreditExpiresAt(expiry);
          // [check] FIX: use `balance` from state (already fetched by fetchBalance)
          //    not res.data.balance which is undefined from /txns endpoint
          computeCreditBreakdown(fetchedTxns, balance);
        }
        setTxnsLoading(false);
      })
      .catch(() => {
        setTxnsLoading(false);
        toast.error("Could not load transactions.", {
          position: toast.POSITION.TOP_RIGHT,
        });
      });
  };

  // ── Derived expiry values ────────────────────────────────────────────────────
  const now = new Date();
  const isCreditExpired = creditExpiresAt ? creditExpiresAt < now : false;
  const msLeft = creditExpiresAt ? Math.max(0, creditExpiresAt - now) : 0;
  const daysLeft = msLeft ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;

  // ── UPDATED: subtext only refers to bonus credits, never total balance ───────
  const getExpirySubText = () => {
    if (subscriptionCredits > 0 && bonusCredits === 0) return "Subscription credits never expire";
    if (!creditExpiresAt) return "Credits earned on signup & purchases";
    if (isCreditExpired) return "Welcome bonus expired · Subscription credits are permanent";
    if (daysLeft <= 1) return `${bonusCredits} welcome credits expire today`;
    if (daysLeft <= 3) return `${bonusCredits} welcome credits expire in ${daysLeft} days`;
    return `Welcome bonus: ${bonusCredits} credits · Expires ${moment(creditExpiresAt).format("MMM D, YYYY")}`;
  };

  // ── Group transactions by day ────────────────────────────────────────────────
  const groupedTxns = txns.reduce((acc, txn) => {
    const key = moment(txn.timestamp).format("MMDDYYYY");
    if (!acc[key]) {
      const d = moment(txn.timestamp).startOf("day");
      const today = moment().startOf("day");
      const yesterday = moment().subtract(1, "days").startOf("day");
      const label = d.isSame(today) ? "Today"
        : d.isSame(yesterday) ? "Yesterday"
          : moment(txn.timestamp).format("MMMM D, YYYY");
      acc[key] = { label, items: [] };
    }
    acc[key].items.push(txn);
    return acc;
  }, {});

  return (
    <div>
      <div className="dashboard-main">
        <div className="dashboard-body">

          <div onClick={() => setShowDrop(false)} style={{ display: "flex", height: "100%", flexShrink: 0 }}>
            <Dashsidebar approvalStatus={userDetails?.approvalStatus || "pending"} />
          </div>

          <div className="dashboard-screens" onClick={() => setShowDrop(false)}>
            <UserTopHeader />
            <div className="services-main" style={{ height: "calc(100% - 76px)", overflowY: "auto" }} onClick={() => setShowDrop(false)}>

              {/* Page heading */}
              <div className="wallet-page-header">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="6" width="18" height="13" rx="2.5" stroke="#1a1a2e" strokeWidth="1.6" />
                  <path d="M2 10h18" stroke="#1a1a2e" strokeWidth="1.6" />
                  <circle cx="16" cy="14" r="1.8" fill="#1a1a2e" />
                </svg>
                <span className="wallet-page-title">My Wallet</span>
              </div>

              <div className="wallet-container">

               {/* {creditExpiresAt && !isCreditExpired && bonusCredits > 0 && (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f97316" }}>
      Welcome bonus applied! You received <strong>50 free credits</strong> when you created your Naavi account.
    </span>
  </div>
)} */}
                {isCreditExpired && (
                  <div className="wallet-expired-banner">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, verticalAlign: "middle"}}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div className="wallet-expired-banner-text">
                      <span>Your 50 welcome credits expired on {moment(creditExpiresAt).format("MMM D, YYYY")}. </span>
                      <span>
                        {subscriptionCredits > 0
                          ? "Your subscription credits are still active."
                          : "Subscribe to unlock full access."}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Balance card ─────────────────────────────────────────── */}
                {balanceLoading ? (
                  <Skeleton className="wallet-balance-skeleton" height={160} />
                ) : (
                  <div className="wallet-balance-card">
                    <div className="wallet-balance-badge">Active</div>
                    <div className="wallet-balance-label">Available Credits</div>
                    <div className="wallet-balance-amount">
                      {balance}<span className="wallet-balance-unit"> credits</span>
                    </div>

                    {/* ── NEW: credit breakdown — bonus vs subscription ──── */}
                    <div className="wallet-credit-breakdown">
                      {subscriptionCredits > 0 && (
                        <div className="wallet-credit-row">
                          <span className="wallet-credit-chip wallet-credit-chip--permanent">
                             {subscriptionCredits} Subscription Credits · Never Expire
                          </span>
                        </div>
                      )}
                      {bonusCredits > 0 && !isCreditExpired && (
                        <div className="wallet-credit-row">
                          <span className={`wallet-credit-chip wallet-credit-chip--bonus${daysLeft <= 3 ? " warn" : ""}`}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: "middle"}}>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>
{bonusCredits} Welcome Bonus · Expires {moment(creditExpiresAt).format("MMM D, YYYY")}                          </span>
                        </div>
                      )}
                      {isCreditExpired && bonusCredits === 0 && subscriptionCredits === 0 && (
                        <div className="wallet-credit-row">
                          <span className="wallet-credit-chip wallet-credit-chip--expired">
                            Welcome bonus expired
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── Expiry warning ONLY when bonus is close to expiring ── */}
                    {!isCreditExpired && daysLeft > 0 && daysLeft <= 4 && bonusCredits > 0 && (
                      <div className="wallet-balance-sub wallet-balance-sub--warning">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span className="wallet-balance-sub-text">
                          Your {bonusCredits} welcome credits expire in {daysLeft} day{daysLeft !== 1 ? "s" : ""} — use them first!
                        </span>
                      </div>
                    )}

                    {/* No warning shown when only subscription credits remain */}
                    {(bonusCredits === 0 || isCreditExpired) && subscriptionCredits > 0 && (
                      <div className="wallet-balance-sub">
                        Subscription credits never expire
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction list */}
                <div className="wallet-section-title">Recent Transactions</div>

                {txnsLoading ? (
                  <div className="wallet-tx-list">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="wallet-tx-row">
                        <Skeleton circle width={36} height={36} />
                        <div style={{ flex: 1, marginLeft: 12 }}>
                          <Skeleton width={200} />
                          <Skeleton width={140} style={{ marginTop: 4 }} />
                        </div>
                        <Skeleton width={50} />
                      </div>
                    ))}
                  </div>
                ) : txns.length === 0 ? (
                  <div className="wallet-empty-state">
                    No transactions yet. Your credit history will appear here.
                  </div>
                ) : (
                  Object.values(groupedTxns).map((group) => (
                    <div key={group.label}>
                      <div className="wallet-day-label">{group.label}</div>
                      <div className="wallet-tx-list">
                        {group.items.map((txn) => (
                          <WalletTxnRow
                            key={txn._id}
                            txn={txn}
                            bonusExpiresAt={creditExpiresAt}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}

                <div className="wallet-info-note">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="5.5" stroke="#5b3fa0" strokeWidth="1.4" />
                    <path d="M7 6v4M7 4.5v.01" stroke="#5b3fa0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Credits are used to unlock paths, premium counselling sessions, and exclusive Naavi features.
                  {" "}Subscription credits are permanent and never expire.
                  {creditExpiresAt && !isCreditExpired && bonusCredits > 0 && (
                    <> Welcome bonus credits expire {moment(creditExpiresAt).fromNow()}.</>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

// ─── WalletTxnRow ─────────────────────────────────────────────────────────────
const WalletTxnRow = ({ txn, bonusExpiresAt }) => {
  const isCredit = txn.type === "credit";
  const isBonus = txn.metadata?.type === "welcome_bonus";
  const isExpired = txn.isExpired;

  // Expiry only applies to welcome bonus rows, never to subscription credits
  const resolvedExpiry = (() => {
    if (!isBonus) return null;
    if (txn.expiresAt) return new Date(txn.expiresAt);
    if (bonusExpiresAt) return bonusExpiresAt;
    return null;
  })();

  const expiryLabel = (() => {
    if (!resolvedExpiry) return null;
    const now = new Date();
    if (resolvedExpiry < now) return { text: "Expired", warn: true, gone: true };
    const days = Math.ceil((resolvedExpiry - now) / (1000 * 60 * 60 * 24));
    if (days <= 1) return { text: "Expires today", warn: true, gone: false };
    if (days <= 3) return { text: `Expires in ${days}d`, warn: true, gone: false };
    return { text: `Expires ${moment(resolvedExpiry).format("MMM D")}`, warn: false, gone: false };
  })();

  return (
    <div className={`wallet-tx-row${isExpired ? " wallet-tx-row--expired" : ""}`}>
      <div
        className="wallet-tx-icon"
        style={{
          background: isBonus ? "#e8eeff" : isCredit ? "#eaf3de" : "#faeeda",
          color: isBonus ? "#185FA5" : isCredit ? "#3B6D11" : "#854F0B",
          opacity: isExpired ? 0.45 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isBonus ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ) : isCredit ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        )}
      </div>

      <div className="wallet-tx-info">
        <div className="wallet-tx-name" style={{ opacity: isExpired ? 0.5 : 1 }}>
          {txn.metadata?.description || (isCredit ? "Credits added" : "Credits used")}
          {/* Expiry pill only on bonus rows */}
          {expiryLabel && (
            <span className={`wallet-tx-expiry-pill${expiryLabel.warn ? " warn" : ""}${expiryLabel.gone ? " expired" : ""}`}>
              {expiryLabel.text}
            </span>
          )}
          {/* Permanent badge on non-bonus credit rows */}
          {/* {isCredit && !isBonus && (
            <span className="wallet-tx-expiry-pill permanent">Never Expires</span>
          )} */}
        </div>
        <div className="wallet-tx-date">
          {moment(txn.timestamp).format("h:mm A")}
          {txn.metadata?.source ? ` · ${txn.metadata.source}` : ""}
        </div>
      </div>

      <div
        className="wallet-tx-amount"
        style={{
          color: isExpired ? "#bbb" : isCredit ? "#3B6D11" : "#A32D2D",
          opacity: isExpired ? 0.5 : 1,
        }}
      >
        {isCredit ? "+" : "−"}{txn.amount}
        {isExpired && <div className="wallet-tx-expired-tag">expired</div>}
      </div>
    </div>
  );
};

export default Wallet;