const express = require('express');
const TouristController = require('../controllers/tourist_controller');
const { toInteger } = require('lodash');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.signup);

touristRouter.get('/verify', TouristController.register);

touristRouter.post('/login', TouristController.login);
;
touristRouter.post('/reset_password', TouristController.resetPassword);

touristRouter.get('/', (req, res) => {
    res.status(200).json({ status: true, success: "connected now" });
});



module.exports = touristRouter;
