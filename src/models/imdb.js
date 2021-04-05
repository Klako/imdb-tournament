const axios = require('axios').default;
const errors = require('http-errors');

var exports = module.exports;

async function omdb(params) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new Error("OMDB_API_KEY environment variable is not defined");
  }
  params.apikey = apiKey;
  var result = await axios.get('https://www.omdbapi.com/', {
    params: params
  });
  return result.data;
}

exports.getMovie = async (id) => {
  var result = await omdb({ i: id, type: 'movie' });
  if (result.Response === 'False'){
    throw new errors[400]("Could not find movie");
  }
  return {
    id: result.imdbId,
    title: `${result.Title} (${result.Year || 'unknown'})`,
    image: result.Poster
  }
}

exports.search = async (query) => {
  var results = await omdb({ s: query, type: 'movie' });
  if (results.Response === 'False') {
    return [];
  }
  return results.Search.map(result => ({
    id: result.imdbID,
    title: `${result.Title} (${result.Year || 'unknown'})`,
    image: result.Poster
  }));
}