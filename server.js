fs = require('fs');
path = require('path');
var bodyParser  = require('body-parser');
var express = require('express');
var app = express();
var formidable = require('formidable');
var util = require('util');
var fs = require('fs-extra');
var multer = require('multer');

var upload = multer({
  dest: __dirname + '/public/uploads/'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');

/* Configuration settings */
app.use(express.static(path.join(__dirname, '/public'), {
    index: false
}));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

// MIDDLEWARE FUNCTION
app.use(function (req, res, next) {
    console.log("middleware");
    next();
});

// HOME
app.get('/', function(req, res) {
    res.render('index.html');
    console.log('root');
});

/* Creating the Schema */
var Schema = mongoose.Schema;

var SessionSchemas = new Schema();
var ListingSchemas = new Schema();
var PostSchemas = new Schema();
var UserSchemas = new Schema();
var CommentSchemas = new Schema();
var ReplySchemas = new Schema();
var ReviewSchemas = new Schema();
var MessageSchemas = new Schema();

SessionSchemas = new Schema({
  date     : Date,
  ipaddr      : String,
  geolocation      : {lat: Number, lng: Number},
  useragent: String,
  viewingdevice: String
});

ListingSchemas = new Schema ({
  _id: {type: String, required: true},
  datePosted: Date,
  description: String,
  mainPicture: String,
  morePictures: [String],
  owner: UserSchemas,
  title: String,
  profilepic: Number //1 if it is, 0 if not
});


PostSchemas = new Schema({  //posts are posted to a group or user
  userID: Number,
  message: String,
  dateCreated: Date,
  likes: [UserSchemas],
  links: [String],
  shares: [UserSchemas],
  comments: [CommentSchemas],
  tags: {}
});


MessageSchemas = new Schema({
	sender: {
		_id: Schema.Types.ObjectId,
		displayname: String,
		email: String 
		},
	receiver: {
		_id: Schema.Types.ObjectId,
		displayname: String,
		email: String 
		},
	dateCreated: Date,
	content: String,
	request: Boolean,
	reply: Boolean,
	unread: Boolean
});

UserSchemas = new Schema({
    email: String,
    password: String,
    description: String, default : "",
    profileimage: String, default : "default_profile_large.jpg",
    gallery: [ListingSchemas],
    displayname: String, default: "",
    type: String, default: "",
    userbehaviour:
    { allcount: Number, default: 0,
      specificcount: Number, default: 0,
      deletecount: Number, default: 0,
      addcount: Number, default: 0,
      updatecount: Number, default:0,
      behaviourcount: Number, default:0,
      sessioninfo: [SessionSchemas]
    },
    tags: {},
	posts: [PostSchemas],
	inbox: [MessageSchemas],
	outbox: [MessageSchemas],
	newMessage: {type: Number, default: 0}
});

CommentSchemas = new Schema({
	userID: Number,
	message: String,
	dateCreated: Date,
	likes: [UserSchemas],
	links: [String],
	replies: [ReplySchemas]
});

ReplySchemas = new Schema({
	userID: Number,
	message: String,
	dateCreated: Date,
	likes: [UserSchemas],
	links: [String]
});

ReviewSchemas = new Schema({
	userID: Number,
	content: String,
	dateCreated: Date,
	rating: Number, //It is a number in decimals between 0 and 10. Note this is a 100 point system.
	likes: [UserSchemas],
	links: [String],
	shares: [UserSchemas],
	comments: [CommentSchemas]
});



var UserModel = mongoose.model('UserSchema', UserSchemas);
var ListingModel = mongoose.model('ListingSchema', ListingSchemas);
var PostModel = mongoose.model('PostSchema', PostSchemas);
var CommentModel = mongoose.model('CommentSchema', CommentSchemas);
var ReplyModel = mongoose.model('ReplySchema', ReplySchemas);
var ReviewModel = mongoose.model('ReviewSchema', ReviewSchemas);
//var MessageModel = mongoose.model('MessageSchema', MessageSchemas);

function createComment(currentUser, newMessage, target) {
	/*
	currentUser refers to the authenticated user.
	target is either a post, review, or artwork
	*/
	var comment = new CommentModel({
		//user: currentUser,
		message: newMessage,
		dateCreated: Date.now()
	});
	var Links = /(https?:\/\/[^\s]+)/g.exec(comment.message);
	for (i = 0; i < Links.length; i++) {
		comment.links.push(Links[i]);
	}
	target.comments.push(comment);
}

function replyToComment(currentUser, newMessage, comment) {
	var reply = new ReplyModel({
		//user: currentUser,
		message: newMessage,
		dateCreated: Date.now()
	});
	var Links = /(https?:\/\/[^\s]+)/g.exec(reply.message);
	for (i = 0; i < Links.length; i++) {
		reply.links.push(Links[i]);
	}
	comment.replies.push(reply);
}

function likesCount(comment) {
	return comment.likes.length;
}

function sharesCount(comment) {
	return comment.shares.length;
}

function sortComments(condition, target) {
	var newArray = [];
	for (i = 0; i < target.comments; i++){
		newArray.push(target.comments[i]);
	}
	if (condition == "Newest") {
		return newArray;
	}
	else if (condition == "Oldest") {
		return newArray.reverse();
	}
	else if (condition == "Best") {
		return newArray.sort(function(a, b){return likesCount(a) - likesCount(b)});
	}
	else { //condition == "Worst"
		return newArray.sort(function(a, b){return likesCount(a) - likesCount(b)}).reverse();
	}
}

//Add a new tag for searching purposes to a specified user
function addNewTagToUser(tag, user) {
  user.tags[tag] = true;
  user.markModified('tags');
  console.log(user.tags);
}

//Add a new tag for searching purposes to a specified user
function addNewTagToArt(tag, art) {
  art.tags[tag] = true;
  art.markModified('tags');
}

app.post('/test/addtag', function (req, res) {
  return UserModel.find(function (err, users) {
    for(var i = 0; i < users.length; i++) {
      addNewTagToUser("two", users[i]);
      users[i].save();
      //for(var j = 0; j < users.length; j++) {
        //addNewTagToArt(i, users[i].posts[j]);
      //}
    }
    return res.send(users[i-1].tags);
  });
});

app.get('/search/:tag', function (req, res) {
  var results = [];
  return UserModel.find(function(err, users) {
    console.log(users.length);
    for(var i = 0; i < users.length; i++) {

      if(users[i].tags[req.params.tag]) {
        console.log(users[i].tags);
        console.log(users[i].tags[req.params.tag]);
        results.push(users[i]);
      }
      //for(var j = 0; j < users[i].posts.length; j++) {
        //if(users[i].posts[j].tags.tag) {
          //results.push(users[i].posts[j]);
        //}
      //}
    }
    if (!err) {
      console.log(results);
      return res.send(results);
    } else {
      return console.log(err);
    }
  });
});


/* CURD requests */

// GET ALL USERS
app.get('/users/all/:emailaddcount', function (req, res){
  return UserModel.find(function (err, users) {
    UserModel.findOne({email: req.params.emailaddcount}, function (err, useradd) {
      useradd.userbehaviour.allcount += 1;
      useradd.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added allcount 1");
        }
      });
    });
    if (!err) {
      return res.send(users);
    } else {
      return console.log(err);
    }
  });
});

