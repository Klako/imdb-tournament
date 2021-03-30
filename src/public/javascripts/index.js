(function () {
  var profile = new Vue({
    el: '#profile',
    data: {
      profileName: '',
      statusImage: '/images/check.png'
    },
    methods: {
      input: function () {
        this.statusImage = '/images/asterisk.png';
      },
      change: function (event) {
        $.ajax({
          method: "PATCH",
          url: "/api/profile",
          data: {
            name: this.profileName
          }
        }).done((result) => {
          if (result.name) {
            this.statusImage = '/images/check.png';
          } else {
            this.statusImage = '/images/cross.png';
          }
        }).fail(() => {
          this.statusImage = '/images/cross.png';
        });
      }
    }
  });
  $.ajax({
    method: "GET",
    url: "/api/profile"
  }).done((data) => {
    profile.profileName = data.name;
  })
})();

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