const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This part needs to happen only once across cold starts of the function container.
// This ensures that the Firebase Admin SDK is initialized with your credentials
// from environment variables.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: process.env.FIREBASE_TYPE,
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // CRITICAL: Ensure newlines are correctly parsed from env var
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI,
                token_uri: process.env.FIREBASE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
            })
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error in retrieve.js:", error);
        // If Firebase init fails here, subsequent Firestore operations will also fail.
        // This is where incorrect Firebase environment variables would show up.
        // It's crucial for the environment variables to be exactly correct.
    }
}

const db = admin.firestore(); // Get a Firestore instance

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const { code } = event.queryStringParameters; // Extract 'code' from query parameters

    if (!code || code.length !== 5) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid or missing 5-character code.' }) };
    }

    try {
        // Query Firestore for the document with the matching code
        // Use .toUpperCase() for consistency with how it's stored in 'upload.js'
        const fileRef = db.collection('files').doc(code.toUpperCase());
        const doc = await fileRef.get(); // Get the document snapshot

        if (!doc.exists) {
            // If no document with this code exists
            return { statusCode: 404, body: JSON.stringify({ message: 'File not found for this code.' }) };
        }

        const data = doc.data(); // Get the data object from the document

        // IMPORTANT: Additional check in case doc.exists is true but data() somehow returns undefined
        if (!data) {
             console.error(`Firestore document ${code.toUpperCase()} exists but has no data.`);
             return { statusCode: 500, body: JSON.stringify({ message: 'File data found, but it appears corrupted.' }) };
        }

        const currentTime = Date.now(); // Get current timestamp in milliseconds
        
        // Check if the file has an expiration timestamp and if it has expired
        if (data.expirationTimestamp && currentTime > data.expirationTimestamp) {
            // Optional: Delete the document from Firestore upon retrieval if it's expired
            try {
                await fileRef.delete();
                console.log(`Expired file ${code.toUpperCase()} deleted from Firestore.`);
            } catch (deleteError) {
                console.error(`Error deleting expired file ${code.toUpperCase()} from Firestore:`, deleteError);
                // Don't block the response even if deletion fails, the file is still expired.
            }

            return { statusCode: 410, body: JSON.stringify({ message: 'This file has expired and is no longer available.', expired: true }) };
        }

        // If found and not expired, return the file data
        return {
            statusCode: 200,
            body: JSON.stringify({
                filename: data.filename,
                fileUrl: data.fileUrl,
                expirationTimestamp: data.expirationTimestamp // Send for display on frontend
            })
        };

    } catch (error) {
        console.error('Error during file retrieval from Firestore:', error);
        // This catch block will handle any errors during Firestore operations,
        // including issues if Firebase Admin SDK initialization failed earlier.
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error during file retrieval.', error: error.message }) };
    }
};
