const mongoose = require('mongoose');
const connection = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => { console.log('Established Connection with Database') })
        .catch((error) => { console.error('\n\nCant Establish connection with Databse, due to, \n' + error) })
}

module.exports = connection
