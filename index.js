const app = require("./app");
const db = require('./config/db')
const touristRouter = require('./routes/tourist_route');
const destinationRouter = require('./routes/destination_route');
const planRouter = require('./routes/plan_route');
const suggestionRouter = require('./routes/suggestion_route');
const adminRouter = require('./routes/admin_route');

const port = 3000;


app.listen(port, "0.0.0.0", () => {
    console.log(`Server Listening on Port ${port}`);
})