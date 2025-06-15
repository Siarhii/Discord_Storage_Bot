const {  getMessageIDFromIndex , getNumberOfFiles } = require('../../utils/sqlUtils.js');
const getCipherKey = require('../encryptAndDecrypt/cipherKey.js');
const sqlConnection = require('../../config/mysqlConfig.js');

async function checkArguments(msg, arguments) {
    try {
        if (arguments.length <= 1) {
            msg.reply("Please specify a file index or filename.");
            return null;
        }
        const singleFileIndex = parseInt(arguments[1], 10);
        const numOfFiles = await getNumberOfFiles(sqlConnection);
        if (singleFileIndex < 1 || singleFileIndex > numOfFiles) {
            msg.reply("Please enter a valid index");
            return null;
        }
        if (arguments.length <= 2) {
            msg.reply("Please specify the password");
            return null;
        }

        const passwordFromUser = arguments[2];
        const arrayContainingMessageIDS_ChannelAndServerID = await checkPassword(singleFileIndex, passwordFromUser, sqlConnection);

        if (!arrayContainingMessageIDS_ChannelAndServerID) {
            msg.reply("Invalid Password. Try again.");
            return null;
        }
        return arrayContainingMessageIDS_ChannelAndServerID;

    } catch (err) {
        console.error("Error in checkArguments function:", err);
        msg.reply("An error occurred while processing your request.");
        return null;
    }
}

async function checkPassword(index,passwordFromUser,sqlConnection){
    let userPasswordHashed = getCipherKey(passwordFromUser).toString('hex');
    let resultArr = await getMessageIDFromIndex(sqlConnection,index);
    let hashedPasswordFromDB = resultArr[3];
    if(hashedPasswordFromDB===userPasswordHashed){
        return resultArr;
    } 
    else{
        return null;
    }
}

module.exports = {
    checkPassword,
    checkArguments
}