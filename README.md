# SighhShare

![SighhShare Screenshot Placeholder](https://via.placeholder.com/800x400?text=SighhShare+App+Screenshot)
*Replace this placeholder with a real screenshot of your application!*

SighhShare is a modern, privacy-focused web application that facilitates temporary file sharing. Users can upload files, receive a unique shareable code, and define an expiration period for the content. It's built with a fully serverless architecture, ensuring scalability, cost-efficiency, and ease of deployment.

## ✨ Features

* **Temporary File Sharing:** Upload files and set automatic expiration times (1 hour, 5 hours, 1 day).
* **Unique Shareable Codes:** Each uploaded file generates a unique 5-character code for easy retrieval.
* **Persistent Storage:** File metadata (filename, URL, expiration) is securely stored using Firebase Firestore.
* **Cloud-Based File Storage:** Actual file content is hosted on Cloudinary, providing reliable and scalable storage.
* **Secure Uploads:** Files are uploaded directly from the client to Cloudinary using securely generated signatures, minimizing serverless function overhead and enhancing security.
* **Intuitive UI:** Clean and responsive user interface for a smooth sharing experience.
* **Theme Toggling:** Switch between dark and light modes for personalized viewing.
* **Retrieve by Code:** Easily access shared files using their unique code.

## 💻 Technologies Used

* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript (Vanilla JS)
* **Backend (Serverless Functions):**
    * Netlify Functions (Node.js)
    * Firebase Admin SDK (for Firestore interaction)
    * Cloudinary SDK (for signature generation)
* **Database:**
    * Firebase Firestore (for file metadata persistence)
* **File Storage:**
    * Cloudinary (for actual file content storage)
* **Deployment:**
    * Netlify

## 🚀 Getting Started

Follow these steps to set up and run SighhShare locally, or deploy it to Netlify.

### Prerequisites

Before you begin, ensure you have the following accounts and tools:

* [Node.js](https://nodejs.org/) (LTS version recommended) and npm (comes with Node.js)
* [Git](https://git-scm.com/)
* A [Netlify](https://www.netlify.com/) account
* A [Firebase](https://firebase.google.com/) project with Firestore enabled
* A [Cloudinary](https://cloudinary.com/) account

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/sighhshare.git](https://github.com/your-username/sighhshare.git) # Replace with your actual repo URL
cd sighhshare
