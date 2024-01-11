const express = require('express');
const SuggestionController = require('../controllers/suggestion_controller');

const suggestionRouter = express.Router();

suggestionRouter.post('/store-destination', SuggestionController.storeDestination);
suggestionRouter.post('/get-uploaded-dests', SuggestionController.getUploadedDests);
suggestionRouter.post('/delete-destination/:destId', SuggestionController.deleteDestination);
suggestionRouter.post('/get-suggestions', SuggestionController.getSuggestions);
suggestionRouter.post('/delete-suggestion/:suggestionId', SuggestionController.deleteSuggestion);
suggestionRouter.post('/add-comment', SuggestionController.addComment);

module.exports = suggestionRouter;