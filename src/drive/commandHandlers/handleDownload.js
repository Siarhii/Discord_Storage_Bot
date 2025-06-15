const  { downloadAndProcessTheFileParts } = require('../main.js');
const { checkArguments } = require('../services/validation.js')

async function handleDownload(msg,arguments,client,websiteLink){
    let arrayContainingMessageIDS_ChannelAndServerID = await checkArguments(msg,arguments);
    if(!arrayContainingMessageIDS_ChannelAndServerID){
        return null
    }
    let repliedMsg = await msg.reply("Searching the file...");
    let finalDownloadFilePath = await downloadAndProcessTheFileParts(client,arrayContainingMessageIDS_ChannelAndServerID,arguments[2])
    const fileName = finalDownloadFilePath.split("src/drive/fileManagement/tobeSendToUser/")[1];
    const encodedFilename = encodeURIComponent(fileName);
    let newContent = `This link will only be valid for next 15 minutes\nDownload link : ${websiteLink}/downloadPage/${encodedFilename}`;
    repliedMsg.edit(newContent)
    .then(()=>{
        //const secondsToDeleteTime = 900000; //15 mins in miliseconds
        let filePath = `./src/drive/fileManagement/tobeSendToUser/${fileName}`;
        setTimeout(()=>{
            fs.unlink(filePath,(err)=>{
                if(err){
                    console.log("Error during deleteing file in tobeSendToUser Directory.",err);
                }
                else{
                    console.log("File deleted")
                }
            })
        },900000)
    })
    .catch(error => {
        console.error('Error editing reply:', error);
    });         
}

module.exports =  handleDownload;
