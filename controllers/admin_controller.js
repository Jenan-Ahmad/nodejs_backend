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

exports.addNewAdmin = async (req, res, next) => {
    console.log("------------------Add New Admin------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { firstName, lastName, email, password } = req.body;
        const isAdmin = await AdminService.getAdminByEmail(email);
        if (isAdmin) {
            return res.status(500).json({ error: 'Email is already used' });
        }
        const addAdmin = await AdminService.addAdmin(firstName, lastName, email, password);
        if (!addAdmin) {
            return res.status(500).json({ error: 'Couldn\'t add a new admin' });
        }
        const addAdminEmail = await AdminService.addAdminEmail(firstName, lastName, email, password);
        return res.status(200).json({ message: 'Admin was added successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Couldn\'t add a new admin' });
    }

};