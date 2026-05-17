import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setMessage('');

        if (!email.includes('@')) {
            setError('Enter a valid email');
            return;
        }

        try {
            setLoading(true);

            const res = await api.forgotPassword(email);

            setMessage(res.message);

        } catch (e) {
            setError(e.message);
        }

        setLoading(false);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)',
                padding: 20,
            }}
        >
            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: 420,
                }}
            >
                <Link
                    to="/"
                    className="back-link-custom"
                >
                    <button
                        className="premium-back-btn"
                        type="button"
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <span>Back to Login</span>
                </Link>
                <h2
                    style={{
                        marginBottom: 10,
                        fontSize: 28,
                        fontWeight: 700,
                    }}
                >
                    Forgot Password
                </h2>

                <p
                    style={{
                        color: 'var(--text2)',
                        marginBottom: 24,
                        fontSize: 14,
                    }}
                >
                    Enter your account email to receive a password reset link.
                </p>

                <div className="input-group">
                    <label className="input-label">
                        Email
                    </label>

                    <input
                        className="input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {error && (
                    <div
                        style={{
                            marginTop: 14,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171',
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        style={{
                            marginTop: 14,
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            color: '#4ade80',
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        {message}
                    </div>
                )}

                <button
                    className="btn btn-primary w-full"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        marginTop: 18,
                        height: 46,
                    }}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </div>
        </div>
    );
}