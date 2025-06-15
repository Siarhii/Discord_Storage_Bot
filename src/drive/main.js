//const merge = require('./fileDivide/add.js')
const splitFilesInChunks = require('./fileDivide/divideFile.js');
const encrypt = require('./encryptAndDecrypt/encryptAndCompress.js');
const decrypt = require('./encryptAndDecrypt/decryptAndExtract.js');
const fs = require('fs');
const { downloadFile } = require('./download.js')
const merge = require('./fileDivide/mergeFile.js');

//if we want to upload with encryption and compression (it needs password but will also take a bit more time(maybe?) to be uploaded)
let chunkSize =  20 * 1024 * 1024;

async function uploadFilesWithEncrypt(fileName,pass,dest){
    return new Promise((resolve,reject)=>{
    //first encrypt and compress
        let filePath = 'src/drive/fileManagement/FilesFromUser/' + fileName;
        encrypt({ filePath: filePath , password: pass , destination : dest , filename : fileName })
        .then(()=>{
            let filePathForCompressedFiles =  'src/drive/fileManagement/compressedAndEncrypted/' +  fileName + '.enc';
            let toBeUploadedPartsDir = 'src/drive/fileManagement/toBeUploadedParts';
            
            //after we get encrypted file,delete the original file
            fs.unlink(filePath,(err)=>{
                if(err){
                    console.log("Error occured during deleting main user file(after encryption and compression).")
                }
            })
            splitFilesInChunks(filePathForCompressedFiles, chunkSize, toBeUploadedPartsDir)
                .then((filesToBeUploadedPathArr)=>{
                    //return filesToBeUploadedPathArr;
                    resolve(filesToBeUploadedPathArr);
                    fs.unlink(filePathForCompressedFiles,(err)=>{
                        if(err){
                            console.log("Error occured while deleting compressed file after split-parts.",err);
                        }
                    })
                })
                .catch((err)=>{
                    console.log("Error during spliting files : ",err);
                    reject("Error occured during splitting")
                })   
        })
        .catch((err)=>{
            console.log("Error During encrypting and compressing.",err);
        })
    })
}

////////////////////////////////////////////////////////////////////download part/////////////////////////////////////////////////////////////////////////////

function downloadAndProcessTheFileParts(client,arrayContainingMessageID_JSONChannelAndServerID,passwd){
    return new Promise((resolves,rejects)=>{
      downloadFile(client,arrayContainingMessageID_JSONChannelAndServerID)
      .then((pathArr)=>{
            let encryptedfileName = pathArr[0].split("__")[2].split(".sf-part")[0]; 
            let mergeFileDirectory = 'src/drive/fileManagement/mergedFiles/';
            let mergedFilePath = mergeFileDirectory +  encryptedfileName;
            merge(pathArr,mergedFilePath)
            .then((mergedFileName)=>{
                for(const path of pathArr){
                    fs.unlinkSync(path,(err)=>{
                        if(err){
                            console.log("Error during deleting parts after merging.(decryptAndExtract) : ",err)
                        }
                    })
                }
                let finalPath = "src/drive/fileManagement/tobeSendToUser/" + encryptedfileName.split(".enc")[0] ;
                decrypt({ file: mergedFileName, password: passwd ,finalPath : finalPath })
                .then((finalPath)=>{
                    resolves(finalPath);
                })
                .catch((err)=>{
                    rejects("Error during decrypt in decyptAndExtract.js",err);
                })
            })
      })
      .catch ((err)=>{
        console.log(err);
      })
    })  
  }

module.exports = {
    uploadFilesWithEncrypt,
    downloadAndProcessTheFileParts
  };