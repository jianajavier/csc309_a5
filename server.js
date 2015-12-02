fs = require('fs');
path = require('path');
var bodyParser  = require('body-parser');
var express = require('express');
var app = express();
multer = require('multer');

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

PostSchemas = new Schema({  //posts are posted to a group or user
  user: UserSchemas, 
  message: String,
  dateCreated: Date,
  likes: [UserSchemas],
  links: [String],
  shares: [UserSchemas], 
  comments: [CommentSchemas]
});

UserSchemas = new Schema({
    email: String,
    password: String,
    description: String, default : "",
    //profileimage: { data: Buffer, contentType: String },
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
	  posts: [PostSchemas],
	  inbox: [MessageSchemas],
	  outbox: [MessageSchemas]
});

CommentSchemas = new Schema({
	user: UserSchemas, 
	message: String,
	dateCreated: Date,
	likes: [UserSchemas],
	links: [String],
	replies: [ReplySchemas]
});

ReplySchemas = new Schema({
	user: UserSchemas, 
	message: String,
	dateCreated: Date,
	likes: [UserSchemas],
	links: [String]
});

ReviewSchemas = new Schema({
	user: UserSchemas,
	content: String,
	dateCreated: Date,
	rating: Number, //It is a number in decimals between 0 and 10. Note this is a 100 point system.
	likes: [UserSchemas],
	links: [String],
	shares: [UserSchemas], 
	comments: [CommentSchemas]
});

MessageSchemas = new Schema({
	sender: UserSchemas,
	receiver: UserSchemas,
	dateCreated: Date,
	content: String,
	request: Boolean,
	reply: Boolean
});


var UserModel = mongoose.model('UserSchema', UserSchemas);
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
		user: currentUser,
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
		user: currentUser,
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
	return comment.likes.lenght;
}

function sharesCount(comment) {
	return comment.shares.lenght;
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
    console.log(req.body);
    user = new UserModel({
      email: req.body.email,
      password: req.body.password,
      description: "",
      displayname: "",
      type: userType,
      userbehaviour: { allcount: 0,
        specificcount: 0,
        deletecount: 0,
        addcount: 1,
        updatecount: 0,
        behaviourcount: 0
      }
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

// Create (Send) a message
app.put('/users/messages', function (req, res) {
	console.log(req.body);
	console.log(">>>>>>>>>>>>>>");
	console.log(req.body.to);
	console.log(req.body.from);
	console.log(req.body.content);
	console.log(">>>>>>>>>>>>>>");
	//console.log(req.body.from[_id]);
	var tempMessage = {
		sender: UserModel.findOne( { _id: req.body.from[_id]} ),
		receiver: UserModel.findOne( {_id: req.body.to[_id]} ),
		dateCreated: Date.now,
		content: req.body.content,
		request: req.body.request,
		reply: req.body.reply
	}
	req.body.from.outbox.push(tempMessage);
	req.body.from.save(function (err) {
		if (err) {
			console.log("Saving 'from' error: "+ err);
		}
	});
	req.body.to.inbox.push(tempMessage);
	req.body.to.save(function (err) {
		if (err) {
			console.log("Saving 'to' error: "+ err);
		}
	});
	res.send(200);
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


// UPDATE USER INFROMATION
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
app.post('/uploadimage', upload.single('imgfile'), function (req, res) {

  console.log(req.body);
  console.log(req.file);
  var target_path = __dirname + '/public/uploads/';
  return res.send("don't know");
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
