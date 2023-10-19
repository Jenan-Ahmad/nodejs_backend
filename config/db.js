const mongoose = require('mongoose');
mongoose.set('debug', true);


const connection = mongoose.createConnection(`mongodb+srv://touristine:touristine@touristine.qz5j03q.mongodb.net/touristine`).on('open',()=>{console.log("MongoDB Connected");}).on('error',()=>{
    console.log("MongoDB Connection error");
});

module.exports = connection;