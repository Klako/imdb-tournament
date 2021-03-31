const express = require('express');
const rooms = require('../models/room');
const profiles = require('../models/profile');
const errors = require('http-errors');
const { simpleSearch: imdbSearch } = require('@timvdeijnden/imdb-scraper');
const imdb = require('../models/imdb');
var exports = module.exports;

/**
 * @callback ApiHandler
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 * @return {Promise<void>} 
 */

/**
 * Sends request to callback based on request method.
 * @param {Request} req 
 * @param {Response} res 
 * @param {Object.<string, import('express').RequestHandler} handlers 
 */
function handler(req, res, handlers) {
  if (handlers[req.method]) {
    handlers[req.method](req, res).catch((reason) => {
      console.log(reason.toString());
      if (reason.statusCode) {
        res.status(reason.statusCode).json({ error: reason.message });
      } else {
        res.status(500).end();
      }
    });
  } else {
    res.status(405);
    res.json({ error: "Bad Method" });
  }
}

exports.profile = function (req, res) {
  handler(req, res, {
    GET: async (req, res) => {
      res.json({
        id: req.profile.id,
        name: req.profile.name
      });
    },
    PATCH: async (req, res) => {
      var result = {};
      if (req.body.name) {
        req.profile.setName(String(req.body.name));
        result.name = true;
      } else {
        result.name = false;
      }
      await req.profile.save();
      res.json(result);
    }
  })
}

exports.rooms = (req, res) => {
  handler(req, res, {
    POST: async (req, res) => {
      var room = await rooms.createRoom(req.body, req.profile.id);
      res.json({ url: "/room/" + room.id });
    }
  })
}

exports.room = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      res.json({
        id: room.id,
        state: room.state
      });
    },
    PATCH: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      if (req.profile.id != room.owner) {
        throw new errors[401]("Only owner can edit room");
      }
      var result = {};
      if (req.body.state) {
        room.setState(String(req.body.state));
        result.state = true;
      } else {
        req.body.state = false;
      }
      room.save();
      res.json(result);
    }
  })
}

exports.movies = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      var result = await Promise.all(room.movies.map(async (movie) => ({
        id: movie.id,
        owner: movie.owner,
        title: movie.data.title,
        image: movie.data.poster
      })));
      await res.json(result);
      res.end();
    },
    POST: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      await room.addMovie(req.body.id, req.profile.id);
      await room.save();
      res.end();
    }
  })
}

exports.movie = (req, res) => {
  handler(req, res, {
    DELETE: async (req, res) => {
      var roomId = req.params.rid;
      var movieId = req.params.mid;
      var room = await rooms.getRoom(roomId);
      room.removeMovie(movieId);
      await room.save();
      res.end();
    }
  })
}

exports.roomUsers = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      var userProfiles = await Promise.all(
        room.users.map(async (user) => await profiles.get(user))
      );
      res.json(userProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name
      })));
    }
  })
}

exports.roomUser = (req, res) => {
  handler(req, res, {
    DELETE: async (req, res) => {
      var roomId = req.params.rid;
      var userId = req.params.uid;
      var room = await rooms.getRoom(roomId);
      if (req.profile.id != room.owner) {
        throw new errors[401]("Only host can kick users");
      }
      room.removeUser(userId);
      await room.save();
      res.end();
    }
  })
}

exports.bracket = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.rid;
      var room = await rooms.getRoom(roomId);
      if (room.state != rooms.state.TOURNAMENT) {
        throw new errors[403]("Must be in tournament mode");
      }
      res.json({
        current: room.tournament.activeBracket.number
      });
    }
  })
};

exports.bracketPairings = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.rid;
      var room = await rooms.getRoom(roomId);
      if (room.state != rooms.state.TOURNAMENT) {
        throw new errors[403]("Must be in tournament mode");
      }
      var bracket = room.tournament.activeBracket;
      res.json({
        movies: bracket.movies.map((movie) => ({
          id: movie.id,
          title: movie.data.title,
          image: movie.data.poster
        })),
        pairings: bracket.pairings.map((pairing) => ({
          movie1: {
            id: pairing.movie1.id,
            title: pairing.movie1.data.title,
            image: pairing.movie1.data.poster
          },
          movie2: {
            id: pairing.movie2.id,
            title: pairing.movie2.data.title,
            image: pairing.movie2.data.poster
          }
        }))
      });
    }
  })
}

exports.votes = (req, res) => {
  handler(req, res, {
    POST: async (req, res) => {
      if (!req.body.votes) {
        throw new errors[400]("Must contain votes array");
      }
      var room = await rooms.getRoom(req.params.rid);
      await room.setUserVotes(req.profile.id, req.body.votes);
      await room.save();
      res.end();
    }
  });
}

exports.imdb = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var searchTerm = req.query.term;
      var results = await imdb.search(searchTerm);
      res.json(results.map((result) => ({
        id: result.id,
        title: result.title
      })));
    }
  })
}