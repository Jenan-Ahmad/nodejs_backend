const express = require("express");
const bodyParser = require('body-parser'); // Import body-parser

const app = express();
const TouristRoute = require('./routes/tourist_route');

// Middleware setup
// app.use(express.json()); // JSON request body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 
// Route definitions

app.use("/", TouristRoute); // Example route

  

module.exports = app;