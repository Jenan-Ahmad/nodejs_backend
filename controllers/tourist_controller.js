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
      //token sent for email verification. Doesn't reach the user
      const vtoken = await TouristService.generateAccessToken({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      }, "secret", "1h")
      //token sent to the user for their session
      const token = await TouristService.generateAccessToken({
        email: email
      }, "secret", "1h")
      const emailverif = await TouristService.verifyEmail(vtoken, firstName, lastName, email, password);
      return res.status(200).json({ message: "A verification email is sent to you", token: token });
    }
  } catch (err) {
    console.log("----ERROR IN SIGN UP----", err);
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res, next) => {
  try {
    console.log("------------------Register------------------");
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
    return res.status(200).json({ message: 'User registered' });
  }
  catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.isVerified = async (req, res, next) => {
  console.log("------------------Is Verified------------------");
  const { email } = req.body;
  if (!email) {
    throw new Error('No email was given');
  }
  const tourist = await TouristService.getTouristByEmail(email);
  if (!tourist) {
    console.log("------------------false------------------");
    return res.status(204).json({ message: "false" });
  } else {
    console.log("------------------true------------------");
    return res.status(200).json({ message: "true" });
  }
};

exports.login = async (req, res, next) => {
  console.log("------------------Log In------------------");
  console.log("---req body---", req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(500).json({ message: 'All fields must be filled' });
    }
    const tourist = await TouristService.getTouristByEmail(email);
    if (!tourist) {
      //will check if admin
      //if not throw error
      return res.status(500).json({ message: 'User does not exist' });
    } else {//if tourist
      const isPasswordCorrect = await tourist.comparePassword(password);
      if (isPasswordCorrect == false) {
        return res.status(500).json({ message: `Username or Password does not match` });
      }
      // Creating Token
      const tokenData = { email: tourist.email };
      const token = await TouristService.generateAccessToken(tokenData, "secret", "1h");
      return res.status(200).json({ status: true, success: "sendData", token: token, firstName: tourist.firstName, lastName: tourist.lastName, password: password, profileImage: tourist.profileImage, type: 100 });//type 100->tourist
    }
  } catch (error) {
    console.log(error, 'err---->');
    return res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log("------------------Reset Password------------------");
  console.log("---req body---", req.body);
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(500).json('No email address was received');
    }
    const tourist = await TouristService.getTouristByEmail(email);
    if (!tourist) {
      return res.status(500).json('User does not exist');
    }
    const password = await TouristService.generatePassword();
    const updatedUser = await TouristService.updatePassword(email, password);
    if (!updatedUser) {
      return res.status(500).json('User does not exist');
    }
    await TouristService.resetPassword(email, password);
    //send email with the new password
    return res.status(200).json({ message: 'Check your email for the new password' });
  } catch (error) {
    console.log(error, 'err---->');
    return res.status(500).json({ error: error.message });
  }
};


exports.updateProfile = async (req, res, next) => {
  try {
    upload.single('profileImage')(req, res, (err) => {
      if (!req.file) {
        console.log("no image");
        return res.status(400).send("No image");
      }
      console.log("one");
      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: uuid()
        },
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000"
      };

      console.log("two");
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream({
        metadata: metadata,
        gzip: true
      });
      console.log("three");
      blobStream.on("error", (err) => {
        console.error(err);
        res.status(500).json({ message: 'Unable to upload' });
      });
      console.log("four");
      blobStream.on("finish", async () => {
        console.log("five");
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${blob.name}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
        console.log("six");
        const { firstName, lastName, password } = req.body;

        console.log("seven");
        const token = req.headers.authorization.split(' ')[1];
        console.log("eight");
        const touristData = await TouristService.getEmailFromToken(token);
        console.log("nine");
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
          throw new Error('User does not exist');
        }
        console.log("ten");
        const updatedUser = await TouristService.updateProfile(firstName, lastName, touristData.email, password, imageUrl);
        console.log("eleven");
        if (!updatedUser) {
          throw new Error('User does not exist');
        }
      });
      console.log("twelve");
      blobStream.end(req.file.buffer);
      console.log("thirteen");
      return res.status(200).json({ message: 'updated' });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  console.log("------------------Update Location------------------");
  console.log("---req body---", req.body);
  try {
    const token = req.headers.authorization.split(' ')[1];
    const touristData = await TouristService.getEmailFromToken(token);
    const tourist = await TouristService.getTouristByEmail(touristData.email);
    if (!tourist) {
      return res.status(500).json('User does not exist');
    }
    const { latitude, longitude, address } = req.body;

  } catch (error) {

  }
};