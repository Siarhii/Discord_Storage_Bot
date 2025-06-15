const splitFile = require('split-file');

function merge(inputArr,combinedFileName){
  return new Promise((resolve,reject)=>{
    splitFile.mergeFiles(inputArr,combinedFileName)
    .then(() => {
      resolve(combinedFileName)
    })
    .catch((err) => {
      reject();
      console.log('Error during merging file(mergeFile.js): ', err);
    });
  })
}

module.exports =  merge ;