const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This part needs to happen only once across cold starts
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: process.env.FIREBASE_TYPE,
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure newlines are correctly parsed
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI,
                token_uri: process.env.FIREBASE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
            })
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error in upload.js:", error);
    }
}

const db = admin.firestore();

// Function to generate a unique 5-character code
async function generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // Prevent infinite loop in case of extreme collision

    while (!isUnique && attempts < MAX_ATTEMPTS) {
        code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if code already exists in Firestore
        const docRef = db.collection('files').doc(code);
        const doc = await docRef.get();
        if (!doc.exists) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Could not generate a unique code after multiple attempts.');
    }
    return code;
}

// Function to calculate expiration timestamp
function calculateExpirationTimestamp(duration) {
    const now = Date.now();
    let expirationTime = now;

    switch (duration) {
        case '1h': expirationTime += 60 * 60 * 1000; break; // 1 hour
        case '1d': expirationTime += 24 * 60 * 60 * 1000; break; // 1 day
        case '1w': expirationTime += 7 * 24 * 60 * 60 * 1000; break; // 1 week
        // Add more cases as needed (e.g., '1m' for 1 month)
        default: expirationTime += 24 * 60 * 60 * 1000; // Default to 1 day if unrecognized
    }
    return expirationTime;
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body.' }) };
    }

    const { filename, fileUrl, expiration, code, updateExpiration } = data;

    try {
        let shareCode;
        let expirationTimestamp;
        let newFileUrl = fileUrl; // Default to the URL provided in the payload

        if (updateExpiration && code) {
            // Case 1: Update expiration for an existing file
            shareCode = code;
            expirationTimestamp = calculateExpirationTimestamp(expiration);

            const docRef = db.collection('files').doc(shareCode);
            const doc = await docRef.get();

            if (!doc.exists) {
                return { statusCode: 404, body: JSON.stringify({ message: 'File not found for update.' }) };
            }

            // Update only the expirationTimestamp
            await docRef.update({ expirationTimestamp: expirationTimestamp });
            console.log(`Updated expiration for code: ${shareCode} to ${new Date(expirationTimestamp).toISOString()}`);

            // Fetch the existing fileUrl to return in the response if it's an update
            const existingData = doc.data();
            newFileUrl = existingData.fileUrl; // Use the existing fileUrl for response

        } else if (filename && fileUrl) {
            // Case 2: New file upload
            shareCode = await generateUniqueCode();
            expirationTimestamp = calculateExpirationTimestamp(expiration || '1d'); // Default to 1 day if not provided

            const fileEntry = {
                filename: filename,
                fileUrl: fileUrl, // This is the Cloudinary URL
                uploadTimestamp: Date.now(),
                expirationTimestamp: expirationTimestamp
            };

            await db.collection('files').doc(shareCode).set(fileEntry);
            console.log(`New file uploaded and saved to Firestore with code: ${shareCode}`);

        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing filename, fileUrl, or code for update.' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                code: shareCode,
                fileUrl: newFileUrl, // Return the actual fileUrl (either new or existing)
                expirationTimestamp: expirationTimestamp
            })
        };

    } catch (error) {
        console.error('Error in upload function:', error);
        return { statusCode: 500, body: JSON.stringify({ message: `Server error: ${error.message}` }) };
    }
};