app.get('/users/behaviour/:emailaddcount', function (req, res){
  return UserModel.find(function (err, users) {
    UserModel.findOne({email: req.params.emailaddcount}, function (err, useradd) {
      useradd.userbehaviour.behaviourcount += 1;
      useradd.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added behaviourcount 1");
        }
      });
    });

    if (!err) {
      var allusers = [];
      for (var i = 0; i < users.length; i++) {
        allusers.push({email: users[i].email, behaviour: users[i].userbehaviour});
      }
      return res.send(allusers);
    } else {
      return console.log(err);
    }
  });
});

// CREATE USER
app.post('/users', function (req, res){
  var device;
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(req.headers['user-agent']) ) {
      device = "Mobile";
    } else {
      device = "Desktop";
    }

  var userType;
  UserModel.count({}, function(err, count) {
    if(err) return handleError(err);

    // SET USER TYPE (SUPERADMIN IF FIRST USER)
    if (count===0) {
      userType = "superadmin";
    } else {
      userType = "regular";
    }

    console.log(req.body);
    // SET FIRST SESSION INFO
    var session = {};
    session.date = Date.now();
    session.ipaddr = req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
    session.useragent = req.headers['user-agent'];
    session.geolocation = {lat : req.body.geolocationlat, lng: req.body.geolocationlng};
    session.viewingdevice = device;

    var user;
    console.log("POST: ");

    user = new UserModel({
      email: req.body.email,
      password: req.body.password,
      description: "",
      displayname: "",
      type: userType,
      profileimage: "default_profile_large.jpg",
      userbehaviour: { allcount: 0,
        specificcount: 0,
        deletecount: 0,
        addcount: 1,
        updatecount: 0,
        behaviourcount: 0
      },
      tags: { na:false }
    });

    user.userbehaviour.sessioninfo.push(session);

    user.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("created");
      }
    });
    return res.send(user);

  });

});

app.post('/users/uploadprofile', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    res.redirect("/");
  });

  form.on('end', function(fields, files) {
    var temp_path = this.openedFiles[0].path;
    var file_name = this.openedFiles[0].name;
    var new_location = './uploads/';
    fs.copy(temp_path, new_location + file_name, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("success!");
      }
    });
  });
});

// Get a user model by an id
app.get('/users/:user_id', function(req, res) {
	UserModel.findOne({ _id: req.params.user_id }, function (err, user) {
		if (err) {
			console.log(err);
			return handleError(err);
		}
		res.send(user);
	});
});

// Create (Send) a message
app.put('/users/messages/send', function (req, res) {
	console.log(req.body);
	console.log(">>>>>>>>>>>>>>");
	
	//console.log(req.body.from[_id]);
	UserModel.findOne({ _id: req.body.from}, function (err, senderUser) {
		if (err) {
			console.log(err);
			return handleError(err);
		}
		UserModel.findOne({ _id: req.body.to}, function (err, receiverUser) {
			if (err) {
				console.log(err);
				return handleError(err);
			}
			var tempMessage = {
				sender: {
					_id: senderUser._id,
					displayname: senderUser.displayname,
					email: senderUser.email
				},
				receiver: {
					_id: receiverUser._id,
					displayname: receiverUser.displayname,
					email: receiverUser.email
				},
				dateCreated: new Date(),
				content: req.body.content,
				request: req.body.request,
				reply: req.body.reply,
				unread: true
			}
			console.log(tempMessage);
			console.log(senderUser.displayname);
			console.log(receiverUser.displayname);
			console.log(">>>>>>>>>>>>>>");
			senderUser.outbox.unshift(tempMessage);
			senderUser.save(function (err) {
				if (err) {
					console.log("Saving 'from' error: "+ err);
				}
			});
			receiverUser.inbox.unshift(tempMessage);
			receiverUser.newMessage += 1;
			receiverUser.save(function (err) {
				if (err) {
					console.log("Saving 'to' error: "+ err);
				}
			});
		});
	});
	res.sendStatus(200);
});

app.get('/users/messages/:mailbox/:user_id', function (req, res) {
	var mailbox = req.params.mailbox;
	var projection = {};
	projection[mailbox] = 1;
	UserModel.findOne({_id: req.params.user_id}, projection, function (err, data){
		if (err) {
			console.log(err);
			return handleError(err);
		}
		console.log(data);
		console.log(mailbox);
		res.send(data[mailbox]);
	});
});

app.put('/users/messages/updateStatus', function (req, res) {
	UserModel.findOne({_id: req.body.user}, function (err, user) {
		if (err) {
			console.log(err);
			return handleError(err);
		}
		user.inbox.id(req.body.message).unread = false;
		console.log(user.inbox);
		user.save(function (err) {
			if (err) {
				console.log("Update message status error.");
			}
		});
	});
	res.sendStatus(200);
});

// VERIFY EMAIL LOGIN
app.get('/users/verify-email/login/:email/:loc', function (req, res){
  var device;
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(req.headers['user-agent']) ) {
      device = "Mobile";
    } else {
      device = "Desktop";
    }


  return UserModel.findOne({ email: req.params.email }, function (err, user) {
    if (!err) {
      if (user) {
        var location = [];
        location = req.params.loc.split("&");
        console.log(location);

      var session = {};
      session.date = Date.now();
      session.ipaddr = req.headers['x-forwarded-for'] ||
       req.connection.remoteAddress ||
       req.socket.remoteAddress ||
       req.connection.socket.remoteAddress;
       //console.log(session.ipaddr);
      session.useragent = req.headers['user-agent'];
      session.geolocation = {lat : location[0], lng: location[1]};
      session.viewingdevice = device;

      user.userbehaviour.sessioninfo.push(session);

      user.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added session");
        }
      });
    }

      return res.send(user);
    } else {
      return console.log(err);
    }
  });
});

// VERIFY EMAIL
app.get('/users/verify-email/:email/:emailaddcount', function (req, res){
  return UserModel.findOne({ email: req.params.email }, function (err, user) {
    if (req.params.emailaddcount != "none") {
      UserModel.findOne({email: req.params.emailaddcount}, function (err, useradd) {
        useradd.userbehaviour.specificcount += 1;
        useradd.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("added specificcount 1");
          }
        });
      });
    }

    if (!err) {
      return res.send(user);
    } else {
      return console.log(err);
    }
  });
});

