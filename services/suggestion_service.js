const SuggestionModel = require("../models/suggestion_model");
const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const axios = require('axios');
const express = require('express');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'touristineapp@gmail.com',
        pass: 'ijul lnjb hdvs zxdf'
    }
});
class SuggestionService {

    static async addSuggestion(date, name, category, budget, estimatedDuration, sheltered, about, images, email) {
        try {
            const suggestion = new SuggestionModel({ date, name, about, images, category, budget, estimatedDuration, sheltered, email });
            return await suggestion.save();
        } catch (error) {
            console.log(error);
            throw new Error("An error occurred adding the new destination");
        }

    }
}
module.exports = SuggestionService;  
