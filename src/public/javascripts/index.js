$(function () {
  $.ajax({
    method: "GET",
    url: "/api/profile"
  }).done((profile) => {
    $("#profile-name")
      .val(profile.name)
      .on("input", (event) => {
        if ($("#profile-name + img").length == 0) {
          $("#profile-name").parent().append("<img src='/images/asterisk.png' />");
        } else {
          $("#profile-name + img").attr("src", "/images/asterisk.png");
        }
      })
      .on("change", (event) => {
        $.ajax({
          method: "PATCH",
          url: "/api/profile",
          data: { name: $("#profile-name").val() }
        }).done((data) => {
          if (data.name) {
            $("#profile-name + img").attr("src", "/images/check.png");
          } else {
            $("#profile-name + img").attr("src", "/images/cross.png");
          }
        }).fail((data) => {
          $("#profile-name + img").attr("src", "/images/cross.png");
        })
      });
  });
});

$(function () {
  var min = $("#create-room-minmovies");
  var max = $("#create-room-maxmovies");
  min.on("change", (event) => {
    if (min.val() > max.val()) {
      min.val(max.val());
    } else if (min.val() < 0) {
      min.val(0);
    }
    min.val(Math.floor(min.val()));
  });
  max.on("change", (event) => {
    if (max.val() < min.val()) {
      max.val(min.val());
    }
    max.val(Math.floor(max.val()));
  });
});

$(function () {
  $("#createroom-create").on("click", (event) => {
    $.ajax({
      method: "POST",
      url: "/api/rooms",
      data: {
        minperuser: parseInt($("#create-room-minmovies").val()),
        maxperuser: parseInt($("#create-room-maxmovies").val()),
        candropinvote: $("#create-form-dropinvote").is(':checked')
      }
    }).done((data) => {
      window.location = data.url
    }).fail((jqXhr) => {
      var data = jqXhr.responseJSON;
      var errorUl = $("#createform-errors");
      errorUl.children().remove();
      for (var error of data.errors) {
        errorUl.append("<li class='list-group-item'>" + error + "</li>");
      }
    });
  })
})