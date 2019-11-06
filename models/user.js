const mongoose = require("mongoose"),
	passportLocalMongoose	= require("passport-local-mongoose"),
	  bcrypt = require('bcrypt-nodejs');

let userSchema = new mongoose.Schema({
	username: { type: String,
			  	unique: true, 
			   	required: true
			  },
	password: String,
	avatar: String,
	firstName: String,
	email: {type: String,
			unique: true, 
			required: true
			  },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	lastName: String,
	isAdmin: {
		type: Boolean, 
		default: false
	}
});

userSchema.plugin(passportLocalMongoose);

let User = mongoose.model("User", userSchema);

module.exports = User;