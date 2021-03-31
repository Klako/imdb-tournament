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

(function () {
  var voting = new Vue({
    el: '#voting',
    data: {
      currentBracket: -1,
      voteNeeded: false,
      currentVotes: []
    },
    methods: {
      initVote: async function () {
        var bracketPairings = await $.ajax({
          method: "GET",
          url: "/api/rooms/" + roomId + "/bracket/pairings"
        });
        var pairings = bracketPairings.pairings;
        var index = 0;
        pairings.forEach((pairing) => {
          pairing.index = index++;
          pairing.movie1.selected = false;
          pairing.movie2.selected = false;
        });
        this.currentVotes = pairings;
        this.voteNeeded = true;
      },
      setVote: function (index, which) {
        if (index < 0 || index >= this.currentVotes.length) {
          return;
        }
        var pairing = this.currentVotes[index];
        pairing.selectedMovie = which;
        pairing.movie1.selected = (pairing.movie1.id == which);
        pairing.movie2.selected = (pairing.movie2.id == which);
      },
      sendVote: async function () {
        if (this.currentVotes.some(vote => !vote.selectedMovie)) {
          return;
        }
        var votes = this.currentVotes.map(
          (vote) => vote.selectedMovie
        );
        await $.ajax({
          method: "POST",
          url: "/api/rooms/" + roomId + "/bracket/votes",
          data: JSON.stringify({ votes: votes }),
          contentType: "application/json"
        });
        this.voteNeeded = false;
      }
    }
  });
  (async () => {
    while (true) {
      if (!voting.voteNeeded) {
        try {
          var bracket = await $.ajax({
            method: "GET",
            url: "/api/rooms/" + roomId + "/bracket"
          });
        } catch (ex) {
          window.location.reload();
        }
        if (bracket.current > voting.currentBracket) {
          voting.currentBracket = bracket.current;
          await voting.initVote();
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  })();
})();
