const TouristModel = require("../models/tourist_model");
const AdminModel = require("../models/admin_model");
const DestinationModel = require("../models/destination_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const generator = require("generate-password");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'touristineapp@gmail.com',
        pass: 'ijul lnjb hdvs zxdf'
    }
});

class AdminService {

    static async getAdminByEmail(email) {
        try {
            return await AdminModel.findOne({ email });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the admin by email.');
        }
    }

    static async getEmailFromToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, 'secret', (err, decoded) => {
                if (err) {
                    reject('Invalid token');
                } else {
                    const { email } = decoded;
                    resolve({ email });
                }
            });
        });
    }

    static async getAdminsData() {
        try {
            return await AdminModel.find({ email: { $ne: 'touristineapp@gmail.com' } });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the admins.');
        }
    }

    static async deleteAdmin(adminEmail) {
        try {
            return await AdminModel.deleteOne({ email: adminEmail });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while deleting the admin');
        }
    }

    static async getVisitsByCity() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$location.address',
                        totalViews: { $sum: '$viewedTimes' }
                    }
                },
                {
                    $project: {
                        city: '$_id',
                        totalViews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city views.');
        }
    }

    static async getVisitsByCitiesCategories() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$category',
                        totalViews: { $sum: '$viewedTimes' }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalViews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city views.');
        }
    }

    static async getVisitsAllCitiesDiscrete(category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalViews: {
                            $sum: '$viewedTimes'
                        }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalViews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city views.');
        }
    }

    static async getVisitsByCategory(city) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalViews: { $sum: '$viewedTimes' }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalViews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city views.');
        }
    }

    static async getVisitsInCityDiscrete(city, category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        },
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalViews: {
                            $sum: '$viewedTimes'
                        }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalViews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city views.');
        }
    }

    static async getReviewsByCity() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$location.address',
                        totalReviews: { $sum: { $size: '$reviews' } }
                    }
                },
                {
                    $project: {
                        city: '$_id',
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city reviews.');
        }
    }

    static async getReviewsByCitiesCategories() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$category',
                        totalReviews: { $sum: { $size: '$reviews' } }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city reviews.');
        }
    }

    static async getReviewsAllCitiesDiscrete(category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalReviews: { $sum: { $size: '$reviews' } }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city reviews.');
        }
    }

    static async getReviewsByCategory(city) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalReviews: { $sum: { $size: '$reviews' } }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city reviews.');
        }
    }

    static async getReviewsInCityDiscrete(city, category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        },
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalReviews: { $sum: { $size: '$reviews' } }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city reviews.');
        }
    }

    static async getComplaintsByCity() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$location.address',
                        totalComplaints: { $sum: { $size: '$complaints' } }
                    }
                },
                {
                    $project: {
                        city: '$_id',
                        totalComplaints: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getComplaintsByCitiesCategories() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $group: {
                        _id: '$category',
                        totalComplaints: { $sum: { $size: '$complaints' } }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalComplaints: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getComplaintsAllCitiesDiscrete(category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalComplaints: { $sum: { $size: '$complaints' } }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalComplaints: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getComplaintsByCategory(city) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalComplaints: { $sum: { $size: '$complaints' } }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        totalComplaints: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getComplaintsInCityDiscrete(city, category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'category': {
                            $regex: new RegExp(category, 'i')
                        },
                        'location.address': {
                            $regex: new RegExp(city, 'i')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        totalComplaints: { $sum: { $size: '$complaints' } }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        totalComplaints: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getRatingsByCity() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'reviews': { $exists: true, $ne: [] }
                    }
                },
                {
                    $unwind: '$reviews'
                },
                {
                    $group: {
                        _id: '$location.address',
                        averageRating: {
                            $avg: '$reviews.stars'
                        }
                    }
                },
                {
                    $project: {
                        city: '$_id',
                        averageRating: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getRatingsByCitiesCategories() {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'reviews': { $exists: true, $ne: [] }
                    }
                },
                {
                    $unwind: '$reviews'
                },
                {
                    $group: {
                        _id: '$category',
                        averageRating: {
                            $avg: '$reviews.stars'
                        }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        averageRating: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getRatingsAllCitiesDiscrete(category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'reviews': { $exists: true, $ne: [] },
                        'category': { $regex: new RegExp(category, 'i') }
                    }
                },
                {
                    $unwind: '$reviews'
                },
                {
                    $group: {
                        _id: '$name',
                        averageRating: {
                            $avg: '$reviews.stars'
                        }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        averageRating: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getRatingsByCategory(city) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'reviews': { $exists: true, $ne: [] },
                        'location.address': { $regex: new RegExp(city, 'i') }
                    }
                },
                {
                    $unwind: '$reviews'
                },
                {
                    $group: {
                        _id: '$category',
                        averageRating: {
                            $avg: '$reviews.stars'
                        }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        averageRating: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async getRatingsInCityDiscrete(city, category) {
        try {
            const result = await DestinationModel.aggregate([
                {
                    $match: {
                        'reviews': { $exists: true, $ne: [] },
                        'category': { $regex: new RegExp(category, 'i') },
                        'location.address': { $regex: new RegExp(city, 'i') }
                    }
                },
                {
                    $unwind: '$reviews'
                },
                {
                    $group: {
                        _id: '$name',
                        averageRating: {
                            $avg: '$reviews.stars'
                        }
                    }
                },
                {
                    $project: {
                        placeName: '$_id',
                        averageRating: 1,
                        _id: 0
                    }
                }
            ]);
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while fetching city complaints.');
        }
    }

    static async addDestination(
        name, description, activityList, longitude,
        latitude, address, category, services, geotags,
        contact, budget, workingHours, displayedDuration,
        visitorsType, ageCategory, sheltered, virtualTourLink, mainImage, descriptiveImages, date, addedBy
    ) {
        try {
            const location = { longitude, latitude, address }
            const estimatedDuration = { displayedDuration };
            const images = { mainImage, descriptiveImages };
            const destination = new DestinationModel({
                name, description, activityList, location, category, services, geotags,
                contact, budget, workingHours, estimatedDuration,
                visitorsType, ageCategory, sheltered, virtualTourLink, date, addedBy, images
            });
            return await destination.save();
        } catch (error) {
            console.log(error);
            throw new Error("An error occurred adding the new destination");
        }

    }

    static async editDestination(
        name, description, activityList, longitude,
        latitude, address, category, services, geotags,
        contact, budget, workingHours, displayedDuration,
        visitorsType, ageCategory, sheltered, virtualTourLink, mainImage, descriptiveImages, date, addedBy
    ) {
        try {
            const location = { longitude, latitude, address }
            const estimatedDuration = { displayedDuration };
            return await DestinationModel.updateOne(
                { name: name },
                {
                    $set: {
                        description: description, activityList: activityList, location: location,
                        category: category, services: services, geotags: geotags, contact: contact,
                        budget: budget, workingHours: workingHours, estimatedDuration: estimatedDuration,
                        visitorsType: visitorsType, ageCategory: ageCategory, sheltered: sheltered, virtualTourLink: virtualTourLink,
                        'images.mainImage': mainImage, 'images.descriptiveImages': descriptiveImages, date: date,
                        addedBy: addedBy
                    },
                }
            );
        } catch (error) {
            console.log(error);
            throw new Error("An error occurred editing the destination");
        }

    }

    static async addAdmin(firstName, lastName, email, password, city) {
        try {
            const newAdmin = 'true';
            const profileImage = "";
            const createAdmin = new AdminModel({ firstName, lastName, email, password, newAdmin, profileImage, city });
            await createAdmin.save();
            return true;
        } catch (error) {
            console.log(error);
            throw new Error("An error occurred adding the new admin");
        }
    }

    static async addAdminEmail(firstName, lastName, email, password, city) {
        try {
            const mailOptions = {
                from: 'touristineapp@gmail.com',
                to: email,
                subject: 'Admin Account Information',
                text: `Dear ${firstName} ${lastName},\n\nYou can log into your acccount using the following information:\nUsername: ${email}\nPassword: ${password}\n\nYou are responsible for ${city}\n\nBest regards`,

            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    throw new Error('An error occurred sending the verification line')
                }
                console.log(`Email sent: ${info.response}`);
            });
        } catch (err) {
            throw new Error('The verification process failed');
        }
    }

    static async updateNewAdmin(email) {
        try {
            const admin = new AdminModel();
            return AdminModel.updateOne({ email: email }, { $set: { newAdmin: 'false' } });
        } catch (error) {
            console.error(error);
            throw new Error("An error occurred updating your new admin status");
        }
    }

    static async updateAdminDeviceToken(email, deviceToken) {
        try {
            const admin = new AdminModel();
            return AdminModel.updateOne({ email: email }, { $set: { deviceToken: deviceToken } });
        } catch (error) {
            console.error(error);
            throw new Error("An error occurred updating your new admin status");
        }
    }

    static async updateProfile(firstName, lastName, email, password, imageUrl) {
        try {
            const admin = new AdminModel();
            return AdminModel.updateOne({ email: email }, { $set: { firstName: firstName, lastName: lastName, password: password, profileImage: imageUrl } });
        } catch (error) {
            throw new Error("An error occurred updating your profile");
        }
    }
}

module.exports = AdminService;    
