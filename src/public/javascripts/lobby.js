$(function () {
  var movielist = $("#movielist");
  $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/movies"
  }).done((data) => {
    for (var movie of data) {
      movielist.append("<li>" + movie.id + "</li>");
    }
  });
});