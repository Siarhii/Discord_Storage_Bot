const sqlConnection = require('../../config/mysqlConfig.js');

function showStoredFiles(){
    return new Promise((resolve,reject) => {
        let storedFiles_20 = ``;
        //each index of this array will contain a page of 20 files each(this is to send messages over 2k character size)
        let replyStoredFilesArray = [];
        let query = `select * from discord_files_messages`;
        sqlConnection.execute(query,(err,results,fields)=>{
                if(err){
                    reject(err);
                    return
                } 
            let i = 1;
            for(eachRow of results){
                const datetime = eachRow.datetime.toString().replace("GMT+0530 (India Standard Time)","");
                const fileSize = (parseInt(eachRow.filesize)/1048576).toFixed(1);
                let fileSentence2 = ` ${i}.From ${eachRow.fromUser} on ${datetime}---[${fileSize}MB] ${eachRow.filename}\n`;
                let fileSentence = fileSentence2.replaceAll("_"," ");
                if(i%20===0){
                    storedFiles_20 += fileSentence;
                    replyStoredFilesArray.push(storedFiles_20);
                    storedFiles_20 = ``;
                    i++;
                }
                else{
                    i++;
                    storedFiles_20 += fileSentence;
                }
            }
            replyStoredFilesArray.push(storedFiles_20);
            if(i-1===results.length){
                resolve(replyStoredFilesArray);
            }
        })
    })     
}

async function handleStoredFiles(msg,arguments,sqlConnection){
    try{
        const storedFilesMsg = await showStoredFiles(sqlConnection);
        let singlePageIndex = parseInt(arguments[1]);
        if(!singlePageIndex){
            let replyMessage = `Page 1 out of ${storedFilesMsg.length}\n` + storedFilesMsg[0];
            msg.reply(replyMessage);
            return;
        }
        else if(singlePageIndex<1 || singlePageIndex>storedFilesMsg.length){
            msg.reply("Invalid Page index.");
            return;
        }
        let replyMessage = `Page ${singlePageIndex} out of ${storedFilesMsg.length}\n` + storedFilesMsg[singlePageIndex-1];
        msg.reply(replyMessage);
    }
    catch (err){
        if(msg){
            msg.send("An error Occured")
        }
        console.log("Error during handleStoredFiles.");
    }
}

module.exports = handleStoredFiles;
