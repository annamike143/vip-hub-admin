// --- src/app/views/CurriculumBuilder.js (v2.2 - LINT FIX) ---
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

        if (type === 'addModule' || type === 'editModule') {
            const path = type === 'addModule' ? `courseContent/modules/${formData.moduleId}` : `courseContent/modules/${data.moduleId}`;
            await set(ref(database, path), {
                title: formData.title,
                order: parseInt(formData.order, 10),
                lessons: type === 'editModule' ? data.lessons : {}
            });
        } else if (type === 'addLesson' || type === 'editLesson') {
            const path = type === 'addLesson' ? `courseContent/modules/${data.moduleId}/lessons/${formData.lessonId}` : `courseContent/modules/${data.moduleId}/lessons/${data.lessonId}`;
            await set(ref(database, path), {
                title: formData.title,
                description: formData.description,
                order: parseInt(formData.order, 10),
                thumbnailUrl: formData.thumbnailUrl || '',
                videoUrl: formData.videoUrl,
                chatbotEmbedCode: formData.chatbotEmbedCode,
                unlockCode: formData.unlockCode
            });
        }
        closeModal();
    };

    const handleRemove = async (type, moduleId, lessonId = null) => {
        let path;
        let confirmMessage;

        if (type === 'module') {
            path = `courseContent/modules/${moduleId}`;
            confirmMessage = "Are you sure you want to delete this entire module and all its lessons? This cannot be undone.";
        } else if (type === 'lesson') {
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
                    const moduleData = modules[moduleId]; // <-- RENAMED VARIABLE
                    return (
                        <div key={moduleId} className="module-card">
                            <div className="module-header">
                                <h3>{moduleData.order}. {moduleData.title}</h3>
                                <div>
                                    <button onClick={() => openModal('editModule', { moduleId, lessons: moduleData.lessons, initialData: { title: moduleData.title, order: moduleData.order } })}>Edit</button>
                                    <button onClick={() => handleRemove('module', moduleId)} className="remove">Delete Module</button>
                                    <button onClick={() => openModal('addLesson', { moduleId })}>+ Add Lesson</button>
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
                                                <button onClick={() => handleRemove('lesson', moduleId, lessonId)} className="remove">Delete Lesson</button>
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
                        {/* ... modal JSX is the same ... */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumBuilder;