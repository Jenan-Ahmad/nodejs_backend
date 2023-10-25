const TouristService = require("../services/tourist_service");
var userData = new Map();

exports.signup = async (req, res, next) => {
  try {
    console.log("------------------Sign Up------------------");
    console.log("---req body---", req.body);

    const { firstName, lastName, email, password } = req.body;

    if (emptyFields(firstName, lastName, email, password)) {
      return res.status(409).json("All mandatory fields must be filled");
    }

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
    if (emptyFields(firstName, lastName, email, password)) {
      return res.status(409).json("All mandatory fields must be filled");
    }
    const duplicate = await TouristService.getTouristByEmail(email);
    if (duplicate) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    const response = await TouristService.registerTourist(token, firstName, lastName, email, password);
    res.status(200).json({ message: 'User registered' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res, next) => {
  console.log("------------------Log In------------------");
  console.log("---req body---", req.body);

  try {
    const { email, password, remember_me } = req.body;
    if (!email || !password) {
      throw new Error('All fields must be filled');
    }
    const tourist = await TouristService.getTouristByEmail(email);
    if (!tourist) {
      throw new Error('User does not exist');
    }
    const isPasswordCorrect = await tourist.comparePassword(password);
    if (isPasswordCorrect === false) {
      throw new Error(`Username or Password does not match`);
    }
    const updatedUser = await TouristService.updateRememberMe(email, remember_me);
    if (!updatedUser) {
      throw new Error('User does not exist');
    }

    // Creating Token
    const tokenData = { email: tourist.email };
    const token = await TouristService.generateAccessToken(tokenData, "secret", "1h")
    res.status(200).json({ status: true, success: "sendData", token: token });
  } catch (error) {
    console.log(error, 'err---->');
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log("------------------Reset Password------------------");
  console.log("---req body---", req.body);
  try {
    const email = req.body;
    if (!email) {
      throw new Error('no email address was received');
    }
    const tourist = TouristService.getTouristByEmail(email);
    const oldPassword = tourist.password;
    if (!tourist) {
      throw new Error('User does not exist');
    }
    const password = await tourist.generatePassword();
    const updatedUser = await TouristService.updatePassword(email, password);
    if (!updatedUser) {
      throw new Error('User does not exist');
    }

    TouristService.resetPassword(email, password);

    //send email with the new password
    res.status(200).json({ message: 'Check your email for the new password' });

  } catch (error) {
    const updatedUser = await TouristService.updatePassword(email, oldPassword);
    console.log(error, 'err---->');
    res.status(500).json({ error: error.message });
  }


};