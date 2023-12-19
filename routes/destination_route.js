const express = require('express');
const DestinationController = require('../controllers/destination_controller');

const destinationRouter = express.Router();

destinationRouter.post('/get-recommended-destinations', DestinationController.getRecommendedDestinations);
destinationRouter.post('/get-popular-destinations', DestinationController.getPopularDestinations);
destinationRouter.post('/get-other-destinations', DestinationController.getOtherDestinations);
destinationRouter.post('/get-destination-details', DestinationController.getDestinationDetails);
destinationRouter.post('/get-all-reviews', DestinationController.getAllReviews);
destinationRouter.post('/get-review-data', DestinationController.getReviewData);
destinationRouter.post('/send-review-data', DestinationController.sendReviewData);
destinationRouter.post('/get-destination-lat-lng', DestinationController.getDestinationLatLng);
destinationRouter.post('/send-complaint', DestinationController.addComplaint);
destinationRouter.post('/get-complaints', DestinationController.getComplaints);
destinationRouter.post('/add-new-destination', DestinationController.addDestination);
destinationRouter.post('/upload-images', DestinationController.uploadImages);
destinationRouter.post('/get-uploaded-images', DestinationController.getUploadedImages);
destinationRouter.post('/delete-uploads/:uploadedImagesId', DestinationController.deleteUploadedImages);
destinationRouter.post('/search-destination', DestinationController.searchDestination);

destinationRouter.post('/get-statistics', DestinationController.getStatistics); 

destinationRouter.post('/get-weather', DestinationController.getWeather);
module.exports = destinationRouter;