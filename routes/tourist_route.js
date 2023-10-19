const express = require('express');
const TouristController = require('../controllers/tourist_controller');

const touristRouter = express.Router();


touristRouter.post('/signup', TouristController.register);

touristRouter.post('/login', TouristController.login);

touristRouter.get('/', ()=>{
    res.json({ status: true, success: "connected npw" });
})

module.exports = touristRouter;