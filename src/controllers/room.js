const express = require('express');
const { NotFound } = require('http-errors');
const rooms = require('../models/room');
var exports = module.exports;

exports.get = function (req, res) {
  var roomId = req.params.id;
  if (!rooms.roomExists(roomId)) {
    throw new NotFound;
  }
  rooms.getRoom(roomId).then((room) => {
    if (!room.hasUser(req.profile.id)) {
      room.addUser(req.profile.id);
      room.save();
    }
    if (room.state == rooms.state.LOBBY) {
      res.render("lobby", { room: room, profile: req.profile });
    } else if (room.state == rooms.state.TOURNAMENT) {
      res.render("tournament", { room: room, profile: req.profile });
    } else if (room.state == rooms.state.WINNER) {
      res.render("winner", { room: room });
    }
  });
}