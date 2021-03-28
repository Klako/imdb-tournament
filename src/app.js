var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongodb = require('./models/mongodb.js');
var session = require('express-session');
var MongoDbStore = require('connect-mongodb-session')(session);
var profile = require('./models/profile');

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

// session
const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("Session secret environment variable is not set");
}
app.use(session({
  store: new MongoDbStore({
    uri: mongodb.uri,
    databaseName: mongodb.database,
    collection: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(async (req, res, next) => {
  var profiles = await profile.connect();
  if (req.session.profileId) {
    req.profile = await profiles.findById(req.session.profileId).exec();
  } else {
    req.profile = await profiles.create({});
    await req.profile.save();
    req.session.profileId = req.profile.id;
  }
  next();
});

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
