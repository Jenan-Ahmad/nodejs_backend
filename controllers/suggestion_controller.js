const TouristService = require("../services/tourist_service");
const SuggestionService = require("../services/suggestion_service");
const admin = require("../config/fb");
const bucket = admin.storage().bucket();//firebase storage bucket
const multer = require('multer');
const uuid = require('uuid-v4');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.storeDestination = async (req, res, next) => {
    console.log("------------------Store Destination------------------");
    try {
        upload.array('images')(req, res, async (err) => {
            const token = req.headers.authorization.split(' ')[1];
            const touristData = await TouristService.getEmailFromToken(token);
            const tourist = await TouristService.getTouristByEmail(touristData.email);
            if (!tourist) {
                return res.status(500).json({ error: 'User does not exist' });
            }
            const { date, destinationName, category, budget, timeToSpend, sheltered, about, city } = req.body
            const match = timeToSpend.match(/\b\d+\b/);
            const extractedNumber = match ? parseInt(match[0]) : null;
            if (!req.files || req.files.length === 0) {
                console.log("no image");
                const update = await SuggestionService.addSuggestion(date, destinationName, category, budget, extractedNumber, sheltered, about, [], tourist.email, city);
                if (!update) {
                    console.log("Failed to add the destination");
                    throw new Error("Failed to add the destination");
                }
                return res.status(200).json("The destination was added successfully");
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
            const update = await SuggestionService.addSuggestion(date, destinationName, category, budget, extractedNumber, sheltered, about, imageUrls, tourist.email, city);
            if (!update) {
                console.log("Failed to add the destination");
                throw new Error("Failed to add the destination");
            }
            return res.status(200).json("The destination was added successfully");
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to add the destination" });
    }
};

exports.getUploadedDests = async (req, res, next) => {
    console.log("------------------Get Uploaded Dests------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const destinationsList = await SuggestionService.getDestinationsByEmail(tourist.email);
        const destinations = destinationsList.map(destination => ({
            destID: destination._id,
            date: destination.date,
            destinationName: destination.name,
            category: destination.category,
            budget: destination.budget,
            timeToSpend: destination.estimatedDuration,
            sheltered: destination.sheltered,
            status: destination.status,
            about: destination.about,
            imagesURLs: destination.images,
            city: destination.city,
            adminComment: destination.comment.reply,
        }));
        res.status(200).json(destinations);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to retrieve the destinations" });
    }
};

exports.deleteDestination = async (req, res, next) => {
    console.log("------------------Delete Destinations------------------");
    try {
        const token = req.headers.authorization.split(' ')[1];
        const touristData = await TouristService.getEmailFromToken(token);
        const tourist = await TouristService.getTouristByEmail(touristData.email);
        if (!tourist) {
            return res.status(500).json({ error: 'User does not exist' });
        }
        const destId = req.params.destId;
        const deleted = await SuggestionService.deleteSuggestion(destId);
        if (!deleted) {
            return res.status(404).json({ error: 'Destination was not found' });
        }
        return res.status(200).json({ message: "The Destination was deleted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to delete the destination" });
    }
};