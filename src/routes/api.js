var express = require('express');
var router = express.Router();

var api = require('../controllers/api.js');

router.all('/profile', api.profile);
router.all('/rooms', api.rooms);
router.all('/rooms/:id', api.room);
router.all('/rooms/:id/movies', api.movies);
router.all('/rooms/:rid/movies/:mid', api.movie);
router.all('/rooms/:rid/bracket', api.bracket);

module.exports = router;