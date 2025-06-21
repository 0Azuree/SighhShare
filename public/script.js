document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('file-input');
    const mainUploadSection = document.getElementById('main-upload-section');
    const fileDisplaySection = document.getElementById('file-display-section');
    const fileNameDisplay = document.getElementById('file-name-display');
    const shareCodeDisplay = document.getElementById('share-code-display');
    const downloadButton = document.getElementById('download-button');
    const backToMainButton = document.getElementById('back-to-main');
    const codeInput = document.getElementById('code-input');
    const retrieveButton = document.getElementById('retrieve-button');
    const expirationButtons = document.querySelectorAll('.exp-button');
    const mainErrorMessage = document.getElementById('main-error-message');
    const fileDisplayErrorMessage = document.getElementById('file-display-error-message');

    let currentFileUrl = ''; // To store the URL of the uploaded/retrieved file
    let currentShareCode = ''; // To store the generated/retrieved code
    let selectedExpiration = '1d'; // Default expiration

    // --- Theme Toggle ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        themeToggle.textContent = savedTheme === 'dark-theme' ? 'brightness_4' : 'brightness_high';
    } else {
        document.body.className = 'dark-theme'; // Default to dark
        themeToggle.textContent = 'brightness_4';
    }

    themeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            themeToggle.textContent = 'brightness_high';
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            themeToggle.textContent = 'brightness_4';
            localStorage.setItem('theme', 'dark-theme');
        }
    });

    // --- File Upload ---
    uploadBox.addEventListener('click', () => {
        // Only trigger file input if we are on the main upload section
        if (mainUploadSection.style.display !== 'none') {
            fileInput.click();
        }
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (mainUploadSection.style.display !== 'none') {
            uploadBox.style.borderColor = 'var(--dark-accent)'; // Highlight drag area
            if (document.body.classList.contains('light-theme')) {
                 uploadBox.style.borderColor = 'var(--light-accent)';
            }
        }
    });

    uploadBox.addEventListener('dragleave', () => {
        if (mainUploadSection.style.display !== 'none') {
            uploadBox.style.borderColor = ''; // Reset border
        }
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        if (mainUploadSection.style.display !== 'none') {
            uploadBox.style.borderColor = ''; // Reset border
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    async function handleFileUpload(file) {
        mainErrorMessage.textContent = ''; // Clear previous errors
        if (!file) {
            mainErrorMessage.textContent = 'No file selected.';
            return;
        }

        // --- Important: Real-world file upload ---
        // For actual production, you would upload the file to a cloud storage
        // like AWS S3, Cloudinary, or Google Cloud Storage first.
        // This usually involves getting a pre-signed URL from your backend,
        // then uploading the file directly from the frontend to the cloud.
        // Once the cloud upload is complete, you'd send the *resulting URL*
        // to your Netlify function.

        // For this demo, we will simulate by sending just the filename.
        // The Netlify function will create a dummy URL for demonstration.

        // You might show a loading spinner here
        mainErrorMessage.textContent = 'Uploading file...';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: file.name,
                    // In a real app, 'fileUrl' would come from your cloud storage upload:
                    // fileUrl: 'https://your-cloud-storage.com/path/to/uploaded/file.ext',
                    expiration: selectedExpiration // Default expiration is sent initially
                })
            });

            const data = await response.json();

            if (response.ok) {
                mainErrorMessage.textContent = '';
                currentShareCode = data.code;
                currentFileUrl = data.fileUrl; // This will be the dummy URL from the backend
                fileNameDisplay.textContent = data.filename;
                shareCodeDisplay.textContent = data.code;
                downloadButton.onclick = () => window.open(currentFileUrl, '_blank');

                // Switch to file display section
                mainUploadSection.style.display = 'none';
                fileDisplaySection.style.display = 'block';

                // Reset expiration button highlights
                expirationButtons.forEach(btn => btn.classList.remove('selected'));
                document.querySelector(`.exp-button[data-duration="${selectedExpiration}"]`).classList.add('selected');

            } else {
                mainErrorMessage.textContent = `Upload failed: ${data.message || 'Unknown error'}`;
            }
        } catch (error) {
            console.error('Error during upload:', error);
            mainErrorMessage.textContent = 'Network error or server issue during upload.';
        }
    }

    // --- Expiration Buttons ---
    expirationButtons.forEach(button => {
        button.addEventListener('click', async () => {
            expirationButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedExpiration = button.dataset.duration;

            fileDisplayErrorMessage.textContent = 'Updating expiration...';

            // Now, send this updated expiration to the backend for the current file
            try {
                const response = await fetch('/api/upload', { // Reuse upload endpoint, but for update
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code: currentShareCode, // Send the existing code
                        expiration: selectedExpiration,
                        updateExpiration: true // Flag to indicate it's an update
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    fileDisplayErrorMessage.textContent = 'Expiration updated!';
                    // The backend should confirm the new expiration time
                } else {
                    fileDisplayErrorMessage.textContent = `Failed to update expiration: ${data.message || 'Unknown error'}`;
                }
            } catch (error) {
                console.error('Error updating expiration:', error);
                fileDisplayErrorMessage.textContent = 'Network error during expiration update.';
            } finally {
                setTimeout(() => fileDisplayErrorMessage.textContent = '', 3000); // Clear message after 3 seconds
            }
        });
    });


    // --- Code Retrieval ---
    retrieveButton.addEventListener('click', () => {
        retrieveFile();
    });

    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            retrieveFile();
        }
    });

    async function retrieveFile() {
        const code = codeInput.value.trim().toUpperCase(); // Codes are 5 letters, uppercase
        mainErrorMessage.textContent = ''; // Clear previous errors

        if (code.length !== 5) {
            mainErrorMessage.textContent = 'Please enter a 5-letter code.';
            return;
        }

        // You might show a loading spinner here
        mainErrorMessage.textContent = 'Retrieving file...';

        try {
            const response = await fetch(`/api/retrieve?code=${code}`);
            const data = await response.json();

            if (response.ok) {
                if (data.expired) {
                    mainErrorMessage.textContent = 'This file has expired!';
                } else {
                    mainErrorMessage.textContent = '';
                    currentShareCode = code;
                    currentFileUrl = data.fileUrl;
                    fileNameDisplay.textContent = data.filename;
                    shareCodeDisplay.textContent = code;
                    downloadButton.onclick = () => window.open(currentFileUrl, '_blank');

                    // Switch to file display section
                    mainUploadSection.style.display = 'none';
                    fileDisplaySection.style.display = 'block';

                    // Reset expiration button highlights - we don't know original selection
                    expirationButtons.forEach(btn => btn.classList.remove('selected'));
                }
            } else {
                mainErrorMessage.textContent = `Retrieval failed: ${data.message || 'File not found or invalid code.'}`;
            }
        } catch (error) {
            console.error('Error during retrieval:', error);
            mainErrorMessage.textContent = 'Network error or server issue during retrieval.';
        }
    }

    // --- Back to Main Button ---
    backToMainButton.addEventListener('click', () => {
        fileDisplaySection.style.display = 'none';
        mainUploadSection.style.display = 'block';
        fileInput.value = ''; // Clear file input
        codeInput.value = ''; // Clear code input
        mainErrorMessage.textContent = ''; // Clear messages
        fileDisplayErrorMessage.textContent = '';
        currentFileUrl = '';
        currentShareCode = '';
        selectedExpiration = '1d'; // Reset default expiration
        expirationButtons.forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.exp-button[data-duration="1d"]`).classList.add('selected'); // Highlight default
    });
});
