(function () {
  var moviegrid = new Vue({
    el: '#moviegrid',
    data: {
      users: []
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
      moviegrid.users = users.map((user) => ({
        id: user.id,
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
}

$(async () => {
  while (true) {
    checkRoomState();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
});

$(function () {
  var searchBox = $("#searchbox");
  var suggestions = $("#moviesearch-suggestions");
  var searchDelay;
  searchBox.on('input', () => {
    suggestions.children().remove();
    suggestions.append($('<span class="dropdown-item">...</span>'));
    searchBox.dropdown('show');
    clearTimeout(searchDelay);
    searchDelay = setTimeout(async () => {
      var results = await $.ajax({
        method: "GET",
        url: "/api/imdb",
        data: {
          term: searchBox.val()
        }
      });
      suggestions.children().remove();
      if (results.length > 0) {
        for (var movie of results) {
          var suggestion = $('<a href="#"/ class="dropdown-item">')
            .data('movieId', movie.id)
            .data('movieTitle', movie.title)
            .text(movie.title)
            .on('click', function () {
              $.ajax({
                method: "POST",
                url: "/api/rooms/" + roomId + "/movies",
                data: {
                  id: $(this).data('movieId')
                }
              }).done(() => {
                loadMovies();
              }).fail((error) => {
                console.log("bad movie >:(");
              });
            });
          suggestions.append(suggestion);
        }
      } else {
        var erroritem = $('<span class="dropdown-item" />')
          .text('No movies found');
        suggestions.append(erroritem);
      }
    }, 1000);
  })
});

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