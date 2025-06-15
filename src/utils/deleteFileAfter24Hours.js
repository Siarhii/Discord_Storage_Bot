const fs = require('fs');
const path = require('path');

function deleteFilesAfter24Hours (directoryPath){
    try {
        fs.readdir(directoryPath,(err,files)=>{
            if(err){
                console.error('Error reading directory (in delete filesd after 24 hours):', err);
                return;
            }
            const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
            files.forEach((file)=>{
                const filePath = path.join(directoryPath, file);
                fs.stat(filePath,(err,stats)=>{
                    if(err){
                        console.error('Error reading file (in delete files after 24 hours):', err);
                        return;
                    }
    
                    if(stats.mtime.getTime() < thirtyMinutesAgo){
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error(`Error deleting file ${file} (in delete files after 24 hours):`, err);
                            }
                            else {
                                console.log("File Deleted : ",file)
                            }
                        })
                    }
                })
            })
        })
    }catch (err){
        return;
    }
}

module.exports = deleteFilesAfter24Hours;
