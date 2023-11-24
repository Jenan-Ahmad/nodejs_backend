const express = require("express");
const bodyParser = require('body-parser'); // Import body-parser

const app = express();
const TouristRoute = require('./routes/tourist_route');
const DestinationRoute = require('./routes/destination_route');
const PlanRoute = require('./routes/plan_route');

// Middleware setup
// app.use(express.json()); // JSON request body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
// Route definitions

app.use("/", TouristRoute); // Example route
app.use("/", DestinationRoute);
app.use("/", PlanRoute);

module.exports = app;