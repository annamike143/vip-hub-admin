// --- functions/index.js (v1.1 - With CORS Security) ---
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // Import and configure CORS

admin.initializeApp();

exports.addNewVip = functions.https.onRequest((req, res) => {
    // This is the CORS wrapper. It handles the security handshake.
    cors(req, res, async () => {
        // 1. Authentication Check
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            console.error("No Firebase ID token was passed as a Bearer token in the Authorization header.");
            res.status(401).send("Unauthorized");
            return;
        }
        // --- New Function for Unlocking Lessons ---
exports.unlockNextLesson = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to unlock lessons.");
    }

    const { currentLessonId, submittedCode } = data;
    const userId = context.auth.uid;
    const db = admin.database();

    try {
        // 2. Get all course content to find the current lesson and the next one
        const courseSnapshot = await db.ref("courseContent/modules").once("value");
        const modules = courseSnapshot.val();
        
        let currentLesson = null;
        let nextLessonId = null;
        let foundCurrent = false;

        const sortedModules = Object.keys(modules).sort((a,b) => modules[a].order - modules[b].order);
        for (const moduleId of sortedModules) {
            const moduleData = modules[moduleId];
            if (moduleData.lessons) {
                const sortedLessons = Object.keys(moduleData.lessons).sort((a,b) => moduleData.lessons[a].order - moduleData.lessons[b].order);
                for (const lessonId of sortedLessons) {
                    if (foundCurrent) {
                        nextLessonId = lessonId;
                        break;
                    }
                    if (lessonId === currentLessonId) {
                        currentLesson = moduleData.lessons[lessonId];
                        foundCurrent = true;
                    }
                }
            }
            if (nextLessonId) break;
        }

        // 3. Validation
        if (!currentLesson) {
            throw new functions.https.HttpsError("not-found", "Current lesson could not be found.");
        }
        if (currentLesson.unlockCode.trim().toLowerCase() !== submittedCode.trim().toLowerCase()) {
            throw new functions.https.HttpsError("invalid-argument", "Incorrect unlock code. Please try again.");
        }
        if (!nextLessonId) {
            return { success: true, message: "Congratulations! You have completed the final lesson!" };
        }

        // 4. Update the user's progress in the database
        const progressRef = db.ref(`/users/${userId}/progress/unlockedLessons`);
        const progressSnapshot = await progressRef.once("value");
        const unlockedLessons = progressSnapshot.val() || [];
        
        if (!unlockedLessons.includes(nextLessonId)) {
            unlockedLessons.push(nextLessonId);
        }

        await progressRef.set(unlockedLessons);

        return { success: true, message: `Success! Lesson "${getLessonTitle(nextLessonId, modules)}" has been unlocked!` };

    } catch (error) {
        console.error("Error unlocking lesson:", error);
        if (error.code) throw error;
        throw new functions.https.HttpsError("internal", "An error occurred while unlocking the lesson.");
    }
});

// Helper function to get lesson title for the success message
const getLessonTitle = (lessonId, modules) => {
    for (const moduleId in modules) {
        if (modules[moduleId].lessons && modules[moduleId].lessons[lessonId]) {
            return modules[moduleId].lessons[lessonId].title;
        }
    }
    return 'Next Lesson';
};
        // --- New Function for Unlocking Lessons ---
exports.unlockNextLesson = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to unlock lessons.");
    }

    const { currentLessonId, submittedCode } = data;
    const userId = context.auth.uid;
    const db = admin.database();

    try {
        // 2. Get all course content to find the current lesson and the next one
        const courseSnapshot = await db.ref("courseContent/modules").once("value");
        const modules = courseSnapshot.val();
        
        let currentLesson = null;
        let nextLessonId = null;
        let foundCurrent = false;

        // This complex loop finds the current lesson and identifies the *next* one in order
        const sortedModules = Object.keys(modules).sort((a,b) => modules[a].order - modules[b].order);
        for (const moduleId of sortedModules) {
            const moduleData = modules[moduleId];
            if (moduleData.lessons) {
                const sortedLessons = Object.keys(moduleData.lessons).sort((a,b) => moduleData.lessons[a].order - moduleData.lessons[b].order);
                for (const lessonId of sortedLessons) {
                    if (foundCurrent) {
                        nextLessonId = lessonId; // We found the next lesson!
                        break;
                    }
                    if (lessonId === currentLessonId) {
                        currentLesson = moduleData.lessons[lessonId];
                        foundCurrent = true;
                    }
                }
            }
            if (nextLessonId) break;
        }

        // 3. Validation
        if (!currentLesson) {
            throw new functions.https.HttpsError("not-found", "Current lesson could not be found.");
        }
        if (currentLesson.unlockCode.trim().toLowerCase() !== submittedCode.trim().toLowerCase()) {
            throw new functions.https.HttpsError("invalid-argument", "Incorrect unlock code. Please try again.");
        }
        if (!nextLessonId) {
            // This means they just finished the last lesson
            return { success: true, message: "Congratulations! You have completed the final lesson!" };
        }

        // 4. Update the user's progress in the database
        const progressRef = db.ref(`/users/${userId}/progress/unlockedLessons`);
        const progressSnapshot = await progressRef.once("value");
        const unlockedLessons = progressSnapshot.val() || [];
        
        if (!unlockedLessons.includes(nextLessonId)) {
            unlockedLessons.push(nextLessonId);
        }

        await progressRef.set(unlockedLessons);

        return { success: true, message: `Success! Lesson unlocked.` };

    } catch (error) {
        console.error("Error unlocking lesson:", error);
        // Re-throw specific errors, or a generic one
        if (error.code) throw error;
        throw new functions.https.HttpsError("internal", "An error occurred while unlocking the lesson.");
    }
});

        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            // Now we know the user is an authenticated Firebase user.
            console.log("ID Token correctly decoded:", decodedIdToken);

            // 2. Extract Data
            const { name, email } = req.body.data;
            if (!name || !email) {
                throw new Error("Please provide both a name and an email.");
            }

            // 3. Create the User in Auth
            const tempPassword = Math.random().toString(36).slice(-8);
            const userRecord = await admin.auth().createUser({
                email: email,
                password: tempPassword,
                displayName: name,
            });

            // 4. Create User Profile in RTDB
            const db = admin.database();
            await db.ref(`/users/${userRecord.uid}`).set({
                email: userRecord.email,
                name: userRecord.displayName,
                progress: {
                    currentLessonId: "lesson_01",
                    unlockedLessons: ["lesson_01"]
                }
            });
            
            // 5. TODO: Send Welcome Email

            console.log(`Successfully created new VIP: ${name} (${email})`);
            res.status(200).send({ result: { success: true, message: `Successfully created new VIP: ${name}. Password: ${tempPassword}` } });

        } catch (error) {
            console.error("Error creating new VIP:", error);
            res.status(401).send({ error: { message: "You must be an authenticated admin to add a new VIP." } });
        }
    });
});