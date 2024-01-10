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

const deviceToken = 'dB4tqsgrTrad4VAKHunHsJ:APA91bH2wppy5SuzOiBtEwSWjbkOHyiB7aGnuItSOOhGCpWIdzAUt3UNDrXN2j6-BlpONTBYUv8EkljgpdmE0GehhhddAODSn9HdZ6n4DDT-1Gfs0ntOhbCcbg7l0bH5qEseGsy0_P0o'; // Replace with the actual device token

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
