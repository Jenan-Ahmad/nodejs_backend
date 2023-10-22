const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'touristineapp@gmail.com',
    pass: 'ijul lnjb hdvs zxdf'
  }
});

class TouristService {
  static async registerTourist(token, firstName, lastName, email, password) {
    try {

      console.log(
        "-----firstName-----lastName-----Email --- Password-----",
        firstName,
        lastName,
        email,
        password
      );

      jwt.verify(token, "secret", async function (err, decoded) {
        if (err) {
          console.log(err);
          throw new Error('Email verification failed, possibly the link is invalid or expired')
        }
        else {
          const createTourist = new TouristModel({ firstName, lastName, email, password });
          await createTourist.save();
        }
      });
    } catch (err) {
      throw err;
    }
  }

  static async verifyEmail(email) {
    try {
      const token = jwt.sign({ email: email }, "secret", { expiresIn: '1d' });

      const verificationLink = `https://touristine.onrender.com/verify?token=${token}`;

      // Email content
      const mailOptions = {
        from: 'touristineapp@gmail.com', // Replace with your email
        to: email,
        subject: 'Email Verification',
        text: `Please click the following link to verify your email: ${verificationLink}`,

      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          throw new Error('An error occurred sending the verification line')
        }
        console.log(`Email sent: ${info.response}`);
      });

    } catch (err) {
      throw new Error('The verification process failed');
    }
  }


  static async getTouristByEmail(email) {
    try {
      return await TouristModel.findOne({ email });
    } catch (err) {
      console.log(err);
      throw new Error('An error occurred while retrieving the tourist by email.');
    }
  }
}

module.exports = TouristService;