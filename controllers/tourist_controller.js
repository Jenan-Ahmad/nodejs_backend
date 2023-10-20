const TouristService = require("../services/tourist_service");
var userData = new Map();

exports.signup = async (req, res, next) => {
  try {
    console.log("---req body---", req.body);
    const { firstName, lastName, email, password } = req.body;

    // userData.set({ first_name, last_name, email, password});
    userData.set("firstName", firstName);
    userData.set("lastName", lastName);
    userData.set("email", email);
    userData.set("password", password);

    const duplicate = await TouristService.getTouristByEmail(email);
    if (duplicate) {
      throw new Error(`UserName ${email}, Already Registered`);
    }

    const emailverif = await TouristService.verifyEmail(email);

    res.status(200).json({message: "A verification email is sent to you" });
  } catch (err) {
    console.log("---> err -->", err);
    next(err);
  }
};

exports.register = async (req, res, next) => {
  const { token } = req.query ;
  const firstName = userData.get("firstName");
  const lastName = userData.get("lastName");
  const email = userData.get("email");
  const password = userData.get("password");
  const response = await TouristService.registerTourist(token, firstName, lastName, email, password);
  res.json({ message: 'User registered' });
  // Verifying the JWT token  

};

exports.login = async (req, res, next) => {
  res.json({ status: true, success: "logged in" });
  console.log('connected in contorl');
};