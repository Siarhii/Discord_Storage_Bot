const getCipherKey = require('../drive/encryptAndDecrypt/cipherKey.js');

//function getNumberOfFilesOfSpecificUser(sqlConnection, userName) {
    //return new Promise((resolve, reject) => {
      //  const query = 'SELECT COUNT(*) AS count FROM discord_files_messages WHERE fromUser = ?';
    //    sqlConnection.execute(query, [userName], (err, results, fields) => {
  //          if (err) {
//                reject(err);
//         } else {
//              resolve(results[0].count);
//           }
//        });
//   });
//}

const getNumberOfFilesOfSpecificUser = async (sqlConnection, userName) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT COUNT(*) AS count FROM discord_files_messages WHERE fromUser = ?';
    sqlConnection.execute(query, [userName], (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(parseInt(results[0].count, 10));
      }
    });
  });
};

function checkPassword(sqlConnection, fileName, fromUser, datetime, password) {
    return new Promise((resolve, reject) => {
        const query = `SELECT hashedPassword
                       FROM discord_files_messages
                       WHERE filename = ? AND fromUser = ? AND datetime = ?`;
        const datetimeValue = new Date(datetime);
        sqlConnection.execute(query, [fileName, fromUser, datetimeValue], (err, results, fields) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!results || results.length === 0) {
                resolve(false); // No matching record found
                return;
            }

            let hashedHexPasswordFromUser = getCipherKey(password).toString('hex');
            if (hashedHexPasswordFromUser === results[0].hashedPassword) {
                resolve(password);
                return;
            }
            resolve(false);
        });
    });
}

function getMessageIDFromNameDateAndUser (sqlConnection,fileName,fromUser,datetime){
    return new Promise ((resolve,rejects)=>{
        const query = ` SELECT attachmentsMessageID,channel_ID,server_ID
                        FROM discord_files_messages 
                        WHERE filename = ? AND fromUser = ? AND datetime = ?`;

        const datetimeValue = new Date (datetime);
        sqlConnection.execute(query, [fileName, fromUser,datetimeValue], (err, results, fields) => {
            if (err) {
                rejects(err)
                return;
            }
            resolve(results[0]);
        });
    })
}

function deleteFileFromSQL(sqlConnection, fileName, fromUser, datetime) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM discord_files_messages 
                       WHERE filename = ? AND fromUser = ? AND datetime = ?`;
        const datetimeValue = new Date(datetime);

        sqlConnection.execute(query, [fileName, fromUser, datetimeValue], (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            if (result.affectedRows === 0) {
                reject(404);
                return;
            }

            resolve(`File ${fileName} deleted successfully from database`);
        });
    });
}

function getStoredFilesForApi(sqlConnection, index, sortBy, sortOrder, fromUser) {
    return new Promise((resolve, reject) => {
        const limit = 20;
        const offset = (index - 1) * limit;
        
        const validSortColumns = {
            'size': 'filesize',
            'date': 'datetime',
            'name': 'filename'
        };

        const sortColumn = validSortColumns[sortBy] || 'datetime'; // Default to datetime if invalid
        const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'; // Ensure valid order

        // Construct the query with the sort column inserted directly
        const query = `
            SELECT filename, filetype, filesize, is_Encrypted, datetime, totalParts, fromUser 
            FROM discord_files_messages 
            WHERE fromUser = ?
            ORDER BY ${sqlConnection.escapeId(sortColumn)} ${order}
            LIMIT ${limit} OFFSET ${offset}
        `;

        sqlConnection.execute(query, [fromUser], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getTotalFilesUploadesSize(sqlConnection){
    return new Promise ((resolve,reject)=>{
        let query = `SELECT SUM(filesize) / (1024 * 1024) AS total_size_in_mb FROM discord_files_messages`;
        sqlConnection.execute (query,(err,results)=>{
            if(err){
              reject(err);
            }
           resolve(results[0].total_size_in_mb)
        })
    })
}

//used while interacting with bot in discord with commands
// function getNumberOfFilesOfSpecificUser(sqlConnection, userName) {
//     return new Promise((resolve, reject) => {
//         const query = 'SELECT COUNT(*) AS count FROM discord_files_messages';
//         sqlConnection.execute(query, (err, results, fields) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results[0].count);
//             }
//         });
//     });
// }

// function getMessageIDFromIndex(sqlConnectionInstance,index){
//     return new Promise ((resolve,reject)=>{
//         let sqlConnection = sqlConnectionInstance;
//         let query = `SELECT * FROM discord_files_messages
//         ORDER BY server_ID
//         LIMIT 1 OFFSET ${index-1}`;
//         sqlConnection.execute(query,(err,results,fields)=>{
//             if(err){
//                 console.log(err);
//                 reject(err);
//                 return;
//             }
//             resolve([results[0].attachmentsMessageID,results[0].channel_ID,results[0].server_ID,results[0].hashedPassword]);
//         })
//     })
// }

// function getMessageIDFromFilename(sqlConnectionInstance,fileName){
//     return new Promise ((resolve,reject)=>{
//         let sqlConnection = sqlConnectionInstance;
//         let query = `SELECT * FROM discord_files_messages
//         where filename = '${fileName}'`;

//         sqlConnection.execute(query,(err,results,fields)=>{
//             if(err){
//                 console.log(err);
//                 reject(err);
//                 return;
//             }
//             resolve([results[0].attachmentsMessageID,results[0].channel_ID,results[0].server_ID]);
//         })
//     })
// }

module.exports = {
    // getNumberOfFiles,
    // getMessageIDFromFilename,
    // getMessageIDFromIndex,
    checkPassword,
    getMessageIDFromNameDateAndUser,
    getNumberOfFilesOfSpecificUser,
    deleteFileFromSQL,
    getStoredFilesForApi,
    getTotalFilesUploadesSize
}
