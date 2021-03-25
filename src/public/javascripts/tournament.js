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

function updatePairVote() {
  if (this.vote == 1) {
    this.info.movie1Card.css('opacity', '1');
    this.info.movie2Card.css('opacity', '0.6');
    this.info.movie1Card.removeClass('border-danger');
    this.info.movie1Card.addClass('border-primary');
    this.info.movie2Card.removeClass('border-primary');
    this.info.movie2Card.addClass('border-danger');
    this.info.listitem.attr('data-vote', this.info.movie1);
  } else if (this.vote == 2) {
    this.info.movie2Card.css('opacity', '1');
    this.info.movie1Card.css('opacity', '0.6');
    this.info.movie2Card.removeClass('border-danger');
    this.info.movie2Card.addClass('border-primary');
    this.info.movie1Card.removeClass('border-primary');
    this.info.movie1Card.addClass('border-danger');
    this.info.listitem.attr('data-vote', this.info.movie2);
  }
}

$(function () {
  var votelist = $("#votelist");
  $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/bracket"
  }).done((data) => {
    for (var [index, pairing] of data.pairings.entries()) {
      var movie1Card = $('<div class="card border"></div>').css('opacity', '0.6');
      $('<img/>', { class: 'card-img-top', src: pairing.movie1.image }).appendTo(movie1Card);
      var movie1CardBody = $('<div/>', { class: "card-body" }).appendTo(movie1Card);
      $('<h5/>', { class: 'card-title', text: pairing.movie1.title }).appendTo(movie1CardBody);

      var movie2Card = $('<div class="card border"></div>').css('opacity', '0.6');
      $('<img/>', { class: 'card-img-top', src: pairing.movie2.image }).appendTo(movie2Card);
      var movie2CardBody = $('<div/>', { class: "card-body" }).appendTo(movie2Card);
      $('<h5/>', { class: 'card-title', text: pairing.movie2.title }).appendTo(movie2CardBody);

      var row = $('<div class="row"></div>');
      movie1Card.appendTo(row).wrap('<div class="col-5"></div>');
      row.append('<div class="col-2 align-self-center text-center">VS</div>');
      movie2Card.appendTo(row).wrap('<div class="col-5"></div>');

      var pairingUi = $('<li/>', { class: 'list-group-item' })
        .append(row).attr('data-vote', '');
      votelist.append(pairingUi);

      var info = {
        movie1Card: movie1Card,
        movie1: pairing.movie1.id,
        movie2Card: movie2Card,
        movie2: pairing.movie2.id,
        listitem: pairingUi
      };

      movie1Card.on('click', updatePairVote.bind({ info: info, vote: 1 }));
      movie2Card.on('click', updatePairVote.bind({ info: info, vote: 2 }));
    }
  });
  var votebutton = $("#sendvotes");
  votebutton.on('click', () => {
    var votes = votelist.children().toArray().map((li) => $(li).data('vote'));
    if (votes.some((vote) => vote == '')) {
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