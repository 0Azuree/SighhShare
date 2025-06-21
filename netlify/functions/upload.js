// This is a simplified in-memory store for demonstration.
// In a real application, you MUST use a persistent database
// (e.g., FaunaDB, MongoDB Atlas, Firebase Realtime Database)
// to store data across Netlify Function invocations.
const filesData = {}; // Format: { code: { filename, fileUrl, expirationTimestamp } }

// Helper to generate a random 5-letter code
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper to calculate expiration timestamp
function getExpirationTimestamp(duration) {
    const now = new Date();
    switch (duration) {
        case '1hr':
            now.setHours(now.getHours() + 1);
            break;
        case '5hr':
            now.setHours(now.getHours() + 5);
            break;
        case '1d':
            now.setDate(now.getDate() + 1);
            break;
        default:
            now.setDate(now.getDate() + 1); // Default to 1 day
    }
    return now.getTime(); // Returns timestamp in milliseconds
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const { filename, expiration, code, updateExpiration } = JSON.parse(event.body);

        if (updateExpiration && code && filesData[code]) {
            // Update existing file's expiration
            const fileEntry = filesData[code];
            fileEntry.expirationTimestamp = getExpirationTimestamp(expiration);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Expiration updated successfully!', code: code, newExpiration: expiration })
            };
        } else if (filename && expiration) {
            // New file upload
            let newCode;
            do {
                newCode = generateCode();
            } while (filesData[newCode]); // Ensure code is unique

            // --- IMPORTANT: Real File Storage ---
            // In a real application, you would handle the actual file upload here.
            // This usually involves:
            // 1. Receiving the file data from the frontend (e.g., via a pre-signed S3 URL upload).
            // 2. Storing the file in a cloud storage service (e.g., AWS S3, Cloudinary).
            // 3. Getting the public URL of the stored file.
            // For this demo, we're just creating a dummy URL.

            const dummyFileUrl = `https://sighhshare.com/files/${newCode}/${encodeURIComponent(filename)}`; // Example dummy URL

            filesData[newCode] = {
                filename: filename,
                fileUrl: dummyFileUrl, // This would be the real cloud storage URL
                expirationTimestamp: getExpirationTimestamp(expiration)
            };

            console.log(`File uploaded: ${filename}, Code: ${newCode}, Expires: ${new Date(filesData[newCode].expirationTimestamp).toLocaleString()}`);
            console.log('Current filesData (in-memory):', filesData); // For debugging Netlify logs

            return {
                statusCode: 200,
                body: JSON.stringify({
                    code: newCode,
                    filename: filename,
                    fileUrl: dummyFileUrl // Return the dummy URL for the frontend
                })
            };
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing filename or expiration, or invalid update request.' }) };
        }

    } catch (error) {
        console.error('Error in upload function:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error: error.message }) };
    }
};
