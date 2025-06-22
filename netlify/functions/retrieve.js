// IMPORTANT: This also relies on the non-persistent in-memory store
// from upload.js for demonstration. For production, you MUST use a
// persistent database and connect to it here to retrieve file data.
//
// If using FaunaDB:
// const { Client } = require('faunadb');
// const q = Client.query;
// const faunaClient = new Client({ secret: process.env.FAUNADB_SECRET });

// This is a direct require to access the *same* in-memory object in a single function instance.
// This is NOT how persistent data works in production serverless environments.
// It's strictly for local development and basic demo.
const { filesData } = require('./upload'); // Accesses the in-memory store.

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const code = event.queryStringParameters.code;

    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing file code.' }) };
    }

    // In a real DB, you'd query the database for the file by code:
    // let fileEntry;
    // try {
    //   fileEntry = await faunaClient.query(
    //     q.Get(q.Match(q.Index('files_by_code'), code.toUpperCase()))
    //   );
    //   fileEntry = fileEntry.data; // FaunaDB wraps data
    // } catch (e) {
    //   // Handle Not Found or other DB errors
    //   fileEntry = null;
    // }

    const fileEntry = filesData[code.toUpperCase()]; // For demonstration with in-memory

    if (!fileEntry) {
        return { statusCode: 404, body: JSON.stringify({ message: 'File not found for this code.' }) };
    }

    const currentTime = new Date().getTime();
    if (currentTime > fileEntry.expirationTimestamp) {
        // In a real DB, you might also delete the record here or mark it inactive:
        // await faunaClient.query(
        //   q.Delete(q.Ref(q.Collection('files'), fileEntry.ref.id)) // If FaunaDB
        // );
        delete filesData[code.toUpperCase()]; // Remove from in-memory for demo

        return { statusCode: 410, body: JSON.stringify({ message: 'This file has expired and is no longer available.', expired: true }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            filename: fileEntry.filename,
            fileUrl: fileEntry.fileUrl,
            expirationTimestamp: fileEntry.expirationTimestamp // Send for display
        })
    };
};
