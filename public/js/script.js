var login = 0; //0 if logging in, 1 if signing up
var currentuser;
var fromlogin = true;
var userReply;
var userRequest;
var viewing; //the persons profile being viewed
var loclat = 0;
var loclng = 0;
var listingview; //id of listing being viewed
var msgview;	// the message being viewed
var currenttoken;

getLocation();


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    loclat = position.coords.latitude;
    loclng = position.coords.longitude;
}

//Comment Helper Functions begin here

function likesCount(target) {
	return target.likes.length;
}

function sharesCount(target) {
	return target.shares.length;
}

function commentCount(target) {
	return target.comments.length;
}

function sortComments(condition, target) {
	var newArray = [];
	for (i = 0; i < target.comments; i++){
		newArray.push(target.comments[i]);
	}
	if (condition == "Newest First") {
		return newArray;
	}
	else if (condition == "Oldest First") {
		return newArray.reverse();
	}
	else {  //condition == "Top Comments"
		return newArray.sort(function(a, b){return likesCount(a) - likesCount(b)});
	}
	/*
	else { //condition == "Worst"
		return newArray.sort(function(a, b){return likesCount(a) - likesCount(b)}).reverse();
	}
	*/
}

function displayComment(comment, target, listingCreater) {
	
	var m = comment.message;
	var n = m.replace(/(https?:\/\/[^\s]+)/g, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
	var displayC = "<div class=\"comment\" "+ "id=\"" + comment._id + "\" >"
				 + "<div class=\"row\">"
					 + "<div class=\"col-sm-1\">"
					 + "</div>"
					 + "<div class=\"col-sm-1\">"
						+ "<img src=\"uploads/" + comment.createrInfo.profileimage + "\" class=\"img-rounded\" width=\"60\" height=\"60\" " 
						+ "id=\"userprofileimage" + comment._id + "\" />"
					 + "</div>"
					 + "<div class=\"col-sm-10\">"
						 + "<p id=\"user" + comment._id + "\" >" 
						 + "<span id=\"username" + comment._id + "\">" + comment.createrInfo.displayname + "</span>"
						 + "<span id=\"date" + comment._id + "\">" + comment.dateCreated + "</span>"
						 + "</p>"
						 + "<form class=\"form-horizontal\" role=\"form\" id=\"editcomment" + comment._id +"\" >"
						 + "<p>"
						 + "<div class=\"form-group\">"
							 + "<textarea id=\"editcommentcontent" + comment._id + "\" class=\"form-control\" rows=\"5\" ></textarea>"
						 + "</div>"
						 + "</p>"
						 + "<p>"
						 + "<div class=\"form-group\">"      
							 + "<div class=\"col-sm-offset-2\">"
								+ "<button id=\"saveedit" + comment._id + "\" type=\"submit\" class=\"btn btn-info btn-sm\">Save</button>"
								+ "<button id=\"canceledit" + comment._id + "\" type=\"button\" class=\"btn\">Cancel</button>"
							 + "</div>"
						 + "</div>"
						 + "</p>"
						 +"</form>"
						 + "<p id=\"message" + comment._id + "\" >" + n  + "</p>"
						 + "<p id=\"buttongroup" + comment._id + "\" >"
						 + "<button id=\"reply" + comment._id + "\" type=\"button\" class=\"commentinteractbutton\">Reply</button>"
						 + "<button id=\"wholikes" + comment._id + "\" type=\"button\" class=\"commentinteractbutton\" data-toggle=\"modal\" " 
						 + "data-target=\"#\"wholikesmodal" + comment._id + "\" >" + likesCount(comment).toString() 
						 + "</button>"
						 + "<button id=\"like" + comment._id + "\" type=\"button\" class=\"commentinteractbutton\">"
						 + "<span class=\"glyphicon glyphicon-thumbs-up\" aria-hidden=\"true\" id=\"up" + comment._id + "\"></span>"
						 + "</button>          "
						 + "<button id=\"delete" + comment._id + "\" type=\"button\" class=\"commentinteractbutton\">Delete</button>"
						 + "<button id=\"edit" + comment._id + "\" type=\"button\" class=\"commentinteractbutton\">Edit</button>"
						 + "</p>"
					 + "</div>"
				 + "</div>"
				 + "<div id=\"listingreplylist" + comment._id + "\" >"
				 + "</div>"
				 + "<form class=\"form-horizontal\" role=\"form\" id=\"replyform" + comment._id +"\" >"
				 + "<div class=\"row\">"
				 + "<div class=\"col-sm-4\">"
				 + "</div>"
				 + "<div class=\"form-group\">"
					 + "<label class=\"control-label col-sm-2\" for=\"comment\">"
					 + "<img src=\"uploads/" + currentuser.profileimage + "\" class=\"img-rounded\" width=\"40\" height=\"40\" id=\"userprofileimage" + comment._id + "\" />" 
					 + "</label>"
					 + "<div class=\"col-sm-10\">"
					 + "<textarea class=\"form-control\" rows=\"2\"  placeholder=\"Reply to this comment\"></textarea>"
					 + "</div>"
				 + "</div>"
				 + "</div>"
				 + "<div class=\"row\">"
				 + "<div class=\"form-group\">"
					 + "<div class=\"col-sm-offset-2\">"
						"<button id=\"postreply" + comment._id + "\" type=\"submit\" class=\"btn btn-info btn-sm\">Post</button>"
						"<button id=\"cancelreply" + comment._id + "\" type=\"button\" class=\"btn\">Cancel</button>"
					 + "</div>"
				 + "</div>"
				 + "</div>"
				+"</form>"
				+ "<div id=\"wholikesmodal" + comment._id + "\" class=\"modal fade\" role=\"dialog\">"
					  + "<div class=\"modal-dialog\">"
					  + "<div class=\"modal-content\">"
						  + "<div class=\"modal-header\">"
							+ "<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"
							+ "<h4 class=\"modal-title\">People who Liked this Comment.</h4>"
						  + "</div>"
						  +"<div id=\"wholikeslist" + comment._id +"\" class=\"modal-body\">"
						  + "</div>"
						+ "</div>"
					  + "</div>"
					+ "</div>"
				+ "</div>";

	$("#" + target).prepend(displayC);
	
	$("#replyform" + comment._id).hide();
	$("#delete" + comment._id).hide();
	$("#editcomment" + comment._id).hide();
	if (likesCount(comment) == 0) {
		$("#wholikes" + comment._id).hide();
	}
	$("#wholikes" + comment._id).css("color", "blue");
	
	if (comment.likes.indexOf(currentuser) != -1) { //current user liked this comment
		$("#up" + comment._id).css("color", "blue");
	}
	
	for (var i = 0; i < comment.likes; i++) {
		$("#wholikeslist" + comment._id).prepend(
		"<div class=\"row\">"
			+ "<div class=\"col-sm-1\">"
				+ "<img src=\"uploads/" + comment.likes[i].profileimage + "\" class=\"img-rounded\" width=\"60\" height=\"60\"" 
				+ " id=\"userprofileimageu" + comment.likes[i]._id + "c" + comment._id + "\" />"
			+ "</div>"
			+ "<div class=\"col-sm-10\">"
				+ "<p id=\"usernameu" + comment.likes[i]._id + "c"  + comment._id + "\">" + comment.likes[i].displayname + "</p>"
			+ "</div>"
		+ "</div>");
		$("#userprofileimageu" + comment.likes[i]._id + "c" + comment._id).on("click",function() { moveToProfile(comment.likes[i]);});
		$("#userprofilenameu" + comment.likes[i]._id + "c" + comment._id).on("click",function() { moveToProfile(comment.likes[i]);});
	}
	
	if (comment.creater = currentuser._id) {
		$("#" + comment._id).mouseenter(function(){
			$("#delete" + comment._id).show();
			$("#edit" + comment._id).show();
		});
		$("#" + comment._id).mouseleave(function(){
			$("#delete" + comment._id).hide();
			$("#edit" + comment._id).hide();
		});		
	};
	
	if (listingCreater = currentuser._id) {
		$("#" + comment._id).mouseenter(function(){
			$("#delete" + comment._id).show();
		});
		$("#" + comment._id).mouseleave(function(){
			$("#delete" + comment._id).hide();
		});		
	};	
	$("#userprofileimage" + comment._id).on("click",function() { moveToProfile(comment.createrInfo);});
	$("#username" + comment._id).on("click",function() { moveToProfile(comment.createrInfo);});
	
	//effect on buttons as the mouse touches it
	$("#reply" + comment._id).mouseenter( function() {
		$("#reply" + comment._id).css("text-decoration", "underline");
	});
	$("#reply" + comment._id).mouseleave( function() {
		$("#reply" + comment._id).css("text-decoration", "none");
	});
	$("#wholikes" + comment._id).mouseenter( function() {
		$("#wholikes" + comment._id).css("text-decoration", "underline");
	});
	$("#wholikes" + comment._id).mouseleave( function() {
		$("#wholikes" + comment._id).css("text-decoration", "none");
	});
	
	$("#delete" + comment._id).mouseenter( function() {
		$("#delete" + comment._id).css("text-decoration", "underline");
	});
	$("#delete" + comment._id).mouseleave( function() {
		$("#delete" + comment._id).css("text-decoration", "none");
	});
	
	$("#edit" + comment._id).mouseenter( function() {
		$("#edit" + comment._id).css("text-decoration", "underline");
	});
	$("#edit" + comment._id).mouseleave( function() {
		$("#edit" + comment._id).css("text-decoration", "none");
	});
	
	$("#like" + comment._id).mouseenter( function() {
		if ($("#up" + comment._id).css("color") == "gray") {
			$("#up" + comment._id).css("color", "black");
		}
		else {
			$("#up" + comment._id).css("color", "red");
		}
	});
	$("#like" + comment._id).mouseleave( function() {
		if ($("#up" + comment._id).css("color") == "black") {
			$("#up" + comment._id).css("color", "gray");
		}
		else {
			$("#up" + comment._id).css("color", "blue");
		}
	});
	
	//Like comment
	$("#like" + comment._id).on("click",function() { 
		if (comment.likes.indexOf(currentuser) == -1) {
			$.ajax({
			  type: "PUT",
			  url: "/comment/like/" + comment._id,
			  data: {
				user: currentuser._id,
			  },
			  success: function(data) {
				$("#up" + comment._id).css("color", "blue");
				if (likesCount(comment) == 0) {
					$("#wholikes" + comment._id).show();
				}
				$("#wholikes" + comment._id).text(likesCount(data).toString());
				$("#wholikeslist" + comment._id).empty();
				for (var j = 0; j < data.likes; j++) {
					$("#wholikeslist" + comment._id).prepend(
					"<div class=\"row\">"
						+ "<div class=\"col-sm-1\">"
							+ "<img src=\"uploads/" + data.likes[j].profileimage + "\" class=\"img-rounded\" width=\"60\" height=\"60\"" 
							+ " id=\"userprofileimageu" + data.likes[j]._id + "c" + data._id + "\" />"
						+ "</div>"
						+ "<div class=\"col-sm-10\">"
							+ "<p id=\"usernameu" + data.likes[j]._id + "c"  + data._id + "\">" + data.likes[j].displayname + "</p>"
						+ "</div>"
					+ "</div>");
					$("#userprofileimageu" + data.likes[j]._id + "c" + data._id).on("click",function() { moveToProfile(data.likes[j]);});
					$("#userprofilenameu" + data.likes[j]._id + "c" + data._id).on("click",function() { moveToProfile(data.likes[j]);});
				}
			  }
			}
		}
		else {
			$.ajax({
			  type: "PUT",
			  url: "/comment/unlike/" + comment._id,
			  data: {
				user: currentuser._id,
			  },
			  success: function(data) {
				$("#up" + comment._id).css("color", "blue");
				$("#wholikes" + comment._id).text(likesCount(data).toString());
				$("#wholikeslist" + comment._id).empty();
				if (likesCount(data) == 0) {
					$("#wholikes" + comment._id).hide();
				}
				else {
					for (var k = 0; k < data.likes; k++) {
					$("#wholikeslist" + comment._id).prepend(
					"<div class=\"row\">"
						+ "<div class=\"col-sm-1\">"
							+ "<img src=\"uploads/" + data.likes[k].profileimage + "\" class=\"img-rounded\" width=\"60\" height=\"60\"" 
							+ " id=\"userprofileimageu" + data.likes[k]._id + "c" + data._id + "\" />"
						+ "</div>"
						+ "<div class=\"col-sm-10\">"
							+ "<p id=\"usernameu" + data.likes[k]._id + "c"  + data._id + "\">" + data.likes[k].displayname + "</p>"
						+ "</div>"
					+ "</div>");
					$("#userprofileimageu" + data.likes[k]._id + "c" + data._id).on("click",function() { moveToProfile(data.likes[k]);});
					$("#userprofilenameu" + data.likes[k]._id + "c" + data._id).on("click",function() { moveToProfile(data.likes[k]);});
				}
				}
				
			  }
			}
		}
	});
	
	//Editing Comment
	$("#edit" + comment._id).on("click",function() { 
		$("#editcomment" + comment._id).show();
		$("#user" + comment._id + ", #buttongroup" + comment._id + ", #message" + comment._id).hide();
		$("#editcommentcontent").val(comment.message);
	});
	$("#canceledit" + comment._id).on("click",function() { 
		$("#editcomment" + comment._id).hide();
		$("#user" + comment._id + ", #buttongroup" + comment._id + ", #message" + comment._id).show();
		$("#editcommentcontent").val("");
	});
	
	$("#saveedit" + comment._id).submit(function(e){
		e.preventDefault();
		if (!$("#editcommentcontent" + comment._id).val()){
			toggleErrorMessage("Please fill in a comment.", 1);
			return ;
		}
		$.ajax({
		  type: "PUT",
		  url: "/comment/edit/" + comment._id,
		  data: {
			message: $("#editcommentcontent").val(),
		  },
		  success: function(data) {
			 $("#editcommentcontent" + comment._id).val("");
			 $("#editcomment" + comment._id).hide();
			 m = data.message;
			 n = m.replace(/(https?:\/\/[^\s]+)/g, function(url) {
				return '<a href="' + url + '">' + url + '</a>';
			 });
			 $("#message" + comment._id).html(n);
		  }
		});
	});
	
	//Delete Comment
	//$("#delete" + comment._id).on("click",function(){});
	
	//Replying to comment
	$("#reply" + comment._id).on("click",function() { $("#replyform" + comment._id).show();});
	$("#cancelreply" + comment._id).on("click",function() { $("#replyform" + comment._id).hide();});
}

function displayReply(comment) {
	
}

//Comment Helper Functions end here

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());
    var id_token = googleUser.getAuthResponse().id_token;
    var posturl = "/users/googlelogin/" + id_token + "/" + profile.getEmail();
    $.ajax({
        type: "POST",
        url: posturl,
        success: function(data){
          if (data) {
            currentuser = data;
              $("#loginOrSignupScreen").hide();
              $(".loggedInNav").show();

              // set profile picture
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage);

              //$("#logout").fadeIn();
              //if (currentuser.type === "admin" || currentuser.type === "superadmin") {
                //$("#viewbehaviour").fadeIn();
              //}

              moveToWelcome(data);
          } else {
            console.log("google sign in error");
          }
        }
      });

}

