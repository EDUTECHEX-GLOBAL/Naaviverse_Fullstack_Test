import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SvgCheck } from "../utils/SvgIcons";

const PurchaseSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    
    const orderId = location.state?.orderId || '';
    const item = location.state?.purchasedItem || null;
    const email = location.state?.studentEmail || '';

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(timer);
                    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                    if (isMobile) {
                        navigate('/dashboard/users/Marketplace', { replace: true, state: { fromPurchaseSuccess: true } });
                    } else {
                        navigate('/dashboard/users/Marketplace');
                    }
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [navigate]);

    const handleGoToMarketplace = () => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        if (isMobile) {
            navigate('/dashboard/users/Marketplace', { replace: true, state: { fromPurchaseSuccess: true } });
        } else {
            navigate('/dashboard/users/Marketplace');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0d14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Poppins', sans-serif",
            color: '#f0f4ff'
        }}>
            <div style={{
                background: '#111622',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '48px 40px',
                maxWidth: 480,
                width: '90%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.12)',
                    border: '2px solid rgba(16,185,129,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 32, color: '#10b981'
                }}><SvgCheck size={14} /></div>

                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>
                    Purchase Successful!
                </h1>

                {item && (
                    <p style={{ color: '#8b9abf', fontSize: '0.9rem', marginBottom: 24 }}>
                        You have successfully enrolled in <strong style={{ color: '#f0f4ff' }}>{item.name}</strong>
                    </p>
                )}

                {orderId && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 10, padding: '12px 16px',
                        marginBottom: 24, fontSize: '0.82rem', color: '#8b9abf',
                        width: '100%', boxSizing: 'border-box'
                    }}>
                        Order ID: <strong style={{ color: '#6366f1' }}>{orderId}</strong>
                    </div>
                )}

                <p style={{ color: '#4a5578', fontSize: '0.82rem', marginBottom: 24 }}>
                    Redirecting to Marketplace in <strong style={{ color: '#6366f1' }}>{countdown}s</strong>...
                </p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <button
                        onClick={handleGoToMarketplace}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none', borderRadius: 10, color: '#fff',
                            cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: '0.9rem', fontWeight: 600,
                            padding: '12px 28px',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            textAlign: 'center'
                        }}
                    >
                        Go to Marketplace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseSuccess;