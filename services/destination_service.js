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
          DestinationModel.updateOne({ name: destination.name }, { $set: { oneStar: (destination.oneStar - 1) } });
          break;
        case 2:
          DestinationModel.updateOne({ name: destination.name }, { $set: { twoStars: (destination.twoStars - 1) } });
          break;
        case 3:
          DestinationModel.updateOne({ name: destination.name }, { $set: { threeStars: (destination.threeStars - 1) } });
          break;
        case 4:
          DestinationModel.updateOne({ name: destination.name }, { $set: { fourStars: (destination.fourStars - 1) } });
          break;
        case 5: DestinationModel.updateOne({ name: destination.name }, { $set: { fiveStars: (destination.fiveStars - 1) } });
          break;
        default:
          break;
      }
      switch (newRating) {
        case 1:
          DestinationModel.updateOne({ name: destination.name }, { $set: { oneStar: (destination.oneStar + 1) } });
          break;
        case 2:
          DestinationModel.updateOne({ name: destination.name }, { $set: { twoStars: (destination.twoStars + 1) } });
          break;
        case 3:
          DestinationModel.updateOne({ name: destination.name }, { $set: { threeStars: (destination.threeStars + 1) } });
          break;
        case 4:
          DestinationModel.updateOne({ name: destination.name }, { $set: { fourStars: (destination.fourStars + 1) } });
          break;
        case 5: DestinationModel.updateOne({ name: destination.name }, { $set: { fiveStars: (destination.fiveStars + 1) } });
          break;
        default:
          break;
      }
    } catch (error) {
      throw new Error("An error occurred updating the ratings");
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
              email: email, date: date, title: title, complaint: complaint, images: images
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

}



module.exports = DestinationService;  