$(document).ready(function(){
  /* Hide things on startup */
  $("#loginheader, #signupheader, #errormessage, .loggedInNav").hide();
  $("#tradeSection, #homepage, #messagePage, #listingpage, #searchScreen, #profilelink, #profilepage, .thumbnailholder, #editprofilepage, #messageuser, #editalert, #edituser, #deleteuser,#logout,#viewbehaviour, #userbehaviourpage, #editlistingpage").hide();

  function onSignIn(googleUser) {
    alert("gothere");
    gapi.auth2.init();
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());
  }
  // LOGIN VIEW
  $("#loginbutton").click(function(){
    toggleErrorMessage("", 0);
    $("#cpasswordinput, #cpasslabel, #signupheader").hide();
    $("#loginheader, #rectangle").show();
    login = 0;
  });

  // SIGN-UP VIEW
  $("#signupbutton").click(function(){
    toggleErrorMessage("", 0);
    $("#loginheader").hide();
    $("#cpasswordinput, #cpasslabel, #rectangle, #signupheader").show();
    login = 1;
  });

  $("#logo").click(function(){
    if (currentuser) {
      moveToWelcome(currentuser);
    }
  });

  // CLICK GO TO PROCEED
  $("#loginOrSubmitForm").submit(function(event){
    event.preventDefault();
    // Check for empty fields
    if (!$("#passwordinput").val() || !$("#emailinput").val()) {
      toggleErrorMessage("Please fill all fields.", 1);
      return;
    }

    // LOGGING IN
    if (login === 0) {
      // Gets user information to log in. Check if password correct on server.
      $.ajax({
        type: "POST",
        url: "/users/validate/" + $("#emailinput").val(),
        data: {
          passwordinput: $("#passwordinput").val(),
          token : currenttoken
        },
        success: function(data){
          if (data) {
            if (data.password === "true") {
              currenttoken = data.token;
              currentuser = data;
              $("#loginOrSignupModal").modal("hide");
              $("#loginOrSignupScreen").hide();
              $(".loggedInNav").show();

              // set profile picture
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);

              moveToWelcome(data);
            } else {
              toggleErrorMessage("Password incorrect.", 1);
            }
          } else {
            toggleErrorMessage("E-mail not found.", 1);
          }
        }
      });


    // SIGNING UP
    } else {
      var valid = true;
      // IF EMAIL ALREADY EXISTS IN DATABASE
      $.when(getUserByEmail($("#emailinput").val())).done(function(user){
        if (user) {
          toggleErrorMessage("E-mail is already in use. Please try another e-mail.", 1);
          valid = false;
        }
      });
      // IF PASSWORDS DON'T MATCH
      if ($("#passwordinput").val() != $("#cpasswordinput").val()) {
        toggleErrorMessage("Passwords do not match.", 1);
        valid = false;
      }

      // USER CAN BE ADDED TO THE DATABASE
      if (valid) {
        toggleErrorMessage("", 0);

        // ADDS USER TO DATABASE
        $.ajax({
          type: "POST",
          url: "/users",
          data: {
            "email" : $("#emailinput").val(),
            "password" : $("#passwordinput").val(),
            geolocationlat : loclat,
            geolocationlng: loclng
          },
          success: function() {
            $.when(getUserByEmail($("#emailinput").val())).done(function(user){
              currenttoken = user.token;
              currentuser = user;
              $("#loginOrSignupModal").modal("hide");
              $("#loginOrSignupScreen").hide();
              $(".loggedInNav").show();

              // set profile picture
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);

              moveToWelcome(user);
            });
          }
        });
      }
    }
  });

  /**
  USER PERFORMS A SEARCH IN THE NAV BAR
  */
  $("#searchForm").submit(function(event) {
    event.preventDefault();
    $("#notSearch").hide();
    //console.log()

    $.ajax({
        type: "GET",
        url: "/search/" + $("#searchinput").val(),
        success: function(data){
          if (data) {
            $("#userSearchResults").html("<h3>Users that match your search:</h3>");
            for(var i = 0; i < data[0].length; i++){
              $("#userSearchResults").append(
                "<div onclick = \"goToUser('"+data[0][i].email+"')\" class='panel panel-primary'>"
                  + "<div class='panel-heading'>"
                      + "<h3 class='panel-title'>" + data[0][i].email +"</h3>"
                  + "</div>"
                  + "<div class='panel-body'>"
                      + "<img style='max-width:100%;max-height:auto;' src='/uploads/" + data[0][i].profileimage.mainPicture + "'>"
                      + "<p>" + data[0][i].description + "</p>"
                  + "</div>"
                + "</div>");
            }
            $("#artSearchResults").html("<h3>Artworks that match your search:</h3>");
            for(var i = 0; i < data[1].length; i++){
              $("#artSearchResults").append(
                "<div class='panel panel-primary'>"
                  + "<div class='panel-heading'>"
                      + "<h3 class='panel-title'>" + data[1][i].title +"</h3>"
                  + "</div>"
                  + "<div class='panel-body'>"
                      + "<img src='/uploads/" + data[1][i].mainPicture +"'>"
                  + "</div>"
                + "</div>");
            }
            $("#searchScreen").show();
          }
        }
    });
  });

  /**
  CLICKS ON A ROW IN THE USER TABLE
  */
  $('#usertable').on("click", "tr", function(){
    var tableData = $(this).children("td").map(function() {
       return $(this).text();
   }).get();

   //console.log(tableData);
   if (tableData.length != 0) {
     moveToProfile(JSON.parse(getUserByEmail(tableData[0]).responseText));
   }
  });

  /**
  CLICKS ON THEIR PROFILE IN THE UPPER RIGHT CORNER TO EDIT PROFILE
  */
  $("#profilelink, #miniprofilepicture").click(function(){

    moveToEditPage(currentuser, true);
  });

  /**
  AFTER FILE INPUT IS CHOSEN
  */
  $("#image-upload").change(function () {
    readFile(this);
  });

  $("#listing-image-upload").change(function () {
    readFile2(this);
  });

  /**
  CLICKS LOGO TO GO BACK TO WELCOME PAGE
  */
  $("#logo").click(function(){
    if (currentuser) {
      moveToWelcome(JSON.parse(getUserByEmail(currentuser.email).responseText));
    } //will keep them at home page
  });

  $("#cancelbutton").click(function(){
    moveToProfile(currentuser);
  });

  $("#cancellistingbutton").click(function(){
    goToListingPage(listingview);
  });

  $("#gotolistingowner").click(function(){
    //Get listing owner from listingview
    $.ajax({
      type: "GET",
      url: "/listing/"+listingview,
      success: function(data) {
        $.ajax({
          type: "GET",
          url: "/getuser/"+data.owner,
          success: function(owner) {
            moveToProfile(owner);
          }
        });
      }
    });

  });

  /**
  CLICKS UPDATE BUTTON TO BRING BACK TO CHANGE INFORMATION
  */
  $("#editProfileForm").submit(function (event) {
    event.preventDefault();
    var data = {
      token : currenttoken,
      displayname : $("#editdisplayname").val(),
      description : $("#editdescription").val()
    }
    var tags = {}
    if (!($("#taguser1").val()==null || $("#taguser1").val().trim()=="")) {
      data.tag1 = $("#taguser1").val();
    }
    if (!($("#taguser2").val()==null || $("#taguser2").val().trim()=="")) {
      data.tag2 = $("#taguser2").val();
    }
    if (!($("#taguser3").val()==null || $("#taguser3").val().trim()=="")) {
      data.tag3 = $("#taguser3").val();
    }
    console.log(data);
    $.ajax({
      type: "PUT",
      url: "/users/update/" + viewing.email+ "/"+currentuser.email, // technically viewing should be current if they are looking at their own
      data: data,
      success: function(data) {
        currentuser = data;
        viewing = data;
        editAlertPopup("Updated.");
      }
    });
  });


  $("#messageuser").click(function() {
	  $("#messageHeader").show();
	  $("#replyHeader, #tradeSection").hide();
	  $("#recipient").text("To: " + viewing.displayname);
	  $("#messageText").val("");
	  userReply = false;
	  userRequest = false;
  });

  $("#changePasswordForm").submit(function (event) {
    event.preventDefault();
    //CHECK IF OLD PASSWORD IS correct
    if ($("#oldpass").val() === currentuser.password) {
      if ($("#newpass").val() === $("#confirmpass").val()) {
        // AJAX CALL TO UPDATE PASSWORD
        $.ajax({
          type: "PUT",
          url: "/users/update/" + viewing.email + "/" + currentuser.email,
          data: {
            token : currenttoken,
            password : $("#newpass").val()
          },
          success: function(data) {
            currentuser = JSON.parse(getUserByEmail(currentuser.email).responseText);
            editAlertPopup("Password changed.");
          }
        });
      } else {
        editAlertPopup("New passwords do not match.");
      }
    } else {
      editAlertPopup("Incorrect old password.");
    }
  });

  $("#edituser").click(function() {
    if (viewing.email === currentuser.email) {
      moveToEditPage(viewing, true);
    } else {
      moveToEditPage(viewing, false);
    }

  });

  // MESSAGE USER
  $("#messageForm").submit(function(event) {
	  event.preventDefault();


	  var tempOfferID = "", tempOfferTitle = "";
	  var tempInterestID = "", tempInterestTitle = "";

	  if (!userReply) {
		if (userRequest) {
			var interestTitle;
			  $.ajax({
				type: "GET",
				async: false,
				url: "/listing/"+listingview,
				success: function(data) {
					interestTitle = data.title;
				}
			  });
			tempOfferID = $("#tradeItem option:selected").attr("value");
			tempOfferTitle = $("#tradeItem option:selected").text();
			tempInterestID = listingview;
			tempInterestTitle = interestTitle;
		}
	  } else {
		  // When it is a reply, just copy the info from previous message
		  tempOfferID = msgview.item.offer._id;
		  tempOfferTitle = msgview.item.offer.title;
		  tempInterestID = msgview.item.interest._id;
		  tempInterestTitle = msgview.item.interest.title;
	  }

	  $.ajax({
		type: "PUT",
		url: "/users/messages/send",
		data: {
      token : currenttoken,
			from: currentuser._id,
			to: viewing._id,
			content: $("#messageText").val(),
			request: userRequest,
			item: {
				offer: {
					_id: tempOfferID,
					title: tempOfferTitle
				},
				interest: {
					_id: tempInterestID,
					title: tempInterestTitle
				}
			},
			reply: userReply
		}
	  }).always(function() {
		  console.log("run");
		  $("#messageModal").modal("hide");
	  }).fail(function() {
		  console.log("Error: message cannot be sent.");
	  });
  });

	$("#inboxTab").click(function() {
		refreshInbox();
	});

	$("#outboxTab").click(function() {
		refreshOutbox();
	});


  // TOGGLE ADMIN
  $("#toggleadmin").click(function() {
    var newtype;
    if (viewing.type === "regular") {
      newtype = "admin";
    } else if(viewing.type === "admin") {
      newtype = "regular";
    }

    $.ajax({
      type: "PUT",
      url: "/users/update/" + viewing.email+"/" +currentuser.email,
      data: {
        token : currenttoken,
        type : newtype
      },
      success: function(data) {
        currentuser = JSON.parse(getUserByEmail(currentuser.email).responseText);
        viewing = data;

        if (viewing.type === "regular") {
          $("#toggleadmin").text("Make Admin");
          $("#edituser").show();
          $("#deleteuser").show();
        } else if(viewing.type === "admin") {
          $("#toggleadmin").text("Revoke Admin");
          $("#edituser").hide();
          $("#deleteuser").hide();
        }

      }
    });
  });

  $("#deleteuser").click(function() {
    $.ajax({
      url: "/users/" + viewing._id+"/"+currentuser.email,
      type: 'DELETE',
      success: function () {
        moveToWelcome(currentuser);
      }
    });

    $('#'+viewing._id).remove();
  });

  $("#deletelisting").click (function (){
    $.ajax({
      url: "/listing/" + listingview + "/"+currentuser._id,
      type: 'DELETE',
      success: function () {
        $.ajax({
            type: "GET",
            url: "/getuser/"+currentuser._id,
            success: function(data){
              if (data) {
                  currentuser = data;
                  moveToProfile(currentuser);
              }
            }
        });
      }
    });
  });

  $("#editListingForm").submit(function (event) {
    event.preventDefault();
    $.ajax({
      type: "PUT",
      url: "/listings/update/" + listingview+"/"+viewing._id,
      data: {
        token : currenttoken,
        title : $("#editlistingtitle").val(),
        description : $("#editlistdescription").val()
      },
      success: function(data) {
        listingview = data._id;
      }
    });
  });

  $("#requestlisting").click(function () {
	  console.log("requestListing");
	  $("#messageHeader").show();
	  $("#replyHeader").hide();
	  $("#recipient").text("To: " + viewing.displayname);
	  $("#messageText").val("");
	  userRequest = true;
	  $("#tradeSection").show();
	  $.ajax({
		type: "GET",
		url: "/users/messages/gallery/"+currentuser._id,
		success: function(data) {
			var dropdownHTML = "";
			$.each(data, function(index, listingArt) {
				dropdownHTML += "<option data-img='uploads/"+listingArt.mainPicture+"' value='"+listingArt._id+"'>"+listingArt.title+"</option>";
			});
			dropdownHTML += "<option value='mystery'>Mystery trade</option>";
			$("#tradeItem").html(dropdownHTML);
		}
	  });


	  $.ajax({
		type: "GET",
		url: "/listing/"+listingview,
		success: function(data) {
			$("#targetListing").text(data.title);
			$("#targetListing").attr("val", data._id);
		}
	  });
  });

  $("#logout").click(function(){
    $("#viewbehaviour").fadeOut();
    moveToHome();

  });

  $("#viewbehaviour").click(function(){
    moveToUserBehaviourPage();
  });

  $("#navMessage").click(function() {
	 moveToMessagePage();
  });

  $("li.navprofile").on("click",function() {
    $.ajax({
        type: "GET",
        async: false,
        url: "/getuser/"+currentuser._id,
        success: function(data){
          if (data) {
            currentuser = data;
            //return data;
          }
        }
    });
    moveToProfile(currentuser);
  });
   $("li.naveditprofile").on("click",function() {
     moveToEditPage(currentuser, true);
  });
  $("li.navlogout").on("click",function() {
    moveToHome();
  });

  document.getElementById('links').onclick = function (event) {
    event = event || window.event;

    var target;
    if ($(event.target).is("h2")) {
      $(event.target).closest('.hovereffect').find('img').click();
      return;
      //target = $(event.target).closest('.hovereffect').find('img').target;
    } else {
      target = event.target || event.srcElement;
    }

    var link = target.src ? target.parentNode : target,
        options = {index: link, event: event, container : '#blueimp-gallery'},
        links = this.querySelectorAll('a.photo');

    if ($(event.target).is("a.listinglink")) {
      var id = $(event.target).parent().attr('id');
      //Go to listing page
      goToListingPage(id);

    } else {
      blueimp.Gallery(links, options);
    }
  };

  document.getElementById('linkshome').onclick = function (event) {
    event = event || window.event;

    var target;
    if ($(event.target).is("h2")) {
      $(event.target).closest('.hovereffect').find('img').click();
      return;
      //target = $(event.target).closest('.hovereffect').find('img').target;
    } else {
      target = event.target || event.srcElement;
    }

    var link = target.src ? target.parentNode : target,
        options = {index: link, event: event, container : '#blueimp-gallery-home'},
        links = this.querySelectorAll('a.photo');

    if ($(event.target).is("a.listinglink")) {
      var id = $(event.target).parent().attr('id');
      //Go to listing page
      goToListingPage(id);

    } else {
      blueimp.Gallery(links, options);
    }
  };

  document.getElementById('linksownhome').onclick = function (event) {
    event = event || window.event;

    var target;
    if ($(event.target).is("h2")) {
      $(event.target).closest('.hovereffect').find('img').click();
      return;
      //target = $(event.target).closest('.hovereffect').find('img').target;
    } else {
      target = event.target || event.srcElement;
    }

    var link = target.src ? target.parentNode : target,
        options = {index: link, event: event, container : '#blueimp-gallery-home-profile'},
        links = this.querySelectorAll('a.photo');

    if ($(event.target).is("a.listinglink")) {
      var id = $(event.target).parent().attr('id');
      //Go to listing page
      goToListingPage(id);

    } else {
      blueimp.Gallery(links, options);
    }
  };


  document.getElementById('listinglinks').onclick = function (event) {
    event = event || window.event;

    var target;
    if ($(event.target).is("h2")) {
      $(event.target).closest('.hovereffect').find('img').click();
      return;
      //target = $(event.target).closest('.hovereffect').find('img').target;
    } else {
      target = event.target || event.srcElement;
    }

    var link = target.src ? target.parentNode : target,
        options = {index: link, event: event, container : '#blueimp-gallery2'},
        links = this.querySelectorAll('a.photo');

      blueimp.Gallery(links, options);

  };

  $("#clickchangeprofileimg").on("click",function() {
    $('#image-upload').trigger('click');
  });

  $("#mainlistinglink").on("click",function() {
    if ($("#mainlistinglink").attr('name') == "") {
      alert("Upload a profile picture!");
    } else {
      goToListingPage($("#mainlistinglink").attr('name'));
    }
  });

  $("#editlisting").on("click",function() {
    goToEditListingPage();
  });

  $("#setinitiallistinginfo").submit(function(e) {
      e.preventDefault();
      var data = {
          token : currenttoken,
          title : $("#listingtitleinitialedit").val(),
          description : $("#listingdescrinitialedit").val()
      }
      var tags = {}
      if (!($("#tagmodal1").val()==null || $("#tagmodal1").val().trim()=="")) {
        data.tag1 = $("#tagmodal1").val();
      }
      if (!($("#tagmodal2").val()==null || $("#tagmodal2").val().trim()=="")) {
        data.tag2 = $("#tagmodal2").val();
      }
      if (!($("#tagmodal3").val()==null || $("#tagmodal3").val().trim()=="")) {
        data.tag3 = $("#tagmodal3").val();
      }
      $.ajax({
        type: "PUT",
        url: "/listings/update/" + listingview +"/"+currentuser._id,
        data: data,
        success: function(data) {
          //listingview = data._id;
        }
      });
      $('#listinginfo').modal('toggle');
    });

  var uploader = new Dropzone('#demo-upload');

  uploader.on('success', function (file, resp) {

    uploader.processQueue();
    //console.log(file);
    //console.log(resp);

    $.ajax({
      url: '/uploadimage/'+currentuser._id,  //Server script to process data
      type: 'POST',
      data: {
        name : resp.filename+""
        //token : currenttoken
      },
      success: function(response) {
        setCurrentUser();
        //currentuser = response;
        //set listingview
        listingview = response._id;
        $("#listinginfo").modal('toggle');
      }
    });
  });

  $("#clickchangemainlistingimg").on("click",function() {
    $('#listing-image-upload').trigger('click');
  }); //react to uploadmainlistingimage

  //react to uploadlistingimage
  var uploader2 = new Dropzone('#listing-upload');

  uploader2.on('success', function (file, resp) {

    uploader2.processQueue();
    //console.log(file);
    //console.log(resp);

    $.ajax({
      url: '/uploadlistingimage/'+listingview,  //Server script to process data
      type: 'POST',
      data: {
        name : resp.filename+"",
        token : currenttoken
      },
      success: function(response) {
        //listingview = response._id;
      }
    });
  });



});

