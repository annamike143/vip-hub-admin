// --- src/app/views/CurriculumBuilder.js (THE DEFINITIVE 'chatbotId' VERSION) ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../lib/firebase';
import './CurriculumBuilder.css';

const CurriculumBuilder = () => {
    const [modules, setModules] = useState({});
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const modulesRef = ref(database, 'courseContent/modules');
        const unsubscribe = onValue(modulesRef, (snapshot) => {
            const data = snapshot.val();
            setModules(data || {});
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openModal = (type, data = {}) => {
        setModal({ type, data });
        setFormData(data.initialData || {});
    };
    const closeModal = () => setModal({ type: null, data: null });
    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { type, data } = modal;
        
        if (type === 'addModule' || type === 'editModule') {
            const { moduleId, title, order } = formData;
            const path = type === 'addModule' ? `courseContent/modules/${moduleId}` : `courseContent/modules/${data.moduleId}`;
            await set(ref(database, path), {
                title: title,
                order: parseInt(order, 10),
                lessons: type === 'editModule' ? data.lessons : {}
            });
        } else if (type === 'addLesson' || type === 'editLesson') {
            // --- THE CORRECTED LOGIC ---
            const { lessonId, title, description, order, videoUrl, thumbnailUrl, chatbotId, unlockCode } = formData;
            const path = type === 'addLesson' ? `courseContent/modules/${data.moduleId}/lessons/${lessonId}` : `courseContent/modules/${data.moduleId}/lessons/${data.lessonId}`;
            await set(ref(database, path), {
                title, description, unlockCode,
                order: parseInt(order, 10),
                videoUrl, thumbnailUrl: thumbnailUrl || '',
                chatbotId: chatbotId || '' // Now correctly saves 'chatbotId'
            });
        }
        closeModal();
    };

    const handleRemove = async (type, moduleId, lessonId = null) => {
        let path;
        let confirmMessage;
        if (type === 'module') {
            path = `courseContent/modules/${moduleId}`;
            confirmMessage = "Are you sure you want to delete this entire module and all its lessons?";
        } else {
            path = `courseContent/modules/${moduleId}/lessons/${lessonId}`;
            confirmMessage = "Are you sure you want to delete this lesson?";
        }
        if (window.confirm(confirmMessage)) {
            await remove(ref(database, path));
        }
    };

    if (loading) return <div>Loading Curriculum...</div>;

    return (
        <div className="builder-container">
            <div className="builder-header">
                <h1>Curriculum Builder</h1>
                <button onClick={() => openModal('addModule')} className="add-button">+ Add New Module</button>
            </div>
            <div className="modules-list">
                {Object.keys(modules).sort((a,b) => modules[a].order - modules[b].order).map(moduleId => {
                    const moduleData = modules[moduleId];
                    return (
                        <div key={moduleId} className="module-card">
                            <div className="module-header">
                                <h3>{moduleData.order}. {moduleData.title}</h3>
                                <div>
                                    <button onClick={() => openModal('editModule', { moduleId, lessons: moduleData.lessons, initialData: { title: moduleData.title, order: moduleData.order } })}>Edit</button>
                                    <button onClick={() => handleRemove('module', moduleId)} className="remove-button">Delete Module</button>
                                    <button onClick={() => openModal('addLesson', { moduleId })} className="add-lesson-button">+ Add Lesson</button>
                                </div>
                            </div>
                            <div className="lessons-list">
                                {moduleData.lessons && Object.keys(moduleData.lessons).sort((a,b) => moduleData.lessons[a].order - moduleData.lessons[b].order).map(lessonId => {
                                    const lesson = moduleData.lessons[lessonId];
                                    return (
                                        <div key={lessonId} className="lesson-item">
                                            <span>{lesson.order}. {lesson.title}</span>
                                            <div>
                                                <button onClick={() => openModal('editLesson', { moduleId, lessonId, initialData: lesson })}>Edit</button>
                                                <button onClick={() => handleRemove('lesson', moduleId, lessonId)} className="remove-button">Delete</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="modal-backdrop" style={{ display: modal.type ? 'flex' : 'none' }}>
                <div className="modal-content">
                    <h2>
                        {modal.type === 'addModule' && 'Add New Module'}
                        {modal.type === 'editModule' && 'Edit Module'}
                        {modal.type === 'addLesson' && 'Add New Lesson'}
                        {modal.type === 'editLesson' && 'Edit Lesson'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        {(modal.type === 'addModule' || modal.type === 'editModule') && <>
                            <label>Module ID</label>
                            <input name="moduleId" onChange={handleFormChange} placeholder="e.g., module_01" defaultValue={formData.moduleId} required disabled={modal.type === 'editModule'} />
                            <label>Module Title</label>
                            <input name="title" onChange={handleFormChange} placeholder="e.g., The Foundations" defaultValue={formData.title} required />
                            <label>Order</label>
                            <input name="order" type="number" onChange={handleFormChange} placeholder="e.g., 1" defaultValue={formData.order} required />
                        </>}
                        {(modal.type === 'addLesson' || modal.type === 'editLesson') && <>
                            <label>Lesson ID</label>
                            <input name="lessonId" onChange={handleFormChange} placeholder="e.g., lesson_01" defaultValue={formData.lessonId} required disabled={modal.type === 'editLesson'} />
                            <label>Lesson Title</label>
                            <input name="title" onChange={handleFormChange} placeholder="e.g., Welcome to the VIP Hub!" defaultValue={formData.title} required />
                            <label>Description</label>
                            <textarea name="description" onChange={handleFormChange} placeholder="A short summary of the lesson." defaultValue={formData.description} />
                            <label>Order</label>
                            <input name="order" type="number" onChange={handleFormChange} placeholder="e.g., 1" defaultValue={formData.order} required />
                            <label>YouTube Video URL</label>
                            <input name="videoUrl" onChange={handleFormChange} placeholder="https://www.youtube.com/watch?v=..." defaultValue={formData.videoUrl} required />
                            <label>Thumbnail Image URL (Optional)</label>
                            <input name="thumbnailUrl" onChange={handleFormChange} placeholder="https://..." defaultValue={formData.thumbnailUrl} />
                            {/* --- THE CORRECTED FORM FIELD --- */}
                            <label>AI Mentor Bot ID</label>
                            <input name="chatbotId" onChange={handleFormChange} placeholder="e.g., 41717" defaultValue={formData.chatbotId} required />
                            <label>Unlock Code</label>
                            <input name="unlockCode" onChange={handleFormChange} placeholder="The secret code to unlock the next lesson" defaultValue={formData.unlockCode} required />
                        </>}
                        <div className="modal-actions">
                            <button type="button" onClick={closeModal}>Cancel</button>
                            <button type="submit" className="submit-button">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default CurriculumBuilder;