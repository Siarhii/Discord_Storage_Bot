require('dotenv').config();
const app = require('./config/expressConfig.js');
const initializeClient = require('./config/discordConfig.js');
const createMongooseInstance = require('./config/mongooseConfig.js');
const authRouter = require('./routes/auth.routes.js');
const uploadRouter = require('./routes/upload.routes.js');
const downloadRouter = require('./routes/download.routes.js');
const otherRouter = require('./routes/other.routes.js');

const deleteFilesAfter24Hours = require('./utils/deleteFileAfter24Hours.js');

//uncomment to work with discord bot via commands
// const handleStoredFiles = require('./drive/commandHandlers/handleStoredFiles.js');
// const handleDownload = require('./drive/commandHandlers/handleDownload.js');

createMongooseInstance();

setInterval(()=>{
    let directoryPaths = [
        `./src/drive/fileManagement/tobeSendToUser/`,
        `./src/drive/fileManagement/toBeUploadedParts/`,
        `./src/drive/fileManagement/mergedFiles/`,
        `./src/drive/fileManagement/FilesFromUser/`,
        `./src/drive/fileManagement/downloadedPartsFromDiscord/`,
        `./src/drive/fileManagement/compressedAndEncrypted/`
    ]
    directoryPaths.forEach((directoryPath)=>{
        deleteFilesAfter24Hours(directoryPath) //will only delete if the file is older than 30 min;
    })
},4 * 60 * 60 * 1000); //every 4 hours instead of 24 hours as i dont think my server will have 24hrs uptime...

app.use('/auth',authRouter);
app.use('/upload',uploadRouter)
app.use('/download',downloadRouter)
app.use('/',otherRouter)

// //uncomment to work with discord bot via commands
// let websiteLink =  `https://localhost:3000`;
// let commandArr = [
//     {
//         "command":"r!whogae",  
//         "description":"Displays the name of the person who left the vc last"
//     },
//     {
//         "command":"r!post",
//         "description":"Sends the website url to upload your files."
//     },
//     {
//         "command":"r!download (r!download <fileindex>)",
//         "description": "Takes index of the required file as a parameter and generates the download link."
//     },
//     {
//         "command":"r!showfiles",
//         "description": "Displays Your stored/uploaded files on discord."
//     },
// ]

initializeClient()
.then(client => {
    //uncomment to work with discord bot via commands
    // client.on('messageCreate', (msg) => {
    //     if (msg.author.bot) {
    //         return;
    //     }
    //     if (!msg.content.startsWith('r!') && !msg.content.startsWith(' r!')) {
    //         return;
    //     }

    //     const msgString = msg.content.substring(2).trim();
    //     const args = msgString.split(/\s+/);
    //     const command = args[0];
    //     const guild = client.guilds.cache.get(msg.guildId);

    //     if (command === "ping") {
    //         msg.reply("pong");
    //     } 
    //     else if (command === "help" || command === "h") {
    //         let commandList = "**List of commands:**\n";

    //         for (const commandObj of commandArr) {
    //             commandList += `\n${commandObj.command} : ${commandObj.description}.\n`;
    //         }
    //         msg.reply(commandList);
    //     } else if (command === "post" || command === "po") {
    //         msg.reply(`Use this link to upload your files: ${websiteLink}/uploadWithEncrypt`);
    //     } else if (command === "download" || command === "do") {
    //         handleDownload(msg, args, client, websiteLink);
    //     } else if (command === "showfiles" || command === "sf") {
    //         handleStoredFiles(msg, args);
    //     } else if (command === "delete" || command === "d") {
    //         handleDelete(msg, args);
    //     } else if (command === "test" || command === "t") {
    //         handleDownload(msg, args);
    //     }
    // });

    module.exports = client;
    
}).catch(err => {
    console.error('Failed to initialize client:', err);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error :(' });
});
