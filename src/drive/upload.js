const {  AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const getCipherKey = require('./encryptAndDecrypt/cipherKey.js');
const sqlConnection = require('../config/mysqlConfig.js')

const sendMultipleFiles = async (channel, pathArr, startIndex, user, fileSize, is_Encrypted, msgID_Json, filePassword) => {
    let messageID_Json = msgID_Json || {};
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; 

    const sendFile = async (filePath, partNumber, retryCount = 0) => {
        const fileName = path.basename(filePath);

        try {
            const fileContent = await fs.promises.readFile(filePath);
            const attachment = new AttachmentBuilder(fileContent, { name: fileName });
            const message = await channel.send({
                files: [attachment]
            }, { timeout: 90000 }); 

            messageID_Json[`part${partNumber}`] = message.id;

            await fs.promises.unlink(filePath);
            return true;
        } catch (error) {
            console.error(`Error sending file ${fileName}:`, error);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying ${fileName} in ${RETRY_DELAY / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return sendFile(filePath, partNumber, retryCount + 1);
            }
            channel.send(`Failed to send ${fileName} after ${MAX_RETRIES} attempts.`);
            return false;
        }
    };

    for (let i = startIndex; i < pathArr.length; i++) {
        const success = await sendFile(pathArr[i], i + 1);
        if (!success) break;
    }

    if (Object.keys(messageID_Json).length === pathArr.length) {
    
        const lastFileName = path.basename(pathArr[pathArr.length - 1]);
        const fileNameWithoutDateAndTime = lastFileName.split("__")[2].split(".enc.sf-part")[0];
        const fileNameExtension = path.extname(fileNameWithoutDateAndTime).slice(1);
        const serverID = channel.guild.id;     
       
        const actualPassword = filePassword === undefined || filePassword === null ? 'nineturds' : filePassword;
        
        const hashedHexPassword = getCipherKey(actualPassword).toString('hex');

        const query = `
            INSERT INTO discord_files_messages 
            (filename, is_Encrypted, totalParts, attachmentsMessageID, hashedPassword, fromUser, downloaded, filesize, filetype, channel_ID, server_ID)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
        `;

        const values = [
            fileNameWithoutDateAndTime,
            is_Encrypted,
            pathArr.length,
            JSON.stringify(messageID_Json),
            hashedHexPassword,
            user,
            fileSize,
            fileNameExtension,
            channel.id,
            serverID
        ];

        try {
            await new Promise((resolve, reject) => {
                sqlConnection.query(query, values, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        } catch (error) {
            console.error('Error inserting file data after upload:', error);
            channel.send('Files uploaded, but there was an error saving the file data.');
        }
    } else {
        channel.send('Some files failed to upload. Please try again.');
    }
};

module.exports = sendMultipleFiles;
