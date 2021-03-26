var express = require('express');
var rooms = require('../models/room.js');
var router = express.Router();

var api = require('../controllers/api.js');

router.all('/profile', api.profile);
router.all('/rooms', api.rooms);
router.all('/rooms/:id/*', async (req, res, next) => {
  var room = await rooms.getRoom(req.params.id);
  if (!room.hasUser(req.profile.id)){
    res.status(401).json({error: "Must be in room to use its api you fucking loser"});
  } else {
    next();
  }
});
router.all('/rooms/:id', api.room);
router.all('/rooms/:id/movies', api.movies);
router.all('/rooms/:rid/movies/:mid', api.movie);
router.all('/rooms/:rid/bracket', api.bracket);
router.all('/rooms/:rid/bracket/pairings', api.bracketPairings);
router.all('/rooms/:rid/bracket/votes', api.votes);



module.exports = router;