const express = require('express');
const errors = require('http-errors');
const { uid } = require('uid');
const imdb = require('@timvdeijnden/imdb-scraper');
const mongodb = require('./mongodb.js');
const { Schema } = require('mongoose');
var exports = module.exports;

const roomState = {
  LOBBY: "lobby",
  TOURNAMENT: "tournament",
  WINNER: "winner"
};
exports.state = roomState;

exports.createRoom = async (settings, user) => {
  var db = await this.connect();
  return await db.create({
    owner: user,
    users: [user],
    settings: settings
  });
}

exports.roomExists = async (roomId) => {
  const db = await this.connect();
  return Boolean(await db.countDocuments({ id: roomId }));
}

exports.getRoom = async (roomId) => {
  const db = await this.connect();
  return await db.findById(roomId);
}

async function getMovieData(imdbId) {
  var movie = await imdb.scrapper(imdbId);
  if (!movie) {
    throw new errors[400]("Invalid movie");
  }
  return movie;
}

exports.connect = async () => {
  var db = await mongodb.mongoose();
  return db.model('Room', roomSchema);
}

/** @type {Schema<import('./room.js').IRoom>} */
const roomSchema = new Schema({
  movies: [{ id: String, owner: String, data: Object }],
  users: [String],
  owner: String,
  settings: {
    minperuser: Number,
    maxperuser: Number,
    candropinvote: Boolean
  },
  state: { type: String, default: roomState.LOBBY },
  tournament: {
    movies: [{
      id: String,
      data: Object,
      eliminated: { type: Boolean, default: false }
    }],
    brackets: [[{
      id: String,
      data: Object
    }]],
    activeBracket: {
      number: { type: Number, default: 0 },
      movies: [{
        id: String,
        data: Object
      }],
      pairings: [{
        movie1: {
          id: String,
          data: Object
        },
        movie2: {
          id: String,
          data: Object
        }
      }],
      userVotes: [{
        user: String,
        votes: [String]
      }]
    },
    winner: {
      id: String,
      title: String,
      image: String
    }
  }
});

/** @this {import('./room').IRoom} */
roomSchema.methods.addUser = function (user) {
  if (this.users.includes(user)) {
    throw new errors[400]("User is already in room");
  }
  this.users.push(user);
}

/** @this {import('./room').IRoom} */
roomSchema.methods.removeUser = function (user) {
  if (!this.users.includes(user)) {
    throw new errors[400]("User is not in room");
  }
  this.users = this.users.filter(user => user != user);
  this.movies = this.movies.filter(movie => movie.owner != user);
}

/** @this {import('./room').IRoom} */
roomSchema.methods.hasUser = function (user) {
  return this.users.includes(user);
}

/** @this {import('./room').IRoom} */
roomSchema.methods.addMovie = async function (imdbId, owner) {
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
}

/** @this {import('./room').IRoom} */
roomSchema.methods.removeMovie = function (imdbId) {
  if (this.state != roomState.LOBBY) {
    throw new errors[403]("Room not in lobby mode");
  }
  this.movies = this.movies.filter(movie => movie.id != imdbId);
}

/** @this {import('./room').IRoom} */
roomSchema.methods.setState = async function (state) {
  if (Object.values(roomState).includes(state)) {
    this.state = state;
    if (state == roomState.TOURNAMENT) {
      await this.initTournament();
    }
  } else {
    throw new errors[400]("New state is invalid");
  }
}

/** @this {import('./room').IRoom} */
roomSchema.methods.initTournament = function () {
  var movies = [];
  for (var i = 0; ; i++) {
    var found = false;
    for (var user of this.users) {
      var userMovies = this.movies.filter((movie) => movie.owner == user);
      if (i < userMovies.length) {
        var movie = userMovies[i];
        movies.push({
          id: movie.id,
          data: movie.data,
          eliminated: false
        });
        found = true;
      }
    }
    if (!found) {
      break;
    }
  }
  this.tournament = {
    movies: movies,
    brackets: [],
    activeBracket: {
      number: 0,
      movies: [],
      pairings: [],
      userVotes: []
    }
  };
  this.bracketise();
  this.initBracket();
}

