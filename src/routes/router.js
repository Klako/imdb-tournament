var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  const menu = require("../controllers/menu.js");
  menu.get(req, res);
});

router.get('/room/:id', function (req, res, next) {
  const room = require("../controllers/room.js");
  room.get(req, res);
});

module.exports = router;