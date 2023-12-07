const PlanModel = require("../models/plan_model");
const DestinationModel = require("../models/destination_model");
const TouristModel = require("../models/tourist_model");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const axios = require('axios');
const express = require('express');
const lodash = require('lodash');

function findCommonElements(array1, array2) {
    return array1.filter(element => array2.includes(element));
}

function convertDateStringToDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
}

function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = date.getDay();
    return daysOfWeek[dayIndex];
}

function convertTimeStringToDate(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0); // Optional: Set seconds to 0 if not provided in the time string
    return date;
}

function replaceFromCategory(category, destinationsByCategory, crntTime, startTime, endTime) {
    for (const solDest in destinationsByCategory[category]) {
        if (crntTime >= convertTimeStringToDate(destinationsByCategory[category][solDest].workingHours.openingTime).getHours()
            && crntTime + destinationsByCategory[category][solDest].estimatedDuration.displayedDuration <= convertTimeStringToDate(destinationsByCategory[category][solDest].workingHours.closingTime).getHours() + 1) {
            destination = destinationsByCategory[category][solDest];
            updated = 1;
            break;
        }
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'touristineapp@gmail.com',
        pass: 'ijul lnjb hdvs zxdf'
    }
});

class PlanService {

    static async getPlanById(planId) {
        try {
            return await PlanModel.findOne({ _id: planId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the plan');
        }
    }

    static async getPlans(email) {
        try {
            return await PlanModel.find({ email: email });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while retrieving the plans');
        }
    }

    static async deletePlan(planId) {
        try {
            return await PlanModel.deleteOne({ _id: planId });
        } catch (err) {
            console.log(err);
            throw new Error('An error occurred while deleting the plan');
        }
    }

    static async calculatePlanPoints(destination, date, startTime, endTime, ageCategories) {
        console.log("calculating plan points-------------------");
        console.log("check if time is convenient----------------------")
        var points = 0;
        const planStartTime = convertTimeStringToDate(startTime);
        const planEndTime = convertTimeStringToDate(endTime);
        const destinationStartTime = convertTimeStringToDate(destination.workingHours.openingTime);
        const destinationEndTime = convertTimeStringToDate(destination.workingHours.closingTime);
        const tripStarts = Math.max(destinationStartTime.getHours(), planStartTime.getHours());
        if (tripStarts + destination.estimatedDuration.displayedDuration <= destinationEndTime.getHours() && tripStarts + destination.estimatedDuration.displayedDuration <= planEndTime.getHours()) {
            points += 30;
            console.log("time is good");
            console.log(destinationStartTime.getHours(), destination.workingHours.openingTime, planStartTime.getHours(), startTime, destinationEndTime.getHours(), destination.workingHours.closingTime, planEndTime.getHours(), endTime);
        } else {
            points -= 1000;
            console.log("time is bad");
            console.log(destinationStartTime.getHours(), destination.workingHours.openingTime, planStartTime.getHours(), startTime, destinationEndTime.getHours(), destination.workingHours.closingTime, planEndTime.getHours(), endTime);
        }
        console.log("check if day is convenient----------------------")
        const dateObject = convertDateStringToDate(date);
        const dayOfWeek = getDayOfWeek(dateObject);
        if (destination.workingHours.workingdays.includes(dayOfWeek)) {
            points += 30;
            console.log("day is good");
        } else {
            points -= 1000;
            console.log("day is bad");
        }
        // console.log("check if age is convenient----------------------")
        // const ageInCommon = findCommonElements(destination.ageCategories, ageCategories);
        // points += ageInCommon * 30;
        return points;
    }

    static async getInterests(tourist) {
        const touristCategories = [];
        if (tourist.interests.coastalAreas === "true") {
            touristCategories.push('coastalareas')
        }
        if (tourist.interests.mountains === "true") {
            touristCategories.push('mountains')
        }
        if (tourist.interests.nationalParks === "true") {
            touristCategories.push('nationalparks')
        }
        if (tourist.interests.majorCities === "true") {
            touristCategories.push('majorcities')
        }
        if (tourist.interests.countrySide === "true") {
            touristCategories.push('countryside')
        }
        if (tourist.interests.historicalSites === "true") {
            touristCategories.push('historicalsites')
        }
        if (tourist.interests.religiousLandmarks === "true") {
            touristCategories.push('religiouslandmarks')
        }
        if (tourist.interests.aquariums === "true") {
            touristCategories.push('aquariums')
        }
        if (tourist.interests.zoos === "true") {
            touristCategories.push('zoos')
        }
        if (tourist.interests.others === "true") {
            touristCategories.push('others')
        }
        return touristCategories;
    }

    static async segregateByCategory(destinationsWithPoints) {
        const destinationsByCategory = [];
        for (const destination of destinationsWithPoints) {
            if (destination.points < 0) {
                continue;
            }
            const category = destination.category;
            if (!destinationsByCategory[category]) {
                destinationsByCategory[category] = [];
            }
            destinationsByCategory[category].push(destination);
        }
        return destinationsByCategory;
    }

    static async initialPlan(destinationsByCategory, touristCategories) {
        const planDestinations = [];
        console.log("------------initial plan");
        for (const category in destinationsByCategory) {
            if (touristCategories.includes(category)) {
                const categoryArray = destinationsByCategory[category];
                if (categoryArray.length > 0) {
                    const firstDestination = categoryArray[0];
                    planDestinations.push(firstDestination);
                    console.log(firstDestination.name);
                }
            }
        }
        return planDestinations;
    }

    static async getPlanDuration(planDestinations) {
        var planDuration = 0;
        for (const destination of planDestinations) {
            console.log("--------------------------", destination.name);
            planDuration += destination.estimatedDuration.displayedDuration;
        }
        return planDuration;
    }

    static async reducePlan(planDuration, tripDuration, planDestinations, destinationsByCategory, touristCategories, startTime) {
        console.log("-------------------------------reduce plan");
        //take off places with lowest points
        while (planDuration - 1 > tripDuration) {
            const deletedDest = planDestinations.pop();
            planDuration -= deletedDest.estimatedDuration.displayedDuration;
            console.log(planDuration);
        }
        var crntTime = convertTimeStringToDate(startTime).getHours();//holds time scrolling through plan destinations
        //shuffle places
        console.log("before shuffle");
        for (const destination of planDestinations) {
            console.log("--------------------------", destination.name);
        }
        planDestinations = lodash.shuffle(planDestinations);
        console.log("after shuffle");
        for (const destination of planDestinations) {
            console.log("--------------------------", destination.name);
        }
        //check timings for each place
        for (let i = 0; i < planDestinations.length; i++) {
            const destination = planDestinations[i];
            if (crntTime >= convertTimeStringToDate(destination.workingHours.openingTime).getHours()
                && crntTime + destination.estimatedDuration.displayedDuration <= convertTimeStringToDate(destination.workingHours.closingTime).getHours()) {
                crntTime += destination.estimatedDuration.displayedDuration;
                console.log("Destination", destination.name, "is saved");
            } else {
                let solved = 0;
                //if problem, find a successor that works from the plan
                console.log("Destiantion", destination.name, "isn't open at", crntTime);
                for (let j = i; j < planDestinations.length; j++) {
                    const solDestination = planDestinations[j];
                    if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                        && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                        planDestinations[i] = solDestination;
                        planDestinations[j] = destination;
                        console.log("Alter, from plan, Destination", solDestination.name, "is saved");
                        solved = 1;
                        crntTime += solDestination.estimatedDuration.displayedDuration;
                        break;
                    }
                }
                //if not found, check from its category
                if (solved === 0) {
                    for (let j = 0; j < destinationsByCategory[destination.category].length; j++) {
                        const solDestination = destinationsByCategory[destination.category][j];
                        if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                            && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                            if (planDestinations.includes(solDestination)) {
                                continue;
                            }
                            planDestinations[i] = solDestination;
                            console.log("Alter, from category, Destination", solDestination.name, "is saved");
                            solved = 1;
                            crntTime += solDestination.estimatedDuration.displayedDuration;
                            break;
                        }
                    }
                }
                //if still, choose from other categories
                if (solved === 0) {
                    for (const category in destinationsByCategory) {
                        if (touristCategories.includes(category)) {
                            const categoryArray = destinationsByCategory[category];
                            for (let j = 0; j < categoryArray.length; j++) {
                                const solDestination = categoryArray[j];
                                if (planDestinations.includes(solDestination)) {
                                    continue;
                                }
                                if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                                    && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                                    planDestinations[i] = solDestination;
                                    console.log("Alter, from chosen categories, Destination", solDestination.name, "is saved");
                                    solved = 1;
                                    crntTime += solDestination.estimatedDuration.displayedDuration;
                                    break;
                                }
                            }
                        }
                        if (solved === 1) {
                            break;
                        }
                    }
                }
                if (solved === 0) {
                    for (const category in destinationsByCategory) {
                        if (!touristCategories.includes(category)) {
                            const categoryArray = destinationsByCategory[category];
                            for (let j = 0; j < categoryArray.length; j++) {
                                const solDestination = categoryArray[j];
                                if (planDestinations.includes(solDestination)) {
                                    continue;
                                }
                                if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                                    && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                                    planDestinations[i] = solDestination;
                                    console.log("Alter, from non-chosen categories, Destination", solDestination.name, "is saved");
                                    solved = 1;
                                    crntTime += solDestination.estimatedDuration.displayedDuration;
                                    break;
                                }
                            }
                        }
                        if (solved === 1) {
                            break;
                        }
                    }
                }
                if (solved === 0) {
                    planDestinations[i] = null;
                    planDestinations[i] = { name: "break;", time: 1 };
                    crntTime += 1;
                }
            }
        }
        return planDestinations;
    }

    static async enlargePlan(planDestinations, destinationsByCategory, touristCategories, startTime, endTime) {
        console.log("-------------------------------enlarge plan");
        var crntTime = convertTimeStringToDate(startTime).getHours();//holds time scrolling through plan destinations
        //shuffle places
        console.log("before shuffle");
        for (const destination of planDestinations) {
            console.log("--------------------------", destination.name);
        }
        planDestinations = lodash.shuffle(planDestinations);
        console.log("after shuffle");
        for (const destination of planDestinations) {
            console.log("--------------------------", destination.name);
        }
        //check timings for each place
        for (let i = 0; i < planDestinations.length; i++) {
            const destination = planDestinations[i];
            if (crntTime >= convertTimeStringToDate(destination.workingHours.openingTime).getHours()
                && crntTime + destination.estimatedDuration.displayedDuration <= convertTimeStringToDate(destination.workingHours.closingTime).getHours()) {
                crntTime += destination.estimatedDuration.displayedDuration;
                console.log("Destination", destination.name, "is saved");
            } else {
                let solved = 0;
                //if problem, find a successor that works from the plan
                console.log("Destiantion", destination.name, "isn't open at", crntTime);
                for (let j = i; j < planDestinations.length; j++) {
                    const solDestination = planDestinations[j];
                    if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                        && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                        planDestinations[i] = solDestination;
                        planDestinations[j] = destination;
                        console.log("Alter, from plan, Destination", solDestination.name, "is saved");
                        solved = 1;
                        crntTime += solDestination.estimatedDuration.displayedDuration;
                        break;
                    }
                }
                //if not found, check from its category
                if (solved === 0) {
                    for (let j = 0; j < destinationsByCategory[destination.category].length; j++) {
                        const solDestination = destinationsByCategory[destination.category][j];
                        if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                            && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                            if (planDestinations.includes(solDestination)) {
                                continue;
                            }
                            planDestinations[i] = solDestination;
                            console.log("Alter, from category, Destination", solDestination.name, "is saved");
                            solved = 1;
                            crntTime += solDestination.estimatedDuration.displayedDuration;
                            break;
                        }
                    }
                }
                //if still, choose from other categories
                if (solved === 0) {
                    for (const category in destinationsByCategory) {
                        if (touristCategories.includes(category)) {
                            const categoryArray = destinationsByCategory[category];
                            for (let j = 0; j < categoryArray.length; j++) {
                                const solDestination = categoryArray[j];
                                if (planDestinations.includes(solDestination)) {
                                    continue;
                                }
                                if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                                    && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                                    planDestinations[i] = solDestination;
                                    console.log("Alter, from chosen categories, Destination", solDestination.name, "is saved");
                                    solved = 1;
                                    crntTime += solDestination.estimatedDuration.displayedDuration;
                                    break;
                                }
                            }
                        }
                        if (solved === 1) {
                            break;
                        }
                    }
                }
                if (solved === 0) {
                    for (const category in destinationsByCategory) {
                        if (!touristCategories.includes(category)) {
                            const categoryArray = destinationsByCategory[category];
                            for (let j = 0; j < categoryArray.length; j++) {
                                const solDestination = categoryArray[j];
                                if (planDestinations.includes(solDestination)) {
                                    continue;
                                }
                                if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                                    && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                                    planDestinations[i] = solDestination;
                                    console.log("Alter, from non-chosen categories, Destination", solDestination.name, "is saved");
                                    solved = 1;
                                    crntTime += solDestination.estimatedDuration.displayedDuration;
                                    break;
                                }
                            }
                        }
                        if (solved === 1) {
                            break;
                        }
                    }
                }
                if (solved === 0) {
                    planDestinations[i] = null;
                    planDestinations[i] = { name: "break;", time: 1 };
                    crntTime += 1;
                }
            }
        }
        // destinationsByCategory = lodash.shuffle(destinationsByCategory);
        const categoryNames = Object.keys(destinationsByCategory);

        // Shuffle the category names
        for (let i = categoryNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [categoryNames[i], categoryNames[j]] = [categoryNames[j], categoryNames[i]];
        }
        console.log("----------------------------------------------", crntTime);
        for (const categoryName of categoryNames) {
            console.log(destinationsByCategory[categoryName].length);
            for (let j = 0; j < destinationsByCategory[categoryName].length; j++) {
                const solDestination = destinationsByCategory[categoryName][j];
                if (planDestinations.includes(solDestination)) {
                    continue;
                }
                if (crntTime >= convertTimeStringToDate(solDestination.workingHours.openingTime).getHours()
                    && crntTime + solDestination.estimatedDuration.displayedDuration <= convertTimeStringToDate(solDestination.workingHours.closingTime).getHours()) {
                    crntTime += solDestination.estimatedDuration.displayedDuration;
                    planDestinations.push(solDestination);
                }
                if (crntTime < convertTimeStringToDate(endTime).getHours()) {
                    return planDestinations;
                }
            }
        }
        return planDestinations;
    }
}

module.exports = PlanService;  