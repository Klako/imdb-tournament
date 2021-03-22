const express = require('express');
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
    res.json({ error: "Bad Method" });
  }
}

/**
 * 
 * @param {Response} res 
 * @param {import('http-errors').HttpError} reason 
 */
function doError(res, reason) {
  res.status(reason.statusCode).json({ error: reason.message });
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
      res.json(result);
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
      rooms.createRoom(req.body, req.session.id).then((roomId) => {
        res.json({ url: "/room/" + roomId });
      }).catch((reason) => {
        doError(res, reason);
      })
    }
  })
}

exports.room = (req, res) => {
  handler(req, res, {
    GET: (req, res) => {
      var roomId = req.params.id;
      if (rooms.roomExists(roomId)) {

      }
    }
  })
}

exports.movies = (req, res) => {
  handler(req, res, {
    GET: (req, res) => {
      var roomId = req.params.id;
      rooms.getRoom(roomId).then((room) => {
        res.json(room.movies.map((movie) => ({
          id: movie.id,
          
        })));
      }).catch((reason) => {
        doError(res, reason);
      });
    },
    POST: (req, res) => {
      var roomId = req.params.id;
      rooms.getRoom(roomId).then((room) => {
        room.addMovie(req.body.id, req.session.id).then(() => {
          room.save().then(() => {
            res.end();
          }).catch((reason) => {
            doError(res, reason);
          });
        }).catch((reason) => {
          doError(res, reason);
        });
      }).catch((reason) => {
        doError(res, reason);
      });
    }
  })
}

exports.movie = (req, res) => {
  handler(req, res, {
    DELETE: (req, res) => {
      var roomId = req.params.rid;
      var movieId = req.params.mid;
      rooms.getRoom(roomId).then((room) => {
        room.removeMovie(movieId);
        room.save().then(() => {
          res.end();
        }).catch((reason) => {
          doError(res, reason);
        })
      }).catch((reason) => {
        doError(res, reason);
      });
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