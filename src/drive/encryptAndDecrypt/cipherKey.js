const crypto = require('crypto');

function getCipherKey (password){
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const key = hash.digest();
    return key;
}

module.exports = getCipherKey;