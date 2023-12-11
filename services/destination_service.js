const DestinationModel = require("../models/destination_model");
const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const axios = require('axios');
const express = require('express');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'touristineapp@gmail.com',
    pass: 'ijul lnjb hdvs zxdf'
  }
});
class DestinationService {

  static async getDestinations() {
    try {
      return await DestinationModel.find({});
    } catch (err) {
      console.log(err);
      throw new Error('An error occurred while retrieving the destinations');
    }
  }

  static async getDestinationByName(name) {
    try {
      return await DestinationModel.findOne({ name });
    } catch (err) {
      console.log(err);
      throw new Error('An error occurred while retrieving the destination by name');
    }
  }

  static async getDestinationsInCity(city) {
    try {
      return await DestinationModel.find({ 'location.address': city });
    } catch (err) {
      console.log(err);
      throw new Error('An error occurred while retrieving the destination by city');
    }
  }

  static async updateReview(email, destination, stars, title, content, date) {
    try {
      return DestinationModel.updateOne({ name: destination.name, 'reviews.user.email': email }, { $set: { 'reviews.$.stars': stars, 'reviews.$.title': title, 'reviews.$.feedback': content, 'reviews.$.date': date } });
    } catch (error) {
      throw new Error("An error occurred updating your review");
    }
  }

  static async saveReview(tourist, destination, stars, title, content, date) {
    try {
      return DestinationModel.updateOne(
        { name: destination.name },
        {
          $push: {
            reviews: {
              user: { firstName: tourist.firstName, lastName: tourist.lastName, email: tourist.email },
              stars: stars, title: title, feedback: content, date: date
            }
          }
        }
      );
    } catch (error) {
      throw new Error("An error occurred updating your review");
    }
  }

  static async updateRating(destination, newRating, oldRating) {
    try {
      switch (oldRating) {
        case 1:
          await DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.oneStar': -1 } });
          break;
        case 2:
          await DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.twoStars': -1 } });
          break;
        case 3:
          await DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.threeStars': -1 } });
          break;
        case 4:
          await DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.fourStars': -1 } });
          break;
        case 5:
          await DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.fiveStars': -1 } });
          break;
        default:
          break;
      }
      switch (newRating) {
        case 1:
          return DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.oneStar': 1 } });
        case 2:
          return DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.twoStars': 1 } });
        case 3:
          return DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.threeStars': 1 } });
        case 4:
          return DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.fourStars': 1 } });
        case 5:
          return DestinationModel.updateOne({ name: destination.name }, { $inc: { 'rating.fiveStars': 1 } });
        default:
          break;
      }
    } catch (error) {
      console.log(error);
      throw new Error("An error occurred updating the ratings");
    }
  }

  static async uploadImages(destination, email, date, imageUrls, keywords) {
    try {
      return DestinationModel.updateOne(
        { name: destination.name },
        {
          $push: {
            'images.pendingImages': {
              email: email, date: date, images: imageUrls, keywords: keywords, status: "Pending"
            }
          }
        }
      );
    } catch (error) {
      throw new Error("An error occurred updating your review");
    }
  }

  static async calculatePoints(tourist, destination) {
    console.log("calculating points-------------------");
    try {
      var points = 0;
      console.log("address---------------");
      console.log(tourist.location?.address?.toLowerCase());
      if (destination.location?.address?.toLowerCase() === tourist.location?.address?.toLowerCase()) {
        points += 10;
      }
      console.log("category---------------");
      switch (destination.category?.toLowerCase()) {
        case 'coastalareas':
          if (tourist.interests.coastalAreas === "true") {
            points += 15;
          }
          break;
        case 'mountains':
          if (tourist.interests.mountains === "true") {
            points += 15;
          }
          break;
        case 'nationalparks':
          if (tourist.interests.nationalParks === "true") {
            points += 15;
          }
          break;
        case 'majorcities':
          if (tourist.interests.majorCities === "true") {
            points += 15;
          }
          break;
        case 'countryside':
          if (tourist.interests.countrySide === "true") {
            points += 15;
          }
          break;
        case 'historicalsites':
          if (tourist.interests.historicalSites === "true") {
            points += 15;
          }
          break;
        case 'religiouslandmarks':
          if (tourist.interests.religiousLandmarks === "true") {
            points += 15;
          }
          break;
        case 'aquariums':
          if (tourist.interests.aquariums === "true") {
            points += 15;
          }
          break;
        case 'zoos':
          if (tourist.interests.zoos === "true") {
            points += 15;
          }
          break;
        case 'others':
          if (tourist.interests.others === "others") {
            points += 15;
          }
          break;
        default:
          break;
      }
      console.log("budget---------------");
      switch (destination.budget?.toLowerCase()) {
        case ("budgetfriendly"):
          if (tourist.interests?.BudgetFriendly?.toLowerCase() === "true") {
            points += 20;
          }
          break;
        case ("midrange"):
          if (tourist.interests?.MidRange?.toLowerCase() === "true") {
            points += 20;
          }
          break;
        case ("luxurious"):
          if (tourist.interests?.Luxurious?.toLowerCase() === "true") {
            points += 20;
          }
          break;
        default:
          break;
      }
      console.log("vtypes---------------");
      destination.visitorsType?.forEach(type => {
        if ((type.toLowerCase() === "family") && (tourist.interests?.family === "true")) {
          points += 15;
        } else if ((type.toLowerCase() === "friends") && (tourist.interests?.friends === "true")) {
          points += 15;
        } else if ((type.toLowerCase() === "solo") && (tourist.interests?.solo === "true")) {
          points += 15;
        }
      });
      console.log("weather---------------");
      if ((destination.category?.toLowerCase() != "historicalsites") && (destination.category?.toLowerCase() != "religiouslandmarks")) {
        const weatherDetails = await this.getWeather(destination.location.address);
        if (weatherDetails.toLowerCase().includes("rain")) {
          //check for categories concerned with the weather
          if (destination.sheltered === "true") {
            points += 30;
          } else {
            points -= 30;
          }
        } else {
          points += 10;
        }
      } else {
        points += 10;
      }
      console.log("services---------------");
      destination.services?.forEach(service => {
        switch (service.name.toLowerCase()) {
          case "restrooms":
            points += 10;
            if (tourist.interests.diabetes === "true") {
              points += 15;
            }
            break;
          case "parking":
            points += 10;
            break;
          case "gasstations":
            points += 10;
            break;
          case "wheelchairramps":
            if (tourist.interests.mobility === "true") {
              points += 20;
            }
            break;
          case "kidsarea":
            points += 15;
            break;
          case "restaurants":
            if ((tourist.family === "true") || (tourist.friends === "true")) {
              points += 15;
            } else {
              points += 10;
            }
            break;
          case "healthcenters":
            points += 10;
            if (tourist.cognitive === "true") {
              points += 20;
            }
            break;
          case "photographers":
            points += 15;
            break;
          case "kiosks":
            points += 15;
            break;
          default:
            break;
        }
      });
      console.log("points---------------");
      console.log(points);
      return points;
    } catch (error) {
      console.log("An error occurred calculating points");
      throw new Error("An error occurred calculating points");
    }
  }

