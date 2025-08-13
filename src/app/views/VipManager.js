// --- src/app/views/VipManager.js (v3.0 - With Authenticated Fetch) ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { auth, database } from '../lib/firebase'; // We only need these two now
import './VipManager.css';

const VipManager = () => {
    const [vips, setVips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false });
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const vipsList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setVips(vipsList); setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openModal = () => {
        setFormData({ name: '', email: '' });
        setModal({ isOpen: true }); setError('');
    };
    const closeModal = () => setModal({ isOpen: false });
    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddVip = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const user = auth.currentUser;
        if (!user) {
            setError("Authentication error. Please sign out and sign back in.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Manually get the user's ID token (their credentials)
            const idToken = await user.getIdToken(true);
            const functionUrl = 'https://us-central1-smartbot-status-dashboard.cloudfunctions.net/addNewVip';
            
            // Make a direct, authenticated call using the browser's fetch API
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Presenting our credentials
                },
                body: JSON.stringify({ data: { name: formData.name, email: formData.email } })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error.message);
            }

            alert(result.result.message);
            closeModal();

        } catch (err) {
            console.error("Error calling function:", err);
            setError(err.message || 'An unknown error occurred.');
        }
        setIsSubmitting(false);
    };

    if (loading) return <div>Loading VIP Data...</div>;

    return (
        <div className="manager-container">
            <div className="manager-header">
                <h1>VIP Member Management</h1>
                <button onClick={openModal} className="add-button">+ Add New VIP</button>
            </div>
            <div className="manager-table-wrapper">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Progress</th><th>Actions</th></tr></thead>
                    <tbody>
                        {vips.map(vip => (
                            <tr key={vip.id}>
                                <td>{vip.name}</td>
                                <td>{vip.email}</td>
                                <td>{vip.progress?.currentLessonId || 'N/A'}</td>
                                <td>
                                    <button className="action-button">Messages</button>
                                    <button className="action-button">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modal.isOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h2>Add New VIP</h2>
                        <p>This will create a new user and send them a welcome email with their temporary password.</p>
                        <form onSubmit={handleAddVip}>
                            <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required />
                            <input name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="Email Address" required />
                            {error && <p className="error-message">{error}</p>}
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="submit-button" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating User...' : 'Add VIP & Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VipManager;