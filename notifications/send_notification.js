const admin = require('firebase-admin');
const serviceAccount = require('../touristine-authentication-firebase-adminsdk-gntp6-1bbb9a35a4.json'); // Replace with your actual service account key file

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://touristine-authentication-default-rtdb.firebaseio.com",
  storageBucket: "touristine-authentication.appspot.com",
  messagingSenderId: "889464890314",
  projectId: "touristine-authentication",
}, "fornoti");

function sendNotification(deviceToken, nt_title, nt_body) {
  console.log('Sender ID:', admin.app("fornoti").options.messagingSenderId);
  const message = {
    notification: {
      title: nt_title,
      body: nt_body,
    },
    token: deviceToken,
  };
  return admin.app("fornoti").messaging().send(message);
}

module.exports = sendNotification;
