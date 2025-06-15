const express = require('express')
const fs = require('fs');
require('../utils/mailUtil.js');
const sqlConnection = require('../config/mysqlConfig.js');
const { downloadAndProcessTheFileParts } = require('../drive/main.js');
const { checkPassword , getMessageIDFromNameDateAndUser } = require('../utils/sqlUtils.js');
const { downloadRoutesLimiter ,downloadRequestLimiter } = require('../middleware/rateLimiters.middleware.js');
const validateToken = require('../middleware/validateToken.middleware.js');

let client = null;
let sendErrorDuringDownloadProcessEmail = null;
let sendSuccessfulFileProcessingEmail = null;

setTimeout(() => {
    client = require('../index.js');
    const { sendSuccessfulFileProcessingEmailModule , sendErrorDuringDownloadProcessEmailModule } = require('../utils/mailUtil.js');
    sendSuccessfulFileProcessingEmail = sendSuccessfulFileProcessingEmailModule;
    sendErrorDuringDownloadProcessEmail = sendErrorDuringDownloadProcessEmailModule;
}, 10000);

const router = express.Router();

router.use(downloadRoutesLimiter);

router.get('/downloadPage',(req, res) => {
    let { filename, datetime , filesize , is_Encrypted , fromUser } = req.query;

    is_Encrypted = is_Encrypted === '0'?false:true;

    if(!filename || filename === "undefined" || filename.length>45){
        return res.status(400).json({ error: 'Bad Request', message: 'valid filename is required' });
    }
    if(!datetime || datetime === "undefined" || datetime.length > 25){
        return res.status(400).json({ error: 'Bad Request', message: 'valid datetime is required' });
    }
    if(!filesize || filesize === "undefined"){
        return res.status(400).json({ error: 'Bad Request', message: 'valid filesize is required' });
    }
    if( is_Encrypted !== true && is_Encrypted !== false  ){
        return res.status(400).json({ error: 'Bad Request', message: 'valid is_Encrypted is required' });
    }
    if(!fromUser || fromUser === "undefined" || fromUser.length > 20){
        return res.status(400).json({ error: 'Bad Request', message: 'valid username is required' });
    }
    
    const date = new Date(datetime);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
    };
    const readableFormatDate = date.toLocaleDateString('en-GB',options);

    is_Encrypted = is_Encrypted === true?'Yes':'No';

    filesize = filesize / (1024 * 1024);

    const downloadTime = Math.ceil(filesize/6);

    const data = {
        fileName : filename,
        fileSize : filesize.toFixed(2) || "Not available",
        fileUploadDate : datetime || "Not available",
        readableFormatDate : readableFormatDate || "Not available",
        is_Encrypted : is_Encrypted ,
        fromUser : fromUser || "Not available",
        downloadTime : downloadTime || "Not available"
    }

    //useful to dynamically generate different download webpage for diffrent files,it will generate different download page for diffrent 'data'
    res.render('dp', { data });
}); 

router.post('/downloadProcessRequest',validateToken,downloadRequestLimiter,async (req,res)=>{
    const { fileName , fromUser , datetime , password , emailForNotification , fileSize } = req.body;
    let processingStartedDateAndTime;

    if(!fileName || fileName === "undefined" || fileName.length>45){
        return res.status(400).json({ error: 'Bad Request', message: 'valid filename is required' });
    }
    if(!datetime || datetime === "undefined" || datetime.length > 25){
        return res.status(400).json({ error: 'Bad Request', message: 'valid datetime is required' });
    }
    if(!fromUser || fromUser === "undefined" || fromUser.length > 20){
        return res.status(400).json({ error: 'Bad Request', message: 'valid username is required' });
    }
    if (!password || password.trim() === "" || password.length > 20) {
        return res.status(400).json({ error: 'Bad Request', message: 'valid password is required' });
    }

    try {
        const passwordAfterCheck = await checkPassword(sqlConnection,fileName,fromUser,datetime,password)

        if(!passwordAfterCheck){
            return res.status(401).json({ message: 'Invalid Password' });
        }

        const currentDate = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };
    
        processingStartedDateAndTime = currentDate.toLocaleDateString('en-GB', options);

        const filename = await startProcessingDownload(sqlConnection,fileName,fromUser,datetime,password)

        if(!filename){
            return res.status(500).json({ message: 'Internal Server error during downloadprocessRequest (filename not found' });
        }

        const currentTime = new Date().getTime();
        const expirationTime = currentTime + (30 * 60 * 1000);
        const downloadLink = `/download/downloadFile/${fileName}?expiration=${expirationTime}`;

        let filePath = `./src/drive/fileManagement/tobeSendToUser/${filename}`;
        setTimeout(()=>{
            fs.unlink(filePath,(err)=>{
                if(err){
                    console.log("Error during deleteing file in tobeSendToUser Directory.",err);
                }
            })
        },1800000)

        if(emailForNotification){
            let filesize = fileSize || "Not Available"
            sendSuccessfulFileProcessingEmail(emailForNotification,fileName,downloadLink,processingStartedDateAndTime,filesize);
        }

        res.send({link:downloadLink});
    }
    catch (err){
        console.log("Error : ",err)
        
        if(emailForNotification){
            let retryLink = 'returdbot.duckdns.org:8080/storedFilesPage';
            let reportErrorLink = "Not available";
            sendErrorDuringDownloadProcessEmail(emailForNotification,fileName,retryLink,reportErrorLink,processingStartedDateAndTime);
        }
        return res.status(500).json({ message: 'Internal Server error during downloadprocessRequest' });
    }
})

//the endpoint to download the final combined unencrypted file 
router.get('/downloadFile/:fileName', (req, res) => {
    const { fileName } = req.params;
    const { expiration } = req.query;

    if (!fileName) {
        return res.status(400).json({ error: 'Bad Request', message: 'Filename is required' });
    }

    if (fileName.length > 45) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid filename: exceeds 45 characters' });
    }

    if (!expiration) {
        return res.status(400).json({ error: 'Bad Request', message: 'Expiration time is required' });
    }

    if (isNaN(parseInt(expiration))) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid expiration time' });
    }

    const currentTime = new Date().getTime();
    const isExpired = currentTime > parseInt(expiration);
    if (isExpired) {
        return res.status(403).json({ error: 'Forbidden', message: 'Download link has expired' });
    }

    const filePath = `src/drive/fileManagement/tobeSendToUser/${fileName}`;

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not Found', message: 'File not found' });
    }

    try {
        fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden', message: 'No permission to access the file' });
    }

    return res.download(filePath);
});

function startProcessingDownload(sqlConnection,fileName,fromUser,datetime,password){
    return new Promise (async (resolve,reject)=>{
        try {
            const result = await getMessageIDFromNameDateAndUser(sqlConnection,fileName,fromUser,datetime);
            const arrayContainingMessageIDS_ChannelAndServerID = [ result.attachmentsMessageID , result.channel_ID , result.server_ID ];
            const finalFilePath = await downloadAndProcessTheFileParts(client,arrayContainingMessageIDS_ChannelAndServerID,password);
            if(!finalFilePath){
                reject (false);
            }
            const filename = finalFilePath.replace("src/drive/fileManagement/tobeSendToUser/","")
            resolve(filename);
         }
         catch (err){
            console.log("Error during startProcessingDownload : ",err);
            reject (err)
         }
    })
}

module.exports = router;