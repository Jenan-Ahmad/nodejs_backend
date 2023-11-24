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
