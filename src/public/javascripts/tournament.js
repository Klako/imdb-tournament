$(function (){
  var startButton = $("#starttournament");
  if (startButton.length != 0){
    startButton.on('click', () =>{
      $.ajax({
        method: "PATCH",
        url: "/api/rooms/" + roomId,
        data: {
          state: "lobby"
        }
      }).done(()=>{
        window.location.reload();
      }).fail((error) => {
        console.log(error);
      })
    })
  }
});