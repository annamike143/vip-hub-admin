// --- functions/index.js ---
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// We need to add our Brevo API key here later for sending emails
// const brevoApiKey = functions.config().brevo.key;

admin.initializeApp();

/**
 * This is an "onCall" function. It can only be called securely
 * from our authenticated admin application.
 */
exports.addNewVip = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check: Ensure only you (an authenticated admin) can run this.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated", 
            "You must be an authenticated admin to add a new VIP."
        );
    }

    const { name, email } = data;
    if (!name || !email) {
        throw new functions.https.HttpsError(
            "invalid-argument", 
            "Please provide both a name and an email."
        );
    }

    try {
        // 2. Create the User in Firebase Authentication
        const tempPassword = Math.random().toString(36).slice(-8);
        const userRecord = await admin.auth().createUser({
            email: email,
            password: tempPassword,
            displayName: name,
        });

        // 3. Create the User's Profile in the Realtime Database
        const db = admin.database();
        const userRef = db.ref(`/users/${userRecord.uid}`);
        await userRef.set({
            email: userRecord.email,
            name: userRecord.displayName,
            progress: {
                currentLessonId: "lesson_01", // Default starting lesson
                unlockedLessons: ["lesson_01"]
            }
        });

        // 4. TODO: Send the "Welcome" Email via Brevo API
        // This section is commented out for now. We will activate it later.
        /*
        const emailData = {
            to: [{ email: email, name: name }],
            templateId: YOUR_BREVO_WELCOME_TEMPLATE_ID, // We will create this in Brevo
            params: {
                NAME: name,
                EMAIL: email,
                PASSWORD: tempPassword,
                LOGIN_URL: "https://vipteam.mikesalazar.online"
            }
        };
        // Code to send email via Brevo's API will go here
        */

        console.log(`Successfully created new VIP: ${name} (${email})`);
        return { 
            success: true, 
            message: `Successfully created new VIP: ${name}. Password: ${tempPassword}` 
        };

    } catch (error) {
        console.error("Error creating new VIP:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while creating the VIP.");
    }
});