function refreshInbox() {
	// get all the messages in the currentuser's inbox
	$.ajax({
		type: "GET",
		url: "/users/messages/inbox/"+currentuser._id,
		success: function(data) {
			console.log(data);
			if (data.length == 0) {
				$("#messageBoxInbox, #inbox table").hide();
				$("#noMessageInbox").show();
			} else {
				$("#messageBoxInbox, #noMessageInbox").hide();
				$("#inbox table").show();
				var htmlString = "";
				$.each(data, function(index, message) {
					var messageHeader;
					var temphtmlString = "";

					if (message.reply) {
						// if it is a reply message
						messageHeader = "You got a reply from "+message.sender.displayname+"!";
					} else {
						if (message.request) {
							// if it is a request
							messageHeader = "New Request from "+message.sender.displayname+"!";
						} else {
							messageHeader = "New Message from "+message.sender.displayname+"!";
						}
					}

					if (message.unread) {
						// if it is unread
						temphtmlString += "<td><strong>"+message.sender.displayname+
							"</strong></td><td><strong>"+messageHeader+"</strong></td><td><strong>"+
							message.dateCreated+"</strong></td>";
					} else {
						temphtmlString += "<td>"+message.sender.displayname+
							"</td><td>"+messageHeader+"</td><td>"+
							message.dateCreated+"</td>";
					}

					if (message.request) {
						temphtmlString = "<tr class='success'>"+temphtmlString+"</tr>";
					} else {
						temphtmlString = "<tr>"+temphtmlString+"</tr>";
					}
					htmlString += temphtmlString;
				});
				$("#inbox table tbody").html(htmlString);

				// Attach event handler to the table
				$('#inbox tbody').on("click", "tr", function(){
					console.log(this.rowIndex);
					var i = this.rowIndex;
					$("#inbox table").hide();
					openInBoxMessage(data[i-1]);
				});
			}
		}
	});
}


