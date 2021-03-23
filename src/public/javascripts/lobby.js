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
      id: $(elem).children('span').text(),
      elem: $(elem)
    }));
    var actualMovies = data.map((movie) => movie.id);
    var removals = currentMovies.filter((movie) => !actualMovies.includes(movie.id));
    var additions = actualMovies.filter((id) => !currentMovies.some((movie) => movie.id == id));
    for (var removal of removals) {
      removal.elem.remove();
    }
    for (var addition of additions) {
      var item = `<li class="list-group-item">
        <span>${addition}</span>
        <button type="button" class="btn btn-danger float-right" id=${"removemovie-" + addition}>Remove</button>
      </li>`
      movielist.append(item);
      $("#removemovie-" + addition).on("click", removeMovie.bind({ movieId: addition }));
    }
  });
}

const updateUi = async function () {
  while (true) {
    loadMovies();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
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