document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('file-input');
    const mainSection = document.getElementById('main-section');
    const expirationModal = document.getElementById('expiration-modal');
    const modalFileNameDisplay = document.getElementById('modal-file-name-display');
    const modalShareCodeDisplay = document.getElementById('modal-share-code-display');
    const modalDoneButton = document.getElementById('modal-done-button');
    const modalErrorMessage = document.getElementById('modal-error-message');
    const fileViewSection = document.getElementById('file-view-section');
    const finalFileNameDisplay = document.getElementById('final-file-name-display');
    const finalShareCodeDisplay = document.getElementById('final-share-code-display');
    const finalDownloadButton = document.getElementById('final-download-button');
    const fileExpiryInfo = document.getElementById('file-expiry-info');
    const backToMainFromFileViewButton = document.getElementById('back-to-main-from-file-view');
    const codeInput = document.getElementById('code-input');
    const retrieveButton = document.getElementById('retrieve-button');
    const expirationButtons = document.querySelectorAll('.exp-button');
    const mainErrorMessage = document.getElementById('main-error-message');

    let currentFileUrl = '';
    let currentShareCode = '';
    let selectedExpirationDuration = '1d'; // Default to 1 Day

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

    // --- Upload Box & File Input ---
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--dark-text)'; // Highlight
        if (document.body.classList.contains('light-theme')) {
            uploadBox.style.borderColor = 'var(--light-text)';
        }
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = ''; // Reset border
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = ''; // Reset border
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
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

        mainErrorMessage.textContent = 'Preparing upload...';

        try {
            // --- IMPORTANT FOR PRODUCTION: REAL FILE STORAGE INTEGRATION ---
            // In a real application, you would perform these steps:
            // 1. Call a Netlify Function to get a secure upload signature/URL from Cloudinary/AWS S3.
            //    Example: await fetch('/api/get-upload-signature', { method: 'POST', ... });
            // 2. Use that signature/URL to DIRECTLY upload the actual 'file' object from the browser
            //    to Cloudinary/AWS S3. This bypasses your Netlify function for large file transfer.
            //    Example: fetch('https://api.cloudinary.com/...', { method: 'POST', body: formData });
            // 3. The cloud storage service will return the final public URL of the uploaded file.
            //    You will use THAT URL in the 'fileUrl' parameter below.

            // --- FOR DEMO/TESTING WITH FIREBASE: Using a dummy file URL ---
            // This dummy URL allows you to test the Firebase database integration
            // without setting up a full cloud file storage service yet.
            const dummyFileUrl = `https://mock-cloud-storage.com/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            // Send file metadata (including dummy URL for now) to your Netlify function
            mainErrorMessage.textContent = 'Uploading file metadata...';
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    fileUrl: dummyFileUrl, // This will be the REAL URL from cloud storage in production
                    expiration: selectedExpirationDuration // Initial default expiration
                })
            });

            const data = await response.json();

            if (response.ok) {
                mainErrorMessage.textContent = '';
                currentShareCode = data.code;
                currentFileUrl = data.fileUrl; // This will be the dummy URL (or real URL in production)

                // Populate modal and show it
                modalFileNameDisplay.textContent = data.filename;
                modalShareCodeDisplay.textContent = data.code;
                expirationModal.style.display = 'flex';
                mainSection.style.display = 'none'; // Hide main section
            } else {
                mainErrorMessage.textContent = `Upload failed: ${data.message || 'Unknown error'}`;
            }
        } catch (error) {
            console.error('Error during upload:', error);
            mainErrorMessage.textContent = 'Network error or server issue during upload.';
        }
    }

    // --- Expiration Buttons in Modal ---
    expirationButtons.forEach(button => {
        button.addEventListener('click', () => {
            expirationButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedExpirationDuration = button.dataset.duration;
        });
    });

    // --- Modal Done Button ---
    modalDoneButton.addEventListener('click', async () => {
        modalErrorMessage.textContent = 'Updating expiration...';

        try {
            // Send the chosen expiration to backend to update for the current file
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: currentShareCode,
                    expiration: selectedExpirationDuration,
                    updateExpiration: true
                })
            });

            const data = await response.json();

            if (response.ok) {
                modalErrorMessage.textContent = 'Expiration set!';
                // Now transition to the final file view page
                expirationModal.style.display = 'none'; // Hide modal
                fileViewSection.style.display = 'block'; // Show file view

                finalFileNameDisplay.textContent = modalFileNameDisplay.textContent;
                finalShareCodeDisplay.textContent = modalShareCodeDisplay.textContent;
                finalDownloadButton.onclick = () => window.open(currentFileUrl, '_blank');
                fileExpiryInfo.textContent = `This file will expire in ${selectedExpirationDuration}.`;

            } else {
                modalErrorMessage.textContent = `Failed to set expiration: ${data.message || 'Unknown error'}`;
            }
        } catch (error) {
                console.error('Error setting expiration:', error);
                modalErrorMessage.textContent = 'Network error during expiration update.';
        } finally {
            // Clear message after a short delay, or immediately if successful.
            // If it's an error, maybe keep it visible longer.
            if (response && response.ok) { // Check if response was successful
                setTimeout(() => modalErrorMessage.textContent = '', 2000);
            }
        }
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
        const code = codeInput.value.trim().toUpperCase();
        mainErrorMessage.textContent = '';

        if (code.length !== 5) {
            mainErrorMessage.textContent = 'Please enter a 5-letter code.';
            return;
        }

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
                    currentFileUrl = data.fileUrl; // This will be the dummy URL (or real URL in production)

                    // Directly go to file view if retrieved successfully
                    mainSection.style.display = 'none';
                    fileViewSection.style.display = 'block';

                    finalFileNameDisplay.textContent = data.filename;
                    finalShareCodeDisplay.textContent = code;
                    finalDownloadButton.onclick = () => window.open(currentFileUrl, '_blank');
                    fileExpiryInfo.textContent = `This file will expire on ${new Date(data.expirationTimestamp).toLocaleString()}.`;
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
    backToMainFromFileViewButton.addEventListener('click', () => {
        fileViewSection.style.display = 'none';
        mainSection.style.display = 'block';
        fileInput.value = ''; // Clear file input
        codeInput.value = ''; // Clear code input
        mainErrorMessage.textContent = ''; // Clear messages
        modalErrorMessage.textContent = '';
        currentFileUrl = '';
        currentShareCode = '';
        selectedExpirationDuration = '1d'; // Reset default expiration
        expirationButtons.forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.exp-button[data-duration="1d"]`).classList.add('selected'); // Highlight default
    });

    // Initialize the default expiration button highlight on load
    document.querySelector(`.exp-button[data-duration="1d"]`).classList.add('selected');
});
