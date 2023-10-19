const TouristService = require("../services/tourist_service");

exports.register = async (req, res, next) => {
  try {
    console.log("---req body---", req.body);
    const { first_name, last_name, email, password } = req.body;

    const duplicate = await TouristService.getTouristByEmail(email);
    if (duplicate) {
      throw new Error(`UserName ${email}, Already Registered`);
    }

    // const emailVerificationInfo = await TouristService.verifyEmailAsync(email);
    // console.log("-------------------out------------------------------------");
    // if (!emailVerificationInfo.success) {
    //   throw new Error(`UserName ${email}, Does not exist`);
    // }
    
    const response = await TouristService.registerTourist(first_name, last_name, email, password);

    res.json({ status: true, success: "User registered successfully" });
  } catch (err) {
    console.log("---> err -->", err);
    next(err);
  }
};

exports.login = async (req, res, next) => {

  console.log('connected in contorl');
};