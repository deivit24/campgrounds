const express = require("express"),
	  router  = express.Router(),
	  Campground = require("../models/campground"),
	  middleware = require("../middleware"),
	  Comment = require("../models/comment");

// ===================================
// COMMENTS ROUTES
// ===================================

// Comments New
router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn ,(req,res) => {
// 	find campground by id
	Campground.findById(req.params.id, (err, campground) => {
		if(err){
			console.log(err);
		}else {
			
			res.render("comments/new", {campground: campground});
		}
	});
	
});

// Comments Create
router.post("/campgrounds/:id/comments",middleware.isLoggedIn ,(req, res) => {
	let id = req.params.id;
	Campground.findById(id, (err, campground) => {
		if(err) {
			console.log(err);
			res.redirect("/campgrounds");
		}else {
			let com = req.body.comment;
			Comment.create(com, (err, comment) => {
				if(err) {
					console.log(err);
				}else{
				// add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					
// 					save the comment
					comment.save();
				  campground.comments.push(comment);
               	  campground.save();
				req.flash("success", "Successfully added comment");
               	  res.redirect('/campgrounds/' + campground._id);
				}
			});
		}
	});
});

// EDIT ROUTE FOR COMMENTS
router.get("/campgrounds/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,(req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		if(err || !foundCampground) {
			req.flash("error", "No campground found");
			return res.redirect("back")
		}	Comment.findById(req.params.comment_id, (err, foundComment) => {
		if(err){
			res.redirect("back")
		}else {
			res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});	
		}
		});
		
	});
});


// UPDATE ROUTE
router.put("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership, (req, res) => {
// 	find and updating
	
	
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedCamp) => {
		if(err) {
			res.redirect("back")
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
});

// COMMENT DELETE/DESTROY ROUTE
router.delete("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err) => {
		if(err){
			res.redirect("back");
		} else {
			req.flash("success", "Comment Deleted")
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})



module.exports = router;