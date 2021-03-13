var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var SqliteStore = require('connect-sqlite3')(session);
var MongoDbStore = require('connect-mongodb-session')(session);
var mongodb = require('mongodb');

var mainRouter = require('./routes/router');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// database setup
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDatabase = process.env.MONGO_DATABASE;
app.set('mongo', {
  uri: `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}`,
  database: mongoDatabase,
  connect: () => {
    return mongodb.connect(this.uri);
  }
});

// session
app.use(session({
  store: new MongoDbStore({
    uri: app.get('mongo').uri,
    databaseName: app.get('mongo').database,
    collection: 'sessions'
  }),
  secret: 'super secret secret',
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use('/', mainRouter);
app.use('/api', apiRouter);
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
