const mongoose = require("mongoose"),
	  Comment = require("./comment"),
	  Review = require("./review");
// SCHEMA SETUP

let campgroundSchema = new mongoose.Schema({
	name: String,
	image: String,
	imageID: String,
	description: String,
	price: String,
    location: String,
	createdAt: { type: Date, default: Date.now },
    lat: Number,
    lng: Number,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
			username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});



module.exports = mongoose.model("Campground", campgroundSchema);