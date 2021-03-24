$(function () {
  var startButton = $("#backtolobby");
  if (startButton.length != 0) {
    startButton.on('click', () => {
      $.ajax({
        method: "PATCH",
        url: "/api/rooms/" + roomId,
        data: {
          state: "lobby"
        }
      }).done(() => {
        window.location.reload();
      }).fail((error) => {
        console.log(error);
      })
    })
  }
});

$(function () {
  var votelist = $("#votelist");
  $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/bracket"
  }).done((data) => {
    for (var [index, pairing] of data.pairings.entries()) {
      var movie1VoteButton = $('<button></button>')
        .attr('type', 'button')
        .addClass('btn btn-secondary mr-3')
        .attr('id', `vote-${index}-${pairing.movie1.id}`)
        .text(pairing.movie1.title)
        .data('movieId', pairing.movie1.id);
      var movie2VoteButton = $('<button></button>')
        .attr('type', 'button')
        .addClass('btn btn-secondary')
        .attr('id', `vote-${index}-${pairing.movie2.id}`)
        .text(pairing.movie2.title);
      var pairing = $('<li></li>')
        .addClass('list-group-item')
        .append([movie1VoteButton, movie2VoteButton])
        .data('vote', undefined);
      votelist.append(pairing);
    }
  });
  var votebutton = $("#sendvotes");
  votebutton.on('click', () => {
    var votes = votelist.children().toArray().map((li) => li.dataset.movieId);
    if (votes.some((vote) => vote == undefined)) {
      console.log('All movies need to be voted for');
      return;
    }
    $.ajax({
      method: "POST",
      url: "/api/room/" + roomId + "/votes",
      data: votes
    });
  });
});

$(async () => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
});