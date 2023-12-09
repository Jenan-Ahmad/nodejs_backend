const db = require("../config/db");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const suggestionSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    about: {
        type: String,
    },
    city: {
        type: String,
    },
    images: [
        {
            type: String
        },
    ],
    category: {
        type: String,
    },
    budget: {
        type: String,
    },
    estimatedDuration: {
        type: Number,
    },
    sheltered: {
        type: String,
    },
    date: {
        type: String,
    },
    email: {
        type: String,
    },
    comment: {
        admin: {
            type: String,
        },
        reply: {
            type: String,
        },
    },
    status: {
        type: String,
    },
});

const SuggestionModel = db.model("suggestions", suggestionSchema);
module.exports = SuggestionModel;