const TouristService = require("../services/tourist_service");
const admin = require("../config/fb");
const bucket = admin.storage().bucket();//firebase storage bucket
const multer = require('multer');
const uuid = require('uuid-v4');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.signup = async (req, res, next) => {
  try {
    console.log("------------------Sign Up------------------");
    console.log("---req body---", req.body);

    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(409).json("All mandatory fields must be filled");
    }

    const duplicate = await TouristService.getTouristByEmail(email);

    if (duplicate) {
      return res.status(409).json({ message: 'User with this email already exists' });
    } else {
      const token = await TouristService.generateAccessToken({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      }, "secret", "1h")
      const emailverif = await TouristService.verifyEmail(token, firstName, lastName, email, password);
      return res.status(200).json({ message: "A verification email is sent to you", token: token });
    }

  } catch (err) {
    console.log("----ERROR IN SIGN UP----", err);
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res, next) => {
  try {

    const token = req.query.token;
    const touristData = await TouristService.getInfoFromToken(token);

    if (!touristData.firstName || !touristData.lastName || !touristData.email || !touristData.password) {
      return res.status(409).json("All mandatory fields must be filled");
    }

    const duplicate = await TouristService.getTouristByEmail(touristData.email);

    if (duplicate) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const response = await TouristService.registerTourist(token, touristData.firstName, touristData.lastName, touristData.email, touristData.password);
    res.status(200).json({ message: 'User registered' });

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.isVerified = async (req, res, next) => {

  const { email } = req.body;
  if (!email) {
    throw new Error('No email was given');
  }
  const tourist = await TouristService.getTouristByEmail(email);
  if (!tourist) {
    return res.status(204).json({ message: "false" });
  } else {
    return res.status(200).json({ message: "true" });
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
      //will check if admin
      //if not throw error
      throw new Error('User does not exist');
    } else {//if tourist
      const isPasswordCorrect = await tourist.comparePassword(password);
      if (isPasswordCorrect == false) {
        throw new Error(`Username or Password does not match`);
      }
      const updatedTourist = await TouristService.updateRememberMe(email, remember_me);
      if (!updatedTourist) {
        throw new Error('User does not exist');
      }

      // Creating Token
      const tokenData = { firstName: tourist.firstName, lastName: tourist.lastName, email: tourist.email, password: password };
      const token = await TouristService.generateAccessToken(tokenData, "secret", "1h");
      res.status(200).json({ status: true, success: "sendData", token: token, type: 100 });//type 100->tourist
    }

  } catch (error) {
    console.log(error, 'err---->');
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log("------------------Reset Password------------------");
  console.log("---req body---", req.body);
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error('No email address was received');
    }
    const tourist = await TouristService.getTouristByEmail(email);
    // const oldPassword = tourist.password;
    if (!tourist) {
      throw new Error('User does not exist');
    }
    const password = await TouristService.generatePassword();


    const updatedUser = await TouristService.updatePassword(email, password);
    if (!updatedUser) {
      throw new Error('User does not exist');
    }
    await TouristService.resetPassword(email, password);

    //send email with the new password
    res.status(200).json({ message: 'Check your email for the new password' });

  } catch (error) {
    // const updatedUser = await TouristService.updatePassword(email, oldPassword);
    console.log(error, 'err---->');
    res.status(500).json({ error: error.message });
  }


};

exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image");
    }

    const metadata = {
      metadata: {
        firebaseStorageDownloadTokens: uuid()
      },
      contentType: req.file.mimetype,
      cacheControl: "public, max-age=31536000"
    };

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      metadata: metadata,
      gzip: true
    });

    blobStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: 'Unable to upload' });
    });

    blobStream.on("finish", async () => {
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      const { firstName, lastName, password } = req.body;


      const token = req.headers.authorization.split(' ')[1];
      const touristData = await TouristService.getInfoFromToken(token);

      const tourist = await TouristService.getTouristByEmail(touristData.email);
      if (!tourist) {
        throw new Error('User does not exist');
      }

      const updatedUser = await TouristService.updateProfile(firstName, lastName, touristData.email, password, imageUrl);
      if (!updatedUser) {
        throw new Error('User does not exist');
      }
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

