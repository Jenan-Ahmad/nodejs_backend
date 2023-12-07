const PlanService = require("../services/plan_service");
const TouristService = require("../services/tourist_service");
const DestinationService = require("../services/destination_service");
const admin = require("../config/fb");
const bucket = admin.storage().bucket();//firebase storage bucket
const multer = require('multer');
const uuid = require('uuid-v4');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.getPlans = async (req, res, next) => {
    console.log("------------------Get Plans------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        var fullPlans = await PlanService.getPlans(tourist.email);
        const plans = fullPlans.map(plan => ({
            planId: plan._id,
            numOfPlaces: plan.destinations.length,
            totalTime: plan.totalTime,
            startTime: plan.startTime,
            endTime: plan.endTime,
            imagePath: plan.image,
            date: plan.date,
        }));
        res.status(200).json(plans);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to get plans" });
    }
};

exports.deletePlan = async (req, res, next) => {
    console.log("------------------Delete Plan------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const planId = req.params.planId;
        const deleted = await PlanService.deletePlan(planId);
        if (!deleted) {
            return res.status(404).json({ error: 'Plan was not found' });
        }
        return res.status(200).json({ message: "The plan was deleted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to delete the plan" });
    }
};

exports.fetchPlanContents = async (req, res, next) => {
    console.log("------------------Fetch Plan Contents------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { planId } = req.body;
        const plan = await PlanService.getPlanById(planId);
        if (!plan) {
            return res.status(500).json({ error: 'Plan does not exist' });
        }
        const planData = await Promise.all(plan.destinations.map(async destination => {
            const destinationData = await DestinationService.getDestinationByName(destination.destination);
            return {
                placeName: destination.destination,
                startTime: destination.startTime,
                endTime: destination.endTime,
                activityList: destinationData.activityList,
                imagePath: destinationData.images.mainImage
            };
        }));
        return res.status(200).json({ planData });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to fetch plan contents" });
    }
};

exports.storePlan = async (req, res, next) => {
    console.log("------------------Store Plan------------------");
    try {
        // const token = req.headers.authorization.split(' ')[1];
        // const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail("jenanahmad182@gmail.com");
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const touristCategories = await PlanService.getInterests(tourist);
        const { destination, date, startTime, endTime, tripDuration, groupCount, ageCategories } = req.body;
        const destinations = await DestinationService.getDestinationsInCity(destination);
        const destinationsWithPoints = [];
        for (const destination of destinations) {
            destination.points = await DestinationService.calculatePoints(tourist, destination);
            destination.points += await PlanService.calculatePlanPoints(destination, date, startTime, endTime, ageCategories);
            destinationsWithPoints.push(destination);
            console.log(destination.name, destination.points);
        }
        destinationsWithPoints.sort((a, b) => b.points - a.points);
        const destinationsByCategory = await PlanService.segregateByCategory(destinationsWithPoints);
        var planDestinations = await PlanService.initialPlan(destinationsByCategory, touristCategories);
        var planDuration = await PlanService.getPlanDuration(planDestinations);
        console.log("----------------------planduration", planDuration);
        if (planDuration > tripDuration) {
            console.log("----------------------------------------------more");
            planDestinations = await PlanService.reducePlan(planDuration, tripDuration, planDestinations, destinationsByCategory, touristCategories, startTime);
        } else if (planDuration < tripDuration) {
            //do this
            console.log("----------------------------------------------less");
            planDestinations = await PlanService.enlargePlan(planDestinations, destinationsByCategory, touristCategories, startTime, endTime);
        }
        
        return res.status(200).json(planDestinations);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to fetch plan contents" });
    }
};
