const express = require('express');
const { NotFound } = require('http-errors');
const rooms = require('../models/room.js');
var exports = module.exports;

exports.get = function (req, res) {
  var roomId = req.params.id;
  if (!rooms.roomExists(roomId)) {
    throw new NotFound;
  }
  var room = rooms.getRoom(roomId);
  if (!room.hasUser(req.session.id)) {
    room.addUser(req.session.id);
  }
  if (room.state == rooms.state.LOBBY) {
    res.render("lobby", { roomId: roomId });
  }
}