function refreshOutbox() {
	// get all the messages in the currentuser's inbox
	$.ajax({
		type: "GET",
		url: "/users/messages/outbox/"+currentuser._id,
		success: function(data) {
			console.log(data);
			if (data.length == 0) {
				$("#messageBoxOutbox, #outbox table").hide();
				$("#noMessageOutbox").show();
			} else {
				$("#messageBoxOutbox, #noMessageOutbox").hide();
				$("#outbox table").show();
				var htmlString = "";
				$.each(data, function(index, message) {
					var messageHeader;
					var temphtmlString = "";

					if (message.reply) {
						// if it is a reply message
						messageHeader = "You replied to "+message.receiver.displayname+"!";
					} else {
						if (message.request) {
							// if it is a request
							messageHeader = "You sent a new request to "+message.receiver.displayname+"!";
						} else {
							messageHeader = "You sent a new message to "+message.receiver.displayname+"!";
						}
					}

					temphtmlString += "<td>"+message.receiver.displayname+
						"</td><td>"+messageHeader+"</td><td>"+
						message.dateCreated+"</td>";

					if (message.request) {
						temphtmlString = "<tr class='success'>"+temphtmlString+"</tr>";
					} else {
						temphtmlString = "<tr>"+temphtmlString+"</tr>";
					}
					htmlString += temphtmlString;
				});
				$("#outbox table tbody").html(htmlString);

				// Attach event handler to the table
				$('#outbox tbody').on("click", "tr", function(){
					console.log(this.rowIndex);
					var i = this.rowIndex;
					$("#outbox table").hide();
					openOutBoxMessage(data[i-1]);
				});
			}
		}
	});
}


