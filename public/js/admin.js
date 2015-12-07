var viewing;
$(document).ready(function(){
  /* Hide things on startup */
  $("#errormessage, .loggedInNav").hide();
  $("#homepage, #messagePage, #listingpage, #searchScreen, #profilelink, #profilepage, .thumbnailholder, #editprofilepage, #messageuser, #editalert, #edituser, #deleteuser,#logout,#viewbehaviour, #userbehaviourpage, #editlistingpage").hide();

  $("#adminLoginForm").submit(function(event){
      event.preventDefault();
      // Check for empty fields
      if (!$("#passwordinput").val() || !$("#usernameinput").val()) {
        toggleErrorMessage("Please fill all fields.", 1);
        return;
      }

      $.ajax({
        type: "GET",
        url: "/admin/verifylogin/" + $("#usernameinput").val(),
        success: function(data){
          if (data) {
            if (data.password === $("#passwordinput").val()) {
              $(".loggedInNav").show();
              moveToWelcome();
            } else {
              toggleErrorMessage("Password incorrect.", 1);
            }
          } else {
            toggleErrorMessage("Username not found.", 1);
          }
        }
      });
  });

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

  function moveToWelcome() {
    // Shows user profile in top right corner
    $("#adminLoginScreen, #editprofilepage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #editlistingpage").hide();

    $(".thumbnailholder").show();

    // Gets all users to display in welcome screen
      $.ajax({
        type: "get",
        url: "/admin/all",
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

      $("#loginbutton, #signupbutton").hide();
          $("#homepage").show();
  }

  function getUserByEmail(email) {
    //var curruser;
    //if (!currentuser) {
      //curruser = "none";
    //} else {
      //curruser = currentuser.email;
    //}
    return $.ajax({
      type: "GET",
      async: false,
      url: "/users/verify-email/" + email + "/" + email
    });
  }

  $('#usertable').on("click", "tr", function(){
    var tableData = $(this).children("td").map(function() {
       return $(this).text();
   }).get();

   console.log(tableData);
   if (tableData.length != 0) {
     moveToEditPage(JSON.parse(getUserByEmail(tableData[0]).responseText));
   }
  });

  function moveToEditPage(user) {
    viewing = user;

    $("#homepage, #blueimp-gallery, #messagePage, #profilepage, #userbehaviourpage, #listingpage").hide();
    //setPageTitle("Edit Profile");

    $("#editemail").val(user.email);

    // need a more efficient way to get user
    var getUser = JSON.parse(getUserByEmail(user.email).responseText);

    $("#editdisplayname").val(getUser.displayname);
    $("#editdescription").val(getUser.description);
    $("#changepasswordsection").show();
    $("#deleteuser").show();
    $("#editprofilepage").fadeIn();
  }
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
    if (viewing) {
      moveToWelcome();
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
      url: "/users/update/" + viewing.email+ "/"+viewing.email, // technically viewing should be current if they are looking at their own
      data: {
        displayname : $("#editdisplayname").val(),
        description : $("#editdescription").val()
      },
      success: function(data) {
        viewing = data;
        //editAlertPopup("Updated.");
      }
    });
  });

  $("#changePasswordForm").submit(function (event) {
    event.preventDefault();
    //CHECK IF OLD PASSWORD IS correct
    if ($("#oldpass").val() === viewing.password) {
      if ($("#newpass").val() === $("#confirmpass").val()) {
        // AJAX CALL TO UPDATE PASSWORD
        $.ajax({
          type: "PUT",
          url: "/users/update/" + viewing.email + "/" + viewing.email,
          data: {
            password : $("#newpass").val()
          },
          success: function(data) {
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

  $("#deleteuser").click(function() {
    $.ajax({
      url: "/users/" + viewing._id+"/"+viewing.email,
      type: 'DELETE',
      success: function () {
        moveToWelcome();
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

  function setPageTitle (title) {
    $("#pagetitle").fadeOut("fast", function(){
      $("#pagetitle").text(title);
      $("#pagetitle").fadeIn("fast");
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
    $("#edituser, #blueimp-gallery, #messagePage, #editprofilepage, #profilepage, #editlistingpage").hide();
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
    $("#edituser, #blueimp-gallery, #editprofilepage, #messagePage, #profilepage, #listingpage").hide();

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

});