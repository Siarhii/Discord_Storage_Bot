const splitFile = require('split-file');

 function splitFilesInChunks(mainFilePath,chunksSize,destination) {
  return splitFile.splitFileBySize(mainFilePath,chunksSize,destination)
  .then((Arr) => {
    return Arr
  })
  .catch((err) => {
    console.log('Error: ', err);
    throw err;
  }); 
}
 
module.exports = splitFilesInChunks;