function openInBoxMessage(msg) {
	$("#messageBoxInbox").show();
	$("#inboxFrom").text("from: "+msg.sender.displayname+" ("+msg.sender.email+")");
	$("#inboxTo").text("to: "+msg.receiver.displayname+" ("+msg.receiver.email+")");
	$("#receivedate").text("date: "+msg.dateCreated);
	$("#inboxContent").text(msg.content);
	printTradingInfo(msg, "#inboxtradingInfo");
	$("#replyInbox").click(function() {
		$("#messageHeader, #tradeSection").hide();
		$("#replyHeader").show();
		$("#recipient").text("To: "+ msg.sender.displayname);
		$("#messageText").val("");
		msgview = msg;
		viewing = msg.sender;
		userReply = true;
		userRequest = msg.request;
	});
	if (msg.unread) {
		$.ajax({
			type: "PUT",
			url: "/users/messages/updateStatus",
			data: {
        token : currenttoken,
				user: currentuser._id,
				message: msg._id
			}
		}).fail(function() {
			console.log("Error: Fail to update message status.");
		});
	}
}

// helper func to print the teading info in div that has id divID
function printTradingInfo(msg, divID) {
	if (msg.request) {
		var offerHTML;
		if (msg.item.offer._id === 'mystery') {
			offerHTML = "Offered <a href='#'>"+msg.item.offer.title+"</a>";
		} else {
			offerHTML = "Offered <a href='#' class='linktoOffer'>"+msg.item.offer.title+"</a>";
		}
		var interestHTML;
		if (msg.item.interest._id === 'mystery') {
			interestHTML = " to <a href='#'>"+msg.item.interest.title+"</a>";
		} else {
			interestHTML = " to <a href='#' class='linktoInterest'>"+msg.item.interest.title+"</a>";
		}

		$(divID).html(offerHTML + interestHTML);
		$(".linktoOffer").click(function(){
			$.ajax({
				type: "GET",
				url: "/listing/users/"+msg.item.offer._id,
				async: false,
				success: function (data) {
					viewing = data;
				}
			});
			goToListingPage(msg.item.offer._id);
		});
		$(".linktoInterest").click(function(){
			$.ajax({
				type: "GET",
				url: "/listing/users/"+msg.item.interest._id,
				async: false,
				success: function (data) {
					viewing = data;
				}
			});
			goToListingPage(msg.item.interest._id);
		});
		$(divID).show();
	} else {
		$(divID).hide();
	}
}

