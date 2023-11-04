const express = require('express');
const TouristController = require('../controllers/tourist_controller');
const { toInteger } = require('lodash');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.signup);

touristRouter.get('/verify', TouristController.register);

touristRouter.post('/check-verification-status', TouristController.isVerified);

touristRouter.post('/login', TouristController.login);

touristRouter.post('/send-reset-email', TouristController.resetPassword);

touristRouter.post('/edit-account', TouristController.updateProfile);

touristRouter.post('/location-accquistion', TouristController.updateLocation);

touristRouter.post('/get-image-url', (req, res) => {
  // Replace this with your MongoDB retrieval logic
  const imageUrl = 'https://storage.googleapis.com/touristine-9a51a.appspot.com/Cat_August_2010-4.jpg';

  res.json({ imageUrl });
});

touristRouter.get('/', (req, res) => {
  res.status(200).json({ status: true, success: "connected now" });
});



module.exports = touristRouter;