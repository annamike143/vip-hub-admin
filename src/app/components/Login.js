// --- src/app/components/Login.js (v1.3 - DEFINITIVE SYNTAX FIX) ---
'use client';

import React, { useState } from 'react'; // <-- SYNTAX CORRECTED
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../lib/firebase';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>VIP Command Center</h1>
                <p>Please sign in to continue</p>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;