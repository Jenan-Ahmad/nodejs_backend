const admin = require("firebase-admin");

var serviceAccount = require("../touristine-9a51a-firebase-adminsdk-48pjb-a5ec736de4.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://touristine-9a51a-default-rtdb.firebaseio.com",
    storageBucket: "gs://touristine-9a51a.appspot.com"
});

module.exports = admin;