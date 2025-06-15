const express = require('express')
const path = require('path');
const multerUpload = require('../config/multerConfig.js');
const sendMultipleFiles = require('../drive/upload.js');
const validateToken = require('../middleware/validateToken.middleware.js');
const User = require('../model/user.models.js')
const { uploadFilesWithEncrypt } = require('../drive/main.js');
const { fileUploadLimiter } = require('../middleware/rateLimiters.middleware.js');

const router = express.Router();

let client = null;
setTimeout(() => {
    client = require('../index.js');
}, 10000);

router.post('/uploadEncrypt', validateToken, fileUploadLimiter, multerUpload.array('files', 10), async (req, res) => {
    let GLOBAL_CHANNELID = process.env.CHANNEL_ID;
    let filePassword = req.body.password;
    let otherResponsesSent = false;
    let userID = req.userId;

    try {

        if (!userID || userID === "undefined") {
            return res.status(400).json({
                error: 'User ID not found'
            });
        }

        if (!req.files) {
            return res.status(400).json({
                error: 'No files were uploaded.'
            });
        }

        const mongoUser = await User.findById(userID);

        if (!mongoUser) {
            return res.status(400).json({
                error: 'User Not Found'
            });
        }

        let user = mongoUser.username;

        if (req.files.length > 10) {
            return res.status(400).json({
                error: 'Too many files uploaded. The maximum allowed is 10.'
            });
        }

        if (!user || user === "undefined") {
            user = "Anon";
        }

        if (!filePassword || filePassword === "undefined") {
            filePassword = "turd";
        }

        req.files.forEach(element => {
            let fileSize = element.size;
            const allowed = checkFileValidity(element, res);

            if (allowed !== 'allowed') {
                otherResponsesSent = true;
                return;
            }

            uploadFilesWithEncrypt(element.filename, filePassword, 'src/drive/fileManagement/compressedAndEncrypted/')
                .then((pathArr) => {
                    //uploading on channel after all the processing
                    const channel = client.channels.cache.get(GLOBAL_CHANNELID);
                    let is_Encrypted = false;
                    if (filePassword === "turd") {
                        is_Encrypted = false;
                    }
                    else {
                        is_Encrypted = true;
                    }
                    sendMultipleFiles(channel, pathArr, 0, user, fileSize, is_Encrypted, {}, filePassword);
                })
                .catch((err) => {
                    console.log("Error occured during encryptFiles", err)
                })
        })
    }
    catch (err) {
        otherResponsesSent = true;
        return res.status(500).json({ message: 'Internal server error during uploadEncrypt POST req.' });
    }
    if (!otherResponsesSent) {
        res.send('File(s) uploaded successfully');
    }
});

router.get('/uploadWithEncrypt', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'uploadPage.html'));
});


function checkFileValidity(file, res) {
    const invalidChars = "[@!#$%^&*()<>?}{~:]`';/|,";
    const filename = file.originalname;
    const fileSize = file.size;
    const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
    const uploadSizeLimit = 1 * 1024 * 1024 * 1024;

    if (filename.length > 40) {
        return res.status(400).json({
            error: `Filename is more than 40 characters long. Total characters: ${filename.length}. Please reduce the filename length.`
        });
    }

    if (fileSize > uploadSizeLimit) {
        return res.status(413).json({
            error: `File size exceeds the upload limit of ${uploadSizeLimit / (1024 * 1024 * 1024)} GB. File size: ${fileSizeInMB} MB.`
        });
    }

    for (let j = 0; j < filename.length; j++) {
        if (invalidChars.includes(filename.charAt(j)) || filename.charAt(j) === `"`) {
            return res.status(400).json({
                error: `Filename contains invalid characters. Invalid characters: ${invalidChars}`
            });
        }
    }

    return "allowed";
}


module.exports = router;
