const TouristService = require("../services/tourist_service");
const AdminService = require("../services/admin_service");
const DestinationService = require("../services/destination_service");
const PlanService = require("../services/plan_service");
const admin = require("../config/fb");
const bucket = admin.storage().bucket();//firebase storage bucket
const multer = require('multer');
const uuid = require('uuid-v4');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

