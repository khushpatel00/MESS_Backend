const mongoose = require('mongoose')
const express = require('express');
const Router = express.Router();


Router.get('/health', (req, res) => {
    try {

        let connectionState = mongoose.connection.readyState;
        let state;
        // using manual switch instead of mongoose's mongoose.STATES[], assuming mroe efficiency
        switch (connectionState) {
            case 0: state = 'disconnected'; break;
            case 1: state = 'connected'; break;
            case 2: state = 'connecting'; break;
            case 3: state = 'disconnecting'; break;
            default: state = 'unknown';
        }
        return res.json({
            status: 'ok', // no fallback, cause if theres an error in server, the routes will not reach till here, server will break in between
            databaseState: state
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json('Internal Server Error');
    }
})



module.exports = Router;