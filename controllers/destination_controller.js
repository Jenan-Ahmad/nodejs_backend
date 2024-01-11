const TouristService = require("../services/tourist_service");
const AdminService = require("../services/admin_service");
const DestinationService = require("../services/destination_service");
const PlanService = require("../services/plan_service");
const admin = require("../config/fb");
const bucket = admin.storage().bucket();//firebase storage bucket
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const uuid = require('uuid-v4');
const path = require('path');
const crypto = require('crypto');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const sendNotification = require('../notifications/send_notification');

exports.getRecommendedDestinations = async (req, res, next) => {
    console.log("------------------Get Recommended Destinations------------------");
    try {
        // verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const destinations = await DestinationService.getDestinations();
        const destinationsWithPoints = await Promise.all(destinations.map(async (destination) => {
            destination.points = await DestinationService.calculatePoints(tourist, destination);
            return destination;
        }));
        const sortedDestinations = destinationsWithPoints.sort((a, b) => b.points - a.points);
        const recommendedData = sortedDestinations.map(destination => ({
            name: destination.name,
            image: destination.images.mainImage,
            points: destination.points,
        }));
        res.status(200).json(recommendedData);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve recommended destinations" });
    }
};

exports.getPopularDestinations = async (req, res, next) => {
    console.log("------------------Get Popular Destinations------------------");
    try {
        // verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const destinations = await DestinationService.getDestinations();
        const destinationsWithRatings = await Promise.all(destinations.map(async (destination) => {
            destination.points = await DestinationService.calculateRatings(destination);
            console.log(destination.points);
            return destination;
        }));
        const sortedDestinations = destinationsWithRatings.sort((a, b) => b.points - a.points);
        const popularData = sortedDestinations.map(destination => ({
            name: destination.name,
            image: destination.images.mainImage,
            points: destination.points,
        }));
        res.status(200).json(popularData);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve popular destinations" });
    }
};

exports.getOtherDestinations = async (req, res, next) => {
    console.log("------------------Get other Destinations------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        var destinations = await DestinationService.getDestinations();
        for (let i = destinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [destinations[i], destinations[j]] = [destinations[j], destinations[i]];
        }
        const otherData = destinations.map(destination => ({
            name: destination.name, // Replace with the actual property name in your schema
            image: destination.images.mainImage, // Replace with the actual property name in your schema
        }));
        res.status(200).json(otherData);
    } catch (error) {
        return res.status(500).json({ error: "Failed to get other destinations" });
    }
};

exports.getDestinationDetails = async (req, res, next) => {
    console.log("------------------Get Destination Details------------------");
    try {
        let isAdmin = 0;
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            const adminData = await AdminService.getEmailFromToken(token);
            const admin = await AdminService.getAdminByEmail(adminData.email);
            if (!admin) {
                return res.status(500).json({ error: 'User does not exist' });
            }
            isAdmin = 1;
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        if (isAdmin === 0) {
            const incrDone = await DestinationService.incrementViewedTimes(destinationName);
            if (!incrDone) {
                return res.status(500).json({ error: 'Failed to load the destination' });
            }
        }
        const destinationImages = destination.images.descriptiveImages.map(image => ({
            image: image,
        }));
        const weather = await DestinationService.getWeather(destination.location.address);
        const temperature = weather.match(/\d+/);
        const weatherDescription = weather.match(/[a-zA-Z]+(?=\s*\+)/);
        const oneStar = destination.rating.oneStar;
        const twoStars = destination.rating.twoStars;
        const threeStars = destination.rating.threeStars;
        const fourStars = destination.rating.fourStars;
        const fiveStars = destination.rating.fiveStars;
        const FRating = (oneStar + twoStars * 2 + threeStars * 3 + fourStars * 4 + fiveStars * 5) / (oneStar + twoStars + threeStars + fourStars + fiveStars);
        const Services = destination.services.map(service => ({
            name: service.name,
        }));
        const destinationDetails = {
            About: destination.description, Category: destination.category,
            OpeningTime: destination.workingHours.openingTime, ClosingTime: destination.workingHours.closingTime,
            WorkingDays: destination.workingHours.workingdays, Weather: temperature, WeatherDescription: weatherDescription,
            Rating: FRating, CostLevel: destination.budget, sheltered: destination.sheltered,
            EstimatedTime: destination.estimatedDuration.displayedDuration, Services: Services
        };
        const rating = { oneStar: oneStar, twoStars: twoStars, threeStars: threeStars, fourStars: fourStars, fiveStars: fiveStars };
        return res.status(200).json({ destinationImages: destinationImages, destinationDetails: destinationDetails, rating: rating })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Details for this destination are not available" });
    }
};

