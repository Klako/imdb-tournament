const express = require('express');
const { NotFound } = require('http-errors');
const rooms = require('../models/room.js');
var exports = module.exports;

/**
 * Sends request to callback based on request method.
 * @param {Request} req 
 * @param {Response} res 
 * @param {Object.<string, import('express').RequestHandler>} handlers 
 */
function handler(req, res, handlers) {
  if (handlers[req.method]) {
    handlers[req.method](req, res);
  } else {
    res.status(405);
    res.json({
      error: "bad_method"
    })
  }
}

exports.profile = function (req, res) {
  initializeProfile(req);
  handler(req, res, {
    GET: (req, res) => {
      res.json(req.session.profile)
    },
    PATCH: (req, res) => {
      var result = {};
      if (req.body.name) {
        req.session.profile.name = String(req.body.name);
        result.name = true;
      } else {
        result.name = false;
      }
      res.status(200);
      res.send(result);
    }
  })
}

function initializeProfile(req) {
  if (!req.session.profile) {
    req.session.profile = {
      name: "Jeff"
    }
  }
}

exports.rooms = (req, res) => {
  handler(req, res, {
    POST: (req, res) => {
      var settings = req.body;
      var roomId = rooms.createRoom(settings, req.session.id);
      res.json({ url: "/room/" + roomId });
    }
  })
}

exports.room = (req, res) => {
  handler(req, res, {
    GET: (req, res) => {
      var roomId = req.params.id;
      if (rooms.roomExists(roomId)){

      }
    }
  })
}

exports.movies = (req, res) => {
  handler(req, res, {
    GET: (req, res) => {
      var roomId = req.params.id;
      if (!rooms.roomExists(roomId)){
        res.status(404).json({error: "Room does not exist"});
        return;
      }
      var room = rooms.getRoom(roomId);
      res.json(room.movies);
    },
    POST: (req, res) => {
      var roomId = req.params.id;
      if (!rooms.roomExists(roomId)){
        res.status(404).json({error: "Room does not exist"});
        return;
      }
      var room = rooms.getRoom(roomId);
      room.addMovie(req.body.mid, req.session.id);
    }
  })
}

exports.movie = (req, res) => {
  handler(req, res, {
    DELETE: (req, res) => {

    }
  })
}

exports.roomUsers = (req, res) => {
  handler(req, res, {
    GET: (req, res) => {
      var roomId = req.params.id;

    }
  })
}