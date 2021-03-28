const mongodb = require('mongodb');
const mongoose = require('mongoose');
var exports = module.exports;

// Conenction settings
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDatabase = process.env.MONGO_DATABASE;

const uri = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}`;

exports.uri = uri;
exports.database = mongoDatabase;
exports.connect = async () => {
    var client = await mongodb.connect(uri);
    return client.db(mongoDatabase);
};
exports.mongoose = async () =>{
    var connection = await mongoose.createConnection(uri);
    connection.useDb(mongoDatabase);
    return connection;
}
