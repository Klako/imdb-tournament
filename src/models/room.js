const express = require('express');
const errors = require('http-errors');
const { uid } = require('uid');
const imdb = require('@timvdeijnden/imdb-scraper');
const mongodb = require('./mongodb.js');
var exports = module.exports;

const roomState = {
  LOBBY: "lobby",
  TOURNAMENT: "tournament",
  WINNER: "winner"
};

exports.state = roomState;

/**
 * Creates a new room with user as owner
 * @param {object} settings 
 * @param {string} user
 * @return {Promise<Room>}
 */
exports.createRoom = async (settings, user) => {
  var roomId = null;
  do {
    roomId = uid(8);
  } while (await this.roomExists(roomId));
  var room = await Room.new(roomId, user, settings);
  return room;
}

exports.roomExists = async (roomId) => {
  const db = await mongodb.connect();
  const rooms = db.collection('rooms');
  return Boolean(await rooms.count({ id: roomId }));
}

exports.getRoom = async (roomId) => {
  return await Room.load(roomId);
}

async function getMovieData(imdbId) {
  var movie = await imdb.scrapper(imdbId);
  if (!movie) {
    throw new errors[400]("Invalid movie");
  }
  return movie;
}

async function collection() {
  return (await mongodb.connect()).collection('rooms');
}

/**
 * Room object with all room info
 * @property {string} id
 */
class Room {
  static async new(roomId, owner, settings) {
    var newRoom = {
      id: roomId,
      movies: [],
      users: [owner],
      owner: owner,
      settings: settings,
      state: roomState.LOBBY
    };
    var rooms = await collection();
    var result = await rooms.insertOne(newRoom);
    return await this.load(roomId);
  }

  constructor() {
  }

  /**
   * Creates room object from database
   * @param {db} db 
   */
  static async load(roomId) {
    const db = await mongodb.connect();
    var rooms = db.collection('rooms');
    const roomData = await rooms.findOne({ id: roomId });
    var room = new Room();
    Object.assign(room, roomData);
    return room;
  }

  /**
   * Adds a user if it isn't in room
   * @param {string} userId 
   */
  async addUser(userId) {
    if (this.users.find(user => user == userId)) {
      throw new errors[400]("User is already in room");
    }
    this.users.push(userId);
  }

  /**
   * Removes a user if it is in room
   * @param {string} userId 
   */
  async removeUser(userId) {
    if (!this.users.find(user => user == userId)) {
      throw new errors[400]("User is not in room");
    }
    this.users = this.users.filter(user => user != userId);
    this.movies = this.movies.filter(movie => movie.owner != userId);
  }

  /**
   * Checks if user in room
   * @param {string} userId 
   */
  hasUser(userId) {
    return Boolean(this.users.find(user => user == userId));
  }

  /**
   * Adds a movie by its imdb id
   * @param {string} imdbId 
   * @param {string} owner
   */
  async addMovie(imdbId, owner) {
    if (this.state != roomState.LOBBY) {
      throw new errors[403]("Room not in lobby mode");
    }
    var userOwnerCount = this.movies.filter(movie => movie.owner == owner).length;
    if (userOwnerCount >= this.settings.maxperuser) {
      throw new errors[400]("Too many movies");
    }
    if (this.movies.find((movie) => movie.id == imdbId)) {
      throw new errors[400]("Movie already in room");
    }
    var movie = await getMovieData(imdbId);
    var newMovie = {
      id: imdbId,
      owner: owner,
      data: movie
    }
    this.movies.push(newMovie);
    await (await collection()).updateOne({ id: this.id }, {
      $push: { movies: newMovie }
    });
  }

  async removeMovie(imdbId) {
    if (this.state != roomState.LOBBY) {
      throw new errors[403]("Room not in lobby mode");
    }
    this.movies = this.movies.filter(movie => movie.id != imdbId);
    await (await collection()).updateOne({ id: this.id }, {
      $pull: { movies: { id: imdbId } }
    });
    if (this.state == roomState.LOBBY) {
      this.movies = this.movies.filter(movie => movie.id != imdbId);
    }
  }

  async setState(state) {
    if (Object.values(roomState).some((validState) => validState == state)) {
      this.state = state;
      await (await collection()).updateOne({ id: this.id }, {
        $set: { state: state }
      });
      if (state == roomState.TOURNAMENT){
        await this.initTournament();
      }
    } else {
      throw new errors[400]("New state is invalid");
    }
  }

