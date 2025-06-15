const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');
const getCipherKey = require('./cipherKey.js')

function decrypt({ file, password ,finalPath }) {
  return new Promise((resolves,rejects)=>{

    // First, get the initialization vector from the file.
    const readInitVect = fs.createReadStream(file, { end: 15 });

    let initVect;
    readInitVect.on('data', (chunk) => {
      initVect = chunk;
    });

    // when we get the initialization vector, we can decrypt the file.
    readInitVect.on('close', () => {
      const cipherKey = getCipherKey(password);
      const readStream = fs.createReadStream(file, { start: 16 });
      const decipher = crypto.createDecipheriv('aes256', cipherKey, initVect);
      const unzip = zlib.createUnzip();
      const writeStream = fs.createWriteStream(finalPath);
        writeStream.on('finish',()=>{
          fs.unlinkSync(file,(err)=>{
            if(err){
              console.log("Error during deleting merged file after decypting(decryptAndExtract.js)")
              rejects(err);
              return
            }
          })
          resolves(finalPath)
        })  
      readStream
        .pipe(decipher)
        .pipe(unzip)
        .pipe(writeStream);
    });
  })
}

module.exports = decrypt;
