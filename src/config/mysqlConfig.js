const mysql = require('mysql2');

const sqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.SQL_PASSWORD,
    database: "discord_storage_bot"
});
  
sqlConnection.connect(function(err) {
    if (err) throw err;
    console.log("Connected to mysql!");
});

module.exports = sqlConnection;