function openOutBoxMessage(msg) {
	$("#messageBoxOutbox").show();
	$("#outboxFrom").text("from: "+msg.sender.displayname+" ("+msg.sender.email+")");
	$("#outboxTo").text("to: "+msg.receiver.displayname+" ("+msg.receiver.email+")");
	$("#sentdate").text("date: "+msg.dateCreated);
	$("#outboxContent").text(msg.content);

	printTradingInfo(msg, "#outboxtradingInfo");
}

function readFile(input) {
      if (input.files && input.files[0]) {
          //console.log("hello" +input.files[0]);

          var reader = new FileReader();
          var formData = new FormData();
          // NOT WORKING
          reader.onload = function (e) {
            formData.append('file', input.files[0]);
            updatePic();
          }
          reader.readAsDataURL(input.files[0]);
          //updatePic();
          // update picture in database
          function updatePic() {
            $.ajax({
              url: '/uploadimage',  //Server script to process data
              type: 'POST',
              data: formData,
              cache: false,
              contentType: false,
              processData: false,
              //$('form').serialize(),
              success: function(response) {
                $.ajax({
                  url: '/uploadprofileimage/'+currentuser._id,  //Server script to process data
                  type: 'POST',
                  data: { name : response.filename+"",
                          token : currenttoken
                        },
                  //$('form').serialize(),
                  success: function(resp) {
                    $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+resp.profileimage.mainPicture);

                    $.ajax({
                        type: "GET",
                        url: "/listingbyname/" + resp.profileimage.mainPicture,
                        success: function(data){
                          if (data) {
                            $('#mainlistinglink').attr('name', data._id);
                          }
                        }
                    });
                  }
                });

              }
            });
          }
      }
  }

function readFile2(input) {
      if (input.files && input.files[0]) {
          //console.log("hello" +input.files[0]);

          var reader = new FileReader();
          var formData = new FormData();
          // NOT WORKING
          reader.onload = function (e) {
            formData.append('file', input.files[0]);
            updatePic();
          }
          reader.readAsDataURL(input.files[0]);
          //updatePic();
          // update picture in database
          function updatePic() {
            $.ajax({
              url: '/uploadimage',  //Server script to process data
              type: 'POST',
              data: formData,
              cache: false,
              contentType: false,
              processData: false,
              //$('form').serialize(),
              success: function(response) {
                $.ajax({
                  url: '/uploadmainlistingimage/'+listingview,  //Server script to process data
                  type: 'POST',
                  data: {
                    name : response.filename+"",
                    token : currenttoken
                  },
                  //$('form').serialize(),
                  success: function(resp) {
                    $('#editmainlistingpicture, #mainlistingpic').attr('src', "uploads/"+resp.mainPicture);
                    // Set it to the name of this picture in the profile gallery

                    $.ajax({
                        type: "GET",
                        url: "/listingbyname/" + resp.mainPicture,
                        success: function(data){
                          if (data) {
                            $('#mainlistinglink').attr('name', data._id);
                            setCurrentUser();
                          }
                        }
                    });
                  }
                });

              }
            });
          }
      }
  }

function updateMsgBadge() {
	if (currentuser.newMsgNum == 0) {
		$("#newMessage").text("");
	} else {
		$("#newMessage").text(currentuser.newMsgNum);
	}
}

function moveToWelcome(obj) {
  // Shows user profile in top right corner
  $("#editprofilepage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #editlistingpage, #listingpage").hide();
  $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);
  $("#notSearch").show();

  updateMsgBadge();

  if (obj.displayname == "") {
    $("#profilelink").text(obj.email);
  } else {
    $("#profilelink").text(obj.displayname);
  }

  $("#profilelink").show();
  $(".thumbnailholder").show();

  loadRecommendations();
  loadHomeProfileGallery();

    $("#loginbutton, #signupbutton").hide();
    $("#homepage").show();
}

function moveToMessagePage() {
	$("#homepage, #profilepage, #userbehaviourpage, #listingpage, #edituser, #editprofilepage, #listingpage, #editlistingpage").hide();
	$("#messagePage").show();
  $("#notSearch").show();
	$("#inboxTab").tab("show");
	$.ajax({
		type: "PUT",
		url: "/users/messages/updateStatus/newMsgNum",
		data: {
      token : currenttoken,
			user: currentuser._id
		}
	}).done(function(data){
		currentuser = data;
		updateMsgBadge();
	}).fail(function() {
		console.log("Error: Fail to update newMsgNum.");
	});
	refreshInbox();
}

function moveToProfile(user) {

  $("#edituser, #blueimp-gallery, #messagePage, #editprofilepage, #listingpage, #editlistingpage, #searchScreen").hide();
  $("#messageuser").hide();
  $("#notSearch").show();

  $("#homepage").hide();
  setPageTitle("Profile");

  if (user.displayname == "") {
    $("#displayname").text(user.email);
  } else {
    $("#displayname").text(user.displayname);
  }

  $("#profileemail").text("email: "+user.email);
  $("#description").text(user.description);

  // Get profile image listing id and set its name
  $.ajax({
    type: "GET",
    url: "/listing/" + user.profileimage._id,
    success: function(data){
      if (data) {
        $('#profilepicture').attr('src', "/uploads/"+data.mainPicture);
        $('#mainlistinglink').attr('name', data._id);
      }
    }
  });

  //$('#mainlistinglink').attr('name', "uploads/"+user.profileimage);

  getGallery(user);

  viewing = user;

  if ((currentuser.type === "superadmin") && (currentuser._id != user._id)) {
    if (viewing.type === "regular") {
      $("#toggleadmin").text("Make Admin");
    } else if (viewing.type === "admin") {
      $("#toggleadmin").text("Revoke Admin");
    }
    $("#toggleadmin").show();
  } else {
    $("#toggleadmin").hide();
  }

  // a superadmin or an admin, and not the current user
  if ((currentuser.type === "superadmin" || currentuser.type === "admin") && (currentuser._id != user._id) && (viewing.type === "regular")) {
    $("#edituser").show();
	$("#messageuser").show();
    $("#deleteuser").show();
  }

  if (currentuser.email === viewing.email) {
    $("#edituser").show();
  } else {
	  $("#messageuser").show();
  }

  $("#profilepage").fadeIn();
}

