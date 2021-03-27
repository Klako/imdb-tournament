var currentBracket = 0;
var doneVoting = false;

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
    this.info.listitem.data('vote', this.info.movie1);
  } else if (this.vote == 2) {
    this.info.movie2Card.css('opacity', '1');
    this.info.movie1Card.css('opacity', '0.6');
    this.info.movie2Card.removeClass('border-danger');
    this.info.movie2Card.addClass('border-primary');
    this.info.movie1Card.removeClass('border-primary');
    this.info.movie1Card.addClass('border-danger');
    this.info.listitem.data('vote', this.info.movie2);
  }
}

const getBracket = async function () {
  var votelist = $("#votelist");
  votelist.children().remove();

  var bracket = await $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/bracket"
  });
  currentBracket = bracket.current;

  var bracketPairings = await $.ajax({
    method: "GET",
    url: "/api/rooms/" + roomId + "/bracket/pairings"
  });
  for (var pairing of bracketPairings.pairings) {
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
      .append(row).data('vote', '');
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

  $("#sendvotes").show();
};

$(() => {
  $("#sendvotes").on('click', async () => {
    var votes = $("#votelist").children().toArray().map((li) => $(li).data('vote'));
    if (votes.some((vote) => vote == '')) {
      console.log('All movies need to be voted for');
      return;
    }
    await $.ajax({
      method: "POST",
      url: "/api/rooms/" + roomId + "/bracket/votes",
      data: JSON.stringify({ votes: votes }),
      contentType: 'application/json; charset=utf-8'
    });
    doneVoting = true;
  });
})

$(getBracket);

$(async () => {
  while (true) {
    if (doneVoting) {
      try {
        var bracket = await $.ajax({
          method: "GET",
          url: "/api/rooms/" + roomId + "/bracket"
        });
      } catch (error) {
        window.location.reload();
      }
      if (currentBracket != bracket.current) {
        getBracket();
        doneVoting = false;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
});