exports.getAllReviews = async (req, res, next) => {
    console.log("------------------Get All Reviews------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const reviews = destination.reviews.map(review => ({
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            date: review.date,
            stars: review.stars,
            commentTitle: review.title,
            commentContent: review.feedback
        }));
        return res.status(200).json({ reviews: reviews });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Reviews are not available for this destination" });
    }
};

exports.getReviewData = async (req, res, next) => {
    console.log("------------------Get Review Data------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const foundReview = destination.reviews.find(review => review.user.email === tourist.email);
        if (foundReview) {
            console.log("Review found:", foundReview.feedback);
            return res.status(200).json({ stars: foundReview.stars, title: foundReview.title, content: foundReview.feedback, date: foundReview.date });
        } else {
            console.log("Review not found for user:");
            return res.status(404).json({ message: "No review was found" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find your review" });
    }
};

exports.sendReviewData = async (req, res, next) => {
    console.log("------------------send Review Data------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName, stars, title, content, date } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const foundReview = destination.reviews.find(review => review.user.email === tourist.email);
        if (foundReview) {
            console.log("Review found:", foundReview.feedback);
            const oldRating = foundReview.stars;
            const newRating = parseInt(stars, 10);
            const updated = await DestinationService.updateReview(tourist.email, destination, parseInt(stars, 10), title, content, date);
            if (!updated) {
                return res.status(500).json({ error: "Couldn\'t update your review" });
            }
            const updateRating = await DestinationService.updateRating(destination, newRating, oldRating);
            if (!updateRating) {
                return res.status(500).json({ error: "Couldn\'t update your rating" });
            }
            return res.status(200).json({ message: "Your review was updated" });
        } else {
            console.log("Review not found for user:");
            const oldRating = -100;
            const newRating = parseInt(stars, 10);
            const updated = await DestinationService.saveReview(tourist, destination, parseInt(stars, 10), title, content, date);
            if (!updated) {
                return res.status(500).json({ message: "Couldn\'t update your review" });
            }
            const updateRating = await DestinationService.updateRating(destination, newRating, oldRating);
            if (!updateRating) {
                return res.status(500).json({ error: "Couldn\'t update your rating" });
            }
            return res.status(200).json({ message: "Your review was saved" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to save your review" });
    }
};

exports.getDestinationLatLng = async (req, res, next) => {
    console.log("------------------Get Destination Lat Lng------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        return res.status(200).json({ latitude: destination.location.latitude, longitude: destination.location.longitude })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve location" });
    }
};

exports.addComplaint = async (req, res, next) => {
    console.log("------------------Add Complaint------------------");
    try {
        upload.array('images')(req, res, async (err) => {
            const token = req.headers.authorization.split(' ')[1];
            const touristData = await TouristService.getEmailFromToken(token);
            const tourist = await TouristService.getTouristByEmail(touristData.email);
            if (!tourist) {
                return res.status(500).json({ error: 'User does not exist' });
            }
            const { destinationName, title, content, date } = req.body;
            const destination = await DestinationService.getDestinationByName(destinationName);
            if (!destination) {
                return res.status(500).json({ error: 'Destination Doesn\'t exist' });
            }
            if (!req.files || req.files.length === 0) {
                console.log("no image");
                const update = await DestinationService.addComplaint(destination, tourist.email, title, content, date, []);
                if (!update) {
                    console.log("failed to add complaint with no images");
                    throw new Error("Faield to add your complaint");
                }
                return res.status(200).json("Your complaint was added");
            }
            const imageUrls = [];
            for (const file of req.files) {
                await new Promise((resolve, reject) => {
                    const metadata = {
                        metadata: {
                            firebaseStorageDownloadTokens: uuid()
                        },
                        contentType: file.mimetype,
                        cacheControl: "public, max-age=31536000"
                    };
                    const folder = 'complaints'; // Specify your desired folder name
                    const fileName = `${folder}/${file.originalname}`;
                    const blob = bucket.file(fileName);
                    const blobStream = blob.createWriteStream({
                        metadata: metadata,
                        gzip: true
                    });
                    blobStream.on("error", (err) => {
                        console.error(err);
                        res.status(500).json({ message: 'Unable to upload' });
                    });
                    blobStream.on("finish", async () => {
                        const fileUrl = `${folder}%2F${file.originalname}`;
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUrl}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
                        imageUrls.push(imageUrl);
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
            }
            console.log("here", imageUrls.length, "\n");
            const update = await DestinationService.addComplaint(destination, tourist.email, title, content, date, imageUrls);
            if (!update) {
                console.log("failed to add complaint with no images");
                throw new Error("Faield to add your complaint");
            }
            return res.status(200).json({ message: "Your complaint was added" });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send your complaint" });
    }
};

exports.getComplaints = async (req, res, next) => {
    console.log("------------------Get Complaints------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const complaints = destination.complaints.filter(complaint => complaint.email === tourist.email);
        return res.status(200).json({ complaints: complaints });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve your complaints" });
    }
};

exports.uploadImages = async (req, res, next) => {
    console.log("------------------Upload Images------------------");
    try {
        upload.array('images')(req, res, async (err) => {
            const token = req.headers.authorization.split(' ')[1];
            const touristData = await TouristService.getEmailFromToken(token);
            const tourist = await TouristService.getTouristByEmail(touristData.email);
            if (!tourist) {
                return res.status(500).json({ error: 'User does not exist' });
            }
            const { destinationName, date, keywords } = req.body;
            const destination = await DestinationService.getDestinationByName(destinationName);
            if (!destination) {
                return res.status(500).json({ error: 'Destination Doesn\'t exist' });
            }
            const imageUrls = [];
            for (const file of req.files) {
                await new Promise((resolve, reject) => {
                    const metadata = {
                        metadata: {
                            firebaseStorageDownloadTokens: uuid()
                        },
                        contentType: file.mimetype,
                        cacheControl: "public, max-age=31536000"
                    };
                    const folder = 'destinations_images'; // Specify your desired folder name
                    const fileName = `${folder}/${file.originalname}`;
                    const blob = bucket.file(fileName);
                    const blobStream = blob.createWriteStream({
                        metadata: metadata,
                        gzip: true
                    });
                    blobStream.on("error", (err) => {
                        console.error(err);
                        res.status(500).json({ message: 'Unable to upload' });
                    });
                    blobStream.on("finish", async () => {
                        const fileUrl = `${folder}%2F${file.originalname}`;
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUrl}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
                        imageUrls.push(imageUrl);
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
            }
            const update = await DestinationService.uploadImages(destination, tourist.email, date, imageUrls, keywords.split(', '));
            if (!update) {
                console.log("Failed to upload your images");
                throw new Error("Failed to upload your images");
            }
            return res.status(200).json("Your images were uploaded successfully");
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to upload your images" });
    }
};

exports.getUploadedImages = async (req, res, next) => {
    console.log("------------------Get Uploaded Images------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const uploadedImages = destination.images.pendingImages.filter(uploadedImage => uploadedImage.email === tourist.email);
        if (uploadedImages) {
            return res.status(200).json({ uploadedImages });
        } else {
            console.log("Images not found for user");
            return res.status(404).json({ message: "Uploaded images list is empty" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve your images" });
    }
};

exports.deleteUploadedImages = async (req, res, next) => {
    console.log("------------------Delete Uploaded Images------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const uploadedImagesId = req.params.uploadedImagesId;
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const deleteUploadedImages = await DestinationService.deleteUploadedImages(destination, uploadedImagesId);
        if (!deleteUploadedImages) {
            return res.status(500).json({ error: "Failed to delete your images" });
        }
        return res.status(200).json({ message: "The images were deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to delete your images" });
    }
};

exports.searchDestination = async (req, res, next) => {
    console.log("------------------Search Destination------------------");
    try {
        console.log(req.body);
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { searchTerm, isBudgetFriendly, isMidRange, isLuxurious, Sheltered } = req.body;
        const FSearchTerm = searchTerm.trim();
        const destinations = await DestinationService.searchDestinations(FSearchTerm, isBudgetFriendly, isMidRange, isLuxurious, Sheltered);
        const destinationsList = destinations.map(destination => ({
            name: destination.name,
            imagePath: destination.images.mainImage,
        }));
        return res.status(200).json({ destinationsList });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }
};

///////////////////////Admin side

exports.getStatistics = async (req, res, next) => {
    console.log("------------------Get Visits------------------");
    try {
        const { StatisticType } = req.body;
        switch (StatisticType) {
            case 'Visits Count':
                return await this.getVisits(req, res, next);
            case 'Reviews Count':
                return await this.getReviewsNum(req, res, next);
            case 'Complaints Count':
                return await this.getComplaintsNum(req, res, next);
            case 'Ratings Count':
                return await this.getRatings(req, res, next);
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }
};

exports.getVisits = async (req, res, next) => {
    console.log("------------------Get Visits------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { city, category } = req.body;
        if (city === "allcities") {
            if (category === "bycity") {
                const visitsList = await AdminService.getVisitsByCity();
                const graphData = [];
                for (const item of visitsList) {
                    const transformedItem = {
                        [item.city]: item.totalViews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else if (category === "bycategory") {
                const visitsList = await AdminService.getVisitsByCitiesCategories();
                const graphData = [];
                for (const item of visitsList) {
                    const transformedItem = {
                        [item.category]: item.totalViews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const visitsList = await AdminService.getVisitsAllCitiesDiscrete(category);
                const graphData = [];
                for (const item of visitsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalViews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        } else {
            if (category === 'bycategory') {
                const visitsList = await AdminService.getVisitsByCategory(city);
                const graphData = [];
                for (const item of visitsList) {
                    const transformedItem = {
                        [item.category]: item.totalViews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const visitsList = await AdminService.getVisitsInCityDiscrete(city, category);
                const graphData = [];
                for (const item of visitsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalViews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }

};

exports.getReviewsNum = async (req, res, next) => {
    console.log("------------------Get Reviews------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { city, category } = req.body;
        if (city === "allcities") {
            if (category === "bycity") {
                const reviewsList = await AdminService.getReviewsByCity();
                const graphData = [];
                for (const item of reviewsList) {
                    const transformedItem = {
                        [item.city]: item.totalReviews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else if (category === "bycategory") {
                const reviewsList = await AdminService.getReviewsByCitiesCategories();
                const graphData = [];
                for (const item of reviewsList) {
                    const transformedItem = {
                        [item.category]: item.totalReviews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const reviewsList = await AdminService.getReviewsAllCitiesDiscrete(category);
                const graphData = [];
                for (const item of reviewsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalReviews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        } else {
            if (category === 'bycategory') {
                const reviewsList = await AdminService.getReviewsByCategory(city);
                const graphData = [];
                for (const item of reviewsList) {
                    const transformedItem = {
                        [item.category]: item.totalReviews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const reviewsList = await AdminService.getReviewsInCityDiscrete(city, category);
                const graphData = [];
                for (const item of reviewsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalReviews
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }
};

exports.getComplaintsNum = async (req, res, next) => {
    console.log("------------------Get Complaints------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { city, category } = req.body;
        if (city === "allcities") {
            if (category === "bycity") {
                const complaintsList = await AdminService.getComplaintsByCity();
                const graphData = [];
                for (const item of complaintsList) {
                    const transformedItem = {
                        [item.city]: item.totalComplaints
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else if (category === "bycategory") {
                const complaintsList = await AdminService.getComplaintsByCitiesCategories();
                const graphData = [];
                for (const item of complaintsList) {
                    const transformedItem = {
                        [item.category]: item.totalComplaints
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const complaintsList = await AdminService.getComplaintsAllCitiesDiscrete(category);
                const graphData = [];
                for (const item of complaintsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalComplaints
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        } else {
            if (category === 'bycategory') {
                const complaintsList = await AdminService.getComplaintsByCategory(city);
                const graphData = [];
                for (const item of complaintsList) {
                    const transformedItem = {
                        [item.category]: item.totalComplaints
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const complaintsList = await AdminService.getComplaintsInCityDiscrete(city, category);
                const graphData = [];
                for (const item of complaintsList) {
                    const transformedItem = {
                        [item.placeName]: item.totalComplaints
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }
};

exports.getRatings = async (req, res, next) => {
    console.log("------------------Get Ratings------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { city, category } = req.body;
        if (city === "allcities") {
            if (category === "bycity") {
                const ratingsList = await AdminService.getRatingsByCity();
                const graphData = [];
                for (const item of ratingsList) {
                    const transformedItem = {
                        [item.city]: item.averageRating
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else if (category === "bycategory") {
                const ratingsList = await AdminService.getRatingsByCitiesCategories();
                const graphData = [];
                for (const item of ratingsList) {
                    const transformedItem = {
                        [item.category]: item.averageRating
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const ratingsList = await AdminService.getRatingsAllCitiesDiscrete(category);
                const graphData = [];
                for (const item of ratingsList) {
                    const transformedItem = {
                        [item.placeName]: item.averageRating
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        } else {
            if (category === 'bycategory') {
                const ratingsList = await AdminService.getRatingsByCategory(city);
                const graphData = [];
                for (const item of ratingsList) {
                    const transformedItem = {
                        [item.category]: item.averageRating
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            } else {
                const ratingsList = await AdminService.getRatingsInCityDiscrete(city, category);
                const graphData = [];
                for (const item of ratingsList) {
                    const transformedItem = {
                        [item.placeName]: item.averageRating
                    };
                    graphData.push(transformedItem);
                }
                return res.status(200).json({ graphData });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to find results" });
    }

};

async function generateHash(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const hash = crypto.createHash('sha256');
        hash.update(response.data);
        return hash.digest('hex');
    } catch (error) {
        console.error(`Error fetching or hashing image from ${imageUrl}:`, error.message);
        return null;
    }
}

function markCommonElements(arr1, arr2) {
    const markedArray1 = arr1.map((el, index) => ({ image: el, status: arr2.includes(el) ? 'common' : 'not common' }));
    const markedArray2 = arr2.map((el, index) => ({ image: el, status: arr1.includes(el) ? 'common' : 'not common' }));

    return { markedArray1, markedArray2 };
}

exports.addDestination = async (req, res, next) => {
    console.log("------------------Add Destination------------------");
    try {
        upload.array('images')(req, res, async (err) => {
            console.log(req.body);
            const token = req.headers.authorization.split(' ')[1];
            const adminData = await TouristService.getEmailFromToken(token);
            const admin = await AdminService.getAdminByEmail(adminData.email);
            if (!admin) {
                return res.status(500).json({ message: "User does not exist" });
            }
            const { destinationName, edited } = req.body;
            const existDestination = await DestinationService.getDestinationByName(destinationName);
            if (existDestination) {
                if (edited === 'false') {
                    return res.status(500).json({ message: "Destination already exists" });
                }
            }
            const { about, activities, longitude,
                latitude, city, category, services, otherServices, geoTags,
                contact, budget, openingTime, closingTime, workingDays
                , timeToSpend, visitorTypes, ageCategories, sheltered, date } = req.body;
            if (!req.files || req.files.length === 0) {
                console.log("no image");
                return res.status(500).json({ message: "The destination was not added" });
            }
            const imageUrls = [];
            const imageUrlsEdit = [];
            for (const file of req.files) {
                await new Promise((resolve, reject) => {
                    const metadata = {
                        metadata: {
                            firebaseStorageDownloadTokens: uuid()
                        },
                        contentType: file.mimetype,
                        cacheControl: "public, max-age=31536000"
                    };
                    const folder = 'destinations_images';
                    const fileName = `${folder}/${file.originalname}`;
                    const blob = bucket.file(fileName);
                    const blobStream = blob.createWriteStream({
                        metadata: metadata,
                        gzip: true
                    });
                    blobStream.on("error", (err) => {
                        console.error(err);
                        res.status(500).json({ message: 'Unable to upload' });
                    });
                    blobStream.on("finish", async () => {
                        const fileUrl = `${folder}%2F${file.originalname}`;
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUrl}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
                        const imageUrlEdit = `gs://touristine-9a51a.appspot.com/destinations_images/${file.originalname}`;
                        imageUrls.push(imageUrl);
                        imageUrlsEdit.push(imageUrlEdit);
                        resolve();
                    });
                    blobStream.end(file.buffer);
                });
            }
            console.log("here", imageUrls.length, "\n");
            const geotagsList = JSON.parse(geoTags);
            const visitorTypesList = JSON.parse(visitorTypes);
            const ageCategoriesList = JSON.parse(ageCategories);
            const workingdays = JSON.parse(workingDays);
            const workingHours = { openingTime, closingTime, workingdays };
            const displayedDuration = await PlanService.getHour(timeToSpend);
            const activityList = JSON.parse(activities);
            const servicesList = JSON.parse(services);
            const otherServicesList = JSON.parse(otherServices);
            const combinedServicesList = [...servicesList, ...otherServicesList];
            const servicesObjects = combinedServicesList.map(service => ({ name: service }));
            if (edited === "true") {
                const uploadedHash = await Promise.all(imageUrls.map(generateHash));
                const totalImages = [existDestination.images.mainImage, ...existDestination.images.descriptiveImages];
                const originalHash = await Promise.all(totalImages.map(generateHash));
                const { markedArray2, markedArray1 } = markCommonElements(uploadedHash, originalHash);
                const finalImages = [];
                if (markedArray1[0].status === 'common') {
                    finalImages.push(existDestination.images.mainImage);
                }
                for (let i = 1; i < markedArray1.length; i++) {
                    if (markedArray1[i].status === 'common') {
                        finalImages.push(existDestination.images.descriptiveImages[i - 1]);
                    }
                }
                for (let i = 0; i < markedArray2.length; i++) {
                    if (markedArray2[i].status === 'common') {
                        const filename = path.basename(imageUrlsEdit[i]);
                        console.log(filename);
                        const filePath = `destinations_images/${filename}`;
                        console.log(filePath);
                        const file = bucket.file(filePath);
                        try {
                            await file.delete();
                            console.log(`Image ${imageUrlsEdit[i]} deleted successfully.`);
                        } catch (error) {
                            console.error(`Error deleting image ${imageUrlsEdit[i]}:`, error.message);
                        }
                    } else {
                        finalImages.push(imageUrls[i]);
                    }
                }
                const destination = await AdminService.editDestination(
                    destinationName, about, activityList, longitude,
                    latitude, city, category, servicesObjects, geotagsList,
                    contact, budget, workingHours, displayedDuration,
                    visitorTypesList, ageCategoriesList, sheltered, finalImages[0], finalImages.slice(1), date, admin.email
                )
            } else {
                const destination = await AdminService.addDestination(
                    destinationName, about, activityList, longitude,
                    latitude, city, category, servicesObjects, geotagsList,
                    contact, budget, workingHours, displayedDuration,
                    visitorTypesList, ageCategoriesList, sheltered, imageUrls[0], imageUrls.slice(1), date, admin.email
                )
            }
            return res.status(200).json({ message: "Destination added successfully" });
        });
    } catch (error) {
        console.log(error);
        let failType = 'add';
        if (edited === 'true') {
            failType = 'edit'
        }
        return res.status(500).json({ error: `Failed to ${failType} destination` });
    }
};

exports.getDestinations = async (req, res, next) => {
    console.log("------------------Get Destinations------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const allDestinations = await DestinationService.getDestinations();
        const destinations = [];
        for (const destination of allDestinations) {
            const transformedItem = {
                [destination.name]: destination.images.mainImage
            };
            destinations.push(transformedItem);
        }
        return res.status(200).json({ destinations });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to get destinations" });
    }
};

exports.getDestinationReviews = async (req, res, next) => {
    console.log("------------------Get All Reviews------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const reviews = destination.reviews.map(review => ({
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            date: review.date,
            stars: review.stars,
            commentTitle: review.title,
            commentContent: review.feedback
        }));
        return res.status(200).json({ reviews: reviews });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Reviews are not available for this destination" });
    }
};

exports.getDestinationComplaints = async (req, res, next) => {
    console.log("------------------Get All Complaints------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const filteredComplaints = destination.complaints.filter(complaint => complaint.hidden !== 'true');
        const complaints = await Promise.all(filteredComplaints.map(async (complaint) => {
            const tourist = await TouristService.getTouristByEmail(complaint.email);
            return {
                id: complaint._id,
                firstName: tourist.firstName,
                lastName: tourist.lastName,
                title: complaint.title,
                complaint: complaint.complaint,
                images: complaint.images,
                date: complaint.date,
                seen: complaint.seen,
            };
        }));
        return res.status(200).json({ complaints: complaints });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Complaints are not available for this destination" });
    }
};

exports.hideComplaints = async (req, res, next) => {
    console.log("------------------Get All Complaints------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const update = await DestinationService.setHiddenTrue(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Failed to delete the complaints' });
        }
        return res.status(200).json({ message: "Complaintes were deleted" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete the complaints' });
    }
};

exports.hideComplaint = async (req, res, next) => {
    console.log("------------------Get All Complaints------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName, complaintId } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const update = await DestinationService.setOneHiddenTrue(destinationName, complaintId);
        if (!update) {
            return res.status(500).json({ error: 'Failed to delete the complaint' });
        }
        return res.status(200).json({ message: "Complaint was deleted" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete the complaint' });
    }
};

exports.markComplaintAsSeen = async (req, res, next) => {
    console.log("------------------Mark Complaint------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName, complaintId } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const complaint = destination.complaints.find(c => c._id.equals(complaintId));
        const tourist = await TouristService.getTouristByEmail(complaint.email);
        if (tourist.deviceToken !== '0') {
            sendNotification(tourist.deviceToken, 'Update on your complaint', 'Your complaint has been seen by the admins')
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
        }
        const update = await DestinationService.setSeen(destinationName, complaintId);
        if (!update) {
            return res.status(500).json({ error: 'Failed to update the complaint' });
        }
        return res.status(200).json({ message: "Complaint was updated" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to update the complaint' });
    }
};

exports.getDestinationUploads = async (req, res, next) => {
    console.log("------------------Get Destination Uploads------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const filteredUploads = destination.images.pendingImages.filter(pendingImages => pendingImages.status.toLocaleLowerCase() === 'pending');
        const uploadedImages = await Promise.all(filteredUploads.map(async (pendingImages) => {
            return {
                id: pendingImages._id,
                keywords: pendingImages.keywords,
                date: pendingImages.date,
                images: pendingImages.images,
                status: pendingImages.status,
            };
        }));
        return res.status(200).json({ uploadedImages: uploadedImages });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to retrieve uploads' });
    }
};

exports.approveAnUpload = async (req, res, next) => {
    console.log("------------------Approve An Upload------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName, approvedImages, uploadId } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const approvedImagesList = JSON.parse(approvedImages);
        const update1 = await DestinationService.uploadDescriptiveImages(destinationName, approvedImagesList);
        if (!update1) {
            return res.status(500).json({ error: 'Approval Failed' });
        }
        const upload = destination.images.pendingImages.find(p => p._id.equals(uploadId));
        const tourist = await TouristService.getTouristByEmail(upload.email);
        if (tourist.deviceToken !== '0') {
            sendNotification(tourist.deviceToken, 'Update on your uploaded images', 'Your images were accepted\nThanks for sharing!')
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
        }
        const update2 = await DestinationService.approvePendingImages(destinationName, uploadId);
        if (!update2) {
            return res.status(500).json({ error: 'Approval Failed' });
        }
        return res.status(200).json({ message: "Images were uploaded" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to approve the uploaded image' });
    }
};

exports.rejectAllUplaods = async (req, res, next) => {
    console.log("------------------Reject All Uploads------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const unseenImages = destination.images.pendingImages.filter(image => image.status.toLocaleLowerCase() === 'pending');
        for (const image of unseenImages) {
            const tourist = await TouristService.getTouristByEmail(image.email);
            if (tourist.deviceToken !== '0') {
                sendNotification(tourist.deviceToken, 'Update on your uploaded images', 'Your images were rejected\nGive it another shot!')
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
        }
        const update = await DestinationService.rejectAllPendingImages(destinationName);
        if (!update) {
            return res.status(500).json({ error: 'Rejection Failed' });
        }
        return res.status(200).json({ message: "Images were rejected" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to reject the uploaded image' });
    }
};

exports.rejectAnUpload = async (req, res, next) => {
    console.log("------------------Reject An Upload------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationName, uploadId } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        const upload = destination.images.pendingImages.find(p => p._id.equals(uploadId));
        const tourist = await TouristService.getTouristByEmail(upload.email);
        if (tourist.deviceToken !== '0') {
            sendNotification(tourist.deviceToken, 'Update on your complaint', 'Your complaint has been seen by the admins')
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
        }
        const update = await DestinationService.rejectPendingImages(destinationName, uploadId);
        if (!update) {
            return res.status(500).json({ error: 'Rejection Failed' });
        }
        return res.status(200).json({ message: "Images were rejected" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to reject the uploaded image' });
    }
};

exports.getAddedDestinations = async (req, res, next) => {
    console.log("------------------Get Added Destinations------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { filter } = req.body;
        let destinations;
        if (filter === 'all') {
            destinations = await DestinationService.getDestinations();
        } else if (filter.match(/^(ramallah|nablus|jerusalem|bethlehem)$/i)) {
            destinations = await DestinationService.getDestinationsInCity(filter);
        } else {//category
            destinations = await DestinationService.getDestinationsInCategory(filter);
        }
        const destinationsList = await Promise.all(destinations.map(async (destination) => {
            return {
                id: destination._id,
                name: destination.name,
                image: destination.images.mainImage,
                city: destination.location.address,
                category: destination.category,
            };
        }));
        return res.status(200).json({ destinationsList: destinationsList });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to get added destinations' });
    }
};

exports.deleteAddedDestination = async (req, res, next) => {
    console.log("------------------Delete Added Destination------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const destinationId = req.params.destinationId;
        const destination = await DestinationService.getDestinationById(destinationId);
        if (!destination) {
            return res.status(500).json({ error: 'The destination you are trying to delete does not exist' });
        }
        const deleteDestination = await DestinationService.deleteDestinationById(destinationId);
        if (!deleteDestination) {
            return res.status(500).json({ error: 'The destination you are trying to delete does not exist' });
        }
        return res.status(200).json({ message: 'The destination was deleted successfullys' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to get added destinations' });
    }
};

exports.getDestinationInfo = async (req, res, next) => {
    console.log("------------------Get Destination Info------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const adminData = await AdminService.getEmailFromToken(token);
        const admin = await AdminService.getAdminByEmail(adminData.email);
        if (!admin) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const { destinationId } = req.body;
        const destination = await DestinationService.getDestinationById(destinationId);
        if (!destination) {
            return res.status(500).json({ error: 'The destination you are trying to view does not exist' });
        }
        const destinationMap = {
            destID: destination._id, imagesURLs: [destination.images.mainImage, ...destination.images.descriptiveImages],
            destinationName: destination.name, city: destination.location.address, category: destination.category,
            budget: destination.budget, timeToSpend: destination.estimatedDuration.displayedDuration,
            sheltered: destination.sheltered, about: destination.description,
            latitude: destination.location.latitude, longitude: destination.location.longitude,
            openingTime: destination.workingHours.openingTime, closingTime: destination.workingHours.closingTime,
            selectedWorkingDays: destination.workingHours.workingdays, visitorTypes: destination.visitorsType,
            ageCategories: destination.ageCategory, selectedServices: destination.services,
            addedActivities: destination.activityList, geoTags: destination.geotags
        };
        return res.status(200).json({ destinationMap: destinationMap });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to get the destination\'s info' });
    }
};

//might be deleted
exports.getWeather = async (req, res, next) => {
    try {
        const data = await DestinationService.getWeather("ramallah");
        const words = data.match(/[a-zA-Z]+(?=\s*\+)/);
        res.json(words);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};