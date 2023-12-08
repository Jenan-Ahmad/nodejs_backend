const db = require("../config/db");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
    planId: {
        type: String,
    },
    email: {
        type: String,
    },
    destinations: [
        {
            destination: {
                type: String,
            },
            startTime: {
                type: String,
            },
            endTime: {
                type: String,
            },
        }
    ],
    city: {
        type: String,
    },
    image: {
        type: String,
    },
    totalTime: {
        type: Number,
    },
    startTime: {
        type: String,
    },
    endTime: {
        type: String,
    },
    date: {
        type: String,
    },
});

const PlanModel = db.model("plans", planSchema);
module.exports = PlanModel;