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
    var additions = data.filter((movie) => !currentMovies.some((currentMovie)=>currentMovie.id == movie.id));
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

$(function (){
  var startButton = $("#starttournament");
  if (startButton.length != 0){
    startButton.on('click', () =>{
      $.ajax({
        method: "PATCH",
        url: "/api/rooms/" + roomId,
        data: {
          state: "tournament"
        }
      }).done(()=>{
        window.location.reload();
      }).fail((error) => {
        console.log(error);
      })
    })
  }
});