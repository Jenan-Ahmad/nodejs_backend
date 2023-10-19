const express = require("express");
const app = express();
const TouristRoute = require('./routes/tourist_route');

// Middleware setup
app.use(express.json()); // JSON request body parsing

// Route definitions
app.use("/", TouristRoute); // Example route

module.exports = app;