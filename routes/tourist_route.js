const express = require('express');
const TouristController = require('../controllers/tourist_controller');
const { toInteger } = require('lodash');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.signup);

touristRouter.get('/verify', TouristController.register);

touristRouter.post('/check-verification-status', TouristController.isVerified);

touristRouter.post('/login', TouristController.login);

touristRouter.post('/send-reset-email', TouristController.resetPassword);

touristRouter.post('/edit-account', upload.single('profileImage'), TouristController.updateProfile);

touristRouter.get('/', (req, res) => {
    res.status(200).json({ status: true, success: "connected now" });
});



module.exports = touristRouter;