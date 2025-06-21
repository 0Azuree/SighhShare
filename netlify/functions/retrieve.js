// IMPORTANT: This also uses the same in-memory store as upload.js.
// In a real application, you MUST use a persistent database
// (e.g., FaunaDB, MongoDB Atlas, Firebase Realtime Database)
// and connect to it from *both* upload.js and retrieve.js.
// For a simple demo on Netlify, this in-memory store might
// sometimes work if function instances persist, but it's not reliable.
const filesData = require('./upload').filesData; // Access the same in-memory object (not reliable for production)

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const code = event.queryStringParameters.code;

    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing file code.' }) };
    }

    const fileEntry = filesData[code.toUpperCase()]; // Codes are uppercase

    if (!fileEntry) {
        return { statusCode: 404, body: JSON.stringify({ message: 'File not found for this code.' }) };
    }

    const currentTime = new Date().getTime();
    if (currentTime > fileEntry.expirationTimestamp) {
        // Option to delete expired file metadata here if using a real DB
        delete filesData[code.toUpperCase()]; // Remove from in-memory store
        return { statusCode: 410, body: JSON.stringify({ message: 'This file has expired and is no longer available.', expired: true }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            filename: fileEntry.filename,
            fileUrl: fileEntry.fileUrl // This would be the real cloud storage URL
        })
    };
};
