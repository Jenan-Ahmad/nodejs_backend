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
            destination: plan.city,
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
            if (destination.destination === "break") {
                return {
                    placeName: "break",
                    startTime: destination.startTime,
                    endTime: destination.endTime,
                    activityList: {
                        title: "Nature Walk",
                        description: "Discover hidden gems, street art, and unique local shops.",
                    },
                    imagePath: "https://firebasestorage.googleapis.com/v0/b/touristine-9a51a.appspot.com/o/cities%2Fgrey%20vertical.png?alt=media&token=35e04e30-fbba-43ab-9269-d201c53c3bfe",
                };
            } else {
                const destinationData = await DestinationService.getDestinationByName(destination.destination);
                return {
                    placeName: destination.destination,
                    startTime: destination.startTime,
                    endTime: destination.endTime,
                    activityList: destinationData.activityList,
                    imagePath: destinationData.images.mainImage
                };
            }
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
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const touristCategories = await PlanService.getInterests(tourist);
        const { destination, date, startTime, endTime, tripDuration, groupCount, ageCategories } = req.body;
        const match = tripDuration.match(/\b\d+\b/);
        const extractedNumber = match ? parseInt(match[0]) : null;
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
        if (planDuration > extractedNumber) {
            console.log("----------------------------------------------more");
            planDestinations = await PlanService.reducePlan(planDuration, extractedNumber, planDestinations, destinationsByCategory, touristCategories, startTime);
        } else if (planDuration < extractedNumber) {
            //do this
            console.log("----------------------------------------------less");
            planDestinations = await PlanService.enlargePlan(planDestinations, destinationsByCategory, touristCategories, startTime, endTime);
        }
        const cityImage = await PlanService.getCityImage(destination);

        const planContents = [];
        var crntTime = await PlanService.getHour(startTime);
        for (const place of planDestinations) {
            if (place.name === "break") {
                const planItem = {
                    placeName: "Break",
                    startTime: `${crntTime < 10 ? '0' : ''}${crntTime}:00`,
                    endTime: `${crntTime + 1 < 10 ? '0' : ''}${crntTime + 1}:00`,
                    activityList: {
                        title: "Nature Walk",
                        description: "Discover hidden gems, street art, and unique local shops.",
                    },
                    imagePath: "https://firebasestorage.googleapis.com/v0/b/touristine-9a51a.appspot.com/o/cities%2Fgrey%20vertical.png?alt=media&token=35e04e30-fbba-43ab-9269-d201c53c3bfe",
                    latitude: "0",
                    longitude: "0",
                };
                crntTime++;
                planContents.push(planItem);
            } else {
                const planItem = {
                    placeName: place.name,
                    startTime: `${crntTime < 10 ? '0' : ''}${crntTime}:00`,
                    endTime: `${crntTime + place.estimatedDuration.displayedDuration < 10 ? '0' : ''}${crntTime + place.estimatedDuration.displayedDuration}:00`,
                    activityList: place.activityList,
                    imagePath: place.images.mainImage,
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                };
                crntTime += place.estimatedDuration.displayedDuration;
                planContents.push(planItem);
            }
        }
        const totalTime = crntTime - await PlanService.getHour(startTime);
        const addPlan = await PlanService.storePlan(
            tourist.email, planContents,
            destination, cityImage, totalTime,
            startTime, `${crntTime < 10 ? '0' : ''}${crntTime}:00`,
            date);
        const planDescription = {
            planID: addPlan, destName: destination,
            numOfPlaces: planDestinations.length, totalTime: await PlanService.getPlanDuration(planDestinations),
            startTime: startTime, endTime: `${crntTime < 10 ? '0' : ''}${crntTime}:00`, imagePath: cityImage, date: date
        }
        return res.status(200).json({ planDescription, planContents });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to create a plan" });
    }
};
