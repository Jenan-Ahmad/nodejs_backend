const express = require('express');
const TouristController = require('../controllers/tourist_controller');
const { toInteger } = require('lodash');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.signup);

touristRouter.post('/login', TouristController.login);

touristRouter.get('/', (req, res) => {
    res.status(200).json({ status: true, success: "connected now" });
});

touristRouter.get('/verify', TouristController.register);

module.exports = touristRouter;