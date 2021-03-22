const mongodb = require('./mongodb.js');
const errors = require('http-errors');

exports = module.exports;

exports.getProfile = async (sessionId) => {
  var db = await mongodb.connect();
  var profiles = db.collection('profiles');
  if (!profiles.findOne({ sessionId: sessionId })) {
    var profile = Profile.new(sessionId);
    profile.save();
    return profile;
  } 
  return await Profile.load(sessionId);
}

class Profile {
  static new(sessionId) {
    var profile = new Profile();
    profile.sessionId = sessionId;
    profile.name = "Jeff";
    return profile;
  }

  constructor() {
  }

  /**
   * Creates profile object from database
   * @param {string} sessionId 
   */
  static async load(sessionId) {
    const db = await mongodb.connect();
    var profiles = db.collection('profiles');
    const profileData = await profiles.findOne({ sessionId: sessionId })
    var profile = new Profile();
    Object.assign(profile, profileData);
    return profile;
  }

  /**
   * Saves profile object to database
   */
  async save() {
    const db = await mongodb.connect();
    var profiles = db.collection('profiles');
    if (await profiles.count({ sessionId: this.sessionId })) {
      await profiles.replaceOne({ sessionId: this.sessionId }, this);
    } else {
      await profiles.insertOne(this);
    }
  }

  setName(newName){
    this.name = newName;
  }
}