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