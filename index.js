const app = require("./app");
const db = require('./config/db')
const touristRouter = require('./routes/tourist_route');
const destinationRouter = require('./routes/destination_route');
const planRouter = require('./routes/plan_route');
const suggestionRouter = require('./routes/suggestion_route');
const adminRouter = require('./routes/admin_route');

const sendNotification = require('./notifications/send_notification');
const deviceToken = "dB4tqsgrTrad4VAKHunHsJ:APA91bH2wppy5SuzOiBtEwSWjbkOHyiB7aGnuItSOOhGCpWIdzAUt3UNDrXN2j6-BlpONTBYUv8EkljgpdmE0GehhhddAODSn9HdZ6n4DDT-1Gfs0ntOhbCcbg7l0bH5qEseGsy0_P0o";
sendNotification(deviceToken)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.error('Error sending message:', error);
  });

const port = 3000;


app.listen(port, "0.0.0.0", () => {
    console.log(`Server Listening on Port ${port}`);
})