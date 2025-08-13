// --- src/app/views/CurriculumBuilder.js ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
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
        const { moduleId, title, order, lessonId, description, thumbnailUrl, videoUrl, chatbotEmbedCode, unlockCode } = formData;

        if (type === 'addModule' || type === 'editModule') {
            const path = type === 'addModule' ? `courseContent/modules/${moduleId}` : `courseContent/modules/${data.moduleId}`;
            await set(ref(database, path), {
                title: title,
                order: parseInt(order, 10),
                lessons: type === 'editModule' ? data.lessons : {}
            });
        } else if (type === 'addLesson' || type === 'editLesson') {
            const path = type === 'addLesson' ? `courseContent/modules/${data.moduleId}/lessons/${lessonId}` : `courseContent/modules/${data.moduleId}/lessons/${data.lessonId}`;
            await set(ref(database, path), {
                title: title,
                description: description,
                order: parseInt(order, 10),
                thumbnailUrl: thumbnailUrl || '',
                videoUrl: videoUrl,
                chatbotEmbedCode: chatbotEmbedCode,
                unlockCode: unlockCode
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

            {modal.type && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h2>
                            {modal.type === 'addModule' && 'Add New Module'}
                            {modal.type === 'editModule' && 'Edit Module'}
                            {modal.type === 'addLesson' && 'Add New Lesson'}
                            {modal.type === 'editLesson' && 'Edit Lesson'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {(modal.type === 'addModule' || modal.type === 'editModule') && <>
                                <input name="moduleId" onChange={handleFormChange} placeholder="Module ID (e.g., module_01)" defaultValue={modal.data.moduleId} required disabled={modal.type === 'editModule'} />
                                <input name="title" onChange={handleFormChange} placeholder="Module Title" defaultValue={formData.title} required />
                                <input name="order" type="number" onChange={handleFormChange} placeholder="Order (e.g., 1)" defaultValue={formData.order} required />
                            </>}
                            {(modal.type === 'addLesson' || modal.type === 'editLesson') && <>
                                <input name="lessonId" onChange={handleFormChange} placeholder="Lesson ID (e.g., lesson_01)" defaultValue={modal.data.lessonId} required disabled={modal.type === 'editLesson'} />
                                <input name="title" onChange={handleFormChange} placeholder="Lesson Title" defaultValue={formData.title} required />
                                <textarea name="description" onChange={handleFormChange} placeholder="Lesson Description" defaultValue={formData.description} />
                                <input name="order" type="number" onChange={handleFormChange} placeholder="Order (e.g., 1)" defaultValue={formData.order} required />
                                <input name="videoUrl" onChange={handleFormChange} placeholder="YouTube Video URL" defaultValue={formData.videoUrl} required />
                                <input name="thumbnailUrl" onChange={handleFormChange} placeholder="Thumbnail Image URL (Optional)" defaultValue={formData.thumbnailUrl} />
                                <textarea name="chatbotEmbedCode" onChange={handleFormChange} placeholder="Chatbot Embed Code" defaultValue={formData.chatbotEmbedCode} required />
                                <input name="unlockCode" onChange={handleFormChange} placeholder="Unlock Code" defaultValue={formData.unlockCode} required />
                            </>}
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="submit-button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumBuilder;