const express = require('express');
const SuggestionController = require('../controllers/suggestion_controller');

const suggestionRouter = express.Router();

suggestionRouter.post('/store-destination', SuggestionController.storeDestination);

module.exports = suggestionRouter;