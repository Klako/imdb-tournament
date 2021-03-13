const express = require('express');
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
 * @return {string | ValidationError[]}
 */
exports.createRoom = (settings, user) => {
  var roomId = null;
  do {
    roomId = uid(8);
  } while (rooms[roomId]);
  rooms[roomId] = Room.new(roomId, user, settings);
  return roomId;
}

exports.roomExists = async (roomId) => {
  const db = await mongodb.connect();
  const rooms = db.collection('rooms');
  return rooms.indexExists(roomId);
}

exports.getRoom = (roomId) => {
  return Room.load(roomId);
}

function verifyMovie(imdbId) {
  var scrapper = imdb.scrapper(imdbId);
  return scrapper.then(() => true, () => false);
}

class Room {
  static new(roomId, owner, settings) {
    var room = new Room();
    room.id = roomId;
    room.movies = [];
    room.users = [owner];
    room.owner = owner;
    room.settings = settings;
    room.state = roomState.LOBBY;
    return room;
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
    const roomData = await rooms.findOne({ id: roomId })
    var room = new Room();
    Object.assign(room, roomData);
    return room;
  }

  /**
   * Saves room object to database
   * @param {db} db 
   */
  async save() {
    const db = await mongodb.connect();
    var rooms = db.collection('rooms');
    if (await rooms.indexExists(this.id)) {
      await rooms.replaceOne({ id: this.id }, this);
    } else {
      await rooms.insertOne(this);
    }
  }

  /**
   * Adds a user if it isn't in room
   * @param {string} userId 
   */
  addUser(userId) {
    if (this.users.find(user => user == userId)) {
      return new Error("User is already in room");
    }
    this.users.push(userId);
  }

  /**
   * Removes a user if it is in room
   * @param {string} userId 
   */
  removeUser(userId) {
    if (!this.users.find(user => user == userId)) {
      return new Error("User is not in room");
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
  addMovie(imdbId, owner) {
    var userOwnerCount = this.movies.filter(movie => movie.owner == owner).length;
    if (userOwnerCount >= this.settings.maxperuser) {
      return new Error("User has too many movies");
    }
    return verifyMovie(imdbId).then((exists) => {
      if (exists) {
        this.movies.push({
          id: imdbId,
          owner: owner
        });
      } else {
        return new Error("Movie does not exist");
      }
    });
  }

  removeMovie(imdbId) {
    if (this.state == roomState.LOBBY) {
      this.movies = this.movies.filter(movie => movie.id != imdbId);
    }
  }
}