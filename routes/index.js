const express = require("express"),
	  router  = express.Router(),
	  passport = require("passport"),
	  middleware = require("../middleware"),
	  Campground = require("../models/campground"),
	  User = require("../models/user"),
	  aSync = require("async"),
	  nodemailer = require("nodemailer"),
	  crypto = require("crypto");
	  

// ROOT ROUTE - Landing/Home Page
router.get('/', (req, res) => {
  res.render('landing');
});




// =====================
// AUTH ROUTES
// =====================

// Register Route
router.get('/register', (req, res) => {
   res.render("register", {page: 'register'}); 
});

// Sign Up Logic Route
//handle sign up logic
router.post("/register", function(req, res){
	let newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
		
	});
	if(req.body.adminCode === process.env.ADMIN_CODE){
		newUser.isAdmin = true;
	}
    User.register(newUser, req.body.password, function(err, user){
	
        if(err && err.code == null ){
			 console.log(err);
            return res.render("register", {error: err.message});
            console.log(err.code);
            return res.render("register", {error: "A user with the given email is already registered"});
        }if (err && err.code == 11000) {
            console.log(err.code);
            return res.render("register", {error: "A user with the given email is already registered"});
        } 
       	 passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds");
        });
    });
});

// LOGIN ROUTE
router.get("/login", (req, res) => {
	res.render("login", {page: 'login'});
});


// LOGIN ROUTE LOGIC
router.post("/login",passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login",
	failureFlash: true,
    successFlash: 'Welcome to YelpCamp!'
}) ,(req, res) => {
	
});

// LOGOUT ROUTE
router.get("/logout", (req,res) => {
	req.logout();
	req.flash("success", "You Logged Out!");
	res.redirect("/campgrounds");
});

// FORGOT ROUTE
router.get("/forgot", (req, res) => {
	res.render('forgot');
})

// Forgot POST
router.post('/forgot', function(req, res, next) {
  aSync.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
          host: "smtp-mail.outlook.com", // hostname
    	  secureConnection: false, // TLS requires secureConnection to be false
    	  port: 587, // port for secure SMTP
    	  tls: {
       		ciphers:'SSLv3'
    	},
        auth: {
          user: 'david.asal@hotmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'david.asal@hotmail.com',
        subject: 'CampGrounds Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// RESET ROUTE
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

// RESET POT ROUTE
router.post('/reset/:token', function(req, res) {
  aSync.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
          host: "smtp-mail.outlook.com", // hostname
    	  secureConnection: false, // TLS requires secureConnection to be false
    	  port: 587, // port for secure SMTP
    	  tls: {
       		ciphers:'SSLv3'
    	},
        auth: {
          user: 'david.asal@hotmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'david.asal@hotmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});


// USER PROFILES

router.get("/profile/:id", (req, res) => {
	User.findById(req.params.id, (err, foundUser) => {
		if(err) {
			req.flash("error", "Something went wrong");
			res.redirect("/campgrounds");
		} 
		Campground.find().where('author.id').equals(foundUser._id).exec((err, campgrounds) => {
			if(err) {
			req.flash("error", "Something went wrong");
			res.redirect("/campgrounds");
		} 
			res.render("profiles/show", {user: foundUser, campgrounds: campgrounds} );
		})	
	});
});

module.exports = router;