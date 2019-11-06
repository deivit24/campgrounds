const express = require("express"),
	  router  = express.Router(),
	  Campground = require("../models/campground"),
	  Review = require("../models/review")
	  middleware = require("../middleware"),
	  NodeGeocoder = require('node-geocoder');
// 	  multer = require('multer');

// let storage = multer.diskStorage({
//   filename: function(req, file, callback) {
//     callback(null, Date.now() + file.originalname);
//   }
// });
// let imageFilter = function (req, file, cb) {
//     // accept image files only
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
//         return cb(new Error('Only image files are allowed!'), false);
//     }
//     cb(null, true);
// };
// let upload = multer({ storage: storage, fileFilter: imageFilter})

// let cloudinary = require('cloudinary');
// cloudinary.config({ 
//   cloud_name: 'dptksyqdf', 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });
 
let options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
let geocoder = NodeGeocoder(options);

// INDEX : Campgrounds page

router.get('/campgrounds', (req, res) => {
	    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
 
});

// Creating/Posting New Campgrounds

router.post("/campgrounds", middleware.isLoggedIn,  function(req, res){
	 
  // get data from form and add to campgrounds array
  let name = req.body.name;
  let image = req.body.image;
  let desc = req.body.description;
  let price = req.body.price;
  let author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
	   // 	  
    if (err || !data.length) {
		
      req.flash('error', 'Invalid address');
	console.log(err);
      return res.redirect('back');
    }
    let lat = data[0].latitude;
    let lng = data[0].longitude;
    let location = data[0].formattedAddress;
    let newCampground = {name: name, image: image, description: desc, price: price, author:author, location: location, lat: lat, lng: lng};

	  
// 	  
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
	
  });
});



// new form campgrounds
router.get('/campgrounds/new',middleware.isLoggedIn, (req, res) => {
  res.render('campgrounds/new');
});

// SHOW more info campgrounds
router.get("/campgrounds/:id", (req, res) => {
// 	find campgrounds with id
		Campground.findById(req.params.id).populate("comments").populate({
			path: "reviews",
			options: {sort: {createdAt: -1}}
		}).exec( (err, foundCampgrounds) =>{
			if(err || !foundCampgrounds) {
				req.flash("error", "Campground Not Found");
				res.redirect("back")
				
			} else {
				
// 				render templates with that campground
				res.render("campgrounds/show", {campgrounds: foundCampgrounds});
			}
		});
		
});

// EDIT ROUTE
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership ,(req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		res.render("campgrounds/edit", {campground: foundCampground});			
	});	
});
// UPDATE ROUTE
router.put("/campgrounds/:id",middleware.checkCampgroundOwnership, (req, res) => {
// 	find and updating
geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DELETE/DESTROY ROUTE
router.delete("/campgrounds/:id" ,middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findByIdAndRemove(req.params.id, (err) => {
		if(err){
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds");
		}
	})
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;