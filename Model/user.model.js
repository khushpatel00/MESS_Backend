// this schema contains, userinfo (credentials)

const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    displayname: {
        type: String,
        required: false, // will be the same as username, if not specifically provided by frontend
    },
    email: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('user', userSchema);