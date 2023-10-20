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
  static async registerTourist(token, first_name, last_name, email, password) {
    try {
      console.log(
        "-----first_nam-----last_name-----Email --- Password-----",
        first_name,
        last_name,
        email,
        password
      );
      jwt.verify(token, "secret", async function (err, decoded) {
        if (err) {
          console.log(err);
          // return res.send("Email verification failed, possibly the link is invalid or expired");
        }
        else {
          const createTourist = new TouristModel({ first_name, last_name, email, password });
          await createTourist.save();
          // res.json({ message: 'Verification email sent. Please check your inbox.' });

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
          // res.status(500).json({ message: 'Email not sent' });
        }
        console.log(`Email sent: ${info.response}`);
        // res.json({ message: 'Email sent' });
      });

    } catch (err) {
      throw err;
    }
  }


  static async getTouristByEmail(email) {
    try {
      return await TouristModel.findOne({ email });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = TouristService;