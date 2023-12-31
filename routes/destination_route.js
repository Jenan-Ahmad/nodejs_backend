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
destinationRouter.post('/get-destinations', DestinationController.getDestinations);
destinationRouter.post('/get-destination-reviews', DestinationController.getDestinationReviews);
destinationRouter.post('/get-destination-complaints', DestinationController.getDestinationComplaints);
destinationRouter.post('/delete-all-complaints', DestinationController.hideComplaints);
destinationRouter.post('/delete-complaint', DestinationController.hideComplaint);
destinationRouter.post('/mark-complaint-as-seen', DestinationController.markComplaintAsSeen);
destinationRouter.post('/get-destination-uploads', DestinationController.getDestinationUploads);
destinationRouter.post('/approve-an-upload', DestinationController.approveAnUpload);
destinationRouter.post('/reject-all-uplaods', DestinationController.rejectAllUplaods);
destinationRouter.post('/reject-an-upload', DestinationController.rejectAnUpload);
destinationRouter.post('/get-added-destinations', DestinationController.getAddedDestinations);
destinationRouter.post('/delete-added-destination/:destinationId', DestinationController.deleteAddedDestination);
destinationRouter.post('/get-destination-info', DestinationController.getDestinationInfo);

destinationRouter.post('/get-weather', DestinationController.getWeather);
module.exports = destinationRouter;