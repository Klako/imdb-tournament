var profilePromise = $.ajax({
  method: "GET",
  url: "/api/profile"
});

var roomPromise = $.ajax({
  method: "GET",
  url: "/api/rooms/" + roomId
});

(function () {
  var moviegrid = new Vue({
    el: '#moviegrid',
    data: {
      users: []
    },
    methods: {
      removeMovie: function (id) {
        $.ajax({
          method: "DELETE",
          url: "/api/rooms/" + roomId + "/movies/" + id
        });
      }
    }
  });
  (async () => {
    while (true) {
      var [users, movies] = await Promise.all([
        $.ajax({
          method: "GET",
          url: "/api/rooms/" + roomId + "/users"
        }),
        $.ajax({
          method: "GET",
          url: "/api/rooms/" + roomId + "/movies"
        })
      ]);
      var profile = await profilePromise;
      var room = await roomPromise;
      moviegrid.users = users.map((user) => ({
        id: user.id,
        isYou: profile.id == user.id,
        isRoomOwner: user.id == room.owner,
        name: user.name,
        movies: movies.filter((movie) => movie.owner == user.id)
      }));
      await new Promise(r => setTimeout(r, 1000));
    }
  })();
})();

const checkRoomState = function () {
  $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId
  }).done((data) => {
    if (data.state != 'lobby') {
      window.location.reload();
    }
  });
};

(async () => {
  while (true) {
    checkRoomState();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
})();

(function () {
  var searchDelay;
  var moviesearch = new Vue({
    el: '#moviesearch',
    data: {
      searching: false,
      searchQuery: '',
      results: []
    },
    methods: {
      searchInput: function () {
        this.searching = true;
        if (searchDelay) {
          clearTimeout(searchDelay);
        }
        searchDelay = setTimeout(this.doSearch, 1000);
      },
      doSearch: async function () {
        var results = await $.ajax({
          method: "GET",
          url: "/api/imdb",
          data: {
            term: this.searchQuery
          }
        });
        this.results = results;
        this.searching = false;
      },
      addMovie: function (id) {
        $.ajax({
          method: "POST",
          url: "/api/rooms/" + roomId + "/movies",
          data: {
            id: id
          }
        }).done(() => {
          console.log("added movie");
        }).fail((error) => {
          console.log("bad movie >:(");
        });
      }
    }
  })
})();

$(function () {
  var startButton = $("#starttournament");
  if (startButton.length != 0) {
    startButton.on('click', () => {
      $.ajax({
        method: "PATCH",
        url: "/api/rooms/" + roomId,
        data: {
          state: "tournament"
        }
      }).done(() => {
        window.location.reload();
      }).fail((error) => {
        console.log(error);
      })
    })
  }
});