function moveToEditPage(user, own) {
  if (user === currentuser) {
    viewing=currentuser;
  }

  $.ajax({
      type: "GET",
      async: false,
      url: "/getuser/"+currentuser._id,
      success: function(data){
        if (data) {
          currentuser = data;
          //return data;
        }
      }
  });

  $("#homepage,  #editlistingpage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #listingpage").hide();
  setPageTitle("Edit Profile");

  $("#editemail").val(user.email);
  $("#editprofilepicture").attr('src', '/uploads/'+currentuser.profileimage.mainPicture);

  // need a more efficient way to get user
  var getUser = JSON.parse(getUserByEmail(user.email).responseText);

  $("#editdisplayname").val(getUser.displayname);
  $("#editdescription").val(getUser.description);

  if (own === false) {
    $("#changepasswordsection").hide();
  } else {
    $("#changepasswordsection").show();
  }

  $("#editprofilepage").fadeIn();
}

function getUserByEmail(email) {
  var curruser;
  if (!currentuser) {
    curruser = "none";
  } else {
    curruser = currentuser.email;
  }
  return $.ajax({
    type: "GET",
    async: false,
    url: "/users/verify-email/" + email + "/" + curruser
  });
}

function toggleErrorMessage(message, show) {
  if (show === 1) {
    $("#errormessage").fadeOut(function(){
      $("#errormessage").text(message);
      $("#errormessage").fadeIn();
    });
  } else {
    $("#errormessage").fadeOut();
  }
}

function setPageTitle (title) {
  $("#pagetitle").fadeOut("fast", function(){
    $("#pagetitle").text(title);
    $("#pagetitle").fadeIn("fast");
  });
}

function editAlertPopup(message) {
  $("#editmessage").text(message);
  $("#editalert").fadeIn(200).delay(1000).fadeOut(200);
}

function moveToHome() {
  $("#loginOrSignupScreen, #loginbutton, #signupbutton").show();
  $(".loggedInNav").hide();

  $("#homepage, #messagePage, #profilepage, #editprofilepage, #profilelink, #logout, .thumbnailholder, #pagetitle, #userbehaviourpage, #editlistingpage, #listingpage").fadeOut();
  $("#rectangle").hide();
  $('#emailinput,#passwordinput,#cpasswordinput').val("");
  // $("#loginbutton, #signupbutton").fadeIn();
  // var div = $("#rectangle, #loginbutton, #signupbutton");
  //
  // // Moves login out of the way and fades in homepage
  // div.animate({'left': '0%'}, 1300, function(){
  //   fromlogin = true;
  // });

  //WEIRD BUG: WHEN LOGGING OUT AND THEN CLICKING
  //LOG IN, IT  DOESN'T SHOW FIELDS
  //BUT THEN WHEN CLICKING SIGN UP FIRST AND THEN
  //LOG IN IT SHOWS THEM

  currentuser = undefined;
  viewing = undefined;
  currenttoken = undefined;
}

//  home page is actually welcome page
function moveToUserBehaviourPage() {
  $("#homepage, #messagePage, #profilepage, #editprofilepage, #editlistingpage").fadeOut();
  setPageTitle("User Behaviour");
  $('#behaviourtable tbody').remove();

  // Gets all users to display in welcome screen
    $.ajax({
      type: "get",
      url: "/users/behaviour/" + currentuser.email,
      success: function(data){
        var info = data;
         for (var i = 0; i < data.length; i++) {
           var cur = data[i];

           var email = cur.email;
           var userbehaviour= cur.behaviour;

           var behaviourDisplay ="";

          var counts = [userbehaviour.updatecount, userbehaviour.addcount, userbehaviour.deletecount, userbehaviour.specificcount, userbehaviour.allcount, userbehaviour.behaviourcount];
          var max = Math.max.apply(Math.max, counts);
          var countNames = ["Update User Request", "Add User Request", "Delete User Request", "Get User Request", "Get All Users Request", "View Behaviour Request"];
          var maxCountName = countNames[counts.indexOf(max)];

           behaviourDisplay += "<b>Most requested page: </b>" + maxCountName;

           for (var d = 0; d < cur.behaviour.sessioninfo.length; d++) {
             behaviourDisplay += "<br><br><b>Login Date: </b>" + cur.behaviour.sessioninfo[d].date;
             behaviourDisplay += "<br>.....<b>IP Address: </b>" + cur.behaviour.sessioninfo[d].ipaddr;
             behaviourDisplay += "<br>.....<b>User Agent: </b>" + cur.behaviour.sessioninfo[d].useragent;
             behaviourDisplay += "<br>.....<b>Geolocation: </b>" + cur.behaviour.sessioninfo[d].geolocation.lat +", "+cur.behaviour.sessioninfo[d].geolocation.lng;
             behaviourDisplay += "<br>.....<b>Viewing Device: </b>" + cur.behaviour.sessioninfo[d].viewingdevice;

           }

           var table = $("#behaviourtable");

          $('<tr id=><td>'+ cur.email +'</td><td>'+behaviourDisplay+'</td></tr>').appendTo('#behaviourtable');
        }
        $("#userbehaviourpage").fadeIn();
      }
    });

}

function addListing(listing) {
  $('#links').append("<div class=\"col-lg-3 col-md-4 col-sm-6 col-xs-12\"><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ listing.mainPicture +"\" title=\""+listing.title+"\"><img style='width: 350px; height: 170px;' class=\"img-responsive img-thumbnail\" src=\"./uploads/"+listing.mainPicture+"\" alt=\""+listing.title+"\"></a><div class=\"overlay\"><h2>Click to view larger</h2><p><div id="+listing._id+"><a class=\"listinglink\">Listing Page</a></div></p></div></div></div>");
}

function getGallery(user) {
  //empty gallery first
  $('#links').empty();
  //get users gallery photos to display
  for (var i = 0; i < user.gallery.length; i++) {
    //console.log(user.gallery[i]);
    addListing(user.gallery[i]);
  }
}

