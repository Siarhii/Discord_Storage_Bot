const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/drive/fileManagement/FilesFromUser')
    },
    filename: function (req, file, cb) {
    const now = new Date();
       const formattedDate = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}__${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
       cb(null, formattedDate  + '__' +  file.originalname.replaceAll(" ","_"))
    },
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024
    }
  })

const upload = multer({ storage: storage })

module.exports = upload;