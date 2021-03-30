const { default: Imdb, Movie } = require('vimdb');
const errors = require('http-errors');

var exports = module.exports;

var movieCache = [];

exports.getMovie = async (id) => {
  if (typeof movieCache[id] !== 'undefined') {
    return movieCache[id];
  }
  var imdb = new Imdb();
  var data = await imdb.getShow(id);
  if (!(data instanceof Movie)) {
    throw new errors[400]("Imdb id must refer to a movie");
  }
  var movie = {
    id: data.identifier,
    title: `${data.name} (${data.year || 'unknown'})`,
    image: data.image
  }
  movieCache[id] = movie;
  return movie;
}

exports.search = async (query) => {
  var imdb = new Imdb();
  var results = await imdb.search(query, 'tt');
  var movies = [];
  var batchStart = 0;
  for (var batchEnd = 0; batchEnd < results.length;) {
    batchEnd += 10 - movies.length;
    var batch = results.slice(batchStart, batchEnd);
    await Promise.all(batch.map(async (item) => {
      try {
        var movie = await this.getMovie(item.identifier);
        movies.push(movie);
      } catch { }
    }));
    if (movies.length == 10) {
      break;
    }
    batchStart = batchEnd;
  }
  return movies;
}