var login = 0; //0 if logging in, 1 if signing up
var currentuser;
var fromlogin = true;
var re;
var viewing; //the persons profile being viewed
var loclat = 0;
var loclng = 0;
var listingview; //id of listing being viewed

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

function displayComment(target, comment) {
	
	var m = "<p>" + comment.message + "</p>";
	var n = m.replace(/(https?:\/\/[^\s]+)/g, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
	var displayC = "<div class=\"comment\" ";
	displayC += "id=\"" + comment._id + "\" >";
		displayC += "<div class=\"col-sm-2\">";
			displayC += "<img src=\"uploads/"; 
			displayC += cumment.createrInfo.profileimage;
			displayC += "\" class=\"img-rounded\" width=\"60\" height=\"60\" id=\"userprofileimage" + comment._id + "\" />";
		displayC += "</div>";
		displayC += "<div class=\"col-sm-10\" id=\"content" + comment._id + "\">";
			displayC += "<p id=\"username" + comment._id +"\">" + cumment.createrInfo.displayname + "</p>";
			displayC += m;
		displayC += "</div>";
	displayC += "</div>";
	$(target).append(displayC);
}

//Comment Helper Functions end here

function onSignIn(googleUser) {
    gapi.auth2.init();
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());
}

$(document).ready(function(){
  /* Hide things on startup */
  $("#loginheader, #signupheader, #errormessage, .loggedInNav").hide();
  $("#homepage, #messagePage, #listingpage, #searchScreen, #profilelink, #profilepage, .thumbnailholder, #editprofilepage, #messageuser, #editalert, #edituser, #deleteuser,#logout,#viewbehaviour, #userbehaviourpage, #editlistingpage").hide();

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
    $("#loginheader").show();
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
      // Gets user information to log in. Check if password correct.
      $.ajax({
        type: "GET",
        url: "/users/verify-email/login/" + $("#emailinput").val() + "/" + loclat + "&" + loclng,
        success: function(data){
          if (data) {
            if (data.password === $("#passwordinput").val()) {
              currentuser = data;
              $("#loginOrSignupModal").modal("hide");
              $("#loginOrSignupScreen").hide();
              $(".loggedInNav").show();

              // set profile picture
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);

              //$("#logout").fadeIn();
              //if (currentuser.type === "admin" || currentuser.type === "superadmin") {
                //$("#viewbehaviour").fadeIn();
              //}

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
              currentuser = user;
              $("#loginOrSignupModal").modal("hide");
              $("#loginOrSignupScreen").hide();
              $(".loggedInNav").show();

              // set profile picture
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);

              //$("#logout").fadeIn();

              //if (currentuser.type === "admin" || currentuser.type === "superadmin") {
                //$("#viewbehaviour").fadeIn();
              //}

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
                "<div class='panel panel-primary'>"
                  + "<div class='panel-heading'>"
                      + "<h3 class='panel-title'>" + data[0][i].email +"</h3>"
                  + "</div>"
                  + "<div class='panel-body'>"
                      + "<img src='" + data[0][i].profileimage + "'>"
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
                      + "<img src='" + data[1][i].mainPicture +"'>"
                  + "</div>"
                + "</div>");
            }
            $("#searchScreen").show();
          }
        }
    });
  });

  /**
  USER UPLOADS A NEW PROFILE PICTURE -- Don't have to do this anymore!! Already done!!
  */
  $("#newProfilePic").submit(function(event) {
    $.ajax({
        type: "GET",
        url: "/"
        //data: $("#newProfilePic").serialize(),
        //success: function(data){
          //if (data) {
            //console.log(data);
          //}
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
  $("#logo, #cancelbutton").click(function(){
    if (currentuser) {
      moveToWelcome(JSON.parse(getUserByEmail(currentuser.email).responseText));
    } //will keep them at home page
  });

  $("#cancellistingbutton").click(function(){
    goToListingPage(listingview);
  });

  /**
  CLICKS UPDATE BUTTON TO BRING BACK TO CHANGE INFORMATION
  */
  $("#editProfileForm").submit(function (event) {
    event.preventDefault();
    $.ajax({
      type: "PUT",
      url: "/users/update/" + viewing.email+ "/"+currentuser.email, // technically viewing should be current if they are looking at their own
      data: {
        displayname : $("#editdisplayname").val(),
        description : $("#editdescription").val()
      },
      success: function(data) {
        currentuser = JSON.parse(getUserByEmail(currentuser.email).responseText);
        viewing = data;
        editAlertPopup("Updated.");
      }
    });
  });


  $("#messageuser").click(function() {
	  $("#messageHeader").show();
	  $("#replyHeader").hide();
	  $("#recipient").text("To: " + viewing.displayname);
	  $("#messageText").val("");
	  re = false;
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
	  $.ajax({
		type: "PUT",
		url: "/users/messages/send",
		data: {
			from: currentuser._id,
			to: viewing._id,
			content: $("#messageText").val(),
			request: false,
			reply: re
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
            url: "/users/verify-email/"+currentuser.email+"/none",
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
        title : $("#editlistingtitle").val(),
        description : $("#editlistdescription").val()
      },
      success: function(data) {
        listingview = data._id;
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
        url: "/users/verify-email/"+currentuser.email+"/none",
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
      $.ajax({
        type: "PUT",
        url: "/listings/update/" + listingview +"/"+currentuser._id,
        data: {
          title : $("#listingtitleinitialedit").val(),
          description : $("#listingdescrinitialedit").val()
        },
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
      data: { name : resp.filename+"" },
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
      data: { name : resp.filename+"" },
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
	$("#replyInbox").click(function() {
		$("#messageHeader").hide();
		$("#replyHeader").show();
		$("#recipient").text("To: "+ msg.sender.displayname);
		$("#messageText").val("");
		viewing = msg.sender;
		re = true;
	});
	if (msg.unread) {
		$.ajax({
			type: "PUT",
			url: "/users/messages/updateStatus",
			data: {
				user: currentuser._id,
				message: msg._id
			}
		}).fail(function() {
			console.log("Error: Fail to update message status.");
		});
	}
}

function openOutBoxMessage(msg) {
	$("#messageBoxOutbox").show();
	$("#outboxFrom").text("from: "+msg.sender.displayname+" ("+msg.sender.email+")");
	$("#outboxTo").text("to: "+msg.receiver.displayname+" ("+msg.receiver.email+")");
	$("#sentdate").text("date: "+msg.dateCreated);
	$("#outboxContent").text(msg.content);
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
                  data: { name : response.filename+""
                          //oldpic :
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
                  data: { name : response.filename+"" },
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
  $("#editprofilepage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #editlistingpage").hide();
  $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage.mainPicture);

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

  // Gets all users to display in welcome screen --USE FOR ADMIN?
    // $.ajax({
    //   type: "get",
    //   url: "/users/all/"+currentuser.email,
    //   success: function(data){
    //     var info = data;
    //     for (var i = 0; i < data.length; i++) {
    //       var displayname;
    //
    //       var ok = false;
    //
    //       var table = $("#usertable");
    //       $("#usertable tr:not(:first)").each(function() {
    //       //get the value of the table cell located in the first column
    //
    //       var valueOfCell = $(this).find("td:nth-child(1)").html();
    //
    //       $.when((getUserByEmail(valueOfCell)).done(function(user){
    //         if (!user) {
    //           $('#'+user._id).remove();
    //         }
    //       }));
    //
    //       if (valueOfCell == data[i].email){
    //         if (data[i].displayname != "" && $(this).find("td:nth-child(2)").html() != data[i].displayname) {
    //           $(this).find("td:nth-child(2)").html(data[i].displayname);
    //         }
    //         ok = true;
    //       } else {
    //
    //       }
    //       });
    //
    //       if (!ok) {
    //         if (data[i].displayname === "") {
    //           displayname = data[i].email;
    //         } else {
    //           displayname = data[i].displayname;
    //         }
    //
    //         $('<tr id='+ data[i]._id +'><td>'+ data[i].email +'</td><td>'+displayname+'</td></tr>').appendTo('#usertable');
    //
    //
    //       }
    //     }
    //   }
    // });

    $("#loginbutton, #signupbutton").hide();
    $("#homepage").show();
}

function moveToMessagePage() {
	$("#homepage, #profilepage, #userbehaviourpage, #listingpage, #edituser, #editprofilepage, #listingpage, #editlistingpage").hide();
	$("#messagePage").show();
	$.ajax({
		type: "PUT",
		url: "/users/messages/updateStatus/newMsgNum",
		data: {
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

  $("#edituser, #blueimp-gallery, #messagePage, #editprofilepage, #listingpage, #editlistingpage").hide();
  $("#messageuser").hide();

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
      url: "/users/verify-email/"+currentuser.email+"/none",
      success: function(data){
        if (data) {
          currentuser = data;
          //return data;
        }
      }
  });

  $("#homepage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #listingpage").hide();
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
  $('#links').append("<div class=\"col-lg-3 col-md-4 col-sm-6 col-xs-12\"><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ listing.mainPicture +"\" title=\""+listing.title+"\"><img class=\"img-responsive img-thumbnail\" src=\"./uploads/"+listing.mainPicture+"\" alt=\""+listing.title+"\"></a><div class=\"overlay\"><h2>Click to view larger</h2><p><div id="+listing._id+"><a class=\"listinglink\">Listing Page</a></div></p></div></div></div>");
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
  $("#deleteuser").hide();

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
              $('#listinglinks').append("<div class=\"col-lg-3 col-md-4 col-sm-6 col-xs-12\"><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ pic +"\" title= \""+ data.title +"\"><img class=\"img-responsive img-thumbnail\" src=\"./uploads/"+pic+"\" alt=\""+ data.title +"\"></a><div class=\"overlay\"><h2>Click to view larger</h2></div></div></div>");
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
			
			var sortComments = "Newest First";
			var sortButtonHTML = "<span class=\"caret\"></span>";
			if (sessionStorage.getItem("sortMethod") != null) {
				sortComments = sessionStorage.getItem("sortMethod");
			}
			$("#sortcomments").html(sortComments + sortButtonHTML);
			
			$("#oldestcomments").on("click",function() { 
				sessionStorage.setItem("sortMethod", "Oldest First");
				$("#sortcomments").html("Oldest First" + sortButtonHTML);
			});
			$("#newestcomments").on("click",function() { 
				sessionStorage.setItem("sortMethod", "Newest First");
				$("#sortcomments").html("Newest First" + sortButtonHTML);
			});
			$("#topcomments").on("click",function() { 
				sessionStorage.setItem("sortMethod", "Top Comments"); 
				$("#sortcomments").html("Top Comments" + sortButtonHTML);			
			});
			
            $("#listingpage").fadeIn();

        }
      }
  });

}

function goToEditListingPage() {
  $("#edituser, #blueimp-gallery, #editprofilepage, #messagePage, #profilepage, #listingpage").hide();

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
      url: "/users/verify-email/"+currentuser.email+"/none",
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
      url: "/users/verify-email/"+currentuser.email+"/none",
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
