const removeMovie = function (movieId) {
  $.ajax({
    method: "DELETE",
    url: "/api/rooms/" + roomId + "/movies/" + movieId
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
    movielist.children().remove();
    for (var movie of data) {
      var item = `<li class="list-group-item">
        <span>${movie.id}</span>
        <button type="button" class="btn btn-danger float-right" id=${"removemovie-" + movie.id}>Remove</button>
      </li>`
      movielist.append(item);
      $("#removemovie-" + movie.id).on("click", () => removeMovie(movie.id));
    }
  });
}

const updateUi = function () {
  loadMovies();
  setTimeout(updateUi, 1000)
}

$(updateUi)

$(function () {
  var addMovieButton = $("#addmovie-button");
  var addMovieId = $("#addmovie-id");
  addMovieButton.on("click", () => {
    $.ajax({
      method: "POST",
      url: "/api/rooms/" + roomId + "/movies",
      data: {
        id: addMovieId.val()
      }
    }).done(() => {
      loadMovies();
    }).fail((error) => {
      console.log("bad movie >:(");
    });
  });
});