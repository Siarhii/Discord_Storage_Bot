function sortingFunction(filePath_i,filePath_iplus1){
    const filePath1Num = Number(filePath_i.split('.sf-part')[1]);
    const filePath2Num = Number(filePath_iplus1.split('.sf-part')[1]);                 
    return filePath1Num - filePath2Num;
}

async function getURLfromMessageID (client,arrayContainingMessageChannelAndServerID){
    return new Promise(async (resolve,rejects)=>{
        const channel = await client.channels.fetch(arrayContainingMessageChannelAndServerID[1]);
        const fetchedMessage = await channel.messages.fetch(arrayContainingMessageChannelAndServerID[0]);
        if(fetchedMessage.attachments.size>0){
            resolve(fetchedMessage.attachments.first().url)
        }else{
            rejects("NO attachment url found")
        }
    }) 
}

module.exports = {
    sortingFunction,
    getURLfromMessageID,
};