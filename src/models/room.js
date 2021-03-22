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
 * @return {Promise<string>}
 */
exports.createRoom = async (settings, user) => {
  var roomId = null;
  do {
    roomId = uid(8);
  } while (await this.roomExists(roomId));
  var room = Room.new(roomId, user, settings);
  room.save();
  return roomId;
}

exports.roomExists = async (roomId) => {
  const db = await mongodb.connect();
  const rooms = db.collection('rooms');
  return Boolean(await rooms.count({ id: roomId }));
}

exports.getRoom = async (roomId) => {
  return await Room.load(roomId);
}

async function verifyMovie(imdbId) {
  var movie = await imdb.scrapper(imdbId);
  return Boolean(movie);
}

/**
 * Room object with all room info
 * @property {string} id
 */
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
    if (await rooms.count({ id: this.id })) {
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
      return new errors[400]("User is already in room");
    }
    this.users.push(userId);
  }

  /**
   * Removes a user if it is in room
   * @param {string} userId 
   */
  removeUser(userId) {
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
    var userOwnerCount = this.movies.filter(movie => movie.owner == owner).length;
    if (userOwnerCount >= this.settings.maxperuser) {
      throw new errors[400]("Too many movies");
    }
    if (this.movies.find((movie) => movie.id == imdbId)) {
      throw new errors[400]("Movie already in room");
    }
    if (await verifyMovie(imdbId)) {
      this.movies.push({
        id: imdbId,
        owner: owner
      });
    } else {
      throw new errors[400]("Invalid movie");
    }
  }

  async removeMovie(imdbId) {
    if (this.state == roomState.LOBBY) {
      this.movies = this.movies.filter(movie => movie.id != imdbId);
    }
  }
}