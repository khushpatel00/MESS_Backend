const userModel = require('../Model/user.model')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
exports.addUser = async (req, res) => {
    try {
        let { username, password, email, displayName } = req.body;
        console.log(`username: ${username}, password: ${password}, email: ${email}, displayName: ${displayName}`);
        if (username && password && email) {
            if (displayName === undefined || null) displayName = username
            // console.log('STATUS: hashing password !!!!') 
            // password hashing takes about 2.7 - 2.8 seconds
            // calculated by log timestams in terminal, 
            // (tested on linux system, on 4.2GHz single thread operation) 
            password = await bcrypt.hash(password, 16)
            // console.log('STATUS: hashed password !!!!')

            // providing info too early to make the response time faster for frontend,
            // connectionstate = 1 == connected, just to make sure data will reach to database
            if (username && password && email && displayName && mongoose.connection.readyState == 1) res.status(201).json('user added successfully')
            let userInfo = {
                username,
                displayName,
                email, // hoping validation is done at frontend, will at here later
                password
            }
            await userModel.create(userInfo)
            console.log('data added in database, returning')
            return // to avoid potential overloading (or memory leak, if users expand), by ending running instance of req,res cycle
        } else return res.status(400).json('Insufficient Data') // 400 = bad request

    } catch (error) {
        return res.status(500).json('Internal Server Error')
    }
}
exports.login = async (req, res) => {
    try {

        let { username, email, password } = req.body;
        if (username && password) {
            // let user = await userModel.findOne({ username: username }).select('-createdAt -updatedAt -__v -_id -email')
            let user = await userModel.findOne({ username: username }).select('username password _id')
            if (!user) return res.status(401).json('Invalid Credentials');
            let isValid = await bcrypt.compare(user?.password, password);
            if (!isValid) return res.status(401).json('Invalid Credentials');
            if (isValid === true) {
                let jwttoken = jwt.sign({ username, _id })
                return res.json(jwttoken);
            }
        } else if (email && password) {
            let user = await userModel.findOne({ email: email }).select('email password username _id')
            if (!user) return res.status(401).json('Invalid Credentials');
            let isValid = await bcrypt.compare(user?.password, password);
            if (!isValid) return res.status(401).json('Invalid Credentials');
            if (isValid === true) {
                let jwttoken = jwt.sign({ username, _id })
                return res.json(jwttoken);
            }
        } else return res.status(401).json('Invalid Credentials');
    } catch (error) {
        console.log(error);
        return res.status(500).json('Internal Server Error');
    }
}