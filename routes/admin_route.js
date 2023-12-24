const express = require('express');
const AdminController = require('../controllers/admin_controller');
const { toInteger } = require('lodash');

const adminRouter = express.Router();

// adminRouter.post('/get-destinations', AdminController.signup);


module.exports = adminRouter;
