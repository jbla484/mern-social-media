const mongoose = require('mongoose');
const config = require('config');
const URI = config.get('mongoURI');

let connectDatabase = async () => {
    try {
        await mongoose.connect(URI);
        console.log('Database connection established');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDatabase;
