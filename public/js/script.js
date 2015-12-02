var login = 0; //0 if logging in, 1 if signing up
var currentuser;
var fromlogin = true;
var viewing; //the persons profile being viewed
var loclat = 0;
var loclng = 0;

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
  $("#homepage, #profilelink, #profilepage, .thumbnailholder, #editprofilepage, #editalert, #edituser, #deleteuser,#logout,#viewbehaviour, #userbehaviourpage").hide();
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
              $(".loggedInNav").show();
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
              $(".loggedInNav").show();
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

  /**
  CLICKS LOGO TO GO BACK TO WELCOME PAGE
  */
  $("#logo, #cancelbutton").click(function(){
    if (currentuser) {
      moveToWelcome(JSON.parse(getUserByEmail(currentuser.email).responseText));
    } //will keep them at home page
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
            password : $("#newpass").val(),
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

  $("#logout").click(function(){
    $("#viewbehaviour").fadeOut();
    moveToHome();

  });

  $("#viewbehaviour").click(function(){
    moveToUserBehaviourPage();
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
      //$('form').serialize(),
      success: function(response) {
        //console.log(JSON.stringify(response));
        $('#editprofilepicture, #profilepicture').attr('src', "uploads/"+response.profileimage);
        // Also change their own thumbnail
        //$('#miniprofilepicture').attr('src', e.target.result);

      }
    });
    //$('#editprofilepicture').attr('src', "uploads/"+resp.profileimage);

  });


});

function readFile(input) {
      if (input.files && input.files[0]) {
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
              url: '/uploadimage/'+currentuser._id,  //Server script to process data
              type: 'POST',
              data: formData,
              cache: false,
              contentType: false,
              processData: false,
              //$('form').serialize(),
              success: function(response) {
                //console.log(JSON.stringify(response));
                $('#editprofilepicture, #profilepicture').attr('src', "data:image/png;base64,"+btoa(response.profileimage.data));
                // Also change their own thumbnail
                //$('#miniprofilepicture').attr('src', e.target.result);

              }
            });
          }
      }
  }

function moveToWelcome(obj) {
  // Shows user profile in top right corner
  $("#editprofilepage, #profilepage, #userbehaviourpage").hide();
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
  $("#edituser").hide();
  $("#deleteuser").hide();

  $("#homepage").fadeOut();
  setPageTitle("Profile");

  if (user.displayname == "") {
    $("#displayname").text(user.email);
  } else {
    $("#displayname").text(user.displayname);
  }

  $("#profileemail").text("email: "+user.email);
  $("#description").text(user.description);

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
    $("#deleteuser").show();
  }

  if (currentuser.email === viewing.email) {
    $("#edituser").show();
  }

  $("#profilepage").fadeIn();
}

function moveToEditPage(user, own) {
  if (user === currentuser) {
    viewing=currentuser;
  }

  $("#homepage, #profilepage, #userbehaviourpage").fadeOut();
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
  $("#homepage, #profilepage, #editprofilepage, #profilelink, #logout, .thumbnailholder, #pagetitle, #userbehaviourpage").fadeOut();
  $("#rectangle").hide();
  $('#emailinput,#passwordinput,#cpasswordinput').val("");
  $("#loginbutton, #signupbutton").fadeIn();
  var div = $("#rectangle, #loginbutton, #signupbutton");

  // Moves login out of the way and fades in homepage
  div.animate({'left': '0%'}, 1300, function(){
    fromlogin = true;
  });

  currentuser = undefined;
  viewing = undefined;
}

//  home page is actually welcome page
function moveToUserBehaviourPage() {
  $("#homepage, #profilepage, #editprofilepage").fadeOut();
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
