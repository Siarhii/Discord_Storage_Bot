require('dotenv').config();
const mongoose = require("mongoose");

const createMongooseInstance = async () => {
    try{
        mongoose.connect(process.env.MONGO_URI)
        .then(() => {
          console.log("Mongo connection Success.");
        })
        .catch((err) => {
          console.error("Mongo Connection Error", err);
        });
    }
    catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
}


module.exports = createMongooseInstance;