const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Use HTTPS
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const filename = body.filename || 'file'; // Use provided filename or default

        // Generate a unique public_id based on a timestamp and filename
        // This ensures unique filenames in Cloudinary
        const timestamp = Date.now();
        const public_id = `sighhshare/${filename.replace(/[^a-zA-Z0-9-.]/g, '_')}-${timestamp}`;

        // Parameters for signed upload
        const options = {
            timestamp: timestamp,
            folder: 'sighhshare_uploads', // Your desired folder in Cloudinary
            public_id: public_id,
            // Add any other upload parameters you need, e.g., tags, transformations
        };

        // Generate the signature
        const signature = cloudinary.utils.api_sign_request(options, cloudinary.config().api_secret);

        return {
            statusCode: 200,
            body: JSON.stringify({
                signature: signature,
                timestamp: timestamp,
                cloudname: cloudinary.config().cloud_name,
                api_key: cloudinary.config().api_key,
                folder: options.folder,
                public_id: public_id
            })
        };

    } catch (error) {
        console.error('Error generating Cloudinary signature:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Error generating upload signature: ${error.message}` })
        };
    }
};
