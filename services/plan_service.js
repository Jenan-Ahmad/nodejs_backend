const PlanModel = require("../models/plan_model");
const DestinationModel = require("../models/destination_model");
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
class PlanService {

    static async getPlanById(planId) {
        try {
            return await PlanModel.findOne({ _id: planId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the plan');
        }
    }

    static async getPlans(email) {
        try {
            return await PlanModel.find({ email: email });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the plans');
        }
    }

    static async deletePlan(planId) {
        try {
            return await PlanModel.deleteOne({ _id: planId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while deleting the plan');
        }
    }
}



module.exports = PlanService;  