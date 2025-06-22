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
        const { filename } = JSON.parse(event.body);

        // Generate a public_id for Cloudinary. We can derive it from the filename.
        // Cloudinary requires unique public_ids, so add a timestamp/random string.
        const timestamp = Math.round((new Date).getTime() / 1000);
        // Simple public ID: remove extension, replace spaces, append timestamp
        const publicId = `${filename.split('.').slice(0, -1).join('.')}_${timestamp}`;

        const options = {
            timestamp: timestamp,
            folder: 'sighhshare_uploads', // Optional: Organize uploads in a specific folder
            public_id: publicId,
            // Add any other upload options here, e.g., tags, transformations, etc.
            // max_bytes: 10 * 1024 * 1024, // Example: 10MB limit
            // resource_type: 'auto', // Cloudinary will auto-detect type
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
                public_id: options.public_id
            })
        };
    } catch (error) {
        console.error('Error generating upload signature:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error: error.message }) };
    }
};
