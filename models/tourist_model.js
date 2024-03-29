const db = require("../config/db");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const touristSchema = new mongoose.Schema({
  firstName: {
    required: [true, "FName is required"],
    type: String,
    trim: true,
  },
  lastName: {
    required: [true, "LName is required"],
    type: String,
    trim: true,
  },
  email: {
    required: [true, "Email is required"],
    type: String,
    trim: true,
    validate: {
      validator: (value) => {
        const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return value.match(re);
      },
      message: "Please enter a valid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  profileImage: {
    type: String,
  },
  marital_status: {
    type: String,
  },
  location: {
    longitude: {
      type: String,
    },
    latitude: {
      type: String,
    },
    address: {
      type: String,
    },
  },
  interests: {
    BudgetFriendly: {
      type: String,
    },
    MidRange: {
      type: String,
    },
    Luxurious: {
      type: String,
    },
    family: {
      type: String,
    },
    friends: {
      type: String,
    },
    solo: {
      type: String,
    },
    coastalAreas: {
      type: String,
    },
    mountains: {
      type: String,
    },
    nationalParks: {
      type: String,
    },
    majorCities: {
      type: String,
    },
    countrySide: {
      type: String,
    },
    historicalSites: {
      type: String,
    },
    religiousLandmarks: {
      type: String,
    },
    aquariums: {
      type: String,
    },
    zoos: {
      type: String,
    },
    others: {
      type: String,
    },
    Yes: {
      type: String,
    },
    No: {
      type: String,
    },
    mobility: {
      type: String,
    },
    visual: {
      type: String,
    },
    hearing: {
      type: String,
    },
    cognitive: {
      type: String,
    },
    diabetes: {
      type: String,
    },
  },
  googleAccount: {
    type: String,
  },
  deviceToken: {
    type: String,
  },
});

// Middleware to hash the password before saving it
touristSchema.pre("save", async function (next) {
  const tourist = this;
  if (!this.firstName || !this.lastName || !this.email || !this.password) {
    return next(new Error("All mandatory fields must be filled"));
  }
  if (!tourist.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tourist.password, salt);
    tourist.password = hash;
    next();
  } catch (err) {
    return next(err);
  }
});

touristSchema.methods.encryptPassword = async function (password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw error;
  }
};

touristSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log('----------------password', this.password);
    // @ts-ignore
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

const TouristModel = db.model("tourists", touristSchema);
module.exports = TouristModel;