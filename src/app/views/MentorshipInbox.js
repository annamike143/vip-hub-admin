// --- src/app/views/MentorshipInbox.js (v2.0 - Full Functionality) ---
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { database } from '../lib/firebase';
import './MentorshipInbox.css';

const MentorshipInbox = () => {
    const [threads, setThreads] = useState({});
    const [users, setUsers] = useState({});
    const [courseContent, setCourseContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const threadsRef = ref(database, 'messagingThreads');
        const usersRef = ref(database, 'users');
        const courseRef = ref(database, 'courseContent/modules');

        const unsubThreads = onValue(threadsRef, (snapshot) => setThreads(snapshot.val() || {}));
        const unsubUsers = onValue(usersRef, (snapshot) => setUsers(snapshot.val() || {}));
        const unsubCourse = onValue(courseRef, (snapshot) => {
            setCourseContent(snapshot.val() || {});
            setLoading(false);
        });

        return () => {
            unsubThreads();
            unsubUsers();
            unsubCourse();
        };
    }, []);

    const getLessonTitle = (lessonId) => {
        for (const moduleId in courseContent) {
            if (courseContent[moduleId].lessons && courseContent[moduleId].lessons[lessonId]) {
                return courseContent[moduleId].lessons[lessonId].title;
            }
        }
        return 'Unknown Lesson';
    };

    const handleSelectThread = (userId, lessonId) => {
        setSelectedThread({ userId, lessonId, messages: threads[userId][lessonId] });
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;
        
        const { userId, lessonId } = selectedThread;
        const messageRef = ref(database, `messagingThreads/${userId}/${lessonId}`);
        
        const newMessage = {
            sender: 'admin',
            text: replyText,
            timestamp: serverTimestamp()
        };

        await push(messageRef, newMessage);
        setReplyText('');
    };
    
    const threadList = useMemo(() => {
        const list = [];
        for(const userId in threads) {
            for(const lessonId in threads[userId]) {
                list.push({ userId, lessonId });
            }
        }
        return list;
    }, [threads]);

    if (loading) return <div>Loading Inbox...</div>;

    return (
        <div className="inbox-container">
            <div className="thread-list-panel">
                <div className="panel-header"><h2>Inbox Threads</h2></div>
                <div className="threads">
                    {threadList.length > 0 ? threadList.map(({ userId, lessonId }) => (
                        <div 
                            key={`${userId}-${lessonId}`} 
                            className={`thread-item ${selectedThread?.userId === userId && selectedThread?.lessonId === lessonId ? 'active' : ''}`}
                            onClick={() => handleSelectThread(userId, lessonId)}
                        >
                            <div className="thread-user">{users[userId]?.name || 'Unknown User'}</div>
                            <div className="thread-lesson">{getLessonTitle(lessonId)}</div>
                        </div>
                    )) : <div className="empty-threads">No messages yet.</div>}
                </div>
            </div>

            <div className="message-view-panel">
                {selectedThread ? (
                    <>
                        <div className="panel-header">
                            <h3>{getLessonTitle(selectedThread.lessonId)}</h3>
                            <p>Conversation with {users[selectedThread.userId]?.name}</p>
                        </div>
                        <div className="messages-area">
                            {Object.keys(selectedThread.messages).map(msgId => {
                                const msg = selectedThread.messages[msgId];
                                return (
                                    <div key={msgId} className={`message-bubble ${msg.sender}`}>
                                        {msg.text}
                                    </div>
                                )
                            })}
                        </div>
                        <form className="reply-form" onSubmit={handleSendReply}>
                            <input 
                                type="text" 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                            />
                            <button type="submit">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="no-thread-selected">
                        <p>Select a thread to view the conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorshipInbox;