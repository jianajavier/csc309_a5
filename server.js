fs = require('fs');
path = require('path');
var bodyParser  = require('body-parser');
var express = require('express');
var app = express();
var util = require('util');
var multer = require('multer');
var request = require('request');
var passwordHash = require('password-hash');
var crypto = require('crypto');

var upload = multer({
  dest: __dirname + '/public/uploads/'
});

var adminLogin = {'username': 'admin', 'password': 'admin'};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var mongoose   = require('mongoose');
mongoose.connect('mongodb://bron:pizza*bagels1@ds053190.mongolab.com:53190/heroku_b01vwltc');

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

app.get('/admin', function(req, res) {
    res.render('admin.html');
})

/* Creating the Schema */
var Schema = mongoose.Schema;

var SessionSchemas = new Schema();
var ListingSchemas = new Schema();
var PostSchemas = new Schema();
var UserSchemas = new Schema();
var CommentSchemas = new Schema();
var ReplySchemas = new Schema();
var ReviewSchemas = new Schema();
var RatingSchemas = new Schema();
var MessageSchemas = new Schema();

SessionSchemas = new Schema({
  date     : Date,
  ipaddr      : String,
  geolocation      : {lat: Number, lng: Number},
  useragent: String,
  viewingdevice: String
});

ReplySchemas = new Schema({
	creater: String, //User ID
	createrInfo: {}, //UserSchema
	message: String,
	dateCreated: Date,
	likes: [{}], // Users that liked this reply to comment
});

CommentSchemas = new Schema({
	creater: String, //User ID
	createrInfo: {}, //UserSchema
	message: String,
	dateCreated: Date,
	likes: [{}], // list of Users that liked this comment
	replies: [ReplySchemas]
});

ReviewSchemas = new Schema({
	creater: String, //User ID
	createrInfo: {}, //UserSchema
	content: String,
	dateCreated: Date,
	rating: Number, //It is a number in decimals between 0 and 10. Note this is a 100 point system.
	likes: [{}], // list of ID of Users that liked the review
	shares: [{}], // list of ID of Users that shared this review
	comments: [CommentSchemas]
});

ListingSchemas = new Schema ({
  _id: {type: String, required: true},
  datePosted: Date,
  description: String,
  mainPicture: String,
  morePictures: [String],
  owner: Schema.Types.ObjectId, //User ID
  title: String,
  profilepic: Number, //1 if it is, 0 if not
  comments: [CommentSchemas],
  reviews: [ReviewSchemas],
  tags: {}
});


PostSchemas = new Schema({  //posts are posted to a group or user
  creater: String, //User ID
  createrInfo: {}, //UserSchema
  message: String,
  dateCreated: Date,
  likes: [{}], // list of ID of Users that liked the review
  shares: [{}],
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
	item: {
		offer: {
			_id: String,
			title: String
		},
		interest: {
			_id: String,
			title: String
		},
	},
	reply: Boolean,
	unread: Boolean
});

UserSchemas = new Schema({
    email: String,
    password: String,
    googleId: String,
    description: String, default : "",
    profileimage: ListingSchemas,
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
	newMsgNum: {type: Number, default: 0}
});

var UserModel = mongoose.model('UserSchema', UserSchemas);
var ListingModel = mongoose.model('ListingSchema', ListingSchemas);
var PostModel = mongoose.model('PostSchema', PostSchemas);
var CommentModel = mongoose.model('CommentSchema', CommentSchemas);
var ReplyModel = mongoose.model('ReplySchema', ReplySchemas);
var ReviewModel = mongoose.model('ReviewSchema', ReviewSchemas);

var token;

function createComment(currentUser, newMessage, target) {
	/*
	currentUser refers to the authenticated user.
	target is either a post, review, or artwork
	*/
	var comment = new CommentModel({
		creater: currentUser._id,
		createrInfo: currentUser,
		message: newMessage,
		dateCreated: Date.now()
	});

	target.comments.push(comment);
	return comment;
}

function replyToComment(currentUser, newMessage, comment) {
	var reply = new ReplyModel({
		creater: currentUser._id,
		createrInfo: currentUser,
		message: newMessage,
		dateCreated: Date.now()
	});
	comment.replies.push(reply);
	return reply;
}

function likesCount(target) {
	return target.likes.length;
}

function sharesCount(target) {
	return target.shares.length;
}

function commentCount(target) {
	return target.comments.length;
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

app.get('/search/:tag', function (req, res) {
  var userResults = [];
  var postResults = [];
  var tags = req.params.tag.split(" ");
  return UserModel.find(function(err, users) {
    for(var i = 0; i < users.length; i++) {
      for(var j = 0; j < tags.length; j++) {
        if(users[i].tags[tags[j]]) {
          console.log(users[i].tags);
          userResults.push(users[i]);
          break;
        }
      }
      // for(var k = 0; k < users[i].gallery.length; k++) {
      //   for(var m = 0; m < tags.length; m++) {
      //     console.log("HERE");
      //     //console.log(users[i].gallery[k]);
      //     if(users[i].gallery[k].tags[tags[m]]) {
      //       postResults.push(users[i].gallery[k]);
      //     }
      //   }
      // }
    }
    ListingModel.find(function(err2,listings) {
      for (var i = 0; i < listings.length; i++) {
        for(var j = 0; j < tags.length; j++) {
          console.log("TAG: "+listings[i].tags[tags[j]]);
          if (listings[i].tags[tags[j]]) {
            console.log("GETTING HERE");
            postResults.push(listings[i]);
          }
        }
      }
      if (!err && !err2) {
        console.log([userResults, postResults]);
        var result = [userResults, postResults];
        res.send(result);
      } else {
        console.log(err);
      }

    });

  });
});

/* CURD requests */
// GET ALL USERS

app.get('/admin/verifylogin/:username', function(req, res) {
  if (req.params.username == adminLogin.username) {
    res.send({'password': adminLogin.password});
  }
});

app.get('/admin/all', function (req, res){
  return UserModel.find(function (err, users) {
    if (!err) {
      return res.send(users);
    } else {
      return console.log(err);
    }
  });
});


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
//GET USER BY ID
app.get('/getuser/:id', function (req, res){

  UserModel.findOne({_id: req.params.id}, function (err, user) {
    if (!err) {
      return res.send(user);
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

    listing = {};
    listing.datePosted = Date.now();
    listing.description = "";
    listing.mainPicture = "default_profile_large.jpg";
    //listing.owner = user._id,
    listing.title ="Listing"
    var displayname = req.body.email.split("@")[0];

    var hashedPassword = passwordHash.generate(req.body.password);

    user = new UserModel({
      email: req.body.email,
      password: hashedPassword,
      googleId: "",
      description: "",
      displayname: displayname,
      //profileimage: list,
      type: userType,
      userbehaviour: { allcount: 0,
        specificcount: 0,
        deletecount: 0,
        addcount: 1,
        updatecount: 0,
        behaviourcount: 0
      },
      tags: {}
    });

    user.tags[displayname] = true;

    console.log("USER ID"+user._id);
    listing = {};
    listing.datePosted = Date.now();
    listing.description = "";
    listing.mainPicture = "default_profile_large.jpg";
    listing.owner = user._id;
    listing.title ="Listing";
    listing.profilepic = 1;
    listing._id =mongoose.Types.ObjectId();


    list = new ListingModel({
      datePosted: listing.datePosted,
      description: listing.description,
      mainPicture: listing.mainPicture,
      owner: user._id,
      title: listing.title,
      profilepic: listing.profilepic,
      _id: listing._id,
      tags: { na: false }
    });
    list.save(function (err){
      if (err) {
        console.log("listing" + err);
      } else {
        console.log("created");
      }
    });

    user.gallery.push(listing);
    user.profileimage = listing;
    user.userbehaviour.sessioninfo.push(session);

    user.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("created");
      }
    });
    //SET TOKEN TO PROTECT AGAINST CSRF
    crypto.randomBytes(48, function(ex, buf) {
      var gentoken = buf.toString('hex');
      user.token = gentoken;
      token = gentoken;
    });

    return res.send(user);

  });

});

// Create (Send) a message
app.put('/users/messages/send', function (req, res) {
	console.log(req.body);
	console.log(">>>>>>>>>>>>>>");
console.log(req.body["item[offer]"]);
	//console.log(req.body.from[_id]);
	UserModel.findOne({ _id: req.body.from}, function (err1, senderUser) {
		if (err1) {
			console.log(err1);
			return handleError(err1);
		}
		UserModel.findOne({ _id: req.body.to}, function (err2, receiverUser) {
			if (err2) {
				console.log(err2);
				return handleError(err2);
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
				item: {
					offer: {
						_id: req.body["item[offer][_id]"],
						title: req.body["item[offer][title]"]
					},
					interest:{
						_id: req.body["item[interest][_id]"],
						title: req.body["item[interest][title]"]
					}
				},
				reply: req.body.reply,
				unread: true
			}
			console.log(tempMessage);
			console.log(senderUser.displayname);
			console.log(receiverUser.displayname);
			console.log(">>>>>>>>>>>>>>");
			senderUser.outbox.unshift(tempMessage);
      if (req.body.token === token) {
  			senderUser.save(function (err) {
  				if (err) {
  					console.log("Saving 'from' error: "+ err);
  				}
  			});
  			receiverUser.inbox.unshift(tempMessage);
  			receiverUser.newMsgNum += 1;
  			receiverUser.save(function (err) {
  				if (err) {
  					console.log("Saving 'to' error: "+ err);
  				}
  			});
      }
		});
	});
	res.sendStatus(200);
});

app.get('/users/messages/:dataField/:user_id', function (req, res) {
	var dataField = req.params.dataField;
	var projection = {};
	projection[dataField] = 1;
	UserModel.findOne({_id: req.params.user_id}, projection, function (err, data){
		if (err) {
			console.log(err);
			return handleError(err);
		}
		console.log(data);
		console.log(dataField);
		res.send(data[dataField]);
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
    if (req.body.token === token) {
  		user.save(function (err) {
  			if (err) {
  				console.log("Update message status error.");
  			}
  		});
    }
	});
	res.sendStatus(200);
});

app.put('/users/messages/updateStatus/newMsgNum', function (req, res) {
	UserModel.findOne({_id: req.body.user}, function (err, user) {
		if (err) {
			console.log(err);
			return handleError(err);
		}
		user.newMsgNum = 0;
		console.log(user);
    if (req.body.token === token) {
  		user.save(function (err) {
  			if (err) {
  				console.log("Update message status error.");
  			}
  		});
  		res.send(user);
    }
	});
});

app.post('/users/googlelogin/:id/:email', function (req, res) {

  request.get(
    'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.params.id,
    function (error, response, body) {
        console.log(body);
        jsonbody = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            var id = jsonbody["sub"];
            console.log(id);
            UserModel.findOne({googleId: id}, function (err, user) {
              if (!err) {
                if (user) {
                  res.send(user);
                } else {
                  var displayname = req.params.email.split("@")[0];
                  var newuser = new UserModel({
                      email: req.params.email,
                      googleId: id,
                      password: "",
                      description: "",
                      displayname: displayname,
                      type: "",
                      profileimage: "default_profile_large.jpg",
                      userbehaviour: { allcount: 0,
                        specificcount: 0,
                        deletecount: 0,
                        addcount: 1,
                        updatecount: 0,
                        behaviourcount: 0
                      },
                      tags: {}
                  });

                  newuser.tags[displayname] = true;

                  newuser.save(function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("created");
                    }
                  });
                  res.send(newuser);
                }
              }
            });
        }
    });
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

// validate log in
app.post('/users/validate/:email', function (req, res) {
  return UserModel.findOne({ email: req.params.email }, function (err, user) {
    var hiddenuser = user;
    if (passwordHash.verify(req.body.passwordinput, user.password)) {
      hiddenuser.password = true;

      //SET TOKEN TO PROTECT AGAINST CSRF
      crypto.randomBytes(48, function(ex, buf) {
        var gentoken = buf.toString('hex');
        hiddenuser.token = gentoken;
        token = gentoken;
      });

    } else {
      hiddenuser.password = false;
    }

    if (!err) {
      console.log("verified user exists");
    } else {
      console.log(err);
    }
    return res.send(hiddenuser);
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
            console.log("done");
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
    if (req.body.password)
    {
      var hashedPassword = passwordHash.generate(req.body.password);
      user.password = hashedPassword;
    }
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
    console.log(req.body.tag1);
      if(req.body.tag1) {
        user.tags[req.body.tag1] = true;
        console.log(req.body.tag1);
      }
      if(req.body.tag2) {
        user.tags[req.body.tag2] = true;
        console.log(req.body.tag2);
      }
      if(req.body.tag3) {
        user.tags[req.body.tag3] = true;
        console.log(req.body.tag3);
      }
      user.markModified('tags');

    if (req.body.token === token) {
      return user.save(function (err) {
        if (!err) {
          console.log("updated");
        } else {
          console.log(err);
        }
        return res.send(user);
      });
    }
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
    var list;
    var listing = {};
    listing._id = mongoose.Types.ObjectId();
    listing.datePosted = Date.now();
    listing.description = "";
    listing.mainPicture = req.body.name;
    listing.owner = user._id;
    listing.title = "Listing";
    listing.profilepic = 0;
    listing.tags = { na: false };

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
          _id: listing._id,
          tags: { na: false }
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
      //if (req.body.token === token) {
        return res.send(list);
      //}
    });
  });
});

