const removeMovie = function () {
  $.ajax({
    method: "DELETE",
    url: "/api/rooms/" + roomId + "/movies/" + this.movieId
  }).done(() => {
    loadMovies();
  })
}

const loadMovies = function () {
  var movielist = $("#movielist");
  $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/movies"
  }).done((data) => {
    var currentMovies = movielist.children().toArray().map((elem) => ({
      id: $(elem).data("id"),
      elem: $(elem)
    }));
    var actualMovies = data.map((movie) => movie.id);
    var removals = currentMovies.filter((movie) => !actualMovies.includes(movie.id));
    var additions = data.filter((movie) => !currentMovies.some((currentMovie) => currentMovie.id == movie.id));
    for (var removal of removals) {
      removal.elem.remove();
    }
    for (var addition of additions) {
      var item = `<li class="list-group-item" data-id="${addition.id}">
        <span>${addition.title}</span>
        <button type="button" class="btn btn-danger float-right" id=${"removemovie-" + addition.id}>Remove</button>
      </li>`
      movielist.append(item);
      $("#removemovie-" + addition.id).on("click", removeMovie.bind({ movieId: addition.id }));
    }
  });
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