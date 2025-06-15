
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform } = require('stream');
const getCipherKey = require('./cipherKey.js')

//we have 4 streams readStream,writestread,duplex and transformStream(in this we can both read and write )
class AppendInitVect extends Transform {
  constructor(initVect, opts) {
    super(opts);
    this.initVect = initVect;
    this.appended = false;
  }

  _transform(chunk, encoding, cb) {
    if (!this.appended) {
      this.push(this.initVect);
      this.appended = true;
    }
    this.push(chunk);
    cb();
  }
}

function encrypt({ filePath,password ,destination,filename}) {
  return new Promise((resolve,reject)=>{
    const initVect = crypto.randomBytes(16);
  
    const CIPHER_KEY = getCipherKey(password);

    const readStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip();
    const cipher = crypto.createCipheriv('aes256', CIPHER_KEY, initVect);
    const appendInitVect = new AppendInitVect(initVect);
    // Create a write stream with a different file extension.
    const writeStream = fs.createWriteStream(path.join(destination + filename + ".enc"));
    
    readStream
      .pipe(gzip)
      .pipe(cipher)
      .pipe(appendInitVect)
      .pipe(writeStream);
  
      writeStream.on('finish',()=>{
        let cipherKeyInHex = CIPHER_KEY.toString('hex');
        resolve(cipherKeyInHex);
      })
      readStream.on('error',(err)=>{
        reject(new Error("Error with readStream during encryption and compression" + err));
      })
      writeStream.on('error',(err)=>{
        reject(new Error("Error with writeStream during encryption and compression" + err));
      })
  })
}
module.exports = encrypt;
