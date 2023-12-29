const express = require('express');
const AdminController = require('../controllers/admin_controller');
const { toInteger } = require('lodash');

const adminRouter = express.Router();

adminRouter.post('/add-new-admin', AdminController.addNewAdmin);


module.exports = adminRouter;
