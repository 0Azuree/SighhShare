const admin = require('firebase-admin');

// Ensure the SDK is initialized outside the handler, but with a check
// to prevent re-initialization if the function instance is re-used (cold start optimization)
if (!admin.apps.length) {
    const serviceAccount = {
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // CRITICAL: Unescape newlines for Firebase SDK
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
        "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

exports.handler = async (event, context) => {
    // Check for POST request
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { code, fileUrl, expirationTimestamp } = JSON.parse(event.body);

        if (!code || !fileUrl || !expirationTimestamp) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields (code, fileUrl, expirationTimestamp)' }),
            };
        }

        // Get Firestore instance
        const db = admin.firestore();

        const docRef = db.collection('files').doc(code);

        // Update the document with fileUrl and expirationTimestamp
        // Ensure expiration is a proper Firestore Timestamp object
        await docRef.set({
            fileUrl: fileUrl,
            expiration: new admin.firestore.Timestamp(expirationTimestamp.seconds, expirationTimestamp.nanoseconds)
        }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File URL and expiration updated successfully' }),
        };
    } catch (error) {
        console.error('Error in upload.js Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
        };
    }
};
