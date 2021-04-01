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

(function () {
  $("#joinroom").on('click', () => {
    $.ajax({
      method: "POST",
      url: "/api/rooms/" + roomId + "/users"
    }).done(() => {
      window.location.reload();
    });
  });
})();