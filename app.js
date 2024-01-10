const express = require("express");
const bodyParser = require('body-parser'); // Import body-parser
const cors = require('cors');//foroweb
const app = express();
const TouristRoute = require('./routes/tourist_route');
const DestinationRoute = require('./routes/destination_route');
const PlanRoute = require('./routes/plan_route');
const suggestionRoute = require('./routes/suggestion_route');
const adminRoute = require('./routes/admin_route');

// Middleware setup
// app.use(express.json()); // JSON request body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());//forweb
// Route definitions
app.use("/", TouristRoute); // Example route
app.use("/", DestinationRoute);
app.use("/", PlanRoute);
app.use("/", suggestionRoute);
app.use("/", adminRoute);


module.exports = app;