function goToListingPage(listingid) {
  $("#edituser, #blueimp-gallery, #messagePage, #editprofilepage, #profilepage, #editlistingpage").hide();
  $("#editlisting, #deletelisting, #requestlisting").hide();
  $("#notSearch").show();

  if (currentuser.email === viewing.email) {
	  $("#editlisting, #deletelisting").show();
  } else {
	  $("#requestlisting").show();
  }

  $("#homepage").fadeOut();
  setPageTitle("Listing");

  listingview = listingid;

  $("#postcomment, #cancelcomment").hide();

  //getGallery(user);

  $.ajax({
      type: "GET",
      url: "/listing/" + listingid,
      success: function(data){
        if (data) {

            $("#listingtitle").text(data.title);
            $("#listingdescription").text(data.description);

            $('#mainlistingpic').attr('src', "uploads/"+data.mainPicture);

            //empty gallery first
            $('#listinglinks').empty();
            //get users gallery photos to display
            for (var i = 0; i < data.morePictures.length; i++) {
              var pic = data.morePictures[i];
              //console.log(pic);
              $('#listinglinks').append("<div class=\"col-lg-3 col-md-4 col-sm-6 col-xs-12\"><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ pic +"\" title= \""+ data.title +"\"><img width='350' height='200' class=\"img-responsive img-thumbnail\" src=\"./uploads/"+pic+"\" alt=\""+ data.title +"\"></a><div class=\"overlay\"><h2>Click to view larger</h2></div></div></div>");
            }

            //Don't show delete button
            if (data.profilepic === 1) {
              $("#deletelisting").hide();
            } else {
              $("#deletelisting").show();
            }
            if (data.owner === currentuser._id) {
              $("#requestlisting").hide();
            } else {
              $("#requestlisting").show();
            }
			$("#listingcommentsheading").html("<h3>All Comments (" + commentCount(data) + ")</h3>");
			$("#userprofileimage").attr('src', "uploads/" + currentuser.profileimage);
			$("#userprofileimage").on("click",function() { moveToProfile(currentuser);});
			$("#addcomment").on("click",function() { $("#postcomment, #cancelcomment").show();});
			$("#cancelcomment").on("click",function() {  $("#addcomment").val(""); $("#postcomment, #cancelcomment").hide();});

			$(".sortbutton").mouseenter( function() {
				$(".sortbutton").css("color", "white");
				$(".sortbutton").css("background-color", "gray");
			});
			$(".sortbutton").mouseleave( function() {
				$(".sortbutton").css("color", "black");
				$(".sortbutton").css("background-color", "white");
			});
			var sortCommentS = "Newest First";
			var sortButtonHTML = "<span class=\"caret\"></span>";
			if (sessionStorage.getItem("sortMethod") != null) {
				sortCommentS = sessionStorage.getItem("sortMethod");
			}
			$("#sortcomments").html(sortCommentS + sortButtonHTML);
			var comments = sortComments(sortCommentS, data);
			$("#listingcommentlist").empty();
			for (i = 0; i < commentCount(data)) {
				displayComment(comments[i], "listingcommentlist", data.creater);
			}

			$("#oldestcomments").on("click",function() {
				sessionStorage.setItem("sortMethod", "Oldest First");
				$("#sortcomments").html("Oldest First" + sortButtonHTML);
				comments = sortComments("Oldest First", data);
				$("#listingcommentlist").empty();
				for (i = 0; i < commentCount(data)) {
					displayComment(comments[i], "listingcommentlist", data.creater);
				}
			});
			$("#newestcomments").on("click",function() {
				sessionStorage.setItem("sortMethod", "Newest First");
				$("#sortcomments").html("Newest First" + sortButtonHTML);
				comments = sortComments("Newest First", data);
				$("#listingcommentlist").empty();
				for (i = 0; i < commentCount(data)) {
					displayComment(comments[i], "listingcommentlist", data.creater);
				}
			});
			$("#topcomments").on("click",function() {
				sessionStorage.setItem("sortMethod", "Top Comments");
				$("#sortcomments").html("Top Comments" + sortButtonHTML);
				comments = sortComments("Top Comments", data);
				$("#listingcommentlist").empty();
				for (var i = 0; i < commentCount(data)) {
					displayComment(comments[i], "listingcommentlist", data.creater);
				}
			});
			
			$("#postcomment").submit(function(e){
				e.preventDefault();
				if (!$("#addcomment").val()){
					toggleErrorMessage("Please fill in a comment.", 1);
					return ;
				}
				$.ajax({
				  type: "PUT",
				  url: "/listing/comment/" + listingid,
				  data: {
					message: $("#addcomment").val(),
					user: currentuser._id
				  },
				  success: function(data) {
					$("#addcomment").val("");
					displayComment(data, "listingcommentlist", data.creater);
				  }
				});
			});

        $("#listingpage").fadeIn();

        }
      }
  });

}

function goToEditListingPage() {
  $("#edituser, #blueimp-gallery, #editprofilepage, #messagePage, #profilepage, #listingpage").hide();
  $("#notSearch").show();

  $.ajax({
      type: "GET",
      url: "/listing/" + listingview,
      success: function(data){
        if (data) {
            listingview = data._id;
            $("#editlistingtitle").val(data.title);
            $("#editlistdescription").val(data.description);

            $('#editmainlistingpicture').attr('src', "uploads/"+data.mainPicture);

            $("#editlistingpage").fadeIn();

        }
      }
  });

}

function setCurrentUser() {
  $.ajax({
      type: "GET",
      url: "/getuser/"+currentuser._id,
      async: false,
      success: function(data){
        if (data) {
          currentuser = data;
          return data;
        }
      }
  });
}

function loadRecommendations() {


}

function loadHomeProfileGallery () {
  $('#linksownhome').empty();
  //get users gallery photos to display
  var otherPic;
  $.ajax({
      type: "GET",
      async: false,
      url: "/getuser/"+currentuser._id,
      success: function(data){
        if (data) {
          currentuser = data;
          //return data;
        }
      }
  });
  for (var i = 0; i < currentuser.gallery.length; i++) {

    if (currentuser.gallery[i].morePictures.length > 0) {
      //More than one picture
      $('#linksownhome').append(
      "<div class = 'row'>"+
        "<div class='col-xs-12 col-sm-6 col-lg-6'>"+
          "<div class='hovereffect'>"+
            "<a class='photo' href='./uploads/"+ currentuser.gallery[i].mainPicture +"' title='"+ currentuser.gallery[i].title +"'>"+
              "<img class='img-responsive img-thumbnail' src='./uploads/"+ currentuser.gallery[i].mainPicture +"' alt='"+ currentuser.gallery[i].title +"'>"+
            "</a>"+
            "<div class='overlay'>"+
              "<h2>Click to view larger</h2>"+
            "</div>"+
          "</div>"+
          "<h4>"+ currentuser.gallery[i].title +"</h4>"+
          "<p>"+ currentuser.gallery[i].description +"</p>"+
        "</div>"+
        "<div class='col-xs-12 col-sm-6 col-lg-6'>"+
          "<div class='hovereffect'>"+
            "<a class='photo' href='./uploads/"+ currentuser.gallery[i].morePictures[0] +"' title='"+ currentuser.gallery[i].title +"'>"+
              "<img class='img-responsive img-thumbnail' src='./uploads/"+ currentuser.gallery[i].morePictures[0] +"' alt='"+ currentuser.gallery[i].title +"'>"+
            "</a>"+
            "<div class='overlay'>"+
              "<h2>Click to view larger</h2>"+
            "</div>"+
          "</div>"+
        "</div>"+
      "</div>");
    } else {
      $('#linksownhome').append(
      "<div class = 'row'>"+
        "<div class='col-xs-12 col-sm-6 col-lg-6'>"+
          "<div class='hovereffect'>"+
            "<a class='photo' href='./uploads/"+ currentuser.gallery[i].mainPicture +"' title='"+ currentuser.gallery[i].title +"'>"+
              "<img class='img-responsive img-thumbnail' src='./uploads/"+ currentuser.gallery[i].mainPicture +"' alt='"+ currentuser.gallery[i].title +"'>"+
            "</a>"+
            "<div class='overlay'>"+
              "<h2>Click to view larger</h2>"+
            "</div>"+
          "</div>"+
          "<h4>"+ currentuser.gallery[i].title +"</h4>"+
          "<p>"+ currentuser.gallery[i].description +"</p>"+
        "</div>"+
        "<div class='col-xs-12 col-sm-6 col-lg-6'>"+

        "</div>"+
      "</div>");

    }

    //console.log(user.gallery[i]);
    //$('#linksownhome').append('<div class=\'col-lg-3 col-md-4 col-sm-6 col-xs-12\'><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ listing.mainPicture +"\" title=\""+listing.title+"\"><img class=\"img-responsive img-thumbnail\" src=\"./uploads/"+listing.mainPicture+"\" alt=\""+listing.title+"\"></a><div class=\"overlay\"><h2>Click to view larger</h2><p><div id="+listing._id+"><a class=\"listinglink\">Listing Page</a></div></p></div></div></div>");
  }


}

function goToUser(email) {
  var testing = getUserByEmail(email);
  console.log(JSON.parse(testing.responseText));

  moveToProfile(JSON.parse(getUserByEmail(email).responseText));
}
