const app = require("./app");
const db = require('./config/db')
const touristRouter = require('./routes/tourist_route');
const destinationRouter = require('./routes/destination_route');

const port = 3000;


app.listen(port, "0.0.0.0",()=>{
    console.log(`Server Listening on Port ${port}`);
})