const express = require('express')
const validateToken = require('../middleware/validateToken.middleware.js');
const sqlConnection = require('../config/mysqlConfig.js');
const path = require('path');
const User = require('../model/user.models.js')
const { getNumberOfFilesOfSpecificUser ,deleteFileFromSQL , getStoredFilesForApi , getTotalFilesUploadesSize , checkPassword } = require('../utils/sqlUtils.js');
const { apiLimiter , deleteFileLimiter } = require('../middleware/rateLimiters.middleware.js');;

const router = express.Router();


router.get('/',(req,res)=>{
    res.redirect('/About');
})

router.get('/About',(req,res)=>{
    res.sendFile(path.join(__dirname ,'../public','AboutPage.html'));
})

router.get("/storedFilesPage",(req,res)=>{
    res.sendFile(path.join(__dirname ,'../public','storedFilesPage.html'));
})

router.get("/api/storedfiles",apiLimiter,validateToken,async (req,res)=>{

    const { pageIndex, sortBy , isDescending } = req.query;
    const index = pageIndex;
    const sortByFromUser = sortBy;
    const userID = req.userId;

    if (!userID || userID === "undefined") {
        return res.status(400).json({
            error: 'User ID not found'
        });
    }

    const mongoUser = await User.findById(userID);

    if (!mongoUser || mongoUser === "undefined") {
        return res.status(400).json({
            error: 'User not found'
        });
    }

    const userName = mongoUser.username;

    if (!userName || userName === "undefined") {
        return res.status(400).json({
            error: 'Username not found'
        });
    }

    if(!index || index === 'undefined'){
        return res.status(400).json({ error: 'Bad Request', message: 'Page Index parameter is required' });
    }

    const totalNumOfFiles = await getNumberOfFilesOfSpecificUser(sqlConnection, userName);	
    const totalIndex = Math.max(1, Math.ceil(totalNumOfFiles / 20));
    const indexInt = parseInt(index, 10); // Assuming 'index' is the input parameter

    if (isNaN(indexInt) || indexInt <= 0 || indexInt > totalIndex) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid Page Index',
        details: { totalNumOfFiles, totalIndex, indexInt }
      });
    }

    //const indexInt = parseInt(index);
    //const totalNumOfFiles = await getNumberOfFilesOfSpecificUser(sqlConnection,userName);
    
    //const totalIndex = Math.ceil(totalNumOfFiles/20);

    //if(indexInt<=0 || indexInt>totalIndex || isNaN(indexInt) ){
  //      return res.status(400).json({ error: 'Bad Request', message: 'Invalid Page Index' });
//    }
    if(!sortByFromUser || sortByFromUser === 'undefined'){
        return res.status(400).json({ error: 'Bad Request', message: 'sortBy parameter is required' });
    }

    if(isDescending !== 'true' && isDescending !== 'false'){
        return res.status(400).json({ error: 'Bad Request', message: 'isDescending parameter can only be true or false' });
    }

    try{
        let sortOrder = isDescending === 'true'? 'DESC':'ASC';

        let files = await getStoredFilesForApi(sqlConnection,index,sortByFromUser,sortOrder,userName);
        if(!files || files === "undefined"){
            return res.status(500).send('internal error,try again after sometime');
        }

        const totalUploadSize = await getTotalFilesUploadesSize(sqlConnection);
        if(!totalUploadSize || totalUploadSize === "undefined"){
            return res.status(500).send('internal error,try again after sometime');
        }
        
       return res.send({
            files:files,
            totalNumOfFiles:totalNumOfFiles,
            totalUploadSize
       })
    }
    catch (err) {
        console.log("Error during fetch files api : ",err);
        return res.status(500).send('internal error,try again after sometime');
    }
})

router.delete("/api/delete",deleteFileLimiter,validateToken,async (req, res) => {
    const { fileName, fromUser, datetime, password } = req.body;

    if (!fileName || fileName === "undefined") {
        console.log(fileName)
        return res.status(400).json({ error: 'Bad Request', message: 'fileName is required' });
    }
    if (!fromUser || fromUser === "undefined") {
        return res.status(400).json({ error: 'Bad Request', message: 'fromUser is required' });
    }
    if (!datetime || datetime === "undefined") {
        return res.status(400).json({ error: 'Bad Request', message: 'datetime is required' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Bad Request', message: 'Password is required' });
    }

    try {

        const passwordAfterCheck = await checkPassword(sqlConnection,fileName,fromUser,datetime,password);
        
        if(!passwordAfterCheck){
            return res.status(401).json({ message: 'Invalid Password' });
        }

        deleteFileFromSQL(sqlConnection,fileName,fromUser,datetime)
        .then((msg)=>{
           return res.send({msg});
        })
        .catch((msg)=>{
            if(msg === 404){
                res.status(404).json({message:"File not found or already deleted"});
            }
            return res.status(500).json({ error: 'Internal Server Error', message: 'File could not be deleted' });
        })

    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred while deleting the file' });
    }
});

module.exports = router;