  async initTournament() {
    this.tournament = {
      movies: this.movies.map((movie) => ({
        id: movie.id,
        data: movie.data,
        eliminated: false
      })),
      brackets: [],
      activeBracket: {
        movies: [],
        pairings: []
      }
    };
    await (await collection()).updateOne({ id: this.id }, {
      $set: { tournament: this.tournament }
    });
    await this.bracketise();
    await this.initBracket();
  }

  async bracketise() {
    var bracketMovies = this.tournament.movies
      .filter((movie) => !movie.eliminated)
      .map((movie) => ({
        id: movie.id,
        data: movie.data
      }));
    var brackets = [];
    var bracketStart = 0;
    for (var bracketEnd = 1; bracketEnd <= bracketMovies.length; bracketEnd++) {
      if (bracketEnd >= bracketStart + 4 || bracketEnd == bracketMovies.length) {
        if (bracketEnd != bracketMovies.length - 1) {
          brackets.push(bracketMovies.slice(bracketStart, bracketEnd));
          bracketStart = bracketEnd;
        }
      }
    }
    this.tournament.brackets = brackets;
    await (await collection()).updateOne({ id: this.id }, {
      $set: { "tournament.brackets": brackets }
    });
  }

  async initBracket() {
    var bracket = this.tournament.brackets.shift();
    var rooms = await collection();
    await rooms.updateOne({ id: this.id }, {
      $pop: { "tournament.brackets": -1 }
    });
    this.tournament.activeBracket.movies = bracket;
    await rooms.updateOne({ id: this.id }, {
      $set: { "tournament.activeBracket.movies": bracket }
    });
    var pairings = [];
    for (var [movie1Index, movie1] of bracket.entries()) {
      for (var movie2 of bracket.slice(movie1Index + 1)) {
        pairings.push({
          movie1: {
            id: movie1.id,
            data: movie1.data
          },
          movie2: {
            id: movie2.id,
            data: movie2.data
          },
          userVotes: []
        });
      }
    }
    this.tournament.activeBracket.pairings = pairings;
    await rooms.updateOne({ id: this.id }, {
      $set: { "tournament.activeBracket.pairings": pairings }
    });
  }

  async setUserVotes(user, votes) {
    if (votes.length != this.tournament.activeBracket.length) {
      throw new errors[400]("Number of votes not the same as number of pairings");
    }
    var rooms = await collection();
    for (var [index, pairing] of this.tournament.activeBracket.entries()) {

      var vote = String(votes[index]);
      var currentVote = pairing.userVotes.find((vote) => vote.user == user);
      if (currentVote) {
        currentVote.vote = vote;
        await rooms.updateOne({ id: this.id },
          { $set: { "tournament.activeBracket.$[pairing].userVotes.$[user].vote": vote } },
          {
            arrayfilters: [
              { pairing: { 'movie1.id': pairing.movie1.id, 'movie2.id': pairing.movie2.id } },
              { user: { user: user } }
            ]
          }
        );
      } else {
        var newVote = { user: user, movieId: vote };
        pairing.userVotes.push(newVote);
        await rooms.updateOne({ id: this.id },
          { $push: { "tournament.activeBracket.$[pairing].userVotes": newVote } }
        );
      }
    }
  }

  checkBracketWinners() {
    var activeBracket = this.tournament.activeBracket;
    var points = activeBracket.movies.map((movie) => ({
      id: movie.id,
      points: 0
    }));
    for (var pairing in activeBracket.pairings) {
      var movie1Points = 0;
      var movie2Points = 0;
      for (var userVote in pairing.userVotes) {
        if (userVote.movieId == pairing.movie1.id) {
          movie1Points++;
        } else if (userVote.movieId == pairing.movie2.id) {
          movie2Points++;
        }
      }
      var movie1 = points.find((movie) => movie.id == pairing.movie1.id);
      var movie2 = points.find((movie) => movie.id == pairing.movie2.id);
      if (movie1Points > movie2Points) {
        movie1.points += 2;
      } else if (movie1Points < movie2Points) {
        movie2.points += 2;
      } else {
        movie1.points++;
        movie2.points++;
      }
    }
    var winners = [points.unshift()];
    for (var movie of points) {
      if (movie.points > winners[0].points) {
        winners = [movie];
      } else if (movie.points == winners[0].points) {
        winners.push(movie);
      }
    }
    return winners.map((winner) => winner.id);
  }
}