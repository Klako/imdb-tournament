const removeMovie = function () {
  $.ajax({
    method: "DELETE",
    url: "/api/rooms/" + roomId + "/movies/" + this.movieId
  }).done(() => {
    loadMovies();
  })
}

const loadMovies = async function () {
  var moviegrid = $("#moviegrid");
  var users = await $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/users"
  });
  var currentUsers = moviegrid.children().toArray().map(elem => ({
    id: $(elem).data("id"),
    elem: $(elem)
  }));
  var actualUsers = users.map(user => user.id);
  var userRemovals = currentUsers.filter(user => !actualUsers.includes(user.id));
  var userAdditions = users.filter(user => !currentUsers.some(currentUser => currentUser.id == user.id));
  userRemovals.forEach(removal => removal.elem.remove());
  for (var user of userAdditions) {
    var elem = $('<div class="col border" />')
      .data('id', user.id)
      .append(`<h3>${user.name}</h3>`)
      .append('<ul class="list-group" />');
    moviegrid.append(elem);
  }

  /** @type {Array} */
  var movies = await $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/movies"
  });

  for (var elem of moviegrid.children()) {
    var userbox = $(elem);
    var movielist = userbox.children('ul');
    var userMovies = movies.filter(movie => movie.owner == userbox.data('id'));
    var currentMovies = movielist.children().toArray().map(movieElem => ({
      id: $(movieElem).data('id'),
      elem: $(movieElem)
    }));
    var actualMovies = userMovies.map(movie => movie.id);
    currentMovies.filter(movie => !actualMovies.includes(movie.id))
      .forEach(removal => removal.elem.remove());
    userMovies.filter(movie => !currentMovies.some(currentMovie => currentMovie.id == movie.id))
      .forEach(movie => {
        var elem = $('<li class="list-group-item" />')
          .text(movie.title)
          .data('id', movie.id);
        movielist.append(elem);
      });
  }
}

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
    loadMovies();
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