app.post('/uploadlistingimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo");

  //var target_path = __dirname + '/public/uploads/';
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {

    UserModel.findOne({ _id: listing.owner }, function (err, user) {

      for (var i = 0; i < user.gallery.length; i++) {
        if (user.gallery[i]._id === listing._id) {
          user.gallery[i].morePictures.push(req.body.name +"");
        }
      }

      user.save(function (err) {
        if (!err) {
          console.log("USER UPDATE MORE PICTURES:" + user);
        } else {
          console.log(err);
        }
      });
    });

    var filelistingname = req.body.name;

    listing.morePictures.push(filelistingname);

    return listing.save(function (err) {
      if (!err) {
        console.log(listing._id);
      } else {
        console.log(err);
      }
      //if (req.body.token === token) {
        return res.send(listing);
      //}

    });
  });
});

app.post('/uploadmainlistingimage/:id', function (req, res) {
  console.log(req.body.name);
  console.log("yo2");
  //var target_path = __dirname + '/public/uploads/';
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {

    listing.mainPicture = req.body.name;

    UserModel.findOne({ _id: listing.owner }, function (err, user) {

      for (var i = 0; i < user.gallery.length; i++) {
        if (user.gallery[i]._id === listing._id) {
          user.gallery[i].mainPicture = req.body.name;
        } if (user.gallery[i].profilepic === 1){
          user.profileimage.mainPicture = req.body.name;
        }
      }

      user.save(function (err) {
        if (!err) {
          console.log(listing._id);
        } else {
          console.log(err);
        }
      });
    });

    return listing.save(function (err) {
      if (!err) {
        console.log("updated main listing image");
      } else {
        console.log(err);
      }

      //if (req.body.token === token) {
        return res.send(listing);
      //}
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
  ListingModel.findOne({ _id: user.profileimage._id }, function (err, listing) {

      listing.mainPicture = req.body.name;
      listing.save(function (err) {
        if (!err) {
          console.log("updated main listing image");
        } else {
          console.log(err);
        }
        //res.send("found one!!");
      });
    });

    for (var i = 0; i < user.gallery.length; i++){
      if (user.gallery[i].profilepic === 1) {
        user.gallery[i].mainPicture = req.body.name;
      }
    }
    user.profileimage.mainPicture = req.body.name;

    user.save(function (err) {
      if (!err) {
        console.log("updated profile image");
      } else {
        console.log(err);
      }
      //if (req.body.token === token) {
        return res.send(user);
      //}
    });
  });
  //return res.send("sent");
});

app.post('/uploadimage', upload.single('file'), function (req, res) {
  console.log("in upload image\n");
  console.log(req.file);
  return res.send(req.file);
});

// get a user by the listing id
app.get('/listing/users/:id', function (req, res) {
	ListingModel.findOne({ _id: req.params.id }, function (err1, listing) {
		if (err1) {
			console.log(err1);
			return handleError(err1);
		}
		UserModel.findOne({ _id: listing.owner}, { password:0}, function(err2, user) {
			if (err2) {
				console.log(err2);
				return handleError(err2);
			}
      //if (req.body.token === token) {
        return res.send(user);
      //}
		});
	});
});

//get listing
app.get('/listing/:id', function (req, res){
  return ListingModel.findOne({ _id: req.params.id }, function (err, listing) {
    console.log("asdasdasdasdas");
	console.log(req.params.id);
	console.log(listing);
	if (!err) {
      return res.send(listing);
    } else {
      return console.log(err);
    }
  });
});

app.put('/listing/comment/:id', function (req, res) {
	return ListingModel.findOne({ _id: req.params.id }, function (err1, listing) {
		console.log(req.params.id);
		console.log(listing);
		console.log("Adding Comment");
		if (err1) {
		  return console.log(err1);
		} 
		return UserModel.findOne({ _id: req.body.user }, function (err2, user){
			if (err2) {
				return console.log(err2);
			}
			else {
				var comment = createComment(user, req.body.message, listing);
				listing.save(function (err3) {
					  if (!err3) {
						console.log("comment successfully added to listing");
					  } else {
						console.log(err3);
					  }
				});
				return comment.save(function (err4) {
					  if (!err4) {
						console.log("comment successfully posted");
					  } else {
						return console.log(err4);
					  }
					  console.log(comment);
					  return res.send(comment);
				});
			}
		});	
  });
});

app.put('/comment/edit/:id', function (req, res){
	return CommentModel.findOne({ _id: req.params.id }, function (err1, comment) {
		console.log(req.params.id);
		console.log(comment);
		console.log("Editing Comment");
		if (err1) {
			return console.log(err1);
		}
		else {
			comment.message = req.body.message;
			return comment.save(function (err2) {
				if (err2) {
					return console.log(err2);
				}
				else {
					console.log("Comment Edited Successfully");
					console.log(comment);
					return res.send(comment);
				}
			});
		}
	});
});

app.put('/comment/unlike/:id', function (req, res){
	return CommentModel.findOne({ _id: req.params.id }, function (err1, comment) {
		console.log(req.params.id);
		console.log(comment);
		console.log("Updating Likes on Comment");
		if (err1) {
			return console.log(err1);
		}
		else {
			for (var i = 0; i < likesCount(comment); i++) {
				if (comment.likes[i]._id != req.body.user) {
					comment.likes.splice(i, 1);
				}
			}
			comment.likes = newArray;
			return comment.save(function (err2) {
				if (err2) {
					return console.log(err2);
				}
				else {
					console.log("The current user unliked this comment");
					console.log(comment);
					return res.send(comment);
				}
			});
		}
	});
});

app.put('/comment/like/:id', function (req, res){
	return CommentModel.findOne({ _id: req.params.id }, function (err1, comment) {
		console.log(req.params.id);
		console.log(comment);
		console.log("Updating Likes on Comment");
		if (err1) {
			return console.log(err1);
		}
		else {
			return UserModel.findOne({ _id: req.body.user }, function (err2, user) {
				if (err2) {
					return console.log(err2);
				}
				else {
					comment.likes.push(user);
					return comment.save(function (err3) {
						if (err3) {
							return console.log(err3);
						}
						else {
							console.log("The current user liked this comment");
							console.log(comment);
							return res.send(comment);
						}
					});
				}
				
			});
			
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

// DELETE LISTING
app.delete('/listing/:id/:userid', function (req, res){
  UserModel.findOne({ _id: req.params.userid }, function (err, user) {

    for (var i = 0; i < user.gallery.length; i++) {
      if (user.gallery[i]._id === req.params.id) {
        //delete listing
        user.gallery.splice(i, 1);
      }
    }

    user.save(function (err) {
      if (!err) {
        console.log("deleted from gallery");
      } else {
        console.log(err);
      }
      res.send(user);
    });
  });

    ListingModel.findOne({ _id: req.params.id }, function (err, list) {
      return list.remove(function (err) {
        if (!err) {
          console.log("removed listing");
        } else {
          console.log(err);
        }
      });
    });
});

// UPDATE LISTING INFORMATION
app.put('/listings/update/:listingid/:userid', function (req, res){
  UserModel.findOne({ _id: req.params.userid }, function (err, user) {

    //Doesnt account for updating main profile listing
    for (var i = 0; i < user.gallery.length; i++) {
      if (user.gallery[i]._id === req.params.listingid) {
        //delete listing
        var person = user.gallery[i];
        if (req.body.title) user.gallery[i].title = req.body.title;
        if (req.body.description) user.gallery[i].description = req.body.description;
        console.log(user.gallery[i]);
        if(req.body.tag1) {
          user.gallery[i].tags[req.body.tag1] = true;
          console.log(req.body.tag1);
        }
        if(req.body.tag2) {
          user.gallery[i].tags[req.body.tag2] = true;
          console.log(req.body.tag2);
        }
        if(req.body.tag3) {
          user.gallery[i].tags[req.body.tag3] = true;
          console.log(req.body.tag3);
        }
        user.gallery[i].markModified('tags');
      }
      if (user.gallery[i].profilepic === 1){
        if (req.body.title) user.profileimage.title = req.body.title;
        if (req.body.description) user.profileimage.description = req.body.description;
      }
    }
    //if (req.body.token === token) {
      user.save(function (err) {
        if (!err) {
          console.log("updated gallery listing infos");
          console.log(person);
        } else {
          console.log(err);
        }
      });
    //}
  });

  return ListingModel.findOne({ _id: req.params.listingid }, function (err, listing) {

    if (req.body.title) listing.title = req.body.title;
    if (req.body.description) listing.description = req.body.description;

    if(req.body.tag1) {
      listing.tags[req.body.tag1] = true;
      console.log(req.body.tag1);
    }
    if(req.body.tag2) {
      listing.tags[req.body.tag2] = true;
      console.log(req.body.tag2);
    }
    if(req.body.tag3) {
      listing.tags[req.body.tag3] = true;
      console.log(req.body.tag3);
    }
    listing.markModified('tags');

		return listing.save(function (err) {
		  if (!err) {
			console.log("updated listing info");
		  } else {
			console.log(err);
		  }
		});
      return res.send(listing);
    });

});


var server = app.listen(3000, function () {
  //process.env.PORT
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
