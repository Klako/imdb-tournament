const mongodb = require('./mongodb.js');
const { Schema } = require('mongoose');
const errors = require('http-errors');
const { ObjectId } = require('bson');

exports = module.exports;

/** @type {Schema<import('./profile').IProfile>} */
const profileSchema = new Schema({
  name: { type: String, default: "Jeff" }
});

/** @this {import('./profile').IProfile} */
profileSchema.methods.setName = function (newName) {
  this.name = newName;
}

exports.connect = async () => {
  var db = await mongodb.mongoose();
  return db.model('Profile', profileSchema);
}

exports.create = async () => {
  var profiles = await this.connect();
  return await profiles.create({});
}

exports.get = async (id) => {
  var profiles = await this.connect();
  return await profiles.findById(id).exec();
}