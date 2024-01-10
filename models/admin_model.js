const db = require("../config/db");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
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
    newAdmin: {
        type: String,
    },
    deviceToken: {
        type: String,
    },
});

// Middleware to hash the password before saving it
// adminSchema.pre("save", async function (next) {
//     const admin = this;
//     if (!this.firstName || !this.lastName || !this.email || !this.password) {
//         return next(new Error("All mandatory fields must be filled"));
//     }
//     if (!admin.isModified("password")) {
//         return next();
//     }
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hash = await bcrypt.hash(admin.password, salt);
//         admin.password = hash;
//         next();
//     } catch (err) {
//         return next(err);
//     }
// });

// adminSchema.methods.encryptPassword = async function (password) {
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hash = await bcrypt.hash(password, salt);
//         return hash;
//     } catch (error) {
//         throw error;
//     }
// };

// adminSchema.methods.comparePassword = async function (candidatePassword) {
//     try {
//         console.log('----------------password', this.password);
//         // @ts-ignore
//         const isMatch = await bcrypt.compare(candidatePassword, this.password);
//         return isMatch;
//     } catch (error) {
//         throw error;
//     }
// };

const AdminModel = db.model("admins", adminSchema);
module.exports = AdminModel;