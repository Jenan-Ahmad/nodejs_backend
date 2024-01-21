const express = require('express');
const AdminController = require('../controllers/admin_controller');
const { toInteger } = require('lodash');

const adminRouter = express.Router();

adminRouter.post('/add-new-admin', AdminController.addNewAdmin);
adminRouter.post('/get-admins-Data', AdminController.getAdminsData);
adminRouter.post('/downloadFile', AdminController.temp);
module.exports = adminRouter;
