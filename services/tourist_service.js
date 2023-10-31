const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const generator = require("generate-password");

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
          throw new Error('Email verification failed, possibly the link is invalid or expired');
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

  static async verifyEmail(firstName, lastName, email, password) {
    try {
      const token = await this.generateAccessToken({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      }, "secret", "1h")

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

  static async resetPassword(email, password) {
    try {
      const mailOptions = {
        from: 'touristineapp@gmail.com', // Replace with your email
        to: email,
        subject: 'Reset Password',
        text: `Here is your new password: ${password}`,

      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          throw new Error('An error occurred sending the new password')
        }
        console.log(`Email sent: ${info.response}`);
      });

    } catch (error) {
      throw new Error('Reset Password Process Failed');
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

  static async updateRememberMe(email, remember_me) {
    try {
      return TouristModel.updateOne({ email: email }, { $set: { remember_me: remember_me } });
    } catch (error) {
      throw new Error("An error occurred updating the remember_me value");
    }
  }

  static async updatePassword(email, password) {
    try {
      const tourist = new TouristModel();
      password = await tourist.encryptPassword(password);
      return TouristModel.updateOne({ email: email }, { $set: { password: password } });
    } catch (error) {
      throw new Error("An error occurred updating the password value");
    }
  }

  static async generatePassword() {
    try {

      const password = generator.generate({
        length: 10,
        numbers: true
      });
      return password;
    } catch (error) {
      return next(err);
    }
  };

  static async generateAccessToken(tokenData, JWTSecret_Key, JWT_EXPIRE) {
    return jwt.sign(tokenData, JWTSecret_Key, { expiresIn: JWT_EXPIRE });
  }
}

module.exports = TouristService;