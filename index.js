const app = require("./app");
// const UserModel = require('./models/user.model')
const db = require('./config/db')
const touristRouter = require('./routes/tourist_route');

const port = 3000;


app.listen(port, "0.0.0.0",()=>{
    console.log(`Server Listening on Port ${port}`);
})