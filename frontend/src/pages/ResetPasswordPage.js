import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ResetPasswordPage() {
    const { token } = useParams();

    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setMessage('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);

            await api.resetPassword(token, password);

            setMessage('Password reset successful');

            setTimeout(() => {
                navigate('/');
            }, 2000);

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
                <h2
                    style={{
                        marginBottom: 10,
                        fontSize: 28,
                        fontWeight: 700,
                    }}
                >
                    Reset Password
                </h2>

                <p
                    style={{
                        color: 'var(--text2)',
                        marginBottom: 24,
                        fontSize: 14,
                    }}
                >
                    Enter your new password below.
                </p>

                <div className="input-group">
                    <label className="input-label">
                        New Password
                    </label>

                    <input
                        className="input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div
                    className="input-group"
                    style={{
                        marginTop: 14,
                    }}
                >
                    <label className="input-label">
                        Confirm Password
                    </label>

                    <input
                        className="input"
                        type="password"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
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
                    {loading ? 'Updating...' : 'Reset Password'}
                </button>
            </div>
        </div>
    );
}