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
  var createModal = new Vue({
    el: '#createroom',
    data: {
      minperuser: 2,
      maxperuser: 4,
      candropinsvote: false
    },
    methods: {
      changeMinPerUser: function () {
        if (this.minperuser > this.maxperuser) {
          this.minperuser = this.maxperuser;
        } else if (this.minperuser < 0) {
          this.minperuser = 0;
        }
        this.minperuser = Math.floor(this.minperuser);
      },
      changeMaxPerUser: function () {
        if (this.maxperuser < this.minperuser) {
          this.maxperuser = this.minperuser;
        }
        this.maxperuser = Math.floor(this.maxperuser);
      },
      create: function () {
        $.ajax({
          method: "POST",
          url: "/api/rooms",
          data: {
            minperuser: this.minperuser,
            maxperuser: this.maxperuser,
            candropinvote: this.candropinsvote
          }
        }).done((data) => {
          window.location = data.url
        });
      }
    }
  });
})();