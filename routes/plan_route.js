const express = require('express');
const PlanController = require('../controllers/plan_controller');

const planRouter = express.Router();
planRouter.post('/get-plans', PlanController.getPlans);
planRouter.post('/delete-plan/:planId', PlanController.deletePlan);

module.exports = planRouter;