// UPDATE USER INFORMATION
app.put('/users/update/:email/:emailaddcount', function (req, res){
  return UserModel.findOne({ email: req.params.email }, function (err, user) {
    UserModel.findOne({email: req.params.emailaddcount}, function (err, useradd) {
      useradd.userbehaviour.updatecount += 1;
      useradd.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added updatecount 1");
        }
      });
    });

    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    //if (req.body.profileimage) user.profileimage = req.body.profileimage.data;
    if (req.body.description) {
      user.description = req.body.description;
    } else {
      user.description = "";
    }
    if (req.body.displayname) {
      user.displayname = req.body.displayname;
    } else {
      user.displayname = "";
    }

    if (req.body.type) {
      user.type = req.body.type;
    }

    return user.save(function (err) {
      if (!err) {
        console.log("updated");
      } else {
        console.log(err);
      }
      return res.send(user);
    });
  });
});

// DELETE USER
app.delete('/users/:id/:emailaddcount', function (req, res){
  return UserModel.findOne({ _id: req.params.id }, function (err, user) {
    UserModel.findOne({email: req.params.emailaddcount}, function (err, useradd) {
      useradd.userbehaviour.deletecount += 1;
      useradd.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added deletecount 1");
        }
      });
    });

    return user.remove(function (err) {
      if (!err) {
        console.log("removed");
        console.log(req.params.curremail);
        return res.send('');
      } else {
        console.log(err);
      }
    });
  });
});


//upload the file

app.post('/uploadimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo");

  //var target_path = __dirname + '/public/uploads/';
  return UserModel.findOne({ _id: req.params.id }, function (err, user) {

    var listing = {};
    listing._id = mongoose.Types.ObjectId();
    listing.datePosted = Date.now();
    listing.description = "";
    listing.mainPicture = req.body.name;
    listing.owner = user;
    listing.title = "Listing";
    listing.profilepic = 0;

    user.gallery.push(listing);

    return user.save(function (err) {
      if (!err) {
        console.log(listing._id);
        console.log("added listing");
        list = new ListingModel({
          datePosted: listing.datePosted,
          description: listing.description,
          mainPicture: listing.mainPicture,
          owner: listing.owner,
          title: listing.title,
          profilepic: listing.profilepic,
          _id: listing._id
        });
        console.log(list._id);
        list.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("created listing");
          }
        });

      } else {
        console.log(err);
      }
      return res.send(user);
    });
  });
});

app.post('/uploadlistingimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo");

  //var target_path = __dirname + '/public/uploads/';
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {

    var filelistingname = req.body.name;

    listing.morePictures.push(filelistingname);

    return listing.save(function (err) {
      if (!err) {
        console.log(listing._id);
      } else {
        console.log(err);
      }
      return res.send(listing);
    });
  });
});

app.post('/uploadmainlistingimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo2");
  //var target_path = __dirname + '/public/uploads/';
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {

    listing.mainPicture = req.body.name;

    return listing.save(function (err) {
      if (!err) {
        console.log("updated main listing image");
      } else {
        console.log(err);
      }
      return res.send(listing);
    });
  });
  return res.send("sent");
});


app.post('/uploadprofileimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo2");
  //var target_path = __dirname + '/public/uploads/';
  return UserModel.findOne({ _id: req.params.id }, function (err, user) {

  //it will add to listingmodel without deleting tho
    list = new ListingModel({
      datePosted: Date.now(),
      description: "",
      mainPicture: req.body.name,
      owner: user,
      title: "Listing",
      profilepic: 1,
      _id: mongoose.Types.ObjectId()
    });
    //console.log(list._id);
    list.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("created listing");
      }
    });

    user.profileimage = req.body.name;

    return user.save(function (err) {
      if (!err) {
        console.log("updated profile image");
      } else {
        console.log(err);
      }
      return res.send(user);
    });
  });
  return res.send("sent");
});

app.post('/uploadimage', upload.single('file'), function (req, res) {
  console.log("in upload image\n");
  console.log(req.file);
  return res.send(req.file);
});

//get listing
app.get('/listing/:id', function (req, res){
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {
    if (!err) {
      return res.send(listing);
    } else {
      return console.log(err);
    }
  });
});

//get listing by filename
app.get('/listingbyname/:name', function (req, res){
  return ListingModel.findOne({ mainPicture : req.params.name }, function (err, listing) {
    if (!err) {
      return res.send(listing);
    } else {
      return console.log(err);
    }
  });
});

//
// //  get the file
// app.get('/uploads/images/:file', function (req, res) {
//   file = req.params.file;
//   var img = fs.readFileSync(__dirname + "/uploads/images/" + file);
//   res.writeHead(200, {'Content-Type': 'image/jpg' });
// 	res.end(img, 'binary');
// });


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
