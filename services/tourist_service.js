const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
// const nodemailer = require('nodemailer'); 
  
// const transporter = nodemailer.createTransport({ 
//     service: 'gmail', 
//     auth: { 
//         user: 'jenanahmad182@gmail.com', 
//         pass: 'jayscranton67'
//     } 
// }); 

class TouristService {
  static async registerTourist(name, email, password) {
    try {
      console.log(
        "-----first_nam-----last_name-----Email --- Password-----",
        first_name,
        last_name,
        email,
        password
      );

      const createTourist = new TouristModel({ name, email, password });
      return await createTourist.save();
    } catch (err) {
      throw err;
    }
  }

  // static async verifyEmail(email) {
  //   try{
  //     const token = jwt.sign({ email: email }, secretKey, { expiresIn: '1d' });
  //     // const verificationLink = `//localhost:3000/verify/${token}`;

  //   } catch(err){
  //     throw err;
  //   }
  // }

//   static verifyEmailAsync(email) {
//     return new Promise((resolve, reject) => {
//       console.log("-------------------------------------beign-----------------------------------");
//       verify.verify(email, (err, info) => {
//         console.log("-----------------------------------checked-------------------------------------");
//         if (err) {
//           console.log("-------------------------------error-----------------------------------------");
//           console.error("Error:", err);
//           reject(err);
//         } else {
//           console.log("-------------------------------true-----------------------------------------");
//           console.log("Verification Info:", info);
//           resolve(info);
//         }
//       });
//     });
//   }

  static async getTouristByEmail(email) {
    try {
      return await TouristModel.findOne({ email });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = TouristService;