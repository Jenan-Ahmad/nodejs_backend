const express = require('express');
const TouristController = require('../controllers/tourist_controller');
const { toInteger } = require('lodash');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.signup);
touristRouter.get('/verify', TouristController.register);
touristRouter.post('/check-verification-status', TouristController.isVerified);
touristRouter.post('/login', TouristController.login);
touristRouter.post('/signInWithGoogle', TouristController.loginGGL);
touristRouter.post('/send-reset-email', TouristController.resetPassword);
touristRouter.post('/edit-account', TouristController.updateProfile);
touristRouter.post('/location-accquistion', TouristController.updateLocation);
touristRouter.post('/interests-filling', TouristController.updateInterests);
touristRouter.post('/get-interests', TouristController.fetchInterests);
touristRouter.post('/get-location', TouristController.fetchLocation);
touristRouter.get('/', (req, res) => {
  res.status(200).json({ status: true, success: "connected now" });
});

module.exports = touristRouter;