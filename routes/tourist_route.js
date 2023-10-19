const express = require('express');
const TouristController = require('../controllers/tourist_controller');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.register);

touristRouter.post('/login', TouristController.login);

touristRouter.get('/', (req, res) => {
    res.json({ status: true, success: "connected now" });
});

module.exports = touristRouter;