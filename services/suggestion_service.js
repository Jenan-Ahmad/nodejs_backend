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

    static async addSuggestion(date, name, category, budget, estimatedDuration, sheltered, about, images, email, city) {
        try {
            const status = "Unseen";
            const suggestion = new SuggestionModel({ date, name, about, images, category, budget, estimatedDuration, sheltered, email, city, status });
            return await suggestion.save();
        } catch (error) {
            console.log(error);
            throw new Error("An error occurred adding the new destination");
        }

    }

    static async getDestinationsByEmail(email) {
        try {
            return await SuggestionModel.find({ email: email });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the destination by email');
        }
    }

    static async getSuggestionById(suggestionId) {
        try {
            return await SuggestionModel.findOne({ _id: suggestionId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the suggestion by id');
        }
    }

    static async deleteSuggestion(destId) {
        try {
            return await SuggestionModel.deleteOne({ _id: destId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while deleting the plan');
        }
    }

    static async getAllSuggestions() {
        try {
            return await SuggestionModel.find({ status: { $regex: /^unseen$/i } });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the suggestions');
        }
    }

    static async markAsSeen(suggestionId) {
        try {
            return await SuggestionModel.updateOne(
                { _id: suggestionId },
                {
                    $set: {
                        "status": 'Seen',
                    },
                }
            );
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while deleting the suggestion');
        }
    }

    static async addComment(suggestionId, adminComment, email) {
        try {
            return await SuggestionModel.updateOne(
                { _id: suggestionId },
                {
                    $set: {
                        "comment.reply": adminComment,
                        "comment.admin": email,
                        "status": 'Seen',
                    },
                }
            );
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while updating the comment');
        }
    }

}
module.exports = SuggestionService;  
