const express = require('express');
const Router = express.Router();
const root = require('../Controller/auth.controller')

Router.post('/login', root.login)
Router.post('/register', root.addUser);

module.exports = Router
