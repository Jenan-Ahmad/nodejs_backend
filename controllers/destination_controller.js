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
    //increment numofviewedtimes
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        //list of images
        const { destinationName } = req.body;
        const destination = await DestinationService.getDestinationByName(destinationName);
        if (!destination) {
            return res.status(500).json({ error: 'Destination Doesn\'t exist' });
        }
        //increment number of viewed times
        const incrDone = await DestinationService.incrementViewedTimes(destinationName);
        if (!incrDone) {
            return res.status(500).json({ error: 'Failed to load the destination' });
        }
        // const destinationImages = destination.images?.descriptiveImages;
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
            const { destinationName } = req.body;
            const existDestination = await DestinationService.getDestinationByName(destinationName);
            if (existDestination) {
                return res.status(500).json({ message: "Destination already exists" });
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
            const destination = await AdminService.addDestination(
                destinationName, about, activityList, longitude,
                latitude, city, category, servicesObjects, geotagsList,
                contact, budget, workingHours, displayedDuration,
                visitorTypesList, ageCategoriesList, sheltered, imageUrls[0], imageUrls.slice(1), date, admin.email
            )
            return res.status(200).json({ message: "Destination added successfully" });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to add destination" });
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