  static async calculateRatings(destination) {
    var points = 0;
    points -= destination.rating.oneStar * 10;
    points -= destination.rating.twoStars * 5;
    points += destination.rating.threeStars * 10;
    points += destination.rating.fourStars * 15;
    points += destination.rating.fiveStars * 20;
    points += destination.viewedTimes * 2;
    return points;
  }

  static async addComplaint(destination, email, title, complaint, date, images) {
    try {
      console.log(destination.name, title, complaint, email, images.length);
      return DestinationModel.updateOne(
        { name: destination.name },
        {
          $push: {
            complaints: {
              email: email, date: date, title: title, complaint: complaint, images: images, seen: "false"
            }
          }
        }
      );
    } catch (error) {
      throw new Error("An error occurred adding your complaint");
    }
  }

  static async incrementViewedTimes(name) {
    try {
      return DestinationModel.updateOne({ name: name }, { $inc: { viewedTimes: 1 } });
    } catch (error) {
      console.log(error);
      console.log("--------------------------------------------------------------------------");
      throw new Error("An error occurred updating the password value");
    }
  }

  static async getWeather(location) {
    try {
      const response = await axios.get(`https://wttr.in/${location}?format=%C+%t`);
      const weatherResult = response.data;
      // console.log(weatherResult);
      return weatherResult;
    } catch (error) {
      console.log("Error occurred inspecting the weather");
      throw new Error("Failed to inspect the weather");
    }
  }

  static async deleteUploadedImages(destination, uploadedImagesId) {
    return await DestinationModel.updateOne(
      { name: destination.name }, { $pull: { 'images.pendingImages': { _id: uploadedImagesId } } }
    );
  }

  static async addDestination(
    name, description, activityList, longitude,
    latitude, address, category, services, geotags,
    contact, budget, workingHours, displayedDuration,
    visitorsType, sheltered
  ) {
    try {
      const location = { longitude, latitude, address }
      const estimatedDuration = { displayedDuration };
      const destination = new DestinationModel({
        name, description, activityList, location, category, services, geotags,
        contact, budget, workingHours, estimatedDuration,
        visitorsType, sheltered
      });
      await destination.save();
    } catch (error) {
      console.log(error);
      throw new Error("An error occurred adding the new destination");
    }

  }

  static async searchDestinations(searchTerm, isBudgetFriendly, isMidRange, isLuxurious, sheltered) {
    try {
      const searchTerms = searchTerm.split(' ');
      const cities = ['ramallah', 'nablus', 'jerusalem', 'bethlehem'];
      const regexSearchTerms = searchTerm.split(' ').map(term => new RegExp(term, 'i'));

      let query = {
        $or: [
          { 'location.address': { $in: regexSearchTerms } },
          { 'name': { $in: regexSearchTerms } },
          { 'category': { $in: regexSearchTerms } },
          { 'geotags': { $in: regexSearchTerms } },
        ],
      };

      if (cities.some(city => searchTerm.toLowerCase().includes(city.toLowerCase()))) {
        query['$and'] = [
          { 'location.address': { $in: regexSearchTerms } },
          {
            $or: [
              { 'name': { $in: regexSearchTerms } },
              { 'category': { $in: regexSearchTerms } },
              { 'geotags': { $in: regexSearchTerms } },
            ]
          },
        ];
      }
      const budgetOptions = [];
      if (isBudgetFriendly === "true") budgetOptions.push('budgetfriendly');
      if (isMidRange === "true") budgetOptions.push('midrange');
      if (isLuxurious === "true") budgetOptions.push('luxurious');

      if (budgetOptions.length > 0) {
        query['budget'] = { $in: budgetOptions };
      }

      if (sheltered === "true") {
        query.sheltered = sheltered;
      }

      console.log('Constructed Query:', JSON.stringify(query));
      const results = await DestinationModel.find(query);
      console.log(results);
      return results;
    } catch (error) {
      console.error(error);
      throw new Error('An error occurred while searching for destinations.');
    }
  }


}



module.exports = DestinationService;  