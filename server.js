'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const app = express();

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve the HTML file 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Multer middleware to handle file uploads with memory storage
const memoryStorage = multer.memoryStorage(); // Store uploaded files in memory
const memoryUpload = multer({ storage: memoryStorage });

// Multer middleware to handle file uploads with temporary disk storage
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'temp')); // Store files in a temporary directory
    },
    filename: function (req, file, cb) {
        // Encode the original filename to ensure compatibility with URLs
        const encodedFilename = encodeURIComponent(file.originalname);
        cb(null, Date.now() + '-' + encodedFilename);
    }
});
const diskUpload = multer({ storage: diskStorage });

// POST route to handle form submission with file upload
app.post('/submit/memory', memoryUpload.single('file'), async (req, res) => {
    console.log('/submit/memory');
    const projectId = req.body.projectId;
    const file = req.file; // File details are available here
    // Check if file is uploaded
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log('File name:',file.originalname);
    console.log('File:',file);

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file.buffer);

    // Call to API to save data
    try {
        const response = await axios.post('https://example.com', {
            formData,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        );
        // console.log('Form data saved:', response.data);

        // Send a response back to the client
        res.send('Form submitted successfully!');
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).send('Error saving form data.');
    }

});

// POST route to handle form submission with file upload
app.post('/submit/disk', diskUpload.single('file'), async (req, res) => {
    console.log('/submit/disk');
    const projectId = req.body.projectId;
    const file = req.file; // File details are available here
    // Check if file is uploaded
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log('File name:',file.filename);
    console.log('File:',file);

    // Read the file and base64 encode it
    const fileData = fs.readFileSync(file.path, { encoding: 'base64' });
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', fileData);

    // Call to API to save data
    try {
        const response = await axios.post('https://example.com', {
            formData,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        );
        // console.log('Form data saved:', response.data);ß

        // Delete the temporary file after API call
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error('Error deleting temporary file:', err);
            } else {
                console.log('Temporary file deleted successfully');
            }
        });
        // Send a response back to the client
        res.send('Form submitted successfully!');
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).send('Error saving form data.');
    }

});

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
