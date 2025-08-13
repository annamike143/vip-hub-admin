// --- src/app/page.js (v2.2 - THE DEFINITIVE FINAL COMMAND CENTER) ---
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './lib/firebase';
import Login from './components/Login';
import VipManager from './views/VipManager';
import CurriculumBuilder from './views/CurriculumBuilder';
import MentorshipInbox from './views/MentorshipInbox'; // <-- IMPORTING THE FINAL PIECE

import './components/Login.css';
import './views/VipManager.css';
import './views/CurriculumBuilder.css';
import './views/MentorshipInbox.css'; // <-- THE FINAL STYLES

// This is our main dashboard component that contains the tabs
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('vips'); 
    const handleSignOut = () => { signOut(auth).catch(error => console.error("Sign out error", error)); };

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                <h1>VIP Command Center</h1>
                <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Sign Out</button>
            </header>
            
            <nav className="tab-nav">
                <button className={activeTab === 'vips' ? 'active' : ''} onClick={() => setActiveTab('vips')}>
                    VIP Management
                </button>
                <button className={activeTab === 'curriculum' ? 'active' : ''} onClick={() => setActiveTab('curriculum')}>
                    Curriculum Builder
                </button>
                <button className={activeTab === 'inbox' ? 'active' : ''} onClick={() => setActiveTab('inbox')}>
                    Mentorship Inbox
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'vips' && <VipManager />}
                {activeTab === 'curriculum' && <CurriculumBuilder />}
                {activeTab === 'inbox' && <MentorshipInbox />}
            </div>
        </div>
    );
};

// This is the main page component that decides to show Login or Dashboard
export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  return ( <div>{user ? <Dashboard /> : <Login />}</div> );
}