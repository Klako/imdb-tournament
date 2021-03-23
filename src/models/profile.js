const mongodb = require('./mongodb.js');
const errors = require('http-errors');
const { ObjectId } = require('bson');

exports = module.exports;

exports.create = async () => {
  return await Profile.new();
}

exports.get = async (id) => {
  return await Profile.load(id);
}

async function collection() {
  return (await mongodb.connect()).collection('profiles');
}

class Profile {
  static async new() {
    var newProfile = {
      name: "Jeff"
    };
    var profiles = await collection();
    var result = await profiles.insertOne(newProfile);
    await profiles.updateOne({ _id: result.insertedId }, {
      $set: { id: result.insertedId.toString() }
    });
    return await this.load(result.insertedId);
  }

  constructor() {
  }

  /**
   * Creates profile object from database
   * @param {string} id
   */
  static async load(id) {
    var profiles = await collection();
    var profileData = await profiles.findOne({ _id: new ObjectId(id) });
    var profile = new Profile();
    Object.assign(profile, profileData);
    return profile;
  }

  async setName(newName) {
    var profiles = await collection();
    profiles.updateOne({ _id: this._id }, {
      $set: { name: newName }
    });
    this.name = newName;
  }
}