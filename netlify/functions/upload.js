// This is a simplified in-memory store for demonstration.
// In a real application, you MUST use a persistent database
// (e.g., FaunaDB, MongoDB Atlas, Firebase Realtime Database, Supabase)
// to store data across Netlify Function invocations.
//
// For a production app, you would connect to your database here.
// Example: const { Client } = require('faunadb');
// const q = Client.query;
// const faunaClient = new Client({ secret: process.env.FAUNADB_SECRET });

const filesData = {}; // Format: { code: { filename, fileUrl, expirationTimestamp, creationTimestamp } }

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
            now.setDate(now.getDate() + 1); // Default to 1 day if invalid duration
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
            // Logic to update existing file's expiration
            const fileEntry = filesData[code];
            fileEntry.expirationTimestamp = getExpirationTimestamp(expiration);

            // In a real DB, you'd update the record here:
            // await faunaClient.query(
            //   q.Update(
            //     q.Match(q.Index('files_by_code'), code),
            //     { data: { expirationTimestamp: fileEntry.expirationTimestamp } }
            //   )
            // );

            console.log(`Expiration updated for code ${code}: ${new Date(fileEntry.expirationTimestamp).toLocaleString()}`);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Expiration updated successfully!', code: code, newExpiration: expiration })
            };
        } else if (filename && expiration) {
            // Logic for a new file upload
            let newCode;
            do {
                newCode = generateCode();
            } while (filesData[newCode]); // Ensure code is unique

            // --- IMPORTANT: Real File Storage (Concept) ---
            // In a real application, the frontend would first upload the actual file
            // to a cloud storage service (e.g., AWS S3, Cloudinary).
            // The cloud storage service would return a public URL for that file.
            // That public URL would then be sent *to this Netlify Function*.
            //
            // Example Frontend Flow:
            // 1. User selects file.
            // 2. Frontend calls a Netlify Function '/.netlify/functions/get-upload-url'
            //    to get a secure, temporary URL to upload directly to S3/Cloudinary.
            // 3. Frontend uploads the file directly to S3/Cloudinary using that URL.
            // 4. Cloudinary/S3 returns the final public `fileUrl`.
            // 5. Frontend then calls *this* `upload.js` function, sending `filename`, `fileUrl`, and `expiration`.
            const dummyFileUrl = `https://dummy-file-storage.com/files/${newCode}/${encodeURIComponent(filename)}`; // Placeholder

            filesData[newCode] = {
                filename: filename,
                fileUrl: dummyFileUrl, // This would be the actual URL from cloud storage
                expirationTimestamp: getExpirationTimestamp(expiration),
                creationTimestamp: new Date().getTime()
            };

            // In a real DB, you'd create a new record here:
            // await faunaClient.query(
            //   q.Create(
            //     q.Collection('files'),
            //     { data: filesData[newCode] }
            //   )
            // );

            console.log(`New file: ${filename}, Code: ${newCode}, Expires: ${new Date(filesData[newCode].expirationTimestamp).toLocaleString()}`);
            console.log('Current filesData (in-memory):', filesData); // For debugging Netlify logs

            return {
                statusCode: 200,
                body: JSON.stringify({
                    code: newCode,
                    filename: filename,
                    fileUrl: dummyFileUrl
                })
            };
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request: Missing filename, expiration, or update parameters.' }) };
        }

    } catch (error) {
        console.error('Error in upload function:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error: error.message }) };
    }
};
