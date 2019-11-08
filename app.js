// Init Dependencies
require('dotenv').config();
const 	express 		= require('express'),
 		app				= express(),
		bodyParser 		= require('body-parser'),
 		nodemon 		= require('nodemon'),
 		mongoose 		= require("mongoose"),
	  	flash			= require("connect-flash"),
	  	passport		= require("passport"),
	  	localStrategy	= require("passport-local"),
	  	methodOverride	= require("method-override"),
// Init Models
		Campground  	= require("./models/campground"),
	  	Comment 		= require("./models/comment"),
	  	Review			= require("./models/review"),
	  	User			= require("./models/user"),
	  	seedDB     		= require("./models/seeds");
// Init Routes
const campgroundRoutes = require("./routes/campgrounds"),
	  reviewRoutes     = require("./routes/review"),
	  commentRoutes	   = require("./routes/comments"),
	  indexRoutes	   = require("./routes/index"),
// 	  HOST AND POST
	  host = '0.0.0.0',
	  port = process.env.PORT || 3000,
// ENV PASSWORDS AND STABLE + DEVELOPMENT VARAIBLES
	  dbPassword = process.env.DBATLAS_PASSWORD,
	  development = process.env.DEVELOPMENT,
	  stable = 'mongodb+srv://deivit24:'+ dbPassword +'@campgrounds-1xlja.mongodb.net/test?retryWrites=true&w=majority';


// Create MongoDB + Mongoose Database 
mongoose.set('useFindAndModify', false);
mongoose.connect(development, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true

}).then(() => {
	console.log("Connected ")
}).catch(err => {
	console.log('ERROR:', err.message );
})

// mongodb+srv://deivit24:<password>@campgrounds-1xlja.mongodb.net/test?retryWrites=true&w=majority

// Use Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// Setting view engine for ejs
app.set('view engine', 'ejs');

// Lik Public Directory
app.use(express.static(__dirname + "/public"));

// Use the seed DB
// seedDB();

// USE METHOD OVERRIDE
app.use(methodOverride("_method"));

//Use EXPRESS SESSION
app.use(require("express-session")({
	secret: "cat > dog",
	resave: false,
	saveUninitialized: false
}));
// CONNECT FLASH
app.use(flash());

app.locals.moment = require("moment");
// PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// USER Current User Everywhere
app.use(function(req,res,next) {
	res.locals.currentUser = req.user;
	res.locals.error =  req.flash("error");
	res.locals.success =  req.flash("success");
	next();
})

// USE ROUTES
app.use(indexRoutes);
app.use(commentRoutes);
app.use(reviewRoutes);
app.use(campgroundRoutes);

// Listening to port 3000
app.listen(port, host, () => {
	console.log('Listening');
});
