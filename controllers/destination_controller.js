const TouristService = require("../services/tourist_service");
const DestinationService = require("../services/destination_service");
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
        var destinations = await DestinationService.getDestinations();
        destinations.forEach(async destination => {
            destination.points = await DestinationService.calculatePoints(tourist, destination);
        });
        const sortedDestinations = destinations.sort((a, b) => b.points - a.points);
        // const recommendedDestinations = sortedDestinations.slice(0, 10);
        const recommendedData = sortedDestinations.map(destination => ({
            name: destination.name, // Replace with the actual property name in your schema
            image: destination.images.mainImage, // Replace with the actual property name in your schema
        }));
        res.json(recommendedData);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Error: error });
    }
};

exports.getPopularDestinations = async (req, res, next) => {
    console.log("------------------Get Popular Destinations------------------");
    try {
        //verify token
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        var destinations = await DestinationService.getDestinations();
        destinations.forEach(async destination => {
            destination.points = await DestinationService.calculateRatings(destination);
        });
        const sortedDestinations = destinations.sort((a, b) => b.points - a.points);
        // const recommendedDestinations = sortedDestinations.slice(0, 10);
        const popularData = sortedDestinations.map(destination => ({
            name: destination.name, // Replace with the actual property name in your schema
            image: destination.images.mainImage, // Replace with the actual property name in your schema
        }));
        res.json(popularData);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Error: error });
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
        res.json(otherData);
    } catch (error) {

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
        const destinationImages = destination.images?.descriptiveImages;

        const weather = await DestinationService.getWeather(destination.location.address);
        const temperature = weather.match(/\d+/);
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
            OpeningTime: destination.openingTime, ClosingTime: destination.closingTime,
            WorkingDays: destination.workingdays, Weather: temperature,
            Rating: FRating, CostLevel: destination.budget, sheltered: destination.sheltered,
            EstimatedTime: estimatedDuration.displayedDuration, Services: Services
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
            const updated = await DestinationService.updateReview(tourist.email, destination, stars, title, content, date);
            if (!updated) {
                return res.status(500).json({ error: "Couldn\'t update your review" });
            }
            return res.status(200).json({ message: "Your review was updated" });
        } else {
            console.log("Review not found for user:");
            const updated = await DestinationService.saveReview(tourist, destination, stars, title, content, date);
            if (!updated) {
                return res.status(500).json({ message: "Couldn\'t update your review" });
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
        return res.status(200).json({ latitude: destination.latitude, longitude: destination.longitude })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve location" });
    }
};

exports.addComplaint = async (req, res, next) => {
    console.log("------------------Add Complaint------------------");
    try {

        upload.array('images')(req, res, async (err) => {
            //verify token
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
            if (!req.files) {
                console.log("no image");
                const update = await DestinationService.addComplaint(destination, tourist.email, title, content, date, null);
                if (!update) {
                    console.log("failed to add complaint with no images");
                    throw new Error("Faield to add your complaint");
                }
                return res.status(200).json("Your complaint was added");
            }
            const imageUrls = [];
            for (const file of req.files) {
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
                });
                blobStream.end(file.buffer);
            }
            const update = await DestinationService.addComplaint(destination, tourist.email, title, content, date, imageUrls);
            if (!update) {
                console.log("failed to add complaint with no images");
                throw new Error("Faield to add your complaint");
            }
            return res.status(200).json("Your complaint was added");
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send your complaint" });
    }
};

//might be deleted
exports.getWeather = async (req, res, next) => {
    try {
        const data = await DestinationService.getWeather("ramallah");
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};