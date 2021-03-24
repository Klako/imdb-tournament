var express = require('express');
var rooms = require('../models/room.js');
var router = express.Router();

var api = require('../controllers/api.js');

router.all('/profile', api.profile);
router.all('/rooms', api.rooms);
router.all('/rooms/:id/*', async (req, res, next) => {
  var room = await rooms.getRoom(req.params.id);
  if (!room.hasUser(req.profile.id)){
    res.status(401).json({error: "You can't access api for a room you're not in you fuck nugget"});
  } else {
    next();
  }
});
router.all('/rooms/:id', api.room);
router.all('/rooms/:id/movies', api.movies);
router.all('/rooms/:rid/movies/:mid', api.movie);
router.all('/rooms/:rid/bracket', api.bracket);



module.exports = router;