var login = 0; //0 if logging in, 1 if signing up
var currentuser;
var fromlogin = true;
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

$(document).ready(function(){
  /* Hide things on startup */
  $("#loginheader, #signupheader, #errormessage, .loggedInNav").hide();
  $("#homepage, #listingpage, #searchScreen, #profilelink, #profilepage, .thumbnailholder, #editprofilepage, #messageuser, #editalert, #edituser, #deleteuser,#logout,#viewbehaviour, #userbehaviourpage, #editlistingpage").hide();


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
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage);

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
              $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage);

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
            for(var i = 0; i < data.length; i++){
              $("#userSearchResults").append(
                "<div class='panel panel-primary'>"
                  + "<div class='panel-heading'>"
                      + "<h3 class='panel-title'>" + data[i].email +"</h3>"
                  + "</div>"
                  + "<div class='panel-body'>"
                      //+ "<img src='" + data[i].)
                      + "<p>" + data[i].description + "</p>"
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

   console.log(tableData);
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

  $("#messageModal").on("show.bs.modal", function(event) {
	  var modal = $(this);
	  modal.find("#recipient").text("To: " + viewing.displayname);
	  modal.find("#messageText").val("");
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
		url: "/users/messages",
		data: {
			from: currentuser._id,
			to: viewing._id,
			content: $("#messageText").val(),
			request: false,
			reply: false
		}
	  }).always(function() {
		  console.log("run");
		  $("#messageModal").modal("hide");
	  }).fail(function() {
		  console.log("Error: message cannot be sent.");
	  });
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
      url: "/listings/update/" + listingview,
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

  $("li.navprofile").on("click",function() {
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

  var uploader = new Dropzone('#demo-upload');

  uploader.on('success', function (file, resp) {

    uploader.processQueue();
    console.log(file);
    console.log(resp);

    $.ajax({
      url: '/uploadimage/'+currentuser._id,  //Server script to process data
      type: 'POST',
      data: { name : resp.filename+"" },
      success: function(response) {
        currentuser = response;
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
    console.log(file);
    console.log(resp);

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

function readFile(input) {
      if (input.files && input.files[0]) {
          console.log("hello" +input.files[0]);

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
                  data: { name : response.filename+"" },
                  //$('form').serialize(),
                  success: function(resp) {
                    $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+resp.profileimage);

                    $.ajax({
                        type: "GET",
                        url: "/listingbyname/" + resp.profileimage,
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
          console.log("hello" +input.files[0]);

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

function moveToWelcome(obj) {
  // Shows user profile in top right corner
  $("#editprofilepage, #blueimp-gallery, #profilepage, #userbehaviourpage, #editlistingpage").hide();
  $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+currentuser.profileimage);


  if (obj.displayname == "") {
    $("#profilelink").text(obj.email);
  } else {
    $("#profilelink").text(obj.displayname);
  }

  //$("#profilelink").text(obj.email);
  $("#profilelink").show();
  $(".thumbnailholder").show();

  // Gets all users to display in welcome screen
    $.ajax({
      type: "get",
      url: "/users/all/"+currentuser.email,
      success: function(data){
        var info = data;
        for (var i = 0; i < data.length; i++) {
          var displayname;

          var ok = false;

          var table = $("#usertable");
          $("#usertable tr:not(:first)").each(function() {
          //get the value of the table cell located in the first column

          var valueOfCell = $(this).find("td:nth-child(1)").html();

          $.when((getUserByEmail(valueOfCell)).done(function(user){
            if (!user) {
              $('#'+user._id).remove();
            }
          }));

          if (valueOfCell == data[i].email){
            if (data[i].displayname != "" && $(this).find("td:nth-child(2)").html() != data[i].displayname) {
              $(this).find("td:nth-child(2)").html(data[i].displayname);
            }
            ok = true;
          } else {

          }
          });

          if (!ok) {
            if (data[i].displayname === "") {
              displayname = data[i].email;
            } else {
              displayname = data[i].displayname;
            }

            $('<tr id='+ data[i]._id +'><td>'+ data[i].email +'</td><td>'+displayname+'</td></tr>').appendTo('#usertable');


          }
        }
      }
    });

  //if (fromlogin) {

    //var div =
    $("#loginbutton, #signupbutton").hide();

    // Moves login out of the way and fades in homepage
    //div.animate({'left': '1500px'}, 1300, function(){

      var display;

        if (obj.displayname == "") {
          display = obj.email;
        } else {
          display = obj.displayname;
        }

        setPageTitle("Welcome " + display + "!");
        $("#homepage").show();
    //});
    //fromlogin = false;
  //} else {
    //var display;

      //if (obj.displayname == "") {
        //display = obj.email;
      //} else {
        //display = obj.displayname;
      //}

      //setPageTitle("Welcome " + display + "!");
      //$("#homepage").fadeIn();
    //}

}

function moveToProfile(user) {
  $("#edituser, #blueimp-gallery, #editprofilepage, #listingpage, #editlistingpage").hide();
  $("#messageuser").hide();
  //$("#deleteuser").hide();

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
      url: "/listingbyname/" + user.profileimage,
      success: function(data){
        if (data) {
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

  $("#homepage, #blueimp-gallery, #profilepage, #userbehaviourpage, #listingpage").hide();
  setPageTitle("Edit Profile");

  $("#editemail").val(user.email);

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

  $("#homepage, #profilepage, #editprofilepage, #profilelink, #logout, .thumbnailholder, #pagetitle, #userbehaviourpage, #editlistingpage, #listingpage").fadeOut();
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
  $("#homepage, #profilepage, #editprofilepage, #editlistingpage").fadeOut();
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
    console.log(user.gallery[i]);
    addListing(user.gallery[i]);
  }
}

function goToListingPage(listingid) {
  $("#edituser, #blueimp-gallery, #editprofilepage, #profilepage, #editlistingpage").hide();
  $("#deleteuser").hide();

  $("#homepage").fadeOut();
  setPageTitle("Listing");

  listingview = listingid;

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
              console.log(pic);
              $('#listinglinks').append("<div class=\"col-lg-3 col-md-4 col-sm-6 col-xs-12\"><div class=\"hovereffect\"><a class=\"photo\" href=\"./uploads/"+ pic +"\" title= \"Listing\"><img class=\"img-responsive img-thumbnail\" src=\"./uploads/"+pic+"\" alt=\"Listing\"></a><div class=\"overlay\"><h2>Click to view larger</h2></div></div></div>");
            }

            $("#listingpage").fadeIn();

        }
      }
  });

}

function goToEditListingPage() {
  $("#edituser, #blueimp-gallery, #editprofilepage, #profilepage, #listingpage").hide();

  $.ajax({
      type: "GET",
      url: "/listing/" + listingview,
      success: function(data){
        if (data) {
            listingview = data._id;
            $("#editlistingtitle").text(data.title);
            $("#editlistdescription").text(data.description);

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
      success: function(data){
        if (data) {
          currentuser = data;
          return data;
        }
      }
  });

}
