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

  static async verifyEmail(token, firstName, lastName, email, password) {
    try {

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

  static async updatePassword(email, password) {
    try {
      const tourist = new TouristModel();
      password = await tourist.encryptPassword(password);
      return TouristModel.updateOne({ email: email }, { $set: { password: password } });
    } catch (error) {
      throw new Error("An error occurred updating the password value");
    }
  }

  static async updateProfile(firstName, lastName, email, password, imageUrl) {
    try {
      const tourist = new TouristModel();
      password = await tourist.encryptPassword(password);
      return TouristModel.updateOne({ email: email }, { $set: { firstName: firstName, lastName: lastName, password: password, profileImage: imageUrl } });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred updating the profile' });
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
  }

  static async generateAccessToken(tokenData, JWTSecret_Key, JWT_EXPIRE) {
    return jwt.sign(tokenData, JWTSecret_Key, { expiresIn: JWT_EXPIRE });
  }

  static async getInfoFromToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, 'secret', (err, decoded) => {
        if (err) {
          reject('Invalid token');
        } else {
          // You can access user data from the 'decoded' object
          const { firstName, lastName, email, password } = decoded;
          resolve({ firstName, lastName, email, password });
        }
      });
    });
  }

  static async getEmailFromToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, 'secret', (err, decoded) => {
        if (err) {
          reject('Invalid token');
        } else {
          // You can access user data from the 'decoded' object
          const { email } = decoded;
          resolve({ email });
        }
      });
    });
  }

}



module.exports = TouristService;