/** @this {import('./room').IRoom} */
roomSchema.methods.bracketise = function () {
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
}

/** @this {import('./room').IRoom} */
roomSchema.methods.initBracket = function () {
  var bracket = this.tournament.brackets.shift();
  this.tournament.activeBracket.movies = bracket;
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
        }
      });
    }
  }
  this.tournament.activeBracket.pairings = pairings;
  this.tournament.activeBracket.userVotes = [];
}

/** @this {import('./room').IRoom} */
roomSchema.methods.setUserVotes = async function (user, votes) {
  var activeBracket = this.tournament.activeBracket;
  if (activeBracket.userVotes.some((userVote) => userVote.user == user)) {
    throw new errors[403]("User has already voted");
  }
  if (votes.length != activeBracket.pairings.length) {
    throw new errors[400]("Number of votes not the same as number of pairings");
  }
  for (var [index, pairing] of activeBracket.pairings.entries()) {
    var vote = votes[index];
    if (vote !== pairing.movie1.id && vote !== pairing.movie2.id) {
      throw new errors[400](`Vote in index ${index} is not valid`);
    }
  }
  var userVote = { user: user, votes: votes };
  activeBracket.userVotes.push(userVote);
  if (this.allUsersHaveVoted()) {
    this.endBracket();
  }
}

/** @this {import('./room').IRoom} */
roomSchema.methods.allUsersHaveVoted = function () {
  var activeBracket = this.tournament.activeBracket;
  return this.users.every((user) =>
    activeBracket.userVotes.some((userVote) =>
      userVote.user == user
    )
  );
}

/** @this {import('./room').IRoom} */
roomSchema.methods.endBracket = function () {
  var results = this.getBracketResults();
  for (var loser of results.losers) {
    this.tournament.movies.find((movie) => movie.id == loser).eliminated = true;
  }
  var winners = this.tournament.movies.filter((movie) =>
    results.winners.includes(movie.id)
  ).map((movie) => ({
    id: movie.id,
    data: movie.data
  }));
  var brackets = this.tournament.brackets;
  if (brackets.length > 0 && brackets.slice(-1)[0].length == 2) {
    var newLastBracket = brackets.slice(-1)[0].concat(winners);
    brackets[brackets.length - 1] = newLastBracket;
  } else {
    brackets.push(winners);
  }
  this.tournament.activeBracket.number++;
  if (brackets.length == 1 && brackets[0].length == 1) {
    var winner = brackets[0][0];
    this.tournament.winner = {
      id: winner.id,
      title: winner.data.title,
      image: winner.data.poster
    };
    this.setState(roomState.WINNER);
  }
  this.initBracket();
}

/** @this {import('./room').IRoom} */
roomSchema.methods.getBracketResults = function () {
  var activeBracket = this.tournament.activeBracket;
  var points = activeBracket.movies.map((movie) => ({
    id: movie.id,
    points: 0
  }));
  for (var [index, pairing] of activeBracket.pairings.entries()) {
    var movie1Points = 0;
    var movie2Points = 0;
    for (var userVote of activeBracket.userVotes) {
      if (userVote.votes[index] == pairing.movie1.id) {
        movie1Points++;
      } else if (userVote.votes[index] == pairing.movie2.id) {
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
  var isLastBracket = this.tournament.brackets.length == 0
    && this.tournament.activeBracket.movies.length == 2;
  var winners = points.sort((a, b) => a.points - b.points).slice(isLastBracket ? -1 : -2);
  var losers = points.filter((movie) => !winners.some((winner) => winner.id == movie.id));
  return {
    winners: winners.map((movie) => movie.id),
    losers: losers.map((movie) => movie.id)
  }
}