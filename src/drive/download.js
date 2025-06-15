const fs = require('fs');
const https = require('https');
const { sortingFunction , getURLfromMessageID } = require('../utils/downloadUtils.js')

async function downloadFile(client,arrayContainingMessageID_JSONChannelAndServerID){
    return new Promise ((resolve,rejects)=>{
        try{
            let downloadedParts = []
            let messageID_Json = arrayContainingMessageID_JSONChannelAndServerID[0];
            let channelID = arrayContainingMessageID_JSONChannelAndServerID[1];
            let serverID = arrayContainingMessageID_JSONChannelAndServerID[2];
            let parts = Object.keys(messageID_Json).length;
            for(let i = 1;i<=parts;i++){
                let msgID = Object.values(messageID_Json)[i-1];
                getURLfromMessageID(client,[msgID,channelID,serverID])
                .then((url)=>{
                    downloadFromUrl(url)
                    .then((filePath)=>{
                        downloadedParts.push(filePath);
                        if(downloadedParts.length === parts){
                            downloadedParts.sort(sortingFunction);
                            resolve(downloadedParts);
                        }
                    })
                })
            }
        }
        catch (err){
            console.log(err);
            rejects("Error During downloading Parts from discord in download.js : ",err);
        }
    })
}               

function downloadFromUrl(url){
    return new Promise((resolve,rejects)=>{
        const fileNameFromURL = url.split('/')[6].split('?')[0];
        const dirForDownloads = 'src/drive/fileManagement/downloadedPartsFromDiscord/'
        const file = fs.createWriteStream(dirForDownloads + fileNameFromURL);
        https.get(url, response => {
            response.pipe(file);

            response.on('end',()=>{
                let filePath = dirForDownloads + fileNameFromURL;
                resolve(filePath);
            })
            response.on('error',(err)=>{
                rejects([`Error while downloading from : ${url}`,err])
            })
        })
    })
}

module.exports = {
    downloadFile
} 