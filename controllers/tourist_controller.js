const TouristService = require("../services/tourist_service");
var userData = new Map();

exports.signup = async (req, res, next) => {
  try {
    console.log("------------------Sign Up------------------");
    console.log("---req body---", req.body);

    const { firstName, lastName, email, password } = req.body;

    userData.set("firstName", firstName);
    userData.set("lastName", lastName);
    userData.set("email", email);
    userData.set("password", password);

    const duplicate = await TouristService.getTouristByEmail(email);

    if (duplicate) {
      return res.status(409).json({ message: 'User with this email already exists' });
    } else {
      const emailverif = await TouristService.verifyEmail(email);
      return res.status(200).json({ message: "A verification email is sent to you" });
    }

  } catch (err) {
    console.log("----ERROR IN SIGN UP----", err);
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res, next) => {
  try {
    const { token } = req.query;
    const firstName = userData.get("firstName");
    const lastName = userData.get("lastName");
    const email = userData.get("email");
    const password = userData.get("password");
    const response = await TouristService.registerTourist(token, firstName, lastName, email, password);
    res.status(200).json({ message: 'User registered' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res, next) => {
  res.json({ status: true, success: "logged in" });
  console.log('connected in contorl');
};