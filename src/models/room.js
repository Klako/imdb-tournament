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

async function verifyMovie(imdbId) {
  var movie = await imdb.scrapper(imdbId);
  return Boolean(movie);
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
      return new errors[400]("User is not in room");
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
    } else {
      throw new errors[400]("New state is invalid");
    }
  }
}