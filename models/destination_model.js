const db = require("../config/db");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const destinationSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    activityList: [
        {
            title: {
                type: String,
            },
            description: {
                type: String,
            },
        },
    ],
    location: {
        longitude: {
            type: String,
        },
        latitude: {
            type: String,
        },
        address: {
            type: String,
        },
    },
    images: {
        mainImage: {
            type: String
        },
        descriptiveImages: [
            {
                type: String
            },
        ],
        pendingImages: [
            {
                email: {
                    type: String,
                },
                date: {
                    type: String,
                },
                keywords: [
                    {
                        type: String,
                    },
                ],
                images: [
                    {
                        type: String,
                    },
                ],
                status: {
                    type: String,
                },
            },
        ],
    },
    category: {
        type: String,
    },
    services: [
        {
            name: {
                type: String,
            },
        }
    ],
    reviews: [
        {
            user: {
                firstName: {
                    type: String,
                },
                lastName: {
                    type: String,
                },
                email: {
                    type: String,
                },
            },
            date: {
                type: String,
            },
            stars: {
                type: Number,
            },
            title: {
                type: String,
            },
            feedback: {
                type: String,
            },
        },
    ],
    geotags: {
        type: [String],
        default: [],
    },
    rating: {
        oneStar: {
            type: Number,
            default: 0,
        },
        twoStars: {
            type: Number,
            default: 0,
        },
        threeStars: {
            type: Number,
            default: 0,
        },
        fourStars: {
            type: Number,
            default: 0,
        },
        fiveStars: {
            type: Number,
            default: 0,
        },
    },
    contact: {
        type: String,
    },
    budget: {
        type: String,//based on front
    },
    workingHours: {
        openingTime: {
            type: String,
        },
        closingTime: {
            type: String,
        },
        workingdays: [
            {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

            },
        ],
    },
    estimatedDuration: {
        displayedDuration: {
            type: Number,
        },
        numberOfSuggestions: {
            type: Number,
            default: 0,
        },
        sumOfSuggestions: {
            type: Number,
            default: 0,
        },
    },
    visitorsType: [
        {
            type: String,
        },
    ],
    ageCategory: [
        {
            type: String,
        },
    ],
    sheltered: {
        type: String,
    },
    viewedTimes: {
        type: Number,
        default: 0,
    },
    complaints: [
        {
            email: {
                type: String,
            },
            images: [
                {
                    type: String,
                },
            ],
            date: {
                type: String,
            },
            title: {
                type: String,
            },
            complaint: {
                type: String,
            },
            seen: {
                type: String,
            },
            hidden: {
                type: String,
            },
        },
    ],
    addedBy: {
        type: String,
    },
    date: {
        type: String,
    },
    virtualTourLink: {
        type: String,
    },
});

const DestinationModel = db.model("destinations", destinationSchema);
module.exports = DestinationModel;